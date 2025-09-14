// HARIL AudioGlyph Studio v1
const stage = document.getElementById('stage');
const defs = document.getElementById('defs');
const palette = document.getElementById('palette');

// Controls helpers
const ci = (id)=>document.getElementById(id);
const ctl = {
  bpm: ci('ctlBPM'),
  key: ci('ctlKey'),
  scale: ci('ctlScale'),
  melody: ci('ctlMelody'),
  drums: ci('ctlDrums'),
  space: ci('ctlSpace'),
  vol: ci('ctlVol'),

  mapBassScale: ci('mapBassScale'),
  mapMidStroke: ci('mapMidStroke'),
  mapHighColor: ci('mapHighColor'),
  mapDisplace: ci('mapDisplace'),
  smooth: ci('ctlSmooth'),

  density: ci('ctlDensity'),
  palette: ci('paletteSelect'),
};

const valIds = ['BPM','Melody','Drums','Space','Vol','BassScale','MidStroke','HighColor','Displace','Smooth','Density'];
valIds.forEach(id=>{
  const inputId = 'ctl'+id;
  const mapId = 'map'+id;
  const el = document.getElementById(inputId) || document.getElementById(mapId);
  const val = document.getElementById('val'+id);
  if (el && val) el.addEventListener('input', ()=> val.textContent = el.value);
});

// Files
ci('fileInput').addEventListener('change', async (e)=>{
  const files = [...e.target.files].filter(f=>f.name.endsWith('.svg'));
  const texts = await Promise.all(files.map(f=>f.text()));
  texts.forEach((t,i)=>registerSVG(t, files[i].name));
});
ci('loadSamples').addEventListener('click', ()=> SAMPLE_SVGS.forEach((t,i)=>registerSVG(t,'sample_'+i)));
document.addEventListener('keydown',(e)=>{
  if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='l'){ e.preventDefault(); ci('loadSamples').click(); }
});

// Fullscreen
ci('fullscreen').addEventListener('click', ()=>{
  if (!document.fullscreenElement) stage.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// Mic Mode
let micAnalyser = null;
ci('enableMic').addEventListener('click', async ()=>{
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    const ac = audioContext || new (window.AudioContext||window.webkitAudioContext)();
    const src = ac.createMediaStreamSource(stream);
    micAnalyser = ac.createAnalyser();
    micAnalyser.fftSize = 1024;
    src.connect(micAnalyser);
    alert('Mic mode active. Visuals will use mic bands; engine audio can still run.');
  }catch(err){ alert('Mic error: '+err.message); }
});

// ---------- Color palettes ----------
const PALETTES = {
  nightfall: [
    [220, 68, 14], [260, 50, 22], [280, 35, 28], [210, 20, 18]
  ],
  embers: [
    [34, 70, 42], [18, 55, 36], [14, 45, 30], [40, 20, 18]
  ],
  glacier: [
    [190, 40, 36], [205, 28, 46], [220, 15, 62], [210, 6, 80]
  ],
  mono: [
    [0, 0, 92], [0, 0, 86], [0, 0, 78], [0, 0, 70]
  ],
};
function lerp(a,b,t){ return a+(b-a)*t; }
function lerp3(a,b,t){ return [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)]; }
function hslStr(h,s,l){ return `hsl(${h} ${s}% ${l}%)`; }
function paletteColor(pname, t){
  const stops = PALETTES[pname] || PALETTES.nightfall;
  const seg = 1/(stops.length-1);
  const i = Math.min(stops.length-2, Math.floor(t/seg));
  const tt = (t - i*seg)/seg;
  const c = lerp3(stops[i], stops[i+1], tt);
  return hslStr(c[0], c[1], c[2]);
}

// ---------- SVG Registry ----------
let templates = []; // {id, vb, name}
let glyphs = [];    // instances

