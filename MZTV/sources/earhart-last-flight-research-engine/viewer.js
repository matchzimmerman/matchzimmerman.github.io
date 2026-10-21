/* =====================================================================
   THE LAST FLIGHT · research engine · VIEWER (OBS browser source)
   ---------------------------------------------------------------------
   One system, five lenses:
     1 WORLD    cinematic world, small research overlay (default)
     2 INTAKE   processing rails + denominators beside the running world
     3 EVIDENCE source → claims → parameter → candidate → result lineage
     4 MODEL    candidate vs baseline on identical seeds; gates; history
     5 STATUS   versions, runs, throughput, failures, recovery
   The viewer READS feed/snapshot.json and the surrogate model.js. It never
   writes to either. Scene switches happen automatically only when the feed
   carries genuinely new logged events; otherwise WORLD stays on air.
   ===================================================================== */
import * as THREE from 'three';
import { World, COLORWAYS, sunPos, moonPos } from './world.js';
import { Sound } from './audio.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && Number.isFinite(+Q.get(k)) ? +Q.get(k) : d);
const P = {
  obs: Q.get('obs') === '1', info: Q.get('info') !== '0', audio: Q.get('audio') === '1', auto: Q.get('auto') !== '0',
  scene: Q.get('scene'), cam: Q.get('cam'), rate: num('rate', 1), ff: num('ff', 0), t: Q.has('t') ? num('t', 0) : null,
  trial: Q.has('trial') ? num('trial', 0) : null, poll: num('poll', location.protocol === 'https:' ? 60 : 10), lines: num('lines', 540), capture: Q.get('capture') === '1',
  feed: Q.get('feed') || 'feed/snapshot.json', fresh: Q.get('fresh') === '1', ghost: Q.get('ghost') === '1', colorway: num('ink', 0),
};
const PINNED_SURROGATE = 'fbd0d6e8e48caf165e0d5317717cb426cfd6baf0e5df7d98ee50638679c80cb2';
const KEY = 'mztv-lastflight-engine-v1';
const SCENES = ['WORLD', 'INTAKE', 'EVIDENCE', 'MODEL', 'STATUS'];
const DEP_MS = Date.UTC(1937, 6, 2, 0, 0, 0);   // Navy 'Known Facts' item 1: took off 0000 GCT 2 July 1937
const D2R = Math.PI / 180;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-US'));
const hm = h => { const m = Math.max(0, Math.round(h * 60)); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const errors = [];
addEventListener('error', e => errors.push(String(e.message)));
addEventListener('unhandledrejection', e => errors.push(String(e.reason)));

/* ------------------------------------------------------------------ persistent viewer state (presentation only) */
let store = {};
try { if (!P.fresh) store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { store = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
if (Q.has('start')) store.start = Date.parse(Q.get('start'));
if (!Number.isFinite(store.start)) store.start = Date.now();
save();
const bootMs = Date.now();

/* ------------------------------------------------------------------ surrogate (read-only, hash-checked) */
const M = window.MZLastFlight;
const surrogate = { ok: null, sha: null, via: null };
function sha256js(bytes) {   // FIPS 180-4, used when crypto.subtle is unavailable (insecure origin / file://)
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const n = bytes.length, L = ((n + 9 + 63) >> 6) << 6, m = new Uint8Array(L); m.set(bytes); m[n] = 0x80;
  const dv = new DataView(m.buffer); dv.setUint32(L - 4, n * 8 >>> 0); dv.setUint32(L - 8, Math.floor(n / 0x20000000));
  const W = new Uint32Array(64), r = (x, k) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < L; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const a = W[i - 15], b = W[i - 2]; W[i] = (W[i - 16] + (r(a, 7) ^ r(a, 18) ^ (a >>> 3)) + W[i - 7] + (r(b, 17) ^ r(b, 19) ^ (b >>> 10))) >>> 0; }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
      const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return [...H].map(x => x.toString(16).padStart(8, '0')).join('');
}
(async () => {
  try {
    const buf = await (await fetch('../earhart-last-flight/model.js', { cache: 'no-store' })).arrayBuffer();
    if (window.crypto && crypto.subtle) {
      const h = await crypto.subtle.digest('SHA-256', buf);
      surrogate.sha = [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''); surrogate.via = 'WebCrypto';
    } else { surrogate.sha = sha256js(new Uint8Array(buf)); surrogate.via = 'js'; }
    surrogate.ok = surrogate.sha === PINNED_SURROGATE;
  } catch (e) { surrogate.ok = false; surrogate.sha = 'unavailable: ' + e.message; }
})();

/* ------------------------------------------------------------------ feed */
const feed = { snap: null, ok: false, last: 0, err: null, polls: 0, fails: 0, newEvents: [] };
async function poll() {
  feed.polls++;
  try {
    const r = await fetch(P.feed + (P.feed.includes('?') ? '&' : '?') + 'ts=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const s = await r.json();
    const prevHash = feed.snap && feed.snap.content_hash;
    feed.snap = s; feed.ok = true; feed.err = null; feed.last = Date.now();
    const head = s.ledger.events;
    if (store.seenSeq === undefined || store.seenSeq > head) store.seenSeq = head;   // first sight: nothing is "new"
    const fresh = s.recent_events.filter(e => e.seq > store.seenSeq);
    store.seenSeq = head; save();
    if (fresh.length) onNewEvents(fresh);
    if (s.content_hash !== prevHash) { buildModels(); dirty = true; }
  } catch (e) { feed.ok = false; feed.err = String(e.message || e); feed.fails++; }
}

/* ------------------------------------------------------------------ models (from feed) */
let base = null, cand = null, baseParams = null, candParams = null;
const vals = p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v.value]));
function buildModels() {
  const s = feed.snap; if (!s) return;
  const b = s.namespaces.real.baseline;
  base = b; baseParams = vals(b.params);
  const c = [...s.candidates].reverse().find(c => c.namespace === 'real' && c.tests && c.tests.passed && !String(c.review_status).startsWith('rolled'));
  cand = c || null;
  candParams = c ? vals(s.models.find(m => m.model_id === c.proposed_model).params) : null;
  trialCache.clear();
}
const trialCache = new Map();
function trialFor(seed, params, tag) {
  const k = tag + ':' + seed;
  if (!trialCache.has(k)) { trialCache.set(k, M.simulate(seed, params)); if (trialCache.size > 12) trialCache.delete(trialCache.keys().next().value); }
  return trialCache.get(k);
}

/* ------------------------------------------------------------------ broadcast clock → trial + flight hour */
let manualAdvance = 0, simClockSec = 0;
function clock() {
  const real = P.capture ? simClockSec : (Date.now() - store.start) / 1000;
  const el = Math.max(0, real * P.rate + P.ff * 3600 + manualAdvance);
  const day = Math.floor(el / 86400);
  const idx = P.trial !== null ? P.trial : day % 192;
  const hour = P.t !== null ? P.t + (P.capture ? simClockSec * P.rate / 3600 : 0) : (el % 86400) / 3600;
  const seed = (((base ? 19370702 : 19370702) | 0) + idx * 65537) >>> 0;
  return { el, idx, hour, seed, cycle: Math.floor(el / 172800), cyclePos: (el % 172800) / 172800 };
}

