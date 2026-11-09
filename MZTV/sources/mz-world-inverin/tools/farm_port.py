#!/usr/bin/env python3
"""Plant FARM (BIT FIELD 045) into INVERIN (shipwreck version). Reads the built farm index.html and INVERIN's index.html,
writes INVERIN's index.html with the farm module. Re-runnable from a clean INVERIN source."""
import re, sys
FARM, INV, OUT = sys.argv[1], sys.argv[2], sys.argv[3]   # farm index.html (branch mz-world/farm-045), clean INVERIN index.html, output
HEAD = "/* ====================================================================== INVERIN: FARM (BIT FIELD 045), Bernard's farm, planted inland east of the wreck\n   The farm runs in its own local frame (+x north, +z east, metres from the SHEEPDOG anchor), inside a group that places it in INVERIN:\n   world x = FARM_O.x + local z, world z = FARM_O.z + local x. North stays north, east stays east, the bay is to the south. */\nconst FARM_O = { x: 360, z: 140 };\nconst FARM_NEAR = { x0: -125, x1: 235, z0: -205, z1: 95 };   // the farm's fine ground, local\nconst inFarmNear = (x, z) => { const fx = z - FARM_O.z, fz = x - FARM_O.x; return fx > FARM_NEAR.x0 + 1.5 && fx < FARM_NEAR.x1 - 1.5 && fz > FARM_NEAR.z0 + 1.5 && fz < FARM_NEAR.z1 - 1.5; };\nconst HOOKS = {};\n"
F = open(FARM).read().split('\n')
src = open(INV).read()
L = lambda a, b: '\n'.join(F[a - 1:b])          # 1-based inclusive line slice of the farm build
def find(pat, start=1):
    for i in range(start - 1, len(F)):
        if F[i].startswith(pat): return i + 1
    raise SystemExit('missing ' + pat)

fm_line = find('const FM = /*<FARM_MODEL>*/')
pip0 = find('const pip = '); segd = find('const segD = ')
wb = find('/* ====================================================================== world build')
near = find('const NEAR = ')
field_tex = find('// the field\'s memory as a texture')
bay = find('/* ---------- the bay, far hills, sky, sun and moon')
bodies = find('/* ====================================================================== FARM: bodies')
weather = find('/* ====================================================================== weather')
life = find('/* ====================================================================== FARM: the land\'s own life')
uncanny = find('/* ====================================================================== the uncanny')
crew0 = find('const crewP = '); crew1 = find('CREW.forEach(c => { c.tgt = V(0, 0, -20); });')

def rep(s, a, b, n=None):
    c = s.count(a)
    if c == 0 or (n is not None and c != n): raise SystemExit(f'rep {c}x: {a[:70]}')
    return s.replace(a, b)

build = L(wb + 1, near - 1)
build = rep(build, 'demH(o.cx, o.cz)', 'baseH(o.cx, o.cz)')
build = rep(build, 'demH(4, 4)', 'baseH(4, 4)')
ground = '''const NEAR = FARM_NEAR;
{ const st = 0.9, nx = Math.round((NEAR.x1 - NEAR.x0) / st), nz = Math.round((NEAR.z1 - NEAR.z0) / st);
  const g = new THREE.PlaneGeometry(NEAR.x1 - NEAR.x0, NEAR.z1 - NEAR.z0, nx, nz); g.rotateX(-Math.PI / 2); g.translate((NEAR.x0 + NEAR.x1) / 2, 0, (NEAR.z0 + NEAR.z1) / 2);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, terrainH(p.getX(i), p.getZ(i))); g.computeVertexNormals(); clean(g);
  scene.add(new THREE.Mesh(g, objMat(5, 2, V(1, 0, 0)))); }'''
rest = L(field_tex, bay - 1)
rest = rep(rest, 'SH.uGrass.value = fieldTex;', 'FU.uGrass.value = fieldTex;')
bodies_s = L(bodies, weather - 1)
life_s = L(life, uncanny - 1)
crew_s = L(crew0, crew1)
crew_s = rep(crew_s, 'const CREW = [', 'const FCREW = [')
crew_s = rep(crew_s, "cutTo(c) { const s = sideOf(dog.heading).multiplyScalar(rnd() < 0.5 ? 8 : -8); c.p.copy(dog.pos).add(s).setY(dog.pos.y + 1.2); c.tgt.copy(dogHead()); },",
  "cutTo(c) { let s = sideOf(dog.heading).multiplyScalar(rnd() < 0.5 ? 8 : -8); for (let k = 0; k < 8; k++) { const q = s.clone().applyAxisAngle(_Y, k * 0.785); if (losClear(dog.pos.x + q.x, dog.pos.z + q.z, dog.pos.x, dog.pos.z)) { s = q; break; } } c.p.copy(dog.pos).add(s).setY(dog.pos.y + 1.2); c.tgt.copy(dogHead()); },")
