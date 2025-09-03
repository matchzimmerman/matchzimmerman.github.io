/* app.js v12 – robust JSON + layout tweaks */
/* Palettes */
const PALETTES=[
  ["hsl(240 28% 6%)","hsl(35 12% 95%)","hsl(265 85% 72%)","hsl(200 90% 70%)","hsl(240 8% 50%)","hsl(265 90% 65% / 0.25)"],
  ["hsl(200 30% 6%)","hsl(20 14% 94%)","hsl(178 80% 64%)","hsl(150 78% 66%)","hsl(200 8% 55%)","hsl(170 90% 60% / 0.25)"],
  ["hsl(325 35% 8%)","hsl(35 12% 95%)","hsl(320 88% 72%)","hsl(120 70% 65%)","hsl(325 10% 60%)","hsl(320 85% 70% / 0.25)"],
  ["hsl(280 28% 7%)","hsl(45 15% 94%)","hsl(285 80% 70%)","hsl(40 90% 66%)","hsl(280 10% 58%)","hsl(285 85% 65% / 0.25)"],
  ["hsl(230 30% 5%)","hsl(0 0% 98%)","hsl(312 85% 68%)","hsl(200 85% 70%)","hsl(230 10% 60%)","hsl(312 85% 60% / 0.25)"]
];
let paletteIndex=0;
function applyPalette(i){const[bg,fg,a1,a2,mut,ring]=PALETTES[i%PALETTES.length];const r=document.documentElement.style;r.setProperty('--bg',bg);r.setProperty('--fg',fg);r.setProperty('--accent',a1);r.setProperty('--accent2',a2);r.setProperty('--muted',mut);r.setProperty('--ring',ring);}applyPalette(paletteIndex);
document.getElementById('paletteBtn').addEventListener('click',()=>{paletteIndex=(paletteIndex+1)%PALETTES.length;applyPalette(paletteIndex);});addEventListener('keydown',e=>{if(e.key.toLowerCase()==='c')document.getElementById('paletteBtn').click();});

