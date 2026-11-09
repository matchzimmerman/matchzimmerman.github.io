#!/usr/bin/env python3
"""MZ WORLD · FARM — build the portable world model.

Reads the measured / mapped Galway farmstead data that SHEEPDOG gathered
(MZTV/worlds/galway/*.json), adds the authored farm layout, and writes:

  farm.world.json   the portable world model (MZ WORLDS source-to-world lock, 2026-11-02):
                    entities, relationships, space, time, rules, ecosystems, evidence,
                    interpretation, controls + outputs. Every entity carries an epistemic tag.
  index.html        the block between /*<FARM_MODEL>*/ and /*</FARM_MODEL>*/ is replaced by the
                    compact runtime copy the world builds itself from (so the piece stays one file).

Run from the repo root:  python3 MZTV/sources/bit-field-045-farm/tools/build_model.py
Local frame (same as HEADLAND / INVERIN): metres, +x north, +z east, y = elevation (EU-DEM metres).
Origin = the user-selected SHEEPDOG site anchor, ITM EPSG:2157 506275.05 E, 722460.10 N.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
GAL = os.path.join(ROOT, 'MZTV', 'worlds', 'galway')
OUT_JSON = os.path.join(HERE, '..', 'farm.world.json')
OUT_HTML = os.path.join(HERE, '..', 'index.html')

ANCHOR_E, ANCHOR_N = 506275.05, 722460.10

def load(name):
    with open(os.path.join(GAL, name)) as f:
        return json.load(f)

site = load('sheepdog_farmstead_site_001.json')
dem = load('farmstead_eudem25m.json')
osm = load('farmstead_osm_local.json')

def itm_to_local(E, N):
    return [round(N - ANCHOR_N, 2), round(E - ANCHOR_E, 2)]   # [x north, z east]

# ---------------------------------------------------------------- measured: EU-DEM 25 m samples
e0, n0 = dem['sample_origin_itm_e_n']
step = dem['sample_step_m']
cols, rows = dem['columns'], dem['rows']
terrain = {
    'id': 'terrain.eudem25',
    'epistemic': 'documented',
    'kind': 'elevation-grid',
    'source': dem['source'], 'source_url': dem['source_url'], 'retrieved_on': dem['retrieved_on'],
    'note': '25 m digital surface model samples, NOT LiDAR; source-reported vertical RMSE about 7 m. '
            'No farmyard-scale height claims. Bilinear between samples; fine ground texture is artistic.',
    'origin_local_xz': itm_to_local(e0, n0),        # sample (row 0, col 0): south-west corner
    'step_m': step, 'cols': cols, 'rows': rows,
    'row_axis': '+x (north)', 'col_axis': '+z (east)',
    'samples_m': [round(v, 2) for v in dem['samples_m']],
    'attribution': dem.get('attribution', 'Copernicus / EEA EU-DEM v1.1 via Open Topo Data'),
}

# ---------------------------------------------------------------- mapped: OpenStreetMap features
ox0, oy0 = osm['reprojected_origin_itm_e_n']
def osm_pt(p):
    return itm_to_local(ox0 + p[0], oy0 + p[1])
FARM_BUILDINGS = {'1163118488': 'house', '1163356661': 'byre', '1163356662': 'byre', '1163356663': 'hay-barn'}
buildings, roads, osm_walls = [], [], []
for wid, tag, pts in osm['geometry']['building']:
    b = {'id': 'osm.way.' + wid, 'epistemic': 'documented', 'source': 'OpenStreetMap', 'osm_tag': tag,
         'footprint_local_xz': [osm_pt(p) for p in pts]}
    if wid in FARM_BUILDINGS:
        b['role'] = FARM_BUILDINGS[wid]
        b['interpretation'] = ('Footprint is mapped; the use shown (' + FARM_BUILDINGS[wid] + '), wall height, roof form '
                               'and materials are authored. OSM tags are not ground-verified.')
    else:
        b['role'] = 'neighbour-context'
        b['interpretation'] = 'Footprint is mapped; drawn as simple massing (heights and roofs authored).'
    buildings.append(b)
for wid, tag, pts in osm['geometry']['highway']:
    roads.append({'id': 'osm.way.' + wid, 'epistemic': 'documented', 'source': 'OpenStreetMap', 'osm_tag': tag,
                  'line_local_xz': [osm_pt(p) for p in pts]})
for wid, tag, pts in osm['geometry'].get('barrier', []):
    osm_walls.append({'id': 'osm.way.' + wid, 'epistemic': 'documented', 'source': 'OpenStreetMap', 'osm_tag': tag,
                      'line_local_xz': [osm_pt(p) for p in pts]})

# ---------------------------------------------------------------- authored: the farm as a working place
A = 'authored'
fields = [
    {'id': 'field.home', 'name': 'the home field', 'epistemic': A,
     'poly_xz': [[-2, -150], [70, -150], [70, 18], [44, 12], [30, 12], [30, -30], [-2, -30]]},
    {'id': 'field.hill', 'name': 'the hill field', 'epistemic': A,
     'poly_xz': [[70, -150], [200, -150], [200, 22], [70, 18]]},
    {'id': 'field.low', 'name': 'the low field', 'epistemic': A,
     'poly_xz': [[-60, -150], [-2, -150], [-2, -70], [-60, -70]],
     'contains': ['osm.way.1163356660']},
    {'id': 'fold', 'name': 'the fold', 'epistemic': A,
     'poly_xz': [[14, -30], [30, -30], [30, -14], [14, -14]]},
]
# drystone walls (polylines). Gates cut them; a closed gate is a wall to a sheep.
walls = [
    {'id': 'wall.west', 'epistemic': A, 'line_xz': [[-60, -150], [-2, -150], [70, -150], [110, -150]]},
    {'id': 'wall.site', 'epistemic': A, 'line_xz': [[110, -150], [168, -150]], 'site': True,
     'note': 'a tumbled stretch the farmer is rebuilding, stone by stone; its height is world memory'},
    {'id': 'wall.west2', 'epistemic': A, 'line_xz': [[168, -150], [200, -150]]},
    {'id': 'wall.north', 'epistemic': A, 'line_xz': [[200, -150], [200, 22]]},
    {'id': 'wall.east', 'epistemic': A, 'line_xz': [[200, 22], [70, 18], [44, 12], [30, 12], [30, -14]]},
    {'id': 'wall.homehill', 'epistemic': A, 'line_xz': [[70, -150], [70, 18]]},
    {'id': 'wall.homelow', 'epistemic': A, 'line_xz': [[-2, -150], [-2, -70], [-60, -70], [-60, -150]]},
    {'id': 'wall.homesouth', 'epistemic': A, 'line_xz': [[-2, -70], [-2, -30], [14, -30]]},
    {'id': 'wall.fold', 'epistemic': A, 'line_xz': [[14, -30], [30, -30], [30, -14], [14, -14], [14, -30]]},
]
gates = [
    {'id': 'gate.foldhome', 'epistemic': A, 'at_xz': [30, -22], 'width': 3.6, 'axis': 'z', 'joins': ['fold', 'field.home']},
    {'id': 'gate.foldyard', 'epistemic': A, 'at_xz': [14, -22], 'width': 3.0, 'axis': 'z', 'joins': ['fold', 'yard']},
    {'id': 'gate.yardhome', 'epistemic': A, 'at_xz': [30, 2], 'width': 3.6, 'axis': 'z', 'joins': ['yard', 'field.home']},
    {'id': 'gate.homehill', 'epistemic': A, 'at_xz': [70, -92], 'width': 4.0, 'axis': 'z', 'joins': ['field.home', 'field.hill']},
    {'id': 'gate.homelow', 'epistemic': A, 'at_xz': [-2, -132], 'width': 4.0, 'axis': 'z', 'joins': ['field.home', 'field.low']},
]
props = [
    {'id': 'yard', 'kind': 'yard', 'epistemic': A, 'poly_xz': [[-18, -18], [14, -18], [14, -14], [30, -14], [30, 12], [22, 13], [-18, 22]]},
    {'id': 'stonepile', 'kind': 'stone-pile', 'epistemic': A, 'at_xz': [139, -144]},
    {'id': 'trough', 'kind': 'trough', 'epistemic': A, 'at_xz': [12, -11]},
    {'id': 'bowl', 'kind': 'dog-bowl', 'epistemic': A, 'at_xz': [-3, -2]},
    {'id': 'bed', 'kind': 'dog-bed', 'epistemic': A, 'at_xz': [8.2, -5.6], 'in': 'osm.way.1163356662'},
    {'id': 'thorn', 'kind': 'hawthorn', 'epistemic': A, 'at_xz': [152, -62]},
    {'id': 'shore', 'kind': 'coastline', 'epistemic': 'estimated', 'at_x': -750,
     'note': 'Galway Bay to the south. Position extrapolated from the regional DEM slope and HEADLAND\'s Inverin coast '
             '(53.236 N); not surveyed. No shore geometry is claimed.'},
    {'id': 'clare', 'kind': 'far-hills', 'epistemic': 'speculative',
     'note': 'hills across the bay on the southern horizon (the Burren side), sculpted to suggest; not surveyed'},
]

inhabitants = [
    {'id': 'bernard', 'name': 'Bernard', 'kind': 'border collie', 'epistemic': 'fictional', 'central': True,
     'routine': ['dawn: gathers the flock from the fold to the field with the most grass',
                 'day: watches the sheep from a wall, naps in the sun, drinks at the trough, trails the farmer',
                 'answers the whistle: comes running to the farmer from wherever he is',
                 'dusk: brings the flock back into the fold', 'night: sleeps in the byre'],
     'body': 'procedural IK gaits (walk, trot, canter, rotary gallop), stalk/eye, clap, wag; ported from the SHEEPDOG Godot test',
     'memory': 'experience 0-1 grows with each day worked (wider, steadier, fewer breaks)'},
    {'id': 'farmer', 'name': 'the farmer', 'kind': 'person', 'epistemic': 'fictional',
     'routine': ['indoors at night and in heavy rain', 'opens and closes gates for each move',
                 'rebuilds the tumbled stretch of the hill field\'s west wall, a stone every few minutes',
                 'walks the walls to check gates; sometimes goes off down the lane and is away a while',
                 'whistles Bernard over'],
     'body': 'waxed coat, flat cap, hooked crook; procedural walk, stoop, carry'},
    {'id': 'flock', 'name': 'the flock', 'kind': '20 blackface ewes', 'epistemic': 'fictional',
     'behaviour': 'graze, bunch and flow from the dog; give a standing person a wide berth; walls hold them; lie down to ruminate',
     'marked_ewe': 'the flightiest ewe carries a coral raddle mark; under moderate pressure she breaks for it, and her breaks and favourite direction are remembered'},
]

events = [
    {'id': 'gather', 'label': 'Bernard gathered a flock that was not there', 'main': True,
     'condition': 'Bernard idle, the flock penned or far off, low light, damp air', 'sound': 'flat-II chord + reverse swell'},
    {'id': 'turn', 'label': 'the whole flock turned to face the bay', 'condition': 'flock grazing calm, no dog near, light wind',
     'sound': 'a high fifth in the room'},
    {'id': 'lie', 'label': 'every ewe lay down at once, facing the same way', 'condition': 'humidity high and rising, heavy cloud',
     'sound': 'a sub that swells with a breath'},
    {'id': 'stone', 'label': 'the wall took a stone by itself', 'condition': 'dusk or night, the farmer indoors, the wall worked that day',
     'sound': 'a single stone, then the wall settling'},
    {'id': 'hush', 'label': 'the field held still', 'condition': 'tension reaches 1 (rupture)', 'sound': 'the band drops out'},
]

memory = {
    'grass': 'grazing map over the fields; ewes eat it down where they stand, it regrows over days; the farmer moves the flock to the field with the most grass',
    'tread': 'worn paths where feet pass; they fade over days and print as bare ground; sheep follow them a little',
    'wall': 'stones laid in the tumbled stretch (grows over weeks)',
    'bernard': 'experience',
    'marked_ewe': 'breaks and the side she breaks to',
    'events': 'conditions each event happened in (hour, humidity, flock calm); they recur more readily under similar ones and habituate',
    'store': 'localStorage mzworld-farm-v1, saved every 60 s and on unload; ?fresh=1 clears it',
}

model = {
    'schema': 'mz-world-model-0.1',
    'id': 'mz-world-farm', 'name': 'MZ WORLD · FARM (working title)',
    'built': '2026-11-08', 'author': 'MZ.Claude', 'approval': 'NOT VISUALLY APPROVED (awaiting MZ.Human)',
    'parent_world': 'INVERIN',
    'standard': 'MZ WORLD HEADLAND build standard v1.2 (haril-studio/docs/standards/mz-world-headland.md)',
    'architecture': 'MZ WORLDS Canonical Source-to-World Architecture (MZ.Human lock 2026-11-02)',
    'evidence_scale': {
        'documented': 'measured or mapped by a cited source (EU-DEM, OpenStreetMap, Open-Meteo, solar/lunar ephemeris)',
        'estimated': 'derived from documented data by stated reasoning (shore position)',
        'authored': 'designed for the world (fields, walls, gates, fold, props); not claims about the real property',
        'fictional': 'inhabitants and their lives',
        'speculative': 'suggested far scenery',
    },
    'space': {
        'crs': 'EPSG:2157 (Irish Transverse Mercator)', 'anchor_itm_e_n': [ANCHOR_E, ANCHOR_N],
        'anchor_wgs84_lat_lon': [site['anchor_lonlat_wgs84'][1], site['anchor_lonlat_wgs84'][0]],
        'local_axes': 'metres; +x north, +z east, y elevation (same convention as HEADLAND and INVERIN)',
        'shared_world_origin_itm_e_n': site['shared_world_origin_itm_easting_northing'],
        'anchor_xz_in_shared_world_east_north': site['anchor_xz_metres_in_shared_world'],
        'site_status': site['status'],
        'not_claimed': ['property or field boundaries', 'gates or livestock routes', 'ownership', 'geology', 'LiDAR heights'],
    },
    'time': {'clock': 'real Galway time (Europe/Dublin)', 'sun_moon': 'computed for the anchor', 'weather': 'Open-Meteo, polled every 15 min, slewed; simulated fallback labelled on screen'},
    'entities': {'terrain': terrain, 'buildings': buildings, 'roads': roads, 'osm_walls': osm_walls,
                 'fields': fields, 'walls': walls, 'gates': gates, 'props': props, 'inhabitants': inhabitants},
    'rules': {'events': events, 'memory': memory,
              'rupture': 'tension builds with stability (50-95 min epochs) and each event; at 1 the field holds still, then the print re-inks (colourway, line grammar, harmonic centre)'},
    'ecosystems': {'weather_inputs': {
        'wind': 'grass and fleece motion, wind bed, cloud drift', 'cloud': 'light, sky',
        'humidity': 'haze distance, dub-echo feedback, the lie event', 'rain': 'rain streaks; the farmer and Bernard go in; ewes shelter in the lee of a wall',
        'swell (marine)': 'the far bay'},
        'tempo': 'bar length 4.0-6.6 s from the flock\'s pace (grazing slow, driven fast)',
        'bass': 'degree from where Bernard is'},
    'interpretation': {'aesthetic': 'HEADLAND linocut-through-OBAS print, SRUTHÁN v3 surface-carved hatching, six inks',
                       'new_rendering_idea': 'the field\'s memory printed into the grass: long grass carved by the wind, grazed and trodden ground as stipple and bare earth'},
    'outputs': {'mztv': 'index.html (broadcast; observational crew, 10 operators)', 'inverin_port': 'PORT.md (FARM sections + this model, planted at an INVERIN anchor)'},
    'attribution': ['© OpenStreetMap contributors (ODbL 1.0)', 'Copernicus / EEA EU-DEM v1.1 via Open Topo Data', 'Weather: Open-Meteo'],
}

with open(OUT_JSON, 'w') as f:
    json.dump(model, f, indent=1, ensure_ascii=False)

# compact runtime copy: only what the renderer and sim use
rt = {
    'dem': {k: terrain[k] for k in ('origin_local_xz', 'step_m', 'cols', 'rows', 'samples_m')},
    'buildings': [{'id': b['id'], 'role': b['role'], 'tag': b['osm_tag'], 'fp': b['footprint_local_xz']} for b in buildings],
    'roads': [{'id': r['id'], 'tag': r['osm_tag'], 'line': r['line_local_xz']} for r in roads],
    'osmWalls': [w['line_local_xz'] for w in osm_walls],
    'fields': [{'id': f['id'], 'name': f['name'], 'poly': f['poly_xz']} for f in fields],
    'walls': [{'id': w['id'], 'line': w['line_xz'], 'site': bool(w.get('site'))} for w in walls],
    'gates': [{'id': g['id'], 'at': g['at_xz'], 'w': g['width'], 'axis': g['axis'], 'joins': g['joins']} for g in gates],
    'props': {p['id']: {k: v for k, v in p.items() if k in ('at_xz', 'poly_xz', 'at_x', 'kind')} for p in props},
}
blob = json.dumps(rt, separators=(',', ':'), ensure_ascii=False)
if os.path.exists(OUT_HTML):
    html = open(OUT_HTML).read()
    new, n = re.subn(r'/\*<FARM_MODEL>\*/.*?/\*</FARM_MODEL>\*/', lambda m: '/*<FARM_MODEL>*/' + blob + '/*</FARM_MODEL>*/', html, flags=re.S)
    if n != 1:
        sys.exit('index.html has no FARM_MODEL block')
    open(OUT_HTML, 'w').write(new)
print('model:', os.path.relpath(OUT_JSON, ROOT), len(json.dumps(model)), 'bytes · runtime blob', len(blob), 'bytes')
