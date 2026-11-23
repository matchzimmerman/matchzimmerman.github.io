/* =====================================================================
   ORANGUTAN 001 · PHOTOREAL fork · BODY (everything you see)
   ---------------------------------------------------------------------
   Built in code, every load; no meshes, rigs, textures or templates are
   loaded. The body follows the brain's joints and never writes to them.

   1. SKIN  one continuous surface per region (torso + limbs, head, each
            hand and foot), sculpted as a signed-distance field from the
            anatomy and meshed with naive surface nets. Weights come from
            the same field (each joint owns the shapes it carries), so
            the surface folds at the joints instead of breaking at seams.
            The region meshes overlap at the neck, wrists and ankles,
            under the coat.
   2. FACE  eye sockets, lids, muzzle, lips, nostrils, ears in the field;
            eyeballs with a code-painted iris and a wet clear coat; lids
            that blink and follow the eyes' pitch.
   3. COAT  strand hair on the GPU: every strand is rooted on the skin,
            skinned with its root, combed by region, bent by gravity,
            wind and the body's own motion, clumped, and shaded with a
            two-lobe Kajiya-Kay model plus backlit transmission. It casts
            and receives the key light's shadow.

   Evidence tags (HARIL STUDIO #64, MZ.GPT addendum 2026-11-23):
     MEASURED  none of the coat lengths, densities, colours, skin or eye
               values here are measurements of an adult female P. pygmaeus.
     EVIDENCE-SHAPED  qualitative constraints followed: coat lengths vary
               widely by region (Hartmann 1886: 2–23.5 cm; Carlitz 2014:
               > 40 cm in some captive Pongo), forearm hair runs toward the
               elbow, crown hair lies flat from a parting, chest/belly sparse,
               face, ears and hand backs short (Hartmann 1886; Kuze 2005);
               sclera brownish and lighter than the iris with a darker ring
               and a fine grey demarcation (Caspar 2021); dark periocular /
               perioral skin with lighter lids kept (Kuze 2005); bare creased
               palms and soles; no ischial callosities.
     ARTISTIC  every number below that is not one of the above.
   ===================================================================== */

export const BODY_VERSION = 'orangutan-001 photoreal · body P1 · 2026-11-22';

// skin + coat colours: ARTISTIC (sRGB), chosen by eye against Batang (Smithsonian NZP, CC0, reference only)
export const LOOK = {
  skin: '#2c231f', skinHair: '#30261f', face: '#2a201b', eyeRing: '#1d1612', lid: '#6f5546', mottle: '#76574a', lip: '#1f1714', nose: '#251c18',
  palm: '#3b302a', nail: '#463a32',
  hairRoot: '#4a2216', undercoat: '#3a1d12', hairMid: '#86391e', hairTip: '#b8602f',
  sclera: '#6a4e3c', scleraRing: '#33241b', irisEdge: '#6b6661', iris: '#3a2214', irisFleck: '#6a4122', pupil: '#060403',
};

