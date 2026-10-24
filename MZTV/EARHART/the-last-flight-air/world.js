/* =====================================================================
   THE LAST FLIGHT · research engine · WORLD (MZ WORLDS renderer)
   ---------------------------------------------------------------------
   Observer only. Reads aircraft state from the surrogate model (via the
   viewer) and draws it. It never writes back to the model or the feed.

   Look: inherited from BIT FIELD 031 · HEADLAND — the scene renders to a
   data target (shade, material id, screen-space line angle, accent) and a
   print pass carves linocut lines + ordered dither into six OBAS inks
   (INK DEEP SEA HOT GLOW PAPER), ATLANTIC PRINT colourway by default.

   Forces: sun and moon computed for the aircraft's position at the scenario
   time (1937-07-02 0000 GCT + flight hours). Wind and sea state are the
   model's SYNTHETIC seeded wind. Clouds are AUTHORED. Display altitude is
   AUTHORED (7,000 ft, from one radio report; the surrogate has no altitude).
   ===================================================================== */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const D2R = Math.PI / 180;
export const COLORWAYS = [
  { name: 'ATLANTIC PRINT', c: ['#1b1f3a', '#2c3e7a', '#3f9aa6', '#f0603f', '#f2c14e', '#efe6cf'] },
  { name: 'ULTRAMARINE',    c: ['#0c1440', '#1f3bb3', '#44b8e8', '#ff6a1a', '#ffd0a1', '#fff7ec'] },
  { name: 'RUST TIDE',      c: ['#2a1712', '#6b2f2a', '#5f8f9b', '#e46a2b', '#d9c38a', '#f1e7d6'] },
  { name: 'LICHEN',         c: ['#22261d', '#4b5b3a', '#a7c5a0', '#d9475b', '#e8d27c', '#f3eedf'] },
];
const INK = 0, DEEP = 1, SEA = 2, HOT = 3, GLOW = 4, PAPER = 5;
// material id → [dark, mid, light] inks, hatch strength, speckle
const MAT = [
  /* 0 sky    */ [DEEP, SEA, PAPER, 0.9, 1], /* 1 sun    */ [HOT, GLOW, PAPER, 1.0, 0],
  /* 2 sea    */ [INK, DEEP, SEA, 1.0, 0],   /* 3 glint  */ [SEA, PAPER, PAPER, 0.7, 0],
  /* 4 dural  */ [DEEP, SEA, PAPER, 1.0, 0], /* 5 dark   */ [INK, INK, DEEP, 0.4, 0],
  /* 6 cloud  */ [SEA, PAPER, PAPER, 0.8, 0],/* 7 black  */ [INK, INK, DEEP, 0.3, 0],
  /* 8 trim   */ [INK, HOT, GLOW, 0.8, 0],   /* 9 moon   */ [DEEP, SEA, PAPER, 0.8, 0],
  /*10 ghost  */ [INK, GLOW, GLOW, 0.0, 0],  /*11 glow   */ [SEA, HOT, GLOW, 0.9, 1],
  /*12 star   */ [INK, PAPER, PAPER, 0.0, 0],/*13 prop   */ [DEEP, SEA, PAPER, 0.3, 0],
  /*14 lamp   */ [GLOW, GLOW, PAPER, 0.0, 0],/*15 shadow */ [INK, DEEP, DEEP, 0.6, 0],
];
const hexV = (h) => { const n = parseInt(h.slice(1), 16); return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* ------------------------------------------------------------------ ephemeris (1937-safe low precision) */
function jd(ms) { return ms / 86400000 + 2440587.5; }
function altAz(ra, dec, ms, lat, lon) {
  const n = jd(ms) - 2451545.0;
  const gmst = ((280.46061837 + 360.98564736629 * n) % 360 + 360) % 360;
  const ha = (gmst + lon) * D2R - ra, la = lat * D2R;
  const el = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(ha));
  return { az: (az / D2R + 360) % 360, el: el / D2R };
}
export function sunPos(ms, lat, lon) {
  const n = jd(ms) - 2451545.0;
  const L = ((280.460 + 0.9856474 * n) % 360 + 360) % 360, g = (((357.528 + 0.9856003 * n) % 360 + 360) % 360) * D2R;
  const lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R, eps = (23.439 - 0.0000004 * n) * D2R;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)), dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  return Object.assign(altAz(ra, dec, ms, lat, lon), { lam });
}
export function moonPos(ms, lat, lon) {
  const d = jd(ms) - 2451545.0;
  const L = 218.316 + 13.176396 * d, M = (134.963 + 13.064993 * d) * D2R, F = (93.272 + 13.229350 * d) * D2R;
  const lo = (L + 6.289 * Math.sin(M)) * D2R, la = 5.128 * Math.sin(F) * D2R, eps = 23.439 * D2R;
  const x = Math.cos(la) * Math.cos(lo), y = Math.cos(eps) * Math.cos(la) * Math.sin(lo) - Math.sin(eps) * Math.sin(la);
  const z = Math.sin(eps) * Math.cos(la) * Math.sin(lo) + Math.cos(eps) * Math.sin(la);
  const ra = Math.atan2(y, x), dec = Math.asin(z);
  const sun = sunPos(ms, lat, lon);
  const elong = Math.acos(Math.cos(la) * Math.cos(lo - sun.lam));
  return Object.assign(altAz(ra, dec, ms, lat, lon), { illum: (1 - Math.cos(elong)) / 2 });
}
const azElVec = (az, el) => V(Math.sin(az * D2R) * Math.cos(el * D2R), Math.sin(el * D2R), -Math.cos(az * D2R) * Math.cos(el * D2R)); // +x east, -z north

