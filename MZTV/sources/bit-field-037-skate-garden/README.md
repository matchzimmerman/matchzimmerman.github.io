# MZTV · BIT FIELD 037 · MZ WORLD · SKATE GARDEN

A painted garden lane after the paintings of **Bryson Iacoboni**: a grey road between a high hedge full of red poppies and pink stalks and a low wall whose cap is a ledge, a pink funbox, a manual pad, a crosswalk, a peach house with a porch, lamps, round-crowned trees in the gardens. One skater keeps his own errands on it. It runs on TWISTED TREE's engine (SRUTHÁN v3's surface-carved linocut print through OBAS inks, a printed depth of field, the dub engine, HEADLAND's memory and rupture), and it is filmed by an **MZCAM** drone crew (`../../lib/mzcam.js`, the crew from 48 PLANT and TRACKSIDE) instead of fixed operators.

**Edition: Study 003 (2026-10-30), MZ.Claude. Three looks, switchable live with the V1 / V2 / V3 / V4 buttons (top left, tappable on a phone), keys **1 2 3 4** or **P**, or `?v=N`. The choice is remembered in this browser (`mzworld-skate-garden-style`), never in the world's memory. Default V4. Awaiting MZ.Human's review, and Bryson's.**

| Look | What it is |
|---|---|
| **V1 · LINOCUT** | the house six-ink linocut (HEADLAND / SRUTHÁN print), with oil-stick dabs and the teal figure contour |
| **V2 · PAINT · SCREEN STROKES** | Study 002 below: strokes laid on the screen, re-laid five times a second. Kept for comparison. MZ.Human: the stop-motion is distracting, and strokes bleeding across edges flatten the space |
| **V3 · PAINT · ON THE OBJECTS** | Study 003: the paint is on the objects, and the sloppy edges are structure; one brush for everything |
| **V4 · PAINT · HIS BRUSHES** | Study 004 (default): V3 with brushes after Bryson's paintings (below) |

## V3 · paint on the objects (Study 003)
Imagine a three-dimensional painting: he painted the house as an object.
- **Strokes live on each surface**, in that surface's own coordinates (the same frame the linocut carves its lines in): rows of strokes laid along the surface's direction (the road along its length, walls diagonally, limbs along the bone, crowns round their form, the sky across), each stroke one tone, with ragged sides, bristle streaks and dry-brush tails that show the primed canvas. Stroke size steps in octaves of distance, so a stroke stays about 12 px on screen and still things keep still paint. **Nothing swims, nothing re-lays.**
- **No bleeding between objects.** Each pixel takes its own object's mixed paint; foreground and background stay separate, so the space reads. Out of focus is a real blur of the painted colour, not bigger strokes.
- **Sloppy edges are geometry.** Every built thing (house walls, roofs, windows, doors, porch, posts, the wall and its ledge, the curb, the pad, lamps) carries a rim of paint in the plane of each face that runs past its edge, ragged and brushed, its reach scaled to the object (about 4 cm on a window frame, up to 32 cm on a roof). It belongs to the object, so it is the same from every drone. Roofs are now two painted slabs and gable ends instead of a prism.
- Figures get flatter paint and keep the wobbly teal contour; the contour no longer flickers.


### V4 · his brushes (Study 004, 2026-10-30)
Nothing of Bryson Iacoboni's work could be found online, so the brushes are drawn from the twelve paintings MZ.Human shared:
- **Each material has its own brush** (`uBW` width, `uBL` length, in the shader): broad flat bands for the sky and grass, long pulls along the road, upright flame strokes in the hedge (it no longer follows the clumps' curves), short strokes on figures. Within a row, strokes vary in width.
- **The background is painted with a bigger brush**: strokes widen by up to 80% from 14 m to 70 m away, so far things read as broad wet-into-wet blobs and the figures stay crisp.
- **Accents off the palette** (`PACC`): a share of strokes take another paint, per material: orange and pink flicks in the hedge and grass, lilac and the odd red line in the road's grey, rose in skin, lilac shade in the white shirt, maroon in the black.
- **Underpainting shows between strokes**, an earlier colour rather than empty canvas: warm red-orange under the hedge and grass, pink under the road, teal under the pink house and the white shirt. Dry tails still show the primer.
- **The contour is drawn after the paint, off the fill**: misregistered by about 2 px, wobbly, broken, teal (black now and then on the darkest figures).
- **A canvas margin**: raw primer at the frame's edge, ragged where the paint stops.

## V2 · painted in screen strokes (Study 002)
At MZ.Human's request the world is no longer printed in the usual six-ink linocut. Each frame is **laid down as brush strokes**, after Bryson Iacoboni's gestural paint:
- The scene still renders to the data target, but in paint mode each fragment stores its **surface's stroke direction on screen** (the road along its length, the grass across, crowns round their form, limbs along the bone, the sky across the view) instead of a carved line.
- An edge pass marks where the picture changes. The paint pass then lays three layers of strokes on jittered grids: **big strokes everywhere, medium and small strokes only where the picture changes** (edges, figures, flowers), so flat areas stay broad and the figures get worked.
- Each stroke is one colour, **mixed** from its material's dark / mid / light paints at the shade under its centre and softly posterised, as if mixed on a palette. Unlike the linocut, paint can mix: the road is a lavender grey, the sky a pale cream with a pink breath, the house peach (the `PMAT` table, computed from the colourway's six paints).
- Strokes have ragged bristle edges, streaked bristle texture, **dry-brush tails that show the primed canvas**, and an occasional stray colour off the palette.
- Figures get a **wobbly, broken teal contour**; built things get loose dark lines. Out of focus, only the big strokes are laid, so the depth of field reads as broader painting.
- The strokes **re-lay five times a second** (and hold still in the hush), like a painting made frame by frame.
- Rupture still re-inks: a new colourway changes all the paints. Other Study 002 changes: smaller, denser hedge clumps; finer pink stalks; a soft sun; the canvas pinned edge to edge on phones.

