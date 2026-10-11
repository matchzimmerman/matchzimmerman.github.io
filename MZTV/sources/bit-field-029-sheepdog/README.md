# MZTV · BIT FIELD 029 · SHEEPDOG

A border collie and individual sheep in two fenced paddocks, filmed by five autonomous drone cameras. The human issues a high-level command; the dog attempts to collect and drive the flock through the gate into the designated field. This is a behavioral simulation, not a recording or a prerecorded animation.

**Program:** https://matchzimmerman.com/MZTV/sources/bit-field-029-sheepdog/

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
