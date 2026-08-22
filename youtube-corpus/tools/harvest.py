#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, os, time, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

API='https://www.googleapis.com/youtube/v3'
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'; CONFIGS=ROOT/'configs'; CHUNK_SIZE=250

def now_iso(): return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def load_json(path, default=None):
    try: return json.loads(Path(path).read_text(encoding='utf-8'))
    except FileNotFoundError: return default

def save_json(path,obj):
    path=Path(path); path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

def api_get(endpoint,params,key):
    p=dict(params); p['key']=key
    url=f"{API}/{endpoint}?{urllib.parse.urlencode(p)}"
    req=urllib.request.Request(url,headers={'User-Agent':'MZ-YouTube-Corpus/1.0'})
    with urllib.request.urlopen(req,timeout=45) as r: return json.loads(r.read().decode())

def parse_date(s): return datetime.strptime(s,'%Y-%m-%d').replace(tzinfo=timezone.utc)
def boundary(dt): return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
def add_month(dt):
    return dt.replace(year=dt.year+(1 if dt.month==12 else 0),month=1 if dt.month==12 else dt.month+1,day=1)

def date_windows(start,end,unit):
    cur=parse_date(start); end_dt=parse_date(end)+timedelta(days=1); out=[]
    while cur<end_dt:
        if unit=='month': nxt=add_month(cur.replace(day=1))
        elif unit=='year': nxt=cur.replace(year=cur.year+1,month=1,day=1)
        elif unit=='week': nxt=cur+timedelta(days=7)
        elif unit=='day': nxt=cur+timedelta(days=1)
        else: raise ValueError(unit)
        nxt=min(nxt,end_dt); out.append((cur,nxt)); cur=nxt
    return out

def build_jobs(config):
    s=config['search']; queries=s['queries']; jobs=[]; slicing=s.get('date_slicing')
    if slicing:
        end=slicing.get('end') or datetime.now(timezone.utc).strftime('%Y-%m-%d')
        windows=date_windows(slicing['start'],end,slicing.get('unit','month'))
        for q in queries:
            for a,b in windows:
                jobs.append({'query':q,'publishedAfter':boundary(a),'publishedBefore':boundary(b),'job_key':f'{q}|{boundary(a)}|{boundary(b)}'})
    else:
        jobs=[{'query':q,'job_key':q} for q in queries]
    return jobs

def existing_records(collection_dir,manifest):
    records={}
    for chunk_name in manifest.get('chunks',[]):
        for rec in load_json(collection_dir/chunk_name,[]) or []: records[rec['video_id']]=rec
    return records

def write_chunks(collection_dir,records,manifest):
    ordered=sorted(records.values(),key=lambda r:(r.get('captured_at') or '',r['video_id']))
    old=set(manifest.get('chunks',[])); new=[]
    for i in range(0,len(ordered),CHUNK_SIZE):
        name=f'videos-{i//CHUNK_SIZE:04d}.json'; new.append(name); save_json(collection_dir/name,ordered[i:i+CHUNK_SIZE])
    for stale in old-set(new):
        try:(collection_dir/stale).unlink()
        except FileNotFoundError:pass
    manifest['chunks']=new; return ordered

def details(ids,key):
    out={}; ids=list(ids)
    for i in range(0,len(ids),50):
        data=api_get('videos',{'part':'snippet,contentDetails,statistics,status','id':','.join(ids[i:i+50]),'maxResults':50},key)
        for item in data.get('items',[]): out[item['id']]=item
    return out

def text(item):
    s=item.get('snippet',{}); return ' '.join([s.get('title',''),s.get('description',''),' '.join(s.get('tags',[]) or []),s.get('channelTitle','')]).lower()

def passes(item,config):
    f=config.get('filter',{}); stats=item.get('statistics',{})
    try: views=int(stats.get('viewCount',0))
    except: views=None
    mx=f.get('view_count_max_exclusive'); mn=f.get('view_count_min_inclusive')
    if mx is not None and (views is None or views>=int(mx)): return False
    if mn is not None and (views is None or views<int(mn)): return False
    t=text(item)
    if any(x.lower() in t for x in f.get('reject_terms',[])): return False
    return True

def verification(item,config):
    v=config.get('verification',{}); t=text(item)
    if any(x.lower() in t for x in v.get('strong_metadata_terms',[])): return 'likely'
    return 'uncertain'

def make_record(item,job,config,prior=None):
    sn=item.get('snippet',{}); stats=item.get('statistics',{}); status=item.get('status',{}); captured=now_iso()
    try: views=int(stats['viewCount']) if 'viewCount' in stats else None
    except: views=None
    rec=dict(prior or {}); first=rec.get('captured_at',captured); queries=set(rec.get('discovery_queries',[])); queries.add(job['query'])
    paths=rec.get('discovery_paths',[]); sig=(job['query'],job.get('publishedAfter'),job.get('publishedBefore'))
    existing={(p.get('query'),p.get('published_after'),p.get('published_before')) for p in paths}
    if sig not in existing: paths.append({'query':job['query'],'published_after':job.get('publishedAfter'),'published_before':job.get('publishedBefore'),'found_at':captured})
    thumbs=sn.get('thumbnails',{}); thumb=None
    for k in ('maxres','standard','high','medium','default'):
        if k in thumbs: thumb=thumbs[k].get('url'); break
    rec.update({'video_id':item['id'],'url':f"https://www.youtube.com/watch?v={item['id']}",'title':sn.get('title'),'channel_id':sn.get('channelId'),'channel_title':sn.get('channelTitle'),'published_at':sn.get('publishedAt'),'captured_at':first,'last_seen_at':captured,'view_count_at_capture':rec.get('view_count_at_capture',views),'view_count_last_seen':views,'duration':item.get('contentDetails',{}).get('duration'),'thumbnail':thumb,'verification':rec.get('verification') if rec.get('verification')=='verified' else verification(item,config),'availability':'public' if status.get('privacyStatus')=='public' else status.get('privacyStatus','unknown'),'source_event_id':rec.get('source_event_id'),'duplicate_cluster_id':rec.get('duplicate_cluster_id'),'discovery_queries':sorted(queries),'discovery_paths':paths,'collection_ids':sorted(set(rec.get('collection_ids',[])+[config['code']])),'notes':rec.get('notes')})
    return rec

