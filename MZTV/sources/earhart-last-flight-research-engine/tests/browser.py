#!/usr/bin/env python3
"""Headless browser QA for the viewer (real renderer, swiftshader WebGL).

usage: python3 tests/browser.py <base_url> <out_dir> [scenario ...]
Scenarios: smoke, lenses, cams, times, phone, ghost, live, perf, audio, contextloss
Writes PNG captures + a JSON log of console errors and MZ.snapshot() results.
"""
import json
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip("/")
OUT = Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
WANT = set(sys.argv[3:]) or {"smoke"}
PAGE = BASE + "/MZTV/sources/earhart-last-flight-research-engine/index.html"
ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required", "--ignore-gpu-blocklist"]
LOG = {"console": [], "pageerror": [], "results": {}}


def open_page(b, q="", w=1920, h=1080):
    ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
    p = ctx.new_page()
    p.on("console", lambda m: LOG["console"].append({"type": m.type, "text": m.text[:300], "q": q}) if m.type in ("error", "warning") else None)
    p.on("pageerror", lambda e: LOG["pageerror"].append({"q": q, "e": str(e)[:400]}))
    p.goto(PAGE + "?" + q, wait_until="load")
    p.wait_for_function("window.MZ && window.__last", timeout=60000)
    return ctx, p


def shot(p, name):
    p.screenshot(path=str(OUT / f"{name}.png"))
    return str(OUT / f"{name}.png")


