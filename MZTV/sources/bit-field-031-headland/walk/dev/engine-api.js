  // All builder actions operate in this isolated developer world, not the broadcast.
  listBuilderAssets(){
    return SEALS_EDITABLE.map(a=>({id:a.id,title:a.title,kind:a.kind,
      x:a.x,z:a.z,r:a.rotation,baseX:a.baseX,baseZ:a.baseZ}));
  },
  moveBuilderAsset(id,x,z,r=0){return setSEALSPosition(id,x,z,r);},
  hitBuilderAsset(nx=0,ny=0){
    if(!Number.isFinite(nx)||!Number.isFinite(ny))return null;
    camera.updateMatrixWorld();
    const cast=new THREE.Raycaster();
    cast.setFromCamera(new THREE.Vector2(nx,ny),camera);
    const hits=cast.intersectObjects(SEALS_EDITABLE.map(a=>a.group),true);
    for(const h of hits){
      let obj=h.object;
      while(obj&&!obj.userData.sealsId)obj=obj.parent;
      if(obj?.userData.sealsId)return {id:obj.userData.sealsId,
        point:[h.point.x,h.point.y,h.point.z],distance:h.distance};
    }
    return null;
  },
  getBuilderTerrain(x,z){return terrainH(x,z);},
  captureBuilderFrame(){
    // CAPTURE=1 preserves real WebGL framebuffer.
    applyLook(0);render();
    const data=renderer.domElement.toDataURL("image/png");
    if(!data.startsWith("data:image/png"))throw Error("WebGL capture unavailable");
    return data;
  },