def update_registry(slug,manifest):
    path=DATA/'collections.json'; reg=load_json(path,{}) or {}; cols=reg.get('collections',[]) if isinstance(reg,dict) else reg
    for c in cols:
        if c.get('slug')==slug:
            for k in ('video_count','verified_count','uncertain_count','last_capture','status'): c[k]=manifest.get(k)
    if isinstance(reg,dict): reg['collections']=cols; save_json(path,reg)
    else: save_json(path,cols)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('collection'); ap.add_argument('--search-budget',type=int,default=int(os.getenv('SEARCH_BUDGET','70'))); ap.add_argument('--sleep',type=float,default=.05); ap.add_argument('--reset-sweep',action='store_true'); args=ap.parse_args()
    key=os.getenv('YOUTUBE_API_KEY')
    if not key: raise SystemExit('Missing YOUTUBE_API_KEY')
    config=load_json(CONFIGS/f'{args.collection}.json')
    if not config: raise SystemExit(f'No config for {args.collection}')
    cdir=DATA/config['slug']; mpath=cdir/'manifest.json'; manifest=load_json(mpath,{}) or {}; records=existing_records(cdir,manifest); spath=cdir/'harvest-state.json'; state=load_json(spath,{}) or {}; jobs=build_jobs(config)
    if args.reset_sweep or state.get('config_version')!=config.get('version'):
        state={'config_version':config.get('version'),'job_index':0,'page_token':None,'page_count':0,'sweep':int(state.get('sweep',0))+1,'search_calls_total':int(state.get('search_calls_total',0)),'new_ids_this_sweep':0,'started_at':now_iso()}
    calls=new_run=cands=0
    while calls<args.search_budget and state['job_index']<len(jobs):
        job=jobs[state['job_index']]; params={'part':'snippet','type':'video','maxResults':50,'q':job['query'],'order':config.get('search',{}).get('order','relevance'),'safeSearch':config.get('search',{}).get('safe_search','none')}
        if job.get('publishedAfter'): params['publishedAfter']=job['publishedAfter']
        if job.get('publishedBefore'): params['publishedBefore']=job['publishedBefore']
        if state.get('page_token'): params['pageToken']=state['page_token']
        result=api_get('search',params,key); calls+=1; state['search_calls_total']=int(state.get('search_calls_total',0))+1
        ids=[x.get('id',{}).get('videoId') for x in result.get('items',[]) if x.get('id',{}).get('videoId')]; cands+=len(ids); det=details(ids,key) if ids else {}
        for vid in ids:
            item=det.get(vid)
            if not item or not passes(item,config): continue
            prior=records.get(vid); records[vid]=make_record(item,job,config,prior)
            if prior is None: new_run+=1; state['new_ids_this_sweep']=int(state.get('new_ids_this_sweep',0))+1
        next_token=result.get('nextPageToken'); page_count=int(state.get('page_count',0))+1; max_pages=int(config.get('search',{}).get('max_pages_per_job',10))
        if next_token and page_count<max_pages and calls<args.search_budget: state['page_token']=next_token; state['page_count']=page_count
        else: state['job_index']+=1; state['page_token']=None; state['page_count']=0
        state['last_run_at']=now_iso(); save_json(spath,state); time.sleep(args.sleep)
    complete=state['job_index']>=len(jobs)
    if complete: state['completed_at']=now_iso(); state['last_sweep_new_ids']=state.get('new_ids_this_sweep',0); state['last_sweep_jobs']=len(jobs)
    ordered=write_chunks(cdir,records,manifest); counts={}
    for r in ordered: counts[r.get('verification','uncertain')]=counts.get(r.get('verification','uncertain'),0)+1
    manifest.update({'code':config['code'],'slug':config['slug'],'title':config['title'],'description':config['description'],'status':'SWEEP COMPLETE' if complete else 'HARVEST ACTIVE','video_count':len(ordered),'verified_count':counts.get('verified',0),'likely_count':counts.get('likely',0),'uncertain_count':counts.get('uncertain',0),'last_capture':now_iso() if calls else manifest.get('last_capture'),'record_rule':'same YouTube ID merges; separate uploads remain separate','capture_condition':config.get('capture_condition'),'retrieval':{'config_version':config.get('version'),'jobs_total':len(jobs),'jobs_completed':min(state.get('job_index',0),len(jobs)),'sweep':state.get('sweep',1),'search_calls_total':state.get('search_calls_total',0),'new_ids_this_sweep':state.get('new_ids_this_sweep',0),'last_sweep_new_ids':state.get('last_sweep_new_ids'),'sweep_complete':complete,'method_note':'High-recall query/date partitioning; completeness is measured by repeated-sweep yield, not asserted absolutely.'}})
    save_json(mpath,manifest); save_json(spath,state); update_registry(config['slug'],manifest)
    print(json.dumps({'collection':config['slug'],'search_calls':calls,'candidates_examined':cands,'new_video_ids':new_run,'records_total':len(ordered),'jobs_completed':state.get('job_index',0),'jobs_total':len(jobs),'sweep_complete':complete},indent=2))
if __name__=='__main__': main()
