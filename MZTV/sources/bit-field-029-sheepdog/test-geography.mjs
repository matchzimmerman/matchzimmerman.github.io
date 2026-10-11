/* Regression: node MZTV/sources/bit-field-029-sheepdog/test-geography.mjs
   Paths relative to repo root. Keeps mapped geography distinct from authored gameplay. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const load=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const elev=load('MZTV/worlds/galway/farmstead_eudem25m.json');
const osm=load('MZTV/worlds/galway/farmstead_osm_local.json');
const selected=load('MZTV/worlds/galway/sheepdog_farmstead_site_001.json');
const context={};
vm.runInNewContext(fs.readFileSync('MZTV/lib/mzgeo-galway.js','utf8'),context);
const G=context.MZGeo.create(elev,osm);
assert.equal(elev.samples_m.length,elev.columns*elev.rows);
assert.equal(elev.columns*elev.rows,483);
assert.equal(elev.null_count,0);
assert.ok(elev.samples_m.every(h=>Number.isFinite(h)&&h>0&&h<500),'unexpected elevation value');
const anchorLocalX=selected.anchor_itm_easting_northing[0]-506160;
const anchorLocalZ=selected.anchor_itm_easting_northing[1]-722560;
const sampled=G.absoluteHeight(anchorLocalX,anchorLocalZ);
assert.ok(Math.abs(sampled-elev.anchor_query_elevation_m)<1.0,'anchor transform mismatch');
assert.equal(G.roads.length,4);
assert.equal(G.buildings.length,22);
for(const id of ['1163118488','1163356661','1163356662','1163356663'])assert.ok(G.buildings.some(b=>b.id===id),'missing user-selected building '+id);
for(const [x,z] of [[-108,-68],[108,68],[0,0],[115,-100]])assert.ok(Number.isFinite(G.height(x,z)));
assert.ok(!('fence' in osm.geometry),'mapped vs authored fence conflated');
console.log('PASS: 483 EU-DEM samples, '+sampled.toFixed(2)+'m interpolated anchor, '+G.buildings.length+' OSM buildings, '+G.roads.length+' roads, mapped boundary separation.');
