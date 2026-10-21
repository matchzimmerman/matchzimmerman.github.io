#!/usr/bin/env python3
"""AIR (experience page) QA: shots at different light, Doppler flyby recording, version roll-over + re-ink."""
import base64, json, os, shutil, subprocess, sys
from pathlib import Path
import numpy as np
from playwright.sync_api import sync_playwright
BASE, OUT = sys.argv[1].rstrip('/'), Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
ENG = Path(__file__).resolve().parents[1]
PAGE = BASE + '/MZTV/sources/earhart-last-flight-research-engine/air.html'
WANT = set(sys.argv[3:]) or {'shots', 'flyby', 'rollover'}
R = {'errors': []}
def open_(b, q, w=1920, h=1080):
    p = b.new_page(viewport={'width': w, 'height': h})
    p.on('pageerror', lambda e: R['errors'].append(str(e)[:300]))
    p.on('console', lambda m: R['errors'].append(m.text[:300]) if m.type == 'error' else None)
    p.goto(PAGE + '?' + q)
    for _ in range(120):
        if p.evaluate('!!window.__last'): return p
        p.wait_for_timeout(500)
    raise RuntimeError('page never rendered: ' + q)
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"],
                           proxy={"server": os.environ["HTTPS_PROXY"], "bypass": "localhost,127.0.0.1,192.0.2.2"})
    if 'shots' in WANT:
        for t, cam in ((3.0, 'CHASE'), (7.45, 'SILHOUETTE'), (7.45, 'COCKPIT'), (12, 'CHASE'), (18.55, 'SILHOUETTE'), (5, 'FLYBY'), (5, 'DISTANT'), (22.5, 'HORIZON')):
            p = open_(b, f'fresh=1&t={t}&cam={cam}')
            p.wait_for_timeout(3500 if cam != 'FLYBY' else 6000)
            p.screenshot(path=str(OUT / f'air_{cam}_{t}.png'))
            R[f'{cam}@{t}'] = p.evaluate('(() => { const s = MZ.snapshot(); return {cam: s.camera, model: s.flying_model, ended: s.ended, sun: +s.sun.el.toFixed(1)} })()')
            p.close()
        p = open_(b, 'fresh=1&t=4', 390, 844); p.wait_for_timeout(3000); p.screenshot(path=str(OUT / 'air_phone.png')); p.close()
    if 'flyby' in WANT:
        p = open_(b, 'fresh=1&t=5&cam=FLYBY&audio=1', 1280, 720)
        p.wait_for_function('MZ.sound.tap', timeout=30000)
        b64 = p.evaluate("""() => new Promise(res => { MZ.cam('FLYBY'); const rec = new MediaRecorder(MZ.sound.tap.stream); const ch = [];
          rec.ondataavailable = e => ch.push(e.data); rec.onstop = async () => { const u = new Uint8Array(await new Blob(ch).arrayBuffer());
          let s = ''; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); res(btoa(s)); }; rec.start(); setTimeout(() => rec.stop(), 14000); })""")
        p.close()
        (OUT / 'flyby.webm').write_bytes(base64.b64decode(b64))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(OUT / 'flyby.webm'), '-ac', '1', '-ar', '48000', '-f', 'f32le', str(OUT / 'flyby.raw')], check=True)
        x = np.fromfile(OUT / 'flyby.raw', dtype=np.float32); sr = 48000
        per = []
        for i in range(1, int(len(x) / sr * 2) - 1):           # 0.5 s windows: dominant engine pitch 100–200 Hz and level
            seg = x[int(i * sr / 2):int((i + 1) * sr / 2)]
            F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))); f = np.fft.rfftfreq(len(seg), 1 / sr); m = (f > 100) & (f < 200)
            per.append((round(i / 2, 1), round(float(f[m][np.argmax(F[m])]), 1), round(float(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)), 1)))
        R['flyby_pitch_level'] = per
        R['flyby_clicks'] = int((np.abs(np.diff(x[sr // 2:])) > 0.25).sum())
    if 'rollover' in WANT:
        # a test feed in which the engine has rolled a new version (copy of the real feed + one synthetic test candidate)
        tf = ENG / 'tests' / 'tmp' / 'airfeed'; shutil.rmtree(tf, ignore_errors=True); tf.mkdir(parents=True)
        s = json.loads((ENG / 'feed' / 'snapshot.json').read_text())
        (tf / 'a.json').write_text(json.dumps(s))
        m = json.loads(json.dumps([x for x in s['models'] if x['model_id'] == 'LF-0.2.0-c1'][0])); m['model_id'] = 'TEST/LF-0.3.0-c2'; m['params']['airspeed']['value'] = 130
        c = json.loads(json.dumps([x for x in s['candidates'] if x['candidate_id'] == 'CAND-001'][0])); c['candidate_id'] = 'TEST/CAND-002'; c['proposed_model'] = m['model_id']
        s['models'].append(m); s['candidates'].append(c)
        (tf / 'b.json').write_text(json.dumps(s))
        feed = 'tests/tmp/airfeed/a.json'
        p = open_(b, f'fresh=1&t=23.0&rate=60&poll=2&feed={feed}')
        p.wait_for_timeout(1500); r0 = p.evaluate('MZ.snapshot()')
        shutil.copy(tf / 'b.json', tf / 'a.json'); p.wait_for_timeout(3000)
        r1 = p.evaluate('MZ.snapshot()')            # new version known, still flying the old one (same trial)
        p.evaluate('MZ.advance(4000)'); p.wait_for_timeout(2500)
        r2 = p.evaluate('MZ.snapshot()'); p.screenshot(path=str(OUT / 'air_reink_mid.png'))
        R['rollover'] = {'before': [r0['flying_model'], r0['trial_index'], r0['colourway']], 'new_version_seen': [r1['flying_model'], r1['latest_model'], r1['trial_index']],
                         'next_flight': [r2['flying_model'], r2['trial_index'], r2['colourway'], r2['versions_flown']]}
        assert r1['flying_model'] == 'LF-0.2.0-c1' and r1['latest_model'] == 'TEST/LF-0.3.0-c2'
        assert r2['flying_model'] == 'TEST/LF-0.3.0-c2' and r2['trial_index'] == r0['trial_index'] + 1
        p.close(); shutil.rmtree(tf, ignore_errors=True)
    b.close()
(OUT / 'air_log.json').write_text(json.dumps(R, indent=1)); print(json.dumps(R, indent=1)[:5000])