function registerSVG(svgText, name='svg'){
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  let svg = doc.documentElement;
  if (svg.nodeName.toLowerCase() !== 'svg') return;
  if (!svg.getAttribute('viewBox')){
    const w = svg.getAttribute('width') || 100;
    const h = svg.getAttribute('height') || 100;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  svg.querySelectorAll('[fill]').forEach(el=>{
    const f = el.getAttribute('fill');
    if (!f || f.toLowerCase()!=='none'){ el.setAttribute('fill','none'); }
  });

  const id = 'sym_'+Math.random().toString(36).slice(2);
  const symbol = document.createElementNS('http://www.w3.org/2000/svg','symbol');
  symbol.setAttribute('id', id);
  symbol.setAttribute('viewBox', svg.getAttribute('viewBox'));
  while (svg.firstChild) symbol.appendChild(svg.firstChild);
  defs.appendChild(symbol);
  templates.push({id, vb:symbol.getAttribute('viewBox'), name});

  // palette preview
  const pal = document.createElement('div');
  pal.className = 'pal';
  pal.innerHTML = `<svg viewBox="${symbol.getAttribute('viewBox')}" xmlns="http://www.w3.org/2000/svg"><use href="#${id}" stroke="black" fill="none"/></svg>`;
  palette.appendChild(pal);

  // spawn some immediately
  spawnInstances(3);
}

function spawnInstances(n=1){
  for (let i=0;i<n;i++){
    if (templates.length===0) return;
    const t = templates[Math.floor(Math.random()*templates.length)];
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.classList.add('glyph');

    // unique distortion filter
    const fid = 'f_'+Math.random().toString(36).slice(2);
    const filter = document.createElementNS('http://www.w3.org/2000/svg','filter');
    filter.setAttribute('id', fid);
    filter.innerHTML = `
      <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" seed="${Math.floor(Math.random()*9999)}" result="noise"/>
      <feDisplacementMap in2="noise" in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    `;
    defs.appendChild(filter);

    const use = document.createElementNS('http://www.w3.org/2000/svg','use');
    use.setAttribute('href', '#'+t.id);
    use.setAttribute('stroke', 'white');
    use.setAttribute('fill', 'none');
    use.setAttribute('filter', `url(#${fid})`);
    g.appendChild(use);
    stage.appendChild(g);

    const inst = {
      el: g, use, filter,
      x: Math.random()*1600, y: Math.random()*900, r: Math.random()*360,
      sx: 0.7 + Math.random()*1.0, sy: 0.7 + Math.random()*1.0,
      vx: (Math.random()*2-1)*0.25, vy: (Math.random()*2-1)*0.25,
      vr: (Math.random()*2-1)*8,
      huePhase: Math.random(),
      age: 0
    };
    glyphs.push(inst);
  }
}

function enforceDensity(){
  const target = parseInt(ctl.density.value);
  if (glyphs.length < target) spawnInstances(target-glyphs.length);
  if (glyphs.length > target){
    const rm = glyphs.splice(0, glyphs.length-target);
    rm.forEach(it=>it.el.remove());
  }
}

// ---------- Audio Engine (Web Audio) ----------
let audioContext = null;
let master = null, analyser = null;
let delay = null;
let isRunning = false;

let scheduleId = null;
let nextNoteTime = 0;
let currentStep = 0;
const lookahead = 0.025; // s
const scheduleAheadTime = 0.1; // s

const scales = {
  minor: [0,2,3,5,7,8,10,12],
  dorian: [0,2,3,5,7,9,10,12],
  pentatonic: [0,3,5,7,10,12],
  chromatic: [0,1,2,3,4,5,6,7,8,9,10,11,12]
};
const keyIndex = {'C':0,'C#':1,'D':2,'Eb':3,'E':4,'F':5,'F#':6,'G':7,'Ab':8,'A':9,'Bb':10,'B':11};

function startEngine(){
  if (isRunning) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  audioContext = audioContext || new AC();

  master = audioContext.createGain();
  master.gain.value = parseFloat(ctl.vol.value)*0.6;
  master.connect(audioContext.destination);

  // simple echo network
  delay = audioContext.createDelay(0.6);
  delay.delayTime.value = 0.25;
  const fb = audioContext.createGain(); fb.gain.value = parseFloat(ctl.space.value)*0.6;
  delay.connect(fb).connect(delay);
  delay.connect(master);

  // analyser on master
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  const preGain = audioContext.createGain(); preGain.gain.value = 1.0;
  preGain.connect(analyser); analyser.connect(master);

  // route: each voice -> mixBus -> preGain -> analyser -> master
  mixBus = preGain;

  nextNoteTime = audioContext.currentTime + 0.05;
  currentStep = 0;
  isRunning = true;
  scheduleId = setInterval(scheduler, lookahead*1000);
}

function stopEngine(){
  if (!isRunning) return;
  clearInterval(scheduleId); scheduleId = null;
  try{ audioContext.close(); }catch(e){}
  audioContext = null; master=null; analyser=null; delay=null;
  isRunning = false;
}

ci('startEngine').addEventListener('click', startEngine);
ci('stopEngine').addEventListener('click', stopEngine);

let mixBus = null;

// Voices
function triggerKick(t){
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const pitchEnv = audioContext.createGain(); // not used directly but for clarity
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(50, t+0.08);
  gain.gain.setValueAtTime(0.9, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t+0.12);
  osc.connect(gain).connect(mixBus);
  gain.connect(delay);
  osc.start(t);
  osc.stop(t+0.2);
}

function triggerHat(t){
  const bufferSize = 2 * (audioContext?.sampleRate || 44100);
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i=0;i<bufferSize;i++) data[i] = Math.random()*2-1;
  const src = audioContext.createBufferSource();
  src.buffer = noiseBuffer;
  const hp = audioContext.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=6000;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t+0.05);
  src.connect(hp).connect(gain).connect(mixBus);
  src.start(t);
  src.stop(t+0.1);
}

