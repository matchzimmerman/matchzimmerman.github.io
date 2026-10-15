# MZTV · BIT FIELD 031 · MZ WORLD · HEADLAND

A living coast off Galway Bay, printed. Cliffs, sea stacks, a pier, a stair down a gully and a cottage path, drawn every frame as carved linocut lines that follow the form of each surface and resolve into six OBAS inks. Its inhabitants keep their own errands and an observational camera crew films them. Now and then the landscape itself is alive.

**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-031-headland/
**OBS:** Browser Source → that URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (internal resolution, default 720) · `?ff=MIN` (start the clock MIN minutes ahead) · `?hour=H` (start at Galway hour H, testing) · `?cam=N` (hold one camera, testing) · `?live=0` (simulated weather) · `?capture=1` (no rAF; drive with `MZ.tick(dt)` / `MZ.advance(sec)`)
**Keys:** **I** info · **M** mute · **R** hand on the headland (pushes toward rupture; logged as human intervention)
**Console:** `MZ.force('eye' | 'breath' | 'stack' | 'wreath' | 'hush' | 'reach' | 'rupture')`

## World
- **Place:** a headland above Inverin, Co. Galway. The west headland, a far headland with three cottages, four sea stacks, a gully with a wooden stair down to a rock landing, a 62 m pier, a path to the keeper's cottage. Distant hills across the bay and low islands to the west.
- **Time:** real Galway time. Sun and moon positions are computed for 53.24°N 9.48°W; the moon carries its real phase.
- **Weather:** Open-Meteo for Galway Bay, polled every 15 min, slewed over minutes. Simulated fallback when unreachable (shown on screen).
  - swell height, period, direction → Gerstner sea, shore impacts, bar length
  - wind speed, direction → chop, cloud drift, gulls, the keeper's veil, wind bed
  - cloud cover → sky, light, glint
  - humidity, rain → haze distance, echo feedback, rain streaks, the keeper goes indoors

## Inhabitants
- **The keeper:** a long black veil, fabric in the shape of a figure. Walks errands along one trail: house → cliff edge → stair → landing → pier. Watches sunsets from the pier end, goes in at night and in heavy rain. The dress and veil move with live wind and with walking.
- **The boat** goes out to fish in daylight when the sea allows, and comes home.
- **Gulls** soar, follow the boat, perch on the stacks and pier rails.
- **A seal** surfaces by the pier and looks at the keeper.

## Cameras (observational)
HEADLAND · PIER · KEEPER · GULL · LONG LENS · STAIR · CLIFF FACE. Operators hold and drift; the mixer cuts every 8–19 s on the 16th note, weighted by what is moving. It does not cut to the story; an event may or may not be in frame.

## The uncanny
Rare events where the landscape is alive. Each needs its conditions, has its own cooldown, and the global gap is 14–34 min.
| Event | Conditions | What happens |
|---|---|---|
| Sun eye | sun low (or moon up at night) and the keeper standing still watching, or a calm sea under a low sun | an eye opens in the sun (or moon), follows the keeper, blinks; a reverse swell and a ♭II chord |
| Breath | swell period ≥ 8 s, nobody on the stair | the cliff faces inflate and settle with the swell; a sub swells with them |
| Stack | boat out or seal up | the largest stack turns toward it and opens two hollows; stone grinds and knocks |
| Wreath | ≥5 gulls aloft, wind < 11 m/s, sun or moon up | the gulls draw a ring around the light; a high fifth in the room |
| Pier reach | some nights, nobody on it | the pier grows bays out to sea over hours and draws back by dawn |

**Memory:** each event remembers the hour, swell and wind it happened in, and recurs more readily in similar conditions; repeated events habituate. Counts, colourway visits and the log persist.

## Rupture
Tension builds with stability (epochs ~50–95 min) and with each event. At 1, the sea holds its breath (waves flatten to a mirror, the band drops out), then the print re-inks: new colourway (weighted toward the least visited), new line grammar (period, dither, wobble, outlines), new harmonic centre.

## Print
Scene renders to a data target: shade, material id, screen-space line angle (from each surface's world tangent: rock vertical veins, crests along the swell, wood along the grain, grass bent by wind), accent veins. The print pass carves lines by tone, adds ordered dither and speckle, outlines between materials, and resolves to six inks (INK, DEEP, SEA, HOT, GLOW, PAPER). Colourways: Atlantic Print (home), Bruise, Kelp & Salmon, Signal Flare, Rust Tide, Pistachio Night, Ultramarine, Lichen.

## Sound (the live lens is the microphone)
D phrygian family, centre moves at rupture. Sea bed (brown noise per side, following the swell at the shore near the camera) · waves striking rocks → low thumps on the 16th, panned to where they are in frame · Euclidean kick · bass whose degree is chosen by where the keeper is · drone · three-voice pad (chord every 4 bars, brighter when warm) · wind and rain beds · gull calls from birds in frame · dub echo with a unity-gain tanh loop, feedback from humidity · convolution room. Bar length = 0.55 × swell period (4.0–6.4 s).
Master: HP 26 Hz → tanh saturation → high shelf −10 dB @ 2 kHz → LP 6.8 kHz → glue compressor.

## Hardening
Noise from an AudioWorklet (data: URL, blob fallback, long buffers as last resort). One-shots enveloped and self-disconnecting. Lookahead scheduler skips after stalls. Watchdog every 1 s: resume when suspended; rebuild on close, clock stall > 6 s, NaN or 20 s silence; refresh every 3 h. Agents self-heal from non-finite state. WebGL context loss handled. State in localStorage (`mzworld-headland-v1`) every 60 s and on unload; an OBS reload resumes the same epoch and memory.

## Tested (2026-10-15, headless Chromium/swiftshader)
- All seven cameras at day, dusk and night; every event forced and rendered; rupture re-inks.
- 6 simulated hours: events about every 23 min, ruptures about hourly, no NaN, no console errors; reload resumes.
- 20 s recording: −17.7 dB RMS, −8.5 dBFS peak; 60–120 Hz loudest, 2–5 kHz ~50 dB down, above 5 kHz ~70 dB down; no clicks.
- AudioContext suspend and close both recover.
