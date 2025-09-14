// HARIL GlyphLab
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const palette = document.getElementById('palette');
const canvas = document.getElementById('canvas');
const scaleCtl = document.getElementById('scale');
const rotateCtl = document.getElementById('rotate');
const opacityCtl = document.getElementById('opacity');
const fillCtl = document.getElementById('fill');
const flipHBtn = document.getElementById('flipH');
const flipVBtn = document.getElementById('flipV');
const bringFwdBtn = document.getElementById('bringFwd');
const sendBackBtn = document.getElementById('sendBack');
const duplicateBtn = document.getElementById('duplicate');
const deleteBtn = document.getElementById('delete');
const exportSVGBtn = document.getElementById('exportSVG');
const exportPNGBtn = document.getElementById('exportPNG');
const saveBoardBtn = document.getElementById('saveBoard');
const loadBoardBtn = document.getElementById('loadBoard');
const loadBoardFile = document.getElementById('loadBoardFile');

let selected = null;
let clipboardNode = null;

// Upload handlers
dropzone.addEventListener('dragover', (e)=>{e.preventDefault(); dropzone.classList.add('hover')});
dropzone.addEventListener('dragleave', ()=> dropzone.classList.remove('hover'));
dropzone.addEventListener('drop', async (e)=>{
  e.preventDefault();
  dropzone.classList.remove('hover');
  const files = [...e.dataTransfer.files].filter(f=>f.type==='image/svg+xml' || f.name.endsWith('.svg'));
  await handleFiles(files);
});
fileInput.addEventListener('change', async (e)=>{
  const files = [...e.target.files];
  await handleFiles(files);
});

async function handleFiles(files){
  for (const file of files){
    const text = await file.text();
    addToPalette(text, file.name);
  }
}

