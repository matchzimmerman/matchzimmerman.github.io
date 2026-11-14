/* MZ WORLD · MEMORIAL STADIUM · BIT FIELD 048 · z-buffered software rasterizer
   Why not HARBOUR LIGHT 047's painter's sort: 047 sorts whole objects by distance, which works for a
   harbour of separate things seen across water, but not for a bowl that wraps round the camera
   (the stands nearest the camera are one continuous object). This writes a per-pixel G-buffer:
   triangle id, 1/z and world position, so the ink, neutral and evidence printers all read the
   same frame. Deterministic: no GPU, no randomness.                                             */

export function makeCam(pos, look, fovDeg, W, H) {
  let f = [look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]]; const fl = Math.hypot(...f); f = f.map(v => v / fl);
  let r = [f[2], 0, -f[0]]; const rl = Math.hypot(...r) || 1; r = r.map(v => v / rl);      // cross(up, f)
  const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]]; // cross(f, r)
  return { pos: [...pos], look: [...look], fov: fovDeg, f, r, u, W, H, F: (W / 2) / Math.tan(fovDeg * Math.PI / 360) };
}

export function makeGBuffer(W, H) {
  const N = W * H;
  return { W, H, id: new Int32Array(N), iz: new Float32Array(N), wx: new Float32Array(N), wy: new Float32Array(N), wz: new Float32Array(N) };
}

const NEAR = 0.3;
/* core: rasterize one screen triangle. v = [sx,sy,key, ax,ay,az] ×3, where key is 1/z (perspective)
   or −depth (orthographic) and a* are world coords pre-multiplied by key (perspective) or plain (ortho). */
function rasterTri(gb, v0, v1, v2, id, persp, cut) {
  const { W, H } = gb;
  let minX = Math.max(0, Math.floor(Math.min(v0[0], v1[0], v2[0]))), maxX = Math.min(W - 1, Math.ceil(Math.max(v0[0], v1[0], v2[0])));
  let minY = Math.max(0, Math.floor(Math.min(v0[1], v1[1], v2[1]))), maxY = Math.min(H - 1, Math.ceil(Math.max(v0[1], v1[1], v2[1])));
  if (minX > maxX || minY > maxY) return;
  const area = (v1[0] - v0[0]) * (v2[1] - v0[1]) - (v1[1] - v0[1]) * (v2[0] - v0[0]);
  if (Math.abs(area) < 1e-9) return;
  const ia = 1 / area;
  for (let y = minY; y <= maxY; y++) {
    const py = y + .5;
    for (let x = minX; x <= maxX; x++) {
      const px = x + .5;
      let w0 = ((v1[0] - px) * (v2[1] - py) - (v1[1] - py) * (v2[0] - px)) * ia;
      let w1 = ((v2[0] - px) * (v0[1] - py) - (v2[1] - py) * (v0[0] - px)) * ia;
      let w2 = 1 - w0 - w1;
      if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
      const key = w0 * v0[2] + w1 * v1[2] + w2 * v2[2], i = y * W + x;
      if (key <= gb.iz[i]) continue;
      let ax = w0 * v0[3] + w1 * v1[3] + w2 * v2[3], ay = w0 * v0[4] + w1 * v1[4] + w2 * v2[4], az = w0 * v0[5] + w1 * v1[5] + w2 * v2[5];
      if (persp) { const z = 1 / key; ax *= z; ay *= z; az *= z; }
      if (cut && cut(id, ax, ay, az)) continue;
      gb.iz[i] = key; gb.id[i] = id; gb.wx[i] = ax; gb.wy[i] = ay; gb.wz[i] = az;
    }
  }
}