crew_s = "const losClear = (ax, az, bx, bz) => { if (WSEG.some(s => segX(ax, az, bx, bz, ...s))) return false; for (let i = 0; i <= 10; i++) { const x = lerp(ax, bx, i / 10), z = lerp(az, bz, i / 10), q = pushBox(x, z, 0.3); if (Math.hypot(q[0] - x, q[1] - z) > 1e-3) return false; } return true; };\n" + crew_s

crew_s = rep(crew_s, 'CREW.forEach(c => { c.tgt = V(0, 0, -20); });', 'FCREW.forEach(c => { c.tgt = V(0, 0, -20); });')
body = '\n'.join([build, ground, rest, bodies_s, life_s, crew_s])
body = body.replace('AUD.', 'FAUD.')

MOD = r'''
/* ====================================================================== INVERIN: FARM, built in its own frame and placed by one group */
const HOST_H = terrainH, HOST_SCENE = scene, HOST_OBJMAT = objMat;
const FARM = (() => {
  // ---- frame
  const FG = new THREE.Group(); FG.matrixAutoUpdate = false;
  FG.matrix.set(0, 0, 1, FARM_O.x, 0, 1, 0, 0, 1, 0, 0, FARM_O.z, 0, 0, 0, 1); FG.matrixWorldNeedsUpdate = true; HOST_SCENE.add(FG);
  const scene = FG;
  const toW = (v, out = V()) => out.set(FARM_O.x + v.z, v.y, FARM_O.z + v.x);
  const fromW = (x, z) => [z - FARM_O.z, x - FARM_O.x];
  // ---- model and helpers
  ''' + F[fm_line - 1] + '''
  ''' + L(pip0, segd) + '''
  const PADS = [];
  const wrapA = (a) => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI, wrnd = mulberry(4501), wr = (a, b) => a + (b - a) * wrnd();
  const baseH = (x, z) => HOST_H(FARM_O.x + z, FARM_O.z + x);   // INVERIN's ground, in the farm's frame
  function terrainH(x, z) { let h = baseH(x, z); for (const p of PADS) { const d = Math.hypot(x - p[0], z - p[1]); if (d < p[2] + 6) h = lerp(h, p[3], 1 - smoothstep(p[2], p[2] + 6, d)); } return h; }
  // ---- memory: a sub-state of INVERIN's
  const GW = 128, GH = 104, GB = { x0: -100, z0: -175, sx: 320, sz: 260 };
  const DEFF = () => ({ grass: null, tread: null, wallLaid: 96, days: 0, lastDay: null, exp: 0.35, ewe: { breaks: 0, sides: [] }, flockAt: null, flockPos: null, workedToday: 0, moved: {}, lastMs: Date.now() });
  const S = Object.assign(DEFF(), HOST_S.farm || {}); HOST_S.farm = S;
  const b64 = { enc(a) { let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }, dec(s, n) { const out = new Uint8Array(n); try { const b = atob(s); for (let i = 0; i < Math.min(n, b.length); i++) out[i] = b.charCodeAt(i); } catch (e) {} return out; } };
  const GRASS = S.grass ? b64.dec(S.grass, GW * GH) : new Uint8Array(GW * GH).fill(0);
  const TREAD = S.tread ? b64.dec(S.tread, GW * GH) : new Uint8Array(GW * GH);
  // ---- materials: INVERIN's, with the farm's modes (11 stone, 12 field ground, 14 fleece, 15 iron, 16 whitewash)
  const FU = { uGrass: { value: null }, uGB: { value: new THREE.Vector4(GB.x0, GB.z0, GB.sx, GB.sz) }, uFarmO: { value: new THREE.Vector2(FARM_O.x, FARM_O.z) },
    uPh: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, uHush: { value: 0 } };
  const FMATS = [], ID_MAP = { 3: 9, 10: 4, 11: 3 }, MODE_MAP = { 0: 0, 1: 11, 2: 12, 3: 3, 4: 14, 5: 15, 6: 16, 7: 3 };
  function objMat(id, mode = 0, T = V(0, 1, 0), extra = {}) { const m = HOST_OBJMAT(ID_MAP[id] ?? id, MODE_MAP[mode] ?? mode, T, Object.assign({}, FU, { uAcc: { value: 0 }, uSway: { value: 0 } }, extra)); FMATS.push(m); return m; }

  // ---- no farm events in INVERIN yet: the hush still stills the flock
  const live = { get ev() { return HOST_LIVE().ev === 'hush' ? 'hush' : null; } };
  const PHANTOM = { x: 0, z: 0, w: 0 }; const gatherPull = () => [0, 0]; const eventDog = () => {};
  // ---- sound: the farm's voices through INVERIN's mix (the lens is the microphone)
  const FAUD = {
    ok() { return AUD.ctx && AUD.ctx.state === 'running' && AUD.master; },
    lensF(x, y, z) { return AUD.lens(V(FARM_O.x + z, y, FARM_O.z + x)); },
    v(type, o) { const c = AUD.ctx, t = c.currentTime + 0.02, g = (v) => { const n = c.createGain(); n.gain.value = v; return n; }, bq = (ty, f, q = 0.7) => { const n = c.createBiquadFilter(); n.type = ty; n.frequency.value = f; n.Q.value = q; return n; };
      const out = (n) => { n.connect(AUD.master); if (AUD.room) n.connect(AUD.room.rIn); };
      if (type === 'bleat') { const os = c.createOscillator(), lfo = c.createOscillator(), lg = g(o.f * 0.035), f1 = bq('bandpass', 620, 4), f2 = bq('bandpass', 1050, 5), lp = bq('lowpass', 1500), gg = g(0), p = c.createStereoPanner(); p.pan.value = o.pan;
        os.type = 'sawtooth'; os.frequency.setValueAtTime(o.f, t); os.frequency.linearRampToValueAtTime(o.f * 1.06, t + 0.12); os.frequency.linearRampToValueAtTime(o.f * 0.86, t + o.d); lfo.frequency.value = rr(5.5, 7.5); lfo.connect(lg).connect(os.frequency);
        gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(o.v, t + 0.06); gg.gain.setTargetAtTime(o.v * 0.6, t + 0.2, 0.15); gg.gain.setTargetAtTime(0, t + o.d - 0.1, 0.05);
        os.connect(f1); os.connect(f2); f1.connect(lp); f2.connect(lp); lp.connect(gg).connect(p); out(p); os.start(t); lfo.start(t); os.stop(t + o.d + 0.4); lfo.stop(t + o.d + 0.4); os.onended = () => { p.disconnect(); lg.disconnect(); }; }
      if (type === 'clank') [[o.f, 0.7], [o.f * 2.71, 0.35], [o.f * 4.2, 0.15]].forEach(([fq, a]) => { const os = c.createOscillator(), gg = g(0), p = c.createStereoPanner(); p.pan.value = o.pan; os.frequency.value = fq;
        gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(o.v * a, t + 0.003); gg.gain.exponentialRampToValueAtTime(0.0004, t + 0.9 / (1 + a)); os.connect(gg).connect(p); out(p); os.start(t); os.stop(t + 1.2); os.onended = () => p.disconnect(); });
      if (type === 'knock') { const os = c.createOscillator(), gg = g(0), f = bq('bandpass', 320, 4), p = c.createStereoPanner(); p.pan.value = o.pan; os.type = 'triangle'; os.frequency.value = o.f;
        gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(o.v, t + 0.004); gg.gain.exponentialRampToValueAtTime(0.0005, t + 0.2); os.connect(f).connect(gg).connect(p); out(p); if (AUD.echo) p.connect(AUD.echo.eIn); os.start(t); os.stop(t + 0.3); os.onended = () => p.disconnect(); }
      if (type === 'whistle') { const os = c.createOscillator(), gg = g(0), p = c.createStereoPanner(); p.pan.value = o.pan; const f0 = AUD.hz(AUD.deg(4, 3));
        os.frequency.setValueAtTime(f0 * 0.94, t); os.frequency.linearRampToValueAtTime(f0, t + 0.12); os.frequency.setValueAtTime(f0, t + 0.45); os.frequency.linearRampToValueAtTime(f0 * 1.335, t + 0.62); os.frequency.linearRampToValueAtTime(f0 * 1.2, t + 1.1);
        gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(o.v, t + 0.05); gg.gain.setValueAtTime(o.v, t + 0.4); gg.gain.linearRampToValueAtTime(o.v * 0.2, t + 0.48); gg.gain.linearRampToValueAtTime(o.v, t + 0.6); gg.gain.linearRampToValueAtTime(0, t + 1.15);
        os.connect(gg).connect(p); out(p); if (AUD.echo) p.connect(AUD.echo.eIn); os.start(t); os.stop(t + 1.25); os.onended = () => p.disconnect(); } },
    bleat(e) { if (!this.ok()) return; const l = this.lensF(e.x, groundAt(e.x, e.z) + 0.8, e.z); if (l.g < 0.006) return; this.v('bleat', { f: rr(175, 250) * (e.rogue ? 1.12 : 1), d: rr(0.6, 1.1), v: clamp(0.45 * l.g, 0, 0.08), pan: l.pan }); },
    gate(gt) { if (!this.ok()) return; const l = this.lensF(gt.at[0], groundAt(gt.at[0], gt.at[1]) + 0.8, gt.at[1]); if (l.g < 0.006) return; this.v('clank', { f: rr(380, 460), v: clamp(0.35 * l.g, 0, 0.07), pan: l.pan }); },
    stone(p, s) { if (!this.ok()) return; const l = this.lensF(p.x, p.y, p.z); if (l.g < 0.006) return; this.v('knock', { f: rr(150, 230), v: clamp(0.5 * l.g * s, 0, 0.12), pan: l.pan }); },
    whistle() { if (!this.ok()) return; const l = this.lensF(farmer.pos.x, farmer.pos.y + 1.6, farmer.pos.z); this.v('whistle', { v: clamp(0.15 * Math.max(l.g, 0.05), 0, 0.03), pan: l.pan }); },
  };
''' + body + r'''
  // ---- the farm's operators, handed to INVERIN's crew in world coordinates
  function unblock(fc) {   // the farmer never fills the lens: if he stands in the first few metres of the view, the operator steps aside
    if (!farmer.visible || fc.skipByre) return; const d = fc.tgt.clone().sub(fc.p); const L = d.length(); if (L < 0.5) return; d.divideScalar(L);
    const f = farmer.pos.clone().add(V(0, 1.1, 0)).sub(fc.p); const along = f.dot(d); if (along < 0 || along > Math.min(6, L - 0.5)) return;
    const off = f.clone().sub(d.clone().multiplyScalar(along)); const r = off.length(); if (r > 1.1) return;
    const side = V(-d.z, 0, d.x).normalize().multiplyScalar(off.dot(V(-d.z, 0, d.x)) > 0 ? -2.4 : 2.4); fc.p.add(side); fc.p.y = Math.max(fc.p.y, terrainH(fc.p.x, fc.p.z) + 0.3); }
  const OPS = FCREW.filter(c => !['ROAD', 'THORN'].includes(c.name));
  const crew = OPS.map(fc => ({ name: 'FARM · ' + fc.name, fov: fc.fov, p: V(), tgt: V(), farm: fc, last: null,
    onCut() { if (fc.cutTo) fc.cutTo(fc); fc.upd(fc, simT, 100); clearance(fc.p, fc.name === 'GRASS' ? 0.25 : 0.3, fc.skipByre); toW(fc.p, this.p); toW(fc.tgt, this.tgt); },
    upd(c, t) { const dt = c.last == null ? 100 : clamp(t - c.last, 0, 100); c.last = t; fc.upd(fc, t, dt); clearance(fc.p, fc.name === 'GRASS' ? 0.25 : 0.3, fc.skipByre); unblock(fc); toW(fc.p, c.p); toW(fc.tgt, c.tgt); c.fov = fc.fov; } }));
  function weight(c) {   // how much the mixer wants the farm right now: a move, the wall, Bernard asleep at night
    const n = c.farm.name, night = SUNM.sun.el < -0.05, asleep = dog.task === 'sleep', L = HERD.active ? herdLeg() : null, laying = farmer.visible && (farmer.task === 'lay' || farmer.task === 'lean');
    let x = 0.22;
    if (night) x *= { BYRE: asleep ? 3 : 0.4, YARD: 1.5, HILL: 1 }[n] ?? (asleep ? 0 : 0.2);
    else if (HERD.active) x *= { 'LONG LENS': 4, 'BERNARD SIDE': 4, GRASS: 3, HILL: 2, 'FOLD GATE': L && L.g === foldG ? 4 : 0.5, 'BERNARD LOW': 2, YARD: 0.5, BYRE: 0.05, WALL: 0.3 }[n] ?? 1;
    else { if (n === 'WALL') x *= laying ? 3.5 : 0.5; if (n === 'BERNARD LOW') x *= dog.down > 0.5 ? 2 : 1; if (n === 'BERNARD SIDE') x *= dog.speed > 1 ? 2.5 : 0.9; if (n === 'BYRE') x *= asleep ? 2 : 0.15; if (n === 'GRASS') x *= flockPace > 0.15 ? 1.8 : 1.2; }
    return x; }
  // ---- sim
  let landAcc = 0, dayAcc = 0, landDirty = true, landT = 0, saveN = 0;
  function step(sdt) {
    const night = SUNM.sun.el < -0.05; dayAcc += sdt; if (dayAcc > 10) { dayAcc = 0; dayTick(); }
    const n = Math.ceil(sdt / 0.25), h = sdt / n;
    for (let i = 0; i < n; i++) { farmerTick(h, night); herdTick(h); dogTickBrain(h, night); dogTick(h); flockTick(h, night); gateTick(h); }
    landAcc += sdt; if (landAcc > 30) { regrow(landAcc); landAcc = 0; landDirty = true; }
    if ((WX.wind > 16 || (WX.gust || 0) > 24) && S.wallLaid > 4 && rnd() < sdt / 900) { S.wallLaid--; siteUpdate(); logEv(`the gale took a stone off the farmer's new wall (${WX.wind.toFixed(0)} m/s)`); }
  }
  function look(dt) {
    const wd = fromBearingTravel(WX.windDir), wl = V(wd.x, 0, wd.y).multiplyScalar(clamp(WX.wind / 9, 0.1, 2.2)), hush = HOST_LIVE().ev === 'hush' ? 1 : 0;
    FU.uHush.value = lerp(FU.uHush.value, hush, 1 - Math.exp(-dt * 0.5)); for (const m of FMATS) m.uniforms.uWindL.value.copy(wl);
    const ph = FU.uPh.value, w = V(); toW(dog.pos, w); ph[0].set(w.x, w.z, 0.8, 0.9); toW(farmer.pos, w); ph[1].set(w.x, w.z, 0.9, farmer.visible ? 1 : 0); ph[2].set(0, 0, 1, 0);
    const cam = fromW(camera.position.x, camera.position.z); const nearE = flock.map(e => [e, (e.x - cam[0]) ** 2 + (e.z - cam[1]) ** 2]).sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < 5; i++) { const e = nearE[i][0]; ph[3 + i].set(FARM_O.x + e.z, FARM_O.z + e.x, 1.1, 0.8); }
    const sEl = SUNM.sun.el, dim = sEl < 0.05 || (WX.cloud > 0.85 && sEl < 0.2), hr = galwayParts(simMs).hour;
    LAMPS.forEach((l, i) => { const own = HOUSE && Math.hypot(l.position.x - HOUSE.x, l.position.z - HOUSE.z) < 12; const on = own ? (dim && farmer.inside) : (sEl < -0.04 && hr > 5 && hr < 23.5 && (i * 7919 + S.days) % 5 !== 0);
      l.material.uniforms.uId.value = on ? 15 : 7; l.material.uniforms.uEmit.value = on ? 1 : 0; });
    const camF = fromW(camera.position.x, camera.position.z), far = camF[0] < FARM_NEAR.x0 - 250 || camF[0] > FARM_NEAR.x1 + 250 || camF[1] < FARM_NEAR.z0 - 250 || camF[1] > FARM_NEAR.z1 + 250;
    if (!far) { const pdt = Math.min(dt, 0.1); dogPose(pdt); farmerPose(pdt); flock.forEach(e => ewePose(e, pdt)); }
    landT += dt; if (landDirty && landT > 2) { landT = 0; landDirty = false; landSync(); }
  }
  function persist() { S.grass = b64.enc(GRASS); S.tread = b64.enc(TREAD); S.flockPos = flock.map(e => [+e.x.toFixed(2), +e.z.toFixed(2)]); S.lastMs = Date.now(); }
  function init() { settle(); for (let i = 0; i < 360; i++) step(0.25); landSync(); landDirty = false; look(0.1); }
  // walking: the farm's walls and buildings are solid to a visitor; gateways and open gates let you through
  function walkBlock(x, z, ox, oz) { const [fx, fz] = fromW(x, z); if (fx < FARM_NEAR.x0 || fx > FARM_NEAR.x1 || fz < FARM_NEAR.z0 || fz > FARM_NEAR.z1) return false; const [px, pz] = fromW(ox, oz);
    for (const s of WSEG) if (segX(px, pz, fx, fz, ...s) && !gateCut((px + fx) / 2, (pz + fz) / 2)) return true;
    const [bx, bz] = pushBox(fx, fz, 0.35); return Math.hypot(bx - fx, bz - fz) > 1e-3; }
  function groundW(x, z) { const fx = z - FARM_O.z, fz = x - FARM_O.x; if (fx < FARM_NEAR.x0 - 6 || fx > FARM_NEAR.x1 + 6 || fz < FARM_NEAR.z0 - 6 || fz > FARM_NEAR.z1 + 6) return null; return terrainH(fx, fz); }
  function hud() { const fl = farmer.away ? 'away down the lane' : farmer.visible ? farmer.note : 'indoors';
    return `<div class="r"><span>FARM ${flock.length} ewes in ${FNAME[flockArea()]} · BERNARD ${dog.note}</span><span>FARMER ${fl} · WALL ${S.wallLaid}/${SITE.total}</span></div>`; }
  const spot = toW(V(20, 0, 46)); spot.y = 0;
  return { crew, weight, step, look, init, persist, walkBlock, groundW, hud, spot, G: FG,
    herd: (to) => herdStart(to || bestField(flockArea()), 'moving the flock (by hand)'), whistle() { farmer.q.unshift({ t: 'whistle', note: 'whistling Bernard over' }); farmer.cur = null; },
    get state() { return { flock: flockArea(), pace: flockPace, dog: dog.task + ' · ' + dog.note, farmer: farmer.task + ' · ' + farmer.note, visible: farmer.visible, herd: HERD.active, wall: S.wallLaid, grass: Object.fromEntries(['fold', ...GRAZE_FIELDS].map(f => [f, +fieldMean(f).toFixed(3)])) }; },
    _dbg: { dog, farmer, flock, HERD, placeFlock, toW } };
})();
{ const h0 = HOST_H; terrainH = (x, z) => { const h = FARM.groundW(x, z); return h == null ? h0(x, z) : h; }; }
'''

