(function () {
  'use strict';
  var E = window.MZKnit;
  var $ = function (id) { return document.getElementById(id); };
  var state = {file:null,image:null,pixels:null,panels:E.STUDY_PANELS.map(function(p){return Object.assign({},p);}),
    mode:'wrap',seam:0,ready:false,rendered:false};
  var labels = {front:'Front',back:'Back',left_sleeve:'Left sleeve',right_sleeve:'Right sleeve'};
  var messages = {wrap:'Front and back sample adjacent halves of the source panorama; sleeves borrow narrow strips.',
    repeat:'Each surface repeats the full source image as a textile tile.',composed:'Front features a primary crop; back and sleeves pull complementary regions.'};
  function setStatus(message,error){var el=$('status');el.textContent=message;el.classList.toggle('error',!!error);}
  function showPalette(hexes) {
    var inputs=Array.from(document.querySelectorAll('.swatch input'));
    hexes.forEach(function(c,i){inputs[i].value=c;inputs[i].nextElementSibling.textContent=c.toUpperCase();});
    populateYarns();invalidate();
  }
  function getPalette(){return Array.from(document.querySelectorAll('.swatch input')).map(function(x){return x.value;});}
  function populateYarns() {
    var previousBase=$('base').value,previousTrim=$('trim').value;
    ['base','trim'].forEach(function(key){var select=$(key);select.replaceChildren();getPalette().forEach(function(hex,i){var opt=new Option('Yarn '+(i+1)+' · '+hex.toUpperCase(),hex);select.add(opt);});});
    $('base').value=getPalette().includes(previousBase)?previousBase:getPalette()[0];
    $('trim').value=getPalette().includes(previousTrim)?previousTrim:getPalette()[0];
  }
  function invalidate(){state.rendered=false;$('download').disabled=true;$('renderInfo').textContent=state.ready?'SETTINGS CHANGED · RENDER AGAIN':'AWAITING IMAGE';}
  function drawSource(image){
    var box=$('sourcePreview');box.replaceChildren();var el=new Image();el.src=URL.createObjectURL(state.file);el.alt='Uploaded source artwork';box.append(el);
    $('sourceDims').textContent=image.width+' × '+image.height+' PX';$('fileInfo').textContent=state.file.name+' · '+(state.file.size/1024/1024).toFixed(2)+' MB';
  }
  async function loadFile(file){
    if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setStatus('Use PNG, JPG or WebP.',true);return;}
    if(file.size>35*1024*1024){setStatus('Maximum image upload is 35 MB for this local tool.',true);return;}
    try{
      setStatus('Decoding artwork locally…');
      var bitmap=await createImageBitmap(file);
      var factor=Math.min(1,1800/Math.max(bitmap.width,bitmap.height)),w=Math.max(1,Math.round(bitmap.width*factor)),h=Math.max(1,Math.round(bitmap.height*factor));
      var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      var ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(bitmap,0,0,w,h);
      var data=ctx.getImageData(0,0,w,h);bitmap.close();
      state.file=file;state.image={width:w,height:h};state.pixels=data;state.ready=true;
      $('render').disabled=false;$('autoPalette').disabled=false;
      drawSource({width:w,height:h});invalidate();
      setStatus('Image ready. Select a layout and build previews.');
    }catch(e){setStatus('Image could not be decoded: '+e.message,true);}
  }
  function canvasFromResult(r){var c=document.createElement('canvas');c.width=r.width;c.height=r.height;var ctx=c.getContext('2d');ctx.putImageData(new ImageData(r.data,r.width,r.height),0,0);return c;}
  function config(){return {colors:getPalette(),mode:state.mode,style:$('reduction').value,pixelSize:Number($('pixelSize').value),seam:state.seam};}
  function renderOne(p,maxDim){
    var ratio=Math.min(1,maxDim/Math.max(p.width,p.height)),dim={width:Math.max(64,Math.round(p.width*ratio)),height:Math.max(64,Math.round(p.height*ratio))};
    var c=config();
    return canvasFromResult(E.renderPanel(state.pixels,p.key,c.colors,c.mode,c.style,Math.max(1,Math.round(c.pixelSize*ratio)),c.seam,dim));
  }
  async function render(){
    if(!state.ready)return;
    try{
      E.validatePalette(getPalette());setStatus('Building four-panel previews…');await new Promise(function(resolve){setTimeout(resolve,10);});
      var grid=$('panels');grid.replaceChildren();
      state.panels.forEach(function(p){
        var tile=document.createElement('div');tile.className='tile';var viewport=document.createElement('div');viewport.className='viewport';
        viewport.append(renderOne(p,380));var label=document.createElement('div');label.className='label';label.textContent=labels[p.key];
        var dim=document.createElement('div');dim.className='dim';dim.textContent=p.width+' × '+p.height+' study pixels';tile.append(viewport,label,dim);grid.append(tile);
      });
      state.rendered=true;$('download').disabled=false;
      $('renderInfo').textContent=state.mode.toUpperCase()+' · '+$('reduction').value.toUpperCase();
      setStatus('Four preview panels complete. ZIP export available.');
    }catch(e){setStatus('Rendering failed: '+e.message,true);}
  }
  function toBlob(canvas){return new Promise(function(resolve,reject){canvas.toBlob(function(blob){blob?resolve(blob):reject(new Error('PNG encoding failed'));},'image/png');});}
  async function download(){
    if(!state.ready||!state.rendered)return;
    $('download').disabled=true;$('render').disabled=true;
    try{
      var configNow=config(),entries=[],enc=new TextEncoder();
      for(var i=0;i<state.panels.length;i++){
        var p=state.panels[i];setStatus('Encoding '+labels[p.key]+' ('+(i+1)+'/4)…');
        await new Promise(function(resolve){setTimeout(resolve,20);});
        var full=renderOne(p,Math.max(p.width,p.height));var blob=await toBlob(full);
        entries.push({name:p.key+'.png',data:new Uint8Array(await blob.arrayBuffer())});
      }
      var manifest=E.makeManifest({palette:configNow.colors,base:$('base').value,trim:$('trim').value,
        filename:state.file.name,panels:state.panels,layout:configNow.mode,style:configNow.style});
      manifest.render_settings={pixel_block_study:configNow.pixelSize,seam_offset:configNow.seam};
      entries.push({name:'manifest.json',data:enc.encode(JSON.stringify(manifest,null,2))});
      entries.push({name:'PRODUCTION_CHECKLIST.txt',data:enc.encode([
        'MZ KNIT FOUNDRY 002 — PRODUCTION PREP, NOT MANUFACTURER VALIDATED','',
        'Artwork converted locally. No products were created or published.','',
        '1. Confirm four colors are actual yarn HEX values for Printful product 860.',
        '2. Download current Printful size-specific knitting template / printfile dimensions.',
        '3. Re-map and reposition all 4 artboards against verified placement shapes and sizes.',
        '4. Verify printfile dimensions, artwork coverage and seams at each size.',
        '5. Request OFFICIAL Printful mockups and review all surfaces/sizes.',
        '6. Human approval before any listing, payment, order or fulfillment.',
        '', 'Manifest is a local drafting aid. It is NOT a ready-to-submit Printful order.'
      ].join('\n'))});
      var ext=state.file.name.toLowerCase().split('.').pop();
      entries.push({name:'source-original.'+(/^(png|jpg|jpeg|webp)$/.test(ext)?ext:'png'),data:new Uint8Array(await state.file.arrayBuffer())});
      setStatus('Packaging PNGs and settings…');
      var zip=E.encodeZip(entries),url=URL.createObjectURL(zip),a=document.createElement('a');
      var clean=state.file.name.replace(/\.[^.]+$/,'').replace(/[^\w-]+/g,'_').slice(0,50)||'artwork';
      a.href=url;a.download='MZ_KNIT_FOUNDRY_002_'+clean+'.zip';document.body.append(a);a.click();a.remove();
      setTimeout(function(){URL.revokeObjectURL(url);},30000);
      setStatus('Exported '+entries.length+' files · '+(zip.size/1024/1024).toFixed(1)+' MB. Production validation still required.');
    }catch(e){setStatus('Export failed: '+e.message,true);}finally{$('download').disabled=false;$('render').disabled=false;}
  }
  function importTemplate(file){
    if(!file)return;
    file.text().then(function(text){
      var json=JSON.parse(text);if(json.schema!=='mz.knit-template.v1'||!Array.isArray(json.panels))throw new Error('Expected mz.knit-template.v1 with four panels');
      var required=['front','back','left_sleeve','right_sleeve'];
      var output=required.map(function(k){var p=json.panels.find(function(x){return x.key===k;});
        if(!p||!Number.isInteger(p.width)||!Number.isInteger(p.height)||p.width<64||p.height<64||p.width>5000||p.height>5000||p.width*p.height>12000000)throw new Error('Invalid '+k+' dimensions');
        return {key:k,placement:E.STUDY_PANELS.find(function(x){return x.key===k;}).placement,width:p.width,height:p.height};
      });
      state.panels=output;invalidate();$('templateStatus').textContent='Custom imported artwork dimensions · Printful approval still required';setStatus('Template study dimensions imported. Render previews again.');
    }).catch(function(e){setStatus('Profile rejected: '+e.message,true);});
  }
  function init(){
    populateYarns();
    $('upload').addEventListener('change',function(e){loadFile(e.target.files[0]);});
    var zone=$('dropzone');['dragenter','dragover'].forEach(function(n){zone.addEventListener(n,function(e){e.preventDefault();zone.classList.add('drag');});});
    ['dragleave','drop'].forEach(function(n){zone.addEventListener(n,function(e){e.preventDefault();zone.classList.remove('drag');});});
    zone.addEventListener('drop',function(e){loadFile(e.dataTransfer.files[0]);});
    document.querySelectorAll('[data-layout]').forEach(function(btn){btn.addEventListener('click',function(){
      state.mode=btn.dataset.layout;document.querySelectorAll('[data-layout]').forEach(function(b){b.classList.toggle('active',b===btn);});$('modeNote').textContent=messages[state.mode];invalidate();
    });});
    document.querySelectorAll('.swatch input').forEach(function(el){el.addEventListener('input',function(){showPalette(getPalette());});});
    $('autoPalette').addEventListener('click',function(){try{showPalette(E.suggestPalette(state.pixels));setStatus('Suggested four artwork colors. Verify against the Printful yarn palette.');}catch(e){setStatus(e.message,true);}});
    $('resetPalette').addEventListener('click',function(){showPalette(E.TWO_HOUSES);setStatus('Two Houses study colors restored.');});
    $('seam').addEventListener('input',function(){state.seam=Number(this.value)/100;$('seamVal').textContent=this.value+'%';invalidate();});
    $('pixelSize').addEventListener('input',function(){$('pixelVal').textContent=this.value+' px';invalidate();});
    $('reduction').addEventListener('change',function(){$('pixelWrap').style.display=this.value==='pixelated'?'grid':'none';invalidate();});
    ['base','trim'].forEach(function(k){$(k).addEventListener('change',invalidate);});
    $('render').addEventListener('click',render);$('download').addEventListener('click',download);
    $('templateFile').addEventListener('change',function(){importTemplate(this.files[0]);});
    $('restoreTemplate').addEventListener('click',function(){state.panels=E.STUDY_PANELS.map(function(p){return Object.assign({},p);});$('templateStatus').textContent='Default concept artboards · not verified against Printful size-specific template.';invalidate();setStatus('Concept artboards restored.');});
  }
  init();
})();