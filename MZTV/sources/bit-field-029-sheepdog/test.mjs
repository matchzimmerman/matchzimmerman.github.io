/* Run with node MZTV/sources/bit-field-029-sheepdog/test.mjs from repository root.
   Prints factual seeded outcomes; intentionally does not assert 100% success. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=fs.readFileSync('MZTV/lib/mzherd.js','utf8');
const sandbox={};vm.runInNewContext(src,sandbox);
const H=sandbox.MZHerd;
assert.equal(H.version,'0.1.1');
let done=0;
for(let seed=1;seed<=20;seed++){
  let world=H.create(seed,16);assert.equal(world.sheep.length,16);
  H.command(world);
  for(let i=0;i<390*30&&!world.result;i++)H.step(world,1/30);
  assert.ok(world.result==='SUCCESS'||world.result==='TIMEOUT');
  for(const s of world.sheep){
    assert.ok(s.p.x>=-107 && s.p.x<=107,'sheep x outside boundary, seed '+seed);
    assert.ok(s.p.z>=-67 && s.p.z<=67,'sheep z outside boundary, seed '+seed);
  }
  if(world.result==='SUCCESS')done++;
  console.log('SEED',seed,world.result,H.state(world).countIn+'/'+world.count,world.t.toFixed(1)+'s');
}
const original=H.create(29);H.command(original);
for(let i=0;i<125;i++)H.step(original,1/30);
const clone=H.restore(H.snapshot(original));
for(let i=0;i<150;i++){H.step(original,1/30);H.step(clone,1/30);}
assert.equal(JSON.stringify(original),JSON.stringify(clone),'snapshot replay drift');
console.log('Summary: '+done+'/20 successful episodes; checkpoint deterministic PASS.');