/* Starfield + Spiral */
const sky=document.getElementById('sky'), sctx=sky.getContext('2d'); let SW=0,SH=0,SDPR=Math.min(devicePixelRatio||1,2);
function fitSky(){SW=sky.width=Math.floor(innerWidth*SDPR);SH=sky.height=Math.floor(innerHeight*SDPR);sky.style.width=innerWidth+'px';sky.style.height=innerHeight+'px';}
const STARS=[];function seedStars(){STARS.length=0;const count=Math.floor((innerWidth*innerHeight)/9000);for(let i=0;i<count;i++){STARS.push({x:Math.random()*SW,y:Math.random()*SH,r:Math.random()*1.2+.2,a:Math.random()*Math.PI*2,tw:Math.random()*0.8+0.2});}}
function drawStars(){sctx.clearRect(0,0,SW,SH);sctx.fillStyle='white';for(const s of STARS){const tw=0.85+0.15*Math.sin(s.a+=s.tw*0.03);sctx.globalAlpha=0.5+0.5*tw;sctx.beginPath();sctx.arc(s.x,s.y,s.r*SDPR,0,Math.PI*2);sctx.fill();}sctx.globalAlpha=1;}
fitSky(); seedStars(); drawStars(); addEventListener('resize',()=>{fitSky(); seedStars(); drawStars();});
const spiral=document.getElementById('spiral'), ctx=spiral.getContext('2d'); let W=0,H=0,DPR=Math.min(devicePixelRatio||1,2), CX=0,CY=0;
function fit(){W=spiral.width=Math.floor(innerWidth*DPR);H=spiral.height=Math.floor(innerHeight*DPR);spiral.style.width=innerWidth+'px';spiral.style.height=innerHeight+'px';CX=W/2;CY=H/2;}
fit(); addEventListener('resize', fit);
let mouse={x:0,y:0}; addEventListener('mousemove', e=>{mouse.x=(e.clientX/innerWidth-0.5)*2;mouse.y=(e.clientY/innerHeight-0.5)*2}, {passive:true});
function draw(now){drawStars(); ctx.clearRect(0,0,W,H); const wobble=30*DPR, cX=CX+wobble*mouse.x, cY=CY+wobble*mouse.y; ctx.lineWidth=Math.max(1,DPR*0.7);
  ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--ring'); ctx.beginPath(); let theta=0, first=true, spin=now*0.00012;
  while(theta<26){const a=2,b=0.15,rad=a*Math.exp(b*theta)*3.5*DPR; const x=cX+Math.cos(theta+spin)*rad, y=cY+Math.sin(theta+spin)*rad; if(first){ctx.moveTo(x,y); first=false;} else {ctx.lineTo(x,y);} theta+=0.08;} ctx.stroke();
  const a1=getComputedStyle(document.documentElement).getPropertyValue('--accent'); const a2=getComputedStyle(document.documentElement).getPropertyValue('--accent2'); theta=0; let i=0; const MAX=800;
  while(i<MAX){const a=2,b=0.15,rad=a*Math.exp(b*theta)*3.5*DPR; const x=cX+Math.cos(theta+spin)*rad, y=cY+Math.sin(theta+spin)*rad;
    if(!(x<-50||x>W+50||y<-50||y>H+50)){ ctx.beginPath(); ctx.fillStyle=(i%2)?a1:a2; const size=0.5+1.2*Math.pow(i/MAX,0.45); ctx.globalAlpha=0.4+0.4*Math.sin(now*0.003+i); ctx.arc(x,y,size*DPR,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
    theta+=0.18; i++; } requestAnimationFrame(draw);
}
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){ requestAnimationFrame(draw); }

/* Data + Views */
const SECTION_INFO={recursive:{title:'Recursive / Process',desc:'Looped methods that compress noise and converge on intent.'},telemetry:{title:'Telemetry / Diagnostics',desc:'Measures that make alignment visible and actionable.'},agency:{title:'Agency & Drift',desc:'Where systems act across time/tools — and where they slip.'},identity:{title:'Identity & Cognition',desc:'From surface style to reasoning identity and cognitive mirrors.'}};
let TERMS=[];
const hubEl=document.getElementById('hub'), sectionsEl=document.getElementById('sections'), detailView=document.getElementById('detailView'), termContent=document.getElementById('termContent'), backBtn=document.getElementById('backBtn'), navRow=document.getElementById('navRow'), closeBtn=document.getElementById('closeDetail');

const k = s => (s||s===0) ? String(s) : '';
const first = (obj, keys) => { for (const key of keys){ if(obj && obj[key]!=null) return obj[key]; } return undefined; };
const asList = (arr, label) => Array.isArray(arr)&&arr.length ? `<h3>${label}</h3><ul>${arr.map(x=>`<li>${x}</li>`).join('')}</ul>` : '';
const asCites = (arr) => Array.isArray(arr)&&arr.length ? `<h3>References</h3><ul>${arr.map(x=>`<li>${x}</li>`).join('')}</ul>` : '';

function hubCard(id){const c=document.createElement('article');c.className='hcard cat-'+id;c.tabIndex=0;c.innerHTML=`<h2>${SECTION_INFO[id].title}</h2><p>${SECTION_INFO[id].desc}</p>`;c.onclick=()=>location.hash=`#/section/${id}`;c.onkeypress=e=>{if(e.key==='Enter')location.hash=`#/section/${id}`;};return c;}
function renderHub(){hubEl.hidden=false;sectionsEl.innerHTML='';navRow.hidden=true;hubEl.innerHTML='<div class="hgrid"></div>';const g=hubEl.querySelector('.hgrid');['recursive','telemetry','agency','identity'].forEach(id=>g.appendChild(hubCard(id)));}
function cardFor(t){const el=document.createElement('article');const cat=(t.tags||[])[0];el.className='card' + (cat?` cat-${cat}`:'');el.role='listitem';el.tabIndex=0;el.dataset.slug=t.slug;el.innerHTML=`<h2 class="card-title">${t.title}</h2><p class="card-sub">${t.subtitle||''}</p>`;el.onclick=()=>location.hash=`#/term/${t.slug}`;el.onkeypress=e=>{if(e.key==='Enter')location.hash=`#/term/${t.slug}`;};return el;}
function renderSection(tag){hubEl.hidden=true;sectionsEl.innerHTML='';navRow.hidden=false;const sec=document.createElement('section');sec.className='section';sec.id=`sec-${tag}`;sec.innerHTML=`<h3>${SECTION_INFO[tag].title}</h3><p class="desc">${SECTION_INFO[tag].desc}</p>`;const grid=document.createElement('div');grid.className='grid';TERMS.filter(t=>(t.tags||[])[0]===tag).forEach(t=>grid.appendChild(cardFor(t)));sec.appendChild(grid);sectionsEl.appendChild(sec);}

function normalizeContent(t){
  const cTop = t.content || {};
  // Allow both top-level and content-level fields
  const all = (key) => first(cTop, [key, key.toLowerCase(), key.replaceAll(' ','_')]) ?? first(t, [key, key.toLowerCase(), key.replaceAll(' ','_')]);
  const definition = all('definition');
  const looks = all('looks_like') ?? all('looksLike') ?? all('What it looks like') ?? all('looks');
  const overlaps = all('overlaps') ?? all('Overlaps');
  const importance = all('importance') ?? all('Importance');
  const citations = all('citations') ?? all('References') ?? all('refs');
  const body = all('body') ?? all('html') ?? all('HTML');
  return {definition, looks, overlaps, importance, citations, body};
}

function renderTermContent(t){
  const C = normalizeContent(t);
  const tags = (t.tags||[]).map(x=>{const k=String(x).toLowerCase(); const cat=['recursive','telemetry','agency','identity'].includes(k) ? ` tag-${k}` : ''; return `<span class=\"label${cat}\">${x}</span>`;}).join('');
  const addTitle = (html) => {
    const startsWithH = /<h[12][^>]*>/i.test(html.trim().slice(0,120));
    if (startsWithH) return html + `<div class="term-meta">${tags}</div>`;
    return `<h2>${t.title}</h2>${t.subtitle?`<p><em>${t.subtitle}</em></p>`:''}<hr class="term-rule">` + html + `<div class="term-meta">${tags}</div>`;
  };
  if (C.body) {
    return addTitle(String(C.body));
  }
  const looksHTML = Array.isArray(C.looks) ? asList(C.looks,'What it looks like') : (k(C.looks)? `<h3>What it looks like</h3><p>${k(C.looks)}</p>` : '');
  const overlapsHTML = Array.isArray(C.overlaps) ? asList(C.overlaps,'Overlaps') : (k(C.overlaps)? `<h3>Overlaps</h3><p>${k(C.overlaps)}</p>` : '');
  const citesHTML = Array.isArray(C.citations) ? asCites(C.citations) : (k(C.citations)? `<h3>References</h3><p>${k(C.citations)}</p>` : '');

  if (!C.definition && !looksHTML && !overlapsHTML && !C.importance) {
    return ''; // induce fallback to HTML file
  }
  const inner = `
    ${C.definition?`<h3>Description</h3><p>${k(C.definition)}</p>`:''}
    ${C.importance?`<h3>Importance</h3><p>${k(C.importance)}</p>`:''}
    ${looksHTML}
    ${overlapsHTML}
    ${citesHTML}
  `;
  return addTitle(inner);
}

function showDetail(slug){
  detailView.hidden=false; termContent.innerHTML='<p style="opacity:.7">Loading…</p>';
  const wrap=document.querySelector('.detail-wrap'); wrap.classList.remove('cat-recursive','cat-telemetry','cat-agency','cat-identity');
  const t = TERMS.find(x=>x.slug===slug);
  if (!t) { termContent.innerHTML = `<h2>${slug}</h2><p>Not found in terms.json.</p>`; return; }
  const html = renderTermContent(t);
  if (html) {
    termContent.innerHTML = html;
  } else {
    fetch(`terms/${slug}.html`,{cache:'no-store'})
      .then(r=>r.ok?r.text():Promise.reject())
      .then(h=> termContent.innerHTML = (/<h[12][^>]*>/i.test(h.trim().slice(0,120)) ? h : `<h2>${t.title}</h2>${t.subtitle?`<p><em>${t.subtitle}</em></p>`:''}<hr class="term-rule">` + h))
      .catch(()=> termContent.innerHTML = `<h2>${t.title}</h2><p>Content not found.</p>`);
  }
}

function hideDetail(){ detailView.hidden=true; }
backBtn.onclick = ()=> location.hash = '#/';
closeBtn.onclick = ()=> history.back();
detailView.addEventListener('click', e=>{ if(e.target===detailView) history.back(); });
addEventListener('keydown', e=>{ if(e.key==='Escape') history.back(); });

function route(){
  const h = location.hash;
  const mTerm = h.match(/^#\/term\/([\w\-]+)/);
  const mSec = h.match(/^#\/section\/(recursive|telemetry|agency|identity)$/);
  hideDetail();
  if(mTerm){ showDetail(mTerm[1]); return; }
  if(mSec){ renderSection(mSec[1]); return; }
  renderHub();
}

fetch('terms.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{ TERMS=d; route(); });
addEventListener('hashchange', route);
