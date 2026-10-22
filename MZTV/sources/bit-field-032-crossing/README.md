# MZTV · BIT FIELD 032 · MZ WORLD · CROSSING

A tidal river and a cable ferry on Maryland's Eastern Shore, printed. Built on HEADLAND's engine, including its linocut-through-OBAS print pass, observational crew, dub engine, memory and rupture. The place, the people and the uncanny are all new.

**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-032-crossing/
**OBS:** Browser Source → that URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?seed=N` · `?rate=N` · `?lines=N` (internal resolution, default 720) · `?ff=MIN` · `?hour=H` (start at local hour H, testing) · `?cam=N` (hold one camera, testing) · `?live=0` (simulated weather) · `?capture=1` (no rAF; drive with `MZ.tick(dt)` / `MZ.advance(sec)`)
**Keys:** **I** info · **M** mute · **R** hand on the river (pushes toward rupture; logged as a human intervention)
**Console:** `MZ.force('empty' | 'turn' | 'breath' | 'bell' | 'rupture')`

## World
- **Place:** a 240 m tidal river through salt marsh.
  - The near (east) bank has a road down to a slip, a small ferry house, and two houses.
  - The far (west) bank has its own slip and a white church on a low knoll, plus two houses.
  - In the river: piling dolphins at both slips, a duck blind on stilts, channel markers and an osprey platform.
  - Tree lines close the horizon.
- **Time:** real Eastern time. Sun and moon positions are computed for 38.27°N 75.79°W, and the sun sets behind the church.
- **Tide:** a semidiurnal model (M2 + S2 + a diurnal wobble). It raises and lowers the whole river, floods the marsh edges, and sets the current.
- **Weather:** Open-Meteo for the site, polled every 15 min and slewed over minutes. When it's unreachable, a simulated fallback runs and is labelled on screen.
  - wind → chop direction and height, wave slaps on the pilings, cloud drift, the wind bed
  - cloud → sky and light
  - humidity and rain → haze distance, echo feedback, rain streaks

## Inhabitants
- **The ferry** hauls itself along a cable. The cable lies on the riverbed and rises through the ferry's sheaves as it passes.
  - It crosses only when someone is aboard or waiting on the other side. Ramps drop at the slip and lift for the crossing.
  - A running tide slows it.
- **The ferryman** works from about 06:00 to 19:30 local time.
  - He stands by the cabin, walks to the ramp to bring cars aboard, and faces the way he's going.
  - At night he ties up on the near side and goes into the ferry house, and its lamp comes on.
- **Cars and walkers** arrive at both landings, with peaks around 08:00 and 17:00.
  - They queue, board, ride across, and drive or walk off up the far road.
  - After hours they come to a dark landing, wait, and turn back. Their headlights come on at dusk.
- **Five herons** stand and stalk in the shallows and strike at the water. If the ferry comes within about 26 m they lift off with a croak and settle somewhere else.
- **Two ospreys** soar over the river, dive and hit the water, and perch on the nest platform.

## Memory
- **Arrivals:** the crossing remembers how many people arrive at each landing in each hour of the day. If the ferry sits idle on the quiet side at an hour when the other side is usually busy, the ferryman crosses empty to wait there.
- **Counts:** crossings, people carried and people turned back are all kept.
- **Uncanny events:** each event remembers the hour, tide and wind it happened in, and recurs more readily under similar conditions. Repeated events habituate.
- **Persistence:** state is saved to localStorage (`mzworld-crossing-v1`) every 60 s and on unload.

## Cameras (observational)
LANDING · DECK · FERRYMAN · FAR BANK · LONG LENS · MARSH · OSPREY. Operators hold and drift. The mixer cuts every 8–19 s on the 16th note, weighted by what's moving (deck cameras while crossing, the landing while boarding). It doesn't cut to the story.

## The uncanny
Rare events where the river is alive. The global gap between them is 14–34 min.

| Event | Conditions | What happens |
|---|---|---|
| Empty ferry | dusk or night, the ferry tied up and empty, wind < 8 m/s | a second, ink-dark ferry crosses the cable toward the real one, stops short and sinks; a ♭II chord and a reverse swell |
| Herons turn | ≥3 herons standing while the ferry crosses | every heron turns slowly to face the ferry and holds its neck still; a high fifth in the room |
| River breath | slack water, wind < 7 m/s | the river rises and falls 0.75 m on a 38 s cycle, flooding the marsh edge; a sub swells with it |
| Bell | sun within ±9° of the horizon | the church windows light and the bell tolls every other bar with nobody there |

## Rupture
Tension builds with stability (epochs of about 50–95 min) and with each event. At 1 the river stands still: the water flattens to a mirror and the band drops out. Then the print re-inks with a new colourway (weighted toward the least visited), a new line grammar and a new harmonic centre.

**Colourways:** Marsh Signal (home), Oyster Radio, Crab Shell, Spartina, Signal Flare, Pistachio Night, Ultramarine, Tide Table.

## Sound (the live lens is the microphone)
D phrygian family; the centre moves at rupture.
- **Tide:** bar length is 4.0 s on a running tide and up to 6.4 s at slack, so the music slows when the water stops.
- **Ferry:** its position across the river picks the bass degree as it walks over. A sheave knock on 5 and 13 while hauling, panned to where the ferry is in frame. Cable strain is a low band-passed rumble.
- **Boarding and landing:** cars boarding and the ferry landing make low thumps.
- **Water:** wave slaps on pilings and banks become thumps on the 16th, more of them in the ferry's wake.
- **Birds:** heron croaks are low and band-passed. Osprey hits are thumps with spray.
- **Beds:** the river bed follows current and chop. Wind and rain beds follow the weather.
- **Harmony:** drone, pad chords every 4 bars, a dub echo with a unity-gain tanh loop, and a convolution room.
- **Master:** HP 26 Hz → tanh saturation → high shelf −10 dB @ 2 kHz → LP 6.8 kHz → glue compressor.

## Hardening
The same as HEADLAND:
- AudioWorklet noise, enveloped one-shots that disconnect themselves, and a lookahead scheduler that skips after stalls.
- A watchdog resumes or rebuilds the audio graph on close, a stalled clock, NaN or 20 s of silence, and refreshes it every 3 h.
- Agents self-heal from non-finite state, and WebGL context loss is handled.
- The sim is pre-warmed on load, so it was already running when you arrived.
