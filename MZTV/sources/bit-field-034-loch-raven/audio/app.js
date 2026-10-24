'use strict';
(()=>{const {$,T,s,clamp,fmt,barSec,bpm,deg,stepEvents,arrangement,renderPattern,makeGraph,applyMix,playEvent,paint,status,store,MIDI_CHANNEL}=window.MZCore;
let midi=null,midiOutput=null;
function liveMidiEvent(e,t){if(!midiOutput)return;
 const ch=MIDI_CHANNEL[e.track];if(ch===undefined)return;
 const dt=Math.max(0,t-T.ctx.currentTime)*1000,when=performance.now()+dt;
 try{midiOutput.send([0x90+ch,clamp(Math.round(e.midi),0,127),clamp(Math.round(e.v),1,127)],when);
 midiOutput.send([0x80+ch,clamp(Math.round(e.midi),0,127),0],when+Math.max(80,e.seconds*1000));}catch(err){status('MIDI port unavailable: '+err.message);midiOutput=null;}
}
function schedule(){if(!T.playing||!T.ctx)return;
 if(T.ctx.state==='suspended'){T.ctx.resume().catch(()=>{});return;}
 if(T.nextTime < T.ctx.currentTime-.3){T.nextTime=T.ctx.currentTime+.05;}
 const horizon=T.ctx.currentTime+.18;
 while(T.nextTime<horizon){
   const st=T.nextIndex%16,bar=Math.floor(T.nextIndex/16);const evt=stepEvents(s,bar,st);
   for(const e of evt){playEvent(T.graph,e,T.nextTime);liveMidiEvent(e,T.nextTime);}
   T.currentBar=bar;T.lastStep=st;T.nextTime+=barSec(s)/16;T.nextIndex++;
   if(T.nextIndex>1e7)T.nextIndex=0;
 }
}
function drawMeter(){
 const canvas=$('meter'),context=canvas.getContext('2d');const w=canvas.width=canvas.clientWidth*Math.min(2,devicePixelRatio||1),h=canvas.height=64;
 context.fillStyle='#17252f';context.fillRect(0,0,w,h);
 const data=T.graph&&T.playing?new Uint8Array(T.graph.analyser.fftSize):null;
 if(data)T.graph.analyser.getByteTimeDomainData(data);
 context.strokeStyle='#477b76';context.lineWidth=2;context.beginPath();
 for(let i=0;i<w;i++){const v=data?data[Math.floor(i/w*data.length)]/255:0.5,y=h/2+(0.5-v)*(h-8);
  if(i===0)context.moveTo(i,y);else context.lineTo(i,y);
 }context.stroke();context.fillStyle='#718687';context.fillRect(0,h/2,w,1);
 if(T.playing){const count=T.currentBar+1;$('counter').textContent='BAR '+String(count).padStart(3,'0')+' / STEP '+String(T.lastStep+1).padStart(2,'0');renderPattern(T.currentBar,T.lastStep);T.raf=requestAnimationFrame(drawMeter);}
}
async function start(){
 if(T.playing)return;
 try{T.ctx=new(window.AudioContext||window.webkitAudioContext)({latencyHint:'playback'});await T.ctx.resume();T.graph=makeGraph(T.ctx,s);
 T.playing=true;T.currentBar=0;T.lastStep=-1;T.nextIndex=0;T.nextTime=T.ctx.currentTime+.08;
 document.body.classList.add('playing');$('transportLabel').textContent='PLAYING';$('engineLabel').textContent='WEB AUDIO / '+Math.round(T.ctx.sampleRate/1000)+' kHz';
 T.scheduler=setInterval(schedule,25);schedule();drawMeter();status('Audio running · MIDI '+(midiOutput?'connected':'not connected')+'.');
 }catch(err){stop();status('Audio unavailable: '+err.message);}
}
function panicMidi(){if(!midiOutput)return;try{midiOutput.clear();for(const ch of [0,1,2,3,9])midiOutput.send([0xB0+ch,123,0]);}catch(e){}}
function stop(){T.playing=false;document.body.classList.remove('playing');$('transportLabel').textContent='STOPPED';$('engineLabel').textContent='AUDIO ENGINE / IDLE';
 if(T.scheduler){clearInterval(T.scheduler);T.scheduler=null;}cancelAnimationFrame(T.raf);panicMidi();
 if(T.ctx){const old=T.ctx;try{T.graph.master.gain.setTargetAtTime(0,old.currentTime,.03);}catch(e){}
 setTimeout(()=>old.close().catch(()=>{}),280);}T.graph=null;T.ctx=null;T.currentBar=0;T.lastStep=-1;
 renderPattern(0,-1);drawMeter();$('counter').textContent='BAR 001';
}
$('play').addEventListener('click',start);$('stop').addEventListener('click',()=>{stop();status('Transport stopped.');});
addEventListener('pagehide',()=>{panicMidi();if(T.ctx)T.ctx.close().catch(()=>{});});
function setMidiPort(){const el=$('midiPort');midiOutput=midi&&el.value?midi.outputs.get(el.value)||null:null;
 $('midistate').textContent=midiOutput?'Connected: '+midiOutput.name+' · notes + velocities only; route into Ableton MIDI input.':'Choose an output; on macOS, enable IAC Driver first in Audio MIDI Setup.';
}
async function midiConnect(){
 if(!('requestMIDIAccess'in navigator)){status('Web MIDI not available. Try Chrome or Edge on desktop; MIDI file export still works.');return;}
 try{midi=await navigator.requestMIDIAccess({sysex:false});updateMidiPorts();midi.addEventListener('statechange',updateMidiPorts);status('MIDI permission granted. Select an output bus.');}
 catch(e){status('MIDI permission not granted: '+e.message);}
}
function updateMidiPorts(){const el=$('midiPort'),previous=el.value;el.replaceChildren(new Option('SELECT MIDI OUTPUT',''));
 if(midi)for(const port of midi.outputs.values())el.add(new Option(port.name||'MIDI OUTPUT',port.id));
 if([...el.options].some(o=>o.value===previous))el.value=previous;
 setMidiPort();
}
$('enableMidi').addEventListener('click',midiConnect);$('midiPort').addEventListener('change',setMidiPort);
const ascii=a=>new TextEncoder().encode(a);
const be16=n=>[(n>>>8)&255,n&255],be32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
const vlq=n=>{n=Math.max(0,Math.floor(n));let x=[n&127];while((n>>=7)>0)x.unshift((n&127)|128);return x;};
const chunk=(name,bytes)=>[...ascii(name),...be32(bytes.length),...bytes];
const strMeta=(type,text)=>{const b=[...ascii(text)];return [0xff,type,...vlq(b.length),...b];};
const ticks=beat=>Math.round(beat*480);
function midiBytes(bars,st){
 const evts=arrangement(bars,st),tempo=Math.round(60000000/bpm(st));
 const meta=[{tick:0,rank:0,bytes:[0xff,0x51,3,(tempo>>16)&255,(tempo>>8)&255,tempo&255]},
 {tick:0,rank:1,bytes:[0xff,0x58,4,4,2,24,8]},
 {tick:0,rank:2,bytes:strMeta(6,'LOCH RAVEN / MODELLED FLOW '+st.flow+' / BAR '+barSec(st).toFixed(3)+'s')},
 {tick:ticks(bars*4),rank:9,bytes:[0xff,0x2f,0]}];
 const keys=['kick','bass','pad','drone','warren','knock'],out=[midiTrack('META / TEMPO',meta)];
 for(const track of keys){const channel=MIDI_CHANNEL[track],events=[];
  events.push({tick:0,rank:0,bytes:strMeta(3,track.toUpperCase())});
  if(track==='bass')events.push({tick:0,rank:1,bytes:[0xC0+channel,38]});
  for(const e of evts.filter(e=>e.track===track)){
   const n=clamp(Math.round(e.midi),0,127),t=ticks(e.beat),off=ticks(e.beat+e.durationBeats);
   events.push({tick:t,rank:4,bytes:[0x90+channel,n,clamp(Math.round(e.v),1,127)]});
   events.push({tick:Math.max(t+1,off),rank:3,bytes:[0x80+channel,n,0]});
  }
  events.push({tick:ticks(bars*4+32),rank:9,bytes:[0xff,0x2f,0]});out.push(midiTrack(track,events));
 }
 const header=[...ascii('MThd'),...be32(6),...be16(1),...be16(out.length),...be16(480)];
 return new Uint8Array([...header,...out.flat()]);
}
function midiTrack(name,events){events.sort((a,b)=>a.tick-b.tick||a.rank-b.rank);let last=0,bytes=[];
 for(const ev of events){bytes.push(...vlq(ev.tick-last),...ev.bytes);last=ev.tick;}return chunk('MTrk',bytes);
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);}
function tag(st,bars){return `MZ-LOCH-RAVEN-${String(st.seed).padStart(3,'0')}-${bars}B-${Math.round(st.flow)}F`;}
function captureSettings(){return {...s,mix:{...s.mix}};}
$('midiExport').addEventListener('click',()=>{try{const st=captureSettings(),bars=Number($('exportbars').value),bytes=midiBytes(bars,st);
 download(new Blob([bytes],{type:'audio/midi'}),tag(st,bars)+'.mid');status('MIDI exported: '+bars+' bars, six named tracks at '+fmt(bpm(st))+' BPM.');}
 catch(e){status('MIDI export failed: '+e.message);console.error(e);}});
function wavBlob(buffer){const n=buffer.length,ch=2,size=n*ch*2,ab=new ArrayBuffer(44+size),view=new DataView(ab),rate=buffer.sampleRate;
 const put=(off,str)=>{for(let i=0;i<str.length;i++)view.setUint8(off+i,str.charCodeAt(i));};
 put(0,'RIFF');view.setUint32(4,36+size,true);put(8,'WAVE');put(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);put(36,'data');view.setUint32(40,size,true);
 const l=buffer.getChannelData(0),r=buffer.getChannelData(1);let off=44;
 for(let i=0;i<n;i++){for(const x of [l[i],r[i]]){const v=clamp(Number.isFinite(x)?x:0,-1,1);view.setInt16(off,Math.round(v<0?v*32768:v*32767),true);off+=2;}}
 return new Blob([ab],{type:'audio/wav'});
}
$('wavExport').addEventListener('click',async()=>{
 if(document.body.classList.contains('exporting'))return;
 const st=captureSettings(),bars=Number($('exportbars').value),len=bars*barSec(st)+2.5;
 document.body.classList.add('exporting');status('Rendering '+bars+' bars of Web Audio offline.');
 try{
  const offline=new OfflineAudioContext(2,Math.ceil(len*44100),44100),g=makeGraph(offline,st,len),notes=arrangement(bars,st),sec=barSec(st)/4;
  for(const e of notes)playEvent(g,e,.1+e.beat*sec);
  const rendered=await offline.startRendering(),blob=wavBlob(rendered);
  download(blob,tag(st,bars)+'.wav');status('WAV exported: '+bars+' bars · stereo 16-bit / 44.1 kHz · '+(blob.size/1048576).toFixed(1)+' MB.');
 }catch(err){console.error(err);status('WAV render failed: '+err.message);}
 finally{document.body.classList.remove('exporting');}
});
paint();drawMeter();
window.MZAudio={get settings(){return captureSettings();},get bpm(){return bpm(s);},get barSeconds(){return barSec(s);},start,stop,arrangement:(bars=8)=>arrangement(bars,captureSettings()),midi:(bars=8)=>midiBytes(bars,captureSettings()),set(o){Object.assign(s,o);store();paint();if(T.graph)applyMix(T.graph,s);}};

window.MZCore.stop=stop;
})();
