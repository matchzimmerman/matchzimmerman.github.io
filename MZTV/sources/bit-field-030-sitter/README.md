# BIT FIELD 030 — SITTER

A screen test that never ends. One sitter faces a locked-off camera under one soft light. Every 30 seconds a new sitting begins: under a blink, the face moves one step through face space (jaw, chin, nose, cheeks, mouth, folds, brow, lids, skull, neck, age, skin tone, grey, stubble, iris, hair, clothes). Nobody is ever the same person twice, and nobody is ever very different from the person before.

## How it is made
- The head, hair (pulled back and short), brows, lashes, stubble and peach fuzz were built in code with Blender and Python on the CC0 MakeHuman base mesh (hm08). They were rendered offline as Screen Tests 001–009, then exported neutral (`data/export.py`, which writes `data/sitter.bin` and `data/sitter.json`).
- Live, every facial feature is a soft displacement field evaluated in the vertex shaders. Skin, hair, brows, lashes, stubble and eye positions all ride on the same field, so the whole person changes together.
- Performance: blinks with a fast close and slow open, saccades and drift, breathing, postural sway, jaw settle and the occasional swallow. Every change lands under a forced blink, with a 7 s morph.

## Four lenses, one scanner (default layout)
The feed is a 2×2 grid. **CAM 1 · BOLEX** (top left) holds the frontal screen test. **CAM 2 and CAM 3** are drones flying coverage: eyes, one eye, mouth, profiles, three-quarters, behind, overhead, low, orbit, and a wide that shows the crew. **CAM 4 · SCANNER** (bottom right) works from analysis positions, and its tile shows the scan layer: a phosphor view under a triangulated landmark mesh (about 115 points), heat-coloured by how far each region has been pushed, with a sweep line and measurement lines.

The drones route round the sitter's head and shoulders: when the straight line to a mark is blocked they arc over and round it, and they slide along the surface instead of bumping into it. The director (MZCAM, `../../lib/mzcam.js`) still runs: it cuts only inside a blink and comes home to the Bolex for every new sitter. The on-air tile is framed. Drones appear in each other's shots, and the studio plan sits top right. `V` switches to a single program feed (`?layout=single`), where the bay shows a monitor per drone.

## The evolution loop
Every sitting can be described using the CAIR lens (COLLECT · ANALYZE · INTERPRET · RETURN). The existing face-construction/morph step remains part of the implementation, not the first term of CAIR:
- **C · COLLECT**: capture the sitter's current geometry, landmark and genome state after the blink-driven step for the scanner and critic.
- **A · ANALYZE**: the scanner measures the face it now has: eye spacing against skull, facial thirds, brow-to-lid gap, mouth width, jaw, symmetry, extreme features, and age against grey hair against stubble.
- **I · INTERPRET**: measurements become critiques, for example "brows sitting on the lids: brow hair reads as hair on the eyelids · distracting".
- **R · RETURN**: a plan returned to the next pass, for example "return: raise brows +0.45". The next sitting applies it and logs "applied".

The critic pulls toward a plausible face while the journey keeps moving the goal. When the two disagree, the log says so. There are no model calls: every line is computed from the geometry and the genome, and the log window shows the last passes.

## The journey and the drafts
Every 2.2–4.6 hours a new person is chosen (skin tone, age, grey, stubble, hair, clothes, and every feature across the full range), and the sitter drifts toward them one sitting at a time. That makes roughly twelve people across 48 hours, each becoming the next: a very slow morph.

Each new person is drawn with more detail than the last. Rendering resolution rises, hair fills in, pores, fine lines and peach fuzz strengthen, and the face itself is learned coarse to fine. Early drafts only get skull, jaw and face length; cheekbones, nose and lips come next; nostrils, lids, folds and mouth corners come last. Age also writes itself into the face through folds, jowls, under-eyes and lids.

## Over 48 hours
- The walk widens and the pull back to the middle weakens.
- h2: **returns**, a drift back toward a remembered sitter.
- h6: **asymmetry**, where the two halves of the face begin to drift apart.
- h10: **composites** of 2–7 past sitters.
- h16: **quirks**: metronome blinks, stillness, or a stare with no blinks.
- h20: **caricatures**, where one feature is pushed far.
- h30: **splits**, where the halves mirror against each other.
- Looks change by era (2.5–5.5 h each, 20 s dissolve): silver gelatin, 1-bit ordered dither, silkscreen (flat inks with an off-register key), phosphor.
- Memory: an archive of past faces (dense recent, sparse old). State saves to localStorage every 60 s, so OBS reloads resume.

## Sound
A dark room, a projector motor with a 24 fps sprocket flutter, and the sitter's breath. The sitter's note, a root and a fifth, glides to a new pitch with each face and darkens with asymmetry and age. A felt thump into a filtered echo marks each new sitting. Hardened per MZTV protocol: worklet noise, a watchdog, and graph rebuilds.

## Params and keys
`?info=0 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?lines=N ?ff=H ?sit=SEC ?look=gelatin|bit|silk|phosphor ?lite=0..1 ?bay=0 ?crew=0 ?layout=single` (`lite` sets hair density, for slow machines)
Keys: `I` info and log · `M` mute · `L` next look · `C` camera bay · `V` grid or single feed

## Test
`python3 -m http.server 8031` at the repo root, then `node test.mjs`.
