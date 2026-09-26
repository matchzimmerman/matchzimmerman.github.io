# LIVE CODE 003 — JAZZ SYSTEMS STUDY

MZTV autonomous audiovisual broadcast source.

This piece treats mid-century jazz theory as a set of computational problems rather than a style preset. The displayed code exposes the actual state used by the sound and visual engines.

## Musical regimes

- **BEBOP / Parker + Gillespie** — harmonic velocity, chromatic pressure, approach tones, ii–V motion.
- **MODAL / George Russell + Miles Davis + Bill Evans** — reduced harmonic velocity, tonal gravity, sustained fields.
- **PERMUTE / John Coltrane** — motive transformation, permutation depth, major-third root cycles.
- **SPACE / Thelonious Monk** — silence, asymmetry, semitone/tritone collision, sparse events.
- **COLLECTIVE / Charles Mingus** — independent agents interacting inside shared form.
- **FREE / Ornette Coleman** — chord constraint drops away; contour, density and listening become organizing forces.

The regimes are not a playlist of presets. Accumulated conditions cause the system to move from one theoretical problem to another.

## MZTV / OBAS visual rules

- permanent horizontal code / visual split
- four-color palette only
- integer low-resolution render scaled with nearest-neighbor
- hard threshold bands + ordered Bayer dithering
- organic/folded topology instead of generic particles
- no gradients, glass UI, cyberpunk glow, card dashboard, or decorative widgets
- code changes because the engine changes; inline meters report live state
- sound and image share state and event consequences

## Runtime

https://www.matchzimmerman.com/MZTV/sources/live-code-003/

Testing:
- \`?rate=2\` — musical clock at 2×
- \`?rate=4\` — faster theory/regime testing
- \`?autoplay=1\` — asks browser to begin audio automatically; browser policy may still require a click

For normal browser playback, click once anywhere to enable audio.

Recommended OBS browser source: 1920 × 1080, audio enabled.
