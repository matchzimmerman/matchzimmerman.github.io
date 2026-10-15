var catalog = require("../lib/catalog");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: "Method not allowed." }));
  }
  // The public endpoint never exposes draft product records or production files.
  res.statusCode = 200;
  return res.end(JSON.stringify({ ok: true, source: "mzcmg", products: catalog.listPublic() }));
};