with sync_playwright() as pw:
    proxy = os.environ.get("HTTPS_PROXY")
    b = pw.chromium.launch(args=ARGS, proxy={"server": proxy, "bypass": "localhost,127.0.0.1,192.0.2.2," + os.environ.get("LF_BYPASS", "")} if proxy else None)
    if "smoke" in WANT:
        t0 = time.time()
        ctx, p = open_page(b, "fresh=1&info=0&t=3.2&cam=CHASE")
        LOG["results"]["first_frame_s"] = round(time.time() - t0, 2)
        for s in (1, 3, 8):
            p.wait_for_timeout(1000 if s == 1 else (2000 if s == 3 else 5000))
            shot(p, f"smoke_{s}s")
        LOG["results"]["snapshot"] = p.evaluate("MZ.snapshot()")
        LOG["results"]["errors_in_page"] = p.evaluate("MZ.errors")
        ctx.close()
    if "lenses" in WANT:
        ctx, p = open_page(b, "fresh=1&info=0&t=5.5&cam=CHASE")
        for i, n in enumerate(["world", "intake", "evidence", "model", "status"], 1):
            p.evaluate(f"MZ.scene({i})")
            p.wait_for_timeout(2600)
            shot(p, f"lens_{i}_{n}")
        p.evaluate("MZ.scene(3)")
        srcs = p.evaluate("MZ.feed.snap.sources.filter(s=>s.ingestion_state!=='metadata_only').map(s=>s.source_id)")
        for sid in [s for s in srcs if "CHATER" in s or "146-08" in s or s == "DEMO-D09"]:
            p.evaluate(f"MZ.select({json.dumps(sid)})")
            p.wait_for_timeout(800)
            shot(p, "evidence_" + sid.replace("/", "_")[:40])
        LOG["results"]["lens_errors"] = p.evaluate("MZ.errors")
        ctx.close()
    if "cams" in WANT:
        for cam in ("CHASE", "WING", "COCKPIT", "DISTANT"):
            ctx, p = open_page(b, f"fresh=1&info=0&t=6.4&cam={cam}")
            p.wait_for_timeout(2500)
            shot(p, f"cam_{cam}")
            LOG["results"]["cam_" + cam] = p.evaluate("MZ.snapshot().camera")
            ctx.close()
    if "times" in WANT:
        for hr, name in ((0.3, "lae_morning"), (7.6, "dusk"), (11.0, "night"), (18.6, "dawn"), (21.0, "morning_search"), (23.5, "after_end")):
            ctx, p = open_page(b, f"fresh=1&info=0&t={hr}&cam=COCKPIT" if name in ("dusk", "dawn") else f"fresh=1&info=0&t={hr}&cam=CHASE")
            p.wait_for_timeout(2500)
            shot(p, f"time_{name}")
            s = p.evaluate("MZ.snapshot()")
            LOG["results"]["time_" + name] = {k: s[k] for k in ("flight_hour", "scenario_clock_utc", "ended", "position")} | {"sun_el": s["sun"]["el"], "moon_el": s["moon"]["el"]}
            ctx.close()
    if "ghost" in WANT:
        ctx, p = open_page(b, "fresh=1&info=0&t=22.1&cam=CHASE&scene=model&trial=0")
        p.wait_for_timeout(3000)
        shot(p, "model_after_base_end")
        LOG["results"]["ghost_snapshot"] = p.evaluate("MZ.snapshot()")
        ctx.close()
    if "phone" in WANT:
        for i, n in ((1, "world"), (2, "intake"), (4, "model")):
            ctx, p = open_page(b, f"fresh=1&info=0&t=4&scene={n}", 390, 844)
            p.wait_for_timeout(2500)
            shot(p, f"phone_{n}")
            LOG["results"]["phone_hscroll_" + n] = p.evaluate("document.documentElement.scrollWidth > innerWidth")
            ctx.close()
    if "perf" in WANT:
        ctx, p = open_page(b, "fresh=1&info=0&t=4&cam=DISTANT")
        p.wait_for_timeout(1500)
        fps = p.evaluate("""() => new Promise(r => { let n = 0; const t0 = performance.now();
            function f() { n++; if (performance.now() - t0 < 10000) requestAnimationFrame(f); else r(n / ((performance.now() - t0) / 1000)); } requestAnimationFrame(f); })""")
        mem = p.evaluate("performance.memory ? performance.memory.usedJSHeapSize : null")
        js = p.evaluate("""() => { const t = []; for (let i = 0; i < 40; i++) { const a = performance.now(); MZ.tick(1/30); t.push(performance.now() - a); } t.sort((a,b)=>a-b); return {median_ms: t[20], p90_ms: t[36]}; }""")
        LOG["results"]["perf_tick_incl_swiftshader_render_ms"] = js
        LOG["results"]["perf_swiftshader_fps_1920x1080"] = round(fps, 1)
        LOG["results"]["perf_heap_bytes"] = mem
        ctx.close()
    if "contextloss" in WANT:
        ctx, p = open_page(b, "fresh=1&info=0&t=4")
        p.evaluate("""() => { const gl = document.getElementById('world').getContext('webgl2'); const ext = gl.getExtension('WEBGL_lose_context');
            window.__ext = ext; ext.loseContext(); }""")
        p.wait_for_timeout(800)
        p.evaluate("window.__ext.restoreContext()")
        p.wait_for_timeout(2000)
        shot(p, "after_context_restore")
        LOG["results"]["contextloss_errors"] = p.evaluate("MZ.errors")
        ctx.close()
    if "audio" in WANT:
        ctx, p = open_page(b, "fresh=1&info=0&t=4&cam=COCKPIT&audio=1")
        p.wait_for_timeout(4000)
        r = {"state": p.evaluate("MZ.sound.ctx && MZ.sound.ctx.state"), "level_db_cockpit": p.evaluate("MZ.sound.level()")}
        p.evaluate("MZ.cam('DISTANT')"); p.wait_for_timeout(3000)
        r["level_db_distant"] = p.evaluate("MZ.sound.level()")
        p.evaluate("MZ.sound.mute(true)"); p.wait_for_timeout(2000)
        r["level_db_muted"] = p.evaluate("MZ.sound.level()")
        p.evaluate("MZ.sound.mute(false)")
        p.evaluate("MZ.sound.ctx.suspend()"); p.wait_for_timeout(2500)
        r["state_after_forced_suspend_watchdog"] = p.evaluate("MZ.sound.ctx.state")
        p.evaluate("MZ.sound.ctx.close()"); p.wait_for_timeout(3500)
        r["state_after_forced_close_watchdog"] = p.evaluate("MZ.sound.ctx && MZ.sound.ctx.state")
        r["errors"] = p.evaluate("MZ.errors")
        LOG["results"]["audio"] = r
        ctx.close()
    if "longrun" in WANT:
        # compressed duration: rate 900 → 15 sim-minutes per real second; 150 s ≈ 37.5 sim hours (crosses a trial boundary)
        ctx, p = open_page(b, "fresh=1&info=0&rate=900&poll=5")
        heap0 = p.evaluate("performance.memory ? performance.memory.usedJSHeapSize : 0")
        samples = []
        for i in range(10):
            p.wait_for_timeout(15000)
            s = p.evaluate("(() => { const s = MZ.snapshot(); return {h: s.flight_hour, trial: s.trial_index, ended: s.ended, cam: s.camera.id, lens: s.lens} })()")
            samples.append(s)
        shot(p, "longrun_end")
        LOG["results"]["longrun"] = {"samples": samples, "cuts": p.evaluate("MZ.cuts.length"), "errors": p.evaluate("MZ.errors"),
            "heap_growth_bytes": p.evaluate("performance.memory ? performance.memory.usedJSHeapSize : 0") - heap0}
        ctx.close()
    b.close()

(OUT / "browser_log.json").write_text(json.dumps(LOG, indent=2, default=str))
print(json.dumps({"console_errors": [c for c in LOG["console"] if c["type"] == "error"][:8], "pageerrors": LOG["pageerror"][:5],
                  "results": {k: v for k, v in LOG["results"].items() if k != "snapshot"}}, indent=1, default=str)[:4000])