/* ------------------------------------------------------------------ aircraft state (observed, not modified) */
let visHeading = null, lastHour = null, bank = 0;
function aircraftState(ck) {
  const tr = trialFor(ck.seed, baseParams, 'base');
  const end = tr.end.t, ended = ck.hour >= end;
  const p = M.interpolate(tr, Math.min(ck.hour, end));
  const latm = (p.lat + M.LAE.lat) / 2;
  const east = (p.lon - M.LAE.lon) * 111195 * Math.cos(latm * D2R), north = (p.lat - M.LAE.lat) * 111195;
  // presentation: the surrogate turns instantly (e.g. 157↔337 reversals); the drawing slews at standard rate 3°/s
  const dtH = lastHour === null ? 0 : ck.hour - lastHour;
  lastHour = ck.hour;
  if (visHeading === null || Math.abs(dtH) > 0.05 || P.t !== null && P.capture === false) visHeading = p.heading;
  const diff = ((p.heading - visHeading + 540) % 360) - 180;
  const maxStep = 3 * Math.abs(dtH) * 3600;
  const step = Math.max(-maxStep, Math.min(maxStep, diff));
  visHeading = (visHeading + step + 360) % 360;
  const rateDeg = dtH > 0 ? step / (dtH * 3600) : 0;
  const tgtBank = Math.atan((p.speed * 0.514) * rateDeg * D2R / 9.81) / D2R;
  bank += (tgtBank - bank) * 0.05;
  return { tr, p, ended, end, east, north, lat: p.lat, lon: p.lon, headingDeg: visHeading, modelHeading: p.heading, bankDeg: bank,
    scenarioMs: DEP_MS + Math.min(ck.hour, 30) * 3600000, flightSec: ck.hour * 3600, windN: tr.windN, windE: tr.windE,
    alt: 2134, fuel: p.fuel, speed: p.speed };
}
function ghostState(ck, st) {
  if (!candParams) return null;
  const tr = trialFor(ck.seed, candParams, 'cand');
  const end = tr.end.t, ended = ck.hour >= end;
  const p = M.interpolate(tr, Math.min(ck.hour, end));
  const latm = (p.lat + M.LAE.lat) / 2;
  const east = (p.lon - M.LAE.lon) * 111195 * Math.cos(latm * D2R), north = (p.lat - M.LAE.lat) * 111195;
  return { tr, p, end, ended, dx: east - st.east, dz: -(north - st.north), dy: 0, headingDeg: p.heading };
}

/* ------------------------------------------------------------------ cameras (MZCAM principles: observe, never steer) */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const rotY = (v, deg) => { const a = -deg * D2R, c = Math.cos(a), s = Math.sin(a); return V3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); };
const SHOTS = {
  CHASE:   { label: 'CHASE', want: s => 1.0, pose(s, tau) { return { pos: rotY(V3(7 * Math.sin(tau / 41), 4.2 + 1.6 * Math.sin(tau / 23), 27), s.headingDeg), look: rotY(V3(0, 0.4, -6), s.headingDeg), fov: 40 }; } },
  WING:    { label: 'WING · PORT TIP', want: s => (s.ended ? 0 : 0.85), pose(s, tau) { return { pos: rotY(V3(-7.7, 1.15, 1.0), s.headingDeg), look: rotY(V3(-1.2, 0.2, -4.6), s.headingDeg), fov: 58, roll: s.bankDeg * D2R * 0.0 }; } },
  COCKPIT: { label: 'COCKPIT · FORWARD', want: s => (s.ended ? 0 : 0.9 + (s.sunLow ? 0.9 : 0)), pose(s, tau) {
    // windscreen line: over the nose, both engines in the side of frame
    return { pos: rotY(V3(-0.28 + 0.015 * Math.sin(tau / 3.1), 1.06, -4.4), s.headingDeg), look: rotY(V3(0.3 * Math.sin(tau / 17), 0.4, -70), s.headingDeg), fov: 72, roll: -s.bankDeg * D2R }; } },
  DISTANT: { label: 'LONG LENS · OBSERVER', want: s => 1.0 + (s.sunLow ? 0.6 : 0) - (s.night ? 0.5 : 0), pose(s, tau, cam) {
    if (!cam.obs || s.ended && !cam.obsEnded) { const side = (cam.n++ % 2 ? 1 : -1);
      const ahead = rotY(V3(side * 1300, 0, -2200), s.modelHeading); cam.obs = { e: s.east + ahead.x, n: s.north - ahead.z }; cam.obsEnded = s.ended; }
    // an observer above the flight level: the aircraft is seen against the sea and the cloud field below
    const rel = V3(cam.obs.e - s.east, 420, -(cam.obs.n - s.north));
    const d = rel.length();
    if (d > 4600 && !s.ended) cam.obs = null;
    return { pos: rel, look: V3(0, 0, 0), fov: Math.max(1.1, Math.min(30, 2 * Math.atan(17 / d) / D2R * 1.6)) }; } },
};
const director = { cur: P.cam && SHOTS[P.cam] ? P.cam : 'CHASE', since: 0, hold: 28, cuts: [], n: 0, obs: null };
let rngS = 7; const rnd = () => (rngS = (rngS * 16807) % 2147483647) / 2147483647;
function direct(s, tReal) {
  const held = tReal - director.since;
  if (P.cam) return;
  if (held < director.hold) return;
  const names = Object.keys(SHOTS).filter(n => n !== director.cur);
  const w = names.map(n => Math.max(0, SHOTS[n].want(s)));
  let r = rnd() * w.reduce((a, b) => a + b, 0), pick = names[0];
  for (let i = 0; i < names.length; i++) { r -= w[i]; if (r <= 0) { pick = names[i]; break; } }
  director.cuts.push({ t: new Date().toISOString(), from: director.cur, to: pick, reason: `held ${held.toFixed(0)} s; weighted by sun elevation / night / trial state` });
  if (director.cuts.length > 60) director.cuts.shift();
  director.cur = pick; director.since = tReal; director.hold = 18 + rnd() * 27;
  if (pick === 'DISTANT') director.obs = null;
}
function setCam(id) { if (SHOTS[id]) { director.cuts.push({ t: new Date().toISOString(), from: director.cur, to: id, reason: 'manual' }); director.cur = id; director.since = performance.now() / 1000; director.obs = null; } }
const camSmooth = { pos: null, look: null };

