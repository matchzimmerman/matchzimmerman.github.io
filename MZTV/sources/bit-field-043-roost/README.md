# MZTV · BIT FIELD 043 · MZ WORLD · ROOST

Twelve horned creatures keep their own errands around one tree, cut from a black block in two inks. Built from Match Zimmerman's linocut of the same creatures: the tree, every limb and every creature's home are placed from their pixel in the print (1 px = 1 cm), so when everyone is home, the camera THE BLOCK is looking at the print.

**Status:** on the branch `mz-world/roost-043`, not published to `main`. Awaiting MZ.Human's review.
**Live (once merged):** https://matchzimmerman.com/MZTV/sources/bit-field-043-roost/
**OBS:** Browser Source → that URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (default 1080; 420–720 for phones or weak GPUs) · `?ff=MIN` · `?hour=H` (08.5–11.5) · `?cam=N` · `?capture=1`
**Keys:** **I** info · **M** mute · **R** a hand on the block (pushes toward rupture; logged as human intervention)
**Console:** `MZ.force('faces' | 'trade' | 'hold' | 'egg' | 'hush' | 'rupture')` · `MZ.home()` · `MZ.crack(v)` · `MZ.rain(mm)` · `MZ.seekHour(h)` · `MZ.ink(i)` · `MZ.grammar({period, len, wob, outline, width})` · `MZ.cam(i)` · `MZ.look(p, t, fov)` · `MZ.tick` · `MZ.advance` · `MZ.state` · `MZ.setWx(o)` · `MZ.analyser()` · `MZ.h(x, z)`

## Relation to TWISTED TREE
A separate world. It reuses the clearing's ground plan (trail, dry creek beds, canopy-gap light) and parts of BIT FIELD 035's engine and audio hardening. It uses none of *The Day I Found the Beauty of Nature*: no story language, no credit to it, and BIT FIELD 035 is untouched. Its brief says that world stays gentle, so these creatures stay out of it.

## The hybrid test (open question for MZ.Human)
Two ways of making a creature run side by side so they can be judged in the world.
- **Nine puppets** (ANTLER, BANDAGE, SHADES, BAT, GRIFFIN, GRILLE, CYCLOPS, FLAME, SHIELD), plus the five chicks, the nest and the egg. Cut from the print into jointed parts (`creatures.png`: red = marks, green = silhouette). They are flat, always turned to the lens, and the marks are the print's own.
- **Three built in 3D** (MASK, TARGET, BRAIN). Modelled in code from the print: patterns drawn procedurally on surfaces, feathers as separate blades, shading done by cutting into the white. Seen from any angle; the drawing is an interpretation.

## Rules broken on purpose
- **Rule 1 (real place):** no coordinates. The sun is a held morning, the weather simulated, and the info box says SIMULATED.
- **Rule 2/3 (six inks):** two inks. The block and what shows where it is cut. Dither and mid-tones are gone. Each colourway is one ink on one paper.
- **Rule 2 (no image assets):** the puppets are the artist's own print, cut up. No generated images or stock.
- **Rule 9 (bass, kick):** no kick and no walking bass, after OUTBUILDING. One held hum on the centre, and the wind.

## World
- **Time and weather:** held morning (08:30–11:30 and back over 96 min), simulated wind, cloud, rain, humidity. Wind sets the limbs and the bar length (6.6 − 0.32·wind, 4.0–6.6 s). Rain is held in the ground (8 h drain).
- **Tree:** a fluted trunk about 14 m tall with six limbs following the print. Woods: about 185 bare trees going back into the block.
- **Light:** a canopy gap throws one patch across the clearing. Where it lies, the ground is cut nearly clean. Which side of the tree it's on leans the calls to a scale degree.

## Life
Perchers move between their home and points along the limbs and build up favourite limbs. On arrival at an occupied perch: a shove, a shared limb, or backing off (feuds are remembered and shoves get likelier). GRILLE and BRAIN circle the tree. CYCLOPS, FLAME and SHIELD walk the clearing. TARGET carries a grub to the nest and the chicks beg.

## Memory
`localStorage` key `mzworld-roost-v1` (`-s<seed>` with `?seed`), saved every 60 s and on unload. The egg's crack only grows (rain and light bring its events). At 100% a chick is added to the ground for good. Also favourite limbs, feuds, event conditions, colourway visits, the log.

## Cameras
Eleven operators, cut every 9–19 s on the 16th note: THE BLOCK · THE NEST · MASK · TARGET · ROOTS · UP THE TRUNK · THE EGG · THE WALKERS · A FLYER · THE EAST SIDE · FROM THE WOODS.

## The uncanny
| Event | Conditions | What happens |
|---|---|---|
| every face turned to the lens | wind < 7 m/s | flyers come home; heads straighten and turn; ♭II chord and reverse swell |
| the heads traded bodies | tension > 22%, nobody in the air | each puppet takes the head three along, then gives it back; knocks |
| the tree held still | wind > 3 m/s | the limbs stop within 15 m while the woods go on; high fifth, sub with a breath |
| the egg moved | ground holds > 0.4 mm, or the light within 5 m | the crack grows, the egg rocks, knocks |
| hush → rupture | tension reaches 1 | everything stops; new ink, new gouge grammar, new centre |

## Rupture and colourways
BLACK BLOCK (home) · OX BLOOD · BLUE BLOCK · CUT FLAME · LIMEWASH · YOLK · SHOCK PINK · BONE BLOCK (inverted). Grammar: stroke spacing, length, wobble, width, contour on/off.

## Print
Every white mark is wood taken away. Each surface computes tapered gouge strokes in its own coordinates (with the grain on wood, long diagonals on the ground), and tone is how much wood comes out. A print pass adds a carver's contour where the tree parts from the sky, and a little chatter.

## Sound
D phrygian family. Wind placed by the lens, a low ground bed, rain, one held hum with two faint overtones, and one tuned FM call per creature, heard through the lens. Peeps at feeding. Dub echo with feedback from humidity, convolution room. Master chain unchanged.

## Tested (2026-11-08, headless Chromium + SwiftShader, Playwright)
- All 11 cameras and every forced event rendered at 1280×720 with no console or page errors.
- 6 simulated hours: no NaN; 14 non-hush events (about every 26 min), 5 ruptures (about every 72 min), 1 hatching.
- Save and reload resumes epoch, crack and log.
- Audio, 16 s at wind 5 m/s, relative to 60–120 Hz: 20–60 −15.4 dB · 120–500 −13.3 · 500–2k −20.7 · 2–5k −37.3 · 5–12k −41.2. RMS −19.8 dBFS, peak 0.24. **The top end is brighter than HEADLAND's target** (2–5 kHz about −50); calls are the likely cause.
- Key frame checked against the linocut. **Not compared side by side with HEADLAND/SRUTHÁN:** two inks is a deliberate departure.

## Known limits
- GPU load not measured on real hardware. `?lines=720` if 1080 is heavy.
- Puppets are flat: from THE EAST SIDE they still face the lens. That is part of what the hybrid is testing.
- Parts of the 3D heads and feather layouts are approximations of the print.
- The woods meet the dark ground at a hard horizon in wide shots.
- `creatures.png` is about 1.8 MB, loaded alongside the page.
