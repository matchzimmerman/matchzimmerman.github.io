# Porting FARM into INVERIN

FARM was built so it can be lifted into the shared INVERIN world (`MZTV/sources/mz-world-inverin/`) the way TWISTED TREE and SRUTHÁN were: as a place planted into HEADLAND's scene, printed in the same inks, filmed by the same crew, heard through the same mix. Nothing here edits INVERIN; this is the plan for whoever does the port, and it needs MZ.Human's go‑ahead like any change to INVERIN.

## What is portable
| Piece | Where | How it ports |
|---|---|---|
| World model | `farm.world.json` | the source of truth: entities, layout, rules, evidence. Read it, don't retype it. |
| Runtime model | `FM` blob in `parts/p1.html` (between `/*<FARM_MODEL>*/` markers) | regenerate with `tools/build_model.py`; same keys in INVERIN |
| Buildings, walls, gates, props | `parts/p3.html`, sections marked `FARM:` | already go through INVERIN's helpers: `objMat(id, mode, T, extra)`, `withT`, `clean`, `M4`, `mergeGeometries`, `terrainH`, `OBST` |
| Grass and tread maps | `GRASS`/`TREAD` + `fieldTex` + the ground mode in `OBJ_FRAG` (mode 2) | INVERIN's terrain material needs the mode‑2 branch and the `uGrass`/`uGB` uniforms; the map covers the farm's rectangle only and is neutral outside it |
| Grass blades | `BLADES` (instanced, `uSway` 1 in `OBJ_VERT`) | needs the `aG` attribute branch and the `uPh[8]` pressers in `OBJ_VERT` |
| Bernard, the farmer, the ewes | `parts/p4.html` bodies, `parts/p5.html` minds | self‑contained; they read `terrainH`, `WSEG`, `GATES`, `BLD`, `OBST`, `SUNM`, `WX`, `live`, `AUD` |
| Events | `gather`, `turn`, `lie`, `stone` in `parts/p6.html` | add to INVERIN's `EVT`, `conditions()`, `why`, with their memory fields (`h`, `wi`, `fa`) |
| Sound | `bleat`, `clank`, `stone`, `whistle` voices; the flock‑pace bar; the Bernard‑zone bass | the voices drop into INVERIN's `AUD.voice`; see "Sound" below for the bar and bass |
| Operators | 11 in `CREW` | add the farm operators to INVERIN's crew, weighted down when the farm is far from the action |

## Frame and anchor
FARM uses the HEADLAND/INVERIN frame: +x north, +z east, y up, metres. Its local origin is the SHEEPDOG farmstead anchor (53.24423 N, 9.40425 W; ITM 506275 E, 722460 N). INVERIN is sculpted to suggest the Inverin coast, not surveyed, so the farm cannot sit at its true offset. Plant it by translation only:

1. Pick `FARM_AT = [X0, Z0]` in INVERIN on open ground inland of the coast path, clear of the house, the wood and the stream, with at least 260 × 360 m free (the farm's extent is x −125…235, z −205…95).
2. Wrap every farm position: `x_inverin = X0 + x_farm`, `z_inverin = Z0 + z_farm`. Do it once, in the `FM` blob, at build time (`build_model.py --offset X0 Z0` is the suggested switch), so the rest of the farm code is unchanged.
3. Don't rotate or mirror. If the farm must turn to fit, rotate about the anchor in the model build and rotate `wall`/`gate` axes with it (gates with `axis` 'x'/'z' become arbitrary angles: switch `gateCut` to the general segment test).

## Ground
FARM's `terrainH` is the 25 m EU‑DEM with micro‑relief. INVERIN has its own sculpted ground. In the port, **use INVERIN's `terrainH`** and keep only FARM's levelling: the building pads (`PADS`) and the yard pad, blended into INVERIN's height the same way `terrainH` blends pads here. Drop FARM's descent to the bay and its coarse horizon sheet; INVERIN has its own sea and horizon. The fine field mesh (`NEAR`) becomes a patch of INVERIN's terrain that carries the mode‑2 ground material.

## Time, weather, memory
- One clock, one sun and moon, one `WX`. FARM's Open‑Meteo point is 6 km from Inverin; in the port, use INVERIN's weather and drop FARM's fetch.
- FARM's memory moves under INVERIN's key as a sub‑object: `S.farm = { grass, tread, wallLaid, days, moved, exp, ewe, flockAt, flockPos }`. Saving the grass and tread maps adds about 18 KB (base64).
- `regrow(sec)` on resume should run from INVERIN's `lastMs`.

## Sound
INVERIN's bar comes from the swell (HEADLAND). Keep that. Let the flock pace pull the bar only when a farm operator is live (blend toward `6.6 − 2.4 × pace` over a bar). The bass degree follows the keeper in INVERIN; when a farm operator is live, follow Bernard's zone (`ZDEG`) instead. Bleats, gate, stone and whistle are placed by the lens like gulls and thumps already are.

## Crew
Add YARD, BYRE, FOLD GATE, WALL, LONG LENS, GRASS, BERNARD SIDE, BERNARD LOW and THORN (HILL and ROAD can be dropped or re‑aimed at INVERIN's coast). `chooseShot()` weights for them: as in FARM when something is happening on the farm (a move, the farmer laying stone, Bernard asleep at night), and ×0.3 otherwise, so the coast keeps its share. `clearance()` and Bernard's low‑angle search need FARM's `WSEG` and `BLD` boxes in INVERIN.

## Walk mode
In INVERIN's walk, the farm's walls are lace walls a person can't step over: add `WSEG` to the walker's collision, with the gates passable when open. The farmer treats a standing visitor like a wall‑post; the ewes treat a visitor like the farmer (a standing person is a wall to a sheep). Bernard ignores visitors.

## Check after porting
- The farm prints the same as in FARM at the same hour (side‑by‑side with this folder).
- A morning move, a midday move and a dusk move each complete; Bernard sleeps in the byre.
- The four farm events fire under their conditions and log their reasons; the global gap still holds across coast and farm events.
- INVERIN's own events, keeper, boat, gulls and seal behave as before.
- Saved state from before the port still loads (the `S.farm` sub‑object is created fresh if missing).
