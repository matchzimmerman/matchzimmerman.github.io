"use strict";

// Temporary Preview-only, read-only store verification. Never expose API tokens,
// unrelated Printful stores, or full upstream payloads to the browser.
var requireAdmin = require("../lib/auth").requireAdmin;
var printful = require("../lib/printful");

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(payload));
}

function identify(stores) {
  var matches = (Array.isArray(stores) ? stores : []).filter(function (store) {
    return store && String(store.name || "").trim() === "MZCMG" &&
      String(store.type || "").toLowerCase() === "native";
  });
  if (matches.length === 0) {
    return { status: 404, result: { ok: false, error: "No native MZCMG store is available to this token." } };
  }
  if (matches.length !== 1) {
    return { status: 409, result: { ok: false, error: "More than one native store is named MZCMG; selection requires manual review." } };
  }
  var id = Number(matches[0].id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { status: 502, result: { ok: false, error: "Printful returned an invalid store identifier." } };
  }
  return {
    status: 200,
    result: {
      ok: true,
      store: { id: id, name: "MZCMG", type: "native" },
      next_env_key: "PRINTFUL_STORE_ID"
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
  if (!requireAdmin(req, res)) return;
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
