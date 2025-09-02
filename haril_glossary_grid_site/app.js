/* Palette + Background adapted from the Spiral Superposition piece; grid/detail router. */

const PALETTES = [
  ["hsl(240 28% 6%)","hsl(35 12% 95%)","hsl(265 85% 72%)","hsl(200 90% 70%)","hsl(240 8% 50%)","hsl(265 90% 65% / 0.25)"],
  ["hsl(210 25% 6%)","hsl(20 14% 94%)","hsl(195 85% 70%)","hsl(160 80% 72%)","hsl(210 8% 52%)","hsl(195 90% 65% / 0.25)"],
  ["hsl(260 28% 6%)","hsl(40 12% 96%)","hsl(300 80% 72%)","hsl(260 90% 70%)","hsl(260 8% 52%)","hsl(300 90% 65% / 0.25)"],
  ["hsl(230 28% 6%)","hsl(45 12% 95%)","hsl(45 90% 68%)","hsl(15 80% 70%)","hsl(230 8% 52%)","hsl(45 90% 55% / 0.25)"]
];
let paletteIndex = 0;
function applyPalette(i){
  const [bg, fg, a1, a2, mut, ring] = PALETTES[i % PALETTES.length];
  const root = document.documentElement.style;
  root.setProperty('--bg', bg);
  root.setProperty('--fg', fg);
  root.setProperty('--accent', a1);
  root.setProperty('--accent2', a2);
  root.setProperty('--muted', mut);
  root.setProperty('--ring', ring);
  document.body.style.background = `radial-gradient(1200px 1200px at 20% 15%, ${a1.replace('/ 0.25','/ .45')}, transparent 60%),
                                    radial-gradient(1400px 1400px at 80% 85%, ${a2.replace('/ 0.25','/ .35')}, transparent 60%),
                                    radial-gradient(900px 900px at 60% 25%, ${mut.replace('% 50%)','% 20% / .25)')}, transparent 60%),
                                    ${bg}`;
}
applyPalette(paletteIndex);

const sky = document.getElementById('sky');
const sctx = sky.getContext('2d');
let SW=0, SH=0, SDPR = Math.min(devicePixelRatio||1, 2);
function fitSky(){
  SW = sky.width = Math.floor(innerWidth * SDPR);
  SH = sky.height = Math.floor(innerHeight * SDPR);
  sky.style.width = innerWidth + 'px';
  sky.style.height = innerHeight + 'px';
  drawStars();
}
const STARS = [];
function seedStars(){
  STARS.length = 0;
  const count = Math.floor((innerWidth*innerHeight) / 9000);
  for(let i=0;i<count;i++){
    STARS.push({ x: Math.random()*SW, y: Math.random()*SH, r: Math.random()*1.2 + 0.2, a: Math.random()*Math.PI*2, tw: Math.random()*0.8 + 0.2 });
  }
}
function drawStars(){
  sctx.clearRect(0,0,SW,SH);
  sctx.fillStyle = 'white';
  for(const s of STARS){
    const twinkle = 0.85 + 0.15*Math.sin(s.a += s.tw*0.03);
    sctx.globalAlpha = 0.5 + 0.5*twinkle;
    sctx.beginPath();
    sctx.arc(s.x, s.y, s.r*SDPR, 0, Math.PI*2);
    sctx.fill();
  }
  sctx.globalAlpha = 1;
}
fitSky(); seedStars(); drawStars();
addEventListener('resize', ()=>{ fitSky(); seedStars(); drawStars(); });

const cvs = document.getElementById('spiral');
const ctx = cvs.getContext('2d');
let W=0, H=0, DPR = Math.min(devicePixelRatio || 1, 2);
let CX=0, CY=0;
function fit(){
  W = cvs.width = Math.floor(innerWidth * DPR);
  H = cvs.height = Math.floor(innerHeight * DPR);
  cvs.style.width = innerWidth + 'px';
  cvs.style.height = innerHeight + 'px';
  CX = W/2; CY = H/2;
}
fit(); addEventListener('resize', fit);

let paused = false;
let reverse = 1;
let mouse = {x:0, y:0};
addEventListener('mousemove', e=>{
  mouse.x = (e.clientX / innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / innerHeight - 0.5) * 2;
}, {passive:true});

