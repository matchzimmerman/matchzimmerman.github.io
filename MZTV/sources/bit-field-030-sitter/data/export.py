"""Export the neutral sitter for BIT FIELD 030 (real-time).
Body (subdiv 1) + blink/jaw/swallow deltas + baked AO, clothing meshes, strand sets
(bun hair, short hair, brows, stubble, fuzz) and lashes open/closed.
Positions are int16-quantised against one shared box. Writes sitter.bin + sitter.json."""
import bpy, json, math, random, sys
import numpy as np
from mathutils import Matrix

OUT = sys.argv[sys.argv.index('--out') + 1]
A = '/home/claude/st030/a/screentest.blend'; B = '/home/claude/st030/b/screentest.blend'
BOX0 = np.array([-2.9, 4.5, -1.6]); BOX1 = np.array([2.9, 9.0, 2.2])

def q16(P):
    u = (np.asarray(P, np.float64) - BOX0) / (BOX1 - BOX0)
    assert u.min() >= 0 and u.max() <= 1, (np.asarray(P).min(0), np.asarray(P).max(0))
    return np.round(u * 65535 - 32768).astype(np.int16)

def qdelta(D, scale):
    return np.round(np.clip(np.asarray(D) / scale, -1, 1) * 32767).astype(np.int16)

def evaluated(ob, level=1):
    for m in ob.modifiers:
        if m.type == 'SUBSURF': m.levels = level; m.render_levels = level
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg); me = ev.to_mesh(); me.calc_loop_triangles()
    V = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', V)
    T = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get('vertices', T)
    ev.to_mesh_clear()
    return V.reshape(-1, 3), T.reshape(-1, 3)

def strands(name, every=1, cap=None, dec=1):
    hc = bpy.data.objects[name].data
    P = np.empty(len(hc.points) * 3, np.float32); hc.attributes['position'].data.foreach_get('vector', P); P = P.reshape(-1, 3)
    sizes = np.array([c.points_length for c in hc.curves]); starts = np.concatenate([[0], np.cumsum(sizes)[:-1]])
    sel = np.arange(len(sizes))[::every]
    if cap: sel = sel[:cap]
    segs = []
    for i in sel:
        p = P[starts[i]:starts[i] + sizes[i]]
        if dec > 1 and len(p) > 4: p = np.concatenate([p[:-1:dec], p[-1:]])
        segs.append(p)
    return np.concatenate(segs), np.array([len(p) for p in segs], np.uint8)

blobs, meta = {}, {'box0': BOX0.tolist(), 'box1': BOX1.tolist(), 'strands': {}}
def put(k, a): blobs[k] = np.ascontiguousarray(a)

# ---------------------------------------------------------------- A: body, shapes, AO, fleece, bun hair, brows, lashes, fuzz
bpy.ops.wm.open_mainfile(filepath=A)
rig = json.load(open('/home/claude/st030/a/rig.json')); meta['blink'] = rig['blink']
body = bpy.data.objects['Body']; kb = body.data.shape_keys.key_blocks
for k in kb: k.value = 0
V0, T = evaluated(body)
deltas = {}
for name in ('Blink', 'Jaw', 'Swallow'):
    kb[name].value = 1; Vk, _ = evaluated(body); kb[name].value = 0
    deltas[name] = Vk - V0
put('body_pos', q16(V0)); put('body_idx', T.astype(np.uint16))
for name, D in deltas.items():
    sc = float(np.abs(D).max()) + 1e-6; meta['d_' + name] = sc; put('body_' + name.lower(), qdelta(D, sc))
# ambient occlusion baked into the neutral head
scn = bpy.context.scene; scn.render.engine = 'CYCLES'; scn.cycles.samples = 64; scn.cycles.device = 'CPU'
for n in ('Hair', 'Brows', 'LashL', 'LashR', 'Fuzz', 'Backdrop'): bpy.data.objects[n].hide_render = True
for m in body.modifiers:
    if m.type == 'SUBSURF': m.levels = 1; m.render_levels = 1
