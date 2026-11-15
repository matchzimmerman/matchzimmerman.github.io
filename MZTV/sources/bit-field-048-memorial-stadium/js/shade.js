/* MZ WORLD · MEMORIAL STADIUM · BIT FIELD 048 · printers
   One lighting model, three ways of printing it:
     ink       HARBOUR LIGHT v3 language: luminance → six inks through a 4×4 Bayer matrix,
               low internal resolution (default 320×180), pixel-sharp upscale, haze toward the
               horizon tone. Ported from BIT FIELD 046/047 (same BAYER table, same ink rule).
     neutral   the same frame in plain colour at 960×540, no dither: the baseline to judge the print against.
     evidence  every surface coloured by the status of its claim; unfinished geometry hatched.      */
import { MAT, DIM } from './geometry.js';
import { CLAIMS, INSCRIPTION } from './evidence.js';

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

/* ---------- a 5×7 bitmap face for the façade lettering (not the original letterforms: see claim 22) ---------- */
const GLYPH = {
  A:'01110100011000111111100011000110001', B:'11110100011000111110100011000111110', C:'01110100011000010000100001000101110',
  D:'11110100011000110001100011000111110', E:'11111100001000011110100001000011111', F:'11111100001000011110100001000010000',
  G:'01110100011000010111100011000101111', H:'10001100011000111111100011000110001', I:'01110001000010000100001000010001110',
  J:'00111000100001000010000101001001100', K:'10001100101010011000101001001010001', L:'10000100001000010000100001000011111',
  M:'10001110111010110101100011000110001', N:'10001100011100110101100111000110001', O:'01110100011000110001100011000101110',
  P:'11110100011000111110100001000010000', Q:'01110100011000110001101011001001101', R:'11110100011000111110101001001010001',
  S:'01111100001000001110000010000111110', T:'11111001000010000100001000010000100', U:'10001100011000110001100011000101110',
  V:'10001100011000110001100010101000100', W:'10001100011000110101101011010101010', X:'10001100010101000100010101000110001',
  Y:'10001100010101000100001000010000100', Z:'11111000010001000100010001000011111',
  '1':'00100011000010000100001000010001110', '4':'00010001100101010010111110001000010', '5':'11111100001111000001000011000101110', '9':'01110100011000101111000010001001100'
};
const GDENS = Object.fromEntries(Object.entries(GLYPH).map(([k, v]) => [k, v.split('').filter(c => c === '1').length / 42]));
/* coverage of one centred line of bitmap text (cap height h, centre cx/cy) at (x, y) */
function textCover(str, cx, cy, h, x, y, fp) {
  const u = h / 7; if (Math.abs(y - cy) > h / 2 + fp) return 0;
  const n = str.length, adv = 6 * u, w = n * adv - u, x0 = cx - w / 2;
  if (x < x0 - fp || x > x0 + w + fp) return 0;
  const ci = Math.floor((x - x0) / adv); if (ci < 0 || ci >= n) return 0;
  const ch = str[ci], g = GLYPH[ch]; if (!g) return 0;
  if (fp > u * .8) return Math.min(1, GDENS[ch] * 1.15);
  const col = Math.floor((x - x0 - ci * adv) / u), row = Math.floor((cy + h / 2 - y) / u);
  return col < 0 || col > 4 || row < 0 || row > 6 ? 0 : g[row * 5 + col] === '1' ? 1 : 0;
}
const CORNER = { x: 18.6, y: .95, w: 1.8, h: 1.0 };   // 1954 cornerstone (claim 28, position assumed)
/* late-1950s car paints (generic): black, white, turquoise, coral, sea green, cream, navy, red, two-tone grey */
const PAINT = [[.2, .2, .2], [.06, .06, .07], [.86, .86, .84], [.35, .66, .66], [.82, .48, .42], [.48, .64, .52], [.86, .80, .64], [.14, .18, .34], [.58, .14, .13], [.62, .63, .64]];
/* coverage (0..1) of the dedication letters at façade point (x, y) for a pixel of footprint fp metres */
export function facadeTextAt(x, y, fp = .02) {
  for (const L of INSCRIPTION) {
    const h = L.size, u = h / 7;
    if (Math.abs(y - L.y) > h / 2 + fp) continue;
    const n = L.t.length, adv = 6 * u, w = n * adv - u, x0 = -w / 2;
    if (x < x0 - fp || x > x0 + w + fp) return 0;
    const ci = Math.floor((x - x0) / adv); if (ci < 0 || ci >= n) return 0;
    const ch = L.t[ci]; if (ch === ' ') return 0;
    const g = GLYPH[ch]; if (!g) return 0;
    if (fp > u * .8) return Math.min(1, GDENS[ch] * 1.15);       // too small to resolve: average tone
    const col = Math.floor((x - x0 - ci * adv) / u), row = Math.floor((L.y + h / 2 - y) / u);
    if (col < 0 || col > 4 || row < 0 || row > 6) return 0;
    return g[row * 5 + col] === '1' ? 1 : 0;
  }
  return 0;
}

