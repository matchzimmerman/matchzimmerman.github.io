# BIT FIELD 016 — ONSHORE

A live field tuned to the September 2026 nor'easter, the rare early-season coastal storm hitting the East Coast from the Outer Banks to Maine over the weekend of 25–28 September. Everything on screen and in the sound comes from real, current data, fetched in the browser. The rendering is abstract: a radar scope that has started to dream.

The map runs from the Carolinas to Cape Breton. Isobars come from the live pressure grid, and they tighten into rings as the low deepens. Rain is drawn as a stepped radar ramp (green → yellow → orange → red → magenta) and cloud as a veil. Both are carried across the screen by the model's actual wind field, so the storm's comma shape wraps around the low by itself. The sea's swell lines run in the real wave direction at the real wave period. The dotted line is the model's forecast path for the next 48 hours. The solid line is where the low has actually been since the broadcast began.

**Memory.** The coast wears where onshore wind, waves and storm surge hit it, and worn segments glow in the coast colour. Rain stains the land it falls on. The low's track hardens into a line. All of this persists across reloads, so by Monday the map is a record of the storm. Once enough coast has worn, the coast starts to speak: when a worn segment is struck again it rings a low tone, pitched by latitude. If the low wanders back over its own path (a stalled nor'easter can wobble near the coast for days), the piece recognises it and throws an echo.

**Phases, from the storm itself.** The phase is read from the storm's own numbers: DEEPENING (pressure falling ≥0.8 hPa/3h), MATURE, STALLED (moving under 7 kt), FILLING, then AFTER. A phase change has to hold for 15 minutes before it counts. Each change is a rupture: the dither grammar dissolves into a new one over about 2.5 minutes, the colour scope changes, and the groove drops out while the echo throws. The scopes are NEXRAD NIGHT (navy, cobalt, hot-pink coast, cyan isobars), VELOCITY (violet sea, cyan coast, pink isobars), LOOP (teal and magenta, yellow isobars), DAYBREAK SCOPE (slate blue, white isobars, orange coast) and CLEAR AIR, a pale-sky scope for when the storm is gone.

**What controls what** (also shown live on screen):
- central pressure → the sub's pitch, D Phrygian (1000 hPa = D2; each hPa lower pulls it down 0.6 semitone) · also isobar density
- model peak gust → tempo · number of NWS alert types → kick density (Euclidean) · storm heading → knock rotation
- dominant wave period → one LFO that swells the sub and the tide chord, and the speed of the drawn sea
- surge at 6 NOAA tide gauges (water level minus astronomical tide) → one partial each of a low chord, panned by longitude
- onshore wind along the coast → wind noise level, filter and pan · rain → muffled drops into the dub delay
- onshore wind × waves × surge → coast wear (memory)

**Data** (no keys, all CORS-open, refreshed live):
- Open-Meteo forecast grid 32–47°N / 85–55°W at 1.5° (pressure, wind, gusts, rain, cloud), hourly, past 24h + next 72h. Refreshed hourly and cached, so reloads don't refetch.
- Open-Meteo marine: wave height, period and direction at 10 offshore points
- NOAA NWS: latest observations at KORF KBWI KACY KJFK KBOS KACK; active alerts NC→ME
- NOAA CO-OPS tide gauges: Sewells Point, Atlantic City, The Battery, Montauk, Boston, Nantucket

The low's position and pressure are derived from the model pressure grid (minimum plus quadratic refinement), so they are approximate. This is an artwork, not a forecast: see weather.gov.

When the storm leaves, the piece keeps running on whatever weather comes next. With no organised low it drops into AFTER / CLEAR AIR and keeps its memory of the storm.

- **Stream:** https://www.matchzimmerman.com/MZTV/sources/bit-field-016-onshore/

Standalone piece: no mixer.

Params: `?info=0` `?fresh=1` `?audio=0` `?seed=N` `?rate=N` (clock speed; memory goes to a separate `-sim` store) `?ff=H` (shift the clock ±H hours inside the data window) `?lines=N` `?capture=1`
Keys: `i` info · `t` force a rupture
