# MZTV · BIT FIELD 035 · MZ WORLD · TWISTED TREE

**Prototype status:** public test candidate / **not yet visually validated on a real WebGL2 device.** Developed in MZ.GPT from the original child's fourth-grade story *The Day I Found the Beauty of Nature*, the hand-drawn cover, and a tree reference photograph supplied privately by MZ.Human. **Do not upload the source photographs or child's personal details to the public repo.**

**Live page after merge and Pages success:** https://matchzimmerman.com/MZTV/sources/bit-field-035-twisted-tree/

**Separate walk view:** https://matchzimmerman.com/MZTV/sources/bit-field-035-twisted-tree/walk.html

The original artist's themes and metaphors form the design; her identity and school/teacher aren't public in this candidate. Any additional use or distribution of her story, artwork and photographs remains subject to parent/author approval.

## World and artistic constraints

- **Place:** simulated woodland/trail geography inspired by a fall school hike. **No validated coordinates, school identification, accurate trail map, surveyed creek or botanically identified tree**. The scene should not be represented as a mapped reconstruction.
- **Autonomous subject:** one small hiker who follows the trail, pauses at a leafless asymmetrical twisted tree, then walks back. Symbolic figure; no real child likeness.
- **Sensory landmarks:** two creek footbridges, dried creek bed, damp grass, bird-painted wooden trail markers, fork, falling leaves, bulbous crown silhouettes, one central clearing/tree with the distinctive long right-reaching branch.
- **Score / observation:** simulated autumn-morning light and wind, recorded hiker pauses and visits, eight observational cameras and rare story-derived uncanny events (lemon sun, dry creek, bird markers, tree hold).
- **Display:** six chromatic OBAS inks, WebGL2 printed data target, nearest-filtered resolutions, world-space tree/grass/bark engravings and nearest print pass. Artwork is geometry and code only, without generated image textures or stock assets.
- **Memory:** localStorage `mzworld-twisted-tree-v1` with walk-mode separate key and optional seed suffix. No analytics or child tracking.
- **Sound:** browser gesture initiates a small synthetic ambient study. This is not verified to the HEADLAND master / complete sonic architecture, so it is **not a broadcast-qualified substitute**.
- **Autonomous experience** has no player quests, narration or scoring. The distinct `walk.html` supplies optional embodied exploration, not a modification to broadcast system state.

## Controls

- **Cameras:** AUTO vs HELD; THE TREE and THE TRAIL select static named operators; drag scene to adjust gaze. WALK THROUGH WORLD launches separate `walk.html`.
- **Walk mode:** drag to look; WASD/arrows, or phone touch-pad arrows. GO TO TREE and TRAIL START quick movements are orientation/testing conveniences.
- **SOUND:** toggle browser audio (requires deliberate user gesture).
- **STORY:** source-author selected phrases displayed without identifying details. INFO shows simulated values/memory.
- **Query:** `?cam=N` operator hold, `?walk=1`, `?lines=420` or 540 fallback, `?seed=N`, `?fresh=1`, `?ff=MIN`, `?capture=1`. Public `window.MZ` API includes `tick`, `advance`, `force`, `cam`, `look`, `ink`, `state`, `setWx`, `analyser`, `h`, `grammar`, `keeper`, `geo`; some accessors remain prototype placeholders.
- **Runtime error diagnostics:** badge updates during startup; visible full-screen error explains WebGL2/context/shader failures instead of leaving a blank scene. In ChatGPT's sandboxed HTML attachment viewer, scripts or WebGL2 may be blocked: **test by directly opening the public HTTPS URL in Safari or Chrome**.

## Mobile / orientation changes

Viewport uses `100dvh`, safe-area insets and responsive portrait/landscape control grids, with CSS canvas dimensions filling viewport. The actual canvas backing resolution is recomputed from `getBoundingClientRect()`; resize, visual viewport resize and orientation change trigger reallocation; quality defaults to lower resolution on phones.

## Tests (2026-10-25)

- PASS: JavaScript parsed by Node.js.
- PASS: WebGL API mocked for initialization, force/rupture and camera controls; runtime threw no JavaScript exceptions in mock.
- PASS: HTML/CSS layouts under automated Chromium at 390 × 844 portrait, 844 × 390 landscape and 1440 × 900 desktop. All tested control bounds inside viewport; no document scroll overflow. **These tests mocked WebGL calls, so they did not validate pixels or GPU performance.**
- BLOCKED: Render/inspect true GPU frames, verify GLSL compilation on iOS Safari, compare visuals side by side against HEADLAND/SRUTHÁN, test full six-hour simulation, audio spectrum, all cameras/events/rupture under an actual WebGL renderer, verify outdoor weather as place remains unregistered. Chromium available in this environment reports no WebGL2 hardware/software context.
- Human acceptance: open the hosted page on a mobile phone. Confirm actual scene visibility, a recognizable asymmetrical tree, functional portrait/landscape controls, walk movements and audio. Report a screenshot and any startup-overlay error message. Do not mark production quality before embodied human review.

## Canonical standard

Private HEADLAND standard v1.1: `matchzimmerman/haril-studio/docs/standards/mz-world-headland.md`, not to be copied into this repo. HEADLAND and SRUTHÁN are approved look/behavior references; CROSSING and KAATERSKILL FALLS are rejected. This proof candidate **does not yet pass every rule**: geographic registration and local weather astronomy, full sonic architecture/QA, persistence of event recurrences, full dynamic printed depth and production load verification are future gates.

**Do not treat this experimental test URL as a validated MZTV broadcast source.** No other world's sources were changed.
