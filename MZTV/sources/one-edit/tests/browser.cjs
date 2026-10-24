// Run with Playwright installed: node tests/browser.cjs
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 await page.route('https://one-edit.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
 const load=async(seed=42)=>page.goto(`https://one-edit.test/?capture=1&seed=${seed}`);
 const advance=n=>page.evaluate(n=>MZ.advance(n),n),snapshot=()=>page.evaluate(()=>MZ.snapshot());
 const select=async(side='edit')=>{await page.focus(`#${side}Field`);await page.keyboard.press('Enter');};
 await load();assert(await page.locator('#intervene').isDisabled());
 await select('control');await page.keyboard.press('ArrowRight');assert.match(await page.locator('#cellInspector').innerText(),/CELL 002/);
 await advance(30);let r=await snapshot();assert.deepEqual(r.control,r.intervention);
 await select();await page.locator('#intervene').click();await advance(160);r=await snapshot();
 for(const key of ['inheritance','pale','red','growth'])assert(r.observations.some(o=>o.key===key),key);
 for(const c of r.intervention.filter(c=>c.changed&&c.id!==c.ancestor))assert.equal(c.genome,r.intervention.find(m=>m.id===c.parent).genome);
 await page.locator('#observations button').first().click();assert.match(await page.locator('#cellInspector').innerText(),/RIGHT/);
 await page.locator('[data-food="abundant"]').click();await advance(180);r=await snapshot();
 const env=r.observations.find(o=>o.key.startsWith('environment-'));assert(env);assert.equal(env.evidence.genome,'disrupted');assert(env.evidence.before>env.evidence.pigment);
 const dp=page.waitForEvent('download');await page.locator('#export').click();const d=await dp;const exported=JSON.parse(fs.readFileSync(await d.path(),'utf8'));assert(exported.cells.intervention.length>13);assert(exported.observations.length);assert.equal(exported.initialAdenine,'limited');
 await page.locator('#restore').click();await page.locator('[data-food="limited"]').click();await advance(80);await select();await page.locator('#intervene').click();await advance(180);r=await snapshot();assert(r.observations.some(o=>o.key==='restored'));assert(r.control.every(c=>c.genome==='disrupted'));
 await load();await page.locator('[data-food="abundant"]').click();await select();await page.locator('#intervene').click();await advance(180);r=await snapshot();assert(!r.observations.some(o=>o.key.startsWith('environment-')));
 await page.locator('[data-food="starved"]').click();await advance(600);r=await snapshot();assert(!r.observations.some(o=>o.key==='red'));
 await load();await advance(1800);r=await snapshot();assert.equal(r.control.length,760);assert(r.observations.some(o=>o.key==='capacity-A'));assert.deepEqual(r.control,r.intervention);
 const run=async()=>{await load(314);await advance(20);await select();await page.locator('#intervene').click();await advance(120);return snapshot();};assert.deepEqual(await run(),await run());
 let failedSeed;for(let seed=0;seed<2000;seed++){let a=(seed^0x9E3779B9)>>>0,miss=true;for(let i=0;i<4;i++){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);if(((t^(t>>>14))>>>0)/4294967296<.76)miss=false;}if(miss){failedSeed=seed;break;}}
 assert.notEqual(failedSeed,undefined);await load(failedSeed);await page.locator('[data-reach="4"]').click();await select();await page.locator('#intervene').click();await advance(100);r=await snapshot();assert.equal(r.event.successes,0);assert(r.observations.some(o=>o.key==='no-change'));assert(!r.observations.some(o=>o.key==='inheritance'));
 await page.goto('https://one-edit.test/?seed=42');await page.waitForTimeout(350);assert.notEqual(await page.locator('#elapsed').innerText(),'000 BEATS');await page.locator('#pause').click();const beat=await page.locator('#elapsed').innerText();await page.waitForTimeout(200);assert.equal(await page.locator('#elapsed').innerText(),beat);await page.locator('#audio').click();assert.equal(await page.locator('#audio').getAttribute('aria-pressed'),'true');await page.locator('#audio').click();await page.locator('#pause').click();await page.waitForTimeout(150);assert.notEqual(await page.locator('#elapsed').innerText(),beat);
 await page.screenshot({path:'/tmp/one-edit-desktop.png',fullPage:true});
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`);}
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const touch=await mobile.newPage();await touch.route('https://one-edit.test/**',r=>r.fulfill({contentType:'text/html',body:html}));await touch.goto('https://one-edit.test/?capture=1&seed=42');await touch.locator('#editField').tap();assert.match(await touch.locator('#cellInspector').innerText(),/RIGHT/);await touch.locator('#intervene').tap();assert(await touch.locator('#intervene').isDisabled());await touch.screenshot({path:'/tmp/one-edit-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: matched fields, disruption, restoration, inheritance, same-cell environment evidence, scarce adenine, capacity, deterministic replay, no-change pulse, keyboard, touch, export, frame loop, audio toggle, responsive widths.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
