import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))  # regenerate: python3 tools/make_studio.py studio.html (from this folder)
src = open(os.path.join(HERE, '../../48-plant-archive/studio.html')).read()
s = src
def rep(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, (c, a[:80])
    s = s.replace(a, b)

rep('<title>48 PLANT · Studio</title>', '<title>ORANGUTAN 001 · Studio</title>')
rep("  iframe#grow { position:fixed; left:-2000px; top:0; width:960px; height:540px; border:0; visibility:hidden; }\n",
    "  #bay { position:fixed; inset:0; pointer-events:none; }\n  #bay .m { position:absolute; font-size:10px; letter-spacing:0.08em; line-height:1.3; padding:2px 4px; background:rgba(251,250,247,0.72); border:1px solid rgba(43,42,51,0.4); white-space:nowrap; overflow:hidden; }\n  #bay .m.on { border-color:#ff3d8b; box-shadow:inset 0 0 0 1px #ff3d8b; }\n  #bay .m b { font-weight:700; }\n  #bay.off { display:none; }\n")
rep('<div class="t">MZTV · 48 PLANT · STUDIO</div>', '<div class="t">MZTV · ORANGUTAN 001 · STUDIO</div>')
rep('<div><button id="bPrint">print look: on</button><button id="bWind">wind: on</button><button id="bShot">photograph</button><button id="bHelp">?</button></div>',
    '<div><button id="bPrint">print look: on</button><button id="bWind">wind: on</button><button id="bCrew">crew: off</button><button id="bShot">photograph</button><button id="bHelp">?</button></div>')
rep('<div><b>drag</b> walk around the plant · <b>scroll / pinch</b> step in or out</div>',
    '<div><b>drag</b> walk around the animal · <b>scroll / pinch</b> step in or out</div>')
rep('<div><b>P</b> print look · <b>V</b> wind · <b>C</b> photograph (PNG)</div>',
    '<div><b>P</b> print look · <b>V</b> wind in the coat · <b>C</b> photograph (PNG)</div>\n  <div><b>B</b> the MZCAM crew films it (four drones) · <b>M</b> crew monitors</div>')
rep('<div id="status">GROWING THE SPECIMEN …</div>', '<div id="status">BUILDING THE ANIMAL …</div>')
rep('<div id="flash"></div>\n<script type="module">', '<div id="flash"></div>\n<div id="bay" class="off"></div>\n<script src="../../lib/mzcam.js"></script>\n<script type="module">')
rep("import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\n", "import { createCreature, VERSION } from './creature.js';\n")

# params + where the body comes from
a = s.index("const Q = new URLSearchParams(location.search);")
b = s.index("/* ---------- renderer, studio, light ---------- */")
s = s[:a] + """const Q = new URLSearchParams(location.search);
const SEED = Math.max(1, parseInt(Q.get('seed') || '1', 10) || 1);
const SUBJECT = Q.get('subject') === 'test' ? 'test' : 'orangutan';
const RATE = Math.max(0.1, Math.min(8, +(Q.get('rate') || 1)));
const $ = id => document.getElementById(id);
const status = t => { $('status').textContent = t; $('status').classList.toggle('off', !t); };
$('spec').textContent = SUBJECT === 'test' ? 'TEST SUBJECT · studio check' : `SPECIMEN 001 · ORANGUTAN · seed ${SEED}`;

/* ---------- where the body comes from: built here, from code, every time (no files are loaded) ---------- */
function testSubject() { // neutral lathe form: checks the cyclorama, light, print pass and inspector around a still object
  const g = new THREE.Group(); const prof = [[0, 0], [0.22, 0], [0.24, 0.03], [0.12, 0.1], [0.1, 0.55], [0.2, 0.75], [0.16, 0.95], [0, 1.0]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), new THREE.MeshStandardMaterial({ color: '#9e9b95', roughness: 0.9 })); m.castShadow = m.receiveShadow = true; g.add(m);
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 3), new THREE.MeshStandardMaterial({ color: '#c4520e', roughness: 0.8 })); b.position.set(0.32, 0.11, 0.1); b.castShadow = true; g.add(b);
  return { root: g, update() {}, bounds: () => new THREE.Box3().setFromObject(g), observe: () => null, reset() {}, log: [], metrics: {}, version: 'test' };
}

""" + s[b:]

# shadows recomputed once per frame (the crew renders the scene up to five times)
rep("renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;",
    "renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;")

# wind: plant shader -> coat locks
a = s.index("/* ---------- wind: same gusts as the afterlife")
b = s.index("/* ---------- OBAS print look")
s = s[:a] + """/* ---------- wind: the same gusts as 48 PLANT's afterlife, felt only by the coat's hanging locks (never by the animal's body) ---------- */
const WIND = { on: true, amt: 1 };

""" + s[b:]

# controls
rep("  const goalT = new THREE.Vector3(c.x * 0.4, s.y * 0.5, c.z * 0.4), az = Math.atan2(c.z, c.x) + Math.PI / 2;",
    "  const goalT = new THREE.Vector3(c.x, s.y * 0.5, c.z), az = Math.atan2(c.z, c.x) + Math.PI / 2;")
rep("if (k === 'c') photograph(); if (k === 'h' || k === '?') $('help').classList.toggle('off'); });",
    "if (k === 'c') photograph(); if (k === 'b') toggleCrew(); if (k === 'm') toggleBay(); if (k === 'h' || k === '?') $('help').classList.toggle('off'); });")
rep("canvas.addEventListener('dblclick', e => { if (!PLANT) return;", "canvas.addEventListener('dblclick', e => { if (!SUBJ || CREW.on) return;")
rep("const hit = ray.intersectObject(PLANT, true)[0];", "const hit = ray.intersectObject(SUBJ.root, true)[0];")

# toggles
rep("function toggleWind() { WIND.on = !WIND.on; $('bWind').textContent = 'wind: ' + (WIND.on ? 'on' : 'off'); }",
    "function toggleWind() { WIND.on = !WIND.on; $('bWind').textContent = 'wind: ' + (WIND.on ? 'on' : 'off'); }\nfunction toggleCrew(on) { CREW.on = on === undefined ? !CREW.on : !!on; $('bCrew').textContent = 'crew: ' + (CREW.on ? 'on' : 'off'); controls.enabled = !CREW.on; if (CREW.on) $('help').classList.add('off'); $('bay').classList.toggle('off', !(CREW.on && BAY.on)); for (const m of DRONES) m.visible = CREW.on; }\nfunction toggleBay() { BAY.on = !BAY.on; $('bay').classList.toggle('off', !(CREW.on && BAY.on)); }")
rep("$('bPrint').onclick = togglePrint; $('bWind').onclick = toggleWind;", "$('bPrint').onclick = togglePrint; $('bWind').onclick = toggleWind; $('bCrew').onclick = () => toggleCrew();")
rep("a.download = `48plant-${N}-studio-", "a.download = `orangutan-001-${SUBJECT === 'test' ? 'test' : 's' + SEED}${CREW.on ? '-' + crew.liveDrone.name.replace(' ', '') : ''}-studio-")

# render: program through the live drone's lens when the crew is on, plus the four monitors
a = s.index("function render() {")
b = s.index("let last = performance.now(), windT = 0;")
s = s[:a] + """function render() {
  renderer.shadowMap.needsUpdate = true;
  const cam = CREW.on ? lensCam(crew.liveDrone, PROG, camera.aspect) : camera;
  if (CREW.on) DRONES.forEach((m, i) => { m.visible = i !== crew.live; });
  if (PRINT) { rt.scissorTest = false; rt.viewport.set(0, 0, rt.width, rt.height); renderer.setRenderTarget(rt); renderer.render(scene, cam); if (CREW.on && BAY.on) bay(rt.width, rt.height, true); renderer.setRenderTarget(null); renderer.render(postScene, postCam); }
  else { renderer.setRenderTarget(null); renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight); renderer.render(scene, cam); if (CREW.on && BAY.on) bay(innerWidth, innerHeight, false); }
}

""" + s[b:]

# loop: fixed-step life, moving bounds, crew
rep("  windT += dt; WIND.t.value = windT; WIND.amt.value += ((WIND.on ? 1 : 0) - WIND.amt.value) * Math.min(1, dt * 0.8);",
    "  windT += dt; WIND.amt += ((WIND.on ? 1 : 0) - WIND.amt) * Math.min(1, dt * 0.8);\n  if (SUBJ) { const t0 = performance.now(); SUBJ.update(dt * RATE, windT, { t: windT, amt: WIND.amt }); PERF.sim += performance.now() - t0; BOX = SUBJ.bounds(); }\n  if (CREW.on && SUBJ) crewTick(dt * RATE);")
rep("  walk(dt); controls.update(); render();\n}",
    "  walk(dt); if (!CREW.on) controls.update(); { const t0 = performance.now(); render(); PERF.render += performance.now() - t0; } PERF.frames++; PERF.dt.push(dt); if (PERF.dt.length > 240) PERF.dt.shift(); hud(now);\n}")

# capture mode: frames advance only when asked, by an exact dt (for clean screen captures)
rep("  requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;",
    "  if (!CAPTURE.on) requestAnimationFrame(loop); const dt = CAPTURE.on ? CAPTURE.dt : Math.min(0.1, (now - last) / 1000); last = now;")
rep("let last = performance.now(), windT = 0;", "const CAPTURE = { on: Q.get('capture') === '1', dt: 1 / 30 };\nlet last = performance.now(), windT = 0;")

# load
a = s.index("/* ---------- load the specimen ---------- */")
b = s.index("</script>\n</body>")
s = s[:a] + open(os.path.join(HERE, 'studio_tail.js')).read() + s[b:]
open(sys.argv[1], 'w').write(s)
print('ok', len(src), '->', len(s))
