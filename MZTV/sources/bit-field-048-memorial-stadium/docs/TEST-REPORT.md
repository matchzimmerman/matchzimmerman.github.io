# Test report · BIT FIELD 048 · Phase 01 (interior + exterior + detail + evidence + moment + sound) · 2026-11-15

Harness: `tests/capture.py` (Playwright, headless Chromium 153 with SwiftShader, viewport 1920×1080). Raw results: `captures/report.json`. Contact sheets: `captures/contact-sheet.png` (stands) and `captures/contact-sheet-exterior.png` (exterior).

| check | result |
|---|---|
| loads without console errors or page errors (33 loads: 3 views × 7 cameras, both weathers for cam0, repro, motion) | **pass** (0 errors; the blocked webfont request is filtered as expected offline) |
| first frame | **pass**: 1.2–2.5 s from navigation to the first drawn frame, including geometry build (≈105–175 ms for 57,216 triangles + 86,093 line primitives with the moment's figures) |
| render cost (one-off per camera) | raster 71–350 ms (320×180 to 960×540; most of it is tree twigs) · sun shadow map (clear only): 51–60 ms |
| print cost | ink 17–51 ms/frame · neutral 370–670 ms (once) · evidence 120–250 ms (once) |
| live ink frame rate | 10.4 fps measured against a 12 fps target, headless software rendering. **Note:** retest on the studio machine in OBS before Phase 02 |
| reproducibility | **pass**: identical SHA-1 for two loads with the same `seed`, `t` and view (`c2896dc3…`) |
| motion | **pass**: frames at t=0 and t=30 differ only by drizzle streaks and cloud drift; geometry and evidence are static |
| 16:9 fixed frame | **pass**: phone portrait 390×844 → stage 390×219 (1.781); ultrawide 3440×1440 → stage 2560×1440 (1.778) |
| evidence view honesty | **pass after revision**: the first pass coloured every stand red (the crowd texture's "creative" status overrode the structure's). Fixed so geometry carries the structural claim and the playing surface is split into lines / gridiron / infield / turf |
| in-frame evidence share, cam0 | documented 0.7% · approximation 46.7% · creative 32.5% · sky 20.1% |
| in-frame evidence share, cam2 | documented 0.6% · approximation 41.1% · creative 36.7% · sky 21.6% |
| in-frame evidence share, cam3 (façade) | documented 44.6% (the measured façade and inscription) · approximation 37.4% · creative 0.0% · sky 18.0% |
| in-frame evidence share, cam5 (overview) | documented 2.0% · approximation 33.0% · creative 65.1% (mostly the invented neighbourhood) |
| detail pass checks | **pass**: spectators seen from behind show hair and hats (faces only in the opposite stands); the clock shows 4:06; wet roads take the sky; no tree stands on the façade axis |
| façade lettering | **pass**: the name is legible in the 320×180 print at street distance; the dedication resolves letter by letter at 960×540 and drops to an average tone when too small (no aliasing shimmer) |
| scene sun | elevation 6.2°, azimuth 232.8° at 16:06 EST (NOAA approximation); sunset 16:52 |
| the moment | **pass**: 22 players, 5 officials and both benches build from their own seeded stream (the rest of the world is unchanged); the play sits under the scoreboard in cam0 and cam2; the board reads COLTS 14 / GIANTS 9 at 960×540 |
| sound: recording (`tests/audio_test.py`, 60 s, `captures/audio-report.json`) | **pass**: no clicks (curvature max 1.85× its 99.9th percentile; nothing above 8 kHz), peak 0.40, per-second RMS −26 to −20 dB. Band share: 62% below 120 Hz, 29% 120–500 Hz, 8% 0.5–2 kHz, <0.1% above 2 kHz |
| sound: recovery | **pass**: resumes after a forced suspend; a forced rebuild crossfades with sound continuing; a forced close recreates the context and sound returns |
| sound: autoplay | starts at once in OBS (`window.obsstudio`) or with `?autoplay=1`; a plain browser waits for the first click or key, so captures load with no autoplay warnings |
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
5. The scoreboard's lamp letters (0.55 m cells) are smaller than a pixel from the upper deck in the 320×180 print, so COLTS 14 / GIANTS 9 reads as a broken amber pattern there; it is legible in the neutral print and from cam2 at higher `?lines=`.
6. The clear-sky alternate at 16:06 prints dark (evening inks at a 6° sun). The drizzle default is the record.
7. The first façade pass used the field's grazing-angle footprint for every surface, which blurred the façade name into blocks. Fixed: footprint now uses each surface's own angle to the camera.
