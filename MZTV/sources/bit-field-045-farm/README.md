# MZTV · BIT FIELD 045 · MZ WORLD · FARM (working title)

**State: NOT VISUALLY APPROVED.** Built to the MZ WORLD HEADLAND standard v1.2. Not deployed to the live site; publication waits for MZ.Human.

Bernard's farm, printed and running in real Galway time. A small hill farm above Galway Bay: the farmhouse, the byre where Bernard sleeps, a hay barn, a fold, three walled fields, five gates and a lace wall the farmer is still building. Twenty blackface ewes, one of them raddle‑marked, graze the fields down and wear paths between the gates. The farmer moves them to fresh grass in the morning and back into the fold at dusk, builds wall, walks off down the lane, and goes in at night and in heavy rain. Bernard works when there's work, and otherwise lies down and watches. An observational crew films it. Nobody directs it.

It is the SHEEPDOG / BERNARD thread as a live world. The rule from the BERNARD tests carries over: observe, don't direct. No dialogue, no on‑screen story, no cutting to the farmer, and the whistle is rare and low.

**Live:** not published (run locally: serve the repo root, open `MZTV/sources/bit-field-045-farm/`)
**OBS:** Browser Source → that URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (internal resolution, default 720; 420–540 for weak GPUs) · `?ff=MIN` (start the clock MIN minutes ahead) · `?hour=H` (start at Galway hour H) · `?cam=N` (hold one operator) · `?live=0` (simulated weather) · `?capture=1` (no rAF; drive with `MZ.tick(dt)` / `MZ.advance(sec)`)
**Keys:** **I** info · **M** mute · **R** a hand on the farm (pushes toward rupture; logged as human intervention)
**Console:** `MZ.force('gather' | 'turn' | 'lie' | 'stone' | 'hush' | 'rupture' | 'herd')` · `MZ.herd('field.hill')` · `MZ.whistle()` · `MZ.state` · `MZ.route('fold','field.low')`

## Source to world
The world model is built first and the renderer reads it (MZ WORLDS source‑to‑world architecture, 2026‑11‑02).
- `farm.world.json`: the portable model. Entities, relationships, space, time, rules, ecosystems, evidence, interpretation and outputs, each fact tagged documented / inferred / estimated / fictional.
- `tools/build_model.py`: builds the model from the Galway data already in the repo (`MZTV/worlds/galway/`) and injects a compact runtime copy into `index.html` between `/*<FARM_MODEL>*/` markers.
- `tools/assemble.sh`: joins `parts/p1–p6.html` into `index.html`, then runs the model build. Edit the parts, not `index.html`.

| Layer | What | Status |
|---|---|---|
| Anchor | 53.24423 N, 9.40425 W (ITM 506275 E, 722460 N), the SHEEPDOG site | documented (user‑selected site) |
| Buildings | farmhouse, two byres, hay barn, ruins and neighbours from OpenStreetMap footprints | documented (OSM); roles and heights authored |
| Roads | the secondary road and the lane from OSM | documented (OSM) |
| Terrain | EU‑DEM 25 m grid, 21×23 samples, 15–35 m | documented, but coarse: not LiDAR, about ±7 m |
| Shore | the bay at about 750 m south | estimated (the elevation service was not reachable to check) |
| Fields, walls, gates, fold, props | laid out for the world | fictional / authored; not claims about the real property |
| People and animals | the farmer, Bernard, the flock | fictional |

## World
- **Place:** above Galway Bay on the Connemara side, west of the city. Real buildings and lanes; the fields and walls are designed. The terrain is sculpted on the 25 m DEM, not surveyed.
- **Time:** real Galway time. Sun and moon computed for the anchor; the moon carries its real phase.
- **Weather:** Open‑Meteo at the farm (wind, gusts, cloud, rain, temperature, humidity) and the marine API in the bay below (swell), polled every 15 min, slewed over minutes. Simulated fallback when unreachable, shown on screen.
  - wind speed and direction → grass blades and ground hatching combed downwind, fleece shiver, the "lie" event, wind bed; a gale (≥16 m/s mean or ≥24 m/s gusts) can take the top stone off the new wall
  - rain → the farmer goes in (>2.2 mm), rain strokes in the print, louder in the byre
  - humidity → haze distance, echo feedback
  - swell → the sea far below, the "turn" event
  - cloud → sky, light