/* dugout openings in the field wall, between home and the bases (claim 25, position assumed) */
export function dugoutAt(x, y, z) {
  if (y > 2.15 || z > DIM.pole) return false;
  const th = Math.abs(Math.atan2(x, -(z - DIM.cz))) * 180 / Math.PI, rr = Math.hypot(x, z - DIM.cz);
  return rr < DIM.R0 + .5 && th > 58 && th < 73;
}
/* the claim a pixel rests on: geometry claim, refined on the playing surface */
export function claimAt(G, gb, i) {
  const id = gb.id[i]; if (id < 0) return 0;
  if (id >= G.n) return G.lines[id - G.n][7];
  if (G.mat[id] === MAT.FACADE_FACE) { const x = gb.wx[i], y = gb.wy[i];
    if (Math.abs(x - CORNER.x) < CORNER.w / 2 && Math.abs(y - CORNER.y) < CORNER.h / 2) return CLAIMS.find(c => c.key === 'cornerstone').id;
    return facadeTextAt(x, y, .05) > 0 ? CLAIMS.find(c => c.key === 'inscription').id : G.claim[id]; }
  if (G.mat[id] === MAT.WALL && dugoutAt(gb.wx[i], gb.wy[i], gb.wz[i])) return CLAIMS.find(c => c.key === 'dugouts').id;
  if (G.mat[id] === MAT.CLOCK) return CLAIMS.find(c => c.key === 'clockface').id;
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
  [MAT.FASCIA]: [.62, .66, .65, .60], [MAT.EXTERIOR]: [.27, .44, .26, .20], [MAT.SCOREBOARD]: [.18, .20, .22, .20],
  [MAT.SB_FACE]: [.10, .10, .12, .11], [MAT.POST]: [.86, .88, .88, .84], [MAT.HOUSE]: [.30, .45, .27, .22],
  [MAT.ROOF]: [.20, .22, .21, .22], [MAT.TREE]: [.22, .26, .23, .20], [MAT.FENCE]: [.30, .32, .33, .33],
  [MAT.PRESSBOX]: [.50, .54, .54, .52], [MAT.CLOCK]: [.85, .88, .87, .82],
  [MAT.FACADE]: [.50, .55, .54, .50], [MAT.FACADE_FACE]: [.50, .55, .54, .50], [MAT.ROAD]: [.15, .17, .17, .18], [MAT.PAVING]: [.40, .43, .42, .39], [MAT.GRASS]: [.24, .27, .29, .18],
  [MAT.CAR]: [.3, .3, .3, .3], [MAT.STONE]: [.46, .50, .49, .45], [MAT.PORCH]: [.80, .84, .83, .79], [MAT.LAMP]: [.22, .24, .25, .26]
};
const COATS = [[.10, .11, .16], [.16, .13, .11], [.22, .22, .23], [.07, .07, .08], [.28, .22, .16], [.12, .16, .26], [.34, .33, .31], [.40, .14, .12]];
const FACE = [[.62, .48, .40], [.50, .37, .30], [.30, .22, .18], [.24, .24, .26], [.70, .70, .66]];

