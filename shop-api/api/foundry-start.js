var requireAdmin=require("../lib/auth").requireAdmin;
var printful = require("../lib/printful");

function pickVariant(payload, preference) {
  var variants = (payload.result && payload.result.variants) || [];
  if (!variants.length) throw new Error("No catalog variants returned.");
  var found = variants.find(function (v) {
    var name = String(v.name || "").toLowerCase();
    return preference.every(function (term) {
      return name.indexOf(term.toLowerCase()) >= 0;
    });
  });
  return found || variants[0];
}

async function startOne(storeId, productId, variantId, placement, imageUrl, position) {
  var created = await printful.createMockupTask(storeId, productId, {
    variant_ids: [variantId],
    format: "jpg",
    files: [{
      placement: placement,
      image_url: imageUrl,
      position: position
    }]
  });
  return created.result || {};
}

module.exports = async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Robots-Tag","noindex,nofollow");
  try {
    var stores=await printful.listStores();
    var store=stores.find(function(s){
      return String(s.name||"").toLowerCase().indexOf("match zimmerman")>=0;
    })||stores[0];
    if(!store) throw new Error("No Printful store available.");

    var shirtProductId=71;
    var mugProductId=19;
    var catalogs=await Promise.all([
      printful.getCatalogProduct(shirtProductId),
      printful.getCatalogProduct(mugProductId)
    ]);
    var shirtVariant=pickVariant(catalogs[0],["black","m"]);
    var mugVariant=pickVariant(catalogs[1],["11oz"]);

    var seed=parseInt(req.query&&req.query.seed,10);
    if(!Number.isFinite(seed)) seed=47;
    var host=req.headers.host;
    var shirtSource="https://"+host+"/api/obas-source.png?mode=shirt&seed="+seed;
    var mugSource="https://"+host+"/api/obas-source.png?mode=mug&seed="+seed;

    var tasks=await Promise.all([
      startOne(
        store.id,
        shirtProductId,
        shirtVariant.id,
        "front",
        shirtSource,
        { area_width:1800, area_height:2400, width:1500, height:2000, top:200, left:150 }
      ),
      startOne(
        store.id,
        mugProductId,
        mugVariant.id,
        "default",
        mugSource,
        { area_width:520, area_height:202, width:520, height:202, top:0, left:0 }
      )
    ]);

    res.statusCode=200;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({
      ok:true,
      seed:seed,
      store:{id:store.id,name:store.name,type:store.type},
      candidates:[
        {
          kind:"shirt",
          catalog_product_id:shirtProductId,
          variant:shirtVariant,
          source_url:shirtSource,
          task:tasks[0]
        },
        {
          kind:"mug",
          catalog_product_id:mugProductId,
          variant:mugVariant,
          source_url:mugSource,
          task:tasks[1]
        }
      ]
    },null,2));
  } catch(error) {
    res.statusCode=error.status||500;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({ok:false,error:error.message,detail:error.payload||null},null,2));
  }
};
