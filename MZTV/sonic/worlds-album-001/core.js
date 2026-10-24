/* MZ SONIC · WORLDS ALBUM 001 · original score engine
   Translates concepts from existing MZ WORLD systems; NOT a recording of their native audio engines.
*/
(function(root){
'use strict';
const LEN=900,PARTS=['DRONE','PAD','BASS','MOTIF','PULSE','FIELD'];
const WORLDS=[
 {id:'headland',name:'HEADLAND',sub:'DEPARTURE',start:0,end:300,meter:[5,4],key:'D Dorian',root:50,scale:[0,2,3,5,7,9,10],ink:'#89a6a3'},
 {id:'raven',name:'LOCH RAVEN',sub:'MEMORY',start:300,end:600,meter:[7,8],key:'D Phrygian',root:50,scale:[0,1,3,5,7,8,10],ink:'#bc765f'},
 {id:'plant',name:'48 PLANT',sub:'EMERGENCE',start:600,end:900,meter:[4,4],key:'F Lydian',root:53,scale:[0,2,4,6,7,9,11],ink:'#c8c286'}
];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function random(seed){let s=seed|0;return()=>{s=(s+0x6D2B79F5)|0;let v=Math.imul(s^(s>>>15),1|s);v^=v+Math.imul(v^(v>>>7),61|v);return((v^(v>>>14))>>>0)/4294967296;};}
function conditions(w,t,seed){
 const p=(t-w.start)/300,sh=seed*.001;
 if(w.id==='headland')return {wind:clamp(.38+.28*Math.sin(t*.016+sh)+.13*Math.sin(t*.071),0,1),flow:clamp(.44+.26*Math.cos(t*.032+sh),0,1),growth:0};
 if(w.id==='raven')return {wind:clamp(.36+.18*Math.sin(t*.023+sh),0,1),flow:clamp(.47+.37*Math.sin(t*.018+sh*1.7)+.12*Math.cos(t*.047),0,1),growth:0};
 return {wind:clamp(.2+.18*Math.sin(t*.012+sh),0,1),flow:.16,growth:clamp(p*.9+.1*Math.sin(t*.02),0,1)};
}
function compose(seed){
 const rand=random(seed),bars=[],notes=[],markers=[],automation=[];
 let tick=0;
 function add(part,t,dur,note,vel,w,pan=0){
  if(t>=LEN)return;
  notes.push({part,t:Math.max(0,t),dur:Math.max(.05,Math.min(dur,LEN-t,w.end-t)),note,vel:clamp(vel,8,120),world:w.id,pan:clamp(pan,-1,1)});
 }
 WORLDS.forEach((w,mi)=>{
  let t=w.start,i=0;
  markers.push({t,label:(mi+1)+' / '+w.name+' / '+w.sub});
  while(t<w.end-.0001){
   const e=conditions(w,t,seed),p=(t-w.start)/300;
   const natural=mi===0?5.2-.85*e.flow:mi===1?6.35-2.32*e.flow:6-.95*p;
   let sec=clamp(natural+.15*Math.sin(i*.21+seed*.01),3.9,6.6);const remaining=w.end-t;
   // Divide an impending short orphan bar into two coherent final bars.
   if(remaining<=7.0)sec=remaining;
   else if(remaining>sec&&remaining-sec<3.9)sec=remaining/2;
   else sec=Math.min(sec,remaining);
   const beats=w.meter[0]*4/w.meter[1],bpm=60*beats/sec;
   const bar={t,sec,tick:Math.round(tick),ticks:Math.round(beats*480),num:w.meter[0],den:w.meter[1],bpm,world:w.id,i,e};
   bars.push(bar);automation.push({t,world:w.id,bar:i+1,bpm,meter:w.meter.join('/'),wind:e.wind,flow:e.flow,growth:e.growth});
   const degree=mi===0?[0,3,4,1][Math.floor(i/4)%4]:mi===1?[0,1,3,4][Math.floor(i/4)%4]:[0,2,4,1][Math.floor(i/4)%4];
   const bass=w.root+w.scale[degree]-12,deep=mi===1&&t>=433&&t<475;
   if(i%2===0){
    add('DRONE',t,sec*1.92,w.root-12,38+e.flow*16,w,-.2);
    add('DRONE',t+.13,sec*1.82,w.root+7,26+e.wind*13,w,.2);
    [0,2,4].forEach((d,j)=>add('PAD',t+j*.14,sec*1.8,w.root+12+w.scale[d],35+p*14,w,[-.48,0,.48][j]));
   }
   add('BASS',t,sec*.38,bass,53+e.flow*18,w);
   if(i%2===0)add('BASS',t+sec*.57,sec*.28,w.root-12+w.scale[(degree+4)%7],41,w,.1);
   const pulses=mi===0?3:mi===1?5:2+Math.floor(p*5);
   for(let j=0;j<pulses;j++)if((j+i)%4!==3||mi===1)add('PULSE',t+sec*j/pulses,.115,j===0?36:42,43+e.flow*15+rand()*11,w,j%2?-.3:.3);
   if(i%4===0||(deep&&i%2===0)){
    const phrase=mi===0?[0,2,4]:mi===1?[0,1,4]:[0,2,3];
    phrase.forEach((d,j)=>add('MOTIF',t+sec*(.1+.255*j)+.012*(rand()-.5),sec*(mi===2?.4:.23),w.root+12+w.scale[d]+(mi===2&&p>.66&&j===2?12:0),58+p*18,w,j===0?-.38:j===2?.38:0));
   }
   if(i%2||mi===2)add('FIELD',t+sec*.13,sec*.71,mi===1?42:mi===2?66:55,24+25*(mi===2?p:e.wind),w,Math.sin(i)*.55);
   if(deep){if(i%2===0)add('PAD',t+sec*.08,sec*1.6,w.root+13,55,w,.3);if(i%3===0)add('FIELD',t,sec*.9,w.root-17,59,w,-.35);}
   if(mi===2&&p>.72&&i%3===0)add('MOTIF',t+sec*.5,sec*.4,w.root+24+w.scale[4],34,w,.65);
   tick+=bar.ticks;t+=sec;i++;
  }
 });
 markers.push({t:433,label:'WARREN BELOW / DISPLACEMENT'},{t:475,label:'AFTERIMAGE / RESIDUE'},{t:840,label:'RECOLLECTION / RETURN'});
 notes.sort((a,b)=>a.t-b.t);
 return {seed,bars,notes,markers,automation};
}
function barAt(s,t){
 let lo=0,hi=s.bars.length-1;
 while(lo<hi){let mid=(lo+hi+1)>>1;if(s.bars[mid].t<=t)lo=mid;else hi=mid-1;}
 return s.bars[lo];
}
function tickAt(s,t){let b=barAt(s,clamp(t,0,LEN-.00001));return Math.round(b.tick+clamp((t-b.t)/b.sec,0,1)*b.ticks);}
const enc=new TextEncoder(),bytes=s=>Array.from(enc.encode(String(s)));
const BE=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
function VL(n){n=Math.max(0,n|0);let a=[n&127];while(n>>=7)a.unshift((n&127)|128);return a;}
const meta=(id,b)=>[255,id,...VL(b.length),...b];
function makeTrack(msg){
 msg.sort((a,b)=>a.t-b.t||(a.order||0)-(b.order||0));let payload=[],prev=0;
 for(let x of msg){payload.push(...VL(x.t-prev),...x.b);prev=x.t;}
 payload.push(0,255,47,0);return [...bytes('MTrk'),...BE(payload.length),...payload];
}
function midi(s){
 let m=[{t:0,b:meta(3,bytes('MZ SONIC / CONDUCTOR'))}],lastMeter='';
 s.bars.forEach(bar=>{
  let tempo=Math.round(60000000/bar.bpm);
  m.push({t:bar.tick,b:meta(81,[(tempo>>16)&255,(tempo>>8)&255,tempo&255])});
  const meter=bar.num+'/'+bar.den;
  if(meter!==lastMeter){m.push({t:bar.tick,b:meta(88,[bar.num,Math.log2(bar.den)|0,24,8])});lastMeter=meter;}
 });
 WORLDS.forEach((w,i)=>{m.push({t:tickAt(s,w.start),b:meta(89,i===1?[254,0]:[0,0])});m.push({t:tickAt(s,w.start),b:meta(1,bytes('KEY/MODE '+w.key))});});
 s.markers.forEach(x=>m.push({t:tickAt(s,x.t),b:meta(6,bytes(x.label))}));
 let tracks=[makeTrack(m)];
 PARTS.forEach((part,i)=>{
  let ch=i===4?9:i,a=[{t:0,b:meta(3,bytes(part+' / MZ SONIC'))},{t:0,b:[192+ch,[89,89,38,10,0,81][i]]}];
  s.notes.filter(n=>n.part===part).forEach(n=>{
   let t=tickAt(s,n.t),end=Math.max(t+1,tickAt(s,Math.min(899.999,n.t+n.dur))),note=clamp(n.note,0,127)|0;
   a.push({t,order:1,b:[144+ch,note,Math.round(n.vel)]},{t:end,order:0,b:[128+ch,note,0]});
  });
  tracks.push(makeTrack(a));
 });
 const h=[...bytes('MThd'),0,0,0,6,0,1,0,tracks.length,1,224];
 return new Uint8Array([...h,...tracks.flat()]);
}
const noiseCache=new WeakMap();
function noise(ctx){
 if(noiseCache.has(ctx))return noiseCache.get(ctx);
 let n=Math.ceil(ctx.sampleRate*1.46),b=ctx.createBuffer(1,n,ctx.sampleRate),a=b.getChannelData(0),r=random(971),v=0;
 for(let i=0;i<n;i++){v=.93*v+.07*(r()*2-1);a[i]=v*.65;}
 noiseCache.set(ctx,b);return b;
}
function voice(ctx,out,e,when,maxEnd){
 const dur=Math.min(e.dur,maxEnd-when);
 if(dur<=.01)return null;
 let g=ctx.createGain(),pan=ctx.createStereoPanner?ctx.createStereoPanner():null,src,f;
 if(pan){pan.pan.value=e.pan;g.connect(pan);pan.connect(out);}else g.connect(out);
 if(e.part==='FIELD'){
  src=ctx.createBufferSource();src.buffer=noise(ctx);src.loop=true;
  f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=e.world==='raven'?510:e.world==='headland'?730:1100;
  src.connect(f);f.connect(g);
 }else{
  src=ctx.createOscillator();src.type=e.part==='PAD'||e.part==='BASS'?'triangle':'sine';
  let hz=440*Math.pow(2,(e.note-69)/12);
  if(e.part==='PULSE'){hz=e.note===36?92:430;src.frequency.setValueAtTime(hz,when);src.frequency.exponentialRampToValueAtTime(e.note===36?46:240,when+.105);}
  else src.frequency.setValueAtTime(hz,when);
  if(e.part==='BASS'||e.part==='DRONE'){f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=e.part==='BASS'?330:205;src.connect(f);f.connect(g);}
  else src.connect(g);
 }
 let base={DRONE:.086,PAD:.043,BASS:.15,MOTIF:.093,PULSE:.087,FIELD:.058}[e.part],vol=e.vel/127*base;
 let at=e.part==='DRONE'?Math.min(.8,dur*.2):e.part==='PAD'?Math.min(.42,dur*.23):e.part==='FIELD'?Math.min(.55,dur*.2):e.part==='PULSE'?.004:.018;
 let rel=e.part==='DRONE'||e.part==='PAD'?Math.min(.8,dur*.22):e.part==='PULSE'?.11:e.part==='FIELD'?Math.min(.44,dur*.2):Math.min(.34,dur*.35);
 g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vol,when+at);
 g.gain.setValueAtTime(vol,Math.max(when+at,when+dur-rel));g.gain.linearRampToValueAtTime(0,when+dur);
 src.start(when);src.stop(when+dur+.04);
 return src;
}
function master(ctx){
 const bus=ctx.createGain(),hp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter(),comp=ctx.createDynamicsCompressor();
 hp.type='highpass';hp.frequency.value=26;lp.type='lowpass';lp.frequency.value=6800;
 comp.threshold.value=-20;comp.ratio.value=2.3;comp.knee.value=14;comp.attack.value=.012;comp.release.value=.16;
 bus.connect(hp);hp.connect(lp);lp.connect(comp);return {input:bus,output:comp};
}
function wav(buffer){
 const samples=buffer.getChannelData(0),out=new Uint8Array(44+samples.length*2),d=new DataView(out.buffer);
 function str(i,s){for(let k=0;k<s.length;k++)out[i+k]=s.charCodeAt(k);}
 str(0,'RIFF');d.setUint32(4,36+samples.length*2,true);str(8,'WAVE');str(12,'fmt ');
 d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,buffer.sampleRate,true);
 d.setUint32(28,buffer.sampleRate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);str(36,'data');d.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){let x=clamp(samples[i],-1,1);d.setInt16(44+i*2,x<0?x*32768:x*32767,true);}
 return out;
}
async function render(s,id,parts,progress){
 const w=WORLDS.find(x=>x.id===id),Offline=root.OfflineAudioContext||root.webkitOfflineAudioContext;
 if(!w||!Offline)throw Error('OfflineAudioContext is not available.');
 const ctx=new Offline(1,Math.ceil((w.end-w.start)*22050),22050),chain=master(ctx);
 chain.output.connect(ctx.destination);
 const selected=new Set(parts),ev=s.notes.filter(e=>e.t>=w.start&&e.t<w.end&&selected.has(e.part));
 for(let i=0;i<ev.length;i++){
  const e=ev[i];voice(ctx,chain.input,e,e.t-w.start,Math.min(w.end,e.t+e.dur)-w.start);
  if(i%70===0){progress(i/Math.max(1,ev.length)*.42);await new Promise(r=>setTimeout(r,0));}
 }
 progress(.5);const audio=await ctx.startRendering();progress(.85);const result=wav(audio);progress(1);return result;
}
function csv(s){return 'seconds,world,bar,bpm,meter,wind_norm,flow_norm,growth_norm\n'+s.automation.map(a=>[a.t.toFixed(3),a.world,a.bar,a.bpm.toFixed(4),a.meter,a.wind.toFixed(4),a.flow.toFixed(4),a.growth.toFixed(4)].join(',')).join('\n')+'\n';}
function xml(s){
 const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 return '<?xml version="1.0" encoding="UTF-8"?>\n<!-- Interchange manifest, not an Ableton .als file -->\n<MZSonic version="0.1" seed="'+s.seed+'" duration="900">\n'+
 WORLDS.map(w=>' <Movement name="'+w.name+'" start="'+w.start+'" end="'+w.end+'" meter="'+w.meter.join('/')+'" keyMode="'+w.key+'"/>').join('\n')+'\n'+
 PARTS.map(p=>' <Stem name="'+p+'" suggestedLiveDevice="'+esc({DRONE:'Operator',PAD:'Wavetable',BASS:'Operator',MOTIF:'Collision',PULSE:'Drum Rack',FIELD:'Noise source and Auto Filter'}[p])+'"/>').join('\n')+'\n'+
 s.markers.map(m=>' <Marker time="'+m.t+'" title="'+esc(m.label)+'"/>').join('\n')+'\n <Import>Import MIDI for tempo/meter; align exported WAV stems to movement start; set up devices manually from template. XML is not an ALS.</Import>\n</MZSonic>\n';
}
function crc32(a){let c=-1;for(let x of a){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xEDB88320:0);}return(c^-1)>>>0;}
function zip(files){
 const list=files.map(f=>({name:enc.encode(f.name),data:f.data instanceof Uint8Array?f.data:enc.encode(f.data)}));
 const n=list.reduce((a,e)=>a+30+e.name.length+e.data.length+46+e.name.length,22),out=new Uint8Array(n),v=new DataView(out.buffer);let at=0;
 const u16=x=>{v.setUint16(at,x,true);at+=2},u32=x=>{v.setUint32(at,x>>>0,true);at+=4};
 list.forEach(e=>{e.crc=crc32(e.data);e.offset=at;u32(0x04034b50);u16(20);u16(0);u16(0);u16(0);u16(0);u32(e.crc);u32(e.data.length);u32(e.data.length);u16(e.name.length);u16(0);out.set(e.name,at);at+=e.name.length;out.set(e.data,at);at+=e.data.length;});
 const cd=at;list.forEach(e=>{u32(0x02014b50);u16(20);u16(20);u16(0);u16(0);u16(0);u16(0);u32(e.crc);u32(e.data.length);u32(e.data.length);u16(e.name.length);u16(0);u16(0);u16(0);u16(0);u32(0);u32(e.offset);out.set(e.name,at);at+=e.name.length;});
 const cdsize=at-cd;u32(0x06054b50);u16(0);u16(0);u16(list.length);u16(list.length);u32(cdsize);u32(cd);u16(0);
 if(at!==n)throw Error('ZIP sizing mismatch');return out;
}
root.MZSCore={LEN,PARTS,WORLDS,compose,conditions,barAt,tickAt,midi,voice,master,render,csv,xml,zip};
})(window);