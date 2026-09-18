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

### MZTV Director v0.1.1
OBS Lua layout conductor. Controls primary/secondary source framing, full-field layouts, split layouts, picture-in-picture, detail crops, jump cuts, subtle motion, and a basic generative director mode.

Path:
`obs/mztv_director_v0_1_1.lua`

## Canonical rule

This directory is the source of truth for MZTV broadcast-source code. Experimental local copies should be promoted here once they become part of the MZTV system.
