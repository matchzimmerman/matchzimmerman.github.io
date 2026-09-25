var knitProducts=require("../lib/knit-products");

module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","public, max-age=300, stale-while-revalidate=86400");
  res.setHeader("X-Robots-Tag","noindex,nofollow");
  res.statusCode=200;
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.end(JSON.stringify({
    ok:true,
    source:"qualified-manifest",
    knit_count:knitProducts.length,
    products:knitProducts
  },null,2));
};
