# Geometry and assumptions · MEMORIAL STADIUM 1959 · Phase 01

All numbers live in `js/geometry.js` (`DIM`). The diagrams below are generated from that file by `tests/plan.mjs`, so they cannot drift from the model.

**Frame:** origin = home plate at field level; +x east, +z north, +y up; metres. Site: 39.3294 N, 76.6014 W (S05).

![Plan](plan.svg)

![Section](section.svg)

## How the plan was fitted

No 1959 plan drawing has been read yet. The horseshoe comes from three dated measurements:

| constraint | value | source | status |
|---|---|---|---|
| home plate at the south, centre field due north | — | S02, S05, S10 | documented |
| backstop (home plate to the front of the stands) | 72 ft = 21.95 m (1957) | S10 | documented |
| foul poles | 309 ft = 94.2 m, so x = ±66.6 m, z = 66.6 m | S01 | documented |

One circle passes through (0, −21.95) and (±66.6, 66.6): centre z = 47.4 m, radius **R0 = 69.3 m**, reaching the poles at ±106° from due south. That circle is the lower-deck front wall. It is an approximation: the real plan may have had straight runs or compound curves.

**Cross-check (independent):** S03 says that for football the upper deck ran from the horseshoe's end zone to about the far 40. With the 1954 upper deck ending 50 ft short of the poles (the 1964 extensions added about 50 ft at each end, S02), its front edge ends at z = 56.9 m. Putting the south end line 14 m north of the backstop line (z = −8 m) puts the far 40 at z = 56.0 m. The two agree within a metre, and the resulting sideline-to-stand gap (about 45 m at the 50) matches the "well over 100 ft" complaint about football seats (S02).

Caveat: S03's football note is undated. If it describes the post-1964 deck, the gridiron sat about 14 m further north. That is review item R3.

## Sections

| element | value | basis | status |
|---|---|---|---|
| field wall | 8 ft (2.44 m) | lowered in 1961 (S01) | documented |
| lower deck | 36 rows, tread 0.84 m, riser 0.38 m → back at R0 + 30.2 m, 15.7 m up | 46 lifetime rows (S02) minus about 10 rows of 1961 boxes (S02); tread/riser assumed | approximation |
| upper deck | 33 rows, tread 0.80 m, riser 0.40 m, front at R0 + 11 m, 16.8–18.6 m up; rim 32.6 m | 33 rows (S02); "shaded most of the lower deck" (S02); rim measured from HABS MD-1111-3/-15 at ~3 m below the façade top (earlier passes had 35.5 m and 36.8 m) | approximation (constrained by the HABS measurement) |
| upper-deck extent | ±96.8° (ends 15.24 m short of the poles) | 1964 extension of ~50 ft each end (S02) | approximation |
| columns | 0.9 m square, every 6°, 19 m behind the front wall | existence and obstruction documented (S02); spacing and position assumed | approximation |
| underside, fascia, concourse wall | straight soffit parallel to the rake | needed to close the section | creative |
| press box | small block on the rim behind home plate | placeholder only | creative |

## Field

| element | value | basis | status |
|---|---|---|---|
| gridiron | 160 ft × 120 yd, 10-yd end zones, lines every 5 yd, hash marks every yard 20 yd in from each sideline | NFL rules of the period (S15) | documented (dimensions) |
| gridiron position | south end line z = −8 m, on the centre line | fitted (above) | approximation |
| goalposts | H-shape on each goal line, 18 ft 6 in apart, crossbar 10 ft, uprights 25 ft | rule (S15); upright height assumed | documented / approximation |
| baseball skin | dirt arc 95 ft from the mound, infield grass, home circle, mound | standard layout; whether it was sodded over for December football is unknown | approximation |
| turf colour and wear | olive, worn between the hashes | invented to read as a winter field | creative |

Lines are 4 in wide. The ink print draws them with pixel-footprint coverage, exaggerated ×2.4 so they survive a 320-px print. This is a deliberate print-legibility choice, logged here so it isn't mistaken for evidence.

## Outfield and north end

