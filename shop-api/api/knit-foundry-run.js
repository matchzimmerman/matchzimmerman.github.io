var requireAdmin=require("../lib/auth").requireAdmin;
var printful=require("../lib/printful");
var knitProducts=require("../lib/knit-products");

var OBAS_PALETTE=["#09254f","#ff6f61","#5ee0bd","#f1efe8"];

function normHex(value){
  if(typeof value!=="string") return null;
  var v=value.trim();
  if(/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  return null;
}

function rgb(hex){
  var h=normHex(hex);
  if(!h) return null;
  return [
    parseInt(h.slice(1,3),16),
    parseInt(h.slice(3,5),16),
    parseInt(h.slice(5,7),16)
  ];
}

function nearest(target, values){
  var tr=rgb(target);
  var valid=(values||[]).map(normHex).filter(Boolean);
  if(!tr || !valid.length) return target;
  var best=valid[0],bestD=Infinity;
  valid.forEach(function(v){
    var r=rgb(v);
    var d=Math.pow(tr[0]-r[0],2)+Math.pow(tr[1]-r[1],2)+Math.pow(tr[2]-r[2],2);
    if(d<bestD){bestD=d;best=v;}
  });
  return best;
}

function productOption(product,name){
  return (product.product_options||[]).find(function(o){return o.name===name;});
}

function optionValues(option){
  if(!option || !Array.isArray(option.values)) return [];
  return option.values.map(function(v){
    return typeof v==="string" ? v : (v && (v.value||v.name));
  }).filter(Boolean);
}

function colorIntersection(a,b){
  var aa=(a||[]).map(normHex).filter(Boolean);
  var bb=(b||[]).map(normHex).filter(Boolean);
  if(!aa.length) return bb;
  if(!bb.length) return aa;
  return aa.filter(function(v){return bb.indexOf(v)>=0;});
}

function knittingPlacements(product){
  return (product.placements||[]).filter(function(p){
    if(String(p.placement||"").toLowerCase()==="mockup") return false;
    if(String(p.technique||"").toLowerCase()==="knitting") return true;
    if(Array.isArray(p.techniques)){
      return p.techniques.map(function(t){return String(t).toLowerCase();}).indexOf("knitting")>=0;
    }
    return false;
  });
}

function yarnValuesFromPlacements(placements){
  var values=[];
  placements.forEach(function(p){
    (p.layers||[]).forEach(function(layer){
      (layer.layer_options||[]).forEach(function(o){
        if(o.name==="yarn_colors"){
          optionValues(o).forEach(function(v){values.push(v);});
        }
      });
    });
  });
  return Array.from(new Set(values));
}

function flattenMockupStyles(items, knitPlacementNames){
  var ids=[];
  (items||[]).forEach(function(item){
    var placement=String(item.placement||"");
    var technique=String(item.technique||"").toLowerCase();
    var relevant=technique==="knitting" || knitPlacementNames.indexOf(placement)>=0;
    if(!relevant && knitPlacementNames.length) return;

    if(Array.isArray(item.mockup_styles)){
      item.mockup_styles.forEach(function(s){
        if(s && s.id!=null) ids.push(s.id);
      });
    }else if(item.id!=null){
      ids.push(item.id);
    }
  });
  return Array.from(new Set(ids));
}

function makeLayer(sourceUrl,yarnColors){
  var layer={type:"file",url:sourceUrl};
  if(yarnColors.length){
    layer.layer_options=[{name:"yarn_colors",value:yarnColors}];
  }
  return layer;
}

module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Robots-Tag","noindex,nofollow");
  if(!requireAdmin(req,res)) return;

  try{
    var seed=parseInt(req.query&&req.query.seed,10);
    if(!Number.isFinite(seed)) seed=47;

    var stores=await printful.listStores();
    var store=stores.find(function(s){
      return String(s.name||"").toLowerCase().indexOf("match zimmerman")>=0;
    })||stores[0];
    if(!store) throw new Error("No Printful store available.");

    var knit=knitProducts.map(function(p){
      return {id:p.id,name:p.name};
    });

    var sourceUrl="https://"+req.headers.host+"/api/obas-source.png?mode=knit&seed="+seed;
    var resolved=await Promise.all(knit.map(async function(summary){
      try{
        var details=await Promise.all([
          printful.getCatalogProductV2(summary.id),
          printful.listCatalogVariantsV2(summary.id),
          printful.listMockupStylesV2(summary.id)
        ]);

        var product=details[0].data||summary;
        var variants=details[1]||[];
        var styles=details[2]||[];
        var placements=knittingPlacements(product);
        if(!placements.length || !variants.length) return null;

        var variant=variants.find(function(v){
          return String(v.size||"").toUpperCase()==="M";
        }) || variants.find(function(v){
          return /one size/i.test(String(v.size||""));
        }) || variants[0];

        var yarnAllowed=yarnValuesFromPlacements(placements);

        var baseOpt=productOption(product,"base_color");
        var trimOpt=productOption(product,"trim_color");
        var reductionOpt=productOption(product,"color_reduction_mode");

        var baseCandidates=colorIntersection(yarnAllowed,optionValues(baseOpt));
        var trimCandidates=colorIntersection(yarnAllowed,optionValues(trimOpt));
        var baseColor=nearest(OBAS_PALETTE[0],baseCandidates.length?baseCandidates:yarnAllowed);
        var trimColor=nearest(OBAS_PALETTE[1],trimCandidates.length?trimCandidates:yarnAllowed);

        var yarnColors=[baseColor,trimColor];
        OBAS_PALETTE.slice(2).forEach(function(color){
          yarnColors.push(nearest(color,yarnAllowed));
        });
        yarnColors=Array.from(new Set(yarnColors.map(normHex).filter(Boolean))).slice(0,4);

        var productOptions=[];
        if(baseOpt) productOptions.push({name:"base_color",value:baseColor});
        if(trimOpt) productOptions.push({name:"trim_color",value:trimColor});
        if(reductionOpt){
          var reductionValues=optionValues(reductionOpt).map(function(v){return String(v).toLowerCase();});
          if(!reductionValues.length || reductionValues.indexOf("pixelated")>=0){
            productOptions.push({name:"color_reduction_mode",value:"pixelated"});
          }
        }

        var designedPlacements=placements.map(function(p){
          return {
            placement:p.placement,
            technique:"knitting",
            layers:[makeLayer(sourceUrl,yarnColors)]
          };
        });

        var placementNames=placements.map(function(p){return p.placement;});
        var mockupStyleIds=flattenMockupStyles(styles,placementNames).slice(0,2);
        if(!mockupStyleIds.length) return null;

        return {
          mockupProduct:{
            source:"catalog",
            mockup_style_ids:mockupStyleIds,
            catalog_product_id:product.id,
            catalog_variant_ids:[variant.id],
            placements:designedPlacements,
            product_options:productOptions
          },
          candidate:{
            catalog_product_id:product.id,
            name:product.name,
            image:product.image,
            variant:{id:variant.id,name:variant.name,size:variant.size,color:variant.color},
            placements:placementNames,
            mockup_style_ids:mockupStyleIds,
            yarn_colors:yarnColors,
            base_color:baseColor,
            trim_color:trimColor,
            color_reduction_mode:"pixelated",
            source_url:sourceUrl
          }
        };
      }catch(innerError){
        return {
          mockupProduct:null,
          candidate:{
            catalog_product_id:summary.id,
            name:summary.name,
            skipped:true,
            error:innerError.message
          }
        };
      }
    }));

    var candidates=resolved.filter(Boolean).map(function(x){return x.candidate;});
    var mockupProducts=resolved.filter(function(x){return x&&x.mockupProduct;}).map(function(x){return x.mockupProduct;});

    if(!mockupProducts.length){
      throw new Error("No API-compatible knitting products with usable variants and mockup styles were found.");
    }

    var created=await printful.createMockupTasksV2(store.id,{
      format:"jpg",
      mockup_width_px:1000,
      products:mockupProducts
    });

    var tasks=created.data||[];
    var liveCandidates=candidates.filter(function(c){return !c.skipped;});
    liveCandidates.forEach(function(c,index){
      c.task_id=tasks[index]&&tasks[index].id;
      c.task_status=tasks[index]&&tasks[index].status;
    });

    res.statusCode=200;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({
      ok:true,
      mode:"candidate-only",
      published:false,
      seed:seed,
      obas_palette:OBAS_PALETTE,
      source_url:sourceUrl,
      store:{id:store.id,name:store.name,type:store.type},
      discovered_knit_products:knitProducts.length,
      submitted_products:mockupProducts.length,
      candidates:candidates,
      task_ids:tasks.map(function(t){return t.id;}).filter(Boolean),
      tasks:tasks
    },null,2));
  }catch(error){
    res.statusCode=error.status||500;
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.end(JSON.stringify({ok:false,error:error.message,detail:error.payload||null},null,2));
  }
};