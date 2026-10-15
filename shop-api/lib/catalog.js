"use strict";

// MZCMG-owned catalog. Product approval and sales visibility are independent
// of anything merely existing in the Printful account.
var doc = require("../data/catalog.json");

function isReady(product) {
  if (!product || product.status !== "published") return false;
  var pf = product.printful || {};
  var artwork = product.artwork || {};
  var approval = product.approval || {};
  var pricing = product.pricing || {};
  return Boolean(
    product.id && product.slug && product.name &&
    pf.catalog_product_id && pf.store_product_id &&
    artwork.yarns_verified === true &&
    approval.placement_reviewed === true &&
    approval.printful_mockup_approved === true &&
    Array.isArray(product.images) && product.images.length &&
    typeof pricing.retail_price === "number" && pricing.retail_price > 0 &&
    Array.isArray(pf.variants) && pf.variants.some(function (v) {
      return v && v.enabled === true && Number.isSafeInteger(Number(v.sync_variant_id)) && Number(v.sync_variant_id) > 0;
    })
  );
}

function publicProduct(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description || "",
    line: product.line,
    category: product.category,
    thumbnail_url: product.images[0],
    images: product.images,
    currency: product.pricing.currency || "USD",
    retail_price: product.pricing.retail_price,
    variants: product.printful.variants.filter(function (v) { return v.enabled === true; })
      .map(function (v) {
        return { id: String(v.sync_variant_id), size: v.size, color: v.color || null };
      })
  };
}

function listPublic() {
  return (doc.products || []).filter(isReady).map(publicProduct);
}

module.exports = { isReady: isReady, listPublic: listPublic, publicProduct: publicProduct };
