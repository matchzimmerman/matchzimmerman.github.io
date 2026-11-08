# MZTV · BIT FIELD 042 · MZ WORLD · BREAKWATER

A stone breakwater stands in the sea and takes every wave so the harbour behind it stays calm. From the harbour it is almost invisible. From the open water it looks like nothing but hardness. The world explores being misread as harsh and selfish for being plain and direct, while the whole job is shelter. Every event has two readings: the wall absorbs force (shelter for the boats), and that force arrives as spray, impact and noise. An observational crew of nine operators is asked, again and again, to classify the wall, and most of them answer "neither". The text is printed into the world in the same six inks. Built on HEADLAND's sea and OUTBUILDING's engine, with SRUTHÁN v3's surface-anchored hatching.

**Status:** published 2026-11-08. Awaiting MZ.Human's review.
**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-042-breakwater/
**OBS:** Browser Source → that URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?text=0` (hide the printed readings) · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (internal resolution, default 720; 420–540 for phones or weak GPUs) · `?ff=MIN` · `?hour=H` (start at the next real moment the world shows hour H) · `?cam=N` (hold one camera) · `?live=0` (simulated weather) · `?capture=1` (no rAF; drive with `MZ.tick(dt)` / `MZ.advance(sec)`)
**Keys:** **I** info · **M** mute · **R** a hand on the wall (pushes toward rupture) · **C** a hand chooses to say it plainly (the next branch is rain) · **D** a hand pulls the distortion off, so the tone is heard as it always was. R, C and D are logged as human intervention.
**Console:** `MZ.force('poll' | 'receipt' | 'report' | 'still' | 'glow' | 'breath' | 'hush' | 'storm' | 'rain' | 'rupture')` · `MZ.seekHour(h)` · `MZ.pull(bool)` · `MZ.weather({ salt, rust, clear })` · `MZ.say(lines)`

## Deliberate breaks from the HEADLAND standard
- **Unlocated.** The breakwater, harbour and shore are sculpted, not surveyed, and no real harbour is meant. Town-level Galway Bay coordinates (53.27°N, 9.05°W) drive the sun, the moon and the live weather. HEADLAND's marine point (53.2°N, 9.65°W) gives the live swell. The info box says `LOCAL`.
- **No walking bass.** The wall doesn't move, so the "central figure → bass degree" row becomes the wall's straight tone. That tone is the low end, and it never changes pitch: it stays on D2 through every rupture, while the harmonic centre of everything else moves.
- **Night lasts five minutes** (OUTBUILDING's world clock): real noon is world noon, the afternoon stretches into a long sunset, and the night passes in five real minutes around real midnight.
- **The world can overlay its own weather.** In the storm and rain branches, the world's storm or rain is laid over the live weather, and the info box marks it `(the world's)`.

## World
- **Place:** a 230 m cut-stone breakwater runs north from the south shore. Open sea lies to the west and a harbour to the east. It has a battered seaward face, a parapet, a paved walk with bollards, three iron ladders and four lamps, and a roundhead with a small white light at the north end. Armour rock is heaped along its seaward foot. Across the harbour are a slip, six houses and two shore lamps. A ridge lies far to the north, a far shore to the east, and low islands on the western horizon.
- **The sea:** Gerstner swell from the live swell height, period and direction, plus wind chop. A shelter field damps the waves behind the wall (by up to 93%), and shallow water damps them too. Foam runs along the armour's toe and around the head.
- **Weather:** Open-Meteo, polled every 15 min and slewed over minutes, with a simulated fallback shown on screen.
  - swell → impacts on the wall, spray, overtopping, and the bar length (0.55 × period, 4.0–6.6 s)
  - wind → chop, the grass, the halyards ringing on the masts
  - humidity → echo feedback, haze, and which way the world branches
  - rain → the print's rain, and a slow wash of the salt

## Life
- **The wall** is the central figure. Twenty probes along its seaward toe fire an impact each time a crest passes, which happens a few times a second in a moderate swell. Each impact throws spray, thumps through the lens, and goes on the record. Big ones (and set waves) come over the parapet. Some of that spray lands on the moored boats and rocks them. That cost is real, and it is logged: "spray came over the wall onto the boats".
- **Five boats** lie to their moorings, swinging head to wind and riding the damped harbour water. A sixth, **the working boat**, goes out through the mouth on fair days and comes back in under the wall before dark, before a big swell, or ahead of the storm.
- **Gulls** perch on the parapet, the bollards, the light, the boats' masts and the rock. They wheel in the storm and leave at night.
- From dusk the walk lamps and shore lamps light, and the house windows light and go out at times of their own. The harbour light flashes once every 4 s.

## The readings (text printed into the world)
The text is drawn on the print's own grid: an INK knock-out, then PAPER (or HOT) on top, in the live inks. No people and no names appear, only the system talking to itself.
- **The poll** (every 7–13 min): `NICE? — no reading` · `KIND? — no reading` · three operators' readings · `CAM 01: [no signal]`.
  - CAM 01 is the operator closest to the wall, on the walk. It never answers.
  - The other readings depend on each operator's distance and side, on how many impacts it has seen, and on how much calm it saw lately.
  - Most come back `neither`. Far and seaward operators say `harsh`, `cold`, `aggressive`, `selfish`, `blunt`. Near harbour operators sometimes say `protective` or `steady`.
- **The receipt** (with some polls, and whenever the harbour goes to glass): `REQUEST: last instance of shelter` · `RESULT: none on record` · `HARBOUR STATUS: calm`.
- **The wave report** (on a big impact, at most every 22 min): three readings of the same wave, `protective`, `aggressive`, `cold`, all with the same timestamp.
- **The message** comes in the branches: "rather than let it stew · it stung · I thought you would see me more clearly than that · I'm choosing sadness · rather than letting it grow into anger".

## Memory (lopsided on purpose)
- **Impacts are recorded; shelter is not.** Every impact increments a permanent count, and each operator that saw it keeps its own tally. The info box shows `IMPACTS on record n · SHELTER on record 0`, and the 0 is literal: shelter is never written down.
- **Calm is only remembered briefly.** Each operator's sense of the calm harbour fades over about 10 minutes, is not saved, and is gone after a reload. The impacts survive.
- **Salt crust** grows on the stone and rock with impacts (worst on the seaward face, the parapet and the paving edge), and with each storm. Real rain washes a little away, and the rain branch washes more.
- **Rust** runs down the harbour face from the iron and takes the bollards and ladders. Every harsh reading in a poll adds a little, and every storm adds more. It never recovers.
- **Clearness:** after the rain, the operators read the wall more truly for a while. `KIND? — faint reading` appears, and `kind` and `protective` come back more often. This fades with a half-life of about 1.5 h, faster while the source is dark.
- Each event remembers the hour, swell and wind it happened in, and recurs more readily under similar conditions. Repeats habituate.
- State lives in `localStorage` under `mzworld-breakwater-v1`, saved every 60 s and on unload.

## Cameras
CAM 01 PARAPET · 02 HARBOUR STEPS · 03 MOORINGS · 04 HARBOUR LIGHT · 05 SLIPWAY · 06 HEADLAND · 07 LONG LENS · 08 OPEN WATER · 09 ARMOUR.
- Operators hold and drift. The water operators ride the waves.
- The mixer cuts every 8–19 s on the 16th, weighted by the event: harbour operators for the glass, seaward ones in the storm, harbour and parapet ones in the rain. LONG LENS follows the last big impact, the working boat or the light.
- The number of each operator is the one the readings use.

## The uncanny
| Event | Conditions | What happens |
|---|---|---|
| The harbour goes to glass | swell ≥ 0.8 m outside, wind < 13 m/s | behind the wall the water stills to a mirror while the sea outside keeps breaking; ♭II chord and reverse swell; the receipt prints |
| The harbour side holds the light | sun between −1.5° and 18°, harbour calm | the harbour face of the wall warms into GLOW and HOT, a side the seaward operators never see; a high fifth in the room |
| The wall breathes | swell period ≥ 8 s | the seaward face swells and settles with the swell; a sub swells with it |

Each event has its own cooldown, and the global gap is 14–34 min.

## Rupture: storm or rain
- **Pressure** builds with stability (epochs of about 50–95 min), with each event (+0.07), and with each misreading in a poll (harsh +0.014, neither +0.007; protective and kind ease it).
- **The hold:** at 1, everything holds still. The sea goes to a mirror, the spray hangs in the air, the gulls stop, and the band drops out. Only the wall's straight tone is left.
- **Then the world branches.** The odds come from humidity, rain and wind, and from what it has learned: every storm and every rain makes the next rain a little more likely. Key **C** chooses rain.
  - **Storm** (anger), 2.5–3.5 min: the swell grows 2.3×, the wind rises and rain slants across. Waves come over the wall onto the boats. Every operator reads `harsh`, and the straight tone reaches all of them fully clipped. The message prints garbled, clipped and misregistered in HOT. Afterwards the rust and salt step up: "the storm confirmed every harsh reading".
  - **Rain** (sadness, named out loud), 2.5–3.3 min: a soft rain, and the pad stays. The straight tone reaches every operator undistorted. The message prints clean, one line per bar, and the rain washes some salt from the stone. Afterwards the operators read more clearly for a while.
- **Re-ink:** either way the print re-inks with a new colourway (weighted toward the least visited) and a new line grammar (period, dither, wobble, outlines, hatch, and course step). The harmonic centre moves, but the wall's tone does not.

**Colourways:** Salt Print (home), Storm Glass, Harbour Lamp, Slate Rain (new); Signal Flare, Pistachio Night, Ultramarine, Lichen (shared).

## Print
- The scene renders to a data target (shade, material id, carved line value, accent), and the print pass resolves it to six inks with ordered dither, speckle and outlines between materials.
- **New: the stone courses are the line grammar.** On the wall the lines sit on the 62 cm courses and step out to every 2nd, 4th… course with distance (×1–3 at rupture). Block joints are cut into the stone.
- **New: the readings are printed on the same grid** as the place. They misregister and garble when the air is harsh.
- Salt crust and rust are material changes, not overlays.

## Sound (the live lens is the microphone)
- **The wall's straight tone:** D2 with its octave and a little triangle. It is constant and never retunes. It splits into a clean path and a clipped, compressed path. The mix depends on the current operator's distance and side: near and harbour-side it arrives clean, far and seaward it arrives clipped and harsh. Storm → fully clipped, rain → fully clean. Key **D** pulls the distortion off.
- **Beds:** the sea outside (louder seaward, quieter on the harbour side because the wall is in the way), harbour lap, wind, rain, storm rumble, the working boat's engine.
- **One-shots:**
  - impacts (thump), spray over the wall (hiss)
  - halyards ringing on the masts, tuned to the scale
  - gulls
  - the readings typing (soft ticks, panned left); in the rain each line arrives with a tuned tink
- D phrygian family. The centre moves at rupture. A partial leans to a phrygian degree now and then, and a pad surfaces rarely and stays for the rain.
- **Events:** ♭II chord + reverse swell (glass), high fifth in the room (held light), sub with a breath (breathing wall).
- **Dub echo:** a unity-gain tanh loop whose feedback follows humidity. Convolution room.
- **Master:** HP 26 Hz → tanh → high shelf −10 dB @ 2 kHz → LP 6.8 kHz → glue compressor.

## Hardening
- Noise comes from an AudioWorklet (data: URL, blob fallback, long buffers as a last resort).
- One-shots are enveloped and self-disconnect, and their queue is bounded.
- The lookahead scheduler skips forward after stalls.
- A watchdog runs every 1 s: it resumes a suspended context, and rebuilds on close, a clock stall over 6 s, NaN or 20 s of silence. It also refreshes every 3 h.
- Memory, pressure, weather, boats and gulls self-heal from non-finite values.
- WebGL context loss is handled.
- The world is pre-warmed for 60 s, so it is already moving and the boats and gulls have settled.

## Tested (2026-11-08, headless Chromium / SwiftShader)
- All nine cameras rendered at 14:00, plus dusk and the five-minute night.
- Every event was forced: the glass, the held light, the breathing wall, the hold, the storm, the rain, a poll, a receipt and a wave report. The text layer printed clean (poll, rain) and garbled (storm). No console errors.
- **6 simulated hours (simulated weather, seed 7):**
  - 13 events (5 breath, 3 held light, 2 glass, plus 3 storms and 2 rains)
  - 5 ruptures, about hourly
  - 37 polls, about 23,500 impacts
  - salt 0.3 → 0.1 (washed by the rains), rust 0.16 → 0.25
  - no NaN; poisoning salt and pressure with NaN healed on the next step
- **Resume:** a reload kept the epoch, the inks, the impact count and the log.
- **Recovery:** AudioContext suspend and close both recovered. WebGL context loss and restore re-rendered correctly.
- **16 s recordings** (bands relative to 60–120 Hz; no clicks in any):

  | Condition | RMS | Peak | 120–500 Hz | 2–5 kHz | above 5 kHz |
  |---|---|---|---|---|---|
  | CAM 01, near (tone clean) | −17.6 dB | −10.2 dBFS | −10 dB | −58 dB | −81 dB |
  | CAM 06, far (tone clipped) | −19.6 dB | −8.3 dBFS | −8 dB | −54 dB | −77 dB |
  | storm | −23.2 dB | −6.1 dBFS | −2.5 dB | −47 dB | −65 dB |
  | rain | −19.6 dB | −10.2 dBFS | −3 dB | −51 dB | −76 dB |

  60–120 Hz was the loudest band in every case.

## Known limits
- It has only been rendered in software (SwiftShader). GPU load on the streaming machine has not been measured. Use `?lines=540` or `?lines=420` if it struggles.
- The shelter field, the overtopping odds and the readings are models, not measurements, and so are the boats' moorings.
- The text uses JetBrains Mono from Google Fonts. Until the font loads, the first reading prints in a fallback monospace.
- The clean/clipped difference in the tone is a change of timbre more than of level (see the near and far rows above). Key D makes it easiest to hear.