/* perspective render of the whole scene into a G-buffer. cut(id,x,y,z) → true discards (cut-out materials) */
export function renderScene(gb, G, cam, cut) {
  gb.id.fill(-1); gb.iz.fill(0);
  const { f, r, u, F, pos } = cam, hw = gb.W / 2, hh = gb.H / 2;
  const cx = new Float64Array(3), cy = new Float64Array(3), cz = new Float64Array(3), wp = new Float64Array(9);
  const poly = [];
  const proj = (X, Y, Z, x, y, z) => { const k = 1 / z; return [hw + x * F * k, hh - y * F * k, k, X * k, Y * k, Z * k]; };
  for (let t = 0; t < G.n; t++) {
    const o = t * 9; let behind = 0, left = 0, right = 0;
    for (let k = 0; k < 3; k++) {
      const X = G.P[o + k * 3] - pos[0], Y = G.P[o + k * 3 + 1] - pos[1], Z = G.P[o + k * 3 + 2] - pos[2];
      wp[k * 3] = G.P[o + k * 3]; wp[k * 3 + 1] = G.P[o + k * 3 + 1]; wp[k * 3 + 2] = G.P[o + k * 3 + 2];
      cx[k] = X * r[0] + Y * r[1] + Z * r[2]; cy[k] = X * u[0] + Y * u[1] + Z * u[2]; cz[k] = X * f[0] + Y * f[1] + Z * f[2];
      if (cz[k] < NEAR) behind++;
      if (cx[k] * F < -hw * cz[k] - 4) left++; else if (cx[k] * F > hw * cz[k] + 4) right++;
    }
    if (behind === 3 || (behind === 0 && (left === 3 || right === 3))) continue;
    if (!behind) { rasterTri(gb, proj(wp[0], wp[1], wp[2], cx[0], cy[0], cz[0]), proj(wp[3], wp[4], wp[5], cx[1], cy[1], cz[1]), proj(wp[6], wp[7], wp[8], cx[2], cy[2], cz[2]), t, true, cut); continue; }
    // clip against the near plane
    poly.length = 0;
    for (let k = 0; k < 3; k++) {
      const j = (k + 1) % 3, ain = cz[k] >= NEAR, bin = cz[j] >= NEAR;
      if (ain) poly.push([cx[k], cy[k], cz[k], wp[k * 3], wp[k * 3 + 1], wp[k * 3 + 2]]);
      if (ain !== bin) { const s = (NEAR - cz[k]) / (cz[j] - cz[k]), L = (a, b) => a + (b - a) * s;
        poly.push([L(cx[k], cx[j]), L(cy[k], cy[j]), NEAR, L(wp[k * 3], wp[j * 3]), L(wp[k * 3 + 1], wp[j * 3 + 1]), L(wp[k * 3 + 2], wp[j * 3 + 2])]); }
    }
    if (poly.length < 3) continue;
    const pv = poly.map(p => proj(p[3], p[4], p[5], p[0], p[1], p[2]));
    for (let k = 1; k + 1 < pv.length; k++) rasterTri(gb, pv[0], pv[k], pv[k + 1], t, true, cut);
  }
  // line primitives (posts, poles, fence wire, tree trunks): depth-tested, at least one pixel wide
  const nT = G.n;
  for (let li = 0; li < G.lines.length; li++) {
    const Ln = G.lines[li];
    let a = [Ln[0], Ln[1], Ln[2]], b = [Ln[3], Ln[4], Ln[5]];
    const toC = p => { const X = p[0] - pos[0], Y = p[1] - pos[1], Z = p[2] - pos[2]; return [X * r[0] + Y * r[1] + Z * r[2], X * u[0] + Y * u[1] + Z * u[2], X * f[0] + Y * f[1] + Z * f[2]]; };
    let ca = toC(a), cb = toC(b);
    if (ca[2] < NEAR && cb[2] < NEAR) continue;
    if (ca[2] < NEAR || cb[2] < NEAR) { const s = (NEAR - ca[2]) / (cb[2] - ca[2]), m = (p, q) => p.map((v, i) => v + (q[i] - v) * s);
      if (ca[2] < NEAR) { ca = m(ca, cb); a = m(a, b); } else { cb = m(ca, cb); b = m(a, b); } }
    const ka = 1 / ca[2], kb = 1 / cb[2];
    const xa = hw + ca[0] * F * ka, ya = hh - ca[1] * F * ka, xb = hw + cb[0] * F * kb, yb = hh - cb[1] * F * kb;
    const steps = Math.ceil(Math.max(Math.abs(xb - xa), Math.abs(yb - ya))) + 1;
    if (steps > 4 * (gb.W + gb.H)) continue;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, key = ka + (kb - ka) * t, z = 1 / key;
      const wpx = Ln[8] * F * key, half = wpx < 1.4 ? 0 : Math.min(3, Math.floor(wpx / 2));
      const x = Math.floor(xa + (xb - xa) * t), y = Math.floor(ya + (yb - ya) * t);
      // world position: perspective-correct along the segment
      const wx = (a[0] * ka + (b[0] * kb - a[0] * ka) * t) * z, wy = (a[1] * ka + (b[1] * kb - a[1] * ka) * t) * z, wz = (a[2] * ka + (b[2] * kb - a[2] * ka) * t) * z;
      for (let dy = -half; dy <= half; dy++) for (let dx = -half; dx <= half; dx++) {
        const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= gb.W || Y >= gb.H) continue;
        const i = Y * gb.W + X; if (key * 1.0005 <= gb.iz[i]) continue;
        gb.iz[i] = key; gb.id[i] = nT + li; gb.wx[i] = wx; gb.wy[i] = wy; gb.wz[i] = wz;
      }
    }
  }
  return gb;
}

