/* =====================================================================
   ORANGUTAN 001 · PHOTOREAL · CITY SKIN
   ---------------------------------------------------------------------
   Baltimore as the animal's skin (MZ.Human, 2026-11-24): the buildings
   of the MZ GROUND SURVEY Harborplace field (today's city + the NEW
   Harborplace, 2024 design on the Jan 2026 footprints, proposed) and the
   Jones Falls field, each standing where it stands on the map, at true
   relative height. Hair grows only from the streets. The harbour reads
   as bare wet skin. Head, face, hands and feet are untouched.

   The map is cut like a dressmaker's pattern, one scale everywhere
   (1 : 1500, so 1 m of city = 0.67 mm of skin; a 161 m tower stands
   10.7 cm off the back):
     trunk   the core: the Inner Harbor's north shore, the new Harborplace, downtown
             (unrolled around the trunk; seam down the belly, north up,
             read from behind with east to the right)
     arms    the Jones Falls valley, shoulder (north) to wrist (south):
             left arm the west half, right arm the east half
     thighs  the land either side of the harbour, hip (north) to knee: west (Camden Yards, Ridgely's
             Delight), east (Harbor East)
   Each building is ray-marched onto the actual skin surface (the same
   signed-distance field the skin is meshed from), stands along the
   skin's normal at its centroid, and rides its nearest joints rigidly.
   ===================================================================== */

export const CITY_SCALE = 1 / 1500;
export const CITY_VERSION = 'orangutan-001 photoreal · city skin 1 · 2026-11-24';