/* ------------------------------------------------------------------ scenes */
let scene = SCENES.includes((P.scene || '').toUpperCase()) ? P.scene.toUpperCase() : 'WORLD';
let pinned = !!P.scene, autoUntil = 0, autoReason = '', dirty = true, evSel = null;
function setScene(n, why) {
  scene = n; dirty = true; try { syncCtl(); } catch (e) {}
  $('app').classList.toggle('split', n !== 'WORLD');
  if (why) { banner(why); }
  setTimeout(resize, 950); resize();
}
function onNewEvents(evs) {
  const real = evs.filter(e => e.provenance_mode === 'REAL'), any = evs;
  const top = any[any.length - 1];
  banner(`LOGGED EVENT · seq ${top.seq} · ${top.type} · ${top.provenance_mode}`);
  for (const e of evs) pulses.set(e.entity_id, Date.now());
  if (!P.auto || pinned) return;
  let target = null, dur = 0;
  if (any.some(e => /^(candidate|promotion|pointer)\./.test(e.type))) { target = 'MODEL'; dur = 60; }
  else if (any.some(e => /^claim\.(reviewed|conflict)/.test(e.type))) { target = 'EVIDENCE'; dur = 45;
    const c = any.reverse().find(e => e.entity === 'claim'); if (c && feed.snap) { const cl = feed.snap.claims.find(x => x.claim_id === c.entity_id); if (cl) evSel = cl.source_id; } }
  else if (any.some(e => e.type.startsWith('source.') || e.type.startsWith('claim.'))) { target = 'INTAKE'; dur = 40; }
  if (target) { autoUntil = Date.now() + dur * 1000; autoReason = `auto: ${evs.length} new logged event(s)`; setScene(target); }
}
const pulses = new Map();
let bannerT = 0;
function banner(t) { const b = $('banner'); b.textContent = t; b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), 6000); }

/* ------------------------------------------------------------------ world + sound */
const world = new World($('world'), { lines: P.lines, capture: P.capture, colorway: P.colorway });
const pal = world.colorway.c;
['--ink', '--deep', '--sea', '--hot', '--glow', '--paper'].forEach((k, i) => document.documentElement.style.setProperty(k, pal[i]));
const sound = new Sound();
function resize() { const r = $('worldwrap').getBoundingClientRect(); world.resize(Math.max(2, Math.round(r.width)), Math.max(2, Math.round(r.height))); }
addEventListener('resize', resize);
async function audioOn() { try { await sound.start(); $('tap').style.display = 'none'; } catch (e) { errors.push('audio: ' + e.message); } }
if (P.audio) audioOn().then(() => { if (!sound.ctx || sound.ctx.state !== 'running') $('tap').style.display = 'block'; });
$('tap').onclick = audioOn;
/* on-screen controls (hidden with ?obs=1): same actions as the keys */
document.querySelectorAll('#ctl [data-lens]').forEach(b => b.onclick = () => {
  const n = b.dataset.lens;
  if (n === 'WORLD') { pinned = false; setScene('WORLD', 'lens: WORLD · auto switching on logged events'); }
  else { pinned = true; setScene(n, 'lens: ' + n); }
  syncCtl();
});
$('b-cam').onclick = () => { const n = Object.keys(SHOTS); setCam(n[(n.indexOf(director.cur) + 1) % n.length]); banner('camera: ' + SHOTS[director.cur].label); };
$('b-time').onclick = () => { if (P.t !== null) P.t = (P.t + 2) % 24; else manualAdvance += 7200; lastHour = null; banner('flight clock +2 h (preview only; does not change the model)'); };
$('b-snd').onclick = async () => {
  if (!sound.ctx || sound.ctx.state !== 'running') { await audioOn(); sound.mute(false); }
  else sound.mute(!sound.muted);
  syncCtl();
};
$('b-info').onclick = () => { $('info').classList.toggle('on'); syncCtl(); };
function syncCtl() {
  document.querySelectorAll('#ctl [data-lens]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lens === scene)));
  $('b-snd').setAttribute('aria-pressed', String(!!(sound.ctx && sound.ctx.state === 'running' && !sound.muted)));
  $('b-info').setAttribute('aria-pressed', String($('info').classList.contains('on')));
}
setInterval(syncCtl, 1000);
if (P.obs) document.body.classList.add('obs');

/* ------------------------------------------------------------------ keys */
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k >= '1' && k <= '5') { pinned = true; setScene(SCENES[+k - 1], 'lens: ' + SCENES[+k - 1] + ' (manual)'); }
  else if (k === '0') { pinned = false; setScene('WORLD', 'lens: WORLD · auto switching on logged events'); }
  else if (k === 'c') { const n = Object.keys(SHOTS); setCam(n[(n.indexOf(director.cur) + 1) % n.length]); }
  else if (k === 'i') { $('info').classList.toggle('on'); }
  else if (k === 'a') audioOn();
  else if (k === 'm') sound.mute(!sound.muted);
  else if (k === 'arrowright' || k === 'arrowleft') { cycleEvidence(k === 'arrowright' ? 1 : -1); }
});
function evidenceSources() { return feed.snap ? feed.snap.sources.filter(s => s.ingestion_state !== 'metadata_only') : []; }
function cycleEvidence(d) { const L = evidenceSources(); if (!L.length) return; const i = L.findIndex(s => s.source_id === evSel); evSel = L[(i + d + L.length) % L.length].source_id; dirty = true; }

/* ------------------------------------------------------------------ panels */
function tagNs(ns) { return ns === 'demo' ? '<span class="tag t-demo">DEMO / SYNTHETIC</span>' : '<span class="tag t-real">REAL</span>'; }
function modelTag(m) {
  if (!m) return '';
  if (String(m.model_id).startsWith('DEMO')) return '<span class="tag t-demo">DEMO</span>';
  if (m.kind === 'candidate' || String(m.status).startsWith('candidate')) return '<span class="tag t-cand">CANDIDATE · NOT VALIDATED</span>';
  if (String(m.status).includes('approved') && !String(m.status).includes('exploratory')) return '<span class="tag t-rev">HUMAN-APPROVED · NOT VALIDATED</span>';
  return '<span class="tag t-hyp">EXPLORATORY SURROGATE · NOT VALIDATED</span>';
}
const RAIL = [['DISCOVER', ['discovered']], ['ACQUIRE', ['acquiring', 'retry_wait', 'acquired']], ['INTEGRITY', ['verified']],
  ['EXTRACT', ['extracting', 'extracted_partial', 'partially_extracted']], ['NORMALIZE', ['extracted']], ['CLAIMS', ['normalized', 'claims_extracted']], ['CLASSIFIED', ['classified']]];
