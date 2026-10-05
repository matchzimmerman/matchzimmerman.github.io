# MZTV · FIELD ENGINE 002 · THE FIELD DOES NOT RESET

A data-driven FIELD ENGINE work built in the spatial rendering grammar established by **BIT FIELD 014 — SOUNDING**.

A rolling year of public incident records flagged as shootings is replayed chronologically into one evolving terrain. Each event enters at its recorded geographic position with the same initial force. There is no severity scaling, victim visualization, weapon imagery, street map, neighborhood labeling, or place-name display.

The terrain attempts to settle after each event, but does not return to its prior state.

## Build (v2, 2026-10-05)

`index.html` is now **SOUNDING's source with the FIELD ENGINE 002 event system ported in** (SOUNDING treated as the codebase). The renderer and the entire audio engine are SOUNDING's, unmodified.

Why v1 was black: the earlier transplant deleted SOUNDING's persistence/info block (`save`, `load`, `info`, `fmtT`), so `setInterval(save, …)` threw at boot. Audio had already started; the animation loop and data fetch never ran. The previous build is kept as `v1-broken.html` for the record.

Data fix: v1 asked for the oldest 2,000 records (ascending, capped), which returned 2022–23 rather than the last year. v2 first asks the source for its newest record, then fetches every shooting-flagged record in the `?days` window before it (paged), so the replay is the true rolling year.

Update (same day): impact rings now draw only on open ground beyond 10 units from the camera, and plumb lines only beyond 8 units, because recorded events can land beside the camera. A ring crossing a wall that faced the camera had rendered as a solid slab. The replay also now runs on simulation time, so `?capture=1` renders the timeline correctly.

## Behavior

- A rolling year of shooting-flagged public incident records is fetched from the official NIBRS Group A ArcGIS layer.
- Events are sorted by occurrence time and replayed proportionally across the performance.
- Geographic coordinates determine event position only.
- Each recorded event produces the same terrain impact and memory pressure (fixed force 0.78; no attribute scales it).
- The disturbance settles; the scar fades slowly but never below a permanent residue each event leaves (`ef` floor), so the ground does not return to its prior state even over many hours.
- Accumulated events add rule pressure: a year drives roughly three SOUNDING rule eras.
- Accumulated impacts feed the same terrain-memory and rule-pressure systems that make SOUNDING evolve.
- Synthetic/random impact events from SOUNDING are disabled; recorded events are the only true impact source.
- The camera remains autonomous but slowly bends toward the next/recent disturbance rather than teleporting to it.
- After the final event, the altered ground keeps running with no new events. Looping is opt-in.
- If the data source can't be reached, the ground runs with no events and retries every 60 s; nothing substitutes for records.

## Visual system

The work now uses SOUNDING's spatial language rather than the earlier flat FIELD ENGINE panel:

- low drifting camera
- ray-marched terrain (WebGL2; no canvas fallback any more)
- contour strata and world-space hatching
- persistent impact scars
- long sun/moon shadows
- fog, cloud shadow, rain and atmospheric depth
- low-resolution four-ink rendering
- ordered / halftone / grain dither
- registration drift and temporal image smear
- visible plumb-line/ring traces for very recent impacts

The terrain is not a literal map. Geographic relationships become positions within the material world.

## Audio

The SOUNDING audio environment remains coupled to the same simulated terrain. Recorded impacts use its distance-aware impact system: an event is visible before it is heard when it occurs far from the camera, and the terrain beneath it changes the response.

## Controls

- `I` — toggle information overlay
- `SPACE` — pause / continue the yearly replay
- `R` — rebuild the ground and restart the year
- `T` — manually force a FIELD ENGINE rule transition

## Runtime parameters

- `?minutes=12` — compressed duration of the year
- `?hold=30` — minimum after-state duration
- `?days=365` — data window
- `?loop=1` — rebuild and replay after the hold; default is no loop
- `?audio=0` — disable audio
- `?info=0` — hide information overlay
- `?fresh=0` — allow saved terrain state; fresh ground is the default
- `?rate=N` — FIELD ENGINE evolution-rate multiplier
- `?lines=N` — internal rendering resolution
- `?capture=1` — offline/capture timing mode inherited from SOUNDING
- `?seed=N` — fixed seed for the starting ground

Path:

`sources/field-engine-002-the-field-does-not-reset/index.html`

Live:

`https://matchzimmerman.github.io/MZTV/sources/field-engine-002-the-field-does-not-reset/`