function triggerSnare(t){
  const bufferSize = 2 * (audioContext?.sampleRate || 44100);
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i=0;i<bufferSize;i++) data[i] = Math.random()*2-1;
  const src = audioContext.createBufferSource();
  src.buffer = noiseBuffer;
  const bp = audioContext.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1800; bp.Q.value=0.7;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.45, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t+0.12);
  src.connect(bp).connect(gain).connect(mixBus);
  src.start(t);
  src.stop(t+0.15);
}

function triggerNote(t, midi, dur=0.25){
  const f = 440 * Math.pow(2, (midi-69)/12);
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const lp = audioContext.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value= 1200;
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(f, t);
  gain.gain.setValueAtTime(0.0, t);
  gain.gain.linearRampToValueAtTime(0.22, t+0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t+dur);
  osc.connect(lp).connect(gain).connect(mixBus);
  gain.connect(delay);
  osc.start(t);
  osc.stop(t+dur+0.05);
}

function scheduler(){
  if (!audioContext) return;
  const spb = 60 / parseFloat(ctl.bpm.value); // seconds per beat
  const stepDur = spb / 4; // 16th notes

  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime){
    scheduleStep(currentStep, nextNoteTime);
    nextNoteTime += stepDur;
    currentStep = (currentStep + 1) % 16;
  }
}

function scheduleStep(step, t){
  const drumDens = parseFloat(ctl.drums.value);
  if (Math.random() < drumDens * (step%4===0?1.2:0.6)) triggerKick(t);
  if (Math.random() < drumDens * 0.6) triggerHat(t);
  if (step%4===2 && Math.random() < drumDens*0.8) triggerSnare(t);

  const melDens = parseFloat(ctl.melody.value);
  if (Math.random() < melDens){
    const midi = randomScaleMidi();
    triggerNote(t, midi, 0.22 + Math.random()*0.2);
  }

  // adjust echo feedback live
  if (delay){
    const fb = delay?.gainNode || null; // not accessible; we connected feedback internally
    // We'll adjust delay line by recreating feedback value through a stored reference
  }
}

// scale helpers
function randomScaleMidi(){
  const key = ctl.key.value;
  const base = 48 + keyIndex[key]; // around C3
  const sc = scales[ctl.scale.value];
  const deg = sc[Math.floor(Math.random()*sc.length)];
  const octave = [0,12,24][Math.floor(Math.random()*3)];
  return base + deg + octave;
}

