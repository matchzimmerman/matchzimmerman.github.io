# Test report · BIT FIELD 048 · Phase 01 (interior + exterior) · 2026-11-14

Harness: `tests/capture.py` (Playwright, headless Chromium 153 with SwiftShader, viewport 1920×1080). Raw results: `captures/report.json`. Contact sheets: `captures/contact-sheet.png` (stands) and `captures/contact-sheet-exterior.png` (exterior).

| check | result |
|---|---|
| loads without console errors or page errors (30 loads: 3 views × 6 cameras, both weathers for cam0, repro, motion) | **pass** (0 errors; the blocked webfont request is filtered as expected offline) |
| first frame | **pass**: 1.5–2.0 s from navigation to the first drawn frame, including geometry build (≈35–50 ms, 32,788 triangles + 2,067 line primitives with the exterior and neighbourhood) |
| render cost (one-off per camera) | raster 320×180: 45–65 ms · 960×540: 90–185 ms · sun shadow map (clear only): 51–60 ms |
| print cost | ink 17–40 ms/frame · neutral 270–450 ms (once) · evidence 125–190 ms (once) |
| live ink frame rate | 10.4 fps measured against a 12 fps target, headless software rendering. **Note:** retest on the studio machine in OBS before Phase 02 |
| reproducibility | **pass**: identical SHA-1 for two loads with the same `seed`, `t` and view (`4133d733…`) |
| motion | **pass**: frames at t=0 and t=30 differ only by drizzle streaks and cloud drift; geometry and evidence are static |
| 16:9 fixed frame | **pass**: phone portrait 390×844 → stage 390×219 (1.781); ultrawide 3440×1440 → stage 2560×1440 (1.778) |
| evidence view honesty | **pass after revision**: the first pass coloured every stand red (the crowd texture's "creative" status overrode the structure's). Fixed so geometry carries the structural claim and the playing surface is split into lines / gridiron / infield / turf |
| in-frame evidence share, cam0 | documented 0.7% · approximation 39.5% · creative 38.8% · sky 20.9% |
| in-frame evidence share, cam2 | documented 0.4% · approximation 37.2% · creative 43.1% · sky 19.3% |
| in-frame evidence share, cam3 (façade) | documented 2.5% (the inscription) · approximation 78.9% · creative 1.4% · sky 17.2% |
| in-frame evidence share, cam5 (overview) | documented 0.2% · approximation 32.3% · creative 67.5% (mostly the invented neighbourhood) |
| façade lettering | **pass**: the name is legible in the 320×180 print at street distance; the dedication resolves letter by letter at 960×540 and drops to an average tone when too small (no aliasing shimmer) |
| scene sun | elevation 14.2°, azimuth 222.6° at 15:10 EST (NOAA approximation) |
| Firefox / Safari | **not tested**: only Chromium is installed in the build environment |
| OBS browser source | **not tested** here (Chromium-based, so expected to match) |

## Reading the numbers

- The documented share is small because what the sources document precisely (field rules, foul poles, the existence of things) is thin on screen. The bowl, decks and scoreboard are evidence-constrained approximations. The large creative share is mostly foul-territory turf, the neighbourhood and invented structure (soffits, concourse). The evidence view makes this visible rather than hiding it.
- The neutral and evidence prints are static by design. Only the ink print animates.

## Known issues

1. The drizzle ink print is low-contrast (mostly inks 1–2 under a cream sky). The clear-sky alternate is closer to HARBOUR LIGHT's range. See review item R5.
2. The crowd texture is generic: square seat cells with head ellipses. Fine at 320 px; at 960 px it reads as a placeholder.
3. Line primitives (posts, poles, fence) are at least 1 px wide at any distance, so far goalposts read slightly heavier than they would.
4. The live ink loop is just under its 12 fps target in headless software rendering.
5. The first façade pass used the field's grazing-angle footprint for every surface, which blurred the façade name into blocks. Fixed: footprint now uses each surface's own angle to the camera.
