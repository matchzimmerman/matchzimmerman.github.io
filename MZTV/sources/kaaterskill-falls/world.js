import * as THREE from 'three';
import {SITE,INKS,PLACES,ROUTES,LOWER_STAIR,stairCenters,LANDMARKS,height,populate,addSpray,animateEnvironment,weatherFallback,FOLIAGE,refreshFoliage} from './scene.js';

const $=s=>document.getElementById(s);
const clamp=(a,b,v)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const PI=Math.PI,TAU=2*PI;
const opts=new URLSearchParams(location.search);
const CAPTURE=opts.get('capture')==='1';
const FIXED_SHOT=opts.has('cam')?clamp(0,5,+opts.get('cam')||0):null;
let showInk=opts.get('ink')!=='0';
let wx=weatherFallback(),entered=false,mode='observe',soundOn=false,help=false;
let camIndex=FIXED_SHOT===null?0:FIXED_SHOT,shotUntil=performance.now()+14000;
let time=0,noticeUntil=0,now=performance.now();
const stage=$('stage'),keys=new Set();
const player=new THREE.Vector3(40,height(40,47),47),lookAt=new THREE.Vector3();
const velocity=new THREE.Vector3(),chase=new THREE.Vector3(72,114,42);
let yaw=-.63,pitch=.16,move=0,mouseDown=false;
let joyId=null,lookId=null,joyX=0,joyY=0,startX=0,startY=0,lookX=0,lookY=0;
let flyPos=new THREE.Vector3(98,120,54),flyYaw=-.5,flyPitch=-.25;
const focus=new THREE.Vector3();

const scene=new THREE.Scene();scene.background=new THREE.Color('#66777a');
scene.fog=new THREE.FogExp2('#8d9997',.0037);
const camera=new THREE.PerspectiveCamera(47,innerWidth/innerHeight,.08,2500);
const hemi=new THREE.HemisphereLight('#e8e4cd','#53686b',2.25);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff0cd',2.1);sun.position.set(-70,130,75);scene.add(sun);
const fill=new THREE.DirectionalLight('#8cc0cf',.65);fill.position.set(100,54,-90);scene.add(fill);
populate(scene);addSpray(scene);

// An anonymous human scale figure, distinct from HEADLAND's keeper.
const walker=new THREE.Group();
const coat=new THREE.Mesh(new THREE.ConeGeometry(.62,1.58,8),new THREE.MeshStandardMaterial({color:'#202943',roughness:1,flatShading:true}));
coat.position.y=1.0;coat.castShadow=true;walker.add(coat);
const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,1),new THREE.MeshStandardMaterial({color:'#ccae88',roughness:1}));
head.position.y=2.05;walker.add(head);
const pack=new THREE.Mesh(new THREE.BoxGeometry(.64,.79,.31),new THREE.MeshStandardMaterial({color:'#bf673e',roughness:1}));
pack.position.set(0,1.14,.43);walker.add(pack);scene.add(walker);

// Full-frame six-ink / etched-print display pass. The base remains true 3D.
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:CAPTURE});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.13;renderer.setPixelRatio(1);stage.appendChild(renderer.domElement);
}catch(e){$('load').textContent='WEBGL REQUIRED · '+e.message;throw e;}
const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true});
const screenScene=new THREE.Scene(),screenCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const passVert=['varying vec2 vUv;','void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}'].join('\n');
const passFrag=[
 'precision mediump float;',
 'uniform sampler2D uTex;uniform float uTime;uniform float uInk;uniform vec2 uRes;',
 'varying vec2 vUv;',
 'float n2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
 'void main(){',
 ' vec3 c=texture2D(uTex,vUv).rgb;',
 ' if(uInk<.5){gl_FragColor=vec4(c,1.);return;}',
 ' float lum=dot(c,vec3(.27,.60,.13));',
 ' vec2 p=gl_FragCoord.xy;',
 ' float grain=(n2(floor(p))-.5)*.056;',
 ' float hatch=sin((p.x*.83+p.y*.38)*.40+sin(p.y*.018)*.4);',
 ' float cross=sin((-p.x*.34+p.y*.86)*.48);',
 ' float level=lum+grain+.075*(hatch+cross)*(1.-lum);',
 ' vec3 ink=vec3(.106,.122,.227);',
 ' vec3 deep=vec3(.173,.243,.478);',
 ' vec3 sea=vec3(.247,.604,.651);',
 ' vec3 hot=vec3(.941,.376,.247);',
 ' vec3 glow=vec3(.949,.757,.306);',
 ' vec3 paper=vec3(.937,.902,.812);',
 ' vec3 col=ink;',
 ' if(level>.18)col=deep;',
 ' if(level>.35)col=sea;',
 ' if(level>.54)col=glow;',
 ' if(level>.73)col=paper;',
 ' if(c.r>c.g*1.16 && c.r>c.b*1.23 && level>.26 && level<.78)col=mix(hot,glow,smoothstep(.45,.75,level)*.56);',
 ' if(c.g>c.r*1.22 && level>.33 && level<.68)col=mix(deep,sea,.72);',
 ' float rough=(n2(floor(p*.45))-.5)*.045;',
 ' col*=1.+rough;',
 ' gl_FragColor=vec4(col,1.);',
 '}'].join('\n');
