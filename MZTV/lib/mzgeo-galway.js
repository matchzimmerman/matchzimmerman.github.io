/* MZGEO v0.2 — source-backed Galway farmstead geography, presentation only.
   EPSG:2157 OSM building/road footprints and EU-DEM25m; gameplay pens are authored. */
(function(root){
'use strict';
const V=(x,y,z)=>({x,y,z}),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
class GalwayWorld {
 constructor(elevation,osm){
   if(!elevation||elevation.schema!=='mz-elevation-grid-1'||!osm||osm.schema!=='mz-osm-local-subset-1')throw Error('Galway source schema mismatch');
   this.elevation=elevation;this.osm=osm;this.origin=[506160,722560];this.datum=elevation.anchor_query_elevation_m;
   this.buildings=[];this.roads=[];this.walls=[];
   for(const [layer,arr] of Object.entries(osm.geometry)){
     for(const [id,kind,pts] of arr){const o={id,kind,pts};
       if(layer==='building')this.buildings.push(o);
       else if(layer==='highway')this.roads.push(o);
       else if(layer==='barrier')this.walls.push(o);
     }
   }
 }
 absoluteHeight(x,z){
   const e=this.elevation,xx=(this.origin[0]+x-e.sample_origin_itm_e_n[0])/e.sample_step_m,zz=(this.origin[1]+z-e.sample_origin_itm_e_n[1])/e.sample_step_m;
   const i=clamp(Math.floor(xx),0,e.columns-2),j=clamp(Math.floor(zz),0,e.rows-2),u=clamp(xx-i,0,1),v=clamp(zz-j,0,1),k=j*e.columns+i,a=e.samples_m;
   const interpolate=(p,q,t)=>p*(1-t)+q*t;
   const h=interpolate(interpolate(a[k],a[k+1],u),interpolate(a[k+e.columns],a[k+e.columns+1],u),v);
   return Number.isFinite(h)?h:this.datum;
 }
 height(x,z){return this.absoluteHeight(x,z)-this.datum;}
 p(x,z,up=0){return V(x,this.height(x,z)+up,z);}
 poly(g,P,points,color){const q=P.poly(points);if(!q)return;g.fillStyle=color;g.beginPath();q.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();}
 line(g,P,a,b,color,width=1.5){const seg=P.seg(this.p(a[0],a[1],.16),this.p(b[0],b[1],.16));if(!seg)return;g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(seg[0][0],seg[0][1]);g.lineTo(seg[1][0],seg[1][1]);g.stroke();}
 render(g,P,w,h){
   g.fillStyle='#29464f';g.fillRect(0,0,w,h);
   const inks=['#4b715e','#54775f','#5d8064','#668768','#708d69','#7b936b','#8a9872','#9e9d76'];
   const x0=-190,x1=410,z0=-285,z1=220,step=25;
   for(let z=z1-step;z>=z0;z-=step){for(let x=x0;x<x1;x+=step){
     const dh=this.height(x+step,z+step)-this.height(x,z);
     let band=clamp(Math.floor((this.absoluteHeight(x,z)-13)*.35),0,7);
     if(Math.abs(dh)>2&&((x+z)/step|0)%3===0)band=clamp(band+1,0,7);
     this.poly(g,P,[this.p(x,z),this.p(x+step,z),this.p(x+step,z+step),this.p(x,z+step)],inks[band]);
   }}
   for(const r of this.roads){
     const width=r.kind==='secondary'?4.8:r.kind==='service'?1.9:3.2;
     for(let k=1;k<r.pts.length;k++){
       const a=r.pts[k-1],b=r.pts[k],mid=this.p((a[0]+b[0])/2,(a[1]+b[1])/2,.2),screen=P.proj(mid);
       if(!screen)continue;
       const stroke=clamp(P.px(screen[2])*width,1.4,70);
       this.line(g,P,a,b,'#374d4c',stroke+1.8);
       this.line(g,P,a,b,r.kind==='secondary'?'#bac4a8':'#a9b69d',stroke);
     }
   }
   for(const wall of this.walls)for(let i=1;i<wall.pts.length;i++)this.line(g,P,wall.pts[i-1],wall.pts[i],'#e7d6b1',2.4);
   const camera=P.cam.pos;
   const buildings=this.buildings.slice().sort((a,b)=>{
     const cen=o=>o.pts.reduce((v,p)=>(v[0]+=p[0],v[1]+=p[1],v),[0,0]).map(n=>n/o.pts.length);
     const A=cen(a),B=cen(b);return Math.hypot(B[0]-camera.x,B[1]-camera.z)-Math.hypot(A[0]-camera.x,A[1]-camera.z);
   });
   const picked=new Set(['1163118488','1163356661','1163356662','1163356663']);
   for(const b of buildings){
     const pts=b.pts,wallHeight=b.kind==='house'?5.7:b.kind==='ruins'?1.8:3.5,selected=picked.has(b.id);
     for(let i=0;i<pts.length-1;i++){const a=pts[i],c=pts[i+1];this.poly(g,P,[this.p(a[0],a[1]),this.p(c[0],c[1]),this.p(c[0],c[1],wallHeight),this.p(a[0],a[1],wallHeight)],selected?'#a75d45':'#77675b');}
     this.poly(g,P,pts.map(q=>this.p(q[0],q[1],wallHeight)),selected?'#e5ba87':b.kind==='ruins'?'#c6b79f':'#bd9d83');
     if(selected)for(let i=1;i<pts.length;i++){const q=pts[i-1],r=pts[i],seg=P.seg(this.p(q[0],q[1],wallHeight+.06),this.p(r[0],r[1],wallHeight+.06));if(seg){g.strokeStyle='#efdcab';g.lineWidth=1.5;g.beginPath();g.moveTo(...seg[0]);g.lineTo(...seg[1]);g.stroke();}}
   }
   const bounds=[[-108,-68],[108,-68],[108,68],[-108,68],[-108,-68]];
   for(let i=1;i<bounds.length;i++)this.line(g,P,bounds[i-1],bounds[i],'rgba(240,240,185,.36)',1.0);
 }
}
root.MZGeo={version:'0.2.0',create:(e,o)=>new GalwayWorld(e,o)};
})(typeof window!=='undefined'?window:globalThis);
