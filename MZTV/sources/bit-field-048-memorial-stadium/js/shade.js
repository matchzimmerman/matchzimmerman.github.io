/* MZ WORLD · MEMORIAL STADIUM · BIT FIELD 048 · printers
   One lighting model, three ways of printing it:
     ink       HARBOUR LIGHT v3 language: luminance → six inks through a 4×4 Bayer matrix,
               low internal resolution (default 320×180), pixel-sharp upscale, haze toward the
               horizon tone. Ported from BIT FIELD 046/047 (same BAYER table, same ink rule).
     neutral   the same frame in plain colour at 960×540, no dither: the baseline to judge the print against.
     evidence  every surface coloured by the status of its claim; unfinished geometry hatched.      */
import { MAT, DIM } from './geometry.js';
import { CLAIMS } from './evidence.js';

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16); // as 046/047
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const toHex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
// HARBOUR LIGHT v3 moods (bit-field-046-harbour-light/index.html, MOODS)
const V3 = {
  night: ['#131937', '#27396f', '#4b6598', '#8ba1b8', '#d1cda8', '#f4eccc'].map(hex),
  evening: ['#2b1637', '#6f2a4c', '#c5463a', '#ee8a32', '#fbc94c', '#fff3c4'].map(hex),
  day: ['#34325f', '#74719f', '#c7b8a2', '#efca7c', '#f8e6a6', '#fffcee'].map(hex)
};
/* two 1959 moods derived from v3: drizzle = v3 day pulled 45% toward v3 night (a wet grey afternoon
   that keeps HARBOUR LIGHT's chromatic darks); clear = v3 day with 30% of the v3 evening (a 16° December sun) */
export const INKS = {
  drizzle: V3.day.map((c, i) => mix(c, V3.night[i], .45)),
  clear: V3.day.map((c, i) => mix(c, V3.evening[i], .3))
};
export const INKS_HEX = Object.fromEntries(Object.entries(INKS).map(([k, v]) => [k, v.map(toHex)]));
const rgba32 = c => (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];

/* ---------- small deterministic noise ---------- */
const h2 = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263); h = Math.imul(h ^ h >>> 13, 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };


/* baseball skin: dirt arc 95 ft from the mound in fair territory, minus the infield grass, plus the home circle and mound */
export function skinAt(x, z) {
  const dm = Math.hypot(x, z - 18.44), dh = Math.hypot(x, z);
  if (dh < 4 || dm < 2.7) return true;
  if (!(dm < 29 && z > 0 && Math.abs(x) <= z + .5)) return false;
  const grass = Math.abs(x) + Math.abs(z - 19.4) < 19.4 - 1.4 && dh > 4;
  return !grass;
}
/* how much of a pixel of footprint fp (m) a 1959 field line covers at (x,z); 0..1, exaggerated ×2.4 for legibility */
function cover(d, lw, fp) { d = Math.abs(d); if (fp <= 2 * lw) return d < lw ? 1 : 0; return d < fp / 2 ? Math.min(1, 2.4 * 2 * lw / fp) : 0; }
export function fieldLineCover(x, z, fp) {
  const D = DIM, hx = D.fieldW / 2, lw = .051, yd = .9144;   // 4-inch lines
  if (Math.abs(x) > hx + fp + .2 || z < D.endS - fp - .2 || z > D.endN + fp + .2) return 0;
  let c = 0; const inX = Math.abs(x) <= hx + .1, inZ = z >= D.endS - .1 && z <= D.endN + .1;
  if (inZ) c = Math.max(c, cover(Math.abs(x) - hx, lw, fp));
  if (inX) { c = Math.max(c, cover(z - D.endS, lw, fp), cover(z - D.endN, lw, fp)); }
  if (inX && z > D.goalS - fp && z < D.goalN + fp) {
    const q = (z - D.goalS) / (5 * yd); c = Math.max(c, cover((q - Math.round(q)) * 5 * yd, lw, fp));
    const qy = (z - D.goalS) / yd, dy = (qy - Math.round(qy)) * yd;
    if (Math.abs(Math.abs(x) - (hx - D.hashIn)) < .3 + fp * .5 || Math.abs(Math.abs(x) - hx) < .6 + fp * .5) c = Math.max(c, cover(dy, lw, fp) * .8);
  }
  return c;
}
/* the claim a pixel rests on: geometry claim, refined on the playing surface */
export function claimAt(G, gb, i) {
  const id = gb.id[i]; if (id < 0) return 0;
  if (id >= G.n) return G.lines[id - G.n][7];
  if (G.mat[id] !== MAT.FIELD) return G.claim[id];
  const x = gb.wx[i], z = gb.wz[i], D = DIM;
  if (fieldLineCover(x, z, .05) > 0) return CLAIMS.find(c => c.key === 'field').id;
  if (skinAt(x, z)) return CLAIMS.find(c => c.key === 'infield').id;
  if (Math.abs(x) < D.fieldW / 2 && z > D.endS && z < D.endN) return CLAIMS.find(c => c.key === 'gridiron').id;
  return CLAIMS.find(c => c.key === 'turf').id;
}

