// Long-run check after every build: fast-forward 1, 6 and 24 hours and look for drift the short tests can't see.
// python3 -m http.server 8045 at the repo root, then: node soak.mjs [seed]
// Fails (exit 1) if sitters stop finishing, NaN appears, unlocks don't arrive, or the population collapses into one character.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const seed = +(process.argv[2] || 45), port = process.env.PORT || 8045;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } }); page.setDefaultTimeout(300000);
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
let fail = [];
for (const ff of [1, 6, 24]) {
  await page.goto(`http://localhost:${port}/MZTV/sources/bit-field-045-sitters/?fresh=1&audio=0&lite=0.2&ff=${ff}&seed=${seed}`);
  await page.waitForFunction(() => window.MZ && MZ.state() && MZ.fr().n > 5); await page.waitForTimeout(3000);
  const r = await page.evaluate(() => { const S = MZ.state(), all = S.shelves.flatMap(s => s.members).concat(S.shelf).filter(Boolean);
    const recent = all.slice(-27), txt = recent.map(m => traitText(m.g)), uniq = new Set(txt), freq = {};
    for (const t of txt) freq[t] = (freq[t] || 0) + 1; const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0] || ['', 0];
    const fam = k => new Set(recent.map(m => m.g.t && m.g.t[k])).size;
    return { h: +(S.t / 3600).toFixed(1), sitters: all.length, shelf: S.shelfNo, archived: S.shelves.length, unfinished: all.filter(m => m.d < 0.95).length,
      counts: S.counts, distinct: uniq.size + '/' + recent.length, topShare: +(top[1] / Math.max(1, recent.length)).toFixed(2), top: top[0],
      styles: fam('st'), colours: fam('hc'), beards: fam('bd'), glasses: fam('gl'), necks: fam('nk'), nan: !all.every(m => m.g.L.every(Number.isFinite) && m.g.R.every(Number.isFinite)) }; });
  console.log('ff', ff, JSON.stringify(r));
  await page.screenshot({ path: `/tmp/bf045-soak-${ff}.png` });
  if (r.nan) fail.push(ff + 'h NaN');
  if (r.unfinished > r.sitters * 0.5) fail.push(ff + 'h most sitters unfinished');
  if (r.sitters >= 9 && r.topShare > 0.25) fail.push(ff + 'h population collapsing: ' + r.top + ' is ' + Math.round(r.topShare * 100) + '% of recent sitters');
  if (r.sitters >= 9 && (r.styles < 4 || r.colours < 4)) fail.push(ff + 'h too little variety in hair');
  if (ff >= 24 && (!r.counts.lineage || !r.counts.caricatures || !r.counts.splits)) fail.push('24h unlocks missing');
}
if (errs.length) fail.push('console errors: ' + errs.slice(0, 3).join(' | '));
console.log(fail.length ? 'SOAK FAIL\n  ' + fail.join('\n  ') : 'SOAK OK'); await browser.close(); process.exit(fail.length ? 1 : 0);
