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
 try{score?.detachWorld(i)}catch(e){}
 try{s.api?.audio?.ctx?.close?.()}catch(e){}
 s.wrap.remove();slots.delete(i);
}
function closeOldFrames(needed){for(const i of [...slots.keys()])if(!needed.has(i))unloadSlot(i)}
function frameVolume(s,alpha){
 if(!s.ready||!s.api)return;
 try{
  const aud=s.api.audio;if(!aud||!aud.out||!aud.ctx)return;
  if(score?.ctx){
    score.updateWorld(s,alpha);
    const g=aud.out.gain;if(Math.abs(g.value-.4)>.04)g.setTargetAtTime(.4,aud.ctx.currentTime,.2);
    return;
  }
  const goal=playing&&soundOn?0.4*.60*Math.sqrt(clamp(alpha)):0;
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
/* MZ SONIC — original 10-bus procedural score; world audio is captured by same-origin MediaStreams.
   Browser output is downmixed for stereo monitoring, not represented as a delivered 8.2 master. */
const SPEAKERS=[
 {name:'FL',az:320,pan:-.85},{name:'FC',az:0,pan:0},{name:'FR',az:40,pan:.85},
 {name:'SR',az:100,pan:1},{name:'RR',az:145,pan:.6},{name:'RL',az:215,pan:-.6},
 {name:'SL',az:260,pan:-1},{name:'RC',az:180,pan:0}
];
class FilmScore{
 constructor(seed){
  this.seed=seed|0;this.rng=this.seed||173;this.ctx=null;this.muted=false;this.recorded=[];
  this.tickIndex=-1;this.activeAct=-1;this.worldLinks=new Map();this.lastAmbient=-1;
  this.warrenAt=-1;this.master=null;this.eventQueue=[];
 }
 rand(){this.rng=(Math.imul(1664525,this.rng)+1013904223)|0;return (this.rng>>>0)/4294967296}
 ensure(){
  if(this.ctx)return;
  const c=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'playback'});this.ctx=c;
  // Ten physically distinct program buses. The last two are independently bass filtered.
  this.buses=Array.from({length:10},()=>{let g=c.createGain();g.gain.value=1;return g});
  this.discrete=c.createChannelMerger(10);
  this.monitor=c.createGain();this.monitor.gain.value=.45;
  this.highpass=c.createBiquadFilter();this.highpass.type='highpass';this.highpass.frequency.value=26;
  this.rolloff=c.createBiquadFilter();this.rolloff.type='lowpass';this.rolloff.frequency.value=6600;
  const glue=c.createDynamicsCompressor();glue.threshold.value=-22;glue.ratio.value=2.4;glue.attack.value=.015;glue.release.value=.32;
  this.monitor.connect(this.highpass).connect(this.rolloff).connect(glue).connect(c.destination);
  for(let i=0;i<10;i++){
   const bus=this.buses[i];
   bus.connect(this.discrete,0,i);
   const fold=c.createStereoPanner();fold.pan.value=i<8?SPEAKERS[i].pan:(i===8?-.12:.12);
   const atten=c.createGain();atten.gain.value=i<8?.47:.22;
   bus.connect(atten).connect(fold).connect(this.monitor);
  }
  this.makeAir();this.initBass();
 }
 makeAir(){
  const c=this.ctx,buffer=c.createBuffer(1,c.sampleRate*4,c.sampleRate),ch=buffer.getChannelData(0);
  for(let i=0;i<ch.length;i++)ch[i]=this.rand()*2-1;
  this.amb=[];
  for(const [hz,gain,az] of [[280,.013,275],[480,.007,45]]){
   const src=c.createBufferSource();src.buffer=buffer;src.loop=true;
   const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=hz;
   const amp=c.createGain();amp.gain.value=0;src.connect(filter).connect(amp);
   this.route(amp,az,.5);
   src.start();this.amb.push({src,filter,amp});
  }
 }
 initBass(){
  const c=this.ctx;this.subFilters=[];
  for(let i=8;i<10;i++){let b=c.createBiquadFilter();b.type='lowpass';b.frequency.value=105;b.Q.value=.75;this.subFilters.push(b);b.connect(this.buses[i]);}
 }
 /** Angle follows a continuous ring, while the two SUB channels remain explicitly separate. */
 route(node,az=0,gain=1,sub=0){
  const c=this.ctx,wrap=x=>(x%360+360)%360;
  const near=SPEAKERS.map((p,i)=>({i,d:Math.abs(((wrap(az)-p.az+540)%360)-180)})).sort((a,b)=>a.d-b.d).slice(0,2);
  const a=near[0],b=near[1],tot=Math.max(.01,a.d+b.d);
  const gA=c.createGain(),gB=c.createGain();
  gA.gain.value=gain*Math.sqrt(b.d/tot);gB.gain.value=gain*Math.sqrt(a.d/tot);
  node.connect(gA).connect(this.buses[a.i]);node.connect(gB).connect(this.buses[b.i]);
  if(sub>0){for(let i=0;i<2;i++){const sg=c.createGain();sg.gain.value=sub*(i===0?.56:.44);node.connect(sg).connect(this.subFilters[i])}}
 }
 start(){
  this.ensure();this.ctx.resume().catch(()=>{});
  this.monitor.gain.setTargetAtTime(this.muted?0:.45,this.ctx.currentTime,.12);
  for(const link of this.worldLinks.values())try{link.aud.ctx.resume()}catch(e){}
 }
 pause(){if(this.ctx){this.monitor.gain.setTargetAtTime(0,this.ctx.currentTime,.04);this.ctx.suspend().catch(()=>{})}}
 mute(flag){this.muted=!!flag;if(this.ctx)this.monitor.gain.setTargetAtTime(this.muted?0:.45,this.ctx.currentTime,.1)}
 reset(){this.recorded=[];this.activeAct=-1;this.tickIndex=-1;this.warrenAt=-1;this.rng=this.seed||173;}
 seek(s){this.activeAct=-1;this.tickIndex=-1;this.recorded=[];this.warrenAt=s>=535?535:-1;}
 /** The original MZ WORLD audio stays untouched inside its engine but flows through the film's shared spatial mixer. */
 attachWorld(slot){
  if(!this.ctx||!slot?.ready||!slot.api)return;
  const aud=slot.api.audio;if(!aud?.ctx||!aud?.out)return;
  const old=this.worldLinks.get(slot.i);
  if(old&&old.node===aud.out)return;
  if(old)this.detachWorld(slot.i);
  try{
   const dest=aud.ctx.createMediaStreamDestination();
   // Remove ONLY the old direct speaker connection; retain HEADLAND's original analyser.
   aud.out.disconnect(aud.ctx.destination);
   aud.out.connect(dest);
   const src=this.ctx.createMediaStreamSource(dest.stream);
   const gain=this.ctx.createGain();gain.gain.value=0;src.connect(gain);
   const az=slot.a.world==='LOCH RAVEN'?0:slot.a.world==='SRUTHÁN'?105:290;
   this.route(gain,az,.36,.015);
   this.worldLinks.set(slot.i,{node:aud.out,aud,dest,src,gain,slot,az});
  }catch(e){console.warn('[MZ CINEMA] spatial capture fallback:',e)}
 }
 detachWorld(i){
  const link=this.worldLinks.get(i);if(!link)return;
  try{link.src.disconnect();link.gain.disconnect();link.node.disconnect(link.dest)}catch(e){}
  this.worldLinks.delete(i);
 }
 updateWorld(slot,alpha){
  if(!this.ctx||!slot.ready)return;
  this.attachWorld(slot);
  const link=this.worldLinks.get(slot.i);if(link)link.gain.gain.setTargetAtTime(soundOn&&playing?Math.sqrt(clamp(alpha)):0,this.ctx.currentTime,.18);
 }
 /** Synthesize from the three-note memory. Every movement receives a different transformation. */
 note(midi,at,duration=.6,level=.11,az=0,type='tone',bass=false,position=null){
  if(!this.ctx)return;
  const c=this.ctx,t=c.currentTime+.01,freq=440*Math.pow(2,(midi-69)/12);
  const o=c.createOscillator(),env=c.createGain(),filter=c.createBiquadFilter();
  o.type=type==='metal'?'triangle':type==='pad'?'sawtooth':'sine';
  o.frequency.setValueAtTime(freq,t);
  if(type==='metal')o.frequency.exponentialRampToValueAtTime(freq*.98,t+.10);
  filter.type='lowpass';filter.frequency.value=type==='pad'?430:type==='metal'?1100:740;filter.Q.value=.55;
  const volume=level*(this.muted?0:1);
  env.gain.setValueAtTime(.00001,t);
  env.gain.exponentialRampToValueAtTime(Math.max(.00002,volume),t+(type==='pad'?.35:.022));
  env.gain.setTargetAtTime(.00001,t+Math.max(.2,duration*.64),Math.max(.03,duration*.16));
  o.connect(filter).connect(env);
  this.route(env,az,1,bass?.34:0);
  o.start(t);o.stop(t+duration+.4);
  if(position!==null){
   this.recorded.push({at_seconds:Math.round(position*1000)/1000,midi,duration_seconds:+duration.toFixed(3),speaker_azimuth:Math.round(az),kind:type,velocity:Math.round(level*127*4),sub_send:bass});
   if(this.recorded.length>1300)this.recorded.shift();
  }
 }
 signal(name){
  if(!this.ctx)return;
  if(name==='warren'){
   this.warrenAt=535;
   // ♭II: the harmonic consequence of a memory, not sound-effect jump scare.
   this.note(51,this.ctx.currentTime,11,.10,175,'pad',true,535);
   this.note(58,this.ctx.currentTime,13,.045,260,'tone',false,535);
   this.note(63,this.ctx.currentTime,14,.034,0,'tone',false,535);
  }
 }
 scoreTick(t,act,n,unit){
  const beats=act.meter[0],bar=Math.floor(n/beats),beat=n%beats;
  const here=ACTS.indexOf(act);
  const tempo=unit;
  const az=(t*11+here*67)%360;
  const pitches=here===0?[0,3,7]:here===1?[0,2,7]:here===2?[0,1,7]:here===3?[0,6,7]:[0,3,7];
  const root=act.root,mode=here===2&&t>=535&&t<628?1:0;
  if(beat===0){
   const note=root+(mode?1:0)-12+(bar%4===3?7:0);
   this.note(note,t,Math.min(4.4,unit*beats*.88),here===2?.10:.09,az+160,'tone',true,t);
   if(bar%2===0)this.note(root+12+pitches[(bar>>1)%3],t,Math.min(5,unit*beats*1.6),.022,az-35,'pad',false,t);
  }
  if(beat===1||beat===Math.max(2,Math.floor(beats*.58))||here===1&&beat===4){
   let k=(bar*2+beat+here)%3;
   let pitch=root+12+pitches[k]+(here===4&&bar%4===3?12:0);
   this.note(pitch,t,here===1?.7:here===2?1.8:2,.031,az+(k-1)*60,here===1?'metal':'tone',false,t);
  }
  if(here===2 && beat===beats-1 && (bar%2===1)){
   this.note(root+7,t,.5,.022,az+145,'metal',false,t);
  }
  if((here===3||here===4)&&beat===beats-1&&bar%3===1){
   // Earlier voices recur as a restrained counterpoint.
   this.note(45+12+([0,2,7][bar%3]),t,1.2,.018,az+210,'tone',false,t);
  }
  // Acoustical foreshadowing: before a visual cut, we hear the next key.
  const next=ACTS[here+1];
  if(next&&t>act.end-22&&bar%2===0&&beat===0)
   this.note(next.root+12,t,Math.min(6,unit*beats*1.5),.014,az+180,'pad',false,t);
 }
 update(t,prev){
  if(!this.ctx||this.ctx.state!=='running'||this.muted)return;
  const idx=getAct(t),a=ACTS[idx];
  if(idx!==this.activeAct){this.activeAct=idx;this.tickIndex=-1}
  let beatSec=60/a.bpm*(a.meter[1]===8?.5:1);
  if(idx===2){
   const w=slots.get(2)?.api?.audio?.barSec;
   if(Number.isFinite(w)&&w>3&&w<7.5)beatSec=w/a.meter[0];
  }
  const n=Math.floor((t-a.start)/beatSec);
  if(n!==this.tickIndex && n>=0){
   this.tickIndex=n;
   this.scoreTick(t,a,n,beatSec);
  }
  if(t-prev>.1){/* nothing to catch up: score follows the visible edit, not missed wall time */}
  if(t-this.lastAmbient>.5){
   this.lastAmbient=t;
   const targets=[.009,.014,.008,.007,.004];
   this.amb.forEach((b,j)=>{
    b.amp.gain.setTargetAtTime(targets[idx]*(j===0?1:.65),this.ctx.currentTime,.5);
    b.filter.frequency.setTargetAtTime((idx===2?145:idx===1?470:280)*(j===0?1:1.6),this.ctx.currentTime,.9);
   });
  }
 }
}
boot();
})();
