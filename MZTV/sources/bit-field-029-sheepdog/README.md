# MZTV · BIT FIELD 029 · SHEEPDOG

> **Geographic direction (updated 2026-10-11):** The user selected the **red-circled four-building Galway farmstead cluster and surrounding fields** as the preferred real-world environment. The v0.1 square paddocks documented below are an existing functional test, **not** the approved final landscape. The authoritative next-stage site spec is [`MZTV/worlds/galway/sheepdog_farmstead_site_001.json`](../../worlds/galway/sheepdog_farmstead_site_001.json), with instructions in [the Galway world README](../../worlds/galway/README.md). Do not substitute the earlier northern farmland or broad orange southern candidate. Field boundaries, gates, elevation and geology are **not yet verified**; do not present authored versions as mapped truth.

A border collie and individual sheep in two fenced paddocks, filmed by five autonomous drone cameras. The human issues a high-level command; the dog attempts to collect and drive the flock through the gate into the designated field. This is a behavioral simulation, not a recording or a prerecorded animation.

**Program:** https://matchzimmerman.com/MZTV/sources/bit-field-029-sheepdog/

## v0.2 — selected Galway farmstead, mapped site + measured regional elevation

**Live source:** https://matchzimmerman.com/MZTV/sources/bit-field-029-sheepdog/

The world is now positioned **west/northwest of the user's selected farmstead**. Four highlighted building footprints identify the approved real-world anchor, with 18 other locally mapped structures and four clipped local road ways, sourced from the supplied OpenStreetMap extract. The farmstead is around **E506275 / N722460** (ITM EPSG:2157). The original GIS coordinate origin **E506420 / N724295** remains documented. The 216×136m experimental sheep pens are placed around **E506160 / N722560**, physically near the mapped structures without running sheep over the road. These pens, the dividing fence and the gate are **gameplay-authored**; they are not claimed as mapped field parcels, historic agricultural practice or confirmed access rights.

**Measured elevation input:** `MZTV/worlds/galway/farmstead_eudem25m.json` has **483 interpolated heights** (21×23 grid, 25m spacing) over a 500×550m window, drawn from **EU-DEM v1.1** through Open Topo Data's `eudem25m` dataset on 2026-10-11. Site-anchor sample: **23.791m**; observed grid range **14.987–34.939m**. The client samples that elevation grid bilinearly and offsets 3D points relative to the measured anchor for camera projection. The elevation is spatially referenced but **not a fine-scale field survey**: EU-DEM is an approximately 25m digital **surface** model based on SRTM/ASTER and may include artifacts from structures/vegetation, with EEA-stated vertical RMSE roughly ±7m. Slope is used for rendered height/camera alignment; **the animal movement controller is still 2D**, with no slope-dependent physics yet. Do not interpret visible subtle ridges as surveyed small stone banks or paddock boundaries.

