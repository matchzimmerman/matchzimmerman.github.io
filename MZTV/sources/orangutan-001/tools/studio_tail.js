/* ---------- MZCAM: the four-drone documentary crew from 48 PLANT, filming through real Three lenses ---------- */
// lens adapter, the same mapping BIT FIELD 037 / 039 use: a crew lens {pos, look, fov (vertical, degrees)} -> THREE.PerspectiveCamera.
// The crew is presentation only: it reads the animal's observe() points and never writes to the animal.
const PROG = new THREE.PerspectiveCamera(32, 1, 0.01, 60);
const TILES = [0, 1, 2, 3].map(() => new THREE.PerspectiveCamera(32, 16 / 9, 0.01, 60));
function lensCam(d, cam, aspect) {
  if (!d || !d.cam) return camera;
  cam.position.set(d.cam.pos.x, d.cam.pos.y, d.cam.pos.z); cam.up.set(0, 1, 0); cam.lookAt(d.cam.look.x, d.cam.look.y, d.cam.look.z);
  cam.fov = d.cam.fov; cam.aspect = aspect; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); return cam;
}
const CREW = { on: false }, BAY = { on: Q.get('bay') !== '0' }, BAYR = [];
// 48 PLANT's crew: CAM 1 pink close, CAM 2 yellow orbit, CAM 3 turquoise wide, CAM 4 orange low crane
const DRONE_SPEC = [{ name: 'CAM 1', role: 'close', col: '#ff3d8b' }, { name: 'CAM 2', role: 'orbit', col: '#f4dc2a' }, { name: 'CAM 3', role: 'wide', col: '#18c2bb' }, { name: 'CAM 4', role: 'low', col: '#ff7a1a' }];
const DRONES = DRONE_SPEC.map(sp => {
  const g = new THREE.Group(), ink = new THREE.MeshStandardMaterial({ color: '#2b2a33', roughness: 0.6 });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, 0.08), ink));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.093, 0.012, 0.083), new THREE.MeshStandardMaterial({ color: sp.col, roughness: 0.7 })));
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.022, 12).rotateX(Math.PI / 2), ink); lens.position.z = 0.05; g.add(lens);
  const tally = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshStandardMaterial({ color: '#ff3d8b', emissive: '#ff3d8b', emissiveIntensity: 0 })); tally.position.set(0, 0.024, 0.03); g.add(tally);
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.003, 14), ink); r.position.set(x * 0.062, 0.022, z * 0.056); g.add(r); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.visible = false; g.userData.tally = tally; scene.add(g); return g;
});
const MV = (x, y, z) => MZCam.V(x, y, z), C3 = v => MZCam.V(v.x, v.y, v.z);
let OBS = null, simT = 0, crew = null;
const crand = (() => { let s = (SEED * 7919 + 13) % 2147483647; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(); // the crew's own dice, separate from the animal's
const rr = (a, b) => a + (b - a) * crand(), cl = (v, a, b) => Math.max(a, Math.min(b, v));
function avoid(p) { // inside the cyc, above the floor, and never closer than ~half a metre to the animal
  let x = p.x, y = cl(p.y, 0.1, 3.2), z = p.z; const r = Math.hypot(x, z); if (r > 4.6) { x *= 4.6 / r; z *= 4.6 / r; }
  if (OBS) { const c = OBS.chest, dx = x - c.x, dy = y - c.y, dz = z - c.z, d = Math.hypot(dx, dy, dz), R = 0.8; if (d < R) { const k = R / Math.max(d, 1e-3); x = c.x + dx * k; y = c.y + dy * k; z = c.z + dz * k; } }
  return MV(x, y, z);
}
const around = (p, hd, ang, dist, y) => MV(p.x + Math.sin(hd + ang) * dist, y, p.z + Math.cos(hd + ang) * dist);
// operator framing: pick the lens angle that keeps a subject of `size` metres filling the frame height at the current distance
const frame = (d, look, size, lo = 9, hi = 55) => { const r = Math.hypot(look.x - d.pos.x, look.y - d.pos.y, look.z - d.pos.z); return cl(2 * Math.atan(size / 2 / Math.max(r, 0.05)) * 180 / Math.PI, lo, hi); };
const near = (d, p, r = 0.8) => Math.hypot(p.x - d.pos.x, p.y - d.pos.y, p.z - d.pos.z) < r; // the animal has come too close for this setup
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 });
const side = () => (crand() < 0.5 ? 1 : -1);
// the shot grammar: marks are chosen from where the animal is when the shot is set up; aims follow it live
const KINDS = {
  'FACE · CLOSE': { base: o => 1.1 + (o.state === 'sit' ? 0.7 : 0) + (o.state === 'quad' ? 0.3 : 0), make(o) { const t0 = simT, life = rr(14, 26);
    const still = o.state === 'sit'; return { label: 'FACE · CLOSE', pan: 1.3, minHold: 3, maxHold: 13, mark: { pos: avoid(around(o.face, o.heading, still ? rr(-0.75, 0.75) : side() * rr(1.3, 1.9), still ? rr(0.9, 1.25) : rr(1.4, 1.8), o.face.y + rr(-0.04, 0.12))) },
      aim: (t, d) => ({ look: C3(OBS.face), fov: frame(d, OBS.face, 0.36) }), want: (t, d) => near(d, OBS.face) ? 0 : KINDS['FACE · CLOSE'].base(OBS), done: (t, d) => simT - t0 > life || near(d, OBS.face, 0.85) }; } },
  'HANDS': { base: o => (o.inspecting ? 3.2 : o.state === 'sit' ? 0.8 : 0.4), make(o) { const t0 = simT, life = rr(10, 18), k = o.inspecting ? o.inspecting.slice(-1) : (crand() < 0.5 ? 'L' : 'R'), h = o.hands[k];
    return { label: o.inspecting ? 'HANDS · WHAT IT IS LOOKING AT' : 'HANDS', pan: 2, minHold: 4, maxHold: 11, mark: { pos: avoid(around(h, o.heading, side() * rr(0.4, 1.3), rr(0.7, 0.95), h.y + rr(0.05, 0.2))) },
      aim: (t, d) => ({ look: C3(OBS.hands[k]), fov: frame(d, OBS.hands[k], 0.42) }), want: (t, d) => near(d, OBS.hands[k]) ? 0 : KINDS.HANDS.base(OBS) + (OBS.inspecting && OBS.inspecting.slice(-1) === k ? 0.6 : 0), done: () => simT - t0 > life }; } },
  'CONTACT · LOW': { base: o => (o.state === 'walk' ? 2.0 : o.state === 'rise' || o.state === 'sitdown' ? 1.8 : 0.45), make(o) { const t0 = simT, life = rr(10, 20);
    return { label: 'CONTACT · LOW', pan: 1.6, minHold: 3, maxHold: 12, mark: { pos: avoid(around(o.pelvis, o.heading, side() * rr(1.4, 2.2), rr(1.5, 1.9), rr(0.1, 0.16))) },
      aim: (t, d) => { const f = mid(OBS.feet.L, OBS.feet.R), h = mid(OBS.hands.L, OBS.hands.R), look = MV((f.x + h.x) / 2, 0.1, (f.z + h.z) / 2); return { look, fov: frame(d, look, 1.2, 20, 60) }; }, want: (t, d) => near(d, OBS.pelvis, 1.0) ? 0 : KINDS['CONTACT · LOW'].base(OBS), done: (t, d) => simT - t0 > life || near(d, OBS.pelvis, 0.95) }; } },
  'PROFILE': { base: () => 0.9, make(o) { const t0 = simT, life = rr(12, 22);
    return { label: 'PROFILE', pan: 1.1, minHold: 5, maxHold: 13, mark: { pos: avoid(around(o.head, o.heading, side() * Math.PI / 2, rr(1.4, 1.8), o.head.y)) }, aim: (t, d) => ({ look: C3(OBS.head), fov: frame(d, OBS.head, 0.9) }), want: (t, d) => near(d, OBS.head) ? 0 : 0.9, done: () => simT - t0 > life }; } },
  'WIDE · THE STUDIO': { base: o => 1.0 + (o.state === 'walk' ? 0.9 : 0), make() { const t0 = simT, life = rr(16, 28), a = rr(0, Math.PI * 2);
    return { label: 'WIDE · THE STUDIO', pan: 0.8, minHold: 6, maxHold: 15, mark: { pos: avoid(MV(Math.sin(a) * 3.9, rr(0.9, 1.4), Math.cos(a) * 3.9)) }, aim: () => ({ look: C3(OBS.pelvis), fov: 30 }), want: () => KINDS['WIDE · THE STUDIO'].base(OBS), done: () => simT - t0 > life }; } },
  'ORBIT': { base: () => 1.0, make(o) { const t0 = simT, life = rr(18, 30), dir = side(), a0 = o.heading + rr(-1, 1);
    return { label: 'ORBIT', pan: 1.2, minHold: 6, maxHold: 16, pose: t => ({ pos: avoid(around(OBS.pelvis, 0, a0 + (t - t0) * 0.09 * dir, 1.9, 0.85)) }), aim: () => ({ look: C3(OBS.chest), fov: 26 }), want: () => 1.0, done: () => simT - t0 > life }; } },
  'LOW · CRANE': { base: () => 0.95, make(o) { const t0 = simT, life = rr(14, 24), a = o.heading + side() * rr(0.3, 1.2), base = around(o.pelvis, 0, a, 1.5, 0.14); const sh = { label: 'LOW · CRANE', pan: 1.0, minHold: 6, maxHold: 14, airAt: -1, onAir: () => { sh.airAt = simT; },
      pose: t => ({ pos: avoid(MV(base.x, 0.14 + 0.95 * cl(sh.airAt < 0 ? 0 : (t - sh.airAt) / 14, 0, 1), base.z)) }), aim: () => ({ look: C3(OBS.head), fov: 24 }), want: () => 0.95, done: () => simT - t0 > life }; return sh; } },
  'OVERHEAD': { base: () => 0.55, make(o) { const t0 = simT, life = rr(10, 18);
    return { label: 'OVERHEAD', pan: 0.9, minHold: 5, maxHold: 11, mark: { pos: avoid(MV(o.pelvis.x + rr(-0.35, 0.35), 2.7, o.pelvis.z + rr(-0.35, 0.35))) }, aim: () => ({ look: C3(OBS.pelvis), fov: 34 }), want: () => 0.55, done: () => simT - t0 > life }; } },
};
const ROLE_KINDS = { close: ['FACE · CLOSE', 'HANDS', 'PROFILE'], orbit: ['ORBIT', 'PROFILE', 'OVERHEAD'], wide: ['WIDE · THE STUDIO', 'OVERHEAD'], low: ['LOW · CRANE', 'CONTACT · LOW'] };
function crewAssign() {
  for (const d of crew.free()) {
    const busy = new Set(crew.drones.filter(x => x.shot && x !== d).map(x => x.shot.kind));
    let best = null, bw = -1; for (const k of ROLE_KINDS[d.role]) { if (busy.has(k)) continue; const w = KINDS[k].base(OBS) + crand() * 0.9; if (w > bw) { bw = w; best = k; } }
    if (best) { const sh = KINDS[best].make(OBS); sh.kind = best; crew.assign(d, sh); }
  }
}
const CUTS = [];
function initCrew() {
  OBS = SUBJ.observe();
  crew = new MZCam.Crew({ drones: DRONE_SPEC.map((d, i) => ({ ...d, pos: MV(Math.cos(i * 1.57 + 0.4) * 3.6, 1.2, Math.sin(i * 1.57 + 0.4) * 3.6) })),
    speed: 1.4, accel: 1.1, cruise: 1.6, minAlt: 0.1, arrive: 0.04, clearDist: 4, avoid,
    onCut: (from, to) => { CUTS.push({ t: +simT.toFixed(2), from: from.name, to: to.name, shot: to.shot ? to.shot.label : '' }); if (CUTS.length > 500) CUTS.shift(); } });
  crewAssign(); for (const d of crew.drones) { const g = crew._goal(d, simT); if (g) { d.pos = g.pos; d.arrivedAt = 0; } } crew.update(0.02, simT);
}
const _fw = new THREE.Vector3();
function crewTick(dt) {
  simT += dt; OBS = SUBJ.observe(); crewAssign(); crew.update(dt, simT);
  crew.drones.forEach((d, i) => { const m = DRONES[i]; m.position.set(d.pos.x, d.pos.y, d.pos.z); if (d.cam) { _fw.set(d.pos.x + d.cam.f.x, d.pos.y + d.cam.f.y, d.pos.z + d.cam.f.z); m.lookAt(_fw); } m.userData.tally.material.emissiveIntensity = i === crew.live ? 1.6 : 0; });
}
// the four monitors: drawn into the same frame before the print pass, so they carry the same inks and dither
function bay(W, H, isRT) {
  const w = Math.round(W * 0.2), h = Math.round(w * 9 / 16), m = Math.max(4, Math.round(W * 0.012));
  crew.drones.forEach((d, i) => {
    const x = W - w - m, y = H - (m + (i + 1) * h + i * m); if (y < 0) return;
    const cam = lensCam(d, TILES[i], w / h); DRONES.forEach((g, k) => { g.visible = k !== i; });
    if (isRT) { rt.viewport.set(x, y, w, h); rt.scissor.set(x, y, w, h); rt.scissorTest = true; renderer.setRenderTarget(rt); }
    else { renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h); renderer.setScissorTest(true); }
    renderer.render(scene, cam); BAYR[i] = { x: x / W, y: y / H, w: w / W, h: h / H };
  });
  if (isRT) { rt.scissorTest = false; rt.viewport.set(0, 0, rt.width, rt.height); renderer.setRenderTarget(rt); } else { renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight); }
  DRONES.forEach((g, k) => { g.visible = k !== crew.live; });
}

