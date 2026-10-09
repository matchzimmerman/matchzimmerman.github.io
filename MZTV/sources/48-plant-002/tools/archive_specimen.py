#!/usr/bin/env python3
"""
48 PLANT — archive a finished specimen from the public record.

For specimens with "weather":"public", the whole life is determined by
  seed + scheduled birth + the ledger embedded in index.html
  + repo commits and intake events in the 48 h after birth (each felt 15 min after it happened).
This script gathers those commits from the GitHub API (via `gh`, authenticated),
rebuilds the live log with the page's own code (headless Chromium), and writes
  archive/life.json       the life record (replay: index.html?life=archive/life.json)
  archive/final.png       the 48:00 portrait, 1920x1080
  archive/48plant-NNN.glb the 3D specimen (open the replay page and press g for the full .obj/.glb kit)

Usage (from the repo root, served locally):
  python3 MZTV/sources/48-plant-002/tools/archive_specimen.py MZTV/sources/48-plant-002
"""
import base64, datetime as dt, functools, http.server, json, os, re, subprocess, sys, threading, time

folder = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(__file__)))
html = open(os.path.join(folder, "index.html")).read()
spec = json.loads(re.search(r'<script id="specimen" type="application/json">(.*?)</script>', html, re.S).group(1))
assert spec.get("weather") == "public" and spec.get("birth"), "only public-weather specimens with a scheduled birth can be rebuilt from the record"
birth = dt.datetime.fromisoformat(spec["birth"].replace("Z", "+00:00"))
end = birth + dt.timedelta(hours=48)
repo = "matchzimmerman/matchzimmerman.github.io"


def gh(path):
    return json.loads(subprocess.run(["gh", "api", path], capture_output=True, text=True, check=True).stdout)


commits, page = [], 1
while True:
    batch = gh(f"repos/{repo}/commits?since={birth.isoformat()}&until={end.isoformat()}&per_page=100&page={page}")
    commits += batch
    if len(batch) < 100: break
    page += 1
details = {c["sha"]: {"files": [{"filename": f["filename"]} for f in gh(f"repos/{repo}/commits/{c['sha']}").get("files", [])]} for c in commits}
intake = json.load(open(os.path.join(folder, "intake.json"))).get("events", [])
print(f"{len(commits)} commits · {len(intake)} intake events in {birth:%Y-%m-%d %H:%M} → {end:%Y-%m-%d %H:%M} UTC", file=sys.stderr)

# serve the specimen folder and let the page build the record with its own rules
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=folder)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
from playwright.sync_api import sync_playwright

out = os.path.join(folder, "archive"); os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    pg.goto(f"http://127.0.0.1:{port}/index.html?at=48&audio=0&live=0")
    pg.wait_for_function("window.MZ && MZ.ready", timeout=120000)
    live = pg.evaluate("(d) => MZ.liveFromPublic(d)", {"commits": list(reversed(commits)), "details": details, "intake": intake})
    rec = {"schema": "mz-48plant-life/1", "specimen": spec["specimen"], "seed": spec["seed"], "birth": birth.isoformat().replace("+00:00", "Z"),
           "weather": "public", "live": live}
    json.dump(rec, open(os.path.join(out, "life.json"), "w"), separators=(",", ":"))
    pg.goto(f"http://127.0.0.1:{port}/index.html?life=archive/life.json&audio=0")
    pg.wait_for_function("window.MZ && MZ.ready", timeout=120000); time.sleep(4)
    full = pg.evaluate("() => MZ.compact()")
    json.dump(full, open(os.path.join(out, "life.json"), "w"), separators=(",", ":"))
    pg.screenshot(path=os.path.join(out, "final.png"))
    b64 = pg.evaluate("""async () => { const r = await MZ.export3D({download:false}); const buf = r.glb;
      let s=''; for (let i=0;i<buf.length;i+=32768) s+=String.fromCharCode.apply(null, buf.subarray(i,i+32768)); return btoa(s); }""")
    open(os.path.join(out, f"48plant-{spec['specimen']}.glb"), "wb").write(base64.b64decode(b64))
    b.close()
srv.shutdown()
print(f"archived: {len(live)} live events · {full['label']}", file=sys.stderr)
