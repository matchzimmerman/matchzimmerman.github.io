/* MZ WORLD · MEMORIAL STADIUM · BIT FIELD 048 · sound — THE HELD SECOND
   The picture holds one second after Unitas crosses the line; the sound holds it too.
   57,545 people roaring, stretched into a bed that breathes: slow murmur inside the roar (seconds),
   second waves that rise out of it (minutes), a bass drum from the band and the bowl itself
   resonating under it, drizzle low on the concrete, a far PA horn that never quite says a word.
   Everything here is creative (claim 40): no recording of this game's crowd is used or imitated.

   Hardening (MZTV build protocol): one AudioContext; continuous worklet noise (data: URL → blob →
   crossfaded segments); every voice enveloped to zero before stop() and disconnected on end;
   the dub-delay loop runs through tanh + filters; lookahead scheduler (40 ms, 0.4 s ahead, skips
   after a stall); watchdog (resume, recreate on close/stall, rebuild on NaN or 20 s silence,
   refresh every 3 h); AudioParams moved with setTargetAtTime at ≤10 Hz, redundant values skipped.
   Mix: low end carries weight; noise beds lowpassed; master lowpass 1.5 kHz.                      */

const AU = { ctx: null, g: null, started: false, enabled: true, silentSince: 0, graphAt: 0, lastCT: 0, lastCTAt: 0,
  nextStep: 0, step: 0, nextSwell: 0, swell: 0, nextPA: 0, t0: 0, rebuilding: false, events: [] };
/* stop a param's pending automation without a jump (cancelAndHold where the browser has it) */
const hold = (p, t) => { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { const v = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v, t); } };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
let seed = 48 * 7919;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const NOISE_WORKLET = "class N extends AudioWorkletProcessor{constructor(){super();this.b=0;this.p=0;}process(i,o){const c=o[0];for(let ch=0;ch<c.length;ch++){const d=c[ch];for(let k=0;k<d.length;k++){const w=Math.random()*2-1;this.b=this.b*.97+w*.03;d[k]=w*.45+this.b*2.4;}}return true;}}registerProcessor('mz-noise-048',N);";
async function noiseSource(ctx) {
  const mk = () => new AudioWorkletNode(ctx, 'mz-noise-048', { outputChannelCount: [2] });
  if (ctx._mzNoise) return mk();
  try { await ctx.audioWorklet.addModule('data:application/javascript,' + encodeURIComponent(NOISE_WORKLET)); ctx._mzNoise = 1; return mk(); } catch (e) {}
  try { const u = URL.createObjectURL(new Blob([NOISE_WORKLET], { type: 'application/javascript' })); await ctx.audioWorklet.addModule(u); ctx._mzNoise = 1; return mk(); } catch (e) {}
  // fallback: crossfaded 6 s one-shot segments (never a looped buffer)
  const out = ctx.createGain();
  const seg = () => { if (ctx.state === 'closed') return;
    const len = ctx.sampleRate * 6, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let br = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; br = br * .97 + w * .03; d[i] = w * .45 + br * 2.4; } }
    const s = ctx.createBufferSource(), e = ctx.createGain(); s.buffer = b; s.connect(e); e.connect(out); const t = ctx.currentTime;
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(1, t + 1); e.gain.setValueAtTime(1, t + 5); e.gain.linearRampToValueAtTime(0, t + 6);
    s.start(t); s.stop(t + 6.05); s.onended = () => { s.disconnect(); e.disconnect(); }; setTimeout(seg, 5000); };
  seg(); return out;
}

const tanhCurve = (k, a = 1) => { const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) c[i] = Math.tanh((i / 511.5 - 1) * k) * a; return c; };