function rails(ns) {
  const s = feed.snap, src = s.sources.filter(x => x.namespace === ns);
  const now = Date.now();
  return '<div class="rails">' + RAIL.map(([nm, sts]) => {
    const xs = src.filter(x => sts.includes(x.ingestion_state));
    return `<div class="rail"><div class="nm">${nm}</div><div class="ct">${xs.length}</div>${xs.slice(0, 60).map(x =>
      `<span class="tok ${ns === 'demo' ? 'demo' : ''} ${now - (pulses.get(x.source_id) || 0) < 12000 ? 'pulse' : ''}" title="${esc(x.source_id)}"></span>`).join('')}</div>`;
  }).join('') + '</div>';
}
function denoms(ns) {
  const c = feed.snap.namespaces[ns].counters, el = c.claims_by_eligibility, f = (v, l) => `<div><div class="v">${typeof v === 'string' ? v : fmt(v)}</div><div class="l">${l}</div></div>`;
  return `<div class="denom">${f(c.known_targets, 'known targets')}${f(c.metadata_verified, 'metadata verified')}${f(c.content_acquired, 'content acquired')}
    ${f(`${fmt(c.pages_extracted)}/${fmt(c.pages_in_acquired_files)}`, 'pages extracted / in acquired files')}${f(c.claims, 'claims extracted')}
    ${f(c.claims_reviewed, 'claims reviewed')}${f((el['eligible-candidate'] || 0) + (el['eligible-science'] || 0), 'eligible for a model')}${f(c.claims_in_approved_baseline, 'in approved baseline')}</div>
    <div class="aside">metadata reachable-only (size/type not recorded) <b>${c.metadata_reachable_only ?? 0}</b> · ${['metadata_only', 'retry_wait', 'failed', 'duplicate', 'corrupt', 'unsupported', 'blocked_rights'].map(k => `${k.replace('_', '-')} <b>${c.by_state[k] || 0}</b>`).join(' · ')}
    · conflicts <b>${c.conflicts}</b> · acquisition retries logged <b>${feed.snap.namespaces[ns].acquire_failures_logged}</b></div>`;
}
function eventList(n = 12) {
  return feed.snap.recent_events.slice(-n).reverse().map(e => `<div class="ev ${e.namespace}"><span class="k">#${e.seq}</span><span class="k">${esc(e.ts.slice(11, 19))}Z</span>
    <span><span class="ty">${esc(e.type)}</span> ${e.namespace === 'demo' ? '<span class="tag t-demo">DEMO</span>' : ''}${esc(e.entity_id).slice(0, 46)} <span class="k">${esc(e.summary).slice(0, 90)}</span></span></div>`).join('');
}
function bands(ns) {
  const b = {}; for (const c of feed.snap.claims) if (c.namespace === ns) b[c.confidence_band] = (b[c.confidence_band] || 0) + 1;
  return ['Known', 'Strongly Supported', 'Inferred', 'Speculative'].map(k => `${k} <b>${b[k] || 0}</b>`).join(' · ');
}
function paramLine(params) {
  return Object.entries(params).map(([k, v]) => `${k} <b>${v.value}</b> <span class="k">${esc(v.unit).split(' ')[0]}</span>`).join(' · ');
}
function panelIntake() {
  const s = feed.snap, p = s.portal || {};
  const cs = s.candidates.filter(c => c.namespace === 'real');
  return `<div class="sec"><h4>INTAKE · RESEARCH APPARATUS</h4>
    <div class="row"><span>ledger</span><span>${fmt(s.ledger.events)} events · head ${esc((s.ledger.last_hash || '').slice(0, 12))} · last ${esc((s.ledger.last_ts || '').slice(0, 16))}Z</span></div>
    <div class="row"><span>feed</span><span>${feedAge()}</span></div></div>
    <div class="sec"><h4>${tagNs('real')} SOURCES BY STATE</h4>${rails('real')}${denoms('real')}
    <div class="aside" style="margin-top:8px">NARA release portal: <b>${fmt(p.files_linked)}</b> files linked · NARA-published total <b>${fmt(p.published_pages_total)}</b> pages <span class="k">(inventory figure — not pages ingested)</span></div>
    <div class="aside">evidence bands: ${bands('real')}</div></div>
    <div class="sec"><h4>ACTIVE MODEL INPUT</h4><div>${esc(base.model_id)} ${modelTag(base)}</div><div class="mono-s">${paramLine(base.params)}</div>
    ${cs.length ? `<div style="margin-top:6px">${cs.map(c => `<span class="tag t-cand">${esc(c.proposed_model)}</span>${esc(c.params_changed.map(x => `${x.key} ${x.base}→${x.proposed}`).join(', '))} · ${esc(c.review_status)}`).join('<br>')}</div>` : ''}</div>
    <div class="sec"><h4>${tagNs('demo')} FIXTURE STREAM</h4>${rails('demo')}${denoms('demo')}</div>
    <div class="sec"><h4>LOGGED EVENTS</h4>${eventList(14)}</div>`;
}
function lineageFor(claim) {
  const s = feed.snap;
  const c = s.candidates.find(x => x.evidence_claim_ids.includes(claim.claim_id));
  const src = s.sources.find(x => x.source_id === claim.source_id);
  const o = c && c.diff && c.diff.observed;
  return `<div class="lineage"><div><span class="k">source</span><br>${esc(src.source_id)}<br><span class="k">sha256 ${esc((src.sha256 || 'not retained').slice(0, 12))}</span></div><i>→</i>
    <div><span class="k">claim</span><br>${esc(claim.locator)} · ${esc(claim.quantity)}<br><span class="k">${esc(claim.review_state)}</span></div><i>→</i>
    <div><span class="k">parameter</span><br>${esc(claim.param_key || '—')} = ${esc(claim.normalized_value ?? '—')} ${esc(claim.unit || '')}</div><i>→</i>
    <div><span class="k">candidate</span><br>${c ? esc(c.proposed_model) + '<br><span class="k">' + esc(c.review_status) + '</span>' : 'none'}</div><i>→</i>
    <div><span class="k">result (same seeds)</span><br>${o ? `Δ endurance ${o.mean_d_endurance_h >= 0 ? '+' : ''}${o.mean_d_endurance_h} h<br>mean end shift ${o.mean_end_shift_km} km` : '—'}</div></div>`;
}
function panelEvidence() {
  const s = feed.snap, L = evidenceSources();
  if (!evSel || !L.find(x => x.source_id === evSel)) evSel = (L.find(x => x.source_id.includes('146-07')) || L[0] || {}).source_id;
  const src = s.sources.find(x => x.source_id === evSel);
  if (!src) return '<div class="sec"><h4>EVIDENCE</h4>no sources</div>';
  const cl = s.claims.filter(c => c.source_id === src.source_id);
  const mapped = cl.filter(c => c.param_key && !String(c.param_key).startsWith('ctx:'));
  const ctx = cl.filter(c => !mapped.includes(c));
  const used = s.candidates.filter(c => c.evidence_claim_ids.some(id => cl.find(x => x.claim_id === id)));
  const inBase = Object.values(base.params).some(v => (v.evidence_claim_ids || []).some(id => cl.find(x => x.claim_id === id)));
  const row = c => `<tr><td>${esc(c.locator)}</td><td>${esc(c.quantity)}</td><td>${esc(c.param_key || 'context')}</td><td>${esc(c.confidence_band)}</td>
    <td>${esc(c.review_state)}${c.reviewers.length ? '<br><span class="k">' + esc(c.reviewers[c.reviewers.length - 1].reviewer) + '</span>' : ''}</td>
    <td>${esc(c.eligibility)}<br><span class="k">${esc((c.eligibility_reasons || []).join('; ')).slice(0, 120)}</span>${c.contradiction_ids.length ? `<br><span class="no">⚠ contradicts ${c.contradiction_ids.length}</span>` : ''}</td></tr>`;
  return `<div class="sec"><h4>EVIDENCE · ${src.namespace === 'demo' ? '<span class="tag t-demo">DEMO</span>' : '<span class="tag t-arch">ARCHIVAL SOURCE</span>'}</h4>
    <div class="mono-s" style="font-weight:600">${esc(src.title)}</div>
    <div class="row"><span>original URI</span><span style="overflow-wrap:anywhere">${src.original_url ? esc(src.original_url) : '<span class="no">none — untraceable</span>'}</span></div>
    <div class="row"><span>provider</span><span>${esc(src.provider)}</span></div>
    <div class="row"><span>document date · release</span><span>${esc(src.original_date || 'unstated')} · ${esc(src.release_date || '—')}</span></div>
    <div class="row"><span>retrieved</span><span>${esc(src.retrieval_time || '—')}</span></div>
    <div class="row"><span>rights</span><span>${esc(src.rights)}</span></div>
    <div class="row"><span>display policy</span><span>${esc(src.display_policy)} · content retained ${src.content_retained ? 'locally' : 'no'}</span></div>
    <div class="row"><span>sha256</span><span>${esc(src.sha256 || '—')}</span></div>
    <div class="row"><span>state · pages</span><span>${esc(src.ingestion_state)} · ${fmt(src.pages_extracted)}/${fmt(src.page_count)} · attempts ${fmt(src.attempts)}</span></div>
    ${src.error ? `<div class="row"><span>error</span><span class="no">${esc(src.error)}</span></div>` : ''}
    <div class="row"><span>used as model input</span><span>${inBase ? '<b class="ok">approved baseline</b>' : 'not in approved baseline'} · ${used.length ? '<b>candidate ' + used.map(u => esc(u.proposed_model)).join(', ') + '</b>' : 'no candidate'}</span></div>
    <div style="margin-top:6px;display:flex;gap:6px;align-items:center"><button type="button" class="mini" id="ev-prev" aria-label="Previous source">‹ PREV</button><button type="button" class="mini" id="ev-next" aria-label="Next source">NEXT ›</button><span class="k">source ${L.findIndex(x => x.source_id === src.source_id) + 1} of ${L.length}</span></div></div>
    ${mapped.filter(c => used.some(u => u.evidence_claim_ids.includes(c.claim_id))).slice(0, 2).map(c => `<div class="sec"><h4>LINEAGE</h4>${lineageFor(c)}</div>`).join('')}
    <div class="sec"><h4>PARAMETER-MAPPED CLAIMS (${mapped.length})</h4><table><tr><th>LOC</th><th>QUANTITY</th><th>PARAM</th><th>BAND</th><th>REVIEW</th><th>ELIGIBILITY</th></tr>${mapped.slice(0, 14).map(row).join('')}</table></div>
    <div class="sec"><h4>CONTEXT OBSERVATIONS (${ctx.length}) · display-only</h4><table>${ctx.slice(0, 10).map(c => `<tr><td>${esc(c.locator)}</td><td>${esc(c.quantity)}</td><td>${esc(c.param_key || 'context')}</td><td>${esc(c.excerpt ? c.excerpt.slice(0, 70) : c.excerpt_policy).slice(0, 80)}</td></tr>`).join('')}</table></div>`;
}
function panelModel() {
  const s = feed.snap, all = s.candidates;
  const c = cand || all.find(x => x.namespace === 'real') || [...all].reverse().find(x => x.namespace === 'demo' && x.diff && x.diff.params);
  const isDemo = c && c.namespace === 'demo';
  const gates = c ? [
    ['deterministic tests passed (same seeds → identical hashes)', c.tests && c.tests.passed],
    ['every evidence claim accepted at SCIENCE scope by MZ.Human', c.evidence_claim_ids.every(id => { const x = s.claims.find(y => y.claim_id === id); return x && x.review_state === 'accepted_science'; })],
    ['MZ.Human authorization recorded', s.promotions.some(p => p.candidate_id === c.candidate_id && p.kind === 'approved')],
  ] : [];
  const d = c && c.diff, o = d && d.observed;
  const refused = s.promotions.filter(p => p.namespace === 'real' && p.kind === 'refused');
  const demo = all.filter(x => x.namespace === 'demo');
  return `<div class="sec"><h4>MODEL CHANGE · CANDIDATE vs APPROVED BASELINE</h4>
    <div>${esc(base.model_id)} ${modelTag(base)} <span class="k">approved baseline</span></div>
    ${c ? `<div>${esc(c.proposed_model)} ${isDemo ? '<span class="tag t-demo">DEMO / SYNTHETIC CANDIDATE</span>' : '<span class="tag t-cand">CANDIDATE · NOT VALIDATED · SIDE PREVIEW</span>'} <span class="k">${esc(c.review_status)}</span></div>` : '<div class="k">no candidate</div>'}
    ${isDemo ? '<div class="k">no real candidate yet · showing the latest DEMO candidate (authored fixtures, not evidence)</div>' : ''}</div>
    ${c ? `<div class="sec"><h4>WHAT CHANGED</h4><table><tr><th>PARAM</th><th>BASELINE</th><th>CANDIDATE</th><th>EVIDENCE</th></tr>
      ${d.params.map(p => `<tr><td>${esc(p.key)}<br><span class="k">${esc(p.label)}</span></td><td>${p.base} ${esc(p.unit)}</td><td><b>${p.proposed}</b> ${esc(p.unit)}</td><td>${p.evidence_claim_ids.map(id => { const x = s.claims.find(y => y.claim_id === id); return x ? esc(x.source_id.replace('SRC-', '').slice(0, 26)) + ' ' + esc(x.locator) : esc(id); }).join('<br>')}</td></tr>`).join('')}</table>
      <div class="row"><span>expected influence</span><span>${esc(d.expected_influence.map(e => e.text + (e.expected_mean_d_endurance_h !== undefined ? ` (≈ ${e.expected_mean_d_endurance_h >= 0 ? '+' : ''}${e.expected_mean_d_endurance_h} h)` : '')).join('; '))}</span></div>
      <div class="row"><span>observed · ${d.count} identical seeds</span><span>Δ mean endurance <b>${o.mean_d_endurance_h >= 0 ? '+' : ''}${o.mean_d_endurance_h} h</b> · mean end shift <b>${o.mean_end_shift_km} km</b> (max ${o.max_end_shift_km})</span></div>
      <div class="row"><span>geometric class within 25 km of Howland¹</span><span>${o.near_howland[0]} → ${o.near_howland[1]} · trials reclassified ${o.trials_changed_classification}</span></div>
      <div class="row"><span>output hashes</span><span>${esc(d.base_output_hash.slice(0, 12))} → ${esc(d.candidate_output_hash.slice(0, 12))}</span></div>
      <canvas class="map" id="map"></canvas>
      <div class="k" style="font-size:9.5px">endpoints of ${d.count} seeded trials · <span style="color:var(--sea)">■</span> baseline · <span style="color:var(--glow)">■</span> candidate · lines join the same seed. ¹ geometric classification of hypothetical trials, not a likelihood or a location claim. ${esc(d.caution)}</div></div>
      <div class="sec"><h4>PROMOTION GATES</h4>${gates.map(([n, ok]) => `<div class="gate"><b class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</b><span>${esc(n)}</span></div>`).join('')}
      <div class="k" style="margin-top:4px">${c.tests.checks.filter(x => x.ok).length}/${c.tests.checks.length} deterministic checks · approval ≠ historical validation (HDD gates G0–G7 open)</div>
      ${refused.map(p => `<div class="mono-s" style="margin-top:6px"><span class="no">REFUSED</span> ${esc(p.promotion_id)} · actor ${esc(p.actor)} · ${esc((p.reasons || []).slice(-1)[0] || '')}</div>`).join('')}</div>` : ''}
    <div class="sec"><h4>${tagNs('demo')} CONTROLLED TEST HISTORY</h4>${demo.map(x => `<div class="mono-s">${esc(x.proposed_model)} · ${esc(x.params_changed.map(p => `${p.key} ${p.base}→${p.proposed}`).join(', '))} · <b>${esc(x.review_status)}</b></div>`).join('') || '<span class="k">none</span>'}
      ${s.promotions.filter(p => p.namespace === 'demo').map(p => `<div class="mono-s k">${esc(p.kind)} · ${esc(p.actor)} · ${esc(p.previous_model || '')} → ${esc(p.next_model || '')}</div>`).join('')}
      <div class="mono-s">pointer now: <b>${esc(s.namespaces.demo.pointer.baseline_model)}</b> · ${esc(s.namespaces.demo.pointer.approval_label)}</div></div>`;
}
function drawMap() {
  const cv = $('map'); if (!cv || !feed.snap) return;
  const shown = cand || [...feed.snap.candidates].reverse().find(x => x.diff && x.diff.per_trial); if (!shown) return;
  const r = cv.getBoundingClientRect(), dpr = 1; cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, d = shown.diff;
  const lon0 = 172, lon1 = 190, lat0 = -9, lat1 = 5;
  const X = lon => (lon - lon0) / (lon1 - lon0) * W, Y = lat => H - (lat - lat0) / (lat1 - lat0) * H;
  g.fillStyle = pal[0]; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(239,230,207,.12)'; g.lineWidth = 1;
  for (let lo = lon0; lo <= lon1; lo += 2) { g.beginPath(); g.moveTo(X(lo), 0); g.lineTo(X(lo), H); g.stroke(); }
  for (let la = lat0; la <= lat1; la += 2) { g.beginPath(); g.moveTo(0, Y(la)); g.lineTo(W, Y(la)); g.stroke(); }
  for (const t of d.per_trial) {
    g.strokeStyle = pal[4] + '66'; g.beginPath(); g.moveTo(X(t.base_end[1]), Y(t.base_end[0])); g.lineTo(X(t.cand_end[1]), Y(t.cand_end[0])); g.stroke();
    g.fillStyle = pal[2]; g.fillRect(X(t.base_end[1]) - 1.5, Y(t.base_end[0]) - 1.5, 3, 3);
    g.fillStyle = pal[4]; g.fillRect(X(t.cand_end[1]) - 1.5, Y(t.cand_end[0]) - 1.5, 3, 3);
  }
  const mark = (p, n) => { g.strokeStyle = pal[5]; g.beginPath(); g.arc(X(p.lon), Y(p.lat), 4, 0, 7); g.stroke(); g.fillStyle = pal[5]; g.font = '10px JetBrains Mono, monospace'; g.fillText(n, X(p.lon) + 6, Y(p.lat) + 3); };
  mark(M.HOWLAND, 'HOWLAND'); mark(M.NIKUMARORO, 'NIKUMARORO');
  if (!candParams) return;
  const ck = clock(), tb = trialFor(ck.seed, baseParams, 'base'), tc = trialFor(ck.seed, candParams, 'cand');
  const path = (tr, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); tr.points.forEach((p, i) => { const f = i ? 'lineTo' : 'moveTo'; g[f](X(p.lon), Y(p.lat)); }); g.stroke(); };
  path(tc, pal[4], 2); path(tb, pal[2], 1.2);
  g.fillStyle = pal[5]; g.font = '10px JetBrains Mono, monospace'; g.fillText(`current seed ${ck.seed} · baseline ends T+${hm(tb.end.t)} · candidate T+${hm(tc.end.t)}`, 8, 14);
}
function panelStatus() {
  const s = feed.snap, ck = clock(), up = (Date.now() - bootMs) / 3600000;
  const runs = s.runs || [];
  return `<div class="sec"><h4>48-HOUR BROADCAST STATUS</h4>
    <div class="row"><span>viewer uptime</span><span>${hm(up)} h</span></div>
    <div class="row"><span>broadcast clock (anchor ${new Date(store.start).toISOString().slice(0, 16)}Z · rate ×${P.rate})</span><span>${hm(ck.el / 3600)} · cycle ${ck.cycle + 1} · ${(ck.cyclePos * 100).toFixed(1)}% of 48 h</span></div>
    <div class="row"><span>trial on air</span><span>${ck.idx + 1}/192 · seed ${ck.seed} · flight T+${hm(ck.hour)}</span></div>
    <div class="row"><span>scenario clock</span><span>${new Date(DEP_MS + ck.hour * 3600000).toISOString().replace('T', ' ').slice(0, 16)} GCT</span></div></div>
    <div class="sec"><h4>MODEL VERSIONS</h4><table><tr><th>MODEL</th><th>STATUS</th><th>OUTPUT HASH</th></tr>${s.models.map(m => `<tr><td>${esc(m.model_id)}</td><td>${esc(m.status)}</td><td>${esc((m.output_hash || '').slice(0, 12))}</td></tr>`).join('')}</table>
    <div class="row"><span>real pointer</span><span>${esc(s.namespaces.real.pointer.baseline_model)} · ${esc(s.namespaces.real.pointer.approval_label)}</span></div></div>
    <div class="sec"><h4>WORKER RUNS · THROUGHPUT</h4><table><tr><th>RUN</th><th>START</th><th>STATUS</th><th>STEPS</th></tr>${runs.slice(-8).map(r => `<tr><td>${esc(r.run_id.slice(-9))}</td><td>${esc((r.started_at || '').slice(5, 16))}</td><td class="${r.status === 'ok' ? 'ok' : 'no'}">${esc(r.status)}${r.resumed ? ' · resumed' : ''}</td><td>${fmt(r.steps)}</td></tr>`).join('')}</table>
    <div class="row"><span>interrupted runs recovered</span><span>${runs.filter(r => r.status === 'interrupted').length}</span></div></div>
    <div class="sec"><h4>FAILED · BLOCKED · ASIDE</h4>${['real', 'demo'].map(ns => { const c = s.namespaces[ns].counters; return `<div class="mono-s">${tagNs(ns)} failed <b>${c.failed}</b> · blocked <b>${c.blocked}</b> · duplicate <b>${c.duplicates}</b> · corrupt <b>${c.corrupt}</b> · unsupported <b>${c.unsupported}</b> · retry-wait <b>${c.retry_wait}</b></div>`; }).join('')}
      ${s.sources.filter(x => x.error).slice(0, 6).map(x => `<div class="mono-s k">${esc(x.source_id)} · ${esc(x.error).slice(0, 90)}</div>`).join('')}</div>
    <div class="sec"><h4>REPLAY · RECOVERY</h4>
    <div class="row"><span>ledger head</span><span>${esc((s.ledger.last_hash || '').slice(0, 16))} · ${fmt(s.ledger.events)} events (hash-chained)</span></div>
    <div class="row"><span>feed content hash</span><span>${esc(s.content_hash.slice(0, 16))} · ${feedAge()}</span></div>
    <div class="row"><span>surrogate model.js</span><span class="${surrogate.ok ? 'ok' : 'no'}">${surrogate.ok === null ? 'checking…' : surrogate.ok ? 'sha256 matches pin ✓ (' + surrogate.via + ')' : 'MISMATCH ' + esc(String(surrogate.sha).slice(0, 16))}</span></div>
    <div class="row"><span>viewer resume</span><span>anchor + last seen seq ${fmt(store.seenSeq)} in localStorage · ?fresh=1 resets</span></div>
    <div class="row"><span>polls ok / failed</span><span>${feed.polls - feed.fails} / ${feed.fails}${feed.err ? ' · ' + esc(feed.err) : ''}</span></div>
    <div class="row"><span>console errors</span><span>${errors.length}</span></div></div>
    <div class="sec"><h4>PROVENANCE KEY</h4><span class="tag t-arch">ARCHIVAL OBSERVATION</span><span class="tag t-wx">WEATHER RECONSTRUCTION · none ingested</span><span class="tag t-fc">MODERN FORECAST · not used</span>
      <span class="tag t-hyp">HYPOTHETICAL / SURROGATE</span><span class="tag t-cand">CANDIDATE</span><span class="tag t-rev">HUMAN-APPROVED MODEL</span><span class="tag t-demo">SYNTHETIC DEMO</span><span class="tag t-auth">AUTHORED LOOK</span></div>`;
}
function feedAge() {
  if (!feed.snap) return feed.err ? 'feed unavailable: ' + esc(feed.err) : 'loading…';
  const age = (Date.now() - Date.parse(feed.snap.generated_at)) / 60000;
  return `generated ${esc(feed.snap.generated_at.slice(0, 16))}Z (${age < 90 ? age.toFixed(0) + ' min' : (age / 60).toFixed(1) + ' h'} ago) · polled every ${P.poll} s · ${location.protocol === 'https:' ? 'static host: changes only when a new feed is published' : 'local'}`;
}
let lastPanelHtml = '';
function renderPanel() {
  if (!feed.snap || !base) { $('panelBody').innerHTML = `<div class="sec"><h4>FEED</h4>${feedAge()}</div>`; return; }
  const html = scene === 'INTAKE' ? panelIntake() : scene === 'EVIDENCE' ? panelEvidence() : scene === 'MODEL' ? panelModel() : scene === 'STATUS' ? panelStatus() : '';
  if (html === lastPanelHtml) return;     // unchanged: keep scroll, hover and focus intact
  lastPanelHtml = html;
  $('panelBody').innerHTML = html;
  if (scene === 'MODEL') drawMap();
  if (scene === 'EVIDENCE') { const a = $('ev-prev'), b = $('ev-next'); if (a) a.onclick = () => cycleEvidence(-1); if (b) b.onclick = () => cycleEvidence(1); }
}