dg = bpy.context.evaluated_depsgraph_get()
me = bpy.data.meshes.new_from_object(body.evaluated_get(dg))
ao_ob = bpy.data.objects.new('BodyAO', me); scn.collection.objects.link(ao_ob)
ao_ob.parent = body.parent; ao_ob.location = body.location; body.hide_render = True
me.materials.clear(); me.materials.append(bpy.data.materials['Skin'])
me.color_attributes.new('AO', 'FLOAT_COLOR', 'POINT'); me.attributes.active_color = me.color_attributes['AO']
for o in scn.objects: o.select_set(False)
ao_ob.select_set(True); bpy.context.view_layer.objects.active = ao_ob
scn.render.bake.target = 'VERTEX_COLORS'; scn.cycles.bake_type = 'AO'; scn.world.light_settings.distance = 0.6
bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
c = np.empty(len(me.vertices) * 4, np.float32); me.color_attributes['AO'].data.foreach_get('color', c)
assert len(me.vertices) == len(V0)
put('body_ao', np.round(np.clip(c.reshape(-1, 4)[:, 0], 0, 1) * 255).astype(np.uint8))
body.hide_render = False
for nm in ('Jacket', 'Collar'):
    Vc, Tc = evaluated(bpy.data.objects[nm]); put(nm.lower() + '_pos', q16(Vc)); put(nm.lower() + '_idx', Tc.astype(np.uint16))
for nm, key, every, dec in (('Hair', 'hair_bun', 2, 3), ('Brows', 'brows', 1, 1), ('Fuzz', 'fuzz', 2, 1)):
    p, s = strands(nm, every, dec=dec); put(key + '_pts', q16(p)); put(key + '_n', s); meta['strands'][key] = int(len(s))
# lashes: open (0) and closed (1)
EYE = {'L': np.array([0.308, 7.284, 1.245]), 'R': np.array([-0.308, 7.284, 1.245])}
def lash(side, blink, seed):
    rs = random.Random(seed); info = rig['blink'][side]; c = EYE[side]; out = []
    R = np.array(Matrix.Rotation(math.radians(info['theta'] * blink), 3, 'X')); nr = np.random.default_rng(seed)
    for k in range(70):
        u = -1 + 2 * (k + nr.random() * 0.8) / 70
        el = math.radians(info['top'] - 4 * u * u); az = math.radians(u * 34); rr = 0.118 + 0.026
        rel = np.array([math.sin(az) * math.cos(el) * rr, math.sin(el) * rr, math.cos(az) * math.cos(el) * rr])
        L_ = 0.055 + 0.03 * (1 - abs(u)) + 0.01 * rs.random()
        for s in range(5):
            t = s / 4
            out.append(c + R @ (rel + np.array([u * 0.025 * t, (0.12 * t + 0.5 * t * t) * L_, (1.0 * t - 0.15 * t * t) * L_])))
    return np.array(out)
for b, key in ((0, 'lash_open'), (1, 'lash_closed')):
    put(key + '_pts', q16(np.concatenate([lash('L', b, 11), lash('R', b, 23)])))
meta['strands']['lash'] = 140

# ---------------------------------------------------------------- B: sweater, short hair, stubble
bpy.ops.wm.open_mainfile(filepath=B)
Vs, Ts = evaluated(bpy.data.objects['Sweater']); put('sweater_pos', q16(Vs)); put('sweater_idx', Ts.astype(np.uint16))
for nm, key, every in (('Hair', 'hair_short', 2), ('Stubble', 'stubble', 2)):
    p, s = strands(nm, every); put(key + '_pts', q16(p)); put(key + '_n', s); meta['strands'][key] = int(len(s))

# ---------------------------------------------------------------- write
off = 0; buf = bytearray(); meta['blobs'] = {}
for k, a in blobs.items():
    pad = (-off) % 4; buf += b'\0' * pad; off += pad
    b_ = a.tobytes(); meta['blobs'][k] = {'offset': off, 'count': int(a.size), 'type': a.dtype.name}
    buf += b_; off += len(b_)
open(OUT + '/sitter.bin', 'wb').write(buf); json.dump(meta, open(OUT + '/sitter.json', 'w'))
print('EXPORT', {k: (v.shape, v.dtype.name) for k, v in blobs.items()}, 'MB', round(len(buf) / 1e6, 2))
