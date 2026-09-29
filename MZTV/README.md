# MZTV

Canonical source library for MZTV broadcast experiments, OBS control scripts, live browser sources, and transmission assets.

## Structure

- `obs/` — OBS Lua/Python control and director scripts
- `sources/` — browser-rendered visual sources for OBS
- future directories may include `overlays/`, `idents/`, `archive/`, and `audio/`

## Current sources

### BIT FIELD 001
A continuously evolving OBAS/Bit System visual field intended for use as an OBS Browser Source.

Path:
`sources/bit-field-001/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-001/`

### BIT FIELD 002 — DUB
Generative MZTV transmission source with a large evolving pixel-built MZTV mark, low-key dub audio, rolled-off high end, sub/bass movement, filtered chord stabs, and dub delay.

Path:
`sources/bit-field-002-dub/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-002-dub/`

### BIT FIELD 003 — WEATHER TRIAD
Live-data MZTV source driven by Baltimore, Galway, and London. Open-Meteo current temperature, dew point, wind speed, and wind direction plus each city's local time modulate color, pixel density, drift direction, typography behavior, tempo, bass voicing, filtered chord activity, stereo position, and dub delay depth.

Path:
`sources/bit-field-003-weather-triad/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-003-weather-triad/`

### BIT FIELD 004 — LIVE CONTROL FIELD
Live weather-control field with an autonomous MZTV glyph system, control-capture log, mapping meters, local city clocks, and weather-driven audiovisual modulation.

Path:
`sources/bit-field-004-live-control/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-004-live-control/`

### BIT FIELD 005 — SIGNAL ATLAS
Dense WebGL weather instrument modeled on the MZTV Live Weather Triad graphic. Roughly 40,000 live points form and deform the central MZTV signal while Baltimore, Galway, and London drive color, movement, particle density, glyph rupture, dub audio, live graphs, compasses, system logs, and engine meters.

Path:
`sources/bit-field-005-signal-atlas/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-005-signal-atlas/`

### BIT FIELD 012 — 48H RESONANT MEMORY
Persistent 48-hour audiovisual organism derived from the recent resonant/cymatic and OBAS field studies. Shared pressure, resonance, density, tension, motion, brightness, and strain drive both sound and image across eight six-hour macro tides, with four-minute generated state cells and browser-persistent performance time.

Path:
`sources/bit-field-012-48h-resonant-memory/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-012-48h-resonant-memory/`

### BIT FIELD 013 — SUBSTRATE
Morphogenetic reaction–diffusion field in D Phrygian dub. The field's coverage, edges, anisotropy and centroid drive sub, knock, pan and dub feedback; kicks seed new growth; a sediment layer records where forms have lived and feeds back into the chemistry. Settled states are stored as impressions and recognised across epochs; accumulated stability (or collapse, saturation, recognition, or a human R keypress) triggers rupture — new regime, palette, meter, harmonic center and visual grammar (ordered dither / halftone / line screen). Memory persists across reloads. Params: `?autostart=1` `?hud=0` `?speed=N` `?reset=1`.

Path:
`sources/bit-field-013-substrate/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-013-substrate/`

### BIT FIELD 014 — SOUNDING
A low camera drifts across a ground that remembers where it has been. A live field simulation on a torus (ridges, erosion, drift, waves, terraces, uplift, faults, flood, canopy) whose governing rules mutate over hours under accumulated pressure; new rules unlock from memory. The camera's path hardens the ground and becomes ridges or canyons; impacts leave scars that attract later impacts. A sun orbits every 38 minutes (golden-hour palette, long shadows, moonlit night) and weather drifts through (cloud shadows on the same wind as the dunes, rain, haze). Dub audio shares the environment: the bass reads the terrain ahead, height above ground opens the filter, impacts are seen first and heard later by distance. State persists across reloads. Params: ?info=0 ?fresh=1 ?audio=0 ?rate=N ?lines=N

Path:
sources/bit-field-014-sounding/index.html

Live:
https://matchzimmerman.github.io/MZTV/sources/bit-field-014-sounding/

### BIT FIELD 015 — STIGMERGY
Tens of thousands of agents on a torus lay trail and follow trail, and transport networks form out of that feedback alone. The camera looks down through three stacked planes: the live trail, the channels it has worn (minutes up, an hour down) and the deep sediment (hours), with parallax and low-light shadows between them. Memory steers the agents, thickens worn routes into trunks, and brings old sediment hubs back as food. A packet rides the strongest vein and the camera follows it. The sub-bass line is the vein under the packet, a vein entering earshot is a pluck ringed where it appears, and a junction it crosses is an accent. Coverage drives the kick, loops extend the chords, and channel depth feeds the echo (D Phrygian home). Rules mutate over hours under pressure from stasis, saturation and retracing: network, meander, knots, streams, cells, plus reinforcement, food, a second colony and cuts, all unlocked from memory. Standalone stream, no mixer. State persists across reloads. Params: ?info=0 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?lines=N ?agents=N ?ff=H ?capture=1

Path:
sources/bit-field-015-stigmergy/index.html

Live:
https://matchzimmerman.github.io/MZTV/sources/bit-field-015-stigmergy/

