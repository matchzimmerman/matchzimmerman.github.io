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

### MZTV Director v0.1.1
OBS Lua layout conductor. Controls primary/secondary source framing, full-field layouts, split layouts, picture-in-picture, detail crops, jump cuts, subtle motion, and a basic generative director mode.

Path:
`obs/mztv_director_v0_1_1.lua`

## Canonical rule

This directory is the source of truth for MZTV broadcast-source code. Experimental local copies should be promoted here once they become part of the MZTV system.
