# MZTV

Canonical source library for MZTV broadcast experiments, OBS control scripts, live browser sources, and transmission assets.

## Structure

- `obs/` — OBS Lua/Python control and director scripts
- `sources/` — browser-rendered visual sources for OBS
- future directories may include `overlays/`, `idents/`, `archive/`, and `audio/`

## Working lineages

MZTV contains multiple parallel research lineages rather than one sequential style replacing another.

- **OBAS** — formal/generative visual systems: limited-bit rendering, rupture, topology, evolving organisms, recursive form and color behavior.
- **FIELD ENGINE** — environments in which forces enter, propagate, interact, accumulate and alter materials, sound, light, memory and perception. A Field Engine piece may use OBAS as a rendering language without becoming an OBAS experiment conceptually. BIT FIELD 020–024 mark the emergence of this branch; their historical names are retained.
- **LIVE CODE** — autonomous compositional systems in which the running logic/state is exposed as part of the work.

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

### BIT FIELD 022 — WATER STUDIES · GALWAY BAY
Galway Bay off Inverin at water level, a study of light on moving water. The real sun and moon over Inverin light it. The bay's live swell (height, period, direction), wind, cloud, visibility and sea temperature from Open-Meteo drive the waves, chop, whitecaps, sky and sound. At night, parachute flares drift downwind on the real wind, each throwing its own glitter path across the swell.

Path:
`sources/bit-field-022-water-studies/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-022-water-studies/`

### BIT FIELD 023 — BOG STUDIES · INVERIN
Standing in the bog above Inverin, a sister piece to WATER STUDIES: wind moving through purple moor grass, heather, a rhododendron and bog pools. Gusts are one field carried across the bog at the live Inverin wind speed. Every blade, leaf, pool and sound reads that same field, so a gust is heard as it passes you. Live wind, gusts, cloud (with moving cloud shadows), rain, humidity (mist in the hollows) and visibility from Open-Meteo, the real sun and moon, and the date's colour. The grass keeps the lay of the last hours of wind as memory, and the stems sing in D Phrygian as the wind rises.

Path:
`sources/bit-field-023-bog-studies/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-023-bog-studies/`

### FIELD ENGINE 001 — RESIDUE
A moving source presses into one heterogeneous material field. The same pressure event becomes motion, reflected color, sound and persistent memory. Repeated exposure leaves residue that slightly hardens traveled paths; rupture leaves scars that soften them. Because those material changes feed back into the propagation model, later forces encounter a field altered by its own history. Four-color quantization and Bayer dithering borrow an OBAS-adjacent rendering grammar while FIELD ENGINE remains the behavioral system underneath.

Path:
`sources/field-engine-001-residue/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/field-engine-001-residue/`

### FIELD ENGINE 002 — THE FIELD DOES NOT RESET
A rolling year of public shooting-flagged incident records is replayed into a SOUNDING-derived terrain rather than a flat visualization. Recorded coordinates become positions in the material world; equal-force impacts scar the ground, increase memory pressure and alter later propagation. A low autonomous camera drifts through the terrain and bends gradually toward upcoming disturbances. SOUNDING's ray-marched ground, atmospheric depth, contours, hatching, four-ink dither, registration drift and distance-aware sound carry the piece; street maps, place labels, weapon imagery, victim demographics and severity scaling are withheld.

Path:
`sources/field-engine-002-the-field-does-not-reset/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/field-engine-002-the-field-does-not-reset/`

### FIELD ENGINE 003 — WATERSHED
A sibling of FIELD ENGINE 002 on the same records and SOUNDING renderer. Every record lands with the same force, but where records recur the force accumulates: the ground subsides into conserved basins that slowly widen and merge into channels, and water collects in them. The sun runs on solar time at the records' mean position with real seasons, so each event arrives at its own hour; gaps between records heal scars and open rests in the rhythm. The camera is pulled downhill into the basins and released once inside. Impacts are low root thumps; no pitch is derived from the records. A year takes ~2 hours, then rain keeps falling into the shape it made. Params: ?minutes=120 ?days=365 ?hold=30 ?loop=1 ?audio=0 ?info=0 ?capture=1