/* orthographic depth from the sun, for shadows (only matters when the sky clears) */
export function shadowMap(G, sunDir, size = 1024, bounds = { x0: -170, x1: 170, z0: -120, z1: 230, y1: 45 }) {
  const f = sunDir.map(v => -v);
  let r = [f[2], 0, -f[0]]; const rl = Math.hypot(...r) || 1; r = r.map(v => v / rl);
  const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
  let mr = [1e9, -1e9], mu = [1e9, -1e9];
  for (const x of [bounds.x0, bounds.x1]) for (const z of [bounds.z0, bounds.z1]) for (const y of [0, bounds.y1]) {
    const pr = x * r[0] + y * r[1] + z * r[2], pu = x * u[0] + y * u[1] + z * u[2];
    mr = [Math.min(mr[0], pr), Math.max(mr[1], pr)]; mu = [Math.min(mu[0], pu), Math.max(mu[1], pu)];
  }
  const sc = (size - 1) / Math.max(mr[1] - mr[0], mu[1] - mu[0]);
  const gb = makeGBuffer(size, size); gb.iz.fill(-1e9); gb.id.fill(-1);
  const pj = (x, y, z) => [(x * r[0] + y * r[1] + z * r[2] - mr[0]) * sc, (mu[1] - (x * u[0] + y * u[1] + z * u[2])) * sc, -(x * f[0] + y * f[1] + z * f[2]), x, y, z];
  for (let t = 0; t < G.n; t++) {
    const o = t * 9, P = G.P;
    rasterTri(gb, pj(P[o], P[o + 1], P[o + 2]), pj(P[o + 3], P[o + 4], P[o + 5]), pj(P[o + 6], P[o + 7], P[o + 8]), t, false, null);
  }
  return {
    size, test(x, y, z, bias = .35) { // 0 = in shadow, 1 = lit (2×2 PCF)
      const sx = (x * r[0] + y * r[1] + z * r[2] - mr[0]) * sc, sy = (mu[1] - (x * u[0] + y * u[1] + z * u[2])) * sc, d = -(x * f[0] + y * f[1] + z * f[2]);
      let lit = 0;
      for (const [ox, oy] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) {
        const X = Math.floor(sx + ox), Y = Math.floor(sy + oy);
        if (X < 0 || Y < 0 || X >= size || Y >= size) { lit++; continue; }
        lit += d >= gb.iz[Y * size + X] - bias ? 1 : 0;
      }
      return lit / 4;
    }
  };
}
