import sys
src = open(sys.argv[1]).read(); s = src
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (c, a[:100]); s = s.replace(a, b)
def cut(a, b, new=''):
    global s
    i = s.index(a); j = s.index(b, i); s = s[:i] + new + s[j:]

rep('<title>ORANGUTAN 001 · Studio</title>', '<title>ORANGUTAN 001 · PHOTOREAL · Studio</title>')
rep("canvas#view { position:fixed; inset:0; width:100vw; height:100vh; display:block; touch-action:none; image-rendering:pixelated; }",
    "canvas#view { position:fixed; inset:0; width:100vw; height:100vh; display:block; touch-action:none; }")
rep('<div class="t">MZTV · ORANGUTAN 001 · STUDIO</div>', '<div class="t">MZTV · ORANGUTAN 001 · PHOTOREAL · STUDIO</div>')
rep('<button id="bPrint">print look: on</button>', '<button id="bPrint">depth of field: on</button>')
rep('<div><b>P</b> print look · <b>V</b> wind in the coat · <b>C</b> photograph (PNG)</div>',
    '<div><b>P</b> depth of field · <b>V</b> wind in the coat · <b>C</b> photograph (PNG)</div>\n  <div><b>[ ]</b> aperture · <b>- =</b> focal length</div>')
rep('<div id="status">BUILDING THE ANIMAL …</div>', '<div id="status">BUILDING THE ANIMAL FROM ITS CODE …</div>')
rep("""import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCreature, VERSION } from './creature.js';""",
"""import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { createBrain, VERSION } from './brain.js';
import { createBody, BODY_VERSION } from './body.js';""")
rep("const RATE = Math.max(0.1, Math.min(8, +(Q.get('rate') || 1)));",
    "const RATE = Math.max(0.1, Math.min(8, +(Q.get('rate') || 1)));\nconst HAIR = Math.max(0, Math.min(400000, parseInt(Q.get('hair') || '120000', 10)));\nconst AO = Q.get('ao') !== '0';")
rep("$('spec').textContent = SUBJECT === 'test' ? 'TEST SUBJECT · studio check' : `SPECIMEN 001 · ORANGUTAN · seed ${SEED}`;",
    "$('spec').textContent = SUBJECT === 'test' ? 'TEST SUBJECT · studio check' : `SPECIMEN 001 · ORANGUTAN · PHOTOREAL · seed ${SEED}`;")

# renderer: physically based output
rep("""const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));""",
"""const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
const PR = Math.max(0.5, Math.min(2, +(Q.get('pr') || Math.min(devicePixelRatio, 1.25))));
renderer.setPixelRatio(PR);""")
rep("renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;",
    "renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = +(Q.get('exposure') || 1.0);")
rep("const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 60);", "const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 60);\nconst SENSOR_H = 0.024; // a full-frame 36 × 24 mm sensor: focal length (mm) <-> vertical field of view\nconst fovFor = mm => THREE.MathUtils.radToDeg(2 * Math.atan(SENSOR_H * 500 / mm)), mmFor = fov => SENSOR_H * 500 / Math.tan(THREE.MathUtils.degToRad(fov) / 2);")
# cyc materials: no emissive cheat now that light is physical; a real white studio paper
rep("const m = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.95, metalness: 0, side: THREE.BackSide, emissive: '#ebe9e3', emissiveIntensity: 0.62 });",
    "const m = new THREE.MeshStandardMaterial({ color: '#efede8', roughness: 0.92, metalness: 0, side: THREE.BackSide, emissive: '#ebe9e3', emissiveIntensity: 0.18 });")
rep("new THREE.MeshStandardMaterial({ color: '#f6f5f1', roughness: 0.92, emissive: '#ebe9e3', emissiveIntensity: 0.35 })",
    "new THREE.MeshStandardMaterial({ color: '#eeece7', roughness: 0.88, emissive: '#ebe9e3', emissiveIntensity: 0.08 })")