export function createBody(THREE, brain, opts = {}) {
  const Q = Object.assign({ hair: 120000, skinRes: 1, seed: 4242 }, opts);
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lin = hex => new THREE.Color(hex); // THREE.Color parses hex as sRGB and stores linear
  let rs = Q.seed >>> 0 || 1;
  const rnd = () => { rs = rs + 0x6D2B79F5 | 0; let t = Math.imul(rs ^ rs >>> 15, 1 | rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rr = (a, b) => a + (b - a) * rnd();
  const t0 = performance.now(), STATS = {};

  // =================================================================
  // 0. bones: one per brain joint, in the rest pose
  // =================================================================
  const K = brain.skeleton, A = brain.anatomy;
  brain.bindPose();
  const BONES = []; // { name, obj, part, kind, side, bind (Matrix4), inv (Matrix4), s (uniform scale) }
  const addBone = (name, obj, part, kind, side = 0, extra = {}) => { const bind = obj.matrixWorld.clone(); const b = Object.assign({ i: BONES.length, name, obj, part, kind, side, bind, inv: bind.clone().invert(), s: V3().setFromMatrixScale(bind).x }, extra); BONES.push(b); return b; };
  const bPelvis = addBone('pelvis', K.pelvis, 'torso', 'pelvis'), bChest = addBone('chest', K.chest, 'torso', 'chest');
  const bNeck = addBone('neck', K.neck, 'torso', 'neck'), bHead = addBone('head', K.head, 'head', 'head');
  const LB = {};
  for (const l of K.limbs) {
    const arm = l.kind === 'arm', P = arm ? 'hand' : 'foot', sd = l.side > 0 ? 'L' : 'R';
    const r = { l, up: addBone(l.name + '.up', l.up, 'torso', arm ? 'upperArm' : 'thigh', l.side, { len: l.l1 }), lo: addBone(l.name + '.lo', l.lo, 'torso', arm ? 'foreArm' : 'shank', l.side, { len: l.l2 }),
      end: addBone(l.name + '.end', l.end.g, P + sd, arm ? 'hand' : 'foot', l.side), digits: [] };
    const D = arm ? l.end.fingers : l.end.toes, Lens = arm ? A.finger : A.toe;
    D.forEach((ch, i) => ch.forEach((j, k) => r.digits.push(addBone(`${l.name}.d${i}${k}`, j, P + sd, 'digit', l.side, { len: Lens[k], tip: k === ch.length - 1, k, di: i }))));
    const T = arm ? l.end.thumb : l.end.hallux, TL = arm ? A.thumb : A.hallux;
    T.forEach((j, k) => r.digits.push(addBone(`${l.name}.t${k}`, j, P + sd, 'digit', l.side, { len: TL[k], tip: k === T.length - 1, k, thumb: true })));
    LB[l.name] = r;
  }
  STATS.bones = BONES.length;

  // =================================================================
  // 1. the anatomy as a signed-distance field (bone-local shapes, ARTISTIC proportions on the brain's #63 lengths)
  // =================================================================
  const PRIMS = [];
  const _m3 = new THREE.Matrix3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
  // ellipsoid: centre c, radii r, optional local rotation rot (euler xyz), all in the bone's own frame
  function ell(bone, parts, c, r, k = 0.02, op = 1, rot = null) {
    const M = bone.bind, s = bone.s, cw = V3(...c).applyMatrix4(M);
    const R = new THREE.Matrix4().extractRotation(M); if (rot) R.multiply(new THREE.Matrix4().makeRotationFromEuler(_e.set(...rot)));
    const e = R.elements; // world <- local columns; we need local = R^T d
    const rad = r.map(x => x * s), m = Math.max(...rad) + k + 0.004;
    PRIMS.push({ bone: bone.i, parts, kind: 0, op, k, cx: cw.x, cy: cw.y, cz: cw.z, R: [e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]], rx: rad[0], ry: rad[1], rz: rad[2],
      box: [cw.x - m, cw.y - m, cw.z - m, cw.x + m, cw.y + m, cw.z + m] });
  }
  const sph = (bone, parts, c, r, k, op) => ell(bone, parts, c, [r, r, r], k, op);
  // round cone from a (radius ra) to b (radius rb)
  function cone(bone, parts, a, b, ra, rb, k = 0.02, op = 1) {
    const M = bone.bind, s = bone.s, aw = V3(...a).applyMatrix4(M), bw = V3(...b).applyMatrix4(M); ra *= s; rb *= s;
    const m = Math.max(ra, rb) + k + 0.004;
    PRIMS.push({ bone: bone.i, parts, kind: 1, op, k, ax: aw.x, ay: aw.y, az: aw.z, bx: bw.x, by: bw.y, bz: bw.z, ra, rb,
      box: [Math.min(aw.x, bw.x) - m, Math.min(aw.y, bw.y) - m, Math.min(aw.z, bw.z) - m, Math.max(aw.x, bw.x) + m, Math.max(aw.y, bw.y) + m, Math.max(aw.z, bw.z) + m] });
  }
  const T_ = ['torso'], H_ = ['head'], TH = ['torso', 'head'];
  // --- trunk (pelvis frame; chest frame is in trunk-local units, ×0.9 in the world) ---
  ell(bPelvis, T_, [0, 0.0, -0.035], [0.15, 0.092, 0.112], 0.05);                 // seat and hips (no ischial callosities: none are modelled)
  ell(bChest, T_, [0, 0.035, -0.012], [0.132, 0.085, 0.11], 0.05);                // waist
  ell(bChest, T_, [0, 0.135, 0.04], [0.142, 0.15, 0.138], 0.05);                  // the pot belly
  ell(bChest, T_, [0, 0.285, 0.0], [0.152, 0.122, 0.112], 0.05);                  // ribcage
  ell(bChest, T_, [0, 0.355, -0.022], [0.178, 0.066, 0.092], 0.045);              // shoulder girdle
  ell(bChest, T_, [0, 0.405, -0.034], [0.095, 0.05, 0.072], 0.04);                // trapezius into the neck
  cone(bNeck, TH, [0, -0.035, 0], [0, 0.065, 0.01], 0.07, 0.06, 0.035);           // neck
  ell(bNeck, TH, [0, 0.005, 0.052], [0.05, 0.04, 0.034], 0.03);                   // small throat sac (adult; small in females, ARTISTIC size)
  // --- head (head frame: +Z the face, origin at the top of the neck) ---
  ell(bHead, H_, [0, 0.098, -0.012], [0.073, 0.084, 0.078], 0.03);               // cranium
  ell(bHead, H_, [0, 0.128, 0.032], [0.056, 0.05, 0.04], 0.03);                  // high, rounded forehead
  ell(bHead, H_, [0, 0.07, 0.046], [0.061, 0.062, 0.04], 0.022);                 // face plate (females: no cheek flanges)
  ell(bHead, H_, [0, 0.026, 0.042], [0.058, 0.046, 0.05], 0.025);                // jaw
  for (const s of [1, -1]) {
    ell(bHead, H_, [0.045 * s, 0.052, 0.062], [0.024, 0.024, 0.024], 0.02);      // cheeks
    ell(bHead, H_, [0.027 * s, 0.078, 0.084], [0.02, 0.017, 0.015], 0.008);      // eye mound
    ell(bHead, H_, [0.08 * s, 0.075, -0.006], [0.008, 0.018, 0.014], 0.008);     // small ears
  }
  cone(bHead, H_, [-0.04, 0.097, 0.083], [0.04, 0.097, 0.083], 0.007, 0.007, 0.02);   // low, soft brow ridge
  ell(bHead, H_, [0, 0.032, 0.084], [0.05, 0.038, 0.045], 0.02);                 // prognathic muzzle
  ell(bHead, H_, [0, 0.021, 0.113], [0.037, 0.017, 0.019], 0.012);               // upper lip
  ell(bHead, H_, [0, -0.002, 0.1], [0.034, 0.02, 0.02], 0.018);                  // lower lip and chin
  ell(bHead, H_, [0, 0.058, 0.114], [0.015, 0.012, 0.0055], 0.01);              // flat nose pad
  // subtractive detail (after all the additive shapes)
  const SUBS = () => {
    for (const s of [1, -1]) {
      sph(bHead, H_, [0.026 * s, 0.077, 0.0905], 0.0128, 0.003, -1);             // eye socket opening
      ell(bHead, H_, [0.0062 * s, 0.0535, 0.1195], [0.0022, 0.0028, 0.003], 0.0025, -1); // small nostrils
      ell(bHead, H_, [0.085 * s, 0.075, -0.003], [0.004, 0.011, 0.008], 0.003, -1); // ear hollow
    }
    ell(bHead, H_, [0, 0.0095, 0.121], [0.031, 0.0016, 0.008], 0.004, -1);       // mouth line
  };
  // --- limbs (segment frames: the bone runs along local -Y; +Z is the bend side: elbow (back) / knee (front)) ---
  for (const name in LB) {
    const r = LB[name], arm = r.l.kind === 'arm', L1 = r.up.len, L2 = r.lo.len, sd = r.l.side > 0 ? 'L' : 'R', E = [(arm ? 'hand' : 'foot') + sd];
    if (arm) {
      sph(r.up, T_, [0, 0, 0], 0.052, 0.03);                                       // deltoid / shoulder joint
      cone(r.up, T_, [0, 0, 0], [0, -L1, 0], 0.047, 0.035, 0.03);
      ell(r.up, T_, [0, -0.45 * L1, -0.008], [0.041, 0.12, 0.039], 0.025);         // upper-arm muscle
      cone(r.lo, T_, [0, 0.01, 0], [0, -L2, 0], 0.038, 0.026, 0.025);
      ell(r.lo, T_, [0, -0.3 * L2, 0.004], [0.037, 0.11, 0.033], 0.022);           // forearm muscle
    } else {
      sph(r.up, T_, [0, 0, 0], 0.06, 0.035);
      cone(r.up, T_, [0, 0, 0], [0, -L1, 0], 0.066, 0.046, 0.03);
      ell(r.up, T_, [0, -0.4 * L1, 0.006], [0.058, 0.1, 0.056], 0.025);
      cone(r.lo, T_, [0, 0.01, 0], [0, -L2, 0], 0.046, 0.03, 0.025);
      ell(r.lo, T_, [0, -0.33 * L2, -0.012], [0.04, 0.085, 0.04], 0.02);           // calf
    }
    // hand (local -Y toward the fingers, +Z the back of the hand) / foot (-Y toward the toes, +Z the top of the foot)
    if (arm) {
      cone(r.end, E, [0, 0.03, 0], [0, -0.012, 0], 0.027, 0.025, 0.012);           // wrist
      ell(r.end, E, [0, -0.046, 0.0], [0.038, 0.05, 0.0165], 0.014);              // palm
      ell(r.end, E, [0, -0.012, -0.006], [0.028, 0.02, 0.016], 0.012);            // heel of the hand
      cone(r.end, E, [-0.03, -0.082, 0.002], [0.03, -0.082, 0.002], 0.0125, 0.0125, 0.008); // knuckle row
      ell(r.end, E, [-0.03 * r.l.side, -0.032, -0.008], [0.014, 0.022, 0.013], 0.01); // thenar pad
    } else {
      cone(r.end, E, [0, 0.0, 0.035], [0, -0.008, -0.012], 0.033, 0.03, 0.015);    // ankle
      sph(r.end, E, [0, 0.012, -0.036], 0.026, 0.015);                            // heel
      ell(r.end, E, [0, -0.062, -0.036], [0.037, 0.07, 0.019], 0.015);            // sole
      cone(r.end, E, [-0.03, -A.sole + 0.004, -0.04], [0.032, -A.sole + 0.004, -0.04], 0.012, 0.012, 0.008);
    }
    for (const d of r.digits) {
      const rad = (arm ? 0.0088 : 0.0092) - d.k * 0.0011 + (d.thumb ? 0.0012 : 0);
      cone(d, E, [0, 0, 0], [0, -d.len, 0], rad, rad * 0.92, 0.0045);
      if (d.tip) ell(d, E, [0, -d.len, -0.001], [rad * 0.95, rad * 0.9, rad * 0.85], 0.004); // finger pad
    }
  }
  SUBS();
  STATS.prims = PRIMS.length;

  // SDF evaluation of one primitive at a point
  function sdPrim(P, x, y, z) {
    if (P.kind === 0) {
      const dx = x - P.cx, dy = y - P.cy, dz = z - P.cz, R = P.R;
      const lx = dx * R[0] + dy * R[1] + dz * R[2], ly = dx * R[3] + dy * R[4] + dz * R[5], lz = dx * R[6] + dy * R[7] + dz * R[8];
      const k0 = Math.hypot(lx / P.rx, ly / P.ry, lz / P.rz), k1 = Math.hypot(lx / (P.rx * P.rx), ly / (P.ry * P.ry), lz / (P.rz * P.rz));
      return k1 < 1e-9 ? -Math.min(P.rx, P.ry, P.rz) : k0 * (k0 - 1) / k1;
    }
    // round cone (Inigo Quilez)
    const bax = P.bx - P.ax, bay = P.by - P.ay, baz = P.bz - P.az, l2 = bax * bax + bay * bay + baz * baz, rd = P.ra - P.rb, a2 = l2 - rd * rd, il2 = 1 / l2;
    const pax = x - P.ax, pay = y - P.ay, paz = z - P.az, yy = pax * bax + pay * bay + paz * baz, zz = yy - l2;
    const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy, x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * l2, z2 = zz * zz * l2;
    const k = Math.sign(rd) * rd * rd * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - P.rb;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - P.ra;
    return (Math.sqrt(x2 * a2 * il2) + yy * rd) * il2 - P.ra;
  }
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const smax = (a, b, k) => -smin(-a, -b, k);

  // =================================================================
  // 2. mesh each region: field on a grid, naive surface nets, normals from the field's gradient
  // =================================================================
  const PARTS = { torso: 0.005, head: 0.0019, handL: 0.0021, handR: 0.0021, footL: 0.0023, footR: 0.0023 }; // voxel size (m) per region
  function meshPart(part) {
    const h = PARTS[part] / Q.skinRes, prims = PRIMS.filter(p => p.parts.includes(part));
    const bb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
    for (const p of prims) if (p.op > 0) for (let i = 0; i < 3; i++) { bb[i] = Math.min(bb[i], p.box[i]); bb[i + 3] = Math.max(bb[i + 3], p.box[i + 3]); }
    const ox = bb[0] - 2 * h, oy = bb[1] - 2 * h, oz = bb[2] - 2 * h;
    const nx = Math.ceil((bb[3] - bb[0]) / h) + 5, ny = Math.ceil((bb[4] - bb[1]) / h) + 5, nz = Math.ceil((bb[5] - bb[2]) / h) + 5;
    const F = new Float32Array(nx * ny * nz).fill(1);
    const id = (i, j, k) => i + nx * (j + ny * k);
    for (const p of [...prims.filter(p => p.op > 0), ...prims.filter(p => p.op < 0)]) {
      const i0 = Math.max(0, Math.floor((p.box[0] - ox) / h)), i1 = Math.min(nx - 1, Math.ceil((p.box[3] - ox) / h));
      const j0 = Math.max(0, Math.floor((p.box[1] - oy) / h)), j1 = Math.min(ny - 1, Math.ceil((p.box[4] - oy) / h));
      const k0 = Math.max(0, Math.floor((p.box[2] - oz) / h)), k1 = Math.min(nz - 1, Math.ceil((p.box[5] - oz) / h));
      for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const n = id(i, j, k), d = sdPrim(p, ox + i * h, oy + j * h, oz + k * h);
        F[n] = p.op > 0 ? smin(F[n], d, p.k) : smax(F[n], -d, p.k);
      }
    }
    // surface nets
    const cx = nx - 1, cy = ny - 1, cz = nz - 1, cell = new Int32Array(cx * cy * cz).fill(-1), P = [];
    const cid = (i, j, k) => i + cx * (j + cy * k);
    const EDG = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    const v = new Float32Array(8);
    for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
      let mask = 0;
      for (let c = 0; c < 8; c++) { const val = F[id(i + (c & 1), j + (c >> 1 & 1), k + (c >> 2 & 1))]; v[c] = val; if (val < 0) mask |= 1 << c; }
      if (mask === 0 || mask === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (const [a, b] of EDG) { if ((v[a] < 0) === (v[b] < 0)) continue; const t = v[a] / (v[a] - v[b]);
        sx += (a & 1) + ((b & 1) - (a & 1)) * t; sy += (a >> 1 & 1) + ((b >> 1 & 1) - (a >> 1 & 1)) * t; sz += (a >> 2 & 1) + ((b >> 2 & 1) - (a >> 2 & 1)) * t; n++; }
      cell[cid(i, j, k)] = P.length / 3; P.push(ox + (i + sx / n) * h, oy + (j + sy / n) * h, oz + (k + sz / n) * h);
    }
    const I = [];
    const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) I.push(a, c, b, a, d, c); else I.push(a, b, c, a, c, d); };
    for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const in0 = F[id(i, j, k)] < 0;
      if (i < cx && in0 !== (F[id(i + 1, j, k)] < 0)) quad(cell[cid(i, j - 1, k - 1)], cell[cid(i, j, k - 1)], cell[cid(i, j, k)], cell[cid(i, j - 1, k)], !in0);
      if (j < cy && in0 !== (F[id(i, j + 1, k)] < 0)) quad(cell[cid(i - 1, j, k - 1)], cell[cid(i - 1, j, k)], cell[cid(i, j, k)], cell[cid(i, j, k - 1)], !in0);
      if (k < cz && in0 !== (F[id(i, j, k + 1)] < 0)) quad(cell[cid(i - 1, j - 1, k)], cell[cid(i, j - 1, k)], cell[cid(i, j, k)], cell[cid(i - 1, j, k)], !in0);
    }
    // normals: trilinear gradient of the field
    const sample = (x, y, z) => {
      const fx = clamp((x - ox) / h, 0, nx - 1.001), fy = clamp((y - oy) / h, 0, ny - 1.001), fz = clamp((z - oz) / h, 0, nz - 1.001);
      const i = fx | 0, j = fy | 0, k = fz | 0, u = fx - i, w = fy - j, t = fz - k;
      const c00 = F[id(i, j, k)] * (1 - u) + F[id(i + 1, j, k)] * u, c10 = F[id(i, j + 1, k)] * (1 - u) + F[id(i + 1, j + 1, k)] * u;
      const c01 = F[id(i, j, k + 1)] * (1 - u) + F[id(i + 1, j, k + 1)] * u, c11 = F[id(i, j + 1, k + 1)] * (1 - u) + F[id(i + 1, j + 1, k + 1)] * u;
      return (c00 * (1 - w) + c10 * w) * (1 - t) + (c01 * (1 - w) + c11 * w) * t;
    };
    const N = new Float32Array(P.length), e = h * 0.75;
    for (let q = 0; q < P.length; q += 3) {
      const x = P[q], y = P[q + 1], z = P[q + 2];
      let gx = sample(x + e, y, z) - sample(x - e, y, z), gy = sample(x, y + e, z) - sample(x, y - e, z), gz = sample(x, y, z + e) - sample(x, y, z - e);
      const L = Math.hypot(gx, gy, gz) || 1; N[q] = gx / L; N[q + 1] = gy / L; N[q + 2] = gz / L;
    }
    return { part, P: new Float32Array(P), N, I: P.length / 3 > 65535 ? new Uint32Array(I) : new Uint16Array(I), prims, h, voxels: nx * ny * nz };
  }

  // =================================================================
  // 3. weights from the field, regions for colour / surface / coat
  // =================================================================
  const _v = V3(), _l = V3();
  function localIn(bone, x, y, z) { return _l.set(x, y, z).applyMatrix4(bone.inv); }
  // which part of the skin is this? returns a region id and its look
  const REG = { body: 0, face: 1, eyeRing: 2, lid: 3, muzzle: 4, lip: 5, nose: 6, ear: 7, palm: 8, nail: 9, back: 10 };
  function headRegion(x, y, z) {
    const p = localIn(bHead, x, y, z);
    for (const s of [1, -1]) {
      const dx = p.x - 0.026 * s, dy = p.y - 0.077, dz = p.z - 0.088, d = Math.hypot(dx, dy, dz);
      if (d < 0.0165 && dy > 0.0035 && p.z > 0.091) return REG.lid;                 // light upper lids (kept in adult females, Kuze 2005)
      if (d < 0.021) return REG.eyeRing;
      if (Math.hypot(p.x - 0.082 * s, p.y - 0.075, p.z + 0.005) < 0.022) return REG.ear;
    }
    if (p.z > 0.108 && Math.abs(p.y - 0.0095) < 0.006 && Math.abs(p.x) < 0.036) return REG.lip;
    if (p.z > 0.108 && Math.abs(p.y - 0.056) < 0.014 && Math.abs(p.x) < 0.018) return REG.nose;
    if (p.z > 0.06 && p.y < 0.05 && Math.abs(p.x) < 0.055) return REG.muzzle;
    const fx = p.x / 0.068, fy = (p.y - 0.06) / 0.09;
    if (p.z > 0.04 && fx * fx + fy * fy < 1) return REG.face;
    return REG.body;
  }
  function endRegion(bone, x, y, z) { // hands and feet: bare palm / sole side, nails on the tips
    const p = localIn(bone, x, y, z);
    if (bone.kind === 'digit') { if (bone.tip && p.z > 0.002 && p.y < -bone.len * 0.45) return REG.nail; return p.z < 0.001 ? REG.palm : REG.back; }
    if (bone.kind === 'hand') return p.z < 0.0 || p.y > 0.02 && p.z < 0.01 ? REG.palm : REG.back;
    return p.z < -0.042 ? REG.palm : REG.back;
  }
  const REGLOOK = { // colour, roughness, pores, wrinkles, scatter: ARTISTIC
    [REG.body]: [LOOK.skin, 0.62, 0.5, 0.2, 0.6], [REG.back]: [LOOK.skinHair, 0.62, 0.6, 0.35, 0.6], [REG.face]: [LOOK.face, 0.5, 1.0, 0.7, 0.8],
    [REG.eyeRing]: [LOOK.eyeRing, 0.45, 0.6, 1.0, 0.7], [REG.lid]: [LOOK.lid, 0.5, 0.5, 0.9, 1.0], [REG.muzzle]: [LOOK.face, 0.48, 1.0, 0.6, 0.8],
    [REG.lip]: [LOOK.lip, 0.5, 0.3, 0.6, 0.9], [REG.nose]: [LOOK.face, 0.42, 1.0, 0.3, 0.7], [REG.ear]: [LOOK.face, 0.55, 0.6, 0.5, 1.0],
    [REG.palm]: [LOOK.palm, 0.7, 0.4, 1.0, 0.5], [REG.nail]: [LOOK.nail, 0.3, 0.0, 0.2, 0.2],
  };
  // cheap 3D value noise for mottling (deterministic)
  const hsh = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, y, z) => { const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), u = x - i, v = y - j, w = z - k; const f = t => t * t * (3 - 2 * t), a = f(u), b = f(v), c = f(w);
    const L = (o, p, q) => hsh(i + o, j + p, k + q); return (((L(0, 0, 0) * (1 - a) + L(1, 0, 0) * a) * (1 - b) + (L(0, 1, 0) * (1 - a) + L(1, 1, 0) * a) * b) * (1 - c) + ((L(0, 0, 1) * (1 - a) + L(1, 0, 1) * a) * (1 - b) + (L(0, 1, 1) * (1 - a) + L(1, 1, 1) * a) * b) * c); };

  function finishPart(M) {
    const nv = M.P.length / 3, bonesHere = [...new Set(M.prims.filter(p => p.op > 0).map(p => p.bone))];
    const sigma = M.part === 'torso' ? 0.02 : M.part === 'head' ? 0.012 : 0.0035;
    const SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4), COL = new Float32Array(nv * 3), SP = new Float32Array(nv * 4), RG = new Uint8Array(nv), PB = new Uint16Array(nv);
    const ds = new Float32Array(BONES.length), c = new THREE.Color(), cm = lin(LOOK.mottle), cu = lin(LOOK.undercoat);
    for (let q = 0; q < nv; q++) {
      const x = M.P[q * 3], y = M.P[q * 3 + 1], z = M.P[q * 3 + 2];
      for (const b of bonesHere) ds[b] = 1e9;
      for (const p of M.prims) if (p.op > 0) ds[p.bone] = Math.min(ds[p.bone], sdPrim(p, x, y, z));
      const w = bonesHere.map(b => [b, Math.exp(-Math.max(0, ds[b]) / sigma)]).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const tot = w.reduce((s, a) => s + a[1], 0) || 1;
      for (let k = 0; k < 4; k++) { SI[q * 4 + k] = w[k] ? w[k][0] : 0; SW[q * 4 + k] = w[k] ? w[k][1] / tot : 0; }
      const pb = BONES[w[0][0]]; PB[q] = pb.i;
      const reg = M.part === 'head' && pb === bHead ? headRegion(x, y, z) : (pb.kind === 'hand' || pb.kind === 'foot' || pb.kind === 'digit') ? endRegion(pb, x, y, z) : REG.body;
      RG[q] = reg; const L = REGLOOK[reg]; c.set(L[0]);
      if (reg === REG.muzzle || reg === REG.eyeRing || reg === REG.face) { const m = smooth(0.35, 0.85, vnoise(x * 55, y * 55, z * 55)) * (reg === REG.muzzle ? 0.22 : 0.08); c.lerp(cm, m); } // a few paler patches, not a uniformly black face (Kuze 2005)
      if (reg === REG.body || reg === REG.back) { const rule = coatAt(M.part, pb, reg, x, y, z); if (rule) c.lerp(cu, clamp(rule[2], 0, 1) * (rule[0] > 0.03 ? 0.55 : 0.25)); }
      const g = 0.92 + 0.16 * vnoise(x * 40 + 7, y * 40, z * 40); COL[q * 3] = c.r * g; COL[q * 3 + 1] = c.g * g; COL[q * 3 + 2] = c.b * g;
      SP[q * 4] = L[1]; SP[q * 4 + 1] = L[2]; SP[q * 4 + 2] = L[3]; SP[q * 4 + 3] = L[4];
    }
    Object.assign(M, { SI, SW, COL, SP, RG, PB });
    return M;
  }

  const MESHES = {};
  for (const part in PARTS) { const M = finishPart(meshPart(part)); MESHES[part] = M; STATS['verts_' + part] = M.P.length / 3; STATS['tris_' + part] = M.I.length / 3; }
  STATS.skinMs = Math.round(performance.now() - t0);

  // =================================================================
  // 4. the skeleton and the skin material (physically based, scattering wrap, procedural pores and creases)
  // =================================================================
  const root = new THREE.Group(); root.name = 'ORANGUTAN 001 · photoreal body';
  const tBones = BONES.map(b => { const o = new THREE.Bone(); o.name = b.name; o.matrixAutoUpdate = false; o.matrixWorldAutoUpdate = false; o.matrixWorld.copy(b.bind); return o; });
  const skeleton = new THREE.Skeleton(tBones, BONES.map(b => b.inv.clone()));

  const SSS_CHUNK = THREE.ShaderChunk.lights_physical_pars_fragment.replace(
    'vec3 irradiance = dotNL * directLight.color;',
    `vec3 irradiance = dotNL * directLight.color;
	// skin: light bleeds past the terminator and reddens (wrap + tint; an approximation, not a measured scattering profile)
	float ndl = dot( geometryNormal, directLight.direction );
	vec3 wrapW = vec3( 0.42, 0.22, 0.14 ) * vSkin.w;
	vec3 wrapped = saturate( ( vec3( ndl ) + wrapW ) / ( 1.0 + wrapW ) );
	vec3 irradianceSSS = wrapped * directLight.color;`).replace(
    'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );',
    'reflectedLight.directDiffuse += irradianceSSS * BRDF_Lambert( material.diffuseColor );');
  if (SSS_CHUNK === THREE.ShaderChunk.lights_physical_pars_fragment) console.warn('body: scattering patch did not apply');
  const NOISE_GLSL = `
    float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
    float ridge(vec3 p){ return 1.0 - abs(vn(p) * 2.0 - 1.0); }`;
  function skinMaterial() {
    const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, metalness: 0, specularIntensity: 0.55, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new THREE.Color('#5a3a2c') });
    m.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 skinP; varying vec4 vSkin; varying vec3 vBind;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSkin = skinP; vBind = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vSkin; varying vec3 vBind;' + NOISE_GLSL)
        .replace('#include <lights_physical_pars_fragment>', SSS_CHUNK)
        .replace('#include <roughnessmap_fragment>', `float roughnessFactor = roughness * vSkin.x / 0.55;
          float pores = vn(vBind * 2600.0) * 0.6 + vn(vBind * 5200.0) * 0.4;
          float creases = ridge(vBind * vec3(260.0, 420.0, 300.0)) * 0.7 + ridge(vBind * 900.0) * 0.3;
          roughnessFactor = clamp(roughnessFactor + (pores - 0.5) * 0.12 * vSkin.y, 0.18, 1.0);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          { // procedural bump: pores everywhere skin shows, creases on palms, soles, lids and face (ARTISTIC scales)
            float hgt = (pores - 0.5) * 0.000022 * vSkin.y - pow(creases, 6.0) * 0.00012 * vSkin.z;
            vec3 sP = dFdx(-vViewPosition), tP = dFdy(-vViewPosition); vec3 R1 = cross(tP, normal), R2 = cross(normal, sP);
            float det = dot(sP, R1) * faceDirection; float dHx = dFdx(hgt), dHy = dFdy(hgt);
            vec3 grad = sign(det) * (dHx * R1 + dHy * R2); normal = normalize(abs(det) * normal - grad);
          }`);
    };
    m.customProgramCacheKey = () => 'orangutan-skin-p1';
    return m;
  }
  const skinMat = skinMaterial();
  const skinMeshes = [];
  for (const part in MESHES) {
    const M = MESHES[part], g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(M.P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(M.N, 3));
    g.setAttribute('color', new THREE.BufferAttribute(M.COL, 3)); g.setAttribute('skinP', new THREE.BufferAttribute(M.SP, 4));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(M.SI, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(M.SW, 4));
    g.setIndex(new THREE.BufferAttribute(M.I, 1)); g.computeBoundingSphere();
    const sm = new THREE.SkinnedMesh(g, skinMat); sm.name = 'skin · ' + part; sm.castShadow = sm.receiveShadow = true; sm.frustumCulled = false;
    sm.bind(skeleton, new THREE.Matrix4()); root.add(sm); skinMeshes.push(sm);
  }

  // =================================================================
  // 5. eyes and lids (rigid, hung on the brain's eye and head joints)
  // =================================================================
  function eyeTexture() { // painted in code: polar angle from the front of the eye -> v (ARTISTIC colours, EVIDENCE-SHAPED layout, Caspar 2021)
    const W = 512, H = 512, cv = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
    const g = cv.getContext('2d'), img = g.createImageData(W, H), col = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }; // painted in sRGB, like any photograph
    const S = col(LOOK.sclera), SR = col(LOOK.scleraRing), IE = col(LOOK.irisEdge), IR = col(LOOK.iris), IF = col(LOOK.irisFleck), PU = col(LOOK.pupil);
    const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * clamp(t, 0, 1));
    for (let y = 0; y < H; y++) { const th = (y + 0.5) / H * 180; // degrees from the front pole (canvas row 0 -> uv.y 1 -> the pole that faces +Z)
      for (let x = 0; x < W; x++) { const u = x / W * Math.PI * 2, n = vnoise(Math.cos(u) * 6, Math.sin(u) * 6, th * 0.4), streak = vnoise(Math.cos(u) * 40, Math.sin(u) * 40, th * 0.15);
        let c;
        if (th < 9 + n * 0.8) c = PU;
        else if (th < 30) { c = mix(IR, IF, streak * 0.9 * smooth(10, 22, th)); c = mix(c, PU, smooth(25, 30, th) * 0.55); }          // iris with amber streaks, darker rim
        else if (th < 31.4) c = IE;                                                                                                 // fine grey demarcation
        else if (th < 44) c = mix(SR, S, smooth(32, 44 + n * 4, th));                                                               // darker ring around the iris
        else c = mix(S, mix(S, SR, 0.5), vnoise(x * 0.05, y * 0.05, 3) * 0.35);                                                      // brownish sclera, lighter than the iris
        const o = (y * W + x) * 4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255; } }
    g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  const eyeGeo = new THREE.SphereGeometry(0.0112, 48, 32); eyeGeo.rotateX(Math.PI / 2); // the texture's front pole looks down +Z
  const eyeMat = new THREE.MeshPhysicalMaterial({ map: eyeTexture(), roughness: 0.5, clearcoat: 0.7, clearcoatRoughness: 0.05, specularIntensity: 0.25, envMapIntensity: 0.18 }); // wet, but a white studio must not wash the iris out
  const EYE_SET = -0.0035; // eyeballs sit a little deeper than the brain's gaze origin: deep-set under the brow
  const lidMat = new THREE.MeshPhysicalMaterial({ color: LOOK.lid, roughness: 0.55, specularIntensity: 0.4 });
  const lowerLidMat = new THREE.MeshPhysicalMaterial({ color: LOOK.eyeRing, roughness: 0.48 });
  const LIDS = [];
  K.eyes.forEach((eg, i) => {
    const ball = new THREE.Mesh(eyeGeo, eyeMat); ball.position.z = EYE_SET; ball.receiveShadow = true; eg.add(ball);
    
    const piv = new THREE.Group(); piv.position.copy(eg.position); piv.position.z += EYE_SET; K.head.add(piv);
    const up = new THREE.Mesh(new THREE.SphereGeometry(0.01255, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), lidMat); up.castShadow = true; piv.add(up);
    const lo = new THREE.Mesh(new THREE.SphereGeometry(0.0124, 40, 12, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), lowerLidMat); piv.add(lo);
    LIDS.push({ up, lo });
  });

  // =================================================================
  // 6. the coat: strand hair, rooted on the skin
  // =================================================================
  // per-root region rules: [length min, max (m), density (relative), lift off the skin, clump cell (m)], ARTISTIC within EVIDENCE-SHAPED limits
  function coatAt(part, pb, reg, x, y, z) {
    if (reg !== REG.body && reg !== REG.back) return null;                         // face, lids, lips, ears, palms, soles, nails: bare
    const p = localIn(pb, x, y, z).clone(), sd = pb.side;
    switch (pb.kind) {
      case 'head': { const fx = p.x / 0.075, fy = (p.y - 0.06) / 0.095; if (p.z > 0.025 && fx * fx + fy * fy < 1) return null;
        if (p.y < 0.02 && p.z > 0.06) return [0.018, 0.035, 0.12, 0.25, 0.008];     // a sparse chin wisp (females ≤ 20 lack beards)
        return [0.03, 0.065, 1.0, 0.05, 0.01]; }                                    // crown and back of the head: lies flat from a parting at the brow (adult)
      case 'neck': return p.z > 0.02 ? [0.035, 0.07, 0.3, 0.15, 0.01] : [0.08, 0.13, 0.9, 0.28, 0.016];
      case 'chest': {
        if (p.z > 0.07 && p.y < 0.33) return [0.045, 0.1, 0.2, 0.2, 0.012];          // chest and belly: sparse, skin shows
        if (p.y > 0.25) return [0.15, 0.24, 1.0, 0.26, 0.03];                         // shoulders and upper back: the long coat
        return [0.11, 0.18, 0.85, 0.26, 0.026]; }
      case 'pelvis': return p.z > 0.04 && p.y < 0.03 ? [0.04, 0.08, 0.2, 0.2, 0.012] : [0.1, 0.16, 0.8, 0.26, 0.026];
      case 'upperArm': return [0.16, 0.27, 0.95, 0.26, 0.03];                        // long draping arm hair
      case 'foreArm': return [0.12, 0.22, 0.9, 0.26, 0.028];
      case 'thigh': return [0.1, 0.17, 0.85, 0.26, 0.026];
      case 'shank': return [0.07, 0.12, 0.8, 0.26, 0.022];
      case 'hand': case 'foot': return p.y > -0.075 ? [0.012, 0.028, 0.55, 0.3, 0.006] : null;
      case 'digit': return pb.k === 0 && !pb.thumb ? [0.006, 0.013, 0.25, 0.35, 0.004] : null;
    }
    return null;
  }
  // follicle direction (comb) in the rest pose; the forearm runs toward the elbow (Hartmann 1886)
  const _bd = V3();
  function combAt(pb, x, y, z) {
    const R = new THREE.Matrix4().extractRotation(pb.bind), dist = V3(0, -1, 0).applyMatrix4(R), bend = V3(0, 0, 1).applyMatrix4(R);
    switch (pb.kind) {
      case 'upperArm': return dist.addScaledVector(bend, 0.25).normalize();
      case 'foreArm': return dist.multiplyScalar(-1).addScaledVector(bend, 0.3).normalize();
      case 'thigh': case 'shank': case 'hand': case 'foot': case 'digit': return dist;
      case 'head': { const p = localIn(bHead, x, y, z), d = V3(p.x * 1.4, p.y - 0.13, p.z - 0.12); d.y = Math.min(d.y, -0.02); d.normalize(); return d.applyMatrix4(R).normalize(); } // from a parting at the brow, back and down
      default: { const p = localIn(bChest, x, y, z); return V3(clamp(x * 4, -0.25, 0.25), -1, -0.15 - Math.max(0, p.z) * 0.5).normalize(); } // trunk and neck: down, a little out and back (no hard parting at the midline)
    }
  }
  const SEG = 10, roots = [];
  { // sample roots on every skin triangle by area × density
    const cand = []; let total = 0;
    for (const part in MESHES) { const M = MESHES[part], P = M.P, I = M.I;
      for (let t = 0; t < I.length; t += 3) { const a = I[t], b = I[t + 1], c = I[t + 2];
        const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2], ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az, vx = P[c * 3] - ax, vy = P[c * 3 + 1] - ay, vz = P[c * 3 + 2] - az;
        const area = 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx); if (area <= 0) continue;
        const pb = BONES[M.PB[a]], cxp = ax + (ux + vx) / 3, cyp = ay + (uy + vy) / 3, czp = az + (uz + vz) / 3, rule = coatAt(part, pb, M.RG[a], cxp, cyp, czp); if (!rule) continue;
        const wgt = area * rule[2] * (rule[0] < 0.03 ? 2.2 : 1); total += wgt; cand.push([M, a, b, c, wgt, rule, pb]); } }
    rs = Q.seed;
    for (const [M, a, b, c, wgt, rule, pb] of cand) {
      let n = wgt / total * Q.hair; n = Math.floor(n) + (rnd() < n % 1 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; } const w = 1 - u - v, P = M.P, N = M.N;
        const px = P[a * 3] * w + P[b * 3] * u + P[c * 3] * v, py = P[a * 3 + 1] * w + P[b * 3 + 1] * u + P[c * 3 + 1] * v, pz = P[a * 3 + 2] * w + P[b * 3 + 2] * u + P[c * 3 + 2] * v;
        const nn = V3(N[a * 3] * w + N[b * 3] * u + N[c * 3] * v, N[a * 3 + 1] * w + N[b * 3 + 1] * u + N[c * 3 + 1] * v, N[a * 3 + 2] * w + N[b * 3 + 2] * u + N[c * 3 + 2] * v).normalize();
        const src = w >= u && w >= v ? a : u >= v ? b : c, comb = combAt(pb, px, py, pz);
        const cell = rule[4], gx = Math.floor(px / cell), gy = Math.floor(py / cell), gz = Math.floor(pz / cell);
        const ccx = (gx + 0.5 + (hsh(gx, gy, gz) - 0.5) * 0.6) * cell, ccy = (gy + 0.5 + (hsh(gy, gz, gx) - 0.5) * 0.6) * cell, ccz = (gz + 0.5 + (hsh(gz, gx, gy) - 0.5) * 0.6) * cell;
        const clumpSeed = hsh(gx * 1.7, gy * 1.3, gz * 1.1);
        roots.push({ px, py, pz, n: nn, comb, si: M.SI.subarray(src * 4, src * 4 + 4), sw: M.SW.subarray(src * 4, src * 4 + 4),
          len: rr(rule[0], rule[1]) * (0.75 + 0.5 * clumpSeed), lift: rule[3], co: [ccx - px, ccy - py, ccz - pz], clump: rule[0] < 0.03 ? 0.35 : 0.88, seed: rnd(), cseed: clumpSeed, tone: rnd() });
      }
    }
  }
  for (let i = roots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [roots[i], roots[j]] = [roots[j], roots[i]]; } // shuffled: drawing fewer strands thins the coat evenly
  STATS.strands = roots.length;
  const hairGeo = new THREE.InstancedBufferGeometry();
  { const n = (SEG + 1) * 2, pos = new Float32Array(n * 3), st = new Float32Array(n * 2), idx = [];
    for (let i = 0; i <= SEG; i++) for (let s = 0; s < 2; s++) { st[(i * 2 + s) * 2] = i / SEG; st[(i * 2 + s) * 2 + 1] = s * 2 - 1; }
    for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    hairGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); // all zero: anything that draws the coat without its own shader (normal / depth overrides) draws nothing
    hairGeo.setAttribute('strand', new THREE.BufferAttribute(st, 2)); hairGeo.setIndex(idx); }
  { const N = roots.length, f = k => new Float32Array(N * k);
    const R = f(3), Nn = f(3), C = f(3), O = f(3), P1 = f(4), P2 = f(4), SI = new Float32Array(N * 4), SW = f(4);
    roots.forEach((r, i) => { R.set([r.px, r.py, r.pz], i * 3); Nn.set([r.n.x, r.n.y, r.n.z], i * 3); C.set([r.comb.x, r.comb.y, r.comb.z], i * 3); O.set(r.co, i * 3);
      P1.set([r.len, 0.0011 * (0.75 + 0.5 * r.seed) * (r.len < 0.03 ? 0.6 : 1), r.seed, r.tone], i * 4); P2.set([r.lift, r.clump, r.cseed, 0], i * 4);
      SI.set(r.si, i * 4); SW.set(r.sw, i * 4); });
    const ia = (a, k) => new THREE.InstancedBufferAttribute(a, k);
    hairGeo.setAttribute('rootP', ia(R, 3)); hairGeo.setAttribute('rootN', ia(Nn, 3)); hairGeo.setAttribute('comb', ia(C, 3)); hairGeo.setAttribute('clumpO', ia(O, 3));
    hairGeo.setAttribute('prm', ia(P1, 4)); hairGeo.setAttribute('prm2', ia(P2, 4)); hairGeo.setAttribute('sIdx', ia(SI, 4)); hairGeo.setAttribute('sW', ia(SW, 4));
    hairGeo.instanceCount = N; }

  const NB = BONES.length;
  // body capsules the coat drapes over (bone-local ends, radius in that bone's units): ARTISTIC, a little inside the skin
  const CAPS = [[bPelvis, [-0.07, 0, -0.035], [0.07, 0, -0.035], 0.085], [bChest, [0, 0.07, 0.03], [0, 0.2, 0.04], 0.122], [bChest, [-0.1, 0.33, -0.02], [0.1, 0.33, -0.02], 0.098], [bHead, [0, 0.075, 0.0], [0, 0.11, -0.01], 0.07]];
  for (const name in LB) { const r = LB[name], arm = r.l.kind === 'arm';
    CAPS.push([r.up, [0, 0, 0], [0, -r.up.len, 0], arm ? 0.036 : 0.05], [r.lo, [0, 0, 0], [0, -r.lo.len, 0], arm ? 0.029 : 0.034]); }
  const NC = CAPS.length, capA = CAPS.map(() => V3()), capB = CAPS.map(() => V3()), capR = new Float32Array(NC);
  function updateCaps() { CAPS.forEach(([b, a, c, r], i) => { const M = b.obj.matrixWorld; capA[i].set(...a).applyMatrix4(M); capB[i].set(...c).applyMatrix4(M); capR[i] = r * V3().setFromMatrixScale(M).x; }); }
  const lag = Array.from({ length: NB }, () => V3());
  const HU = {
    boneTexture: { value: null }, uGrav: { value: V3(0, -1, 0) }, uCapA: { value: capA }, uCapB: { value: capB }, uCapR: { value: capR }, uWind: { value: V3() }, uLag: { value: lag }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1920, 1080) },
    uRoot: { value: lin(LOOK.hairRoot) }, uMid: { value: lin(LOOK.hairMid) }, uTip: { value: lin(LOOK.hairTip) },
    uKeyDir: { value: V3(-0.4, 0.85, 0.35).normalize() }, uKeyCol: { value: new THREE.Color(2.3, 2.25, 2.1) }, uFillDir: { value: V3(0.6, 0.4, -0.7).normalize() }, uFillCol: { value: new THREE.Color(0.45, 0.46, 0.5) },
    uSky: { value: new THREE.Color(1.1, 1.1, 1.1) }, uGround: { value: new THREE.Color(0.7, 0.66, 0.6) },
    uShadowMap: { value: null }, uShadowMatrix: { value: new THREE.Matrix4() }, uShadowSize: { value: new THREE.Vector2(2048, 2048) }, uShadowOn: { value: 0 }, uShadowBias: { value: -0.0006 }, uOpaque: { value: 0 },
  };
  const HAIR_VS_COMMON = `
    #define SEG ${SEG}
    #define NB ${NB}
    #define NC ${NC}
    attribute vec2 strand; attribute vec3 rootP, rootN, comb, clumpO; attribute vec4 prm, prm2, sIdx, sW;
    uniform highp sampler2D boneTexture; uniform vec3 uGrav, uWind, uLag[NB], uCapA[NC], uCapB[NC]; uniform float uCapR[NC]; uniform float uTime; uniform vec2 uRes;
    mat4 bm(float i){ int size = textureSize(boneTexture, 0).x; int j = int(i) * 4; int x = j % size; int y = j / size;
      return mat4(texelFetch(boneTexture, ivec2(x, y), 0), texelFetch(boneTexture, ivec2(x + 1, y), 0), texelFetch(boneTexture, ivec2(x + 2, y), 0), texelFetch(boneTexture, ivec2(x + 3, y), 0)); }
    vec3 hairPoint(out vec3 T, out vec3 N0, out float tt, out float cov, out vec3 W) {
      mat4 S = bm(sIdx.x) * sW.x + bm(sIdx.y) * sW.y + bm(sIdx.z) * sW.z + bm(sIdx.w) * sW.w;
      vec3 R = (modelMatrix * S * vec4(rootP, 1.0)).xyz; mat3 S3 = mat3(modelMatrix) * mat3(S);
      vec3 N = normalize(S3 * rootN), C = S3 * comb, O = S3 * clumpO; C = normalize(C - N * dot(C, N) + 1e-5);
      float len = prm.x, seed = prm.z, lift = prm2.x, clumpK = prm2.y, cs = prm2.w; tt = strand.x;
      float stiff = clamp(len / 0.16, 0.08, 1.0);
      // how readily the strand gives to gravity, per metre of its length: long coat hangs, short hair keeps its comb (ARTISTIC)
      float give = mix(3.0, 36.0, smoothstep(0.03, 0.13, len));
      vec3 d = normalize(C + N * lift), p = R; float segL = len / float(SEG); int kk = int(strand.x * float(SEG) + 0.5);
      vec3 kinkA = normalize(cross(N, C) + 1e-4), lagV = uLag[int(sIdx.x)];
      float ph = seed * 6.2831 + prm2.z * 3.0, sway = sin(uTime * (1.3 + seed) + ph) * 0.5 + sin(uTime * 0.53 + ph * 2.1) * 0.5;
      T = d;
      for (int i = 0; i < SEG; i++) { if (i >= kk) break; float ti = float(i) / float(SEG), along = ti * len;
        float g = give * segL * smoothstep(0.004, 0.018, along);                      // the follicle holds the first centimetre or so
        d = normalize(d + uGrav * g + (uWind * (0.6 + 0.4 * sway) + lagV) * ti * 0.5 * stiff + kinkA * sin(ti * 7.0 + ph) * 0.03);
        vec3 np = p + d * segL;
        float hgt = dot(np - R, N), minH = 0.003 * sqrt(ti) * stiff + 0.0006; if (hgt < minH) np += N * (minH - hgt); // off its own skin
        for (int c = 0; c < NC; c++) { vec3 a = uCapA[c], ab = uCapB[c] - a; float hh = clamp(dot(np - a, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);
          vec3 q = a + ab * hh, e = np - q; float dl = length(e), r = uCapR[c] + 0.004;
          if (dl < r) np = q + (dl > 1e-5 ? e / dl : N) * r; }                         // drape over the body, never through it
        d = normalize(np - p + 1e-6); p = np; T = d; }
      float t = strand.x; p += O * clumpK * smoothstep(0.15, 1.0, t);           // clumps gather toward their tips
      N0 = N; W = p;
      // ribbon facing the camera, never thinner than a pixel (coverage carries the rest)
      vec3 V = normalize(cameraPosition - p); vec3 side = normalize(cross(T, V) + 1e-5);
      float w = prm.y * mix(1.0, 0.12, t); vec4 cp = projectionMatrix * viewMatrix * vec4(p, 1.0);
      float pix = cp.w * 2.0 / (projectionMatrix[1][1] * uRes.y); cov = clamp(w / pix, 0.0, 1.0); w = max(w, pix);
      return p + side * strand.y * w * 0.5;
    }`;
  const hairMat = new THREE.ShaderMaterial({
    uniforms: HU, side: THREE.DoubleSide, alphaToCoverage: true, transparent: false,
    vertexShader: HAIR_VS_COMMON + `
      varying vec3 vT, vN, vW; varying float vt, vCov, vTone, vSeed;
      void main(){ vec3 T, N0, W; float tt, cov; vec3 p = hairPoint(T, N0, tt, cov, W); vT = T; vN = N0; vW = W; vt = tt; vCov = cov; vTone = prm.w; vSeed = prm2.z;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `
      #include <common>
      #include <packing>
      varying vec3 vT, vN, vW; varying float vt, vCov, vTone, vSeed;
      uniform vec3 uRoot, uMid, uTip, uKeyDir, uKeyCol, uFillDir, uFillCol, uSky, uGround; uniform sampler2D uShadowMap; uniform mat4 uShadowMatrix; uniform vec2 uShadowSize; uniform float uShadowOn, uShadowBias, uOpaque;
      float shadowAt(vec3 w){ if (uShadowOn < 0.5) return 1.0; vec4 c = uShadowMatrix * vec4(w + vN * 0.003, 1.0); c.xyz /= c.w;
        if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0; float s = 0.0; vec2 tx = 1.0 / uShadowSize;
        for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) s += step(c.z + uShadowBias, unpackRGBAToDepth(texture2D(uShadowMap, c.xy + vec2(i, j) * tx * 1.5)));
        return s / 9.0; }
      vec3 kk(vec3 T, vec3 N, vec3 V, vec3 L, vec3 col, vec3 base){
        float TL = dot(T, L), sinTL = sqrt(max(0.0, 1.0 - TL * TL)); vec3 H = normalize(L + V);
        vec3 T1 = normalize(T + N * 0.08), T2 = normalize(T - N * 0.12); float h1 = dot(T1, H), h2 = dot(T2, H);
        float s1 = pow(sqrt(max(0.0, 1.0 - h1 * h1)), 140.0) * 0.07, s2 = pow(sqrt(max(0.0, 1.0 - h2 * h2)), 28.0) * 0.22;
        float facing = saturate(dot(N, L) * 0.5 + 0.55);
        vec3 diff = base * mix(0.3, 1.0, sinTL) * facing;
        vec3 trans = base * vec3(1.25, 0.7, 0.4) * pow(saturate(dot(-V, L)), 4.0) * 0.6;                      // backlit glow through the strands
        return col * (diff + mix(vec3(1.0), base * 3.0, 0.35) * s1 * facing + base * s2 * facing + trans);
      }
      void main(){
        if (uOpaque > 0.5 && vCov < fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453)) discard; // straight-to-screen renders: screen-door coverage, opaque writes
        vec3 base = mix(uRoot, uMid, smoothstep(0.0, 0.45, vt)); base = mix(base, uTip, smoothstep(0.45, 1.0, vt) * (0.6 + 0.4 * vTone));
        base *= 0.78 + 0.44 * vTone; base = mix(base, base * vec3(1.08, 0.92, 0.85), vSeed);
        vec3 T = normalize(vT), V = normalize(cameraPosition - vW), N = normalize(vN);
        float ao = mix(0.22, 1.0, smoothstep(0.0, 0.75, vt));                                                    // light reaches the roots last
        vec3 c = kk(T, N, V, uKeyDir, uKeyCol, base) * shadowAt(vW) + kk(T, N, V, uFillDir, uFillCol, base);
        c += base * mix(uGround, uSky, N.y * 0.5 + 0.5) * 0.55;
        gl_FragColor = vec4(c * ao, mix(vCov, 1.0, uOpaque));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const hairDepthMat = new THREE.ShaderMaterial({ uniforms: HU, side: THREE.DoubleSide,
    vertexShader: HAIR_VS_COMMON + `void main(){ vec3 T, N0, W; float tt, cov; vec3 p = hairPoint(T, N0, tt, cov, W); gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `#include <packing>\n void main(){ gl_FragColor = packDepthToRGBA(gl_FragCoord.z); }` });
  const hair = new THREE.Mesh(hairGeo, hairMat); hair.name = 'coat'; hair.frustumCulled = false; hair.castShadow = true; hair.receiveShadow = false; hair.customDepthMaterial = hairDepthMat; hair.raycast = () => {};
  root.add(hair);
  STATS.buildMs = Math.round(performance.now() - t0);

  brain.reset(brain.state.seed); // back to the life the brain was living

  // =================================================================
  // 7. every frame: follow the joints
  // =================================================================
  const _M = new THREE.Matrix4(), _S = new THREE.Matrix4(), _T = new THREE.Matrix4(), _p = V3(), prevP = BONES.map(() => null), lagV = BONES.map(() => V3());
  const BREATH_C = V3(0, 0.22, 0.03);
  function update(dt) {
    const G = brain.signals;
    BONES.forEach((b, i) => {
      if (b === bChest) { const s = G.breath, d = G.breathDepth; _S.makeScale(1 + 0.024 * s * d, 1 + 0.009 * s, 1 + 0.034 * s * d); _T.makeTranslation(BREATH_C.x, BREATH_C.y, BREATH_C.z);
        _M.copy(b.obj.matrixWorld).multiply(_T).multiply(_S).multiply(_T.makeTranslation(-BREATH_C.x, -BREATH_C.y, -BREATH_C.z)); tBones[i].matrixWorld.copy(_M); }
      else tBones[i].matrixWorld.copy(b.obj.matrixWorld);
      // coat follow-through: each bone's hair lags behind the bone's own acceleration (a damped spring on its velocity)
      _p.setFromMatrixPosition(b.obj.matrixWorld);
      if (dt > 0) { if (prevP[i]) { const vel = _p.clone().sub(prevP[i]).divideScalar(dt); lagV[i].lerp(vel.multiplyScalar(-0.9), 1 - Math.exp(-dt * 6)); lag[i].copy(lagV[i]).clampLength(0, 1.5); } prevP[i] = (prevP[i] || V3()).copy(_p); }
    });
    skeleton.update(); if (!skeleton.boneTexture) skeleton.computeBoneTexture(); HU.boneTexture.value = skeleton.boneTexture; updateCaps();
    // lids: blink, and the upper lid follows the eye's pitch a little
    for (const L of LIDS) { L.up.rotation.x = -0.42 - 0.6 * G.eyePitch + G.blink * 1.5; L.lo.rotation.x = 0.05 - 0.3 * G.eyePitch - G.blink * 0.15; } // open: the upper lid's edge just over the iris
    const w = G.wind, gust = 0.42 + 0.22 * Math.sin(w.t * 0.0648) + 0.16 * Math.sin(w.t * 0.153 + 1.3);
    HU.uWind.value.set(Math.sin(w.t * 0.52) + 0.4 * Math.sin(w.t * 1.31 + 1.0), 0, 0.6 * Math.sin(w.t * 0.41 + 2.0)).multiplyScalar(0.35 * w.amt * clamp(gust, 0.12, 0.95));
    HU.uTime.value = w.t;
  }
  // lights the coat shades with (the coat has its own shader; the studio tells it what the room looks like)
  function syncLights({ key, fill, hemi, res }) {
    if (key) { HU.uKeyDir.value.copy(key.position).sub(key.target.position).normalize(); HU.uKeyCol.value.copy(key.color).multiplyScalar(key.intensity);
      if (key.castShadow && key.shadow.map) { HU.uShadowMap.value = key.shadow.map.texture; HU.uShadowMatrix.value.copy(key.shadow.matrix); HU.uShadowSize.value.copy(key.shadow.mapSize); HU.uShadowOn.value = 1; } }
    if (fill) { HU.uFillDir.value.copy(fill.position).normalize(); HU.uFillCol.value.copy(fill.color).multiplyScalar(fill.intensity); }
    if (hemi) { HU.uSky.value.copy(hemi.color).multiplyScalar(hemi.intensity); HU.uGround.value.copy(hemi.groundColor).multiplyScalar(hemi.intensity); }
    if (res) HU.uRes.value.copy(res);
  }
  function bounds() { const b = brain.bounds(0.14); b.min.y = 0; return b; }
  function direct(on) { HU.uOpaque.value = on ? 1 : 0; hairMat.alphaToCoverage = !on; } // for renders that go straight to the canvas (no multisampled target)
  function setHairFraction(f) { hairGeo.instanceCount = Math.max(1, Math.round(roots.length * clamp(f, 0.05, 1))); return hairGeo.instanceCount; }
  update(0);
  return { root, update, syncLights, bounds, setHairFraction, direct, skeleton, meshes: skinMeshes, hair, stats: STATS, version: BODY_VERSION, materials: { skin: skinMat, hair: hairMat, eye: eyeMat } };
}
