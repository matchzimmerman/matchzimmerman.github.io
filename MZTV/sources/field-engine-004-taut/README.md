# MZTV · FIELD ENGINE 004 · TAUT

A second interpretation of the brief behind FIELD ENGINE 002 (*the field does not reset*). FE002 drops the records into SOUNDING's terrain. TAUT starts from a different material: a membrane held under tension by a small chord.

## Concept
Five voices keep a membrane ringing. Their waves cross and interfere into a standing pattern, and that pattern is the picture. Their pitches are the low chord you hear. Public incident records strike the membrane in chronological order. The records carry time and position only, and every incident gives one impulse of equal force. Each impulse rings out and fades, but the ground it struck stays changed. Damaged membrane carries waves more slowly, so they bend around scars, and it absorbs them, so dead ground goes dark and still. Past a threshold it tears. A voice standing on dead ground falls silent and then tries to take hold on intact ground. When no intact ground is left, that voice is gone for good, and the chord has lost a note.

The question it puts to the system is what repeated real-world violence does to a membrane that keeps trying to hold its note.

## System
- **Membrane:** a 480×270 wave equation on the GPU (WebGL2, float textures, 4 substeps per frame). Edges are fixed. A small viscosity term suppresses grid noise.
- **Voices:** five exciters driven at circular-membrane mode ratios (1 : 1.594 : 2.136 : 2.653 : 3.156). Their interference makes the standing pattern.
- **Damage:** two layers. *T* is fresh damage. It heals on a half-life of a few minutes, and heals more slowly on scarred ground and under pressure. *P* is permanent residue and only ever grows. Health is `h = 1 − P − 0.6·T`. Wave speed is `c² ∝ mix(0.28, 1, h)` and damping is `0.004 + 0.03·(1−h)`. Where `P > 0.5` the membrane is torn and held at zero.
- **Equal force:** each record adds the same wave bump and the same damage stamp. No attribute of a record scales its effect. Rows within the same minute and about 100 m of each other are merged into one event, so the number of people involved never scales an impulse either.
- **Pressure:** a leaky count of recent records, with a 6 record-day half-life. Clusters raise it and gaps let it drain. Pressure slows healing, lengthens the dub echo and makes the voices waver.
- **Homeostasis:** a voice whose ground health stays below 0.55 for 90 s falls silent. After 1–3 minutes it searches the readback map for ground with health above 0.78, at least 60 px from the other voices. If it finds some, it regrows there. If not, it is gone.
- **Slackening:** as residue accumulates, the whole membrane loses up to 18% of its tension. Wavelengths shorten and the pattern loses symmetry.

## Data
- Source: the same public ArcGIS layer FE002 uses (NIBRS Group A, `Shooting='Y'`). The query fetches `CrimeDateTime, Latitude, Longitude` only, paged from the earliest record onward.
- Geography is obscured. Coordinates are bounded by percentiles, rotated, stretched to fill the frame and smoothly warped. Neighbours stay neighbours, but the outline no longer reads as a map. The mapping is frozen on first load and kept in memory, so later records land in the same frame of reference.
- **Replay:** the full archive plays in order at `?pace` real minutes per record day (default 4, so a year takes about 24 h). Real intervals between records are preserved, which makes clusters and silences part of the rhythm. Once the archive is caught up, the piece checks for new records every 20 min and applies each new one as it appears, at least 20 s apart.
- Records are cached in localStorage, so the membrane keeps receiving through a source outage. If there is no cache and no source, the membrane simply holds its note and retries every minute. Nothing synthetic ever stands in for records. `?testdata=1` (synthetic records, labelled TEST DATA on screen) exists for testing only.
- On screen: no place names, addresses, dates, victims or severity. The info box shows a record-day counter, the impulse count and how the field is responding.