const pauseBtn = document.getElementById('pauseBtn');
const paletteBtn = document.getElementById('paletteBtn');
function togglePause(){ paused = !paused; if(pauseBtn) pauseBtn.textContent = paused ? 'Play' : 'Pause'; if(!paused) requestAnimationFrame(draw); }
function cyclePalette(){ paletteIndex = (paletteIndex+1) % PALETTES.length; applyPalette(paletteIndex); drawStars(); }
pauseBtn.addEventListener('click', togglePause);
paletteBtn.addEventListener('click', cyclePalette);
addEventListener('keydown', (e)=>{ if(e.key === ' '){ e.preventDefault(); togglePause(); } if(e.key.toLowerCase() === 'c'){ cyclePalette(); } });

let a = 2, b = 0.15, thetaStep = 0.18; const MAX_POINTS = 800;
function draw(now){
  if(paused) return;
  drawStars();
  ctx.clearRect(0,0,W,H);
  const wobbleR = 30 * DPR;
  const cX = CX + wobbleR * mouse.x;
  const cY = CY + wobbleR * mouse.y;
  ctx.lineWidth = Math.max(1, DPR*0.7);
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ring');
  ctx.beginPath();
  let theta = 0; let first = true; const spin = reverse * now * 0.00012;
  while(theta < 26){
    const rad = a * Math.exp(b * theta) * 3.5 * DPR;
    const x = cX + Math.cos(theta + spin) * rad;
    const y = cY + Math.sin(theta + spin) * rad;
    if(first){ ctx.moveTo(x,y); first = false; } else { ctx.lineTo(x,y); }
    theta += 0.08;
  }
  ctx.stroke();
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent');
  const accent2 = getComputedStyle(document.documentElement).getPropertyValue('--accent2');
  theta = 0; let i = 0;
  while(i < MAX_POINTS){
    const rad = a * Math.exp(b * theta) * 3.5 * DPR;
    const x = cX + Math.cos(theta + spin) * rad;
    const y = cY + Math.sin(theta + spin) * rad;
    if(!(x < -50 || x > W+50 || y < -50 || y > H+50)){
      ctx.beginPath();
      ctx.fillStyle = (i % 2) ? accent : accent2;
      const size = 0.5 + 1.2 * Math.pow(i/MAX_POINTS, 0.45);
      ctx.globalAlpha = 0.4 + 0.4*Math.sin(now*0.003 + i);
      ctx.arc(x, y, size*DPR, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    theta += thetaStep; i++;
  }
  requestAnimationFrame(draw);
}
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!prefersReduced){ requestAnimationFrame(draw); }

/* -------- Grid + Router -------- */
const gridEl = document.getElementById('cardGrid');
const gridView = document.getElementById('gridView');
const detailView = document.getElementById('detailView');
const termContent = document.getElementById('termContent');
const backBtn = document.getElementById('backBtn');
const openInNew = document.getElementById('openInNew');

let TERMS = [];
fetch('terms.json', { cache: 'no-store' })
  .then(r => r.json())
  .then(data => { TERMS = data; renderGrid(); route(location.hash); });

function renderGrid(){
  gridEl.innerHTML = '';
  TERMS.forEach(term => {
    const card = document.createElement('article');
    card.className = 'card';
    card.role = 'listitem';
    card.tabIndex = 0;
    card.dataset.slug = term.slug;
    card.innerHTML = `<h2 class="card-title">${term.title}</h2><p class="card-sub">${term.subtitle || ''}</p>`;
    card.addEventListener('click', ()=> navigateTo(term.slug));
    card.addEventListener('keypress', (e)=>{ if(e.key==='Enter') navigateTo(term.slug); });
    gridEl.appendChild(card);
  });
}

function navigateTo(slug){ location.hash = `#/term/${slug}`; }
function showGrid(){ detailView.hidden = true; gridView.hidden = false; termContent.innerHTML = ''; }
function showDetail(slug){
  gridView.hidden = true;
  detailView.hidden = false;
  termContent.innerHTML = `<p style="opacity:.7">Loading…</p>`;
  fetch(`terms/${slug}.html`, { cache: 'no-store' })
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(html => { termContent.innerHTML = html; })
    .catch(()=>{ termContent.innerHTML = `<h2>${slug}</h2><p>Content not found. Create <code>terms/${slug}.html</code>.</p>`; });
  openInNew.onclick = () => window.open(`terms/${slug}.html`, '_blank');
}
function route(hash){
  const m = hash.match(/^#\/term\/([\w\-]+)/);
  if(m){ showDetail(m[1]); } else { showGrid(); }
}
addEventListener('hashchange', ()=> route(location.hash));

backBtn.addEventListener('click', ()=> history.back());
addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && !gridView.hidden) return;
  if(e.key === 'Escape'){ showGrid(); history.pushState('', document.title, location.pathname + location.search); }
});