Path:
`sources/field-engine-003-watershed/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/field-engine-003-watershed/`

### BIT FIELD 025 — PLAYED GROUND
SOUNDING's ground played by a library of improvised guitar takes. Each take is cut at its attacks and laid across the land as a winding path; the camera reads the recordings as it travels (continuous phrases, chops on the dub grid, grains, impacts striking the nearest attack), and bass and drone sit in the takes' key. Over ~48 hours the recordings erode with the ground: played order gives way to reordering by likeness, reversals, octave/fifth shifts, delay throws and grain clouds; worn ground wears its fragments faster. Awaiting the takes; runs as SOUNDING until library/manifest.json exists. Params: SOUNDING's plus ?lib=URL ?hours=N

Path:
`sources/bit-field-025-played-ground/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-025-played-ground/`

### FIELD ENGINE 004 — RESIDUE GROOVE
A second interpretation of the FIELD ENGINE 002 brief. Five players (bass, kick, rim, skank, horn) hold a membrane at tension and play slow funk-rooted ambient orchestration in D phrygian, in dub space: a half-time one-drop where parts drop out, get thrown into a tape echo and spring, and come back. String sections sit at L20–30 (low) and R20–30 (high), saturated, dark and mostly wet, swelling up into each chord change through a pre-verb; they are the membrane's own voice, swelling with its waves on each side. A rotating lead (horn phrase, string line, bass, skank) sits on top while everything else ducks under it via sidechain. Each player is a node tethered to where it emerged and shoved by its own hits; collisions permanently trade beats. Public shooting-flagged incident records (time and position only, one equal impulse per incident, geography obscured) strike the membrane in order: each answers with a dub-out (one hit flung into the echo, then only tails), knocks the nearest part out of place, and leaves ground that carries waves slower, goes still and eventually tears. Phrases mutate every 16 bars and the band moves between modal vamps over hours, drifting darker as residue accumulates. Flash-safe. Earlier versions kept as `v1.html` (drone), `v2.html` (98 bpm funk) `v3.html` (66 bpm dub funk) and `v4.html` (first orchestration, cleaner/louder pads).

Path:
`sources/field-engine-004-taut/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/field-engine-004-taut/`

### SCORE ENGINE 001 — SLO-FUNK-DUB
A branch of RESIDUE GROOVE that inverts the visualiser relationship: the image scores the sound. Drop a video clip in (read locally, never uploaded) and an ingestion layer watches it frame by frame — motion energy and centroid, camera flow, cuts, impacts, flashes, light, warmth, detail, stillness — and that interpretation plays the OBAS slo-funk-dub engine. Cuts become dub-outs that move the downbeat onto the edit, impacts land as quantised hits, stillness empties the band, darkness and warmth choose the vamp, camera moves drag the echo across the stereo field. R renders the scored clip to a file.

Path:
`sources/score-engine-001-slo-funk-dub/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/score-engine-001-slo-funk-dub/`

### SCORE ENGINE 002 — COMPOSER
The second branch of the OBAS slo-funk-dub engine: it composes to a clip's exact length. The clip is scanned faster than real time, the tempo is fitted so the last bar lands on the final frame, and a six-section form (Arrival, Procession, Groove, Space, Climax, Resolution) carries composed energy, with a per-section routing table deciding what the arbitrary footage controls there. Renders deterministically to a 24-bit mix, seven stems with effects, a MIDI file and a score sheet.

Path:
`sources/score-engine-002-composer/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/score-engine-002-composer/`