/* ---------- materials: [luminance, r, g, b] (linear-ish 0..1) ---------- */
const ALB = {
  [MAT.GROUND]: [.27, .30, .29, .25], [MAT.FIELD]: [.30, .27, .33, .19], [MAT.WALL]: [.40, .44, .43, .40],
  [MAT.CONCRETE]: [.52, .56, .55, .51], [MAT.SOFFIT]: [.42, .47, .46, .43], [MAT.COLUMN]: [.50, .55, .54, .50],
  [MAT.FASCIA]: [.62, .66, .65, .60], [MAT.EXTERIOR]: [.46, .52, .48, .44], [MAT.SCOREBOARD]: [.18, .20, .22, .20],
  [MAT.SB_FACE]: [.10, .10, .12, .11], [MAT.POST]: [.86, .88, .88, .84], [MAT.HOUSE]: [.30, .45, .27, .22],
  [MAT.ROOF]: [.20, .22, .21, .22], [MAT.TREE]: [.22, .26, .23, .20], [MAT.FENCE]: [.30, .32, .33, .33],
  [MAT.PRESSBOX]: [.50, .54, .54, .52], [MAT.CLOCK]: [.85, .88, .87, .82]
};
const COATS = [[.10, .11, .16], [.16, .13, .11], [.22, .22, .23], [.07, .07, .08], [.28, .22, .16], [.12, .16, .26], [.34, .33, .31], [.40, .14, .12]];
const FACE = [[.62, .48, .40], [.50, .37, .30], [.30, .22, .18], [.24, .24, .26], [.70, .70, .66]];

export function makeEnv(opt) {
  const wx = opt.wx === 'clear' ? 'clear' : 'drizzle';
  const s = opt.sun, sd = [Math.sin(s.az) * Math.cos(s.el), Math.sin(s.el), Math.cos(s.az) * Math.cos(s.el)];
  return wx === 'drizzle'
    ? { wx, sunDir: sd, amb: 1.0, dif: .10, vis: 1400, skyBase: .66, skyTop: .2, glow: .08, rain: 1, inks: INKS.drizzle }
    : { wx, sunDir: sd, amb: .55, dif: .95, vis: 14000, skyBase: .62, skyTop: .1, glow: .32, rain: 0, inks: INKS.clear };
}

/* sky luminance along a view ray (overcast: brightest above, a faint warm patch where the sun is) */
function skyL(env, dx, dy, dz, t) {
  const up = Math.max(0, dy), s = env.sunDir, cs = dx * s[0] + dy * s[1] + dz * s[2], ang = Math.sqrt(Math.max(0, 2 * (1 - cs)));
  let L = env.skyBase + env.skyTop * Math.sqrt(up) + env.glow * (Math.exp(-ang / .25) * .6 + Math.exp(-ang / .9) * .3);
  if (up > .01) { const k = 600 / up, cx = dx * k + t * 1.1, cz = dz * k + t * .4; // a cloud deck at 600 m drifting with the 6 mph wind
    const c = vn(cx / 380, cz / 380) * .6 + vn(cx / 140 + 9, cz / 140 + 3) * .4; L += (c - .5) * (env.wx === 'drizzle' ? .16 : .22) * Math.exp(-k / 9000); }
  return clamp(L, 0, 1);
}

