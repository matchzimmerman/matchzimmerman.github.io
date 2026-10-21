/* =====================================================================
   THE LAST FLIGHT · AIR — the experience, with the research out of sight
   ---------------------------------------------------------------------
   The world flies the latest model version the research engine has
   produced and tested. When the engine rolls a new version, the change
   waits for the next flight (never mid-air) and the print re-inks slowly
   to mark it. Nothing here writes back to the research or the model.

   Model choice (read from feed/snapshot.json, never modified):
     the newest real candidate whose deterministic tests passed and that has
     not been rolled back; otherwise the approved baseline. Candidates are
     side previews under the promotion contract, so the caption says which.
   ===================================================================== */
import * as THREE from 'three';
import { World, COLORWAYS } from './world.js';
import { Sound } from './audio.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && Number.isFinite(+Q.get(k)) ? +Q.get(k) : d);
const P = {
  obs: Q.get('obs') === '1', info: Q.get('info') !== '0', audio: Q.get('audio') === '1', cam: Q.get('cam'),
  rate: num('rate', 1), ff: num('ff', 0), t: Q.has('t') ? num('t', 0) : null, trial: Q.has('trial') ? num('trial', 0) : null,
  poll: num('poll', location.protocol === 'https:' ? 120 : 15), lines: num('lines', 540), capture: Q.get('capture') === '1',
  feed: Q.get('feed') || 'feed/snapshot.json', fresh: Q.get('fresh') === '1',
};
const KEY = 'mztv-lastflight-air-v1';
const DEP_MS = Date.UTC(1937, 6, 2, 0, 0, 0);          // US Navy 'Known Facts' item 1: 0000 GCT 2 July 1937
const D2R = Math.PI / 180;
const $ = id => document.getElementById(id);
const errors = [];
addEventListener('error', e => errors.push(String(e.message)));
addEventListener('unhandledrejection', e => errors.push(String(e.reason)));

/* ------------------------------------------------------------------ memory (presentation only) */
let store = {};
try { if (!P.fresh) store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { store = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
if (Q.has('start')) store.start = Date.parse(Q.get('start'));
if (!Number.isFinite(store.start)) store.start = Date.now();
store.versions = store.versions || [];               // model versions this screen has flown, in order
save();

/* ------------------------------------------------------------------ model versions (read-only) */
const M = window.MZLastFlight;
const vals = p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v.value]));
let snap = null, latest = null, flying = null, flyingTrial = null;
function pickModel(s) {
  const tested = s.candidates.filter(c => c.namespace === 'real' && c.tests && c.tests.passed &&
    !/rolled|failed/.test(String(c.review_status)));
  const c = tested[tested.length - 1];
  if (c) {
    const m = s.models.find(x => x.model_id === c.proposed_model);
    if (m) return { id: m.model_id, params: vals(m.params), status: c.review_status === 'promoted' ? 'approved' : 'candidate' };
  }
  const b = s.namespaces.real.baseline;
  return { id: b.model_id, params: vals(b.params), status: 'baseline' };
}
async function poll() {
  try {
    const r = await fetch(P.feed + (P.feed.includes('?') ? '&' : '?') + 'ts=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    snap = await r.json();
    latest = pickModel(snap);
    if (!flying) adopt(latest, true);
  } catch (e) { errors.push('feed: ' + (e.message || e)); }
}
const inkFor = id => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % COLORWAYS.length; };
function adopt(m, first) {
  const isNew = !store.versions.includes(m.id);
  flying = m; trialCache.clear();
  if (isNew) { store.versions.push(m.id); save(); }
  const ink = store.versions.length <= 1 ? 0 : inkFor(m.id);   // the first version flies in the home colourway
  if (first) world.setColorway(ink);
  else if (ink !== world.cwIndex) world.blendColorway(ink, 45);
  caption();
}
const trialCache = new Map();
function trialFor(seed) {
  const k = flying.id + ':' + seed;
  if (!trialCache.has(k)) { trialCache.set(k, M.simulate(seed, flying.params)); if (trialCache.size > 6) trialCache.delete(trialCache.keys().next().value); }
  return trialCache.get(k);
}

/* ------------------------------------------------------------------ clock: one flight per 24 h */
let manualAdvance = 0, simClockSec = 0;
function clock() {
  // ?t=H starts the flight at hour H (testing); time then runs on normally
  const real = P.capture ? simClockSec : (Date.now() - store.start) / 1000;
  const el = Math.max(0, real * P.rate + (P.ff + (P.t || 0)) * 3600 + manualAdvance);
  const idx = P.trial !== null ? P.trial : Math.floor(el / 86400) % 192;
  return { el, idx, hour: (el % 86400) / 3600, seed: (19370702 + idx * 65537) >>> 0 };
}

