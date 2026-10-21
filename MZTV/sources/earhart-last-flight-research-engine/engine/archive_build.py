#!/usr/bin/env python3
"""Freeze the current AIR edition into archive/ before anything changes it.

An edition = the experience build (BUILD in air.js) × the model version it flies
(read from feed/snapshot.json, same rule as air.js). Every time either changes,
the outgoing edition is frozen first: a self-contained, playable copy with its
own code, surrogate, and a slim frozen feed, so it always flies exactly what it
flew. Frozen editions are immutable: re-freezing an existing edition with
different content is refused.

    python3 engine/archive_build.py [--note "what this edition was"]
"""
import argparse
import datetime as dt
import hashlib
import html
import json
import re
import shutil
import subprocess
from pathlib import Path

ENG = Path(__file__).resolve().parents[1]
ARC = ENG / "archive"
SURROGATE = ENG.parent / "earhart-last-flight" / "model.js"


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def build_id():
    m = re.search(r"const BUILD = '([^']+)'", (ENG / "air.js").read_text())
    return m.group(1)


def pick_model(s):
    """Mirror of pickModel() in air.js."""
    tested = [c for c in s["candidates"] if c["namespace"] == "real" and (c.get("tests") or {}).get("passed")
              and not re.search(r"rolled|failed", str(c["review_status"]))]
    if tested:
        c = tested[-1]
        m = next((x for x in s["models"] if x["model_id"] == c["proposed_model"]), None)
        if m:
            return m["model_id"], ("approved" if c["review_status"] == "promoted" else "candidate")
    return s["namespaces"]["real"]["baseline"]["model_id"], "baseline"


def slim_feed(s):
    """Only what AIR reads; frozen with the edition."""
    keep_m = {c["proposed_model"] for c in s["candidates"]} | {s["namespaces"]["real"]["baseline"]["model_id"]}
    return {
        "schema": s["schema"], "generated_at": s["generated_at"], "frozen": True,
        "ledger": s["ledger"], "content_hash": s["content_hash"],
        "namespaces": {"real": {"baseline": s["namespaces"]["real"]["baseline"]}},
        "candidates": [{k: c[k] for k in ("candidate_id", "namespace", "proposed_model", "review_status")} | {"tests": {"passed": (c.get("tests") or {}).get("passed")}}
                       for c in s["candidates"]],
        "models": [{k: m[k] for k in ("model_id", "namespace", "version", "status", "params", "output_hash")} for m in s["models"] if m["model_id"] in keep_m],
    }


def git_commit():
    try:
        return subprocess.run(["git", "-C", str(ENG), "rev-parse", "--short=12", "HEAD"], capture_output=True, text=True).stdout.strip()
    except Exception:  # noqa
        return "unknown"


def freeze(note="", feed_path=None):
    feed = json.loads(Path(feed_path or ENG / "feed" / "snapshot.json").read_text())
    build = build_id()
    model, status = pick_model(feed)
    edition = f"{build}_{model.replace('/', '-')}"
    out = ARC / edition
    man_p = ARC / "manifest.json"
    man = json.loads(man_p.read_text()) if man_p.exists() else {"editions": []}
    tmp = ARC / (".tmp_" + edition)
    shutil.rmtree(tmp, ignore_errors=True)
    (tmp / "surrogate").mkdir(parents=True)
    (tmp / "feed").mkdir()
    for f in ("air.js", "world.js", "audio.js"):
        shutil.copy(ENG / f, tmp / f)
    shutil.copy(SURROGATE, tmp / "surrogate" / "model.js")
    (tmp / "feed" / "snapshot.json").write_text(json.dumps(slim_feed(feed), separators=(",", ":")))
    page = (ENG / "air.html").read_text()
    page = page.replace('src="../earhart-last-flight/model.js"', 'src="surrogate/model.js"')
    page = page.replace('<title>The Last Flight</title>', f'<title>The Last Flight · {edition}</title>')
    page = page.replace('href="archive/index.html"', 'href="../index.html"')
    page = page.replace('<script type="module" src="air.js"></script>',
                        f'<script>window.LF_ARCHIVED = {json.dumps(edition)};</script>\n<script type="module" src="air.js"></script>')
    (tmp / "index.html").write_text(page)
    files = {str(p.relative_to(tmp)): sha(p) for p in sorted(tmp.rglob("*")) if p.is_file() and p.name != "snapshot.json"}
    existing = next((e for e in man["editions"] if e["edition"] == edition), None)
    if existing:
        shutil.rmtree(tmp)
        if existing["files"] != files:
            raise SystemExit(f"refused: {edition} is already frozen with different code. Bump BUILD in air.js before changing the piece.")
        print(f"{edition} already frozen (unchanged)")
        return edition, False
    if out.exists():
        shutil.rmtree(tmp)
        raise SystemExit(f"refused: {out} exists without a manifest entry")
    tmp.rename(out)
    man["editions"].append({
        "edition": edition, "build": build, "model": model, "model_status": status,
        "frozen_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "code_commit": git_commit(), "feed_ledger_head": feed["ledger"]["last_hash"], "feed_content_hash": feed["content_hash"],
        "surrogate_sha256": sha(SURROGATE), "note": note, "files": files,
    })
    man_p.write_text(json.dumps(man, indent=2) + "\n")
    write_index(man)
    print(f"froze {edition}")
    return edition, True