| element | value | basis | status |
|---|---|---|---|
| corner walls | 14 ft, running due north from each pole (135° to the foul line) to z = 108 m | S01 (NYT 1954; Bready says 8 ft) and S02 | approximation |
| wing bleachers | 20 rows behind the corner walls | "lower deck extended into the outfield" / LF and RF bleachers (S01, S02); rows assumed | approximation |
| centre field | 6 ft wire fence through 446 ft (alleys) and 445 ft (CF); trees as the 1954 hedge line | S01, S02, S10 | approximation |
| scoreboard | 65 ft overall, 28 m wide, centred at z = 152 m, three legs, lamp-grid face, Longines clock disc above | height, date and clock documented (S01); width, offset and face design assumed; S03 says right-centre | approximation |
| foul poles | 20 m | position documented; height assumed | documented / approximation |

## Exterior (rebuilt from HABS MD-1111 in the evidence layer)

The Library of Congress survey (HABS MD-1111, James W. Rosenthal, 2000: 82 photographs, 6 colour transparencies, caption index) was read in full. It shows the stadium in 2000, so each element was checked against the chronology (1961 boxes, 1964 deck extensions, 1970/1985 scoreboards, later sky boxes, the western office annex, added ramps) before it was used for 1959.

**Façade, measured from MD-1111-15** (a near-orthographic elevation). Scale: the documented 116 ft (35.36 m) height. Independent check: the "MEMORIAL STADIUM" letters measure 3.1 m against the documented 10 ft (3.05 m). Estimated error ±0.5–1 m.

| element | value | status |
|---|---|---|
| overall width | 37.2 m: pylons 3.9 m, brick infills 5.1 m, stone panel 19.3 m | documented (measured) |
| stone panel | 19.3 × 26.5 m, from 4.0 m (canopy) to 30.5 m; slabs ~2.76 × 2.0 m | documented (measured) |
| name band | 30.5–34.8 m between the pylons; "MEMORIAL STADIUM" 3.1 m caps, 26.8 m long, condensed | documented (measured) |
| pylons | brick, full 116 ft, stepped tops | documented (measured) |
| city seal | 6 m across, centre 26.7 m; the seal's artwork is not drawn | documented (measured) |
| dedication | the line breaks, sizes and positions read from MD-1111-15/-17, including the justified nine-line memorial block and the full-width closing line | documented (text and layout); letterforms are bitmap stand-ins |
| entrance canopy | thin slab at 3.9 m, ~52 × 11.5 m with rounded ends, an oval opening over a raised round planter, red cast-granite columns (MD-1111-16, -18..-21) | approximation (plan from oblique views; assumed original to the 1954 memorial entrance) |
| 1954 date stone | in the brick of the east side entrance (MD-1111-23) | documented (height assumed) |
| forecourt | lawn, central walk, hedges, and the c.1922 wrought-iron fence on the south line (MD-1111-3, -14); 33rd St moved to 37.5 m south of the façade | fence and hedges documented as predating the stadium; layout approximate |

**Shell.** The exterior is not one tall brick wall. It is a brick concourse ring about 18.5 m high (measured), with bands of glass-block windows in cast-concrete surrounds (MD-1111-11). Above the ring the upper tier is open: the deck's underside is exposed on raking concrete frames, under a concrete rim band (MD-1111-3, -6, -12). The rim measures ~32.6 m, about 3 m below the top of the façade, so the upper-deck riser was refitted to 0.40 m. Ramp blocks on the south façade (MD-1111-13) are left out because their dates are unknown and S02 says ramps were added later.

**Inside.** Columns carry arched brackets between them under the deck (MD-1111-37, -38, -45). The press box moved from an invented rim box to the west mezzanine (MD-1111-48, -49; S26: "three tiers" in 1954). Three flagpoles stand on the top row behind home plate (MD-1111-66). Twin-leg steel lattice light towers stand on the rim at ±42° and ±82°, plus two in the outfield (MD-1111-3, -7, -63..-65). Their presence in 1959 is assumed from S02 ("later in the 1950s"), and they are unlit for the day game.

| element | value | basis | status |
|---|---|---|---|
| streets | 33rd St a divided boulevard at z = −100 (north edge); Ellerslie Ave x = −150; Ednor Rd x = +150; 36th St z = 200 | sides documented (S05); positions not traced | approximation |
| neighbourhood | see the detail layer | | creative |

