#!/usr/bin/env python3
"""Bake one race from TracingInsights/FastF1 per-lap telemetry into a compact replay.

Usage: bake_race.py RAW_DIR OUT_DIR

Writes OUT_DIR/race.json (track, cars, events, weather) and OUT_DIR/race.bin
(per-car columns at 2 Hz). Only time, position, speed, rpm, gear, throttle,
brake and DRS are kept.
"""
import json, glob, math, os, sys, struct, datetime

RAW, OUT = sys.argv[1], sys.argv[2]
HZ = 2.0
STEP = 4.0  # centerline spacing, metres

def load(p):
    with open(os.path.join(RAW, p)) as f:
        return json.load(f)

def num(v):
    try:
        f = float(v)
        return f if math.isfinite(f) else None
    except (TypeError, ValueError):
        return None

drivers = load('drivers.json')['drivers']
codes = sorted({os.path.basename(os.path.dirname(p)) for p in glob.glob(os.path.join(RAW, '*/laptimes.json'))})

# ---------- reference lap -> centerline ----------
best = None
for c in codes:
    L = load(f'{c}/laptimes.json')
    for i, t in enumerate(L['time']):
        t = num(t)
        if t and (best is None or t < best[0]) and L['pin'][i] == 'None' and L['pout'][i] == 'None':
            best = (t, c, L['lap'][i])
ref = load(f'{best[1]}/{best[2]}_tel.json')['tel']
rx = [v / 10 for v in ref['x']]; ry = [v / 10 for v in ref['y']]; rz = [v / 10 for v in ref['z']]
# cumulative arc length, then resample every STEP metres
arc = [0.0]
for i in range(1, len(rx)):
    arc.append(arc[-1] + math.hypot(rx[i] - rx[i - 1], ry[i] - ry[i - 1]))
