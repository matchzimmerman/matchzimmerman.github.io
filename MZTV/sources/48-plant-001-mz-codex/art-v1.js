'use strict';
const $=id=>document.getElementById(id), canvas=$('art'),ctx=canvas.getContext('2d');
canvas.width=1920;canvas.height=1080;
const params=new URLSearchParams(location.search),broadcast=params.has('broadcast');
if(broadcast)document.body.classList.add('broadcast');
const requestedHour=Number(params.get('hour')??24);
let packet=null,mode='preview',hour=Number.isFinite(requestedHour)?Math.max(0,Math.min(48,requestedHour)):24,playing=false,archive=null;
const textures=new Map(),palette=['#ef4087','#edd936','#28bca8','#83b638','#ed7234','#29372c'];
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function leafTexture(l){
 const key=l.seed;if(textures.has(key))return textures.get(key);
 const c=document.createElement('canvas');c.width=256;c.height=512;const g=c.getContext('2d'),r=rng(l.seed);
 const path=new Path2D();path.moveTo(128,493);path.bezierCurveTo(48,440,4,264,57,147);path.bezierCurveTo(75,84,118,41,132,14);path.bezierCurveTo(146,73,237,136,225,270);path.bezierCurveTo(236,365,184,439,128,493);path.closePath();
 g.save();g.clip(path);g.fillStyle=palette[l.pigment];g.fillRect(0,0,256,512);
 // Ragged hand-painted swaths: stable texture, never a frame-wise noise field.
 for(let j=0;j<3;j++){let y=60+r()*375;g.fillStyle=palette[(l.pigment+2+j%3)%6];g.beginPath();g.moveTo(-30,y);for(let x=0;x<=300;x+=14)g.lineTo(x,y+Math.sin(x*.02+j)*27+r()*24);g.lineTo(300,y+35+r()*35);for(let x=300;x>=-30;x-=14)g.lineTo(x,y+38+Math.sin(x*.022+j)*24+r()*14);g.fill();}
 for(let j=0;j<38;j++){let x=r()*256,y=r()*512;g.fillStyle=j%3?'#182b25':'#f0e7bc';g.globalAlpha=.2+r()*.55;g.beginPath();g.ellipse(x,y,1+r()*3,2+r()*8,r(),0,Math.PI*2);g.fill();}
 g.globalAlpha=1;const shade=g.createLinearGradient(20,0,230,0);shade.addColorStop(0,'#05180b99');shade.addColorStop(.35,'#ffffff09');shade.addColorStop(.50,'#fffbd350');shade.addColorStop(.53,'#06231555');shade.addColorStop(.83,'#ffffff08');shade.addColorStop(1,'#071b1455');g.fillStyle=shade;g.fillRect(0,0,256,512);
 g.lineCap='round';for(let j=0;j<12;j++){const y=90+j*30;for(const side of [-1,1]){g.strokeStyle='#d6e9aa45';g.lineWidth=1.4;g.beginPath();g.moveTo(130,y+30);g.quadraticCurveTo(130+side*50,y+5,130+side*(45+Math.sin(j/12*Math.PI)*48),y-29);g.stroke();}}
 g.strokeStyle='#192f24bb';g.lineWidth=3;g.beginPath();g.moveTo(128,497);g.bezierCurveTo(142,370,117,180,132,14);g.stroke();g.strokeStyle='#eff2ba88';g.lineWidth=1;g.stroke();
 // Dry abrasion and slight defects stay with the leaf throughout its life.
 for(let j=0;j<650;j++){g.globalAlpha=.035+r()*.13;g.fillStyle=r()>.5?'#ffffff':'#081910';g.fillRect(r()*256,r()*512,.5+r()*1.8,1+r()*4);}
 g.globalAlpha=1;if(l.scar>.32){g.strokeStyle='#342d28';g.lineWidth=2+l.scar*4;g.beginPath();g.moveTo(45,270);g.lineTo(110,294);g.lineTo(74,301);g.stroke();}
 g.restore();g.strokeStyle='#172e2555';g.lineWidth=2;g.stroke(path);if(textures.size>=120)textures.delete(textures.keys().next().value);textures.set(key,c);return c;
}
function project(p){return[960+p[0]*1.05+p[2]*.33,873+p[1]*1.05-p[2]*.16];}
function line(g,pts,width,color){g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.beginPath();pts.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke();}
function draw(g,w,h,time){
 g.save();g.scale(w/1920,h/1080);g.fillStyle='#e9e6dc';g.fillRect(0,0,1920,1080);
 const bg=g.createRadialGradient(920,460,50,960,550,1100);bg.addColorStop(0,'#f8f5ec');bg.addColorStop(1,'#d7dbd0');g.fillStyle=bg;g.fillRect(0,0,1920,1080);
 // Quiet studio floor, registration and specimen pedestal.
 const sh=g.createRadialGradient(980,889,2,980,889,340);sh.addColorStop(0,'#273d283f');sh.addColorStop(.4,'#33462c15');sh.addColorStop(1,'#33462c00');g.save();g.translate(0,680);g.scale(1,.24);g.fillStyle=sh;g.fillRect(520,0,920,1800);g.restore();
 g.fillStyle='#d0d2c5';g.beginPath();g.ellipse(960,884,120,24,0,0,Math.PI*2);g.fill();g.fillStyle='#f0ede1';g.fillRect(840,863,240,17);g.beginPath();g.ellipse(960,861,120,24,0,0,Math.PI*2);g.fill();g.strokeStyle='#c1c6b8';g.lineWidth=1;g.stroke();
 if(packet){const s=packet.state,m=s.minute;
  // Every historical internode retains its coordinate; only newborn tissue interpolates.
  for(const a of [...s.axes].sort((a,b)=>a.points[0][2]-b.points[0][2])){
   let pts=a.points.map((p,i)=>{if(!i)return project(p);const prev=a.points[i-1],t=Math.min(1,Math.max(0,(m-p[3])/25));return project(p.map((v,k)=>k<3?prev[k]+(v-prev[k])*t:v));});
   const width=Math.max(2,8-a.id*.38+Math.min(3,m/650));line(g,pts,width,'#1c2923');line(g,pts.map(p=>[p[0]-1.4,p[1]]),width*.22,'#69724e');
   if(a.dormant){const p=pts.at(-1);g.fillStyle='#554332';g.beginPath();g.ellipse(...p,5,9,-.2,0,Math.PI*2);g.fill();}
  }
  const leaves=[...s.leaves].sort((a,b)=>a.point[2]-b.point[2]);
  for(const l of leaves){let age=m-l.birth,t=Math.min(1,Math.max(.01,age/95)),growth=t*t*(3-2*t),p=project(l.point),old=Math.max(0,(m-l.birth-1700)/1600);
   let sway=Math.sin(time*.00055+l.seed)*.013+Math.sin(time*.00021+l.axis)*.008;
   let angle=l.angle+sway+l.twist+Math.sign(l.angle)*old*.17,len=l.length*growth;
   const pet=24*growth,x=p[0]+Math.sin(angle)*pet,y=p[1]-Math.cos(angle)*pet;
   line(g,[p,[x,y]],2.5,'#263a29');g.save();g.translate(x,y);g.rotate(angle);g.scale(1-old*.12,1);g.shadowColor='#192d242b';g.shadowBlur=9;g.shadowOffsetX=6;g.shadowOffsetY=9;g.drawImage(leafTexture(l),-len*l.width,-len,len*l.width*2,len);g.restore();
  }
  // Seed husk and late persistent reproductive bracts, not an endless leaf count.
  g.fillStyle='#363a26';g.beginPath();g.ellipse(960,863,13,7,-.2,0,Math.PI*2);g.fill();
  if(m<150){let p=project([0,-5-m*.26,0]);line(g,[[960,864],p],3,'#30462b');g.fillStyle='#b1c04c';g.beginPath();g.ellipse(p[0]+5,p[1]-8,6,13,.35,0,Math.PI*2);g.fill();}
  if(m>2220){for(const a of s.axes.filter(a=>!a.dormant).slice(0,4)){const p=project(a.points.at(-1)),t=Math.min(1,(m-2220)/500);for(let k=0;k<3;k++){g.save();g.translate(...p);g.rotate((k-1)*.32);g.fillStyle=k%2?'#ced02e':'#e87848';g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-17*t,-35*t,-10*t,-64*t,0,-87*t);g.bezierCurveTo(22*t,-50*t,17*t,-19*t,0,0);g.fill();g.strokeStyle='#38412888';g.lineWidth=1;g.stroke();g.restore();}}}
  const hh=String(Math.floor(m/60)).padStart(2,'0'),mm=String(Math.floor(m%60)).padStart(2,'0');
  g.fillStyle='#263b30';g.font='12px monospace';g.fillText('SPECIMEN 001 / PAINTED MEMORY',72,962);g.fillText(`HOUR ${hh}:${mm} / ${m<180?'GERMINATION':m<900?'RAMIFICATION':m<2100?'ACCUMULATION':m<2880?'MATURATION':'AFTERLIFE'}`,72,986);
  g.textAlign='right';g.fillText(mode==='preview'?'EXHIBITION REPLAY / SPECIMEN 001':packet.started===null?'AWAITING GERMINATION':'LIVE / ARCHIVE SCORE + INTAKE',1848,962);g.fillStyle='#687568';g.fillText('48 HOURS OF CONSEQUENCES',1848,986);g.textAlign='left';
 }
 g.fillStyle='#273c30';g.fillRect(72,67,53,28);g.fillStyle='#f2f1df';g.font='bold 15px monospace';g.fillText('MZTV',79,86);g.fillStyle='#273c30';g.font='12px monospace';g.fillText('48 PLANT',140,86);g.strokeStyle='#71816c';g.lineWidth=1;g.beginPath();g.moveTo(72,110);g.lineTo(125,110);g.moveTo(1815,68);g.lineTo(1848,68);g.lineTo(1848,101);g.stroke();g.restore();
}
function selectHour(value){
 hour=Math.max(0,Math.min(48,value));if(!archive)return;
 const minute=hour*60;
 const axes=archive.axes.filter(a=>a.points[0][3]<=minute).map(a=>({id:a.id,points:a.points.filter(p=>p[3]<=minute),dormant:false}));
 for(const e of archive.transitions){if(e.minute>minute)break;const a=axes.find(a=>a.id===e.axis);if(a)a.dormant=e.kind==='dormancy';}
 packet={state:{minute,axes,leaves:archive.leaves.filter(l=>l.birth<=minute)},started:null};
 $('hour').value=hour;$('hourLabel').textContent=hour.toFixed(2);
 $('status').textContent=`HOUR ${String(Math.floor(hour)).padStart(2,'0')}:${String(Math.floor(minute%60)).padStart(2,'0')} · ${packet.state.leaves.length} LEAVES · ${axes.length} AXES`;
}
function setPlaying(value){playing=value;$('play').textContent=playing?'Pause lifecycle':'Play 48 hours';$('quickPlay').textContent=playing?'Pause lifecycle':'Play 48 hours';}
function togglePlayback(){if(!archive)return;if(!playing&&hour>=48)selectHour(0);setPlaying(!playing);}
$('toggle').onclick=()=>{$('desk').hidden=false;$('close').focus();};
$('close').onclick=()=>{$('desk').hidden=true;$('toggle').focus();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('desk').hidden=true;$('toggle').focus();}});
$('hour').oninput=()=>{setPlaying(false);selectHour(Number($('hour').value));};
$('play').onclick=togglePlayback;$('quickPlay').onclick=togglePlayback;
$('restart').onclick=()=>{selectHour(0);setPlaying(true);};
$('mature').onclick=()=>{setPlaying(false);selectHour(48);};
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('still').onclick=()=>{try{if(!packet)return;const c=document.createElement('canvas');c.width=3840;c.height=2160;draw(c.getContext('2d'),c.width,c.height,0);c.toBlob(blob=>{if(blob){download(blob,`painted-memory-hour-${hour.toFixed(2)}.png`);$('notice').textContent='4K still ready. Check your browser downloads.';}else $('notice').textContent='Could not export the still.';},'image/png');}catch(e){$('notice').textContent='Still export unavailable: '+e.message;}};
let lastFrame=0,lastTime=0;
function frame(time){
 const delta=lastTime?Math.min(100,time-lastTime):0;lastTime=time;
 if(playing&&archive&&!document.hidden){selectHour(hour+delta/2000);if(hour>=48)setPlaying(false);}
 if(time-lastFrame>32){draw(ctx,1920,1080,time);lastFrame=time;}
 requestAnimationFrame(frame);
}
fetch('./specimen-v1.json').then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}).then(data=>{archive=data;selectHour(hour);$('loading').hidden=true;}).catch(e=>{$('loading').textContent='The specimen could not load. Please reload this page.';$('notice').textContent=e.message;});
requestAnimationFrame(frame);