**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-037-skate-garden/
**OBS:** Browser Source → the URL · 1920×1080 · enable "Control audio via OBS"
**Phone:** opens at `?lines=480` automatically on small screens; tap the info box to hide it, the round **i** brings it back; tap anywhere for sound.
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (default 720; 480 on phones) · `?ff=MIN` · `?hour=H` (16.7–19.75, the held golden hour) · `?cam=N` (hold drone N) · `?capture=1` (no rAF; drive with `MZ.tick` / `MZ.advance`) · `?v=1|2|3|4` (look; `?print=lino` = V1). `?live` is accepted and ignored: nothing is fetched.
**Keys:** **I** info · **M** mute · **1 / 2 / 3 / 4** or **P** look · **R** a hand on the lane (pushes toward rupture; logged as human intervention)
**Console:** `MZ.force('poppies' | 'hang' | 'shadow' | 'repaint' | 'hush' | 'rupture')` · `MZ.shot(kind)` (put a drone on a shot kind, framed, and hold it; `MZ.shot('x')` lists the kinds) · `MZ.cam(i)` / `MZ.cam(-1)` (hold a drone / hand back to the director) · `MZ.style(v)` · `MZ.skate(x, dir)` · `MZ.walker()` · `MZ.wax(v)` · `MZ.rain(mm)` · `MZ.seekHour(h)` · `MZ.ink(i)` · `MZ.grammar({period, dith, wob, outline, hatch, dab})` · `MZ.look(p, t, fov, focus, aper)` · `MZ.h(x, z)` · `MZ.geo` · `MZ.crew` · `MZ.state` · `MZ.setWx(o)` · `MZ.analyser()`

## Rule broken on purpose
**Rule 1 (a real place with coordinates, live weather).** The lane is a painter's place: it is built from the paintings, not from a location, and no coordinates are invented. So the sun is a **simulated held golden hour** and the weather is **simulated**, and the info box says SIMULATED (same decision as TWISTED TREE). The lane is sculpted to suggest the paintings, not any street.

## Six-line plan
1. **Place:** a garden lane running east–west (x), hedge to the north, wall and gardens to the south. No coordinates.
2. **Central figure:** the skater (white shirt, black trousers, dark hair, pink board). Rides lines down the lane and kickturns at each end: funbox flips, 50-50s on the ledge, manuals on the pad, flatground tricks at the crosswalk, the odd bail. Sits on the wall to watch the sun go down once each held evening, or when tired; walks to the porch and stands under it in rain. A walker in a black coat comes down the lane now and then with a small white dog that stops to sniff the hedge; the skater gives them room.
3. **Inputs:** the held golden hour (16:40–19:45 and back over 90 min) sets the sun and throws every figure's shadow down the lane (2 m at the top of the cycle, 25 m at the bottom); wind sways the hedge and sets **bar length (6.6 − 0.32·wind, 4.0–6.6 s)**; rain wets the road and sends the skater to the porch; **where the skater is along the lane sets the bass degree** (the ledge is the centre).
4. **Events:** THE POPPIES TURN TO WATCH, A TRICK HANGS IN THE AIR, THE SHADOW KEEPS SKATING, THE ROAD IS REPAINTED, and the hush that leads to rupture.
5. **Memory:** wax on the ledge (every grind adds wax, it wears off over days, and more wax means more lines that take the ledge), scuffs left on the road by bails and hard landings (48 h, also across reloads), tricks landed by kind, bails, laps, grinds, rain held in the road, the skater's place, event conditions, the log, colourway visits.
6. **New rendering idea:** *the oil-stick.* Every carved line is cut into short strokes (`dab` joins the line grammar and changes at rupture), so surfaces print as dabs rather than engraving, and every edge that touches a figure prints in **SEA, Bryson's turquoise contour**, instead of INK. Figures also throw **planar shadows** along the sun onto the ground, printed in INK: the long dark shadows of the paintings.