rep("scene.add(new THREE.HemisphereLight('#ffffff', '#cfc9bd', 1.25));",
    """const hemi = new THREE.HemisphereLight('#ffffff', '#cfc9bd', 0.45); scene.add(hemi);
// image-based light: prebuilt studio environment (MZ.Human 2026-11-22: lighting may be prebuilt, the animal may not).
// Default: three's RoomEnvironment (a generated softbox room). ?hdri=<url to a .hdr> swaps in a licensed HDRI for light and reflections only.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = +(Q.get('env') || 0.55);
if (Q.get('hdri')) new RGBELoader().load(Q.get('hdri'), t => { t.mapping = THREE.EquirectangularReflectionMapping; scene.environment = pmrem.fromEquirectangular(t).texture; t.dispose(); }, undefined, e => console.warn('hdri failed', e));""")
rep("key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.blurSamples = 16; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01;",
    "key.shadow.mapSize.set(4096, 4096); key.shadow.radius = 3; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.006;")
rep("Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 14 });",
    "Object.assign(key.shadow.camera, { left: -1.3, right: 1.3, top: 1.3, bottom: -1.3, near: 2, far: 10 }); key.shadow.camera.updateProjectionMatrix();\nconst KEY_DIR = new THREE.Vector3(-0.4, 0.85, 0.35).normalize(); // the shadow frustum follows the animal, so the coat's shadows stay sharp")
rep("const WIND = { on: true, amt: 1 };", "const WIND = { on: true, amt: 1 };")

# the print pass -> a photographic pipeline
cut("/* ---------- OBAS print look", "/* ---------- controls:", """/* ---------- the photographic pipeline: linear HDR, ambient occlusion, depth of field from a real lens, AgX, a little grain ---------- */
// DOF reads the depth of the beauty render (so the coat, which has its own shader, is in it). Thin-lens circle of confusion.
let DOF = Q.get('dof') !== '0', FSTOP = +(Q.get('f') || 2.8), FOCUS = 2;
let BEAUTY = null;
class BeautyPass extends RenderPass { render(r, w, read, dt, m) { BEAUTY = read; super.render(r, w, read, dt, m); } }
class DofPass extends Pass {
  constructor() { super(); this.u = { tColor: { value: null }, tDepth: { value: null }, uNear: { value: 0.01 }, uFar: { value: 60 }, uFocus: { value: 2 }, uF: { value: 0.042 }, uN: { value: 2.8 }, uRes: { value: new THREE.Vector2(1, 1) }, uSensor: { value: SENSOR_H } };
    this.q = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: this.u, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `precision highp float; varying vec2 v; uniform sampler2D tColor, tDepth; uniform float uNear, uFar, uFocus, uF, uN, uSensor; uniform vec2 uRes;
        float lin(float d){ return uNear * uFar / (uFar - d * (uFar - uNear)); }
        float coc(float z){ float c = (uF * uF / uN) * abs(z - uFocus) / (z * max(uFocus - uF, 1e-3)); return min(c / uSensor * uRes.y, 16.0); }
        void main(){ float zc = lin(texture2D(tDepth, v).x), cc = coc(zc); vec4 acc = vec4(texture2D(tColor, v).rgb, 1.0);
          if (cc > 0.6) { for (int i = 1; i < 48; i++) { float r = sqrt(float(i) / 48.0) * cc, a = float(i) * 2.39996;
              vec2 o = vec2(cos(a), sin(a)) * r / uRes; float zs = lin(texture2D(tDepth, v + o).x), cs = coc(zs);
              float w = zs > zc ? smoothstep(r - 1.0, r, min(cs, cc)) : smoothstep(r - 1.0, r, cs);
              acc += vec4(texture2D(tColor, v + o).rgb, 1.0) * w; } }
          gl_FragColor = vec4(acc.rgb / acc.a, 1.0); }` })); }
  render(r, w, read) { this.u.tColor.value = read.texture; this.u.tDepth.value = BEAUTY.depthTexture; this.u.uRes.value.set(read.width, read.height); r.setRenderTarget(this.renderToScreen ? null : w); this.q.render(r); }
}
const GrainPass = class extends Pass { // film grain + a soft vignette, applied after the tone curve
  constructor() { super(); this.u = { tColor: { value: null }, uT: { value: 0 }, uAmt: { value: +(Q.get('grain') || 0.018) } };
    this.q = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: this.u, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `precision highp float; varying vec2 v; uniform sampler2D tColor; uniform float uT, uAmt;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uT) * 43758.5453); }
        void main(){ vec3 c = texture2D(tColor, v).rgb; float g = (h(gl_FragCoord.xy) + h(gl_FragCoord.xy + 17.0) - 1.0) * uAmt;
          float vg = 1.0 - 0.18 * pow(length(v - 0.5) * 1.35, 2.5); gl_FragColor = vec4(c * vg + g, 1.0); }` })); }
  render(r, w, read) { this.u.tColor.value = read.texture; this.u.uT.value = (this.u.uT.value + 0.618) % 100; r.setRenderTarget(this.renderToScreen ? null : w); this.q.render(r); }
};
const RT = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, samples: +(Q.get('msaa') ?? 4), depthTexture: new THREE.DepthTexture(16, 16, THREE.UnsignedIntType) });
const composer = new EffectComposer(renderer, RT);
composer.renderTarget2.depthTexture = new THREE.DepthTexture(16, 16, THREE.UnsignedIntType); // its own depth (a clone would share the beauty's and overwrite it)
const beauty = new BeautyPass(scene, camera); composer.addPass(beauty);
const gtao = new GTAOPass(scene, camera, 16, 16); gtao.blendIntensity = 0.85; gtao.updateGtaoMaterial({ radius: 0.12, distanceExponent: 1.4, thickness: 1.2, scale: 1.0 }); gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6 }); gtao.enabled = AO; composer.addPass(gtao);
const dof = new DofPass(); dof.enabled = DOF; composer.addPass(dof);
composer.addPass(new OutputPass());
const grain = new GrainPass(); composer.addPass(grain);
let PRINT = false; // kept so the 48PLANT plumbing below still reads; there is no print pass in this fork

""")
rep("function togglePrint() { PRINT = !PRINT; $('bPrint').textContent = 'print look: ' + (PRINT ? 'on' : 'off'); canvas.style.imageRendering = PRINT ? 'pixelated' : 'auto'; resize(); }",
    "function togglePrint() { DOF = !DOF; dof.enabled = DOF; $('bPrint').textContent = 'depth of field: ' + (DOF ? 'on' : 'off'); }")
