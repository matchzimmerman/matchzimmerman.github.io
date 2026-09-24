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

function productCard(store, product) {
  var mockup = product.thumbnail_url
    ? '<img src="' + esc(product.thumbnail_url) + '" alt="' + esc(product.name || "Store product") + '" loading="lazy">'
    : '<div class="no-image">NO MOCKUP</div>';

  var state = product.is_ignored ? "IGNORED" : (product.synced ? "SYNCED" : "UNSYNCED");
  var href = "/api/product?storeId=" + encodeURIComponent(store.id) +
    "&storeType=" + encodeURIComponent(store.type || "") +
    "&id=" + encodeURIComponent(product.id);

  return [
    '<a class="card live" href="' + href + '">',
      '<div class="mockup">' + mockup + '</div>',
      '<div class="copy">',
        '<p class="kicker">' + esc(store.name || "STORE") + ' · PRODUCT ' + esc(product.id) + '</p>',
        '<h2>' + esc(product.name || "Untitled product") + '</h2>',
        '<dl>',
          '<div><dt>Variants</dt><dd>' + esc(product.variants == null ? "—" : product.variants) + '</dd></div>',
          '<div><dt>Synced</dt><dd>' + esc(product.synced == null ? "—" : product.synced) + '</dd></div>',
          '<div><dt>Status</dt><dd>' + esc(state) + '</dd></div>',
          '<div><dt>Source</dt><dd>' + esc(store.type || "—") + '</dd></div>',
        '</dl>',
        '<p class="open">INSPECT LIVE PRODUCT →</p>',
      '</div>',
    '</a>'
  ].join("");
}

