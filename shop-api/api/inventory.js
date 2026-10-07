var requireAdmin = require("../lib/auth").requireAdmin;
var printful = require("../lib/printful");

var STOREFRONT_EXCLUDED = {
  "387424863": true, // Knitted crew neck sweater
  "387424842": true, // BABY | Onesie
  "387424828": true, // Artificial Botanical 001
  "387424827": true, // MZBRDZ x MAGPIE skateboard
  "387424864": true  // redundant Blue/Blue copy knit sweater
};

function categoryFor(name) {
  var n = String(name || "").toLowerCase();
  if (/youth/.test(n)) return "Youth";
  if (/hat|cap|beanie/.test(n)) return "Hats";
  if (/windbreaker|jacket/.test(n)) return "Jackets";
  if (/sweater|knit/.test(n)) return "Sweaters";
  if (/sweatshirt|hoodie|crewneck/.test(n)) return "Sweatshirts + Hoodies";
  if (/tote|backpack|bag/.test(n)) return "Bags";
  if (/framed|print|poster/.test(n)) return "Art Prints";
  if (/blanket|puzzle|coaster/.test(n)) return "Home + Objects";
  if (/shirt|tee|t-shirt/.test(n)) return "Shirts";
  return "Other";
}

function publicProduct(product) {
  return {
    id: product.id,
    external_id: product.external_id || null,
    name: product.name || "Untitled product",
    variants: Number(product.variants || 0),
    synced: Number(product.synced || 0),
    thumbnail_url: product.thumbnail_url || null,
    category: categoryFor(product.name),
    tags: ["MZBRDZ"],
    available: !product.is_ignored && Number(product.synced || 0) > 0
  };
}

module.exports = async function handler(req, res) {
  var query = req.query || {};
  var storefront = query.storefront === "1";

  if (storefront) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    try {
      var stores = await printful.listStores();
      var store = stores.filter(function (candidate) {
        return candidate && candidate.name === "Match Zimmerman" && candidate.type === "squarespace";
      })[0];

      if (!store) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ ok: false, error: "Storefront store not found." }));
      }

      var products = await printful.listStoreProducts(store);
      var eligible = products
        .filter(function (product) {
          return product &&
            !STOREFRONT_EXCLUDED[String(product.id)] &&
            !product.is_ignored;
        })
        .map(publicProduct);

      var categories = eligible.map(function (p) { return p.category; })
        .filter(function (value, index, list) { return list.indexOf(value) === index; })
        .sort();

      res.statusCode = 200;
      return res.end(JSON.stringify({
        ok: true,
        generatedAt: new Date().toISOString(),
        store: { id: store.id, name: store.name, type: store.type },
        products: eligible,
        categories: categories,
        excludedCount: products.length - eligible.length
      }));
    } catch (error) {
      res.statusCode = error.status || 500;
      return res.end(JSON.stringify({ ok: false, error: error.message }));
    }
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (!requireAdmin(req, res)) return;

  try {
    var stores = await printful.listStores();
    var inventories = [];

    for (var i = 0; i < stores.length; i += 1) {
      var store = stores[i];
      try {
        var products = await printful.listStoreProducts(store);
        inventories.push({
          store: store,
          products: products,
          error: null
        });
      } catch (error) {
        inventories.push({
          store: store,
          products: [],
          error: error.message
        });
      }
    }

    var templates = [];
    var templatesError = null;

    try {
      templates = await printful.listProductTemplates();
    } catch (error) {
      templatesError = error.message;
    }

    var totalProducts = inventories.reduce(function (sum, item) {
      return sum + item.products.length;
    }, 0);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({
      ok: true,
      summary: {
        stores: stores.length,
        storeProducts: totalProducts,
        productTemplates: templates.length
      },
      stores: inventories,
      productTemplates: {
        items: templates,
        error: templatesError
      }
    }, null, 2));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({
      ok: false,
      error: error.message
    }, null, 2));
  }
};
