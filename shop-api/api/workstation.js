var requireAdmin = require("../lib/auth").requireAdmin;
var printful = require("../lib/printful");

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function templateCard(template) {
  var colors = arr(template.colors).map(function (c) {
    return c && c.color_name ? c.color_name : "";
  }).filter(Boolean);

  var sizes = arr(template.sizes);
  var placements = arr(template.placements).map(function (p) {
    return p && (p.display_name || p.placement) ? (p.display_name || p.placement) : "";
  }).filter(Boolean);

  var mockup = template.mockup_file_url
    ? '<img src="' + esc(template.mockup_file_url) + '" alt="' + esc(template.title || "Product template") + '" loading="lazy">'
    : '<div class="no-image">NO MOCKUP</div>';

  return [
    '<a class="card" href="/api/template?id=' + encodeURIComponent(template.id) + '">',
      '<div class="mockup">' + mockup + '</div>',
      '<div class="copy">',
        '<p class="kicker">TEMPLATE ' + esc(template.id) + '</p>',
        '<h2>' + esc(template.title || "Untitled product") + '</h2>',
        '<dl>',
          '<div><dt>Variants</dt><dd>' + arr(template.available_variant_ids).length + '</dd></div>',
          '<div><dt>Colors</dt><dd>' + (colors.length ? esc(colors.join(", ")) : "—") + '</dd></div>',
          '<div><dt>Sizes</dt><dd>' + (sizes.length ? esc(sizes.join(", ")) : "—") + '</dd></div>',
          '<div><dt>Placement</dt><dd>' + (placements.length ? esc(placements.join(", ")) : "—") + '</dd></div>',
        '</dl>',
        '<p class="open">INSPECT PRODUCT →</p>',
      '</div>',
    '</a>'
  ].join("");
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (!requireAdmin(req, res)) return;

  try {
    var stores = await printful.listStores();
    var templates = await printful.listProductTemplates();

    var liveCount = 0;
    for (var i = 0; i < stores.length; i += 1) {
      try {
        var products = await printful.listStoreProducts(stores[i]);
        liveCount += products.length;
      } catch (error) {}
    }

    var cards = templates.length
      ? templates.map(templateCard).join("")
      : '<p class="empty">No product templates returned.</p>';

    var html = [
'<!doctype html>',
'<html lang="en">',
'<head>',
'<meta charset="utf-8">',
'<meta name="viewport" content="width=device-width,initial-scale=1">',
'<meta name="robots" content="noindex,nofollow">',
'<title>MZCMG Shop Workstation</title>',
'<style>',
':root{--paper:#f1efe8;--ink:#171717;--rule:#aaa79e;--muted:#6a6861;--accent:#ff5c35}',
'*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif}',
'main{width:min(1440px,calc(100% - 28px));margin:auto;padding:24px 0 72px}',
'header{border-top:9px solid var(--ink);border-bottom:1px solid var(--ink);padding:22px 0 28px;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end}',
'.eyebrow,.kicker,.open,dt{font-size:11px;letter-spacing:.09em;text-transform:uppercase;font-weight:700}',
'h1{font-size:clamp(48px,8vw,116px);letter-spacing:-.07em;line-height:.82;margin:8px 0 0;max-width:900px}',
'.stats{text-align:right}.stats strong{font-size:44px;letter-spacing:-.05em;display:block}.stats span{font-size:11px;letter-spacing:.08em;text-transform:uppercase}',
'.notice{margin:22px 0 50px;max-width:900px;font-size:17px;line-height:1.45}.notice strong{color:var(--accent)}',
'.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-left:1px solid var(--rule);border-top:1px solid var(--rule)}',
'.card{color:inherit;text-decoration:none;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);display:block;min-width:0}.card:hover{background:#e8e4da}',
'.mockup{aspect-ratio:1;background:#e2ded3;display:grid;place-items:center;overflow:hidden;border-bottom:1px solid var(--rule)}',
'.mockup img{width:100%;height:100%;object-fit:cover}.no-image{font-size:11px;letter-spacing:.1em;color:var(--muted)}',
'.copy{padding:18px 18px 20px}.kicker{margin:0 0 10px;color:var(--muted)}h2{font-size:28px;line-height:.95;letter-spacing:-.04em;margin:0 0 24px}',
'dl{margin:0}dl div{display:grid;grid-template-columns:78px 1fr;border-top:1px solid var(--rule);padding:8px 0;gap:8px}dt{color:var(--muted)}dd{margin:0;font-size:12px;line-height:1.35}',
'.open{margin:22px 0 0;color:var(--accent)}.empty{padding:30px}',
'footer{border-top:1px solid var(--ink);margin-top:50px;padding-top:14px;display:flex;justify-content:space-between;gap:16px;font-size:11px;letter-spacing:.08em;text-transform:uppercase}',
'@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
'@media(max-width:620px){main{width:calc(100% - 18px)}header{grid-template-columns:1fr}.stats{text-align:left}.grid{grid-template-columns:1fr}.card{display:grid;grid-template-columns:42% 1fr}.mockup{height:100%;aspect-ratio:auto;border-bottom:0;border-right:1px solid var(--rule)}h2{font-size:23px}}',
'</style>',
'</head>',
'<body><main>',
'<header><div><p class="eyebrow">MZCMG · PRIVATE SHOP WORKSTATION</p><h1>PRODUCT ARCHIVE</h1></div>',
'<div class="stats"><strong>' + templates.length + '</strong><span>PRINTFUL TEMPLATES</span></div></header>',
'<p class="notice"><strong>Recovered:</strong> ' + templates.length + ' reusable Printful product templates. Current connected store products: ' + liveCount + '. These templates are the source material for rebuilding the shop without recreating the designs from scratch.</p>',
'<section class="grid">' + cards + '</section>',
'<footer><span>READ-ONLY · LIVE PRINTFUL DATA</span><span>' + stores.length + ' PRINTFUL STORE' + (stores.length === 1 ? "" : "S") + '</span></footer>',
'</main></body></html>'
    ].join("");

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Workstation error: " + error.message);
  }
};
