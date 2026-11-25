/* =====================================================================
   ORANGUTAN 001 · PHOTOREAL · CITY SKIN
   ---------------------------------------------------------------------
   Baltimore as the animal's skin (MZ.Human, 2026-11-24). Everything is
   at one scale, 1 : 1500 (1 m of city = 0.67 mm of skin; a 161 m tower
   stands 10.7 cm), each thing where it stands on the map:
     buildings   MZ GROUND SURVEY Harborplace field (today + the NEW
                 Harborplace, proposed) and Jones Falls field
     streets     carry the coat (short fur); open land is bare skin
     water       the Inner Harbor (WT-1) and the Jones Falls as surveyed
                 in 1868 (buried 1911-15): bare wet skin with moving waves
     landmarks   trees; USS Constellation at Pier 1; the National Aquarium;
                 the Phoenix Shot Tower (measured); the Domino Sugars
                 refinery and sign as built in HARBOUR LIGHT
   The map is cut like a dressmaker's pattern:
     trunk   (rump to neck) the Inner Harbor up through downtown;
             unrolled around the trunk, seam down the belly, read from
             behind with north up and east right
     arms    the Jones Falls valley, shoulder (north) to wrist (south);
             left arm the west half, right arm the east half
     legs    hip (north) to ankle: west (Camden Yards side) / east
             (Harbor East to the Domino refinery)
     head    the crown, centred on the Shot Tower (azimuthal, north
             toward the face); the face itself carries no city
   Hands and feet carry none. Buildings are ray-marched onto the skin's
   own distance field, footprint vertex by footprint vertex; landmarks
   sit rigid in the skin's local frame at their anchor. All of it rides
   the nearest joints.
   ===================================================================== */

export const CITY_SCALE = 1 / 1500;
export const CITY_VERSION = 'orangutan-001 photoreal · city skin 2 · 2026-11-24';