/* the albedo of one G-buffer pixel, with the procedural surface patterns
   (field lines, hash marks, infield, wear, crowd, aisles, portals, scoreboard lamps) */
function surface(mat, x, y, z, out, fp = .02) {
  const A = ALB[mat] || [.5, .5, .5, .5];
  out[0] = A[0]; out[1] = A[1]; out[2] = A[2]; out[3] = A[3]; out[4] = 0; // [4] = self-lit lamp
  if (mat === MAT.FIELD) {
    const D = DIM, hx = D.fieldW / 2;
    // late-December turf: patchy olive, worn brown down the middle between the hashes (creative)
    const n = vn(x * .35, z * .35) * .5 + vn(x * 1.7 + 4, z * 1.7) * .5;
    const inField = Math.abs(x) < hx && z > D.endS && z < D.endN;
    let wear = inField ? sstep(hx - D.hashIn + 3, 1, Math.abs(x)) * sstep(D.goalS, D.goalS + 12, z) * sstep(D.goalN, D.goalN - 12, z) : 0;
    wear = clamp(wear * (.55 + n * .6), 0, 1);
    let L = .26 + n * .06, r = .27 + n * .05, g = .29 + n * .05, b = .17;
    r += wear * .1; g -= wear * .04; b += wear * .04; L += wear * .04;
    if (skinAt(x, z)) { L = .34 + n * .04; r = .42 + n * .04; g = .32; b = .23; }
    // 1959 markings, drawn with pixel-footprint coverage so 4-inch lines survive a 320-px print
    const cov = fieldLineCover(x, z, fp);
    if (cov > 0) { L += (.9 - L) * cov; r += (.92 - r) * cov; g += (.92 - g) * cov; b += (.88 - b) * cov; }
    out[0] = L; out[1] = r; out[2] = g; out[3] = b;
  } else if (mat === MAT.CROWD_L || mat === MAT.CROWD_U) {
    // a full house in December coats: one cell per seat (0.5 m) per row; heads near the back of each tread
    const dx = x, dz = z - DIM.cz, th = Math.atan2(dx, -dz), rr = Math.hypot(dx, dz);
    const wing = Math.abs(x) > DIM.pole + .5 && z > DIM.pole + 1;
    const arc = wing ? z : th * rr, radial = wing ? Math.abs(x) : rr;
    const tread = mat === MAT.CROWD_U ? DIM.upTread : DIM.lowTread;
    const seat = Math.floor(arc / .5), rowI = Math.floor(radial / tread), fu = arc / .5 - seat, fv = radial / tread - rowI;
    const deg = th * 180 / Math.PI, aisleStep = mat === MAT.CROWD_U ? 10 : 12;
    const aisle = !wing && Math.abs(((deg % aisleStep) + aisleStep) % aisleStep - aisleStep / 2) * rr * Math.PI / 180 < .6;
    if (aisle) { out[0] = .46; out[1] = .50; out[2] = .49; out[3] = .46; return out; }
    const portal = mat === MAT.CROWD_L && !wing && Math.abs(((deg % 24) + 24) % 24 - 12) * rr * Math.PI / 180 < 1.6 && rr > DIM.R0 + 12 && rr < DIM.R0 + 15.5;
    if (portal) { out[0] = .03; out[1] = .03; out[2] = .03; out[3] = .04; return out; }
    const hsh = h2(seat * 7 + (mat === MAT.CROWD_U ? 1e5 : 0), rowI * 13 + (wing ? 5e4 * Math.sign(x) : 0));
    const coat = COATS[Math.floor(hsh * COATS.length)];
    const head = (fu - .5) * (fu - .5) / .05 + (fv - .62) * (fv - .62) / .06 < 1 && y > 0;
    const c = head ? FACE[Math.floor(h2(seat, rowI + 77) * FACE.length)] : coat;
    out[1] = c[0]; out[2] = c[1]; out[3] = c[2]; out[0] = Math.min(head ? .34 : 1, c[0] * .3 + c[1] * .59 + c[2] * .11); // faces stay inside the crowd's tone in print
  } else if (mat === MAT.SB_FACE) {
    // lamp cells: a grid of bulbs, some lit. The pattern makes no claim about what was displayed.
    const cx = Math.floor((x + 40) / .55), cy = Math.floor(y / .55), lit = h2(Math.floor(cx / 3), Math.floor(cy / 4)) > .62 && h2(cx, cy) > .25;
    const fx = (x + 40) / .55 - cx, fy = y / .55 - cy, bulb = (fx - .5) ** 2 + (fy - .5) ** 2 < .1;
    if (bulb) { out[0] = lit ? .9 : .2; out[1] = lit ? 1 : .2; out[2] = lit ? .78 : .2; out[3] = lit ? .42 : .2; out[4] = lit ? 1 : 0; }
  } else if (mat === MAT.HOUSE) {
    const fl = Math.floor(y / 3.1), wv = (x * .55) % 1, win = y > 1 && y % 3.1 > 1 && y % 3.1 < 2.3 && ((wv + 1) % 1) > .55;
    if (win && fl < 3) { out[0] = .14; out[1] = .14; out[2] = .15; out[3] = .17; }
  } else if (mat === MAT.CONCRETE || mat === MAT.EXTERIOR || mat === MAT.WALL) {
    const n = vn(x * .6 + z * .6, y * .9) * .08; out[0] += n - .04; out[1] += n - .04; out[2] += n - .04; out[3] += n - .04;
  }
  return out;
}

