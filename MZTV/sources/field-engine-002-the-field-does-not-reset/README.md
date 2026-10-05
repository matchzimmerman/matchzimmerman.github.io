# MZTV · FIELD ENGINE 002 · THE FIELD DOES NOT RESET

A data-driven FIELD ENGINE work built in the spatial rendering grammar established by **BIT FIELD 014 — SOUNDING**.

A rolling year of public incident records flagged as shootings is replayed chronologically into one evolving terrain. Each event enters at its recorded geographic position with the same initial force. There is no severity scaling, victim visualization, weapon imagery, street map, neighborhood labeling, or place-name display.

The terrain attempts to settle after each event, but does not return to its prior state.

## Behavior

- A rolling year of shooting-flagged public incident records is fetched from the official NIBRS Group A ArcGIS layer.
- Events are sorted by occurrence time and replayed proportionally across the performance.
- Geographic coordinates determine event position only.
- Each recorded event produces the same terrain impact and memory pressure.
- Impact energy decays while wear/scarring remains in the simulated ground.
- Accumulated impacts feed the same terrain-memory and rule-pressure systems that make SOUNDING evolve.
- Synthetic/random impact events from SOUNDING are disabled; recorded events are the only true impact source.
- The camera remains autonomous but slowly bends toward the next/recent disturbance rather than teleporting to it.
- After the final event, the altered ground remains onscreen. Looping is opt-in.

## Visual system

The work now uses SOUNDING's spatial language rather than the earlier flat FIELD ENGINE panel:

- low drifting camera
- ray-marched terrain
- contour strata and world-space hatching
- persistent impact scars
- long sun/moon shadows
- fog, cloud shadow, rain and atmospheric depth
- low-resolution four-ink rendering
- ordered / halftone / grain dither
- registration drift and temporal image smear
- visible plumb-line/ring traces for very recent impacts

The terrain is not a literal map. Geographic relationships become positions within the material world.

## Audio

The SOUNDING audio environment remains coupled to the same simulated terrain. Recorded impacts use its distance-aware impact system: an event is visible before it is heard when it occurs far from the camera, and the terrain beneath it changes the response.

## Controls

- `I` — toggle information overlay
- `SPACE` — pause / continue the yearly replay
- `R` — rebuild the ground and restart the year
- `T` — manually force a FIELD ENGINE rule transition

## Runtime parameters

- `?minutes=12` — compressed duration of the year
- `?hold=30` — minimum after-state duration
- `?days=365` — data window
- `?loop=1` — rebuild and replay after the hold; default is no loop
- `?audio=0` — disable audio
- `?info=0` — hide information overlay
- `?fresh=0` — allow saved terrain state; fresh ground is the default
- `?rate=N` — FIELD ENGINE evolution-rate multiplier
- `?lines=N` — internal rendering resolution
- `?capture=1` — offline/capture timing mode inherited from SOUNDING

Path:

`sources/field-engine-002-the-field-does-not-reset/index.html`

Live:

`https://matchzimmerman.github.io/MZTV/sources/field-engine-002-the-field-does-not-reset/`
