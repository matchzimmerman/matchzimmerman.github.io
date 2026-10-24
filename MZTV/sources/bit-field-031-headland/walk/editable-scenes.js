/* TO SEE WHAT SEALS SEE / HEADLAND walkable memory landscape.
   Injected ONLY into HEADLAND / WALK's private scene instance, never the broadcast.
   These are interpretive landmarks based on the chapbook and the artist's descriptions,
   not survey-accurate placements. All forms use the original six-ink materials. */
const SEALS_SCENES = [];
// EDITABLE HEADLAND / asset identities are stable across screenshots, JSON and Git commits.
const SEALS_EDITABLE=[];
let activeSEALS=null;
function beginSEALS(id,title,x,z){
  if(activeSEALS)throw Error("Nested SEALS asset: "+id);
  activeSEALS={id,title,baseX:x,baseZ:z,x,z,rotation:0,kind:id.startsWith("wall-")?"wall":"site",
    parts:Array.from({length:16},()=>[]),group:null};
  SEALS_EDITABLE.push(activeSEALS);
}
function endSEALS(){if(!activeSEALS)throw Error("End SEALS without a group");activeSEALS=null}
function setSEALSPosition(id,x,z,rotation=0){
  const a=SEALS_EDITABLE.find(v=>v.id===id);
  if(!a||![x,z,rotation].every(Number.isFinite)||Math.abs(x)>400||Math.abs(z)>450)return false;
  a.x=x;a.z=z;a.rotation=rotation;
  a.group.position.set(x,terrainH(x,z)-terrainH(a.baseX,a.baseZ),z);
  a.group.rotation.y=rotation;
  const m=SEALS_SCENES.find(v=>v.key===id);
  if(m){m.x=x;m.z=z}
  if(id==="wall-01"){const w=SEALS_SCENES.find(v=>v.key==="walls");if(w){w.x=x;w.z=z}}
  if(id.startsWith("hay-")){const hay=SEALS_SCENES.find(v=>v.key==="hay");if(hay&&id==="hay-02"){hay.x=x;hay.z=z}}
  return true;
}
function SEALSLayout(){
 return SEALS_EDITABLE.map(a=>({id:a.id,x:+a.x.toFixed(3),z:+a.z.toFixed(3),r:+a.rotation.toFixed(5)}));
}
{
  const AT=(x,z,dy=0)=>V(x,terrainH(x,z)+dy,z);
  const MT=Array.from({length:16},(_,i)=>objMat(i));
  // Geometry batches per movable asset and ink; retained for efficient GPU rendering.
  const add=(geo,id,x,y,z,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,MT[id]);m.position.set(x,y,z);m.rotation.y=ry;m.rotation.z=rz;
    if(!activeSEALS)throw Error("Unregistered SEALS geometry: "+id);
    activeSEALS.parts[id].push(m);return m;
  };
  const cube=(x,y,z,w,h,d,id=4,ry=0,rz=0)=>add(new THREE.BoxGeometry(w,h,d),id,x,y,z,ry,rz);
  const tube=(ax,ay,az,bx,by,bz,r,id=6)=>{
    const a=V(ax,ay,az),b=V(bx,by,bz),d=b.clone().sub(a),m=add(new THREE.CylinderGeometry(r,r,d.length(),7),id,...a.clone().add(b).multiplyScalar(.5).toArray());
    m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return m;
  };
  const marker=(key,title,x,z,range=16)=>{
    SEALS_SCENES.push({key,title,x,z,range});
  };
  // Dry-stone walls: irregular unmortared blocks, no identical prefab slabs.
  const wall=(ax,az,bx,bz,rows=2)=>{
    const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),steps=Math.max(1,Math.floor(len/1.55));
    for(let row=0;row<rows;row++)for(let i=0;i<steps;i++){
      const u=(i+.5+(row%2)*.3)/steps,x=lerp(ax,bx,u),z=lerp(az,bz,u);
      const y=terrainH(x,z)+.35+row*.65;
      const wob=.12*Math.sin(i*4.7+row*3);
      cube(x,y,z,Math.min(1.8,len/steps)*(.85+.1*Math.sin(i)),.55+.08*Math.cos(i*5),.9+wob,4,Math.atan2(-dz,dx),.025*Math.sin(i+row));
    }
    for(let i=0;i<steps;i+=2){const u=(i+.5)/steps,x=lerp(ax,bx,u),z=lerp(az,bz,u);cube(x,terrainH(x,z)+rows*.65+.18,z,1.8,.27,1.15,4,Math.atan2(-dz,dx));}
  };
  // The grandparents' farm core. Stone edges connect the house to inland fields.
  beginSEALS("wall-01","STONE WALL 01",96.5,167.5);wall(97,184,96,151);endSEALS();beginSEALS("wall-02","STONE WALL 02",92,144.5);wall(96,151,88,138);endSEALS();beginSEALS("wall-03","STONE WALL 03",35,106.5);wall(35,115,35,98);endSEALS();beginSEALS("wall-04","STONE WALL 04",24,93.5);wall(28,99,20,88);endSEALS();
  beginSEALS("wall-05","STONE WALL 05",117,189.5);wall(106,189,128,190);endSEALS();beginSEALS("wall-06","STONE WALL 06",128,179);wall(128,190,128,168);endSEALS();beginSEALS("wall-07","STONE WALL 07",123,164.5);wall(128,168,118,161);endSEALS();
  beginSEALS("wall-08","STONE WALL 08",47,202.5);wall(60,201,34,204,2);endSEALS();beginSEALS("wall-09","STONE WALL 09",24,205.5);wall(34,204,14,207,2);endSEALS();
  marker("walls","STONE WALLS",97,159,19);

  // Old apple tree with broad, uneven canopy and scattered fruit.
  function tree(x,z,scale=1,apple=false){
    const y=terrainH(x,z),h=7.6*scale;
    tube(x,y,x===0?0:z,x+.45*scale,y+h,z+.15*scale,.36*scale,6);
    for(let i=0;i<5;i++){
      const a=i*TAU/5+.28,rx=Math.cos(a),rz=Math.sin(a);
      tube(x+.2*scale,y+h*.59,z,x+rx*3.1*scale,y+h*(.96+Math.sin(i)*.06),z+rz*2.9*scale,.18*scale,6);
    }
    for(let i=0;i<9;i++){
      const a=i*TAU/9,r=2.4*scale;
      const m=add(new THREE.IcosahedronGeometry((1.5+.2*Math.cos(i))*scale,1),5,x+Math.cos(a)*r,y+h+(.45*Math.sin(i))*scale,z+Math.sin(a)*r);
      m.scale.set(1.35,.79,1.03);
    }
    if(apple){
      for(let i=0;i<6;i++){const a=i*TAU/6+.4,r=1.7*scale;
        add(new THREE.SphereGeometry(.17*scale,8,6),3,x+Math.cos(a)*r,y+h-.8*scale+Math.sin(i*2)*.45,z+Math.sin(a)*r);}
    }
  }
  beginSEALS("apple","APPLE TREE",85,153);
  tree(85,153,1.0,true);endSEALS();
  marker("apple","APPLE TREE",85,153,14);

  // Bicycle leaning against the apple tree: two distinct wheels, triangular dark frame.
  beginSEALS("bicycle","OLD BLACK BICYCLE",88,153.8);
  {
    const x=88,z=153.8,y=terrainH(x,z),m=7;
    for(const wx of [x-1.45,x+1.45]){
      const wh=add(new THREE.TorusGeometry(.78,.075,7,22),m,wx,y+.83,z,.15,0);
      wh.rotation.x=.08;
      for(let a=0;a<6;a++){let t=a*TAU/6;tube(wx,y+.83,z,wx+Math.cos(t)*.7,y+.83+Math.sin(t)*.7,z,.018,7);}
    }
    const ax=x-1.45,bx=x+1.45;
    tube(ax,y+.85,z,x-.28,y+1.9,z-.15,.07,7);
    tube(x-.28,y+1.9,z,x+.2,y+.86,z-.1,.07,7);
    tube(x+.2,y+.86,z,ax,y+.85,z,.07,7);
    tube(x-.28,y+1.9,z,x+1.45,y+.85,z,.07,7);
    tube(x+.2,y+.86,z,bx,y+.85,z,.07,7);
    tube(x-1,y+2.03,z-.16,x+.1,y+2.03,z-.16,.07,7);
    tube(bx-.12,y+1.23,z,bx-.28,y+2.05,z-.18,.065,7);
    tube(bx-.64,y+2.05,z-.18,bx+.14,y+2.05,z-.18,.07,7);
    cube(x-.28,y+2.1,z-.12,.9,.08,.35,7);
  }
  endSEALS();
  marker("bicycle","OLD BLACK BICYCLE",88,153.8,14);

  // A deep green painted farm gate with two concrete piers, rusty hinge points.
  beginSEALS("gate","PAINTED GREEN GATE",35,99);
  {
    const x=35,z=99,y=terrainH(x,z);
    for(const sx of [-3.15,3.15])cube(x+sx,terrainH(x+sx,z)+1.05,z,1,2.1,1,9);
    for(const dy of [.42,1.1,1.85])cube(x,y+dy,z-.05,5.7,.13,.15,5);
    for(let u=-2.7;u<=2.7;u+=.57)cube(x+u,y+1.15,z-.05,.12,1.75,.12,5);
    for(const sx of [-2.85,2.85])for(const dy of [.46,1.8])add(new THREE.SphereGeometry(.13,8,6),3,x+sx,y+dy,z+.08);
    // Barbed/twisted wire above the gate, held sparingly, not a bright decorative sign.
    for(let i=0;i<8;i++){
      const xx=x-2.8+i*.79;tube(xx,y+2.01,z,xx+.55,y+2.01+.04*Math.sin(i),z,.02,7);
    }
  }
  endSEALS();
  marker("gate","PAINTED GREEN GATE",35,99,17);

  // An older green hay barn, open-fronted, rough boards and raised dry floor.
  beginSEALS("barn","GREEN HAY BARN",109,180);
  {
    const x=109,z=180,y=terrainH(x,z);
    cube(x,y+.24,z,12,.42,9,6);
    for(const sx of [-5.5,5.5])for(const sz of [-3.8,3.8]){
      cube(x+sx,y+2.7,z+sz,.65,5.4,.65,6);
    }
    // vertical green-clad walls; open front faces the path
    cube(x,y+2.5,z+4.3,12,4.8,.3,5);
    cube(x-5.7,y+2.45,z,.3,4.8,8.5,5);
    cube(x+5.7,y+2.45,z,.3,4.8,8.5,5);
    for(const dx of [-3.2,3.2]){
      const roof=cube(x+dx,y+5.8,z,7.4,.3,10,7,0,dx<0?-.22:.22);
    }
    for(let i=0;i<5;i++){const hx=x-3.7+i*1.7;cube(hx,y+.9,z-.8,1.4,1.45,2.5,12);}
    // Elevated hay dry-stacked on wooden pallets.
    for(let i=0;i<4;i++)cube(x-4.6+i*2.8,y+.42,z-2.4,2.5,.12,3.2,6);
  }
  endSEALS();
  marker("barn","GREEN HAY BARN",109,180,18);

  // Hay stacks in the field by the beach: coastal groups distinct from turf bog.
  {
    const hay=[[ -54,41,2.6 ],[-43,37,2.2],[-58,54,2.3],[-30,46,2.9],[-18,49,2.4],[-4,49,1.9]];
    for(const [i, [x,z,r]] of hay.entries()){
      beginSEALS("hay-"+String(i+1).padStart(2,"0"),"COASTAL HAYSTACK "+String(i+1).padStart(2,"0"),x,z);
      const y=terrainH(x,z);
      add(new THREE.ConeGeometry(r,r*2.2,11,6),12,x,y+r*1.07,z,Math.sin(x));
      add(new THREE.IcosahedronGeometry(r*.86,0),6,x,y+r*.31,z);
      cube(x,y+.15,z,r*1.8,.24,r*1.8,6);
      endSEALS();
    }
  }
  marker("hay","HAYSTACKS BY THE BEACH",-43,42,28);

  // Turves stood upright in lines to dry on the bog (distinct from the hay).
  beginSEALS("turf","TURF STACKS ON THE BOG",-50,202);
  {
    const x0=-56,z0=196;
    for(let row=0;row<6;row++)for(let i=0;i<10;i++){
      const x=x0+i*1.2,z=z0+row*2.0,y=terrainH(x,z);
      // Turf pieces lean into one another as small drying stacks.
      cube(x-.18,y+.35,z,.32,.74,.75,7,0,-.16);
      cube(x+.2,y+.35,z,.32,.72,.76,7,0,.16);
      if(i%2===0)cube(x,y+.79,z,.68,.24,.66,7);
    }
  }
  endSEALS();
  marker("turf","TURF STACKS ON THE BOG",-50,202,24);

  // TASK 01.a–d / GRAVESITE 12: western cliff promontory.
  // Inferred from the supplied Illustrator red-circle markup, not georeferenced survey data.
  // One assembly, same HEADLAND six-ink geometry and no invented inscriptions.
  const GRAVESITE_ANCHOR={x:-136,z:-124}; // +/- a few world units pending photo reference
  beginSEALS("gravesite","GRAVESITE ON WEST CLIFF",GRAVESITE_ANCHOR.x,GRAVESITE_ANCHOR.z);
  {
    const gx=GRAVESITE_ANCHOR.x,gz=GRAVESITE_ANCHOR.z;
    // Preserve the original three-sided dry-stone perimeter.
    // The open eastern side faces inland, with the western wall facing the sea.
    wall(gx-9,gz-7,gx+7,gz-7,2);
    wall(gx-9,gz-7,gx-9,gz+12,2);
    wall(gx-9,gz+12,gx+7,gz+12,2);
    // Preserve the same three unscripted headstones and ground slabs;
    // every component samples the actual local cliff height.
    for(const [dx,dz] of [[-5,0],[0,4],[4,-2]]){
      const x=gx+dx,z=gz+dz,b=terrainH(x,z);
      cube(x,b+.78,z,.85,1.55,.35,9,.06*Math.sin(dx));
      add(new THREE.SphereGeometry(.48,10,7),9,x,b+1.5,z);
      cube(x,b+.08,z,1.1,.16,2.2,4);
    }
    // Retain the original weather-shaped rocks, moved with the enclosure.
    for(let i=0;i<4;i++){
      const x=gx-11+i*5,z=gz+12;
      const m=add(new THREE.IcosahedronGeometry(1.3+.35*Math.cos(i),0),4,x,terrainH(x,z)+.5,z);
      m.scale.set(1.4,.65,1);
    }
  }
  endSEALS();
  marker("gravesite","GRAVESITE ON WEST CLIFF",GRAVESITE_ANCHOR.x,GRAVESITE_ANCHOR.z,24);
  // Retain per-asset movable pivot while batching by ink WITHIN each asset.
  // Geometry lives in local group coordinates; base position is from source code.
  for(const a of SEALS_EDITABLE){
    const group=new THREE.Group();
    group.name="MZ.asset."+a.id;group.userData.sealsId=a.id;
    group.position.set(a.baseX,0,a.baseZ);
    for(let id=0;id<a.parts.length;id++){
      const meshes=a.parts[id];if(!meshes.length)continue;
      const parts=[];
      for(const mesh of meshes){
        mesh.updateMatrix();
        const geo=mesh.geometry.clone();
        geo.applyMatrix4(mesh.matrix);
        geo.translate(-a.baseX,0,-a.baseZ);
        parts.push(geo.index?geo.toNonIndexed():geo);
        geo.dispose();
      }
      const merged=mergeGeometries(parts,false);
      parts.forEach(g=>g.dispose());
      if(!merged)throw Error("SEALS asset merge failed: "+a.id+" / ink "+id);
      const model=new THREE.Mesh(merged,MT[id]);
      model.userData.sealsId=a.id;
      group.add(model);
    }
    scene.add(group);a.group=group;a.parts=null;
  }
}