## Inhabitants
- **Bernard**, the border collie from the SHEEPDOG tests, ported from the Godot rig with its fixes: legs by IK on a four‑beat gait table (walk, trot, canter, gallop), head and tail smoothed in the body's frame so nothing lags at speed, tail as a chain that swings with the stride and steers on turns. His day: asleep in the byre at night, up and out at first light, at heel when the farmer walks, lying down watching when the farmer works, eating at the bowl after midday, drinking at the trough, waiting at the yard's edge when the farmer goes off down the lane, lying at the farmhouse door when he's in.
- **Working:** to move the flock he finds the balance point (the far side of the flock from where they're going), collects a stray first, flanks wide and fast, then walks up slowly with his head low and stops when he has them with his eye. He holds them at a closed gate until the farmer opens it, and gets in tight behind them in a corner. He gets steadier with experience (`S.exp` grows with every move).
- **The farmer:** waxed coat, flat cap, crook. A queue of plain tasks: walk (through the gates, opening and closing each), hold a gate, lay stone (stoop for a stone from the tumble, carry it, set it, step back and look), lean on the wall, look over the flock, about the yard, in for his tea, away down the lane for half an hour to an hour and a half, and now and then a low whistle when Bernard has strayed.
- **The day:** first light, the flock goes from the fold to the field with the most grass. If that field is grazed short by early afternoon, they move on. Late afternoon, before dark, they come back into the fold. Night, everyone in.
- **The ewes:** twenty blackface ewes. They flock, keep their distance from Bernard (less when he's down, more when he's stalking), treat a standing farmer as a wall, drift toward better grass when calm, lie down at night, and bleat. The raddle‑marked ewe makes a break under pressure and remembers which side she broke to.

## Memory (it changes what happens next)
- **Grass:** a 2.5 m grazing map over the fields. The ewes eat it down where they stand and it regrows over about six days. The field with the most grass decides where they go in the morning. The blades and the ground print read it: long grass, grazed stipple, bare fold.
- **Paths:** feet wear lines between the gates and across the yard; they fade over about five days. Trodden ground prints as path.
- **The wall:** the farmer's new wall gains a stone every several minutes when he's at it; a gale can take one off. Its height is kept.
- **Bernard's experience** grows with every move: wider, calmer work.
- **The marked ewe's breaks:** counted, with the side; she tends to break the same way again.
- **Away time:** on reload the grass grows back for the time the page was closed (up to three days) and the paths fade.
- **Events** remember the hour, wind and field they happened in and recur more readily under similar conditions; repeats habituate.
- State in `localStorage` (`mzworld-farm-v1`, `-s<seed>` with `?seed`) every 60 s and on unload, including where every ewe stands. `?fresh=1` clears it.

## Cameras (observational)
YARD · BYRE · FOLD GATE · WALL · LONG LENS · HILL · GRASS · BERNARD SIDE · BERNARD LOW · ROAD · THORN. Operators hold and drift; the mixer cuts every 8–19 s on the 16th note, weighted by what is moving: the byre at night when Bernard is asleep, the long lens and Bernard's side when there's a move on, the wall when the farmer is laying stone. A lens never sits inside a wall, a building, a ewe, the dog or the farmer, and Bernard's low operator picks an angle with no wall between. It does not cut to the story.

## The uncanny
Rare events where the farm itself is alive. Each has conditions and a cooldown; the global gap is 14–34 min.
| Event | Conditions | What happens |
|---|---|---|
| Gather | the flock is in the field with the hawthorn, no move on, the farmer away, indoors or far off, light enough | the ewes walk to the thorn and stand in a ring facing it; Bernard lies flat and won't go near; a reverse swell and a ♭II chord |
| Turn | flock calm in a field, low sun or a big swell in the bay | every ewe stops and turns to face the bay, one after another; a high fifth in the room |
| Lie | wind over 5 m/s off the bay (S to W), Bernard awake | the grass lies down in a line coming up from the sea, as if something heavy walked through; the ewes part for it; Bernard stands and watches it pass; a sub swells with a breath |
| Stone | nobody at the wall, daylight | a stone sets itself in the new wall; Bernard looks at it |
| Hush | tension reaches 1 | the farm holds its breath: grass and fleece go still, the bay goes to a mirror, the band drops out; then rupture |

These come from this place (the lone hawthorn, the bay below, the wind off the sea, the unfinished wall). The sun‑eye is not ported.

## Rupture
Tension builds with stability (epochs 50–95 min) and with each event (+0.08). At 1 the farm holds its breath, then the print re‑inks: new colourway weighted toward the least visited, new line grammar (period, dither, wobble, outline, hatch), new harmonic centre. Never during a move.

## Relational colour and print composition (rule 13)
The field is the mid mass (DEEP and SEA, with GLOW where the grass is long and lit). Grazed and trodden ground goes lighter and stippled. The lace walls carry the darkest line rhythm against the field. Fleece is the light mass that moves. Bernard is the one black‑and‑white figure. HOT is held back for the raddle mark, the farmhouse door and a low sun.

**Colourways:** ATLANTIC PRINT (home), RADDLE (new: oxblood ink, slate deep, sage field, raddle orange, straw), SIGNAL FLARE, FUCHSIA (new: the Connemara hedge, bottle green against magenta), PISTACHIO NIGHT, TURF SMOKE (new: peat‑brown deep, smoke‑blue field, ember hot), ULTRAMARINE, LICHEN. Shared names keep HEADLAND's inks.

## Print
SRUTHÁN's surface‑carved hatching (`lineAt`) on HEADLAND's data target and print pass, six inks. **New here:** line spacing follows each surface's own foreshortening (screen derivatives across the lines) in octaves, so the long, low views across grass keep their density without moiré, and still surfaces keep still patterns. The ground reads the grazing and tread maps live. Stones are carved in their own lie with lichen on the tops; fleece is carved in curls; corrugated iron down the sheets.

## Sound (the live lens is the microphone)
D phrygian family; the centre moves at rupture. Drone, three‑voice pad (a chord every 4 bars), Euclidean kick, wind and rain beds, the bay as a low distant wash, dub echo with a unity‑gain tanh loop (feedback from humidity), convolution room (bigger in the byre).
- **Bar length comes from the flock's pace:** grazing ewes stretch it toward 6.6 s, a move pulls it toward 4.0 s.
- **Bass degree comes from where Bernard is:** byre 0, yard 3, fold 4, home field 2, hill field 5, low field 1, the lane 6; when he runs, it alternates with the fifth. Asleep, one long low root per bar.
- Placed sources, weighted by what's in frame and how near: bleats (two formants, a shake, falling), the gate clank, stone on stone at the wall, the low whistle.
- Master: HP 26 Hz → tanh → high shelf −10 dB @ 2 kHz → LP 6.8 kHz → glue compressor.

## Deliberate breaks from the standard
- None in the fixed rules. One open choice worth naming: bar length follows the flock, not the sea, because the bay is far below and the flock is what this world is about.

## Porting to INVERIN
See `PORT.md`. Everything farm‑specific sits in `FARM:` sections and goes through the same helpers INVERIN uses (`objMat`, `withT`, `clean`, `terrainH`, `OBST`), around one anchor.

## Hardening
Noise from an AudioWorklet (data: URL, blob fallback, long buffers last). One‑shots enveloped and self‑disconnecting. Lookahead scheduler skips after stalls; AudioParams move at ≤10 Hz. Watchdog every 1 s: resume when suspended; rebuild on close, clock stall >6 s, NaN or 20 s silence; refresh every 3 h. Walkers move in short strides with swept wall checks so nothing tunnels through a wall; non‑finite positions are reset. A move that stalls is resolved after an hour. WebGL context loss handled.

## Tested (2026‑11‑08/09, headless Chromium with SwiftShader, `?live=0` unless noted)
- **All 11 operators** at day (11:00), dusk (16:45) and night (21:30); side by side with HEADLAND at 14:00. Close‑ups of Bernard, the farmer and the ewes.
- **Every event forced and rendered** (gather, turn, lie, stone), and a rupture (re‑inked to PISTACHIO NIGHT).
- **Moves:** home → hill about 2 min, home → fold about 3.5 min (Bernard holds them at the gate until the farmer opens it), home → low about 3 min (from a corner). Morning fold → field, dusk field → fold, Bernard in his bed after dark, the farmer out at first light, all running on their own over 24 simulated hours.
- **6 simulated hours from 07:00:** 12 events (about one every 30 min, all with their reasons), 5 ruptures, no NaN, no console errors. 24 simulated hours run in about 30 s.
- **Memory:** a field grazed from 85% to 66% over four daylight hours; the fold bare by morning; the wall from 96 to 141 stones in a day. Reload resumes the epoch, wall, grass and every ewe's position; regrowth for time away.
- **Live weather:** Open‑Meteo answered on the first run; on later runs the proxy blocked it (CORS) and the simulated fallback took over and said so.
- **Audio (18 s):** about −16.5 dB RMS, −10 dBFS peak. 60–120 Hz loudest; 20–60 Hz −9 dB; 120–250 Hz −12 dB; 2–5 kHz −65 dB; above 5 kHz −87 dB. Darker than HEADLAND in the top two bands (its 2–5 kHz sits about −50). Largest sample step 0.0098: no clicks. AudioContext suspend and close both recover.
- **GPU:** software rendering only. Not measured on a real GPU or a phone; use `?lines=540` or `?lines=420` on weak hardware.

## Known limits
- Tested in headless software rendering only, not on a real GPU or phone.
- The farmer is built from capsules and reads as a printed figure, not a detailed one; he is rarely the subject.
- The ewes' legs swing but don't plant; Bernard is the only full IK body.
- Collision is segments, oriented boxes and circles.
- The bay is estimated and mostly heard rather than seen from the fields.
