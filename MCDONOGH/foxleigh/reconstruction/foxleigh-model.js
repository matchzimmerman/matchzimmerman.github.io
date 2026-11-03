// FOXLEIGH MANSION — Reconstruction 002 (MZ.Claude for MZ.Human / HARIL, 2026-11-03)
// Procedural, evidence-tagged model of the Foxleigh "Old House" as it stood c.1873–1914.
//
// Units: metres. Axes: +x = east along the building's long axis, +y = up, +z = toward the front (porch side).
// Origin: centre of the brick mansion's main rectangle, at finished grade.
//
// PLAN SOURCE. Footprints are digitised from the alumni-reconstructed "Foxleigh Mansion or 'Old House' in 1873"
// first-floor plan (McDonogh 150 Stories #38, Jeff MacHamer / Class of 1970). Coordinates in comments
// marked [Pxxx,yyy] are pixels on the 640 × 484 web copy of that plan.
// SCALE. The plan has no scale bar. It is fixed by its two drawn stairs: the frame-addition stair and the
// front porch steps both read 12 px per tread pair-run, i.e. ~2.7 px per 250 mm tread → 0.093 m per px.
// That makes the brick block 15.7 × 9.8 m (≈ 51 × 32 ft) and the whole range 47 m long — consistent with
// the 8-bay Trustees' wing seen in both photographs (≈ 2.7 m bay spacing).
// ELEVATIONS come from the two school-published photographs (front/south-west view c.1900s; winter
// overview from the 1883 Main Building tower). Heights are proportioned from those, not measured.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeMaterials } from './textures.js';

export const VERSION = 'foxleigh-reconstruction-002';
export const CONFIDENCE = {
  documented: { label: 'Documented in written history', color: '#4f9d69' },
  photo: { label: 'Seen in archival photograph', color: '#3f86c9' },
  plan: { label: 'Placed from alumni 1873 plan', color: '#d6a23a' },
  inferred: { label: 'Inferred from period practice', color: '#c4553f' },
};
export const SECTIONS = {
  core: 'Brick mansion · c.1850',
  frame: 'Frame addition · c.1860s',
  trustees: "Trustees' Extension · 1873",
  service: 'Rear service range',
};

// ---------- plan → model coordinates ----------
const PXM = 0.093;              // metres per plan pixel
const PX0 = 139.2, PY0 = 244.2; // plan pixel of model origin (brick block centre)
const px = X => (X - PX0) * PXM, pz = Y => (Y - PY0) * PXM;

// ---------- key heights (photo-proportioned) ----------
export const H = {
  ff: 0.9,          // first floor above grade: 5 risers at porch steps (photo 1)
  core2: 4.8,       // brick second floor
  coreEave: 8.5,    // brick wall plate; 2nd-floor windows sit below it, 3rd floor is in the steep roof
  corePitch: 57,    // degrees; steep Gothic Revival pitch to fit a 3rd storey + attic (photo 2)
  frame2: 4.3,      // photo-1 camera solve: 2nd-floor heads sit ~0.5 m lower than first assumed
  frameEave: 7.6,   // frame range eaves sit visibly lower than the brick plate (photo 1, photo 2)
  framePitch: 36,
};

