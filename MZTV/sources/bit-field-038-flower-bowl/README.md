# MZTV · BIT FIELD 038 · MZ WORLD · FLOWER BOWL

A second world after the paintings of **Bryson Iacoboni**, made from the one of a skater in the air over a field of flowers. A long, deep concrete bowl, painted brick red inside and ringed with cream coping blocks, is sunk in a field of round lilac, pink and white blooms over a navy ground, with red-crowned trees round the edge and two cottages far off. One skater rides it wall to wall: backside airs above the coping (sometimes high, sometimes a kickflip out), kickturns below the lip, stalls on the coping, the odd slam. A walker and a small white dog come along a path through the field.

It is a fork of **BIT FIELD 037 · SKATE GARDEN** (same engine: object-space paint, structural paint rims, MZCAM drone crew, memory and rupture, the V1–V5 looks), with a new place, a new figure model for the bowl and new colourways.

**Edition: Study 001 (2026-10-30), MZ.Claude, on branch `mz-world/flower-bowl-038`. Not merged, not live. Awaiting MZ.Human's review, and Bryson's.**

**Live (after merge):** https://matchzimmerman.com/MZTV/sources/bit-field-038-flower-bowl/
**Params:** as SKATE GARDEN: `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` · `?ff=MIN` · `?hour=H` · `?cam=N` · `?capture=1` · `?v=1–5` (look; default V5)
**Keys:** **I** info · **M** mute · **1–5** or **P** look · **R** a hand on the coping (pushes toward rupture)
**Console:** `MZ.force('field' | 'hang' | 'shadow' | 'bloom' | 'hush' | 'rupture')` (`'poppies'` and `'repaint'` are the internal names of field and bloom) · `MZ.shot(kind)` · `MZ.cam(i)` · `MZ.skate(x, h)` (drop him in at x along the bowl, aiming for an air of h m) · `MZ.walker()` · `MZ.wax(v)` · `MZ.style(v)` · `MZ.seekHour(h)` · `MZ.setWx(o)` · `MZ.state` · `MZ.geo`

## Rule broken on purpose
Rule 1, as SKATE GARDEN: a painter's place, no coordinates; held golden hour and weather are simulated and say so.

## Six-line plan
1. **Place:** a stadium-shaped bowl 9 m along its spine, 3.05 m deep (flat floor 2.6 m wide, transitions of 2.7 m radius, 0.35 m of vertical), sunk in a flower field; cream coping and two rings of pavers; a path 13 m north; trees round the field.
2. **Central figure:** the skater (white tee, dark shorts, black shoes, orange-red board). He pumps through the floor to the energy the next wall needs (`pick`): an air (0.35–1.2 m, sometimes 1.3–1.9 m), a kickturn below the lip, or a stall on the coping. In the air he rotates 180° and grabs (or kickflips out). He sits on the coping at sunset once per held evening, when tired, and in rain.
3. **Inputs:** the held golden hour throws his shadow across the bowl's floor (and across the field when he is above the coping); wind sets the field's sway and the bar; **where he is in the bowl picks the bass** (floor = centre, wall, air, coping).
4. **Events:** THE FLOWERS TURN TO WATCH (every bloom tilts its face toward him), A TRICK HANGS IN THE AIR (above the flowers, as in the painting), THE SHADOW KEEPS SKATING (he sits on the coping; his shadow rides the bowl), THE FIELD BLOOMS (every bloom opens wide), hush → rupture.
5. **Memory:** wax on the coping, scuffs on the bowl's floor from slams (48 h), tricks by kind, slams, stalls, rain, event conditions, the log.
6. **New rendering idea:** the figure is laid onto the bowl: each pose is made on the flat and rotated onto the wall at the board (`txJ`), so on the vertical he is perpendicular to the wall, and in the air he turns upright over the coping and back. Shadows fall onto two planes, the field and the bowl's floor.

## Cameras (MZCAM, seven drones)
FISHEYE (on the bowl floor, looking up at him) · DECK (across the bowl) · IN THE FLOWERS (low in the field past the coping, racking from blooms to the air) · LONG LENS (across the field) · ABOVE (down into the bowl) · SHADOW (on the bowl floor) · DOG WALK · THE COPING (beside him when he stalls or sits) · THE FIELD (the bowl in the flowers).

## Colourways
| # | Colourway | INK · DEEP · SEA · HOT · GLOW · PAPER |
|---|---|---|
| 0 | **FLOWER FIELD** (home) | #1e2747 · #8f3a2a · #b6b3ea · #e9543c · #f3b9c9 · #f1ece0 (navy, brick, lilac, orange-red, pink, cream) |
| 1 | BRICK ROOM | #22191a · #8e3424 · #3fcfb0 · #2b4fc0 · #e8443a · #efe4c6 (after the skater on the brick-red ground) |
| 2 | PORTRAIT | #1f2a44 · #4a5a6a · #9a9ae8 · #e2552e · #f3c4a8 · #eae6dc (after the small portrait) |
| 3–7 | shared: SIGNAL FLARE · PISTACHIO NIGHT · ULTRAMARINE · LICHEN · ATLANTIC PRINT | |

There is no green ink: the field is navy and lilac, as in the painting.

## Tested (2026-10-30, headless Chromium + SwiftShader)
- All nine shot kinds, an air from three drones, the field watching, the bloom, the shadow (skater on the coping, shadow riding), dusk on the coping, V1: no console or page errors.
- 3 simulated hours: no NaN; 1,351 tricks landed (834 backside airs, 209 kickflips, 308 stalls), 69 slams, 13 events, 3 ruptures, 848 cuts. Wax then slowed to 0.4% × (1 − wax) per stall (it saturated).
- Performance: the blooms keep the cheap brush (the round-dab brush on 14,000 small blooms was too slow), and a bloom right at a lens folds away.

## Known limits
- The skater rides only the straight part of the bowl; the rounded ends are seen, not carved.
- On SwiftShader a frame low in the flowers takes seconds; real GPU load is unmeasured. Phones get 8,000 blooms and `?lines=480`.
- The striped shirt, blue head and the brick room from the third painting are only a colourway so far.