const print=new THREE.ShaderMaterial({uniforms:{uTex:{value:target.texture},uInk:{value:showInk?1:0},uTime:{value:0},uRes:{value:new THREE.Vector2()}},
 vertexShader:passVert,fragmentShader:passFrag,depthTest:false,depthWrite:false});
screenScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),print));
function resize(){
 const w=Math.max(2,innerWidth),h=Math.max(2,innerHeight);
 renderer.setSize(w,h,false);
 const scale=opts.has('lines')?clamp(.25,1,+opts.get('lines')/h):((matchMedia('(pointer:coarse)').matches||w<750)?Math.min(1,460/h):Math.min(1,710/h));
 target.setSize(Math.max(2,Math.round(w*scale)),Math.max(2,Math.round(h*scale)));
 print.uniforms.uRes.value.set(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();

// At present weather drives the atmosphere and illustrative flow, not measured discharge.
async function updateWeather(){
 try{
  const url='https://api.open-meteo.com/v1/forecast?latitude='+SITE.lat+'&longitude='+SITE.lon+
   '&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m&timezone=America%2FNew_York';
  const c=new AbortController();const timer=setTimeout(()=>c.abort(),7000);
  let r;try{r=await fetch(url,{cache:'no-store',signal:c.signal});}finally{clearTimeout(timer);}
  if(!r.ok)throw new Error(String(r.status));
  const json=await r.json(),v=json.current;if(!v||!Number.isFinite(v.cloud_cover))throw new Error('no current data');
  wx={live:true,temp:v.temperature_2m,cloud:v.cloud_cover,rain:v.precipitation||0,wind:(v.wind_speed_10m||0)/3.6,
    flow:clamp(.55,2.1,.75+(v.precipitation||0)*.22)};
 }catch(e){wx={...wx,live:false};}
}
updateWeather();setInterval(updateWeather,15*60*1000);
function eastern(){
 return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
}
// DAYLIGHT LOCK: the camera clock may advance, but the sun never sets.
 // Solar height represents a clear local *daytime* sun for the current season.
 // New York time sets the phenology/date, not the light/dark cycle.
function lighting(){
 const lat=SITE.lat*PI/180,dec=(23.44*PI/180)*Math.sin(TAU*(FOLIAGE.doy-81)/365.2422);
 const hourAngle=15*PI/180; // approximately 1 PM solar time, year-round
 const altitude=Math.asin(Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(hourAngle));
 const angle=Math.max(19*PI/180,altitude);
 const cloud=clamp(0,1,wx.cloud/100);
 const brightness=1-cloud*.19;
 hemi.intensity=1.9*brightness;
 sun.intensity=2.35*(1-cloud*.37);
 fill.intensity=.65*brightness;
 sun.position.set(-187*Math.cos(angle)*.83,187*Math.sin(angle),187*Math.cos(angle)*.56);
 const sky=new THREE.Color('#b2c9c9').lerp(new THREE.Color('#9babaf'),cloud*.65);
 scene.background.copy(sky);scene.fog.color.copy(sky);
 scene.fog.density=.0034+cloud*.0012+wx.rain*.0003;
}
lighting();

// Six observational shots, with a slow drift inside each shot.
const SHOTS=[
 {name:'THE TWO FALLS',p:[105,119,-116],t:[0,53,-9],fov:46},
 {name:'LAUREL HOUSE OVERLOOK',p:[46,113,50],t:[0,51,7],fov:48},
 {name:'MIDDLE POOL',p:[42,58,-12],t:[0,52,4],fov:56},
 {name:'STONE STAIR',p:[100,71,-70],t:[49,32,-54],fov:49},
 {name:'LOWER CASCADE',p:[25,21,-112],t:[0,37,-33],fov:58},
 {name:'THE GORGE FROM ABOVE',p:[8,164,-86],t:[0,40,-34],fov:42}
];
function nextShot(){
 camIndex=(camIndex+1)%SHOTS.length;shotUntil=performance.now()+14000;
 notice(SHOTS[camIndex].name);
}
function notice(str){
 $('notice').textContent=str;$('notice').classList.add('show');
 noticeUntil=performance.now()+2600;
}
function setMode(next){
 if(next==='observe'&&mode==='fly')flyPos.copy(camera.position);
 mode=next;
 if(next==='fly'){
  flyPos.copy(camera.position);const f=new THREE.Vector3();camera.getWorldDirection(f);
  flyYaw=Math.atan2(f.x,-f.z);flyPitch=Math.asin(clamp(-1,1,f.y));
 }
 $('mode').textContent=next==='observe'?'AUTONOMOUS CAMERA':next==='walk'?'WALKING THE TRAIL':'DEVELOPER / FREE FLIGHT';
 $('walk').textContent=next==='walk'?'OBSERVE [V]':'WALK [V]';
 $('fly').textContent=next==='fly'?'EXIT FLY [F]':'FLY [F]';
 walker.visible=next==='walk';
 velocity.set(0,0,0);
 notice(next==='observe'?'MZCAM · OBSERVING':next==='walk'?'FIELD WALK · USE WASD':'FREE FLIGHT · SPACE / Q FOR ALTITUDE');
}
function jump(i){
 const p=PLACES[clamp(0,PLACES.length-1,i)];
 player.set(p.x,height(p.x,p.z),p.z);
 yaw=-.63;pitch=.12;chase.set(p.x+8,player.y+8,p.z+14);
 setMode('walk');notice(p.name);
}
function moveWalker(dt){
 const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-joyY;
 const right=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joyX;
 const m=Math.hypot(forward,right)||1,spd=keys.has('shift')?8:4.1;
 const sx=(Math.sin(yaw)*forward+Math.cos(yaw)*right)/Math.max(1,m)*spd;
 const sz=(-Math.cos(yaw)*forward+Math.sin(yaw)*right)/Math.max(1,m)*spd;
 const a=1-Math.exp(-dt*10);velocity.x=lerp(velocity.x,sx,a);velocity.z=lerp(velocity.z,sz,a);
 let x=clamp(-146,146,player.x+velocity.x*dt),z=clamp(-164,135,player.z+velocity.z*dt);
 const before=height(player.x,player.z),after=height(x,z);
 if(Math.abs(after-before)>2.4){x=player.x;z=player.z;velocity.multiplyScalar(.15);}
 const y=height(x,z);player.set(x,lerp(player.y,y,1-Math.exp(-dt*18)),z);
 move=Math.hypot(velocity.x,velocity.z);
 walker.position.copy(player);walker.rotation.y=yaw;coat.rotation.z=Math.sin(time*7)*.024*move/4;
 const f=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
 const desired=player.clone().addScaledVector(f,-8.8).add(new THREE.Vector3(0,4.0+pitch*6,0));
 // Prevent camera from being buried in steep slopes.
 desired.y=Math.max(desired.y,height(desired.x,desired.z)+2.0);
 chase.lerp(desired,1-Math.exp(-dt*3.8));
 camera.position.copy(chase);
 focus.copy(player).add(new THREE.Vector3(0,1.4+pitch*4,0));
 camera.lookAt(focus);camera.fov=53;camera.updateProjectionMatrix();
}
function moveFly(dt){
 const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-joyY;
 const right=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joyX;
 const up=(keys.has(' ')?1:0)-(keys.has('q')?1:0),spd=keys.has('shift')?75:26;
 const f=new THREE.Vector3(Math.sin(flyYaw)*Math.cos(flyPitch),Math.sin(flyPitch),-Math.cos(flyYaw)*Math.cos(flyPitch));
 const r=new THREE.Vector3(Math.cos(flyYaw),0,Math.sin(flyYaw));
 flyPos.addScaledVector(f,forward*spd*dt).addScaledVector(r,right*spd*dt);
 flyPos.y+=up*spd*dt;flyPos.y=clamp(2,410,flyPos.y);
 camera.position.copy(flyPos);camera.lookAt(flyPos.clone().add(f));camera.fov=55;camera.updateProjectionMatrix();
}
function moveDirector(dt,t){
 if(FIXED_SHOT===null&&performance.now()>shotUntil)nextShot();
 const s=SHOTS[camIndex],phase=t*.021;
 const desired=new THREE.Vector3(...s.p).add(new THREE.Vector3(Math.sin(phase)*2.8,Math.sin(phase*.69)*1.8,Math.cos(phase)*1.7));
 const aim=new THREE.Vector3(...s.t);
 const a=1-Math.exp(-dt*(dt>1?2:1.5));
 camera.position.lerp(desired,a);
 focus.lerp(aim,a);camera.lookAt(focus);
 camera.fov=lerp(camera.fov,s.fov,1-Math.exp(-dt*2));camera.updateProjectionMatrix();
}
let audio=null;
function startSound(){
 if(audio)return audio;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;const ctx=new AC();
  const len=ctx.sampleRate*3,buffer=ctx.createBuffer(1,len,ctx.sampleRate),a=buffer.getChannelData(0);
  let brown=0;for(let i=0;i<len;i++){brown=(brown+(.65*Math.random()-.325))*.996;a[i]=clamp(-1,1,brown*2.4)*.47+(Math.random()-.5)*.23;}
  const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
  const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=1600;
  const gain=ctx.createGain();gain.gain.value=0;
  source.connect(low);low.connect(gain);gain.connect(ctx.destination);source.start();
  audio={ctx,source,low,gain};return audio;
 }catch(e){notice('AUDIO UNAVAILABLE');return null;}
}
function setSound(on){
 soundOn=on;const a=on?startSound():audio;
 if(a){a.ctx.resume().catch(()=>{});a.gain.gain.setTargetAtTime(on?.27:0,a.ctx.currentTime,.12);}
 $('sound').textContent=on?'SOUND ON [M]':'SOUND OFF [M]';
 $('sound').setAttribute('aria-pressed',String(on));
}
function updateAudio(){
 if(!audio||!soundOn)return;
 const p=mode==='walk'?player:camera.position;
 const d=Math.min(Math.hypot(p.x,p.y-48,p.z-13),Math.hypot(p.x,p.y-20,p.z+34));
 const proximity=1/(1+d/85);
 audio.gain.gain.setTargetAtTime(.1+.28*proximity*wx.flow,audio.ctx.currentTime,.5);
 audio.low.frequency.setTargetAtTime(690+1400*proximity,audio.ctx.currentTime,.6);
}

// Input / navigation
function enteredWorld(which){
 entered=true;$('gate').hidden=true;setMode(which);
 $('stage').focus?.();last=performance.now();
 if(which==='walk')jump(0);
}
$('enter').addEventListener('click',()=>enteredWorld('walk'));
$('watch').addEventListener('click',()=>enteredWorld('observe'));
$('walk').addEventListener('click',()=>setMode(mode==='walk'?'observe':'walk'));
$('camera').addEventListener('click',()=>{if(mode!=='observe')setMode('observe');nextShot()});
$('fly').addEventListener('click',()=>setMode(mode==='fly'?'walk':'fly'));
$('sound').addEventListener('click',()=>setSound(!soundOn));
function toggleGuide(on){help=on;$('guide').hidden=!on;}
$('help').addEventListener('click',()=>toggleGuide(true));
$('closeHelp').addEventListener('click',()=>toggleGuide(false));
const blocked=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','shift']);
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(blocked.has(k)&&entered)e.preventDefault();
 keys.add(k);
 if(!entered||e.repeat)return;
 if(k==='v')setMode(mode==='walk'?'observe':'walk');
 if(k==='f')setMode(mode==='fly'?'walk':'fly');
 if(k==='c'){if(mode!=='observe')setMode('observe');nextShot()}
 if(k==='m')setSound(!soundOn);
 if(k==='?'||k==='h')toggleGuide(!help);
 if(k==='escape')toggleGuide(false);
 if('12345'.includes(k)&&k.length===1)jump(Number(k)-1);
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>{keys.clear();joyId=lookId=null;joyX=joyY=0;});
stage.addEventListener('pointerdown',e=>{
 if(!entered||help)return;
 stage.setPointerCapture?.(e.pointerId);
 if(e.pointerType==='touch'){
  if(e.clientX<innerWidth*.46&&joyId===null){
   joyId=e.pointerId;startX=e.clientX;startY=e.clientY;
  }else if(lookId===null){lookId=e.pointerId;lookX=e.clientX;lookY=e.clientY;}
 }else{mouseDown=true;lookX=e.clientX;lookY=e.clientY;}
 e.preventDefault();
});
stage.addEventListener('pointermove',e=>{
 if(!entered||help)return;
 if(e.pointerType==='touch'){
  if(e.pointerId===joyId){
   joyX=clamp(-1,1,(e.clientX-startX)/49);joyY=clamp(-1,1,(e.clientY-startY)/49);
   const l=Math.max(1,Math.hypot(joyX,joyY));joyX/=l;joyY/=l;
   $('nub').style.transform='translate('+(joyX*31)+'px,'+(joyY*31)+'px)';
  }else if(e.pointerId===lookId){
   const dx=e.clientX-lookX,dy=e.clientY-lookY;turn(dx,dy);
   lookX=e.clientX;lookY=e.clientY;
  }
 }else if(mouseDown){turn(e.clientX-lookX,e.clientY-lookY);lookX=e.clientX;lookY=e.clientY;}
});
function turn(dx,dy){
 if(mode==='fly'){flyYaw+=dx*.004;flyPitch=clamp(-1.25,1.25,flyPitch-dy*.003);}
 else{yaw+=dx*.004;pitch=clamp(-.48,.75,pitch-dy*.003);}
}
function pointerEnd(e){
 if(e.pointerId===joyId){joyId=null;joyX=joyY=0;$('nub').style.transform='translate(0,0)';}
 if(e.pointerId===lookId)lookId=null;
 if(e.pointerType!=='touch')mouseDown=false;
}
stage.addEventListener('pointerup',pointerEnd);
stage.addEventListener('pointercancel',pointerEnd);
const map=$('map'),g2=map.getContext('2d');
const mx=x=>(x+155)/310*map.width,mz=z=>(147-z)/310*map.height;
map.addEventListener('click',e=>{
 if(!entered)return;
 const r=map.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*map.width,z=(e.clientY-r.top)/r.height*map.height;
 let best=0,d=Infinity;
 PLACES.forEach((p,i)=>{const dis=Math.hypot(mx(p.x)-x,mz(p.z)-z);if(dis<d){best=i;d=dis;}});
 jump(best);
});
function survey(){
 const c=g2,W=map.width,H=map.height;
 c.fillStyle='#1b1f3a';c.fillRect(0,0,W,H);
 // Height-contour snapshots from the SAME geometry function as the 3D world.
 for(let x=-155;x<155;x+=7)for(let z=-165;z<145;z+=7){
  const y=height(x,z),n=clamp(0,1,(y-3)/112);
  const r=Math.round(48+62*n),gg=Math.round(78+47*n),b=Math.round(77+25*n);
  c.fillStyle='rgb('+r+','+gg+','+b+')';
  c.fillRect(mx(x),mz(z+7),map.width*7/310+1,map.height*7/310+1);
 }
 c.strokeStyle='#b2b8a2';c.lineWidth=1.2;
 for(const route of ROUTES){
  c.beginPath();route.forEach((p,i)=>{if(i===0)c.moveTo(mx(p[0]),mz(p[1]));else c.lineTo(mx(p[0]),mz(p[1]));});c.stroke();
 }
 // Lower stair highlighted in warm print ink.
 c.strokeStyle='#f2c14e';c.lineWidth=3;c.beginPath();
 LOWER_STAIR.forEach((p,i)=>{if(i)c.lineTo(mx(p[0]),mz(p[1]));else c.moveTo(mx(p[0]),mz(p[1]));});c.stroke();
 for(const z of [13,-34]){c.fillStyle='#6db4c2';c.beginPath();c.arc(mx(0),mz(z),5,0,TAU);c.fill();}
 PLACES.forEach((p,i)=>{
  const x=mx(p.x),z=mz(p.z);
  c.fillStyle='#efe6cf';c.strokeStyle='#1b1f3a';c.lineWidth=2;
  c.beginPath();c.arc(x,z,5.4,0,TAU);c.fill();c.stroke();
  c.fillStyle='#1b1f3a';c.font='bold 13px monospace';c.fillText(String(i+1),x+7,z-5);
 });
 if(mode==='walk'){
  const x=mx(player.x),y=mz(player.z);
  c.fillStyle='#f0603f';c.strokeStyle='#1b1f3a';c.lineWidth=2;
  c.beginPath();c.moveTo(x+Math.sin(yaw)*13,y-Math.cos(yaw)*13);
  c.lineTo(x-8,y+8);c.lineTo(x+8,y+8);c.closePath();c.fill();c.stroke();
 }
 c.font='bold 12px monospace';c.fillStyle='#efe6cf';c.fillText('N ↑',15,19);
}
function updateUI(){
 $('clock').textContent='DAYLIGHT LOCK · '+FOLIAGE.label.toUpperCase();
 $('season').textContent='FOLIAGE · '+FOLIAGE.phase+' · SEASONAL MODEL';
 $('wx').textContent='WIND '+wx.wind.toFixed(1)+' M/S · CLOUD '+wx.cloud.toFixed(0)+'%';
 $('discharge').textContent='WATER '+wx.flow.toFixed(2)+' × · MODELLED FLOW';
 let label='TWO DROPS · 260 FT TOTAL',detail='175 FT UPPER / 85 FT LOWER · SPRUCE CREEK';
 if(mode==='observe'){label=SHOTS[camIndex].name;detail='AUTONOMOUS CAMERA · SHIFT EVERY 14 SECONDS';}
 if(mode==='fly'){label='FREE CAMERA · '+Math.round(flyPos.y)+' M';detail='SURVEY VIEW · WORLD UNITS ARE APPROXIMATE';}
 if(mode==='walk'){
  let best=PLACES[0],dist=Infinity;
  for(const p of PLACES){const d=Math.hypot(player.x-p.x,player.z-p.z);if(d<dist){best=p;dist=d;}}
  label=dist<38?best.name:'IN THE WOODED GORGE';
  detail='SPEED '+move.toFixed(1)+' M/S · ELEVATION '+player.y.toFixed(0)+' MODEL M';
 }
 $('place').textContent=label;$('details').textContent=detail;
 survey();
}
function render(){
 renderer.setRenderTarget(target);renderer.render(scene,camera);
 renderer.setRenderTarget(null);renderer.render(screenScene,screenCam);
}
let last=performance.now(),uiAt=0,lastDateCheck=0;
function tick(nowMs){
 const dt=clamp(0,.045,(nowMs-last)/1000);last=nowMs;
 time+=dt;
 // A long-running MZTV world advances its autumn canopy at New York midnight.
 if(nowMs-lastDateCheck>120000){refreshFoliage();lastDateCheck=nowMs;}
 animateEnvironment(time,wx);
 if(entered&&!help){
  if(mode==='walk')moveWalker(dt);
  else if(mode==='fly')moveFly(dt);
  else moveDirector(dt,time);
 }else if(!entered){moveDirector(dt,time);}
 lighting();updateAudio();print.uniforms.uTime.value=time;
 print.uniforms.uInk.value=showInk?1:0;
 if(nowMs-uiAt>250){updateUI();uiAt=nowMs;}
 if(nowMs>noticeUntil)$('notice').classList.remove('show');
 render();if(!CAPTURE)requestAnimationFrame(tick);
}
const initial=SHOTS[camIndex];camera.position.set(...initial.p);focus.set(...initial.t);camera.lookAt(focus);camera.fov=initial.fov;camera.updateProjectionMatrix();
walker.visible=false;
$('load').textContent='READY · STONE / WATER / SIX INKS';
if(!CAPTURE)requestAnimationFrame(tick);
window.MZ={
 tick(dt=1/30){tick(last+dt*1000)},
 observe(i){if(Number.isInteger(i))camIndex=clamp(0,SHOTS.length-1,i);setMode('observe');},
 walk(){setMode('walk');},
 jump(i){jump(i);},
 fly(){setMode('fly');},
 ink(on){showInk=!!on;},
 weather(){return {...wx}},
 height,
 places:PLACES,
 routes:ROUTES,
 stairs:stairCenters,
 site:SITE,
 screenshot(){return renderer.domElement.toDataURL('image/png')},
 get state(){return {mode,player:player.toArray(),camera:camera.position.toArray(),shot:SHOTS[camIndex].name,wx:{...wx}}}
};