# ---------------------------------------------------------------- patch INVERIN
s = src
head = HEAD
s = rep(s, "const inFine = (x, z) => FINES.some(", head + "const inFine = (x, z) => FINES.some(", 1)
s = rep(s, "const fineIn = inFine(x, z);", "const fineIn = inFine(x, z) || inFarmNear(x, z);", 1)
s = rep(s, "function save() { try { S.runSec = simT;", "function save() { try { if (HOOKS.save) HOOKS.save(); S.runSec = simT;", 1)
# shaders: the farm's grass pressers and blades, its field ground, fleece, iron and whitewash
s = rep(s, "uniform float uTime, uBreath, uBreathOn, uCloth, uClothH, uWalk, uMove; uniform vec3 uWindL;\nattribute vec3 aT;",
 "uniform float uTime, uBreath, uBreathOn, uCloth, uClothH, uWalk, uMove, uSway, uHush; uniform vec3 uWindL; uniform vec4 uPh[8];\nattribute vec3 aT; attribute float aG;", 1)
s = rep(s, "  #ifdef USE_INSTANCING\n    lp=instanceMatrix*lp;", "  float bh=0.; if(uSway>0.5&&uSway<1.5){ lp.y*=0.1+0.95*aG; bh=lp.y; }   // FARM: a blade, its height the grazing map\n  #ifdef USE_INSTANCING\n    lp=instanceMatrix*lp;", 1)
s = rep(s, "  vec4 w=modelMatrix*lp; vec3 n=normalize(mat3(modelMatrix)*ln);\n",
"""  vec4 w=modelMatrix*lp; vec3 n=normalize(mat3(modelMatrix)*ln);
  if(uSway>0.5&&uSway<1.5){ float k=bh*bh*2.2; float gust=0.55+0.45*sin(uTime*1.7+w.x*0.21+w.z*0.17)+0.25*sin(uTime*3.1+w.x*0.6-w.z*0.4);
    w.xz+=uWindL.xz*k*gust*(1.-uHush)*0.55;
    for(int i=0;i<8;i++){ vec4 p=uPh[i]; if(p.w<=0.) continue; vec2 d=w.xz-p.xy; float r=length(d); float f=p.w*(1.-smoothstep(0.,p.z,r)); w.xz+=normalize(d+1e-4)*f*k*0.7; w.y-=f*bh*0.75; } }
  if(uSway>1.5) w.xyz+=uWindL*0.012*sin(uTime*5.+w.x*3.+w.z*2.)*(1.-uHush);   // FARM: fleece shivers
""", 1)
s = rep(s, "uniform vec3 uKeyD, uCamP, uT;\n", "uniform vec3 uKeyD, uCamP, uT, uWindL;\nuniform float uAcc; uniform sampler2D uGrass; uniform vec4 uGB; uniform vec2 uFarmO;\n", 1)
s = rep(s, "void main(){\n  vec3 N=normalize(vN); if(!gl_FrontFacing) N=-N;\n  float sh=uAmb+uDiff*max(dot(N,uKeyD),0.)+vC;",
"""void stoneC(vec3 N, inout vec3 T, inout float sh, inout float acc){   // FARM: each stone carved in its own lie, lichen on the tops
  vec3 base=length(vT)>0.01?normalize(vT):vec3(0.,1.,0.); float n1=vn(vL.xz*1.7+vL.y*1.3);
  T=normalize(base+0.4*vec3(n1-0.5,0.,vn(vL.zx*1.3+3.)-0.5)); sh+=0.05-0.13*(1.-n1);
  acc=step(0.986,hash(floor(vW.xz*9.+vW.y*7.)))*step(0.55,vn(vW.xz*0.4))*step(0.2,N.y); }
void main(){
  vec3 N=normalize(vN); if(!gl_FrontFacing) N=-N;
  float sh=uAmb+uDiff*max(dot(N,uKeyD),0.)+vC;""", 1)
