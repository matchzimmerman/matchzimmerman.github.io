# BIT FIELD 017 — ORBIT SCORE

The International Space Station flies its real orbit over a NASA relief map of Earth, and the ground passing beneath it plays the music. The camera follows the station, so the world scrolls under it. The station goes round every 92 minutes, and each orbit lands about 22.5° further west than the last.

The map is drawn from NASA's own relief texture. The texture's colours are read as data: blue is ocean (darker means deeper) and green through brown is land (lower to higher). Amber marks ice and high plateau. The night side is computed from the sun's real position, and a sun symbol marks the point where the sun is overhead. The solid line is the last orbit and the dotted line is the next. The dotted circle is the crew's horizon, everything the crew can see from about 420 km up. A heading-up **downlook** window (top right) shows about 1,100 km of ground directly beneath the station, turned so the direction of travel is up. The **strip along the bottom** is a slit-scan of the ground under the station: one full orbit, 20° across, newest at the right.

**Memory.** Every pass exposes the ground it crosses, like film, and each exposed cell keeps the note that played there. Exposure is drawn as burned scanlines: fresh passes are bright and older ones sink back. It fades with a half-life of two days, so over hours the passes weave a net across the ±52° band the station can reach. Memory changes what becomes possible:

- **Crew horizon** unlocks after one full orbit: a sweep turns inside the horizon circle.
- **Coast bell** unlocks after 10 landfalls: every coastline crossing rings a bell instead of a knock.
- **Past passes answer** unlocks once 12% of the band is exposed. Crossing an earlier pass replays the note heard there, through the dub delay, with a ring on the map where it was heard.
- **The net** unlocks at 40% exposed: the kick counts how many past passes lie inside the crew horizon.

**Eras.** Pressure builds as the station revisits ground it has already exposed. Once it's full, the era breaks at the next orbital sunrise or sunset. The new mode is set by what was unusual about the ground the last era flew over, compared with a running norm:

| More than usual… | Mode | Dither grammar |
|---|---|---|
| lowlands | PLUCK | Bayer |
| mountains | ARP | halftone |
| open ocean | BOW | line screen |
| coastlines | PULSE | stochastic |

A detected **reboost** is also a rupture: new orbit data showing the station's engines raised the orbit. The **beta angle**, the real angle between the orbit plane and the sun, sets the colour scope over days: NIGHTSIDE (low beta, long orbital nights), PHOSPHOR, or FULL SUN (high beta, when the station barely leaves sunlight).

**What controls what** (D Phrygian):

- **Latitude:** the drone's root, D2 in the far south up to A2 in the far north. A fifth-and-octave pad sits above it.
- **Daylight at the ground:** opens the filters and the pad.
- **Ocean in view:** sets the surf level; ocean depth makes it darker. Over open ocean the sea also has its own slow notes.
- **Land:** elevation sets pluck pitch, and terrain roughness sets how dense the plucks are. The current mode decides how they are played.
- **Coastline crossings:** a knock, or a bell once unlocked.
- **Station sunrise and sunset:** the moment the station itself leaves or enters Earth's shadow brings a chord swell, and sunset adds a long kick.
- **Kick density:** set by sunlight and, once the net unlocks, by the past passes in view.

**Data** (no keys, fetched live in the browser):

- **Orbit:** ISS (ZARYA), NORAD 25544, two-line elements from CelesTrak, falling back to tle.ivanstanojevic.me and then to the embedded set. Refreshed every 4 hours and propagated with SGP4 (satellite.js 5.0.0, MIT, inlined).
- **Map:** "Earth (A)" relief texture from NASA 3D Resources (github.com/nasa/NASA-3D-Resources), public domain, embedded.
- **Sun:** computed with a low-precision solar ephemeris.

The position is a prediction from the latest orbit data, the same method ISS trackers use. It's accurate to a few km within a day or two of the data's epoch. On the normal live clock the info box reads LIVE · CURRENT POSITION. With `?rate` above 1 it reads FUTURE POSITION PROJECTION and shows how far ahead of real time it is.

- **Stream:** https://www.matchzimmerman.com/MZTV/sources/bit-field-017-orbit-score/

Standalone piece: no mixer.

**Params:**

- `?info=0` hides the info boxes.
- `?fresh=1` restarts memory.
- `?audio=0` turns sound off.
- `?seed=N`
- `?rate=N` sets the clock speed. Memory goes to a separate `-sim` store.
- `?ff=H` pre-runs H extra hours of orbit memory before starting.
- `?lines=N`
- `?capture=1`

**Keys:** `i` info · `t` force a rupture
