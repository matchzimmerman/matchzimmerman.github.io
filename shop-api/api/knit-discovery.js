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
      var placements=Array.isArray(p.placements)?p.placements:[];
      var hasKnittingPlacement=placements.some(function(pl){
        return String(pl.technique||"").toLowerCase()==="knitting";
      });
      var options=Array.isArray(p.product_options)?p.product_options:[];
      var hasPixelatedMode=options.some(function(o){
        return o.name==="color_reduction_mode" &&
          Array.isArray(o.values) &&
          o.values.map(function(v){return String(v).toLowerCase();}).indexOf("pixelated")>=0;
      });
      return hasKnittingPlacement && hasPixelatedMode;
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