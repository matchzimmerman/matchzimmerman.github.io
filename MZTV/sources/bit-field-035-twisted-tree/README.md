# MZTV · BIT FIELD 035 · MZ WORLD · TWISTED TREE

An autumn woodland and one contorted, leafless tree in a sunlit clearing, printed in six inks. After *The Day I Found the Beauty of Nature*, a fourth-grade writer's original story: the trees "like big ice cream cones", the sun "like a lemon snowball", the tree "like a giant thick piece of black licorice", and the feeling of being small in a big world and still important. It runs on SRUTHÁN v3's engine: the surface-carved linocut print through OBAS inks, a printed depth of field, the observational crew, the dub engine, and HEADLAND's memory and rupture logic.

**Edition: Study 003 (2026-10-26), MZ.Claude. Visual language approved by MZ.Human on 2026-10-26 and published (PR #20).** Study 002 (MZ.GPT / MZ.Codex, nonfigurative v1.2 pass) is kept as `v2.html` with its walk at `v2-walk.html`. Study 001 is superseded.

**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-035-twisted-tree/
**Walk:** `walk/` (a visitor's camera at a fourth-grader's eye height; separate memory)
**OBS:** Browser Source → the URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (default 720; 420–540 for phones) · `?ff=MIN` · `?hour=H` (08.5–11.5, the held morning) · `?cam=N` (hold one operator) · `?capture=1` (no rAF; drive with `MZ.tick` / `MZ.advance`). `?live` is accepted and ignored: nothing is fetched.
**Keys:** **I** info · **M** mute · **R** a hand on the twisted tree (pushes toward rupture; logged as human intervention)
**Console:** `MZ.force('lemon' | 'hold' | 'birds' | 'river' | 'hush' | 'rupture')` · `MZ.rain(mm)` · `MZ.seekHour(h)` · `MZ.ink(i)` · `MZ.grammar({period, dith, wob, outline, hatch})` · `MZ.look(p, t, fov, focus, aper)` · `MZ.h(x, z)` · `MZ.tree` · `MZ.geo` · `MZ.state` · `MZ.setWx(o)` (hold a reading; `MZ.setWx()` releases it) · `MZ.analyser()`

## Rule broken on purpose
**Rule 1 (a real place with coordinates, live weather).** The school trail, the creek and the tree's location are unverified, and the brief forbids inventing coordinates. So there is no `LAT`/`LON`, the sun is a **simulated held morning** and the weather is **simulated**, and the info box says SIMULATED. When MZ.Human confirms a place, the sun and Open-Meteo weather can be bound to it without touching the print. The terrain is sculpted to suggest the story's route, not surveyed.

## Six-line plan
1. **Place:** a provisional woodland trail from the wood edge, past a dry creek with two footbridges and painted wooden birds at the turns, to a fork; the path continues north and a clearing opens just east of it. No coordinates.
2. **Central thread:** not a figure. The thread is **the light**: a gap in the canopy lets one patch of morning sun through, and as the sun moves the patch walks across the clearing, onto the twisted tree and off it. The tree itself never moves.
3. **Inputs:** the held-morning sun (08:30–11:30 and back over 96 min) sets where the patch lies; wind sets crown sway, leaf fall and **bar length (6.6 − 0.32·wind, 4.0–6.6 s)**; rain held in the ground sets mud, dew and the dry river; **the patch's place relative to the tree sets the bass degree** (on the tree = the centre).
4. **Events:** LEMON SNOWBALL, THE TREE HOLDS, THE WOODEN BIRDS TURN, THE DRY RIVER REMEMBERS, and the hush that leads to rupture.
5. **Memory:** rain store (8 h drain, also while the source is dark), leaf litter depth (36 h) plus up to 60 fallen leaves where they lay, minutes the light has lain on the tree, event conditions, the log, colourway visits.
6. **New rendering idea:** *the light finds the tree.* Every surface is lit by casting it up along the sun to the canopy: the gap prints the lemon patch, the leaves let flecks through, so the focal GLOW is physical rather than painted. And every surface owns its print coordinate: limbs carry along/around coordinates with the circumference snapped to a power-of-two metres (seamless octave lines), the licorice tree's lines wind as a helix over rope ridges, crowns are engraved as rings of a scoop, the clearing is carved in the cover drawing's long diagonal strokes, the floor in wavy litter bands, the trail in ruts.

## World
- **The twisted tree:** a low, fluted, buttressed trunk that kinks as it rises; three crooked leaders from about 2.4 m, one long arm reaching right to about 10.7 m, shorter leaders off the arm, six dead stubs from the knot, crooked twigs, twelve knuckled roots gripping a mossy mound. No leaves. Its bark is the darkest mass in the frame (INK/DEEP); only a gloss running along the twist reaches PAPER, and the gloss strengthens the longer the light has lain on it.
- **The woods:** about 230 trees, tall chestnut trunks with a few short limbs fanning up into one to three big round scoops (the ice-cream cones); about a quarter have turned. A far line of woods closes the horizon.
- **The trail:** packed earth with ruts, a fork west at about 14 m north of the second bridge, verges of longer grass. Two footbridges (planks, posts, rails) over two dry creek beds full of pale stones. Three wooden birds on stakes: an eagle, a bluebird, an eagle.
- **The clearing:** short cut grass, wet with dew after rain, open toward the canopy gap in the south-east. Motes hang in the shaft.

## Life
- **Leaves** fall from the crowns near the clearing and the trail, flutter on the wind and settle as litter that is remembered. The oldest litter makes way for new falls.
- **Four small birds** keep their own errands between the painted birds' heads, the bridge rails and the twisted tree's arm and twigs, and sometimes leave the woods for a while. They chirp where they are, heard through the lens.
- **A plane** crosses high over the woods now and then (the story hears one).
- No figure, no dialogue, no quest. A bird or a falling leaf never fills the lens.

## Memory
`localStorage` key `mzworld-twisted-tree-v3` (`-s<seed>` with `?seed`, `-walk` for the walk layer). Saved every 60 s and on unload; `?fresh=1` clears it. The rain store and litter drain by the time the source was dark. Each event stores the morning hour, the wind and the rain held in the ground, and recurs more readily under similar ones; repeats habituate. Light on the tree raises the weight of the lemon event.

## Cameras (observational)
Eleven operators. The ones standing on the ground hold a fourth-grader's eye height (1.3 m). The mixer cuts every 9–19 s on the 16th note, weighted by where the light lies, falling leaves near the tree and the current event; operators are framed before the cut and close lenses rack focus.

| # | Operator | What it holds |
|---|---|---|
| 0 | THE CLEARING | the key frame: from beside the trail, the tree in its clearing, the lemon grass in front |
| 1 | ROOTS | low by the mound, roots and trunk base, racking to the woods |
| 2 | THE ARM | from the south, the long arm against the sky |
| 3 | LICORICE | close on the twist of the trunk, racking from bark to woods |
| 4 | THE TRAIL | from the fork, the trail on, the clearing beside it |
| 5 | DRY RIVER | low in the first creek bed under the first bridge |
| 6 | WOODEN BIRD | close on one of the painted birds |
| 7 | ICE-CREAM CONES | under the densest crowns near the clearing, looking up |
| 8 | SECOND BRIDGE | the second bridge from the trail |
| 9 | FALLING LEAF | follows a leaf falling near the tree |
| 10 | SMALL IN A BIG WORLD | long lens from the west: the tree small through the trunks |

## The uncanny
| Event | Conditions | What happens |
|---|---|---|
| LEMON SNOWBALL | the light's patch lies within 3.6 m of the tree, cloud < 72% | the gap's edge sharpens and the patch brightens; the sun swells into a packed, granular snowball; ♭II chord and a reverse swell |
| THE TREE HOLDS | wind > 3.2 m/s, no heavy rain | within about 14 m of the tree the grass and the crowns stop and falling leaves hang in the air, while the woods beyond keep moving; a high fifth in the room, a sub that swells with a breath |
| THE WOODEN BIRDS TURN | wind < 6.5 m/s, dry | the painted birds turn on their stakes toward the clearing, one after another, and back; knocks |
| THE DRY RIVER REMEMBERS | the ground still holds > 1.1 mm of rain, not raining | glints of sky run down the dry beds; the absent water is heard under the bridges |
| hush (→ rupture) | tension reaches 1 | everything in the woods stops; the band drops out |

Global gap 14–34 min; each event logs its reason (`why`).

## Rupture and colourways
Tension builds with stability (epochs of 50–95 min) and +0.07 per event. At 1 the woods hold still, then the print re-inks (new colourway weighted to the least visited, crossfaded over 45 s), a new line grammar (`period`, `dith`, `wob`, `outline`, `hatch`) and a new harmonic centre.

| # | Colourway | INK · DEEP · SEA · HOT · GLOW · PAPER | Note |
|---|---|---|---|
| 0 | **AUTUMN CLEARING** (home) | #1f1a33 · #2d4a72 · #4a9a8c · #cf5a30 · #f7d93f · #f3ecd2 | new |
| 1 | LEMON SNOWBALL | #2b2340 · #5d4f86 · #88bf9c · #ec7a44 · #fbe55a · #fbf6e4 | new, high key, lilac shade |
| 2 | BLACK LICORICE | #140f19 · #3b2d4c · #4e8088 · #b9472c · #e9b94a · #ebdfc4 | new, low key |
| 3 | SIGNAL FLARE | canonical HEADLAND values | shared |
| 4 | PISTACHIO NIGHT | canonical | shared |
| 5 | ULTRAMARINE | canonical | shared |
| 6 | LICHEN | canonical | shared |
| 7 | ATLANTIC PRINT | canonical | shared |

## Relational colour and print composition
**Visual north star (provenance):** the author's colored-pencil cover (large bulbous canopies on tall chestnut trunks, a pale grassy floor with long diagonal strokes, one central dark trunk with sweeping bark lines) and the photograph of the real tree (low contorted trunk and root cluster, irregular vertical limbs, one long asymmetric arm, mossy mound). Both were supplied by MZ.Human to MZ.GPT and are **not** in this repository and were not seen by MZ.Claude for this study: Study 003 works from the brief's written descriptions. Neither is used as a texture. **The rendered frames still need to be compared with the originals.**

**Key frame (camera 0, THE CLEARING):** focal subject the twisted tree, the strongest dark/light boundary (licorice INK/DEEP against PAPER sky and lemon grass); dominant masses the cool crowns (INK/DEEP/SEA, engraved rings) closing the frame; warm counterpoint in the turned crowns (HOT/GLOW) and the russet litter bands of the floor (INK/DEEP/HOT); the lemon patch (GLOW) as a restrained accent on the grass; PAPER sky and cloud as the quiet space.

**Material map (dark · mid · light):** sky DEEP·SEA·PAPER · sun HOT·GLOW·PAPER · crowns INK·DEEP·SEA · turned crowns DEEP·HOT·GLOW · stones INK·DEEP·PAPER · moss INK·SEA·GLOW · trunks INK·DEEP·HOT · licorice INK·DEEP·PAPER (shade compressed so only the gloss reaches PAPER) · timber INK·HOT·PAPER · painted birds DEEP·HOT·GLOW (bluebird uses the crown row) · floor INK·DEEP·HOT · trail DEEP·HOT·PAPER · cloud SEA·PAPER·PAPER · grass INK·SEA·GLOW · leaves INK·HOT·GLOW. Ground and canopy never share a mapping.

**Ink coverage, AUTUMN CLEARING, 1280×720, info box off, 10:00, seed 3 (nearest ink, % of pixels):**

| Frame | INK | DEEP | SEA | HOT | GLOW | PAPER |
|---|---|---|---|---|---|---|
| 0 THE CLEARING | 18.4 | 20.1 | 21.3 | 6.3 | 9.1 | 24.8 |
| 1 ROOTS (patch in frame) | 17.0 | 25.3 | 21.5 | 4.5 | 26.2 | 5.6 |
| 2 THE ARM | 11.8 | 17.7 | 9.5 | 6.4 | 4.5 | 50.1 |
| 3 LICORICE | 44.3 | 42.5 | 3.4 | 2.2 | 0.8 | 6.8 |
| 4 THE TRAIL | 19.6 | 31.3 | 14.1 | 12.8 | 4.1 | 18.0 |
| 5 DRY RIVER | 29.4 | 31.0 | 17.9 | 14.7 | 0.7 | 6.3 |
| 7 ICE-CREAM CONES | 22.7 | 23.0 | 25.0 | 4.2 | 1.6 | 23.6 |
| 10 SMALL IN A BIG WORLD | 19.2 | 33.6 | 11.2 | 11.7 | 3.9 | 20.4 |
| 0 during LEMON SNOWBALL | 18.7 | 18.7 | 20.6 | 5.9 | 11.3 | 24.9 |

GLOW stays a focal accent (1–11% in most frames, high only when the lens is in the patch); HOT does not disappear. A palette contact sheet of all eight colourways on cameras 0, 2 and 1 was rendered and reviewed; all eight keep distinct material separation.

## Sound
D phrygian family; the centre moves at rupture. The live lens is the microphone: wind in the crowns from six placed sources, chirps from the birds where they are, a landing leaf near the lens as a plink, the plane as a low far wash, the absent water under the bridges during the river event. Bar length from the wind, bass degree from where the light lies. Shared bed: drone, pad every 4 bars, Euclidean kick, rain bed, dub echo with a unity-gain tanh loop whose feedback follows humidity, convolution room, quiet crickets when warm and still. Master chain unchanged: HP 26 Hz → tanh → high shelf −10 dB @ 2 kHz → LP 6.8 kHz → glue compressor.

## Hardening
SRUTHÁN's audio hardening, unchanged: one AudioContext, AudioWorklet noise (data: URL, blob fallback, then buffer), every voice enveloped to zero and disconnected on end, lookahead scheduler that skips after a stall, a 1 s watchdog (resume, rebuild on closed context, stalled clock, NaN or 20 s of silence, 3 h refresh). Non-finite weather or tension heals from defaults; bird positions heal to a perch; WebGL context loss is handled.

## Tested (2026-10-26, headless Chromium 153 + SwiftShader, Playwright)
- All 11 operators render at 1280×720 with no console or page errors (fonts and weather fetches are blocked in the harness and 404).
- Each event forced and rendered: lemon, hold, birds, river, hush → rupture; rupture re-inks and logs.
- 6 simulated hours (`MZ.advance(21600)`): no NaN; 6 ruptures (about hourly); 16 events (about every 22 min: lemon 4, birds 8, hold 3, river 1, hush 6); 2,221 leaves fallen and still falling at the end.
- Save and reload at phone size (390×844, `?lines=480`): resumes the same epoch and colourway, logs "the woods resumed".
- Audio, 15 s recorded from the master during a lemon event: RMS −14.9 dBFS, steady (−14.2 to −16.0 per second), peak 0.40. Band levels relative to 60–120 Hz: 20–60 −9.6 dB · 120–500 −10.7 · 500–2k −29.1 · **2–5 kHz −60.5** · **5–12 kHz −78.0**. Low end loudest, as HEADLAND; the top is a little quieter than HEADLAND's targets.
- Walk layer: loads the world in an iframe, walks with WASD, writes only `mzworld-twisted-tree-v3-walk`.
- Side-by-side frames with HEADLAND (pier, cliff) and SRUTHÁN (field, under the tree) were rendered and compared.

## Known limits
- **Approved 2026-10-26** by MZ.Human on the rendered frames (key frame, side-by-side with HEADLAND/SRUTHÁN, all operators, all colourways). A check against the author's drawing and photograph, which MZ.Claude has not seen, is still worth doing with the author.
- GPU load is not measured on real hardware (SwiftShader only). It draws about 230 trees, a 0.25 m ground grid near the clearing and about 18,000 grass blades; drop to `?lines=540` or `420` on phones.
- The clearing grass prints busier than the reference worlds' quiet surfaces when the lens is close and inside the lemon patch.
- The canopy-gap light is cast at one height (8 m), so the lit patch is an approximation, not a ray-traced shadow.
- Place, weather and sun are simulated (see the rule broken on purpose).
- The walk layer has no collision with trunks.
