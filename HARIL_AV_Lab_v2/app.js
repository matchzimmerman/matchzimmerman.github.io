// HARIL AV Lab v2
const stage = document.getElementById('stage');
const defs = document.getElementById('defs');
const palette = document.getElementById('palette');

// Controls
const ci = (id)=>document.getElementById(id);
const ctl = {
  speed: ci('ctlSpeed'),
  chaosMotion: ci('ctlChaosMotion'),
  smooth: ci('ctlSmooth'),
  stroke: ci('ctlStroke'),
  chaosStroke: ci('ctlChaosStroke'),
  blend: ci('ctlBlend'),
  chaosColor: ci('ctlChaosColor'),
  density: ci('ctlDensity'),
  gen: ci('ctlGen'),
  audio: ci('ctlAudio'),
  timbre: ci('ctlTimbre'),
  palette: ci('paletteSelect'),
};
const val = {
  speed: ci('valSpeed'),
  smooth: ci('valSmooth'),
  stroke: ci('valStroke'),
  density: ci('valDensity'),
  gen: ci('valGen'),
  audio: ci('valAudio'),
  timbre: ci('valTimbre'),
  chaosMotion: ci('valChaosMotion'),
  chaosStroke: ci('valChaosStroke'),
  blend: ci('valBlend'),
  chaosColor: ci('valChaosColor'),
};
Object.keys(val).forEach(k=> ctl[k]?.addEventListener('input',()=>{ val[k].textContent = ctl[k].value; }));

// File uploads
ci('fileInput').addEventListener('change', async (e)=>{
  const files = [...e.target.files].filter(f=>f.name.endsWith('.svg'));
  const texts = await Promise.all(files.map(f=>f.text()));
  texts.forEach((t,i)=>registerSVG(t, files[i].name));
});

// Load samples
ci('loadSamples').addEventListener('click', ()=>{
  SAMPLE_SVGS.forEach((t,i)=>registerSVG(t, 'sample_'+i+'.svg'));
});
document.addEventListener('keydown',(e)=>{
  if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='l'){ e.preventDefault(); ci('loadSamples').click(); }
});

// Mic React
let micAnalyser = null;
ci('enableMic').addEventListener('click', async ()=>{
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    const ac = audioContext || new (window.AudioContext||window.webkitAudioContext)();
    const src = ac.createMediaStreamSource(stream);
    micAnalyser = ac.createAnalyser();
    micAnalyser.fftSize = 512;
    src.connect(micAnalyser);
    alert('Mic enabled.');
  }catch(err){
    alert('Mic enable failed: ' + err.message);
  }
});

// ---------- Color Palettes ----------
const PALETTES = {
  nightfall: [
    [220, 68, 14],  // deep blue
    [260, 50, 22],  // indigo
    [280, 35, 28],  // violet
    [210, 20, 18]   // slate
  ],
  embers: [
    [34, 70, 42],   // warm amber
    [18, 55, 36],   // rust
    [14, 45, 30],   // umber
    [40, 20, 18]    // soot
  ],
  glacier: [
    [190, 40, 36],  // teal
    [205, 28, 46],  // ice
    [220, 15, 62],  // pale steel
    [210, 6, 80]    // fog gray
  ],
  mono: [
    [0, 0, 92],
    [0, 0, 86],
    [0, 0, 78],
    [0, 0, 70]
  ],
};

function lerp(a,b,t){ return a + (b-a)*t; }
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

// ---------- SVG registry ----------
let templates = []; // {id, vb, name}
let glyphs = [];    // instances on stage

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
  // Paths stroke-only by default
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

    // unique distortion filter per glyph
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
      el: g,
      use: use,
      filter: filter,
      x: Math.random()*1600,
      y: Math.random()*900,
      r: Math.random()*360,
      sx: 0.6 + Math.random()*1.0,
      sy: 0.6 + Math.random()*1.0,
      vx: (Math.random()*2-1)*0.4, // gentler base velocity
      vy: (Math.random()*2-1)*0.4,
      vr: (Math.random()*2-1)*6,
      huePhase: Math.random(),
      age: 0
    };
    glyphs.push(inst);
  }
}

// Keep density
function enforceDensity(){
  const target = parseInt(ctl.density.value);
  if (glyphs.length < target) spawnInstances(target-glyphs.length);
  if (glyphs.length > target){
    const rm = glyphs.splice(0, glyphs.length-target);
    rm.forEach(it=>it.el.remove());
  }
}

// Generative spawns
let lastSpawn = performance.now();
function autoSpawn(t){
  const rate = parseFloat(ctl.gen.value); // items per second
  const elapsed = (t - lastSpawn)/1000;
  const want = elapsed*rate;
  if (want >= 1){
    const n = Math.floor(want);
    spawnInstances(n);
    lastSpawn = t;
  }
}

// ---------- Audio Engine ----------
let audioContext = null;
let masterGain = null;
let mainOsc = null;
let noiseSrc = null;
let noiseGain = null;
let lfo = null;
let lfoGain = null;