function addToPalette(svgText, name='glyph'){
  // Clean namespaces and wrap in a group for safe re-use
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  let svg = doc.documentElement;
  if (svg.nodeName.toLowerCase() !== 'svg'){
    console.warn('Not an SVG root:', name);
    return;
  }
  // Normalize viewBox if missing
  if (!svg.getAttribute('viewBox')){
    const w = svg.getAttribute('width') || 100;
    const h = svg.getAttribute('height') || 100;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  const item = document.createElement('div');
  item.className = 'palette-item';
  // Create a miniature SVG for palette display
  const mini = svg.cloneNode(true);
  mini.removeAttribute('width'); mini.removeAttribute('height');
  mini.setAttribute('preserveAspectRatio','xMidYMid meet');
  item.appendChild(mini);
  item.title = name;
  item.draggable = true;
  item.addEventListener('dragstart', (ev)=>{
    ev.dataTransfer.setData('text/plain', svg.outerHTML);
  });
  item.addEventListener('click', ()=>{
    // single-click to add to center
    placeOnCanvas(svg.outerHTML, 600, 400);
  });
  palette.appendChild(item);
}

// Canvas drop
const canvasWrap = document.getElementById('canvasWrap');
canvasWrap.addEventListener('dragover', (e)=>{e.preventDefault()});
canvasWrap.addEventListener('drop', (e)=>{
  e.preventDefault();
  const svgText = e.dataTransfer.getData('text/plain');
  const pt = clientToSVG(canvas, e.clientX, e.clientY);
  placeOnCanvas(svgText, pt.x, pt.y);
});

function placeOnCanvas(svgText, cx=600, cy=400){
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  let glyph = doc.documentElement;
  // Wrap glyph content into a group with transform
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('transform', `translate(${cx} ${cy}) scale(1) rotate(0)`);
  g.setAttribute('data-scale','1');
  g.setAttribute('data-rotate','0');
  g.setAttribute('data-flipx','1');
  g.setAttribute('data-flipy','1');
  // Import children of glyph into g
  while (glyph.firstChild){
    g.appendChild(glyph.firstChild);
  }
  // Center based on bbox by shifting children into a nested group
  const inner = document.createElementNS('http://www.w3.org/2000/svg','g');
  while (g.firstChild){
    inner.appendChild(g.firstChild);
  }
  // After append temporarily to compute bbox
  g.appendChild(inner);
  canvas.appendChild(g);
  // Compute bbox
  try {
    const bbox = inner.getBBox();
    inner.setAttribute('transform', `translate(${-bbox.x - bbox.width/2} ${-bbox.y - bbox.height/2})`);
  } catch(e){
    // in case of non-rendering bbox issues, ignore
  }
  makeSelectable(g);
  setSelected(g);
}

function makeSelectable(node){
  node.addEventListener('pointerdown', (e)=>{
    if (e.target.closest('.handle')) return;
    setSelected(node);
  });
  // Drag to move
  let dragging = false;
  let start = null;
  node.addEventListener('pointerdown', (e)=>{
    dragging = true;
    node.setPointerCapture(e.pointerId);
    start = {pt: clientToSVG(canvas, e.clientX, e.clientY), t: parseTransform(node)};
  });
  node.addEventListener('pointermove', (e)=>{
    if (!dragging) return;
    const cur = clientToSVG(canvas, e.clientX, e.clientY);
    const dx = cur.x - start.pt.x;
    const dy = cur.y - start.pt.y;
    const t = start.t;
    setTransform(node, t.x+dx, t.y+dy, t.scale, t.rotate, t.flipx, t.flipy);
  });
  node.addEventListener('pointerup', (e)=>{
    dragging = false;
    node.releasePointerCapture(e.pointerId);
  });
}

function clientToSVG(svg, x, y){
  const pt = svg.createSVGPoint();
  pt.x = x; pt.y = y;
  const ctm = svg.getScreenCTM().inverse();
  return pt.matrixTransform(ctm);
}

function parseTransform(node){
  const tr = node.getAttribute('transform') || '';
  // Expect translate(x y) scale(s) rotate(r) optionally with flips encoded in scale sign
  // Store flips separately
  const scale = parseFloat(node.getAttribute('data-scale')||'1');
  const rotate = parseFloat(node.getAttribute('data-rotate')||'0');
  const flipx = parseFloat(node.getAttribute('data-flipx')||'1');
  const flipy = parseFloat(node.getAttribute('data-flipy')||'1');
  // Extract translate
  const match = tr.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
  let x=600,y=400;
  if (match){ x=parseFloat(match[1]); y=parseFloat(match[2]); }
  return {x,y,scale,rotate,flipx,flipy};
}

function setTransform(node, x, y, scale, rotate, flipx=1, flipy=1){
  node.setAttribute('transform', `translate(${x} ${y}) scale(${scale*flipx} ${scale*flipy}) rotate(${rotate})`);
  node.setAttribute('data-scale', scale);
  node.setAttribute('data-rotate', rotate);
  node.setAttribute('data-flipx', flipx);
  node.setAttribute('data-flipy', flipy);
}

function setSelected(node){
  if (selected) selected.classList.remove('selected');
  selected = node;
  if (selected) {
    selected.classList.add('selected');
    const t = parseTransform(selected);
    scaleCtl.value = t.scale;
    rotateCtl.value = t.rotate;
    opacityCtl.value = selected.getAttribute('opacity') || 1;
    // Try to read a fill from first path/shape
    const shape = selected.querySelector('[fill]');
    fillCtl.value = rgbToHex(getComputedStyle(shape||selected).fill || '#000');
  }
}

function rgbToHex(rgb){
  if (!rgb) return '#000000';
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return '#000000';
  return '#'+[m[1],m[2],m[3]].map(n=>('0'+parseInt(n).toString(16)).slice(-2)).join('');
}

// Controls
scaleCtl.addEventListener('input', ()=>{
  if (!selected) return;
  const t = parseTransform(selected);
  setTransform(selected, t.x, t.y, parseFloat(scaleCtl.value), t.rotate, t.flipx, t.flipy);
});
rotateCtl.addEventListener('input', ()=>{
  if (!selected) return;
  const t = parseTransform(selected);
  setTransform(selected, t.x, t.y, t.scale, parseFloat(rotateCtl.value), t.flipx, t.flipy);
});
opacityCtl.addEventListener('input', ()=>{
  if (!selected) return;
  selected.setAttribute('opacity', opacityCtl.value);
});
fillCtl.addEventListener('input', ()=>{
  if (!selected) return;
  // Set fill on all shapes lacking explicit 'fill="none"'
  selected.querySelectorAll('*').forEach(el=>{
    const tag = el.tagName.toLowerCase();
    if (['path','circle','rect','ellipse','polygon','polyline'].includes(tag)){
      if (el.getAttribute('fill') !== 'none'){
        el.setAttribute('fill', fillCtl.value);
      }
    }
  });
});

flipHBtn.addEventListener('click', ()=>{
  if (!selected) return;
  const t = parseTransform(selected);
  setTransform(selected, t.x, t.y, t.scale, t.rotate, -t.flipx, t.flipy);
});
flipVBtn.addEventListener('click', ()=>{
  if (!selected) return;
  const t = parseTransform(selected);
  setTransform(selected, t.x, t.y, t.scale, t.rotate, t.flipx, -t.flipy);
});

bringFwdBtn.addEventListener('click', ()=>{
  if (!selected) return;
  selected.parentNode.appendChild(selected);
});
sendBackBtn.addEventListener('click', ()=>{
  if (!selected) return;
  const bg = canvas.querySelector('rect'); // keep background at bottom
  canvas.insertBefore(selected, bg.nextSibling);
});

duplicateBtn.addEventListener('click', ()=>{
  if (!selected) return;
  const clone = selected.cloneNode(true);
  const t = parseTransform(selected);
  setTransform(clone, t.x+20, t.y+20, t.scale, t.rotate, t.flipx, t.flipy);
  makeSelectable(clone);
  canvas.appendChild(clone);
  setSelected(clone);
});
deleteBtn.addEventListener('click', ()=>{
  if (!selected) return;
  const next = selected.nextElementSibling || selected.previousElementSibling;
  selected.remove();
  setSelected(next && next.tagName.toLowerCase()==='g' ? next : null);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e)=>{
  if (!selected) return;
  const t = parseTransform(selected);
  if (e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); deleteBtn.click(); }
  if (e.metaKey || e.ctrlKey){
    if (e.key.toLowerCase()==='c'){ e.preventDefault(); clipboardNode = selected.cloneNode(true); }
    if (e.key.toLowerCase()==='v' && clipboardNode){ 
      e.preventDefault(); 
      const c = clipboardNode.cloneNode(true);
      setTransform(c, t.x+24, t.y+24, t.scale, t.rotate, t.flipx, t.flipy);
      makeSelectable(c);
      canvas.appendChild(c);
      setSelected(c);
    }
  } else {
    // Arrow move
    const step = e.shiftKey ? 10 : 2;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
      e.preventDefault();
      let dx=0,dy=0;
      if (e.key==='ArrowUp') dy=-step;
      if (e.key==='ArrowDown') dy=step;
      if (e.key==='ArrowLeft') dx=-step;
      if (e.key==='ArrowRight') dx=step;
      setTransform(selected, t.x+dx, t.y+dy, t.scale, t.rotate, t.flipx, t.flipy);
    }
  }
});