def write_index(man):
    rows = []
    for e in reversed(man["editions"]):
        rows.append(f"""<li class="ed"><a href="{html.escape(e['edition'])}/index.html"><span class="id">{html.escape(e['edition'])}</span></a>
  <span class="meta">frozen {html.escape(e['frozen_at'][:16].replace('T', ' '))} UTC · build {html.escape(e['build'])} · model {html.escape(e['model'])} ({html.escape(e['model_status'])}) · code {html.escape(e['code_commit'])}</span>
  {f'<span class="note">{html.escape(e["note"])}</span>' if e.get('note') else ''}</li>""")
    doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The Last Flight · Archive</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&display=swap" rel="stylesheet">
<style>
/* a plain register of frozen editions, newest first, in the piece's own inks */
:root{{color-scheme:dark;--ink:#1b1f3a;--deep:#2c3e7a;--sea:#3f9aa6;--glow:#f2c14e;--paper:#efe6cf;--dim:rgba(239,230,207,.62);--rule:rgba(239,230,207,.16);
  --f:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace}}
*{{box-sizing:border-box}}
html{{background:var(--ink)}}
body{{margin:0;background:var(--ink);color:var(--paper);font:13px/1.6 var(--f);padding-block:40px 60px;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
main{{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:22px}}
h1{{margin:0;font-size:15px;font-weight:800;letter-spacing:.16em;text-wrap:balance}}
h1 b{{color:var(--glow)}}
p{{margin:0;color:var(--dim);max-width:65ch}}
ol{{list-style:none;margin:0;padding:0;border-top:1px solid var(--rule)}}
.ed{{display:flex;flex-direction:column;gap:2px;padding:12px 0;border-bottom:1px solid var(--rule);min-width:0}}
.ed a{{color:var(--glow);text-decoration:none;font-weight:600;letter-spacing:.06em;overflow-wrap:anywhere}}
.ed a:hover,.ed a:focus-visible{{text-decoration:underline;outline:none}}
.meta{{color:var(--dim);font-size:11.5px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}}
.note{{font-size:12px}}
.live{{color:var(--paper);text-decoration:none;border:1px solid var(--rule);padding:6px 10px;align-self:flex-start;letter-spacing:.08em;font-size:11px}}
.live:hover,.live:focus-visible{{border-color:var(--paper);outline:none}}
</style>
</head>
<body>
<main>
<h1>THE LAST FLIGHT <b>/</b> ARCHIVE</h1>
<p>Every edition the piece has been: each pairing of an experience build with the model version it flew. Each is frozen whole when the next one replaces it, and plays exactly as it did.</p>
<a class="live" href="../air.html">◂ BACK TO THE LIVE EDITION</a>
<ol>
{chr(10).join(rows)}
</ol>
</main>
</body>
</html>
"""
    (ARC / "index.html").write_text(doc)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--note", default="")
    ap.add_argument("--feed")
    a = ap.parse_args()
    freeze(a.note, a.feed)
