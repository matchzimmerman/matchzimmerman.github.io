// === Color palettes ===
const PALETTES = [
  ["hsl(240 28% 6%)","hsl(35 12% 95%)","hsl(265 85% 72%)","hsl(200 90% 70%)","hsl(240 8% 50%)","hsl(265 90% 65% / 0.25)"],
  ["hsl(210 25% 6%)","hsl(20 14% 94%)","hsl(195 85% 70%)","hsl(160 80% 72%)","hsl(210 8% 52%)","hsl(195 90% 65% / 0.25)"],
  ["hsl(260 28% 6%)","hsl(40 12% 96%)","hsl(300 80% 72%)","hsl(260 90% 70%)","hsl(260 8% 52%)","hsl(300 90% 65% / 0.25)"],
  ["hsl(230 28% 6%)","hsl(45 12% 95%)","hsl(45 90% 68%)","hsl(15 80% 70%)","hsl(230 8% 52%)","hsl(45 90% 55% / 0.25)"]
];
let paletteIndex = 0;
function applyPalette(i){
  const [bg, fg, a1, a2, mut, ring] = PALETTES[i%PALETTES.length];
  const r = document.documentElement.style;
  r.setProperty('--bg', bg); r.setProperty('--fg', fg);
  r.setProperty('--accent', a1); r.setProperty('--accent2', a2);
  r.setProperty('--muted', mut); r.setProperty('--ring', ring);
}
applyPalette(paletteIndex);
document.getElementById('paletteBtn').addEventListener('click',()=>{
  paletteIndex = (paletteIndex + 1) % PALETTES.length; applyPalette(paletteIndex);
});
addEventListener('keydown', e=>{ if(e.key.toLowerCase()==='c') document.getElementById('paletteBtn').click(); });

// === Starfield ===
const sky = document.getElementById('sky'); const sctx = sky.getContext('2d');
let SW=0, SH=0, SDPR=Math.min(devicePixelRatio||1,2);
function fitSky(){ SW=sky.width=Math.floor(innerWidth*SDPR); SH=sky.height=Math.floor(innerHeight*SDPR);
  sky.style.width=innerWidth+'px'; sky.style.height=innerHeight+'px'; }
const STARS=[];
function seedStars(){ STARS.length=0; const count = Math.floor((innerWidth*innerHeight)/9000);
  for(let i=0;i<count;i++){ STARS.push({x:Math.random()*SW,y:Math.random()*SH,r:Math.random()*1.2+.2,a:Math.random()*Math.PI*2,tw:Math.random()*0.8+0.2}); } }
function drawStars(){ sctx.clearRect(0,0,SW,SH); sctx.fillStyle='white';
  for(const s of STARS){ const tw=0.85+0.15*Math.sin(s.a+=s.tw*0.03); sctx.globalAlpha=0.5+0.5*tw;
    sctx.beginPath(); sctx.arc(s.x,s.y,s.r*SDPR,0,Math.PI*2); sctx.fill(); }
  sctx.globalAlpha=1; }
fitSky(); seedStars(); drawStars();
addEventListener('resize', ()=>{ fitSky(); seedStars(); drawStars(); });

// === Spiral glow ===
const cvs = document.getElementById('spiral'); const ctx = cvs.getContext('2d');
let W=0,H=0,DPR=Math.min(devicePixelRatio||1,2),CX=0,CY=0;
function fit(){ W=cvs.width=Math.floor(innerWidth*DPR); H=cvs.height=Math.floor(innerHeight*DPR);
  cvs.style.width=innerWidth+'px'; cvs.style.height=innerHeight+'px'; CX=W/2; CY=H/2; }
