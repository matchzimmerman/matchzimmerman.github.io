# MZTV · BIT FIELD 044 · MZ WORLDS · OVERFLIGHT (working title)

One continuous broadcast across eight MZ WORLDS. A drone climbs out of one world into open sky, the print dissolves through an ordered dither, and it dives out of the same sky into the next. Each world keeps its own source, weather, inhabitants, memory and sound. This page only flies a camera through `window.MZ`.

**Status:** branch `mz-world/overflight-044`. Not deployed, not visually approved.
**OBS:** Browser Source → this page · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (default 720; passed to each world) · `?start=slug` · `?capture=1` (drive with `MZH.tick(dt)`)
**Keys:** **I** info · **M** mute · **R** send the camera up (logged as human intervention)
**Console:** `MZH.shot('run' | 'orbit' | 'pass' | 'crew' | 'dive' | 'climb')` · `MZH.cross(slug)` · `MZH.state`

## In rotation
HEADLAND · SEALS SEE · BREAKWATER · LOCH RAVEN · OUTBUILDING · SKATE GARDEN · FLOWER FIELD · TWISTED TREE. These are the worlds on `main` that expose `MZ.look` and `MZ.h`.

Not yet in: SRUTHÁN (macro, no `h`), WHITE CUBE, FLOWER BOWL, ROOST and HAMBURGER CAVE (branches, not on `main`), CROSSING and KAATERSKILL FALLS (not references).

## Shots
| Shot | What it does | Length |
|---|---|---|
| ALTITUDE | wide orbit looking down on the whole place | 20–32 s |
| HIGH PASS | one straight line across the place, nose down | 14–22 s |
| SECTION RUN | fast, terrain-following, through 3–5 named sections | 9–26 s |
| WORLD CREW | hands the camera back to the world's own operators | 14–28 s |
| CLIMB / DIVE | leave and arrive through open sky | 9 s each |

Heights and speeds are per world, in that world's own metres. Each stay runs 150–300 s.

## Shared layer
- **Crossing:** the next world loads about 30 s ahead, silent and behind the current one, then both are on screen for 4.2 s.
- **Route memory:** each world records the sky it was last left under. The next world is weighted toward the one whose remembered sky matches the current one and toward the least visited. Water worlds lean toward water worlds.
- **Log:** one log and one info box across all worlds, in the inks of the world on air. Saved to `mzworld-overflight-v1` every 60 s and on unload.

## Deliberate breaks from the HEADLAND standard
- **Rule 1 (real local time):** hosted copies always start in daylight through `?hour`, because the worlds are not interesting at night. Weather stays real.
- **Rule 5 (observational crew):** most of the airtime is flown, by request. The crew still gets a share.
- **Rules 6–8:** events, memory and rupture stay inside each world. The host adds none of its own.

## Isolation
Worlds load with `?seed`, so they use their own state keys and never touch a stream's evolved memory. Nothing in any world's folder was edited. The host adds one fader per station between the world's master and the speakers, installed before the world's scripts run.

## Tested (2026-11-08, headless SwiftShader only)
- All eight worlds rendered in every flown shot at 360 lines. No page errors.
- Crossings: skate → field → tree in capture mode, reload resumes the same world and count, and each outgoing world is removed.
- Audio: the waiting world's fader sits at 0 and the world on air at 1, and control hands over at the crossing.

## Known limits
- **Not tested on a real GPU.** A crossing runs two full worlds at once for about 30 s. If OBS drops frames, lower `?lines`.
- **Dark rectangle in software capture:** a hud-sized dark block appeared in some headless crossings. The world's own framebuffer was clean at that spot, so it looks like a software-compositor artifact. Check it on the first real run.
- The first world takes a few seconds to load, so this breaks the "moving within 1–2 s" rule at startup.
- No mixer or play version yet. Sound was checked by fader level; band balance across a crossing was not recorded.
- Terrain plates end in straight edges, so high angles over land can show them. Dives and climbs start and end in sky to keep them off screen.
