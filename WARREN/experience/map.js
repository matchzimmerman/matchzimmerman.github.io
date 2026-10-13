/* WARREN PRESENT ↔ PAST / Satellite orientation · 002
   Modern bridge coordinate is real; scene association is explicitly approximate.
   No historical geo-registration is implied. */
(()=>{
'use strict';
const api=window.WARREN_GEO_API;
if(!api)return;
const anchor={lat:39.4886,lon:-76.6094,x:api.bridge().x,z:api.bridge().z};
const latM=111132.92,lonM=111412.84*Math.cos(anchor.lat*Math.PI/180);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const toWorld=(p)=>({x:anchor.x+(p.lon-anchor.lon)*lonM,z:anchor.z-(p.lat-anchor.lat)*latM});
const toGeo=(p)=>({lon:anchor.lon+(p.x-anchor.x)/lonM,lat:anchor.lat-(p.z-anchor.z)/latM});
document.head.insertAdjacentHTML('beforeend','<style>'+
'#presentMapBtn{font:600 10px monospace;color:#294940;background:#ffe9cbaa;border:1px solid #42565166;padding:9px 12px;cursor:pointer}'+
'#presentMapBtn:hover{background:#fff0d0}'+
'#presentMap{display:none;position:fixed;z-index:10;top:max(75px,calc(env(safe-area-inset-top) + 62px));left:clamp(10px,3vw,42px);width:min(416px,calc(100vw - 20px));height:min(620px,calc(100dvh - 137px));min-height:335px;background:#f8e8c6;color:#304843;border:1px solid #456a64;box-shadow:7px 9px 0 #274b4a55;flex-direction:column;overflow:hidden}'+
'#presentMap.open{display:flex}#presentMap button{font:600 10px monospace;color:#294940;border:1px solid #41665f66;padding:7px 9px;background:#fff1d6;cursor:pointer}'+
'#presentMap button:hover{background:#fff8e7}#pmHead{display:flex;justify-content:space-between;align-items:center;padding:12px 13px;background:#ffe0aa;border-bottom:1px solid #41665f44}'+
'#pmHead strong{font:700 13px system-ui;letter-spacing:.1em}#pmHead small{display:block;font:9px monospace;letter-spacing:.07em;margin-top:3px}'+
'#pmModes{padding:7px 9px;display:flex;gap:5px;background:#ffebc9}#pmModes button[aria-pressed=true]{background:#ef6b45;color:white;border-color:#ef6b45}'+
'#pmMap{position:relative;flex:1;min-height:140px;background:#7b887a;cursor:crosshair;overflow:hidden;touch-action:none}#pmTiles{position:absolute;inset:0;pointer-events:none}'+
'#pmTiles img{position:absolute;width:256px;height:256px;max-width:none;user-select:none;-webkit-user-drag:none}'+
'.pmPin{position:absolute;transform:translate(-50%,-50%);pointer-events:none;display:flex;z-index:2;flex-direction:column;align-items:center;white-space:nowrap}'+
'.pmPin i{width:14px;height:14px;border-radius:50%;background:#f96943;border:3px solid #fff4d7;box-shadow:0 0 0 2px #234e49}.pmPin b{background:#20433fd9;color:#fff3d6;font:700 9px monospace;padding:3px 4px;text-shadow:none}'+
'#pmBridge i{background:#76d4cb}#pmTip{position:absolute;z-index:2;top:8px;left:50%;transform:translateX(-50%);white-space:nowrap;pointer-events:none;background:#ffeed4e9;padding:5px 7px;border:1px solid #45665d77;font:700 9px monospace}'+
'#pmFoot{padding:9px 10px 8px;background:#ffecd0;border-top:1px solid #43645d66;font:11px/1.35 system-ui}#pmToolRow{display:flex;gap:5px;margin-bottom:7px}#pmToolRow button{flex:1}'+
'#pmLinks{display:flex;justify-content:space-between;align-items:center;font:9px monospace;gap:8px}#pmLinks a{font-weight:700;color:#af4c2d;white-space:nowrap}'+
'#pmFoot p{font-size:10.5px;line-height:1.4;margin:6px 0 0}#pmCredit{background:#fff9ed;border-top:1px solid #45665d33;font:9px system-ui;padding:5px 7px}'+
'#pmToast{display:none;position:fixed;z-index:9;left:50%;top:17%;transform:translateX(-50%);border:1px solid #43665d;background:#ffe4b8ee;padding:8px 12px;font:700 10px monospace;white-space:nowrap;pointer-events:none}'+
'@media(max-width:610px){#presentMapBtn{font-size:9px;padding:7px}#presentMap{top:max(72px,calc(env(safe-area-inset-top) + 60px));left:8px;width:calc(100vw - 16px);height:min(586px,calc(100dvh - 134px))}#pmHead{padding:9px}#pmModes{padding:6px}}'+
'</style>');
const actions=document.querySelector('#actions');
const button=document.createElement('button');
button.id='presentMapBtn';button.textContent='◎ MAP / TODAY';button.setAttribute('aria-label','Open modern satellite location map');
actions.prepend(button);
document.body.insertAdjacentHTML('beforeend','<section id="presentMap" role="dialog" aria-label="Modern satellite map for provisional world travel">'+
'<div id="pmHead"><div><strong>◎ PRESENT / PAST</strong><small>MODERN REFERENCE · PROVISIONAL MATCH</small></div><button id="pmClose">× CLOSE</button></div>'+
'<div id="pmModes"><button data-pm="satellite" aria-pressed="true">SATELLITE</button><button data-pm="topo" aria-pressed="false">ROADS / TERRAIN</button><span style="flex:1"></span><button id="pmMinus">−</button><button id="pmPlus">+</button></div>'+
'<div id="pmMap"><div id="pmTiles"></div><div class="pmPin" id="pmBridge"><i></i><b>WARREN RD BRIDGE</b></div><div class="pmPin" id="pmAvatar"><i></i><b>YOU IN WORLD</b></div><div id="pmTip">TAP A LOCATION TO VISIT IT</div></div>'+
'<div id="pmFoot"><div id="pmToolRow"><button id="pmFollow">⌖ MY VIEW</button><button id="pmBridgeBtn">◇ BRIDGE</button><button id="pmReset">↺ RESET</button></div>'+
'<div id="pmLinks"><span id="pmStatus">ONE-POINT ESTIMATE · NOT SURVEYED</span><a id="pmGoogle" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/@39.4886,-76.6094,16z">GOOGLE MAPS ↗</a></div>'+
'<p>Modern imagery is real. The historical world has <b>not</b> been georeferenced. Click-to-travel uses one approximate bridge anchor and an unverified north-up scale.</p></div>'+
'<div id="pmCredit">Imagery © Esri, Maxar, Earthstar Geographics, GIS User Community · Streets © Esri/providers. Bridge location: HistoricBridges.org.</div></section>'+
'<div id="pmToast">APPROXIMATE CORRESPONDING LOCATION</div>');
const panel=document.querySelector('#presentMap'), el=document.querySelector('#pmMap'), layer=document.querySelector('#pmTiles'),status=document.querySelector('#pmStatus');
const marker=(name,p,center,zoom)=>{const target=document.querySelector(name);const a=llpix(p.lat,p.lon,zoom),b=llpix(center.lat,center.lon,zoom);const x=a[0]-b[0]+el.clientWidth/2,y=a[1]-b[1]+el.clientHeight/2;target.style.left=x+'px';target.style.top=y+'px';target.style.display=x<-65||x>el.clientWidth+65||y<-45||y>el.clientHeight+45?'none':'flex'};
const urls={satellite:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/',topo:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/'};
let open=false,zoom=15,mode='satellite',center=toGeo(api.get()),tiles=new Map(),drag=null,clickPoint=null;
function llpix(lat,lon,z){const n=256*2**z,a=clamp(lat,-85,85)*Math.PI/180;return [(lon+180)/360*n,(1-Math.asinh(Math.tan(a))/Math.PI)/2*n]}
function pixll(x,y,z){const n=256*2**z;return {lon:x/n*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI}}
function pointAt(clientX,clientY){const r=el.getBoundingClientRect(),p=llpix(center.lat,center.lon,zoom);return pixll(p[0]+clientX-r.left-r.width/2,p[1]+clientY-r.top-r.height/2,zoom)}
function render(){if(!open)return;const w=el.clientWidth,h=el.clientHeight;if(w<2||h<2)return;const p=llpix(center.lat,center.lon,zoom),a=Math.floor((p[0]-w/2)/256)-1,b=Math.floor((p[0]+w/2)/256)+1,c=Math.floor((p[1]-h/2)/256)-1,d=Math.floor((p[1]+h/2)/256)+1,used=new Set();
for(let y=c;y<=d;y++)for(let x=a;x<=b;x++){const count=2**zoom;if(y<0||y>=count)continue;const xx=(x+count)%count,k=mode+'/'+zoom+'/'+xx+'/'+y;let img=tiles.get(k);if(!img){img=document.createElement('img');img.alt='';img.decoding='async';img.draggable=false;img.src=urls[mode]+zoom+'/'+y+'/'+xx;img.onerror=()=>{img.style.background='#839687';status.textContent='MAP TILES UNAVAILABLE · GOOGLE ↗'};layer.appendChild(img);tiles.set(k,img)}img.style.left=Math.round(x*256-p[0]+w/2)+'px';img.style.top=Math.round(y*256-p[1]+h/2)+'px';used.add(k)}
for(const [k,img] of tiles){if(!used.has(k)){img.remove();tiles.delete(k)}}
marker('#pmBridge',anchor,center,zoom);marker('#pmAvatar',toGeo(api.get()),center,zoom);
const gp=clickPoint||center;document.querySelector('#pmGoogle').href='https://www.google.com/maps/@'+gp.lat.toFixed(6)+','+gp.lon.toFixed(6)+','+zoom+'z/data=!3m1!1e3';
}
function setOpen(v){open=v;panel.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open));if(open){if(document.pointerLockElement)document.exitPointerLock();render()}}
button.addEventListener('click',()=>setOpen(!open));document.querySelector('#pmClose').onclick=()=>setOpen(false);
document.addEventListener('keydown',e=>{if(e.code==='KeyM'){e.preventDefault();setOpen(!open)}else if(e.code==='Escape'&&open)setOpen(false)});
document.querySelector('#pmFollow').onclick=()=>{center=toGeo(api.get());render()};
document.querySelector('#pmBridgeBtn').onclick=()=>{center={lat:anchor.lat,lon:anchor.lon};render()};
document.querySelector('#pmReset').onclick=()=>{zoom=15;center=toGeo(api.home());clickPoint=null;render()};
document.querySelector('#pmMinus').onclick=()=>{zoom=clamp(zoom-1,12,19);render()};
document.querySelector('#pmPlus').onclick=()=>{zoom=clamp(zoom+1,12,19);render()};
document.querySelectorAll('[data-pm]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.pm;document.querySelectorAll('[data-pm]').forEach(q=>q.setAttribute('aria-pressed',String(q===b)));for(const img of tiles.values())img.remove();tiles.clear();status.textContent='ONE-POINT ESTIMATE · NOT SURVEYED';render()}));
el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY,center:center,shift:false};el.setPointerCapture(e.pointerId)});
el.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>7)drag.shift=true;if(drag.shift){const p=llpix(drag.center.lat,drag.center.lon,zoom);center=pixll(p[0]-dx,p[1]-dy,zoom);render()}});
function pointerEnd(e){if(!drag||drag.id!==e.pointerId)return;const shifted=drag.shift;drag=null;try{el.releasePointerCapture(e.pointerId)}catch(_){}if(shifted||e.type==='pointercancel')return;
const chosen=pointAt(e.clientX,e.clientY),where=toWorld(chosen);clickPoint=chosen;
if(where.x<-495||where.x>540||where.z<-400||where.z>405){status.textContent='OUTSIDE MODELED AREA · PAN CLOSER';render();return}
api.jump(where.x,where.z);status.textContent='APPROXIMATE LOCATION · NOT SURVEYED';setOpen(false);
const toast=document.querySelector('#pmToast');toast.style.display='block';clearTimeout(toast._timer);toast._timer=setTimeout(()=>toast.style.display='none',2300);
}
el.addEventListener('pointerup',pointerEnd);el.addEventListener('pointercancel',pointerEnd);
el.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom+(e.deltaY<0?1:-1),12,19);render()},{passive:false});
window.addEventListener('resize',()=>{if(open)render()});
})();