function startAudio(){
  if (audioContext) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  audioContext = new AC();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.15;
  masterGain.connect(audioContext.destination);

  // Main oscillator
  mainOsc = audioContext.createOscillator();
  mainOsc.type = 'sawtooth';
  mainOsc.frequency.value = 96; // lower base
  const oscGain = audioContext.createGain();
  oscGain.gain.value = 0.28;
  mainOsc.connect(oscGain).connect(masterGain);
  mainOsc.start();

  // Noise
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const out = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1;
  noiseSrc = audioContext.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  noiseSrc.loop = true;
  noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0.0;
  noiseSrc.connect(noiseGain).connect(masterGain);
  noiseSrc.start();

  // LFO
  lfo = audioContext.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.3;
  lfoGain = audioContext.createGain();
  lfoGain.gain.value = 16;
  lfo.connect(lfoGain).connect(mainOsc.frequency);
  lfo.start();
}

function stopAudio(){
  if (!audioContext) return;
  try { mainOsc.stop(); noiseSrc.stop(); lfo.stop(); } catch(e){}
  audioContext.close();
  audioContext = null;
  masterGain = null;
  mainOsc = null;
  noiseSrc = null;
  noiseGain = null;
  lfo = null;
  lfoGain = null;
}

ci('startAudio').addEventListener('click', startAudio);
ci('stopAudio').addEventListener('click', stopAudio);

// ---------- Animation Loop ----------
let last = performance.now();

function tick(t){
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, (t-last)/1000);
  last = t;

  enforceDensity();
  autoSpawn(t);

  // mic amplitude
  let micAmp = 0;
  if (micAnalyser){
    const arr = new Uint8Array(micAnalyser.frequencyBinCount);
    micAnalyser.getByteFrequencyData(arr);
    let sum = 0; for (let i=0;i<arr.length;i++) sum += arr[i];
    micAmp = sum / (arr.length*255);
  }

  const spd = parseFloat(ctl.speed.value);
  const chaosM = parseFloat(ctl.chaosMotion.value);
  const chaosS = parseFloat(ctl.chaosStroke.value);
  const chaosC = parseFloat(ctl.chaosColor.value);
  const stroke = parseFloat(ctl.stroke.value);
  const smooth = parseFloat(ctl.smooth.value);
  const blend = parseFloat(ctl.blend.value);
  const paletteName = ctl.palette.value;

  // audio params
  if (audioContext && mainOsc){
    const baseFreq = 72 + spd*32;
    const jitter = chaosM * 40;
    mainOsc.frequency.value = baseFreq + (Math.sin(t*0.001)+Math.random()*2-1)*jitter;
    lfo.frequency.value = 0.15 + (1.2*parseFloat(ctl.timbre.value));
    lfoGain.gain.value = 4 + 38*parseFloat(ctl.timbre.value);
    masterGain.gain.value = 0.04 + 0.35*parseFloat(ctl.audio.value);
    if (noiseGain) noiseGain.gain.value = chaosM*0.18;
  }

  // Update each glyph
  for (const it of glyphs){
    // velocity jitter (motion chaos)
    it.vx += (Math.random()*2-1)*chaosM*0.08;
    it.vy += (Math.random()*2-1)*chaosM*0.08;
    const ampBoost = 1 + micAmp*1.1;
    it.x += it.vx * spd * ampBoost;
    it.y += it.vy * spd * ampBoost;
    it.r += it.vr * dt * 18;

    // soft bounds
    if (it.x < 10 || it.x > 1590) it.vx *= -1;
    if (it.y < 10 || it.y > 890) it.vy *= -1;

    // transform
    it.el.setAttribute('transform', `translate(${it.x} ${it.y}) rotate(${it.r}) scale(${it.sx} ${it.sy})`);

    // stroke width + chaosS adds small per-frame drift
    const sw = Math.max(0, stroke + (Math.random()*2-1)*chaosS*0.6);
    it.use.setAttribute('stroke-width', sw.toFixed(2));

    // color blend over time + chaosC jitter
    it.huePhase = (it.huePhase + dt*(0.02 + blend*0.12)) % 1;
    const jitter = (Math.random()*2-1)*chaosC*0.03;
    const tcol = Math.min(1, Math.max(0, it.huePhase + jitter));
    const col = paletteColor(paletteName, tcol);
    it.use.setAttribute('stroke', col);

    // filters
    const turb = it.filter.querySelector('feTurbulence');
    const disp = it.filter.querySelector('feDisplacementMap');
    turb.setAttribute('baseFrequency', smooth);
    disp.setAttribute('scale', (chaosM*100).toFixed(2));

    it.age += dt;
  }
}
requestAnimationFrame(tick);

// ---------- Sample inline SVGs ----------
const SAMPLE_SVGS = [
`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 90 L50 10 L90 90 Z"/></svg>`,
`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="40"/></svg>`,
`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="20" width="80" height="80" rx="10" ry="10"/></svg>`,
`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M10,60 Q60,10 110,60 Q60,110 10,60 Z"/></svg>`,
`<svg viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg"><polyline points="10,110 40,20 70,110 100,20 130,110" fill="none"/></svg>`
];
