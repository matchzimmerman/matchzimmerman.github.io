var crypto = require("crypto");
var printful = require("../lib/printful");

var STORE_ID = 16437938;
var BASE_URL = process.env.MZ_SHOP_BASE_URL || "https://www.matchzimmerman.com";
var ALLOWED_ORIGINS = {
  "https://www.matchzimmerman.com": true,
  "https://matchzimmerman.com": true
};
var EXCLUDED_PRODUCTS = {
  "387424863": true,
  "387424842": true,
  "387424828": true,
  "387424827": true,
  "387424864": true
};

function cors(req, res) {
  var origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS[origin]) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Stripe-Signature");
  res.setHeader("Cache-Control", "no-store");
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8") || "{}");
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  var chunks = [];
  for await (var chunk of req) chunks.push(Buffer.from(chunk));
  var raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function readRaw(req) {
  if (req.rawBody) return Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody);
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  var chunks = [];
  for await (var chunk of req) chunks.push(Buffer.from(chunk));
  if (chunks.length) return Buffer.concat(chunks);
  return null;
}

function clean(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max || 200);
}

function moneyNumber(value) {
  var n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function validateRecipient(input) {
  input = input || {};
  var recipient = {
    name: clean(input.name, 120),
    email: clean(input.email, 180),
    address1: clean(input.address1, 180),
    address2: clean(input.address2, 180),
    city: clean(input.city, 120),
    state_code: clean(input.state_code, 30).toUpperCase(),
    country_code: clean(input.country_code, 2).toUpperCase(),
    zip: clean(input.zip, 30),
    phone: clean(input.phone, 50)
  };

  if (!recipient.name || !recipient.email || !recipient.address1 || !recipient.city || !recipient.country_code || !recipient.zip) {
    throw new Error("Please complete the required shipping fields.");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient.email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (["US","CA","AU"].indexOf(recipient.country_code) >= 0 && !recipient.state_code) {
    throw new Error("State / region code is required for this country.");
  }
  if (!recipient.address2) delete recipient.address2;
  if (!recipient.phone) delete recipient.phone;
  return recipient;
}

function validateItems(items) {
  if (!Array.isArray(items) || !items.length) throw new Error("Your bag is empty.");
  if (items.length > 30) throw new Error("Too many separate items in one checkout.");
  return items.map(function (item) {
    var id = clean(item && item.variantId, 40);
    var qty = Math.max(1, Math.min(10, Math.floor(Number(item && item.qty) || 1)));
    if (!/^\d+$/.test(id)) throw new Error("One bag item is invalid.");
    return { variantId: id, qty: qty };
  });
}

function stripeKey() {
  var key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) {
    var error = new Error("Stripe is not configured yet.");
    error.code = "STRIPE_NOT_CONFIGURED";
    throw error;
  }
  return key;
}

async function stripeRequest(path, options) {
  options = options || {};
  var response = await fetch("https://api.stripe.com/v1" + path, {
    method: options.method || "GET",
    headers: Object.assign({
      "Authorization": "Bearer " + stripeKey()
    }, options.headers || {}),
    body: options.body
  });
  var payload = await response.json().catch(function () { return {}; });
  if (!response.ok) {
    var message = payload.error && payload.error.message ? payload.error.message : "Stripe request failed.";
    var error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function appendLineItem(form, index, item) {
  form.append("line_items[" + index + "][price_data][currency]", "usd");
  form.append("line_items[" + index + "][price_data][unit_amount]", String(Math.round(item.price * 100)));
  form.append("line_items[" + index + "][price_data][product_data][name]", item.name);
  form.append("line_items[" + index + "][price_data][product_data][metadata][printful_sync_variant_id]", String(item.variantId));
  form.append("line_items[" + index + "][quantity]", String(item.qty));
}

async function createStripeSession(validatedItems, shipping, recipient, printfulOrderId, orderRef) {
  var form = new URLSearchParams();
  form.append("mode", "payment");
  form.append("success_url", BASE_URL + "/shop/success/?session_id={CHECKOUT_SESSION_ID}");
  form.append("cancel_url", BASE_URL + "/shop/?checkout=cancelled");
  form.append("client_reference_id", orderRef);
  form.append("customer_email", recipient.email);
  form.append("billing_address_collection", "auto");
  form.append("expires_at", String(Math.floor(Date.now() / 1000) + 3600));
  form.append("metadata[printful_order_id]", String(printfulOrderId));
  form.append("metadata[order_ref]", orderRef);
  form.append("payment_intent_data[metadata][printful_order_id]", String(printfulOrderId));
  form.append("payment_intent_data[metadata][order_ref]", orderRef);

  if (String(process.env.STRIPE_AUTOMATIC_TAX || "").toLowerCase() === "true") {
    form.append("automatic_tax[enabled]", "true");
  }

  var index = 0;
  validatedItems.forEach(function (item) {
    appendLineItem(form, index++, item);
  });

  if (shipping > 0) {
    appendLineItem(form, index++, {
      name: "Standard shipping",
      price: shipping,
      qty: 1,
      variantId: "shipping"
    });
  }

  return stripeRequest("/checkout/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });
}

async function serverValidateItems(items) {
  var validated = [];
  for (var i = 0; i < items.length; i += 1) {
    var requested = items[i];
    var payload = await printful.getSyncVariant(STORE_ID, requested.variantId);
    var variant = payload.result || {};
    var productId = variant.sync_product_id || variant.product_id ||
      (variant.product && (variant.product.id || variant.product.sync_product_id));

    if (productId && EXCLUDED_PRODUCTS[String(productId)]) {
      throw new Error("One item in your bag is no longer available.");
    }
    if (variant.is_ignored) throw new Error("One item in your bag is not available for fulfillment.");

    var price = moneyNumber(variant.retail_price);
    if (price === null || price <= 0) throw new Error("One item in your bag does not have a valid retail price.");

    validated.push({
      variantId: requested.variantId,
      qty: requested.qty,
      price: price,
      name: clean(variant.name || (variant.product && variant.product.name) || "MZCMG Shop Item", 180)
    });
  }
  return validated;
}

function orderReference() {
  return "MZ-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

async function startCheckout(req, res) {
  stripeKey(); // fail before creating a Printful draft if Stripe is not configured
  var body = await readJson(req);
  var recipient = validateRecipient(body.recipient);
  var requestedItems = validateItems(body.items);
  var items = await serverValidateItems(requestedItems);
  var orderRef = orderReference();

  var orderPayload = {
    external_id: orderRef,
    shipping: "STANDARD",
    recipient: recipient,
    items: items.map(function (item) {
      return {
        sync_variant_id: Number(item.variantId),
        quantity: item.qty,
        retail_price: item.price.toFixed(2)
      };
    })
  };

  var draft = await printful.createOrder(STORE_ID, orderPayload);
  var order = draft.result || {};
  if (!order.id) throw new Error("Printful did not return a draft order ID.");

  var shipping = moneyNumber(order.costs && order.costs.shipping) || 0;

  try {
    var session = await createStripeSession(items, shipping, recipient, order.id, orderRef);
    return send(res, 200, {
      ok: true,
      url: session.url,
      sessionId: session.id,
      orderRef: orderRef
    });
  } catch (error) {
    try { await printful.cancelOrder(STORE_ID, order.id); } catch (cleanupError) {}
    throw error;
  }
}

async function stripeSession(sessionId) {
  return stripeRequest("/checkout/sessions/" + encodeURIComponent(sessionId));
}

async function fulfillSession(sessionId) {
  var session = await stripeSession(sessionId);
  if (session.payment_status !== "paid") {
    return { ok: false, paid: false, status: session.payment_status || "unpaid" };
  }

  var orderId = session.metadata && session.metadata.printful_order_id;
  if (!orderId) throw new Error("Paid session is missing its Printful order reference.");

  var current = await printful.getOrder(STORE_ID, orderId);
  var order = current.result || {};
  var status = String(order.status || "").toLowerCase();

  var printfulConfirmationEnabled =
    String(process.env.MZ_SHOP_CONFIRM_PRINTFUL || "").toLowerCase() === "true";

  if (session.livemode === false || !printfulConfirmationEnabled) {
    return {
      ok: true,
      paid: true,
      testMode: session.livemode === false,
      fulfillmentHeld: true,
      sessionId: session.id,
      orderRef: (session.metadata && session.metadata.order_ref) || session.client_reference_id || "",
      printfulOrderId: orderId,
      fulfillmentStatus: session.livemode === false ? "test-paid-not-submitted" : "live-paid-held-for-launch"
    };
  }

  if (status === "draft" || status === "failed") {
    var confirmed = await printful.confirmOrder(STORE_ID, orderId);
    order = confirmed.result || order;
    status = String(order.status || status).toLowerCase();
  }

  return {
    ok: true,
    paid: true,
    sessionId: session.id,
    orderRef: (session.metadata && session.metadata.order_ref) || session.client_reference_id || "",
    printfulOrderId: orderId,
    fulfillmentStatus: status || "submitted"
  };
}

async function cancelDraftFromSession(session) {
  var orderId = session && session.metadata && session.metadata.printful_order_id;
  if (!orderId) return;
  try {
    var current = await printful.getOrder(STORE_ID, orderId);
    var order = current.result || {};
    if (String(order.status || "").toLowerCase() === "draft") {
      await printful.cancelOrder(STORE_ID, orderId);
    }
  } catch (error) {}
}

function verifyStripeSignature(raw, header, secret) {
  if (!raw || !header || !secret) return false;
  var parts = String(header).split(",");
  var timestamp = "";
  var signatures = [];
  parts.forEach(function (part) {
    var pair = part.split("=");
    if (pair[0] === "t") timestamp = pair[1];
    if (pair[0] === "v1") signatures.push(pair[1]);
  });
  if (!timestamp || !signatures.length) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) return false;

  var expected = crypto.createHmac("sha256", secret)
    .update(timestamp + "." + raw.toString("utf8"), "utf8")
    .digest("hex");

  return signatures.some(function (signature) {
    var a = Buffer.from(expected, "utf8");
    var b = Buffer.from(String(signature), "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

async function handleWebhook(req, res) {
  var secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret) return send(res, 503, { ok: false, error: "Stripe webhook is not configured." });

  var raw = await readRaw(req);
  var signature = req.headers["stripe-signature"] || "";
  if (!verifyStripeSignature(raw, signature, secret)) {
    return send(res, 400, { ok: false, error: "Invalid webhook signature." });
  }

  var event = JSON.parse(raw.toString("utf8"));
  var session = event && event.data && event.data.object;

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await fulfillSession(session.id);
  } else if (event.type === "checkout.session.expired") {
    await cancelDraftFromSession(session);
  }

  return send(res, 200, { received: true });
}

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  var action = (req.query && req.query.action) || "";

  try {
    if (req.method === "GET" && action === "health") {
      return send(res, 200, {
        ok: true,
        printfulConfigured: Boolean(process.env.PRINTFUL_TOKEN),
        stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
        webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        automaticTax: String(process.env.STRIPE_AUTOMATIC_TAX || "").toLowerCase() === "true",
        printfulConfirmationEnabled: String(process.env.MZ_SHOP_CONFIRM_PRINTFUL || "").toLowerCase() === "true",
        stripeMode: process.env.STRIPE_SECRET_KEY
          ? (String(process.env.STRIPE_SECRET_KEY).indexOf("sk_test_") === 0 ? "test" : "live")
          : "unconfigured"
      });
    }

    if (req.method === "GET" && action === "complete") {
      var sessionId = clean(req.query && req.query.session_id, 200);
      if (!sessionId) return send(res, 400, { ok: false, error: "Missing checkout session." });
      var result = await fulfillSession(sessionId);
      return send(res, result.paid ? 200 : 202, result);
    }

    if (req.method === "POST" && action === "webhook") {
      return await handleWebhook(req, res);
    }

    if (req.method === "POST" && !action) {
      return await startCheckout(req, res);
    }

    return send(res, 404, { ok: false, error: "Checkout route not found." });
  } catch (error) {
    var status = error.code === "STRIPE_NOT_CONFIGURED" ? 503 : (error.status || 400);
    return send(res, status, { ok: false, error: error.message || "Checkout failed." });
  }
};


// Stripe webhook signatures require the exact raw request body.
// Checkout JSON is parsed manually above, so Vercel's body parser can stay disabled safely.
module.exports.config = { api: { bodyParser: false } };
