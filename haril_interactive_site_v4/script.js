// HARIL Interactive — v4 with command palette + copy helpers
const state = { data:null, view:'stack', theme:'neutral', notes:{}, learnIdx:0 };

// Helpers
const qs=(s,el=document)=>el.querySelector(s);
const qsa=(s,el=document)=>[...el.querySelectorAll(s)];
const copy = async (txt)=>{ try{ await navigator.clipboard.writeText(txt); alert('Copied to clipboard'); }catch(e){ console.error(e); } };
function download(filename, content, type='text/plain'){ const a=document.createElement('a'); const blob=new Blob([content],{type}); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }

// Canvas bg
const canvas=qs('#bg'), ctx=canvas.getContext('2d'); let W,H,particles=[];
function resize(){ W=canvas.width=innerWidth; H=canvas.height=innerHeight; } addEventListener('resize',resize); resize();
function initParticles(n=90){ particles=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,r:0.6+Math.random()*2.1,vx:(Math.random()-.5)*0.18,vy:(Math.random()-.5)*0.18})); }
function animate(){ ctx.clearRect(0,0,W,H); for(const p of particles){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle='rgba(124,196,255,0.25)'; ctx.fill(); } requestAnimationFrame(animate); } initParticles(); animate();

// Data
async function loadData(){ const res=await fetch('data.json'); const json=await res.json(); state.data=json; renderAll(); }
loadData();

function renderAll(){ renderCards(); renderRelations(); renderTelemetry(); highlightView(); renderViz(); setupPages(); setupCommands(); }

// Cards
function renderCards(){
  const container=qs('#content'); container.innerHTML='';
  const tiers=state.data.HARIL_System.tiers.slice().sort((a,b)=>a.tier-b.tier);
  const gbase=state.data.HARIL_System.links?.glossary_base||'';
  tiers.forEach(t=>{
    const card=document.createElement('article'); card.className='card';
    const tags=(t.tags||[]).map(x=>`<span class="tag">${x}</span>`).join('');
    const gloss=(t.glossary_terms||[]).map(sl=>`<a target="_blank" rel="noopener" href="${gbase}${sl}">${sl.replace(/-/g,' ')}</a>`).join(' · ');
    const summary=`Tier ${t.tier}: ${t.name}\n${t.definition}`;
    card.innerHTML=`
      <div class="chip">Tier ${t.tier}</div>
      <h3>${t.name}</h3>
      <p><em>${t.short||''}</em></p>
      <p>${t.definition}</p>
      ${t.core_loop? `<details><summary>Core Loop</summary><ul class="list">${t.core_loop.map(x=>`<li>${x}</li>`).join('')}</ul></details>`:''}
      ${t.characteristics? `<details><summary>Characteristics</summary><ul class="list">${t.characteristics.map(x=>`<li>${x}</li>`).join('')}</ul></details>`:''}
      ${t.contains? `<details><summary>Contains</summary><ul class="list">${t.contains.map(x=>`<li>${x}</li>`).join('')}</ul></details>`:''}
      ${t.examples? `<details><summary>Examples</summary><ul class="list">${t.examples.map(x=>`<li>${x}</li>`).join('')}</ul></details>`:''}
      ${t.composition? `<details><summary>Composition</summary><ul class="list">${t.composition.map(x=>`<li>${x}</li>`).join('')}</ul></details>`:''}
      ${t.dependencies? `<details><summary>Dependencies</summary><ul class="list">${t.dependencies.map(x=>`<li>${x}</li>`).join('')}</ul></details>`:''}
      <div class="tagrow">${tags}</div>
      <div class="links">${gloss}</div>
      <div class="actions">
        <button class="copySummary">Copy Summary</button>
        <button class="copyJson">Copy JSON</button>
        <a class="copy" href="#/tier/${t.tier}">Open details</a>
      </div>
    `;
    container.appendChild(card);
    card.querySelector('.copySummary').addEventListener('click', ()=>copy(summary));
    card.querySelector('.copyJson').addEventListener('click', ()=>copy(JSON.stringify(t, null, 2)));
  });
}