rep("if (!PRINT) { $('bPrint').textContent = 'print look: off'; canvas.style.imageRendering = 'auto'; }",
    "if (!DOF) $('bPrint').textContent = 'depth of field: off';\naddEventListener('keydown', e => { const k = e.key; if (k === '[') FSTOP = Math.min(22, FSTOP * 1.414); if (k === ']') FSTOP = Math.max(1.4, FSTOP / 1.414);\n  if (k === '-' || k === '=') { const mm = Math.max(18, Math.min(200, mmFor(camera.fov) * (k === '=' ? 1.25 : 0.8))); camera.fov = fovFor(mm); camera.updateProjectionMatrix(); } });")
rep("""  if (PRINT) { const big = document.createElement('canvas'); const k = Math.max(1, Math.round(1920 / rt.width)); big.width = rt.width * k; big.height = rt.height * k; const g = big.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(canvas, 0, 0, big.width, big.height); a.href = big.toDataURL('image/png'); }
  else a.href = canvas.toDataURL('image/png');""", "  a.href = canvas.toDataURL('image/png');")
rep("orangutan-001-${SUBJECT === 'test' ? 'test' : 's' + SEED}", "orangutan-001-photoreal-${SUBJECT === 'test' ? 'test' : 's' + SEED}")
# resize + render
cut("function resize() {", "addEventListener('resize', resize); resize();", """function resize() {
  const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setPixelRatio(PR); renderer.setSize(w, h, false); composer.setPixelRatio(PR); composer.setSize(w, h); gtao.setSize(Math.round(w * PR), Math.round(h * PR));
}
""")
cut("function render() {", "const CAPTURE =", """const _c = new THREE.Vector3(), _res = new THREE.Vector2();
function render() {
  renderer.shadowMap.needsUpdate = true;
  const cam = CREW.on ? lensCam(crew.liveDrone, PROG, camera.aspect) : camera;
  if (CREW.on) DRONES.forEach((m, i) => { m.visible = i !== crew.live; });
  // key light and its shadow frustum ride with the animal
  BOX.getCenter(_c); key.target.position.set(_c.x, 0.4, _c.z); key.position.copy(key.target.position).addScaledVector(KEY_DIR, 6); key.target.updateMatrixWorld();
  if (BODY) BODY.syncLights({ key, fill, hemi, res: renderer.getDrawingBufferSize(_res) });
  // focus: on what the operator is looking at (free view: the orbit target; crew: the live lens's aim)
  const want = CREW.on && crew.liveDrone && crew.liveDrone.cam ? Math.hypot(crew.liveDrone.cam.look.x - cam.position.x, crew.liveDrone.cam.look.y - cam.position.y, crew.liveDrone.cam.look.z - cam.position.z) : camera.position.distanceTo(controls.target);
  FOCUS += (want - FOCUS) * 0.15;
  Object.assign(dof.u.uNear, { value: cam.near }); dof.u.uFar.value = cam.far; dof.u.uFocus.value = FOCUS; dof.u.uF.value = mmFor(cam.fov) / 1000; dof.u.uN.value = FSTOP;
  beauty.camera = cam; gtao.camera = cam; if (gtao.enabled) gtao.gtaoMaterial.uniforms.cameraNear.value = cam.near;
  composer.render();
  if (CREW.on && BAY.on) { if (BODY) BODY.direct(true); bay(innerWidth, innerHeight, false); if (BODY) BODY.direct(false); }
}

""")
rep("function bay(W, H, isRT) {", "function bay(W, H, isRT) { // the four monitors: straight renders (no post), drawn over the programme")
# build the subject: brain + body
rep("    SUBJ = SUBJECT === 'test' ? testSubject() : createCreature(THREE, { seed: SEED });",
    """    SUBJ = SUBJECT === 'test' ? testSubject() : makeAnimal(SEED);""")
