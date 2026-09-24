var requireAdmin=require("../lib/auth").requireAdmin;

module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Robots-Tag","noindex,nofollow");
  if(!requireAdmin(req,res)) return;

  var html=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>OBAS KNIT FOUNDRY 001 · MZCMG</title>
<style>
:root{--paper:#f1efe8;--ink:#151515;--rule:#aaa79e;--muted:#6d6a62;--coral:#ff6f61;--mint:#5ee0bd;--navy:#09254f;--cream:#f1efe8}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif}
button{font:inherit}main{width:min(1500px,calc(100% - 28px));margin:auto;padding:24px 0 80px}
header{border-top:10px solid var(--ink);border-bottom:1px solid var(--ink);padding:24px 0 30px;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end}
.eyebrow,.meta,.button,.statusline{font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700}
h1{font-size:clamp(50px,9vw,126px);line-height:.8;letter-spacing:-.07em;margin:8px 0 0}
.seed{text-align:right}.seed strong{font-size:40px;display:block;letter-spacing:-.05em}.seed span{font-size:10px;letter-spacing:.1em}
.intro{display:grid;grid-template-columns:minmax(230px,420px) 1fr;gap:32px;padding:34px 0 48px;border-bottom:1px solid var(--ink)}
.source{aspect-ratio:1;background:#e2ded3;border:1px solid var(--rule);overflow:hidden}.source img{width:100%;height:100%;object-fit:cover;image-rendering:pixelated}
.lede{font-size:clamp(20px,3vw,36px);letter-spacing:-.035em;line-height:1.05;margin:0 0 24px}.small{color:var(--muted);line-height:1.5;max-width:780px}
.palette{display:flex;gap:8px;margin:24px 0}.swatch{width:42px;height:42px;border:1px solid var(--ink)}.swatch:nth-child(1){background:var(--navy)}.swatch:nth-child(2){background:var(--coral)}.swatch:nth-child(3){background:var(--mint)}.swatch:nth-child(4){background:var(--cream)}
.runbar{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-top:24px}
.button{appearance:none;background:var(--ink);color:var(--paper);border:0;padding:15px 18px;cursor:pointer}.button:disabled{opacity:.4;cursor:wait}.statusline{color:var(--muted)}
.section{margin-top:52px;border-top:1px solid var(--ink);padding-top:18px}.sectionhead{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:18px}.sectionhead h2{font-size:clamp(32px,5vw,62px);letter-spacing:-.05em;line-height:.9;margin:5px 0}.count{font-size:28px;font-weight:700}
.catalog{display:flex;flex-wrap:wrap;gap:8px}.pill{border:1px solid var(--rule);padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-left:1px solid var(--rule);border-top:1px solid var(--rule)}
.card{border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);min-width:0}.mockups{display:grid;grid-template-columns:1fr 1fr;background:#e2ded3;border-bottom:1px solid var(--rule)}.mockups:has(img:only-child){grid-template-columns:1fr}.mockups img{width:100%;aspect-ratio:1;object-fit:contain;border-right:1px solid var(--rule)}.placeholder{aspect-ratio:1;display:grid;place-items:center;color:var(--muted);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.copy{padding:16px}.copy h3{font-size:25px;line-height:1;letter-spacing:-.04em;margin:6px 0 20px}.tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}.tag{font-size:10px;letter-spacing:.07em;text-transform:uppercase;border:1px solid var(--rule);padding:5px 7px}.tag.pixel{border-color:var(--coral);color:#b43d32}
.colors{display:flex;gap:5px;margin:12px 0 18px}.chip{width:28px;height:28px;border:1px solid var(--ink)}
dl{margin:0}dl div{display:grid;grid-template-columns:92px 1fr;gap:8px;border-top:1px solid var(--rule);padding:8px 0}dt{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:700}dd{margin:0;font-size:12px;line-height:1.35}
.error{border:1px solid #8e2c20;padding:16px;margin:16px 0;color:#8e2c20;white-space:pre-wrap}
.note{margin-top:46px;border:2px solid var(--ink);padding:18px;line-height:1.5}.note strong{color:var(--coral)}
footer{border-top:1px solid var(--ink);margin-top:52px;padding-top:14px;display:flex;justify-content:space-between;gap:14px;font-size:10px;letter-spacing:.09em;text-transform:uppercase}
@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:680px){main{width:calc(100% - 18px)}header{grid-template-columns:1fr}.seed{text-align:left}.intro{grid-template-columns:1fr}.grid{grid-template-columns:1fr}.sectionhead{align-items:start;flex-direction:column}}
</style>
</head>
<body><main>
<header>
  <div><p class="eyebrow">MZCMG · GENERATIVE COMMERCE / CANDIDATE SYSTEM</p><h1>OBAS KNIT<br>FOUNDRY 001</h1></div>
  <div class="seed"><strong>047</strong><span>OBAS SEED</span></div>
</header>

<section class="intro">
  <div class="source"><img src="/api/obas-source.png?mode=knit&seed=47" alt="OBAS knit source seed 47"></div>
  <div>
    <p class="lede">One OBAS state → every API-compatible Printful knit product.</p>
    <p class="small">The foundry detects products exposing Printful's knitting technique, maps the OBAS field to a four-yarn palette, forces the knit color reduction mode to <strong>pixelated</strong>, assigns the dark anchor color as the base, assigns a major design accent to the trim/cuffs system, and sends the same field across every available knitting placement.</p>
    <div class="palette" aria-label="OBAS source palette"><span class="swatch"></span><span class="swatch"></span><span class="swatch"></span><span class="swatch"></span></div>
    <div class="runbar">
      <button class="button" id="run">RUN ALL KNIT PRODUCTS</button>
      <span class="statusline" id="status">DISCOVERING CATALOG…</span>
    </div>
  </div>
</section>

<section class="section">
  <div class="sectionhead"><div><p class="eyebrow">QUALIFIED CATALOG</p><h2>Printful Knit Products</h2></div><div class="count" id="count">—</div></div>
  <div class="catalog" id="catalog"><span class="pill">Loading…</span></div>
</section>

<section class="section">
  <div class="sectionhead"><div><p class="eyebrow">GENERATED CANDIDATES</p><h2>Physical Translations</h2></div><div class="count" id="candidateCount">0</div></div>
  <div id="error"></div>
  <div class="grid" id="results"><div class="placeholder">Run the foundry to generate Printful mockups.</div></div>
</section>

<div class="note"><strong>Candidate mode only.</strong> KNIT FOUNDRY 001 can generate and evaluate physical translations, but it does not create products, publish listings, or place orders. Human approval remains the compression step.</div>
<footer><span>OBAS KNIT FOUNDRY / 001</span><span>PRINTFUL V2 · PIXELATED JACQUARD · NO PUBLISH</span></footer>

<script>
(function(){
  var runBtn=document.getElementById("run");
  var status=document.getElementById("status");
  var catalog=document.getElementById("catalog");
  var count=document.getElementById("count");
  var results=document.getElementById("results");
  var candidateCount=document.getElementById("candidateCount");
  var errorBox=document.getElementById("error");
  var candidates=[];
  var taskIds=[];

  function esc(v){
    return String(v==null?"":v).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch];
    });
  }

  function chip(hex){
    return '<span class="chip" title="'+esc(hex)+'" style="background:'+esc(hex)+'"></span>';
  }

  function loadCatalog(){
    fetch("/api/knit-discovery").then(function(r){return r.json();}).then(function(data){
      if(!data.ok) throw new Error(data.error||"Catalog discovery failed");
      count.textContent=data.knit_count;
      catalog.innerHTML=data.products.map(function(p){
        return '<span class="pill">'+esc(p.name||("PRODUCT "+p.id))+'</span>';
      }).join("");
      status.textContent=data.knit_count+" KNIT CANDIDATES DISCOVERED · READY";
    }).catch(function(err){
      status.textContent="CATALOG DISCOVERY ERROR";
      errorBox.innerHTML='<div class="error">'+esc(err.message)+'</div>';
    });
  }

  function render(tasks){
    var byId={};
    (tasks||[]).forEach(function(t){byId[String(t.id)]=t;});

    var live=candidates.filter(function(c){return !c.skipped;});
    candidateCount.textContent=live.length;

    results.innerHTML=live.map(function(c){
      var task=byId[String(c.task_id)]||{};
      var mockups=[];
      (task.catalog_variant_mockups||[]).forEach(function(vm){
        (vm.mockups||[]).forEach(function(m){
          if(m.mockup_url && mockups.length<2) mockups.push(m.mockup_url);
        });
      });
      var imgs=mockups.length
        ? mockups.map(function(u){return '<img src="'+esc(u)+'" alt="'+esc(c.name)+' mockup">';}).join("")
        : '<div class="placeholder">'+esc(task.status||c.task_status||"PENDING")+'</div>';

      return '<article class="card">'+
        '<div class="mockups">'+imgs+'</div>'+
        '<div class="copy">'+
          '<div class="tags"><span class="tag pixel">PIXELATED</span><span class="tag">CANDIDATE</span></div>'+
          '<h3>'+esc(c.name)+'</h3>'+
          '<div class="colors">'+(c.yarn_colors||[]).map(chip).join("")+'</div>'+
          '<dl>'+
            '<div><dt>Variant</dt><dd>'+esc(c.variant&&c.variant.name)+'</dd></div>'+
            '<div><dt>Placements</dt><dd>'+esc((c.placements||[]).join(", "))+'</dd></div>'+
            '<div><dt>Base</dt><dd>'+esc(c.base_color)+'</dd></div>'+
            '<div><dt>Trim / cuffs</dt><dd>'+esc(c.trim_color)+'</dd></div>'+
            '<div><dt>Task</dt><dd>'+esc(c.task_id||"—")+' · '+esc(task.status||c.task_status||"pending")+'</dd></div>'+
          '</dl>'+
        '</div>'+
      '</article>';
    }).join("") || '<div class="placeholder">No generated candidates.</div>';
  }

  function poll(){
    if(!taskIds.length) return;
    fetch("/api/knit-foundry-task?ids="+encodeURIComponent(taskIds.join(","))).then(function(r){return r.json();}).then(function(data){
      if(!data.ok) throw new Error(data.error||"Task check failed");
      var tasks=data.tasks||[];
      render(tasks);
      var done=tasks.length && tasks.every(function(t){
        return t.status==="completed" || t.status==="failed";
      });
      if(done){
        var success=tasks.filter(function(t){return t.status==="completed";}).length;
        status.textContent="COMPLETE · "+success+" MOCKUP TASKS RENDERED · ZERO PRODUCTS PUBLISHED";
        runBtn.disabled=false;
      }else{
        status.textContent="PRINTFUL IS KNITTING THE MOCKUPS…";
        setTimeout(poll,5000);
      }
    }).catch(function(err){
      errorBox.innerHTML='<div class="error">'+esc(err.message)+'</div>';
      status.textContent="MOCKUP POLL ERROR";
      runBtn.disabled=false;
    });
  }

  runBtn.addEventListener("click",function(){
    runBtn.disabled=true;
    errorBox.innerHTML="";
    status.textContent="MAPPING OBAS → KNIT CATALOG…";
    results.innerHTML='<div class="placeholder">Building pixelated jacquard candidates…</div>';

    fetch("/api/knit-foundry-run?seed=47",{method:"POST"}).then(function(r){return r.json();}).then(function(data){
      if(!data.ok) throw new Error(data.error+(data.detail?"\n"+JSON.stringify(data.detail,null,2):""));
      candidates=data.candidates||[];
      taskIds=data.task_ids||[];
      candidateCount.textContent=candidates.filter(function(c){return !c.skipped;}).length;
      render(data.tasks||[]);
      status.textContent="SUBMITTED "+data.submitted_products+" KNIT PRODUCTS TO PRINTFUL…";
      if(taskIds.length) setTimeout(poll,5000);
      else runBtn.disabled=false;
    }).catch(function(err){
      errorBox.innerHTML='<div class="error">'+esc(err.message)+'</div>';
      status.textContent="FOUNDRY RUN FAILED";
      runBtn.disabled=false;
    });
  });

  loadCatalog();
})();
</script>
</main></body></html>`;

  res.statusCode=200;
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.end(html);
};