# MZTV · BIT FIELD 040 · MZ WORLD · OUTBUILDING

A corrugated outbuilding on a rise, with a cracked lot in front of it, a bank of utility poles behind it, and a treeline holding the edge. It keeps to itself: sheltered and reclusive, an intentional isolation for safety. Its windows light on their own schedule, its window unit and its burner cycle with the real weather, and nobody is ever seen. It is printed every frame as carved linocut lines in six inks, filmed by an observational crew that never comes close enough to see inside. It runs on HEADLAND's engine with SRUTHÁN v3's surface-anchored hatching.

**Status:** published 2026-11-01. Awaiting MZ.Human's review.
**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-040-outbuilding/
**OBS:** Browser Source → that URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (internal resolution, default 720; 420–540 for phones or weak GPUs) · `?ff=MIN` · `?hour=H` (start at local hour H, testing) · `?cam=N` (hold one camera) · `?live=0` (simulated weather) · `?capture=1` (no rAF; drive with `MZ.tick(dt)` / `MZ.advance(sec)`)
**Keys:** **I** info · **M** mute · **R** a hand on the building (pushes toward rupture; logged as human intervention)
**Console:** `MZ.force('sing' | 'windows' | 'lean' | 'hush' | 'rupture')` · `MZ.seekHour(h)` · `MZ.wet(mm)` · `MZ.age({ rust, crack, peel })`

## Deliberate breaks from the HEADLAND standard
- **Unlocated.** The world is not labelled with its place. Town-level coordinates (Catonsville, Maryland: 39.27°N, 76.73°W) drive the sun, the moon and the live weather, and nothing else. The info box says `LOCAL`, and no site is named on screen or here. The building, lot, poles and trees are sculpted from one photograph and are not surveyed or placed on a map.
- **No kick and no walking bass.** The sound is the place first, with only slight tonal elements. Nothing marks the beat, and the low end is one held hum that moves only at rupture. The "central figure → bass degree" row is replaced by the building's state → which machine is sounding.
- **The hum is tuned, not mains.** The lines' hum and its overtones sit on the world's harmonic centre (D at home), not on 60 Hz.

## World
- **Place:** a single-storey corrugated building, 30 m × 7 m, on a low concrete foundation. It has a shallow tin roof rusting in streaks, six windows facing the lot (one boarded, one with a window unit under it), a flue and a vent, and a door with a green awning at the east end. A parking lot falls toward it from the south, with a grass strip between. A bank of poles with crossarms and insulators runs behind its west end, with a tall pole at the lot's corner and a floodlight pole near the door. There is a road on the east side, a lawn rising beyond it, and woods to the west and north, with understory at the edge and a far tree mass closing every horizon.
- **Time:** real local time (America/New_York). Sun and moon positions come from the town-level coordinates, and the moon carries its real phase.
- **Weather:** Open-Meteo (current conditions), polled every 15 min and slewed over minutes, with a simulated fallback shown on screen.
  - temperature → the lines' sag (conductors lengthen in heat) and so their sway period and the bar length; the window unit or the burner; the roof's own temperature; freeze-thaw nights
  - humidity and rain → the lines' hum, echo feedback, haze, the wet store, rust
  - wind and gusts → the trees, the grass, the wires' swing amplitude, the leaves bed
  - cloud → light, the roof's heating, the sky

## Life (the building keeps its own hours)
- **The building** is the central figure.
  - The window unit cycles on a duty that follows the heat. When it runs, its fan turns behind the grille and it drips.
  - The burner cycles in the cold. The flue ticks as it heats, and in cold or damp air its heat shows as a printed plume.
  - The tin roof has its own temperature (sun, cloud, air, rain) and pops as it changes.
  - One window lights at dusk and goes dark at a time of its own choosing each night. Some nights it never goes out, and on some weekday mornings it lights before dawn. Now and then another window lights for a few minutes. The boarded window stays dark.
  - The floodlight comes on from dusk to dawn.
  - The door never opens.