fit(); addEventListener('resize', fit);
let mouse={x:0,y:0}; addEventListener('mousemove',e=>{ mouse.x=(e.clientX/innerWidth-0.5)*2; mouse.y=(e.clientY/innerHeight-0.5)*2 }, {passive:true});
function draw(now){
  drawStars(); ctx.clearRect(0,0,W,H);
  const wobble=30*DPR, cX=CX+wobble*mouse.x, cY=CY+wobble*mouse.y;
  ctx.lineWidth=Math.max(1,DPR*0.7);
  ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--ring');
  ctx.beginPath(); let theta=0, first=true, spin=now*0.00012;
  while(theta<26){ const a=2,b=0.15,rad=a*Math.exp(b*theta)*3.5*DPR;
    const x=cX+Math.cos(theta+spin)*rad, y=cY+Math.sin(theta+spin)*rad;
    if(first){ ctx.moveTo(x,y); first=false; } else { ctx.lineTo(x,y); }
    theta+=0.08;
  } ctx.stroke();
  const a1=getComputedStyle(document.documentElement).getPropertyValue('--accent');
  const a2=getComputedStyle(document.documentElement).getPropertyValue('--accent2');
  theta=0; let i=0; const MAX=800;
  while(i<MAX){ const a=2,b=0.15,rad=a*Math.exp(b*theta)*3.5*DPR;
    const x=cX+Math.cos(theta+spin)*rad, y=cY+Math.sin(theta+spin)*rad;
    if(!(x<-50||x>W+50||y<-50||y>H+50)){ ctx.beginPath(); ctx.fillStyle=(i%2)?a1:a2;
      const size=0.5+1.2*Math.pow(i/MAX,0.45); ctx.globalAlpha=0.4+0.4*Math.sin(now*0.003+i);
      ctx.arc(x,y,size*DPR,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
    theta+=0.18; i++; }
  requestAnimationFrame(draw);
}
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){ requestAnimationFrame(draw); }

// === Sections & cards ===
const SECTION_INFO = {
  recursive: { title: 'Recursive / Process', desc: 'Looped methods that compress noise and converge on intent.' },
  telemetry: { title: 'Telemetry / Diagnostics', desc: 'Measures that make alignment visible and actionable.' },
  agency:    { title: 'Agency & Drift',        desc: 'Where systems act across time/tools — and where they slip.' },
  identity:  { title: 'Identity & Cognition',  desc: 'From surface style to reasoning identity and cognitive mirrors.' }
};
let TERMS=[];
const sectionsEl = document.getElementById('sections');
const detailView = document.getElementById('detailView');
const termContent = document.getElementById('termContent');
const closeBtn = document.getElementById('closeDetail');

function cardFor(term){
  const el=document.createElement('article'); el.className='card'; el.role='listitem'; el.tabIndex=0; el.dataset.slug=term.slug;
  el.innerHTML = `<h2 class="card-title">${term.title}</h2><p class="card-sub">${term.subtitle||''}</p>`;
  el.addEventListener('click', ()=> navigateTo(term.slug));
  el.addEventListener('keypress', e=>{ if(e.key==='Enter') navigateTo(term.slug); });
  return el;
}

function renderSections(){
  sectionsEl.innerHTML='';
  const buckets = { recursive:[], telemetry:[], agency:[], identity:[] };
  TERMS.forEach(t => { const tag=(t.tags&&t.tags[0])||'recursive'; if(buckets[tag]) buckets[tag].push(t); });
  Object.keys(buckets).forEach(tag=>{
    const list = buckets[tag]; if(!list.length) return;
    const sec = document.createElement('section'); sec.className='section'; sec.id=`sec-${tag}`;
    sec.innerHTML = `<h3>${SECTION_INFO[tag].title}</h3><p class="desc">${SECTION_INFO[tag].desc}</p>`;
    const grid = document.createElement('div'); grid.className='grid';
    list.forEach(t => grid.appendChild(cardFor(t)));
    sec.appendChild(grid); sectionsEl.appendChild(sec);
  });
}

function navigateTo(slug){ location.hash = `#/term/${slug}`; }
function showGrid(){ detailView.hidden=true; document.body.classList.remove('has-detail'); }
function showDetail(slug){
  detailView.hidden=false; document.body.classList.add('has-detail');
  termContent.innerHTML='<p style="opacity:.7">Loading…</p>';
  fetch(`terms/${slug}.html`, {cache:'no-store'}).then(r=>r.ok?r.text():Promise.reject()).then(html=>{
    termContent.innerHTML = html;
  }).catch(()=>{
    termContent.innerHTML = `<h2>${slug}</h2><p>Content not found. Create <code>terms/${slug}.html</code>.</p>`;
  });
}

// Close interactions
function closeDetail(){ history.back(); if(location.hash==='#/' || location.hash===''){ showGrid(); } }
closeBtn.addEventListener('click', closeDetail);
detailView.addEventListener('click', e=>{ if(e.target===detailView) closeDetail(); });
addEventListener('keydown', e=>{ if(e.key==='Escape') closeDetail(); });

// Router
function route(hash){
  const mTerm = hash.match(/^#\/term\/([\w\-]+)/);
  if(mTerm){ showDetail(mTerm[1]); return; }
  showGrid(); renderSections();
}
fetch('terms.json', {cache:'no-store'}).then(r=>r.json()).then(d=>{ TERMS=d; route(location.hash||'#/'); });
addEventListener('hashchange', ()=> route(location.hash));