rep("    if (SUBJECT !== 'test') { initCrew(); $('src').textContent = 'built from code · ' + VERSION; }",
    "    if (SUBJECT !== 'test') { initCrew(); $('src').textContent = `built from code · ${BODY.stats.strands.toLocaleString()} strands · ${Math.round(BODY.stats.buildMs)} ms`; }")
rep("let SUBJ = null; const PERF = { sim: 0, render: 0, frames: 0, dt: [] };",
    """let SUBJ = null, BODY = null; const PERF = { sim: 0, render: 0, frames: 0, dt: [] };
function makeAnimal(seed) { // the brain lives; the body follows it
  const brain = createBrain(THREE, { seed }); BODY = createBody(THREE, brain, { hair: HAIR, skinRes: +(Q.get('skin') || 1) });
  const g = new THREE.Group(); g.name = 'ORANGUTAN 001 · photoreal'; g.add(brain.root, BODY.root);
  return { root: g, brain, body: BODY, update(dt, t, wind) { brain.update(dt, t, wind); BODY.update(dt); }, bounds: () => BODY.bounds(), observe: () => brain.observe(), reset: s => brain.reset(s),
    log: brain.log, metrics: brain.metrics, version: VERSION + ' · ' + BODY_VERSION, get state() { return brain.state; } };
}""")
rep("if (ff > 0 && SUBJECT !== 'test') for (let k = 1; k <= ff * 60; k++) SUBJ.update(1 / 60, k / 60, { t: k / 60, amt: 1 });",
    "if (ff > 0 && SUBJECT !== 'test') { for (let k = 1; k <= ff * 60; k++) SUBJ.brain.update(1 / 60, k / 60, { t: k / 60, amt: 1 }); BODY.update(0); }")
