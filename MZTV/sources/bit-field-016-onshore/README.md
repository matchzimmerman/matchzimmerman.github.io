# BIT FIELD 016 — ONSHORE

A live field tuned to the September 2026 nor'easter, the rare early-season coastal storm hitting the East Coast from the Outer Banks to Maine over the weekend of 25–28 September. Everything on screen and in the sound comes from real, current data, fetched in the browser. The rendering is abstract: a radar scope that has started to dream.

The map runs from the Carolinas to Cape Breton. Isobars come from the live pressure grid, and they tighten into rings as the low deepens. Rain is drawn as a stepped radar ramp (green → yellow → orange → red → magenta) and cloud as a veil. Both are carried across the screen by the model's actual wind field, so the storm's comma shape wraps around the low by itself. The sea's swell lines run in the real wave direction at the real wave period. The dotted line is the model's forecast path for the next 48 hours. The solid line is where the low has actually been since the broadcast began.

**Memory.** The coast wears where onshore wind, waves and storm surge hit it, and worn segments glow in the coast colour. Rain stains the land it falls on. The low's track hardens into a line. All of this persists across reloads, so by Monday the map is a record of the storm. Once enough coast has worn, the coast starts to speak: when a worn segment is struck again it rings a low tone, pitched by latitude. If the low wanders back over its own path (a stalled nor'easter can wobble near the coast for days), the piece recognises it and throws an echo.

**Phases, from the storm itself.** The phase is read from the storm's own numbers: DEEPENING (pressure falling ≥0.8 hPa/3h), MATURE, STALLED (moving under 7 kt), FILLING, then AFTER. A phase change has to hold for 15 minutes before it counts. Each change is a rupture: the dither grammar dissolves into a new one over about 2.5 minutes, the colour scope changes, and the groove drops out while the echo throws. The scopes are NEXRAD NIGHT (navy, cobalt, hot-pink coast, cyan isobars), VELOCITY (violet sea, cyan coast, pink isobars), LOOP (teal and magenta, yellow isobars), DAYBREAK SCOPE (slate blue, white isobars, orange coast) and CLEAR AIR, a pale-sky scope for when the storm is gone.

**On screen:**
- **top left:** what the forecasters say. The Key Messages (or Synopsis) and "what changed" from the latest NWS Area Forecast Discussions for Boston, New York, Philadelphia/Mt Holly and Wakefield VA, rotating every 40 s. Refreshed every 20 min. A new discussion is also logged.
- **bottom left:** the storm in numbers: the low's position, pressure and trend, movement, distances, gusts, waves, station obs, surge, next high tide and NWS alerts.
- **bottom right:** the legend (what every mark means) and what the sound is following.
- **top right:** the evolution log.

The view fills whatever frame it's in, with no letterbox. Wide frames show more east–west and tall frames more north–south. Memory is kept on a fixed geographic grid, so reshaping the frame never scrambles it.

**What controls what:**
- central pressure → the sub's pitch, D Phrygian (1000 hPa = D2; each hPa lower pulls it down 0.6 semitone) · also isobar density
- model peak gust → tempo · number of NWS alert types → kick density (Euclidean) · storm heading → knock rotation
- dominant wave period → one LFO that swells the sub and the tide chord, and the speed of the drawn sea
- surge at 6 NOAA tide gauges (water level minus astronomical tide) → one partial each of a low chord, panned by longitude
- onshore wind along the coast → wind noise level, filter and pan · rain → muffled drops into the dub delay
- onshore wind × waves × surge → coast wear (memory)

**Data** (no keys, all CORS-open, refreshed live):
- Open-Meteo forecast grid 32–47°N / 85–55°W at 1.5° (pressure, wind, gusts, rain, cloud), hourly, past 24h + next 72h. Refreshed hourly and cached, so reloads don't refetch.
- Open-Meteo marine: wave height, period and direction at 10 offshore points
- NOAA NWS: latest observations at KORF KBWI KACY KJFK KBOS KACK; active alerts NC→ME; Area Forecast Discussions (BOX, OKX, PHI, AKQ)
- NOAA CO-OPS tide gauges: Sewells Point, Atlantic City, The Battery, Montauk, Boston, Nantucket

The low's position and pressure are derived from the model pressure grid (minimum plus quadratic refinement), so they are approximate. This is an artwork, not a forecast: see weather.gov.

When the storm leaves, the piece keeps running on whatever weather comes next. With no organised low it drops into AFTER / CLEAR AIR and keeps its memory of the storm.

- **Stream:** https://www.matchzimmerman.com/MZTV/sources/bit-field-016-onshore/

Standalone piece: no mixer.

Params: `?info=0` `?fresh=1` `?audio=0` `?seed=N` `?rate=N` (clock speed; memory goes to a separate `-sim` store) `?ff=H` (shift the clock ±H hours inside the data window) `?lines=N` `?capture=1`
Keys: `i` info · `t` force a rupture

## Recording into Ableton: stems + MIDI (branch `stems`)

Open the piece in **Chrome** with these parameters. Without them, nothing changes.

- `?stems=16&sink=blackhole`: multichannel output to BlackHole 16ch. Each voice gets its own stereo pair, taken before the master bus:
  `1/2 master · 3/4 sub · 5/6 kick · 7/8 perc (knock + coast) · 9/10 wind · 11/12 tide chord · 13/14 drops · 15/16 fx returns (delay + reverb)`.
  Chrome asks once for audio permission. That is only so it can show device names; the mic is never used. If the device offers fewer channels, the piece uses what it has, in that priority order.
- `&midi=iac`: sends to the IAC Driver bus (enable it in Audio MIDI Setup):
  - MIDI clock at 24 ppqn, following the storm's tempo, with Start on the first downbeat
  - ch1 kick (36, and 35 for the rupture boom)
  - ch2 knock
  - ch3 drops
  - ch4 coast voice
  - ch5 the sub note (held; changes when the pressure moves it)
  - ch16 CCs, updated once a second:
    - 1 pressure depth
    - 2 gust
    - 3 rain
    - 4 onshore wind
    - 5 wave height
    - 6 intensity
    - 7 wave period
    - 20–25 surge at Norfolk, Atlantic City, the Battery, Montauk, Boston and Nantucket
- A small **RECORDING OUTPUTS** panel (top centre, `i` hides it) shows the device, channel map, per-stem meters and MIDI status.

In Ableton: set Preferences → Audio → Input Device to BlackHole 16ch and enable inputs 1/2 to 15/16 as stereo pairs. Make one audio track per pair with monitoring Off, and arm them all. For the MIDI, set Preferences → Link/Tempo/MIDI → IAC Driver: turn on Sync (to follow the storm's tempo) and Track (to record notes and CCs on MIDI tracks).

This runs as its own instance with its own memory (its own browser storage). The data-driven parts (pressure, gusts, surge, rain, phases) match the broadcast. The small random details (knock placement, drops) do not.
