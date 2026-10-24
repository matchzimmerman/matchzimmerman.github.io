/* MZ SONIC · WORLDS ALBUM 001 · listener, visual score and Ableton interchange */
(function(){
'use strict';
const E=id=>document.getElementById(id),Core=window.MZSCore;
if(!Core)throw Error('MZSCore missing: cannot start album');
const $play=E('play'),$icon=E('playIcon'),$time=E('time'),$world=E('nowWorld'),$status=E('playStatus');
const $message=E('message'),$progress=E('progress'),$progressWrap=E('progressWrap'),$exportMovement=E('movement');
const color={headland:'#89a6a3',raven:'#bc765f',plant:'#c8c286'};
const query=new URLSearchParams(location.search);
let seed=parseInt(query.get('seed')||'81001',10);
if(!Number.isFinite(seed)||seed<1)seed=81001;
let score=Core.compose(seed),cursor=0,playing=false,ctx=null,buses={},master=null,analyser=null,origin=0,next=0,busy=false;
const soundOn=new Set(Core.PARTS),active=new Set();
function mmss(t){const n=Math.floor(Math.max(0,t));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function which(t){return Core.WORLDS[Math.min(2,Math.floor(Math.min(t,899.999)/300))];}
function lowerBound(t){let lo=0,hi=score.notes.length;while(lo<hi){const mid=(lo+hi)>>1;if(score.notes[mid].t<t-.02)lo=mid+1;else hi=mid;}return lo;}
function setMessage(s){$message.textContent=s;}
async function audioReady(){
 if(!ctx){
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('Web Audio is not supported here');
  ctx=new AC();
  const chain=Core.master(ctx);master=ctx.createGain();analyser=ctx.createAnalyser();analyser.fftSize=1024;
  master.gain.value=+E('volume').value/100;
  chain.output.connect(master);master.connect(analyser);analyser.connect(ctx.destination);
  Core.PARTS.forEach(p=>{buses[p]=ctx.createGain();buses[p].gain.value=1;buses[p].connect(chain.input);});
 }
 if(ctx.state!=='running')await ctx.resume();
}
function killVoices(){
 if(!ctx)return;
 for(const source of active){try{source.stop(ctx.currentTime+.005);}catch(e){}}
 active.clear();
}
function playhead(t){
 cursor=Math.max(0,Math.min(Core.LEN,t));
 if(playing&&ctx){killVoices();origin=ctx.currentTime-cursor+.06;next=lowerBound(cursor);schedule();}
 updateUI();
}
function pause(){
 if(ctx)cursor=Math.max(0,Math.min(Core.LEN,ctx.currentTime-origin));
 playing=false;killVoices();$icon.textContent='▶';$play.setAttribute('aria-label','Play album');$status.textContent='PAUSED';
}
async function toggle(){
 if(playing){pause();return;}
 try{
  if(cursor>=899.99)cursor=0;
  await audioReady();
  origin=ctx.currentTime-cursor+.06;next=lowerBound(cursor);playing=true;
  $icon.textContent='Ⅱ';$play.setAttribute('aria-label','Pause album');$status.textContent='PLAYING';
  schedule();
 }catch(e){setMessage('Audio unavailable: '+e.message);}
}
function schedule(){
 if(!playing||!ctx)return;
 const now=ctx.currentTime,position=now-origin;
 if(position>=Core.LEN){pause();cursor=Core.LEN;updateUI();return;}
 while(next<score.notes.length&&score.notes[next].t<=position+.26){
  const n=score.notes[next++],at=origin+n.t;
  if(at<now-.03)continue;
  if(!soundOn.has(n.part))continue;
  try{
   const src=Core.voice(ctx,buses[n.part],n,Math.max(now+.003,at),Math.max(now+.003,at)+n.dur);
   if(src){active.add(src);src.onended=()=>active.delete(src);}
  }catch(e){console.error('voice failed',n,e);}
 }
 cursor=Math.max(0,Math.min(Core.LEN,position));
}
setInterval(schedule,45);
function updateUI(){
 let t=playing&&ctx?Math.max(0,Math.min(900,ctx.currentTime-origin)):cursor;
 const w=which(t),b=Core.barAt(score,t),env=Core.conditions(w,t,seed);
 $time.textContent=mmss(t);E('needle').style.left=(t/900*100)+'%';
 E('scoreWrap').setAttribute('aria-valuenow',String(Math.floor(t)));
 $world.textContent=w.name;$world.style.color=w.ink;
 E('nowKey').textContent=w.key.toUpperCase();E('flow').textContent=env.flow.toFixed(2);
 E('wind').textContent=env.wind.toFixed(2);E('growth').textContent=env.growth.toFixed(2);
 E('barStatus').textContent='BAR '+String(b.i+1).padStart(3,'0')+' / '+b.num+'·'+b.den+' / '+Math.round(b.bpm)+' BPM';
 E('phenomenon').textContent=t>=433&&t<475?'WARREN BELOW':t>=475&&t<496?'AFTERIMAGE':t>=840?'RECOLLECTION':w.sub;
 if(!playing&&$status.textContent==='READY'){}else if(playing)$status.textContent='PLAYING';
 document.querySelectorAll('.world').forEach(el=>el.classList.toggle('active',el.dataset.move===w.id));
 const selected=$exportMovement.dataset.follow==='yes';
 if(selected)$exportMovement.value=w.id;
}
let animation=null;
function loop(){updateUI();animation=requestAnimationFrame(loop);}
$play.addEventListener('click',toggle);
E('restart').addEventListener('click',()=>playhead(0));
E('volume').addEventListener('input',e=>{if(master)master.gain.setTargetAtTime(+e.target.value/100,ctx.currentTime,.03);});
E('scoreWrap').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect();playhead((e.clientX-r.left)/r.width*900);});
E('scoreWrap').addEventListener('keydown',e=>{
 if(e.key==='ArrowRight'){playhead(cursor+10);e.preventDefault();}
 if(e.key==='ArrowLeft'){playhead(cursor-10);e.preventDefault();}
});
document.querySelectorAll('.world').forEach(el=>el.addEventListener('click',()=>{let w=Core.WORLDS.find(x=>x.id===el.dataset.move);if(w)playhead(w.start);$exportMovement.value=w.id;}));
$exportMovement.dataset.follow='yes';
$exportMovement.addEventListener('change',()=>{$exportMovement.dataset.follow='no';});
addEventListener('keydown',e=>{if(e.target instanceof HTMLElement&&['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();toggle();}});
function makeParts(){
 const parent=E('parts');parent.innerHTML='';
 Core.PARTS.forEach((p,i)=>{
  const el=document.createElement('button');el.className='part';el.dataset.part=p;
  const mark=String(i+1).padStart(2,'0');
  el.innerHTML='<span><b>'+mark+'</b><b class="switch">ON</b></span><strong>'+p+'</strong>';
  el.setAttribute('aria-pressed','true');parent.appendChild(el);
  el.addEventListener('click',()=>{
   if(soundOn.has(p))soundOn.delete(p);else soundOn.add(p);
   const on=soundOn.has(p);el.classList.toggle('off',!on);el.querySelector('.switch').textContent=on?'ON':'OFF';el.setAttribute('aria-pressed',String(on));
   if(ctx&&buses[p])buses[p].gain.setTargetAtTime(on?1:0,ctx.currentTime,.025);
  });
 });
}
function drawScore(){
 const c=E('score'),r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=r.width,h=r.height;
 if(w<1||h<1)return;
 c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);
 const p=c.getContext('2d');p.setTransform(dpr,0,0,dpr,0,0);
 p.fillStyle='#212d34';p.fillRect(0,0,w,h);
 Core.WORLDS.forEach((x,i)=>{
  p.globalAlpha=.1;p.fillStyle=x.ink;p.fillRect(w*i/3,0,w/3,h);p.globalAlpha=1;
  if(i){p.strokeStyle='#9aa8a0';p.lineWidth=1;p.beginPath();p.moveTo(w*i/3,0);p.lineTo(w*i/3,h);p.stroke();}
  p.font='10px monospace';p.fillStyle=x.ink;p.fillText(('0'+(i+1)).slice(-2)+' / '+x.name,Math.min(w-105,w*i/3+10),18);
 });
 const pad=31,laneHeight=(h-pad-16)/6;
 Core.PARTS.forEach((name,i)=>{
  const y=pad+i*laneHeight;
  p.strokeStyle='rgba(224,226,219,.18)';p.lineWidth=1;p.beginPath();p.moveTo(0,y+laneHeight);p.lineTo(w,y+laneHeight);p.stroke();
  p.fillStyle='#b8c4c0';p.font='9px monospace';p.fillText(name,8,y+11);
 });
 score.notes.forEach(n=>{
  const j=Core.PARTS.indexOf(n.part),y=pad+j*laneHeight+16;
  const x=n.t/900*w,size=Math.max(1.5,n.dur/900*w);
  p.globalAlpha=.25+n.vel/185;p.fillStyle=color[n.world];p.fillRect(x,y,size,Math.max(2,Math.min(laneHeight-18,2+n.vel/24)));
 });
 p.globalAlpha=1;
 score.markers.forEach(m=>{const x=m.t/900*w;p.fillStyle='#e3d8be';p.fillRect(x,0,m.t===0?0:1,h);});
}
addEventListener('resize',drawScore);
function regenerate(){
 let n=Number(E('seed').value);
 if(!Number.isInteger(n)||n<1||n>9999999){setMessage('Use an integer seed between 1 and 9,999,999.');return;}
 if(n===seed)n=(seed+1)%9999999||1;
 if(playing)pause();
 seed=n;score=Core.compose(seed);cursor=0;next=0;E('seed').value=seed;E('edition').textContent='SEED '+seed;
 const u=new URL(location.href);u.searchParams.set('seed',seed);history.replaceState(null,'',u);
 drawScore();updateUI();setMessage('New edition generated. Every sound, note, bar and automation value is repeatable from seed '+seed+'.');
}
E('seed').value=seed;E('edition').textContent='SEED '+seed;E('generate').addEventListener('click',regenerate);
function download(data,filename,mime){
 const blob=new Blob([data],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function notesReadme(){
 return 'MZ SONIC / WORLDS ALBUM 001\n\n'+
 'This is an original procedural album TRANSLATING the sonic behaviors of HEADLAND, LOCH RAVEN and 48 PLANT, not a recording or executable transplant of those live-world audio engines.\n\n'+
 'DURATION: 15:00 (3 x 5:00)\nPERFORMANCE SEED: '+seed+'\n\n'+
 'I HEADLAND 00:00, 5/4 D Dorian\nII LOCH RAVEN 05:00, 7/8 D Phrygian\nIII 48 PLANT 10:00, 4/4 F Lydian\n\n'+
 'ABLETON LIVE\n1. Import the Type-1 MIDI file. Enable tempo and meter import if Live offers the choice.\n'+
 '2. Create six tracks for DRONE, PAD, BASS, MOTIF, PULSE, FIELD using their MIDI clips or imported WAV stems.\n'+
 '3. Place each movement WAV at its precise song timestamp (0:00, 5:00, 10:00); these are 22,050 Hz 16-bit MONO and should be set to Warp OFF to retain exact duration.\n'+
 '4. The MIDI conductor track includes tempo changes, meter changes, key/mode labels and arrangement markers. Import behavior depends on Ableton version; add locators manually when unsupported.\n'+
 '5. Manifest XML describes suggested devices, but is NOT an .als Live Set nor a way to import arbitrary VST/Max device state. These require an actual tested template.\n\n'+
 'AUTOMATION CSV records modelled wind/flow/growth per bar as normalized 0..1 parameters. It is not imported into Live as native automation without a mapping tool.\n'+
 'PREVIEW: https://matchzimmerman.com/MZTV/sonic/worlds-album-001/\n';
}
function packFiles(){
 return [{name:'MZ_SONIC_001_CONDUCTOR.mid',data:Core.midi(score)},
 {name:'score/automation.csv',data:Core.csv(score)},
 {name:'score/manifest.xml',data:Core.xml(score)},
 {name:'README_IMPORT.txt',data:notesReadme()}];
}
function progress(amount,label){
 $progressWrap.hidden=false;$progress.style.width=(Math.max(0,Math.min(1,amount))*100).toFixed(1)+'%';
 if(label)setMessage(label+' / '+Math.round(amount*100)+'%');
}
async function job(kind){
 if(busy)return;
 busy=true;
 const buttons=[E('midi'),E('mix'),E('stems'),E('album'),E('generate')];buttons.forEach(b=>b.disabled=true);
 try{
  const w=Core.WORLDS.find(x=>x.id===$exportMovement.value)||Core.WORLDS[0];
  const prefix='MZ_SONIC_001_seed'+seed;
  if(kind==='midi'){
   progress(.5,'Compiling conductor MIDI, score and manifest');
   download(Core.zip(packFiles()),prefix+'_ABLETON_SCORE.zip','application/zip');
  }else if(kind==='mix'){
   progress(.02,'Rendering '+w.name+' as mono WAV');
   const audio=await Core.render(score,w.id,Core.PARTS,v=>progress(v,'Rendering '+w.name));
   download(audio,prefix+'_'+w.name.replaceAll(' ','_')+'_MIX.wav','audio/wav');
  }else if(kind==='stems'){
   let files=packFiles(),n=Core.PARTS.length;
   for(let i=0;i<n;i++){
    const p=Core.PARTS[i],audio=await Core.render(score,w.id,[p],v=>progress((i+v)/n,'Rendering '+w.name+' / '+p));
    files.push({name:'stems/'+w.name.replaceAll(' ','_')+'/'+p+'.wav',data:audio});
   }
   progress(.97,'Packaging six separate mono WAV stems');
   download(Core.zip(files),prefix+'_'+w.name.replaceAll(' ','_')+'_STEMS.zip','application/zip');
  }else if(kind==='album'){
   let sections=[],size=0;
   for(let i=0;i<Core.WORLDS.length;i++){
    const x=Core.WORLDS[i],audio=await Core.render(score,x.id,Core.PARTS,v=>progress((i+v)/3,'Rendering '+x.name));
    sections.push(audio);size+=audio.length-44;
   }
   const all=new Uint8Array(44+size);all.set(sections[0].slice(0,44));
   let at=44;
   for(const a of sections){all.set(a.subarray(44),at);at+=a.length-44;}
   const dv=new DataView(all.buffer);dv.setUint32(4,36+size,true);dv.setUint32(40,size,true);
   download(all,prefix+'_COMPLETE_ALBUM_15MIN.wav','audio/wav');
  }
  progress(1,'Export completed. Check your browser downloads.');
 }catch(e){console.error('Export failed',e);setMessage('Export failed: '+(e&&e.message?e.message:e));}
 finally{busy=false;buttons.forEach(b=>b.disabled=false);setTimeout(()=>{$progressWrap.hidden=true;},1700);}
}
E('midi').addEventListener('click',()=>job('midi'));
E('mix').addEventListener('click',()=>job('mix'));
E('stems').addEventListener('click',()=>job('stems'));
E('album').addEventListener('click',()=>job('album'));
makeParts();drawScore();updateUI();loop();
window.MZSonic={get score(){return score;},seek:playhead,play:toggle,pause,generate:regenerate,export:job};
})();