## World
- **The lane:** a road 6.4 m wide, its strokes brushed along its length; a crosswalk of six bars at x 38–44; a curb on the hedge side.
- **The hedge:** a high wall of clumps (3.4 m) along the north side, printed in INK/DEEP/SEA, with about 5,600 poppies and 1,100 pink stalks in it (fewer on phones); red tulips along the foot of the wall.
- **The wall:** low (0.48 m), along the south side; its cap between x 2 and 16 is the ledge, which carries the wax.
- **Spot:** a pink funbox (0.42 m, ramps both ways) at x −11.6 to −8.4; a concrete manual pad at x 22–28.
- **Houses:** a peach house with a porch on the lane (the shelter), a pale one to the west, two more over the hedge; pink roofs; five lamps on the hedge side that light below 8° of sun.
- **Gardens:** about 130 trees with big round crowns, a fifth of them in blossom; far hills.

## Cameras (MZCAM)
Seven drones (CAM 1–7) fly to marks off air (accel-limited, climbing to cruise for long hops), slide out of the live lens while travelling, keep out of the hedge, the crowns, the houses, the wall and the figures, and appear as small quadcopters in each other's shots (a red tally lights when one is on its mark). Free drones take the shot kind the director most wants that no other drone is holding. The director cuts only to a drone that is on its mark and ready, holds 6–19 s, lets an urgent shot interrupt, and cuts on the 16th note. Close shots rack focus.

| Kind | What it holds | Wanted when |
|---|---|---|
| FISHEYE | follows the line from behind, low, 94° | he is riding; more with a feature ahead |
| LONG LENS | over the hedge from the gardens to the north, 21° | always, quietly |
| LEDGE | low at the far end of the wall, along the ledge | the ledge is in his line and he is coming at it, or grinding |
| POPPIES | in the hedge, racking from flowers to the lane | the poppies watch |
| ABOVE | straight down on the lane, following | the road is repainted |
| THE LANE | down the lane into the sun | low sun |
| SHADOW | low beside his shadow | the sun is up; the shadow skates on |
| DOG WALK | beside the walker and the dog | they are on the lane |
| THE WALL | across the lane at the wall or the porch | he is sitting or sheltering |

## The uncanny
| Event | Conditions | What happens |
|---|---|---|
| THE POPPIES TURN TO WATCH | he is riding, wind < 8 m/s | every flower in the hedge and along the wall turns its face to follow him; the sun swells; ♭II chord and a reverse swell, tuned plinks |
| A TRICK HANGS IN THE AIR | he is riding, wind < 7 m/s, dry | at the top of his next trick he stops in the air for 9–14 s, board mid-flip, while the hedge, the drones and the walker carry on; a high fifth in the room |
| THE SHADOW KEEPS SKATING | he is riding, sun > 5°, cloud < 66%, dry | he goes and sits on the wall with no shadow; his shadow goes on riding the lane on its own, tricks and all; a sub swells with a breath |
| THE ROAD IS REPAINTED | road dry | the road's strokes turn across it and break into dabs, and the crosswalk spreads down the lane; knocks |
| hush (→ rupture) | tension reaches 1 | the lane holds still: the skater, the walker, the dog, the hedge; the band drops out |

Global gap 14–34 min; each event logs its reason (`why`), remembers the hour, wind and wax it happened in, and recurs more readily under similar ones; repeats habituate.

## Rupture and colourways
Tension builds with stability (epochs of 50–95 min) and +0.07 per event. At 1 the lane holds still, then the print re-inks (new colourway weighted to the least visited, crossfaded over 45 s), a new line grammar (`period`, `dith`, `wob`, `outline`, `hatch`, `dab`) and a new harmonic centre.

| # | Colourway | INK · DEEP · SEA · HOT · GLOW · PAPER | Note |
|---|---|---|---|
| 0 | **GARDEN ROAD** (home) | #1d1a24 · #355a2e · #3fb7ae · #d6402e · #f0a2b4 · #f0e7d6 | new: oil-stick black, hedge green, Bryson's turquoise, poppy red, smudged pink, primed canvas |
| 1 | ORANGE COAST | #1b2140 · #2b3f6e · #8ac0c4 · #ea651f · #f3b0be · #f5ead6 | new, after the orange-ground paintings |
| 2 | OLIVE ROOM | #211e16 · #5b5422 · #4c5a62 · #93302f · #d9b63e · #efe4cc | new, after the ochre and maroon paintings |
| 3–7 | SIGNAL FLARE · PISTACHIO NIGHT · ULTRAMARINE · LICHEN · ATLANTIC PRINT | canonical | shared |

