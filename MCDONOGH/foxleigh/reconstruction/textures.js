// Foxleigh Reconstruction 002 — procedural PBR surface textures (MZ.Claude, 2026-11-03)
// Every texture is drawn in the browser from seeded noise. Nothing is sampled from the
// archival photographs, so the GLB carries no third-party imagery.
// Each material records userData.tile = the real-world size (metres) one texture repeat covers;
// the model builder writes UVs in metres / tile, so brick courses and clapboard laps stay true to scale.
import * as THREE from 'three';

const N = 512;
function rng(seed) { let s = seed >>> 0; return () => ((s = (1664525 * s + 1013904223) >>> 0) / 4294967296); }
function cv(n = N) { const c = document.createElement('canvas'); c.width = c.height = n; return [c, c.getContext('2d')]; }

// value noise, tileable
function noiseField(n, cells, seed) {
  const r = rng(seed), g = []; for (let i = 0; i < cells * cells; i++) g.push(r());
  const f = new Float32Array(n * n), s = t => t * t * (3 - 2 * t);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const fx = x / n * cells, fy = y / n * cells, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = s(fx - x0), ty = s(fy - y0);
    const v = (i, j) => g[((j % cells) * cells) + (i % cells)];
    f[y * n + x] = (v(x0, y0) * (1 - tx) + v(x0 + 1, y0) * tx) * (1 - ty) + (v(x0, y0 + 1) * (1 - tx) + v(x0 + 1, y0 + 1) * tx) * ty;
  }
  return f;
}
function fbm(n, seed, oct = [4, 8, 16, 32, 64]) {
  const out = new Float32Array(n * n); let a = 1, tot = 0;
  oct.forEach((c, k) => { const f = noiseField(n, c, seed + k * 101); for (let i = 0; i < out.length; i++) out[i] += f[i] * a; tot += a; a *= 0.55; });
  for (let i = 0; i < out.length; i++) out[i] /= tot; return out;
}

// Height canvas (grey) → tangent-space normal map
function normalFrom(height, n, strength) {
  const [c, g] = cv(n), img = g.createImageData(n, n), d = img.data;
  const h = (x, y) => height[((y + n) % n) * n + ((x + n) % n)];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (h(x + 1, y) - h(x - 1, y)) * strength, dy = (h(x, y + 1) - h(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}
function heightFromCanvas(c) {
  const n = c.width, d = c.getContext('2d').getImageData(0, 0, n, n).data, h = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) h[i] = d[i * 4] / 255; return h;
}
function tex(c, srgb) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.userData.mimeType = 'image/jpeg'; return t;
}
function shade(rgb, k) { return `rgb(${Math.max(0, Math.min(255, rgb[0] * k)) | 0},${Math.max(0, Math.min(255, rgb[1] * k)) | 0},${Math.max(0, Math.min(255, rgb[2] * k)) | 0})`; }
function grime(g, n, seed, alpha, rgb = [60, 52, 40]) {
  const f = fbm(n, seed, [3, 6, 12, 24]), img = g.getImageData(0, 0, n, n), d = img.data;
  for (let i = 0; i < n * n; i++) { const k = Math.max(0, f[i] - 0.45) * alpha * 2; for (let j = 0; j < 3; j++) d[i * 4 + j] = d[i * 4 + j] * (1 - k) + rgb[j] * k; }
  g.putImageData(img, 0, 0);
}

