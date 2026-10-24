import * as THREE from 'three';

// KAATERSKILL — topologically informed sculptural terrain.
// Coordinates are local world metres, NOT surveyed GPS/DEM vertices.
// Real-world anchors: Spruce Creek, upper/lower tiers, upper overlook,
// connecting trail and the 2016 approximately 200-step stone staircase.
export const SITE={lat:42.193234,lon:-74.063044,name:'KAATERSKILL FALLS'};
export const INKS=['#1b1f3a','#2c3e7a','#3f9aa6','#f0603f','#f2c14e','#efe6cf'];
const PI=Math.PI,TAU=2*PI;
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(a,b,v)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{let t=clamp(0,1,(v-a)/(b-a));return t*t*(3-2*t)};
function hash(x,z){const n=Math.sin(x*127.1+z*311.7+18.73)*43758.5453;return n-Math.floor(n)}
function noise(x,z){const a=Math.floor(x),b=Math.floor(z),u=smooth(0,1,x-a),v=smooth(0,1,z-b);return lerp(lerp(hash(a,b),hash(a+1,b),u),lerp(hash(a,b+1),hash(a+1,b+1),u),v)}
function fbm(x,z){return .58*noise(x,z)+.29*noise(x*2.03,z*2.03)+.13*noise(x*4.09,z*4.09)}
let seed=4221825;
export function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}

export const LOWER_STAIR=[
 [19,-91,8],[30,-80,12],[53,-85,17],[71,-77,21],
 [74,-60,26],[52,-55,30],[52,-37,35],[69,-28,40],[46,-19,44]
];
export const UPPER_CONNECTOR=[
 [47,54,99],[92,48,98],[105,12,82],[103,-22,66],[82,-32,53],[65,-20,44],[46,-19,44]
];
export const MIDDLE_SPUR=[[46,-19,44],[33,-20,42],[21,-19,40]];
export const UPPER_ACCESS=[[92,48,98],[70,55,99],[47,54,99],[38,43,97]];
export const LOWER_ACCESS=[[19,-91,8],[14,-107,7],[11,-135,5]];
export const ROUTES=[LOWER_STAIR,UPPER_CONNECTOR,MIDDLE_SPUR,UPPER_ACCESS,LOWER_ACCESS];
export const PLACES=[
 {name:'UPPER OVERLOOK',x:38,z:43,y:99,note:'Laurel House approach'},
 {name:'STONE STAIR · TOP',x:46,z:-19,y:44,note:'2016 trail connection'},
 {name:'MIDDLE POOL',x:21,z:-19,y:40,note:'Upper drop · lower lip'},
 {name:'STONE STAIR · BASE',x:19,z:-91,y:8,note:'200-stone-step study'},
 {name:'LOWER BASIN',x:11,z:-135,y:5,note:'Spruce Creek downstream'}
];
function segmentNear(x,z,line){
 let best={d:Infinity,y:0,t:0};
 for(let k=1;k<line.length;k++){
  const a=line[k-1],b=line[k],dx=b[0]-a[0],dz=b[1]-a[1],len=dx*dx+dz*dz;
  const t=clamp(0,1,((x-a[0])*dx+(z-a[1])*dz)/len);
  const px=a[0]+dx*t,pz=a[1]+dz*t,d=Math.hypot(x-px,z-pz);
  if(d<best.d)best={d,y:lerp(a[2],b[2],t),t};
 }
 return best;
}
export function height(x,z){
 const valley=4+7*smooth(-120,-52,z)+27*smooth(-41,-34,z)+54*smooth(-1,13,z)+Math.max(0,z-14)*.026;
 const cliffBank=smooth(10,83,Math.abs(x))*(2+25*(1-smooth(-55,21,z)));
 const shoulder=2.5*(fbm(x*.022,z*.022)-.5)+1.7*(fbm(x*.08+20,z*.08)-.5);
 let h=valley+cliffBank+shoulder;
 // Sculpt navigable corridors into the preliminary procedural relief.
 // This is a working trail topology, not a claim of surveyed alignment.
 for(const route of ROUTES){
  const p=segmentNear(x,z,route);
  const w=1-smooth(2.1,6.2,p.d);
  if(w>0)h=lerp(h,p.y-.22,w*.99);
 }
 return h;
}
export function nearRoute(x,z){
 let d=Infinity;for(const path of ROUTES)d=Math.min(d,segmentNear(x,z,path).d);
 return d;
}
export const meters=(x,z)=>height(x,z);
function mat(hex,opt={}){return new THREE.MeshStandardMaterial({color:hex,roughness:1,flatShading:true,...opt})}
const mats={
 ground:mat('#83866d',{vertexColors:true,side:THREE.DoubleSide}),
 stone:mat('#88847e'),stoneLight:mat('#a29a8a'),stoneDark:mat('#5a666b'),
 wood:mat('#574b44'),rail:mat('#7d7870'),path:mat('#b0a590'),
 trunk:mat('#535144'),pine:mat('#344e47'),leaf:mat('#828861'),
 fern:mat('#5a6d54'),water:mat('#5f99a3',{roughness:.3,metalness:.08}),
 marker:mat('#efc14e',{emissive:'#55380c',emissiveIntensity:.2})
};
export const LANDMARKS={upper:{x:0,z:12,top:95,bottom:42,span:53},
 lower:{x:0,z:-34,top:38,bottom:12,span:26}};
