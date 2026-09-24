var PRINTFUL_API = "https://api.printful.com";

function PrintfulError(message, status, payload) {
  Error.call(this, message);
  this.name = "PrintfulError";
  this.message = message;
  this.status = status;
  this.payload = payload;
}
PrintfulError.prototype = Object.create(Error.prototype);

function getToken() {
  var token = process.env.PRINTFUL_TOKEN;
  if (!token) {
    throw new PrintfulError("PRINTFUL_TOKEN is not configured.", 503);
  }
  return token;
}

async function request(path, options) {
  options = options || {};
  var headers = {
    Authorization: "Bearer " + getToken(),
    Accept: "application/json"
  };

  if (options.storeId !== undefined && options.storeId !== null) {
    headers["X-PF-Store-ID"] = String(options.storeId);
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  var response = await fetch(PRINTFUL_API + path, {
    method: options.method || "GET",
    headers: headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  var raw = await response.text();
  var payload = {};

  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch (error) {
    payload = { raw: raw };
  }

  if (!response.ok) {
    var message =
      (payload.error && payload.error.message) ||
      (typeof payload.result === "string" ? payload.result : null) ||
      ("Printful request failed with HTTP " + response.status);

    throw new PrintfulError(String(message), response.status, payload);
  }

  return payload;
}

async function paged(path, options) {
  options = options || {};
  var limit = 100;
  var offset = 0;
  var all = [];

  while (true) {
    var separator = path.indexOf("?") >= 0 ? "&" : "?";
    var payload = await request(
      path + separator + "limit=" + limit + "&offset=" + offset,
      { storeId: options.storeId }
    );

    var items = options.itemSelector
      ? options.itemSelector(payload)
      : payload.result;

    items = items || [];
    if (!Array.isArray(items)) break;

    all = all.concat(items);

    var total = Number(
      payload.paging && payload.paging.total !== undefined
        ? payload.paging.total
        : all.length
    );

    if (items.length === 0 || all.length >= total || items.length < limit) {
      break;
    }

    offset += limit;
  }

  return all;
}

async function listStores() {
  return paged("/stores");
}

async function listStoreProducts(store) {
  var path = store.type === "native" ? "/store/products" : "/sync/products";
  return paged(path, { storeId: store.id });
}

async function listProductTemplates() {
  return paged("/product-templates", {
    itemSelector: function (payload) {
      return payload.result && payload.result.items
        ? payload.result.items
        : [];
    }
  });
}

async function getStoreProduct(store, productId) {
  var base = store.type === "native" ? "/store/products/" : "/sync/products/";
  return request(base + encodeURIComponent(productId), { storeId: store.id });
}

async function getProductTemplate(templateId) {
  return request("/product-templates/" + encodeURIComponent(templateId));
}

module.exports = {
  PrintfulError: PrintfulError,
  request: request,
  listStores: listStores,
  listStoreProducts: listStoreProducts,
  listProductTemplates: listProductTemplates,
  getStoreProduct: getStoreProduct,
  getProductTemplate: getProductTemplate
};
