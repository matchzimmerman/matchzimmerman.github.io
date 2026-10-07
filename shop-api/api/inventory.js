var requireAdmin = require("../lib/auth").requireAdmin;
var printful = require("../lib/printful");

module.exports = async function handler(req, res) {
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