s = rep(s, "  else if(uMode>2.5&&uMode<3.5){ T=length(vT)>0.01?normalize(vT):vec3(0.,1.,0.); }\n",
"""  else if(uMode>2.5&&uMode<3.5){ T=length(vT)>0.01?normalize(vT):vec3(0.,1.,0.); }
  else if(uMode>10.5&&uMode<11.5){ stoneC(N,T,sh,acc); }
  else if(uMode>11.5&&uMode<12.5){   // FARM: the ground reads the field's memory (long grass, grazed, trodden)
    vec2 fl=vec2(vW.z-uFarmO.y,vW.x-uFarmO.x); vec2 guv=(fl-uGB.xy)/uGB.zw; vec4 g=vec4(0.82,0.,0.,0.);
    bool inMap=guv.x>0.&&guv.x<1.&&guv.y>0.&&guv.y<1.; if(inMap) g=texture2D(uGrass,guv);
    float wob=vn(vW.xz*0.35)*0.18-0.09; vec2 wd=uWindL.xz; float wl=length(wd); wd=wl>0.01?wd/wl:vec2(0.6,0.8);
    if(N.y<0.7){ id=4.; rock(T,sh,acc); }
    else if(!inMap){ id=5.; T=normalize(vec3(0.6,0.,1.)+vec3(0.5*(vn(vW.xz*0.012)-0.5),0.,0.)); sh+=0.1*(vn(vW.xz*0.09)-0.5); }
    else if(g.g+wob>0.52){ id=12.; float e=0.7;
      float gz=texture2D(uGrass,guv+vec2(0.,e/uGB.w)).g-texture2D(uGrass,guv-vec2(0.,e/uGB.w)).g, gx=texture2D(uGrass,guv+vec2(e/uGB.z,0.)).g-texture2D(uGrass,guv-vec2(e/uGB.z,0.)).g;
      T=normalize(vec3(-gx,0.,gz)+vec3(0.,0.,1e-3)); sh+=0.05*(vn(vW.xz*6.)-0.5); }
    else if(g.r+wob<0.36){ id=3.; float a=vn(vW.xz*0.9)*6.283; T=vec3(cos(a),0.,sin(a)); sh+=0.1*(vn(vW.xz*7.)-0.5)+0.05; }
    else { id=5.; T=normalize(vec3(wd.x,0.,wd.y)*0.5+vec3(0.6,0.,1.)*0.5+vec3(0.5*(vn(vW.xz*0.012)-0.5),0.,0.)); sh+=0.1*(vn(vW.xz*0.6)-0.5)+0.07*(g.r-0.6)-0.06; }
  }
  else if(uMode>13.5&&uMode<14.5){ vec3 A=normalize(abs(N.y)<0.9?cross(N,vec3(0.,1.,0.)):cross(N,vec3(1.,0.,0.))); vec3 B=cross(N,A);   // FARM: fleece curls
    float a=vn(vL.xz*15.+vL.y*12.)*9.+vn(vL.xy*31.)*3.; T=normalize(A*cos(a)+B*sin(a)); sh+=0.16*(vn(vL.xz*22.+vL.y*17.)-0.5)+0.05; }
  else if(uMode>14.5&&uMode<15.5){ T=length(vT)>0.01?normalize(vT):uT; sh+=0.07*sin(dot(vL,normalize(cross(N,T)))*41.); acc=step(0.992,hash(floor(vL.xz*3.+vL.y*11.)))*step(0.6,vn(vL.xz*0.9)); }   // FARM: corrugated iron
  else if(uMode>15.5&&uMode<16.5){ T=length(vT)>0.01?normalize(vT):uT; sh+=0.07*(vn(vL.xy*2.+vL.zy*2.)-0.5)+0.04; }   // FARM: whitewash
""", 1)
s = rep(s, "  float dist=length(vW-uCamP); float fog=1.-exp(-dist/uFogD);\n  if(uEmit>0.){ sh=uEmit; fog*=0.4; }\n  sh=mix(sh,uFogShade,fog);\n  gl_FragColor=pack(sh,id,screenAngle(vW,T*0.6),acc*(1.-fog));",
 "  acc=max(acc,uAcc);\n  float dist=length(vW-uCamP); float fog=1.-exp(-dist/uFogD);\n  if(uEmit>0.){ sh=uEmit; fog*=0.4; }\n  sh=mix(sh,uFogShade,fog);\n  gl_FragColor=pack(sh,id,screenAngle(vW,T*0.6),acc*(1.-fog));", 1)
