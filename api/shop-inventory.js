const PRINTFUL_API = "https://api.printful.com";

function sendUnauthorized(res) {
  res.setHeader("WWW-Authenticate", 'Basic realm="MZCMG Shop Inventory"');
  res.statusCode = 401;
  res.end("Authentication required.");
}

function isAuthorized(req) {
  const expected = process.env.MZ_SHOP_ADMIN_PASSWORD;
  if (!expected) return false;

  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return false;

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;
    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    return username === "match" && password === expected;
  } catch {
    return false;
  }
}

async function pf(path, storeId) {
  const token = process.env.PRINTFUL_TOKEN;
  if (!token) throw new Error("PRINTFUL_TOKEN is not configured.");

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (storeId) headers["X-PF-Store-ID"] = String(storeId);

  const response = await fetch(`${PRINTFUL_API}${path}`, { headers });
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.result ||
      `Printful request failed with HTTP ${response.status}`;
    const error = new Error(String(message));
    error.status = response.status;
    throw error;
  }

  return data;
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function productCard(product) {
  const thumb = product.thumbnail_url
    ? `<img src="${esc(product.thumbnail_url)}" alt="" loading="lazy">`
    : `<div class="no-image">NO IMAGE</div>`;

  const status = product.is_ignored ? "IGNORED" : "ACTIVE";
  return `
    <article class="product">
      <div class="thumb">${thumb}</div>
      <div class="product-copy">
        <h3>${esc(product.name || "Untitled product")}</h3>
        <p class="meta">PRINTFUL ID ${esc(product.id)} · ${esc(product.variants ?? 0)} VARIANTS · ${esc(product.synced ?? 0)} SYNCED</p>
        <p class="status">${status}</p>
      </div>
    </article>`;
}

function templateCard(template) {
  const thumb = template.mockup_file_url
    ? `<img src="${esc(template.mockup_file_url)}" alt="" loading="lazy">`
    : `<div class="no-image">NO IMAGE</div>`;

  return `
    <article class="product">
      <div class="thumb">${thumb}</div>
      <div class="product-copy">
        <h3>${esc(template.title || "Untitled template")}</h3>
        <p class="meta">TEMPLATE ID ${esc(template.id)} · PRODUCT ${esc(template.product_id)} · ${esc((template.available_variant_ids || []).length)} AVAILABLE VARIANTS</p>
        <p class="status">PRODUCT TEMPLATE</p>
      </div>
    </article>`;
}

