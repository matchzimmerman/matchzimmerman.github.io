# BIT FIELD 025 — PLAYED GROUND

SOUNDING's ground, played by a library of Match's improvised guitar takes (guitar through pedals). No live input: the recordings are the material, and the piece assembles and erodes them over ~48 hours.

**Status:** engine built and tested on stand-in material (never shipped). Awaiting the real takes; until `library/manifest.json` exists the piece runs as SOUNDING and the info box says "no takes yet".

## How the takes become the piece
- **Listening:** on load each take is decoded (32 kHz; folded to mono if the library exceeds ~12 min) and cut at its attacks. Every fragment gets loudness, brightness (percentile across the library) and pitch class.
- **Laid across the ground:** each take is a long meandering path that wraps the torus several times, so the land is striped with every take (≈97% of the ground within reach of one). Fragments sit along their take's path in played order.
- **Phrase layer (bed):** continuous, crossfaded. Early on a take continues in played order from where the last phrase ended; as wear grows it jumps more often, to the nearest take under the camera, avoiding anything heard in the last 4 minutes.
- **Chop layer:** fragments on SOUNDING's dub grid (replacing its chords and percussion). In played order at first; later reordered by likeness: high ground asks for bright fragments, low ground for dark ones. Lengths shorten, reversals and octave/fifth shifts grow, delay throws increase.
- **Grains:** past ~35% wear, short grains drift through the take nearest the camera; density follows cloud and rain.
- **Impacts:** the ground's impacts strike the nearest attack in the recordings, seen first and heard later by distance, with SOUNDING's low thump.
- **Key:** bass and drone sit in the takes' key (manifest `key`, or detected from fragment pitch); `mode` fixes SOUNDING's mode so bass lines don't clash.
- **Wear:** global wear rises over `?hours` (default 48) on the evolution clock; local wear adds the ground's memory at each fragment's home plus how often it has been played. Played fragments wear the ground where they live.
- **Eras colour the handling:** erosion → more grains, drift/terraces → more played order, waves → more delay throws, faults → reversals and short cuts, flood → darker and slower, canopy → dry and close.

Persistence: ground state and per-fragment play counts survive reloads (localStorage).

## Adding the takes
1. Masters (WAV) are archived; web copies are Opus in Ogg (`ffmpeg -i take.wav -c:a libopus -b:a 128k take.ogg`).
2. Put the `.ogg` files in `library/` and write `library/manifest.json`:
```json
{ "key": "D", "mode": "aeolian",
  "takes": [ { "file": "take-01.ogg", "title": "take 01" } ] }
```
`mode` is one of phrygian / aeolian / dorian. Titles appear in the info box.

## Params & keys
SOUNDING's (`?info=0 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?lines=N ?ff=H ?capture=1`) plus `?lib=URL` (another manifest) and `?hours=N` (time to full wear; small values preview the arc). Keys: `i` info, `t` force a transition.

Standalone stream, no mixer: the recordings are the performer.
