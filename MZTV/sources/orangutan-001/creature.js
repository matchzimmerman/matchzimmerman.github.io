/* =====================================================================
   ORANGUTAN 001 · source-built living creature  (G1 blockout)
   ---------------------------------------------------------------------
   Everything here is constructed in code: anatomy (parametric shapes on
   a native joint hierarchy), coat (shaggy shells + hanging locks), limb
   reach (two-bone IK), attention (eyes lead, head follows), and behaviour
   (sit, breathe, shift weight, reposition and inspect a hand, rise onto
   fists and feet, walk with planted contacts, settle, sit back down).
   No meshes, rigs, clips or character templates are loaded.

   Contract (new, proposed in HARIL STUDIO #62):
     const C = createCreature(THREE, { seed });
     scene.add(C.root);
     C.update(dt, t)      // any frame rate; behaviour runs on a fixed 60 Hz step
     C.bounds()           // THREE.Box3 of the body (moving)
     C.observe()          // semantic world points for cameras (read-only)
     C.reset(seed)        // same seed => same life
     C.log, C.metrics     // behaviour log, contact / reach / pop metrics

   The creature never reads any camera. Cameras may read observe().
   Units: metres, Y up, the studio floor at y = 0.
   ===================================================================== */

export const VERSION = 'orangutan-001 · g1.1 (#63 calibration) · 2026-11-22';

// adult female Bornean orangutan.
// Limb segments: adult female Pongo group-mean bone lengths (humerus, radius, femur, tibia), Kralick et al. 2023,
// via the #63 reference package v1 — osteological proxies for joint-centre lengths (Inferred).
// Trunk, hands, feet, head: still MZ.Claude estimates (no sourced values yet); the trunk is scaled with the limbs
// (trunkScale ≈ the limbs' 0.906 reduction from G1) so proportions stay coherent (Inferred).
export const ANATOMY = {
  spine: 0.40, shoulderHalf: 0.16, hipHalf: 0.086, trunkScale: 0.9,   // spine / shoulderHalf are in trunk-local units (× trunkScale in the world)
  upperArm: 0.325, foreArm: 0.328, palm: 0.10, finger: [0.042, 0.034, 0.024], thumb: [0.03, 0.022],
  thigh: 0.253, shank: 0.218, sole: 0.11, toe: [0.045, 0.035], hallux: [0.028, 0.02],
  wristFist: 0.11, wristPalm: 0.035, ankle: 0.06,
  palmStepP: 0.12,   // share of walking hand contacts made with a modified palm instead of a fist (43 fist / 6 palm of 49, Orlikoff et al. 2026, #63)
};

const COL = {
  coat: '#c0612c', coatDeep: '#9a4a22', lock: '#a8502a', lockTip: '#b85a2c',
  skin: '#45362e', skinPale: '#6a5244', lip: '#2f2520', eye: '#1c1512', nail: '#5b4a3e',
};