// ======================================================================
export function buildFoxleigh(opts = {}) {
  const MAT = opts.materials || makeMaterials();
  const buckets = new Map();
  const ctx = { section: 'core', conf: 'plan', M: new THREE.Matrix4() };
  const features = [];

  const add = (mat, g) => {
    if (!g) return;
    g = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(ctx.M);
    const key = ctx.section + '|' + mat + '|' + ctx.conf;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(g);
  };
  const scope = (o, fn) => { const prev = { ...ctx }; Object.assign(ctx, o); if (o.M) ctx.M = prev.M.clone().multiply(o.M); fn(); Object.assign(ctx, prev); };
  const note = (name, conf, source) => features.push({ name, section: ctx.section, conf, source });

  // ---------- primitives ----------
  const B = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  const C = (r, h, x, y, z, seg = 10, r2 = r) => new THREE.CylinderGeometry(r, r2, h, seg).translate(x, y, z);
  const ex = (shape, depth, seg = 6) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg });
  const shapeFrom = pts => new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const pathFrom = pts => new THREE.Path(pts.map(p => new THREE.Vector2(p[0], p[1])));

  // wall-local frame: u along wall (p1→p2), v up, w outward; outer face at w = 0
  function wallFrame(x1, z1, x2, z2) {
    const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz), d = new THREE.Vector3(dx / L, 0, dz / L);
    const n = new THREE.Vector3(-d.z, 0, d.x), M = new THREE.Matrix4().makeBasis(d, new THREE.Vector3(0, 1, 0), n).setPosition(x1, 0, z1);
    return { M, L };
  }
  function outline(w, h, arch, seg = 7) {
    if (arch === 'pointed') {
      const hs = h - w * 0.866, pts = [[-w / 2, 0], [w / 2, 0], [w / 2, hs]];
      for (let i = 1; i <= seg; i++) { const a = (i / seg) * Math.PI / 3; pts.push([-w / 2 + w * Math.cos(a), hs + w * Math.sin(a)]); }
      for (let i = 1; i < seg; i++) { const a = Math.PI * 2 / 3 + (i / seg) * Math.PI / 3; pts.push([w / 2 + w * Math.cos(a), hs + w * Math.sin(a)]); }
      pts.push([-w / 2, hs]); return pts;
    }
    if (arch === 'round') {
      const hs = h - w / 2, pts = [[-w / 2, 0], [w / 2, 0]];
      for (let i = 0; i <= seg * 2; i++) { const a = (i / (seg * 2)) * Math.PI; pts.push([w / 2 * Math.cos(a), hs + w / 2 * Math.sin(a)]); }
      return pts;
    }
    return [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]];
  }

  // ---------- windows & doors (wall-local coordinates) ----------
  function windowUnit(o) {
    const { u, y, w, h, arch = 'rect', style = 'frame', shutters = true, inset = 0.12, cols = 2, rows = 1 } = o;
    const zF = -inset;
    // sill
    add('trim', B(w + (style === 'brick' ? 0.22 : 0.3), 0.06, inset + 0.08, u, y - 0.03, (zF + 0.08) / 2));
    if (arch === 'rect') {
      if (style === 'frame') {
        for (const s of [-1, 1]) add('trim', B(0.11, h + 0.05, 0.03, u + s * (w / 2 + 0.055), y + h / 2, 0.015));
        add('trim', B(w + 0.3, 0.17, 0.035, u, y + h + 0.085, 0.017));
        add('trim', B(w + 0.38, 0.04, 0.08, u, y + h + 0.19, 0.03));
      } else {
        add('trim', B(w + 0.2, 0.13, 0.08, u, y + h + 0.065, 0.03)); // painted lintel / drip
        add('trim', B(w + 0.26, 0.04, 0.11, u, y + h + 0.15, 0.04));
      }
      // box frame
      add('sash', B(0.06, h, 0.12, u - w / 2 + 0.03, y + h / 2, zF - 0.04));
      add('sash', B(0.06, h, 0.12, u + w / 2 - 0.03, y + h / 2, zF - 0.04));
      add('sash', B(w, 0.06, 0.12, u, y + h - 0.03, zF - 0.04));
      // two sashes (double-hung), upper sash outboard
      const iw = w - 0.12, sh = (h - 0.06) / 2 + 0.02;
      [[y + h - 0.06 - sh / 2, zF + 0.0, 0.05], [y + sh / 2, zF - 0.045, 0.075]].forEach(([cy, cz, bot], k) => {
        add('sash', B(0.05, sh, 0.04, u - iw / 2 + 0.025, cy, cz)); add('sash', B(0.05, sh, 0.04, u + iw / 2 - 0.025, cy, cz));
        add('sash', B(iw, k ? 0.035 : 0.05, 0.04, u, cy + sh / 2 - (k ? 0.0175 : 0.025), cz));
        add('sash', B(iw, k ? bot : 0.035, 0.04, u, cy - sh / 2 + (k ? bot / 2 : 0.0175), cz));
        for (let c = 1; c < cols; c++) add('sash', B(0.022, sh, 0.03, u - iw / 2 + iw * c / cols, cy, cz));
        for (let r = 1; r < rows; r++) add('sash', B(iw, 0.022, 0.03, u, cy - sh / 2 + sh * r / rows, cz));
        add('glass', B(iw - 0.04, sh - 0.04, 0.006, u, cy, cz - 0.012));
      });
      if (shutters) {
        const sw = w / 2 + 0.03, off = style === 'frame' ? 0.11 : 0.025;
        for (const s of [-1, 1]) {
          const cu = u + s * (w / 2 + off + sw / 2);
          add('shutter', B(sw, h + 0.03, 0.035, cu, y + h / 2, 0.025));
          add('shutter', B(sw, 0.06, 0.045, cu, y + h * 0.5, 0.03));
          add('iron', B(0.04, 0.03, 0.04, u + s * (w / 2 + off - 0.01), y + h * 0.2, 0.03));
          add('iron', B(0.04, 0.03, 0.04, u + s * (w / 2 + off - 0.01), y + h * 0.8, 0.03));
        }
      }
    } else {
      const ol = outline(w, h, arch).map(p => [p[0] + u, p[1] + y]);
      const il = outline(w - 0.12, h - 0.1, arch).map(p => [p[0] + u, p[1] + y + 0.04]);
      const ring = shapeFrom(ol); ring.holes.push(pathFrom(il));
      add('sash', ex(ring, 0.1).translate(0, 0, zF - 0.08));
      add('glass', new THREE.ShapeGeometry(shapeFrom(il)).translate(0, 0, zF - 0.03));
      add('sash', B(0.03, h - 0.12, 0.03, u, y + (h - 0.12) / 2 + 0.05, zF - 0.02));
      add('sash', B(w - 0.12, 0.03, 0.03, u, y + h * 0.45, zF - 0.02));
      if (style === 'brick' && arch === 'pointed') { // hood-mould echoing the arch (upper part only)
        const ho = outline(w + 0.24, h + 0.14, arch).map(p => [p[0] + u, p[1] + y - 0.02]), hi = outline(w + 0.04, h + 0.02, arch).map(p => [p[0] + u, p[1] + y - 0.01]);
        const top = ho.filter(p => p[1] > y + h * 0.5), bot = hi.filter(p => p[1] > y + h * 0.5).reverse();
        add('trim', ex(shapeFrom([...top, ...bot]), 0.07).translate(0, 0, -0.01));
      }
    }
  }
  function doorUnit(o) {
    const { u, y, w, h, leaves = 1, transom = 0.45, inset = 0.14, style = 'frame', glazed = false } = o;
    const zF = -inset, hl = h - transom;
    add('stoneStep', B(w + 0.3, 0.06, inset + 0.2, u, y - 0.03, (zF + 0.2) / 2));
    if (style === 'frame') {
      for (const s of [-1, 1]) add('trim', B(0.13, h + 0.05, 0.035, u + s * (w / 2 + 0.065), y + h / 2, 0.017));
      add('trim', B(w + 0.34, 0.2, 0.04, u, y + h + 0.1, 0.02)); add('trim', B(w + 0.42, 0.05, 0.1, u, y + h + 0.22, 0.04));
    } else {
      add('trim', B(w + 0.24, 0.16, 0.09, u, y + h + 0.08, 0.035)); add('trim', B(w + 0.3, 0.05, 0.12, u, y + h + 0.18, 0.05));
    }
    add('sash', B(0.08, h, 0.14, u - w / 2 + 0.04, y + h / 2, zF - 0.05)); add('sash', B(0.08, h, 0.14, u + w / 2 - 0.04, y + h / 2, zF - 0.05));
    add('sash', B(w, 0.08, 0.14, u, y + h - 0.04, zF - 0.05)); add('sash', B(w, 0.07, 0.14, u, y + hl, zF - 0.05));
    if (transom > 0) add('glass', B(w - 0.16, transom - 0.14, 0.01, u, y + hl + transom / 2, zF - 0.06));
    const lw = (w - 0.16) / leaves;
    for (let i = 0; i < leaves; i++) {
      const cu = u - (w - 0.16) / 2 + lw * (i + 0.5);
      add('door', B(lw - 0.01, hl - 0.04, 0.05, cu, y + hl / 2, zF - 0.07));
      const pw = lw * 0.32, rowsH = [0.42, 0.24, 0.3];
      let yy = y + 0.12;
      rowsH.forEach((f, r) => {
        const ph = (hl - 0.42) * f;
        for (const s of [-1, 1]) {
          if (glazed && r === 2) add('glass', B(pw, ph, 0.01, cu + s * lw * 0.22, yy + ph / 2, zF - 0.04));
          else add('door', B(pw, ph, 0.02, cu + s * lw * 0.22, yy + ph / 2, zF - 0.035));
        }
        yy += ph + 0.1;
      });
      add('iron', new THREE.SphereGeometry(0.035, 8, 6).translate(cu + (i === leaves - 1 && leaves > 1 ? -1 : 1) * lw * 0.38, y + 1.0, zF - 0.02));
    }
  }

  // ---------- walls ----------
  // openings: {u,y,w,h,kind:'window'|'door'|'blank', arch, ...unit options}
  function wall(o) {
    const { p1, p2, y0, y1, t = 0.4, mat, openings = [], top = null, unit = {} } = o;
    const { M, L } = wallFrame(p1[0], p1[1], p2[0], p2[1]);
    const topPts = top ? top(L) : [[L, y1], [0, y1]];
    const sh = shapeFrom([[0, y0], [L, y0], ...topPts]);
    for (const op of openings) {
      const ol = outline(op.w, op.h, op.arch || 'rect').map(p => [p[0] + op.u, p[1] + op.y]);
      sh.holes.push(pathFrom(ol));
    }
    scope({ M }, () => {
      add(mat, ex(sh, t).translate(0, 0, -t));
      for (const op of openings) {
        const opt = { ...unit, ...op };
        if (op.kind === 'door') doorUnit(opt); else if (op.kind === 'blank') { /* opening only */ } else windowUnit(opt);
      }
      if (o.extra) o.extra(L);
    });
    return { M, L };
  }
  // A ring of walls from a polygon listed with the outside on the left-hand normal (front edges run west→east).
  function wallRing(pts, o, perEdge = {}) {
    for (let i = 0; i < pts.length - (o.open ? 1 : 0); i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      wall({ ...o, p1: a, p2: b, openings: perEdge[i] || [] });
    }
  }
  function gableProfile(L, eave, pitchDeg, cu = L / 2, half = L / 2) {
    const tp = Math.tan(pitchDeg * Math.PI / 180), apex = eave + half * tp;
    const pts = [[L, eave]];
    if (cu + half < L - 1e-6) pts.push([cu + half, eave]);
    pts.push([cu, apex]);
    if (cu - half > 1e-6) pts.push([cu - half, eave]);
    pts.push([0, eave]); return pts;
  }

  // ---------- roofs ----------
  // Gable roof; axis = ridge direction ('x' or 'z'); span measured wall-face to wall-face.
  function gableRoof(o) {
    const { cx, cz, axis = 'x', len, span, eave, pitch, ohE = 0.45, ohA = 0.35, ohB = 0.35, t = 0.16, mat = 'slate', barge = null, fascia = true, gutters = true } = o;
    const tp = Math.tan(pitch * Math.PI / 180), cp = Math.cos(pitch * Math.PI / 180), hs = span / 2, S = hs + ohE;
    const tv = t / cp, yb = s => eave + (hs - Math.abs(s)) * tp, ridge = yb(0);
    const prof = [[-S, yb(S)], [0, ridge], [S, yb(S)], [S, yb(S) + tv], [0, ridge + tv], [-S, yb(S) + tv]];
    const soff = [[-S, yb(S) - 0.025], [0, ridge - 0.025], [S, yb(S) - 0.025], [S, yb(S)], [0, ridge], [-S, yb(S)]];
    const L0 = -len / 2 - ohA, L1 = len / 2 + ohB;
    // basis: shape a → across span, b → up, c → along ridge
    const M = axis === 'x'
      ? new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)).setPosition(cx + L0, 0, cz)
      : new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)).setPosition(cx, 0, cz + L0);
    const along = L1 - L0;
    scope({ M }, () => {
      add(mat, ex(shapeFrom(prof), along));
      add('trim', ex(shapeFrom(soff), along));
      // ridge roll
      add(mat === 'slate' ? 'iron' : mat, B(0.12, 0.08, along, 0, ridge + tv + 0.02, along / 2).rotateZ(0));
      if (fascia) for (const s of [-1, 1]) {
        add('trim', B(0.035, tv + 0.06, along, s * (S + 0.017), yb(S) + tv / 2 - 0.03, along / 2));
        if (gutters) {
          add('gutter', C(0.07, along, 0, 0, 0, 8).rotateX(Math.PI / 2).translate(s * (S + 0.09), yb(S) + 0.02, along / 2));
        }
      }
      if (barge) {
        for (const end of (barge.ends || [0, 1])) bargeboard({ S, yb, ridge, tv, c: end ? along + 0.02 : -0.06, style: barge.style || 'plain', flip: !end });
      }
    });
    return { ridge, tp, yb, M };
  }
  // bargeboard in the roof's shape plane at extrusion distance c
  function bargeboard({ S, yb, ridge, tv, c, style, flip }) {
    const hb = style === 'gothic' ? 0.42 : 0.24, th = 0.05;
    const topPts = [[-S, yb(S) + tv], [0, ridge + tv], [S, yb(S) + tv]];
    const bot = [];
    const slopeLen = Math.hypot(S, ridge - yb(S)), per = style === 'gothic' ? Math.max(2, Math.round(slopeLen / 0.42)) : 1;
    const holes = [];
    for (const side of [1, -1]) {
      for (let i = 0; i <= per * 6; i++) {
        const f = i / (per * 6), s = side * S * (1 - f), base = yb(s);
        let d = hb;
        if (style === 'gothic') { const fr = (f * per) % 1; d = hb - 0.2 * Math.pow(Math.sin(Math.PI * fr), 0.6); }
        if (side === -1 && i === 0) continue;
        bot.push([s, base - d + tv * 0.3]);
      }
      if (style === 'gothic') for (let k = 0; k < per; k++) {
        const f = (k + 0.5) / per, s = side * S * (1 - f), cy = yb(s) - 0.1 + tv * 0.3, r = 0.055;
        if (Math.abs(s) < 0.25) continue;
        const ring = []; for (let a = 0; a < 8; a++) ring.push([s + r * Math.cos(a / 8 * Math.PI * 2), cy + r * Math.sin(a / 8 * Math.PI * 2)]);
        holes.push(ring);
      }
    }
    // bot currently runs S→0 then -S→0 ; assemble outline: top (−S→S) then bottom S→−S
    const right = bot.slice(0, per * 6 + 1), left = bot.slice(per * 6 + 1).reverse();
    const outlinePts = [...topPts, ...right, ...left];
    const sh = shapeFrom(outlinePts); holes.forEach(hh => sh.holes.push(pathFrom(hh)));
    add('trim', ex(sh, th, 4).translate(0, 0, c + (flip ? 0 : -0.02)));
    if (style === 'gothic') { // finial + pendant at apex
      add('trim', B(0.11, 1.6, 0.11, 0, ridge + tv - 0.15, c + th / 2));
      add('trim', new THREE.ConeGeometry(0.1, 0.35, 4).rotateY(Math.PI / 4).translate(0, ridge + tv + 0.82, c + th / 2));
      add('trim', new THREE.ConeGeometry(0.08, 0.28, 4).rotateY(Math.PI / 4).rotateX(Math.PI).translate(0, ridge + tv - 1.08, c + th / 2));
    }
  }
  function chimney(x, z, w, d, y0, y1, conf = 'photo') {
    scope({ conf }, () => {
      add('chimney', B(w, y1 - y0, d, x, (y0 + y1) / 2, z));
      add('chimney', B(w + 0.12, 0.09, d + 0.12, x, y1 - 0.42, z));
      add('chimney', B(w + 0.22, 0.12, d + 0.22, x, y1 - 0.2, z));
      add('chimney', B(w + 0.1, 0.1, d + 0.1, x, y1 - 0.03, z));
      add('iron', B(w - 0.22, 0.02, d - 0.22, x, y1 + 0.03, z));
    });
  }
  function gutterDown(x, z, yTop) { add('gutter', C(0.045, yTop - 0.05, x, yTop / 2, z, 8)); add('gutter', B(0.2, 0.06, 0.1, x, 0.06, z)); }

  // flat-roofed one-storey bay / projecting room, pts listed outside-left, last edge = chord on host wall
  function offsetPoly(pts, d) {
    const n = pts.length, out = [];
    // assume polygon order: outward normal = (-dz, dx) of each edge (same as walls)
    const nrm = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return [-dz / l, dx / l]; };
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n], n1 = nrm(a, b), n2 = nrm(b, c);
      let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
      const cos = mx * n1[0] + mz * n1[1]; out.push([b[0] + mx * d / cos, b[1] + mz * d / cos]);
    }
    return out;
  }
  function polySlab(pts, y, th, mat) {
    const sh = shapeFrom(pts.map(p => [p[0], -p[1]]));
    add(mat, ex(sh, th).rotateX(-Math.PI / 2).translate(0, y, 0));
  }
  function bayRoof(pts, y) {
    const o1 = offsetPoly(pts, 0.32), o2 = offsetPoly(pts, 0.18);
    polySlab(o2, y, 0.32, 'trim');           // frieze / cornice body
    polySlab(o1, y + 0.32, 0.1, 'trim');     // cornice crown
    polySlab(offsetPoly(pts, 0.25), y + 0.42, 0.04, 'tin');
  }

  // ======================================================================
  // BRICK MANSION c.1850 — painted brick, 3 storeys + attic + full basement (documented)
  // ======================================================================
  ctx.section = 'core';
  const W = px(55.0), E = px(223.3), Nz = pz(191.7), Sz = pz(296.7); // [P55..223, 192..297]
  const hallW = px(117.7), hallE = px(163.3), hallF = pz(301.7);      // projecting centre pavilion
  const hallC = (hallW + hallE) / 2;
  const crossZ = pz(230);                                             // front/rear room division & chimney line
  const ffA = H.ff - 0.05;
  const brickUnit = { style: 'brick', inset: 0.24 };
  const w1 = 1.08, h1 = 2.45, s1 = H.ff + 0.55;        // 1st-floor windows (photo 1: long 2/2 sashes)
  const w2 = 1.08, h2 = 2.1, s2 = H.core2 + 0.55;      // 2nd-floor windows
  const frontWin = [-6.2, -3.41, 3.62, 6.1];
  note('Three storeys, attic and full basement in brick', 'documented', '150 Stories #38');
  note('Footprint 15.7 × 9.8 m with central hall and four rooms', 'plan', '1873 plan [P55–223, 192–297]');

  // plinth (stone, visible ~0.9 m: photo 1 shows a dark base course and five steps)
  scope({ conf: 'photo' }, () => {
    const pl = (a, b, ops = []) => wall({ p1: a, p2: b, y0: -0.6, y1: H.ff, t: 0.48, mat: 'stone', openings: ops });
    pl([W, Sz], [px(77.3), Sz], [{ u: 0.93, y: 0.15, w: 0.7, h: 0.45, shutters: false, cols: 3, style: 'brick', inset: 0.2 }]); pl([px(109.7), Sz], [hallW, Sz]);
    pl([hallW, Sz], [hallW, hallF]); pl([hallW, hallF], [hallE, hallF]); pl([hallE, hallF], [hallE, Sz]);
    pl([hallE, Sz], [E, Sz], [{ u: 4.0, y: 0.15, w: 0.7, h: 0.45, shutters: false, cols: 3, style: 'brick', inset: 0.2 }]);
    pl([E, Sz], [E, pz(280)]);
  });

  // first storey. PHOTO-LED CHANGE vs plan: both photographs show the canted bay window on the FRONT of the
  // west room with the veranda starting east of it; the plan draws that bay on the west side wall.
  const bayF = [[px(77.3), Sz], [px(85.4), Sz + 0.9], [px(101.6), Sz + 0.9], [px(109.7), Sz]];  // chord x −5.7…−2.7, 0.9 m deep
  const oct = [[px(98.3), Nz], [px(81.7), pz(176)], [px(51.7), pz(176)], [px(35), pz(200)], [px(35), pz(221.7)], [W, pz(230)]]; // NW octagon room
  const bayNE = [[E, pz(190)], [px(210), pz(176.7)], [px(191.7), pz(176.7)], [px(176.7), Nz]];          // NE canted bay
  const xFarW = -6.9, x2a = -4.55, x2b = -2.95; // photo 1: far-west window column; 2nd-floor pair above the bay
  {
    const y0 = ffA, y1 = H.core2 + 0.02;
    const wA = { y0, y1, t: 0.45, mat: 'paintBrick', unit: brickUnit };
    // front (west → east), pavilion projects 0.47 m
    scope({ conf: 'photo' }, () => {
      wall({ ...wA, p1: [W, Sz], p2: bayF[0], openings: [{ u: xFarW - W, y: s1, w: w1, h: h1 }] });
      wallRing(bayF, { ...wA, open: true }, {
        0: [{ u: 0.59, y: s1, w: 0.62, h: h1 - 0.15, shutters: false }], 1: [{ u: 0.75, y: s1, w: 1.0, h: h1 - 0.15, shutters: false }], 2: [{ u: 0.59, y: s1, w: 0.62, h: h1 - 0.15, shutters: false }],
      });
      wall({ ...wA, p1: bayF[3], p2: [hallW, Sz] });
      bayRoof(bayF, H.core2 - 0.35);
      wallRing(bayF, { y0: -0.6, y1: H.ff, t: 0.48, mat: 'stone', open: true });
    });
    wall({ ...wA, p1: [hallW, Sz], p2: [hallW, hallF] });
    wall({ ...wA, p1: [hallW, hallF], p2: [hallE, hallF], openings: [{ kind: 'door', u: (hallE - hallW) / 2, y: H.ff, w: 1.5, h: 3.05, leaves: 2, transom: 0.55, style: 'brick', glazed: true, inset: 0.24 }] });
    wall({ ...wA, p1: [hallE, hallF], p2: [hallE, Sz] });
    wall({ ...wA, p1: [hallE, Sz], p2: [E, Sz], openings: [{ u: frontWin[2] - hallE, y: s1, w: w1, h: h1 }, { u: frontWin[3] - hallE, y: s1, w: w1, h: h1 }] });
    // east wall (mostly enclosed by the frame addition)
    wall({ ...wA, p1: [E, Sz], p2: [E, pz(190)] });
    // rear: NE bay, hall rear door, NW octagon
    wallRing(bayNE, { ...wA, open: true }, { 0: [{ u: 0.9, y: s1, w: 0.9, h: h1 - 0.1 }], 1: [{ u: 0.85, y: s1, w: 0.9, h: h1 - 0.1 }], 2: [{ u: 1.0, y: s1, w: 0.9, h: h1 - 0.1 }] });
    wall({ ...wA, p1: [px(176.7), Nz], p2: [px(98.3), Nz], openings: [{ kind: 'door', u: px(176.7) - hallC, y: H.ff, w: 1.4, h: 2.9, leaves: 2, transom: 0.45, style: 'brick', inset: 0.24 }] });
    scope({ conf: 'plan' }, () => wallRing(oct, { ...wA, open: true }, {
      0: [{ u: 1.05, y: s1, w: 0.9, h: h1 - 0.1, shutters: false }], 1: [{ u: 1.4, y: s1, w: 1.0, h: h1 - 0.1 }],
      2: [{ u: 1.5, y: s1, w: 0.9, h: h1 - 0.1, shutters: false }], 3: [{ u: 1.0, y: s1, w: 0.9, h: h1 - 0.1 }], 4: [{ u: 1.0, y: s1, w: 0.8, h: h1 - 0.2, shutters: false }],
    }));
    // west wall, front room (one window column, photo 2)
    scope({ conf: 'photo' }, () => wall({ ...wA, p1: [W, pz(230)], p2: [W, Sz], openings: [{ u: 3.6, y: s1, w: w1, h: h1 }] }));
    scope({ conf: 'plan' }, () => { bayRoof(oct, H.core2 - 0.25); bayRoof(bayNE, H.core2 - 0.25); });
    scope({ conf: 'plan' }, () => {
      wallRing(oct, { y0: -0.6, y1: H.ff, t: 0.48, mat: 'stone', open: true });
      wallRing(bayNE, { y0: -0.6, y1: H.ff, t: 0.48, mat: 'stone', open: true });
      wall({ p1: [px(176.7), Nz], p2: [px(98.3), Nz], y0: -0.6, y1: H.ff, t: 0.48, mat: 'stone' });
      wall({ p1: [W, pz(230)], p2: [W, Sz], y0: -0.6, y1: H.ff, t: 0.48, mat: 'stone' });
    });
  }
  note('Canted bay window on the front of the west room, flat roof with cornice; veranda starts east of it', 'photo', 'Photos 1 & 2 — the plan shows this bay on the west wall instead');
  note('Octagonal rear-west room and canted rear-east bay', 'plan', '1873 plan [P35–98, 176–230], [P177–223, 177–192]');

  // upper storeys: full rectangle + pavilion, walls up to plate, gables
  const tpC = Math.tan(H.corePitch * Math.PI / 180);
  const depthC = Sz - Nz, spanC = depthC, ridgeC = H.coreEave + spanC / 2 * tpC;
  {
    const y0 = H.core2, y1 = H.coreEave, wU = { y0, y1, t: 0.45, mat: 'paintBrick', unit: brickUnit };
    const o2 = (u, extra = {}) => ({ u, y: s2, w: w2, h: h2, ...extra });
    // front-west: 2nd-floor far-west window + pair over the bay; the wall rises as a wall-dormer gable carrying
    // two narrow 3rd-storey windows joined by an iron ladder (photo 1).
    const wdC = (x2a + x2b) / 2, wdH = 1.6, wdTop = H.coreEave + 2.2;
    scope({ conf: 'photo' }, () => wall({
      ...wU, p1: [W, Sz], p2: [hallW, Sz],
      top: L => { const c = wdC - W, tp = Math.tan(H.corePitch * Math.PI / 180); return [[L, H.coreEave], [c + wdH, H.coreEave], [c + wdH, wdTop], [c, wdTop + wdH * tp], [c - wdH, wdTop], [c - wdH, H.coreEave], [0, H.coreEave]]; },
      openings: [o2(xFarW - W), o2(x2a - W), o2(x2b - W),
        { u: x2a - W + 0.15, y: H.coreEave + 0.55, w: 0.55, h: 1.45, shutters: false }, { u: x2b - W - 0.15, y: H.coreEave + 0.55, w: 0.55, h: 1.45, shutters: false },
        { u: wdC - W, y: wdTop + 0.35, w: 0.4, h: 0.9, arch: 'pointed', shutters: false }],
      extra: () => { // iron escape ladder from the 2nd-floor window head to the 3rd-storey window (photo 1)
        const lu = x2a - W + 0.55, y0l = s2 + h2 + 0.25, y1l = H.coreEave + 1.95;
        for (const d of [-0.2, 0.2]) add('iron', B(0.035, y1l - y0l, 0.035, lu + d, (y0l + y1l) / 2, 0.16));
        for (let yy = y0l + 0.15; yy < y1l; yy += 0.3) add('iron', B(0.4, 0.025, 0.025, lu, yy, 0.16));
        for (const yy of [y0l + 0.2, y1l - 0.2]) add('iron', B(0.025, 0.025, 0.16, lu, yy, 0.08));
      },
    }));
    wall({ ...wU, p1: [hallW, Sz], p2: [hallW, hallF] });
    // pavilion front rises into the central Gothic wall-gable (photo 2: window at 2nd and 3rd storey)
    const pavL = hallE - hallW, pavApex = H.coreEave + pavL / 2 * tpC;
    scope({ conf: 'photo' }, () => wall({
      ...wU, p1: [hallW, hallF], p2: [hallE, hallF], top: L => gableProfile(L, H.coreEave, H.corePitch).slice(0),
      openings: [o2(pavL / 2, { w: 1.0 }), { u: pavL / 2, y: H.coreEave + 0.35, w: 0.95, h: 1.9, arch: 'pointed', shutters: false }],
    }));
    wall({ ...wU, p1: [hallE, hallF], p2: [hallE, Sz] });
    wall({ ...wU, p1: [hallE, Sz], p2: [E, Sz], openings: [o2(frontWin[2] - hallE), o2(frontWin[3] - hallE)] });
    // west gable end: 2 windows at 2nd storey, 2 narrow 3rd-storey windows, attic lancet (photo 1)
    scope({ conf: 'photo' }, () => wall({
      ...wU, p1: [W, Nz], p2: [W, Sz], top: L => gableProfile(L, H.coreEave, H.corePitch),
      openings: [o2(2.6), o2(7.1), { u: 3.25, y: H.coreEave + 0.55, w: 0.72, h: 1.55, shutters: false }, { u: 6.5, y: H.coreEave + 0.55, w: 0.72, h: 1.55, shutters: false },
        { u: depthC / 2, y: H.coreEave + 3.7, w: 0.62, h: 1.35, arch: 'pointed', shutters: false }],
    }));
    // east gable end — only its upper part shows above the frame roof
    wall({ ...wU, p1: [E, Sz], p2: [E, Nz], top: L => gableProfile(L, H.coreEave, H.corePitch),
      openings: [{ u: depthC / 2, y: H.coreEave + 3.7, w: 0.62, h: 1.35, arch: 'pointed', shutters: false }] });
    // rear
    wall({ ...wU, p1: [E, Nz], p2: [W, Nz], openings: [o2(E - 6.1), o2(E - 3.62), o2(E - hallC, { w: 1.0 }), o2(E + 3.41), o2(E + 6.2)] });
  }
  note('Steep side-gabled roof with central Gothic wall-gable over a projecting centre bay', 'photo', 'Photo 2 (estate overview)');
  note('2nd-storey windows below the plate; 3rd storey inside the roof; west gable windows on three levels', 'photo', 'Photo 2');
  note('Wall-dormer gable over the bay with two narrow 3rd-storey windows and an iron escape ladder', 'photo', 'Photo 1');

  // main roof, slate, Gothic bargeboards and finials on both gables
  const rC = gableRoof({ cx: (W + E) / 2, cz: (Nz + Sz) / 2, axis: 'x', len: E - W, span: spanC, eave: H.coreEave, pitch: H.corePitch, ohE: 0.45, ohA: 0.4, ohB: 0.4, barge: { style: 'gothic' }, mat: 'slate' });
  // pavilion cross-gable roof (ridge north–south)
  scope({ conf: 'photo' }, () => {
    const pavL = hallE - hallW;
    gableRoof({ cx: hallC, cz: (hallF + 0.2) / 2, axis: 'z', len: hallF - 0.2, span: pavL, eave: H.coreEave, pitch: H.corePitch, ohE: 0.3, ohA: 0, ohB: 0.4, barge: { style: 'gothic', ends: [1] }, mat: 'slate', gutters: true });
  });
  // dormers: two front (photo 2 flanking the centre gable), two rear (inferred)
  function dormer(x, side, conf) {
    const wD = 1.9, zFace = side * (spanC / 2 - 0.7), ySurf = H.coreEave + 0.7 * tpC, eD = ySurf + 1.75;
    const Md = new THREE.Matrix4().makeTranslation(x, 0, 0).multiply(new THREE.Matrix4().makeRotationY(side > 0 ? 0 : Math.PI));
    scope({ M: Md, conf }, () => {
      const zf = spanC / 2 - 0.7, back = (ridgeC - eD) / tpC;
      wall({ p1: [-wD / 2, zf], p2: [wD / 2, zf], y0: ySurf - 0.3, y1: eD, t: 0.2, mat: 'paintBrick', unit: brickUnit,
        top: L => gableProfile(L, eD, H.corePitch), openings: [{ u: wD / 2, y: ySurf + 0.25, w: 0.78, h: 1.45, arch: 'pointed', shutters: false, inset: 0.1 }] });
      wall({ p1: [wD / 2, zf], p2: [wD / 2, back - 0.4], y0: ySurf - 0.3, y1: eD, t: 0.15, mat: 'paintBrick' });
      wall({ p1: [-wD / 2, back - 0.4], p2: [-wD / 2, zf], y0: ySurf - 0.3, y1: eD, t: 0.15, mat: 'paintBrick' });
      gableRoof({ cx: 0, cz: (zf + back - 1.2) / 2, axis: 'z', len: zf - (back - 1.2), span: wD, eave: eD, pitch: H.corePitch, ohE: 0.18, ohA: 0, ohB: 0.25, barge: { style: 'gothic', ends: [1] }, gutters: false });
    });
  }
  scope({ conf: 'photo' }, () => { // roof over the wall dormer
    const wdC = -3.75, wdH = 1.6, wdTop = H.coreEave + 2.2, back = spanC / 2 - (wdTop - H.coreEave) / tpC;
    wall({ p1: [wdC + wdH, Sz], p2: [wdC + wdH, back - 0.4], y0: H.coreEave - 0.2, y1: wdTop, t: 0.3, mat: 'paintBrick' });
    wall({ p1: [wdC - wdH, back - 0.4], p2: [wdC - wdH, Sz], y0: H.coreEave - 0.2, y1: wdTop, t: 0.3, mat: 'paintBrick' });
    gableRoof({ cx: wdC, cz: (Sz + back - 1.6) / 2, axis: 'z', len: Sz - (back - 1.6), span: wdH * 2, eave: wdTop, pitch: H.corePitch, ohE: 0.25, ohA: 0, ohB: 0.35, barge: { style: 'gothic', ends: [1] }, gutters: false });
  });
  dormer(5.0, 1, 'photo'); dormer(-3.6, -1, 'inferred'); dormer(3.6, -1, 'inferred');
  note('Steep gabled roof dormer east of the centre gable', 'photo', 'Photo 2');
  note('Rear dormers', 'inferred', 'symmetry with front');
  // eave frieze along front & rear
  add('trim', B(E - W + 0.1, 0.32, 0.06, (W + E) / 2, H.coreEave - 0.16, Sz + 0.03));
  add('trim', B(E - W + 0.1, 0.32, 0.06, (W + E) / 2, H.coreEave - 0.16, Nz - 0.03));
  // chimneys on the front/rear room division (plan fireplaces) + one further stack seen in photo 2
  const chimTop = ridgeC + 1.9;
  for (const X of [62.5, 85, 154, 190]) chimney(px(X), crossZ, 0.62, 0.95, H.coreEave, chimTop, 'plan');
  chimney(px(110), crossZ, 0.55, 0.8, H.coreEave, chimTop - 0.3, 'photo');
  note('Chimney stacks on the room-division wall serving the plan\'s four fireplaces; a fifth stack in photo 2', 'plan', '1873 plan fireplaces at y≈230; Photo 2');
  // downspouts
  for (const [x, z] of [[W + 0.15, Sz + 0.2], [E - 0.2, Sz + 0.2], [W + 0.15, Nz - 0.2]]) gutterDown(x, z, H.coreEave);

  // ---------- front veranda (photo 1: chamfered posts, segmental-arch valance; plan: steps centre and west) ----------
  ctx.conf = 'photo';
  {
    const pz0 = Sz, pz1 = pz(306.7), x0 = px(111.4), x1 = px(220); // west end beside the bay (photos); east end from plan
    const deckY = H.ff, beam = H.ff + 3.15, roofLo = beam + 0.35, roofHi = H.core2 + 0.45;
    add('porchFloor', B(x1 - x0, 0.1, pz1 - pz0, (x0 + x1) / 2, deckY - 0.05, (pz0 + pz1) / 2));
    add('trim', B(x1 - x0 + 0.04, 0.22, 0.05, (x0 + x1) / 2, deckY - 0.16, pz1 + 0.02));
    add('lattice', B(x1 - x0 - 0.1, deckY - 0.2, 0.04, (x0 + x1) / 2, (deckY - 0.2) / 2, pz1 - 0.05));
    add('lattice', B(0.04, deckY - 0.2, pz1 - pz0, x0 + 0.05, (deckY - 0.2) / 2, (pz0 + pz1) / 2));
    const postX = [x0 + 0.12, px(125), px(156.7), px(190), x1 - 0.12]; // plan post marks [P125,157,190,219]
    for (const x of postX) {
      add('trim', B(0.19, beam - deckY, 0.19, x, (deckY + beam) / 2, pz1 - 0.15).rotateY(0));
      add('trim', B(0.28, 0.18, 0.28, x, deckY + 0.09, pz1 - 0.15));
      add('trim', B(0.26, 0.12, 0.26, x, beam - 0.3, pz1 - 0.15));
    }
    // valance with segmental arches between posts (front) and returns
    const arch = (u0, u1, y, depth, cz) => { // valance board with an elliptical arch cut from its lower edge
      const pts = [[u0, y], [u0, y - 0.62]];
      for (let i = 1; i < 16; i++) { const t = i / 16; pts.push([u0 + (u1 - u0) * t, y - 0.62 + 0.42 * Math.sqrt(1 - (2 * t - 1) ** 2)]); }
      pts.push([u1, y - 0.62], [u1, y]);
      return ex(shapeFrom(pts), depth).translate(0, 0, cz);
    };
    for (let i = 0; i < postX.length - 1; i++) add('trim', arch(postX[i] + 0.1, postX[i + 1] - 0.1, beam, 0.06, pz1 - 0.19));
    add('trim', B(x1 - x0, 0.36, 0.22, (x0 + x1) / 2, beam + 0.18, pz1 - 0.15));
    add('trim', B(0.22, 0.36, pz1 - pz0, x0, beam + 0.18, (pz0 + pz1) / 2)); add('trim', B(0.22, 0.36, pz1 - pz0, x1, beam + 0.18, (pz0 + pz1) / 2));
    for (const xx of [x0, x1]) {
      scope({ M: new THREE.Matrix4().makeTranslation(xx, 0, 0).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)) }, () => {
        add('trim', arch(-(pz1 - 0.25), -(pz0 + 0.1), beam, 0.06, -0.03));
      });
    }
    // shed roof (tin) + beaded ceiling
    const rl = pz1 - pz0 + 0.35, rise = roofHi - roofLo, ang = Math.atan2(rise, rl), len = Math.hypot(rl, rise);
    add('tin', B(x1 - x0 + 0.5, 0.09, len, (x0 + x1) / 2, 0, 0).rotateX(ang).translate(0, (roofLo + roofHi) / 2 + 0.05, (pz0 + pz1 + 0.35) / 2));
    add('ceiling', B(x1 - x0, 0.02, pz1 - pz0, (x0 + x1) / 2, beam + 0.36, (pz0 + pz1) / 2));
    add('gutter', C(0.07, x1 - x0 + 0.5, 0, 0, 0, 8).rotateZ(Math.PI / 2).translate((x0 + x1) / 2, roofLo - 0.02, pz1 + 0.37));
    // centre steps (photo 1) and west steps (plan)
    ctx.conf = 'photo';
    for (let i = 0; i < 5; i++) add('stoneStep', B(px(156.7) - px(125), (i + 1) * H.ff / 5, 0.32, hallC, (i + 1) * H.ff / 10, pz1 + 0.16 + (4 - i) * 0.3));
    note('Front veranda with chamfered posts, arched valance and low tin roof, east of the bay', 'photo', 'Photo 1; plan depth [P297–307]');
    note('Centre steps on the hall axis', 'photo', 'Photo 1; plan [P125–157, 307–320]');
  }

  // ======================================================================
  // FRAME ADDITION c.1860s — classrooms below, dormitory above (documented)
  // ======================================================================
  ctx.section = 'frame'; ctx.conf = 'plan';
  const fW = E, fE = px(336), fN = pz(190), fS = pz(286.7), recW = px(256.7), recE = px(298.3), recS = pz(272.7);
  const frameUnit = { style: 'frame', inset: 0.11 };
  const fw1 = 0.95, fh1 = 2.25, fs1 = H.ff + 0.7, fh2 = 1.8, fs2 = H.frame2 + 0.45;
  const fWall = { t: 0.22, mat: 'siding', unit: frameUnit };
  const tpF = Math.tan(H.framePitch * Math.PI / 180);
  const crossW = px(298.3), crossE = fE, crossC = (crossW + crossE) / 2;
  {
    const y0 = H.ff - 0.05, y1 = H.frame2 + 0.02;
    // plinth
    for (const [a, b] of [[[fW, fS], [recW, fS]], [[recW, fS], [recW, recS]], [[recW, recS], [recE, recS]], [[recE, recS], [recE, fS]], [[recE, fS], [fE, fS]], [[fE, fN], [fW, fN]]])
      wall({ p1: a, p2: b, y0: -0.6, y1: H.ff, t: 0.36, mat: 'stone' });
    wall({ ...fWall, y0, y1, p1: [fW, fS], p2: [recW, fS], openings: [{ u: 1.6, y: fs1, w: fw1, h: fh1 }] });
    wall({ ...fWall, y0, y1, p1: [recW, fS], p2: [recW, recS] });
    wall({ ...fWall, y0, y1, p1: [recW, recS], p2: [recE, recS], openings: [{ kind: 'door', u: 1.3, y: H.ff, w: 1.0, h: 2.6, transom: 0.4 }, { u: 3.0, y: fs1, w: fw1, h: fh1 }] });
    wall({ ...fWall, y0, y1, p1: [recE, recS], p2: [recE, fS] });
    scope({ conf: 'photo' }, () => wall({ ...fWall, y0, y1, p1: [recE, fS], p2: [fE, fS], openings: [{ u: (fE - recE) / 2, y: fs1, w: fw1, h: fh1 }] }));
    wall({ ...fWall, y0, y1, p1: [fE, fN], p2: [fW, fN], openings: [{ u: 2.0, y: fs1, w: fw1, h: fh1 }, { u: 5.4, y: fs1, w: fw1, h: fh1 }, { u: 8.6, y: fs1, w: fw1, h: fh1 }] });
    add('trim', B(recE - recW, 0.04, fS - recS, (recW + recE) / 2, H.frame2 - 0.02, (fS + recS) / 2)); // soffit over the recessed entry
    // 2nd storey: flush front; cross-gable section rises into a wall gable with an attic window (photo 1/2)
    const y2 = H.frame2, e2 = H.frameEave;
    wall({ ...fWall, y0: y2, y1: e2, p1: [fW, fS], p2: [crossW, fS], openings: [{ u: 1.6, y: fs2, w: fw1, h: fh2 }, { u: 4.1, y: fs2, w: fw1, h: fh2 }, { u: 6.5, y: fs2, w: fw1, h: fh2 }] });
    scope({ conf: 'photo' }, () => wall({ ...fWall, y0: y2, y1: e2, p1: [crossW, fS], p2: [crossE, fS], top: L => gableProfile(L, e2, 50),
      openings: [{ u: (crossE - crossW) / 2, y: fs2, w: fw1, h: fh2 }, { u: (crossE - crossW) / 2, y: e2 + 0.35, w: 0.5, h: 0.75, arch: 'round', shutters: false }] }));
    wall({ ...fWall, y0: y2, y1: e2, p1: [fE, fN], p2: [fW, fN], openings: [{ u: 2.0, y: fs2, w: fw1, h: fh2 }, { u: 5.4, y: fs2, w: fw1, h: fh2 }, { u: 8.6, y: fs2, w: fw1, h: fh2 }] });
    // small step where the Trustees' front is set back
    wall({ ...fWall, y0, y1: e2, p1: [fE, fS], p2: [fE, pz(283.3)] });
    for (const z of [fS, fN]) add('trim', B(fE - fW, 0.26, 0.05, (fW + fE) / 2, e2 - 0.13, z + Math.sign(z) * 0.025));
    // corner boards
    for (const [x, z] of [[fE, fN], [crossW, fS], [crossE, fS]]) add('trim', B(0.14, e2 - H.ff, 0.14, x, (e2 + H.ff) / 2, z));
  }
  gableRoof({ cx: (fW + fE) / 2, cz: (fN + fS) / 2, axis: 'x', len: fE - fW, span: fS - fN, eave: H.frameEave, pitch: H.framePitch, ohE: 0.4, ohA: 0, ohB: 0, mat: 'shingle' });
  scope({ conf: 'photo' }, () => gableRoof({ cx: crossC, cz: (fS + (fN + fS) / 2) / 2, axis: 'z', len: fS - (fN + fS) / 2, span: crossE - crossW, eave: H.frameEave, pitch: 50, ohE: 0.3, ohA: 0, ohB: 0.35, mat: 'shingle', barge: { style: 'plain', ends: [1] } }));
  chimney(px(321.7), pz(241.7), 0.6, 0.6, H.frameEave, H.frameEave + (fS - fN) / 2 * tpF + 1.2, 'plan');
  note('Two-storey clapboard range with front cross-gable and small round-headed attic window', 'photo', 'Photo 1 (right), Photo 2');
  note('Recessed entry with stair from the plan', 'plan', 'plan [P257–298, 273–287]');
  // side porch with turned posts, railing and steps descending east (photo 1)
  ctx.conf = 'photo';
  {
    const x0 = fW, x1 = recE, z0 = fS, z1 = pz(310), deckY = H.ff, beam = H.ff + 3.0;
    add('porchFloor', B(x1 - x0, 0.1, z1 - z0 + (fS - recS), (x0 + x1) / 2, deckY - 0.05, (z0 + z1) / 2 - (fS - recS) / 2));
    add('lattice', B(x1 - x0, deckY - 0.2, 0.04, (x0 + x1) / 2, (deckY - 0.2) / 2, z1 - 0.05));
    const lathe = new THREE.LatheGeometry([[0.0, 0], [0.09, 0], [0.09, 0.2], [0.06, 0.28], [0.06, 0.9], [0.08, 1.05], [0.05, 1.2], [0.05, 2.3], [0.075, 2.45], [0.055, 2.6], [0.08, 2.9], [0.1, 3.0], [0, 3.0]].map(p => new THREE.Vector2(p[0], p[1])), 10);
    const pxs = [x0 + 0.5, x0 + 2.6, x0 + 4.7, x1 - 0.15];
    for (const x of pxs) add('trim', lathe.clone().translate(x, deckY, z1 - 0.12));
    for (let i = 0; i < pxs.length - 1; i++) {
      const a = pxs[i] + 0.1, b = pxs[i + 1] - 0.1;
      add('trim', B(b - a, 0.06, 0.08, (a + b) / 2, deckY + 0.95, z1 - 0.12)); add('trim', B(b - a, 0.05, 0.06, (a + b) / 2, deckY + 0.12, z1 - 0.12));
      for (let u = a + 0.08; u < b; u += 0.13) add('trim', B(0.035, 0.8, 0.035, u, deckY + 0.53, z1 - 0.12));
      // corner brackets
      for (const [xx, s] of [[a, 1], [b, -1]]) add('trim', B(0.05, 0.4, 0.06, xx + s * 0.18, beam - 0.25, z1 - 0.12).rotateZ(0));
    }
    add('trim', B(x1 - x0, 0.3, 0.18, (x0 + x1) / 2, beam + 0.15, z1 - 0.12));
    const rise = 0.5, rl = z1 - z0 + 0.35, ang = Math.atan2(rise, rl);
    add('tin', B(x1 - x0 + 0.3, 0.08, Math.hypot(rl, rise), (x0 + x1) / 2, 0, 0).rotateX(ang).translate(0, beam + 0.3 + rise / 2 + 0.05, (z0 + z1 + 0.35) / 2));
    add('ceiling', B(x1 - x0, 0.02, z1 - z0, (x0 + x1) / 2, beam + 0.3, (z0 + z1) / 2));
    for (let i = 0; i < 5; i++) add('stoneStep', B(0.3, (i + 1) * H.ff / 5, 1.3, x1 + 0.15 + (4 - i) * 0.3, (i + 1) * H.ff / 10, z1 - 0.75));
    // stair handrail
    add('trim', B(1.7, 0.05, 0.05, x1 + 0.85, deckY + 0.55, z1 - 0.1).rotateZ(0).translate(0, 0, 0));
    note('Side porch with turned posts, railing and steps', 'photo', 'Photo 1 (right of tree)');
  }

  // ======================================================================
  // TRUSTEES' EXTENSION July 1873 — dining hall below, classrooms above (documented)
  // ======================================================================
  ctx.section = 'trustees'; ctx.conf = 'plan';
  const tW = fE, tE = px(538.3), tN = pz(190), tS = pz(283.3);
  {
    const y0 = H.ff - 0.05;
    note("Dining hall on the ground floor, classrooms above; added east, July 1873", 'documented', '150 Stories #38');
    note('Footprint 19 × 8.7 m', 'plan', 'plan [P336–538, 190–283]');
    const winsF = [363.3, 388.3, 413.3, 462.7, 493.3, 520].map(px), doorX = px(439); // plan window marks on the dining-hall front
    for (const [a, b] of [[[tW, tS], [tE, tS]], [[tE, tS], [tE, tN]], [[tE, tN], [tW, tN]]]) wall({ p1: a, p2: b, y0: -0.6, y1: H.ff, t: 0.36, mat: 'stone' });
    scope({ conf: 'photo' }, () => {
      wall({ ...fWall, y0, y1: H.frame2 + 0.02, p1: [tW, tS], p2: [tE, tS], openings: [...winsF.map(x => ({ u: x - tW, y: fs1, w: fw1, h: fh1 })), { kind: 'door', u: doorX - tW, y: H.ff, w: 1.25, h: 2.7, leaves: 2, transom: 0.45 }] });
      wall({ ...fWall, y0: H.frame2, y1: H.frameEave, p1: [tW, tS], p2: [tE, tS], openings: [...winsF, doorX].map(x => ({ u: x - tW, y: fs2, w: fw1, h: fh2 })) });
    });
    note('Seven-bay front with regular shuttered 2/2 windows', 'photo', 'Photo 1 (right), Photo 2');
    const tz = tS - tN, tpT = Math.tan(H.framePitch * Math.PI / 180);
    wall({ ...fWall, y0, y1: H.frameEave, p1: [tE, tS], p2: [tE, tN], top: L => gableProfile(L, H.frameEave, H.framePitch),
      openings: [{ u: 1.6, y: fs1, w: fw1, h: fh1 }, { u: tz - 1.6, y: fs1, w: fw1, h: fh1 }, { u: 1.6, y: fs2, w: fw1, h: fh2 }, { u: tz - 1.6, y: fs2, w: fw1, h: fh2 }, { u: tz / 2, y: H.frameEave + 0.55, w: 0.55, h: 0.85, arch: 'round', shutters: false }] });
    const rear1 = [462.7, 493.3, 520].map(px), rear2 = [363.3, 388.3, 413.3, 439, 462.7, 493.3, 520].map(px);
    wall({ ...fWall, y0, y1: H.frame2 + 0.02, p1: [tE, tN], p2: [tW, tN], openings: rear1.map(x => ({ u: tE - x, y: fs1, w: fw1, h: fh1 })) });
    wall({ ...fWall, y0: H.frame2, y1: H.frameEave, p1: [tE, tN], p2: [tW, tN], openings: rear2.map(x => ({ u: tE - x, y: fs2, w: fw1, h: fh2 })) });
    for (const z of [tS, tN]) add('trim', B(tE - tW, 0.26, 0.05, (tW + tE) / 2, H.frameEave - 0.13, z + Math.sign(z) * 0.025));
    for (const [x, z] of [[tE, tS], [tE, tN], [tW, tS]]) add('trim', B(0.14, H.frameEave - H.ff, 0.14, x, (H.frameEave + H.ff) / 2, z));
    void tpT;
    // front door stoop
    for (let i = 0; i < 4; i++) add('stoneStep', B(1.9, (i + 1) * H.ff / 4, 0.32, doorX, (i + 1) * H.ff / 8, tS + 0.16 + (3 - i) * 0.3));
    gutterDown(tE - 0.2, tS + 0.25, H.frameEave); gutterDown(tE - 0.2, tN - 0.25, H.frameEave); gutterDown(tW + 0.3, tS + 0.25, H.frameEave);
  }
  gableRoof({ cx: (tW + tE) / 2, cz: (tN + tS) / 2, axis: 'x', len: tE - tW, span: tS - tN, eave: H.frameEave, pitch: H.framePitch, ohE: 0.4, ohA: 0, ohB: 0.35, mat: 'shingle', barge: { style: 'plain', ends: [1] } });
  {
    const rT = H.frameEave + (tS - tN) / 2 * tpF;
    chimney(px(532), pz(235.7), 0.7, 0.62, H.frameEave, rT + 1.3, 'plan');
    chimney(px(437), pz(236.7), 0.55, 0.55, H.frameEave, rT + 1.1, 'photo');
  }

  // ======================================================================
  // REAR SERVICE RANGE — washroom, bakery, stone annex (kitchen & laundry), coal and wood shed (documented)
  // ======================================================================
  ctx.section = 'service'; ctx.conf = 'plan';
  note('Washroom, bakery, stone annex with kitchen and laundry, coal and wood shed', 'documented', '150 Stories #38');
  {
    const bW = px(377.3), bE = px(442.7), bN = pz(122.7), bS = tN, sw = { t: 0.2, mat: 'siding', unit: frameUnit };
    wall({ p1: [bW, bN], p2: [bW, bS], y0: -0.3, y1: 0.6, t: 0.3, mat: 'stone' });
    wall({ p1: [bE, bS], p2: [bE, bN], y0: -0.3, y1: 0.6, t: 0.3, mat: 'stone' });
    wall({ ...sw, p1: [bW, bN], p2: [bW, bS], y0: 0.55, y1: 3.5, openings: [{ u: 1.6, y: 1.3, w: 0.85, h: 1.5 }, { kind: 'door', u: 4.4, y: 0.6, w: 0.95, h: 2.3, transom: 0 }] });
    wall({ ...sw, p1: [bE, bS], p2: [bE, bN], openings: [{ u: 1.7, y: 1.3, w: 0.85, h: 1.5 }, { u: 4.6, y: 1.3, w: 0.85, h: 1.5 }], y0: 0.55, y1: 3.5 });
    gableRoof({ cx: (bW + bE) / 2, cz: (bN + bS) / 2, axis: 'z', len: bS - bN, span: bE - bW, eave: 3.5, pitch: 35, ohE: 0.35, ohA: 0, ohB: 0, mat: 'shingle' });
    // stone annex (kitchen & laundry) + frame coal/wood shed under one roof
    const aW = px(368.3), aM = px(471.7), aE = px(587.3), aN = pz(62.7), aS = pz(122.7);
    const st = { t: 0.5, mat: 'annexStone', unit: { style: 'brick', inset: 0.28 } };
    wall({ ...st, p1: [aW, aS], p2: [bW, aS], y0: -0.3, y1: 3.3, openings: [{ u: 0.65, y: 1.1, w: 0.8, h: 1.4, shutters: false }] });
    wall({ ...st, p1: [bE, aS], p2: [aM, aS], y0: -0.3, y1: 3.3, openings: [{ kind: 'door', u: 1.5, y: 0.25, w: 1.0, h: 2.2, transom: 0, style: 'brick', inset: 0.28 }, { u: 3.2, y: 1.1, w: 0.8, h: 1.4, shutters: false }] });
    wall({ ...st, p1: [aM, aN], p2: [aW, aN], y0: -0.3, y1: 3.3, openings: [{ u: 2.6, y: 1.1, w: 0.8, h: 1.4, shutters: false }, { u: 6.6, y: 1.1, w: 0.8, h: 1.4, shutters: false }] });
    wall({ ...st, p1: [aW, aN], p2: [aW, aS], y0: -0.3, y1: 3.3, top: L => gableProfile(L, 3.3, 38), openings: [{ u: (aS - aN) / 2, y: 1.1, w: 0.8, h: 1.4, shutters: false }, { u: (aS - aN) / 2, y: 3.6, w: 0.45, h: 0.6, kind: 'blank' }] });
    const cs = { t: 0.18, mat: 'batten', unit: frameUnit };
    wall({ ...cs, p1: [aM, aS], p2: [aE, aS], y0: 0.1, y1: 3.3, openings: [{ u: 3.0, y: 1.4, w: 0.7, h: 0.9, shutters: false, cols: 1 }, { u: 7.5, y: 1.4, w: 0.7, h: 0.9, shutters: false, cols: 1 }] });
    wall({ ...cs, p1: [aE, aS], p2: [aE, aN], y0: 0.1, y1: 3.3, top: L => gableProfile(L, 3.3, 38), openings: [{ kind: 'door', u: (aS - aN) / 2, y: 0.1, w: 2.3, h: 2.5, leaves: 2, transom: 0 }] });
    wall({ ...cs, p1: [aE, aN], p2: [aM, aN], y0: 0.1, y1: 3.3 });
    for (const [a, b] of [[[aM, aS], [aE, aS]], [[aE, aS], [aE, aN]], [[aE, aN], [aM, aN]]]) wall({ p1: a, p2: b, y0: -0.3, y1: 0.12, t: 0.26, mat: 'stone' });
    gableRoof({ cx: (aW + aE) / 2, cz: (aN + aS) / 2, axis: 'x', len: aE - aW, span: aS - aN, eave: 3.3, pitch: 38, ohE: 0.35, ohA: 0.3, ohB: 0.3, mat: 'shingle', barge: { style: 'plain' } });
    chimney(px(464), pz(92.7), 0.85, 0.75, 3.3, 3.3 + (aS - aN) / 2 * Math.tan(38 * Math.PI / 180) + 1.3, 'plan');
  }

  // ======================================================================
  // assemble merged meshes
  // ======================================================================
  const root = new THREE.Group(); root.name = 'Foxleigh_Mansion_' + VERSION;
  const groups = {};
  for (const k of Object.keys(SECTIONS)) { const g = new THREE.Group(); g.name = k; g.userData.label = SECTIONS[k]; root.add(g); groups[k] = g; }
  let tris = 0;
  for (const [key, list] of buckets) {
    const [section, mat, conf] = key.split('|');
    const geo = mergeGeometries(list, false);
    worldUV(geo, MAT[mat].userData.tile || 1);
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, MAT[mat]);
    mesh.name = `${section}_${mat}_${conf}`; mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData = { section, material: mat, confidence: conf };
    groups[section].add(mesh); tris += geo.attributes.position.count / 3;
  }
  root.userData = { version: VERSION, units: 'metres', origin: 'centre of brick mansion main rectangle at grade; +x east along long axis, +z toward porch (front)', features, triangles: tris };
  return { root, groups, materials: MAT, features, triangles: tris };
}

// UVs in metres on the plane of each triangle: u horizontal along the face, v up the face (or up-slope).
function worldUV(geo, tile) {
  const p = geo.attributes.position, n = p.count, uv = new Float32Array(n * 2);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), nr = new THREE.Vector3(), t = new THREE.Vector3(), bt = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    nr.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b));
    if (nr.lengthSq() < 1e-14) continue; nr.normalize();
    if (Math.abs(nr.y) > 0.97) { t.set(1, 0, 0); bt.set(0, 0, nr.y > 0 ? -1 : 1); }
    else { t.set(nr.z, 0, -nr.x).normalize(); bt.crossVectors(nr, t).normalize(); }
    for (let k = 0; k < 3; k++) {
      const v = [a, b, c][k];
      uv[(i + k) * 2] = v.dot(t) / tile; uv[(i + k) * 2 + 1] = v.dot(bt) / tile;
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

// Confidence (evidence) materials for the inspection view
export function confidenceMaterials() {
  const out = {};
  for (const [k, v] of Object.entries(CONFIDENCE)) out[k] = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.8 });
  return out;
}
