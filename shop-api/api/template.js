var requireAdmin = require("../lib/auth").requireAdmin;
var getProductTemplate = require("../lib/printful").getProductTemplate;

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

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (!requireAdmin(req, res)) return;

  var id = req.query && req.query.id;
  if (!id) {
    res.statusCode = 400;
    return res.end("Template id is required.");
  }

  try {
    var payload = await getProductTemplate(id);
    var t = payload.result || {};
    var colors = arr(t.colors).map(function (c) { return c.color_name; }).filter(Boolean);
    var sizes = arr(t.sizes);
    var placements = arr(t.placements);
    var options = arr(t.option_data);

    var placementRows = placements.map(function (p) {
      return '<tr><td>' + esc(p.display_name || p.placement) + '</td><td>' + esc(p.technique_display_name || p.technique_key || "—") + '</td><td>' + esc(p.placement || "—") + '</td></tr>';
    }).join("");

    var optionRows = options.map(function (o) {
      var val = Array.isArray(o.value) ? o.value.join(", ") : o.value;
      return '<tr><td>' + esc(o.id) + '</td><td>' + esc(val) + '</td></tr>';
    }).join("");

    var html = [
'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">',
'<title>' + esc(t.title || "Template") + ' · MZCMG</title>',
'<style>',
':root{--paper:#f1efe8;--ink:#171717;--rule:#aaa79e;--muted:#6a6861;--accent:#ff5c35}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif}main{width:min(1180px,calc(100% - 28px));margin:auto;padding:24px 0 72px}a{color:inherit}.back{font-size:11px;letter-spacing:.09em;text-transform:uppercase;font-weight:700}header{border-top:9px solid var(--ink);margin-top:24px;padding-top:24px}h1{font-size:clamp(44px,8vw,94px);line-height:.86;letter-spacing:-.06em;margin:8px 0 26px}.meta{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.hero{display:grid;grid-template-columns:minmax(260px,470px) 1fr;gap:34px;border-bottom:1px solid var(--ink);padding-bottom:36px}.hero img{width:100%;background:#e2ded3}.facts{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--rule)}.fact{border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:14px}.fact strong{display:block;font-size:12px;margin-top:7px}.section{margin-top:42px}h2{font-size:28px;letter-spacing:-.04em}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;vertical-align:top;border-bottom:1px solid var(--rule);padding:10px 7px}th{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}@media(max-width:700px){.hero{grid-template-columns:1fr}.facts{grid-template-columns:1fr}table{display:block;overflow-x:auto;white-space:nowrap}}',
'</style></head><body><main>',
'<a class="back" href="/api/workstation">← Product archive</a>',
'<header><p class="meta">PRINTFUL TEMPLATE ' + esc(t.id) + ' · CATALOG PRODUCT ' + esc(t.product_id) + '</p><h1>' + esc(t.title || "Untitled product") + '</h1></header>',
'<div class="hero"><div>' + (t.mockup_file_url ? '<img src="' + esc(t.mockup_file_url) + '" alt="' + esc(t.title || "") + '">' : '') + '</div>',
'<div class="facts">',
'<div class="fact"><span class="meta">AVAILABLE VARIANTS</span><strong>' + arr(t.available_variant_ids).length + '</strong></div>',
'<div class="fact"><span class="meta">COLORS</span><strong>' + (colors.length ? esc(colors.join(", ")) : "—") + '</strong></div>',
'<div class="fact"><span class="meta">SIZES</span><strong>' + (sizes.length ? esc(sizes.join(", ")) : "—") + '</strong></div>',
'<div class="fact"><span class="meta">EXTERNAL PRODUCT ID</span><strong>' + esc(t.external_product_id || "—") + '</strong></div>',
'</div></div>',
'<section class="section"><h2>Placements</h2><table><thead><tr><th>Placement</th><th>Technique</th><th>Key</th></tr></thead><tbody>' + (placementRows || '<tr><td colspan="3">—</td></tr>') + '</tbody></table></section>',
'<section class="section"><h2>Options</h2><table><thead><tr><th>Option</th><th>Value</th></tr></thead><tbody>' + (optionRows || '<tr><td colspan="2">—</td></tr>') + '</tbody></table></section>',
'</main></body></html>'
    ].join("");

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Template error: " + error.message);
  }
};
