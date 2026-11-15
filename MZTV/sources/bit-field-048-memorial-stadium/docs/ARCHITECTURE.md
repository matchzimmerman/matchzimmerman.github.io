# Architecture note · BIT FIELD 048 · Phase 01

## What already existed (audit, 2026-11-13)

| system | where | what it does | fit for a stadium |
|---|---|---|---|
| HARBOUR LIGHT v3 (046) | `MZTV/sources/bit-field-046-harbour-light/` | 2D silhouette world → luminance → **six inks through a 4×4 Bayer matrix** at 180 lines, Turner sky, four moods, live weather, memory, audio | the visual language the brief asks for; no 3D |
| HARBOUR LIGHT · BALTIMORE (047) | `…/bit-field-047-harbour-light-baltimore/` | the same print with a **CPU 3D renderer in real metres** (camera, frustum, solar position, haze); objects drawn by **painter's sort** | the right family, but the painter's sort breaks inside a bowl that wraps round the camera |
| HEADLAND family (031, 034, 035, 042) | e.g. `…/bit-field-034-loch-raven/` | **three.js / WebGL** worlds with a print pass (linocut hatching) and **walk modes** | the route to navigable worlds later; a different print language |
| "MZ CAM" | — | no standalone module found in the repo; cameras are defined inside each piece | the stations in `geometry.js` are a seed for one |

## What this build reuses, adapts or adds

| part | file | origin |
|---|---|---|
| Bayer table, six-ink rule (`v = L·5`, step up when the fraction beats the threshold) | `js/shade.js` | **reused** from 046/047 unchanged |
| ink palettes | `js/shade.js` | **adapted**: drizzle = v3 *day* pulled 45% toward v3 *night*; clear = v3 *day* + 30% v3 *evening* |
| solar position (NOAA, simplified) | `index.html` | **reused** from 046/047 |
| distance haze toward the horizon tone | `js/shade.js` | **adapted** from 047 (exponential, visibility set by weather) |
| 16:9 stage, pixel-sharp upscale, info box in the live inks, mono type | `index.html` | **adapted** from the MZTV build protocol |
| z-buffered rasterizer writing a G-buffer (triangle id, 1/z, world position) | `js/raster.js` | **new**: needed because the stands surround the camera |
| sun shadow map (orthographic, 2×2 PCF) | `js/raster.js` | **new** (only used when the sky clears) |
| geometry as pure data with a claim id on every triangle | `js/geometry.js` | **new** |
| evidence register as data, shared by the view, the info box and the docs | `js/evidence.js` | **new** |
| neutral and evidence printers | `js/shade.js` | **new** |

## Shape of the code

```
evidence.js  ──claims──▶  geometry.js  ──triangles + claim ids──▶  raster.js ──G-buffer──▶  shade.js
 (sources,                 (DIM, buildStadium,                     (renderScene,               printInk      → 320×180 six inks
  claims)                   STATIONS; no DOM)                       shadowMap)                 printNeutral  → 960×540 colour
                                                                                               printEvidence → 960×540 status map
index.html: params, layout, info box, loop, window.MZ          tests/: capture.py, contact_sheet.py, plan.mjs, register.mjs
```

- **One frame, three prints.** The G-buffer is rendered once per camera and resolution. Only the ink print redraws (drizzle and cloud drift, 12 fps target), so the fixed camera costs about 20–35 ms a frame on a software path.
- **Deterministic.** No `Math.random`: geometry is seeded (`?seed=`), surface patterns are hashed from world position, and `?t=` freezes time. Same params give byte-identical captures (tested).
- **No dependencies.** Plain ES modules and Canvas 2D, served as static files from GitHub Pages like every other MZTV piece. The only network request is the JetBrains Mono webfont, with a monospace fallback.

## Why not three.js now

For one fixed camera, the CPU path keeps the print bit-exact with HARBOUR LIGHT, needs no GPU (OBS on any machine, headless tests) and keeps the evidence attribution per pixel. `geometry.js` already outputs flat position/normal arrays plus per-triangle material and claim, the shape a three.js `BufferGeometry` takes. The planned route:

1. **Phase 02 (refined still / limited motion):** stay on the CPU path; add the approved moment (players as simple figures, field-level seats, scoreboard state) and the fixes from the review queue.
2. **Phase 03 (navigable):** feed the same `buildStadium()` arrays into three.js, port `printInk` to a fragment shader (the Bayer table and ink rule are a few lines of GLSL), and reuse the HEADLAND walk controller. The claim ids become a vertex attribute, so the evidence view still works while walking.
3. **MZ CAM:** promote `STATIONS` to a shared module (named camera stations with position, aim and FOV) that any MZ WORLD can import. That is a separate decision for MZ.Human (review item R9).

## Params and keys

`?view=ink|neutral|evidence` · `?cam=0…5` (0–2 stands, 3–5 exterior) · `?wx=drizzle|clear` · `?t=` (freeze time, s) · `?hour=` (EST, default 15.1667) · `?lines=` (ink resolution, default 180) · `?nh=` (neutral height, default 540) · `?seed=` · `?claim=N` (isolate one claim in the evidence view) · `?info=0` · `?stamp=0` · `?capture=1` · `?fps=`
Keys: `1` ink · `2` neutral · `3` evidence · `c` camera · `w` weather · `i` info.
`window.MZ` exposes `state`, `share`, `STATS`, `set({...})` for tests.
