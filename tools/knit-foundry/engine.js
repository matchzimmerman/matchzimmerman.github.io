/* MZ KNIT FOUNDRY 002 — dependency-free image-to-knit preparation core.
   Offline conversion only. No Printful API calls, no product publication. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MZKnit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var PRODUCT = Object.freeze({ id: 860, name: 'Unisex Relaxed Fit Knitted Crew Neck Sweater', technique: 'knitting' });
  // STUDY ARTBOARDS ONLY. Replace with Printful-verified per-size printfile dimensions.
  var STUDY_PANELS = Object.freeze([
    Object.freeze({ key: 'front', placement: 'front', width: 1100, height: 1400 }),
    Object.freeze({ key: 'back', placement: 'back', width: 1100, height: 1400 }),
    Object.freeze({ key: 'left_sleeve', placement: 'sleeve_left', width: 600, height: 1400 }),
    Object.freeze({ key: 'right_sleeve', placement: 'sleeve_right', width: 600, height: 1400 })
  ]);
  var TWO_HOUSES = Object.freeze(['#243f33', '#237d96', '#eda6b4', '#eddea4']);
  function validHex(hex) { return typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex.trim()); }
  function normalizeHex(hex) { if (!validHex(hex)) throw new Error('Colors must be six-digit HEX values'); return hex.trim().toLowerCase(); }
  function rgbToHex(c) { return '#' + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join(''); }
  function hexRgb(s) { var n = parseInt(normalizeHex(s).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function validatePalette(colors) {
    if (!Array.isArray(colors) || colors.length !== 4) throw new Error('Select exactly four yarn colors');
    var p = colors.map(normalizeHex);
    if (new Set(p).size !== 4) throw new Error('All four yarn colors must be different');
    return p;
  }
  function srgb(v) { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; }
  function lab(r, g, b) {
    var R = srgb(r), G = srgb(g), B = srgb(b);
    var x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
    var y = (0.2126729 * R + 0.7151522 * G + 0.0721750 * B);
    var z = (0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / 1.08883;
    function f(v) { return v > 0.008856 ? Math.cbrt(v) : (7.787037 * v + 16 / 116); }
    var fx = f(x), fy = f(y), fz = f(z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }
  function labDist(a, b) { var x = a[0] - b[0], y = a[1] - b[1], z = a[2] - b[2]; return x*x + y*y + z*z; }
  function closestColor(rgb, paletteData) {
    var c = lab(rgb[0], rgb[1], rgb[2]), best = 0, dist = Infinity;
    for (var i = 0; i < paletteData.length; i++) {
      var d = labDist(c, paletteData[i].lab);
      if (d < dist) { best = i; dist = d; }
    }
    return best;
  }
  function paletteData(colors) {
    return validatePalette(colors).map(function (hex) { var rgb = hexRgb(hex); return {hex: hex, rgb: rgb, lab: lab(rgb[0], rgb[1], rgb[2])}; });
  }
  // Deterministic reduced histogram + weighted farthest-point seeds, then k-means.
  function suggestPalette(imageData, availableColors) {
    if (!imageData || !imageData.data || !imageData.width || !imageData.height) throw new Error('Image pixels missing');
    var pixels = imageData.data, histogram = new Map();
    var step = Math.max(1, Math.floor((imageData.width * imageData.height) / 18000));
    for (var i = 0; i < imageData.width * imageData.height; i += step) {
      var k = i * 4;
      if (pixels[k + 3] < 128) continue;
      var code = ((pixels[k] >> 3) << 10) | ((pixels[k + 1] >> 3) << 5) | (pixels[k + 2] >> 3);
      var item = histogram.get(code);
      if (item) { item.count++; item.rgb[0] += pixels[k]; item.rgb[1] += pixels[k+1]; item.rgb[2] += pixels[k+2]; }
      else histogram.set(code, {count: 1, rgb: [pixels[k], pixels[k+1], pixels[k+2]]});
    }
    var entries = Array.from(histogram.values()).map(function (e) {
      var rgb = e.rgb.map(function (v) {return v/e.count;});
      return {rgb:rgb,count:e.count,lab:lab(rgb[0],rgb[1],rgb[2])};
    });
    if (!entries.length) throw new Error('Image is entirely transparent');
    entries.sort(function(a,b){return b.count-a.count;});
    var seeds=[entries[0].rgb.slice()];
    while(seeds.length<4){
      var seedLabs=seeds.map(function(c){return lab(c[0],c[1],c[2]);});
      var winner=entries[0], score=-1;
      entries.forEach(function(e){
        var min=Math.min.apply(Math,seedLabs.map(function(s){return labDist(e.lab,s);}));
        var weight=Math.sqrt(e.count)*min;
        if(weight>score){score=weight;winner=e;}
      });
      seeds.push(winner.rgb.slice());
    }
    for(var iter=0;iter<10;iter++){
      var pdata=seeds.map(function(c){return {lab:lab(c[0],c[1],c[2])};});
      var sums=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
      entries.forEach(function(e){var idx=closestColor(e.rgb,pdata),s=sums[idx];s[0]+=e.rgb[0]*e.count;s[1]+=e.rgb[1]*e.count;s[2]+=e.rgb[2]*e.count;s[3]+=e.count;});
      seeds=seeds.map(function(s,i){return sums[i][3]? sums[i].slice(0,3).map(function(v){return v/sums[i][3];}):s;});
    }
    var candidates=seeds.map(rgbToHex);
    if (Array.isArray(availableColors) && availableColors.length >= 4) {
      // Assign unique nearest Printful colors, when caller supplies a verified catalog palette.
      var options=availableColors.map(function(v){return typeof v==='string' ? v:v.hex;}).filter(validHex);
      var pool=options.map(function(hex){return {hex:normalizeHex(hex),lab:(function(){var c=hexRgb(hex);return lab(c[0],c[1],c[2]);})()};});
      var used=new Set();
      return candidates.map(function(hex){
        var c=hexRgb(hex),cl=lab(c[0],c[1],c[2]), chosen=null,dist=Infinity;
        pool.forEach(function(option){var d=labDist(cl,option.lab);if(!used.has(option.hex) && d<dist){dist=d;chosen=option.hex;}});
        if (!chosen) throw new Error('Verified yarn palette contains fewer than 4 distinct colors');
        used.add(chosen);return chosen;
      });
    }
    // avoid duplicate colors produced by closely related image clusters.
    var seen=new Set();
    return candidates.map(function(hex,i){if (!seen.has(hex)) {seen.add(hex);return hex;} var c=hexRgb(hex); for(var n=1;n<60;n++){var other=rgbToHex(c.map(function(v,j){return v+(j===i%3?n:-n);}));if(!seen.has(other)){seen.add(other);return other;}} return hex;});
  }
  function wrap01(v) { return ((v % 1) + 1) % 1; }
  function sourceUV(panel, u, v, mode, seam, srcAspect, panelAspect) {
    seam = Number.isFinite(seam) ? seam : 0;
    if (mode==='repeat') {
      var start={front:0,back:0.32,left_sleeve:0.64,right_sleeve:0.16}[panel]||0;
      return [wrap01(u * 2.3 + start + seam),wrap01(v * 1.65)];
    }
    if (mode==='composed') {
      var cx={front:0.50,back:0.86,left_sleeve:0.12,right_sleeve:0.61}[panel]||0.5;
      var span=Math.min(0.8,Math.max(0.18,panelAspect/srcAspect));
      return [wrap01(cx-seam*0.4+(u-0.5)*span),Math.max(0,Math.min(1,v))];
    }
    // Continuous-wrap: front and back occupy adjacent halves of a panorama.
    // Sleeves borrow narrow adjacent strips; they are conceptual, not exact cut contours.
    var base={front:0,back:0.5,left_sleeve:0.06,right_sleeve:0.47}[panel]||0;
    var scale=(panel==='front'||panel==='back')?0.5:0.20;
    return [wrap01(base+u*scale+seam),Math.max(0,Math.min(1,v))];
  }
  function renderPanel(imageData, panel, colors, mode, style, pixelSize, seam, dimensions) {
    if (!['wrap','repeat','composed'].includes(mode)) throw new Error('Unknown layout mode');
    if (!['pixelated','solid'].includes(style)) throw new Error('Unknown reduction mode');
    var pdata=paletteData(colors), w=dimensions.width|0,h=dimensions.height|0;
    if(w<64||h<64||w>5000||h>5000||w*h>12000000)throw new Error('Panel dimensions out of supported range');
    var output=new Uint8ClampedArray(w*h*4);
    var src=imageData.data,srcW=imageData.width,srcH=imageData.height;
    var cell=style==='pixelated'?Math.max(2,Number(pixelSize)||8):1;
    cell=Math.max(1,Math.min(128,Math.round(cell)));
    var usage=[0,0,0,0], colorCache=new Map();
    var sample=(function(){
      return function(u,v){var xy=sourceUV(panel,u,v,mode,seam,srcW/srcH,w/h),x=Math.min(srcW-1,Math.floor(xy[0]*srcW)),y=Math.min(srcH-1,Math.floor(xy[1]*srcH));var p=4*(y*srcW+x);return [src[p],src[p+1],src[p+2]];};
    })();
    for(var yy=0;yy<h;yy+=cell){
      for(var xx=0;xx<w;xx+=cell){
        var rgb=sample((xx+Math.min(cell,w-xx)/2)/w,(yy+Math.min(cell,h-yy)/2)/h);
        var key=((rgb[0]>>3)<<10)|((rgb[1]>>3)<<5)|(rgb[2]>>3);
        var idx=colorCache.get(key);
        if (idx===undefined) {idx=closestColor(rgb,pdata);colorCache.set(key,idx);}
        var chosen=pdata[idx].rgb;
        for(var y=yy;y<Math.min(h,yy+cell);y++)for(var x=xx;x<Math.min(w,xx+cell);x++){
          var pos=4*(y*w+x);output[pos]=chosen[0];output[pos+1]=chosen[1];output[pos+2]=chosen[2];output[pos+3]=255;usage[idx]++;
        }
      }
    }
    return {width:w,height:h,data:output,usage:usage};
  }
  function makeManifest(args) {
    var colors=validatePalette(args.palette);
    var panels=args.panels||STUDY_PANELS;
    if (!Array.isArray(panels)||!panels.length)throw new Error('No panels');
    var base=normalizeHex(args.base||colors[0]),trim=normalizeHex(args.trim||colors[0]);
    if(!colors.includes(base)||!colors.includes(trim))throw new Error('Base and trim must be among the four yarn colors');
    var validated=Boolean(args.officialTemplateVerified && args.officialYarnsVerified && args.variantVerified);
    return {
      schema:'mz.knit-foundry.v002',created_at:new Date().toISOString(),source_filename:args.filename||'unknown',
      product:PRODUCT,layout_mode:args.layout||'wrap',color_reduction_mode:args.style||'pixelated',
      yarn_colors:colors,base_color:base,trim_color:trim,
      panels:panels.map(function(p){return {key:p.key,printful_placement:p.placement,filename:p.key+'.png',width_px:p.width,height_px:p.height};}),
      printful_configuration_draft:{
        product_options:[{name:'base_color',value:base},{name:'trim_color',value:trim},{name:'color_reduction_mode',value:args.style||'pixelated'}],
        placements:panels.map(function(p){return {placement:p.placement,technique:'knitting',layers:[{type:'file',local_filename:p.key+'.png',layer_options:[{name:'yarn_colors',value:colors}]}]};})
      },
      status:'PREPRESS_STUDY_ONLY',production_ready:false,
      checks:{official_template_dimensions_verified:!!args.officialTemplateVerified,official_yarns_verified:!!args.officialYarnsVerified,variant_and_size_placement_verified:!!args.variantVerified,official_printful_mockup_approved:false},
      warnings:[
        'These rectangular artboards are prep studies, not verified Printful knitting pattern templates.',
        'Exact per-size printfile dimensions, safe zones and placement shapes require current Printful catalog/template confirmation.',
        'The four HEX values must be mapped to four actual allowed yarn options for product 860 before ordering.',
        'A local_filename is not a hosted file URL. The configuration draft is NOT a valid submit-ready order payload.',
        'Do not publish a listing or submit an order without official Printful mockup and size-specific review.'
      ],
      proposed_technical_validation_complete:validated,
      approved_for_production:false
    };
  }
  function crc32(buffer) {
    var table=crc32.table;
    if (!table) { table=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);table[n]=c>>>0;}crc32.table=table; }
    var crc=0xffffffff;
    for(var i=0;i<buffer.length;i++)crc=table[(crc^buffer[i])&255]^(crc>>>8);
    return (crc^0xffffffff)>>>0;
  }
  function encodeZip(entries) {
    // ZIP stored mode, no compression; compatible with standard unzip tools.
    var enc=new TextEncoder(), parts=[], center=[], offset=0;
    function u16(v){return [v&255,(v>>>8)&255];}function u32(v){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];}
    entries.forEach(function(e){
      var name=enc.encode(e.name),data=e.data instanceof Uint8Array?e.data:new Uint8Array(e.data),crc=crc32(data);
      if(name.length>65535||data.length>0xffffffff)throw new Error('ZIP entry too large');
      var local=new Uint8Array([80,75,3,4,20,0,0,0,0,0,0,0,0,0].concat(u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0)));
      parts.push(local,name,data);
      var record=new Uint8Array([80,75,1,2,20,0,20,0,0,0,0,0,0,0,0,0].concat(u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset)));
      center.push(record,name);offset+=local.length+name.length+data.length;
    });
    var centerSize=center.reduce(function(s,p){return s+p.length;},0);
    var footer=new Uint8Array([80,75,5,6,0,0,0,0].concat(u16(entries.length),u16(entries.length),u32(centerSize),u32(offset),u16(0)));
    return new Blob(parts.concat(center,[footer]),{type:'application/zip'});
  }
  return {PRODUCT:PRODUCT,STUDY_PANELS:STUDY_PANELS,TWO_HOUSES:TWO_HOUSES,validHex:validHex,validatePalette:validatePalette,
    hexRgb:hexRgb,rgbToHex:rgbToHex,suggestPalette:suggestPalette,sourceUV:sourceUV,renderPanel:renderPanel,
    makeManifest:makeManifest,encodeZip:encodeZip,crc32:crc32};
});