export function createCitySkin(THREE, env, city) {
  const { BONES, LB, bPelvis, bChest, bNeck, PRIMS, sdPrim, smin, smax } = env;
  const S = CITY_SCALE, V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const O = city.origin_utm18n, ME = e => e - O[0], MN = n => n - O[1];
  const RT = 0.14, RA = 0.04, RL = 0.05; // chart radii (m): trunk, arm, leg
  const HP = [0, 0, 1600, 1800], JF = [ME(360740), MN(4349864), ME(361764), MN(4351400)];
  const covered = (x, y) => (x >= HP[0] && x <= HP[2] && y >= HP[1] && y <= HP[3]) || (x >= JF[0] && x <= JF[2] && y >= JF[1] && y <= JF[3]);

  // ---------- the pattern ----------
  const TRUNK = new Set([bPelvis, bChest, bNeck]);
  const TT = { kind: 'trunk', ec: ME(361230), v0: 0.67, v1: 1.08, n0: MN(4349585), R: RT }; // starts above the rump (which keeps its coat); the Pratt St shore runs across the small of the back
  const LIMB = []; // per limb: its two segment bones, side, chart radius, where its map window sits
  for (const name in LB) {
    const r = LB[name], arm = r.l.kind === 'arm', west = r.l.side > 0; // the creature's left is west, read from behind
    LIMB.push({ kind: arm ? 'arm' : 'leg', r, up: r.up, lo: r.lo, side: r.l.side, R: arm ? RA : RL, len: r.up.len + r.lo.len,
      ec: ME(arm ? (west ? 361060 : 361440) : (west ? 360735 : 361865)), n0: MN(arm ? 4351400 : 4349585) });
  }
  const limbOf = new Map(); for (const L of LIMB) { limbOf.set(L.up, L); limbOf.set(L.lo, L); }
  const _l = V3();
  // skin point (rest pose) -> map metres, or null where the skin carries no city
  function chartAt(pb, x, y, z) {
    let mx, my;
    if (TRUNK.has(pb)) { if (y < TT.v0 - 0.02 || y > TT.v1) return null; const th = Math.atan2(-x, -z); mx = TT.ec + th * TT.R / S; my = TT.n0 + (y - TT.v0) / S; }
    else { const L = limbOf.get(pb); if (!L) return null; _l.set(x, y, z).applyMatrix4(pb.inv);
      const along = pb === L.up ? -_l.y : L.up.len - _l.y; if (along < 0.01 || along > L.len) return null;
      const th = Math.atan2(_l.x * L.side, _l.z); mx = L.ec + th * L.R / S; my = L.n0 - along / S; }
    return covered(mx, my) ? { x: mx, y: my } : null;
  }

  // ---------- streets, buildings, water: spatial lookups in map metres ----------
  const WIDE = /PRATT|LIGHT|PRESIDENT|CONWAY|MARTIN LUTHER|M L KING|JONES FALLS|EXPRESSWAY|I-83|FALLSWAY|CHARLES|ST PAUL|CALVERT|FAYETTE|LOMBARD|ORLEANS|KEY HWY|HOWARD|GAY/;
  const CELL = 30, GX = Math.ceil(1800 / CELL) + 8, grid = new Map(), key = (i, j) => i * 4096 + j;
  const segs = [];
  for (const s of city.streets) { const hw = WIDE.test(s.n || '') ? 11 : 7; for (let i = 0; i + 1 < s.c.length; i++) segs.push([s.c[i][0], s.c[i][1], s.c[i + 1][0], s.c[i + 1][1], hw]); }
  segs.forEach((g, k) => { const pad = g[4] + 6, i0 = Math.floor((Math.min(g[0], g[2]) - pad) / CELL), i1 = Math.floor((Math.max(g[0], g[2]) + pad) / CELL), j0 = Math.floor((Math.min(g[1], g[3]) - pad) / CELL), j1 = Math.floor((Math.max(g[1], g[3]) + pad) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const kk = key(i, j); if (!grid.has(kk)) grid.set(kk, []); grid.get(kk).push(k); } });
  // signed distance into the nearest street (negative = on the carriageway)
  function streetDist(x, y) { const L = grid.get(key(Math.floor(x / CELL), Math.floor(y / CELL))); if (!L) return 99; let best = 99;
    for (const k of L) { const [ax, ay, bx, by, hw] = segs[k], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      best = Math.min(best, Math.hypot(x - ax - dx * t, y - ay - dy * t) - hw); } return best; }
  const pip = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const W = city.water, wb = W.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [1e9, 1e9, -1e9, -1e9]);
  const inWater = (x, y) => x >= wb[0] && x <= wb[2] && y >= wb[1] && y <= wb[3] && pip(x, y, W);
  const bgrid = new Map();
  city.buildings.forEach((b, k) => { const r = b.tiers[0].r; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    b._bb = [x0, y0, x1, y1]; for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) for (let j = Math.floor(y0 / CELL); j <= Math.floor(y1 / CELL); j++) { const kk = key(i, j); if (!bgrid.has(kk)) bgrid.set(kk, []); bgrid.get(kk).push(k); } });
  function inBuilding(x, y) { const L = bgrid.get(key(Math.floor(x / CELL), Math.floor(y / CELL))); if (!L) return false;
    for (const k of L) { const b = city.buildings[k], bb = b._bb; if (x < bb[0] || x > bb[2] || y < bb[1] || y > bb[3]) continue; for (const t of b.tiers) if (pip(x, y, t.r)) return true; } return false; }

  // ---------- map -> skin (ray-marched onto the field the skin is meshed from) ----------
  const trunkPrims = PRIMS.filter(p => p.op > 0 && TRUNK.has(BONES[p.bone]));
  const limbPrims = new Map(LIMB.map(L => [L, PRIMS.filter(p => p.op > 0 && (p.bone === L.up.i || p.bone === L.lo.i))]));
  function field(prims, x, y, z) { let f = 1; for (const p of prims) { const b = p.box; if (x < b[0] || x > b[3] || y < b[1] || y > b[4] || z < b[2] || z > b[5]) continue; f = smin(f, sdPrim(p, x, y, z), p.k); } return f; }
  function march(prims, ax, ay, az, dx, dy, dz, rmax) {
    const f = r => field(prims, ax + dx * r, ay + dy * r, az + dz * r); let prev = rmax;
    if (f(rmax) < 0) return null;
    for (let r = rmax - 0.003; r > 0; r -= 0.003) { if (f(r) < 0) { let a = r, b = prev; for (let i = 0; i < 10; i++) { const m = (a + b) / 2; if (f(m) < 0) a = m; else b = m; } return b; } prev = r; }
    return null;
  }
  const normalAt = (prims, x, y, z) => { const e = 0.0015; return V3(field(prims, x + e, y, z) - field(prims, x - e, y, z), field(prims, x, y + e, z) - field(prims, x, y - e, z), field(prims, x, y, z + e) - field(prims, x, y, z - e)).normalize(); };
  // which pattern piece a map point falls in (each point lies in at most one)
  function pieceOf(x, y) {
    if (y >= TT.n0 && y <= TT.n0 + (TT.v1 - TT.v0) / S && Math.abs(x - TT.ec) <= Math.PI * TT.R / S) return TT;
    for (const L of LIMB) if (y <= L.n0 && y >= L.n0 - (L.len - 0.015) / S && Math.abs(x - L.ec) <= Math.PI * L.R / S) return L;
    return null;
  }
  const _R = new THREE.Matrix4();
  function surfaceAt(piece, x, y) {
    if (piece === TT) { const th = (x - TT.ec) * S / TT.R, yy = TT.v0 + (y - TT.n0) * S, dx = -Math.sin(th), dz = -Math.cos(th);
      const r = march(trunkPrims, 0, yy, 0, dx, 0, dz, 0.34); return r == null ? null : V3(dx * r, yy, dz * r); }
    const L = piece, along = (L.n0 - y) * S; if (along < 0.012 || along > L.len - 0.015) return null;
    const b = along < L.up.len ? L.up : L.lo, ly = -(b === L.up ? along : along - L.up.len), th = (x - L.ec) * S / L.R;
    const a = V3(0, ly, 0).applyMatrix4(b.bind); _R.extractRotation(b.bind); const d = V3(L.side * Math.sin(th), 0, Math.cos(th)).applyMatrix4(_R).normalize();
    const r = march(limbPrims.get(L), a.x, a.y, a.z, d.x, d.y, d.z, 0.14); return r == null ? null : a.addScaledVector(d, r);
  }
  const primsOf = piece => piece === TT ? trunkPrims : limbPrims.get(piece);
  // rigid skinning for a building: the joints that own the skin at its foot (same rule as the skin's own weights)
  function weightsAt(prims, p) { const ds = new Map(); for (const q of prims) ds.set(q.bone, Math.min(ds.get(q.bone) ?? 1e9, sdPrim(q, p.x, p.y, p.z)));
    const w = [...ds].map(([b, d]) => [b, Math.exp(-Math.max(0, d) / 0.02)]).sort((a, b) => b[1] - a[1]).slice(0, 4), t = w.reduce((s, a) => s + a[1], 0) || 1;
    return [0, 1, 2, 3].map(k => w[k] ? [w[k][0], w[k][1] / t] : [0, 0]); }

  // ---------- the buildings ----------
  const hsh = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const MASONRY = ['#7b4a3a', '#8a5a45', '#6f4336', '#9b9184', '#a9a297', '#857a6c', '#b0a796'], TOWER = ['#5f6c74', '#6d7a82', '#566069', '#8a9196'];
  function buildMesh(skeleton) {
    const P = [], Nn = [], C = [], F = [], SI = [], SW = [], idx = [];
    const c = new THREE.Color(); let count = 0, skipped = 0;
    const pushV = (p, n, col, fac, si, sw) => { P.push(p.x, p.y, p.z); Nn.push(n.x, n.y, n.z); C.push(col.r, col.g, col.b); F.push(...fac); SI.push(...si); SW.push(...sw); return P.length / 3 - 1; };
    city.buildings.forEach((b, bi) => {
      const r0 = b.tiers[0].r; let cx = 0, cy = 0; for (const [x, y] of r0) { cx += x; cy += y; } cx /= r0.length; cy /= r0.length;
      const piece = pieceOf(cx, cy); if (!piece) return;
      const c0 = surfaceAt(piece, cx, cy); if (!c0) { skipped++; return; }
      const prims = primsOf(piece), n = normalAt(prims, c0.x, c0.y, c0.z), wt = weightsAt(prims, c0), si = wt.map(w => w[0]), sw = wt.map(w => w[1]);
      const tiers = []; for (const t of b.tiers) { const base = t.r.map(([x, y]) => surfaceAt(piece, x, y)); if (base.some(q => !q)) { skipped++; return; } tiers.push([t, base]); }
      const hue = hsh(bi + (b.id ? +String(b.id).replace(/\D/g, '').slice(-6) || 0 : 0));
      for (const [t, base] of tiers) {
        const kind = b.k === 2 ? (t.g ? 2 : 0) : b.k; c.set(b.k === 2 ? (t.g ? '#74848e' : '#bdb5a8') : b.k === 1 ? TOWER[Math.floor(hue * TOWER.length)] : MASONRY[Math.floor(hue * MASONRY.length)]);
        const sink = t.z0 > 0 ? 0 : 0.0015, z0 = t.z0 * S, z1 = Math.max(t.z1 * S, z0 + 0.0008);
        const lo = base.map(q => q.clone().addScaledVector(n, z0 - sink)), hi = base.map(q => q.clone().addScaledVector(n, z1));
        const ctr = hi.reduce((a, q) => a.add(q), V3()).divideScalar(hi.length);
        // walls (flat-shaded); fac = (real height, real distance along the wall, kind) for the facade shader
        let run = 0;
        for (let i = 0; i < base.length; i++) { const j = (i + 1) % base.length, e = hi[j].clone().sub(hi[i]), len = Math.hypot(t.r[j][0] - t.r[i][0], t.r[j][1] - t.r[i][1]);
          const wn = e.clone().cross(n).normalize(); if (wn.dot(hi[i].clone().add(hi[j]).multiplyScalar(0.5).sub(ctr)) < 0) wn.negate();
          const a = pushV(lo[i], wn, c, [t.z0, run, kind], si, sw), bb = pushV(lo[j], wn, c, [t.z0, run + len, kind], si, sw), cc = pushV(hi[j], wn, c, [t.z1, run + len, kind], si, sw), d = pushV(hi[i], wn, c, [t.z1, run, kind], si, sw);
          const fn = lo[j].clone().sub(lo[i]).cross(hi[i].clone().sub(lo[i])); if (fn.dot(wn) >= 0) idx.push(a, bb, cc, a, cc, d); else idx.push(a, cc, bb, a, d, cc); run += len; }
        // roof (triangulated in map coordinates)
        const tri = THREE.ShapeUtils.triangulateShape(t.r.map(([x, y]) => new THREE.Vector2(x, y)), []), rc = c.clone().multiplyScalar(kind === 0 ? 0.55 : 0.7); // roofs: tar, gravel and plant, darker than the walls
        const ro = hi.map(q => pushV(q, n, rc, [-1, 0, kind], si, sw));
        for (const [a, bb, cc] of tri) { const fn = hi[bb].clone().sub(hi[a]).cross(hi[cc].clone().sub(hi[a])); if (fn.dot(n) >= 0) idx.push(ro[a], ro[bb], ro[cc]); else idx.push(ro[a], ro[cc], ro[bb]); }
      }
      count++;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.setAttribute('fac', new THREE.Float32BufferAttribute(F, 3)); g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
    g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1)); g.computeBoundingSphere();
    const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, specularIntensity: 0.5 });
    m.onBeforeCompile = sh => { // facades: floors and window bays drawn from real metres, faded where they'd shimmer
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 fac; varying vec3 vFac;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFac = fac;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vFac;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float wall = step(0.0, vFac.x), fl = fract(vFac.x / 3.6), bay = fract(vFac.y / 3.2);
          float win = wall * step(0.32, fl) * step(fl, 0.86) * step(0.2, bay) * step(bay, 0.8);
          win = max(win, step(0.5, vFac.z) * wall * step(0.1, fl));                       // towers and new glass: mostly glazing
          win = mix(win, wall * mix(0.35, 0.75, step(0.5, vFac.z)), smoothstep(0.25, 0.7, fwidth(vFac.x / 3.6)));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.035, 0.042, 0.05), win * 0.8);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.14, win);');
    };
    m.customProgramCacheKey = () => 'orangutan-city-1';
    const mesh = new THREE.SkinnedMesh(g, m); mesh.name = 'city · Baltimore'; mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
    mesh.bind(skeleton, new THREE.Matrix4());
    return { mesh, count, skipped, tris: idx.length / 3 };
  }

  return { chartAt, streetDist, inWater, inBuilding, buildMesh, scale: S, version: CITY_VERSION };
}