/* ---------- labels ---------- */
let hudAt = 0;
function hud(now) {
  if (now - hudAt < 250 || !SUBJ || SUBJECT === 'test') return; hudAt = now;
  const o = SUBJ.observe(), S = SUBJ.state, br = Math.round(S.breath.rate.p);
  $('src').textContent = `${o.activity} · breathing ${br}/min · looking at ${o.gazeLabel}`;
  if (CREW.on) {
    const d = crew.liveDrone; $('label').innerHTML = `<div class="t">ON AIR · ${d.name} · ${d.shot ? d.shot.label : ''}</div><div class="dim">ORANGUTAN 001 · ${o.activity}</div>`;
    if (BAY.on) $('bay').innerHTML = crew.drones.map((x, i) => { const r = BAYR[i]; if (!r) return ''; return `<div class="m${i === crew.live ? ' on' : ''}" style="left:calc(${(r.x * 100).toFixed(2)}vw + 3px);top:calc(${((1 - r.y - r.h) * 100).toFixed(2)}vh + 3px);max-width:calc(${(r.w * 100).toFixed(2)}vw - 14px)"><b style="color:${x.col}">■</b> <b>${x.name}</b> · ${x.shot ? x.shot.label : ''} · ${x.status}</div>`; }).join('');
  } else $('label').innerHTML = `<div class="t">ORANGUTAN 001</div><div class="dim">source-built · ${o.activity}</div>`;
}

