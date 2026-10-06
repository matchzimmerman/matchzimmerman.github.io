# MZTV · SCORE ENGINE 003 · ORCHESTRATOR

SCORE ENGINE 002 (length-fitted form, footage as an arbitrary trigger source, mix / stems / MIDI / score-sheet render) plus an **orchestration layer** built on standard orchestral practice. It also **explains itself**: every orchestration decision is logged in the score sheet with the reason for it, so each render doubles as a lesson in why the piece works.

## What the orchestrator adds
- **One theme per piece.** It's generated from the clip's name (so rename a clip to change its theme). It's a two-bar D-phrygian phrase in an arch shape, always including E♭ (the mode's signature note), with an open "question" ending on A and a closing "answer" ending E♭ → D.
- **The theme is developed section by section:**

| Section | What happens to the theme |
|---|---|
| I · Arrival | Foreshadowing: the first three notes at double length in the cellos over a low D pedal; then inverted, high in the violins |
| II · Procession | Solo horn statement, answered by clarinet or cellos (call and response, antecedent/consequent). It rotates through sequence up a step, roles swapped, sequence by a third, and a shortened answer |
| III · Groove | The theme over the full rhythm section with a violin countermelody in contrary motion; colour doubling (horn and clarinet in unison); sequence by a third |
| IV · Space | Texture contrast: a lone violin plays the theme inverted and slowed over a D pedal; clarinet fragments answer |
| V · Climax | Crescendo by orchestration: horns plus cello countermelody, then violins doubling at the octave, then choir and clarinet (tutti, with staggered family entries); the theme broadens to double length at the peak |
| VI · Resolution | Liquidation: the theme slowed in the violins, then 4 notes in the clarinet, 3 in the horn, and finally just E♭ → D in the cellos |

- **Craft rules:**
  - **Spacing by the overtone series.** Low strings play root, fifth and octave; high strings play the third, seventh and colour tones close together.
  - **Phrygian cadence (E♭ → D)** at every section boundary, and a final iv → ♭II → i cadence.
  - **Pedal points** in the Arrival, Space and final bar.
  - **Phrase swells** that rise to the third bar of each four-bar phrase and breathe in the fourth.
- **New voices:** clarinet (woodwind), with its own stem and MIDI track; cello and violin melodic lines; choir lines. The rhythm section, dub effects, sidechain and footage routing are all inherited from 002.
- **Score sheet** now includes the theme (note names and durations), a bar-by-bar **orchestration log** (time, section, voice, notes, why) and a glossary of the principles used.

## Use
Open `https://matchzimmerman.com/MZTV/sources/score-engine-003-orchestrator/` in Chrome, drop a clip, then:
- **render mix · MIDI · score sheet**: a few minutes for a 7–8 minute clip.
- **render everything**: adds 8 stems (bass, drums, skank, horn, woodwind, strings, choir, texture).

Renders are deterministic for the same clip, the same file name and the same analysis.

## First piece: NASA Bus Tours (2026-10-06)
- **Footage:** "Panavision Stock Footage, NASA Bus Tours", Kennedy Space Center, 12/8/1967, 65mm colour. US National Archives, Record Group 255 (NASA), local ID 255-PV-12 (file `255-pv-12-r1.mp4`, 7:39.96).
- **Plan:** 100 bars at 52.18 bpm.
  - Arrival: 12 bars
  - Procession: 24 bars
  - Groove: 20 bars
  - Space: 8 bars
  - Climax: 20 bars
  - Resolution: 16 bars
- **Footage reading:** 34 cuts, 22 impacts, 8 flashes. The log records 48 orchestration decisions, and the MIDI has 1,944 notes on 7 tracks.
- **Loudness arc (RMS):**

| Section | RMS |
|---|---|
| Arrival | −26 dB |
| Procession | −18.5 dB |
| Groove | −18 dB |
| Space | −21.5 dB |
| Climax | −14 dB |
| Resolution | −18 dB |

  The piece ends in silence on the final frame. No clicks.
- Rendered in the build environment from a 640×360 analysis copy. To reproduce it on the Mac, rename the clip `NASA Bus Tours.mp4` before dropping it in, so the theme matches. Full-resolution analysis can read a few events differently.
