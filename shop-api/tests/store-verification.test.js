"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../lib/verify-mzcmg-store");
const printful = require("../lib/printful");

function response() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    end(body) { this.body = body; return this; }
  };
}

async function runWithEnv(values, action) {
  const original = {};
  for (const [key, value] of Object.entries(values)) {
    original[key] = process.env[key];
    if (value === null) delete process.env[key];
    else process.env[key] = value;
  }
  try { return await action(); }
  finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("store identification excludes unrelated integrations", () => {
  const result = handler.identify([
    { id: 17, type: "squarespace", name: "MZCMG" },
    { id: 18, type: "native", name: "Another store" },
    { id: 42, type: "native", name: "MZCMG" }
  ]);
  assert.equal(result.status, 200);
  assert.deepEqual(result.result.store, { id: 42, name: "MZCMG", type: "native" });
  assert.equal(result.result.next_env_key, "PRINTFUL_STORE_ID");
});

test("store identification fails closed when missing or ambiguous", () => {
  assert.equal(handler.identify([]).status, 404);
  assert.equal(handler.identify([{ id: 7, name: "MZCMG", type: "native" },
    { id: 8, name: "MZCMG", type: "native" }]).status, 409);
  assert.equal(handler.identify([{ id: "oops", name: "MZCMG", type: "native" }]).status, 502);
});

test("verification route is inaccessible in production", async () =>
  runWithEnv({ VERCEL_ENV: "production" }, async () => {
    const res = response();
    await handler({ method: "GET", headers: {} }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.headers["cache-control"], "no-store, private");
  }));

test("verification requires only Preview, not an admin password", async () =>
  runWithEnv({ VERCEL_ENV: "preview", MZ_SHOP_ADMIN_PASSWORD: null,
    PRINTFUL_MZCMG_TOKEN: "test-new-secret" }, async () => {
    const original = printful.listStores;
    printful.listStores = async () => [{ id: 56, type: "native", name: "MZCMG" }];
    try {
      const res = response();
      await handler({ method: "GET", headers: {} }, res);
      assert.equal(res.statusCode, 200);
      assert.equal(JSON.parse(res.body).store.id, 56);
      assert.equal(res.headers["www-authenticate"], undefined);
    } finally {
      printful.listStores = original;
    }
  }));

test("verification requires the distinct new token in Preview", async () =>
  runWithEnv({ VERCEL_ENV: "preview", MZ_SHOP_ADMIN_PASSWORD: "test-only-password",
    PRINTFUL_MZCMG_TOKEN: null, PRINTFUL_TOKEN: "legacy-token" }, async () => {
    const res = response();
    await handler({ method: "GET", headers: {} }, res);
    assert.equal(res.statusCode, 503);
    assert.match(JSON.parse(res.body).error, /PRINTFUL_MZCMG_TOKEN/);
  }));

test("authorized verification returns only the new MZCMG store ID, not tokens", async () =>
  runWithEnv({ VERCEL_ENV: "preview", MZ_SHOP_ADMIN_PASSWORD: "test-only-password",
    PRINTFUL_MZCMG_TOKEN: "test-new-secret" }, async () => {
    const original = printful.listStores;
    printful.listStores = async () => [
      { id: 20, name: "MZCMG", type: "squarespace" },
      { id: 21, name: "MZCMG", type: "native", detail: "not for public return" },
      { id: 22, name: "Other", type: "native" }
    ];
    try {
      const res = response();
      await handler({ method: "GET", headers: {} }, res);
      assert.equal(res.statusCode, 200);
      const output = JSON.parse(res.body);
      assert.deepEqual(output.store, { id: 21, name: "MZCMG", type: "native" });
      assert.doesNotMatch(res.body, /test-new-secret|not for public return|Other/);
      assert.equal(res.headers["x-robots-tag"], "noindex, nofollow");
    } finally {
      printful.listStores = original;
    }
  }));

test("catalog endpoint shares inventory function without exposing drafts", async () => {
  const inventory = require("../api/inventory");
  const res = response();
  await inventory({method: "GET", query: {mode: "catalog"}, headers: {}}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), {ok: true, source: "mzcmg", products: []});
});

test("verification path through inventory still rejects production requests", async () =>
  runWithEnv({ VERCEL_ENV: "production" }, async () => {
    const inventory = require("../api/inventory");
    const res = response();
    await inventory({method: "GET", query: {mode: "verify-mzcmg-store"}, headers: {}}, res);
    assert.equal(res.statusCode, 404);
  }));
