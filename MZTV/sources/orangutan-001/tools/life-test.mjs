// ORANGUTAN 001 · headless life test (no browser, no renderer)
//   npm i three@0.170.0   (anywhere on the node path)
//   node MZTV/sources/orangutan-001/tools/life-test.mjs [seconds=300] [seeds=1,2,3,4,5]
// Checks, per seed: planted-contact slip, peak reach, pose pops, eyes-before-head, behaviour coverage, determinism.
import * as THREE from 'three';
import { createCreature } from '../creature.js';

const secs = +(process.argv[2] || 300), seeds = (process.argv[3] || '1,2,3,4,5').split(',').map(Number);
const run = (seed) => {
  const C = createCreature(THREE, { seed }); let t = 0, last = null; const looks = []; const prev = {}, maxV = {};
  const t0 = performance.now();
  for (let i = 0; i < secs * 60; i++) {
    const n = C.log.length; C.update(1 / 60, (t += 1 / 60)); const g = C.state.gaze;
    for (let k = n; k < C.log.length; k++) if (C.log[k].ev === 'look') looks.push(last = { t: C.log[k].t, e0: g.eyeYaw, h0: g.headYaw.p, eT: null, hT: null });
    if (last && C.state.t - last.t < 2) {
      if (last.eT === null && Math.abs(g.eyeYaw - last.e0) > 0.05) last.eT = C.state.t - last.t;
      if (last.hT === null && Math.abs(g.headYaw.p - last.h0) > 0.05) last.hT = C.state.t - last.t;
    }
    const o = C.observe();
    for (const [k, p] of [['hand', o.hands.L], ['hand', o.hands.R], ['foot', o.feet.L], ['foot', o.feet.R]]) { const key = k + (p === o.hands.L || p === o.feet.L ? 'L' : 'R'); if (prev[key]) maxV[key] = Math.max(maxV[key] || 0, p.distanceTo(prev[key]) * 60); prev[key] = p.clone(); }
  }
  const ms = performance.now() - t0, both = looks.filter(l => l.eT !== null && l.hT !== null);
  const modes = {}; for (const e of C.log) if (e.ev === 'mode') modes[e.to] = (modes[e.to] || 0) + 1;
  return { C, ms, row: {
    seed, maxSlip_m: C.metrics.maxSlip, maxReach: +C.metrics.maxReach.toFixed(3), maxPelvisStep_m: +C.metrics.maxPelvisStep.toFixed(4),
    peakLimbSpeed_mps: +Math.max(...Object.values(maxV)).toFixed(2),
    eyesFirstPct: +(100 * both.filter(l => l.eT < l.hT).length / Math.max(1, both.length)).toFixed(1),
    medianEyeLead_ms: both.length ? Math.round(1000 * both.map(l => l.hT - l.eT).sort((a, b) => a - b)[both.length >> 1]) : null,
    modes, simMsPerStep: +(ms / (secs * 60)).toFixed(3) } };
};
let ok = true;
for (const s of seeds) {
  const a = run(s), b = run(s); const det = JSON.stringify(a.C.log) === JSON.stringify(b.C.log);
  const r = Object.assign(a.row, { deterministic: det });
  const pass = r.maxSlip_m < 1e-6 && r.maxReach < 0.99 && r.maxPelvisStep_m < 0.02 && r.eyesFirstPct > 90 && det && ['sit', 'rise', 'quad', 'walk', 'sitdown'].every(m => r.modes[m]);
  ok = ok && pass; console.log((pass ? 'PASS ' : 'FAIL ') + JSON.stringify(r));
}
process.exit(ok ? 0 : 1);