rep("  } else $('label').innerHTML = `<div class=\"t\">ORANGUTAN 001</div><div class=\"dim\">source-built · ${o.activity}</div>`;",
    "  } else $('label').innerHTML = `<div class=\"t\">ORANGUTAN 001 · PHOTOREAL</div><div class=\"dim\">source-built · ${o.activity} · ${Math.round(mmFor(camera.fov))} mm f/${FSTOP.toFixed(1)}</div>`;")
rep("get view() { return { pos: camera.position.toArray(), target: controls.target.toArray(), flying: !!FLY, crew: CREW.on, print: PRINT }; }",
    "get view() { return { pos: camera.position.toArray(), target: controls.target.toArray(), flying: !!FLY, crew: CREW.on, dof: DOF, f: FSTOP, mm: mmFor(camera.fov) }; }")
rep("print: () => togglePrint(), photograph: () => photograph(),", "dof: () => togglePrint(), photograph: () => photograph(), get body() { return BODY; }, direct() { if (BODY) BODY.direct(true); renderer.setRenderTarget(null); renderer.render(scene, camera); if (BODY) BODY.direct(false); }, look(pos, target) { FLY = null; camera.position.set(...pos); controls.target.set(...target); controls.update(); FOCUS = camera.position.distanceTo(controls.target); },")
rep("fps: a ? 1 / a : 0, simMsPerFrame: PERF.sim / n, renderMsPerFrame: PERF.render / n,", "fps: a ? 1 / a : 0, simMsPerFrame: PERF.sim / n, renderMsPerFrame: PERF.render / n, strands: BODY ? BODY.stats.strands : 0,")
# quality governor: keep the stream at or above 24 fps (MZ.Human 2026-11-22) by thinning the coat, then the pixel ratio
rep("let last = performance.now(), windT = 0;", """let last = performance.now(), windT = 0;
const GOV = { on: Q.get('auto') !== '0' && Q.get('capture') !== '1', hair: 1, win: [], at: 0, floor: 24, aim: 27, log: [] };
function govern(now, dt) {
  if (!GOV.on || !BODY) return; GOV.win.push(dt); if (GOV.win.length > 90) GOV.win.shift(); if (now - GOV.at < 2500 || GOV.win.length < 60) return;
  const fps = GOV.win.length / GOV.win.reduce((a, b) => a + b, 0); GOV.at = now;
  if (fps < GOV.aim && GOV.hair > 0.25) { GOV.hair = Math.max(0.25, GOV.hair * Math.min(0.85, fps / GOV.aim)); BODY.setHairFraction(GOV.hair); GOV.log.push({ t: +(now / 1000).toFixed(1), fps: +fps.toFixed(1), hair: +GOV.hair.toFixed(2) }); GOV.win.length = 0; }
  else if (fps < GOV.floor && renderer.getPixelRatio() > 0.75) { const pr = Math.max(0.75, renderer.getPixelRatio() * 0.85); renderer.setPixelRatio(pr); composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight); gtao.setSize(Math.round(innerWidth * pr), Math.round(innerHeight * pr)); GOV.log.push({ t: +(now / 1000).toFixed(1), fps: +fps.toFixed(1), pr: +pr.toFixed(2) }); GOV.win.length = 0; }
  else if (fps > GOV.aim * 1.6 && GOV.hair < 1) { GOV.hair = Math.min(1, GOV.hair * 1.15); BODY.setHairFraction(GOV.hair); GOV.win.length = 0; }
}""")
rep("walk(dt); if (!CREW.on) controls.update();", "walk(dt); govern(now, dt); if (!CREW.on) controls.update();")
rep("strands: BODY ? BODY.stats.strands : 0,", "strands: BODY ? BODY.stats.strands : 0, hairDrawn: BODY ? BODY.hair.geometry.instanceCount : 0, governor: GOV.log, pixelRatio: renderer.getPixelRatio(),")
for w in ['rt.', 'postScene', 'INKS']:
    left = [l for l in s.split('\n') if w in l]
    if left: print('LEFT', w, left[:4])
open(sys.argv[2], 'w').write(s); print('ok')