async function buildGraph() {
  const ctx = AU.ctx, G = { ctx, nodes: [] }, keep = (...n) => { G.nodes.push(...n); return n[0]; };
  const out = keep(ctx.createGain()); out.gain.value = 0;
  const lp = keep(ctx.createBiquadFilter()); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = .5;
  const comp = keep(ctx.createDynamicsCompressor()); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = .05; comp.release.value = .7;
  const an = keep(ctx.createAnalyser()); an.fftSize = 1024;
  out.connect(lp); lp.connect(comp); comp.connect(an); comp.connect(ctx.destination);

  // dub delay: the bowl throws the drum back off the upper deck (tanh in the loop, cannot run away)
  const dIn = keep(ctx.createGain()), dl = keep(ctx.createDelay(4)), fb = keep(ctx.createGain()), sh = keep(ctx.createWaveShaper()),
        dhp = keep(ctx.createBiquadFilter()), dlp = keep(ctx.createBiquadFilter()), dOut = keep(ctx.createGain());
  sh.curve = tanhCurve(1.6); sh.oversample = '4x'; dl.delayTime.value = .74; fb.gain.value = .42; dhp.type = 'highpass'; dhp.frequency.value = 55; dlp.type = 'lowpass'; dlp.frequency.value = 620;
  dOut.gain.value = .55;
  dIn.connect(dl); dl.connect(dlp); dlp.connect(dhp); dhp.connect(sh); sh.connect(fb); fb.connect(dl); sh.connect(dOut); dOut.connect(out);

  const nz = keep(await noiseSource(ctx));
  const band = (type, fq, q, pan = 0) => { const f = keep(ctx.createBiquadFilter()); f.type = type; f.frequency.value = fq; f.Q.value = q;
    const gg = keep(ctx.createGain()); gg.gain.value = 0; const p = keep(ctx.createStereoPanner()); p.pan.value = pan;
    nz.connect(f); f.connect(gg); gg.connect(p); p.connect(out); return { f, g: gg, p }; };
  // the crowd: three registers of the roar, spread across the horseshoe
  const crowd = [band('bandpass', 190, .8, -.45), band('bandpass', 360, .9, .35), band('bandpass', 640, 1.1, 0)];
  const swellB = band('bandpass', 300, .6, 0);                  // second waves rise out of the bed
  const rain = band('lowpass', 360, .3, 0);                     // drizzle on concrete, kept under 500 Hz

  // the bowl: a low body under the roar, on a 2:3 pair (creative resonance, not measured)
  const bowlG = keep(ctx.createGain()); bowlG.gain.value = 0; bowlG.connect(out);
  const bowl = [[38, 'sine', .7], [57, 'sine', .35], [76, 'triangle', .12]].map(([fq, ty, a], i) => {
    const o = keep(ctx.createOscillator()); o.type = ty; o.frequency.value = fq; o.detune.value = (i - 1) * 3;
    const gg = keep(ctx.createGain()); gg.gain.value = a; o.connect(gg); gg.connect(bowlG); o.start(); return o; });

  // the PA: a far horn voice, formants without words (sawtooth → two bandpasses → slow delay)
  const paIn = keep(ctx.createGain()); paIn.gain.value = 0;
  const f1 = keep(ctx.createBiquadFilter()), f2 = keep(ctx.createBiquadFilter()), paLP = keep(ctx.createBiquadFilter()), paOut = keep(ctx.createGain());
  f1.type = f2.type = 'bandpass'; f1.frequency.value = 560; f2.frequency.value = 1080; f1.Q.value = 6; f2.Q.value = 7;
  paLP.type = 'lowpass'; paLP.frequency.value = 1300; paOut.gain.value = .5;
  paIn.connect(f1); paIn.connect(f2); f1.connect(paLP); f2.connect(paLP); paLP.connect(paOut); paOut.connect(out); paOut.connect(dIn);
  const paOsc = keep(ctx.createOscillator()); paOsc.type = 'sawtooth'; paOsc.frequency.value = 118; paOsc.connect(paIn); paOsc.start();

  Object.assign(G, { out, an, dIn, fb, crowd, swellB, rain, bowlG, paIn, paOsc, f1, f2, lp });
  out.gain.setTargetAtTime(1.0, ctx.currentTime + .05, 1.5);
  AU.graphAt = performance.now(); last = {};
  return G;
}

function killGraph(G) {
  if (!G) return; try { G.out.gain.setTargetAtTime(0, G.ctx.currentTime, 1.2); } catch (e) {}
  setTimeout(() => { for (const n of G.nodes) { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} } }, 4500);
}

let last = {};
function setP(p, key, v, tc = .4) {
  if (!Number.isFinite(v)) return; const o = last[key];
  if (o !== undefined && Math.abs(o - v) < 1e-4 * Math.max(1, Math.abs(v))) return;
  last[key] = v; p.setTargetAtTime(v, AU.ctx.currentTime, tc);
}

