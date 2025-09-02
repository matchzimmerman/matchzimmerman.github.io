let TERMS=[];
const sectionsEl=document.getElementById('sections');
const detailView=document.getElementById('detailView');
const termContent=document.getElementById('termContent');
const closeBtn=document.getElementById('closeDetail');

function cardFor(t){const el=document.createElement('article');el.className='card';el.innerHTML=`<h2>${t.title}</h2><p>${t.subtitle}</p>`;el.onclick=()=>showDetail(t.slug);return el;}
function renderSections(){sectionsEl.innerHTML='';const buckets={recursive:[],telemetry:[],agency:[],identity:[]};TERMS.forEach(t=>{buckets[t.tags[0]].push(t)});for(const k in buckets){if(!buckets[k].length)continue;const sec=document.createElement('section');sec.className='section';sec.innerHTML=`<h3>${k}</h3><p class="desc">cluster of ${k} terms</p>`;const g=document.createElement('div');g.className='grid';buckets[k].forEach(t=>g.appendChild(cardFor(t)));sec.appendChild(g);sectionsEl.appendChild(sec);}}
function showDetail(slug){detailView.hidden=false;termContent.innerHTML='Loading…';fetch('terms/'+slug+'.html').then(r=>r.text()).then(html=>termContent.innerHTML=html);}
function closeDetail(){detailView.hidden=true;}
closeBtn.onclick=closeDetail;detailView.onclick=e=>{if(e.target===detailView)closeDetail();}
fetch('terms.json').then(r=>r.json()).then(d=>{TERMS=d;renderSections();});
