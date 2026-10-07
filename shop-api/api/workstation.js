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

  var reviewToken = process.env.MZ_SHOP_REVIEW_TOKEN || "";
  var suppliedReviewToken = (req.query && req.query.token) || "";
  var printAuthorized = reviewToken && suppliedReviewToken === reviewToken && req.query && req.query.print === "1";

  if (!printAuthorized && !requireAdmin(req, res)) return;

  if (printAuthorized && req.query && req.query.pdf === "1") {
    try {
      var PDFDocument = require("pdfkit");
      var screenshotUrl = process.env.MZ_SHOP_PACKET_SCREENSHOT || "";
      if (!screenshotUrl) {
        res.statusCode = 503;
        res.end("Packet screenshot is not configured.");
        return;
      }

      var imageResponse = await fetch(screenshotUrl);
      if (!imageResponse.ok) {
        res.statusCode = 502;
        res.end("Unable to retrieve packet screenshot.");
        return;
      }

      var imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      var doc = new PDFDocument({ autoFirstPage: false, size: "LETTER", margin: 0, compress: true });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="MZBRDZ_Printful_Markup_Index.pdf"');
      doc.pipe(res);

      var pageWidth = 612;
      var pageHeight = 792;
      var captureWidth = 1200;
      var sheetHeight = 1550;
      var sheetGap = 24;
      var scale = pageWidth / captureWidth;
      var image = doc.openImage(imageBuffer);

      for (var page = 0; page < 11; page += 1) {
        doc.addPage({ size: "LETTER", margin: 0 });
        doc.save();
        doc.rect(0, 0, pageWidth, pageHeight).clip();
        doc.image(image, 0, -(page * (sheetHeight + sheetGap) * scale), { width: pageWidth });
        doc.restore();
      }

      doc.end();
      return;
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("PDF packet error: " + error.message);
      return;
    }
  }

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

    if (printAuthorized) {
      var primaryEntry = inventories.filter(function (entry) {
        return entry.store && entry.store.name === "Match Zimmerman" && entry.store.type === "squarespace";
      })[0] || inventories[0] || { store: {}, products: [] };

      var products = primaryEntry.products || [];
      var sheets = [];
      for (var s = 0; s < products.length; s += 4) {
        var group = products.slice(s, s + 4);
        var cards = group.map(function (product, index) {
          var number = s + index + 1;
          var image = product.thumbnail_url
            ? '<img src="' + esc(product.thumbnail_url) + '" alt="' + esc(product.name || "Product") + '">'
            : '<div class="no-image">NO IMAGE</div>';
          var syncState = product.is_ignored ? "IGNORED" : ((Number(product.synced) || 0) + " / " + (Number(product.variants) || 0) + " SYNCED");
          return [
            '<article class="print-card">',
              '<div class="image-wrap">' + image + '</div>',
              '<div class="info">',
                '<div class="num">#' + String(number).padStart(2, "0") + '</div>',
                '<h2>' + esc(product.name || "Untitled product") + '</h2>',
                '<div class="meta">PRINTFUL PRODUCT ID ' + esc(product.id) + ' · ' + esc(syncState) + '</div>',
                '<div class="fields">',
                  '<div><b>GROUP / COLLECTION</b><span></span></div>',
                  '<div><b>KEEP / ARCHIVE / REMOVE</b><span></span></div>',
                  '<div><b>RENAME / CONSOLIDATE WITH</b><span></span></div>',
                  '<div class="notes"><b>NOTES</b><span></span><span></span></div>',
                '</div>',
              '</div>',
            '</article>'
          ].join("");
        }).join("");

        sheets.push([
          '<section class="sheet">',
            '<header><div><div class="eyebrow">MZBRDZ · PRINTFUL PRODUCT INDEX</div><h1>PHYSICAL MARKUP SHEET</h1></div>',
            '<div class="pagecount">' + (Math.floor(s / 4) + 1) + ' / ' + Math.ceil(products.length / 4) + '</div></header>',
            '<div class="instructions">Mark relationships, collections, duplicates, archive/remove decisions, and naming changes directly on the page.</div>',
            '<div class="print-grid">' + cards + '</div>',
            '<footer>LIVE SNAPSHOT · MATCH ZIMMERMAN SQUARESPACE STORE · ' + products.length + ' PRODUCTS</footer>',
          '</section>'
        ].join(""));
      }

      var printHtml = [
        '<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow">',
        '<title>MZBRDZ Printful Markup Index</title><style>',
        '*{box-sizing:border-box}html,body{margin:0;background:#ddd;color:#111;font-family:Arial,Helvetica,sans-serif}',
        '.sheet{width:1200px;height:1550px;margin:0 auto 24px;background:#f5f2e9;padding:46px;overflow:hidden;display:flex;flex-direction:column}',
        'header{border-top:10px solid #111;border-bottom:2px solid #111;padding:18px 0 22px;display:flex;justify-content:space-between;align-items:end}',
        '.eyebrow,.meta,.fields b,footer,.pagecount{font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}',
        'h1{font-size:50px;letter-spacing:-.045em;margin:5px 0 0;line-height:.9}.pagecount{font-size:16px}',
        '.instructions{font-size:17px;padding:13px 0 16px;border-bottom:1px solid #888}',
        '.print-grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:14px;padding-top:14px;flex:1}',
        '.print-card{border:2px solid #222;display:grid;grid-template-columns:44% 56%;min-height:0;background:#fff}',
        '.image-wrap{background:#e5e1d7;border-right:1px solid #888;display:flex;align-items:center;justify-content:center;overflow:hidden}',
        '.image-wrap img{width:100%;height:100%;object-fit:contain}.no-image{font-size:14px;letter-spacing:.08em}',
        '.info{padding:18px;min-width:0;display:flex;flex-direction:column}.num{font-size:28px;font-weight:800}.info h2{font-size:25px;line-height:1.02;letter-spacing:-.025em;margin:8px 0 10px}',
        '.meta{font-size:10px;color:#555;border-bottom:1px solid #999;padding-bottom:11px;margin-bottom:8px}',
        '.fields{margin-top:auto}.fields>div{padding:9px 0 4px;border-bottom:1px solid #777}.fields b{display:block;font-size:9px;color:#555;margin-bottom:9px}',
        '.fields span{display:block;height:18px;border-bottom:1px dotted #999}.fields .notes span{height:21px}',
        'footer{border-top:1px solid #111;margin-top:14px;padding-top:10px;font-size:10px;display:flex;justify-content:space-between}',
        '</style></head><body>' + sheets.join("") + '</body></html>'
      ].join("");

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(printHtml);
      return;
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
