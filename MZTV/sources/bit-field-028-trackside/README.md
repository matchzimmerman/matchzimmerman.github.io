# MZTV · BIT FIELD 028 · TRACKSIDE

A full Grand Prix replayed in real time, filmed by a crew of drone cameras.

**Live:** https://matchzimmerman.com/MZTV/sources/bit-field-028-trackside/
**OBS:** Browser Source → that URL · 1920×1080 · enable "Control audio via OBS"
**Params:** `?info=0` · `?fresh=1` (new life, starts on the grid) · `?audio=0` · `?bay=0` (hide the camera bay) · `?tower=0` (hide the timing tower) · `?rate=N` (replay speed) · `?t=SEC` (jump to a race time, testing; not saved) · `?lines=N` (internal resolution, default 540) · `?seed=N` · `?capture=1` (no rAF; drive with `MZ.tick(dt)`)
**Keys:** **I** info · **T** timing tower · **C** camera bay · **M** mute

## Versions
- `index.html` is **v2** (current). It adds a timing tower on the left:
  - order and position on track;
  - gap to the leader and interval to the car ahead, in seconds (or laps down);
  - last lap time and Δ to the car's own best (PB in lime);
  - the race's fastest lap highlighted;
  - PIT and OUT states;
  - ▲/▼ for cars involved in a pass in the last 10 s;
  - ◉ for each car that is currently in the live lens;
  - the followed car's row in pink.

  Gaps are computed from the replay itself: when the car ahead was at this car's distance, binary-searched on its distance column. At the flag the order and gaps come out as the real classification within a few hundredths (e.g. #27 +34.756 vs +34.742 official).
- `v1.html` is v1: same piece without the tower.

## Concept
Silverstone 2025: wet start behind the safety car, two VSCs, two safety cars, the switch to slicks, 52 laps. Every orb is a car carrying its own telemetry. Nothing is acted out; every position and every throttle trace is the race.

The cameras come from 48 PLANT, now a shared module (`MZTV/lib/mzcam.js`). The crew does what a broadcast crew does, with drones. It reads where the followed car will be in the next 10–30 seconds, sends a drone racing ahead to a mark at a key corner or straight, and cuts to it as the car arrives. The drone holds its position and whip-pans with the car through the corner. The director never cuts to a drone that is still moving, and cuts only on the 16th note of the music.

## The crew (five drones)
| drone | role | behaviour |
|---|---|---|
| CAM 1, 2 | trackside | marks at the 18 corners: OUTSIDE (34 m out, 9 m up), APEX (inside, 24 m in, 4 m up), HIGH (60 m out, 22 m up); stiff pan springs (quick pans), zoom keeps the car framed |
| CAM 3 | low | marks 11 m off the long straights at 1.4 m; very stiff pan, wide lens, the car whips past |
| CAM 4 | chase | rides 26 m behind and 8 m above the followed car |
| CAM 5 | high | orbits 240 m out, 150 m up, slow drift |

When nothing is on track (before the start, after the flag) the crew surveys the empty circuit.

**What it follows:** the closest battle near the front (gap under 1.1 s), the car that just overtook, or the leader, re-chosen at most every 40 s.

**Crew memory:** every trackside shot taken and every overtake near a key point is counted, and persists across reloads and runs. Over runs the crew favours the corners where things happen.

## Orbs: embedded data
- **Position:** distance along the lap, plus lateral offset from the racing line (pit lane included).
- **Colour:** cream; coral while braking; pink for the followed car.
- **Throttle:** a lime arc around the orb.
- **DRS:** a lime halo when open (rare in this wet race).
- **Speed:** a streak showing where the car was a quarter second ago.
- **Tags:** number · km/h · gear · throttle · BRK · DRS, for cars close to the lens.

## Sound: the live lens is the microphone
- **Engines:** one voice per car, saw + sub sine at half the firing frequency (kept under ~110 Hz). Pitch follows rpm with real Doppler from the live drone (approach raises pitch, receding lowers it), level and filter follow distance, and pan follows where the car is in frame. Every pass and every pan is heard.
- **Brakes:** a brake onset in front of the lens becomes a knock, quantised to the next 16th.
- **Overtake:** a D-phrygian stab thrown into the echo, with the feedback spiking.
- **Band:** a one-drop kick on 3. Bass in D phrygian: the followed car's gear picks the degree.
- **Flags:** green 58 bpm · VSC 52 · SC 48, with longer bass, more echo feedback and the pad rising.
- **Rain** (from the race weather feed): the room grows, plus a low noise bed under 400 Hz.
- **Drones:** a soft hum when near the lens.
- **Master:** HP 26 Hz → tanh saturation → high shelf −10 dB @ 2.2 kHz → LP 6.5 kHz → glue compressor.

Measured (40 s, mid-race), band energy relative to the loudest band:

| band | level |
|---|---|
| 20–120 Hz | 0 dB |
| 120–250 Hz | −12.5 dB |
| 250 Hz–1 kHz | −20 dB |
| 1–2 kHz | −33 dB |
| 2–5 kHz | −52 dB |
| above 5 kHz | −77 dB |

No clicks.

## Timescales
- **Seconds:** passes, whip pans, brake knocks, cuts on the 16th.
- **Minutes:** battles, overtakes, pit windows; VSC and safety-car periods slow the music and open space.
- **Hours:** the race lasts 1 h 39 min, then 90 s of empty circuit, then the grid forms again. Each run, the crew's corner memory differs, so the coverage differs.

## Data
- **Source:** [TracingInsights/2025](https://github.com/TracingInsights/2025) (FastF1-derived timing and car telemetry): `British Grand Prix/Race`.
- **Rebake:** `tools/bake_race.py RAW_DIR data/`. It projects every lap's X/Y onto a centerline built from the fastest clean lap, then writes 2 Hz columns per car.

`data/race.bin` packs these columns:

| column | type |
|---|---|
| distance delta | uint16, dm |
| lateral | int8, ¼ m |
| speed | uint8, 1.5 km/h |
| rpm | uint8, /60 |
| throttle | uint8 |
| flags | brake, DRS, gear |

`data/race.json` holds the track, cars, race-control events and weather.

**Not shown:** driver names (numbers only). The data is not live; it is one race, fixed.

## Persistence and hardening
- **State** (localStorage `mztv-bf028-trackside-v1`): replay epoch, run count, crew corner memory and log. A reloaded OBS source resumes at the same race moment.
- **Audio:** one AudioContext; continuously running oscillators; noise from an AudioWorklet (no looped buffers); one-shots enveloped and self-disconnecting; tanh in the echo loop (unity gain); lookahead scheduler that skips after stalls. Watchdog: resume, recreate on close or stall, rebuild on NaN or 20 s silence, refresh every 3 h.
- **Visual:** WebGL print pass (8-ink ordered dither) with context-loss recovery and a 2D fallback. NaN in the crew is sanitised.

## Tested (2026-10-10, headless Chromium/swiftshader)
- Grid, wet laps, safety car, finish and empty-circuit phases render. No console errors.
- Cuts land on drones on their marks, every 3–9 s.
- Reload resumes. NaN-poisoned drones recover. AudioContext suspend and close recover. WebGL context loss restores.

## Next
- Migrate 48 PLANT onto `mzcam.js`, so both share one crew.
- More races (any TracingInsights season/race rebakes with the same tool), chosen per run.
- A stream/play split with a mixer, per the MZTV build protocol, if this becomes a broadcast staple.