### BIT FIELD 016 — ONSHORE
Live field tuned to the September 2026 nor'easter. Real data, fetched live in the browser: the Open-Meteo pressure/wind/rain/cloud grid and marine waves, NWS station observations and alerts, and NOAA tide-gauge surge. It is drawn as a dreaming radar scope from the Carolinas to Cape Breton. Isobars tighten as the low deepens. Rain is a stepped radar ramp carried by the model's real wind. The swell runs at the real wave period. Central pressure is the sub's pitch (D Phrygian), gust sets the tempo, and each tide gauge's surge is one partial of a low chord. Memory: the coast wears where onshore wind, waves and surge hit it, rain stains the land, and the low's track hardens; worn coast later speaks, and a retraced path throws an echo. The storm's own lifecycle (deepening / mature / stalled / filling / after) triggers ruptures into new dither grammars and colour scopes. State persists across reloads. Params: ?info=0 ?fresh=1 ?audio=0 ?rate=N ?ff=H ?lines=N

Path:
sources/bit-field-016-onshore/index.html

Live:
https://matchzimmerman.github.io/MZTV/sources/bit-field-016-onshore/

### BIT FIELD 017 — ORBIT SCORE
The International Space Station flies its real orbit (live two-line elements from CelesTrak, propagated with SGP4) over a NASA public-domain relief map of Earth, and the ground passing beneath it is the score. The camera is locked on the station, so the Earth turns beneath it. A heading-up downlook shows the ground under it, and a slit-scan strip holds the last orbit of terrain, 24° across. The sound is D minor pentatonic with no kick: latitude is the drone's root, daylight opens the filter, ocean is surf with depth darkening it, land elevation is pluck pitch and roughness is pluck density, coastlines ring a bell, and the station's own sunrises and sunsets bring chord swells. Memory: every pass exposes the ground like film and keeps the note heard there, weaving a net that fades over two days. Crossing an earlier pass replays its note. Pressure from revisiting exposed ground breaks eras at orbital sunrise/sunset into a new dither grammar, chosen by what was unusual about the ground just flown. The real beta angle sets the colour scope over days, and a detected reboost is a rupture. Compact info by default (i cycles compact / full / off). Standalone stream, no mixer. State persists across reloads. Params: ?info=0|1|2 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?ff=H ?lines=N ?capture=1

Path:
sources/bit-field-017-orbit-score/index.html

Live:
https://matchzimmerman.github.io/MZTV/sources/bit-field-017-orbit-score/

### BIT FIELD 018 — LULL
A night field for falling asleep. Tones from an A = 432 Hz just-intoned pentatonic (A B D E F#) drift in and out over a low A drone, a pad that breathes with a pacer (inhale 40% / exhale 60%, slowing from 8 to 5 breaths per minute), and a brown-noise bed lowpassed well under 500 Hz. Tones fall only on the exhale, with slow attacks and no percussion, and each one drops a lantern into a slow dithered membrane: pitch is height, pan is position, and the breath sets its size. The arc runs SETTLING → DESCENDING → DEEP. Tones thin out, the register falls, the breath flattens toward steady sound, and the light dims and sheds its blue. Memory: lanterns leave sediment that holds the note heard there, and worn ground later echoes it. A transition table learns the lullaby, so the melody grows more familiar the longer it has been heard. Chord (A / Asus4 / D over A / A6/9) shifts palette hue. Voices unlock over hours, and the dither grammar changes under pressure from wear and familiarity. The stream follows the local clock (day field, dusk descent, deep night, dawn). The bedside version starts its arc on play and keeps a separate memory. The README lists the evidence behind each choice. Params: ?info=0|1|2 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?ff=H ?lines=N ?capture=1 ?arc=MIN ?end=MIN ?binaural=1 ?vol=N ?dim=N

Path:
sources/bit-field-018-lull/index.html (stream) · sources/bit-field-018-lull/bedtime.html (bedside)

Live:
https://matchzimmerman.github.io/MZTV/sources/bit-field-018-lull/
https://matchzimmerman.github.io/MZTV/sources/bit-field-018-lull/bedtime.html

### BIT FIELD 019 — IF THE BIRDS ARE OUT
A poem by Match Zimmerman, set as an OBAS field: one stanza per shot, one line per beat. It moves from a house across the street, through two aligned windows, to the ocean, and back to a bedside view. The dub score is built from the poem's events and rendered from the same script as the image.

Path:
`sources/bit-field-019-if-the-birds-are-out/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-019-if-the-birds-are-out/`

### BIT FIELD 022 — WATER STUDIES
Open sea at water level, a study of light on moving water. The sun and moon follow the Baltimore clock. At night, parachute flares rise, ignite and drift down, each throwing its own glitter path across real displaced swell, lighting the cloud base and pulling the camera round to frame it. Dust on the lens catches bright sources. A sea bed and a sky-coloured drone carry the sound, and each flare gets a thump, a hiss and a burn.

Path:
`sources/bit-field-022-water-studies/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-022-water-studies/`

### MZTV Director v0.1.1
OBS Lua layout conductor. Controls primary/secondary source framing, full-field layouts, split layouts, picture-in-picture, detail crops, jump cuts, subtle motion, and a basic generative director mode.

Path:
`obs/mztv_director_v0_1_1.lua`

## Canonical rule

This directory is the source of truth for MZTV broadcast-source code. Experimental local copies should be promoted here once they become part of the MZTV system.
