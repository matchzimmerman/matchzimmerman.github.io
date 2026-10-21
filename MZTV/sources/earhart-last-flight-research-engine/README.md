# MZTV / THE LAST FLIGHT · Research Intake & Evolving World · BUILD-001

**Status:** working proof of concept on branch `claude/last-flight-build-001`. **Not** a validated aircraft model, a 1937 weather replay, a wreck-location estimate or a public release. Sibling of `../earhart-last-flight/` — the original public prototype is untouched and is loaded read-only, pinned by SHA-256.

A world that changes as a research apparatus learns to distinguish what it has received, what it can defend, and what it may allow to influence a model. New information is not automatically truth.

## What is here

| Part | What it does |
|---|---|
| `engine/` | Python ingest worker + CLI. Event-sourced, hash-chained ledger; SQLite projection; finite-state pipeline; claim extraction; review; candidate / promotion / rollback contract |
| `model/runner.js` | Runs the original surrogate (`../earhart-last-flight/model.js`, pinned SHA-256) deterministically; outputs rounded to 1e-6 and hashed |
| `models/LF-0.1.0.json` | Immutable baseline artifact = the prototype's illustrative inputs |
| `ledger/events.jsonl` | **The source of truth**: append-only, each event hash-chained to the previous |
| `ledger/models/` | Immutable candidate artifacts |
| `feed/snapshot.json` | Read-only public feed for the viewer (no local paths, no third-party text) |
| `reviews/` | Attributed review decisions applied through the CLI |
| `index.html`, `viewer.js`, `world.js`, `audio.js` | OBS browser source: procedural world + five lenses |
| `fixtures/demo/` | 20 DEMO / SYNTHETIC fixtures (authored, not evidence) |
| `tests/` | Engine acceptance tests, browser QA, live propagation, audio analysis + their logs |
| `captures/` | Frames from the real renderer (quantized to 16 colours for repo size) |

## AIR · the experience

`air.html` is the piece with the research out of sight: one full-bleed world, one caption line, controls that appear only when you move. It flies the newest real model version that has passed its deterministic tests (otherwise the approved baseline). When the engine rolls a new version the change waits for the next flight, never mid-air, and the print re-inks over about 45 s to mark it. Cameras: chase, port wing, cockpit, into-the-sun silhouette (when the computed sun is low), flyby (Doppler), long lens, and a drifting horizon after the modelled fuel runs out. Sound follows the lens: distance falloff, air absorption, panning, Doppler, engines starving at the end.

OBS: `air.html?obs=1&audio=1` · test params `t=H` (start hour) `cam=` `rate=` `fresh=1` `info=0` (no caption).

## Run

```bash
# engine (Python 3.10+, node 18+, curl, poppler-utils, tesseract for OCR pages)
cd MZTV/sources/earhart-last-flight-research-engine
python3 engine/lastflight.py status          # counters per namespace
python3 engine/lastflight.py verify          # chain + projection == replay
python3 engine/lastflight.py work            # resume the queue (idle = no events written)
python3 tests/test_pipeline.py -v            # 16 acceptance tests in throwaway sandboxes

# viewer (from the repo root, so ../earhart-last-flight/model.js resolves)
python3 -m http.server 8080
open http://localhost:8080/MZTV/sources/earhart-last-flight-research-engine/

# local live mode: serve + run the worker every 15 min
python3 MZTV/sources/earhart-last-flight-research-engine/engine/serve_live.py --every 15
```

A fresh clone has no `data/` (gitignored). `work` rebuilds the projection from the ledger automatically; the local caches of the two NARA PDFs are re-fetched only if a stage needs them.

## OBS

Browser Source, 1920×1080, "Control audio via OBS":

```text
http://localhost:8080/MZTV/sources/earhart-last-flight-research-engine/?obs=1&audio=1
```

Params: `obs=1` (no cursor/info) · `audio=1` · `scene=world|intake|evidence|model|status` (pins a lens) · `auto=0` (no event-driven switching) · `cam=CHASE|WING|COCKPIT|DISTANT` · `start=ISO` (shared 48 h anchor) · `rate=N` · `ff=H` · `t=H` (flight hour, testing) · `trial=i` · `poll=S` · `feed=URL` · `ghost=1` · `fresh=1` · `capture=1` (drive with `MZ.tick()`).
Keys: `1–5` lenses · `0` back to auto · `C` camera · `← →` evidence sources · `A` sound · `M` mute · `I` info.

No server, login or API key is needed by the viewer. On a static host (GitHub Pages) the feed only changes when a new `feed/snapshot.json` is published; live ingestion requires the local worker. **Nothing here is deployed publicly**; publishing needs MZ.Human approval.

## The 48 h broadcast

One seeded trial per 24 h at real-time pace (two per 48 h cycle), trial *i* = ensemble seed `19370702 + i·65537`, so the world is the same seeds the model diff uses. Departure is 1937-07-02 0000 GCT (US Navy "Estimate and Decisions", Known Facts item 1, file 07 p61). Sun and moon are computed for the aircraft's position at scenario time. When the surrogate's modelled fuel runs out the aircraft is removed and the HUD says so; the ocean keeps running until the next trial. Scene changes happen only when the feed carries new logged events.

## Lenses

1. **WORLD** — the art. Chase, port-wingtip, cockpit-forward and long-lens cameras; the director cuts every 18–45 s weighted by sun elevation and night, never by "drama".
2. **INTAKE** — sources by state (rails), explicit denominators, aside states, evidence bands, the active model input and logged events; world keeps running.
3. **EVIDENCE** — URI, dates, retrieval time, rights, SHA-256, pages, every claim with locator, review and eligibility reasons, contradictions, and the lineage source → claim → parameter → candidate → result.
4. **MODEL** — candidate vs approved baseline on identical seeds: parameter diff, expected vs observed influence, endpoint map, gates, refused attempts, DEMO controlled-test history. When the baseline run ends, the lens observes the still-flying candidate (printed in one spot ink).
5. **STATUS** — uptime vs broadcast clock, model versions, worker runs, failures, ledger head, feed hash, surrogate hash check, provenance key.

## Promotion contract (short)

Volume never promotes. Accepted, traceable, uncontradicted claims that move a mapped parameter beyond its tolerance produce a **candidate**, tested deterministically and shown as a side preview. Promotion of real evidence requires every claim accepted at science scope **by MZ.Human** plus an MZ.Human authorization; even then the label is *HUMAN-APPROVED · NOT HISTORICALLY VALIDATED* until the HDD gates pass. Rollback moves a pointer; nothing is deleted.

To review and promote as MZ.Human (example — your decision, not a recommendation):

```bash
python3 engine/lastflight.py review --claim CLM-22c5178b-p0061-l0031-1 --decision accept --scope science \
  --reviewer MZ.Human --i-am-mz-human --note "…"
python3 engine/lastflight.py approve --ns real --candidate CAND-001 --actor MZ.Human --authorization "…"
python3 engine/lastflight.py rollback --ns real --actor MZ.Human --authorization "…"
```

See `reports/BUILD-001-REPORT.md` for the full return.
