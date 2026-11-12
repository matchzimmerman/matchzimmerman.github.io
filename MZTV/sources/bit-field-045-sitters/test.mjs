// Headless check for BIT FIELD 045 · SITTERS.
// node test.mjs [port] — expects a static server at the repo root (python3 -m http.server 8045), so ../../lib/mzcam.js and ../bit-field-030-sitter/data resolve.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const port = process.argv[2] || 8045;
const base = `http://localhost:${port}/MZTV/sources/bit-field-045-sitters/`;
const out = process.env.OUT || '/tmp/bf045';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.setDefaultTimeout(240000);
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push(String(e)));
const shot = async (n) => page.screenshot({ path: `${out}/${n}.png` });
const q = process.env.Q || '?fresh=1&audio=0';
await page.goto(base + q);
for (const s of [1, 3, 8]) { await page.waitForTimeout(s === 1 ? 1000 : s === 3 ? 2000 : 5000); await shot('t' + s); }
const st = () => page.evaluate(() => { const S = MZ.state(); return { t: Math.round(S.t), k: S.k, j: S.j, person: S.person, shelf: S.shelfNo, filled: S.shelf.filter(Boolean).length, archived: S.shelves.length, detail: +S.detailNow.toFixed(2), event: S.event, fps: Math.round(MZ.fr().fps) }; });
console.log('state', JSON.stringify(await st()));
for (const op of (process.env.OPS || 'place,fill,place,look').split(',')) {
  await page.evaluate(o => MZ.force(o), op); await page.waitForTimeout(op === 'place' ? 2600 : 1500); await shot('op-' + op + '-' + (Date.now() % 1000));
  console.log(op, JSON.stringify(await st()));
}
await page.waitForTimeout(6000); await shot('settled');
await page.evaluate(() => MZ.force('nan')); await page.waitForTimeout(1500);
console.log('after nan', JSON.stringify(await st()));
console.log('errors', errs.length ? errs.slice(0, 6) : 'none');
await browser.close();
