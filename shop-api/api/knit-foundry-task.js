var requireAdmin=require("../lib/auth").requireAdmin;
var printful=require("../lib/printful");

module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Robots-Tag","noindex,nofollow");
  if(!requireAdmin(req,res)) return;
  try{
    var raw=String(req.query&&req.query.ids||"");
    var ids=raw.split(",").map(function(x){return x.trim();}).filter(Boolean);
    if(!ids.length){
      res.statusCode=400;
      res.setHeader("Content-Type","application/json; charset=utf-8");
      return res.end(JSON.stringify({ok:false,error:"ids required"},null,2));
    }

    var stores=await printful.listStores();
    var store=stores.find(function(s){
      return String(s.name||"").toLowerCase().indexOf("match zimmerman")>=0;
    })||stores[0];
    if(!store) throw new Error("No Printful store available.");

    var result=await printful.getMockupTasksV2(store.id,ids);
    res.statusCode=200;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({ok:true,tasks:result.data||[]},null,2));
  }catch(error){
    res.statusCode=error.status||500;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({ok:false,error:error.message,detail:error.payload||null},null,2));
  }
};