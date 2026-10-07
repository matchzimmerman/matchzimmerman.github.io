const API="https://mzcmg-shop-api.vercel.app/api";
let products=[],details=new Map(),cart=JSON.parse(localStorage.getItem("mzbrdz-cart")||"[]");
const filters={category:"all",size:"",color:"",material:""};
const $=s=>document.querySelector(s);

function money(v,c="USD"){const n=Number(v);return Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:c}).format(n):"—"}
function uniq(xs){return [...new Set(xs.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}))}
function clean(s){return String(s||"").replace(/\s+/g," ").trim()}
function optionLabel(v){const bits=[v.color,v.size].filter(Boolean);return bits.length?bits.join(" / "):clean(v.name)||"Option"}
function usableVariant(v){const s=String(v.availability_status||"").toLowerCase();return v.synced!==false && !/discontinued|out_of_stock|unavailable/.test(s)}

async function loadCatalog(){
  const r=await fetch(API+"/inventory?storefront=1");
  const j=await r.json(); if(!j.ok) throw new Error(j.error||"Catalog unavailable");
  products=j.products||[];
  renderCategoryButtons(j.categories||[]);
  render();
  preloadDetails();
}
function renderCategoryButtons(categories){
  const el=$("#category-pills");
  el.innerHTML='<button class="active" data-category="all">ALL</button>'+categories.map(c=>'<button data-category="'+escapeAttr(c)+'">'+escapeHtml(c.toUpperCase())+'</button>').join("");
  el.querySelectorAll("button").forEach(b=>b.onclick=()=>{filters.category=b.dataset.category;el.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));render()});
}
function passes(p){
  if(filters.category!=="all"&&p.category!==filters.category)return false;
  const d=details.get(String(p.id));
  if(filters.size && (!d||!d.sizes.includes(filters.size)))return false;
  if(filters.color && (!d||!d.colors.includes(filters.color)))return false;
  if(filters.material && (!d||!d.materials.includes(filters.material)))return false;
  return true;
}
function render(){
  const rows=products.filter(passes);
  const groups={}; rows.forEach(p=>(groups[p.category]||(groups[p.category]=[])).push(p));
  const cats=Object.keys(groups);
  $("#catalog").innerHTML=cats.length?cats.map(cat=>section(cat,groups[cat])).join(""):'<div class="empty-block">NO PRODUCTS MATCH THESE FILTERS.</div>';
  document.querySelectorAll(".product-card").forEach(card=>card.onclick=()=>openProduct(card.dataset.id));
}
function section(cat,items){
  return '<section class="category-section"><div class="section-head"><h2>'+escapeHtml(cat.toUpperCase())+'</h2><span class="section-count">'+items.length+' ITEM'+(items.length===1?'':'S')+'</span></div><div class="product-grid">'+items.map(card).join("")+'</div></section>';
}
function card(p,i){
  const d=details.get(String(p.id)); const price=d&&d.prices.length?"FROM "+money(Math.min(...d.prices),d.currency):"VIEW OPTIONS";
  return '<article class="product-card" data-id="'+p.id+'"><div class="product-image">'+(p.thumbnail_url?'<img src="'+escapeAttr(p.thumbnail_url)+'" alt="">':'')+'</div><div class="product-copy"><div class="card-number">'+String(p.id).slice(-3)+'</div><div class="card-category">'+escapeHtml(p.category)+'</div><h3>'+escapeHtml(p.name)+'</h3><div class="product-meta"><span>'+p.synced+' OPTION'+(p.synced===1?'':'S')+'</span><span class="product-price">'+price+'</span></div></div></article>';
}
async function loadDetail(id){
  id=String(id); if(details.has(id))return details.get(id);
  const r=await fetch(API+"/product?storefront=1&id="+encodeURIComponent(id)); const j=await r.json();
  if(!j.ok)throw new Error(j.error||"Product unavailable");
  const vars=(j.product.variants||[]).filter(usableVariant);
  const d={product:j.product,variants:vars,sizes:uniq(vars.map(v=>v.size)),colors:uniq(vars.map(v=>v.color)),materials:uniq(vars.map(v=>v.material)),prices:vars.map(v=>Number(v.retail_price)).filter(Number.isFinite),currency:(vars[0]&&vars[0].currency)||"USD"};
  details.set(id,d); return d;
}
async function preloadDetails(){
  const queue=products.slice(); let done=0;
  async function worker(){while(queue.length){const p=queue.shift();try{await loadDetail(p.id)}catch(e){}done++;$("#filter-status").textContent="LOADING FIT DATA "+done+" / "+products.length;updateFacetOptions();if(done%4===0)render()}}
  await Promise.all(Array.from({length:Math.min(5,products.length)},worker));
  $("#filter-status").textContent="LIVE OPTIONS LOADED";updateFacetOptions();render();
}
function updateFacetOptions(){
  const ds=[...details.values()];
  updateSelect("#size-filter",uniq(ds.flatMap(d=>d.sizes)),filters.size);
  updateSelect("#color-filter",uniq(ds.flatMap(d=>d.colors)),filters.color);
  const mats=uniq(ds.flatMap(d=>d.materials)); updateSelect("#material-filter",mats,filters.material); $("#material-wrap").hidden=!mats.length;
}
function updateSelect(sel,items,current){
  const el=$(sel),label=el.options[0].textContent; el.innerHTML='<option value="">'+label+'</option>'+items.map(x=>'<option value="'+escapeAttr(x)+'">'+escapeHtml(x.toUpperCase())+'</option>').join(""); el.value=current;
}
["size","color","material"].forEach(k=>{const el=$("#"+k+"-filter");el.onchange=()=>{filters[k]=el.value;render()}});
$("#clear-filters").onclick=()=>{filters.category="all";filters.size=filters.color=filters.material="";document.querySelectorAll("#category-pills button").forEach((b,i)=>b.classList.toggle("active",i===0));["size","color","material"].forEach(k=>$("#"+k+"-filter").value="");render()};

