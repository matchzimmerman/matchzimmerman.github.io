/* MZ WORLD 034 · LOCH RAVEN AUDIO LAB — independent of the broadcast source.
   Modelled hydraulic inputs, deterministic sixteenth-note score, Web Audio, Web MIDI,
   SMF type 1 and stereo 16-bit PCM WAV. No external libraries or assets. */
'use strict';
(() => {
const $ = id => document.getElementById(id);
const SLUG = 'mz-loch-raven-audio-lab-v1';
const HOME = {flow:12, keeper:2, wind:4, rain:.2, humidity:74, centre:50, seed:34, warren:false, rupture:false,
  mix:{kick:.7,bass:.7,pad:.42,drone:.32,water:.50,wind:.24,rain:.22,echo:.4,room:.30,master:.64}};
const TRACKS=['kick','bass','pad','drone','water','wind','rain','echo','room','master'];
const NAMES=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const STOPS=['WEST','WEST GAUGE','SPILLWAY','EAST GAUGE','EAST'];
const DEGREES=[0,1,3,4,5];
const SCALE=[0,1,3,5,7,8,10];
const MIDI_CHANNEL={bass:0,pad:1,drone:2,warren:3,kick:9,knock:9};
let saved={};try{saved=JSON.parse(localStorage.getItem(SLUG)||'{}')||{}}catch(e){}
const s={...HOME,...saved,mix:{...HOME.mix,...(saved.mix||{})}};
const clamp=(v,l,h)=>Math.min(h,Math.max(l,v));
const fmt=v=>Number(v).toFixed(1);
const hz=m=>440*Math.pow(2,(m-69)/12);
const deg=(d,oct=0,st=s)=>st.centre+SCALE[((d%7)+7)%7]+12*(oct+Math.floor(d/7));
const noteName=n=>NAMES[((n%12)+12)%12]+(Math.floor(n/12)-1);
const barSec=st=>6.6-2.45*clamp(st.flow/42,0,1);
const bpm=st=>240/barSec(st);
const store=()=>{try{localStorage.setItem(SLUG,JSON.stringify(s))}catch(e){}};
const euclid=(k,n,rot=0)=>Array.from({length:n},(_,i)=>((i+rot)*k)%n<k);
const KICK_A=euclid(2,16),KICK_B=euclid(3,16),BASS_A=euclid(4,16,3),BASS_B=euclid(5,16,3);
function stepEvents(st,bar,step){
  const events=[]; const duration=barSec(st)/16;
  const k=(bar%3===0?KICK_B:KICK_A),b=(bar%2?BASS_B:BASS_A);
  if(!st.rupture&&k[step])events.push({track:'kick',midi:36,v:step===0?98:78,steps:1.75});
  if(!st.rupture&&b[step])events.push({track:'bass',midi:deg(step%2?2:DEGREES[st.keeper],-1,st),v:84,steps:clamp(3.5+st.wind/8,2,5)});
  if(!st.rupture && step===9 && st.flow>17)events.push({track:'knock',midi:48,v:Math.round(40+st.flow),steps:.65});
  if(step===0 && bar%4===0){const chords=[[0,2,4],[1,3,5],[6,1,3],[3,5,0]],ch=chords[(bar/4)%4];
    for(const d of ch) events.push({track:'pad',midi:deg(d,1,st),v:Math.round(st.rupture?28:61),steps:56});}
  if(step===0 && bar%8===0)events.push({track:'drone',midi:st.centre-12,v:62,steps:125});
  if(st.warren && step===0 && bar%4===0){for(const d of [1,4,8])events.push({track:'warren',midi:deg(d,0,st),v:51,steps:45});
    events.push({track:'warren',midi:deg(4,2,st),v:37,steps:28});}
  return events.map(e=>({...e,seconds:e.steps*duration}));
}
function arrangement(bars,st){const result=[];
 for(let bar=0;bar<bars;bar++)for(let step=0;step<16;step++){
   const beat=bar*4+step/4;
   for(const e of stepEvents(st,bar,step))result.push({...e,beat,durationBeats:e.steps/4});
 }return result;
}
function paint(){
 for(const k of ['flow','keeper','wind','rain','humidity','centre']){
   $(k).value=s[k];const out=document.querySelector(`[data-out="${k}"]`);
   out.textContent=k==='keeper'?STOPS[s[k]]:k==='centre'?noteName(s[k]):k==='flow'?fmt(s[k])+'/ 42':k==='humidity'?s[k]+'%':k==='wind'?fmt(s[k])+' m/s':k==='rain'?fmt(s[k])+' mm/h':s[k];
 }
 $('warren').checked=!!s.warren;$('rupture').checked=!!s.rupture;
 $('seedView').textContent=String(s.seed).padStart(3,'0');
 $('barSec').textContent=fmt(barSec(s));$('bpm').textContent=fmt(bpm(s));
 $('bassNote').textContent=noteName(deg(DEGREES[s.keeper],-1));
 TRACKS.forEach(k=>{const el=$('mix-'+k);if(el){el.value=s.mix[k];$('val-'+k).textContent=Math.round(s.mix[k]*100)+'%';}});
 renderPattern(T.currentBar,T.playing ? T.lastStep : -1);
}
function renderPattern(bar,active){
 for(const track of ['kick','bass','knock','pad']){
 const lane=document.querySelector(`[data-lane="${track}"]`);if(!lane)return;
 for(let i=0;i<16;i++){
   const ev=stepEvents(s,bar,i).some(e=>e.track===track);
   const cell=lane.children[i];cell.className='cell'+(ev?(track==='bass'?' note':' on'):'')+(i===active?' active':'');
 }
 }
}
for(const track of ['kick','bass','knock','pad']){
 const lane=document.querySelector(`[data-lane="${track}"]`);
 for(let i=0;i<16;i++){const d=document.createElement('span');d.className='cell';d.setAttribute('aria-label',track+' step '+(i+1));lane.appendChild(d);}
}
const mix=$('mix');for(const k of TRACKS){const row=document.createElement('div');row.className='mix-row';row.innerHTML=`<label for="mix-${k}">${k.toUpperCase()}</label><input type="range" id="mix-${k}" min="0" max="1" step=".01" aria-label="${k} level"><output id="val-${k}"></output>`;mix.appendChild(row);
 row.querySelector('input').addEventListener('input',e=>{s.mix[k]=Number(e.target.value);$('val-'+k).textContent=Math.round(s.mix[k]*100)+'%';store();if(T.graph)applyMix(T.graph,s);});}
for(const k of ['flow','keeper','wind','rain','humidity','centre'])$(k).addEventListener('input',e=>{s[k]=Number(e.target.value);store();paint();if(T.graph)applyMix(T.graph,s);});
for(const k of ['warren','rupture'])$(k).addEventListener('change',e=>{s[k]=e.target.checked;store();paint();if(T.graph)applyMix(T.graph,s);});
$('reset').addEventListener('click',()=>{stop();Object.assign(s,structuredClone(HOME));store();paint();status('Loch Raven defaults restored.');});
$('matchWorld').addEventListener('click',()=>{Object.assign(s,structuredClone(HOME));store();paint();if(T.graph)applyMix(T.graph,s);status('Loch Raven reference settings loaded.');});
$('reseed').addEventListener('click',()=>{s.seed=Math.floor(Math.random()*9000)+1;store();paint();status('Variation seed '+s.seed+'.');});
const T={ctx:null,graph:null,playing:false,nextTime:0,nextIndex:0,currentBar:0,lastStep:-1,scheduler:null,raf:0};

function status(msg){$('statusText').textContent=msg;}
function noiseBuffer(c,brown,seed){const b=c.createBuffer(2,Math.round(c.sampleRate*4),c.sampleRate);let n=seed|0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)|0;return ((n>>>0)/4294967296)*2-1;};
 for(let ch=0;ch<2;ch++){let last=0;const data=b.getChannelData(ch);for(let i=0;i<data.length;i++){const white=rand();if(brown){last=(last+white*.025)/1.025;data[i]=last*3.6;}else data[i]=white*.5;}}
 return b;
}
function env(g,t,peak,attack,hold,release){const p=g.gain;p.setValueAtTime(.00001,t);p.linearRampToValueAtTime(Math.max(.00002,peak),t+attack);p.setValueAtTime(Math.max(.00002,peak),t+attack+hold);p.exponentialRampToValueAtTime(.00001,t+attack+hold+release);}
function makeGraph(c,st,duration=0){
 const g=v=>{const x=c.createGain();x.gain.value=v;return x;};
 const filter=(type,f,q=.7,gain=0)=>{const x=c.createBiquadFilter();x.type=type;x.frequency.value=f;x.Q.value=q;x.gain.value=gain;return x;};
 const curve=(drive=1)=>{const a=new Float32Array(2048);for(let i=0;i<a.length;i++)a[i]=Math.tanh((i/1023.5-1)*drive)/Math.tanh(drive);return a;};
 const bus=g(1),master=g(st.mix.master),hp=filter('highpass',26),sat=c.createWaveShaper(),shelf=filter('highshelf',2000,.7,-10),lp=filter('lowpass',6800,.5),comp=c.createDynamicsCompressor();
 sat.curve=curve(1.6);sat.oversample='2x';comp.threshold.value=-16;comp.ratio.value=2.4;comp.knee.value=10;comp.attack.value=.03;comp.release.value=.35;
 bus.connect(hp).connect(sat).connect(shelf).connect(lp).connect(comp).connect(master).connect(c.destination);
 const stem={};for(const k of TRACKS){if(k==='master'||k==='echo'||k==='room')continue;stem[k]=g(st.mix[k]);stem[k].connect(bus);}
 const delay=c.createDelay(3),fb=g(.35),sh=c.createWaveShaper(),eIn=g(1),eOut=g(st.mix.echo*.35),eLP=filter('lowpass',1600),eHP=filter('highpass',150);
 sh.curve=curve(1);eIn.connect(delay);delay.connect(eLP).connect(eHP).connect(sh).connect(fb).connect(delay);delay.connect(eOut).connect(bus);delay.delayTime.value=barSec(st)*3/16;fb.gain.value=clamp(.32+(st.humidity-70)/100, .2,.66);
 const ir=c.createBuffer(2,Math.round(c.sampleRate*1.8),c.sampleRate);let seed=st.seed|0;const rand=()=>{seed=(Math.imul(seed,1103515245)+12345)|0;return ((seed>>>0)/4294967296)*2-1;};
 for(let k=0;k<2;k++){const p=ir.getChannelData(k);let last=0;for(let i=0;i<p.length;i++){last+=(rand()-last)*.18;p[i]=last*.12*Math.pow(1-i/p.length,2.8);}}
 const con=c.createConvolver(),rIn=g(1),rOut=g(st.mix.room*.48);con.buffer=ir;rIn.connect(con).connect(rOut).connect(bus);
 const white=noiseBuffer(c,false,st.seed+110),brown=noiseBuffer(c,true,st.seed+220);
 const createBed=(name,buf,filters,volume)=>{
   const source=c.createBufferSource();source.buffer=buf;source.loop=true;let last=source;
   for(const f of filters){const node=filter(f[0],f[1],f[2]||.7);last.connect(node);last=node;}
   const gain=g(volume);last.connect(gain).connect(stem[name]);source.start(0);if(duration)source.stop(duration+.5);return {source,gain};
 };
 const beds={water:createBed('water',brown,[['lowpass',300]],.23),wind:createBed('wind',white,[['bandpass',320,.55],['lowpass',850]],.18),rain:createBed('rain',white,[['bandpass',950,.5],['lowpass',1400]],.16)};
 const drone=[];for(const [i,m] of [1,1.5,2].entries()){
  const o=c.createOscillator(),vol=g([.13,.04,.01][i]);o.type=i===2?'sawtooth':'sine';o.frequency.value=hz(st.centre-12)*m;o.connect(vol).connect(stem.drone);o.start(0);if(duration)o.stop(duration+.5);drone.push(o);
 }
 const analyser=c.createAnalyser();analyser.fftSize=1024;master.connect(analyser);
 const result={c,st,stem,master,fb,delay,rOut,eOut,beds,drone,bus,eIn,rIn,analyser,stopTime:duration};
 applyMix(result,st);return result;
}
function applyMix(g,st){const t=g.c.currentTime;
 for(const [k,node] of Object.entries(g.stem))node.gain.setTargetAtTime(st.mix[k],t,.13);
 g.master.gain.setTargetAtTime(st.mix.master,t,.13);
 g.eOut.gain.setTargetAtTime(st.mix.echo*.35,t,.13);
 g.rOut.gain.setTargetAtTime(st.mix.room*.48,t,.13);
 g.fb.gain.setTargetAtTime(clamp(.32+(st.humidity-70)/100+(st.warren?.1:0),.2,.68),t,.3);
 g.beds.water.gain.gain.setTargetAtTime((.05+.30*st.flow/42)*(st.rupture?.04:1),t,.3);
 g.beds.wind.gain.gain.setTargetAtTime((.03+st.wind*.018)*(st.rupture?.35:1),t,.3);
 g.beds.rain.gain.gain.setTargetAtTime(.01+st.rain*.09,t,.3);
 g.delay.delayTime.setTargetAtTime(barSec(st)*3/16,t,.4);
 for(let i=0;i<g.drone.length;i++)g.drone[i].frequency.setTargetAtTime(hz(st.centre-12)*[1,1.5,2][i],t,.5);
}
function playEvent(g,e,t){const c=g.c;const dur=clamp(e.seconds,.09,barSec(g.st)*9);const stem=g.stem[e.track==='knock'?'water':e.track==='warren'?'pad':e.track];if(!stem)return;
 const o=(type,midi,detune=0)=>{const x=c.createOscillator();x.type=type;x.frequency.value=hz(midi);x.detune.value=detune;return x;};
 if(e.track==='kick'){
  const osc=o('sine',50),gain=c.createGain();osc.frequency.setValueAtTime(115,t);osc.frequency.exponentialRampToValueAtTime(41,t+.18);env(gain,t,.53*(e.v/100),.005,.015,.55);osc.connect(gain).connect(stem);osc.start(t);osc.stop(t+1);return;
 }
 if(e.track==='knock'){
  const osc=o('triangle',e.midi+24),f=c.createBiquadFilter(),gain=c.createGain();f.type='bandpass';f.frequency.value=360;f.Q.value=4;env(gain,t,.16*(e.v/100),.003,.02,.17);osc.connect(f).connect(gain).connect(stem);gain.connect(g.eIn);osc.start(t);osc.stop(t+.3);return;
 }
 if(e.track==='bass'){
  const a=o('sawtooth',e.midi),b=o('sine',e.midi),f=c.createBiquadFilter(),gain=c.createGain();f.type='lowpass';f.frequency.setValueAtTime(150,t);f.frequency.linearRampToValueAtTime(150+stSafe(g.st.wind)*25,t+.2);f.frequency.setTargetAtTime(120,t+.4,.18);f.Q.value=5;
  env(gain,t,.24*(e.v/90),.015,Math.max(.01,dur*.55-.015),Math.max(.12,dur*.3));a.connect(f);b.connect(gain);f.connect(gain);gain.connect(stem);gain.connect(g.eIn);a.start(t);b.start(t);a.stop(t+dur+.5);b.stop(t+dur+.5);return;
 }
 const gain=c.createGain(),voices=[];
 if(e.track==='pad'){
   const a=o('sawtooth',e.midi,-7),b=o('sawtooth',e.midi,9),f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=540+g.st.wind*24;
   a.connect(f);b.connect(f);f.connect(gain);voices.push(a,b);
   env(gain,t,.028*(e.v/60),.65,Math.max(.2,dur-1.7),1.0);gain.connect(stem);gain.connect(g.rIn);
 }else if(e.track==='warren'){
   const a=o('triangle',e.midi),b=o('sine',e.midi-12);a.connect(gain);b.connect(gain);voices.push(a,b);
   env(gain,t,.036*(e.v/55),1.4,Math.max(.1,dur-3),1.3);gain.connect(stem);gain.connect(g.rIn);
 }else if(e.track==='drone'){return;}
 for(const voice of voices){voice.start(t);voice.stop(t+dur+1.6);}
}
function stSafe(v){return Number.isFinite(v)?v:0;}

window.MZCore={$ ,T,s,clamp,fmt,barSec,bpm,deg,stepEvents,arrangement,renderPattern,makeGraph,applyMix,playEvent,paint,status,store,MIDI_CHANNEL,stop:()=>{}};
})();