- **A car** comes on weekday mornings and leaves in the afternoon, and visits now and then on weekends. Its arrival scatters the crows.
- **Crows** perch on the wires, the ridge, the pole tops and the lawn, move between them, caw, and leave to roost at dusk.
- **Deer** come out of the trees at dawn and dusk to graze the lawn, and leave when the car moves.

## Memory (slow damage)
- **Rust** creeps across the roof with every wet or very humid hour, and paint peels from the siding more slowly. Neither ever recovers.
- **The lot cracks** further on every real freeze-thaw (the temperature crossing below and back above 0 °C). In the growing season grass comes up along the cracks.
- **A wet store** fills with rain and drains over about 3 h, including while the source is dark. It darkens the asphalt and the siding, fills puddles and floods the cracks.
- Each event remembers the hour, humidity and temperature it happened in, and recurs more readily under similar conditions. Repeated events habituate.
- State lives in `localStorage` under `mzworld-outbuilding-v1`, saved every 60 s and on unload. An OBS reload resumes the same epoch, memory and log.

## Cameras (observational, at a distance)
LOT · CORNER · ROOF · TREELINE · LAWN · POLE LINE · LONG LENS · ASPHALT · WIRES. Operators hold and drift, and the mixer cuts every 8–19 s on the 16th, weighted by what is happening (deer out, crows on the wires, a machine running, a wet lot, rain on the roof, wind in the trees, an event in view). LONG LENS follows the deer, the plume, a lit window or a perched crow. Every operator is kept at least 6 m from the walls, and the glass prints dark with only sky in it, so the inside is never seen.

## The uncanny
| Event | Conditions | What happens |
|---|---|---|
| The lines sing | humidity ≥ 85% or rain, sun below 8° | pulses of HOT ink run along the wires, the insulators glow, and the hum swells into a ♭II chord with a reverse swell |
| Every window | daylight, the car gone, the building quiet | every window lights at once, the boarded one and the north side included; a high fifth in the room |
| The treeline leans in | wind < 2.5 m/s, no rain | the trees bend toward the building and hold, breathing; a sub swells with them; the crows go to the wires and the deer leave |

Each event has its own cooldown, and the global gap is 14–34 min.

## Rupture
Tension builds with stability (epochs of about 50–95 min) and with each event (+0.08). At 1, everything holds still: the wires stop swinging, the trees and grass stop, the machines cut out, the crows hang in the air and the sound drops away. Then the print re-inks with a new colourway (weighted toward the least visited), a new line grammar (period, dither, wobble, outlines, hatch) and a new corrugation pitch: the rib lines step to every 1st, 2nd, 3rd or 4th rib. The harmonic centre moves, and the hum retunes over several seconds.

**Colourways:** Galvanised (home), Creosote, Red Oxide, Window Unit (new); Signal Flare, Pistachio Night, Ultramarine, Lichen (shared).

## Print
The scene renders to a data target (shade, material id, carved line value, accent), and the print pass resolves it to six inks with ordered dither, speckle and outlines between materials.
- **Hatching is carved into the surfaces** (SRUTHÁN v3). Lines run along each surface's own tangent: siding ribs up the wall, roof ribs down the slope, wood along the grain, grass bent by the wind. Their spacing follows distance in octaves, so a still thing keeps a still pattern.
- **New here: the corrugation is the line grammar.** On the siding and the roof the lines sit on the physical ribs (30 cm on the walls, 46 cm on the roof) and step out to every 2nd, 4th… rib with distance. The ribs also shade the surface up close.
- **Rust is a second hatch** that crosses the rib lines. It grows in streaks along the ribs, along the sheet laps and at the eaves, and runs down the siding from under the eaves.
- **The wires are printed ribbons** with a fixed on-screen width, so a 1 cm conductor still holds a line at any distance, and its singing can be inked.
- Light pools from the floodlight and from lit windows are added to the shade, not glowed.

