var printful=require("../lib/printful");

function compactProduct(p){
  return {
    id:p.id,
    type:p.type,
    name:p.name || p.title,
    brand:p.brand,
    model:p.model,
    image:p.image,
    variant_count:p.variant_count,
    placements:p.placements || [],
    product_options:p.product_options || p.options || []
  };
}

module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Robots-Tag","noindex,nofollow");
  try{
    var products=await printful.listCatalogProductsV2();
    var knit=products.filter(function(p){
      var raw=JSON.stringify(p).toLowerCase();
      var name=String(p.name||p.title||"").toLowerCase();
      return raw.indexOf('"knitting"')>=0 ||
        name.indexOf("knit")>=0 ||
        name.indexOf("sweater")>=0 ||
        name.indexOf("cardigan")>=0 ||
        name.indexOf("scarf")>=0 ||
        name.indexOf("beanie")>=0;
    }).map(compactProduct);

    res.statusCode=200;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({
      ok:true,
      catalog_count:products.length,
      knit_count:knit.length,
      products:knit
    },null,2));
  }catch(error){
    res.statusCode=error.status||500;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({ok:false,error:error.message,detail:error.payload||null},null,2));
  }
};