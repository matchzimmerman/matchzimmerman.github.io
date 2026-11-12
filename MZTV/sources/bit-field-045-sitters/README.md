# BIT FIELD 045 — SITTERS

A shelf of screen tests. A new sitter is drawn every 15 minutes in a locked-off black-and-white screen test. When the portrait is done, it is printed in colour and placed in a white 3×3 cube shelf, where it floats and turns on its own. When the shelf is full, the next sitter starts a new one, and the full shelf is archived in miniature along the top of the screen. The whole progression stays in view.

Built on BIT FIELD 030 · SITTER. It uses the same code-built head, hair, brows, lashes, stubble and clothes (Blender and Python on the CC0 MakeHuman base mesh), loaded from `../bit-field-030-sitter/data/`, so nothing is duplicated. Every facial feature is a live field of soft displacements in the shaders.

## The screen
- **Top strip · the archive.** Every full shelf is kept as a small shelf with a printed thumbnail of each sitter, oldest on the left. When a shelf fills, it shrinks into the strip as the next shelf begins. If the strip runs out of room, the older shelves are counted as "+N EARLIER".
- **Left · the studio.** One sitter faces the camera under one soft light, in the look of the current era (silver gelatin, 1-bit, silkscreen or phosphor; the look changes with every shelf). The scanner's landmark mesh, the B · A · I · R phase, the detail level and the clean run sit over it, with a progress bar to the shelf.
- **Right · the shelf.** A white cube shelf, open at the front, printed in colour. Each sitter floats in its cube, arrives facing you, then spins up slowly and keeps turning, bobbing and blinking. Its colours light its own box: the sweater and hair tint the walls, the skin lights whichever wall the face is turned toward, and a soft contact shadow sits on the box floor. A label on the panel under each cube gives the sitter number and the colour they wear. The next empty cube blinks "NEXT".

## A portrait (15 minutes, 30 sittings of 30 s)
- A sitter sits down as a rough draft (a neutral face with a little noise, or from shelf 3 on, a composite of earlier sitters). It drifts toward a person of its own. Every change lands under a blink, with a 7 s morph.
- Each sitting runs the evolution loop from 030: **B · BUILD** (the step), **A · ANALYZE** (eye spacing, facial thirds, brow-to-lid gap, mouth, jaw, symmetry, extremes, age against grey against stubble), **I · INTERPRET** (critiques, each with a "miss %": how far past its threshold it lands), and **R · RETURN** (the two worst faults become the plan for the next sitting).
- **Detail is earned.** Detail levels (10% to 100%, coarse form first) become available as the portrait goes on, and all of them are on offer by 60% of the way. A level is only drawn after a clean sitting (no fault above threshold); from 50% detail on, it takes two in a row. Any fault resets the run. A sitter that never gets clean enough is placed unfinished, and its label shows the detail it reached.
- The last sitting holds still. At the next boundary, the sitter is placed.

## Memory and change over hours
- Every sitter is kept (genome, detail, colour, parents), and every full shelf is kept too.
- Shelf number unlocks new behaviour: **asymmetry** and **quirks** of the performance (stare, metronome blinks, stillness) from shelf 2; **lineage** from shelf 3 (a new sitter descends from 2–3 earlier sitters, so families form across shelves, and the info box names the parents); **caricature** from shelf 4 (one feature pushed to an extreme); **split** faces from shelf 6 (the halves disagree). The walk widens with every shelf.
- No loop and no reset: the archive only grows.

## Sound
The room from 030 (dark air, projector flutter, mains hum, breath, a drone from the studio sitter's note) plus the shelf: one quiet voice per filled cube, from its sitter's note (octave by row, panned by column), which swells as that face turns toward you. Each sitting boundary is a felt thump into a saturated, filtered echo. A placement adds a chime from the placed sitter's note. Audio is hardened as in 030: continuous synthesis, enveloped one-shots, a watchdog that resumes, rebuilds and recreates the context, and a periodic graph refresh.

## Params and keys
`?info=0` hide overlays · `?fresh=1` restart · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (internal lines, default 360 → 640×360, scaled ×3 at 1080p) · `?ff=H` fast-forward hours · `?sit=SEC` sitting length · `?portrait=MIN` minutes per sitter (default 15) · `?look=gelatin|bit|silk|phosphor` lock the studio look · `?lite=N` hair density 0–1 for slower machines · `?warm=0` start with an empty shelf instead of the pre-warm (two sitters placed, a third half drawn).

Keys: `I` info · `M` mute · `L` next look.

State persists to localStorage (`mztv-bf045-sitters-v1`) every 60 s and on unload, so an OBS reload resumes. If the frame rate drops, the shelf (all slow motion) is redrawn every 2nd or 3rd frame while the studio stays at full rate.

## Test
`python3 -m http.server 8045` at the repo root, then `node test.mjs` (Playwright, SwiftShader). It takes screenshots at 1 s, 3 s and 8 s, forces a placement, fills a shelf, archives it, changes the look and poisons the genome with NaN, which regrows from memory. `MZ.force('sit' | 'place' | 'fill' | 'portrait' | 'look' | 'nan')` is available in the console.
