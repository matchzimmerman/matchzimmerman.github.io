# MZTV / THE LAST FLIGHT

**Status:** runnable isolated MZTV browser-source prototype — **NOT** a validated aircraft digital twin, a wreck search, an evidentiary conclusion, a live worldwide broadcast, or a working phone number.

A reproducible 48-hour exploratory broadcast around Amelia Earhart and Fred Noonan's final Lae–Howland flight, using an explicitly *synthetic* kinematic model and 192 seeded hypothetical trials. Trajectory, endpoint occurrence, and aircraft-instrument views; editable counterfactuals never affect the baseline; optional generated engine/radio audio and a keyboard `*` switchboard. Every research conclusion remains open.

## Run locally

Static files, no build step. From this directory:

```bash
python3 -m http.server 8080
# Open http://localhost:8080/
```

Open `research.html` for source provenance, complete assumptions, constraints and explicit next-phase engineering gates.

## GitHub Pages + OBS

Path when deployed: `https://matchzimmerman.github.io/MZTV/sources/earhart-last-flight/`

For OBS, use a Browser Source with this URL (change `start` to your desired UTC launch time):

```text
https://matchzimmerman.github.io/MZTV/sources/earhart-last-flight/?obs=1&seed=19370702&start=2026-10-20T20%3A00%3A00Z
```

Set 1920×1080 in OBS; the `obs` parameter hides interface chrome and uses a full-bleed canvas. This OBS source is **not itself a Twitch broadcast**: OBS/Twitch streaming requires an explicitly configured output and an ongoing host session. The `start` parameter shares a deterministic UTC timeline across clients; their actual clocks should be synchronized. Nothing is stored server-side. The default (without `start`) starts/persists a **local** run via `localStorage`.

A browser page must remain loaded for a continuous feed. GitHub Pages does **not** execute a server-side 48-hour job; the image is produced by the client's browser. Hardware and browser sleep policies affect playback. Configure the OBS machine for continuous operation. The local `+ 2H PREVIEW` is a simulation-time offset; it does not alter a shared URL.

## Interactive functions

- **TRAJECTORY:** progressively releases 8 synthetic flights per 2-hour broadcast epoch, with active trajectory and hypothetical aircraft position.
- **OUTCOMES:** draws occurrence density of uncalibrated simulated terminal positions. **Not a crash-location probability map**.
- **INSTRUMENTS:** synthetic aircraft heading, fuel and radio-pattern graphics.
- **Sliders + RUN COUNTERFACTUAL:** generate 192 separate synthetic trials, overlaid in red, without modifying the seeded baseline.
- **EXPORT:** evidence-labelled CSV of released baseline trials and optional counterfactuals.
- **ENABLE AUDIO:** local WebAudio procedural engine/radio texture. No historical audio files.
- **SWITCHBOARD:** browser-only keypad, `*` opens it; 1 wind, 2 uncertainty, 3 fuel, 4 telemetry, 0 close. It does **not** connect to PSTN, DTMF, Twilio, or other callers.
- **COPY RUN URL:** same baseline random seed and UTC clock anchor for sharing.

## Flight-model boundaries

`model.js` includes: bearing/distance approximation, time-stepped position integration, synthetic north/east wind, assumed airspeed, assumed fuel quantity and constant fuel burn, assumed open-loop heading uncertainty, and a stylized 157°/337° search pattern from hour 18. None is calibrated to the actual Electra or July 2, 1937 weather. The geographic reference coordinates are approximate. The baseline 124 knots, 1070 US gal, 49 gal/h, 0 knots northward wind and 3° navigation uncertainty are **illustrative inputs, not historical assertions**. Even the random-draw distributions are arbitrary; the sample frequencies cannot become archaeological probabilities.

### Primary context references

- Smithsonian National Air and Space Museum: [missing for 80 years](https://airandspace.si.edu/stories/editorial/amelia-earhart-missing-80-years-not-forgotten) — Lae, Howland, planned 2,556 miles, 18-hour flight.
- Smithsonian: [Amelia Earhart collection](https://airandspace.si.edu/collection-objects/amelia-earhart/nasm_A19500108000) — world flight and radio history.
- [Purdue Earhart archival collection](https://www.purdue.edu/earhart/) — next-stage primary records and airplane engineering source material.
- [JSBSim reference manual](https://jsbsim-team.github.io/jsbsim-reference-manual/) — candidate full aerodynamic model, **not incorporated**.
- [NOAA bathymetry](https://www.ncei.noaa.gov/products/bathymetry) — potential survey evidence, **not incorporated**.

## Research delivery gate

Before producing meaningful search regions: validate an Electra-specific JSBSim model against recorded flights; audit original weather and radio evidence; index archival source provenance and rights; acquire/verify sonar, bathymetry, LiDAR or imagery and compare against prior search footprints; run sensitivity analyses and separate model assumptions from observations. Do not infer where the real airplane went from these trial counts.

## Test

```bash
node test-model.js
```

Tests verify deterministic output, bounded tank volume, monotonic fuel burn, finite coordinates, and effect of counterfactual input. This is a software sanity test, **not historical/physical validation**.