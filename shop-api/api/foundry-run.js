var printful = require("../lib/printful");

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function pickVariant(payload, preference) {
  var variants = (payload.result && payload.result.variants) || [];
  if (!variants.length) throw new Error("No catalog variants returned.");

  var found = variants.find(function (v) {
    var name = String(v.name || "").toLowerCase();
    return preference.every(function (term) {
      return name.indexOf(term.toLowerCase()) >= 0;
    });
  });

  return found || variants[0];
}

async function waitForTask(storeId, taskKey) {
  var result = null;
  for (var i = 0; i < 8; i += 1) {
    await sleep(1800);
    var payload = await printful.getMockupTask(storeId, taskKey);
    result = payload.result;
    if (result && (result.status === "completed" || result.status === "failed")) {
      return result;
    }
  }
  return result;
}

async function generateOne(storeId, productId, variantId, placement, imageUrl) {
  var created = await printful.createMockupTask(storeId, productId, {
    variant_ids: [variantId],
    format: "jpg",
    files: [
      {
        placement: placement,
        image_url: imageUrl
      }
    ]
  });

  var task = created.result || {};
  if (task.status === "completed") return task;
  if (!task.task_key) throw new Error("Printful did not return a task key.");
  return waitForTask(storeId, task.task_key);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  try {
    var stores = await printful.listStores();
    var store = stores.find(function (s) {
      return String(s.name || "").toLowerCase().indexOf("match zimmerman") >= 0;
    }) || stores[0];

    if (!store) throw new Error("No Printful store available.");

    var shirtProductId = 71;
    var mugProductId = 19;

    var shirtCatalog = await printful.getCatalogProduct(shirtProductId);
    var mugCatalog = await printful.getCatalogProduct(mugProductId);

    var shirtVariant = pickVariant(shirtCatalog, ["black", "m"]);
    var mugVariant = pickVariant(mugCatalog, ["11oz"]);

    var host = req.headers.host;
    var seed = parseInt(req.query && req.query.seed, 10);
    if (!Number.isFinite(seed)) seed = 47;

    var shirtSource = "https://" + host + "/api/obas-source.png?mode=shirt&seed=" + seed;
    var mugSource = "https://" + host + "/api/obas-source.png?mode=mug&seed=" + seed;

    var shirt = await generateOne(
      store.id,
      shirtProductId,
      shirtVariant.id,
      "front",
      shirtSource
    );

    var mug = await generateOne(
      store.id,
      mugProductId,
      mugVariant.id,
      "default",
      mugSource
    );

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({
      ok: true,
      seed: seed,
      store: { id: store.id, name: store.name, type: store.type },
      source: {
        shirt: shirtSource,
        mug: mugSource
      },
      candidates: [
        {
          kind: "shirt",
          catalog_product_id: shirtProductId,
          variant: shirtVariant,
          task: shirt
        },
        {
          kind: "mug",
          catalog_product_id: mugProductId,
          variant: mugVariant,
          task: mug
        }
      ]
    }, null, 2));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({
      ok: false,
      error: error.message,
      detail: error.payload || null
    }, null, 2));
  }
};
