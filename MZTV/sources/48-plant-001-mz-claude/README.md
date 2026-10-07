# MZTV 48 PLANT · SPECIMEN 001 · MZ.Claude candidate

One independent build for the HARIL multi-agent brief *MZTV 48 PLANT — Multi-Agent Build Brief · Specimen 001*. It is one candidate among several, not the canonical version.

A painted, fabricated botanical specimen grows for 48 hours inside the weather made by the practice that built it. The practice's whole activity record, from 2022 to the present, is lived inside the plant's 48 hours. Live commits and HARIL intake arrive as present-day weather. Nothing recomputes from current data: every leaf, kink, ring, scar and flower is laid down once and kept.

## v2 — the documentary (current `index.html`)

v1 (potted specimen, single slow turntable camera) is kept as `v1.html`.

v2 keeps the same organism, the same growth engine and the same ledger: the plant grows identically, minute for minute. What changed is the world around it and how it is filmed.

- **Studio:** no pot. The seed lies on the floor of an all-white cyclorama and the plant rises out of the floor. Shadows fall softly on the white, and fallen leaves stay where they drop.
- **Seedling:** the seed is a small glossy painted bean. Cotyledons are plain fleshy seed-leaves. Juvenile leaves stay simple until the plant matures, then the painting takes over.
- **Crew:** four cube drones with a lens on the front fly the studio. Each one is a real camera: the program feed is literally the view from whichever drone is live, so you see the other drones when they are in shot. They fly around the plant, never through it, and slide out of the live lens's frame.
- **Surveillance bay** (right edge, toggle `c`): a top-down studio plan showing each drone's position, flight trail and view cone, plus a live monitor for every drone. Each monitor shows its kind of shot and status (ON AIR / ON MARK / MOVING), with a pink tally on the drone that is live.
- **Director:** cuts the program like a nature documentary. It works with a shot grammar of slow wide orbits, dolly-in mediums, close pushes, leaf details, low hero cranes, top-downs and base-to-crown reveals. Each shot runs 10–28 s. Drones fly to their marks while another is live, and the director only cuts to a drone that is in position.
- **Event shots:** branching, returns, stress, dormancy, flowering and fruiting each send a drone to that exact spot on the plant. The cut comes when it arrives, with a dated subtitle.
- **Time-lapse passages:** every 14–20 min, a locked-off drone replays the last 5–12 hours of growth in about 34 s. The tag reads `HOUR … ▸▸ · TIME-LAPSE`. The replay is an exact reconstruction from the life record.
- **Finale:** in the last 45 minutes the crew clears the stage and parks behind the hero camera. One drone settles into a composed portrait, chosen from the plant's own lean so the silhouette reads across the frame. Over the last 5 minutes all motion stills. At 48:00 the frame holds as the finished work, with a museum label (dates, leaves made, inflorescences, rings). Reloading after the life rebuilds the same portrait. Press `s` to save it at 1920×1080.

The camera work is presentation only. The director never changes the organism; the life is still seed + ledger + live log.

## Run

**OBS (broadcast):** Browser Source, 1920×1080, "Control audio via OBS" on:

```
https://matchzimmerman.com/MZTV/sources/48-plant-001-mz-claude/
```

The first load is the plant's birth (hour 00:00). From then on the specimen's age is wall-clock time since birth, stored in the browser source's localStorage. Leave it running for 48 hours.

**Start a fresh life:** add `?fresh=1` once, then remove it. If you leave it in, every reload is a new birth.

**Preview without touching the broadcast life:**
- `?at=36` shows the specimen exactly as it is at hour 36. This is read-only.
- `?timelapse=12` plays the whole 48-hour life in 12 minutes. This is read-only.