// Relations
function renderRelations(){
  const list=qs('#relList'); list.innerHTML='';
  const rel=state.data.HARIL_System.relationships; rel.notes.forEach(n=>{ const li=document.createElement('li'); li.textContent=n; list.appendChild(li); });
  const gbase=state.data.HARIL_System.links?.glossary_base||'';
  qs('.rel-links .g.haril').href=gbase+(rel.glossary_map?.haril||'haril');
  qs('.rel-links .g.scp').href=gbase+(rel.glossary_map?.scp||'scp-synthetic-cognitive-profile');
  qs('.rel-links .g.scia').href=gbase+(rel.glossary_map?.scia||'scia-synthetic-cognitive-interaction-agent');
}

// Telemetry
function renderTelemetry(){
  const tel=state.data.HARIL_System.telemetry||{};
  qsa('.t-metric .fill').forEach(el=>{
    const key=el.getAttribute('data-key'); const val=Math.max(0, Math.min(1, tel[key]||0)); requestAnimationFrame(()=>el.style.width=(val*100).toFixed(0)+'%');
  });
}

// SVG Viz
const svg=qs('#vizSvg');
function clearSvg(){ while(svg.firstChild) svg.removeChild(svg.firstChild); }
function el(tag,attrs={}){ const e=document.createElementNS('http://www.w3.org/2000/svg',tag); for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
function highlightView(){ qsa('.controls button[data-view]').forEach(b=>b.classList.toggle('active', b.dataset.view===state.view)); }
function renderViz(){ clearSvg(); if(state.view==='stack') drawStack(); else if(state.view==='tree') drawTree(); else drawSpiral(); }

function drawStack(){
  const tiers=state.data.HARIL_System.tiers.slice().sort((a,b)=>a.tier-b.tier);
  const w=1000,h=540,margin=40; svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const baseY=h-margin, width=(w-2*margin)/tiers.length;
  tiers.forEach((t,i)=>{
    const height=70+i*32, x=margin+i*width+10, y=baseY-height;
    const r=el('rect',{x,y,width:width-20,height,rx:12,fill:'rgba(124,196,255,0.12)',stroke:'rgba(124,196,255,0.5)'});
    const lab=el('text',{x:x+(width-20)/2,y:y+height/2,'text-anchor':'middle','dominant-baseline':'middle',fill:'#e8f0ff','font-size':'15'}); lab.textContent=`${t.tier}: ${t.name}`;
    [r,lab].forEach(e=>{e.style.cursor='pointer'; e.addEventListener('click',()=>openTierModal(t.tier));});
    svg.appendChild(r); svg.appendChild(lab);
  });
}

function drawTree(){
  const tiers=state.data.HARIL_System.tiers.slice().sort((a,b)=>a.tier-b.tier);
  const w=1000,h=540,margin=50; svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const x=w/2, levelGap=(h-2*margin)/(tiers.length-1);
  tiers.forEach((t,i)=>{
    const cy=margin+i*levelGap; if(i>0){ const line=el('line',{x1:x,y1:margin+(i-1)*levelGap+26,x2:x,y2:cy-26,stroke:'rgba(255,255,255,0.35)','stroke-width':2}); svg.appendChild(line); }
    const node=el('circle',{cx:x,cy:cy,r:26,fill:'rgba(255,159,124,0.18)',stroke:'rgba(255,159,124,0.6)'});
    const num=el('text',{x:x,y:cy+4,'text-anchor':'middle',fill:'#e8f0ff','font-size':'13'}); num.textContent=t.tier;
    const lab=el('text',{x:x+40,y:cy+4,fill:'#e8f0ff','font-size':'16'}); lab.textContent=t.name;
    [node,num,lab].forEach(e=>{e.style.cursor='pointer'; e.addEventListener('click',()=>openTierModal(t.tier));});
    svg.appendChild(node); svg.appendChild(num); svg.appendChild(lab);
  });
}

function drawSpiral(){
  const tiers=state.data.HARIL_System.tiers.slice().sort((a,b)=>a.tier-b.tier);
  const w=1000,h=540; svg.setAttribute('viewBox',`0 0 ${w} ${h}`); const cx=w/2, cy=h/2;
  const turns=2.2, maxR=Math.min(w,h)/2-60, pts=[], total=360*turns;
  for(let a=0;a<=total;a+=2){ const r=(a/total)*maxR, rad=a*Math.PI/180; pts.push([cx+Math.cos(rad)*r, cy+Math.sin(rad)*r]); }
  const path=el('path',{d:'M '+pts.map(p=>p.join(',')).join(' L '), fill:'none', stroke:'rgba(124,196,255,0.35)','stroke-width':2}); svg.appendChild(path);
  tiers.forEach((t,i)=>{ const idx=Math.floor(pts.length*(i/(tiers.length-1))); const [x,y]=pts[idx];
    const node=el('circle',{cx:x,cy:y,r:22,fill:'rgba(124,196,255,0.18)',stroke:'rgba(124,196,255,0.6)'});
    const label=el('text',{x:x,y:y+5,'text-anchor':'middle',fill:'#e8f0ff','font-size':'12'}); label.textContent=t.tier;
    const name=el('text',{x:x+28,y:y-10,fill:'#e8f0ff','font-size':'15'}); name.textContent=t.name;
    ;[node,label,name].forEach(e=>{e.style.cursor='pointer'; e.addEventListener('click',()=>openTierModal(t.tier));});
    svg.appendChild(node); svg.appendChild(label); svg.appendChild(name);
  });
  const steps=(state.data.HARIL_System.tiers.find(t=>t.tier===1)?.core_loop)||["Inquire","Explore","Compress","Expand"];
  const ringR=78;
  steps.forEach((s,i)=>{ const ang=(i/steps.length)*Math.PI*2 - Math.PI/2; const x=cx+Math.cos(ang)*ringR, y=cy+Math.sin(ang)*ringR;
    const dot=el('circle',{cx:x,cy:y,r:18,fill:'rgba(255,159,124,0.18)',stroke:'rgba(255,159,124,0.7)'});
    const tx=el('text',{x:x,y:y+4,'text-anchor':'middle',fill:'#e8f0ff','font-size':'11'}); tx.textContent=s[0];
    dot.addEventListener('mouseenter',()=>{tx.textContent=s;}); dot.addEventListener('mouseleave',()=>{tx.textContent=s[0];});
    svg.appendChild(dot); svg.appendChild(tx);
  });
}

// Export
function exportSvg(){ const s=new XMLSerializer().serializeToString(svg); download('haril_viz.svg', s, 'image/svg+xml'); }
function exportPng(){
  const xml=new XMLSerializer().serializeToString(svg);
  const img=new Image(); img.onload=()=>{ const c=document.createElement('canvas'); c.width=svg.viewBox.baseVal.width; c.height=svg.viewBox.baseVal.height; const cx=c.getContext('2d'); cx.fillStyle='black'; cx.fillRect(0,0,c.width,c.height); cx.drawImage(img,0,0); c.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='haril_viz.png'; a.click(); },'image/png'); };
  img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(xml)));
}