# the module, after the places and the walk, before the weather
s = rep(s, "/* ====================================================================== weather */", "const HOST_S = S, HOST_LIVE = () => live;\n" + MOD + "\n/* ====================================================================== weather */", 1)
# walking
s = rep(s, "const PLACES = { 1: ['THE HOUSE',", "const PLACES = { 6: ['THE FARM', 0, 0, -1.45], 1: ['THE HOUSE',", 1)
s = rep(s, "function walkTo(k) { const p = PLACES[k]; if (!p) return;", "function walkTo(k) { const p = PLACES[k]; if (!p) return; if (k == 6 && typeof FARM_SPOT !== 'undefined') { p[1] = FARM_SPOT.x; p[2] = FARM_SPOT.z; }", 1)
s = rep(s, "  if (WR.layer === 'ground') for (const o of OBST) if ((x - o[0]) ** 2 + (z - o[1]) ** 2 < o[2] * o[2]) return false; return true;\n}",
 "  if (WR.layer === 'ground') for (const o of OBST) if ((x - o[0]) ** 2 + (z - o[1]) ** 2 < o[2] * o[2]) return false;\n  if (HOOKS.walkBlock && HOOKS.walkBlock(x, z, ox, oz)) return false; return true;\n}", 1)
s = rep(s, "if ('12345'.includes(k)) walkTo(k);", "if ('123456'.includes(k)) walkTo(k);", 1)
s = rep(s, "1–5 PLACES", "1–6 PLACES")
# crew, director, sim, render, hud, api
s = rep(s, "function cut(i) { DIR.prev = DIR.cur; DIR.cur = i;", "function cut(i) { DIR.prev = DIR.cur; DIR.cur = i; if (CREW[i].onCut) CREW[i].onCut();", 1)
s = rep(s, "    if (c.name === 'CLIFF FACE') x *= WX.swellH > 1.6 ? 1.6 : 0.8;\n", "    if (c.name === 'CLIFF FACE') x *= WX.swellH > 1.6 ? 1.6 : 0.8;\n    if (c.farm) x *= FARM.weight(c);\n", 1)
s = rep(s, "const PIER_END = V(PIER_X, DECK, PIER_END_Z);\nCREW.forEach(c => { c.tgt = V(0, 0, -200); c.upd(c, 0);",
 "const PIER_END = V(PIER_X, DECK, PIER_END_Z);\nconst FARM_SPOT = FARM.spot;\nHOOKS.save = () => FARM.persist(); HOOKS.walkBlock = (x, z, ox, oz) => FARM.walkBlock(x, z, ox, oz);\nCREW.forEach(c => { c.tgt = V(0, 0, -200); c.upd(c, 0);", 1)
