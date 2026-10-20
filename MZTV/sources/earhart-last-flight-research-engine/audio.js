/* THE LAST FLIGHT · research engine · SOUND (opt-in)
   The live lens is the microphone. Layers follow observed world state:
   - two radial engines (authored ~1,950 rpm: 9-cylinder firing ≈146 Hz, 2-blade
     prop ≈65 Hz), slightly detuned so they beat; silent once the model's fuel is 0
   - air: lowpassed noise, louder in the cockpit and on the wing
   - ocean: brown noise, only audible from the distant lens near the water
   - radio: faint band-limited static on 3105/6210 kc tuning (no speech, no
     archival audio; nothing here is presented as historical)
   Hardening: one AudioContext, continuous sources (AudioWorklet noise via data: URL,
   buffer fallback with long non-repeating segments), params moved with
   setTargetAtTime at ≤10 Hz, 1 s watchdog that resumes/rebuilds. */
const NOISE_WORKLET = `class N extends AudioWorkletProcessor{constructor(){super();this.b=0;this.s=0x12345678}
process(i,o){const ch=o[0];for(let c=0;c<ch.length;c++){const d=ch[c];for(let k=0;k<d.length;k++){
this.s^=this.s<<13;this.s^=this.s>>>17;this.s^=this.s<<5;const w=((this.s>>>0)/4294967296)*2-1;
this.b=(this.b+0.02*w)/1.02;d[k]=c===0?w*0.5:this.b*3.5;}}return true}}registerProcessor('mz-noise',N);`;

export class Sound {
  constructor() { this.ctx = null; this.muted = false; this.want = {}; this.last = {}; this.lastTick = 0; this.ok = false; }
  async start() {
    if (this.ctx && this.ctx.state !== 'closed') { await this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    this.ctx = new C();
    await this.build();
    if (!this.watch) this.watch = setInterval(() => this.watchdog(), 1000);
  }
  async noiseNode() {
    const c = this.ctx;
    try {
      await c.audioWorklet.addModule('data:application/javascript,' + encodeURIComponent(NOISE_WORKLET));
      return new AudioWorkletNode(c, 'mz-noise', { numberOfInputs: 0, outputChannelCount: [2] });
    } catch (e) {
      const len = c.sampleRate * 23.7, b = c.createBuffer(2, len, c.sampleRate);   // long, prime-ish length: no audible loop
      let last = 0;
      for (let k = 0; k < len; k++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; b.getChannelData(0)[k] = w * 0.5; b.getChannelData(1)[k] = last * 3.5; }
      const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.start(); return s;
    }
  }
  async build() {
    const c = this.ctx, t = c.currentTime;
    const master = this.master = c.createGain(); master.gain.value = 0;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 26;
    const shelf = c.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 2000; shelf.gain.value = -10;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    master.connect(hp); hp.connect(shelf); shelf.connect(lp); lp.connect(comp); comp.connect(c.destination);
    this.an = c.createAnalyser(); this.an.fftSize = 512; comp.connect(this.an);
    this.tap = c.createMediaStreamDestination(); comp.connect(this.tap);   // for QA recording
    // engines
    this.eng = [];
    for (const [f, pan] of [[146, -0.35], [147.3, 0.35]]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const sub = c.createOscillator(); sub.type = 'triangle'; sub.frequency.value = f * 0.444;
      const lpf = c.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 520; lpf.Q.value = 0.7;
      const g = c.createGain(); g.gain.value = 0; const p = c.createStereoPanner(); p.pan.value = pan;
      const sg = c.createGain(); sg.gain.value = 0.55;
      o.connect(lpf); sub.connect(sg); sg.connect(lpf); lpf.connect(g); g.connect(p); p.connect(master);
      o.start(t); sub.start(t);
      this.eng.push({ o, sub, lpf, g });
    }
    const noise = await this.noiseNode();
    const split = c.createChannelSplitter(2); noise.connect(split);
    // air (white → lowpass) and sea (brown)
    const airF = c.createBiquadFilter(); airF.type = 'lowpass'; airF.frequency.value = 420;
    this.air = c.createGain(); this.air.gain.value = 0; split.connect(airF, 0); airF.connect(this.air); this.air.connect(master);
    const seaF = c.createBiquadFilter(); seaF.type = 'lowpass'; seaF.frequency.value = 300;
    this.sea = c.createGain(); this.sea.gain.value = 0; split.connect(seaF, 1); seaF.connect(this.sea); this.sea.connect(master);
    // radio static (band-limited, gated slowly)
    const rf = c.createBiquadFilter(); rf.type = 'bandpass'; rf.frequency.value = 1400; rf.Q.value = 2.2;
    this.radio = c.createGain(); this.radio.gain.value = 0; split.connect(rf, 0); rf.connect(this.radio); this.radio.connect(master);
    master.gain.setTargetAtTime(this.muted ? 0 : 0.8, t, 1.5);
    this.ok = true; this.silentFor = 0; this.lastTime = c.currentTime; this.stall = 0;
  }
  // called every frame with observed state; throttled to ≤10 Hz
  update(s) {
    if (!this.ctx || !this.ok) return;
    const now = performance.now();
    if (now - this.lastTick < 100) return;
    this.lastTick = now;
    const t = this.ctx.currentTime, set = (k, param, v, tc = 0.4) => {
      if (!Number.isFinite(v)) return;
      if (this.last[k] !== undefined && Math.abs(this.last[k] - v) < 1e-4) return;
      this.last[k] = v; param.setTargetAtTime(v, t, tc);
    };
    const run = s.ended ? 0 : 1;
    const close = { COCKPIT: 1, WING: 0.85, CHASE: 0.55, DISTANT: 0.12 }[s.cam] ?? 0.4;
    this.eng.forEach((e, i) => {
      set('eg' + i, e.g.gain, 0.12 * run * close, 0.8);
      set('ef' + i, e.lpf.frequency, 380 + 240 * close, 0.8);
      const wob = 1 + 0.002 * Math.sin(now / 3100 + i * 2);
      set('eo' + i, e.o.frequency, (146 + i * 1.3) * wob, 1.2);
      set('es' + i, e.sub.frequency, (146 + i * 1.3) * 0.444 * wob, 1.2);
    });
    set('air', this.air.gain, (0.05 + 0.1 * close) * (run ? 1 : 0.3), 1);
    set('sea', this.sea.gain, s.cam === 'DISTANT' ? 0.05 : 0.012, 2);
    const q = (s.minute % 30) < 2 ? 0.02 : 0.004;        // a slightly louder static band twice an hour (authored)
    set('radio', this.radio.gain, q, 2);
    set('master', this.master.gain, this.muted ? 0 : 0.8, 0.3);
  }
  mute(m) { this.muted = m; if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.2); }
  watchdog() {
    const c = this.ctx; if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    if (c.state === 'closed') { this.ctx = null; this.ok = false; this.start(); return; }
    if (c.currentTime === this.lastTime && c.state === 'running') { this.stall++; if (this.stall > 6) { try { c.close(); } catch (e) {} } }
    else this.stall = 0;
    this.lastTime = c.currentTime;
  }
  level() {
    if (!this.an) return -120;
    const a = new Float32Array(this.an.fftSize); this.an.getFloatTimeDomainData(a);
    let s = 0; for (const v of a) s += v * v; return 10 * Math.log10(s / a.length + 1e-12);
  }
}
