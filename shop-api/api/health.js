module.exports = async function handler(req, res) {
  var configured = Boolean(
    process.env.PRINTFUL_TOKEN && process.env.MZ_SHOP_ADMIN_PASSWORD
  );

  res.statusCode = configured ? 200 : 503;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({
    ok: configured,
    service: "MZCMG Shop API",
    printful: Boolean(process.env.PRINTFUL_TOKEN),
    adminAuth: Boolean(process.env.MZ_SHOP_ADMIN_PASSWORD)
  }, null, 2));
};