async function openProduct(id){
  const dialog=$("#product-dialog"),content=$("#product-dialog-content"); content.innerHTML='<div class="loading-block">LOADING OPTIONS…</div>'; dialog.showModal();
  try{
    const d=await loadDetail(id),p=products.find(x=>String(x.id)===String(id))||d.product;
    const vars=d.variants;
    const options=vars.map(v=>'<option value="'+escapeAttr(v.id)+'">'+escapeHtml(optionLabel(v))+' — '+money(v.retail_price,v.currency)+'</option>').join("");
    content.innerHTML='<div class="dialog-grid"><div class="dialog-image">'+(p.thumbnail_url?'<img src="'+escapeAttr(p.thumbnail_url)+'" alt="">':'')+'</div><div class="dialog-copy"><div class="card-category">'+escapeHtml(p.category||"MZBRDZ")+'</div><h2>'+escapeHtml(p.name||d.product.name)+'</h2><div class="product-meta"><span>PRINTFUL PRODUCT '+p.id+'</span><span>'+vars.length+' LIVE OPTION'+(vars.length===1?'':'S')+'</span></div><label class="variant-note">SELECT SIZE / COLOR / OPTION<select class="variant-select" id="variant-select">'+options+'</select></label><button class="add-button" id="add-button" '+(vars.length?'':'disabled')+'>'+(vars.length?'ADD TO BAG':'CURRENTLY UNAVAILABLE')+'</button><p class="variant-note">Availability is read from the synced Printful product. Final payment and fulfillment handoff will be attached to this cart without changing the browse layer.</p></div></div>';
    if(vars.length)$("#add-button").onclick=()=>addToCart(p,vars.find(v=>String(v.id)===$("#variant-select").value)||vars[0]);
  }catch(e){content.innerHTML='<div class="empty-block">'+escapeHtml(e.message)+'</div>'}
}
$("#dialog-close").onclick=()=>$("#product-dialog").close();

function addToCart(p,v){
  const existing=cart.find(x=>String(x.variantId)===String(v.id)); if(existing)existing.qty++; else cart.push({productId:p.id,variantId:v.id,name:p.name,variantName:optionLabel(v),price:Number(v.retail_price)||0,currency:v.currency||"USD",image:v.image||p.thumbnail_url||"",qty:1});
  saveCart();$("#product-dialog").close();openBag();
}
function saveCart(){localStorage.setItem("mzbrdz-cart",JSON.stringify(cart));renderBag()}
function renderBag(){
  $("#bag-count").textContent=cart.reduce((n,x)=>n+x.qty,0);
  $("#bag-items").innerHTML=cart.length?cart.map((x,i)=>'<div class="bag-item">'+(x.image?'<img src="'+escapeAttr(x.image)+'" alt="">':'<div></div>')+'<div><h4>'+escapeHtml(x.name)+'</h4><p>'+escapeHtml(x.variantName)+' · QTY '+x.qty+'</p><p>'+money(x.price,x.currency)+'</p></div><button data-remove="'+i+'" aria-label="Remove">×</button></div>').join(""):'<p class="empty-block">YOUR BAG IS EMPTY.</p>';
  $("#bag-subtotal").textContent=money(cart.reduce((s,x)=>s+x.price*x.qty,0),cart[0]?.currency||"USD");
  document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.remove),1);saveCart()});
}
function openBag(){$("#bag-drawer").classList.add("open");$("#bag-drawer").setAttribute("aria-hidden","false");$("#bag-scrim").hidden=false}
function closeBag(){$("#bag-drawer").classList.remove("open");$("#bag-drawer").setAttribute("aria-hidden","true");$("#bag-scrim").hidden=true}
$("#bag-button").onclick=openBag;$("#bag-close").onclick=closeBag;$("#bag-scrim").onclick=closeBag;
$("#checkout-button").onclick=()=>alert("The browse + cart model is working. Stripe payment and Printful fulfillment are the next isolated module.");

function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function escapeAttr(s){return escapeHtml(s)}
renderBag();
loadCatalog().catch(e=>$("#catalog").innerHTML='<div class="empty-block">'+escapeHtml(e.message)+'</div>');