/* ------------------------------------------------------------------ aircraft (observed) */
let visHeading = null, lastHour = null, bank = 0;
function aircraft(ck) {
  const tr = trialFor(ck.seed), end = tr.end.t, ended = ck.hour >= end;
  const p = M.interpolate(tr, Math.min(ck.hour, end));
  const latm = (p.lat + M.LAE.lat) / 2;
  const east = (p.lon - M.LAE.lon) * 111195 * Math.cos(latm * D2R), north = (p.lat - M.LAE.lat) * 111195;
  const dtH = lastHour === null ? 0 : ck.hour - lastHour; lastHour = ck.hour;
  if (visHeading === null || Math.abs(dtH) > 0.05) visHeading = p.heading;      // jumps re-seat; normal time slews
  const diff = ((p.heading - visHeading + 540) % 360) - 180, maxStep = 3 * Math.abs(dtH) * 3600;
  const step = Math.max(-maxStep, Math.min(maxStep, diff));
  visHeading = (visHeading + step + 360) % 360;
  const rate = dtH > 0 ? step / (dtH * 3600) : 0;
  bank += (Math.atan((p.speed * 0.514) * rate * D2R / 9.81) / D2R - bank) * 0.05;
  return { p, end, ended, east, north, lat: p.lat, lon: p.lon, headingDeg: visHeading, modelHeading: p.heading, bankDeg: bank,
    scenarioMs: DEP_MS + Math.min(ck.hour, 30) * 3600000, flightSec: ck.hour * 3600, windN: tr.windN, windE: tr.windE,
    alt: 2134, fuel: p.fuel, speed: p.speed };
}

