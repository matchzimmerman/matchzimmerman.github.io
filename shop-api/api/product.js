var requireAdmin = require("../lib/auth").requireAdmin;
var getStoreProduct = require("../lib/printful").getStoreProduct;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (!requireAdmin(req, res)) return;

  var query = req.query || {};
  var storeId = query.storeId;
  var storeType = query.storeType;
  var id = query.id;

  if (!storeId || !storeType || !id) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({
      ok: false,
      error: "storeId, storeType, and id are required."
    }, null, 2));
  }

  try {
    var payload = await getStoreProduct(
      { id: storeId, type: storeType },
      id
    );

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({
      ok: true,
      store: {
        id: storeId,
        type: storeType
      },
      product: payload.result
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
