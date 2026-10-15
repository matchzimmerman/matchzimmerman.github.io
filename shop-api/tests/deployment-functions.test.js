"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const api = path.join(root, "api");
const vercel = require("../vercel.json");

test("shop API stays within Vercel Hobby limit of 12 functions", () => {
  const functions = fs.readdirSync(api).filter(filename => filename.endsWith(".js"));
  assert.ok(functions.length <= 12, "Too many deployable serverless functions: " + functions.join(", "));
  assert.equal(functions.length, 12);
  assert.ok(!functions.includes("verify-mzcmg-store.js"));
  assert.ok(!functions.includes("catalog.js"));
});

test("old verification and catalog URLs rewrite to existing inventory function", () => {
  assert.deepEqual(vercel.rewrites, [
    {source: "/api/catalog", destination: "/api/inventory?mode=catalog"},
    {source: "/api/verify-mzcmg-store", destination: "/api/inventory?mode=verify-mzcmg-store"}
  ]);
});

test("the public shop inventory and existing APIs remain route-compatible", () => {
  for (const name of ["inventory.js", "product.js", "checkout.js", "obas-source.png.js"]) {
    assert.ok(fs.existsSync(path.join(api, name)), name + " must remain available");
  }
});
