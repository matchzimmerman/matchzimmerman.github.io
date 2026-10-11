# MZTV · ARTEMIS II · ORION FIELD — Study 001
**Status:** Experimental browser prototype · 2026-10-10 · Not a canonical series title or a locked MZCMG identity.

**Live:** https://www.matchzimmerman.com/MZTV/sources/artemis-ii-orion/

## What it is
A generative audiovisual reconstruction of the Artemis II flight arc using authentic Earth-centered vectors for Orion and the Moon from NASA/JPL Horizons. A moving camera, 3D-derived 2D projection, stylized enlarged planetary discs, orbital traces, derived signals, and synthesised sound make the geometry of travel perceptible.

TRACKSIDE is a technical/experiential precedent, not a visual style to imitate. This first slice favors distance, time, and slow shifts over racing pace.

## Data: what is real
- `data/trajectory.json` contains Earth-centered Cartesian state vectors for **Artemis II / Orion (-1024)** and **Moon (301)**, retrieved from the [NASA/JPL Horizons API](https://ssd.jpl.nasa.gov/api/horizons.api) on 2026-10-10.
- Horizons reports the spacecraft trajectory source as `Artemis_II_merged`, and the lunar reference is `DE441`. It produces **geometric (uncorrected) Cartesian states**, in **J2000 ecliptic** frame, origin **Earth center 399**, **kilometers** and **kilometers per second**. It is a historical/reconstructed window, not live telemetry.
- The dataset covers **2026-04-02 03:58:51 UTC through 2026-04-10 17:58:51 UTC** (TDB timestamps transformed to approximate UTC, TDB–UTC ≈ 69.184 sec).
- 60-minute samples across the flight arc; extra 10-minute points for Apr 6 12:00 TDB to Apr 7 08:00 TDB. Sorted, deduplicated, linearly interpolated for rendering.
- The closest-approach sample is approximately **8,283 km center-to-center** near **2026-04-06 22:59 UTC**. This is computed from the sampled Earth-centered vectors; it is not a directly sourced official closest-approach altitude or event timestamp.
- NASA's separate flight ephemeris archive: https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/
- JPL spacecraft target identifier and post-flight coverage: https://ssd.jpl.nasa.gov/horizons/news.html

## What is artistic rather than observed
- The drawing is a **stylized geometric projection**, not a photograph, actual astronaut POV, or optically accurate simulation. Planetary disk sizes are greatly enlarged for viewing and their textures are procedurally generated.
- Camera transitions and framing are virtual; no claim of actual cameras traveling along the path.
- The audio is purely **generative sonification**, with oscillator frequency/level mapping to spacecraft-relative distances and velocity. Spaceflight does not transmit sound through vacuum.
- The Earth–Moon line and trails show vectors in a simplified, camera-relative view; not a navigationally actionable mapping.
- The title and presentation are provisional explorations, not an externally endorsed NASA work.

## Controls
- **Play/Pause** — time progression (default 15 mission minutes per second).
- **Camera** — DIRECTOR → ATLAS → LUNAR → ORION → DIRECTOR.
- **Sound** — user-initiated synthesized 4-voice ambient mapping (browser audio gesture requirement).
- **Rate** — 5 min/sec, 15 min/sec, 1 hr/sec, 3 hr/sec.
- **Timeline** — scrub recorded flight interval.
- **Info, Fullscreen** buttons.
- Keyboard: Space pause, arrows ±1 hr, C lens, M sound, I info, F fullscreen.

## URL / broadcast parameters
- `?fresh=1` — begin near lunar flyby rather than resume previously saved position
- `?t=0.53` — seek normalized 0..1 playback interval, or Unix UTC seconds for absolute time
- `?rate=3600` — custom mission seconds per wall-clock second
- `?audio=0` — hide audio output
- `?info=0` — hide editorial title
- `?capture=1` — suppress requestAnimationFrame to allow `window.MZ.tick(dtSeconds)` for capture/test

## Future build gates
1. Evaluate framing, pacing, sonification and first-hand visual experience on desktop/mobile/OBS before extending.
2. Verify key observations and integrate contextual **time-stamped** mission audio/images from [NASA's Oct 7 data release](https://www.nasa.gov/blogs/artemis/2026/10/07/nasa-releases-artemis-ii-lunar-science-data-images/), without implied fictional telemetry.
3. Improve camera choreography with actual on-screen cinematography cues and transitions; optional integration with MZCAM.
4. Do not turn this into a generic data dashboard or make the public MZCMG identity dependent on the candidate phrase “immersive data experiences”.

## Source reproducibility
Queries to NASA/JPL Horizons:
- `COMMAND='-1024'` (Orion) and `COMMAND='301'` (Moon)
- `CENTER='500@399'`, `EPHEM_TYPE=VECTORS`, `OUT_UNITS='KM-S'`, `VEC_TABLE='2'`
- `START_TIME='2026-04-02 04:00'`, `STOP_TIME='2026-04-10 18:00'`, `STEP_SIZE='60 m'`
- Additional sub-window `2026-04-06 12:00` through `2026-04-07 08:00`, `STEP_SIZE='10 m'`.
- `TDB` clock from Horizons transformed to approximate UTC. All timestamps in JSON are Unix epoch seconds UTC approx; positions in km and velocity km/s.
