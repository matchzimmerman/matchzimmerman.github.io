"use strict";

// Single source of truth for the dedicated MZCMG Printful Manual Order Platform/API store.
// A configured store must exist and be native. Never silently fall back to an ecommerce integration.
function unavailable(message) {
  var error = new Error(message);
  error.status = 503;
  return error;
}

function parseId(value) {
  var id = String(value == null ? "" : value).trim();
  return /^[1-9][0-9]*$/.test(id) && Number.isSafeInteger(Number(id)) ? Number(id) : null;
}

function getStoreConfig() {
  var id = parseId(process.env.PRINTFUL_STORE_ID);
  if (!id) throw unavailable("The MZCMG Printful API store is not configured.");
  return {
    id: id,
    type: "native",
    name: String(process.env.PRINTFUL_STORE_NAME || "").trim()
  };
}

async function resolveNativeStore(printful) {
  var config = getStoreConfig();
  var stores = await printful.listStores();
  var store = stores.find(function (entry) {
    return entry && String(entry.id) === String(config.id);
  });
  if (!store) throw unavailable("The configured Printful store was not found for this token.");
  if (String(store.type || "").toLowerCase() !== "native") {
    throw unavailable("The configured Printful store must be a Manual Order Platform/API store.");
  }
  if (config.name && store.name !== config.name) {
    throw unavailable("The configured Printful store name does not match.");
  }
  return store;
}

// New Stripe sessions include their Printful store ID to keep fulfillment bound to
// the store used at purchase time. Only pre-migration sessions may use the optional
// legacy store ID; remove that setting after all outstanding sessions are settled.
function storeIdForSession(session) {
  var metadata = session && session.metadata || {};
  var id = parseId(metadata.printful_store_id);
  if (id) return id;
  var legacy = parseId(process.env.PRINTFUL_LEGACY_STORE_ID);
  if (legacy) return legacy;
  throw unavailable("This order has no Printful store association; fulfillment needs manual review.");
}

module.exports = {
  getStoreConfig: getStoreConfig,
  resolveNativeStore: resolveNativeStore,
  storeIdForSession: storeIdForSession
};
