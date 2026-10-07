var requireAdmin = require("../lib/auth").requireAdmin;
var printful = require("../lib/printful");

var STOREFRONT_EXCLUDED = {
  "387424863": true,
  "387424842": true,
  "387424828": true,
  "387424827": true,
  "387424864": true
};

function optionValue(options, needle) {
  options = Array.isArray(options) ? options : [];
  for (var i = 0; i < options.length; i += 1) {
    var o = options[i] || {};
    var key = String(o.id || o.name || "").toLowerCase();
    if (key.indexOf(needle) >= 0 && o.value !== undefined && o.value !== null) {
      return Array.isArray(o.value) ? o.value.join(", ") : String(o.value);
    }
  }
  return "";
}

function cleanVariant(variant) {
  variant = variant || {};
  var product = variant.product || {};
  var files = Array.isArray(variant.files) ? variant.files : [];
  var preview = files.filter(function (file) {
    return file && (file.type === "preview" || file.type === "default");
  })[0] || files[0] || {};

  var color =
    variant.color ||
    product.color ||
    optionValue(variant.options, "color") ||
    optionValue(product.options, "color") ||
    "";

  var size =
    variant.size ||
    product.size ||
    optionValue(variant.options, "size") ||
    optionValue(product.options, "size") ||
    "";

  var nameParts = String(variant.name || variant.variant || "").split("/").map(function (part) {
    return part.trim();
  }).filter(Boolean);

  if ((!color || String(color).toLowerCase() === "custom") && nameParts.length >= 2) {
    var colorCandidate = nameParts[nameParts.length - 1];
    if (colorCandidate && colorCandidate !== size) color = colorCandidate;
  }

  if (!size && nameParts.length >= 3) {
    size = nameParts[nameParts.length - 2];
  }

  var material =
    variant.material ||
    product.material ||
    optionValue(variant.options, "material") ||
    optionValue(product.options, "material") ||
    "";

  return {
    id: variant.id || variant.sync_variant_id || null,
    variant_id: variant.variant_id || product.variant_id || null,
    name: variant.name || variant.variant || product.name || "Option",
    retail_price: variant.retail_price || null,
    currency: variant.currency || "USD",
    sku: variant.sku || null,
    availability_status: variant.availability_status || null,
    synced: variant.synced !== false,
    color: color || null,
    size: size || null,
    material: material || null,
    image: product.image || preview.preview_url || preview.thumbnail_url || null
  };
}

module.exports = async function handler(req, res) {
  var query = req.query || {};
  var storefront = query.storefront === "1";
  var id = query.id;

  if (storefront) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (!id || STOREFRONT_EXCLUDED[String(id)]) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ ok: false, error: "Product unavailable." }));
    }

    try {
      var store = { id: 16437938, name: "Match Zimmerman", type: "squarespace" };
      var payload = await printful.getStoreProduct(store, id);
      var result = payload.result || {};
      var syncProduct = result.sync_product || result.product || {};
      var variants = Array.isArray(result.sync_variants)
        ? result.sync_variants
        : (Array.isArray(result.variants) ? result.variants : []);

      variants = variants
        .map(cleanVariant)
        .filter(function (variant) {
          return variant.id && variant.synced &&
            String(variant.availability_status || "").toLowerCase() !== "discontinued";
        });

      res.statusCode = 200;
      return res.end(JSON.stringify({
        ok: true,
        product: {
          id: Number(id),
          name: syncProduct.name || result.name || "Untitled product",
          thumbnail_url: syncProduct.thumbnail_url || result.thumbnail_url || null,
          variants: variants
        }
      }));
    } catch (error) {
      res.statusCode = error.status || 500;
      return res.end(JSON.stringify({ ok: false, error: error.message }));
    }
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (!requireAdmin(req, res)) return;

  var storeId = query.storeId;
  var storeType = query.storeType;

  if (!storeId || !storeType || !id) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({
      ok: false,
      error: "storeId, storeType, and id are required."
    }, null, 2));
  }

  try {
    var payload = await printful.getStoreProduct(
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
