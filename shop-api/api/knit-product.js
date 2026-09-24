var printful=require("../lib/printful");

module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Robots-Tag","noindex,nofollow");
  var id=req.query&&req.query.id;
  if(!id){
    res.statusCode=400;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    return res.end(JSON.stringify({ok:false,error:"id required"},null,2));
  }
  try{
    var results=await Promise.all([
      printful.getCatalogProductV2(id),
      printful.listCatalogVariantsV2(id),
      printful.listMockupStylesV2(id)
    ]);
    res.statusCode=200;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({
      ok:true,
      product:results[0].data,
      variants:results[1],
      mockup_styles:results[2]
    },null,2));
  }catch(error){
    res.statusCode=error.status||500;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({ok:false,error:error.message,detail:error.payload||null},null,2));
  }
};