lapLen = arc[-1] + math.hypot(rx[0] - rx[-1], ry[0] - ry[-1])
N = int(lapLen // STEP)
STEP = lapLen / N
def at(s):
    j = 0
    while j < len(arc) - 2 and arc[j + 1] < s: j += 1
    a = arc[j]; b = arc[j + 1] if j + 1 < len(arc) else lapLen
    k = 0 if b == a else (s - a) / (b - a)
    j2 = (j + 1) % len(rx)
    return rx[j] + (rx[j2] - rx[j]) * k, ry[j] + (ry[j2] - ry[j]) * k, rz[j] + (rz[j2] - rz[j]) * k
pts = [at(i * STEP) for i in range(N)]
# smooth (circular)
for _ in range(3):
    pts = [tuple((pts[(i - 1) % N][a] + 2 * pts[i][a] + pts[(i + 1) % N][a]) / 4 for a in range(3)) for i in range(N)]
cx = sum(p[0] for p in pts) / N; cy = sum(p[1] for p in pts) / N; zmin = min(p[2] for p in pts)
# world: X = east, Y = up, Z = -north (plan view keeps north up)
C = [(p[0] - cx, p[2] - zmin, -(p[1] - cy)) for p in pts]
tang = []
for i in range(N):
    a, b = C[(i - 1) % N], C[(i + 1) % N]
    dx, dz = b[0] - a[0], b[2] - a[2]; l = math.hypot(dx, dz) or 1
    tang.append((dx / l, dz / l))
# lateral unit (left of travel, in plan): n = (-tz, tx)... sign irrelevant, consistent

def toWorld(x, y):
    return x / 10 - cx, -(y / 10 - cy)

def project(X, Z, guess):
    """nearest centerline index around guess (or global if guess is None), returns (s, lat)."""
    rng = range(N) if guess is None else [(guess + k) % N for k in range(-40, 120)]
    bi, bd = 0, 1e18
    for i in rng:
        d = (C[i][0] - X) ** 2 + (C[i][2] - Z) ** 2
        if d < bd: bd, bi = d, i
    # refine along segment
    i = bi; j = (i + 1) % N
    ax, az = C[i][0], C[i][2]; bx, bz = C[j][0], C[j][2]
    vx, vz = bx - ax, bz - az; L2 = vx * vx + vz * vz or 1
    k = max(-0.5, min(1.5, ((X - ax) * vx + (Z - az) * vz) / L2))
    px, pz = ax + vx * k, az + vz * k
    tx, tz = tang[i]
    lat = (X - px) * (-tz) + (Z - pz) * tx
    return (i + k) * STEP, lat, bi, math.sqrt(bd)

# ---------- session clock ----------
L0 = load(f'{codes[0]}/laptimes.json')
t0 = min(num(v) for c in codes for v in load(f'{c}/laptimes.json')['lST'][:1])
lsd0 = None
for c in codes:
    L = load(f'{c}/laptimes.json')
    if num(L['lST'][0]) == t0:
        lsd0 = datetime.datetime.fromisoformat(L['lSD'][0][:26]); break
def wallToSes(iso):
    d = datetime.datetime.fromisoformat(iso[:26])
    return t0 + (d - lsd0).total_seconds()

cars = []; tEnd = 0
for c in codes:
    L = load(f'{c}/laptimes.json')
    samples = []
    pits = []
    out = []
    for li, lap in enumerate(L['lap']):
        p = os.path.join(RAW, c, f'{lap}_tel.json')
        if not os.path.exists(p): continue
        T = load(f'{c}/{lap}_tel.json')['tel']
        st = num(L['lST'][li])
        if st is None or not T['time']: continue
        if L['pin'][li] != 'None': pits.append(['in', lap])
        if L['pout'][li] != 'None': pits.append(['out', lap])
        # race distance from the car's own integrated lap distance, scaled so each lap is exactly one lap
        dist = [num(v) or 0 for v in T['distance']]
        lt = num(L['time'][li])
        dEnd = dist[-1] + ((num(T['speed'][-1]) or 0) / 3.6) * max(0, (lt - T['time'][-1])) if lt else dist[-1]
        if lap == 1:
            X, Z = toWorld(num(T['x'][0]), num(T['y'][0]))
            s0 = project(X, Z, None)[0]
            if s0 > lapLen / 2: s0 -= lapLen
            start, span = s0, lapLen - s0
        else:
            start, span = (lap - 1) * lapLen, lapLen
        k = span / dEnd if dEnd > lapLen * 0.5 else 1.0
        if not lt or lt > 400: k = 1.0  # stopped / unfinished lap: use raw distance
        guess = None
        for i in range(len(T['time'])):
            S = start + dist[i] * k
            x, y = num(T['x'][i]), num(T['y'][i])
            lat = 0.0
            if x is not None and y is not None:
                X, Z = toWorld(x, y)
                gi = int((S % lapLen) / STEP) % N
                _, lat, _, dd = project(X, Z, (gi - 20) % N)
                if dd > 80: lat = 0.0
            out.append((st + T['time'][i], S, lat, num(T['speed'][i]) or 0, num(T['rpm'][i]) or 0,
                        int(num(T['gear'][i]) or 0), num(T['throttle'][i]) or 0,
                        1 if (num(T['brake'][i]) or 0) > 0 else 0, 1 if (num(T['drs'][i]) or 0) in (1, 10, 12, 14) else 0, lap))
    out.sort(key=lambda s: s[0])
    ded = []; m = -1e9
    for s in out:
        if ded and s[0] <= ded[-1][0] + 1e-3: continue
        S = max(m, s[1]); m = S
        ded.append((s[0], S) + s[2:])
    out = ded
    cars.append({'code': c, 'samples': out, 'pits': pits})
    if out: tEnd = max(tEnd, out[-1][0])
    print(c, len(out), round(out[0][0]), round(out[-1][0]), round(out[-1][1] / lapLen, 2), file=sys.stderr)

T0 = t0 - 20  # a little grid time before lights out
NS = int((tEnd + 30 - T0) * HZ)
blob = bytearray()
meta_cars = []
dinfo = {d['driver']: d for d in drivers}
for car in cars:
    S = car['samples']; j = 0
    cols = {k: [] for k in ('dS', 'lat', 'spd', 'rpm', 'thr', 'flg')}
    prevS = None; first = None; last = None
    for n in range(NS):
        t = T0 + n / HZ
        while j < len(S) - 2 and S[j + 1][0] < t: j += 1
        if not S or t < S[0][0] or t > S[-1][0]:
            vals = None
        else:
            a, b = S[j], S[j + 1] if j + 1 < len(S) else S[j]
            k = 0 if b[0] == a[0] else (t - a[0]) / (b[0] - a[0])
            k = max(0, min(1, k))
            lerp = lambda i: a[i] + (b[i] - a[i]) * k
            near = a if k < 0.5 else b
            vals = (lerp(1), lerp(2), lerp(3), lerp(4), near[5], lerp(6), near[7], near[8])
        if vals is None:
            cols['dS'].append(0); cols['lat'].append(0); cols['spd'].append(0); cols['rpm'].append(0); cols['thr'].append(0); cols['flg'].append(0xF0)
            continue
        Sd = round(vals[0] * 10)  # decimetres
        if first is None: first = n; base = Sd; prevS = Sd
        d = max(0, min(65535, Sd - prevS)); prevS += d
        last = n
        cols['dS'].append(d)
        cols['lat'].append(max(-127, min(127, round(vals[1] * 4))))
        cols['spd'].append(max(0, min(255, round(vals[2] / 1.5))))
        cols['rpm'].append(max(0, min(255, round(vals[3] / 60))))
        cols['thr'].append(max(0, min(100, round(vals[5]))))
        cols['flg'].append((min(9, max(0, vals[4])) << 4) | vals[6] | (vals[7] << 1))
    off = len(blob)
    blob += struct.pack(f'<{NS}H', *cols['dS'])
    blob += struct.pack(f'<{NS}b', *cols['lat'])
    for k in ('spd', 'rpm', 'thr', 'flg'):
        blob += bytes(cols[k])
    while len(blob) % 4: blob.append(0)
    di = dinfo.get(car['code'], {})
    meta_cars.append({'code': car['code'], 'num': di.get('dn', ''), 'off': off, 'base': base if first is not None else 0,
                      'first': first, 'last': last, 'pits': car['pits']})

rcm = load('rcm.json'); events = []
for i, msg in enumerate(rcm['msg']):
    if not any(k in msg for k in ('SAFETY CAR', 'TRACK CLEAR', 'DRS ENABLED', 'DRS DISABLED', 'CHEQUERED', 'PENALTY', 'STANDING START')): continue
    if 'ZONE' in msg: continue
    events.append([round(wallToSes(rcm['time'][i]) - T0, 1), rcm['lap'][i], msg])
w = load('weather.json')
weather = [[round(num(w['wT'][i]) - T0, 1), num(w['wAT'][i]), num(w['wH'][i]), 1 if w['wR'][i] else 0, num(w['wWS'][i]), num(w['wWD'][i])] for i in range(len(w['wT']))]
corners = load('corners.json')
track = {'len': round(lapLen, 2), 'step': round(STEP, 4),
         'c': [[round(p[0], 2), round(p[1], 2), round(p[2], 2)] for p in C],
         'corners': [{'n': corners['CornerNumber'][i], 'd': round(corners['Distance'][i], 1)} for i in range(len(corners['CornerNumber']))]}
meta = {'race': '2025 British Grand Prix · Silverstone · Race', 'source': 'TracingInsights/2025 (FastF1 timing + telemetry)',
        'hz': HZ, 'n': NS, 'dur': NS / HZ, 'lightsOut': round(t0 - T0, 1), 'laps': 52, 'track': track,
        'cars': meta_cars, 'events': events, 'weather': weather}
os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, 'race.json'), 'w') as f: json.dump(meta, f, separators=(',', ':'))
with open(os.path.join(OUT, 'race.bin'), 'wb') as f: f.write(blob)
print('samples', NS, 'bin', len(blob), 'json', os.path.getsize(os.path.join(OUT, 'race.json')), file=sys.stderr)