/* ------------------------------------------------------------------ HUD */
let lastHud = 0;
function hud(st, ck, gh) {
  const s = feed.snap, sun = world.sun || { el: 0, az: 0 }, moon = world.moon || { el: 0, illum: 0 };
  const scen = new Date(st.scenarioMs).toISOString().replace('T', ' ').slice(0, 16);
  $('hudT').innerHTML = `<div class="h1">MZTV <b>/</b> THE LAST FLIGHT</div><div class="mono-s k">RESEARCH ENGINE · BUILD-001 · ${esc(SHOTS[director.cur].label)}</div>`;
  $('hudR').innerHTML = `<div>${scen} GCT · T+${hm(ck.hour)}</div><div class="k">${st.lat.toFixed(2)}° ${st.lon > 180 ? (360 - st.lon).toFixed(2) + '°W' : st.lon.toFixed(2) + '°E'} · hdg ${Math.round(st.modelHeading)}° · fuel ${Math.round(st.fuel)} gal (model)</div>
    <div class="k">sun ${sun.el.toFixed(1)}° el · moon ${moon.el.toFixed(0)}° · ${(moon.illum * 100).toFixed(0)}% lit</div>`;
  const tags = [`<span class="tag t-hyp">${esc(base ? base.model_id : '…')} · EXPLORATORY SURROGATE · NOT VALIDATED</span>`,
    `<span class="tag t-hyp">TRIAL ${ck.idx + 1}/192 · SEED ${ck.seed} · HYPOTHETICAL</span>`,
    `<span class="tag t-arch">SUN + MOON: COMPUTED FOR 1937-07-02</span>`, `<span class="tag t-hyp">WIND / SEA: SYNTHETIC</span>`,
    `<span class="tag t-auth">CLOUDS · ALTITUDE 7,000 FT · LOOK: AUTHORED</span>`];
  if (gh && (scene === 'MODEL' || P.ghost)) tags.push(`<span class="tag t-cand">GHOST: ${esc(cand.proposed_model)} · CANDIDATE</span>`);
  let ended = '';
  if (st.observingCandidate) ended = `<div style="margin-top:4px;color:var(--glow)">BASELINE RUN ENDED at T+${hm(trialFor(ck.seed, baseParams, 'base').end.t)} · lens now observes CANDIDATE ${esc(cand.proposed_model)} (side preview, same seed) · modeled fuel ${Math.round(st.fuel)} gal</div>`;
  else if (st.ended) ended = `<div style="margin-top:4px;color:var(--glow)">SURROGATE RUN ENDED at T+${hm(st.end)} — modeled fuel exhausted. Outcome not classified; not a location claim.</div>`;
  if (gh && scene === 'MODEL' && !st.observingCandidate) {
    const same = Math.hypot(gh.dx, gh.dz) < 1 && !st.ended && !st.observingCandidate;
    ended += `<div class="k">candidate vs baseline, same seed: ${same ? 'tracks identical at this hour' : st.ended && !gh.ended ? `candidate still flying (+${hm(gh.end - st.end)} modeled endurance)` : `separation ${(Math.hypot(gh.dx, gh.dz) / 1000).toFixed(2)} km`}</div>`;
  }
  $('hudL').innerHTML = (scene === 'WORLD' ? `<div>${tags.join('')}</div>` : `<div>${tags.slice(0, 2).join('')}</div>`) + ended;
  if (s) {
    const c = s.namespaces.real.counters;
    const cd = s.candidates.filter(x => x.namespace === 'real').slice(-1)[0];
    $('ticker').innerHTML = `<span>INTAKE <b>REAL</b> · ${fmt(c.known_targets)} known · ${fmt(c.metadata_verified)} metadata · ${fmt(c.content_acquired)} acquired · ${fmt(c.pages_extracted)}/${fmt(c.pages_in_acquired_files)} pages · ${fmt(c.claims)} claims · ${fmt(c.claims_reviewed)} reviewed · ${fmt(c.claims_in_approved_baseline)} in approved model</span>
      ${cd ? `<span>CANDIDATE <b>${esc(cd.proposed_model)}</b> · ${esc(cd.params_changed.map(x => `${x.key} ${x.base}→${x.proposed}`).join(', '))} · ${esc(cd.review_status)} · awaiting MZ.Human</span>` : ''}
      <span>LENS ${scene}${pinned ? ' (manual)' : autoUntil > Date.now() ? ' (' + esc(autoReason) + ')' : ''}</span>`;
  }
}
$('info').innerHTML = `<h4>THE LAST FLIGHT · RESEARCH ENGINE</h4>
  <div>A living Pacific world beside a research apparatus that learns to distinguish what it has received, what it can defend, and what it may allow to influence a model. New information is not automatically truth.</div>
  <div class="k" style="margin-top:6px">The Electra flies the exploratory surrogate (unchanged original prototype) on one seeded trial per 24 h. Sun and moon are computed for 2 July 1937 at its position. Wind is the model's synthetic wind; clouds, altitude and look are authored. The renderer never changes the model.</div>
  <div style="margin-top:6px">buttons bottom-right, or keys · <b>1</b> world <b>2</b> intake <b>3</b> evidence <b>4</b> model <b>5</b> status <b>0</b> auto · <b>C</b> camera · <b>← →</b> sources · <b>A</b> sound · <b>M</b> mute · <b>I</b> this box</div>`;
