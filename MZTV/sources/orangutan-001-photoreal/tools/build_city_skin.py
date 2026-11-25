#!/usr/bin/env python3
"""ORANGUTAN 001 · PHOTOREAL · city skin data: Baltimore from two MZ GROUND SURVEY fields, as one map for the body.

  python3 tools/build_city_skin.py <harborplace field.json> <jones-falls field.json> city.json [--hp-ref SHA] [--jf-ref SHA]

Sources (both in haril-studio):
  Harborplace field (branch claude/mzgs-harborplace-now-future): today's buildings (City outlines + 2024 USGS lidar tiers),
    streets, the harbour water polygon WT-1, and the NEW Harborplace (architecture.parts: the 2024 design on the Jan 2026
    permit footprints; proposed, not built). City buildings standing where the new Harborplace buildings go are dropped.
  Jones Falls field (branch claude/mzgs-jones-falls-field): today's buildings and streets in the valley north of the
    Harborplace frame. Where the two frames overlap, the Harborplace field wins (its buildings carry lidar tiers).
Landmarks (P1.3, MZ.Human 2026-11-24):
  trees (both fields: 2024 lidar crowns), USS Constellation (Harborplace field: hull outline, rail, masts, yards, bowsprit
  from the 2024 point cloud), National Aquarium (Harborplace field height grid, 2 m, max-pooled to 6 m), Phoenix Shot
  Tower (Jones Falls field: measured centre, 65.76 m to the tips, 12.32 m to 6.1 m diameter, 10 battlements), the Jones
  Falls as surveyed in 1868 (open channel, now buried), and the Domino Sugars refinery and sign as built in HARBOUR LIGHT
  (MZTV bit-field-047: boxes in metres from its origin 39.2748 N, 76.6003 W, converted with pyproj to UTM 18N).
Coordinates: NAD83 / UTM 18N metres, written relative to ORIGIN (E 360500, N 4348600) and rounded to 0.1 m.
Heights: metres above ground; each tier is a prism from z0 to z1.
"""
import json, sys, argparse, math

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
    O = ORIGIN; L = lambda x, y: [round(x - O[0], 1), round(y - O[1], 1)]
    # trees: [x, y, height, crown radius]
    trees = [[*L(t[0], t[1]), round(t[3], 1), round(t[4], 1)] for t in HP['context']['trees_now']['trees']]
    trees += [[*L(t[0], t[1]), round(t[3], 1), round(t[4], 1)] for t in JF['context']['trees_now']['trees'] if not in_hp((t[0], t[1]))]
    c = HP['context']['constellation']
    con = {'name': c['name'], 'hull': [L(*p) for p in c['hull_outline']], 'layers': c['layers'], 'masts': [{'n': m['name'], 'at': L(*m['at']), 'top': m['top_above_water_m']} for m in c['masts']],
           'yards': [{'a': L(*y['a']), 'b': L(*y['b']), 'z': y['z']} for y in c['yards']], 'bowsprit': {'a': L(*c['bowsprit']['a']), 'b': L(*c['bowsprit']['b']), 'za': c['bowsprit']['za'], 'zb': c['bowsprit']['zb']}, 'source': c['source'] + ' (Harborplace field)'}
    st = [e for e in JF['entities'] if e.get('id') == 'shot-tower'][0]; sa = st['attributes']
    shot = {'name': st['name'], 'at': L(*st['geometry']['coords']), 'height': sa['height_to_tips_m'], 'base_d': sa['base_diameter_m'], 'top_d': sa['top_diameter_m'], 'battlements': sa.get('battlements', 10),
            'floors': sa.get('floors', 14), 'openings': sa.get('openings', {}), 'face_bearing_deg': sa.get('face_bearing_deg', 0), 'source': 'Jones Falls Field anchor (2024 point cloud circle fits); openings as recorded there'}
    # National Aquarium (P1.4): the glass pyramid roofs fitted to the lidar's sloped cells (min-area rectangle, base = lowest cell,
    # apex = highest), the south-end cylinder fitted to the field's neon-wave trace, and the rest as columns (2 m grid, 6 m cells)
    import numpy as np
    from scipy import ndimage as ndi
    from shapely.geometry import MultiPoint
    AQ = HP['context']['aquarium']; g = AQ['grid']; step = g['step']
    H = np.array([[np.nan if v is None else v for v in row] for row in g['h']])
    gy, gx = np.gradient(H, step); sl = np.degrees(np.arctan(np.hypot(gx, gy)))
    lab, nlab = ndi.label((sl > 14) & (H > 15)); pyr = []; pmask = np.zeros(H.shape, bool)
    for kk in range(1, nlab + 1):
        jj, ii = np.nonzero(lab == kk)
        if len(jj) < 120: continue  # the three pyramid roofs; small sloped patches are parapets and edges
        pts = [(g['e0'] + i * step, g['n0'] - j * step) for j, i in zip(jj, ii)]
        rect = MultiPoint(pts).minimum_rotated_rectangle; cs = list(rect.exterior.coords)[:4]
        hv = H[jj, ii]; pyr.append({'corners': [L(*q) for q in cs], 'z0': round(float(np.percentile(hv, 3)), 1), 'z1': round(float(hv.max()), 1)})
        pmask |= ndi.binary_dilation(lab == kk, iterations=1)
    Wv = np.array(AQ['wave']); xs, ys = Wv[:, 0], Wv[:, 1]; A = np.c_[2 * xs, 2 * ys, np.ones(len(xs))]; cc = np.linalg.lstsq(A, xs * xs + ys * ys, rcond=None)[0]
    cyl_c = (cc[0], cc[1]); cyl_r = float(np.sqrt(cc[2] + cc[0] ** 2 + cc[1] ** 2))
    ci, cj = int(round((cyl_c[0] - g['e0']) / step)), int(round((g['n0'] - cyl_c[1]) / step))
    ring = [H[j, i] for j in range(cj - 4, cj + 5) for i in range(ci - 4, ci + 5) if 0 <= j < H.shape[0] and 0 <= i < H.shape[1] and not np.isnan(H[j, i]) and math.hypot((i - ci) * step, (j - cj) * step) <= cyl_r]
    cyl = {'c': L(*cyl_c), 'r': round(cyl_r, 2), 'z1': round(float(np.median([h for h in ring if h < 23.5] or [21.5])), 1), 'wave': [[*L(x, y), round(z, 2)] for x, y, z in AQ['wave']]}
    k = 3; cells = []
    for j in range(0, g['ny'], k):
        for i in range(0, g['nx'], k):
            blk = [(jj, ii) for jj in range(j, min(j + k, g['ny'])) for ii in range(i, min(i + k, g['nx'])) if not np.isnan(H[jj, ii])]
            if len(blk) < 3: continue
            ex, nx_ = g['e0'] + (i + k / 2) * step, g['n0'] - (j + k / 2) * step
            if math.hypot(ex - cyl_c[0], nx_ - cyl_c[1]) < cyl_r: continue          # the cylinder stands here
            hs = [H[jj, ii] for jj, ii in blk if not pmask[jj, ii]] or [min(H[jj, ii] for jj, ii in blk)]  # under a pyramid: its base
            cells.append([round(ex - O[0], 1), round(nx_ - O[1], 1), round(float(max(hs)), 1)])
    aqua = {'name': AQ['name'], 'cell': step * k, 'cells': cells, 'pyramids': pyr, 'cylinder': cyl,
            'source': 'Harborplace field (2024 lidar height grid; glass pyramids with blue LED edges added 2022; the blue neon wave on the 1981 building south end is the field\'s stylised trace, not surveyed)'}
    # Domino Sugars, from HARBOUR LIGHT (bit-field-047): addBox(x, z, half-north, half-east, z0, z1, ...), metres east (x) and north (z) of its origin
    DE, DN = 361961.2, 4348492.7
    HB = [(0, 140, 62, 34, 0, 40, 0, 'refinery house'), (96, 130, 34, 30, 0, 34, 0, 'char house'), (-110, 140, 50, 30, 0, 22, 4, 'raw sugar shed'), (-190, 150, 30, 28, 0, 16, 3, 'shed'),
          (150, 95, 20, 16, 0, 26, 0, 'annex'), (0, 104, 30, 14, 40, 45, 0, 'roof house'), (0, 196, 150, 7, 0, 3, 0, 'wharf')]
    dom = {'name': 'Domino Sugars refinery (1922) and sign (1951)', 'boxes': [{'c': L(DE + x, DN + z), 'hn': hn, 'he': he, 'z0': z0, 'z1': z1, 'gable': gb, 'n': nm} for x, z, hn, he, z0, z1, gb, nm in HB],
           'stacks': [{'c': L(DE + 112, DN + 108), 'r': 2.6, 'z0': 34, 'z1': 70}, {'c': L(DE + 122, DN + 104), 'r': 2.4, 'z0': 34, 'z1': 66}],
           'sign': {'c': L(DE, DN + 172), 'z0': 41, 'z1': 62.3, 'w': 36.6, 'faces': 'north (the harbour)'},
           'source': 'MZTV bit-field-047 HARBOUR LIGHT (sign 120 x 70 ft, lit 1951, on the 1922 refinery on Key Highway); positions as built there, not surveyed'}
    dom_boxes = [(DE + x - he, DN + z - hn, DE + x + he, DN + z + hn) for x, z, hn, he, *_ in HB]
    before = len(B); B[:] = [b for b in B if not (b['s'] == 'hp' and any(x0 <= ORIGIN[0] + cen(b['tiers'][0]['r'])[0] <= x1 and y0 <= ORIGIN[1] + cen(b['tiers'][0]['r'])[1] <= y1 for x0, y0, x1, y1 in dom_boxes))]
    rv = [e for e in JF['entities'] if e.get('id') == 'river-1868'][0]
    rivers = [{'id': rv['id'], 'name': rv['name'], 'era': '1868', 'status': 'buried 1911-15 (conduits under the Fallsway)', 'r': loc(rv['geometry']['coords'])}]
    out = {
        'schema': 'orangutan-001.city-skin/1', 'origin_utm18n': ORIGIN, 'crs': 'EPSG:26918 (NAD83 / UTM 18N), metres relative to origin',
        'sources': {
            'harborplace': {'repo': 'matchzimmerman/haril-studio', 'branch': 'claude/mzgs-harborplace-now-future', 'ref': a.hp_ref, 'field': HP.get('built'),
                            'buildings': HP['context']['fabric_now']['source'], 'new_harborplace': 'architecture.parts: 2024 design on Jan 2026 permit footprints (proposed, not built)',
                            'water': 'WT-1, 2024 DEM hydro-flattened', 'streets': HP['context']['streets']['source']},
            'jones_falls': {'repo': 'matchzimmerman/haril-studio', 'branch': 'claude/mzgs-jones-falls-field', 'ref': a.jf_ref, 'field': JF.get('built'),
                            'buildings': JF['context']['fabric_now']['source'], 'streets': JF['context']['streets']['source']}},
        'counts': {'trees': len(trees), 'buildings_under_domino_dropped': before - len(B), 'buildings': len(B), 'new_harborplace_buildings': len(by), 'hp_buildings_replaced_by_new': n_drop, 'jf_buildings_outside_hp_frame': n_jf, 'streets': len(S)},
        'keys': {'s': 'source: hp | jf | new', 'k': '0 masonry, 1 tower (>= 40 m), 2 new Harborplace', 'n': '1 = nominal height (no lidar / survey height)', 'g': 'glass part'},
        'buildings': B, 'streets': S, 'water': loc(water), 'trees': trees, 'rivers': rivers,
        'landmarks': {'constellation': con, 'shot_tower': shot, 'aquarium': aqua, 'domino': dom},
    }
    json.dump(out, open(a.out, 'w'), separators=(',', ':'))
    print(json.dumps(out['counts']))


if __name__ == '__main__':
    main()
