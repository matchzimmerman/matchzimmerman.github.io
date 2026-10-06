var crypto = require("crypto");
var printful = require("../lib/printful");

function safeEqual(a, b) {
  var aa = Buffer.from(String(a || ""), "utf8");
  var bb = Buffer.from(String(b || ""), "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  var expected = process.env.MZ_SHOP_REVIEW_TOKEN || "";
  var auth = req.headers.authorization || "";
  var supplied = auth.indexOf("Bearer ") === 0 ? auth.slice(7) : "";

  if (!expected || !safeEqual(supplied, expected)) {
    res.statusCode = 404;
    res.end("Not found.");
    return;
  }

  try {
    var stores = await printful.listStores();
    var inventories = [];

    for (var i = 0; i < stores.length; i += 1) {
      var store = stores[i];
      try {
        var products = await printful.listStoreProducts(store);
        inventories.push({ store: store, products: products, error: null });
      } catch (error) {
        inventories.push({ store: store, products: [], error: error.message });
      }
    }

    var templates = [];
    var templatesError = null;
    try {
      templates = await printful.listProductTemplates();
    } catch (error) {
      templatesError = error.message;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({
      ok: true,
      generatedAt: new Date().toISOString(),
      stores: inventories,
      productTemplates: { items: templates, error: templatesError }
    }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
};