/* one bass-drum stroke from the band: sine sweep, enveloped to zero, into the dub loop */
function drum(t, amp) {
  const c = AU.ctx, G = AU.g; if (!G) return;
  const o = c.createOscillator(), e = c.createGain(), s = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(74, t); o.frequency.exponentialRampToValueAtTime(41, t + .35);
  e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(amp, t + .03); e.gain.setTargetAtTime(0, t + .05, .28); e.gain.setValueAtTime(0, t + 1.9);
  s.gain.value = .5; o.connect(e); e.connect(G.out); e.connect(s); s.connect(G.dIn);
  o.start(t); o.stop(t + 2); o.onended = () => { o.disconnect(); e.disconnect(); s.disconnect(); };
}

/* E(k, n): Euclidean rhythm, rotated */
const euclid = (k, n, r = 0) => Array.from({ length: n }, (_, i) => ((i + r) * k) % n < k);

/* the scheduler: drum steps, swells and PA calls planned 0.4 s ahead */
function scheduler() {
  const c = AU.ctx; if (!c || !AU.g || c.state !== 'running') return;
  const now = c.currentTime, ahead = now + .4, el = (now - AU.t0) / 3600;           // hours since the sound began
  if (AU.nextStep < now - 1) AU.nextStep = now + .05;                                 // after a stall: skip forward, never burst
  // the band's drum: E(5,13) at 13 steps per ~9.6 s, rotation drifting over hours; denser in a swell
  const stepDur = .74, pat = euclid(5, 13, Math.floor(el * 3) % 13);
  while (AU.nextStep < ahead) {
    const i = AU.step % 13; AU.step++;
    const p = pat[i] ? .85 : AU.swell > .5 && i % 3 === 0 ? .35 : 0;
    if (p && rnd() < p) drum(AU.nextStep, .3 * (.6 + .4 * AU.swell) * (i === 0 ? 1 : .75));
    AU.nextStep += stepDur;
  }
  // second waves: one every 25–95 s, each 5–14 s up and 9–20 s down
  if (!AU.nextSwell) AU.nextSwell = now + 8;
  if (now > AU.nextSwell) {
    const up = 5 + rnd() * 9, down = 9 + rnd() * 11, peak = .5 + rnd() * .5, g = AU.g.swellB.g.gain;
    hold(g, now); g.setTargetAtTime(peak * .16, now, up / 3); g.setTargetAtTime(0, now + up, down / 3);
    AU.swellUntil = now + up; AU.swellPeak = peak; AU.events.push({ t: now, ev: 'second wave' });
    AU.nextSwell = now + up + down + 25 + rnd() * 70;
  }
  AU.swell = AU.swellUntil && now < AU.swellUntil ? AU.swellPeak : Math.max(0, AU.swell - .01);
  // the PA: every 2–6 min a few syllables of a far horn voice
  if (!AU.nextPA) AU.nextPA = now + 40 + rnd() * 40;
  if (now > AU.nextPA) { paPhrase(now + .1); AU.nextPA = now + 120 + rnd() * 240; }
}

function paPhrase(t) {
  const G = AU.g, g = G.paIn.gain, n = 3 + Math.floor(rnd() * 5); let tt = t;
  hold(g, t);
  for (let i = 0; i < n; i++) {
    const d = .16 + rnd() * .28, a = (.025 + rnd() * .02) * (i === n - 1 ? .7 : 1);
    g.setTargetAtTime(a, tt, .03); g.setTargetAtTime(0, tt + d, .05);
    G.paOsc.frequency.setTargetAtTime(110 + rnd() * 26, tt, .05);
    G.f1.frequency.setTargetAtTime(480 + rnd() * 260, tt, .04); G.f2.frequency.setTargetAtTime(950 + rnd() * 400, tt, .04);
    tt += d + .07 + rnd() * .12;
  }
  g.setTargetAtTime(0, tt, .1);
  AU.events.push({ t, ev: 'PA' });
}