## Detail layer (pass 3)

| element | value | basis | status |
|---|---|---|---|
| crowd | per seat: coat, shoulders, collar/scarf (30%), hat or cap (42%), head; seen from behind as hair and hat brims, from the front as faces; a few seats shift pose every ~3 s in the live print | sell-out (S08, S14); appearance generated | creative (claim 12) |
| dugouts | dark openings in the field wall 58°–73° either side of the axis, under a 0.3 m lintel | dugouts documented (S02); placement assumed | approximation (claim 25) |
| rails | 0.95 m above the field wall and the upper fascia | assumed | creative (claim 26) |
| scoreboard | face divided into zones by dark bands; lamp cells inside; no text or score | structure assumed; content deliberately blank | approximation (claim 13) |
| Longines clock | ticks and hands at the scene time (`?hour=`, default 15:10) | clock documented (S01) | approximation (claim 27) |
| façade | concrete panel joints (3.05 × 4.4 m), letters standing off the wall with a soft shadow, iron grilles in the gates, lintel band, 1954 cornerstone at the foot of the east side | cornerstone documented (S21); joint grid, grilles and cornerstone position assumed | approximation / creative |
| brick | coursed brick with mortar drawn at close range, grime at the foot of the wall | Baltimore brick (S19); texture generated | approximation |
| neighbourhood | Ednor Gardens north of 36th St as Tudor rows (steep roofs, front gables, half-timbered upper storeys, terraced front gardens); porch-front daylight rows elsewhere (flat roofs, stone-trim cornice, deep porches with white posts); 5.5 m house bays with windows and doors; chimneys | house types documented (S22, S24); every house generated | creative (claim 17) |
| trees | bare winter trees as branching line primitives; 33rd St lined on the median and both verges at ~15–20 m spacing, with a gap on the façade axis | "wide, tree-lined 33rd Street boulevard" (S22); spacing and the gap assumed | approximation (claim 24) |
| cars | late-1950s cars parked on the modelled streets (none in front of the plaza or within 24 m of a corner) | a sell-out implies it; no source | creative (claim 29) |
| street lamps | every 36 m on both outer verges of 33rd St, unlit | invented | creative (claim 30) |
| City College | Gothic stone massing with a 40 m tower and pinnacles on a 7 m hill, ~400 m WSW across 33rd St | documented across 33rd St (S23); position from its address; massing generic | approximation (claim 31) |
| wet surfaces | in drizzle, roads, paving, concrete, car roofs and the field darken and take a sky reflection by Fresnel angle | weather documented (S07); amounts assumed | approximation (claim 0) |

## Not modelled (on purpose)

- **Light towers.** S02 says big towers came "later in the 1950s", but no date or positions yet, and it was a day game (claim 20).
- **Players, officials, benches, flags, field-level "field seats" (S14), scoreboard content.** These wait for MZ.Human to choose a moment and for period photographs.
- **Real ground levels** outside the bowl.

## Camera stations

| id | where | aim | FOV |
|---|---|---|---|
| **cam0 `sw-upper`** (review view) | upper deck, third-base curve (θ = −35°), row 12, eye 1.15 m above the tread: (−51.8, 26.8, −26.6) | yaw 20° (NNE), pitch −15° | 74° horizontal |
| cam1 `w-upper-50` | west upper deck, row 14, near the 50 | east across the field | 66° |
| cam2 `home-rim` | upper deck behind home plate, row 26 | due north up the horseshoe | 70° |
| cam3 `33rd-street` | the 33rd Street median, eye 1.6 m, ~51 m from the façade | up at the memorial wall | 64° |
| cam4 `ellerslie` | corner of 33rd St and Ellerslie Ave | east along the façade and the brick shell | 64° |
| cam5 `overview-se` | 175 m up, south-east of the site (a model view, not a 1959 vantage) | the whole bowl in its blocks | 46° |
| cam6 `north-lawn` | open ground inside the block just south of 36th Street, eye 1.6 m | south-west into the open end past the scoreboard | 68° |

Scene sun (15:10 EST, 27 Dec 1959): elevation 14.2°, azimuth 222.6° (SW), from the NOAA approximation shared with 046/047.