/* ------------------------------------------------------------------ shaders */
const COMMON = /* glsl */`
uniform mat4 uVP; uniform float uAspect;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x), u.y); }
float screenAngle(vec3 w, vec3 T){
  vec4 a=uVP*vec4(w,1.); vec4 b=uVP*vec4(w+T,1.);
  vec2 d=b.xy/max(b.w,1e-3)-a.xy/max(a.w,1e-3); d.x*=uAspect;
  float ang=atan(d.y,d.x); if(ang<0.) ang+=3.14159265; return ang/3.14159265; }
vec4 pack(float sh, float id, float ang, float acc){ return vec4(clamp(sh,0.,1.), (id+0.5)/16., fract(ang), acc); }
`;
const NW = 6;
const SEA_VERT = /* glsl */`
uniform vec4 uW[${NW}]; uniform float uPh[${NW}]; uniform float uTime; uniform vec3 uCamP;
varying vec3 vW; varying float vCrest;
void main(){
  vec3 p=position+vec3(uCamP.x,0.,uCamP.z);
  float r=length(position.xz); float fade=1.-smoothstep(600.,4000.,r);
  vec3 d=vec3(0.); float crest=0.;
  for(int i=0;i<${NW};i++){ vec4 a=uW[i]; float ph=a.z*dot(a.xy,p.xz)+uPh[i]-sqrt(9.81*a.z)*uTime;
    float A=a.w*fade; d.x+=0.6*A*a.x*cos(ph); d.z+=0.6*A*a.y*cos(ph); d.y+=A*sin(ph); crest+=A*a.z*sin(ph); }
  vec3 w=p+d; vW=w; vCrest=crest;
  gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);
}`;
const SEA_FRAG = /* glsl */`
${COMMON}
uniform vec4 uW[${NW}]; uniform float uPh[${NW}]; uniform float uTime, uAmb, uDiff, uFogD, uFogShade, uKeyUp, uSkyB, uDay, uChop;
uniform vec3 uKeyD, uCamP;
varying vec3 vW; varying float vCrest;
void main(){
  float dist=length(vW-uCamP);
  vec3 n=vec3(0.,1.,0.);
  float fade=1.-smoothstep(2000.,30000.,length(vW.xz-uCamP.xz));
  for(int i=0;i<${NW};i++){ vec4 a=uW[i]; float ph=a.z*dot(a.xy,vW.xz)+uPh[i]-sqrt(9.81*a.z)*uTime;
    float L=6.2831853/a.z; float aa=1.-smoothstep(L*14.,L*60.,dist);
    float A=a.w*fade*aa*(1.+uChop*float(i)*0.12); n.x-=A*a.z*a.x*cos(ph); n.z-=A*a.z*a.y*cos(ph); }
  n=normalize(n);
  vec3 Vd=normalize(uCamP-vW);
  float lam=max(dot(n,uKeyD),0.);
  float fres=pow(1.-max(dot(n,Vd),0.),4.);
  vec3 R=reflect(-Vd,n); float spec=pow(max(dot(R,uKeyD),0.),90.)*uKeyUp;
  float sh=uAmb*0.75+uDiff*0.3*lam+0.12*uSkyB+0.42*fres*uSkyB+spec*1.6;
  float id=2.;
  // sun glitter: broken into sparkles by fine chop, never a solid disc
  float glit=vn(vW.xz*0.9+vec2(uTime*0.7,-uTime*0.45))*vn(vW.xz*2.3-vec2(uTime*1.1,uTime*0.6));
  if(spec*glit>0.32){ id=3.; } else if(spec>0.55){ sh=min(sh,0.82); }
  float crest=smoothstep(0.55,0.9,vCrest)*(1.-smoothstep(300.,1500.,dist));
  if(crest>0.5){ id=3.; sh=0.6+0.3*lam; }
  vec3 T=normalize(vec3(-uW[0].y,0.,uW[0].x)+0.6*vec3(n.x,0.,n.z));
  float fog=1.-exp(-dist/uFogD);
  sh=mix(sh,uFogShade,fog);
  gl_FragColor=pack(sh,id,screenAngle(vW,T*3.),0.);
}`;
const SKY_VERT = /* glsl */`varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; gl_Position.z=gl_Position.w*0.99999; }`;
const SKY_FRAG = /* glsl */`
${COMMON}
uniform vec3 uSunD, uMoonD, uCamP; uniform float uDay, uCloud, uTime, uMoonUp; uniform vec2 uWind;
varying vec3 vW;
void main(){
  vec3 d=normalize(vW-uCamP); float el=d.y;
  float sg=pow(max(dot(d,uSunD),0.),6.)*smoothstep(-0.2,0.05,uSunD.y);
  float low=smoothstep(-0.3,0.,uSunD.y)*(1.-smoothstep(0.1,0.45,uSunD.y));
  float az=pow(max(dot(normalize(d.xz+1e-4),normalize(uSunD.xz+1e-4)),0.),2.);
  float band=(1.-smoothstep(-0.05,0.3,max(el,-0.05)))*az*low;
  float sh=mix(0.08,0.62,uDay)+0.36*sg-0.2*smoothstep(0.,0.8,el)*uDay+0.16*(1.-smoothstep(-0.02,0.18,el))*uDay;
  float id=0.;
  vec3 L=uDay>0.15?uSunD:(uMoonUp>0.5?uMoonD:vec3(0.,1.,0.));
  vec3 T=L-d*dot(d,L); T=length(T)>1e-3?normalize(T):vec3(1.,0.,0.);   // great-circle tangent toward the light: lines radiate from the real sun
  // horizon glow: a ragged, dithered band (printed, not a slab), strongest under the sun
  float gN=vn(vec2(atan(d.z,d.x)*40.,el*260.))*0.35+hash(floor(gl_FragCoord.xy*0.5))*0.25;
  float gB=band*(0.55+0.45*sg)+gN-0.3;
  if(gB>0.62&&el<0.09){ id=11.; sh=0.32+0.45*band+0.25*sg; }
  // stars (night only)
  if(uDay<0.25&&el>0.02){ vec2 sp=vec2(atan(d.z,d.x)*180., asin(el)*180.); float h=hash(floor(sp));
    if(h>0.996){ id=12.; sh=0.95*(1.-uDay*4.); } }
  // moon glow
  float mg=pow(max(dot(d,uMoonD),0.),40.)*uMoonUp*(1.-uDay);
  sh+=0.25*mg;
  // high cloud deck (authored)
  if(el>0.){
    vec2 cp=d.xz/max(el,0.04)*900.+uWind*uTime*4.;
    float cl=vn(cp*0.0011)*0.6+vn(cp*0.0041+3.)*0.4;
    float thr=1.02-uCloud*0.55;
    float cov=smoothstep(thr,thr+0.1,cl)*smoothstep(0.02,0.12,el);
    if(cov>0.5){ id=6.; sh=mix(0.25,0.88,uDay)-0.4*(cl-thr)+0.3*sg; T=normalize(vec3(1.,0.18*(cl-0.6),0.)); }
  }
  gl_FragColor=pack(sh,id,screenAngle(uCamP+d*100.,T),0.);
}`;
const DISC_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); gl_Position.z=gl_Position.w*0.99998; }`;
const DISC_FRAG = /* glsl */`
${COMMON}
uniform float uIsMoon, uIllum, uDim; uniform vec2 uLit; varying vec2 vUv;
void main(){ vec2 p=vUv*2.-1.; float r=length(p); if(r>1.) discard;
  float id=uIsMoon>0.5?9.:1.; float sh=uIsMoon>0.5?0.7:0.92-0.3*smoothstep(0.5,1.,r);
  if(uIsMoon>0.5){ float k=dot(p,uLit); float term=1.-2.*uIllum; if(k<term*sqrt(max(0.,1.-r*r))) { id=7.; sh=0.12; } }
  gl_FragColor=pack(sh*uDim,id,mod(atan(p.y,p.x),3.14159)/3.14159,0.); }`;
const OBJ_VERT = /* glsl */`
attribute float aId; attribute vec3 aT; uniform float uProp;
varying vec3 vW, vN, vT; varying float vId; varying vec3 vL;
void main(){
  vec4 lp=vec4(position,1.);
  #ifdef USE_INSTANCING
    lp=instanceMatrix*lp;
  #endif
  vec4 w=modelMatrix*lp; vW=w.xyz; vL=position; vId=aId;
  mat3 nm=mat3(modelMatrix);
  #ifdef USE_INSTANCING
    nm=nm*mat3(instanceMatrix);
  #endif
  vN=normalize(nm*normal); vT=nm*aT;
  gl_Position=projectionMatrix*viewMatrix*w;
}`;
const OBJ_FRAG = /* glsl */`
${COMMON}
uniform vec3 uKeyD, uCamP; uniform float uAmb, uDiff, uFogD, uFogShade, uKeyUp, uSkyB, uGhost, uProp, uTime, uLamp;
varying vec3 vW, vN, vT; varying float vId; varying vec3 vL;
void main(){
  vec3 N=normalize(vN); if(!gl_FrontFacing) N=-N;
  vec3 Vd=normalize(uCamP-vW);
  float lam=max(dot(N,uKeyD),0.)*uKeyUp;
  float sh=uAmb+uDiff*lam+0.18*uSkyB*max(N.y,0.);
  float id=vId;
  if(id>3.5&&id<4.5){ vec3 R=reflect(-Vd,N); sh+=0.7*pow(max(dot(R,uKeyD),0.),24.)*uKeyUp; }  // dural sheen
  if(id>12.5&&id<13.5){ // prop disc: blur ring, blades suggested
    float a=atan(vL.y,vL.x); float r=length(vL.xy);
    float blade=step(0.92,abs(sin(a*1.+uProp)));
    sh=0.35+0.25*blade; if(r<0.2) { id=5.; sh=0.1; }
  }
  if(id>13.5&&id<14.5){ sh=uLamp; }
  if(uGhost>0.5){ id=10.; sh=0.9; }
  vec3 T=length(vT)>0.01?normalize(vT):vec3(0.,1.,0.);
  float fog=1.-exp(-length(vW-uCamP)/uFogD);
  sh=mix(sh,uFogShade,fog);
  gl_FragColor=pack(sh,id,screenAngle(vW,T),0.);
}`;
const PRINT_FRAG = /* glsl */`
uniform sampler2D uData; uniform vec2 uRes; uniform vec3 uPal[6]; uniform vec3 uTab[16]; uniform float uHat[16]; uniform float uSpk[16];
uniform float uPeriod, uDith, uWob, uOutline, uHatch, uSeed;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x), u.y); }
float b2(vec2 a){ a=floor(a); return fract(dot(a,vec2(0.5,a.y*0.75))); }
float b4(vec2 a){ return b2(0.5*a)*0.25+b2(a); }
float b8(vec2 a){ return b4(0.5*a)*0.25+b2(a); }
int idAt(vec2 fc){ return int(floor(texture2D(uData,fc/uRes).g*16.)); }
bool soft(int a,int b){
  bool sa=(a==0||a==6||a==1||a==9||a==11||a==12), sb=(b==0||b==6||b==1||b==9||b==11||b==12);
  if(sa&&sb) return true;
  if((a==2||a==3)&&(b==2||b==3)) return true;
  if((a==4||a==8)&&(b==4||b==8)) return false;
  return false; }