/* is a cut-out pixel transparent? (bare winter trees) */
export function makeCut(G) {
  return (id, x, y, z) => {
    if (id >= G.n || G.mat[id] !== MAT.TREE) return false;
    const n = vn(x * 1.3 + z * .9, y * 1.6) * .6 + vn(x * 4.1 + z * 3.3, y * 4.4) * .4;
    const crown = 1 - Math.abs((y - 2.5) / 12 - .5) * 1.6;
    return n < .62 - crown * .12;
  };
}

/* light one pixel: returns [light, mat, claim, unfinished, normal·view] */
function lightAt(G, gb, i, cam, env, sh) {
  const id = gb.id[i]; if (id < 0) return null;
  const isLine = id >= G.n, li = id - G.n;
  const mat = isLine ? G.lines[li][6] : G.mat[id], claim = claimAt(G, gb, i), unf = isLine ? 0 : G.unf[id];
  const x = gb.wx[i], y = gb.wy[i], z = gb.wz[i];
  let nx, ny, nz, ao;
  if (isLine) { const L = G.lines[li], dx = cam.pos[0] - x, dz = cam.pos[2] - z, l = Math.hypot(dx, dz) || 1; nx = dx / l; ny = 0; nz = dz / l; ao = .9; }
  else { nx = G.N[id * 3]; ny = G.N[id * 3 + 1]; nz = G.N[id * 3 + 2]; ao = G.ao[id];
    if (nx * (cam.pos[0] - x) + ny * (cam.pos[1] - y) + nz * (cam.pos[2] - z) < 0) { nx = -nx; ny = -ny; nz = -nz; } }
  const s = env.sunDir, ndl = Math.max(0, nx * s[0] + ny * s[1] + nz * s[2]);
  const lit = env.dif > .2 && ndl > 0 && sh ? sh.test(x + nx * .2, y + ny * .2, z + nz * .2) : 1;
  const skyV = .62 + .38 * Math.max(0, ny);
  return [env.amb * ao * skyV + env.dif * ndl * lit, mat, claim, unf, x, y, z];
}