export function createCreature(THREE, config = {}) {
  const A = Object.assign({}, ANATOMY, config.anatomy || {});
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const UP = V3(0, 1, 0), DOWN = V3(0, -1, 0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const smooth = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const smoother = k => { k = clamp(k, 0, 1); return k * k * k * (k * (k * 6 - 15) + 10); };
  const wrapPi = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  // ---------- deterministic randomness ----------
  let rs = 1;
  const rnd = () => { rs |= 0; rs = rs + 0x6D2B79F5 | 0; let t = Math.imul(rs ^ rs >>> 15, 1 | rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rr = (a, b) => a + (b - a) * rnd();
  const hash3 = (x, y, z, seed) => { const h = Math.sin(Math.round(x * 997) * 12.9898 + Math.round(y * 997) * 78.233 + Math.round(z * 997) * 37.719 + seed * 4.1414) * 43758.5453; return h - Math.floor(h); };
  const geoNoise = (seed) => { let s = seed | 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  // ---------- materials ----------
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 1, metalness: 0, flatShading: true }, o));
  const M = {
    coat: mat(COL.coat), coatDeep: mat(COL.coatDeep), skin: mat(COL.skin, { roughness: 0.85 }), skinPale: mat(COL.skinPale, { roughness: 0.85 }),
    lip: mat(COL.lip), eye: mat(COL.eye, { roughness: 0.35, flatShading: false }), nail: mat(COL.nail),
  };

  // ---------- constructed shapes ----------
  // shaggy shell: an ellipsoid whose surface is pushed in and out by a few hashed lobes, so the coat reads as hair masses, not a ball
  function shaggy(sx, sy, sz, seed, amp = 0.18, detail = 3) {
    const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, n = geoNoise(seed);
    const lobes = []; for (let i = 0; i < 14; i++) { const d = V3(n() * 2 - 1, n() * 2 - 1, n() * 2 - 1).normalize(); lobes.push([d, n() * 0.9 + 0.3, 6 + n() * 10]); }
    const v = V3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize(); let k = 0;
      for (const [d, a, sharp] of lobes) k += a * Math.pow(Math.max(0, v.dot(d)), sharp);
      k += (hash3(v.x, v.y, v.z, seed) - 0.5) * 0.35; // fine hair noise, keyed to position so shared vertices agree
      const r = 1 + amp * (k - 0.25) - (v.y < -0.6 ? amp * 0.3 * (v.y + 0.6) : 0); // a little longer hanging below
      p.setXYZ(i, v.x * sx * r, v.y * sy * r, v.z * sz * r);
    }
    g.computeVertexNormals(); return g;
  }
  // limb segment along local -Y from 0 to -len, tapering r0 -> r1, optionally shaggy
  function limbGeo(len, r0, r1, seed, amp = 0.22, radial = 9) {
    const g = new THREE.CylinderGeometry(r1, r0, len, radial, 6, false); g.translate(0, -len / 2, 0);
    const p = g.attributes.position, n = geoNoise(seed), v = V3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const t = -v.y / len; const ang = Math.atan2(v.z, v.x);
      const bulge = Math.sin(Math.PI * clamp(t, 0, 1)) * 0.12 + (t < 0.02 || t > 0.98 ? -0.1 : 0);
      const k = 1 + bulge + amp * (Math.sin(ang * 3 + t * 7 + seed) * 0.5 + (hash3(Math.cos(ang), t, Math.sin(ang), seed) - 0.5)) * (v.z < 0 ? 1.25 : 1);
      p.setX(i, v.x * k); p.setZ(i, v.z * k);
    }
    g.computeVertexNormals(); return g;
  }
  const ell = (sx, sy, sz, det = 2) => { const g = new THREE.IcosahedronGeometry(1, det); g.scale(sx, sy, sz); return g; };
  const bone = (len, r0, r1) => { const g = new THREE.CylinderGeometry(r1, r0, len, 7, 1); g.translate(0, -len / 2, 0); return g; };
  const mesh = (g, m, parent, pos) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; if (pos) o.position.copy(pos); parent.add(o); return o; };

  // ---------- the body: joint hierarchy ----------
  const root = new THREE.Group(); root.name = 'ORANGUTAN 001';
  const body = new THREE.Group(); root.add(body);          // heading frame on the floor under the pelvis
  const pelvis = new THREE.Group(); body.add(pelvis);
  const chest = new THREE.Group(); chest.scale.setScalar(A.trunkScale); pelvis.add(chest);
  const neck = new THREE.Group(); neck.position.set(0, A.spine + 0.01, 0.035); chest.add(neck);
  const head = new THREE.Group(); head.position.set(0, 0.05, 0.015); neck.add(head);
  const bodyMeshes = []; const track = o => { bodyMeshes.push(o); return o; };

  // trunk (chest frame: origin at the lumbar joint, +Y up the spine, +Z the belly side)
  track(mesh(shaggy(0.135, 0.085, 0.12, 11, 0.16), M.coat, pelvis, V3(0, 0.02, -0.035))).scale.setScalar(A.trunkScale); // hips / seat
  const belly = track(mesh(shaggy(0.15, 0.16, 0.15, 12, 0.14), M.coat, chest, V3(0, 0.13, 0.035)));  // pot belly
  const thorax = track(mesh(shaggy(0.17, 0.13, 0.125, 13, 0.16), M.coat, chest, V3(0, 0.29, 0.0)));
  track(mesh(shaggy(0.19, 0.075, 0.105, 14, 0.2), M.coatDeep, chest, V3(0, 0.365, -0.025)));        // shoulder hump
  track(mesh(shaggy(0.065, 0.05, 0.07, 15, 0.2), M.coat, neck, V3(0, 0.0, 0)));                       // neck
  // head (head frame: origin at the top of the neck, +Z the face, +Y up)
  track(mesh(shaggy(0.088, 0.095, 0.088, 21, 0.2), M.coatDeep, head, V3(0, 0.085, -0.012)));        // cranium, hair cap
  track(mesh(ell(0.072, 0.083, 0.04, 3), M.skin, head, V3(0, 0.07, 0.05)));                         // facial disc
  track(mesh(ell(0.052, 0.04, 0.05, 3), M.skinPale, head, V3(0, 0.03, 0.078)));                    // prognathic muzzle
  track(mesh(ell(0.04, 0.008, 0.02, 2), M.lip, head, V3(0, 0.012, 0.118)));                         // mouth line
  track(mesh(ell(0.06, 0.012, 0.025, 2), M.skin, head, V3(0, 0.098, 0.078)));                       // low brow
  track(mesh(ell(0.022, 0.012, 0.014, 2), M.skinPale, head, V3(0, 0.062, 0.12)));                   // nostrils / nose pad
  for (const s of [1, -1]) track(mesh(ell(0.01, 0.019, 0.016, 2), M.skin, head, V3(0.083 * s, 0.075, 0.0)));   // small ears
  track(mesh(shaggy(0.05, 0.035, 0.04, 22, 0.3), M.coat, head, V3(0, -0.005, 0.075)));              // chin beard
  const eyes = [1, -1].map(s => { const e = new THREE.Group(); e.position.set(0.026 * s, 0.077, 0.088); head.add(e);
    track(mesh(ell(0.011, 0.011, 0.011, 2), M.eye, e)); const lid = mesh(ell(0.0125, 0.0125, 0.0125, 2), M.skin, e); lid.scale.set(1, 0.05, 1); lid.position.set(0, 0.004, 0.002); return { g: e, lid }; });

  // limbs are placed in the creature's own space each step by IK (no parenting below the trunk)
  const limbSpace = new THREE.Group(); root.add(limbSpace);
  function seg(geo, m) { const g = new THREE.Group(); limbSpace.add(g); track(mesh(geo, m, g)); return g; }
  function makeHand(side, seed) {
    const g = new THREE.Group(); limbSpace.add(g);
    track(mesh(ell(0.042, 0.052, 0.016, 2), M.skin, g, V3(0, -0.05, 0)));                          // palm
    track(mesh(shaggy(0.04, 0.045, 0.014, seed, 0.18, 2), M.coat, g, V3(0, -0.035, 0.008)));       // hairy back of the hand
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      let par = new THREE.Group(); par.position.set((i - 1.5) * 0.019 * side, -A.palm, 0); g.add(par); const joints = [];
      A.finger.forEach((L, j) => { const jt = j === 0 ? par : new THREE.Group(); if (j > 0) { jt.position.set(0, -A.finger[j - 1], 0); par.add(jt); }
        track(mesh(bone(L, 0.0085 - j * 0.0012, 0.0075 - j * 0.0012), M.skin, jt)); joints.push(jt); par = jt; });
      fingers.push(joints);
    }
    // short thumb on the medial side
    let tp = new THREE.Group(); tp.position.set(-0.04 * side, -0.035, -0.006); tp.rotation.z = 0.7 * side; g.add(tp); const thumb = [tp];
    track(mesh(bone(A.thumb[0], 0.0085, 0.0075), M.skin, tp)); const t2 = new THREE.Group(); t2.position.set(0, -A.thumb[0], 0); tp.add(t2); track(mesh(bone(A.thumb[1], 0.0075, 0.006), M.skin, t2)); thumb.push(t2);
    return { g, fingers, thumb };
  }
  function makeFoot(side, seed) {
    const g = new THREE.Group(); limbSpace.add(g);
    track(mesh(ell(0.04, 0.062, 0.02, 2), M.skin, g, V3(0, -0.05, -0.04)));                       // sole, heel at the ankle
    track(mesh(shaggy(0.036, 0.05, 0.016, seed, 0.18, 2), M.coat, g, V3(0, -0.04, -0.012)));
    const toes = [];
    for (let i = 0; i < 4; i++) {
      let par = new THREE.Group(); par.position.set((0.75 - i) * 0.017 * side, -A.sole, -0.045); g.add(par); const joints = [];
      A.toe.forEach((L, j) => { const jt = j === 0 ? par : new THREE.Group(); if (j > 0) { jt.position.set(0, -A.toe[j - 1], 0); par.add(jt); }
        track(mesh(bone(L, 0.0085 - j * 0.001, 0.0075 - j * 0.001), M.skin, jt)); joints.push(jt); par = jt; });
      toes.push(joints);
    }
    // opposable big toe, splayed medially
    const hp = new THREE.Group(); hp.position.set(-0.035 * side, -0.05, -0.045); hp.rotation.z = -0.9 * side; g.add(hp);
    track(mesh(bone(A.hallux[0], 0.011, 0.009), M.skin, hp)); const h2 = new THREE.Group(); h2.position.set(0, -A.hallux[0], 0); hp.add(h2); track(mesh(bone(A.hallux[1], 0.009, 0.007), M.skin, h2));
    return { g, toes, hallux: [hp, h2] };
  }

  const LIMBS = [];
  for (const side of [1, -1]) {
    const sd = side > 0 ? 'L' : 'R';
    LIMBS.push({ name: 'hand' + sd, kind: 'arm', side, l1: A.upperArm, l2: A.foreArm,
      up: seg(limbGeo(A.upperArm, 0.058, 0.046, 31 + side, 0.26), M.coat), lo: seg(limbGeo(A.foreArm, 0.05, 0.036, 33 + side, 0.3), M.coat), end: makeHand(side, 35 + side) });
    LIMBS.push({ name: 'foot' + sd, kind: 'leg', side, l1: A.thigh, l2: A.shank,
      up: seg(limbGeo(A.thigh, 0.068, 0.052, 41 + side, 0.22), M.coat), lo: seg(limbGeo(A.shank, 0.052, 0.04, 43 + side, 0.24), M.coat), end: makeFoot(side, 45 + side) });
  }
  const L = Object.fromEntries(LIMBS.map(l => [l.name, l]));

  // ---------- coat: hanging locks (instanced), each a little pendulum on its anchor ----------
  const lockGeo = new THREE.CylinderGeometry(0.25, 1, 1, 5, 1); lockGeo.translate(0, -0.5, 0);
  const lockAnchors = [];
  function addLocks(n, parent, len0, len1, place, bias = 0) { for (let i = 0; i < n; i++) lockAnchors.push({ parent, local: place(i), len: rr(len0, len1), w: rr(0.0032, 0.0058), bias, d: V3(0, -1, 0), v: V3(), prev: null }); }
  function seedLocks() {
    lockAnchors.length = 0;
    for (const l of LIMBS) {
      const arm = l.kind === 'arm';
      const ring = (lenSeg, r, back) => i => { const t = rr(0.12, 0.95), a = rr(0, Math.PI * 2); const z = Math.sin(a) * r; return V3(Math.cos(a) * r, -t * lenSeg, back ? -Math.abs(z) : z); };
      addLocks(arm ? 48 : 14, l.up, arm ? 0.12 : 0.05, arm ? 0.27 : 0.11, ring(l.l1, arm ? 0.045 : 0.05));
      addLocks(arm ? 56 : 12, l.lo, arm ? 0.12 : 0.05, arm ? 0.3 : 0.1, ring(l.l2, arm ? 0.038 : 0.04));
    }
    addLocks(56, chest, 0.05, 0.12, () => { const a = rr(-Math.PI, Math.PI); return V3(Math.sin(a) * 0.16, rr(0.06, 0.36), Math.cos(a) * 0.13); });
    addLocks(16, pelvis, 0.05, 0.11, () => { const a = rr(-Math.PI, Math.PI); return V3(Math.sin(a) * 0.13, rr(-0.03, 0.06), Math.cos(a) * 0.1 - 0.03); });
    addLocks(22, head, 0.025, 0.05, () => { const a = rr(-2.4, 2.4); return V3(Math.sin(a) * 0.06, rr(0.12, 0.17), Math.cos(a) * -0.05); }, 1); // hair standing up and forward on the crown
  }
  rs = 777; seedLocks();
  const lockMat = mat('#ffffff', { flatShading: false }); // instance colours carry the coat colour; smooth normals (flat shading breaks on sub-pixel locks)
  const locks = new THREE.InstancedMesh(lockGeo, lockMat, lockAnchors.length);
  locks.castShadow = true; locks.receiveShadow = true; locks.frustumCulled = false; locks.raycast = () => {}; root.add(locks);
  { const c = new THREE.Color(); lockAnchors.forEach((a, i) => { c.set(i % 3 ? COL.lock : (i % 2 ? COL.lockTip : COL.coat)); locks.setColorAt(i, c); }); }

  // ---------- state ----------
  const H = 1 / 60;
  let S, acc = 0;
  const log = [], metrics = {};
  const ev = (e, d) => { log.push(Object.assign({ t: +S.t.toFixed(3), ev: e }, d || {})); if (log.length > 4000) log.shift(); };

  function freshState(seed) {
    rs = (seed >>> 0) || 1;
    return {
      seed, t: 0, mode: 'sit', modeT: 0, phaseT: 0,
      pos: V3(rr(-0.15, 0.15), 0, rr(-0.15, 0.15)), heading: rr(-0.6, 0.6) + Math.PI * 0.08, yawRate: 0, speed: 0,
      // spring-driven posture (value p, velocity v, target g)
      P: { py: sp(0.12), pz: sp(0), px: sp(0), pitch: sp(0.21), roll: sp(0), chestYaw: sp(0), chestPitch: sp(0.06) },
      gaze: { tgt: V3(0, 0.5, 2), headTgt: V3(0, 0.5, 2), changedAt: -1, latency: 0.2, eyeYaw: 0, eyePitch: 0, eyeVY: 0, eyeVP: 0, headYaw: sp(0), headPitch: sp(0), next: 1, label: 'ahead', lockOn: null },
      blink: { next: rr(1.5, 4), t: -1 }, breath: { phase: 0, rate: sp(14), depth: sp(1) },
      gait: { phase: 0, T: 1.6, duty: 0.66 }, goal: null, plan: null, timers: {}, activity: 'settling in',
      contactsChanged: 0,
    };
  }
  function sp(v) { return { p: v, v: 0, g: v }; }
  function stepSpring(s, w, dt) { const a = -w * w * (s.p - s.g) - 2 * w * s.v; s.v += a * dt; s.p += s.v * dt; }

  // ---------- frames and neutral contacts ----------
  const fwd = () => V3(Math.sin(S.heading), 0, Math.cos(S.heading));
  const left = () => V3(Math.cos(S.heading), 0, -Math.sin(S.heading));
  const toWorld = (lx, ly, lz, pos = S.pos, hd = S.heading) => V3(pos.x + lx * Math.cos(hd) + lz * Math.sin(hd), ly, pos.z - lx * Math.sin(hd) + lz * Math.cos(hd));
  const toLocal = (w) => { const dx = w.x - S.pos.x, dz = w.z - S.pos.z, c = Math.cos(S.heading), s = Math.sin(S.heading); return V3(dx * c - dz * s, w.y, dx * s + dz * c); };
  // contact layout scales with the limbs (G1 values were set for 0.72 m arms and 0.52 m legs)
  const AS = (A.upperArm + A.foreArm) / 0.72, LS = (A.thigh + A.shank) / 0.52;
  const QUAD_PY = 0.44 * LS, SIT_PY = 0.12, VMAX = 0.32 * LS;
  const NEUTRAL = {
    quad: { arm: (s) => [0.21 * s, A.wristFist, 0.47 * AS], leg: (s) => [0.15 * s, A.ankle, -0.02] },
    sit: { arm: (s) => [0.29 * s, A.wristPalm, 0.1], leg: (s) => [0.19 * s, A.ankle, 0.3 * LS] },
  };
  const TRAVEL = 0.3 * LS + 0.02; // how far the body moves over planted feet when rising / sitting
  const neutralLocal = (l, pose) => NEUTRAL[pose][l.kind](l.side);

  // ---------- limb controllers ----------
  function initLimbs(pose) {
    for (const l of LIMBS) {
      const p = toWorld(...neutralLocal(l, pose));
      Object.assign(l, { mode: 'plant', p: p.clone(), plant: p.clone(), p0: p.clone(), p1: p.clone(), t0: 0, dur: 0, lift: 0, free: null, freeV: V3(),
        grip: pose === 'quad' ? (l.kind === 'arm' ? 'fist' : 'walk') : (l.kind === 'arm' ? 'palm' : 'sit'), curl: sp(l.kind === 'arm' ? (pose === 'quad' ? 1 : 0.3) : 0.35),
        q: null, pole: null, slip: 0, reach: 0, shoulderOff: V3() });
    }
  }
  function swing(l, toWorldP, dur, lift, grip, why) {
    l.mode = 'swing'; l.p0 = l.p.clone(); l.p1 = toWorldP.clone(); l.t0 = S.t; l.dur = Math.max(0.2, dur); l.lift = lift; l.nextGrip = grip; l.why = why;
    ev('swing', { limb: l.name, why, to: [+toWorldP.x.toFixed(3), +toWorldP.y.toFixed(3), +toWorldP.z.toFixed(3)] });
  }
  function freeLimb(l, localTarget, grip, why) { l.mode = 'free'; l.free = V3(...localTarget); l.grip = grip; if (!l.freeP) l.freeP = l.p.clone(); else l.freeP.copy(l.p); l.freeV.set(0, 0, 0); ev('free', { limb: l.name, why }); }
  function limbTick(l, dt) {
    if (l.mode === 'swing') {
      const k = (S.t - l.t0) / l.dur, e = smoother(k);
      l.p.lerpVectors(l.p0, l.p1, e); l.p.y += l.lift * Math.sin(Math.PI * clamp(k, 0, 1));
      if (k >= 1) { l.mode = 'plant'; l.p.copy(l.p1); l.plant.copy(l.p1); l.grip = l.nextGrip || l.grip; S.contactsChanged++; ev('plant', { limb: l.name }); }
    } else if (l.mode === 'free') {
      const w = toWorld(l.free.x, l.free.y, l.free.z), wgt = 7; // critically damped follow of a body-relative target
      const a = w.clone().sub(l.freeP).multiplyScalar(wgt * wgt).addScaledVector(l.freeV, -2 * wgt); l.freeV.addScaledVector(a, dt); l.freeP.addScaledVector(l.freeV, dt); l.p.copy(l.freeP);
    } else l.p.copy(l.plant);
    const want = l.mode === 'swing' ? (l.kind === 'arm' ? (l.nextGrip === 'fist' ? 0.85 : 0.55) : 0.7)
      : l.grip === 'fist' ? 1 : l.grip === 'palm' ? 0.1 : l.grip === 'inspect' ? 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(S.t * 1.7 + l.side)) : l.grip === 'walk' ? 0.6 : 0.3;
    l.curl.g = want; stepSpring(l.curl, 9, dt);
  }

  // ---------- two-bone IK (analytic) ----------
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _x = V3(), _y = V3(), _z = V3();
  function orient(g, origin, dir, refZ) {
    _y.copy(dir).multiplyScalar(-1).normalize(); _z.copy(refZ).addScaledVector(_y, -refZ.dot(_y)); if (_z.lengthSq() < 1e-8) _z.set(0, 0, 1).addScaledVector(_y, -_y.z); _z.normalize(); _x.crossVectors(_y, _z);
    _m.makeBasis(_x, _y, _z); g.quaternion.setFromRotationMatrix(_m); g.position.copy(origin);
  }
  function solve(l, base, target, pole) {
    const max = l.l1 + l.l2, d = target.clone().sub(base), dist = d.length(), dn = d.clone().divideScalar(dist || 1);
    const r = clamp(dist, 0.05, max * 0.999); l.reach = dist / max;
    const ca = clamp((l.l1 * l.l1 + r * r - l.l2 * l.l2) / (2 * l.l1 * r), -1, 1), sa = Math.sqrt(1 - ca * ca);
    const bend = pole.clone().addScaledVector(dn, -pole.dot(dn)); if (bend.lengthSq() < 1e-8) bend.set(0, 1, 0).addScaledVector(dn, -dn.y); bend.normalize();
    const elbow = base.clone().addScaledVector(dn, l.l1 * ca).addScaledVector(bend, l.l1 * sa);
    const reachP = base.clone().addScaledVector(dn, r);
    orient(l.up, base, elbow.clone().sub(base), bend); orient(l.lo, elbow, reachP.clone().sub(elbow), bend);
    const err = reachP.distanceTo(target);
    if (l.mode === 'plant') l.slip = Math.max(l.slip, err);
    return { elbow, wrist: reachP, err };
  }

  // ---------- attention: eyes lead, head follows after a latency, the chest helps on big turns ----------
  function lookAt(p, label, hold = [1.2, 4]) {
    const g = S.gaze; if (g.tgt.distanceTo(p) < 0.02) return;
    g.tgt.copy(p); g.label = label; g.changedAt = S.t; g.latency = rr(0.14, 0.26); g.next = S.t + rr(hold[0], hold[1]);
    if (rnd() < 0.55) S.blink.next = Math.min(S.blink.next, S.t + 0.02); // blinks often ride on big gaze shifts
    ev('look', { at: label });
  }
  function headPivot() { return head.getWorldPosition(V3()).add(V3(0, 0.07, 0)); }
  function gazeTick(dt) {
    const g = S.gaze;
    if (g.lockOn) { g.tgt.copy(g.lockOn()); }
    if (S.t - g.changedAt > g.latency || g.lockOn) g.headTgt.lerp(g.tgt, g.lockOn ? 1 : 1);
    const hp = headPivot();
    const rel = toLocal(g.headTgt).sub(toLocal(hp)); // in the heading frame
    let yaw = Math.atan2(rel.x, rel.z), pitch = Math.atan2(rel.y, Math.hypot(rel.x, rel.z));
    // the head takes most of the turn but not all; the eyes cover the rest
    const big = Math.abs(yaw) > 0.18 ? 0.85 : 0.4;
    S.P.chestYaw.g = clamp(yaw * 0.3, -0.42, 0.42) * (S.mode === 'walk' ? 0.3 : 1);
    g.headYaw.g = clamp(yaw * big, -1.35, 1.35); g.headPitch.g = clamp(pitch * 0.8, -0.95, 0.65);
    stepSpring(g.headYaw, 5.2, dt); stepSpring(g.headPitch, 5.2, dt);
    // eyes: aim at the current target inside the head's frame, fast (saccade) and limited
    head.updateWorldMatrix(true, false);
    const inHead = head.worldToLocal(g.tgt.clone()).sub(V3(0, 0.077, 0.088));
    const ey = clamp(Math.atan2(inHead.x, inHead.z), -0.5, 0.5), ep = clamp(Math.atan2(inHead.y, Math.hypot(inHead.x, inHead.z)), -0.38, 0.38);
    const w = 38; g.eyeVY += (-w * w * (g.eyeYaw - ey) - 2 * w * g.eyeVY) * dt; g.eyeYaw += g.eyeVY * dt; g.eyeVP += (-w * w * (g.eyePitch - ep) - 2 * w * g.eyeVP) * dt; g.eyePitch += g.eyeVP * dt;
    for (const e of eyes) e.g.rotation.set(-g.eyePitch, g.eyeYaw, 0);
  }

  // ---------- behaviour ----------
  function studioPoint(label) { // things in the room to look at: the creature's own interests, never a camera
    const a = S.heading + rr(-1.9, 1.9), d = rr(1.2, 4.5);
    const pts = [() => [V3(S.pos.x + Math.sin(a) * d, rr(0.0, 0.25), S.pos.z + Math.cos(a) * d), 'the floor'],
      () => [V3(Math.sin(a) * 5.3, rr(0.6, 2.4), Math.cos(a) * 5.3), 'the wall'],
      () => [V3(S.pos.x + Math.sin(a) * 2, rr(1.6, 3.2), S.pos.z + Math.cos(a) * 2), 'up'],
      () => [toWorld(rr(-0.3, 0.3), 0.02, rr(0.25, 0.6)), 'near its feet']];
    const [p, l] = pts[Math.floor(rnd() * pts.length)](); return [p, label || l];
  }
  function setMode(m, why) { ev('mode', { from: S.mode, to: m, why }); S.mode = m; S.modeT = S.t; S.plan = null; }
  const T = (k, a, b) => { if (S.timers[k] === undefined) S.timers[k] = S.t + rr(a, b); return S.t >= S.timers[k]; };
  const resetT = (k, a, b) => { S.timers[k] = S.t + rr(a, b); };
  const sitTargets = () => { Object.assign(gs(), { py: 0.12, pz: 0, pitch: S.sitPitch || 0.21, chestPitch: 0.06 }); };
  const gs = () => new Proxy({}, { set: (o, k, v) => { S.P[k].g = v; return true; } });

  function behave(dt) {
    const m = S.mode, mt = S.t - S.modeT, P = S.P;
    // ----- SIT -----
    if (m === 'sit') {
      sitTargets(); S.activity = 'sitting';
      if (T('sitLen', 12, 24) && !S.plan) { delete S.timers.sitLen; setMode('rise', 'restless'); return; }
      if (T('shift', 3, 8)) { resetT('shift', 4, 9); P.roll.g = rr(-0.07, 0.07); P.px.g = P.roll.g * -0.25; S.sitPitch = 0.21 + rr(-0.05, 0.08); ev('weight-shift', { roll: +P.roll.g.toFixed(3) }); }
      if (!S.plan && T('hand', 5, 11)) {
        resetT('hand', 6, 14); const l = rnd() < 0.5 ? L.handL : L.handR;
        if (rnd() < 0.45) { // bring a hand up and look at it
          freeLimb(l, [0.07 * l.side, 0.47, 0.32], 'inspect', 'inspect');
          S.plan = { kind: 'inspect', l, until: S.t + rr(3, 5.5) }; S.activity = 'looking at its hand';
          S.gaze.lockOn = null; lookAt(l.p.clone(), 'its own hand', [99, 99]); S.gaze.lockOn = () => l.end.g.getWorldPosition(V3()).add(V3(0, 0.0, 0));
        } else { const n = NEUTRAL.sit.arm(l.side); swing(l, toWorld(n[0] + rr(-0.06, 0.05) * l.side, A.wristPalm, n[2] + rr(-0.08, 0.12)), rr(0.6, 0.9), 0.07, 'palm', 'reposition'); }
      }
      if (S.plan && S.plan.kind === 'inspect') {
        S.activity = 'looking at its hand';
        if (S.t > S.plan.until) { const l = S.plan.l, n = NEUTRAL.sit.arm(l.side); swing(l, toWorld(n[0], A.wristPalm, n[2] + rr(-0.04, 0.08)), 0.9, 0.05, 'palm', 'put down'); S.gaze.lockOn = null; S.plan = null; S.gaze.next = S.t + rr(0.4, 1); }
      }
      if (!S.gaze.lockOn && S.t > S.gaze.next) { const [p, lb] = studioPoint(); lookAt(p, lb); }
    }
    // ----- RISE onto fists and feet -----
    else if (m === 'rise') {
      S.activity = 'getting up';
      if (!S.plan) { S.plan = { start: S.pos.clone(), hands: 0 }; S.gaze.lockOn = null; lookAt(toWorld(0, 0.05, 1.0), 'where it will put its hands', [3, 3]); for (const l of LIMBS) if (l.mode === 'free') l.mode = 'plant', l.plant.copy(l.p); }
      P.pitch.g = mt < 0.9 ? 0.62 : 0.87; P.chestPitch.g = 0; P.roll.g = 0; P.px.g = 0;
      if (mt > 0.15 && S.plan.hands === 0) { swing(L.handL, toWorld(...NEUTRAL.quad.arm(1)), 0.65, 0.09, 'fist', 'reach forward'); S.plan.hands = 1; }
      if (mt > 0.5 && S.plan.hands === 1) { swing(L.handR, toWorld(...NEUTRAL.quad.arm(-1)), 0.65, 0.09, 'fist', 'reach forward'); S.plan.hands = 2; }
      if (mt > 1.15) { const k = smoother((mt - 1.15) / 1.5); P.py.g = lerp(SIT_PY, QUAD_PY, k); S.pos.copy(S.plan.start).addScaledVector(fwd(), TRAVEL * k); if (!S.plan.moved) { S.plan.moved = true; ev('lift-off', {}); } }
      if (mt > 2.75) { for (const l of LIMBS) if (l.kind === 'leg') l.grip = 'walk'; setMode('quad', 'up'); }
    }
    // ----- QUADRUPEDAL STANCE -----
    else if (m === 'quad') {
      Object.assign(gs(), { py: QUAD_PY, pz: 0, pitch: 0.87, chestPitch: 0, roll: 0, px: 0 }); S.activity = 'standing on fists and feet';
      if (settle()) return;
      if (!S.gaze.lockOn && S.t > S.gaze.next) { const [p, lb] = studioPoint(); lookAt(p, lb, [0.8, 2.5]); }
      if (mt > (S.plan && S.plan.hold || (S.plan = { hold: rr(1.5, 3.5) }).hold)) {
        if (rnd() < (S.walked >= 2 ? 0.35 : 0.8)) startWalk(); else setMode('sitdown', 'tired of standing');
      }
    }
    // ----- WALK (lateral-sequence quadrupedal, fist-walking) -----
    else if (m === 'walk') { walkTick(dt); }
    // ----- SIT DOWN -----
    else if (m === 'sitdown') {
      S.activity = 'sitting down';
      if (!S.plan) { S.plan = { start: S.pos.clone(), hands: 0 }; lookAt(toWorld(0, 0.02, 0.6), 'the floor ahead', [3, 3]); ev('sit-down', {}); }
      const k = smoother(mt / 1.7); P.py.g = lerp(QUAD_PY, SIT_PY, k); P.pitch.g = lerp(0.87, 0.24, smoother(mt / 2.0)); S.pos.copy(S.plan.start).addScaledVector(fwd(), -TRAVEL * k);
      if (mt > 0.35 && S.plan.hands === 0) { const n = NEUTRAL.sit.arm(1); swing(L.handL, toWorld(n[0], n[1], n[2], S.plan.start.clone().addScaledVector(fwd(), -TRAVEL), S.heading), 1.0, 0.08, 'palm', 'sit'); S.plan.hands = 1; }
      if (mt > 0.8 && S.plan.hands === 1) { const n = NEUTRAL.sit.arm(-1); swing(L.handR, toWorld(n[0], n[1], n[2], S.plan.start.clone().addScaledVector(fwd(), -TRAVEL), S.heading), 1.0, 0.08, 'palm', 'sit'); S.plan.hands = 2; }
      if (mt > 2.3) { for (const l of LIMBS) if (l.kind === 'leg') l.grip = 'sit'; setMode('sit', 'down'); S.walked = 0; }
    }
    // safety: a planted limb that would be stretched past its reach is lifted and re-placed rather than dragged
    for (const l of LIMBS) if (l.mode === 'plant' && l.reach > 0.97 && !(S.mode === 'walk' && LIMBS.some(o => o.mode === 'swing' && o.kind === l.kind))) {
      const pose = S.mode === 'sit' || S.mode === 'sitdown' ? 'sit' : 'quad';
      swing(l, toWorld(...neutralLocal(l, pose)), 0.5, 0.05, l.grip, 'out of reach');
    }
  }
  function settle() { // step any limb that ended far from its neutral contact, one at a time, hind limbs first
    if (LIMBS.some(l => l.mode === 'swing')) return true;
    const order = [L.footL, L.footR, L.handL, L.handR];
    for (const l of order) { const n = toWorld(...neutralLocal(l, 'quad')); n.y = l.plant.y; if (l.plant.distanceTo(n) > 0.075) { swing(l, toWorld(...neutralLocal(l, 'quad')), 0.45, l.kind === 'arm' ? 0.07 : 0.05, l.kind === 'arm' ? 'fist' : 'walk', 'settle'); return true; } }
    return false;
  }
  function startWalk() {
    let g; for (let i = 0; i < 12; i++) { const a = rr(0, Math.PI * 2), r = rr(0.2, 1.15); g = V3(Math.cos(a) * r, 0, Math.sin(a) * r); if (g.distanceTo(S.pos) > 0.7) break; }
    S.goal = g; S.walked = (S.walked || 0) + 1; S.gait.phase = 0; for (const l of LIMBS) l.gaitSwing = false; setMode('walk', 'goes somewhere'); ev('goal', { x: +g.x.toFixed(2), z: +g.z.toFixed(2) });
  }
  // diagonal-sequence walk: each hind footfall is followed by the opposite hand (predominant in wild P. pygmaeus, Orlikoff et al. 2026, #63).
  // The phase offsets themselves are not published; evenly spaced quarters are a placeholder (Inferred).
  const TD = { footL: 0, handR: 0.25, footR: 0.5, handL: 0.75 };
  function walkTick(dt) {
    const P = S.P, G = S.gait; S.activity = 'walking';
    Object.assign(gs(), { pz: 0, pitch: 0.87, chestPitch: 0 });
    const to = S.goal.clone().sub(S.pos); to.y = 0; const dist = to.length();
    const want = Math.atan2(to.x, to.z), dh = wrapPi(want - S.heading);
    const arriving = dist < 0.12;
    const vWant = arriving ? 0 : Math.min(VMAX, dist * 0.6) * (Math.abs(dh) > 1.2 ? 0.35 : 1);
    S.speed += clamp(vWant - S.speed, -0.35 * dt, 0.3 * dt);
    S.yawRate = clamp(dh * 1.2, -0.45, 0.45) * clamp(S.speed / 0.12 + 0.3, 0, 1);
    S.heading = wrapPi(S.heading + S.yawRate * dt); S.pos.addScaledVector(fwd(), S.speed * dt);
    // gait clock advances with distance travelled, so slow walking keeps each foot down longer
    // the gait clock counts turning as travel too (a limb ~0.45 m from the pivot moves with the turn)
    const ve = S.speed + Math.abs(S.yawRate) * 0.45;
    const stride = VMAX * G.T; const dph = (Math.max(ve, arriving ? 0 : 0.06) / stride) * dt; G.phase = (G.phase + dph) % 1;
    const cycleT = stride / Math.max(ve, 0.06), swingT = clamp((1 - G.duty) * cycleT, 0.4, 0.8);
    for (const l of LIMBS) {
      const ph = ((G.phase - TD[l.name]) % 1 + 1) % 1;
      if (ph >= G.duty && !l.gaitSwing && l.mode === 'plant') {
        l.gaitSwing = true;
        // place the limb at its neutral contact for where the body will be at mid-stance (forward travel and turning both)
        const tm = Math.min(swingT + G.duty * cycleT * 0.5, 2.5); let hd = S.heading, pos = S.pos.clone();
        for (let k = 0; k < 10; k++) { hd += S.yawRate * tm / 10; pos.addScaledVector(V3(Math.sin(hd), 0, Math.cos(hd)), S.speed * tm / 10); }
        const n = neutralLocal(l, 'quad'); let grip = l.kind === 'arm' ? 'fist' : 'walk';
        if (l.kind === 'arm') { if (rnd() < A.palmStepP) { grip = 'palm'; n[1] = A.wristPalm + 0.01; } l.wristExt = rnd() < 0.45 ? 0.15 : 0.4; } // 19 extended / 23 neutral fist wrists (#63)
        swing(l, toWorld(n[0], n[1], n[2], pos, hd), swingT, l.kind === 'arm' ? 0.08 : 0.06, grip, 'step');
      }
      if (ph < G.duty) l.gaitSwing = false;
    }
    // a slight roll toward whichever side bears weight, a small bob twice a cycle
    P.roll.g = 0.035 * Math.sin(G.phase * Math.PI * 2) * clamp(S.speed / 0.25, 0, 1); P.py.g = QUAD_PY + 0.012 * Math.cos(G.phase * Math.PI * 4) * clamp(S.speed / 0.25, 0, 1);
    S.breath.rate.g = 22;
    if (!S.gaze.lockOn && S.t > S.gaze.next) { if (rnd() < 0.7) lookAt(S.pos.clone().addScaledVector(fwd(), rr(0.9, 1.8)).setY(0.02), 'the way ahead', [0.8, 2]); else { const [p, lb] = studioPoint(); lookAt(p, lb, [0.6, 1.4]); } }
    if (arriving && S.speed < 0.02 && !LIMBS.some(l => l.mode === 'swing')) { S.speed = 0; S.yawRate = 0; setMode('quad', 'arrived'); }
  }

  // ---------- place the trunk, then solve the limbs ----------
  function poseBody() {
    const P = S.P;
    body.position.set(S.pos.x, 0, S.pos.z); body.rotation.set(0, S.heading, 0);
    pelvis.position.set(P.px.p, P.py.p, P.pz.p); pelvis.rotation.set(P.pitch.p, 0, P.roll.p, 'YXZ');
    chest.rotation.set(P.chestPitch.p, P.chestYaw.p, 0, 'YXZ');
    // breathing: belly and ribcage, rate rises after effort and decays
    const b = S.breath; const s = Math.sin(b.phase * Math.PI * 2) * 0.5 + 0.5;
    thorax.scale.set(1 + 0.022 * s * b.depth.p, 1 + 0.01 * s, 1 + 0.03 * s * b.depth.p); belly.scale.set(1 + 0.03 * s * b.depth.p, 1, 1 + 0.04 * s * b.depth.p);
    // head: world-level yaw/pitch from attention, expressed in the neck's frame
    const hq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-S.gaze.headPitch.p, S.heading + S.gaze.headYaw.p, 0, 'YXZ'));
    neck.parent.updateWorldMatrix(true, false); const pq = neck.parent.getWorldQuaternion(new THREE.Quaternion());
    const nq = pq.clone().invert().multiply(hq); neck.quaternion.copy(new THREE.Quaternion().slerp(nq, 0.45)); neck.updateWorldMatrix(true, false);
    const nwq = neck.getWorldQuaternion(new THREE.Quaternion()); head.quaternion.copy(nwq.invert().multiply(hq));
    root.updateMatrixWorld(true);
    // blink
    const bl = S.blink, k = bl.t >= 0 ? clamp((S.t - bl.t) / 0.16, 0, 1) : 1, closed = bl.t >= 0 ? Math.sin(Math.PI * k) : 0;
    for (const e of eyes) e.lid.scale.y = 0.05 + 0.95 * closed;
  }
  const SH = { arm: V3(), leg: V3() };
  function solveLimbs() {
    const F = fwd(), Lf = left();
    for (const l of LIMBS) {
      const base = (l.kind === 'arm' ? chest.localToWorld(V3(A.shoulderHalf * l.side, A.spine - 0.04, -0.01)) : pelvis.localToWorld(V3(A.hipHalf * l.side, 0, -0.01)));
      if (l.kind === 'arm') { // scapular mobility: the shoulder slides a few cm toward a far target
        const dir = l.p.clone().sub(base), dd = dir.length(); const extra = clamp((dd / (l.l1 + l.l2) - 0.8) * 0.25, 0, 0.05); base.addScaledVector(dir.normalize(), extra);
      }
      // wrist / ankle target is the contact; poles: elbows back and out, knees forward and out
      let pole = l.kind === 'arm' ? F.clone().multiplyScalar(-1).addScaledVector(Lf, 0.55 * l.side).addScaledVector(UP, -0.2) : F.clone().addScaledVector(Lf, 0.75 * l.side).addScaledVector(UP, S.mode === 'sit' ? 0.9 : 0.15);
      if (l.kind === 'arm' && l.grip === 'inspect') pole = DOWN.clone().addScaledVector(Lf, 0.6 * l.side).addScaledVector(F, -0.3);
      l.pole = l.pole ? l.pole.lerp(pole, 0.08) : pole.clone();
      const r = solve(l, base, l.p, l.pole);
      // end segment orientation
      let dir, dorsal;
      if (l.kind === 'arm') {
        if ((l.mode !== 'swing' && l.grip === 'fist') || (l.mode === 'swing' && l.nextGrip === 'fist')) { dir = DOWN.clone().addScaledVector(F, l.wristExt ?? 0.35); dorsal = F.clone().addScaledVector(Lf, 0.2 * l.side); }
        else if (l.grip === 'inspect') { const toFace = headPivot().sub(r.wrist).normalize(); dir = UP.clone().addScaledVector(F, 0.25).addScaledVector(Lf, -0.3 * l.side); dorsal = toFace.multiplyScalar(-1); }
        else { dir = F.clone().addScaledVector(Lf, 0.55 * l.side).addScaledVector(DOWN, 0.12); dorsal = UP.clone(); }
        if (l.mode === 'swing') dir.lerp(r.wrist.clone().sub(r.elbow).normalize(), 0.5 * Math.sin(Math.PI * clamp((S.t - l.t0) / l.dur, 0, 1)));
      } else {
        const seated = l.grip === 'sit' || S.mode === 'sit' || S.mode === 'sitdown', out = seated ? 0.6 : 0.32;
        dir = F.clone().addScaledVector(Lf, out * l.side).addScaledVector(DOWN, 0.05);
        // up on fists and feet the foot is inverted onto its outer edge (#63: inversion variable, toes curled when visible)
        dorsal = seated ? UP.clone() : UP.clone().addScaledVector(Lf, 0.4 * l.side);
        if (l.mode === 'swing') { const k = clamp((S.t - l.t0) / l.dur, 0, 1); dir.addScaledVector(DOWN, 0.25 * Math.sin(Math.PI * Math.min(1, k / 0.6))); dir.addScaledVector(UP, 0.35 * smooth((k - 0.6) / 0.4)); } // toes down off the ground, heel first into contact (34/37 heel strikes, #63)
      }
      const tmp = new THREE.Object3D(); orient(tmp, r.wrist, dir, dorsal);
      const e = l.end.g; e.position.copy(r.wrist); if (!l.q) l.q = tmp.quaternion.clone(); else l.q.slerp(tmp.quaternion, 0.18); e.quaternion.copy(l.q);
      // digits
      const c = l.curl.p;
      if (l.kind === 'arm') { l.end.fingers.forEach((f, i) => f.forEach((j, k) => { j.rotation.x = c * (k === 0 ? 1.25 : 1.45) + 0.15; j.rotation.z = (i - 1.5) * 0.04 * l.side; })); l.end.thumb[0].rotation.x = 0.3 + c * 0.6; l.end.thumb[1].rotation.x = c * 0.8; }
      else { l.end.toes.forEach(t => t.forEach((j, k) => { j.rotation.x = c * (k === 0 ? 0.9 : 1.1) + 0.1; })); l.end.hallux[0].rotation.x = c * 0.4; l.end.hallux[1].rotation.x = c * 0.6; }
      l.wristW = r.wrist; l.elbowW = r.elbow; l.baseW = base;
    }
  }

  // ---------- locks ----------
  const _lm = new THREE.Matrix4(), _lq = new THREE.Quaternion(), _ls = V3(), _lp = V3();
  let WIND = { t: 0, amt: 1 };
  function locksTick(dt) {
    const gust = 0.42 + 0.22 * Math.sin(WIND.t * 0.0648) + 0.16 * Math.sin(WIND.t * 0.153 + 1.3);
    const wind = V3(Math.sin(WIND.t * 0.52) + 0.4 * Math.sin(WIND.t * 1.31 + 1.0), 0, 0.6 * Math.sin(WIND.t * 0.41 + 2.0)).multiplyScalar(0.35 * WIND.amt * clamp(gust, 0.12, 0.95));
    root.updateMatrixWorld(true);
    lockAnchors.forEach((a, i) => {
      _lp.copy(a.local).applyMatrix4(a.parent.matrixWorld);
      const vel = a.prev ? _lp.clone().sub(a.prev).divideScalar(dt) : V3(); a.prev = a.prev ? a.prev.copy(_lp) : _lp.clone();
      const tgt = a.bias ? V3(0, 1, 0).applyQuaternion(a.parent.getWorldQuaternion(_lq)).add(V3(0, 0.6, 0)).normalize() : DOWN.clone().add(wind).addScaledVector(vel, -1.4).normalize();
      const w = a.bias ? 14 : 7; const acc = tgt.sub(a.d).multiplyScalar(w * w).addScaledVector(a.v, -1.1 * w); a.v.addScaledVector(acc, dt); a.d.addScaledVector(a.v, dt).normalize();
      _lq.setFromUnitVectors(DOWN, a.d); _ls.set(a.w, a.len, a.w); _lm.compose(_lp, _lq, _ls); locks.setMatrixAt(i, _lm);
    });
    locks.instanceMatrix.needsUpdate = true;
  }

  // ---------- the fixed step ----------
  let lastPelvis = null;
  function step(h) {
    S.t += h;
    behave(h);
    for (const k in S.P) stepSpring(S.P[k], S.mode === 'rise' || S.mode === 'sitdown' ? 3.4 : 2.6, h);
    const b = S.breath; if (S.mode !== 'walk') b.rate.g = 14; stepSpring(b.rate, 0.25, h); b.depth.g = S.mode === 'walk' ? 1.6 : 1; stepSpring(b.depth, 0.8, h); b.phase = (b.phase + b.rate.p / 60 * h) % 1;
    if (S.t >= S.blink.next) { S.blink.t = S.t; S.blink.next = S.t + rr(2.5, 7); }
    for (const l of LIMBS) limbTick(l, h);
    poseBody(); gazeTick(h); poseBody(); solveLimbs(); locksTick(h);
    // metrics
    const pp = pelvis.getWorldPosition(V3());
    if (lastPelvis) { const d = pp.distanceTo(lastPelvis); metrics.maxPelvisStep = Math.max(metrics.maxPelvisStep || 0, d); }
    lastPelvis = pp;
    for (const l of LIMBS) {
      if (l.slip > (metrics.maxSlip || 0)) { metrics.maxSlip = l.slip; metrics.worstSlip = { limb: l.name, t: +S.t.toFixed(2), state: S.mode, reach: +l.reach.toFixed(3) }; }
      if (l.reach > (metrics.maxReach || 0)) { metrics.maxReach = l.reach; metrics.worstReach = { limb: l.name, t: +S.t.toFixed(2), state: S.mode, mode: l.mode }; }
      if (l.mode === 'plant' && l.slip > 0.005) metrics.slipSteps = (metrics.slipSteps || 0) + 1;
      l.slip = 0;
    }
    metrics.steps = (metrics.steps || 0) + 1;
  }

  // ---------- public API ----------
  function reset(seed = config.seed || 1) {
    S = freshState(seed); acc = 0; log.length = 0; for (const k in metrics) delete metrics[k]; lastPelvis = null;
    initLimbs('sit'); for (const a of lockAnchors) { a.d.set(0, -1, 0); a.v.set(0, 0, 0); a.prev = null; }
    ev('reset', { seed }); poseBody(); solveLimbs(); locksTick(H);
  }
  function update(dt, t, wind) {
    if (wind) { WIND.t = wind.t; WIND.amt = wind.amt; }
    acc += Math.min(dt, 0.25); let n = 0; while (acc >= H && n < 8) { step(H); acc -= H; n++; } if (n === 8) acc = 0;
  }
  const _box = new THREE.Box3();
  function bounds() { _box.makeEmpty(); for (const o of bodyMeshes) _box.expandByObject(o); return _box.clone(); }
  function observe() {
    const w = o => o.getWorldPosition(V3());
    return {
      state: S.mode, activity: S.activity, t: S.t, speed: S.speed, heading: S.heading,
      pelvis: w(pelvis), chest: chest.localToWorld(V3(0, A.spine * 0.6, 0.05)), head: headPivot(), face: head.localToWorld(V3(0, 0.06, 0.12)),
      eyes: eyes[0].g.getWorldPosition(V3()).add(eyes[1].g.getWorldPosition(V3())).multiplyScalar(0.5), gaze: S.gaze.tgt.clone(), gazeLabel: S.gaze.label,
      hands: { L: L.handL.end.g.getWorldPosition(V3()), R: L.handR.end.g.getWorldPosition(V3()) },
      feet: { L: L.footL.end.g.getWorldPosition(V3()), R: L.footR.end.g.getWorldPosition(V3()) },
      shoulders: { L: L.handL.baseW.clone(), R: L.handR.baseW.clone() },
      contacts: LIMBS.filter(l => l.mode === 'plant').map(l => ({ limb: l.name, p: l.plant.clone() })),
      inspecting: S.plan && S.plan.kind === 'inspect' ? S.plan.l.name : null,
    };
  }
  reset(config.seed || 1);
  return { root, update, bounds, observe, reset, log, metrics, anatomy: A, version: VERSION, get state() { return S; } };
}
