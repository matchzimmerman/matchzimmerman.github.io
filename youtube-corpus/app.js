const state={collections:[],manifest:null,videos:[],loadedChunks:0};
const $=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat().format(Number(n||0));
const date=v=>v?new Date(v).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'—';

async function json(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`${r.status} ${path}`);return r.json()}

function clock(){const d=new Date();$('#footerClock').textContent=d.toISOString().replace('T',' / ').slice(0,21)+'Z'}
setInterval(clock,1000);clock();

function collectionCard(c){return `<a class="collection-card" href="?collection=${encodeURIComponent(c.slug)}">
  <div class="card-top"><span>${c.code}</span><span>${c.status.toUpperCase()}</span></div>
  <h3>${c.title}</h3><div class="card-count">${c.video_count==null?'—':fmt(c.video_count)}</div>
  <p>${c.description}</p>
  <div class="card-top"><span>${c.video_count==null?'HARVEST PENDING':'VIDEO RECORDS'}</span><span>OPEN →</span></div>
</a>`}

async function home(){
  $('#homeView').hidden=false;$('#collectionView').hidden=true;
  state.collections=await json('data/collections.json');
  $('#collectionGrid').innerHTML=state.collections.map(collectionCard).join('');
  const known=state.collections.reduce((a,c)=>a+(Number(c.video_count)||0),0);
  $('#collectionTotals').textContent=`${state.collections.length} COLLECTIONS / ${fmt(known)} LOGGED VIDEOS`;
}

function stat(value,label){return `<div class="stat"><b>${value}</b><span>${label}</span></div>`}

async function collection(slug){
  $('#homeView').hidden=true;$('#collectionView').hidden=false;
  const m=await json(`data/${slug}/manifest.json`);state.manifest=m;state.videos=[];state.loadedChunks=0;
  $('#collectionCode').textContent=`${m.code} / ${m.status}`;$('#collectionTitle').textContent=m.title;$('#collectionDescription').textContent=m.description;
  $('#collectionStats').innerHTML=[
    stat(m.video_count==null?'—':fmt(m.video_count),'VIDEO RECORDS'),
    stat(m.verified_count==null?'—':fmt(m.verified_count),'VERIFIED'),
    stat(m.uncertain_count==null?'—':fmt(m.uncertain_count),'UNCERTAIN'),
    stat(m.last_capture||'—','LAST CAPTURE')
  ].join('');
  if(!m.chunks?.length){showEmpty('COLLECTION INITIALIZED. RETRIEVAL HARVEST HAS NOT YET WRITTEN ITS FIRST VIDEO SHARD.');return}
  await loadNext();
}

async function loadNext(){
  const m=state.manifest;if(state.loadedChunks>=m.chunks.length)return;
  const file=m.chunks[state.loadedChunks++];const rows=await json(`data/${m.slug}/${file}`);state.videos.push(...rows);renderVideos();
  $('#loadMoreBtn').hidden=state.loadedChunks>=m.chunks.length;
}

function videoCard(v){
  const thumb=v.thumbnail||`https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`;
  const tags=[v.verification,v.source_event_id,v.duplicate_cluster_id].filter(Boolean).map(t=>`<span class="tag">${t}</span>`).join('');
  return `<article class="video-card">
    <div class="thumb"><img loading="lazy" src="${thumb}" alt=""><span class="view-badge">${v.view_count_at_capture==null?'?':fmt(v.view_count_at_capture)} VIEWS @ CAPTURE</span></div>
    <div class="video-body">
      <h3 class="video-title"><a href="${v.url||`https://www.youtube.com/watch?v=${v.video_id}`}" target="_blank" rel="noopener">${v.title||v.video_id}</a></h3>
      <div class="meta">CHANNEL / ${v.channel_title||'—'}<br>UPLOADED / ${date(v.published_at)}<br>CAPTURED / ${date(v.captured_at)}<br>ID / ${v.video_id}</div>
      <div class="tags">${tags}</div>
    </div>
  </article>`
}

function showEmpty(msg){$('#emptyState').hidden=false;$('#emptyState').textContent=msg;$('#videoGrid').innerHTML='';$('#loadMoreBtn').hidden=true}
function renderVideos(){
  const q=$('#searchInput').value.trim().toLowerCase();const sort=$('#sortSelect').value;
  let rows=state.videos.filter(v=>!q||JSON.stringify(v).toLowerCase().includes(q));
  const n=x=>Number(x??0),t=x=>x?new Date(x).getTime():0;
  rows.sort((a,b)=>({
    captured_desc:()=>t(b.captured_at)-t(a.captured_at),published_asc:()=>t(a.published_at)-t(b.published_at),published_desc:()=>t(b.published_at)-t(a.published_at),views_asc:()=>n(a.view_count_at_capture)-n(b.view_count_at_capture),views_desc:()=>n(b.view_count_at_capture)-n(a.view_count_at_capture)
  }[sort]||(()=>0))());
  $('#emptyState').hidden=rows.length>0;$('#videoGrid').innerHTML=rows.map(videoCard).join('');
  if(!rows.length)$('#emptyState').textContent=state.videos.length?'NO LOGGED VIDEOS MATCH THIS FILTER.':'NO VIDEO RECORDS IN THIS SHARD.';
}

$('#searchInput').addEventListener('input',renderVideos);$('#sortSelect').addEventListener('change',renderVideos);$('#loadMoreBtn').addEventListener('click',loadNext);$('#backBtn').addEventListener('click',()=>location.href='./');

(async()=>{try{const slug=new URLSearchParams(location.search).get('collection');slug?await collection(slug):await home()}catch(e){console.error(e);showEmpty(`INDEX ERROR: ${e.message}`)}})();
