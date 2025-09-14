// HARIL AV Lab
const stage = document.getElementById('stage');
const defs = document.getElementById('defs');
const palette = document.getElementById('palette');

// Controls
const ci = (id)=>document.getElementById(id);
const ctl = {
  speed: ci('ctlSpeed'),
  stroke: ci('ctlStroke'),
  smooth: ci('ctlSmooth'),
  chaos: ci('ctlChaos'),
  density: ci('ctlDensity'),
  gen: ci('ctlGen'),
  audio: ci('ctlAudio'),
  timbre: ci('ctlTimbre'),
};
const val = {
  speed: ci('valSpeed'),
  stroke: ci('valStroke'),
  smooth: ci('valSmooth'),
  chaos: ci('valChaos'),
  density: ci('valDensity'),
  gen: ci('valGen'),
  audio: ci('valAudio'),
  timbre: ci('valTimbre'),
};

Object.keys(ctl).forEach(k=>{
  ctl[k].addEventListener('input',()=>{ val[k].textContent = ctl[k].value; });
});

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
    alert('Mic enabled: visuals will pulse with your voice/room audio.');
  }catch(err){
    alert('Mic enable failed: ' + err.message);
  }
});

// ---------- SVG registry ----------
let templates = []; // {id, viewBox, content}
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
  // Clean fills to allow stroke-only rendering by default
  svg.querySelectorAll('[fill]').forEach(el=>{
    const f = el.getAttribute('fill');
    if (!f || f.toLowerCase()!=='none'){ el.setAttribute('fill','none'); }
  });
  // Create a symbol in defs
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
      sx: 0.5 + Math.random()*1.2,
      sy: 0.5 + Math.random()*1.2,
      vx: (Math.random()*2-1),
      vy: (Math.random()*2-1),
      vr: (Math.random()*2-1)*10,
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
  masterGain.gain.value = 0.2;
  masterGain.connect(audioContext.destination);

  // Main oscillator
  mainOsc = audioContext.createOscillator();
  mainOsc.type = 'sawtooth';
  mainOsc.frequency.value = 110; // A2 base
  const oscGain = audioContext.createGain();
  oscGain.gain.value = 0.3;
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

  // LFO to modulate frequency
  lfo = audioContext.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.5;
  lfoGain = audioContext.createGain();
  lfoGain.gain.value = 20; // depth
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
  const dt = Math.min(0.05, (t-last)/1000); // seconds, clamp for stability
  last = t;

  enforceDensity();
  autoSpawn(t);

  // audio-reactive amplitude from mic
  let micAmp = 0;
  if (micAnalyser){
    const arr = new Uint8Array(micAnalyser.frequencyBinCount);
    micAnalyser.getByteFrequencyData(arr);
    let sum = 0; for (let i=0;i<arr.length;i++) sum += arr[i];
    micAmp = sum / (arr.length*255); // 0..1
  }

  const spd = parseFloat(ctl.speed.value);
  const chaos = parseFloat(ctl.chaos.value);
  const stroke = parseFloat(ctl.stroke.value);
  const smooth = parseFloat(ctl.smooth.value);
  const gen = parseFloat(ctl.gen.value);

  // Update audio params if running
  if (audioContext && mainOsc){
    const baseFreq = 80 + spd*40;
    const jitter = chaos * 60;
    mainOsc.frequency.value = baseFreq + (Math.sin(t*0.001)+Math.random()*2-1)*jitter;
    lfo.frequency.value = 0.2 + (1.5*parseFloat(ctl.timbre.value));
    lfoGain.gain.value = 5 + 50*parseFloat(ctl.timbre.value);
    masterGain.gain.value = 0.05 + 0.4*parseFloat(ctl.audio.value);
    if (noiseGain) noiseGain.gain.value = 0.0 + chaos*0.25;
  }

  // Update each glyph
  for (const it of glyphs){
    // velocity jitter
    it.vx += (Math.random()*2-1)*chaos*0.2;
    it.vy += (Math.random()*2-1)*chaos*0.2;
    const ampBoost = 1 + micAmp*1.5; // pulse with mic
    it.x += it.vx * spd * ampBoost;
    it.y += it.vy * spd * ampBoost;
    it.r += it.vr * dt * 30;

    // bounds bounce
    if (it.x < 20 || it.x > 1580) it.vx *= -1;
    if (it.y < 20 || it.y > 880) it.vy *= -1;

    // transform
    it.el.setAttribute('transform', `translate(${it.x} ${it.y}) rotate(${it.r}) scale(${it.sx} ${it.sy})`);

    // stroke + filter
    it.use.setAttribute('stroke-width', stroke);
    // Update filter params
    const turb = it.filter.querySelector('feTurbulence');
    const disp = it.filter.querySelector('feDisplacementMap');
    turb.setAttribute('baseFrequency', smooth);
    disp.setAttribute('scale', (chaos*120).toFixed(2));
    it.age += dt;
  }
}
requestAnimationFrame(tick);

// ---------- Sample inline SVGs ----------
const SAMPLE_SVGS = [
`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 90 L50 10 L90 90 Z"/>
</svg>`,
`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="40"/>
</svg>`,
`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="80" height="80" rx="10" ry="10"/>
</svg>`,
`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <path d="M10,60 Q60,10 110,60 Q60,110 10,60 Z"/>
</svg>`,
`<svg viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg">
  <polyline points="10,110 40,20 70,110 100,20 130,110" fill="none"/>
</svg>`
];
