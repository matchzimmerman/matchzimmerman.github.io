#!/usr/bin/env python3
"""BIT FIELD 048 · Phase 01 capture and QA.
Serves the piece locally, loads every view × camera × weather in headless Chromium,
saves PNGs, records console errors, render timings, evidence shares and frame-rate,
and checks that captures with the same seed and ?t= are byte-identical.

usage: python3 -I tests/capture.py [OUTDIR]     (run from the piece folder)
"""
import hashlib, http.server, json, os, socketserver, sys, threading, time
from functools import partial
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'captures'))
os.makedirs(OUT, exist_ok=True)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), partial(Quiet, directory=HERE)); PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{PORT}/index.html'

report = {'runs': [], 'errors': [], 'repro': {}, 'fps': {}}
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    ctx = b.new_context(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
    ctx.route('**/fonts.googleapis.com/**', lambda r: r.abort())
    def shot(name, q, wait=1.2, sel='#stage'):
        pg = ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') and 'net::ERR_FAILED' not in m.text else None)  # the blocked webfont is expected offline
        pg.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
        t = time.time(); pg.goto(f'{BASE}?{q}'); pg.wait_for_function('window.MZ && window.MZ.frames > 0', timeout=60000)
        pg.wait_for_timeout(int(wait * 1000)); load = time.time() - t
        path = os.path.join(OUT, f'{name}.png'); pg.locator(sel).screenshot(path=path)
        st = pg.evaluate('MZ.state'); pg.close()
        rec = {'name': name, 'query': q, 'load_s': round(load, 2), 'state': st, 'errors': errs,
               'sha1': hashlib.sha1(open(path, 'rb').read()).hexdigest()}
        report['runs'].append(rec); report['errors'] += [f'{name}: {e}' for e in errs]
        print(f'{name:34s} {load:5.1f}s  raster {st["stats"]["raster"]}  print {st["stats"]["print"]}  errors {len(errs)}')
        return rec

    # the review set: camera 0 at the scene moment, frozen time, three views, both weathers
    for wx in ('drizzle', 'clear'):
        for v in ('ink', 'neutral', 'evidence'):
            shot(f'cam0-{wx}-{v}', f'view={v}&cam=0&wx={wx}&t=12&seed=48')
    # captures without chrome (for the contact sheet and the publication packet)
    for wx in ('drizzle', 'clear'):
        for v in ('ink', 'neutral', 'evidence'):
            shot(f'clean-cam0-{wx}-{v}', f'view={v}&cam=0&wx={wx}&t=12&seed=48&capture=1&stamp=0')
    # alternate stations
    for c in (1, 2):
        for v in ('ink', 'neutral', 'evidence'):
            shot(f'cam{c}-drizzle-{v}', f'view={v}&cam={c}&t=12&seed=48&capture=1&stamp=0')
    # exterior stations
    for c in (3, 4, 5):
        for v in ('ink', 'neutral', 'evidence'):
            shot(f'cam{c}-drizzle-{v}', f'view={v}&cam={c}&t=12&seed=48&capture=1&stamp=0')
    # reproducibility: same params twice must give the same pixels
    a = shot('repro-a', 'view=ink&cam=0&t=30&seed=48&capture=1&stamp=0', wait=.6)
    bb = shot('repro-b', 'view=ink&cam=0&t=30&seed=48&capture=1&stamp=0', wait=.6)
    report['repro'] = {'identical': a['sha1'] == bb['sha1'], 'sha1': a['sha1']}
    # motion: two times differ only by drizzle/cloud
    shot('motion-t0', 'view=ink&cam=0&t=0&seed=48&capture=1&stamp=0', wait=.6)
    # frame rate of the live ink loop (12 fps target) over 5 s
    pg = ctx.new_page(); pg.goto(f'{BASE}?view=ink&cam=0'); pg.wait_for_function('window.MZ && MZ.frames > 0', timeout=60000)
    f0 = pg.evaluate('MZ.frames'); pg.wait_for_timeout(5000); f1 = pg.evaluate('MZ.frames')
    report['fps']['ink_live'] = round((f1 - f0) / 5, 2); report['fps']['print_ms'] = pg.evaluate('MZ.STATS.print')
    # responsive layout: portrait phone and ultrawide
    for name, vp in (('layout-phone', (390, 844)), ('layout-ultrawide', (3440, 1440))):
        pg.set_viewport_size({'width': vp[0], 'height': vp[1]}); pg.wait_for_timeout(500)
        pg.screenshot(path=os.path.join(OUT, f'{name}.png'))
        box = pg.evaluate("(()=>{const r=document.getElementById('stage').getBoundingClientRect();return [r.width,r.height]})()")
        report[name] = {'viewport': vp, 'stage': box, 'aspect': round(box[0] / box[1], 4)}
    pg.close(); b.close()
srv.shutdown()
json.dump(report, open(os.path.join(OUT, 'report.json'), 'w'), indent=1)
print('repro identical:', report['repro']['identical'], '| live ink fps:', report['fps']['ink_live'], '| errors:', len(report['errors']))
for e in report['errors'][:20]: print('  ', e)