if (P.info && !P.obs && innerWidth > 760) $('info').classList.add('on');   // phones: open with ?

/* ------------------------------------------------------------------ loop */
let lastT = performance.now() / 1000, panelT = 0, ghostOn = false;
function frame(tReal, dt) {
  if (!feed.snap || !base) return;
  if (autoUntil && Date.now() > autoUntil && !pinned) { autoUntil = 0; setScene('WORLD'); }
  const ck = clock();
  const st = aircraftState(ck);
  st.sunLow = world.sun ? world.sun.el > -4 && world.sun.el < 14 : false;
  st.night = world.sun ? world.sun.el < -6 : false;
  direct(st, tReal);
  const shot = SHOTS[director.cur].pose(st, tReal, director);
  if (!camSmooth.pos || director.cur !== camSmooth.id) { camSmooth.pos = shot.pos.clone(); camSmooth.look = shot.look.clone(); camSmooth.id = director.cur; }
  const k = 1 - Math.exp(-dt * 4);
  camSmooth.pos.lerp(shot.pos, k); camSmooth.look.lerp(shot.look, k);
  let gh = (scene === 'MODEL' || P.ghost) ? ghostState(ck, st) : null;
  let asGhost = false;
  if (gh && st.ended && !gh.ended) {   // baseline run over: the lens now observes the candidate's own state
    const p = gh.p, latm = (p.lat + M.LAE.lat) / 2;
    Object.assign(st, { east: (p.lon - M.LAE.lon) * 111195 * Math.cos(latm * D2R), north: (p.lat - M.LAE.lat) * 111195,
      lat: p.lat, lon: p.lon, headingDeg: p.heading, modelHeading: p.heading, fuel: p.fuel, ended: false, observingCandidate: true });
    asGhost = true; gh = Object.assign({}, gh, { dx: 0, dz: 0 });
  }
  const gDraw = !asGhost && gh && Math.hypot(gh.dx, gh.dz) > 1 && !gh.ended ? gh : null;
  world.render(st, { pos: camSmooth.pos, look: camSmooth.look, fov: shot.fov, roll: shot.roll || 0 }, tReal, gDraw, asGhost);
  sound.update({ cam: director.cur.split(' ')[0], ended: st.ended, minute: new Date(st.scenarioMs).getUTCMinutes() });
  if (tReal - lastHud > 0.25) { lastHud = tReal; hud(st, ck, gh); }
  if (dirty || tReal - panelT > 2) { dirty = false; panelT = tReal; renderPanel(); }
  window.__last = { st, ck, shot: director.cur };
}
function loop() {
  const t = performance.now() / 1000, dt = Math.min(0.1, t - lastT); lastT = t;
  try { frame(t, dt); } catch (e) { errors.push(String(e.stack || e)); }
  requestAnimationFrame(loop);
}

