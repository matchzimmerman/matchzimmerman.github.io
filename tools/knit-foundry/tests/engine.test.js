const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const E=require('../engine.js');
function pixels(w=5,h=5){const data=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let p=4*(y*w+x);let v=(x+y)%4;let rgb=[[0,50,40],[20,130,200],[200,80,120],[252,240,200]][v];data.set([...rgb,255],p);}return {width:w,height:h,data};}
const four=['#003228','#1482c8','#c85078','#fcf0c8'];
test('exactly four distinct valid colors are required',()=>{
 assert.deepEqual(E.validatePalette(four),four);
 assert.throws(()=>E.validatePalette(four.slice(0,3)),/exactly four/);
 assert.throws(()=>E.validatePalette([four[0],four[0],four[2],four[3]]),/different/);
 assert.throws(()=>E.validatePalette(['#12',...four.slice(1)]),/six-digit/);
});
test('palette extraction is deterministic and produces distinct hexes',()=>{
 const a=E.suggestPalette(pixels());const b=E.suggestPalette(pixels());
 assert.deepEqual(a,b);assert.equal(a.length,4);assert.equal(new Set(a).size,4);
 assert.ok(a.every(E.validHex));
});
test('suggestion can snap uniquely to a supplied allowed yarn palette',()=>{
 const available=[...four,'#eeeeee','#777777','#332211'];
 const picked=E.suggestPalette(pixels(80,80),available);
 assert.equal(picked.length,4);assert.equal(new Set(picked).size,4);
 assert.ok(picked.every(x=>available.includes(x)));
});
test('all three layouts generate valid normalized source coordinates',()=>{
 for (const mode of ['wrap','repeat','composed'])for (const panel of E.STUDY_PANELS){
   for(const [u,v] of [[0,0],[.5,.5],[1,1]]){
    const xy=E.sourceUV(panel.key,u,v,mode,.15,2.4,.8);
    assert.equal(xy.length,2);assert.ok(xy.every(z=>z>=0&&z<=1));
   }
 }
});
test('four physical prep panels contain only exact four colors',()=>{
 const source=pixels(30,30);let used=0;
 for(const panel of E.STUDY_PANELS){
 const out=E.renderPanel(source,panel.key,four,'wrap','pixelated',3,0,{width:65,height:80});
 assert.equal(out.data.length,65*80*4);
 assert.equal(out.usage.reduce((a,b)=>a+b,0),65*80);
 const colors=new Set();for(let i=0;i<out.data.length;i+=4){colors.add(E.rgbToHex(Array.from(out.data.slice(i,i+3))));assert.equal(out.data[i+3],255);}
 assert.ok([...colors].every(x=>four.includes(x)));used+=colors.size;
 }
 assert.ok(used>0);
});
test('solid and pixelated modes are distinguishable and reject invalid settings',()=>{
 const a=E.renderPanel(pixels(20,20),'front',four,'wrap','solid',1,0,{width:80,height:80});
 const b=E.renderPanel(pixels(20,20),'front',four,'wrap','pixelated',16,0,{width:80,height:80});
 assert.notDeepEqual(a.data,b.data);
 assert.throws(()=>E.renderPanel(pixels(),'front',four,'bogus','solid',1,0,{width:80,height:80}),/layout/);
 assert.throws(()=>E.renderPanel(pixels(),'front',four,'wrap','solid',1,0,{width:6000,height:80}),/dimensions/);
});
test('manifest cannot incorrectly claim manufacturer ready or publish without explicit validation',()=>{
 const m=E.makeManifest({palette:four,base:four[0],trim:four[2],filename:'painting.jpg',style:'pixelated'});
 assert.equal(m.product.id,860);assert.equal(m.panels.length,4);
 assert.equal(m.production_ready,false);assert.equal(m.approved_for_production,false);
 assert.equal(m.status,'PREPRESS_STUDY_ONLY');assert.ok(m.warnings.length>=4);
 assert.ok(m.printful_configuration_draft.placements.every(p=>p.layers[0].local_filename));
 assert.ok(m.printful_configuration_draft.placements.every(p=>!p.layers[0].url));
 assert.throws(()=>E.makeManifest({palette:four,base:'#ffffff'}),/Base and trim/);
});
test('ZIP archives have recognizable signatures and central directory with valid entries',async()=>{
 const text=new TextEncoder().encode('hello from knit foundry');
 const blob=E.encodeZip([{name:'hello.txt',data:text},{name:'empty.txt',data:new Uint8Array([])}]);
 const b=new Uint8Array(await blob.arrayBuffer());
 assert.deepEqual(Array.from(b.slice(0,4)),[80,75,3,4]);
 assert.deepEqual(Array.from(b.slice(-22,-18)),[80,75,5,6]);
 assert.equal(blob.type,'application/zip');
});
test('host page does not contain remote network or publish paths',()=>{
 const src=fs.readFileSync(require('path').join(__dirname,'../app.js'),'utf8');
 assert.doesNotMatch(src, /fetch\s*\(/);
 assert.doesNotMatch(src, /createOrder|publishProduct|Stripe/);
});