**Material map (dark · mid · light):** sky SEA·GLOW·PAPER · sun and lamps HOT·GLOW·PAPER · hedge and crowns INK·DEEP·SEA · poppies and blossom DEEP·HOT·GLOW · road INK·GLOW·PAPER (the hatch mixes it to a mauve grey) · plaster and pink stalks SEA·GLOW·PAPER · concrete INK·SEA·PAPER · dark INK·INK·DEEP · skin SEA·GLOW·PAPER · white shirt, shoes, dog SEA·PAPER·PAPER · black trousers and coat INK·INK·SEA · board and funbox INK·HOT·GLOW · grass INK·DEEP·GLOW · cloud GLOW·PAPER·PAPER · crosswalk SEA·PAPER·PAPER. Figures (skin, white, black, board) take the SEA contour.

## Sound
D phrygian family; the centre moves at rupture. The live lens is the microphone: the hedge in the wind from six placed sources, the wheels' roll (brown noise, lowpassed 200–350 Hz with speed, louder on a wet road), the grind on the ledge (band-passed noise into the dub echo), the pop of the tail and the landing (placed thumps, a bail throws one into the echo), rain. Bar length from the wind, bass degree from where the skater is on the lane (the ledge is the centre; on the wall it holds the centre). Shared bed: drone, pad every 4 bars, Euclidean kick, dub echo with a unity-gain tanh loop whose feedback follows humidity, convolution room. Master chain unchanged: HP 26 Hz → tanh → high shelf −10 dB @ 2 kHz → LP 6.8 kHz → glue compressor. No band toggle (B), per MZ.Human's piece-by-piece decision.

## Hardening
TWISTED TREE's audio hardening, unchanged: one AudioContext, AudioWorklet noise (data: URL, blob fallback, then buffer), every voice enveloped to zero and disconnected on end, lookahead scheduler that skips after a stall, a 1 s watchdog (resume, rebuild on closed context, stalled clock, NaN or 20 s of silence, 3 h refresh). The skater and his shadow heal to the lane if a position goes non-finite; non-finite weather or tension heals from defaults; MZCAM sanitises drone positions; WebGL context loss is handled. Saved every 60 s, on unload, on pagehide and when the tab is hidden (phones).

## Tested (2026-10-30, headless Chromium + SwiftShader, Playwright)
- All nine shot kinds framed with `MZ.shot` at 1280×720, and the seven drones under the director: no console or page errors (fonts are blocked in the harness).
- Each event forced and rendered: poppies, hang (the ollie hung), shadow (skater on the wall, shadow riding), repaint, rupture.
- 3 simulated hours (`MZ.advance`): no NaN; 2 ruptures; 10 events (about every 18 min: poppies 2, hang 2, repaint 3, shadow 1, hush 2); 513 tricks landed, 30 bails, 89 grinds, 247 laps; 898 cuts. Wax build-up was then slowed (it saturated) to 1.2% × (1 − wax) per grind.
- Phone size (390×844, live loop, `?lines=480` automatic): renders, the info box hides on tap and the **i** brings it back; reload resumes the same lane and log.
- Audio, 13 s recorded from the master at 17:36, band in: RMS −14.5 dBFS, steady (−13.9 to −15.6 per second), peak 0.39. Band levels relative to 60–120 Hz: 20–60 −9.9 dB · 120–500 −13.2 · 500–2k −30.8 · **2–5 kHz −62.8** · **5–12 kHz −85.9**. Low end loudest; close to TWISTED TREE's balance.

## Known limits
- **Not yet reviewed** by MZ.Human or by Bryson Iacoboni. The world works from the paintings Match shared in chat (skaters in white and lavender shirts, teal contours, hedges of red flowers, long shadows, a crosswalk, a figure walking a white dog). No painting is reproduced or used as a texture.
- GPU load not measured on real hardware (SwiftShader only). The paint pass reads about 60 texels per pixel (three 3×3 stroke neighbourhoods plus the edge map and contour taps); on a slow phone use `?lines=420` or `?print=lino`. About 7,000 flower instances, 9,000 grass blades (5,000 on phones), 130 trees and a 256×180 ground grid; drop to `?lines=420` if a phone struggles.
- The skater's body is tubes and balls: it reads as a painted figure at a distance and in the fisheye, but is crude in a long close-up.
- Shadows are planar projections onto a flat ground plane: they don't climb the wall, the hedge or the funbox.
- One skater only; the walker and the dog don't interact with him beyond his giving them room.