module.exports = async function handler(req, res) {
  if (!process.env.MZ_SHOP_ADMIN_PASSWORD) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("MZ_SHOP_ADMIN_PASSWORD is not configured.");
  }

  if (!isAuthorized(req)) return sendUnauthorized(res);

  if (!process.env.PRINTFUL_TOKEN) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("PRINTFUL_TOKEN is not configured.");
  }

  try {
    const storesPayload = await pf("/stores");
    const stores = Array.isArray(storesPayload.result) ? storesPayload.result : [];

    const storeInventories = await Promise.all(
      stores.map(async (store) => {
        const path = store.type === "native"
          ? "/store/products?limit=100&offset=0"
          : "/sync/products?limit=100&offset=0";

        try {
          const payload = await pf(path, store.id);
          return {
            store,
            products: Array.isArray(payload.result) ? payload.result : [],
            error: null,
          };
        } catch (error) {
          return { store, products: [], error: error.message };
        }
      })
    );

    let templates = [];
    let templatesError = null;
    try {
      const templatePayload = await pf("/product-templates?limit=100&offset=0");
      templates = templatePayload?.result?.items || [];
    } catch (error) {
      templatesError = error.message;
    }

    const totalProducts = storeInventories.reduce(
      (sum, item) => sum + item.products.length,
      0
    );

    const storeSections = storeInventories.map(({ store, products, error }) => `
      <section>
        <div class="section-head">
          <div>
            <p class="eyebrow">STORE · ${esc(store.type || "unknown")}</p>
            <h2>${esc(store.name || "Unnamed store")}</h2>
          </div>
          <strong>${products.length} PRODUCTS</strong>
        </div>
        ${error ? `<p class="error">${esc(error)}</p>` : ""}
        <div class="grid">
          ${products.length ? products.map(productCard).join("") : '<p class="empty">No products returned for this store.</p>'}
        </div>
      </section>
    `).join("");

    const templateSection = `
      <section>
        <div class="section-head">
          <div>
            <p class="eyebrow">ACCOUNT LIBRARY</p>
            <h2>Product Templates</h2>
          </div>
          <strong>${templates.length} TEMPLATES</strong>
        </div>
        ${templatesError ? `<p class="error">${esc(templatesError)}</p>` : ""}
        <div class="grid">
          ${templates.length ? templates.map(templateCard).join("") : '<p class="empty">No product templates returned.</p>'}
        </div>
      </section>`;

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>MZCMG · Printful Inventory</title>
<style>
:root{--paper:#f1efe8;--ink:#171717;--rule:#bbb8ad;--muted:#68665f;--accent:#ff5b36}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif}
main{width:min(1400px,calc(100% - 32px));margin:0 auto;padding:32px 0 80px}
header{border-top:8px solid var(--ink);border-bottom:1px solid var(--ink);padding:28px 0 26px;margin-bottom:54px;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end}
h1{font-size:clamp(40px,8vw,104px);line-height:.86;letter-spacing:-.065em;margin:8px 0 0;max-width:1000px}
h2{font-size:clamp(28px,4vw,54px);letter-spacing:-.04em;margin:4px 0 0}h3{font-size:20px;line-height:1.05;margin:0 0 14px}
.eyebrow,.meta,.status{font-size:11px;letter-spacing:.09em;text-transform:uppercase}.eyebrow{margin:0;font-weight:700}
.summary{text-align:right}.summary strong{display:block;font-size:38px;letter-spacing:-.04em}.summary span{font-size:11px;letter-spacing:.08em}
section{border-top:1px solid var(--ink);padding-top:18px;margin-top:64px}.section-head{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:22px}.section-head>strong{font-size:12px;letter-spacing:.08em}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--rule);border-left:1px solid var(--rule)}
.product{border-right:1px solid var(--rule);border-bottom:1px solid var(--rule);min-width:0}.thumb{aspect-ratio:1;background:#e4e0d6;display:grid;place-items:center;overflow:hidden;border-bottom:1px solid var(--rule)}
.thumb img{width:100%;height:100%;object-fit:cover}.no-image{font-size:11px;letter-spacing:.09em;color:var(--muted)}
.product-copy{padding:16px;min-height:150px}.meta{line-height:1.5;color:var(--muted);margin:0 0 18px}.status{font-weight:700;margin:0;color:var(--accent)}
.error{border:1px solid #8c2d1f;padding:14px}.empty{padding:24px;color:var(--muted)}
footer{margin-top:64px;border-top:1px solid var(--ink);padding-top:16px;font-size:11px;letter-spacing:.08em;display:flex;justify-content:space-between;gap:20px}
@media(max-width:950px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){main{width:calc(100% - 20px)}header{grid-template-columns:1fr}.summary{text-align:left}.grid{grid-template-columns:1fr}.section-head{align-items:start;flex-direction:column}.product{display:grid;grid-template-columns:38% 1fr}.thumb{height:100%;aspect-ratio:auto;border-bottom:0;border-right:1px solid var(--rule)}}
</style>
</head>
<body>
<main>
<header>
  <div><p class="eyebrow">MZCMG · PRIVATE WORKSTATION</p><h1>PRINTFUL INVENTORY</h1></div>
  <div class="summary"><strong>${totalProducts}</strong><span>STORE PRODUCTS · ${stores.length} STORES · ${templates.length} TEMPLATES</span></div>
</header>
${storeSections}
${templateSection}
<footer><span>READ-ONLY INVENTORY VIEW</span><span>DATA LOADED LIVE FROM PRINTFUL</span></footer>
</main>
</body>
</html>`;

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    return res.end(html);
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(`Printful inventory error: ${error.message}`);
  }
};
