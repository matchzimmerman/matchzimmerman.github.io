/* THEMES ADD-ON (cluster tags): recursive, telemetry, agency, identity */
let TERMS = [];
let CURRENT_THEME = null;

const gridEl = document.getElementById('cardGrid');
const detailView = document.getElementById('detailView');
const termContent = document.getElementById('termContent');

function fetchTerms(){ return fetch('terms.json', { cache: 'no-store' }).then(r => r.json()); }

function renderGrid(filterTag=null){
  gridEl.innerHTML = '';
  const list = filterTag ? TERMS.filter(t => (t.tags||[]).includes(filterTag)) : TERMS;
  list.forEach(term => {
    const card = document.createElement('article');
    card.className = 'card'; card.role = 'listitem'; card.tabIndex = 0; card.dataset.slug = term.slug;
    const tags = (term.tags||[]).map(t => `<a class="tag" href="#/theme/${encodeURIComponent(t)}">${t}</a>`).join('');
    card.innerHTML = `<h2 class="card-title">${term.title}</h2>
      <p class="card-sub">${term.subtitle || ''}</p>
      <div class="taglist">${tags}</div>`;
    card.addEventListener('click', (e)=>{
      if((e.target).classList && (e.target).classList.contains('tag')) return; // don't open term if tag clicked
      navigateTo(term.slug);
    });
    card.addEventListener('keypress', (e)=>{ if(e.key==='Enter') navigateTo(term.slug); });
    gridEl.appendChild(card);
  });
}

function navigateTo(slug){ location.hash = `#/term/${slug}`; }
function showGrid(){ detailView.hidden = true; document.body.classList.remove('has-detail'); }
function showDetail(slug){
  detailView.hidden = false;
  document.body.classList.add('has-detail');
  termContent.innerHTML = `<p style="opacity:.7">Loading…</p>`;
  fetch(`terms/${slug}.html`, { cache: 'no-store' }).then(r => r.ok ? r.text() : Promise.reject())
    .then(html => {
      const term = TERMS.find(t => t.slug===slug) || {tags:[]};
      const tagPills = (term.tags||[]).map(t => `<a class="tag" href="#/theme/${encodeURIComponent(t)}">${t}</a>`).join('');
      const tagsBlock = term.tags?.length ? `<div class="taglist" style="margin-top:10px">${tagPills}</div>` : '';
      termContent.innerHTML = html + tagsBlock;
    })
    .catch(()=>{ termContent.innerHTML = `<h2>${slug}</h2><p>Content not found. Create <code>terms/${slug}.html</code>.</p>`; });
}

function renderThemeBar(tag){
  const id='themeBar'; let bar = document.getElementById(id);
  if(!tag){ if(bar) bar.remove(); return; }
  if(!bar){ bar = document.createElement('div'); bar.id=id; bar.className='theme-bar'; document.querySelector('#app')?.prepend(bar); }
  bar.innerHTML = `<div class="theme-chip">Theme: ${tag} <span class="x" title="Clear" onclick="location.hash='#/'">×</span></div>`;
}

function renderThemesIndex(){
  const CLUSTERS = ['recursive','telemetry','agency','identity'];
  gridEl.innerHTML = '';
  const wrap = document.createElement('div'); wrap.style.maxWidth='900px'; wrap.style.width='100%'; wrap.style.padding='16px';
  const h = document.createElement('h2'); h.textContent = 'Themes'; h.style.textAlign='center'; wrap.appendChild(h);
  const list = document.createElement('div'); list.className='taglist'; list.style.justifyContent='center';
  const counts = Object.fromEntries(CLUSTERS.map(c => [c, 0]));
  TERMS.forEach(t => (t.tags||[]).forEach(tag => { if(counts[tag]!==undefined) counts[tag]++; }));
  CLUSTERS.forEach(tag => {
    const a = document.createElement('a'); a.className='tag'; a.href = `#/theme/${encodeURIComponent(tag)}`;
    a.textContent = `${tag} (${counts[tag]||0})`; list.appendChild(a);
  });
  wrap.appendChild(list);
  gridEl.appendChild(wrap);
}

function route(hash){
  const themeMatch = hash.match(/^#\/theme\/([^\/]+)/);
  const termMatch = hash.match(/^#\/term\/([\w\-]+)/);
  if(themeMatch){
    CURRENT_THEME = decodeURIComponent(themeMatch[1]);
    renderThemeBar(CURRENT_THEME);
    showGrid(); renderGrid(CURRENT_THEME); return;
  }
  CURRENT_THEME = null; renderThemeBar(null);
  if(termMatch){ showDetail(termMatch[1]); return; }
  if(hash === '#/themes'){ showGrid(); renderThemesIndex(); return; }
  showGrid(); renderGrid(null);
}

fetchTerms().then(data => { TERMS = data; route(location.hash || '#/'); });
addEventListener('hashchange', ()=> route(location.hash));
