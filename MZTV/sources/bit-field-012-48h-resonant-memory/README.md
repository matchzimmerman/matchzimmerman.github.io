# MZTV / 48H RESONANT MEMORY 012

A 48-hour browser-based MZTV performance system derived from the recent resonant/cymatic and OBAS field experiments.

This is not a fixed loop. It is a persistent audiovisual organism whose sound and image are generated from the same evolving state variables: pressure, density, tension, resonance, motion, brightness, and strain.

## 48-hour form

The performance has eight six-hour macro tides:

1. OPEN
2. GATHER
3. TORSION
4. BLOOM
5. HOLLOW
6. INTERFERENCE
7. RUPTURE
8. AFTERIMAGE

These tides are not prerecorded scenes. They bias the procedural system while four-minute state cells continuously alter nodal modes, deformation, harmonic position, event type, density, and rhythmic behavior. The exact field remains generated in real time.

The performance start time and seed are stored in localStorage. Refreshing the browser resumes the current position in the 48-hour performance rather than returning to zero. After 48 hours, the system advances to a new seeded run.

## Visual system

- 320×180 internal simulation scaled to 1920×1080 with nearest-neighbor rendering.
- Maximum four colors per frame.
- Hard thresholding and ordered dithering only; no gradients or antialiasing.
- Chladni/nodal interference modes combine with moving attractors, torsion, shear, folds, splits, bends, and interference states.
- Recent modes are avoided when possible so the field develops memory rather than cycling through a short random catalog.
- No broad soft blobs; the image stays contour-, line-, node-, and lattice-driven.

## Audio system

- Continuous low-frequency sub layer.
- Softened sine kick pressure with rounded envelopes to avoid clicks.
- Reverse low-frequency pulls rather than bright reverse transients.
- Wobble layer that emerges as shared motion/resonance increases.
- Saturated higher harmonic bed roughly an octave above the low-end activity.
- Common-tone harmony moves through Dm9, G6/9, Cmaj9, Am9, Em11, and F6/9.
- Aggressive high-frequency content is intentionally absent; the master chain is low-pass filtered, gently saturated, and compressed.
- Audio and image share causes instead of merely reacting to one another beat-by-beat.
- Audio watchdog attempts to recover from suspended/failed browser-audio states during long OBS runs.

## Live source

https://matchzimmerman.github.io/MZTV/sources/bit-field-012-48h-resonant-memory/

## OBS

Use the live URL as a 1920×1080 Browser Source.

URL options:

- ?hud=0 hides the system display.
- ?audio=0 prevents automatic audio startup.
- ?reset=1 starts a new 48-hour performance seed.

Keyboard controls:

- H — toggle HUD
- R — reset/start a new 48-hour performance
- Space — start/resume audio

## Canon

The browser source is the score/instrument. A 48-hour MZTV broadcast run is a distinct performance/realization. The persistent state allows the work to survive browser refreshes while continuing its long-form trajectory.