const SB = [0, 0, 0, 0, 0];
/* ---------- the ink print (HARBOUR LIGHT) ---------- */
export function printInk(G, gb, cam, env, sh, px32, t) {
  const { W, H } = gb, pal = env.inks.map(rgba32), hw = W / 2, hh = H / 2, F = cam.F, { f, r, u } = cam;
  const LAMP = rgba32([255, 191, 99]);
  for (let y = 0; y < H; y++) {
    const by = (y & 3) * 4;
    for (let x = 0; x < W; x++) {
      const i = y * W + x, px = (x + .5 - hw) / F, py = -(y + .5 - hh) / F;
      let dx = f[0] + px * r[0] + py * u[0], dy = f[1] + px * r[1] + py * u[1], dz = f[2] + px * r[2] + py * u[2];
      const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
      let L, lamp = 0;
      const la = lightAt(G, gb, i, cam, env, sh);
      if (!la) L = skyL(env, dx, dy, dz, t);
      else {
        const dist = 1 / gb.iz[i]; surface(la[1], la[4], la[5], la[6], SB, dist / F / Math.sqrt(Math.max(.05, Math.abs(dy))));
        const hz = 1 - Math.exp(-dist / env.vis), horizon = skyL(env, dx, .02, dz, t);
        L = SB[0] * la[0] * 1.12; L = L + (horizon - L) * hz; lamp = SB[4];
      }
      // drizzle: thin streaks falling at a slight slant, one ink step off the ground they cross
      if (env.rain) { const col = x + Math.floor(y * .18), ph = h2(col, 3) * 97, q = (y + t * 70 + ph) / 19, k = Math.floor(q);
        if (q - k < .1 && h2(col, k) < .07) L += L > .55 ? -.16 : .16; }
      L = clamp(L, 0, 1); L = L < .5 ? .5 * Math.pow(2 * L, 1.35) : 1 - .5 * Math.pow(2 - 2 * L, 1.15);
      const v = L * 5, iv = v | 0, ink = v - iv > BAYER[by + (x & 3)] ? iv + 1 : iv;
      px32[i] = lamp && BAYER[by + (x & 3)] < .8 ? LAMP : pal[ink > 5 ? 5 : ink];
    }
  }
}

/* ---------- the neutral baseline ---------- */
export function printNeutral(G, gb, cam, env, sh, px32, t) {
  const { W, H } = gb, hw = W / 2, hh = H / 2, F = cam.F, { f, r, u } = cam;
  const skyC = env.wx === 'drizzle' ? [.70, .72, .74] : [.62, .72, .86];
  const g = v => Math.round(Math.pow(clamp(v, 0, 1), 1 / 1.25) * 255);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, px = (x + .5 - hw) / F, py = -(y + .5 - hh) / F;
    let dx = f[0] + px * r[0] + py * u[0], dy = f[1] + px * r[1] + py * u[1], dz = f[2] + px * r[2] + py * u[2];
    const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
    const la = lightAt(G, gb, i, cam, env, sh);
    let c;
    if (!la) { const L = skyL(env, dx, dy, dz, t); c = skyC.map(v => v * L / .75); }
    else { const dist = 1 / gb.iz[i]; surface(la[1], la[4], la[5], la[6], SB, dist / F / Math.sqrt(Math.max(.05, Math.abs(dy))));
      const hz = 1 - Math.exp(-dist / env.vis), hl = skyL(env, dx, .02, dz, t);
      c = [SB[1], SB[2], SB[3]].map((v, k) => { const lv = SB[4] ? v : v * la[0] * 1.12; return lv + (skyC[k] * hl / .75 - lv) * hz; }); }
    px32[i] = (255 << 24) | (g(c[2]) << 16) | (g(c[1]) << 8) | g(c[0]);
  }
}

/* ---------- the evidence view ---------- */
export const EV_COL = { documented: [143, 214, 148], approx: [240, 181, 74], creative: [226, 102, 79] };
export function printEvidence(G, gb, cam, env, sh, px32, t, opt = {}) {
  const { W, H } = gb, bg = [24, 28, 46];
  const status = CLAIMS.map(c => c.status), only = opt.claim ?? -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, la = lightAt(G, gb, i, cam, { ...env, dif: .35, amb: .8 }, sh);
    let c;
    if (!la) c = bg;
    else {
      const st = status[la[2]] || 'creative', base = EV_COL[st];
      const k = clamp(.38 + .62 * la[0] / 1.0, .3, 1.05);
      c = base.map(v => v * k);
      if (la[3] && ((x + y) >> 1) % 4 === 0) c = c.map(v => v * .45);           // unfinished geometry: hatched
      if (only >= 0 && la[2] !== only) c = c.map(v => v * .22 + 18);
    }
    px32[i] = (255 << 24) | (Math.round(clamp(c[2], 0, 255)) << 16) | (Math.round(clamp(c[1], 0, 255)) << 8) | Math.round(clamp(c[0], 0, 255));
  }
}
