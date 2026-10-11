# MZTV / Galway geographic world — preferred SHEEPDOG site

## Current build status (2026-10-11) — integrated

**SHEEPDOG v0.2 now renders selected Galway geography**, with measured regional elevation and a clipped OSM site layer. This supersedes any older text in this document suggesting no terrain has been installed.

- `farmstead_eudem25m.json`: 21×23 sample grid, 25m step, ITM origin E506050 N722200; **483 valid interpolated EU-DEM v1.1 elevations**, values 14.987–34.939m. Site anchor direct query about 23.791m. Source: Copernicus/EEA EU-DEM (adapted samples) retrieved 2026-10-11 via Open Topo Data. Caution: 25m digital surface model, **not LiDAR**; roughly ±7m source-reported vertical RMSE, no farmyard-scale height claims. EU-DEM use/citation: https://www.opentopodata.org/datasets/eudem/ and https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b .
- `farmstead_osm_local.json`: **22 clipped/simplified OSM building footprints**, **4 road/path ways**, **1 wall**, source IDs intact, region anchored at E506160 N722560 and derived from the user-supplied OSM extract. This is a **local subset**, not the entire corridor GeoJSON; the full source bundle remains with the conversation artifact.
- `../../lib/mzgeo-galway.js`: draws the mapped features and elevation-projected ground, and supplies elevation to 3D subject/camera placement. It has no control over sheep/dog decisions.
- `../../sources/bit-field-029-sheepdog/index.html`: current implementation. Existing seeded MZHERD and MZCAM reused without modification to their core code.

**Important behavioral limitation:** the test paddocks (216m×136m, near the mapped farmstead) and gate/fences are still authored, not verified against property/stock boundaries. Actual sheep/dog movement uses a 2D policy; slope changes projection/camera geometry but is not yet an input to route selection or speed. The road is not a herd crossing route. The four red-marked buildings remain the user-selected anchor; no earlier northern-site proposal should replace them.

**LiDAR search:** Checked point intersection against available GSI polygon inventories for DCHG/Discovery Programme, OPW, OPW NASC and TII; these returned no coverage for the selected anchor. The GSI Phase2 LiDAR collection's published extent is east of this farmstead. This does **not** prove that no other recent high-resolution survey exists. Do not label the regional EU-DEM as a LiDAR scan.

**Current site decision, 2026-10-11:** The user selected the **tight red-circled cluster of mapped structures** beside the bend in the southern Galway road. Use this cluster and **the immediate surrounding fields** as the proposed SHEEPDOG setting. Do not center on the previously suggested northern farmland, the earlier northing 722500 star marker, or the broad orange dashed southern-corridor ellipse. That orange oval was context for locating the exact structures, not the selected site.

## Canonical site spec for MZ.Claude

Read [`sheepdog_farmstead_site_001.json`](sheepdog_farmstead_site_001.json), which specifies:
- ITM EPSG:2157 anchor **506275.05 E, 722460.10 N**; roughly WGS84 **53.24423154 N, -9.40424852 E**.
- Shared Galway OSM local-world origin **506420 E, 724295 N**; local X/Z of the anchor **-144.95 / -1834.90 m**. **Do not silently reset the underlying geographic coordinates** when using local camera/world offsets.
- Best-matched OSM building way IDs: `1163118488` (`house`), `1163356661`, `1163356662`, `1163356663` (three `shed` tags). These types are recorded *as tagged* by OSM, not confirmed uses or ownership.
- Core building-yard review box: E **506245–506307**, N **722434–722486**.
- Surrounding-fields review box: E **506125–506425**, N **722345–722610**.
- Wider context: E **506070–506550**, N **722200–722740**.

**Important:** these boxes are project-planning study windows, **not mapped property or field boundaries**. The user red circle is the location anchor, **not a surveyed enclosure**. Identifying the cluster does not verify any gates or safe sheep routes.

## Data package and source lineage

The user supplied `our-ireland-road-map(1).osm` (OpenStreetMap geometry); the separate ChatGPT conversation package **`MZTV_Galway_Geographic_World_v0.2.zip`** contains the imported full-corridor `galway_osm_world.json`, GeoJSON, converter, original red-marked markup, map preview, manifest and this updated preferred-site definition.

**Only the preferred-site coordinate/metadata is in this GitHub directory at present. The full OSM-derived corridor geometry and user markup are in the conversation ZIP, not yet committed here.** Before implementing real geometry, ingest that exact source bundle or regenerate/verify it from the supplied OSM; do not assume a `galway_osm_world.json` file already exists in this repository.

The source OSM file does **not** provide: measured ground elevations, rock formations, actual geology, complete paddock boundaries, confirmed field ownership, verified livestock crossings or gates. Do not present any authored terrain or boundaries as verified mapped data.

## Handoff — required scene design

1. **Core site:** frame the four-building cluster and immediate yard as the recognizable home location.
2. **Play / field site:** inspect actual surrounding parcels and practical passages on both sides of the nearby road. Do **not** infer a walkable sheep enclosure from the site rectangles or use the road as a sheep route without deliberate design/verification.
3. **Context:** preserve nearby roads, walls, other buildings, streams and slopes as factual *map-based* context when source geometry is available.
4. **Evidence separation:** OSM outlines; independently obtained/licensed DEM/DTM heights; independent Geological Survey Ireland geology; and user/game-authored playable fences/gates/spawns remain individually tagged.
5. **Existing gameplay:** `MZTV/lib/mzherd.js` and `MZTV/lib/mzcam.js` stay operational as the v0.1 behavior/camera prototype. Do not convert to the real site by snapping all its square paddocks onto these buildings. Wait until passable paddock topology and gates can be defined.
6. **Validation:** show a site-overlay preview, annotate the red-selected building cluster separately from candidate field boundaries, and check derived metrics and seed runs after any collision change.

## Supersession

- `sheepdog-site-001` — **retired**: northern farmland proposal, wrong location.
- `sheepdog-southern-corridor-candidate` — **superseded**: broad orange oval was only a search area.
- `sheepdog-galway-farmstead-001` — **preferred**: user red-marked cluster + neighboring fields; exact paddocks still to be verified.

Tracking and code review: [SHEEPDOG GitHub issue #12](https://github.com/matchzimmerman/matchzimmerman.github.io/issues/12).

Data attribution: © OpenStreetMap contributors (Open Database License v1.0): https://www.openstreetmap.org/copyright