function templateCard(template) {
  var colors = arr(template.colors).map(function (c) {
    return c && c.color_name ? c.color_name : "";
  }).filter(Boolean);

  var sizes = arr(template.sizes);
  var placements = arr(template.placements).map(function (p) {
    return p && (p.display_name || p.placement)
      ? (p.display_name || p.placement)
      : "";
  }).filter(Boolean);

  var mockup = template.mockup_file_url
    ? '<img src="' + esc(template.mockup_file_url) + '" alt="' + esc(template.title || "Product template") + '" loading="lazy">'
    : '<div class="no-image">NO MOCKUP</div>';

  return [
    '<a class="card template" href="/api/template?id=' + encodeURIComponent(template.id) + '">',
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
        '<p class="open">INSPECT TEMPLATE →</p>',
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
    var inventories = [];
    var liveCount = 0;

    for (var i = 0; i < stores.length; i += 1) {
      var store = stores[i];
      try {
        var products = await printful.listStoreProducts(store);
        liveCount += products.length;
        inventories.push({ store: store, products: products, error: null });
      } catch (error) {
        inventories.push({ store: store, products: [], error: error.message });
      }
    }

    var storeSections = inventories.map(function (entry) {
      var store = entry.store;
      var cards = entry.products.length
        ? entry.products.map(function (product) {
            return productCard(store, product);
          }).join("")
        : '<p class="empty">No products returned for this store.</p>';

      return [
        '<section class="store-section">',
          '<div class="section-head">',
            '<div><p class="eyebrow">CONNECTED STORE · ' + esc(store.type || "unknown") + '</p>',
            '<h3>' + esc(store.name || "Unnamed store") + '</h3>',
            '<p class="store-id">STORE ID ' + esc(store.id) + '</p></div>',
            '<strong>' + entry.products.length + ' PRODUCTS</strong>',
          '</div>',
          entry.error ? '<p class="error">' + esc(entry.error) + '</p>' : '',
          '<div class="grid">' + cards + '</div>',
        '</section>'
      ].join("");
    }).join("");

    var templateCards = templates.length
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
':root{--paper:#f1efe8;--ink:#171717;--rule:#aaa79e;--muted:#6a6861;--accent:#ff5c35;--live:#1c5b46}',
'*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif}',
'a{color:inherit}main{width:min(1440px,calc(100% - 28px));margin:auto;padding:24px 0 72px}',
'header{border-top:9px solid var(--ink);border-bottom:1px solid var(--ink);padding:22px 0 28px;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end}',
'.eyebrow,.kicker,.open,dt,.store-id{font-size:11px;letter-spacing:.09em;text-transform:uppercase;font-weight:700}',
'h1{font-size:clamp(48px,8vw,116px);letter-spacing:-.07em;line-height:.82;margin:8px 0 0;max-width:950px}',
'.stats{display:flex;gap:24px;text-align:right}.stat strong{font-size:42px;letter-spacing:-.05em;display:block}.stat span{font-size:10px;letter-spacing:.08em;text-transform:uppercase}',
'.notice{margin:22px 0 46px;max-width:970px;font-size:17px;line-height:1.45}.notice strong{color:var(--accent)}',
'.store-section,.template-section{margin-top:56px;border-top:1px solid var(--ink);padding-top:18px}',
'.section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:18px}.section-head h3{font-size:clamp(30px,4vw,56px);line-height:.9;letter-spacing:-.045em;margin:5px 0}.section-head>strong{font-size:12px;letter-spacing:.08em}.store-id{color:var(--muted);margin:8px 0 0}',
'.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-left:1px solid var(--rule);border-top:1px solid var(--rule)}',
'.card{color:inherit;text-decoration:none;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);display:block;min-width:0}.card:hover{background:#e8e4da}',
'.mockup{aspect-ratio:1;background:#e2ded3;display:grid;place-items:center;overflow:hidden;border-bottom:1px solid var(--rule)}',
'.mockup img{width:100%;height:100%;object-fit:cover}.no-image{font-size:11px;letter-spacing:.1em;color:var(--muted)}',
'.copy{padding:18px 18px 20px}.kicker{margin:0 0 10px;color:var(--muted)}.card h2{font-size:27px;line-height:.98;letter-spacing:-.04em;margin:0 0 24px}',
'dl{margin:0}dl div{display:grid;grid-template-columns:78px 1fr;border-top:1px solid var(--rule);padding:8px 0;gap:8px}dt{color:var(--muted)}dd{margin:0;font-size:12px;line-height:1.35}',
'.open{margin:22px 0 0;color:var(--accent)}.live .open{color:var(--live)}.empty{padding:30px}.error{padding:14px;border:1px solid #8f2e20}',
'.library-note{margin:8px 0 20px;color:var(--muted);max-width:820px;line-height:1.45}',
'footer{border-top:1px solid var(--ink);margin-top:50px;padding-top:14px;display:flex;justify-content:space-between;gap:16px;font-size:11px;letter-spacing:.08em;text-transform:uppercase}',
'@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stats{gap:14px}}',
'@media(max-width:620px){main{width:calc(100% - 18px)}header{grid-template-columns:1fr}.stats{text-align:left}.grid{grid-template-columns:1fr}.section-head{align-items:start;flex-direction:column}.card{display:grid;grid-template-columns:42% 1fr}.mockup{height:100%;aspect-ratio:auto;border-bottom:0;border-right:1px solid var(--rule)}.card h2{font-size:22px}}',
'</style>',
'</head>',
'<body><main>',
'<header><div><p class="eyebrow">MZCMG · PRIVATE SHOP WORKSTATION</p><h1>SHOP INVENTORY</h1></div>',
'<div class="stats"><div class="stat"><strong>' + liveCount + '</strong><span>LIVE PRODUCTS</span></div><div class="stat"><strong>' + templates.length + '</strong><span>TEMPLATES</span></div></div></header>',
'<p class="notice"><strong>Correct account connected.</strong> The live storefront inventory is shown first. Product Templates remain below as the deeper Printful source library for rebuilding, modifying, or relaunching products.</p>',
storeSections,
'<section class="template-section"><div class="section-head"><div><p class="eyebrow">SOURCE LIBRARY</p><h3>Product Templates</h3></div><strong>' + templates.length + ' TEMPLATES</strong></div>',
'<p class="library-note">Reusable Printful designs and configurations. These may include experiments, retired products, alternates, and source setups that are not currently published in a connected store.</p>',
'<div class="grid">' + templateCards + '</div></section>',
'<footer><span>READ-ONLY · LIVE PRINTFUL DATA</span><span>' + stores.length + ' CONNECTED STORES</span></footer>',
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
