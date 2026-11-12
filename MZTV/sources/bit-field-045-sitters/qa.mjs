// QA after every build: turntable contact sheets of a cast of characters + the numeric clipping check.
// python3 -m http.server 8045 at the repo root, then: node qa.mjs [n] [seed]   (COVER=1 → one sitter per trait value instead of a random cast) → /tmp/bf045-qa/sheet-*.png and a clipping table
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const n = +(process.argv[2] || 8), seed = +(process.argv[3] || 7), out = process.env.OUT || '/tmp/bf045-qa';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } }); page.setDefaultTimeout(1500000);
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(`http://localhost:${process.env.PORT || 8045}/MZTV/sources/bit-field-045-sitters/?fresh=1&audio=0&lines=180&lite=0.05&warm=0`);
await page.waitForFunction(() => window.MZ && MZ.qa && MZ.fr().n > 2);
const res = await page.evaluate(([n, seed, process_cover]) => {
  const cast = process_cover ? MZ.qa.coverage(seed) : MZ.qa.cast(n, seed), rows = cast.map((c, i) => ({ i: i + 1, label: c.label, clip: MZ.qa.clip(c.g) }));
  const sheets = []; for (let i = 0; i < cast.length; i += 4) sheets.push(MZ.qa.sheet(cast.slice(i, i + 4)));
  return { rows, sheets };
}, [n, seed, process.env.COVER === '1']);
res.sheets.forEach((d, i) => fs.writeFileSync(`${out}/sheet-${i + 1}.png`, Buffer.from(d.split(',')[1], 'base64')));
let bad = 0;
for (const r of res.rows) { const c = r.clip; if (c.max > 0.02) bad++;
  console.log(`${String(r.i).padStart(2)} clip ${String(c.n).padStart(4)} verts · max ${c.max.toFixed(3)} · front ${c.sectors.front} side ${c.sectors.side} back ${c.sectors.back} · ${JSON.stringify(c.meshes)} · ${r.label}`); }
console.log(`${bad} of ${res.rows.length} sitters clip deeper than 0.02 · sheets in ${out} · errors ${errs.length ? errs.slice(0, 4) : 'none'}`);
await browser.close();
