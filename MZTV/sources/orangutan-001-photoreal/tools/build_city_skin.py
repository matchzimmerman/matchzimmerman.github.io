#!/usr/bin/env python3
"""ORANGUTAN 001 · PHOTOREAL · city skin data: Baltimore from two MZ GROUND SURVEY fields, as one map for the body.

  python3 tools/build_city_skin.py <harborplace field.json> <jones-falls field.json> city.json [--hp-ref SHA] [--jf-ref SHA]

Sources (both in haril-studio):
  Harborplace field (branch claude/mzgs-harborplace-now-future): today's buildings (City outlines + 2024 USGS lidar tiers),
    streets, the harbour water polygon WT-1, and the NEW Harborplace (architecture.parts: the 2024 design on the Jan 2026
    permit footprints; proposed, not built). City buildings standing where the new Harborplace buildings go are dropped.
  Jones Falls field (branch claude/mzgs-jones-falls-field): today's buildings and streets in the valley north of the
    Harborplace frame. Where the two frames overlap, the Harborplace field wins (its buildings carry lidar tiers).
Coordinates: NAD83 / UTM 18N metres, written relative to ORIGIN (E 360500, N 4348600) and rounded to 0.1 m.
Heights: metres above ground; each tier is a prism from z0 to z1.
"""
import json, sys, argparse

ORIGIN = (360500.0, 4348600.0)
HP_BOX = (360500.0, 4348600.0, 362100.0, 4350400.0)


def cen(r):
    return sum(p[0] for p in r) / len(r), sum(p[1] for p in r) / len(r)


def inside(pt, poly):
    x, y = pt; c = False; n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c


def loc(r):
    out = [[round(x - ORIGIN[0], 1), round(y - ORIGIN[1], 1)] for x, y in r]
    if len(out) > 2 and out[0] == out[-1]: out = out[:-1]
    return out


def in_hp(pt):
    return HP_BOX[0] <= pt[0] <= HP_BOX[2] and HP_BOX[1] <= pt[1] <= HP_BOX[3]


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('hp'); ap.add_argument('jf'); ap.add_argument('out')
    ap.add_argument('--hp-ref', default=''); ap.add_argument('--jf-ref', default=''); a = ap.parse_args()
    HP, JF = json.load(open(a.hp)), json.load(open(a.jf))
    arch = HP['architecture']['parts']
    new_fp = [p['r'] for p in arch]
    B, S = [], []
    # the new Harborplace (proposed): every architectural part is a prism; glass parts read as glass
    by = {}
    for p in arch: by.setdefault(p['b'], []).append(p)
    for bid, parts in by.items():
        B.append({'s': 'new', 'id': bid, 'k': 2, 'tiers': [{'r': loc(p['r']), 'z0': round(p['z0'], 1), 'z1': round(p['z1'], 1), 'g': 1 if p['k'] == 'glass' else 0} for p in parts]})
    n_drop = 0
    for b in HP['context']['fabric_now']['blocks']:
        c = cen(b['tiers'][0]['r'])
        if any(inside(c, fp) for fp in new_fp): n_drop += 1; continue
        top = max(t['h'] for t in b['tiers'])
        B.append({'s': 'hp', 'id': b['id'], 'k': 1 if top >= 40 else 0, 'n': 1 if b['t'] == 'nominal' else 0,
                  'tiers': [{'r': loc(t['r']), 'z0': 0, 'z1': round(t['h'], 1)} for t in b['tiers']]})
    n_jf = 0
    for b in JF['context']['fabric_now']['blocks']:
        c = cen(b['r'])
        if in_hp(c): continue
        n_jf += 1
        B.append({'s': 'jf', 'k': 1 if b['h'] >= 40 else 0, 'n': 1 if b.get('t') is False else 0, 'tiers': [{'r': loc(b['r']), 'z0': 0, 'z1': round(b['h'], 1)}]})
    for l in HP['context']['streets']['lines']: S.append({'n': l.get('n', ''), 'c': loc(l['c'])})
    for l in JF['context']['streets']['lines']:
        mid = l['c'][len(l['c']) // 2]
        if not in_hp(mid): S.append({'n': l.get('n', ''), 'c': loc(l['c'])})
    water = [e for e in HP['entities'] if e.get('type') == 'water_target'][0]['geometry']['coords']
    out = {
        'schema': 'orangutan-001.city-skin/1', 'origin_utm18n': ORIGIN, 'crs': 'EPSG:26918 (NAD83 / UTM 18N), metres relative to origin',
        'sources': {
            'harborplace': {'repo': 'matchzimmerman/haril-studio', 'branch': 'claude/mzgs-harborplace-now-future', 'ref': a.hp_ref, 'field': HP.get('built'),
                            'buildings': HP['context']['fabric_now']['source'], 'new_harborplace': 'architecture.parts: 2024 design on Jan 2026 permit footprints (proposed, not built)',
                            'water': 'WT-1, 2024 DEM hydro-flattened', 'streets': HP['context']['streets']['source']},
            'jones_falls': {'repo': 'matchzimmerman/haril-studio', 'branch': 'claude/mzgs-jones-falls-field', 'ref': a.jf_ref, 'field': JF.get('built'),
                            'buildings': JF['context']['fabric_now']['source'], 'streets': JF['context']['streets']['source']}},
        'counts': {'buildings': len(B), 'new_harborplace_buildings': len(by), 'hp_buildings_replaced_by_new': n_drop, 'jf_buildings_outside_hp_frame': n_jf, 'streets': len(S)},
        'keys': {'s': 'source: hp | jf | new', 'k': '0 masonry, 1 tower (>= 40 m), 2 new Harborplace', 'n': '1 = nominal height (no lidar / survey height)', 'g': 'glass part'},
        'buildings': B, 'streets': S, 'water': loc(water),
    }
    json.dump(out, open(a.out, 'w'), separators=(',', ':'))
    print(json.dumps(out['counts']))


if __name__ == '__main__':
    main()