**Sources:**
- Copernicus / European Environment Agency **EU-DEM v1.1** (adapted/resampled); supplied through [Open Topo Data](https://www.opentopodata.org/datasets/eudem/). Credit: © European Union, Copernicus Land Monitoring Service / European Environment Agency. Source metadata: [EEA EU-DEM](https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b).
- [OpenStreetMap](https://www.openstreetmap.org/copyright), © OpenStreetMap contributors, ODbL 1.0. The committed local simplified subset `farmstead_osm_local.json` is traced to the user-provided `our-ireland-road-map(1).osm`, simplified to 1.2m geometry tolerance and clipped locally. No new OSM names, ownership claims or gates have been invented.
- [Geological Survey Ireland LiDAR catalog](https://gsi.geodata.gov.ie/server/rest/services/Lidar): possible future data upgrade; coverage/resolution for the selected site must be checked, and no LiDAR is used in this v0.2 build.
- `MZTV/lib/mzgeo-galway.js`: independent projection-only map/height renderer. It never modifies MZHERD sheep/dog or MZCAM shot decisions.

**Fallback:** If the public geographic JSON is missing or cannot be loaded, the source explicitly reports `TERRAIN OFFLINE` and shows the v0.1 flat-field renderer rather than substituting invented heights. This should be treated as degraded mode during OBS tests.

**Tests:** `node MZTV/sources/bit-field-029-sheepdog/test.mjs` and `node MZTV/sources/bit-field-029-sheepdog/test-geography.mjs` from the repository root. Live browser test on 2026-10-11: all geographic JSON loaded, 22 buildings/4 roads and five MZCAM cameras available; command/step/cuts executed without page exceptions. Long OBS soak remains to be measured.

## Use
- **OBS Browser Source:** the program URL at 1920×1080. Audio is deliberately quiet and optional. The default broadcast auto-issues its own command after 2.2 simulated seconds; it starts a new seeded episode after the completed/timeout episode has held for 13 seconds.
- **Play/test:** add `?play=1` to require a click on **Give command**.
- `?seed=29`: select a deterministic starting arrangement. A specified seed starts fresh and bypasses any saved checkpoint.
- `?sheep=16`: choose number of sheep, clamped to 4–40.
- `?capture=1`: no automatic animation frame; call `MZ.tick(dt)` for deterministic review. You can inspect `MZ.world` and `MZ.crew`.
- `?fresh=1`: ignore stored run. `?rate=N` speeds simulation, `?bay=1` opens the camera monitors, `?debug=1` labels agents, `?info=0` hides documentary overlays, `?audio=0` disables audio.
- Keys: **Space** command, **N** next episode, **C** camera bay, **M** sound, **I** overlays.

## Actual shared architecture
- `../../lib/mzherd.js` (**new**): camera-independent, DOM-free deterministic simulation. APIs: `create(seed,count)`, `command(world,target)`, `step(world,dt)`, `state(world)`, `snapshot(world)`, `restore(snapshot)`. Sheep have their own positions, velocities, collision, separation/cohesion, wandering and dog-pressure responses. The dog switches between collecting an outlier and driving a compact flock to a gate/field. Fence posts and the gate correspond to the world collision model.
- `../../lib/mzcam.js` (**existing, unchanged**): camera crew, flight, look springs, lens, director, projected 3D drawing and multi-monitor Bay, extracted from 48 PLANT and already used in BIT FIELD 028 TRACKSIDE.
- `index.html`: host for procedural camera-space rendering, five shot roles (aerial / dog chase / flock side / gate / outlier rover), overlays, controls, optional low audio, local checkpoint. No new camera framework is introduced.
- The camera layer **does not affect** dog or sheep state. Program selection is based on observable flock states (outliers, proximity to gate, dog phase).

## Physics/behavior contract
- World coordinates are x/z with ground y=0. Paddocks occupy x=-108..0 and 0..108, z=-68..68. A continuous wall at x=0 is open only at z=-12..12.
- Sheep independently blend neighbor cohesion, separation, small individual drift, inertia and repulsion from the dog when within the pressure radius.
- The dog uses a collecting position outside a dispersed stray and a driving position behind the flock relative to the next gate/field waypoint. The dog may genuinely stall or fail: it never teleports or auto-awards the goal.
- Success is **all sheep at x>19 for 1.8 continuous seconds**. An episode times out after 390 simulated seconds; the game loop continues with the next seed.
- Seed/time-independent camera movement: a cut cannot change animal coordinates.

## Validation and limitations
- 20 seed smoke test on the committed v0.1.1 engine: **19 successes, 1 timeout** (seed 15: 4/16 at 390 seconds). The existing escape/fence cases remain visible and measurable.
- Deterministic seed, fixed agent step (30Hz), capped catch-up, inspectable log, local snapshots and capture mode provide a foundation for later automated screenshot/behavior coverage.
- **Not yet:** robust solution to every starting layout, polished 3D models, sheep/dog animation rigs, games/levels, training simulation, multiplayer, microphone/whistle recognition, or artificial neural policy.
- Current controller is inspired by the collecting/driving model in Strömbom et al., *Journal of the Royal Society Interface* (2014), DOI: 10.1098/rsif.2014.0719. It is not a scientifically validated border collie behavior model.

## Next iteration (BMIR)
BUILD: tune gate alignment and boundary recovery. MEASURE: run multiple seeds, capture failures and audit camera shots. INTERPRET: differentiate meaningful agent dynamics from policy pathologies. RETURN: refine after embodied viewer feedback, then extend the command vocabulary and multiple fields.

**Origin:** Issue #12, 2026-10-11. TRACKSIDE v2 and 48 PLANT were consulted; their files were not overwritten.