s = rep(s, "const DIR = { cur: 0, prev: -1, until: 6, pendingCut: -1 };", "CREW.push(...FARM.crew);\nconst DIR = { cur: 0, prev: -1, until: 6, pendingCut: -1 };", 1)
s = rep(s, "sealTick(sdt, simT); shoreTick(sdt, simT); pierTick(sdt);", "sealTick(sdt, simT); shoreTick(sdt, simT); pierTick(sdt); FARM.step(sdt);", 1)
s = rep(s, "  // inks\n  if (cwMix < 1)", "  FARM.look(dt);\n  // inks\n  if (cwMix < 1)", 1)
s = rep(s, "  ${ev}<div class=\"log\">", "  ${FARM.hud()}\n  ${ev}<div class=\"log\">", 1)
s = rep(s, "cut(Q.has('cam') ? clamp(+Q.get('cam'), 0, CREW.length - 1) : Math.floor(rnd() * CREW.length));", "FARM.init();\ncut(Q.has('cam') ? clamp(+Q.get('cam'), 0, CREW.length - 1) : Math.floor(rnd() * 7));", 1)
s = rep(s, "  audio: AUD,\n", "  audio: AUD,\n  farm: FARM,\n", 1)
open(OUT, 'w').write(s)
print('ok', len(s))
