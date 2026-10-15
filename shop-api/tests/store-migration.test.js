"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const store = require("../lib/store-config");
const catalog = require("../lib/catalog");

function withEnv(values, fn) {
  const before = {};
  for (const key of Object.keys(values)) {
    before[key] = process.env[key];
    if (values[key] == null) delete process.env[key];
    else process.env[key] = String(values[key]);
  }
  try { return fn(); }
  finally {
    for (const key of Object.keys(values)) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
}
async function withEnvAsync(values, fn) {
  const before = {};
  for (const key of Object.keys(values)) {
    before[key] = process.env[key];
    if (values[key] == null) delete process.env[key];
    else process.env[key] = String(values[key]);
  }
  try { return await fn(); }
  finally {
    for (const key of Object.keys(values)) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
}

test("native store config fails closed if missing", () =>
  withEnv({ PRINTFUL_STORE_ID: null }, () =>
    assert.throws(() => store.getStoreConfig(), /not configured/)));

test("store ID must be a positive safe integer", () =>
  withEnv({ PRINTFUL_STORE_ID: "bad" }, () =>
    assert.throws(() => store.getStoreConfig(), /not configured/)));

test("configured store resolves by ID, not by platform name", async () =>
  withEnvAsync({ PRINTFUL_STORE_ID: "123", PRINTFUL_STORE_NAME: "MZCMG API" }, async () => {
    const resolved = await store.resolveNativeStore({ listStores: async () => [
      { id: 999, type: "native", name: "Other" },
      { id: 123, type: "native", name: "MZCMG API" }
    ] });
    assert.equal(resolved.id, 123);
  }));

test("an ecommerce store cannot accidentally be selected", async () =>
  withEnvAsync({ PRINTFUL_STORE_ID: "123", PRINTFUL_STORE_NAME: null }, async () =>
    assert.rejects(store.resolveNativeStore({listStores: async () => [
      { id: 123, type: "squarespace", name: "Legacy" }
    ]}), /Manual Order Platform/)));

test("store name guard catches a wrong store", async () =>
  withEnvAsync({ PRINTFUL_STORE_ID: "123", PRINTFUL_STORE_NAME: "Expected" }, async () =>
    assert.rejects(store.resolveNativeStore({listStores: async () => [
      { id: 123, type: "native", name: "Wrong" }
    ]}), /name does not match/)));

test("new sessions preserve the originating Printful store ID", () =>
  withEnv({ PRINTFUL_LEGACY_STORE_ID: "77" }, () =>
    assert.equal(store.storeIdForSession({metadata:{printful_store_id:"123"}}), 123)));

test("pre-cutover Stripe sessions require an explicit legacy ID", () =>
  withEnv({ PRINTFUL_LEGACY_STORE_ID: "77" }, () =>
    assert.equal(store.storeIdForSession({metadata:{}}), 77)));

test("unassociated sessions are held for manual review", () =>
  withEnv({ PRINTFUL_LEGACY_STORE_ID: null }, () =>
    assert.throws(() => store.storeIdForSession({metadata:{}}), /manual review/)));

test("Two Houses exists as an unpublished draft only", () => {
  const doc = require("../data/catalog.json");
  const product = doc.products.find(p => p.id === "mzbrdz-two-houses-knit-001");
  assert.ok(product);
  assert.equal(product.printful.catalog_product_id, 860);
  assert.equal(product.status, "draft");
  assert.equal(catalog.isReady(product), false);
  assert.deepEqual(catalog.listPublic(), []);
});

test("publication requires confirmed mockup, yarns, price and synced variants", () => {
  const source = require("../data/catalog.json").products[0];
  const ready = JSON.parse(JSON.stringify(source));
  ready.status = "published";
  ready.printful.store_product_id = 55;
  ready.printful.variants = [{sync_variant_id:42,size:"M",enabled:true}];
  ready.images = ["https://images.example.test/mockup.jpg"];
  ready.artwork.yarns_verified = true;
  ready.approval.placement_reviewed = true;
  ready.approval.printful_mockup_approved = true;
  ready.pricing.retail_price = 89;
  assert.equal(catalog.isReady(ready), true);
  ready.approval.printful_mockup_approved = false;
  assert.equal(catalog.isReady(ready), false);
});

test("public routes do not contain the retired hardcoded store ID", () => {
  for (const rel of ["api/inventory.js","api/product.js","api/checkout.js"]) {
    const code = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
    assert.doesNotMatch(code, /16437938/);
    assert.doesNotMatch(code, /type:\\s*["']squarespace["']/);
  }
});
