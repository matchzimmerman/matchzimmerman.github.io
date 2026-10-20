#!/usr/bin/env python3
"""Live propagation test: a worker writes real (sandbox) events while the viewer is open.
Asserts that counters, lens and banner change only because new logged events arrived."""
import json, os, shutil, subprocess, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ENG = Path(__file__).resolve().parents[1]
BASE = sys.argv[1].rstrip('/'); OUT = Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
SB = ENG / 'tests' / 'tmp' / 'live'
shutil.rmtree(SB, ignore_errors=True); SB.mkdir(parents=True)
env = dict(os.environ, LF_ROOT=str(SB))
run = lambda *a: subprocess.run([sys.executable, str(ENG / 'engine' / 'lastflight.py'), *a], env=env, capture_output=True, text=True, check=True).stdout
subprocess.run([sys.executable, str(ENG / 'engine' / 'make_fixtures.py')], env=env, check=True, capture_output=True)
run('init'); run('discover', '--demo')
url = f"{BASE}/MZTV/sources/earhart-last-flight-research-engine/index.html?fresh=1&info=0&t=4&poll=2&feed=tests/tmp/live/feed/snapshot.json"
log = []
def state(p, tag):
    s = p.evaluate("({lens: MZ.lens(), head: MZ.feed.snap.ledger.events, ticker: document.getElementById('ticker').innerText, banner: document.getElementById('banner').innerText, demo: MZ.feed.snap.namespaces.demo.counters})")
    log.append({'t': tag, 'lens': s['lens'], 'head': s['head'], 'banner': s['banner'], 'classified': s['demo']['by_state'].get('classified', 0), 'candidates': s['demo']['candidates']})
    return s
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"], proxy={"server": os.environ["HTTPS_PROXY"], "bypass": "localhost,127.0.0.1,192.0.2.2"})
    p = b.new_page(viewport={'width': 1920, 'height': 1080})
    errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
    p.goto(url); p.wait_for_function('window.MZ && window.__last', timeout=60000)
    p.wait_for_timeout(5000); s0 = state(p, 'opened (no new events → stays WORLD)')
    assert s0['lens'] == 'WORLD', s0['lens']
    p.wait_for_timeout(5000); s0b = state(p, 'idle 5 s (no events → no change)')
    assert s0b['lens'] == 'WORLD' and s0b['head'] == s0['head']
    run('work', '--max-steps', '25')
    p.wait_for_timeout(5000); s1 = state(p, 'worker ran 25 steps')
    p.screenshot(path=str(OUT / 'live_1_intake.png'))
    assert s1['head'] > s0['head'] and s1['lens'] == 'INTAKE', s1['lens']
    run('work'); run('demo-review'); run('propose', '--ns', 'demo')
    p.wait_for_timeout(5000); s2 = state(p, 'demo review + candidate proposed')
    p.screenshot(path=str(OUT / 'live_2_model.png'))
    assert s2['lens'] == 'MODEL' and s2['demo']['candidates'] == 1, s2['lens']
    run('approve', '--ns', 'demo', '--candidate', 'DEMO/CAND-001', '--actor', 'TEST-HARNESS', '--authorization', 'BUILD-001 controlled test (live propagation)')
    p.wait_for_timeout(5000); s3 = state(p, 'controlled-test promotion')
    p.screenshot(path=str(OUT / 'live_3_promoted.png'))
    run('rollback', '--ns', 'demo', '--actor', 'TEST-HARNESS', '--authorization', 'BUILD-001 controlled test (live propagation)')
    p.wait_for_timeout(5000); s4 = state(p, 'rollback')
    p.screenshot(path=str(OUT / 'live_4_rolledback.png'))
    p.reload(); p.wait_for_function('window.MZ && window.__last', timeout=60000); p.wait_for_timeout(4000)
    s5 = state(p, 'after browser refresh (resume: no replay of seen events)')
    assert s5['lens'] == 'WORLD' and s5['head'] == s4['head']
    b.close()
shutil.rmtree(SB, ignore_errors=True)
(OUT / 'live_log.json').write_text(json.dumps({'steps': log, 'pageerrors': errs}, indent=1))
print(json.dumps(log, indent=1)); print('pageerrors', errs); print('PASS live propagation')
