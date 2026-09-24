var zlib = require("zlib");

var CRC_TABLE = (function () {
  var table = [];
  for (var n = 0; n < 256; n += 1) {
    var c = n;
    for (var k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  var c = 0xffffffff;
  for (var i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  var t = Buffer.from(type);
  var len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  var crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function hash(x, y, seed) {
  var n = ((x * 374761393) ^ (y * 668265263) ^ (seed * 2246822519)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function rgba(hex, alpha) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    alpha
  ];
}

function makePng(mode, seed) {
  var isMug = mode === "mug";
  var isKnit = mode === "knit";
  var width = isKnit ? 1400 : (isMug ? 1600 : 1200);
  var height = isKnit ? 1400 : (isMug ? 700 : 1600);
  var scale = isKnit ? 7 : 4;
  var lw = Math.floor(width / scale);
  var lh = Math.floor(height / scale);

  var cream = rgba("#f1efe8", 255);
  var navy = rgba("#09254f", 255);
  var coral = rgba("#ff6f61", 255);
  var mint = rgba("#5ee0bd", 255);

  var low = Buffer.alloc(lw * lh * 4);

  for (var y = 0; y < lh; y += 1) {
    for (var x = 0; x < lw; x += 1) {
      var nx = x / lw;
      var ny = y / lh;
      var cx = nx - 0.5;
      var cy = ny - 0.5;
      var radial = Math.sqrt(cx * cx + cy * cy);
      var waveA = Math.sin((nx * 19 + ny * 11 + seed * 0.17) * Math.PI);
      var waveB = Math.cos((nx * 7 - ny * 23 + seed * 0.11) * Math.PI);
      var band = Math.abs(waveA + waveB) * 0.5;
      var block = hash(Math.floor(x / 9), Math.floor(y / 9), seed);
      var dither = hash(x, y, seed + 31);
      var inside = (isMug || isKnit) ? true : (radial < 0.46 && Math.abs(cx) < 0.38);
      var color;

      if (!inside) {
        color = [0, 0, 0, 0];
      } else if (band > 0.84) {
        color = navy;
      } else if ((block > 0.72 && dither > 0.36) || (waveA > 0.78 && ny > 0.18)) {
        color = coral;
      } else if ((block < 0.22 && dither > 0.2) || (waveB < -0.75 && nx > 0.22)) {
        color = mint;
      } else if (isMug || isKnit || dither > 0.73) {
        color = cream;
      } else {
        color = [0, 0, 0, 0];
      }

      var idx = (y * lw + x) * 4;
      low[idx] = color[0];
      low[idx + 1] = color[1];
      low[idx + 2] = color[2];
      low[idx + 3] = color[3];
    }
  }

  var raw = Buffer.alloc((width * 4 + 1) * height);
  var rowSize = width * 4 + 1;

  for (var yy = 0; yy < height; yy += 1) {
    var rowStart = yy * rowSize;
    raw[rowStart] = 0;
    var sy = Math.min(lh - 1, Math.floor(yy / scale));
    for (var xx = 0; xx < width; xx += 1) {
      var sx = Math.min(lw - 1, Math.floor(xx / scale));
      var src = (sy * lw + sx) * 4;
      var dst = rowStart + 1 + xx * 4;
      raw[dst] = low[src];
      raw[dst + 1] = low[src + 1];
      raw[dst + 2] = low[src + 2];
      raw[dst + 3] = low[src + 3];
    }
  }

  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

module.exports = async function handler(req, res) {
  var requestedMode = req.query && req.query.mode;
  var mode = requestedMode === "mug" ? "mug" : (requestedMode === "knit" ? "knit" : "shirt");
  var seed = parseInt(req.query && req.query.seed, 10);
  if (!Number.isFinite(seed)) seed = 47;

  try {
    var png = makePng(mode, seed);
    res.statusCode = 200;
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(png);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("OBAS source generation error: " + error.message);
  }
};
