var requireAdmin=require("../lib/auth").requireAdmin;

function esc(v){
  return String(v==null?"":v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Robots-Tag","noindex,nofollow");
  if(!requireAdmin(req,res)) return;

  var shirtSource="https://mzcmg-shop-api.vercel.app/api/obas-source.png?mode=shirt&seed=47";
  var mugSource="https://mzcmg-shop-api.vercel.app/api/obas-source.png?mode=mug&seed=47";
  var shirtMockup="https://printful-upload.s3-accelerate.amazonaws.com/tmp/93139d818d49c4f231f780143f8ca516/unisex-staple-t-shirt-black-front-6ab488e431256.jpg";
  var shirtFlat="https://printful-upload.s3-accelerate.amazonaws.com/tmp/4c5da80403faafd314d116a42d29a9be/unisex-staple-t-shirt-black-front-6ab488e431f6d.jpg";
  var mugMockup="https://printful-upload.s3-accelerate.amazonaws.com/tmp/4dc1c13a9aa3713091d72d8214539943/white-glossy-mug-white-11-oz-handle-on-right-6ab488e2e3546.jpg";
  var mugFront="https://printful-upload.s3-accelerate.amazonaws.com/tmp/e0cfcf94a4d6bef6e60ff340b9bb7591/white-glossy-mug-white-11-oz-front-view-6ab488e2e37a6.jpg";

  var html=[
'<!doctype html><html lang="en"><head>',
'<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">',
'<title>OBAS Product Foundry 001 · MZCMG</title>',
'<style>',
':root{--paper:#f1efe8;--ink:#151515;--rule:#aaa79e;--muted:#6d6a62;--coral:#ff6f61;--mint:#5ee0bd;--navy:#09254f}',
'*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif}',
'main{width:min(1500px,calc(100% - 28px));margin:auto;padding:24px 0 80px}a{color:inherit}',
'header{border-top:10px solid var(--ink);border-bottom:1px solid var(--ink);padding:24px 0 30px;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end}',
'.eyebrow,.tag,.meta{font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700}',
'h1{font-size:clamp(50px,9vw,126px);line-height:.8;letter-spacing:-.07em;margin:8px 0 0}',
'.run{text-align:right}.run strong{font-size:38px;display:block;letter-spacing:-.04em}.run span{font-size:10px;letter-spacing:.1em}',
'.status{display:flex;gap:14px;align-items:center;border-bottom:1px solid var(--ink);padding:14px 0;margin-bottom:48px}.dot{width:11px;height:11px;background:var(--mint);border-radius:50%}.status strong{color:var(--navy)}',
'.flow{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:14px;align-items:center;margin:0 0 54px}.flow div{border:1px solid var(--ink);padding:14px;font-size:12px;letter-spacing:.07em;text-transform:uppercase}.arrow{font-size:22px}',
'.section{border-top:1px solid var(--ink);padding-top:18px;margin-top:48px}.section-head{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:18px}.section-head h2{font-size:clamp(30px,5vw,58px);letter-spacing:-.05em;line-height:.9;margin:5px 0 0}.section-head p{margin:0;max-width:620px;color:var(--muted);line-height:1.45}',
'.triptych{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-left:1px solid var(--rule);border-top:1px solid var(--rule)}',
'.panel{border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);min-width:0}.image{aspect-ratio:1;background:#e2ded3;display:grid;place-items:center;overflow:hidden;border-bottom:1px solid var(--rule)}.image img{width:100%;height:100%;object-fit:contain}',
'.copy{padding:16px}.copy h3{font-size:24px;line-height:1;letter-spacing:-.035em;margin:8px 0 18px}.tag{color:var(--coral)}',
'dl{margin:0}dl div{display:grid;grid-template-columns:90px 1fr;border-top:1px solid var(--rule);padding:8px 0;gap:8px}dt{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:700}dd{margin:0;font-size:12px;line-height:1.35}',
'.note{margin-top:42px;border:2px solid var(--ink);padding:18px;font-size:16px;line-height:1.45}.note strong{color:var(--coral)}',
'footer{margin-top:52px;border-top:1px solid var(--ink);padding-top:14px;display:flex;justify-content:space-between;gap:14px;font-size:10px;letter-spacing:.09em;text-transform:uppercase}',
'@media(max-width:850px){.flow{grid-template-columns:1fr}.arrow{text-align:center;transform:rotate(90deg)}.triptych{grid-template-columns:1fr}}',
'@media(max-width:620px){main{width:calc(100% - 18px)}header{grid-template-columns:1fr}.run{text-align:left}.section-head{align-items:start;flex-direction:column}}',
'</style></head><body><main>',
'<header><div><p class="eyebrow">MZCMG · EXPERIMENT / COMMERCE SYSTEM</p><h1>OBAS PRODUCT<br>FOUNDRY 001</h1></div><div class="run"><strong>47</strong><span>GENERATIVE SEED</span></div></header>',
'<div class="status"><span class="dot"></span><span><strong>PRINTFUL RUN COMPLETED.</strong> Two physical candidates generated. Zero products published.</span></div>',
'<div class="flow"><div>OBAS GENERATIVE STATE</div><span class="arrow">→</span><div>FORMAT-SPECIFIC TRANSLATION</div><span class="arrow">→</span><div>PRINTFUL MOCKUP</div></div>',

'<section class="section"><div class="section-head"><div><p class="eyebrow">CANDIDATE / 01</p><h2>Wearable Translation</h2></div><p>The same OBAS state is translated into a transparent vertical print field, then positioned inside the garment print area rather than pasted in as a rectangular image.</p></div>',
'<div class="triptych">',
'<article class="panel"><div class="image"><img src="'+shirtSource+'" alt="Procedural OBAS shirt source"></div><div class="copy"><span class="tag">SOURCE</span><h3>OBAS Seed 47 / Shirt Field</h3><dl><div><dt>Mode</dt><dd>Transparent / vertical</dd></div><div><dt>Logic</dt><dd>Navy, coral, mint + dither</dd></div><div><dt>Role</dt><dd>Generated print asset</dd></div></dl></div></article>',
'<article class="panel"><div class="image"><img src="'+shirtMockup+'" alt="Printful OBAS t-shirt mockup"></div><div class="copy"><span class="tag">PRINTFUL</span><h3>Bella + Canvas 3001 / Black</h3><dl><div><dt>Variant</dt><dd>4017 · Medium</dd></div><div><dt>Placement</dt><dd>Front DTG</dd></div><div><dt>Task</dt><dd>gt-973361584</dd></div></dl></div></article>',
'<article class="panel"><div class="image"><img src="'+shirtFlat+'" alt="Printful flat OBAS t-shirt mockup"></div><div class="copy"><span class="tag">ALT MOCKUP</span><h3>Flat Front</h3><dl><div><dt>Status</dt><dd>Candidate only</dd></div><div><dt>Publish</dt><dd>NO</dd></div><div><dt>Next</dt><dd>Human evaluation</dd></div></dl></div></article>',
'</div></section>',

'<section class="section"><div class="section-head"><div><p class="eyebrow">CANDIDATE / 02</p><h2>Object Translation</h2></div><p>The same seed is regenerated with a horizontal, full-field composition appropriate to a cylindrical wrap. Same generative identity; different physical translation.</p></div>',
'<div class="triptych">',
'<article class="panel"><div class="image"><img src="'+mugSource+'" alt="Procedural OBAS mug source"></div><div class="copy"><span class="tag">SOURCE</span><h3>OBAS Seed 47 / Wrap Field</h3><dl><div><dt>Mode</dt><dd>Horizontal / full field</dd></div><div><dt>Logic</dt><dd>Same seed, reformatted</dd></div><div><dt>Role</dt><dd>Generated wrap asset</dd></div></dl></div></article>',
'<article class="panel"><div class="image"><img src="'+mugMockup+'" alt="Printful OBAS mug mockup"></div><div class="copy"><span class="tag">PRINTFUL</span><h3>White Glossy Mug / 11 oz</h3><dl><div><dt>Variant</dt><dd>1320</dd></div><div><dt>Placement</dt><dd>Default wrap</dd></div><div><dt>Task</dt><dd>gt-973361583</dd></div></dl></div></article>',
'<article class="panel"><div class="image"><img src="'+mugFront+'" alt="Printful front view OBAS mug mockup"></div><div class="copy"><span class="tag">ALT MOCKUP</span><h3>Front View</h3><dl><div><dt>Status</dt><dd>Candidate only</dd></div><div><dt>Publish</dt><dd>NO</dd></div><div><dt>Next</dt><dd>Human evaluation</dd></div></dl></div></article>',
'</div></section>',

'<div class="note"><strong>This is the proof.</strong> A single procedural OBAS state generated two different print assets, Printful accepted them, and its actual Mockup Generator rendered them onto two physical products automatically. The system stopped before product creation or publication.</div>',
'<footer><span>OBAS PRODUCT FOUNDRY / RUN 001</span><span>PRINTFUL API · CANDIDATE MODE</span></footer>',
'</main></body></html>'
  ].join("");

  res.statusCode=200;
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.end(html);
};
