# BIT FIELD 030 — SITTER

A screen test that never ends. One sitter faces a locked-off camera under one soft light. Every 30 seconds a new sitting begins: under a blink, the face moves one step through face space (jaw, chin, nose, cheeks, mouth, folds, brow, lids, skull, neck, age, skin tone, grey, stubble, iris, hair, clothes). Nobody is ever the same person twice, and nobody is ever very different from the person before.

## How it is made
- The head, hair (pulled back and short), brows, lashes, stubble and peach fuzz were built in code with Blender and Python on the CC0 MakeHuman base mesh (hm08). They were rendered offline as Screen Tests 001–009, then exported neutral (`data/export.py`, which writes `data/sitter.bin` and `data/sitter.json`).
- Live, every facial feature is a soft displacement field evaluated in the vertex shaders. Skin, hair, brows, lashes, stubble and eye positions all ride on the same field, so the whole person changes together.
- Performance: blinks with a fast close and slow open, saccades and drift, breathing, postural sway, jaw settle and the occasional swallow. Every change lands under a forced blink, with a 7 s morph.

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
`?info=0 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?lines=N ?ff=H ?sit=SEC ?look=gelatin|bit|silk|phosphor ?lite=0..1` (hair density, for slow machines)
Keys: `I` info · `M` mute · `L` next look

## Test
`python3 -m http.server 8030` in `MZTV/sources`, then `node test.mjs`.
