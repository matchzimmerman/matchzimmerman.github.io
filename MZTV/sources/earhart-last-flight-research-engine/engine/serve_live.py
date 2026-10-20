#!/usr/bin/env python3
"""Local live mode for OBS: serve the repo and run the ingest worker on a schedule.

    python3 MZTV/sources/earhart-last-flight-research-engine/engine/serve_live.py [--port 8080] [--every 15] [--ocr-budget 12]

- Serves the repository root (so ../earhart-last-flight/model.js resolves).
- Every N minutes runs `lastflight.py work` (bounded OCR budget, no paid APIs,
  only the public sources already in the ledger's discovery corpus). An idle
  pass records nothing.
- The viewer polls feed/snapshot.json, so the OBS Browser Source sees real
  events as they are logged. Stop with Ctrl-C; a later start resumes from
  the ledger (interrupted runs are detected and recorded).
"""
import argparse
import functools
import http.server
import subprocess
import sys
import threading
import time
from pathlib import Path

ENG = Path(__file__).resolve().parents[1]
REPO = ENG.parents[2]


def worker_loop(every, budget):
    while True:
        r = subprocess.run([sys.executable, str(ENG / "engine" / "lastflight.py"), "work", "--ocr-budget", str(budget)],
                           capture_output=True, text=True)
        print(time.strftime("%H:%M:%S"), (r.stdout.strip().splitlines() or [""])[-1], r.stderr.strip()[-200:], flush=True)
        time.sleep(every * 60)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8080)
    ap.add_argument("--every", type=float, default=15)
    ap.add_argument("--ocr-budget", type=int, default=12)
    a = ap.parse_args()
    threading.Thread(target=worker_loop, args=(a.every, a.ocr_budget), daemon=True).start()
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(REPO))
    url = f"http://localhost:{a.port}/MZTV/sources/earhart-last-flight-research-engine/?obs=1&audio=1"
    print("OBS Browser Source:", url, flush=True)
    http.server.ThreadingHTTPServer(("127.0.0.1", a.port), h).serve_forever()


if __name__ == "__main__":
    main()
