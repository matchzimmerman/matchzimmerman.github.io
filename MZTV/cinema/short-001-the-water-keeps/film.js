/* MZ CINEMA 001 — THE WATER KEEPS. Film controller; the MZ WORLD broadcasts are not modified. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const qs=new URLSearchParams(location.search);
const FINAL=900;
const rate=Math.max(.2,Math.min(16,Number(qs.get('rate'))||1));
const quality=Math.max(320,Math.min(960,Number(qs.get('lines'))||(innerWidth<800?420:640)));
const utc0=Date.now();
const dates=String(utc0).slice(-7);
const EDKEY='mz-cinema-water-keeps-edition-v1';
let edition=Number(qs.get('edition')) || Number(localStorage.getItem(EDKEY)) || Math.floor(Math.random()*899999)+100000;
if(!qs.has('edition'))localStorage.setItem(EDKEY,String(edition));
let time=0,playing=false,ended=false,soundOn=true,lastWall=performance.now(),lastAct=-1,seekDragging=false;
let nextStart=false,score=null,lastSync=0,showedWarning=false,warrenDone=false,fullscreen=false;
const epsilon=.00001;
const ACTS=[
 {start:0,end:210,name:'THE FIELD',roman:'I',world:'HEADLAND',slug:'bit-field-031-headland',key:'D Dorian',root:50,meter:[5,4],bpm:58,short:'Departure',texture:'open air and a three-note call',ink:'#b87454'},
 {start:210,end:375,name:'THE CURRENT',roman:'II',world:'SRUTHÁN',slug:'bit-field-033-sruthan',key:'A Mixolydian',root:45,meter:[7,8],bpm:82,short:'Fragmentation',texture:'the phrase divides into moving water',ink:'#477b76'},
 {start:375,end:680,name:'THE WATER KEEPS',roman:'III',world:'LOCH RAVEN',slug:'bit-field-034-loch-raven',key:'D Phrygian',root:50,meter:[4,4],bpm:56,short:'Memory',texture:'flow, the keeper, a temporary absence',ink:'#839797'},
 {start:680,end:780,name:'AFTERIMAGE',roman:'IV',world:'SRUTHÁN',slug:'bit-field-033-sruthan',key:'F Lydian',root:53,meter:[3,4],bpm:67,short:'Emergence',texture:'an incomplete return through the stream',ink:'#8f9d76'},
 {start:780,end:900,name:'RETURN',roman:'V',world:'HEADLAND',slug:'bit-field-031-headland',key:'D Dorian',root:50,meter:[5,4],bpm:52,short:'Resolution',texture:'the first motif carries every place home',ink:'#c3b58e'}
];
const CUES=[
 {at:0,type:'opening',title:'A distant interval'},
 {at:186,type:'anticipation',title:'A second current enters before the cut'},
 {at:210,type:'movement',title:'II · THE CURRENT'},
 {at:353,type:'anticipation',title:'Low machinery replaces the stream'},
 {at:375,type:'movement',title:'III · THE WATER KEEPS'},
 {at:520,type:'anticipation',title:'The orchestra thins'},
 {at:535,type:'uncanny',title:'WARREN BELOW',uncertain:true},
 {at:637,type:'release',title:'The apparition recedes'},
 {at:662,type:'anticipation',title:'The stream re-enters as an afterimage'},
 {at:680,type:'movement',title:'IV · AFTERIMAGE'},
 {at:762,type:'anticipation',title:'The first three notes return'},
 {at:780,type:'movement',title:'V · RETURN'},
 {at:869,type:'coda',title:'The field has changed'},
 {at:900,type:'end',title:'END OF PERFORMANCE'}
];
const fmt=s=>String(Math.floor(Math.max(0,s)/60)).padStart(2,'0')+':'+String(Math.floor(Math.max(0,s)%60)).padStart(2,'0');
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const getAct=t=>Math.min(ACTS.length-1,Math.max(0,ACTS.findIndex(a=>t<a.end)||0));
const fileSrc=(a,i)=>`../../sources/${a.slug}/?capture=1&info=0&seed=${edition+i*79}&lines=${quality}&audio=1`+(qs.get('live')==='0'?'&live=0':'');
const card=()=>{let a=ACTS[getAct(time)];$('chapterNumber').textContent=a.roman+' / '+a.world;$('chapterTitle').textContent=a.name;$('chapterDesc').textContent=a.short.toUpperCase();};
const slots=new Map();
function loadSlot(i){
 if(slots.has(i))return slots.get(i);
 const a=ACTS[i];if(!a)return null;
 const wrap=document.createElement('div');wrap.className='worldSlot';wrap.dataset.act=i;
 const frame=document.createElement('iframe');frame.title=a.world+' cinematic camera';frame.allow='autoplay; fullscreen';frame.loading='eager';
 const slot={i,a,wrap,frame,ready:false,failed:false,api:null,startAudio:false,loadAt:performance.now(),warned:false};
 wrap.append(frame);$('worlds').append(wrap);slots.set(i,slot);
 frame.addEventListener('load',()=>{try{
  const mz=frame.contentWindow.MZ;
  if(!mz||typeof mz.tick!=='function')throw Error('MZ capture interface not ready');
  slot.api=mz;slot.ready=true;slot.failed=false;
  mz.tick(1/60);
  if(playing&&soundOn){try{mz.audio?.start()}catch(e){}}
 }catch(e){slot.failed=true;console.warn('MZ CINEMA capture unavailable: '+a.world,e);}});
 frame.src=fileSrc(a,i);
 return slot;
}
function unloadSlot(i){
 const s=slots.get(i);if(!s)return;
 try{s.api?.audio?.ctx?.suspend()}catch(e){}
 s.wrap.remove();slots.delete(i);
}
function closeOldFrames(needed){for(const i of [...slots.keys()])if(!needed.has(i))unloadSlot(i)}
function frameVolume(s,alpha){
 if(!s.ready||!s.api)return;
 try{
  const aud=s.api.audio;if(!aud||!aud.out||!aud.ctx)return;
  const goal=playing&&soundOn?0.4*0.60*Math.sqrt(clamp(alpha)):0;
  const g=aud.out.gain;
  if(Math.abs(g.value-goal)>.008)g.setTargetAtTime(goal,aud.ctx.currentTime,.18);
 }catch(e){if(!s.warned){s.warned=true;console.warn('Audio fade',e)}}
}
function syncWorlds(dt){
 const idx=getAct(Math.min(time,FINAL-.00001)),a=ACTS[idx],needed=new Set([idx]);
 const phase=idx>0?time-a.start:Infinity;
 const approach=idx<ACTS.length-1?ACTS[idx+1].start-time:Infinity;
 let prev=-1,next=-1;
 if(idx>0&&phase<7){prev=idx-1;needed.add(prev)}
 if(idx<ACTS.length-1&&approach<9){next=idx+1;needed.add(next)}
 for(const i of needed)loadSlot(i);
 const mixIn=idx>0?ease((phase+7)/14):1;
 const mixNext=next>=0?ease((time-(ACTS[next].start-7))/14):0;
 for(const [i,s] of slots){
  let alpha=(i===idx?mixIn*(1-mixNext):i===prev?1-mixIn:i===next?mixNext:0);
  if(!s.ready)alpha=0;
  s.wrap.style.opacity=String(alpha);
  s.wrap.style.zIndex=String(i===idx?2:(i===next?3:1));
  if(s.ready&&s.api){
   if(playing){try{s.api.tick(Math.min(.25,Math.max(.001,dt)))}catch(e){console.warn('World tick '+s.a.world,e);s.ready=false;}}
   frameVolume(s,alpha);
  }
 }
 closeOldFrames(needed);
 if(idx!==lastAct){
  lastAct=idx;card();$('movementTag').textContent=a.roman;$('movementName').textContent=a.name;
  $('status').textContent=a.world+' · '+a.key.toUpperCase();
 }
 if(idx===2 && time>=535 && time<610 && !warrenDone){
  const loch=slots.get(2);
  if(loch?.ready){
   try{loch.api.force('warren');warrenDone=true;score?.signal('warren');}catch(e){console.warn('Warren cue',e)}
  }
 }
 if(playing&&soundOn&&performance.now()-lastSync>1200){
  lastSync=performance.now();for(const slot of slots.values())if(slot.ready)try{slot.api.audio?.start()}catch(e){}
 }
}
function updateTitles(){
 const i=getAct(Math.min(time,899.99)),a=ACTS[i],dt=time-a.start;
 const show=(i===0&&time<15)||(i>0&&dt<9);
 $('titles').classList.toggle('active',show);
 if(i===0){$('chapterNumber').textContent='MZ CINEMA · FILM 001';$('chapterTitle').textContent='THE WATER KEEPS';$('chapterDesc').textContent='A FILM THAT PERFORMS ITSELF'}
 else card();
}
function updateUI(){
 $('timecode').textContent=fmt(time);
 if(!seekDragging)$('seek').value=String(time);
 $('playIcon').textContent=playing?'Ⅱ':'▶';
 $('toggle').setAttribute('aria-label',playing?'Pause film':'Play film');
 $('status').textContent=ended?'FILM COMPLETE':ACTS[getAct(Math.min(time,899.99))].world+' · '+(playing?'LIVE PERFORMANCE':'PAUSED');
 $('soundToggle').textContent=soundOn?'◖))':'◖×';
 updateTitles();
}
function restart(){
 ended=false;warrenDone=false;time=0;lastAct=-1;for(const id of [...slots.keys()])unloadSlot(id);
 $('endcard').hidden=true;score?.reset();loadSlot(0);updateUI();
}
function play(){
 if(ended)restart();
 playing=true;lastWall=performance.now();$('launch').hidden=true;
 if(!score)score=new FilmScore(edition);
 score.start();for(const s of slots.values())try{s.api?.audio?.start()}catch(e){}
 updateUI();
}
function pause(){
 playing=false;score?.pause();for(const s of slots.values()){frameVolume(s,0);try{s.api?.audio?.ctx?.suspend()}catch(e){}}
 updateUI();
}
function seekTo(x){
 const wasPlaying=playing; time=clamp(Number(x)||0,0,FINAL);warrenDone=time>=610;
 if(time===FINAL){finish();return}
 ended=false;$('endcard').hidden=true;lastAct=-1;
 for(const id of [...slots.keys()])unloadSlot(id);
 if(score)score.seek(time);
 loadSlot(getAct(time));lastWall=performance.now();
 if(wasPlaying){playing=true;score?.start()}else playing=false;
 updateUI();
}
function finish(){
 time=FINAL;playing=false;ended=true;score?.pause();
 for(const id of [...slots.keys()]){frameVolume(slots.get(id),0);unloadSlot(id)}
 $('endcard').hidden=false;$('titles').classList.remove('active');updateUI();
 try{localStorage.setItem('mz-cinema-001-last-edition',String(edition))}catch(e){}
}
function download(name,body,type='application/json'){
 const blob=new Blob([body],{type});const u=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);
}
function cueSheet(){
 return {
  title:'MZ CINEMA 001 — THE WATER KEEPS',
  type:'procedural browser film / performance cue sheet',
  duration_seconds:900,
  edition,generated_at:new Date().toISOString(),
  audio_note:'Eight spatial program buses and two sub buses are generated in Web Audio, monitored in stereo in the browser. Full discrete 8.2 stems are NOT currently exported.',
  provenance:'The actual worlds remain autonomous, with place-weather feeds and artistic simulations; film-level events are directed and explicitly cued.',
  worlds:ACTS.map(a=>({movement:a.roman,name:a.name,world:a.world,at_seconds:a.start,until_seconds:a.end,root_midi:a.root,key:a.key,bpm:a.bpm,meter:a.meter,source:a.slug,texture:a.texture})),
  cues:CUES,
  recurrence:[0,3,7],
  note_events:score?.recorded||[],
  speaker_order:['FL','FC','FR','SR','RR','RL','SL','RC','SUB_A','SUB_B']
 };
}
function createSections(){
 $('sections').innerHTML=ACTS.slice(1).map(a=>'<i style="left:'+((a.start/FINAL)*100).toFixed(4)+'%"></i>').join('');
 $('actList').innerHTML=ACTS.map((a,i)=>'<div class="actrow"><span class="roman">'+a.roman+'</span><button data-jump="'+a.start+'"><strong>'+a.name+'</strong><br><small>'+a.world+' · '+a.key+'</small></button><time>'+fmt(a.start)+'</time></div>').join('');
 $('actList').addEventListener('click',e=>{const b=e.target.closest('[data-jump]');if(b){seekTo(Number(b.dataset.jump));$('notes').hidden=true;$('notesToggle').setAttribute('aria-expanded','false')}});
}
function wiring(){
 $('start').addEventListener('click',play);
 $('toggle').addEventListener('click',()=>playing?pause():play());
 $('replay').addEventListener('click',()=>{restart();play()});
 $('soundToggle').addEventListener('click',()=>{
  soundOn=!soundOn;if(!soundOn)score?.mute(true);else{score?.mute(false);if(playing)for(const s of slots.values())try{s.api?.audio?.start()}catch(e){}}updateUI();
 });
 const toggleNotes=show=>{$('notes').hidden=!show;$('notesToggle').setAttribute('aria-expanded',String(show))};
 $('notesToggle').addEventListener('click',()=>toggleNotes($('notes').hidden));
 $('closeNotes').addEventListener('click',()=>toggleNotes(false));
 $('fullscreen').addEventListener('click',()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.()});
 $('cueExport').addEventListener('click',()=>download('MZ-CINEMA-001-edition-'+edition+'-cues.json',JSON.stringify(cueSheet(),null,2)));
 $('resetEdition').addEventListener('click',()=>{edition=Math.floor(Math.random()*899999)+100000;localStorage.setItem(EDKEY,String(edition));pause();restart();toggleNotes(false);$('launch').hidden=false});
 $('seek').addEventListener('pointerdown',()=>seekDragging=true);
 $('seek').addEventListener('input',e=>{seekDragging=true;$('timecode').textContent=fmt(Number(e.target.value))});
 $('seek').addEventListener('change',e=>{seekDragging=false;seekTo(e.target.value)});
 document.addEventListener('pointerup',()=>{if(seekDragging){seekDragging=false;seekTo($('seek').value)}});
 document.addEventListener('keydown',e=>{
  if(e.target?.tagName==='INPUT')return;
  if(e.code==='Space'){e.preventDefault();playing?pause():play()}
  if(e.key==='m'||e.key==='M')$('soundToggle').click();
  if(e.key==='i'||e.key==='I')$('notesToggle').click();
  if(e.key==='ArrowRight')seekTo(time+10);
  if(e.key==='ArrowLeft')seekTo(time-10);
 });
}
let uiLast=0;
function loop(now){
 const delta=Math.min(.07,Math.max(0,(now-lastWall)/1000));lastWall=now;
 if(playing&&!ended){
  const prev=time;time=Math.min(FINAL,time+delta*rate);
  if(time>=FINAL){finish()}
  else{
   syncWorlds(delta);
   score?.update(time,prev);
   if(now-uiLast>125){updateUI();uiLast=now}
  }
 }
 requestAnimationFrame(loop);
}
function boot(){createSections();wiring();card();loadSlot(0);updateUI();requestAnimationFrame(loop)}