export function createCitySkin(THREE, env, city) {
  const { BONES, LB, bPelvis, bChest, bNeck, bHead, PRIMS, sdPrim, smin, headHairy } = env;
  const S = CITY_SCALE, V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const O = city.origin_utm18n, ME = e => e - O[0], MN = n => n - O[1];
  const HPB = [0, 0, 1600, 1800], JFB = [ME(360740), MN(4349864), ME(361764), MN(4351400)];
  const covered = (x, y) => (x >= HPB[0] && x <= HPB[2] && y >= HPB[1] && y <= HPB[3]) || (x >= JFB[0] && x <= JFB[2] && y >= JFB[1] && y <= JFB[3]);

  // ---------- the pattern ----------
  const TRUNK = new Set([bPelvis, bChest, bNeck]);
  const TT = { kind: 'trunk', ec: ME(361230), v0: 0.48, v1: 1.08, n0: MN(4349250), R: 0.14 };
  const LIMB = [];
  for (const name in LB) {
    const r = LB[name], arm = r.l.kind === 'arm', west = r.l.side > 0; // the creature's left is west, read from behind
    LIMB.push({ kind: arm ? 'arm' : 'leg', r, up: r.up, lo: r.lo, side: r.l.side, R: arm ? 0.04 : 0.05, len: r.up.len + r.lo.len,
      ec: ME(arm ? (west ? 361060 : 361440) : (west ? 360735 : 361865)), n0: MN(arm ? 4351400 : 4349250) });
  }
  const limbOf = new Map(); for (const L of LIMB) { limbOf.set(L.up, L); limbOf.set(L.lo, L); }
  // head: azimuthal equidistant about the crown, centred on the Shot Tower
  const ST = city.landmarks.shot_tower.at;
  const HD = { kind: 'head', ec: ST[0], nc: ST[1], R: 0.085, phiMax: 2.0, c: V3(0, 0.098, -0.02), U: V3(0, 1, -0.18).normalize() };
  HD.F = V3(0, 0, 1).addScaledVector(HD.U, -HD.U.z).normalize(); HD.E = V3().crossVectors(HD.F, HD.U).normalize(); // north toward the face, east to the creature's right
  const _l = V3();
  function chartAt(pb, x, y, z) {
    let mx, my;
    if (TRUNK.has(pb) && y <= TT.v1) { if (y < TT.v0 - 0.02) return null; const th = Math.atan2(-x, -z); mx = TT.ec + th * TT.R / S; my = TT.n0 + (y - TT.v0) / S; }
    else if (pb === bHead || TRUNK.has(pb)) { if (!headHairy(x, y, z)) return null; _l.set(x, y, z).applyMatrix4(bHead.inv).sub(HD.c).normalize(); // the back of the head, whichever joint owns it
      const phi = Math.acos(clamp(_l.dot(HD.U), -1, 1)); if (phi > HD.phiMax) return null; const t = _l.addScaledVector(HD.U, -Math.cos(phi)), tl = t.length() || 1;
      mx = HD.ec + phi * HD.R / S * (t.dot(HD.E) / tl); my = HD.nc + phi * HD.R / S * (t.dot(HD.F) / tl); return { x: mx, y: my }; }
    else { const L = limbOf.get(pb); if (!L) return null; _l.set(x, y, z).applyMatrix4(pb.inv);
      const along = pb === L.up ? -_l.y : L.up.len - _l.y; if (along < 0.01 || along > L.len) return null;
      const th = Math.atan2(_l.x * L.side, _l.z); mx = L.ec + th * L.R / S; my = L.n0 - along / S; }
    return covered(mx, my) ? { x: mx, y: my } : null;
  }

  // ---------- streets, water, buildings: lookups in map metres ----------
  const WIDE = /PRATT|LIGHT|PRESIDENT|CONWAY|MARTIN LUTHER|M L KING|JONES FALLS|EXPRESSWAY|I-83|FALLSWAY|CHARLES|ST PAUL|CALVERT|FAYETTE|LOMBARD|ORLEANS|KEY HWY|HOWARD|GAY/;
  const CELL = 30, key = (i, j) => (i + 512) * 8192 + (j + 512);
  const grid = new Map(), segs = [];
  for (const s of city.streets) { const hw = WIDE.test(s.n || '') ? 11 : 7; for (let i = 0; i + 1 < s.c.length; i++) segs.push([s.c[i][0], s.c[i][1], s.c[i + 1][0], s.c[i + 1][1], hw]); }
  segs.forEach((g, k) => { const pad = g[4] + 6;
    for (let i = Math.floor((Math.min(g[0], g[2]) - pad) / CELL); i <= Math.floor((Math.max(g[0], g[2]) + pad) / CELL); i++) for (let j = Math.floor((Math.min(g[1], g[3]) - pad) / CELL); j <= Math.floor((Math.max(g[1], g[3]) + pad) / CELL); j++) { const kk = key(i, j); if (!grid.has(kk)) grid.set(kk, []); grid.get(kk).push(k); } });
  function streetDist(x, y) { const L = grid.get(key(Math.floor(x / CELL), Math.floor(y / CELL))); if (!L) return 99; let best = 99;
    for (const k of L) { const [ax, ay, bx, by, hw] = segs[k], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); best = Math.min(best, Math.hypot(x - ax - dx * t, y - ay - dy * t) - hw); } return best; }
  const pip = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const bbox = P => P.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [1e9, 1e9, -1e9, -1e9]);
  const inPoly = (P, B, x, y) => x >= B[0] && x <= B[2] && y >= B[1] && y <= B[3] && pip(x, y, P);
  const W = city.water, WB = bbox(W), RIV = (city.rivers || []).map(r => ({ ...r, B: bbox(r.r) }));
  const inWater = (x, y) => inPoly(W, WB, x, y);
  const inRiver = (x, y) => RIV.some(r => inPoly(r.r, r.B, x, y));
  const bgrid = new Map();
  city.buildings.forEach((b, k) => { const bb = bbox(b.tiers[0].r); b._bb = bb; for (let i = Math.floor(bb[0] / CELL); i <= Math.floor(bb[2] / CELL); i++) for (let j = Math.floor(bb[1] / CELL); j <= Math.floor(bb[3] / CELL); j++) { const kk = key(i, j); if (!bgrid.has(kk)) bgrid.set(kk, []); bgrid.get(kk).push(k); } });
  function inBuilding(x, y) { const L = bgrid.get(key(Math.floor(x / CELL), Math.floor(y / CELL))); if (!L) return false;
    for (const k of L) { const b = city.buildings[k], bb = b._bb; if (x < bb[0] || x > bb[2] || y < bb[1] || y > bb[3]) continue; for (const t of b.tiers) if (pip(x, y, t.r)) return true; } return false; }

  // ---------- map -> skin: ray-marched onto the field the skin is meshed from ----------
  const trunkPrims = PRIMS.filter(p => p.op > 0 && TRUNK.has(BONES[p.bone]));
  const headPrims = PRIMS.filter(p => p.op > 0 && p.bone === bHead.i);
  const limbPrims = new Map(LIMB.map(L => [L, PRIMS.filter(p => p.op > 0 && (p.bone === L.up.i || p.bone === L.lo.i))]));
  function field(prims, x, y, z) { let f = 1; for (const p of prims) { const b = p.box; if (x < b[0] || x > b[3] || y < b[1] || y > b[4] || z < b[2] || z > b[5]) continue; f = smin(f, sdPrim(p, x, y, z), p.k); } return f; }
  function march(prims, a, d, rmax) {
    const f = r => field(prims, a.x + d.x * r, a.y + d.y * r, a.z + d.z * r); let prev = rmax;
    if (f(rmax) < 0) return null;
    for (let r = rmax - 0.003; r > 0; r -= 0.003) { if (f(r) < 0) { let lo = r, hi = prev; for (let i = 0; i < 10; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; } return hi; } prev = r; }
    return null;
  }
  const normalAt = (prims, p) => { const e = 0.0015; return V3(field(prims, p.x + e, p.y, p.z) - field(prims, p.x - e, p.y, p.z), field(prims, p.x, p.y + e, p.z) - field(prims, p.x, p.y - e, p.z), field(prims, p.x, p.y, p.z + e) - field(prims, p.x, p.y, p.z - e)).normalize(); };
  const PIECES = [TT, ...LIMB, HD];
  const inPiece = (P, x, y) => P === TT ? (y >= TT.n0 && y <= TT.n0 + (TT.v1 - TT.v0) / S && Math.abs(x - TT.ec) <= Math.PI * TT.R / S)
    : P === HD ? Math.hypot(x - HD.ec, y - HD.nc) <= HD.phiMax * HD.R / S
    : (y <= P.n0 && y >= P.n0 - (P.len - 0.015) / S && Math.abs(x - P.ec) <= Math.PI * P.R / S);
  const piecesOf = (x, y) => PIECES.filter(P => inPiece(P, x, y)); // a point can sit on more than one piece where windows overlap
  const _R = new THREE.Matrix4();
  function surfaceAt(P, x, y) {
    if (P === TT) { const th = (x - TT.ec) * S / TT.R, yy = TT.v0 + (y - TT.n0) * S, d = V3(-Math.sin(th), 0, -Math.cos(th)), a = V3(0, yy, 0), r = march(trunkPrims, a, d, 0.34); return r == null ? null : a.addScaledVector(d, r); }
    if (P === HD) { const dE = x - HD.ec, dN = y - HD.nc, rr = Math.hypot(dE, dN), phi = rr * S / HD.R; if (phi > HD.phiMax) return null;
      const t = rr > 1e-6 ? HD.E.clone().multiplyScalar(dE / rr).addScaledVector(HD.F, dN / rr) : V3(), dl = HD.U.clone().multiplyScalar(Math.cos(phi)).addScaledVector(t, Math.sin(phi));
      const a = HD.c.clone().applyMatrix4(bHead.bind); _R.extractRotation(bHead.bind); const d = dl.applyMatrix4(_R).normalize(); const r = march(headPrims, a, d, 0.2); if (r == null) return null;
      const p = a.addScaledVector(d, r); return headHairy(p.x, p.y, p.z) ? p : null; }
    const along = (P.n0 - y) * S; if (along < 0.012 || along > P.len - 0.015) return null;
    const b = along < P.up.len ? P.up : P.lo, ly = -(b === P.up ? along : along - P.up.len), th = (x - P.ec) * S / P.R;
    const a = V3(0, ly, 0).applyMatrix4(b.bind); _R.extractRotation(b.bind); const d = V3(P.side * Math.sin(th), 0, Math.cos(th)).applyMatrix4(_R).normalize();
    const r = march(limbPrims.get(P), a, d, 0.14); return r == null ? null : a.addScaledVector(d, r);
  }
  const primsOf = P => P === TT ? trunkPrims : P === HD ? headPrims : limbPrims.get(P);
  function weightsAt(prims, p) { const ds = new Map(); for (const q of prims) ds.set(q.bone, Math.min(ds.get(q.bone) ?? 1e9, sdPrim(q, p.x, p.y, p.z)));
    const w = [...ds].map(([b, d]) => [b, Math.exp(-Math.max(0, d) / 0.02)]).sort((a, b) => b[1] - a[1]).slice(0, 4), t = w.reduce((s, a) => s + a[1], 0) || 1;
    return [0, 1, 2, 3].map(k => w[k] ? [w[k][0], w[k][1] / t] : [0, 0]); }
  // the skin's local frame at a map point: origin on the skin, normal, map-east and map-north along it
  function frameAt(P, x, y) {
    const p = surfaceAt(P, x, y); if (!p) return null; const prims = primsOf(P), n = normalAt(prims, p);
    const pe = surfaceAt(P, x + 4, y) || p.clone().add(V3(1, 0, 0)), e = pe.clone().sub(p); e.addScaledVector(n, -e.dot(n)).normalize();
    const no = V3().crossVectors(n, e).normalize(); const pn = surfaceAt(P, x, y + 4); if (pn && pn.sub(p).dot(no) < 0) no.negate();
    const wt = weightsAt(prims, p); return { P, ax: x, ay: y, cache: new Map(), p, n, e, no, si: wt.map(w => w[0]), sw: wt.map(w => w[1]) };
  }

  // ---------- geometry ----------
  const hsh = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const MASONRY = ['#7b4a3a', '#8a5a45', '#6f4336', '#9b9184', '#a9a297', '#857a6c', '#b0a796'], TOWER = ['#5f6c74', '#6d7a82', '#566069', '#8a9196'], TREE = ['#3f6b35', '#4b7a3c', '#365e2f', '#58843f'];
  function buildMesh(skeleton) {
    const G = { P: [], N: [], C: [], F: [], SI: [], SW: [], I: [] }, L = { P: [], N: [], C: [], F: [], SI: [], SW: [], I: [] }; // solid and glowing
    const c = new THREE.Color(), stats = { buildings: 0, skipped: 0, trees: 0, landmarks: [] };
    let si = [0, 0, 0, 0], sw = [1, 0, 0, 0];
    const v = (B, p, n, col, fac) => { B.P.push(p.x, p.y, p.z); B.N.push(n.x, n.y, n.z); B.C.push(col.r, col.g, col.b); B.F.push(...fac); B.SI.push(...si); B.SW.push(...sw); return B.P.length / 3 - 1; };
    const quad = (B, a, b, cc, d, n, col, fac = [-1, 0, 0]) => { const fn = b.clone().sub(a).cross(d.clone().sub(a)); const s = fn.dot(n) >= 0;
      const i0 = v(B, a, n, col, fac), i1 = v(B, b, n, col, fac), i2 = v(B, cc, n, col, fac), i3 = v(B, d, n, col, fac); if (s) B.I.push(i0, i1, i2, i0, i2, i3); else B.I.push(i0, i2, i1, i0, i3, i2); };
    // a prism from a ring of base points and an up vector, walls facing outward; roof optional
    function prism(B, lo, hi, up, col, facOf, roofTri, roofCol) {
      const ctr = hi.reduce((a, q) => a.add(q), V3()).divideScalar(hi.length);
      for (let i = 0; i < lo.length; i++) { const j = (i + 1) % lo.length, e = hi[j].clone().sub(hi[i]); const wn = e.clone().cross(up).normalize(); if (wn.dot(hi[i].clone().add(hi[j]).multiplyScalar(0.5).sub(ctr)) < 0) wn.negate();
        const [f0, f1, f2, f3] = facOf(i, j); const a = v(B, lo[i], wn, col, f0), b = v(B, lo[j], wn, col, f1), cc = v(B, hi[j], wn, col, f2), d = v(B, hi[i], wn, col, f3);
        const fn = lo[j].clone().sub(lo[i]).cross(hi[i].clone().sub(lo[i])); if (fn.dot(wn) >= 0) B.I.push(a, b, cc, a, cc, d); else B.I.push(a, cc, b, a, d, cc); }
      if (roofTri) { const ro = hi.map(q => v(B, q, up, roofCol, [-1, 0, 0])); for (const [a, b, cc] of roofTri) { const fn = hi[b].clone().sub(hi[a]).cross(hi[cc].clone().sub(hi[a])); if (fn.dot(up) >= 0) B.I.push(ro[a], ro[b], ro[cc]); else B.I.push(ro[a], ro[cc], ro[b]); } }
    }
    const fanTri = n => { const t = []; for (let i = 1; i + 1 < n; i++) t.push([0, i, i + 1]); return t; };
    const plain = () => [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]];
    // landmarks in a skin frame: local metres (east, north, up). The footprint follows the skin (each point ray-marched,
    // like the buildings); height rises along the anchor's normal so walls, masts and stacks stay straight
    const at = (fr, e, n, z) => { const k = Math.round(e * 4) + ',' + Math.round(n * 4); let b = fr.cache.get(k);
      if (b === undefined) { const q = surfaceAt(fr.P, fr.ax + e, fr.ay + n); b = q ? [q, normalAt(primsOf(fr.P), q).lerp(fr.n, 0.45).normalize()] : [fr.p.clone().addScaledVector(fr.e, e * S).addScaledVector(fr.no, n * S), fr.n]; fr.cache.set(k, b); }
      return b[0].clone().addScaledVector(b[1], z * S); }; // up leans toward the skin's own normal, so big landmarks wrap a thin limb
    function obox(B, fr, ce, cn, he, hn, z0, z1, col, kind = 0, gable = 0, yaw = 0) {
      const ca = Math.cos(yaw), sa = Math.sin(yaw), C = [[-he, -hn], [he, -hn], [he, hn], [-he, hn]].map(([a, b]) => [ce + a * ca - b * sa, cn + a * sa + b * ca]);
      const lo = C.map(([e, n]) => at(fr, e, n, z0)), hi = C.map(([e, n]) => at(fr, e, n, z1)), per = [0, 2 * he, 2 * he + 2 * hn, 4 * he + 2 * hn];
      prism(B, lo, hi, fr.n, col, i => { const len = i % 2 ? 2 * hn : 2 * he; return [[z0, per[i], kind], [z0, per[i] + len, kind], [z1, per[i] + len, kind], [z1, per[i], kind]]; }, gable ? null : [[0, 1, 2], [0, 2, 3]], col.clone().multiplyScalar(0.6));
      if (gable) { const r0 = at(fr, ce, cn - hn, z1 + gable), r1 = at(fr, ce, cn + hn, z1 + gable), rc = col.clone().multiplyScalar(0.55); // ridge north-south
        quad(B, hi[0], hi[3], r1.clone(), r0.clone(), fr.n, rc); quad(B, hi[1], hi[2], r1.clone(), r0.clone(), fr.n, rc); }
    }
    function ocyl(B, fr, ce, cn, r0, r1, z0, z1, col, seg = 16, kind = 0, cap = true) {
      const lo = [], hi = []; for (let i = 0; i < seg; i++) { const a = i / seg * Math.PI * 2; lo.push(at(fr, ce + Math.cos(a) * r0, cn + Math.sin(a) * r0, z0)); hi.push(at(fr, ce + Math.cos(a) * r1, cn + Math.sin(a) * r1, z1)); }
      const circ = 2 * Math.PI * r0; prism(B, lo, hi, fr.n, col, i => [[z0, i / seg * circ, kind], [z0, (i + 1) / seg * circ, kind], [z1, (i + 1) / seg * circ, kind], [z1, i / seg * circ, kind]], cap ? fanTri(seg) : null, col.clone().multiplyScalar(0.7));
    }
    function obar(B, fr, a, b, th, col) { // a square bar between two local points (east, north, up)
      const A = at(fr, ...a), Bp = at(fr, ...b), d = Bp.clone().sub(A).normalize(); let u = V3().crossVectors(d, fr.n); if (u.lengthSq() < 1e-6) u = fr.e.clone(); u.normalize(); const w = V3().crossVectors(d, u).normalize(), h = th * S / 2;
      const off = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => u.clone().multiplyScalar(x * h).addScaledVector(w, y * h));
      prism(B, off.map(o => A.clone().add(o)), off.map(o => Bp.clone().add(o)), d, col, plain, [[0, 1, 2], [0, 2, 3]], col);
    }
    const ICO = new THREE.IcosahedronGeometry(1, 0), IP = ICO.attributes.position;
    function tree(B, p, n, h, r, col) { // canopy (low icosahedron, a little flattened) on a short trunk, along the skin normal
      const ctr = p.clone().addScaledVector(n, (h - r * 0.9) * S); let t1 = V3().crossVectors(n, V3(0, 1, 0)); if (t1.lengthSq() < 1e-4) t1 = V3(1, 0, 0); t1.normalize(); const t2 = V3().crossVectors(n, t1);
      for (let k = 0; k < IP.count; k += 3) { const q = [0, 1, 2].map(j => ctr.clone().addScaledVector(t1, IP.getX(k + j) * r * S).addScaledVector(t2, IP.getZ(k + j) * r * S).addScaledVector(n, IP.getY(k + j) * r * 0.8 * S));
        const fn = q[1].clone().sub(q[0]).cross(q[2].clone().sub(q[0])).normalize(); const i0 = v(B, q[0], fn, col, [-1, 0, 0]), i1 = v(B, q[1], fn, col, [-1, 0, 0]), i2 = v(B, q[2], fn, col, [-1, 0, 0]); B.I.push(i0, i1, i2); }
      const tc = new THREE.Color('#4a3a2c'), u = t1.clone().multiplyScalar(0.35 * S), w = t2.clone().multiplyScalar(0.35 * S), ring = q => [q.clone().sub(u).sub(w), q.clone().add(u).sub(w), q.clone().add(u).add(w), q.clone().sub(u).add(w)];
      prism(B, ring(p), ring(ctr), n, tc, plain, null);
    }

    // buildings: conforming footprints
    city.buildings.forEach((b, bi) => {
      const r0 = b.tiers[0].r; let cx = 0, cy = 0; for (const [x, y] of r0) { cx += x; cy += y; } cx /= r0.length; cy /= r0.length;
      for (const P of piecesOf(cx, cy)) {
        const c0 = surfaceAt(P, cx, cy); if (!c0) { stats.skipped++; continue; }
        const prims = primsOf(P), n = normalAt(prims, c0), wt = weightsAt(prims, c0); si = wt.map(w => w[0]); sw = wt.map(w => w[1]);
        const tiers = []; let ok = true; for (const t of b.tiers) { const base = t.r.map(([x, y]) => surfaceAt(P, x, y)); if (base.some(q => !q)) { ok = false; break; } tiers.push([t, base]); }
        if (!ok) { stats.skipped++; continue; }
        const hue = hsh(bi * 1.37 + 0.1);
        for (const [t, base] of tiers) {
          const kind = b.k === 2 ? (t.g ? 2 : 0) : b.k; c.set(b.k === 2 ? (t.g ? '#74848e' : '#bdb5a8') : b.k === 1 ? TOWER[Math.floor(hue * TOWER.length)] : MASONRY[Math.floor(hue * MASONRY.length)]);
          const sink = t.z0 > 0 ? 0 : 0.0015, z0 = t.z0 * S, z1 = Math.max(t.z1 * S, z0 + 0.0008);
          const lo = base.map(q => q.clone().addScaledVector(n, z0 - sink)), hi = base.map(q => q.clone().addScaledVector(n, z1)), run = [0];
          for (let i = 0; i < t.r.length; i++) { const j = (i + 1) % t.r.length; run.push(run[i] + Math.hypot(t.r[j][0] - t.r[i][0], t.r[j][1] - t.r[i][1])); }
          prism(G, lo, hi, n, c, i => [[t.z0, run[i], kind], [t.z0, run[i + 1], kind], [t.z1, run[i + 1], kind], [t.z1, run[i], kind]],
            THREE.ShapeUtils.triangulateShape(t.r.map(([x, y]) => new THREE.Vector2(x, y)), []), c.clone().multiplyScalar(kind === 0 ? 0.55 : 0.7));
        }
        stats.buildings++;
      }
    });
    // trees (2024 lidar crowns)
    (city.trees || []).forEach(([x, y, h, r], k) => {
      if (inWater(x, y) || inBuilding(x, y)) return;
      for (const P of piecesOf(x, y)) { const p = surfaceAt(P, x, y); if (!p) continue; const prims = primsOf(P), n = normalAt(prims, p), wt = weightsAt(prims, p); si = wt.map(w => w[0]); sw = wt.map(w => w[1]);
        tree(G, p, n, Math.max(h, 4), clamp(r, 1.5, 7), c.set(TREE[k % TREE.length]).clone()); stats.trees++; }
    });
    const LM = city.landmarks || {};
    function landmark(name, anchor, build) { for (const P of piecesOf(anchor[0], anchor[1])) { const fr = frameAt(P, anchor[0], anchor[1]); if (!fr) continue; si = fr.si; sw = fr.sw; build(fr); stats.landmarks.push(name + ' · ' + P.kind + (P.side ? (P.side > 0 ? ' L' : ' R') : '')); } }
    const dark = () => c.set('#2a2420').clone();
    // USS Constellation, afloat at Pier 1
    if (LM.constellation) { const K = LM.constellation, h = K.hull, ce = h.reduce((a, p) => [a[0] + p[0] / h.length, a[1] + p[1] / h.length], [0, 0]);
      landmark('USS Constellation', ce, fr => {
        const loc = ([x, y]) => [x - ce[0], y - ce[1]], deck = THREE.ShapeUtils.triangulateShape(h.map(p => new THREE.Vector2(...loc(p))), []);
        for (const Ly of K.layers) { const col = c.set(Ly.k === 'stripe' ? '#d9d4c6' : '#17181b').clone();
          prism(G, h.map(p => at(fr, ...loc(p), Ly.z0)), h.map(p => at(fr, ...loc(p), Ly.z1)), fr.n, col, plain, Ly.z1 >= 6.9 ? deck : null, c.set('#6b5a44').clone()); }
        for (const m of K.masts) ocyl(G, fr, ...loc(m.at), 0.7, 0.35, 6.9, m.top, dark(), 6, 0, false);
        for (const y of K.yards) obar(G, fr, [...loc(y.a), y.z], [...loc(y.b), y.z], 0.55, dark());
        obar(G, fr, [...loc(K.bowsprit.a), K.bowsprit.za], [...loc(K.bowsprit.b), K.bowsprit.zb], 0.6, dark());
      }); }
    // Phoenix Shot Tower (1828), measured: tapering brick shaft, cornice and battlements
    if (LM.shot_tower) { const T = LM.shot_tower, rb = T.base_d / 2, rt = T.top_d / 2, shaft = T.height - 4.2;
      landmark('Phoenix Shot Tower', T.at, fr => {
        const brick = c.set('#8a4b37').clone(); ocyl(G, fr, 0, 0, rb, rt, 0, shaft, brick, 24, 0, true); ocyl(G, fr, 0, 0, rt + 0.45, rt + 0.45, shaft - 1.2, shaft, brick.clone().multiplyScalar(0.9), 24, 0, true);
        for (let i = 0; i < T.battlements; i++) { const a = i / T.battlements * Math.PI * 2; obox(G, fr, Math.cos(a) * (rt + 0.1), Math.sin(a) * (rt + 0.1), 0.7, 0.55, shaft, T.height, brick, 0, 0, a); }
      }); }
    // National Aquarium: the lidar height grid as columns (glass where it rises into the pyramids)
    if (LM.aquarium) { const A = LM.aquarium, cs = A.cells, ce = cs.reduce((a, p) => [a[0] + p[0] / cs.length, a[1] + p[1] / cs.length], [0, 0]);
      landmark('National Aquarium', ce, fr => { for (const [x, y, hh] of cs) obox(G, fr, x - ce[0], y - ce[1], A.cell / 2, A.cell / 2, 0, hh, c.set(hh > 20 ? '#6f8d99' : '#b7b1a6').clone(), hh > 20 ? 2 : 0); }); }
    // Domino Sugars: refinery, stacks, wharf (HARBOUR LIGHT) and the sign's steel lattice; the neon glows
    if (LM.domino) { const D = LM.domino, ce = D.boxes[0].c;
      landmark('Domino Sugars', ce, fr => {
        for (const b of D.boxes) obox(G, fr, b.c[0] - ce[0], b.c[1] - ce[1], b.he, b.hn, b.z0, b.z1, c.set(b.n === 'wharf' ? '#7a756c' : b.n === 'roof house' ? '#8d867b' : '#a79c8b').clone(), 0, b.gable);
        for (const s of D.stacks) ocyl(G, fr, s.c[0] - ce[0], s.c[1] - ce[1], s.r, s.r * 0.85, s.z0, s.z1, c.set('#5d5650').clone(), 12);
        const sg = D.sign, sx = sg.c[0] - ce[0], sy = sg.c[1] - ce[1], hw = sg.w / 2, steel = c.set('#3a3734').clone();
        for (const e of [-hw, -hw / 3, hw / 3, hw]) obar(G, fr, [sx + e, sy, 40], [sx + e, sy, sg.z1], 0.7, steel);
        for (const z of [sg.z0, (sg.z0 + sg.z1) / 2, sg.z1]) obar(G, fr, [sx - hw, sy, z], [sx + hw, sy, z], 0.6, steel);
        // neon on the harbour face: two rows of glowing tubes (abstract strokes; the lettering itself is not reproduced)
        const neon = c.set('#ff5a1e').clone(), rows = [[sg.z0 + 12.2, sg.z1 - 1.2, 6], [sg.z0 + 1.0, sg.z0 + 9.2, 6]];
        rows.forEach(([z0, z1, n], ri) => { for (let i = 0; i < n; i++) { const e0 = sx - hw + 2 + i * (sg.w - 4) / n, e1 = e0 + (sg.w - 4) / n - 1.6, q = hsh(i * 7 + ri * 13), y = sy + 0.8;
          obar(L, fr, [e0, y, z0], [e0, y, z1], 0.55, neon); obar(L, fr, [e1, y, z0 + (z1 - z0) * q * 0.4], [e1, y, z1], 0.55, neon);
          obar(L, fr, [e0, y, z1], [e1, y, z1 - (z1 - z0) * 0.25 * q], 0.55, neon); obar(L, fr, [e0, y, z0 + (z1 - z0) * (0.3 + 0.3 * q)], [e1, y, z0], 0.55, neon); } });
      }); }

    const mk = (B, mat, name) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(B.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(B.C, 3));
      g.setAttribute('fac', new THREE.Float32BufferAttribute(B.F, 3)); g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(B.SI, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(B.SW, 4));
      g.setIndex(B.P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(B.I, 1) : new THREE.Uint16BufferAttribute(B.I, 1)); g.computeBoundingSphere();
      const m = new THREE.SkinnedMesh(g, mat); m.name = name; m.castShadow = m.receiveShadow = true; m.frustumCulled = false; m.bind(skeleton, new THREE.Matrix4()); return m;
    };
    const solid = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, specularIntensity: 0.5 });
    solid.onBeforeCompile = sh => { // facades: floors and window bays drawn from real metres, faded where they'd shimmer
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 fac; varying vec3 vFac;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFac = fac;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vFac;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float wall = step(0.0, vFac.x), fl = fract(vFac.x / 3.6), bay = fract(vFac.y / 3.2);
          float win = wall * step(0.32, fl) * step(fl, 0.86) * step(0.2, bay) * step(bay, 0.8);
          win = max(win, step(0.5, vFac.z) * wall * step(0.1, fl));
          win = mix(win, wall * mix(0.35, 0.75, step(0.5, vFac.z)), smoothstep(0.25, 0.7, fwidth(vFac.x / 3.6)));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.035, 0.042, 0.05), win * 0.8);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.14, win);');
    };
    solid.customProgramCacheKey = () => 'orangutan-city-2';
    const glowMat = new THREE.MeshStandardMaterial({ color: '#ff6a2a', emissive: '#ff4410', emissiveIntensity: 4, roughness: 0.4 });
    const mesh = mk(G, solid, 'city · Baltimore'), glow = L.P.length ? mk(L, glowMat, 'city · neon') : null; if (glow) glow.castShadow = false;
    return { mesh, glow, stats: Object.assign(stats, { tris: G.I.length / 3 + L.I.length / 3 }) };
  }

  return { chartAt, streetDist, inWater, inRiver, inBuilding, buildMesh, scale: S, version: CITY_VERSION };
}