/* slow parameters, ≤10 Hz: the murmur inside the roar */
let walk = [0, 0, 0, 0];
function params() {
  const G = AU.g, c = AU.ctx; if (!G || !c) return;
  const now = c.currentTime;
  for (let i = 0; i < walk.length; i++) walk[i] = clamp(walk[i] * .985 + (rnd() - .5) * .09, -1, 1);
  const breath = .5 + .5 * Math.sin(now * 2 * Math.PI / 37);                          // a 37 s breath in the whole house
  const roar = .62 + .18 * breath + .12 * AU.swell;
  const lv = [.24, .19, .085];
  G.crowd.forEach((b, i) => {
    setP(b.g.gain, 'cg' + i, lv[i] * roar * (1 + .3 * walk[i]), .35);
    setP(b.f.frequency, 'cf' + i, [190, 360, 640][i] * (1 + .06 * walk[(i + 1) % 4] + .05 * AU.swell), .6);
    setP(b.p.pan, 'cp' + i, clamp([-.45, .35, 0][i] + .25 * walk[(i + 2) % 4], -.8, .8), 1.2);
  });
  setP(G.rain.g.gain, 'rain', .05 * (1 + .25 * walk[3]), .8);
  setP(G.bowlG.gain, 'bowl', .022 + .022 * roar + .02 * AU.swell, .9);
  setP(G.swellB.f.frequency, 'sf', 260 + 140 * AU.swell, .8);
}

const abuf = new Float32Array(1024);
function watchdog() {
  const c = AU.ctx; if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  if (c.state === 'closed') { recreate(); return; }
  const now = performance.now();
  if (c.currentTime !== AU.lastCT) { AU.lastCT = c.currentTime; AU.lastCTAt = now; }
  else if (now - AU.lastCTAt > 6000 && c.state === 'running') { recreate(); return; }
  if (AU.g) {
    AU.g.an.getFloatTimeDomainData(abuf); let s = 0; for (let i = 0; i < abuf.length; i++) s += abuf[i] * abuf[i];
    if (!Number.isFinite(s)) { rebuild('nan'); return; }
    if (s < 1e-9) { if (!AU.silentSince) AU.silentSince = now; else if (now - AU.silentSince > 20000) { AU.silentSince = 0; rebuild('silence'); return; } } else AU.silentSince = 0;
    AU.rms = Math.sqrt(s / abuf.length);
  }
  if (now - AU.graphAt > 3 * 3600 * 1000) rebuild('refresh');
}
async function rebuild(reason) {
  if (!AU.ctx || AU.rebuilding) return; AU.rebuilding = true; const old = AU.g;
  try { AU.g = await buildGraph(); killGraph(old); AU.events.push({ t: AU.ctx.currentTime, ev: 'rebuilt (' + reason + ')' }); } catch (e) {}
  AU.rebuilding = false;
}
async function recreate() {
  try { AU.ctx && AU.ctx.state !== 'closed' && AU.ctx.close(); } catch (e) {}
  AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); AU.g = await buildGraph();
  AU.lastCT = AU.ctx.currentTime; AU.lastCTAt = performance.now(); AU.nextStep = 0; AU.nextSwell = 0; AU.nextPA = 0; AU.t0 = AU.ctx.currentTime;
}

export async function startSound() {
  if (!AU.enabled || AU.started) return; AU.started = true;
  try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); AU.g = await buildGraph(); }
  catch (e) { AU.started = false; return; }
  AU.t0 = AU.ctx.currentTime; AU.lastCT = AU.ctx.currentTime; AU.lastCTAt = performance.now();
  setInterval(scheduler, 40); setInterval(params, 100); setInterval(watchdog, 1000);
}
export function gestureSound() { if (AU.ctx) { if (AU.ctx.state !== 'running') AU.ctx.resume().catch(() => {}); } else startSound(); }
export function disableSound() { AU.enabled = false; }
export function soundState() {
  const c = AU.ctx;
  return { state: c ? c.state : AU.enabled ? 'waiting for a click' : 'off', swell: +AU.swell.toFixed(2), rms: AU.rms || 0,
    lastEvent: AU.events.length ? AU.events[AU.events.length - 1].ev : '', events: AU.events.length };
}
/* test hooks: force failures and confirm recovery */
export const soundTest = {
  suspend: () => AU.ctx && AU.ctx.suspend(), close: () => AU.ctx && AU.ctx.close(), rebuild: () => rebuild('test'),
  swell: () => { AU.nextSwell = 1; }, pa: () => { AU.nextPA = 1; }, ctx: () => AU.ctx, master: () => AU.g && AU.g.an
};