void main(){
  vec2 fc=gl_FragCoord.xy;
  vec4 d=texture2D(uData,fc/uRes);
  float s=d.r; int id=int(floor(d.g*16.)); float ang=d.b*3.14159265;
  vec3 tab=uTab[id]; float hs=uHat[id]*uHatch;
  vec2 dir=vec2(cos(ang),sin(ang));
  float u=dot(fc,vec2(-dir.y,dir.x));
  float wob=(vn(fc*0.011+uSeed)-0.5)*uWob+(vn(fc*0.047+uSeed*2.)-0.5)*uWob*0.35;
  float line=cos((u+wob)*6.2831853/uPeriod);
  float mid=1.-abs(2.*s-1.);
  float v=s+line*hs*0.3*(0.3+0.7*mid)+(b8(fc)-0.5)*uDith;
  int k=v<0.36?0:(v<0.69?1:2);
  float ink=k==0?tab.x:(k==1?tab.y:tab.z);
  if(uSpk[id]>0.5){ float h=hash(floor(fc/2.6)+uSeed); if(h>0.97){ if(s<0.28) ink=5.; else if(k==2) ink=tab.y; else if(k==1) ink=tab.x; } }
  if(uOutline>0.5){
    int il=idAt(fc+vec2(-1.,0.)), iu=idAt(fc+vec2(0.,-1.));
    if((il!=id&&!soft(il,id))||(iu!=id&&!soft(iu,id))) ink=(id==10||il==10||iu==10)?4.:0.;
  }
  gl_FragColor=vec4(uPal[int(ink+0.5)],1.);
}`;
const BLIT_FRAG = /* glsl */`uniform sampler2D uTex; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){ vec3 c=texture2D(uTex,vUv).rgb; float g=hash(floor(gl_FragCoord.xy*0.5)); c*=0.965+0.035*g; gl_FragColor=vec4(c,1.); }`;
const QUAD_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;

/* ------------------------------------------------------------------ Electra (procedural, approximate proportions) */
// Lockheed 10E: span ~16.8 m, length ~11.8 m, twin fins at the stabilizer tips. Built nose toward -z.
function partGeo(geo, id, T) {
  if (geo.index) geo = geo.toNonIndexed();
  const n = geo.attributes.position.count;
  geo.setAttribute('aId', new THREE.BufferAttribute(new Float32Array(n).fill(id), 1));
  const t = new Float32Array(n * 3); for (let i = 0; i < n; i++) { t[i * 3] = T.x; t[i * 3 + 1] = T.y; t[i * 3 + 2] = T.z; }
  geo.setAttribute('aT', new THREE.BufferAttribute(t, 3));
  for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'aId', 'aT'].includes(k)) geo.deleteAttribute(k);
  return geo;
}
function xf(geo, { p = V(), r = V(), s = V(1, 1, 1) } = {}) {
  const m = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(r.x, r.y, r.z)), s);
  return geo.applyMatrix4(m);
}
function wing(span, rootC, tipC, thick, dihedral, sweepLE) {
  // a tapered slab from x=0 to x=span (right side), chord along z
  const g = new THREE.BufferGeometry();
  const tipY = Math.tan(dihedral) * span, t0 = thick, t1 = thick * 0.55;
  const P = [
    [0, t0, -rootC * 0.3], [0, t0, rootC * 0.7], [0, -t0 * 0.4, rootC * 0.7], [0, -t0 * 0.4, -rootC * 0.3],
    [span, tipY + t1, -tipC * 0.3 + sweepLE], [span, tipY + t1, tipC * 0.7 + sweepLE], [span, tipY - t1 * 0.4, tipC * 0.7 + sweepLE], [span, tipY - t1 * 0.4, -tipC * 0.3 + sweepLE]];
  const F = [[0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5], [4, 5, 6, 7], [0, 3, 2, 1]];
  const pos = [];
  for (const f of F) { const [a, b, c, d] = f.map(i => P[i]); pos.push(...a, ...b, ...c, ...a, ...c, ...d); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
export function buildElectra() {
  const parts = [];
  const along = V(0, 0, 1);
  // fuselage: lathe profile, axis along z (nose at -z)
  const prof = [[0, -5.9], [0.35, -5.75], [0.62, -5.3], [0.8, -4.4], [0.86, -3.0], [0.86, 0.5], [0.74, 2.6], [0.5, 4.4], [0.22, 5.6], [0.05, 5.9]]
    .map(([r, z]) => new THREE.Vector2(r, z));
  let fus = new THREE.LatheGeometry(prof, 18);
  fus = xf(fus, { r: V(Math.PI / 2, 0, 0) });          // lathe axis y → z
  fus.scale(1, 1.08, 1);
  parts.push(partGeo(fus, 4, along));
  // cockpit glazing (dark) and cabin windows
  const canopy = xf(new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), { p: V(0, 0.45, -3.75), s: V(1, 0.55, 1.5) });
  parts.push(partGeo(canopy, 5, V(1, 0, 0)));
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) {
    parts.push(partGeo(xf(new THREE.BoxGeometry(0.04, 0.26, 0.34), { p: V(sx * 0.85, 0.25, -1.9 + i * 0.72) }), 5, V(0, 1, 0)));
  }
  // wings (two halves) with modest dihedral
  for (const sx of [-1, 1]) {
    let w = wing(8.0, 3.2, 1.4, 0.32, 5 * D2R, 0.45);
    if (sx < 0) w = xf(w, { s: V(-1, 1, 1) });
    parts.push(partGeo(xf(w, { p: V(sx * 0.6, -0.42, -1.1) }), 4, V(sx, 0, 0)));
    // orange trim at the tips (Navy 'Known Facts' item 2: 'dural, with orange trim'; placement authored)
    parts.push(partGeo(xf(new THREE.BoxGeometry(0.35, 0.34, 1.35), { p: V(sx * 8.45, 0.33, -0.5) }), 8, V(0, 0, 1)));
    // engine nacelle + cowling + prop disc
    const nx = sx * 2.55;
    const nac = xf(new THREE.CylinderGeometry(0.62, 0.42, 3.0, 14), { p: V(nx, -0.15, -2.2), r: V(Math.PI / 2, 0, 0) });
    parts.push(partGeo(nac, 4, along));
    const cowl = xf(new THREE.CylinderGeometry(0.66, 0.66, 0.5, 16, 1, true), { p: V(nx, -0.15, -3.7), r: V(Math.PI / 2, 0, 0) });
    parts.push(partGeo(cowl, 5, V(0, 1, 0)));
    const disc = xf(new THREE.CircleGeometry(1.25, 28), { p: V(nx, -0.15, -4.02) });
    const dg = partGeo(disc, 13, V(1, 0, 0)); parts.push(dg);
    const dg2 = partGeo(xf(new THREE.CircleGeometry(1.25, 28), { p: V(nx, -0.15, -4.03), r: V(0, Math.PI, 0) }), 13, V(1, 0, 0)); parts.push(dg2);
  }
  // horizontal stabilizer and twin fins
  const stab = xf(new THREE.BoxGeometry(5.6, 0.14, 1.25), { p: V(0, 0.32, 5.0) });
  parts.push(partGeo(stab, 4, V(1, 0, 0)));
  for (const sx of [-1, 1]) {
    const fin = xf(new THREE.BoxGeometry(0.12, 1.55, 1.05), { p: V(sx * 2.8, 0.75, 5.15), r: V(-0.08, 0, 0) });
    parts.push(partGeo(fin, 4, V(0, 1, 0)));
    parts.push(partGeo(xf(new THREE.BoxGeometry(0.14, 0.32, 1.07), { p: V(sx * 2.8, 1.42, 5.1) }), 8, V(0, 0, 1)));
    // nav light (authored) at wingtip
    parts.push(partGeo(xf(new THREE.SphereGeometry(0.09, 6, 4), { p: V(sx * 8.62, 0.32, -1.05) }), 14, V(0, 1, 0)));
  }
  // undercarriage retracted; antenna mast above the cabin
  parts.push(partGeo(xf(new THREE.BoxGeometry(0.05, 0.55, 0.08), { p: V(0, 1.05, -2.6) }), 5, V(0, 1, 0)));
  const g = mergeGeometries(parts, false);
  g.computeBoundingSphere();
  return g;
}

/* ------------------------------------------------------------------ World */
export class World {
  constructor(canvas, opts = {}) {
    this.opts = Object.assign({ lines: 540, capture: false, colorway: 0 }, opts);
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!this.opts.capture });
    r.setPixelRatio(1); r.outputColorSpace = THREE.LinearSRGBColorSpace; r.autoClear = false;
    this.rtData = new THREE.WebGLRenderTarget(2, 2, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, generateMipmaps: false });
    this.rtPrint = new THREE.WebGLRenderTarget(2, 2, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, generateMipmaps: false });
    this.envScene = new THREE.Scene(); this.nearScene = new THREE.Scene();
    this.camFar = new THREE.PerspectiveCamera(50, 16 / 9, 4, 420000);
    this.camNear = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 6000);
    this.SH = {
      uVP: { value: new THREE.Matrix4() }, uAspect: { value: 1.78 }, uTime: { value: 0 },
      uSunD: { value: V(0, 1, 0) }, uMoonD: { value: V(0, 1, 0) }, uKeyD: { value: V(0, 1, 0) }, uCamP: { value: V() },
      uAmb: { value: 0.3 }, uDiff: { value: 0.6 }, uFogD: { value: 60000 }, uFogShade: { value: 0.6 },
      uDay: { value: 1 }, uKeyUp: { value: 1 }, uSkyB: { value: 0.6 }, uCloud: { value: 0.35 }, uWind: { value: new THREE.Vector2() },
      uMoonUp: { value: 0 },
    };
    this.PU = {
      uData: { value: this.rtData.texture }, uRes: { value: new THREE.Vector2(2, 2) },
      uPal: { value: Array.from({ length: 6 }, () => V()) },
      uTab: { value: MAT.map(m => V(m[0], m[1], m[2])) }, uHat: { value: MAT.map(m => m[3]) }, uSpk: { value: MAT.map(m => m[4]) },
      uPeriod: { value: 5.5 }, uDith: { value: 0.12 }, uWob: { value: 6 }, uOutline: { value: 1 }, uHatch: { value: 1 }, uSeed: { value: 17.3 },
    };
    this.setColorway(this.opts.colorway);
    this.build();
    this.post = new THREE.Scene(); this.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.printMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VERT, fragmentShader: PRINT_FRAG, uniforms: this.PU, depthTest: false, depthWrite: false });
    this.blitMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VERT, fragmentShader: BLIT_FRAG, uniforms: { uTex: { value: this.rtPrint.texture } }, depthTest: false, depthWrite: false });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.printMat); this.post.add(this.quad);
    this.lost = false;
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; });
    canvas.addEventListener('webglcontextrestored', () => { this.lost = false; });
  }
  setColorway(i) {
    this.cwIndex = ((i % COLORWAYS.length) + COLORWAYS.length) % COLORWAYS.length;
    this.colorway = COLORWAYS[this.cwIndex];
    this.colorway.c.forEach((h, k) => this.PU.uPal.value[k].copy(hexV(h)));
    this.inkBlend = null;
  }
  // re-ink slowly (no flashing): each ink eases from its current colour to the new colourway over `sec` seconds
  blendColorway(i, sec = 40) {
    this.cwIndex = ((i % COLORWAYS.length) + COLORWAYS.length) % COLORWAYS.length;
    this.colorway = COLORWAYS[this.cwIndex];
    this.inkBlend = { from: this.PU.uPal.value.map(v => v.clone()), to: this.colorway.c.map(hexV), t0: performance.now(), dur: sec * 1000 };
  }
  stepInk() {
    const b = this.inkBlend; if (!b) return;
    let k = Math.min(1, (performance.now() - b.t0) / b.dur); k = k * k * (3 - 2 * k);
    this.PU.uPal.value.forEach((v, j) => v.copy(b.from[j]).lerp(b.to[j], k));
    if (k >= 1) this.inkBlend = null;
  }
  inks() { return this.PU.uPal.value.map(v => '#' + [v.x, v.y, v.z].map(c => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0')).join('')); }
  material(frag, vert, extra = {}) {
    return new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: Object.assign({}, this.SH, extra), side: THREE.DoubleSide });
  }
  build() {
    // sky dome
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(300000, 32, 16), this.material(SKY_FRAG, SKY_VERT));
    this.sky.frustumCulled = false; this.envScene.add(this.sky);
    // sun + moon discs
    const disc = (moon) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material(DISC_FRAG, DISC_VERT, {
        uIsMoon: { value: moon ? 1 : 0 }, uIllum: { value: 1 }, uDim: { value: 1 }, uLit: { value: new THREE.Vector2(1, 0) } }));
      m.frustumCulled = false; this.envScene.add(m); return m;
    };
    this.sunDisc = disc(false); this.moonDisc = disc(true);
    // ocean: radial grid around the camera
    const rings = 150, segs = 128, pos = [], idx = [];
    for (let i = 0; i <= rings; i++) {
      const r = i === 0 ? 0 : 2 * Math.pow(1.077, i) - 2;
      for (let j = 0; j < segs; j++) { const a = j / segs * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
    }
    for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) {
      const a = i * segs + j, b = i * segs + (j + 1) % segs, c = (i + 1) * segs + j, d = (i + 1) * segs + (j + 1) % segs;
      idx.push(a, c, b, b, c, d);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx);
    this.seaU = { uW: { value: Array.from({ length: NW }, () => new THREE.Vector4()) }, uPh: { value: new Array(NW).fill(0) },
      uChop: { value: 0.3 } };
    this.sea = new THREE.Mesh(sg, this.material(SEA_FRAG, SEA_VERT, this.seaU));
    this.sea.frustumCulled = false; this.envScene.add(this.sea);
    // authored trade-wind cumulus: instanced puffs on a wrapping 60 km tile
    const puff = partGeo(new THREE.IcosahedronGeometry(1, 2), 6, V(1, 0.15, 0));
    this.CLOUD_N = 900; this.TILE = 60000;
    this.clouds = new THREE.InstancedMesh(puff, this.material(OBJ_FRAG, OBJ_VERT, { uGhost: { value: 0 }, uProp: { value: 0 }, uLamp: { value: 0 } }), this.CLOUD_N);
    this.clouds.frustumCulled = false; this.envScene.add(this.clouds);
    let s = 1937; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    this.cloudBase = [];
    for (let c = 0; c < 150; c++) {
      const cx = rnd() * this.TILE, cz = rnd() * this.TILE, base = 620 + rnd() * 260, size = 180 + rnd() * 520;
      for (let k = 0; k < 6; k++) {
        const ox = (rnd() - 0.5) * size * 1.6, oz = (rnd() - 0.5) * size * 1.2, r = size * (0.45 + rnd() * 0.5);
        this.cloudBase.push({ x: cx + ox, z: cz + oz, y: base + r * 0.45 + rnd() * size * 0.3, sx: r, sy: r * (0.55 + rnd() * 0.35), sz: r * (0.8 + rnd() * 0.3) });
      }
    }
    // aircraft (observer copy of model state) + optional candidate ghost
    const eg = buildElectra();
    this.acMatU = { uGhost: { value: 0 }, uProp: { value: 0 }, uLamp: { value: 0.2 } };
    this.ac = new THREE.Mesh(eg, this.material(OBJ_FRAG, OBJ_VERT, this.acMatU));
    this.nearScene.add(this.ac);
    this.ghostU = { uGhost: { value: 1 }, uProp: { value: 0 }, uLamp: { value: 0 } };
    this.ghost = new THREE.Mesh(eg, this.material(OBJ_FRAG, OBJ_VERT, this.ghostU));
    this.ghost.visible = false; this.nearScene.add(this.ghost);
  }
  resize(w, h) {
    this.W = w; this.H = h;
    this.renderer.setSize(w, h, false);
    const IH = Math.min(this.opts.lines, h), IW = Math.max(2, Math.round(IH * w / h));
    this.rtData.setSize(IW, IH); this.rtPrint.setSize(IW, IH);
    this.PU.uRes.value.set(IW, IH);
    for (const c of [this.camFar, this.camNear]) { c.aspect = w / h; c.updateProjectionMatrix(); }
    this.SH.uAspect.value = w / h;
  }
  /* state: {lat, lon, east, north, headingDeg, bankDeg, scenarioMs, windN, windE, alt, fuel, ended}
     cam:   {pos (rel. aircraft, world axes), look (rel.), fov}
     t:     seconds (for waves / props) */
  render(state, cam, t, ghost, asGhost = false) {
    if (this.lost) return;
    const S = this.SH;
    // ---- Forces: real sun/moon geometry at the aircraft position and scenario time
    const sun = sunPos(state.scenarioMs, state.lat, state.lon), moon = moonPos(state.scenarioMs, state.lat, state.lon);
    this.sun = sun; this.moon = moon;
    const sd = azElVec(sun.az, sun.el), md = azElVec(moon.az, moon.el);
    S.uSunD.value.copy(sd); S.uMoonD.value.copy(md);
    const day = THREE.MathUtils.smoothstep(sun.el, -12, 5);   // includes civil + nautical twilight
    const moonUp = THREE.MathUtils.smoothstep(moon.el, -2, 4);
    S.uDay.value = day; S.uMoonUp.value = moonUp;
    const starlight = V(0.25, 1, -0.2).normalize();          // authored night key: diffuse sky glow from above
    const key = day > 0.05 ? sd : (moonUp > 0.05 ? md : starlight);
    S.uKeyD.value.copy(key.y < 0.02 ? V(key.x, 0.02, key.z).normalize() : key);
    S.uKeyUp.value = day > 0.05 ? THREE.MathUtils.smoothstep(sun.el, -3, 4) : (moonUp > 0.05 ? 0.25 + 0.35 * moon.illum : 0.22);
    S.uAmb.value = 0.2 + 0.14 * day + 0.06 * moonUp * moon.illum;
    S.uDiff.value = 0.25 + 0.5 * day;
    S.uSkyB.value = 0.3 + 0.4 * day;
    S.uFogShade.value = 0.24 + 0.48 * day;
    S.uFogD.value = 45000 + 25000 * day;
    S.uTime.value = t;
    this.stepInk();
    const wind = new THREE.Vector2(state.windE, -state.windN).multiplyScalar(0.514);  // m/s, +x east, -z north
    S.uWind.value.copy(wind).multiplyScalar(1 / 40);
    // ---- camera (aircraft at origin x/z, altitude y)
    const acPos = V(0, state.alt, 0);
    const cPos = acPos.clone().add(cam.pos), cLook = acPos.clone().add(cam.look);
    for (const c of [this.camFar, this.camNear]) {
      c.fov = cam.fov; c.position.copy(cPos); c.up.set(0, 1, 0); c.lookAt(cLook);
      if (cam.roll) c.rotateZ(cam.roll);
      c.updateProjectionMatrix(); c.updateMatrixWorld();
    }
    S.uCamP.value.copy(cPos);
    // ---- sky bodies
    this.sky.position.copy(cPos);
    const place = (m, d, size, dist) => { m.position.copy(cPos).addScaledVector(d, dist); m.scale.setScalar(size); m.lookAt(cPos); };
    place(this.sunDisc, sd, 2600, 250000); this.sunDisc.visible = sun.el > -2;
    place(this.moonDisc, md, 2200, 240000); this.moonDisc.visible = moon.el > -2;
    this.moonDisc.material.uniforms.uIllum.value = moon.illum;
    this.moonDisc.material.uniforms.uDim.value = 0.6 + 0.4 * (1 - day);
    // ---- sea: absolute position via per-wave phase (double precision on CPU)
    const ws = Math.min(18, wind.length() * 1.94 + 6);   // synthetic wind → sea state (knots-ish)
    const wdir = Math.atan2(wind.y, wind.x || 1e-6);
    const waves = [[0, 95, 0.55], [0.35, 62, 0.4], [-0.42, 40, 0.28], [0.9, 23, 0.15], [-1.1, 14, 0.08], [1.6, 8, 0.04]];
    const offX = state.east, offZ = -state.north;
    waves.forEach(([da, L, a], i) => {
      const dir = wdir + da, k = 2 * Math.PI / L, dx = Math.cos(dir), dz = Math.sin(dir);
      this.seaU.uW.value[i].set(dx, dz, k, a * (0.35 + ws / 18));
      this.seaU.uPh.value[i] = (k * (dx * offX + dz * offZ)) % (Math.PI * 2);
    });
    this.seaU.uChop.value = ws / 18;
    // ---- clouds: wrap the authored tile around the aircraft, drift with synthetic wind
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(), p = V();
    // clouds ride the (synthetic) air mass: ground position drifts with wind over flight time
    const T = this.TILE, fs = state.flightSec || 0, driftX = -wind.x * fs, driftZ = -wind.y * fs;
    let n = 0;
    for (const c of this.cloudBase) {
      if (n >= this.CLOUD_N) break;
      const x = (((c.x - offX - driftX) % T) + T) % T - T / 2, z = (((c.z - offZ - driftZ) % T) + T) % T - T / 2;
      p.set(x, c.y, z); sc.set(c.sx, c.sy, c.sz);
      m.compose(p, q, sc); this.clouds.setMatrixAt(n++, m);
    }
    this.clouds.count = n; this.clouds.instanceMatrix.needsUpdate = true;
    // ---- aircraft
    const yaw = -state.headingDeg * D2R, bank = (state.bankDeg || 0) * D2R;
    this.ac.position.copy(acPos);
    this.ac.rotation.set(0, 0, 0); this.ac.rotateY(yaw); this.ac.rotateZ(-bank);
    this.ac.visible = !state.ended;
    this.acMatU.uProp.value = t * 31.0;
    this.acMatU.uLamp.value = 0.55 + 0.45 * (1 - day);
    this.acMatU.uGhost.value = asGhost ? 1 : 0;
    if (ghost) {
      this.ghost.visible = true;
      this.ghost.position.set(ghost.dx, state.alt + ghost.dy, ghost.dz);
      this.ghost.rotation.set(0, 0, 0); this.ghost.rotateY(-ghost.headingDeg * D2R);
    } else this.ghost.visible = false;
    // ---- passes: env (far camera), then near objects with cleared depth
    const r = this.renderer;
    r.setRenderTarget(this.rtData); r.setClearColor(0x000000, 1); r.clear(true, true, true);
    S.uVP.value.multiplyMatrices(this.camFar.projectionMatrix, this.camFar.matrixWorldInverse);
    r.render(this.envScene, this.camFar);
    r.clearDepth();
    S.uVP.value.multiplyMatrices(this.camNear.projectionMatrix, this.camNear.matrixWorldInverse);
    r.render(this.nearScene, this.camNear);
    this.quad.material = this.printMat; r.setRenderTarget(this.rtPrint); r.render(this.post, this.postCam);
    this.quad.material = this.blitMat; r.setRenderTarget(null); r.clear(); r.render(this.post, this.postCam);
  }
}
