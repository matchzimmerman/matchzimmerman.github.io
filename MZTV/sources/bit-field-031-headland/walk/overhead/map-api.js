  applyBuilderLayout(records){
    if(!Array.isArray(records))return;
    for(const a of records){
      if(a&&typeof a.id==="string"&&[a.x,a.z,a.r].every(Number.isFinite)){
        setSEALSPosition(a.id,a.x,a.z,a.r);
      }
    }
  },

mapShot(w=960,h=1280){
 w=clamp(Math.round(w),500,1700);h=clamp(Math.round(h),640,2300);
 const prev={camera,look:DIR.look,W,H,IW,IH,sun:sunM.visible,moon:moonM.visible};
 const cx=-10,cz=2.5,spanZ=535,spanX=spanZ*w/h;
 try{
   camera=new THREE.OrthographicCamera(-spanX/2,spanX/2,spanZ/2,-spanZ/2,0.5,40000);
   camera.up.set(0,0,-1);camera.position.set(cx,1800,cz);camera.lookAt(cx,0,cz);
   camera.fov=40;camera.updateProjectionMatrix();
   DIR.look={p:V(cx,1800,cz),tgt:V(cx,0,cz),fov:40};
   W=w;H=h;IH=Math.min(1100,h);IW=Math.round(IH*w/h);
   renderer.setSize(w,h,false);rtData.setSize(IW,IH);rtPrint.setSize(IW,IH);
   PU.uRes.value.set(IW,IH);
   applyLook(0);sunM.visible=false;moonM.visible=false;
   render();
   const png=renderer.domElement.toDataURL("image/png");
   if(!png.startsWith("data:image/png"))throw Error("The WebGL framebuffer did not return PNG data");
   return {png,w,h,cx,cz,spanX,spanZ,locations:[
     {name:"Keeper cottage",x:HOUSE.x,z:HOUSE.z,type:"HEADLAND"},
     {name:"Cliff path",x:-4,z:coastZ(-4)+9,type:"HEADLAND"},
     {name:"Gully stair top",x:PIER_X,z:zT,type:"HEADLAND"},
     {name:"Pier end",x:PIER_X,z:PIER_END_Z,type:"HEADLAND"},
     ...SEALS_SCENES.map(({title,x,z})=>({name:title,x,z,type:"SEALS"}))
   ]};
 }finally{
   camera=prev.camera;DIR.look=prev.look;
   W=prev.W;H=prev.H;IW=prev.IW;IH=prev.IH;
   renderer.setSize(W,H,false);rtData.setSize(IW,IH);rtPrint.setSize(IW,IH);
   PU.uRes.value.set(IW,IH);camera.aspect=W/H;camera.updateProjectionMatrix();
   applyLook(0);sunM.visible=prev.sun;moonM.visible=prev.moon;render();
 }
},