export function populate(scene){
 const land=buildTerrain();scene.add(land);
 buildCliffs(scene);buildWater(scene);buildStairs(scene);buildPaths(scene);
 buildOverlook(scene);buildBoulders(scene);buildForest(scene);buildSigns(scene);
 return {land,LANDMARKS};
}
function buildTerrain(){
 const N=225,X=155,Z=172;
 const pos=[],col=[],ix=[];
 const low=new THREE.Color('#4a6256'),mid=new THREE.Color('#818976'),rock=new THREE.Color('#8a8981');
 const autumn=new THREE.Color('#9a795a');
 for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
  const x=-X+2*X*i/N,z=-Z+2*Z*j/N,y=height(x,z);
  pos.push(x,y,z);
  const slope=Math.hypot(height(x+.8,z)-height(x-.8,z),height(x,z+.8)-height(x,z-.8));
  const barren=smooth(4,19,slope),forest=smooth(6,60,Math.abs(x));
  const c=low.clone().lerp(mid,forest*.85).lerp(rock,barren*.85);
  c.lerp(autumn,.13*noise(x*.047+1,z*.047+2));
  c.multiplyScalar(.88+.21*noise(x*.14,z*.14));
  col.push(c.r,c.g,c.b);
 }
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){
  let a=j*(N+1)+i,b=a+1,c=a+(N+1),d=c+1;
  ix.push(a,c,b,b,c,d);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
 g.setIndex(ix);g.computeVertexNormals();
 const o=new THREE.Mesh(g,mats.ground);o.receiveShadow=true;o.name='Catskill gorge (interpretive terrain)';
 return o;
}
function boxAt(scene,point,size,m,name){
 const o=new THREE.Mesh(new THREE.BoxGeometry(size[0],size[1],size[2]),m);
 o.position.set(point[0],point[1],point[2]);o.castShadow=true;o.receiveShadow=true;
 if(name)o.name=name;scene.add(o);return o;
}
function buildCliffs(scene){
 // Thin angular sandstone strata along the two escarpment faces.
 const strata=mat('#5f6465');
 for(const fall of Object.values(LANDMARKS)){
  for(let j=0;j<14;j++){
   const y=fall.bottom+(fall.top-fall.bottom)*(j+.45)/15;
   const z=fall.z+2.2+Math.sin(j*2.3)*.33;
   boxAt(scene,[0,y,z],[38+rand()*9,.32+rand()*.28,1.25],j%3===0?mats.stoneLight:strata,'Devonian strata');
  }
 }
 // Cliff talus: broad asymmetrical slabs, not stacked block architecture.
 for(let i=0;i<90;i++){
  const z=-135+rand()*157,x=(rand()<.5?-1:1)*(14+rand()*26);
  if(nearRoute(x,z)<5)continue;
  const y=height(x,z)+.1,w=1+rand()*7;
  const g=new THREE.IcosahedronGeometry(1,0);
  const rock=new THREE.Mesh(g,i%3?mats.stone:mats.stoneDark);
  rock.position.set(x,y,z);rock.scale.set(w,.3+rand()*2,w*.65);
  rock.rotation.set(rand()*.6,rand()*TAU,rand()*.6);rock.castShadow=true;scene.add(rock);
 }
}
function waterSheet(fall,idx){
 const geo=new THREE.PlaneGeometry(idx===0?15:11,fall.span,46,72);
 geo.rotateY(Math.PI); // face the lower viewing side
 const vertex=`
 uniform float uTime;uniform float uFlow;uniform float uBend;varying vec2 vUv;
 void main(){
 vUv=uv;vec3 p=position;
 // The sheet hugs the descending rock face rather than cutting through it.
 p.z -= (1.0-vUv.y)*uBend;
 p.x+=sin(vUv.x*46.0+uTime*1.2+vUv.y*22.0)*0.14+
       sin(vUv.x*17.0-uTime*1.9+vUv.y*9.0)*.26;
 p.z+=sin(vUv.x*31.0+vUv.y*43.0-uTime*4.0)*.34;
 p.x*=.91+.12*sin(vUv.y*3.14); 
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
 }`;
 const fragment=`
 uniform float uTime;uniform float uFlow;varying vec2 vUv;
 void main(){
 float streak=sin(vUv.x*122.0+vUv.y*21.0-uTime*7.0);
 streak=streak*.5+.5;
 float ribbons=sin(vUv.x*37.0-vUv.y*9.0+uTime*.7)*.5+.5;
 float breakup=sin(vUv.y*97.0-uTime*12.0+vUv.x*43.0)*.5+.5;
 float white=clamp(.27+.45*streak+.25*ribbons+.2*breakup,0.,1.);
 vec3 c=mix(vec3(.20,.50,.61),vec3(.95,.94,.81),white);
 float a=clamp(.67+.35*uFlow+.09*streak,0.,1.);
 gl_FragColor=vec4(c,a);
 }`;
 const material=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uFlow:{value:1},uBend:{value:idx===0?14:11}},
 vertexShader:vertex,fragmentShader:fragment,side:THREE.DoubleSide,transparent:true,depthWrite:false});
 const o=new THREE.Mesh(geo,material);
 o.position.set(fall.x,(fall.top+fall.bottom)/2,fall.z);o.renderOrder=3;
 return o;
}
const sheets=[];
function buildWater(scene){
 for(const [i,f] of Object.values(LANDMARKS).entries()){const w=waterSheet(f,i);scene.add(w);sheets.push(w)}
 const riverMat=new THREE.MeshStandardMaterial({color:'#528c94',transparent:true,opacity:.87,
 emissive:'#183841',emissiveIntensity:.12,side:THREE.DoubleSide,roughness:.34});
 for(const [a,b,w] of [[15,135,9],[-31,-3,9],[-164,-56,12]]){
  const p=[],ids=[],segments=84;
  for(let i=0;i<=segments;i++){
   const z=lerp(a,b,i/segments),xx=2.1*Math.sin(z*.07),y=height(0,z)+.35;
   p.push(xx-w/2,y,z,xx+w/2,y,z);
   if(i<segments){const k=i*2;ids.push(k,k+2,k+1,k+1,k+2,k+3)}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setIndex(ids);g.computeVertexNormals();scene.add(new THREE.Mesh(g,riverMat));
 }
 for(const [x,z,r] of [[0,-12,13],[0,-53,16]]){
  const circle=new THREE.Mesh(new THREE.CircleGeometry(r,60),new THREE.MeshBasicMaterial({color:'#6caab1',transparent:true,opacity:.72,side:THREE.DoubleSide}));
  circle.rotation.x=-PI/2;circle.position.set(x,height(0,z)+.4,z);scene.add(circle);
  for(let j=0;j<19;j++){
   const theta=j*TAU/19;
   const ring=new THREE.Mesh(new THREE.TorusGeometry(.8+rand()*1.9,.095,4,18),new THREE.MeshBasicMaterial({color:'#f0ead3',transparent:true,opacity:.52}));
   ring.rotation.x=PI/2;ring.position.set(x+Math.cos(theta)*r*.7,height(0,z)+.6,z+Math.sin(theta)*r*.7);scene.add(ring);
  }
 }
}
function pathCenters(route,n){
 const lengths=[],sum=[0];let total=0;
 for(let k=1;k<route.length;k++){total+=Math.hypot(route[k][0]-route[k-1][0],route[k][1]-route[k-1][1]);sum.push(total)}
 const out=[];
 for(let i=0;i<=n;i++){
  const d=total*i/n;let k=1;while(k<sum.length-1&&sum[k]<d)k++;
  const a=route[k-1],b=route[k],t=(d-sum[k-1])/(sum[k]-sum[k-1]);
  out.push({x:lerp(a[0],b[0],t),z:lerp(a[1],b[1],t),y:lerp(a[2],b[2],t),d,segment:k});
 }
 return out;
}
export const stairCenters=pathCenters(LOWER_STAIR,200);
function buildStairs(scene){
 const g=new THREE.BoxGeometry(1.65,.29,.74);
 const mesh=new THREE.InstancedMesh(g,mats.stoneLight,200);
 const dummy=new THREE.Object3D();
 for(let i=0;i<200;i++){
  const a=stairCenters[i],b=stairCenters[i+1],ang=Math.atan2(b.x-a.x,b.z-a.z);
  const jitter=(hash(i,21)-.5)*.08;
  dummy.position.set((a.x+b.x)/2,a.y+.11+jitter,(a.z+b.z)/2);
  dummy.rotation.set(0,ang,0);dummy.scale.set(1+.17*rand(),1,1);dummy.updateMatrix();
  mesh.setMatrixAt(i,dummy.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='200 hand-laid stone steps (topological study)';
 scene.add(mesh);
 // Retaining stones, occasional rock face handrails where path turns.
 for(let k=0;k<200;k+=3){
  const a=stairCenters[k],b=stairCenters[Math.min(k+1,200)];
  const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;
  const side=k%2===0?1:-1;
  const rock=new THREE.Mesh(new THREE.BoxGeometry(.4,.46,.85),k%3===0?mats.stoneDark:mats.stone);
  rock.position.set(a.x+side*(-dz/l)*1.14,a.y-.1,a.z+side*(dx/l)*1.14);
  rock.rotation.y=Math.atan2(dx,dz)+rand()*.24;scene.add(rock);
 }
}
function buildPaths(scene){
 const paths=[UPPER_CONNECTOR,MIDDLE_SPUR,UPPER_ACCESS,LOWER_ACCESS];
 const roadMat=new THREE.MeshStandardMaterial({color:'#a89983',roughness:1,side:THREE.DoubleSide});
 for(const route of paths){
  const pts=pathCenters(route,Math.ceil(route.length*32)),p=[],ids=[];
  for(let j=0;j<pts.length;j++){
   const a=pts[Math.max(0,j-1)],b=pts[Math.min(pts.length-1,j+1)],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;
   const nx=-dz/l,nz=dx/l,w=route===UPPER_CONNECTOR?1.15:.98;
   p.push(pts[j].x+nx*w,pts[j].y+.02,pts[j].z+nz*w,pts[j].x-nx*w,pts[j].y+.02,pts[j].z-nz*w);
   if(j<pts.length-1){const k=j*2;ids.push(k,k+2,k+1,k+1,k+2,k+3)}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ids);
  g.computeVertexNormals();scene.add(new THREE.Mesh(g,roadMat));
 }
}
function buildOverlook(scene){
 const x=38,z=43,y=height(x,z)+.15;
 boxAt(scene,[x,y-.24,z],[11,.42,7.7],mats.stoneLight,'Upper public viewing platform');
 for(let i=0;i<10;i++){
  const xx=x-5+i*1.13;
  boxAt(scene,[xx,y+.54,z-3.9],[.15,1.2,.18],mats.rail);
 }
 boxAt(scene,[x,y+1.15,z-3.9],[11,.14,.15],mats.wood);
 for(const zz of [-3.5,3.5]){
  boxAt(scene,[x+5.45,y+.52,z+zz],[.18,1.12,.17],mats.rail);
 }
 // Adjacent information kiosk
 boxAt(scene,[x+7,y+1.1,z+2],[2.1,1.35,.12],mats.wood);
}
function buildBoulders(scene){
 const g=new THREE.IcosahedronGeometry(1,0),items=170;
 const batch=new THREE.InstancedMesh(g,mats.stone,items);
 const o=new THREE.Object3D();for(let i=0;i<items;i++){
  const x=-18+rand()*36,z=-165+rand()*195,y=height(x,z);
  const r=.3+rand()*2.6;
  o.position.set(x,y+.2*r,z);o.scale.set(r,r*(.3+rand()*.5),r*.75);o.rotation.set(rand(),rand()*TAU,rand()*.5);
  o.updateMatrix();batch.setMatrixAt(i,o.matrix);
 }
 batch.instanceMatrix.needsUpdate=true;batch.receiveShadow=true;scene.add(batch);
}
function buildForest(scene){
 const gTrunk=new THREE.CylinderGeometry(.12,.23,1,5);
 const gLeaf=new THREE.IcosahedronGeometry(1,1),gPine=new THREE.ConeGeometry(1,2.6,6);
 const n=660;
 const trunks=new THREE.InstancedMesh(gTrunk,mats.trunk,n);
 const broad=new THREE.InstancedMesh(gLeaf,mats.leaf,n);
 const pine=new THREE.InstancedMesh(gPine,mats.pine,n);
 const colors=['#56715a','#6e7d58','#a98c52','#9d6c4d','#697959','#a27953'].map(s=>new THREE.Color(s));
 const p=new THREE.Object3D();let count=0;
 for(let i=0;i<n*4&&count<n;i++){
  const x=-148+rand()*296,z=-164+rand()*303;
  if(Math.abs(x)<15||nearRoute(x,z)<5.5)continue;
  const y=height(x,z);
  const steep=Math.hypot(height(x+1,z)-height(x-1,z),height(x,z+1)-height(x,z-1));
  if(steep>9)continue;
  const tall=6+rand()*10,evergreen=rand()<.29;
  p.position.set(x,y+tall*.25,z);p.rotation.set(0,rand()*TAU,0);p.scale.set(.75+rand()*.55,tall*.5,.75+rand()*.5);
  p.updateMatrix();trunks.setMatrixAt(count,p.matrix);
  p.position.y=y+tall*.83;p.scale.set(evergreen?2.9:3.3,tall*(evergreen?.41:.24),evergreen?2.9:3.1);
  p.updateMatrix();(evergreen?pine:broad).setMatrixAt(count,p.matrix);
  if(evergreen){broad.setColorAt(count,new THREE.Color('#324640'));broad.setMatrixAt(count,new THREE.Matrix4().makeScale(0,0,0))}
  else{pine.setMatrixAt(count,new THREE.Matrix4().makeScale(0,0,0));broad.setColorAt(count,colors[Math.floor(rand()*colors.length)])}
  count++;
 }
 for(const o of [trunks,broad,pine]){o.count=count;o.instanceMatrix.needsUpdate=true;o.castShadow=false;scene.add(o)}
 if(broad.instanceColor)broad.instanceColor.needsUpdate=true;
}
function buildSigns(scene){
 for(const s of PLACES.slice(0,4)){
  const y=height(s.x+3,s.z+2);
  boxAt(scene,[s.x+3,y+1.1,s.z+2],[.11,2.2,.11],mats.wood);
  boxAt(scene,[s.x+3,y+2.05,s.z+2],[1.7,.46,.13],mats.wood);
 }
}
const spray=[];
export function addSpray(scene){
 const points=[];
 for(const f of Object.values(LANDMARKS)){
  for(let i=0;i<145;i++){
   const x=(rand()-.5)*23,y=f.bottom+rand()*16,z=f.z-3+(rand()-.5)*20;
   points.push(x,y,z,f.bottom,f.z,rand()*TAU);
  }
 }
 const g=new THREE.BufferGeometry(),p=[];
 for(let i=0;i<points.length;i+=6)p.push(points[i],points[i+1],points[i+2]);
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 const m=new THREE.PointsMaterial({color:'#efe9d7',size:.65,transparent:true,opacity:.43,depthWrite:false,sizeAttenuation:true});
 const o=new THREE.Points(g,m);o.frustumCulled=false;scene.add(o);
 spray.push({o,points});
}
export function animateEnvironment(t,weather){
 for(const s of sheets){s.material.uniforms.uTime.value=t;s.material.uniforms.uFlow.value=weather.flow}
 for(const cloud of spray){
  const a=cloud.o.geometry.attributes.position;
  for(let i=0;i<a.count;i++){
   const j=i*6,base=cloud.points,age=((t*.32+base[j+5]/TAU)%1);
   a.setXYZ(i,base[j]+Math.sin(t*.45+i)*age*1.4+weather.wind*age*.06,
     base[j+3]+age*17,base[j+4]-4+Math.sin(t*.3+i)*4+(age*weather.wind*.12));
  }
  a.needsUpdate=true;
 }
}
export const weatherFallback=()=>({live:false,temp:13,cloud:55,rain:0,wind:3,flow:1});