// Modals
const modal=qs('#modal'); qs('#modal .close').addEventListener('click',()=>modal.close());
function openTierModal(n){
  const t=state.data.HARIL_System.tiers.find(x=>x.tier===n); if(!t) return;
  const gbase=state.data.HARIL_System.links?.glossary_base||'';
  const md=qs('.modal-body', modal); md.innerHTML=`
    <h3>Tier ${t.tier}: ${t.name}</h3>
    <p class="muted">${t.short||''}</p>
    <p>${t.definition}</p>
    ${t.core_loop? `<h4>Core Loop</h4><ul>${t.core_loop.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
    ${t.characteristics? `<h4>Characteristics</h4><ul>${t.characteristics.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
    ${t.contains? `<h4>Contains</h4><ul>${t.contains.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
    ${t.examples? `<h4>Examples</h4><ul>${t.examples.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
    ${t.composition? `<h4>Composition</h4><ul>${t.composition.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
    ${t.dependencies? `<h4>Dependencies</h4><ul>${t.dependencies.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
    ${(t.glossary_terms||[]).length? `<h4>Glossary</h4><p>${(t.glossary_terms||[]).map(sl=>`<a target="_blank" rel="noopener" href="${gbase}${sl}">${sl.replace(/-/g,' ')}</a>`).join(' · ')}</p>`:''}
    <div class="actions">
      <button class="copy" id="copyTierSummary">Copy Summary</button>
      <button class="copy" id="copyTierJson">Copy JSON</button>
    </div>
  `;
  qs('#copyTierSummary', md).addEventListener('click', ()=>copy(`Tier ${t.tier}: ${t.name}\n${t.definition}`));
  qs('#copyTierJson', md).addEventListener('click', ()=>copy(JSON.stringify(t, null, 2)));
  modal.showModal(); location.hash=`#/tier/${n}`;
}

// Learn
const learnDlg=qs('#learnDlg'); qs('#learnDlg .close').addEventListener('click',()=>learnDlg.close());
function getSteps(){ return (state.data?.HARIL_System?.tiers.find(t=>t.tier===1)?.core_loop)||["Inquire","Explore","Compress","Expand"]; }
function openLearn(){
  const steps=getSteps(); const pills=qs('.steps', learnDlg); pills.innerHTML='';
  steps.forEach((s,i)=>{ const span=document.createElement('span'); span.className='pill'; span.textContent=`${i+1}. ${s}`; if(i===state.learnIdx) span.style.borderColor='var(--accent)'; pills.appendChild(span); });
  qs('#note', learnDlg).value = state.notes[steps[state.learnIdx]]||'';
  learnDlg.showModal();
}
qs('#learn').addEventListener('click', openLearn);
qs('#prev').addEventListener('click', ()=>{ const steps=getSteps(); state.learnIdx=(state.learnIdx-1+steps.length)%steps.length; openLearn(); });
qs('#next').addEventListener('click', ()=>{ saveNote(); const steps=getSteps(); state.learnIdx=(state.learnIdx+1)%steps.length; openLearn(); });
qs('#reset').addEventListener('click', ()=>{ state.notes={}; state.learnIdx=0; openLearn(); });
qs('#exportNotes').addEventListener('click', ()=>{ saveNote(); download('haril_core_loop_notes.json', JSON.stringify(state.notes, null, 2), 'application/json'); });
function saveNote(){ const steps=getSteps(); state.notes[steps[state.learnIdx]] = qs('#note', learnDlg).value; }

// Search drawer
const searchDlg=qs('#searchDlg'); qs('#searchDlg .close').addEventListener('click',()=>searchDlg.close());
qs('#searchToggle').addEventListener('click', ()=>{ renderSearch(); searchDlg.showModal(); });
function renderSearch(){
  const input=qs('#searchInput', searchDlg); const ul=qs('#searchResults', searchDlg); const tiers=state.data.HARIL_System.tiers; const gbase=state.data.HARIL_System.links?.glossary_base||'';
  function run(){
    const q=(input.value||'').toLowerCase().trim(); ul.innerHTML='';
    const pool=[];
    tiers.forEach(t=>{
      (t.glossary_terms||[]).forEach(sl=>{ pool.push({kind:'glossary', label: sl.replace(/-/g,' '), url:gbase+sl}); });
      pool.push({kind:'tier', label: `Tier ${t.tier}: ${t.name}`, url:`#/tier/${t.tier}`});
      (t.tags||[]).forEach(tag=>pool.push({kind:'tag', label: `#${tag}`, url:`#/tier/${t.tier}` }));
    });
    pool.filter(item=>item.label.toLowerCase().includes(q))
        .slice(0,50)
        .forEach(item=>{
          const li=document.createElement('li');
          if(item.url.startsWith('http')){
            li.innerHTML=`<a target="_blank" rel="noopener" href="${item.url}">${item.label}</a> <span class="muted">(${item.kind})</span>`;
          } else {
            li.innerHTML=`<a href="${item.url}">${item.label}</a> <span class="muted">(${item.kind})</span>`;
          }
          ul.appendChild(li);
        });
  }
  input.oninput=run; run();
}

// Commands dialog
const commandsDlg=qs('#commandsDlg'); qs('#commandsDlg .close').addEventListener('click',()=>commandsDlg.close());
qs('#commands').addEventListener('click', ()=>{ setupCommands(); commandsDlg.showModal(); });
function setupCommands(){
  const list=qs('#cmdList', commandsDlg); const filter=qs('#cmdSearch', commandsDlg); const tmpl=qs('#tmplList', commandsDlg);
  if(!state.data) return; const cmds=state.data.HARIL_System.commands||[]; const templates=(state.data.HARIL_System.prompt_templates?.core_loop)||[];
  function render(){
    const q=(filter.value||'').toLowerCase();
    list.innerHTML='';
    cmds.filter(c=>c.name.toLowerCase().includes(q) or c.description.lower().includes(q) or c.id.lower().includes(q))
    
      .forEach(c=>{
        const li=document.createElement('li');
        const left=document.createElement('div');
        left.innerHTML=`<b>${c.name}</b><br><span class="muted">${c.description}</span><br><code>${c.id}</code>`;
        const right=document.createElement('div');
        const btn=document.createElement('button'); btn.className='copy'; btn.textContent='Copy'; btn.onclick=()=>copy(c.snippet);
        right.appendChild(btn);
        li.appendChild(left); li.appendChild(right); list.appendChild(li);
      });
  }
  filter.oninput=render; render();

  tmpl.innerHTML='';
  templates.forEach(t=>{
    const li=document.createElement('li');
    li.innerHTML=`<div><b>${t.step}</b><br><span class="muted">${t.template}</span></div>`;
    const btn=document.createElement('button'); btn.className='copy'; btn.textContent='Copy'; btn.onclick=()=>copy(`${t.step}: ${t.template}`);
    li.appendChild(btn);
    tmpl.appendChild(li);
  });
}

// Pages (markdown)
const pagesDlg=qs('#pagesDlg'); qs('#pagesDlg .close').addEventListener('click',()=>pagesDlg.close());
qs('#pages').addEventListener('click', ()=>{ setupPages(); pagesDlg.showModal(); });
function md2html(md){
  return md
    .replace(/^### (.*$)/gim,'<h3>$1</h3>')
    .replace(/^## (.*$)/gim,'<h2>$1</h2>')
    .replace(/^# (.*$)/gim,'<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim,'<b>$1</b>')
    .replace(/\*(.*?)\*/gim,'<i>$1</i>')
    .replace(/\n$/,'')
    .split(/\n{2,}/).map(p=>/^<h\d/.test(p)?p:`<p>${p.replace(/\n/g,'<br>')}</p>`).join('\n');
}
function setupPages(){
  const list=qs('#pagesList', pagesDlg); const view=qs('#pageView', pagesDlg);
  if(!state.data) return; const pages=state.data.HARIL_System.pages||[]; list.innerHTML=''; view.innerHTML='';
  pages.forEach(pg=>{ const li=document.createElement('li'); const a=document.createElement('a'); a.href='#'; a.textContent=pg.title; a.onclick=(e)=>{ e.preventDefault(); view.innerHTML=md2html(pg.markdown||''); }; li.appendChild(a); list.appendChild(li); });
  if(pages[0]) view.innerHTML=md2html(pages[0].markdown||'');
}

// Routing (reuse from v3)
function routeFromHash(){
  const hash=location.hash.replace(/^#\/?/,'').toLowerCase();
  if(['stack','tree','loop','spiral'].includes(hash)){ state.view=(hash==='spiral'?'spiral':hash); highlightView(); renderViz(); return; }
  if(hash.startsWith('tier/')){ const n=parseInt(hash.split('/')[1]); if(!isNaN(n)) openTierModal(n); return; }
}
addEventListener('hashchange', routeFromHash);
if(!location.hash) location.hash = '#/stack';

// Buttons
qs('#expandAll').addEventListener('click', ()=>qsa('.card details').forEach(d=>d.open=true));
qs('#collapseAll').addEventListener('click', ()=>qsa('.card details').forEach(d=>d.open=false));
qs('#exportSvg').addEventListener('click', exportSvg);
qs('#exportPng').addEventListener('click', exportPng);
qs('#theme').addEventListener('click', ()=>{ const cur=document.body.getAttribute('data-theme'); const next=cur==='neutral'?'riso':'neutral'; document.body.setAttribute('data-theme', next); });
qsa('.controls button[data-view]').forEach(b=>b.addEventListener('click', ()=>{ state.view=b.dataset.view; highlightView(); renderViz(); location.hash=`#/${state.view}`; }));