// ---------- surfaces ----------
// Coursed running bond under several coats of lime-white paint. tile 1.2 m, 16 courses (75 mm), 200 mm bricks.
function paintedBrick() {
  const r = rng(11), [c, g] = cv(), [hc, hg] = cv();
  g.fillStyle = '#e2dccd'; g.fillRect(0, 0, N, N); hg.fillStyle = '#8a8a8a'; hg.fillRect(0, 0, N, N);
  const rows = 16, rh = N / rows, bw = N / 6;
  for (let y = 0; y < rows; y++) for (let x = -1; x < 7; x++) {
    const ox = (y % 2) * bw / 2, X = x * bw + ox + 2, Y = y * rh + 2, W = bw - 4, H = rh - 4, k = 0.97 + r() * 0.05;
    g.fillStyle = shade([222, 216, 202], k); g.fillRect(X, Y, W, H);
    hg.fillStyle = `rgb(${200 + r() * 40 | 0},0,0)`; hg.fillRect(X, Y, W, H);
    if (r() < 0.035) { g.fillStyle = shade([150, 86, 66], 0.9 + r() * 0.2); const s = 4 + r() * 10; g.fillRect(X + r() * (W - s), Y + r() * (H - 4), s, 3 + r() * 4); }
  }
  grime(g, N, 12, 0.22);
  const hh = heightFromCanvas(hc), nf = fbm(N, 13, [16, 32, 64, 128]); for (let i = 0; i < hh.length; i++) hh[i] = hh[i] * 0.6 + nf[i] * 0.35;
  return { map: tex(c, true), normalMap: tex(normalFrom(hh, N, 1.4)), tile: 1.2, roughness: 0.92 };
}
// Painted lap siding: 8 boards over 0.92 m (115 mm exposure)
function clapboard() {
  const r = rng(21), [c, g] = cv(), h = new Float32Array(N * N), bh = N / 8, nf = fbm(N, 22, [8, 32, 64, 128]);
  const img = g.createImageData(N, N), d = img.data;
  for (let y = 0; y < N; y++) {
    const t = (y % bh) / bh; // 0 at top of board (under the lap above), 1 at bottom edge
    for (let x = 0; x < N; x++) {
      const i = y * N + x, grain = nf[i] * 0.08;
      h[i] = t * 0.9 + grain;
      const lap = t < 0.08 ? 0.72 + t * 3 : 1; // shadow line under each lap
      const k = (0.9 + 0.08 * t + grain) * lap;
      d[i * 4] = 226 * k; d[i * 4 + 1] = 222 * k; d[i * 4 + 2] = 212 * k; d[i * 4 + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0); grime(g, N, 23, 0.25);
  for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(70,60,45,0.05)'; const x = r() * N; g.fillRect(x, r() * N, 1 + r() * 3, 30 + r() * 140); }
  return { map: tex(c, true), normalMap: tex(normalFrom(h, N, 6)), tile: 0.92, roughness: 0.82 };
}
// Welsh/Pennsylvania slate, 300 mm wide, 150 mm exposure; two bands of fish-scale in every eight courses.
function slate() {
  const r = rng(31), [c, g] = cv(), [hc, hg] = cv(), rows = 8, rh = N / rows, sw = N / 4;
  g.fillStyle = '#1e2226'; g.fillRect(0, 0, N, N); hg.fillStyle = '#000'; hg.fillRect(0, 0, N, N);
  for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
    const ox = (y % 2) * sw / 2, X = x * sw + ox + 1.5, Y = y * rh, W = sw - 3, fish = (y === 2 || y === 3);
    const v = r(), base = [50 + v * 16 + r() * 4, 54 + v * 16 + r() * 4, 60 + v * 16 + r() * 5];
    const gr = hg.createLinearGradient(0, Y, 0, Y + rh); gr.addColorStop(0, '#202020'); gr.addColorStop(1, '#e0e0e0');
    g.fillStyle = shade(base, 1); hg.fillStyle = gr;
    for (const [ctx, st] of [[g, g.fillStyle], [hg, gr]]) {
      ctx.fillStyle = st; ctx.beginPath();
      if (fish) { ctx.moveTo(X, Y); ctx.lineTo(X + W, Y); ctx.lineTo(X + W, Y + rh * 0.45); ctx.arc(X + W / 2, Y + rh * 0.45, W / 2, 0, Math.PI); ctx.closePath(); }
      else ctx.rect(X, Y, W, rh - 1.5);
      ctx.fill();
    }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X, Y + rh - 3, W, 2);
  }
  grime(g, N, 32, 0.18, [90, 96, 80]);
  return { map: tex(c, true), normalMap: tex(normalFrom(heightFromCanvas(hc), N, 3)), tile: 1.2, roughness: 0.62 };
}
// Weathered sawn wood shingles, random widths, 133 mm exposure
function shingle() {
  const r = rng(41), [c, g] = cv(), [hc, hg] = cv(), rows = 9, rh = N / rows;
  g.fillStyle = '#25211d'; g.fillRect(0, 0, N, N); hg.fillStyle = '#000'; hg.fillRect(0, 0, N, N);
  for (let y = 0; y < rows; y++) {
    let x = -r() * 40;
    while (x < N + 40) {
      const w = 22 + r() * 60, k = 0.75 + r() * 0.4, base = [66, 60, 54];
      g.fillStyle = shade(base, k); g.fillRect(x + 1, y * rh, w - 2, rh - 2);
      for (let s = 0; s < 6; s++) { g.fillStyle = `rgba(30,25,20,${0.08 + r() * 0.12})`; g.fillRect(x + 2 + r() * (w - 4), y * rh, 1, rh - 2); }
      const gr = hg.createLinearGradient(0, y * rh, 0, y * rh + rh); gr.addColorStop(0, '#111'); gr.addColorStop(1, '#ddd');
      hg.fillStyle = gr; hg.fillRect(x + 1, y * rh, w - 2, rh - 2);
      // wrap
      x += w;
    }
  }
  grime(g, N, 42, 0.3, [70, 80, 50]);
  return { map: tex(c, true), normalMap: tex(normalFrom(heightFromCanvas(hc), N, 3)), tile: 1.2, roughness: 0.95 };
}
// Coursed rubble (local Piedmont fieldstone): foundations and the stone annex. tile 2.0 m
function rubble(seed = 51, warm = 1) {
  const r = rng(seed), [c, g] = cv(), [hc, hg] = cv();
  g.fillStyle = '#9a9388'; g.fillRect(0, 0, N, N); hg.fillStyle = '#111'; hg.fillRect(0, 0, N, N);
  let y = 0;
  while (y < N) {
    const rh = Math.min(N - y, 24 + r() * 30); let x = -r() * 50;
    while (x < N) {
      const w = 36 + r() * 80, base = [[118, 108, 96], [140, 128, 110], [96, 92, 88], [150, 122, 98], [108, 104, 100]][r() * 5 | 0];
      const k = 0.85 + r() * 0.3, rad = 4 + r() * 6, X = x + 3, Y = y + 3, W = w - 6, H = rh - 6;
      for (const ctx of [g, hg]) {
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(X, Y, W, H, rad) : ctx.rect(X, Y, W, H);
        if (ctx === g) ctx.fillStyle = shade([base[0] * warm, base[1], base[2] / warm], k);
        else { const gr = ctx.createRadialGradient(X + W / 2, Y + H / 2, 2, X + W / 2, Y + H / 2, Math.max(W, H) / 1.6); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#555'); ctx.fillStyle = gr; }
        ctx.fill();
      }
      x += w;
    }
    y += rh;
  }
  grime(g, N, seed + 1, 0.3);
  const h = heightFromCanvas(hc), nf = fbm(N, seed + 2, [16, 32, 64]); for (let i = 0; i < h.length; i++) h[i] += nf[i] * 0.4;
  return { map: tex(c, true), normalMap: tex(normalFrom(h, N, 3)), tile: 2.0, roughness: 0.95 };
}
// Chimney brick: soft red, dark-struck mortar, soot toward the top is added by geometry banding. tile 1.0 m
function redBrick() {
  const r = rng(61), [c, g] = cv(), [hc, hg] = cv(), rows = 14, rh = N / rows, bw = N / 5;
  g.fillStyle = '#7b7065'; g.fillRect(0, 0, N, N); hg.fillStyle = '#333'; hg.fillRect(0, 0, N, N);
  for (let y = 0; y < rows; y++) for (let x = -1; x < 6; x++) {
    const ox = (y % 2) * bw / 2, X = x * bw + ox + 3, Y = y * rh + 3;
    g.fillStyle = shade([112, 62, 50], 0.62 + r() * 0.4); g.fillRect(X, Y, bw - 6, rh - 6);
    hg.fillStyle = '#ddd'; hg.fillRect(X, Y, bw - 6, rh - 6);
  }
  grime(g, N, 62, 0.7, [34, 30, 28]);
  return { map: tex(c, true), normalMap: tex(normalFrom(heightFromCanvas(hc), N, 2.5)), tile: 1.0, roughness: 0.9 };
}
// Generic board textures: porch floor, beadboard soffits, board-and-batten, standing-seam tin, louvers
function boards({ seed, count, vertical = false, base, gap = 0.06, tile, rough = 0.8, bead = false, seam = false }) {
  const r = rng(seed), [c, g] = cv(), h = new Float32Array(N * N), img = g.createImageData(N, N), d = img.data, nf = fbm(N, seed + 1, [8, 32, 128]);
  const bw = N / count;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const a = vertical ? x : y, i = y * N + x, t = (a % bw) / bw, b = Math.floor(a / bw);
    let hv = 1, k = 1;
    if (seam) { const e = Math.abs(t - 0.5); hv = e < 0.015 ? 1 : 0.3; k = e < 0.02 ? 1.15 : 1; }
    else { if (t < gap) { hv = 0; k = 0.55; } if (bead && Math.abs(t - 0.5) < 0.03) { hv = 0.4; k *= 0.82; } }
    const v = 0.93 + ((b * 7919) % 13) / 130 + nf[i] * 0.12; h[i] = hv + nf[i] * 0.05;
    d[i * 4] = base[0] * k * v; d[i * 4 + 1] = base[1] * k * v; d[i * 4 + 2] = base[2] * k * v; d[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0); grime(g, N, seed + 3, 0.2);
  return { map: tex(c, true), normalMap: tex(normalFrom(h, N, 3)), tile, roughness: rough };
}
function louvers() {
  const [c, g] = cv(256), h = new Float32Array(256 * 256), img = g.createImageData(256, 256), d = img.data, n = 256, lw = n / 10;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const t = (y % lw) / lw, i = y * n + x; h[i] = t; const k = 0.55 + 0.6 * t;
    d[i * 4] = 34 * k; d[i * 4 + 1] = 48 * k; d[i * 4 + 2] = 40 * k; d[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return { map: tex(c, true), normalMap: tex(normalFrom(h, n, 5)), tile: 0.5, roughness: 0.6 };
}
export function grass() {
  const r = rng(71), [c, g] = cv(), f = fbm(N, 72, [4, 8, 16, 32, 64, 128]), img = g.createImageData(N, N), d = img.data;
  for (let i = 0; i < N * N; i++) { const v = f[i], k = 0.75 + v * 0.5 + (r() - 0.5) * 0.16; d[i * 4] = 82 * k; d[i * 4 + 1] = 96 * k; d[i * 4 + 2] = 58 * k; d[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); return { map: tex(c, true), tile: 6, roughness: 1 };
}
export function gravel() {
  const r = rng(81), [c, g] = cv(), f = fbm(N, 82, [8, 32, 128]), img = g.createImageData(N, N), d = img.data;
  for (let i = 0; i < N * N; i++) { const k = 0.8 + f[i] * 0.3 + (r() - 0.5) * 0.3; d[i * 4] = 150 * k; d[i * 4 + 1] = 138 * k; d[i * 4 + 2] = 118 * k; d[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); return { map: tex(c, true), tile: 3, roughness: 1 };
}

function std(o, extra = {}) {
  const m = new THREE.MeshStandardMaterial({ map: o.map, normalMap: o.normalMap, roughness: o.roughness ?? 0.85, metalness: 0, ...extra });
  m.userData.tile = o.tile ?? 1; return m;
}
function plain(color, roughness, extra = {}) { const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra }); m.userData.tile = 1; return m; }

export function makeMaterials() {
  const M = {
    paintBrick: std(paintedBrick()),
    siding: std(clapboard()),
    slate: std(slate()),
    shingle: std(shingle()),
    stone: std(rubble(51, 1)),
    annexStone: std(rubble(55, 1.08)),
    chimney: std(redBrick()),
    trim: plain('#dcd6c8', 0.62),
    sash: plain('#e2ddd2', 0.55),
    glass: plain('#0d1418', 0.06, { metalness: 0.2, envMapIntensity: 1.4 }),
    shutter: std(louvers()),
    door: plain('#3a2a20', 0.6),
    porchFloor: std(boards({ seed: 91, count: 6, base: [120, 116, 106], tile: 0.6, rough: 0.85 })),
    ceiling: std(boards({ seed: 95, count: 8, base: [224, 220, 206], tile: 0.8, bead: true, rough: 0.7 })),
    batten: std(boards({ seed: 97, count: 4, vertical: true, base: [170, 160, 140], gap: 0.1, tile: 1.2, rough: 0.9 })),
    tin: std(boards({ seed: 99, count: 2, vertical: true, base: [72, 74, 76], tile: 1.0, seam: true, rough: 0.5 }), { metalness: 0.35 }),
    iron: plain('#2a2b2b', 0.5, { metalness: 0.6 }),
    gutter: plain('#3d3f40', 0.45, { metalness: 0.4 }),
    lattice: plain('#2b2723', 0.9),
    stoneStep: std(rubble(59, 0.95)),
  };
  for (const [k, m] of Object.entries(M)) m.name = 'foxleigh_' + k;
  return M;
}
