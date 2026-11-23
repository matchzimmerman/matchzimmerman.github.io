# ORANGUTAN 001 · PHOTOREAL fork · build brief

**Fork of:** ORANGUTAN 001, HARIL STUDIO #62 → #63
**Branch:** `mz-claude/orangutan-001-photoreal` in `matchzimmerman/matchzimmerman.github.io`, starting from `8f08852` (the 48PLANT fork at G1.3)
**Folder:** `MZTV/sources/orangutan-001-photoreal/` (new; leave everything else untouched)
**Goal (MZ.Human, 2026-11-22):** same animal, *no limit on the graphics*. Get as close to photorealism as possible.

## The two forks (keep them separate)
| | 48PLANT fork | PHOTOREAL fork |
|---|---|---|
| Branch | `mz-claude/orangutan-001-48plant` (frozen at G1.3, `8f08852`) | `mz-claude/orangutan-001-photoreal` |
| Folder | `MZTV/sources/orangutan-001/` | `MZTV/sources/orangutan-001-photoreal/` |
| Look | the 48PLANT studio: white cyclorama, 34-ink print pass, flat-shaded blockout, MZCAM drone crew | photoreal: physically based, no print pass, no ink palette |
| Status | preserved; only change on MZ.Human's word | active build |

The old working branch `mz-claude/orangutan-001` still exists and points at the same commit as the 48PLANT branch. Treat `-48plant` as canonical. Don't edit the 48PLANT folder from the photoreal branch, and never merge either fork to `main` without MZ.Human.

## What to reuse (don't rebuild)
`MZTV/sources/orangutan-001/creature.js` holds a working **life engine**: anatomy calibrated from #63, joint hierarchy, two-bone IK, diagonal-sequence fist-walking with planted contacts, eyes-then-head attention, breathing, blinks, scratching/fiddling/inspecting, deterministic seeded behavior, `observe()`, and `tools/life-test.mjs` (10 seeds pass). The photoreal fork should **split that file into a brain and a body**:
- **brain** (keep, import or copy unchanged in behavior): state machine, gait, IK targets, gaze, timers, `observe()`, metrics, log
- **body** (replace): everything visual. Rigid shaggy shells, instanced locks and flat shading are the 48PLANT look, not the photoreal one.

Keep `life-test.mjs` passing (slip ≈ 0, reach < 0.99, no pops, eyes first, deterministic) as the guard that the brain didn't break.

## What "photoreal" needs (MZ.Claude's build plan; the next session should refine it)
1. **One continuous skinned body:** generate the skin surface in code (an implicit/SDF body from the anatomy, meshed with marching cubes or a sculpted parametric mesh), with procedural skin weights onto the existing joints. Joints fold cleanly, no segment seams; face topology dense enough for lids, lips and muzzle.
2. **Hair:** strand-based coat (tens to hundreds of thousands of instanced tapered curves, or guide strands plus interpolation) with region length and density maps, clumping, gravity and follow-through. Forearm drapes, crown hair lying flat, sparse areas where skin shows. Shading by hair BSDF approximation (Marschner/Kajiya-Kay style: two speculars, transmission).
3. **Skin and face:** subsurface scattering approximation, procedurally generated pore, wrinkle and fold normal maps (face disc, knuckles, palms, soles), wet eyes (cornea, iris, sclera, tear line), light eyelids, dark muzzle (#63 R5).
4. **Light and camera:** physically based lights, an HDR environment (procedural or neutral studio), ACES/AgX tone mapping, GTAO/SSAO, contact shadows, TAA, real lens behavior (depth of field, focal length in mm, slight grain). A path-traced still/capture mode (e.g. a WebGL path tracer) alongside the realtime view.
5. **Stage:** the white cyclorama can stay as a neutral photographic studio, or MZ.Human may want a natural set. **Ask.**
6. **Crew:** MZCAM may continue as real cameras with DOF; optional. **Ask.**

## Decisions for MZ.Human at the start of the session
- **Asset rule:** does "no premade models, rigs, clips, character templates" still hold? MZ.Claude's default: **yes for the animal** (it stays source-built). For **lighting and environment**, is a licensed HDRI or photo texture allowed, or must those be procedural too?
- **Runtime target:** realtime in the browser (WebGPU/WebGL, streamable in OBS), offline render (path-traced frames to video), or both?
- **Stage and crew:** neutral studio cyc vs. a natural set; keep MZCAM or a single observational camera?
- **Fidelity vs. frame rate:** what's the minimum acceptable fps for streaming?

## Research to hand to MZ.GPT (photoreal changes what matters)
The 48PLANT fork didn't need these; the photoreal one does. Open a follow-up on #63 or a new sub-issue:
- **Hair:** region-by-region length, density and clumping for adult female *P. pygmaeus*, from licensed or CC photos with scale, measured or estimated with method stated; strand diameter range.
- **Colour:** colorimetric colour of coat (base vs. tips), skin (face, palms, soles), lids, iris/sclera, under known illuminants. If unavailable, a short list of CC0/CC-BY neutral-light reference photos for MZ.Claude to sample, links only.
- **Skin:** micro-detail references (knuckle pads, palm creases, facial disc texture, ischial callosities if visible).
- **Eyes:** iris colour range and pattern, sclera pigmentation.
- **Motion:** any orangutan terrestrial gait timing (duty factor, cycle, speed); still open from #63.

## Where things live
- Parent: [haril-studio #62](https://github.com/matchzimmerman/haril-studio/issues/62) · research: [#63](https://github.com/matchzimmerman/haril-studio/issues/63)
- 48PLANT fork README (diff map, test procedure, G1.1–G1.3 calibration log): `MZTV/sources/orangutan-001/README.md`
- Hub: HARIL SHARED TIMELINE + HARIL DAILY ACTIVITY ledger (Notion). Log a receipt after substantive sessions.