/* ------------------------------------------------------------------ test / OBS API (read-only observers) */
window.MZ = {
  scene: n => { pinned = true; setScene(SCENES[n - 1] || n); },
  cam: id => setCam(id),
  advance: sec => { manualAdvance += sec; },
  tick: (dt = 1 / 30) => { simClockSec += dt; frame(performance.now() / 1000, dt); },
  select: id => { evSel = id; dirty = true; },
  poll, errors, feed, cuts: director.cuts, lens: () => scene, surrogate, sound,
  snapshot() {
    const L = window.__last; if (!L) return null;
    return { entity: 'world_snapshot', model_id: base.model_id, model_version: base.version, model_status: base.status,
      candidate_preview: cand ? cand.proposed_model : null, trial_index: L.ck.idx, seed: L.ck.seed, flight_hour: L.ck.hour,
      scenario_clock_utc: new Date(L.st.scenarioMs).toISOString(), position: { lat: L.st.lat, lon: L.st.lon }, heading_model: L.st.modelHeading,
      heading_drawn: L.st.headingDeg, fuel_model_gal: L.st.fuel, ended: L.st.ended,
      weather_provenance: 'SYNTHETIC (model.js seeded wind); no 1937 reanalysis or modern forecast', sun: world.sun, moon: world.moon,
      sun_source: 'computed low-precision ephemeris for scenario time + position', camera: { id: L.shot, label: SHOTS[L.shot].label },
      environment: { clouds: 'AUTHORED', altitude_m: 2134, altitude_basis: 'AUTHORED display altitude (one radio report: 7000 ft)' },
      provenance_mode: 'EXPLORATORY SURROGATE · REAL-namespace baseline', lens: scene, feed_hash: feed.snap.content_hash, surrogate_ok: surrogate.ok };
  },
};

/* ------------------------------------------------------------------ boot */
resize();
setScene(scene);
await poll();
setInterval(poll, P.poll * 1000);
if (!P.capture) requestAnimationFrame(loop); else frame(performance.now() / 1000, 0.033);
