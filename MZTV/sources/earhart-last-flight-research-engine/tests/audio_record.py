#!/usr/bin/env python3
"""Record the master bus for 12 s from the real viewer and analyse band balance + clicks."""
import base64, json, os, subprocess, sys
from pathlib import Path
import numpy as np
from playwright.sync_api import sync_playwright
BASE, OUT = sys.argv[1].rstrip('/'), Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"],
                           proxy={"server": os.environ["HTTPS_PROXY"], "bypass": "localhost,127.0.0.1,192.0.2.2"})
    p = b.new_page(viewport={'width': 1280, 'height': 720})
    p.goto(f"{BASE}/MZTV/sources/earhart-last-flight-research-engine/index.html?fresh=1&info=0&t=4&cam=COCKPIT&audio=1")
    p.wait_for_function("window.MZ && MZ.sound && MZ.sound.tap", timeout=60000)
    p.wait_for_timeout(3000)
    b64 = p.evaluate("""() => new Promise(res => { const rec = new MediaRecorder(MZ.sound.tap.stream); const ch = [];
      rec.ondataavailable = e => ch.push(e.data); rec.onstop = async () => { const buf = await new Blob(ch).arrayBuffer();
      let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); res(btoa(s)); };
      rec.start(); setTimeout(() => MZ.cam('DISTANT'), 6000); setTimeout(() => rec.stop(), 12000); })""")
    b.close()
(OUT / 'master.webm').write_bytes(base64.b64decode(b64))
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(OUT / 'master.webm'), '-ac', '1', '-ar', '48000', '-f', 'f32le', str(OUT / 'master.raw')], check=True)
x = np.fromfile(OUT / 'master.raw', dtype=np.float32)
sr = 48000; x = x[int(0.5 * sr):]                    # ignore recorder start
rms = lambda v: 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)
F = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / sr)
band = lambda a, b: 10 * np.log10(F[(f >= a) & (f < b)].sum() + 1e-20)
ref = band(60, 250)
hp = np.diff(x)                                     # click check: sample-to-sample jumps
res = {'seconds': round(len(x) / sr, 1), 'rms_db': round(float(rms(x)), 1), 'peak_dbfs': round(20 * np.log10(np.abs(x).max() + 1e-12), 1),
       'per_second_rms_db': [round(float(rms(x[i * sr:(i + 1) * sr])), 1) for i in range(int(len(x) / sr))],
       'bands_rel_60_250_db': {f'{a}-{b}': round(band(a, b) - ref, 1) for a, b in ((20, 60), (60, 250), (250, 1000), (1000, 2000), (2000, 5000), (5000, 12000))},
       'max_step': float(np.abs(hp).max()), 'steps_over_0.25': int((np.abs(hp) > 0.25).sum())}
(OUT / 'audio_analysis.json').write_text(json.dumps(res, indent=1, default=float)); print(json.dumps(res, indent=1, default=float))
