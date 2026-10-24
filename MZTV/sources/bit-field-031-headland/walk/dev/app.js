(()=>{"use strict";
const $=id=>document.getElementById(id),iframe=$("world"),hit=$("hit"),KEY="mz-headland-builder-v1",SCHEMA="mz.headland.layout.v1";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),fmt=n=>Number(n).toFixed(2),textBytes=t=>new TextEncoder().encode(t);
let api=null,ready=false,entered=false,mode="fly",selected="",yaw=0,pitch=-.24,speed=12,last=performance.now();
const eye={x:62,y:48,z:173},keys=new Set(),photos=[],undoStack=[],redoStack=[];
let drag=null,lookDrag=null;
const say=t=>$("message").textContent=t;
const locations=()=>api.listBuilderAssets();
const layout=()=>locations().map(a=>({id:a.id,x:+a.x.toFixed(3),z:+a.z.toFixed(3),r:+a.r.toFixed(5)}));
const snapshot=()=>JSON.stringify(layout());
function remember(){undoStack.push(snapshot());if(undoStack.length>70)undoStack.shift();redoStack.length=0}
function apply(arr){
 for(const row of arr)api.moveBuilderAsset(row.id,row.x,row.z,row.r);
 refresh();
}
function validate(o){
 if(o?.schema!==SCHEMA||!Array.isArray(o.assets))throw Error("Expected HEADLAND layout JSON v1");
 const valid=new Set(locations().map(x=>x.id)),seen=new Set();
 for(const a of o.assets){
  if(!a||!valid.has(a.id)||seen.has(a.id)||![a.x,a.z,a.r].every(Number.isFinite)||Math.abs(a.x)>400||Math.abs(a.z)>450||Math.abs(a.r)>Math.PI*2+.001)
   throw Error("Invalid asset ID or coordinate: "+String(a?.id));
  seen.add(a.id);
 }
 return o.assets;
}
function saveDraft(){
 try{localStorage.setItem(KEY,JSON.stringify({schema:SCHEMA,assets:layout(),savedAt:new Date().toISOString()}));$("statusLine").textContent="BROWSER DRAFT SAVED"}catch(e){say("Local save unavailable; export JSON or ZIP")}
}
function review(){
 return {schema:SCHEMA,world:"MZTV/BIT-FIELD-031/HEADLAND",coordinateSystem:"HEADLAND X and Z world units; R rotation radians about Y",baseScene:"walk/editable-scenes.js",savedAt:new Date().toISOString(),assets:layout(),
 photos:photos.map(p=>({file:p.file,comment:p.comment,camera:p.camera,asset:p.asset,createdAt:p.createdAt})),
 publication:"Local browser draft only. Requires review and GitHub commit to publish a shared world."};
}
function fileSave(data,name,type="application/octet-stream"){
 const blob=data instanceof Blob?data:new Blob([data],{type});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function refresh(){
 const a=locations().find(x=>x.id===selected);
 $("asset").value=a?.id||"";
 for(const [k,v] of [["xx",a?.x],["zz",a?.z],["rr",a?.r*180/Math.PI]])$(k).value=v==null?"":fmt(v);
}
function select(id){
 const a=locations().find(x=>x.id===id);selected=a?.id||"";refresh();
 if(a)say("SELECTED "+a.title+" ["+a.id+"] · drag in Builder or enter coordinates");
}
function move(x,z,r,push=true){
 if(!selected||![x,z,r].every(Number.isFinite))return say("Choose an asset and valid coordinates");
 if(push)remember();
 if(!api.moveBuilderAsset(selected,x,z,r)){if(push)undoStack.pop();return say("Move outside supported world bounds")}
 refresh();saveDraft();
}
function undo(){
 if(!undoStack.length)return;
 redoStack.push(snapshot());apply(JSON.parse(undoStack.pop()));saveDraft();say("UNDO: former layout restored");
}
function redo(){
 if(!redoStack.length)return;
 undoStack.push(snapshot());apply(JSON.parse(redoStack.pop()));saveDraft();say("REDO: layout restored");
}
function modeSet(m){
 mode=m;drag=null;lookDrag=null;
 if(document.pointerLockElement===hit)document.exitPointerLock();
 $("fly").classList.toggle("active",m==="fly");
 $("build").classList.toggle("active",m==="build");
 $("side").hidden=m==="fly"&&$("side").dataset.pinned!=="yes";
 $("modeInfo").textContent=m==="fly"
 ?"FLY CAMERA · WASD move · mouse look · SPACE/C height · SHIFT faster · wheel speed · P photo"
 :"3D BUILDER · click assets to select · drag on ground · right-drag to look · coordinate inspector · CTRL+Z undo";
 hit.style.cursor=m==="build"?"pointer":"crosshair";
 $("statusLine").textContent=m==="fly"?"DEVELOPER MODE · FREE CAMERA":"3D BUILDER MODE · EDITABLE WORLD";
}
function photoDownload(p){fetch(p.data).then(r=>r.blob()).then(b=>fileSave(b,p.file,"image/png")).catch(e=>say(e.message))}
function capture(){
 if(!api||!entered)return;
 try{
  api.tick(0);const png=api.captureBuilderFrame();
  const createdAt=new Date().toISOString(),file="HEADLAND_"+createdAt.replace(/[:.]/g,"-")+"_X"+Math.round(eye.x)+"_Z"+Math.round(eye.z)+".png";
  const p={data:png,file,createdAt,comment:$("note").value.trim(),asset:selected||null,camera:{x:eye.x,y:eye.y,z:eye.z,yaw,pitch,fov:70}};
  photos.push(p);$("note").value="";
  const div=document.createElement("div");div.className="shot";
  const title=document.createElement("b");title.textContent=file;
  const info=document.createElement("div");info.textContent=p.comment||"No field note";
  const btn=document.createElement("button");btn.textContent="DOWNLOAD PNG";btn.addEventListener("click",()=>photoDownload(p));
  div.append(title,info,btn);$("shots").prepend(div);say("PHOTO SAVED IN REVIEW SESSION · "+photos.length+" capture(s)");
 }catch(e){say("Capture failed: "+e.message);console.error(e)}
}
function crcTable(){const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t}
const CRC=crcTable();
function crc(bytes){let c=0xffffffff;for(let i=0;i<bytes.length;i++)c=CRC[(c^bytes[i])&255]^(c>>>8);return(c^0xffffffff)>>>0}
function makeZip(files){
 const local=[],central=[];let offset=0;
 for(const f of files){
  const name=textBytes(f.name),len=f.bytes.length,sum=crc(f.bytes);
  const header=new Uint8Array(30+name.length),h=new DataView(header.buffer);
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);
  h.setUint32(14,sum,true);h.setUint32(18,len,true);h.setUint32(22,len,true);h.setUint16(26,name.length,true);header.set(name,30);
  local.push(header,f.bytes);
  const d=new Uint8Array(46+name.length),v=new DataView(d.buffer);
  v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);
  v.setUint32(16,sum,true);v.setUint32(20,len,true);v.setUint32(24,len,true);v.setUint16(28,name.length,true);
  v.setUint32(42,offset,true);d.set(name,46);central.push(d);offset+=header.length+len;
 }
 const size=central.reduce((n,a)=>n+a.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
 e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);
 e.setUint32(12,size,true);e.setUint32(16,offset,true);
 return new Blob([...local,...central,end],{type:"application/zip"});
}
async function pack(){
 if(!api)return;
 $("statusLine").textContent="PREPARING AGENT REVIEW ZIP…";
 try{
  const instructions=["MZTV / HEADLAND 3D BUILDER REVIEW","",
   "Includes layout.json with stable asset IDs, exact coordinates, rotations, and photo references.",
   "Photos are unaltered pixels captured directly from HEADLAND WebGL renderer.",
   "Coords: +X east, +Z inland, -Z sea. Rotation r = radians around Y.",
   "Import JSON using Developer Mode. To publish for everyone, review and commit its assets to walk/layouts/published.json.",
   "Original HEADLAND broadcast has NOT been edited."].join("\n");
  const files=[{name:"HEADLAND_LAYOUT.json",bytes:textBytes(JSON.stringify(review(),null,2))},
   {name:"README.txt",bytes:textBytes(instructions)}];
  for(const p of photos){const data=await(await fetch(p.data)).arrayBuffer();files.push({name:"photos/"+p.file,bytes:new Uint8Array(data)})}
  fileSave(makeZip(files),"HEADLAND_BUILDER_REVIEW_"+new Date().toISOString().slice(0,10)+".zip","application/zip");
  $("statusLine").textContent="REVIEW ZIP READY";say("ZIP contains JSON layout, "+photos.length+" PNG(s), notes and coordinates.");
 }catch(e){say("Review ZIP failed: "+e.message)}
}
function ndc(e){const r=hit.getBoundingClientRect();return [(e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2]}
function look(dx,dy){yaw+=dx*.0028;pitch=clamp(pitch-dy*.0028,-1.4,1.4)}
function tick(t){
 const dt=clamp((t-last)/1000,0,.05);last=t;
 if(entered&&api){
  const f=(keys.has("w")||keys.has("arrowup")?1:0)-(keys.has("s")||keys.has("arrowdown")?1:0);
  const r=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0);
  const u=(keys.has(" ")?1:0)-(keys.has("c")?1:0);
  const v=speed*(keys.has("shift")?3.5:1)*dt/Math.max(1,Math.hypot(f,r,u));
  eye.x+=v*(Math.sin(yaw)*f+Math.cos(yaw)*r);
  eye.z+=v*(-Math.cos(yaw)*f+Math.sin(yaw)*r);
  eye.y+=v*u;
  eye.x=clamp(eye.x,-330,350);eye.y=clamp(eye.y,-9,500);eye.z=clamp(eye.z,-380,400);
  const cp=Math.cos(pitch);
  api.look([eye.x,eye.y,eye.z],[eye.x+100*Math.sin(yaw)*cp,eye.y+100*Math.sin(pitch),eye.z-100*Math.cos(yaw)*cp],70);
  api.tick(dt);
  if(Math.floor(t/250)!==Math.floor((t-dt*1000)/250)){
   $("statusLine").textContent=(mode==="fly"?"FLY":"BUILDER")+" · X "+fmt(eye.x)+" · Y "+fmt(eye.y)+" · Z "+fmt(eye.z)+" · SPEED "+Math.round(speed);
  }
 }
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
let approvedLayout=null;
async function boot(){
 try{
  const [a,b,c,published]=await Promise.all([
   fetch("../../index.html",{cache:"no-store"}),
   fetch("../editable-scenes.js",{cache:"no-store"}),
   fetch("./engine-api.js",{cache:"no-store"}),
   fetch("../layouts/published.json",{cache:"no-store"}).catch(()=>null)]);
  if(published?.ok){
   try{const x=await published.json();if(x.schema===SCHEMA&&Array.isArray(x.assets))approvedLayout=x.assets}
   catch(e){console.warn("Approved layout unavailable",e)}
  }
  if(!a.ok||!b.ok||!c.ok)throw Error("Unable to load original world, editable meshes or developer API");
  let world=await a.text();
  const patches=[
   ["const Q = new URLSearchParams(location.search);","const Q = new URLSearchParams('?info=0&seed=31081&capture=1&audio=0&live=0&hour=14&lines="+(matchMedia("(pointer:coarse)").matches?420:680)+"');"],
   ["/* ====================================================================== camera crew (observational: operators hold, the mixer cuts) */",(await b.text())+"\n/* ====================================================================== camera crew (observational: operators hold, the mixer cuts) */"],
   ["window.MZ = {","window.MZ = {\n"+(await c.text())]
  ];
  for(const [old,replacement] of patches){if(world.split(old).length!==2)throw Error("HEADLAND source signature changed: "+old);world=world.replace(old,replacement)}
  iframe.srcdoc=world;
 }catch(e){$("loadMsg").textContent="SOURCE ERROR: "+e.message;$("statusLine").textContent="BUILD NOT READY";console.error(e)}
}
const check=setInterval(()=>{
 try{
  const a=iframe.contentWindow?.MZ;if(!a||typeof a.hitBuilderAsset!=="function"||typeof a.listBuilderAssets!=="function")return;
  clearInterval(check);api=a;ready=true;
  for(const obj of locations()){const option=document.createElement("option");option.value=obj.id;option.textContent=obj.title+" ["+obj.id+"]";$("asset").append(option)}
  const url=new URLSearchParams(location.search).get("layout");
  if(url){
   try{const incoming=JSON.parse(url);if(incoming.v!==1||!Array.isArray(incoming.assets))throw Error("Link not v1");
    apply(validate({schema:SCHEMA,assets:incoming.assets.map(a=>({id:a[0],x:a[1],z:a[2],r:a[3]}))}));say("SHARED LAYOUT LINK LOADED");
   }catch(e){say("Share data could not load: "+e.message)}
  }else{
   try{
     const old=localStorage.getItem(KEY);
     if(old){apply(validate(JSON.parse(old)));say("LOCAL DRAFT RESTORED")}
     else if(approvedLayout?.length){apply(validate({schema:SCHEMA,assets:approvedLayout}));say("PUBLISHED GITHUB LAYOUT LOADED")}
   }catch(e){say("Saved layout cannot load: "+e.message)}
  }
  api.grammar({hatch:.23,dith:.018,wob:1.25,period:11,outline:1});
  api.look([eye.x,eye.y,eye.z],[eye.x,eye.y-12,eye.z-100],70);api.tick(0);
  $("launch").disabled=false;$("loadMsg").textContent=locations().length+" editable groups ready";
  $("statusLine").textContent="HEADLAND DEVELOPER READY";
 }catch(e){clearInterval(check);$("loadMsg").textContent="INIT ERROR: "+e.message;console.error(e)}
},230);
setTimeout(()=>{if(!ready)$("loadMsg").textContent="STILL LOADING — WEBGL 2 AND NETWORK CONNECTION REQUIRED"},22000);
$("launch").addEventListener("click",()=>{if(!ready)return;entered=true;$("enter").hidden=true;modeSet("fly");hit.focus();say("Use F to fly, B to build, P to capture, H for panel.")});
$("fly").addEventListener("click",()=>modeSet("fly"));$("build").addEventListener("click",()=>modeSet("build"));
$("back").addEventListener("click",()=>location.href="../");
$("panelToggle").textContent="PANEL [H]";
$("panelToggle").addEventListener("click",()=>{const show=$("side").hidden;$("side").hidden=!show;$("side").dataset.pinned=show?"yes":"no"});
$("asset").addEventListener("change",e=>select(e.target.value));
$("focus").addEventListener("click",()=>{
 const a=locations().find(x=>x.id===selected);if(!a)return say("Choose an asset to focus on");
 eye.x=a.x+11;eye.z=a.z+18;eye.y=api.getBuilderTerrain(a.x,a.z)+13;
 const dx=a.x-eye.x,dz=a.z-eye.z,dy=api.getBuilderTerrain(a.x,a.z)+2-eye.y;
 yaw=Math.atan2(dx,-dz);pitch=Math.atan2(dy,Math.hypot(dx,dz));
 say("CAMERA POSITIONED NEAR "+a.title+" · use P to capture a reference photo");
});
$("apply").addEventListener("click",()=>{
 if(!selected)return say("Select an asset first");
 if(![$("xx").value,$("zz").value,$("rr").value].every(v=>v.trim()))return say("Complete X, Z and Yaw");
 move(Number($("xx").value),Number($("zz").value),Number($("rr").value)*Math.PI/180);
});
$("reset").addEventListener("click",()=>{
 const a=locations().find(x=>x.id===selected);if(a)move(a.baseX,a.baseZ,0);
});
$("ground").addEventListener("click",()=>{
 const a=locations().find(x=>x.id===selected);if(a)move(a.x,a.z,a.r);
});
document.querySelectorAll("[data-nudge]").forEach(btn=>btn.addEventListener("click",()=>{
 const a=locations().find(x=>x.id===selected);if(!a)return;
 const n={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[btn.dataset.nudge];move(a.x+n[0],a.z+n[1],a.r);
}));
$("undo").addEventListener("click",undo);$("redo").addEventListener("click",redo);
$("photo").addEventListener("click",capture);
$("save").addEventListener("click",()=>{saveDraft();say("Browser draft saved; export a review ZIP for agents")});
$("bundle").addEventListener("click",pack);
$("exportJson").addEventListener("click",()=>{fileSave(JSON.stringify(review(),null,2),"HEADLAND_LAYOUT.json","application/json");say("JSON layout exported")});
$("share").addEventListener("click",()=>{
 const url=new URL(location.href);url.searchParams.set("layout",JSON.stringify({v:1,assets:layout().map(a=>[a.id,a.x,a.z,a.r])}));
 if(navigator.clipboard)navigator.clipboard.writeText(url.href).then(()=>say("LINK COPIED / OPEN TO LOAD EXACT EDITED LAYOUT")).catch(()=>window.prompt("Copy shared layout URL",url.href));
 else window.prompt("Copy shared layout URL",url.href);
});
$("importBtn").addEventListener("click",()=>$("file").click());
$("file").addEventListener("change",async e=>{
 const f=e.target.files[0];if(!f||!api)return;
 try{const obj=JSON.parse(await f.text());const arr=validate(obj);remember();apply(arr);saveDraft();say("IMPORTED "+arr.length+" assets from "+f.name)}
 catch(ex){say("Import refused: "+ex.message)}
 e.target.value="";
});
$("restore").addEventListener("click",()=>{
 if(!confirm("Restore every editable asset to its original location?"))return;
 remember();apply(locations().map(a=>({id:a.id,x:a.baseX,z:a.baseZ,r:0})));saveDraft();say("SOURCE LAYOUT RESTORED");
});
hit.addEventListener("contextmenu",e=>e.preventDefault());
hit.addEventListener("pointerdown",e=>{
 if(!api||!entered)return;
 hit.setPointerCapture(e.pointerId);
 if(mode==="fly"){
  if(e.pointerType==="mouse"){try{hit.requestPointerLock()}catch(err){}}
  else lookDrag={id:e.pointerId,x:e.clientX,y:e.clientY};
 }else if(e.button===2){lookDrag={id:e.pointerId,x:e.clientX,y:e.clientY}}
 else{
  const [nx,ny]=ndc(e),found=api.hitBuilderAsset(nx,ny);
  if(!found){lookDrag={id:e.pointerId,x:e.clientX,y:e.clientY};return}
  select(found.id);const a=locations().find(x=>x.id===selected);
  const p=api.builderGroundRay(nx,ny,api.getBuilderTerrain(a.x,a.z));
  if(p){remember();drag={id:e.pointerId,asset:a.id,dx:a.x-p[0],dz:a.z-p[2],y:api.getBuilderTerrain(a.x,a.z),r:a.r,moved:false}}
 }
});
hit.addEventListener("pointermove",e=>{
 if(!entered||!api)return;
 if(document.pointerLockElement===hit&&mode==="fly"){look(e.movementX,e.movementY);return}
 if(lookDrag?.id===e.pointerId){look(e.clientX-lookDrag.x,e.clientY-lookDrag.y);lookDrag.x=e.clientX;lookDrag.y=e.clientY}
 else if(drag?.id===e.pointerId){
  const [nx,ny]=ndc(e),p=api.builderGroundRay(nx,ny,drag.y);
  if(p&&api.moveBuilderAsset(drag.asset,p[0]+drag.dx,p[2]+drag.dz,drag.r)){drag.moved=true;refresh()}
 }
});
const finish=e=>{
 if(drag?.id===e.pointerId){if(drag.moved){saveDraft();say("POSITION UPDATED / "+drag.asset)}else undoStack.pop();drag=null}
 if(lookDrag?.id===e.pointerId)lookDrag=null;
};
hit.addEventListener("pointerup",finish);hit.addEventListener("pointercancel",finish);
window.addEventListener("keydown",e=>{
 if(!entered||!api||["INPUT","TEXTAREA","SELECT"].includes(e.target?.tagName))return;
 const k=e.key.toLowerCase();
 if(e.metaKey||e.ctrlKey){if(k==="z"){e.preventDefault();e.shiftKey?redo():undo()}if(k==="y"){e.preventDefault();redo()}return}
 if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," ","c","shift"].includes(k)){e.preventDefault();keys.add(k)}
 if(k==="f"&&!e.repeat)modeSet("fly");
 if(k==="b"&&!e.repeat)modeSet("build");
 if(k==="p"&&!e.repeat){e.preventDefault();capture()}
 if(k==="h"&&!e.repeat)$("panelToggle").click();
});
window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
window.addEventListener("blur",()=>{keys.clear();drag=lookDrag=null});
hit.addEventListener("wheel",e=>{e.preventDefault();speed=clamp(speed*Math.exp(-e.deltaY*.001),1,100)},{passive:false});
document.querySelectorAll("[data-touch]").forEach(b=>{
 const k={up:" ",down:"c",forward:"w",backward:"s",left:"a",right:"d"}[b.dataset.touch];
 b.addEventListener("pointerdown",e=>{keys.add(k);b.setPointerCapture(e.pointerId)});
 b.addEventListener("pointerup",()=>keys.delete(k));b.addEventListener("pointercancel",()=>keys.delete(k));
});
boot();
})();