## Audio
- **Voices:** each voice is two sines and a lowpassed triangle at its mode frequency over a G1 (49 Hz) fundamental. Voice level follows wave energy under the exciter, and pitch follows the tension there. Damage detunes a voice locally, and accumulated residue plus each relocation flattens it globally. A voice's pan follows its position.
- **Impulse:** a felt low knock (118→46 Hz) plus a noise burst rung through bandpasses tuned to the *surviving* voices, at their current damaged pitches, so the membrane rings in whatever tuning it has left. It is panned by position and sent to the dub echo and the room. Every impulse has the same level.
- **Knock:** the membrane's own pulse, Euclidean E(5,13) at 68 BPM, struck at a slowly wandering point. Its level and probability follow ground health there.
- **Absence:** peaking notches sit at each voice's second harmonic. When a voice dies, its notch deepens to −16 dB in the residue bed and the echoes, so its frequency is carved out of everything.
- **Residue bed:** brown noise lowpassed at 260 Hz. Its level grows with permanent damage and tearing, and room send grows too.
- **Mix:** a high shelf at −9 dB from 1.8 kHz and a lowpass at 3.8 kHz. In test recordings everything above 2 kHz sits more than 80 dB down.
- Hardened per the MZTV protocol: continuous oscillators, AudioWorklet noise from a `data:` URL (blob fallback, then crossfaded one-shot segments), enveloped one-shots that disconnect themselves, a bounded tanh feedback loop, a 40 ms/0.4 s lookahead scheduler that skips forward after stalls, and a watchdog that resumes, recreates the context and rebuilds the graph on NaN, 20 s of silence or every 3 h.

## Visual
Four inks: deep ink navy, cobalt, pale lilac-white and a lime residue. Wave crests and the energy envelope are ordered-dithered (Bayer 4×4) on an integer pixel grid. Dead ground darkens. Fresh damage shows as a fine line screen that fades as it heals. Permanent residue is a rotated halftone printed slightly out of register, and the misregistration grows with residue. Torn ground has a stippled rim. Voice exciters are small ticks that go hollow when a voice falls silent. The palette drains slowly toward grey-violet as residue grows, then pulls back toward home.

## Timescales
- **Seconds:** crests travel, voices beat, impulses ring and bend.
- **Minutes:** fresh damage heals, pressure rises and falls with clusters and gaps, voices breathe.
- **Hours:** residue spreads, the membrane slackens, the standing pattern loses symmetry, voices fall silent and relocate.
- **Days:** tears open and voices find no ground. At the default pace the archive replay runs several days before it reaches the present and switches to listening for new records.

## Memory / persistence
Every 60 s and on unload, the piece saves to localStorage (`mztv-fe004-v1`): the damage map (240×135, 16-bit residue), the voices, the playhead, pressure, palette, log and geo frame. An OBS reload resumes where it left off. `?fresh=1` restarts from a taut membrane.

## Params / keys
`?info=0` · `?fresh=1` · `?audio=0` · `?pace=MIN` (real minutes per record day) · `?ff=H` (fast-forward H hours of replay at boot) · `?capture=1` · `?testdata=1` (tests only)
Keys: **I** toggles info · **M** mutes. Click or any key starts sound in a normal browser. OBS autoplays.

**OBS:** Browser Source → `https://matchzimmerman.com/MZTV/sources/field-engine-004-taut/` · 1920×1080 · enable "Control audio via OBS".

## Tested (v1, 2026-10-05, headless Chromium/swiftshader)
- Boot is legible within a second, with the membrane pre-warmed. No console errors.
- Fast-forward to 6, 24, 72 and 120 h on synthetic records: residue spreads, the membrane slackens, threshold log lines fire, and nothing goes non-finite.
- Reload resumes the identical damage map and playhead. NaN poisoning of the wave field self-heals within a frame. WebGL context loss restores from saved memory.
- Audio is recorded from the master bus. The low end carries the weight (60–120 Hz loudest band). There are no transients above 5 kHz and no clicks. Each impulse lifts the level 3–5 dB above the drone. The AudioContext recovers from both suspend and close.
- Not yet verified: the live record source from inside this build environment (the network blocks it). FE002 uses the identical query live. Check the info box shows `source: receiving` on first load.

No mixer-linked play version yet. This is the autonomous stream build only.
