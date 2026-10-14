// Headless check for BIT FIELD 030 · SITTER.
// node test.mjs [port]  — expects a static server at the repo root (python3 -m http.server 8031), so ../../lib/mzcam.js resolves.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const port = process.argv[2] || 8031;
const base = `http://localhost:${port}/MZTV/sources/bit-field-030-sitter/`;
const out = process.env.OUT || '/tmp/bf030';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.setDefaultTimeout(120000);
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push(String(e)));
const shot = async (n) => page.screenshot({ path: `${out}/${n}.png` });
const q = process.env.Q || '?fresh=1&audio=0&lite=0.1';
await page.goto(base + q);
for (const s of [1, 3, 8]) { await page.waitForTimeout(s === 1 ? 1000 : s === 3 ? 2000 : 5000); await shot('t' + s); }
const st = await page.evaluate(() => { const S = MZ.state(); return { k: S.k, t: S.t, event: S.event, look: S.look, arch: S.archive.length }; });
console.log('state', JSON.stringify(st));
for (const op of (process.env.OPS || 'sit,look,look,look,composite,caricature,split,return').split(',')) {
  await page.evaluate(o => MZ.force(o), op); await page.waitForTimeout(op === 'look' ? 400 : 8500); await shot('op-' + op + '-' + Date.now() % 1000);
  console.log(op, await page.evaluate(() => MZ.state().event));
}
await page.evaluate(() => MZ.force('nan')); await page.waitForTimeout(1500);
console.log('after nan', await page.evaluate(() => MZ.state().event));
console.log('errors', errs.length ? errs.slice(0, 5) : 'none');
await browser.close();