## Sound (the live lens is the microphone)
Environment first, with slight tonal elements. There is no kick and no walking bass. D phrygian family, and the centre moves only at rupture.
- **Beds:** distant traffic (louder at rush hours and on weekdays); wind and leaves (weighted by the treeline in frame, with fewer leaves in winter); rain, and rain on the tin roof (much louder when the lens is near the roof), with patter ticks.
- **The building:** the window unit's compressor and fan, the burner, the flue ticking at each cycle, and roof pops with a tuned ring when the tin's temperature moves. All are placed by the lens.
- **The lines:** a steady hum with four overtones on the centre. It is louder in wetter air and when the lens is near the wires. It is the only low end and it holds still.
- **Tonal elements, used sparingly:**
  - now and then one partial leans to a phrygian degree for a few bars and returns
  - a soft pad surfaces for 8–16 bars at a time, rarely
  - small birds by day (more at dawn) chirp on scale degrees
  - on warm summer nights two insect voices pulse on the centre and its fifth
  - drips from the window unit plink on scale degrees
- **Tempo:** bar length = 2.8 × the wires' sway period (4.0–6.6 s). The sway period is 1.806 × √sag, and the sag follows the temperature. It sets the echo and quantises the one-shots and the cuts; nothing plays on the beat.
- **Events:** ♭II chord + reverse swell (sing), high fifth in the room (windows), sub with a breath (lean).
- **Dub echo:** a unity-gain tanh loop whose feedback follows humidity. Convolution room.
- **Master:** HP 26 Hz → tanh → high shelf −10 dB @ 2 kHz → LP 6.8 kHz → glue compressor.

## Hardening
- Noise comes from an AudioWorklet (data: URL, blob fallback, long buffers as a last resort).
- One-shots are enveloped and self-disconnect, and their queue is bounded.
- The lookahead scheduler skips forward after stalls.
- A watchdog runs every 1 s: it resumes a suspended context, and rebuilds on close, a clock stall over 6 s, NaN or 20 s of silence. It also refreshes every 3 h.
- Memory, tension, weather and agents self-heal from non-finite values.
- WebGL context loss is handled.
- The world is pre-warmed for 60 s so it is already moving.

## Tested (2026-11-01, headless Chromium / SwiftShader)
- All nine cameras rendered at midday, dusk and night, plus the three events, a hush into rupture, an aged roof (75% rust), dry cracked asphalt and a wet lot. No console errors.
- **6 simulated hours (simulated weather):**
  - 12 events (8 lean, 4 sing), about one every 30 min
  - 5 ruptures, about hourly
  - no NaN
- **Resume:** a reload kept the epoch, the counts and the log.
- **Audio:** AudioContext suspend and close both recovered, and poisoning memory with NaN healed on the next frame.
- **16 s recordings in four conditions** (bands relative to 60–120 Hz; no clicks in any):

  | Condition | RMS | Peak | 2–5 kHz | above 5 kHz |
  |---|---|---|---|---|
  | day | −23.1 dB | −5.7 dBFS | −48 dB | −73 dB |
  | rain + the lines singing | −14.6 dB | −5.6 dBFS | −54 dB | −73 dB |
  | warm night | −27.2 dB | −15.1 dBFS | −52 dB | −75 dB |
  | hot day | −29.0 dB | −7.4 dBFS | −52 dB | −71 dB |

  60–120 Hz was the loudest band in every case.

## Known limits
- It has only been rendered in software (SwiftShader). GPU load on the streaming machine has not been measured; use `?lines=540` or `?lines=420` if it struggles. The scene is heavier than HEADLAND's, mostly because of the trees.
- In calm simulated weather the lean event is the one that most often qualifies. Live weather will vary this.
- Loudness follows the place: rain on the roof is about 14 dB louder than a still, hot afternoon.
- The building's thermostat is a model, not a measurement, and so are the lines' sag and sway.