/* ------------------------------------------------------------------ cameras: observe, never steer */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const rotY = (v, deg) => { const a = -deg * D2R, c = Math.cos(a), s = Math.sin(a); return V3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); };
const sunH = s => { const v = V3(Math.sin(s.sunAz * D2R), 0, -Math.cos(s.sunAz * D2R)); return v; };   // horizontal toward the sun
// a fixed point in the world (east/north/up relative to the aircraft's start of shot) → camera position relative to the aircraft
const fixed = (s, mk) => V3(mk.e - s.east, mk.u, -(mk.n - s.north));
const SHOTS = {
  CHASE: { label: 'chase', hold: [30, 70], onboard: false, want: s => (s.ended ? 0 : 1),
    pose(s, tau) { return { pos: rotY(V3(9 * Math.sin(tau / 53), 4.4 + 1.8 * Math.sin(tau / 29), 26 + 4 * Math.sin(tau / 37)), s.headingDeg), look: rotY(V3(0, 0.4, -6), s.headingDeg), fov: 40 }; } },
  WING: { label: 'port wing', hold: [24, 50], onboard: true, want: s => (s.ended ? 0 : 0.8),
    pose(s) { return { pos: rotY(V3(-7.7, 1.15, 1.0), s.headingDeg), look: rotY(V3(-1.2, 0.2, -4.6), s.headingDeg), fov: 58 }; } },
  COCKPIT: { label: 'cockpit', hold: [30, 75], onboard: true, want: s => (s.ended ? 0 : 0.8 + (s.sunLow ? 1.2 : 0) + (s.night ? 0.4 : 0)),
    pose(s, tau) { return { pos: rotY(V3(-0.28 + 0.015 * Math.sin(tau / 3.1), 1.06, -4.4), s.headingDeg), look: rotY(V3(0.3 * Math.sin(tau / 17), 0.4, -70), s.headingDeg), fov: 72, roll: -s.bankDeg * D2R }; } },
  // against the low sun: the camera stands off on the far side so the aircraft crosses the light
  SILHOUETTE: { label: 'into the sun', hold: [26, 55], onboard: false, want: s => (s.ended || !s.sunLow ? 0 : 2.2),
    pose(s, tau) { const away = sunH(s).multiplyScalar(-68); const side = rotY(V3(14 * Math.sin(tau / 47), 0, 0), s.headingDeg);
      return { pos: away.add(side).add(V3(0, -3 + 2 * Math.sin(tau / 31), 0)), look: V3(0, 0.6, 0), fov: 34 }; } },
  // the aircraft passes overhead a fixed point: Doppler happens here
  FLYBY: { label: 'flyby', hold: [14, 18], onboard: false, want: s => (s.ended ? 0 : 0.9),
    start(s, cam) { const a = rotY(V3(28 * (cam.n++ % 2 ? 1 : -1), 0, -620), s.modelHeading); cam.mk = { e: s.east + a.x, n: s.north - a.z, u: -55 }; },
    pose(s, tau, cam) { const rel = fixed(s, cam.mk), d = rel.length();
      // the operator zooms to hold the aircraft at a similar size, then lets it go wide as it passes overhead
      return { pos: rel, look: V3(0, 0, 0), fov: Math.max(9, Math.min(62, 2 * Math.atan(26 / d) / D2R * 1.7)) }; } },
  DISTANT: { label: 'long lens', hold: [26, 50], onboard: false, want: s => (s.ended ? 0 : 0.7 + (s.sunLow ? 0.5 : 0) - (s.night ? 0.4 : 0)),
    start(s, cam) { const a = rotY(V3((cam.n++ % 2 ? 1 : -1) * 1300, 0, -2200), s.modelHeading); cam.mk = { e: s.east + a.x, n: s.north - a.z, u: 420 }; },
    pose(s, tau, cam) { const rel = fixed(s, cam.mk), d = rel.length();
      return { pos: rel, look: V3(0, 0, 0), fov: Math.max(1.1, Math.min(30, 2 * Math.atan(17 / d) / D2R * 1.6)) }; } },
  // after the modelled fuel runs out: the sea and sky carry on; the lens drifts along the horizon
  HORIZON: { label: 'horizon', hold: [60, 140], onboard: false, want: s => (s.ended ? 3 : 0),
    pose(s, tau) { const az = (s.lightAz + 18 * Math.sin(tau / 97)) * D2R;
      return { pos: V3(0, 12, 0), look: V3(Math.sin(az) * 1000, 30 + 25 * Math.sin(tau / 71), -Math.cos(az) * 1000), fov: 50 }; } },
};
const dir = { cur: SHOTS[P.cam] ? P.cam : 'CHASE', since: 0, hold: 40, n: 0, mk: null, cuts: [] };
let rs = 1937; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
function cut(to, s, why) {
  dir.cuts.push({ t: new Date().toISOString(), from: dir.cur, to, why }); if (dir.cuts.length > 80) dir.cuts.shift();
  dir.cur = to; dir.since = performance.now() / 1000; const [a, b] = SHOTS[to].hold; dir.hold = a + rnd() * (b - a);
  if (SHOTS[to].start) SHOTS[to].start(s, dir);
  camS.pos = null;
}
function direct(s, tau) {
  if (P.cam) return;
  const ok = SHOTS[dir.cur].want(s) > 0;
  if (ok && tau - dir.since < dir.hold) return;
  const names = Object.keys(SHOTS).filter(n => n !== dir.cur || !ok);
  const w = names.map(n => Math.max(0, SHOTS[n].want(s)));
  const sum = w.reduce((a, b) => a + b, 0); if (!sum) return;
  let r = rnd() * sum, pick = names[0];
  for (let i = 0; i < names.length; i++) { r -= w[i]; if (r <= 0) { pick = names[i]; break; } }
  if (pick !== dir.cur || !ok) cut(pick, s, ok ? 'hold elapsed' : 'shot no longer possible');
}
const camS = { pos: null, look: null };

/* ------------------------------------------------------------------ world, sound, caption */
const world = new World($('world'), { lines: P.lines, capture: P.capture, colorway: 0 });
const sound = new Sound();
function resize() { world.resize(Math.max(2, innerWidth), Math.max(2, innerHeight)); }
addEventListener('resize', resize); resize();
function caption() {
  if (!flying) return;
  const what = flying.status === 'candidate' ? 'candidate model, not validated' : flying.status === 'approved' ? 'approved model, not historically validated' : 'exploratory model, not validated';
  $('cap').textContent = `THE LAST FLIGHT · a simulated flight on 2 July 1937 · ${flying.id} (${what}) · not a claim about where she went`;
}
$('cap').hidden = !P.info;

/* ------------------------------------------------------------------ controls: appear on movement, fade away */
let idleT = 0;
function wake() { document.body.classList.add('awake'); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.remove('awake'), 3200); }
['mousemove', 'touchstart', 'keydown'].forEach(e => addEventListener(e, wake, { passive: true }));
async function soundToggle() {
  try {
    if (!sound.ctx || sound.ctx.state !== 'running') { await sound.start(); sound.mute(false); }
    else sound.mute(!sound.muted);
  } catch (e) { errors.push('audio: ' + e.message); }
  $('b-snd').setAttribute('aria-pressed', String(!!(sound.ctx && sound.ctx.state === 'running' && !sound.muted)));
}
$('b-snd').onclick = soundToggle;
$('b-cam').onclick = () => { const n = Object.keys(SHOTS).filter(k => SHOTS[k].want(window.__s || {}) > 0); cut(n[(n.indexOf(dir.cur) + 1) % n.length] || 'CHASE', window.__s, 'manual'); };
$('b-time').onclick = () => { manualAdvance += 7200; lastHour = null; };
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'c') $('b-cam').onclick(); else if (k === 'a' || k === 'm') soundToggle(); else if (k === 'i') $('cap').hidden = !$('cap').hidden;
});
if (P.audio) soundToggle();
if (P.obs) document.body.classList.add('obs');