/* ---------- build the subject ---------- */
let SUBJ = null; const PERF = { sim: 0, render: 0, frames: 0, dt: [] };
(async () => {
  frameAll(true); requestAnimationFrame(loop);
  try {
    status(SUBJECT === 'test' ? 'PLACING THE TEST SUBJECT …' : 'BUILDING THE ANIMAL FROM ITS CODE …'); await new Promise(r => setTimeout(r, 30));
    SUBJ = SUBJECT === 'test' ? testSubject() : createCreature(THREE, { seed: SEED });
    scene.add(SUBJ.root);
    const ff = Math.min(1800, +(Q.get('t') || 0)); if (ff > 0 && SUBJECT !== 'test') for (let k = 1; k <= ff * 60; k++) SUBJ.update(1 / 60, k / 60, { t: k / 60, amt: 1 });
    BOX = SUBJ.bounds();
    if (SUBJECT !== 'test') { initCrew(); $('src').textContent = 'built from code · ' + VERSION; } else { $('src').textContent = 'a still test form · no animal'; $('bCrew').disabled = true; }
    frameAll(true); status('');
    if (Q.get('crew') === '1' && crew) toggleCrew(true);
    window.STUDIO_READY = true;
  } catch (e) { console.error(e); status('THE ANIMAL COULD NOT BE BUILT'); }
})();
// for tests and OBS: read-only views plus the same toggles the keys use
window.MZ = {
  get creature() { return SUBJ; }, get view() { return { pos: camera.position.toArray(), target: controls.target.toArray(), flying: !!FLY, crew: CREW.on, print: PRINT }; }, get crew() { return crew; }, cuts: CUTS, observe: () => SUBJ && SUBJ.observe(),
  crew_on: v => toggleCrew(v), frame: (dt = 1 / 30) => { CAPTURE.dt = dt; loop(performance.now()); }, print: () => togglePrint(), photograph: () => photograph(),
  perf() { const a = PERF.dt.length ? PERF.dt.reduce((x, y) => x + y, 0) / PERF.dt.length : 0, n = Math.max(1, PERF.frames); return { fps: a ? 1 / a : 0, simMsPerFrame: PERF.sim / n, renderMsPerFrame: PERF.render / n, frames: PERF.frames, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles }; },
};
