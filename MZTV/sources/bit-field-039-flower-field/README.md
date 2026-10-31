# MZTV · BIT FIELD 039 · MZ WORLD · FLOWER FIELD

A third world after the paintings of **Bryson Iacoboni**. It is the field from FLOWER BOWL with the bowl and the skater taken out. Round lilac, pink and white blooms sit on a navy ground, with red-crowned trees round the edge, two cottages far off and a mown path. As in TWISTED TREE, the place is the subject and nothing performs for the cameras. The thread is the light: a gap in the clouds drifts across the flowers with the wind. Inside the gap the field is in full sun; outside it is in cloud shade. A walker and a small white dog come along the path now and then.

It is a fork of **BIT FIELD 038 · FLOWER BOWL** (still on its branch, `mz-world/flower-bowl-038`). The engine is the same: object-space paint, structural paint rims, MZCAM drone crew, memory and rupture. There is one look, SKATE GARDEN's V5 (round dabs and scraped blocks), and no version switcher.

**Edition: Study 001 (2026-10-30), MZ.Claude. Published to main 2026-10-30 (built on branch `mz-world/flower-field-039`). Awaiting MZ.Human's review, and Bryson's.**

**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-039-flower-field/

**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` · `?ff=MIN` · `?hour=H` · `?cam=N` · `?capture=1`

**Keys:**
- **I** info
- **M** mute
- **R** a hand in the flowers (pushes toward rupture)

**Console:**
- `MZ.force(name)`, where `name` is one of:
  - `'sun'` (internal name `'poppies'`)
  - `'still'` (internal name `'hang'`)
  - `'bloom'` (internal name `'repaint'`)
  - `'hush'`
  - `'rupture'`
- `MZ.light(x, z, r)` puts the gap at `x, z` with radius `r`; with no arguments it reads where the gap is.
- Also: `MZ.shot(kind)` · `MZ.cam(i)` · `MZ.walker()` · `MZ.seekHour(h)` · `MZ.setWx(o)` · `MZ.state` · `MZ.geo`

## Rule broken on purpose
Rule 1, as in SKATE GARDEN and FLOWER BOWL: this is a painter's place with no coordinates. The held golden hour and the weather are simulated, and the info box says so.

## Six-line plan
1. **Place:** a flower field about 96 × 72 m, with navy clumps, 14,000 blooms (8,000 on phones) and grass. A mown path runs 13 m north of the middle, with two lamps beside it. About 70 trees stand round the edge, a quarter of them red-crowned, and two cottages sit far off.
2. **Central figure:** none, except the light. A gap in the clouds drifts downwind across the field, and a new one comes in upwind when it leaves:
   - Its speed is about 0.42 × the wind, and never below 0.45 m/s.
   - Its size and the depth of the shade round it follow the cloud. It is about 34 m across on a clear evening and about 13 m under heavy cloud. Below about 12% cloud the whole field is in sun.
   - The walker and the dog are visitors.
3. **Inputs:**
   - The held golden hour sets the sun's angle and the length of the shadows.
   - Wind sets the sway of the flowers, the speed and direction of the gap, and the length of the bar.
   - Cloud sets the size of the gap and the depth of the shade.
   - **Where the gap is picks the bass.** Over the middle it sits on the centre; otherwise the quarter of the field it is over picks the degree.
4. **Events:**
   - THE FLOWERS TURN TO FACE THE SUN: every bloom tilts toward it.
   - THE LIGHT STANDS STILL: the gap stops, widens and the shade round it deepens; the field breathes; a fifth hangs in the pad.
   - THE FIELD BLOOMS: every bloom opens wide.
   - Hush, then rupture.
5. **Memory:**
   - how many gaps have crossed the middle of the field;
   - the minutes of sun the middle has had;
   - walks along the path;
   - rain held in the ground;
   - where the gap was;
   - the conditions each event happened in;
   - the log.
6. **New rendering idea:** cloud shade is painted rather than cast. Every surface's tone is set by a soft, ragged-edged disc of sun drifting over the field. The shade reads on every face, not only the sunward ones, so the gap shows as a lighter field of paint, seen from above or across the flowers.

## Cameras (MZCAM, seven drones, nine kinds of shot)
| Shot | What it shows |
|---|---|
| THE FIELD | the flowers to the trees, from a few metres up |
| IN THE FLOWERS | low, into the light, racking focus from near blooms to far |
| CLOSE BLOOM | at flower height, shallow focus |
| THE LIGHT | from beside the gap, across it, following it downwind |
| ABOVE | from 30 m overhead |
| LONG LENS | across the field to a cottage |
| THE PATH | down the mown path |
| DOG WALK | following the walker and the dog |
| UNDER THE TREES | out from the edge of the field |

## Colourways
Same as FLOWER BOWL:
- 0 **FLOWER FIELD** (home): navy, brick, lilac, orange-red, pink, cream
- 1 BRICK ROOM
- 2 PORTRAIT
- 3–7 shared: SIGNAL FLARE · PISTACHIO NIGHT · ULTRAMARINE · LICHEN · ATLANTIC PRINT

## Tested (2026-10-30, headless Chromium + SwiftShader)
- All nine shot kinds and the three forced events (sun, still, bloom) rendered with no console or page errors.
- A 3-simulated-hour run passed with no NaN: 81 gaps crossed the middle, 15 walks, 12 events (3 of each, including 3 hushes) and 3 ruptures.

## Known limits
- The gap in the clouds is painted on the ground, not cast by the sky. The clouds drawn in the sky do not line up with it.
- The lit patch is clear from above and across the field. At flower height it is subtler, because the paint's own tonal range is narrow.
- Real GPU load is unmeasured. Phones get 8,000 blooms and `?lines=480`.
