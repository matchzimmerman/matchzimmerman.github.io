"use strict";

// Temporary Preview-only, read-only store verification. Never expose API tokens,
// unrelated Printful stores, or full upstream payloads to the browser.
var printful = require("./printful");

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(payload));
}

function identify(stores) {
  var accessible = Array.isArray(stores) ? stores : [];
  var normalize = function (name) {
    return String(name || "").trim().replace(/\\s+/g, " ").toLowerCase();
  };
  var summary = function (entry) {
    var id = Number(entry && entry.id);
    return {
      id: Number.isSafeInteger(id) && id > 0 ? id : null,
      name: String(entry && entry.name || "").slice(0, 120),
      type: String(entry && entry.type || "").slice(0, 50)
    };
  };
  var matches = accessible.filter(function (store) {
    return store && normalize(store.name) === "mzcmg" &&
      normalize(store.type) === "native";
  });
  if (matches.length === 1) {
    var matchingStore = summary(matches[0]);
    if (!matchingStore.id) {
      return { status: 502, result: { ok: false, code: "invalid_store_id", error: "Printful returned an invalid store identifier." } };
    }
    return {
      status: 200,
      result: {
        ok: true,
        store: matchingStore,
        next_env_key: "PRINTFUL_STORE_ID"
      }
    };
  }
  if (matches.length > 1) {
    return { status: 409, result: { ok: false, code: "duplicate_native_name", error: "Multiple native stores are named MZCMG; selection requires review." } };
  }

  // A single-store token is normally scoped to one store. Returning that
  // store's basic identity helps diagnose mistaken token selection.
  if (accessible.length === 1) {
    var only = summary(accessible[0]);
    return {
      status: 409,
      result: {
        ok: false, code: "single_store_mismatch",
        error: "Token is authorized for a store other than the expected native MZCMG store.",
        accessible_store: only,
        next_step: only.type === "native" ? "Confirm the store name or token selection." : "Create or select a token scoped to the MZCMG Manual Order/API store."
      }
    };
  }

  // Account-level tokens can see multiple stores. Do not expose unrelated
  // names or identifiers; include only plausible MZCMG candidates.
  var nearby = accessible.filter(function (store) {
    return store && normalize(store.name).includes("mzcmg");
  }).slice(0, 5).map(summary);
  return {
    status: 404,
    result: {
      ok: false, code: "store_not_found",
      error: "No native MZCMG store was available to this token.",
      accessible_store_count: accessible.length,
      native_store_count: accessible.filter(function (store) {
        return store && normalize(store.type) === "native";
      }).length,
      mzcmg_named_candidates: nearby,
      next_step: "Check token single-store selection and Printful store name."
    }
  };
}

async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (process.env.VERCEL_ENV !== "preview") {
    return send(res, 404, { ok: false, error: "Not found." });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { ok: false, error: "Method not allowed." });
  }
  // Store IDs are non-secret identifiers. This temporary Preview-only reader
  // exposes only the single matching MZCMG ID, never the Printful credentials.
  // Never silently use the old production token to identify the new store.
  if (!process.env.PRINTFUL_MZCMG_TOKEN) {
    return send(res, 503, { ok: false, error: "PRINTFUL_MZCMG_TOKEN is missing from this Preview deployment." });
  }
  try {
    var result = identify(await printful.listStores());
    return send(res, result.status, result.result);
  } catch (error) {
    return send(res, 502, { ok: false, error: "Unable to verify Printful stores. Check the Preview token and its store access." });
  }
}

module.exports = handler;
module.exports.identify = identify;