export function makeEnv(opt) {
  const wx = opt.wx === 'clear' ? 'clear' : 'drizzle', hour = opt.hour ?? 15 + 10 / 60;
  const s = opt.sun, sd = [Math.sin(s.az) * Math.cos(s.el), Math.sin(s.el), Math.cos(s.az) * Math.cos(s.el)];
  return wx === 'drizzle'
    ? { wx, hour, wet: 1, sunDir: sd, amb: 1.0, dif: .10, vis: 1400, skyBase: .66, skyTop: .2, glow: .08, rain: 1, inks: INKS.drizzle }
    : { wx, hour, wet: .25, sunDir: sd, amb: .55, dif: .95, vis: 14000, skyBase: .62, skyTop: .1, glow: .32, rain: 0, inks: INKS.clear };
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
function surface(mat, x, y, z, out, fp = .02, t = 0, env = null, vari = 0) {
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
    const sid = seat * 7 + (mat === MAT.CROWD_U ? 1e5 : 0), rid = rowI * 13 + (wing ? 5e4 * Math.sign(x) : 0);
    // people shift now and then: a few seats change pose every ~3 s (only the ink loop animates)
    const shift = h2(sid + 3, rid + Math.floor(t / 3 + h2(sid, rid) * 3)) < .04 ? .23 : 0;
    const hsh = (h2(sid, rid) + shift) % 1, ox = shift ? .12 : 0;
    const coat = COATS[Math.floor(hsh * COATS.length)];
    // metric seat-cell coordinates: across (0.5 m seat) and front-to-back (one tread)
    const hxm = (fu - .5 - ox) * .5, hym = (fv - .66) * tread;
    // which way do they face? everyone faces the field: seen from behind we get hair and hats, from the front faces
    const cp = env && env.camPos, fx = wing ? -Math.sign(x) : -dx / (rr || 1), fz = wing ? 0 : -dz / (rr || 1);
    const behind = cp ? ((x - cp[0]) * fx + (z - cp[2]) * fz) > 0 : false;
    const headR = .105, d2 = hxm * hxm + hym * hym;
    const hatT = h2(sid + 11, rid), hatted = hatT < .42;                    // fedoras and caps, 1959
    const head = d2 < headR * headR && y > 0;
    const brim = hatted && d2 < .165 * .165 && (behind || hym > -.02);
    const body = Math.abs(hxm) < .23 && hym < -.03 && hym > -.3;           // shoulders and coat
    const collar = body && hym > -.11 && Math.abs(hxm) < .12 && h2(sid + 5, rid) < .3;
    let c = body ? coat : coat.map(v => v * .55);                           // between people: shadowed coats and bench
    if (collar) c = [[.56, .12, .1], [.78, .74, .6], [.18, .26, .46], [.85, .85, .82]][Math.floor(h2(sid + 7, rid) * 4)];
    if (brim) c = h2(sid + 13, rid) < .82 ? [.09, .08, .08] : [.42, .38, .32];
    else if (head) c = behind ? [[.1, .08, .07], [.2, .14, .1], [.32, .28, .25], [.05, .05, .05], [.5, .48, .45]][Math.floor(h2(seat, rowI + 79) * 5)]
                              : FACE[Math.floor(h2(seat, rowI + 77) * FACE.length)];
    const hat = brim;
    out[1] = c[0]; out[2] = c[1]; out[3] = c[2]; out[0] = Math.min(head && !hat ? .34 : 1, c[0] * .3 + c[1] * .59 + c[2] * .11); // faces stay inside the crowd's tone in print
  } else if (mat === MAT.SB_FACE) {
    // structure: a frame of dark bands dividing the face into zones (layout assumed), then lamp cells.
    // No text and no score are drawn: the face makes no claim about what was displayed.
    const fx0 = x - DIM.sbX, zoneLine = Math.abs(((fx0 + 14) % 4.6 + 4.6) % 4.6) < .18 || Math.abs(y - 13.2) < .2 || Math.abs(y - 9.4) < .2;
    if (zoneLine) { out[0] = .04; out[1] = out[2] = out[3] = .05; return out; }
    const cx = Math.floor((x + 40) / .55), cy = Math.floor(y / .55), lit = h2(Math.floor(cx / 3), Math.floor(cy / 4)) > .62 && h2(cx, cy) > .25;
    const fx = (x + 40) / .55 - cx, fy = y / .55 - cy, bulb = (fx - .5) ** 2 + (fy - .5) ** 2 < .1;
    if (bulb) { out[0] = lit ? .9 : .2; out[1] = lit ? 1 : .2; out[2] = lit ? .78 : .2; out[3] = lit ? .42 : .2; out[4] = lit ? 1 : 0; }
  } else if (mat === MAT.CLOCK) {
    // the Longines clock, hands at the scene time (claim 27)
    const cx = x - DIM.sbX, cy = y - (DIM.sbH - 2.6 + 1.3), r = Math.hypot(cx, cy), ang = Math.atan2(cx, cy);
    const hr = env ? env.hour : 15.17, aH = ((hr % 12) / 12) * 2 * Math.PI, aM = ((hr % 1)) * 2 * Math.PI;
    const near = (a, len, w) => { const px = Math.sin(a), py = Math.cos(a), along = cx * px + cy * py, across = Math.abs(cx * py - cy * px); return along > -.1 && along < len && across < w; };
    const tick = r > 1.75 && r < 2.0 && Math.abs(((ang / (Math.PI / 6)) % 1 + 1) % 1 - .5) > .42;
    if (near(aH, 1.1, .11) || near(aM, 1.65, .07) || tick || r > 2.0) { out[0] = .08; out[1] = out[2] = out[3] = .09; }
  } else if (mat === MAT.CAR) {
    const c = PAINT[vari % PAINT.length] || PAINT[0], glass = y > 1.04 && y < 1.42;
    const cc = glass ? [.16, .18, .2] : c; out[1] = cc[0]; out[2] = cc[1]; out[3] = cc[2]; out[0] = cc[0] * .3 + cc[1] * .59 + cc[2] * .11;
    if (y < .55) { out[0] *= .55; out[1] *= .55; out[2] *= .55; out[3] *= .55; }   // bumper shadow, wheel wells
  } else if (mat === MAT.STONE) {
    // Gothic stone: tall window slits in bays, darker string courses
    const bay = ((x * .25 + z * .25) % 1 + 1) % 1, fl = (y - DIM.cityCollege.hill) % 4.2;
    const win = bay > .62 && bay < .82 && fl > 1.1 && fl < 3.6 && y > DIM.cityCollege.hill + 1;
    if (win) { out[0] = .1; out[1] = .1; out[2] = .11; out[3] = .13; } else { const n = (vn(x * .3 + z * .3, y * .5) - .5) * .06; out[0] += n; out[1] += n; out[2] += n; out[3] += n; }
  } else if (mat === MAT.HOUSE) {
    const along = Math.abs(((x % 5.5) + 5.5) % 5.5), fl = Math.floor(y / 3.2), fy = y - fl * 3.2;
    const n = (vn(x * .7 + z * .7, y * .9) - .5) * .05; out[0] += n; out[1] += n; out[2] += n; out[3] += n;
    if (vari === 2 && y > 3.6) {   // Ednor Gardens Tudor: stucco with dark half-timbering
      const tim = Math.abs(((x % 1.1) + 1.1) % 1.1 - .55) < .07 || Math.abs(y - 3.7) < .08 || Math.abs(((y - 3.6 + Math.abs(((x % 2.2) + 2.2) % 2.2 - 1.1)) % 2.4) - 1.2) < .06;
      if (tim) { out[0] = .12; out[1] = .14; out[2] = .11; out[3] = .09; } else { out[0] = .62; out[1] = .68; out[2] = .64; out[3] = .55; }
    } else if (vari === 1 && y > 6.7 && y < 7.2) { out[0] = .62; out[1] = .66; out[2] = .64; out[3] = .6; }   // stone trim / cornice (S22)
    const win = fl < 2 && fy > 1.0 && fy < 2.4 && ((along > .8 && along < 2.0) || (along > 3.2 && along < 4.4));
    const door = fl === 0 && fy < 2.3 && along > 4.6 && along < 5.3;
    if (win || door) { out[0] = door ? .1 : .16; out[1] = door ? .12 : .17; out[2] = door ? .1 : .18; out[3] = door ? .09 : .2; }
  } else if (mat === MAT.FACADE_FACE) {
    // weathered concrete panel; city seal (a plain disc: the seal's artwork is not drawn); entrance gates; stainless letters
    const n = vn(x * .4, y * .25) * .07; let L = .50 + n, r = .55 + n, g = .54 + n, b = .50 + n;
    const sx = x, sy = y - DIM.facade.sealY, sr = Math.hypot(sx, sy);
    if (sr < 2.7) { const ring = sr > 2.25; L = ring ? .78 : .36; r = ring ? .82 : .45; g = ring ? .82 : .38; b = ring ? .80 : .28; }
    const joint = Math.max(cover(((y % 3.05) + 3.05) % 3.05 < 1.525 ? ((y % 3.05) + 3.05) % 3.05 : 3.05 - ((y % 3.05) + 3.05) % 3.05, .015, fp), cover(((x % 4.4) + 4.4) % 4.4 < 2.2 ? ((x % 4.4) + 4.4) % 4.4 : 4.4 - ((x % 4.4) + 4.4) % 4.4, .015, fp)) * .7;
    if (joint > 0) { L -= .16 * joint; r -= .16 * joint; g -= .16 * joint; b -= .16 * joint; }      // concrete panel joints (pattern assumed)
    const pitch = 5.6, gi = Math.round(x / pitch), gx = x - gi * pitch;
    if (y < 4.6 && Math.abs(gi) <= 3 && Math.abs(gx) < 1.6) {                                         // gates with iron grilles (rhythm invented)
      const bar = cover(((gx % .22) + .22) % .22 - .11, .02, fp), rail = cover(y - 2.3, .03, fp);
      const k = Math.max(bar, rail); L = .05 + .25 * k; r = g = b = .05 + .25 * k;
    } else if (y >= 4.6 && y < 5.1 && Math.abs(x) < 20) { L = .62; r = .66; g = .66; b = .63; }      // lintel band
    if (Math.abs(x - CORNER.x) < CORNER.w / 2 && Math.abs(y - CORNER.y) < CORNER.h / 2) {             // 1954 cornerstone
      L = .66; r = .7; g = .69; b = .64; const ct = textCover('1954', CORNER.x, CORNER.y, .32, x, y, fp); if (ct) { L -= .3 * ct; r -= .3 * ct; g -= .3 * ct; b -= .3 * ct; } }
    const sh = facadeTextAt(x - .06, y + .09, fp) * .5;                                                // letters stand off the wall: a soft shadow
    if (sh > 0) { L -= .14 * sh; r -= .14 * sh; g -= .14 * sh; b -= .14 * sh; }
    const t = facadeTextAt(x, y, fp);
    if (t > 0) { L += (.86 - L) * t; r += (.88 - r) * t; g += (.89 - g) * t; b += (.90 - b) * t; }
    out[0] = L; out[1] = r; out[2] = g; out[3] = b;
  } else if (mat === MAT.EXTERIOR) {
    // reddish-brown brick (S03, S19) with invented concrete bands, vents and ground portals
    const dx = x, dz = z - DIM.cz, rr = Math.hypot(dx, dz), arc = Math.atan2(dx, -dz) * rr, deg = Math.atan2(dx, -dz) * 180 / Math.PI;
    const course = Math.floor(y / .075), bv = (h2(course, Math.floor(arc / .2 + (course & 1) * .5)) - .5) * .06 + (vn(arc * .05, y * .08) - .5) * .06;
    let L = .27 + bv, r = .44 + bv, g = .26 + bv * .8, b = .20 + bv * .6;
    // mortar: drawn when a pixel can resolve it, otherwise blended in as an average lightening
    const mBed = cover((y % .075) - .0375 > 0 ? .075 - (y % .075) : y % .075, .006, fp), mHead = cover(((arc / .2 + (course & 1) * .5) % 1) * .2, .005, fp) * .6;
    const m = Math.max(mBed, mHead); if (m > 0) { L += (.5 - L) * m; r += (.55 - r) * m; g += (.52 - g) * m; b += (.47 - b) * m; }
    if (y < 1.1) { const k = .78 + .2 * y / 1.1; L *= k; r *= k; g *= k; b *= k; }   // splash and grime at the foot of the wall
    const band = (y > 16.6 && y < 17.9) || y > DIM.upTopY + .2;
    const vent = ((y > 9.2 && y < 10.5) || (y > 24.6 && y < 25.9)) && Math.abs(((arc % 4.5) + 4.5) % 4.5 - 2.25) < .55;
    const portal = y < 3.9 && Math.abs(((deg % 12) + 12) % 12 - 6) * rr * Math.PI / 180 < 1.9 && rr > DIM.upBackR - 2;
    if (band) { L = .55; r = .59; g = .58; b = .54; }
    if (vent) { L = .09; r = .09; g = .08; b = .08; }
    if (portal) { L = .05; r = g = b = .05; }
    out[0] = L; out[1] = r; out[2] = g; out[3] = b;
  } else if (mat === MAT.WALL && dugoutAt(x, y, z)) {
    out[0] = y > 1.85 ? .5 : .05; out[1] = out[2] = out[3] = out[0];
  } else if (mat === MAT.ROAD || mat === MAT.PAVING || mat === MAT.GRASS) {
    const n = (vn(x * .3, z * .3) - .5) * .05; out[0] += n; out[1] += n; out[2] += n; out[3] += n;
  } else if (mat === MAT.CONCRETE || mat === MAT.WALL || mat === MAT.FACADE) {
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
  const vx = cam.pos[0] - x, vy = cam.pos[1] - y, vz = cam.pos[2] - z, vl = Math.hypot(vx, vy, vz) || 1;
  const ndv = Math.abs(nx * vx + ny * vy + nz * vz) / vl;
  const foot = Math.abs(ny) < .3 && y < 1.4 ? .7 + .3 * y / 1.4 : 1;      // contact shadow where walls meet the ground
  return [(env.amb * ao * skyV + env.dif * ndl * lit) * foot, mat, claim, unf, x, y, z, ndv, ny, isLine ? 0 : (G.vari ? G.vari[id] : 0)];
}

const SB = [0, 0, 0, 0, 0];
/* how wet and mirror-like a horizontal surface is in drizzle (assumed values) */
const WETK = { [MAT.ROAD]: .55, [MAT.PAVING]: .4, [MAT.CONCRETE]: .3, [MAT.CAR]: .5, [MAT.ROOF]: .2, [MAT.FIELD]: .1, [MAT.GRASS]: .06, [MAT.PORCH]: .2 };
function wetSheen(env, la, dx, dy, dz, t) {
  const k = WETK[la[1]]; if (!k || !env.wet || la[8] < .6) return null;
  const fres = .04 + .96 * Math.pow(1 - Math.min(1, la[7]), 5), w = k * env.wet * Math.min(1, fres * 2.2);
  return w > .01 ? [w, skyL(env, dx, Math.abs(dy), dz, t)] : null;
}
/* ---------- the ink print (HARBOUR LIGHT) ---------- */
export function printInk(G, gb, cam, env, sh, px32, t) {
  env.camPos = cam.pos;
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
        const dist = 1 / gb.iz[i]; surface(la[1], la[4], la[5], la[6], SB, dist / F / Math.sqrt(Math.max(.05, la[7])), t, env, la[9]);   // pixel footprint on the surface
        const hz = 1 - Math.exp(-dist / env.vis), horizon = skyL(env, dx, .02, dz, t);
        L = SB[0] * la[0] * 1.12 * (env.wet && la[8] > .6 && WETK[la[1]] ? 1 - .12 * env.wet : 1);
        const ws = wetSheen(env, la, dx, dy, dz, t); if (ws) L += (ws[1] - L) * ws[0];
        L = L + (horizon - L) * hz; lamp = SB[4];
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
  env.camPos = cam.pos;
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
    else { const dist = 1 / gb.iz[i]; surface(la[1], la[4], la[5], la[6], SB, dist / F / Math.sqrt(Math.max(.05, la[7])), t, env, la[9]);   // pixel footprint on the surface
      const hz = 1 - Math.exp(-dist / env.vis), hl = skyL(env, dx, .02, dz, t), ws = wetSheen(env, la, dx, dy, dz, t);
      const dark = env.wet && la[8] > .6 && WETK[la[1]] ? 1 - .12 * env.wet : 1;
      c = [SB[1], SB[2], SB[3]].map((v, k) => { let lv = SB[4] ? v : v * la[0] * 1.12 * dark; if (ws) lv += (skyC[k] * ws[1] / .75 - lv) * ws[0]; return lv + (skyC[k] * hl / .75 - lv) * hz; }); }
    if (env.rain) { const col = Math.floor((x + Math.floor(y * .18)) / 3), q = (y / 3 + t * 70 + h2(col, 3) * 97) / 19, k = Math.floor(q);
      if (q - k < .08 && h2(col, k) < .05) c = c.map(v => v + (.82 - v) * .18); }                        // faint drizzle
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
