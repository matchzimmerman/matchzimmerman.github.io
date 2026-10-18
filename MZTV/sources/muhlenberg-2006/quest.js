/* MZ WORLDS // MUHLENBERG 2006 // LOST RAZR QUEST v0.3.
   Fictional item within a provisional historical GIS blockout.
   No network calls, analytics, or remote storage. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const style=document.createElement('style');
style.textContent='#questhud{position:absolute;z-index:9;left:10px;top:56px;width:min(315px,calc(100% - 100px));background:rgba(13,27,25,.95);color:#f8ecdb;border:1px solid #dcab75;box-shadow:0 9px 25px #07121080;padding:11px 13px;font-family:ui-monospace,Menlo,Consolas,monospace;pointer-events:auto}#questhud .qmeta{font-size:9px;letter-spacing:.14em;color:#dcb38c;margin-bottom:6px}#questhud strong{font-size:13px;line-height:1.3;letter-spacing:.02em}#questhud p{font-size:10px;line-height:1.48;color:#d0d4c7;margin:6px 0 7px}#questhud .qstatus{font-size:11px;color:#f8d4a0;line-height:1.45;min-height:20px}#questhud .qactions{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}#questhud button,#questpad button,#questpickup{background:#273b34;color:#fff0d4;border:1px solid #b08c65;font:700 11px ui-monospace,Menlo,monospace;cursor:pointer}#questhud button{padding:9px 10px}#questhud button.on{background:#e6b078;color:#15211e}#questhud button:disabled{opacity:.5;cursor:default}#questpad{position:absolute;z-index:10;right:10px;bottom:43px;display:none;grid-template-columns:repeat(3,53px);grid-template-rows:repeat(2,52px);gap:3px;touch-action:none;user-select:none}#questpad button{padding:0;font-size:22px;touch-action:none;-webkit-user-select:none;user-select:none;border-radius:5px;background:#182822df}#questpad button.active{background:#daaf7b;color:#111b1a}#questpad .qleft{grid-column:1;grid-row:2}#questpad .qright{grid-column:3;grid-row:2}#questpad .qup{grid-column:2;grid-row:1}#questpad .qdown{grid-column:2;grid-row:2}#questpickup{position:absolute;z-index:11;left:50%;bottom:34px;transform:translateX(-50%);background:#d4a878;color:#11211f;padding:13px 20px;border:2px solid #fff0cf;letter-spacing:.07em;display:none;white-space:nowrap}#questhelp{position:absolute;z-index:8;bottom:10px;right:10px;font:10px ui-monospace,Menlo,monospace;color:#fae6bc;background:#16231fc9;padding:5px 7px;display:none}@media(max-width:760px){#questhud{top:42px;left:7px;width:min(270px,calc(100% - 79px));padding:9px 10px}#questhud strong{font-size:12px}#questhud p{font-size:9px;margin:4px 0 5px}#questhud .qstatus{font-size:10px}#questpad{bottom:38px;right:7px;grid-template-columns:repeat(3,50px);grid-template-rows:repeat(2,50px)}#questpickup{bottom:16px;padding:12px 14px;font-size:10px}#questhelp{display:none!important}.corner{bottom:4px!important;left:6px!important;max-width:calc(100% - 174px)!important;padding:4px 5px!important;font-size:8px!important}}@media(max-width:375px){#questhud{width:245px}#questhud .qactions button{padding:7px 6px;font-size:9px}}';
document.head.appendChild(style);
const hud=document.createElement('div');hud.id='questhud';hud.setAttribute('aria-label','Lost RAZR quest');
hud.innerHTML='<div class="qmeta">FIELD QUEST / 001 / SPRING 2006</div><strong>THE LOST RAZR</strong><p>Somebody lost a silver Motorola RAZR V3 on the Green. Explore the campus, listen for a ringtone, and find it.</p><div class="qstatus" id="qstatus" aria-live="polite">READY TO SEARCH</div><div class="qactions"><button id="qstart" class="on">START SEARCH</button><button id="qgps">GPS: OFF</button><button id="qaudio">RING: ON</button><button id="qreset">NEW GAME</button></div><p>Virtual item only; no real phone is hidden. May 2006 campus form remains provisional.</p>';
section.appendChild(hud);
const pad=document.createElement('div');pad.id='questpad';pad.setAttribute('aria-label','Walk controls');
pad.innerHTML='<button class="qup" data-go="up" aria-label="Walk north">▲</button><button class="qleft" data-go="left" aria-label="Walk west">◀</button><button class="qdown" data-go="down" aria-label="Walk south">▼</button><button class="qright" data-go="right" aria-label="Walk east">▶</button>';
section.appendChild(pad);
const pickup=document.createElement('button');pickup.id='questpickup';pickup.textContent='PICK UP RAZR';section.appendChild(pickup);
const help=document.createElement('div');help.id='questhelp';help.textContent='WASD / ARROWS · WALK';section.appendChild(help);
const dropSites=[{x:88,z:-40},{x:42,z:-46},{x:116,z:-40},{x:11,z:-42}];
let goal=dropSites[0],character={x:-48,z:-42,face:1},started=false,won=false,useGPS=false;
let lastTick=0,walkDistance=0;
const held=new Set();
let audioEnabled=true,audio=null,nextChirp=0;
function primeAudio(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio=audio||new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(e){}}
function chirp(){
 if(!audioEnabled||!audio||audio.state!=='running')return;
 try{const t=audio.currentTime;for(let i=0;i<4;i++){const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=i%2?784:659;osc.connect(gain);gain.connect(audio.destination);const when=t+i*.115;gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(.035,when+.015);gain.gain.exponentialRampToValueAtTime(.0001,when+.1);osc.start(when);osc.stop(when+.105);}}catch(e){}
}
const qStatus=s=>{$('qstatus').textContent=s;};
function between(){return Math.hypot(character.x-goal.x,character.z-goal.z);}
function trackCam(){const p=pr(character.x,character.z);xpan+=W*.48-p[0];ypan+=H*.58-p[1];}
function startGame(){
 primeAudio();started=true;won=false;useGPS=false;walkDistance=0;held.clear();
 goal=dropSites[Math.floor(Math.random()*dropSites.length)];
 character={x:-48,z:-42,face:1};
 $('qstart').textContent='PAUSE WALK';$('qstart').classList.add('on');
 $('qgps').classList.remove('on');$('qgps').textContent='GPS: OFF';
 pad.style.display='grid';pickup.style.display='none';help.style.display='block';
 mode('oblique');yaw=-.48;pitch=.91;zoom=Math.max(1.55,Math.min(2.3,W/350));trackCam();
 updateQuestState();render();
}
function stopGame(){
 started=false;pad.style.display='none';pickup.style.display='none';help.style.display='none';held.clear();
 $('qstart').textContent=won?'SEARCH AGAIN':'RESUME SEARCH';$('qstart').classList.remove('on');render();
}
function validPos(x,z){
 if(x<-347||x>332||z<-264||z>257)return false;
 for(const b of B)if(visible(b)&&inPoly(x,z,b.coordinates_m))return false;
 return true;
}
function updateQuestState(){
 if(!started)return;
 const d=between();
 if(won){qStatus('FOUND · MOTOROLA RAZR V3 · 1 MISSED CALL.');pickup.style.display='none';return;}
 if(useGPS&&!liveGeo){qStatus('GPS walk selected. Tap GPS ON above and allow location access.');pickup.style.display='none';return;}
 if(useGPS&&geoSimulated){qStatus('Demo GPS does not count. Use real GPS or virtual walking.');pickup.style.display='none';return;}
 if(useGPS&&liveGeo.accuracy>40){qStatus('GPS accuracy ±'+Math.round(liveGeo.accuracy)+'m. Improve signal to search.');pickup.style.display='none';return;}
 if(d<10){qStatus('THERE IT IS. A silver flip phone in the grass.');pickup.style.display='block';}
 else if(d<22){qStatus('A flash of silver catches the light...');pickup.style.display='none';}
 else if(d<47){qStatus('Brrring! A ringtone nearby. Keep looking.');pickup.style.display='none';}
 else if(d<85){qStatus('A distant ring carries across the lawn.');pickup.style.display='none';}
 else{qStatus('SEARCHING · Between Haas and the chapel, somewhere on the Green.');pickup.style.display='none';}
}
function spritePhone(x,y,s){
 ctx.save();ctx.translate(x,y);ctx.rotate(.45);
 ctx.shadowColor='#091918';ctx.shadowBlur=8*s;ctx.shadowOffsetY=3*s;
 ctx.fillStyle='#c6c9be';ctx.strokeStyle='#16221d';ctx.lineWidth=Math.max(1,s);
 ctx.beginPath();ctx.roundRect(-6*s,-12*s,12*s,12*s,2*s);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.roundRect(-6*s,1*s,12*s,12*s,2*s);ctx.fill();ctx.stroke();
 ctx.shadowBlur=0;ctx.fillStyle='#3d8192';ctx.fillRect(-4*s,-10*s,8*s,7*s);
 ctx.fillStyle='#505d56';
 for(let i=0;i<9;i++){const bx=(i%3-1)*3.2*s,by=Math.floor(i/3)*3*s+4*s;ctx.fillRect(bx-1*s,by-1*s,2*s,1.5*s);}
 ctx.fillStyle='#929a91';ctx.fillRect(-5*s,0,10*s,1.5*s);ctx.restore();
}
function drawCharacter(){
 const p=pr(character.x,character.z,0),x=p[0],y=p[1],s=Math.max(.8,Math.min(1.4,zoom/1.6));
 ctx.save();ctx.globalAlpha=.7;ctx.fillStyle='#142e26';ctx.beginPath();ctx.ellipse(x,y+2,7*s,3.5*s,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 ctx.strokeStyle='#11291f';ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(x-3*s,y-9*s);ctx.lineTo(x-4*s,y-1*s);ctx.moveTo(x+3*s,y-9*s);ctx.lineTo(x+3*s,y-1*s);ctx.stroke();
 ctx.fillStyle='#e4a16b';ctx.strokeStyle='#28392f';ctx.lineWidth=1*s;ctx.beginPath();ctx.roundRect(x-5*s,y-20*s,10*s,12*s,2*s);ctx.fill();ctx.stroke();
 ctx.fillStyle='#ebd0ac';ctx.beginPath();ctx.arc(x,y-24*s,5*s,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='#29392c';ctx.fillRect(x-5*s,y-28*s,10*s,3*s);
 ctx.fillStyle='#e9c998';ctx.beginPath();ctx.moveTo(x,y-34*s);ctx.lineTo(x-4.3*s,y-39*s);ctx.lineTo(x+4.3*s,y-39*s);ctx.closePath();ctx.fill();ctx.restore();
 if(!won&&between()<22){const f=pr(goal.x,goal.z,.6);spritePhone(f[0],f[1],Math.max(1,zoom*.8));if(between()<10){ctx.font='bold 11px ui-monospace,monospace';ctx.fillStyle='#ffdfa5';ctx.fillText('RAZR V3',f[0]-25,f[1]-25);}}
 if(won){const f=pr(goal.x,goal.z,0);ctx.strokeStyle='#f3c38c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(f[0],f[1],13+4*Math.sin(performance.now()/210),0,Math.PI*2);ctx.stroke();spritePhone(f[0],f[1],1.2);}
}
function drawQuest(){
 if(!started)return;ctx.save();
 if(worldMode!=='oblique'){
 const q=[pr(-80,-63),pr(158,-63),pr(158,-4),pr(-80,-4)];
 ctx.strokeStyle='#e4c69a';ctx.lineWidth=1.25;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(q[0][0],q[0][1]);for(let i=1;i<q.length;i++)ctx.lineTo(q[i][0],q[i][1]);ctx.closePath();ctx.stroke();ctx.setLineDash([]);
 }
 drawCharacter();ctx.restore();
}
const originalRender=render;render=function(){originalRender();drawQuest();};
const originalUpdateGeo=updateGeo;
updateGeo=function(coords,simulated){
 originalUpdateGeo(coords,simulated);
 if(started&&useGPS&&!simulated){
 const p=coordMeters(coords.latitude,coords.longitude);character.x=p.x;character.z=p.z;trackCam();updateQuestState();render();
 }else if(started&&useGPS)updateQuestState();
};
$('qstart').addEventListener('click',()=>{
 if(won){startGame();return;}
 if(!started){
 if($('qstart').textContent==='RESUME SEARCH'){started=true;pad.style.display=useGPS?'none':'grid';help.style.display='block';$('qstart').textContent='PAUSE WALK';$('qstart').classList.add('on');updateQuestState();render();}
 else startGame();
 }else stopGame();
});
$('qreset').addEventListener('click',startGame);
$('qaudio').addEventListener('click',()=>{audioEnabled=!audioEnabled;$('qaudio').textContent=audioEnabled?'RING: ON':'RING: OFF';if(audioEnabled){primeAudio();chirp();}});
$('qgps').addEventListener('click',()=>{
 if(!started)startGame();useGPS=!useGPS;
 $('qgps').textContent=useGPS?'GPS: ON':'GPS: OFF';$('qgps').classList.toggle('on',useGPS);pad.style.display=useGPS?'none':'grid';
 if(useGPS&&!geoSimulated&&liveGeo){const p=coordMeters(liveGeo.latitude,liveGeo.longitude);character.x=p.x;character.z=p.z;trackCam();}
 updateQuestState();render();
});
pickup.addEventListener('click',()=>{
 if(!started||won||between()>=10)return;
 if(useGPS&&(geoSimulated||!liveGeo||liveGeo.accuracy>40))return;
 won=true;held.clear();pad.style.display='none';$('qstart').textContent='SEARCH AGAIN';$('qstart').classList.remove('on');
 updateQuestState();render();
 try{localStorage.setItem('mz_muhlenberg_2006_razr_lastwin',JSON.stringify({date:new Date().toISOString(),distanceWalkedMeters:Math.round(walkDistance),gpsMode:useGPS,quest:'lost-razr-001'}));}catch(e){}
 if(navigator.vibrate)navigator.vibrate([100,90,120]);
});
for(const b of pad.querySelectorAll('button[data-go]')){
 const direction=b.dataset.go;
 const release=()=>{held.delete(direction);b.classList.remove('active');};
 b.addEventListener('pointerdown',e=>{e.preventDefault();if(!started||useGPS)return;held.add(direction);b.classList.add('active');b.setPointerCapture(e.pointerId);});
 b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
}
const keys={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
document.addEventListener('keydown',e=>{
 if(/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||''))return;
 const dir=keys[e.key.toLowerCase()];
 if(dir&&started&&!useGPS){held.add(dir);e.preventDefault();}
 if((e.key===' '||e.key.toLowerCase()==='e')&&started&&between()<10){pickup.click();e.preventDefault();}
});
document.addEventListener('keyup',e=>{const dir=keys[e.key.toLowerCase()];if(dir)held.delete(dir);});
window.addEventListener('blur',()=>held.clear());
function tick(now){
 const dt=Math.min(.06,(now-lastTick)/1000||.016);lastTick=now;
 if(started&&!won&&between()<72&&now>nextChirp){chirp();nextChirp=now+3200+between()*21;}
 if(started&&!won&&!useGPS){
 let dx=Number(held.has('right'))-Number(held.has('left')),dz=Number(held.has('up'))-Number(held.has('down'));
 if(dx||dz){
 const n=Math.hypot(dx,dz);dx/=n;dz/=n;
 const speed=26,nx=character.x+dx*speed*dt,nz=character.z+dz*speed*dt;let moved=false;
 if(validPos(nx,character.z)){character.x=nx;moved=true;}
 if(validPos(character.x,nz)){character.z=nz;moved=true;}
 if(moved){walkDistance+=speed*dt;character.face=dx>=0?1:-1;trackCam();updateQuestState();render();}
 }
 }
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.MZ_QUEST={
 getState:()=>({active:started,found:won,gpsMode:useGPS,avatar:{...character},distanceToPhone:Math.round(between()),searchRegion:'college green — schematic',goalHiddenUntilNear:true}),
 start:startGame,
 moveForTest:(x,z)=>{if(!started)startGame();character.x=x;character.z=z;trackCam();updateQuestState();render();},
 newGame:startGame
};
})();