### SCORE ENGINE 003 — ORCHESTRATOR
SCORE ENGINE 002 plus an orchestration layer: one theme per piece (generated from the clip's name, D phrygian) developed through the form by standard orchestral technique — foreshadowing, call and response, sequence, countermelody, colour and octave doubling, inversion, crescendo by adding families, broadening and liquidation — with overtone-series voicing, phrygian cadences and pedal points. Every decision is logged with its reason in the score sheet. First piece: NASA Bus Tours (footage NARA 255-PV-12, 1967), score sheet included.

Path:
`sources/score-engine-003-orchestrator/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/score-engine-003-orchestrator/`

### BIT FIELD 026 — INFLUENCE FIELD
A 48-hour-plus sonic.visual field built from the conversation that proposed it. MZ.Human's making-conversation is analyzed in-browser for recurrence, novelty, meta/architectural density, constraint density, coupling vocabulary, turn length and punctuation; validated HARIL archive measurements bias the slower field behavior. Those signals jointly drive a persistent OBAS-adjacent influence field and synthesized Web Audio score. There is no authored timeline or fixed loop: regime lengths, audio events, field residue and elapsed-time perturbations continuously alter the state. The piece is a rendering of the system that produced it.

Path:
`sources/bit-field-026-influence-field/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-026-influence-field/`

### BIT FIELD 027 — DESIRE LINES
HARIL specimen; one of two independent responses to the conversation-driven build brief (the other is BIT FIELD 026). The piece reads the conversations it was designed in (RESIDUE GROOVE → SCORE ENGINE session, the F1 idea, the brief itself) one sentence at a time and releases each into one ground as walkers: human sentences cut new paths, machine sentences follow and elaborate them, the relayed brief walks as both. Concepts that recur wear channels between their homes, which settle into sediment over hours; corrections repel and shear the channels and throw a dub-out, ratification hardens paths and holds the chord, bridges cross-route the currents and the stereo, dormant concepts return with transformed motifs. Epochs walk the MZTV lineage (key, meter, palette, each piece's recorded corrections) and rupture from tension. After one reading in order, the next turn is chosen by resemblance, residue and neglect, so the reading changes the ground and the ground changes the reading. Corpus, extractor and provenance in `data/`. Params: ?info=0 ?fresh=1 ?audio=0 ?seed=N ?rate=N ?lines=N ?ff=H

Path:
`sources/bit-field-027-desire-lines/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/bit-field-027-desire-lines/`

### 48 PLANT · SPECIMEN 001 — MZ.Claude candidate
One independent build for the HARIL 48 PLANT multi-agent brief. A painted, fabricated botanical specimen grows for 48 hours inside the weather made by the practice that built it. Site and archive commits plus HARIL timeline metadata since 2022 are lived inside 48 phenological hours, and live commits and intake arrive as present weather. Activity becomes water, project branches become light from their own sides, corrections become stress, new and returning projects break buds, and breakthroughs flower. Growth is irreversible: kinks, dormancy rings, scars, fallen leaves and leaf generations stay. The life is event-sourced (seed + ledger + live log), so it survives restarts and can be reconstructed at any hour. v2 grows it out of the floor of an all-white cyclorama, filmed by four cube camera-drones and cut like a nature documentary. It includes event shots, time-lapse passages, a surveillance bay of every drone's feed with a studio plan, and a final composed portrait that holds at hour 48. v1 (potted, turntable) is kept as `v1.html`.

Path:
`sources/48-plant-001/index.html`

Live:
`https://matchzimmerman.github.io/MZTV/sources/48-plant-001/`

### MZTV Director v0.1.1
OBS Lua layout conductor. Controls primary/secondary source framing, full-field layouts, split layouts, picture-in-picture, detail crops, jump cuts, subtle motion, and a basic generative director mode.

Path:
`obs/mztv_director_v0_1_1.lua`

## Canonical rule

This directory is the source of truth for MZTV broadcast-source code. Experimental local copies should be promoted here once they become part of the MZTV system.