// volume/space live updates
['ctlVol','ctlSpace'].forEach(id=>{
  document.getElementById(id).addEventListener('input', ()=>{
    if (!audioContext || !master) return;
    if (id==='ctlVol') master.gain.value = parseFloat(ctl.vol.value)*0.6;
    if (id==='ctlSpace' && delay){
      // find feedback gain by traversing delay connections? Simplify: not easily accessible; skip live edit for now
    }
  });
});

// ---------- Animation / Audio Analysis ----------
let last = performance.now();

function getBandAmps(){
  // prefer mic if enabled, else engine analyser
  const ana = micAnalyser || analyser;
  if (!ana){
    return {bass:0, mid:0, high:0};
  }
  const N = ana.frequencyBinCount;
  const arr = new Uint8Array(N);
  ana.getByteFrequencyData(arr);
  // convert freq bin indices: binFreq = i * sampleRate/(2*N)
  const sr = (audioContext?.sampleRate) || 44100;
  function band(lo,hi){
    const i0 = Math.floor(lo / (sr/(2*N)));
    const i1 = Math.min(N-1, Math.ceil(hi / (sr/(2*N))));
    let sum=0, c=0;
    for (let i=i0;i<=i1;i++){ sum+=arr[i]; c++; }
    return c? sum/(c*255) : 0;
  }
  return {
    bass: band(20,150),
    mid: band(150,1000),
    high: band(1000,5000),
  };
}

function tick(t){
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, (t-last)/1000);
  last = t;

  enforceDensity();

  const amps = getBandAmps();
  const bass = amps.bass;
  const mid = amps.mid;
  const high = amps.high;

  const mScale = parseFloat(ctl.mapBassScale.value);
  const mStroke = parseFloat(ctl.mapMidStroke.value);
  const mColor = parseFloat(ctl.mapHighColor.value);
  const displace = parseFloat(ctl.mapDisplace.value);
  const smooth = parseFloat(ctl.smooth.value);
  const paletteName = ctl.palette.value;

  for (const it of glyphs){
    // base gentle drift
    it.x += it.vx * 0.5;
    it.y += it.vy * 0.5;
    if (it.x < 10 || it.x > 1590) it.vx *= -1;
    if (it.y < 10 || it.y > 890) it.vy *= -1;

    // audio-driven scale pulse with bass
    const sPulse = 1 + bass * mScale;
    const sx = it.sx * sPulse;
    const sy = it.sy * sPulse;
    it.el.setAttribute('transform', `translate(${it.x} ${it.y}) rotate(${it.r}) scale(${sx} ${sy})`);

    // stroke from mids
    const sw = 0.6 + mid * mStroke * 3.0;
    it.use.setAttribute('stroke-width', sw.toFixed(2));

    // color from highs (phase + jitter)
    it.huePhase = (it.huePhase + dt*(0.01 + high*0.2)) % 1;
    const jitter = (Math.random()*2-1) * mColor * 0.05;
    const tcol = Math.min(1, Math.max(0, it.huePhase + jitter));
    const col = paletteColor(paletteName, tcol);
    it.use.setAttribute('stroke', col);

    // filters
    const turb = it.filter.querySelector('feTurbulence');
    const disp = it.filter.querySelector('feDisplacementMap');
    turb.setAttribute('baseFrequency', smooth);
    disp.setAttribute('scale', (displace * (0.3 + high*0.7)).toFixed(2));
  }
}
requestAnimationFrame(tick);

// ---------- Samples ----------
const SAMPLE_SVGS = [
`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 90 L50 10 L90 90 Z"/></svg>`,
`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="40"/></svg>`,
`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="20" width="80" height="80" rx="10" ry="10"/></svg>`,
`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M10,60 Q60,10 110,60 Q60,110 10,60 Z"/></svg>`,
`<svg viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg"><polyline points="10,110 40,20 70,110 100,20 130,110" fill="none"/></svg>`
];