// Export SVG
exportSVGBtn.addEventListener('click', ()=>{
  const cloned = canvas.cloneNode(true);
  // Remove selection highlights
  cloned.querySelectorAll('.selected').forEach(n=>n.classList.remove('selected'));
  const serializer = new XMLSerializer();
  const text = serializer.serializeToString(cloned);
  const blob = new Blob([text], {type:'image/svg+xml'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'glyphlab_composition.svg';
  a.click();
  URL.revokeObjectURL(a.href);
});

// Export PNG
exportPNGBtn.addEventListener('click', async ()=>{
  const serializer = new XMLSerializer();
  const cloned = canvas.cloneNode(true);
  cloned.querySelectorAll('.selected').forEach(n=>n.classList.remove('selected'));
  const svgText = serializer.serializeToString(cloned);
  const svgBlob = new Blob([svgText], {type:'image/svg+xml'});
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = ()=>{
    const canvasEl = document.createElement('canvas');
    canvasEl.width = 1200;
    canvasEl.height = 800;
    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvasEl.toBlob((blob)=>{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'glyphlab_composition.png';
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  };
  img.onerror = ()=>{
    alert('PNG export failed (likely due to external resource CORS). Try SVG export instead.');
  };
  img.src = url;
});

// Save / Load board (JSON)
saveBoardBtn.addEventListener('click', ()=>{
  const items = [...canvas.querySelectorAll('g')].map(g=>{
    const t = parseTransform(g);
    return {
      transform: {x:t.x,y:t.y,scale:t.scale,rotate:t.rotate,flipx:t.flipx,flipy:t.flipy},
      opacity: g.getAttribute('opacity')||1,
      inner: g.innerHTML
    };
  });
  const data = {width:1200,height:800,items};
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'glyphlab_board.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

loadBoardBtn.addEventListener('click', ()=> loadBoardFile.click());
loadBoardFile.addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    // clear existing (keep background rect)
    [...canvas.querySelectorAll('g')].forEach(g=>g.remove());
    canvas.setAttribute('width', data.width||1200);
    canvas.setAttribute('height', data.height||800);
    for (const it of data.items){
      const g = document.createElementNS('http://www.w3.org/2000/svg','g');
      g.innerHTML = it.inner;
      setTransform(g, it.transform.x, it.transform.y, it.transform.scale, it.transform.rotate, it.transform.flipx, it.transform.flipy);
      if (it.opacity) g.setAttribute('opacity', it.opacity);
      makeSelectable(g);
      canvas.appendChild(g);
    }
  } catch(err){
    alert('Invalid board file.');
  }
});