| Param | Effect |
|---|---|
| `?fresh=1` | new birth (clears this specimen's life) |
| `?ff=H` | new life back-dated H hours (testing) |
| `?at=H` | read-only reconstruction at hour H |
| `?timelapse=M` | read-only full life in M minutes |
| `?seed=N` | different specimen from the same ledger (its own storage key) |
| `?info=0` | hide notation |
| `?audio=0` | silent |
| `?live=0` | ignore live weather |
| `?capture=1` | no rAF; drive frames with `MZ.tick(dt)` |
| `?intake=URL` | alternative intake file |

| Key | Effect |
|---|---|
| `i` | notation on/off |
| `k` | key ("what grows this plant") |
| `m` | mute |
| `s` | save 1920×1080 still |
| `l` | download life record (JSON) |
| `c` | camera bay on/off |

In a normal browser, click once for sound. OBS autoplays.

Console: `MZ.force('stress'|'novelty'|'reactivate'|'breakthrough'|'rain'|'revert', 'MAGPIE')` injects human-intervention weather. It is logged as FORCED and kept in the life record.

## What drives it

`ledger/haril-practice.json` holds 1,961 events. They come from:
- `matchzimmerman.github.io` commits since 2022-02;
- `mz-archive` commits;
- HARIL SHARED TIMELINE entry metadata.

Each row is only `minute · source · actor class · branch · kind · magnitude · novel/reactivation flags`. No messages, titles, file names or text are included. The ledger is rebuilt with `tools/build_ledger.py` and embedded with `tools/embed_ledger.py`.

Time is phenological: hour = 48 × (0.28 × calendar share + 0.72 × activity share). Long silences in the practice (2022–23, 2024–25) still arrive as droughts, and bursts get room to unfold.

| Practice | → environment | → development |
|---|---|---|
| any activity | WATER (turgor) | growth rate, leaf size; its absence → drought → dormancy, a ring left in the wood |
| structure work (system / handoff / report / archive) | NUTRIENT | wood thickening, aerial roots |
| each project branch | LIGHT from its own side of the specimen | phototropism, leaf orientation, leaf paint inks |
| concentration vs spread across projects | CONVERGENT / DIVERGENT field | internode length, apical dominance, leaf shape (broad vs narrow, lobing) |
| fixes, reverts, removals | STRESS | permanent kinks, galls, bitten / asymmetric / chimeric leaves |
| first appearance of a project | — | a dormant bud breaks toward that project's light |
| a project returning after ≥45 days | — | old wood sprouts; the leaf form archived under that light returns, inverted |
| breakthroughs, decisions | — | flag leaf painted in that ink; once mature, an apex turns into a peduncled inflorescence that later fruits |
| who did it (human / agent / process) | HAND | how leaves are painted: blotches and brush strokes / stripes and dot grids / stipple |

Live weather (only while alive):
- `api.github.com` commits on this repo, polled every 10 min (unauthenticated, within rate limits);
- `intake.json` in this folder, polled every 5 min. Append `{id, t, actor, branch, kind, mag}` and commit it.

## Recovery

The life is event-sourced: **seed + embedded ledger + live log**. The full 48 hours re-simulate in well under a second, so any reload rebuilds the identical body.
- Reload, OBS source refresh, browser crash or computer restart: on load the page reads its birth time and live log from localStorage, replays every minute up to "now", and continues. Hours spent switched off are still lived (catch-up), just not seen.
- Code update mid-life: a snapshot is saved every 10 min and on unload. If the deployed version differs from the snapshot's, the grown body is restored from the snapshot instead of re-simulated, so history isn't rewritten.
- NaN / bad state: regrown from the life record. WebGL loss: the print pass restores, with a plain-canvas fallback meanwhile.
- Audio: a watchdog resumes a suspended context, rebuilds a closed or stalled one, rebuilds on NaN or 20 s of silence, and refreshes every 3 h.
- Slow machine: the frame rate drops from 30 → 16 → 10 fps automatically. Growth is wall-clock based and unaffected.
- After hour 48 the specimen is PRESERVED: growth stops, micro-motion continues, and live weather is no longer felt.
- **Lost localStorage** (new OBS profile or cleared cache): the life restarts. Before broadcasting, press `l` occasionally to download the life record. `MZ.loadLife(record)` restores it.

## Outputs (afterlife)

- `l` saves the life record: seed, birth, ledger hash, every live event with its step, the full observation log and a morphology summary. With the ledger, it reconstructs the plant at any minute (`?at=H`, `MZ.loadLife`).
- `s` saves a 1920×1080 still at any moment. `stills/` holds the build's own checkpoint renders at hours 1, 8, 16, 24, 36 and 48.
- `?timelapse=M` gives an accelerated lifecycle, renderable frame by frame with `?capture=1` + `MZ.tick`.
- Other specimens: build a ledger from another body of history (HARIL, MAGPIE, SEALS, SONIC LAB) with the same row schema, embed it, and grow a new seed.

## Files

- `index.html` — v2, the whole piece (single file, ledger embedded)
- `v1.html` — v1, potted specimen with a turntable camera
- `ledger/haril-practice.json`, `ledger/timeline_meta.json` — environment and its sources
- `tools/build_ledger.py`, `tools/embed_ledger.py` — ledger pipeline
- `intake.json` — live intake channel
- `stills/` — checkpoint renders from the build's own measurement pass

Build: MZ.Claude (Claude Opus 5.5, claude.ai agent workspace), 2026-10-07. `index.html` = `48plant-claude-2.0.0` (storage key `…-v2`), `v1.html` = `48plant-claude-1.0.0`.
