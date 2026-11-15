"""BIT FIELD 048 · sound test (MZTV build protocol §5).
Records the master bus for N seconds via MediaStreamDestination + MediaRecorder, forces a second wave
and a PA phrase, then forces suspend / close / rebuild and confirms recovery. Decodes with ffmpeg and
reports band energy, per-second RMS and >5 kHz transients (click check). Writes captures/audio-report.json.
usage: python3 -I tests/audio_test.py [seconds=40]"""
import http.server, json, os, socketserver, subprocess, sys, tempfile, threading, base64
from functools import partial
import numpy as np
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECS = int(sys.argv[1]) if len(sys.argv) > 1 else 40
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), partial(Quiet, directory=HERE)); PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

REC = """async (secs) => {
  const ctx = MZ.soundTest.ctx(), an = MZ.soundTest.master();
  const dst = ctx.createMediaStreamDestination(); an.connect(dst);
  const rec = new MediaRecorder(dst.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 }), parts = [];
  rec.ondataavailable = e => parts.push(e.data); rec.start(1000);
  MZ.soundTest.swell(); setTimeout(() => MZ.soundTest.pa(), 9000);
  await new Promise(r => setTimeout(r, secs * 1000)); rec.stop(); await new Promise(r => rec.onstop = r);
  const b = new Uint8Array(await new Blob(parts).arrayBuffer()); let s = ''; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
  return btoa(s);
}"""

rep = {'seconds': SECS}
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('console', lambda m: m.type == 'error' and errs.append(m.text)); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{PORT}/index.html?lines=90&fps=4&autoplay=1'); pg.wait_for_timeout(2500)
    rep['state0'] = pg.evaluate('MZ.sound')
    data = base64.b64decode(pg.evaluate(REC, SECS))
    rep['state1'] = pg.evaluate('MZ.sound')
    # recovery
    rec = {}
    pg.evaluate('MZ.soundTest.suspend()'); pg.wait_for_timeout(2500); rec['after_suspend'] = pg.evaluate('MZ.sound.state')
    pg.evaluate('MZ.soundTest.rebuild()'); pg.wait_for_timeout(5500); rec['after_rebuild'] = pg.evaluate('[MZ.sound.state, MZ.sound.rms > 1e-4]')
    pg.evaluate('MZ.soundTest.close()'); pg.wait_for_timeout(3500); rec['after_close'] = pg.evaluate('[MZ.sound.state, MZ.sound.rms > 1e-4]')
    rep['recovery'] = rec; rep['errors'] = errs; b.close()

tmp = '/tmp/a048'; os.makedirs(tmp, exist_ok=True); wm = os.path.join(tmp, 'a.webm'); wav = os.path.join(tmp, 'a.raw')
open(wm, 'wb').write(data)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wm, '-ac', '1', '-ar', '48000', '-f', 's16le', wav], check=True)
x = np.frombuffer(open(wav, 'rb').read(), dtype=np.int16).astype(np.float64) / 32768
sr = 48000; x = x[sr:]                                    # drop the recorder's first second
F = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / sr); tot = F.sum()
bands = [(20, 60), (60, 120), (120, 250), (250, 500), (500, 1000), (1000, 2000), (2000, 5000), (5000, 20000)]
rep['band_share'] = {f'{a}-{b}': round(float(F[(f >= a) & (f < b)].sum() / tot), 4) for a, b in bands}
rms = [float(np.sqrt(np.mean(x[i:i + sr] ** 2))) for i in range(0, len(x) - sr, sr)]
rep['rms_db_per_s'] = [round(20 * np.log10(max(r, 1e-9)), 1) for r in rms]
# click check: a click is a discontinuity, so look at the second difference of the waveform.
# Count samples whose curvature is > 6x the 99.9th percentile (smooth material stays under ~2x); also report >8 kHz share.
d2 = np.abs(np.diff(x, 2)); p999 = float(np.percentile(d2, 99.9)) + 1e-12
bad = np.where(d2 > p999 * 6)[0]
rep['hf_transients'] = int(len(bad)); rep['hf_transient_s'] = [round(1 + i / sr, 3) for i in bad[:10]]
rep['curvature_max_over_p999'] = round(float(d2.max() / p999), 2)
F8 = F[f >= 8000].sum() / tot; rep['share_above_8k'] = float(F8)
rep['peak'] = round(float(np.max(np.abs(x))), 3)
rep['ok'] = (not rep['errors'] and rep['hf_transients'] == 0 and rep['peak'] < .99 and min(rms) > 1e-3
             and rep['recovery']['after_close'][0] == 'running' and rep['recovery']['after_rebuild'][1])
out = os.path.join(HERE, 'captures', 'audio-report.json'); json.dump(rep, open(out, 'w'), indent=1)
print(json.dumps(rep, indent=1))
