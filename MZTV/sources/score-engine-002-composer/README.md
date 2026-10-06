# MZTV · SCORE ENGINE 002 · COMPOSER

The second branch of the OBAS slo-funk-dub engine. SCORE ENGINE 001 reacts to a clip live. 002 **composes to a clip's exact length**: it plans a six-section form whose energy belongs to the composition, and treats the footage as an arbitrary trigger source. What the footage controls changes from section to section.

The footage never sets the energy. A dull stretch of B-roll in the Climax still drives saturation, octave horn stabs and dub-outs, because those are what the Climax routes it to. The footage works like a humanizer or shuffle: it adds unplanned timing and variation inside a composed structure. Archival B-roll suits it well, because the same shot taken again and again gives you repetition with variation.

## Use
1. Open `https://matchzimmerman.com/MZTV/sources/score-engine-002-composer/` in Chrome and drop a clip. It stays on your computer.
2. **Scan:** the clip plays muted at 6× while every frame is read into a timeline. A 7:27 clip takes about 75 s.
3. **Look at the plan:** the timeline shows the six sections, the composed energy (white) against the footage's motion (grey), and the cuts and impacts. Click a section to see its parts and what the footage controls there.
4. **Preview:** hear the piece in real time with the clip.
5. **Render:**
   - **render mix**: a 24-bit 48 kHz stereo WAV, normalised to −1 dBFS.
   - **render everything**: the mix, then seven stems with effects (bass, drums, skank, horn, strings, choir, texture), a MIDI file (one track per part, drums on channel 10, exact tempo) and a score sheet (Markdown: clip details, tempo, form table, routing).

   Chrome may ask once to allow multiple downloads. Each pass renders faster than real time, but the full set is eight passes. On a 7:27 clip, expect a few minutes for the mix and roughly 15–25 minutes for everything, depending on the machine.

Everything is deterministic. The same clip with the same seed gives the same piece, so stems line up with the mix and with the MIDI sample for sample.

## Plan
- **Tempo** is fitted to the length. The bar count is the nearest whole number of bars at the style tempo (52 bpm), and the tempo is then adjusted so those bars end exactly on the final frame. A 7:27 clip (447 s) gives 97 bars at 52.08 bpm.
- **Sections** are placed by proportion and snapped to 4-bar boundaries (2 bars on shorter clips; clips under 18 bars use a three-part form):

| Section | Share | Parts | Lead | Footage events | Footage signals |
|---|---|---|---|---|---|
| I · Arrival | 12% | strings, texture, horn (throws only) | strings | cut → reverse swell into the next chord · impact → horn into the echo · flash → echo throw | motion → string swell · camera flow → echo drift · detail → texture · warmth → string tone |
| II · Procession | 22% | + bass, rim | bass | cut → bass fill · impact → rim · flash → horn throw | motion → string swell · flow → echo drift · motion position → pan · warmth → string tone |
| III · Groove | 22% | full rhythm section, horn | horn | cut → dub-out · impact → kick / rim · flash → horn throw | motion → ghost-note fills · flow → echo drift · position → pan · darkness → echo feedback |
| IV · Space | 10% | strings, bass, texture, horn | strings | cut → reverse swell · impact → rim into the spring · flash → lead string note | motion → string swell · flow → echo drift · detail → texture |
| V · Climax | 20% | everything + choir (only here), octave-doubled horns | horn | cut → dub-out · impact → kick / rim · flash → octave horn stab | motion → master saturation drive · flow → echo drift · position → pan · warmth → string tone · detail → choir swell |
| VI · Resolution | 14% | parts peel off: kick, skank, rim, horn, bass | strings | cut → reverse swell · impact → rim · flash → echo throw | motion → string swell · darkness → echo feedback |

- **Harmony:** D phrygian vamps per section. The last two bars resolve to an open D minor, with a final bass note on the last downbeat ringing out to silence exactly at the clip's end.
- **Fixed energy per section:** part levels, density (how phrases grow), space (drop-outs), drive, echo and room. Parts glide in and out over a bar at section boundaries.
- **Footage normalisation:** every signal is scaled to its own 5th–95th percentile range, so any footage, however flat, drives the full range of whatever it's routed to. At most three footage events act per bar, so the form stays legible.

## Engine
The same sound world as SCORE ENGINE 001 and RESIDUE GROOVE v5:
- one-drop rhythm section (bass, kick, rim, skank) and horn phrases;
- strings at L/R 20–30, saturated and mostly wet, with pre-verb swells into chord changes;
- tape echo (unity-gain feedback clip), spring and room;
- sidechain ducking under the section's lead;
- master: soft top, full range.

New here: the climax-only choir layer, a per-role bus architecture (so stems come out with their effects), seeded noise, and offline rendering.

Stems skip the master saturation and compressor and are printed at a fixed −6 dB headroom. They sum close to the mix, which is normalised.

## Tested (2026-10-06, headless Chromium, 150 s synthetic test reel)
- Scan took 25 s. The plan was 33 bars at 52.79 bpm.
- The full render produced the mix, 7 stems, MIDI (481 notes on 6 tracks) and the score sheet. Every file is exactly the clip's length, sample-accurate. No errors.
- **Form arc in the mix (RMS):**

  | Section | RMS |
  |---|---|
  | Arrival | −24.9 dB |
  | Procession | −17.7 dB |
  | Groove | −13.3 dB |
  | Space | −17.9 dB |
  | Climax | −12.0 dB |
  | Resolution | −17.6 dB |

  The piece ends in silence on the final frame.
- **Spectrum:** 60–120 Hz is loudest. 2–5 kHz sits about 41 dB down and above 5 kHz about 61 dB down. No clicks.