/* ------------------------------------------------------------------ loop */
let lastT = performance.now() / 1000, prevD = null;
function frame(tau, dt) {
  if (!flying) return;
  const ck = clock();
  // a new version waits for the next flight; it never changes an aircraft already in the air
  if (flyingTrial === null) flyingTrial = ck.idx;
  if (ck.idx !== flyingTrial) { flyingTrial = ck.idx; if (latest && latest.id !== flying.id) adopt(latest, false); else trialCache.clear(); }
  const s = aircraft(ck);
  const sun = world.sun || { el: 20, az: 90 }, moon = world.moon || { el: -10, az: 0 };
  s.sunLow = sun.el > -3 && sun.el < 14; s.night = sun.el < -6; s.sunAz = sun.az;
  s.lightAz = sun.el > -6 ? sun.az : (moon.el > 0 ? moon.az : s.modelHeading);
  window.__s = s;
  if (!dir.started) { dir.started = true; if (SHOTS[dir.cur].start) SHOTS[dir.cur].start(s, dir); }   // first shot (incl. ?cam=)
  direct(s, tau);
  const shot = SHOTS[dir.cur].pose(s, tau, dir);
  if (!camS.pos) { camS.pos = shot.pos.clone(); camS.look = shot.look.clone(); }
  const k = 1 - Math.exp(-dt * (SHOTS[dir.cur].onboard ? 12 : 3));
  camS.pos.lerp(shot.pos, k); camS.look.lerp(shot.look, k);
  world.render(s, { pos: camS.pos, look: camS.look, fov: shot.fov, roll: shot.roll || 0 }, tau, null);
  // sound: the lens is the microphone
  const d = camS.pos.length();
  const vr = prevD === null || dt <= 0 ? 0 : (d - prevD) / dt; prevD = d;
  const f = camS.look.clone().sub(camS.pos).normalize(), right = V3(-f.z, 0, f.x).normalize();
  const pan = Math.max(-1, Math.min(1, -camS.pos.clone().normalize().dot(right) * 1.4));
  sound.updateAir({ d, vr: Math.max(-90, Math.min(90, vr)), pan, onboard: SHOTS[dir.cur].onboard, ended: s.ended,
    day: Math.max(0, Math.min(1, (sun.el + 12) / 17)), minute: new Date(s.scenarioMs).getUTCMinutes() });
  window.__last = { s, ck, shot: dir.cur };
}
function loop() {
  const t = performance.now() / 1000, dt = Math.min(0.1, t - lastT); lastT = t;
  try { frame(t, dt); } catch (e) { errors.push(String(e.stack || e)); }
  requestAnimationFrame(loop);
}

/* ------------------------------------------------------------------ observer API (read-only) */
window.MZ = {
  errors, sound, cuts: dir.cuts, cam: id => SHOTS[id] && cut(id, window.__s, 'manual'),
  advance: sec => { manualAdvance += sec; lastHour = null; }, tick: (dt = 1 / 30) => { simClockSec += dt; frame(performance.now() / 1000, dt); },
  poll, adoptNow: () => latest && adopt(latest, false),
  snapshot() {
    const L = window.__last; if (!L) return null;
    return { entity: 'world_snapshot', mode: 'AIR', flying_model: flying.id, model_status: flying.status, latest_model: latest && latest.id,
      versions_flown: store.versions.slice(), colourway: world.colorway.name, trial_index: L.ck.idx, seed: L.ck.seed, flight_hour: L.ck.hour,
      scenario_clock_utc: new Date(L.s.scenarioMs).toISOString(), position: { lat: L.s.lat, lon: L.s.lon }, ended: L.s.ended,
      camera: L.shot, sun: world.sun, moon: world.moon, weather_provenance: 'SYNTHETIC (model seeded wind)', look: 'AUTHORED' };
  },
};

await poll();
setInterval(poll, P.poll * 1000);
if (!P.capture) requestAnimationFrame(loop); else frame(performance.now() / 1000, 0.033);
