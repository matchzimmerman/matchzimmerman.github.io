function unauthorized(res) {
  res.setHeader("WWW-Authenticate", 'Basic realm="MZCMG Shop Inventory"');
  res.statusCode = 401;
  res.end("Authentication required.");
}

function requireAdmin(req, res) {
  var expected = process.env.MZ_SHOP_ADMIN_PASSWORD;

  if (!expected) {
    res.statusCode = 503;
    res.end("MZ_SHOP_ADMIN_PASSWORD is not configured.");
    return false;
  }

  var header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) {
    unauthorized(res);
    return false;
  }

  try {
    var decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    var separator = decoded.indexOf(":");
    if (separator < 0) {
      unauthorized(res);
      return false;
    }

    var username = decoded.slice(0, separator);
    var password = decoded.slice(separator + 1);

    if (username !== "match" || password !== expected) {
      unauthorized(res);
      return false;
    }

    return true;
  } catch (error) {
    unauthorized(res);
    return false;
  }
}

module.exports = { requireAdmin: requireAdmin };
