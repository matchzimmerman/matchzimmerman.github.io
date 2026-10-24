# MZ SONIC · WORLDS ALBUM 001 — THE FIELD BETWEEN WORLDS

**Live after merge:** https://matchzimmerman.com/MZTV/sonic/worlds-album-001/

Independent **album-composition prototype** in `MZTV/sonic/worlds-album-001/`. Does **not** edit or load HEADLAND, LOCH RAVEN, or 48 PLANT broadcast sources. It translates aspects of their behavior into an original, deterministic cross-world audio score. This distinction matters: it does not yet render or record the actual MZ WORLDS sonic systems.

## Experience
- One 15-minute browser-playable album / three standalone movements (five minutes each).
- HEADLAND: 5/4, D Dorian, modelled swell/wind controlling bar length and events.
- LOCH RAVEN: 7/8, D Phrygian, modelled spillway flow controlling bar length; one scored WARREN BELOW harmonic displacement at 07:13 to 07:55 (album clock; not simulated local hydrology or a live archaeological visualization).
- 48 PLANT: 4/4, F Lydian, modelled procedural growth controlling density. The idea is inspired by the real 48 PLANT system but uses **no current commit/weather/archive input**.
- Six layers: DRONE, PAD, BASS, MOTIF, PULSE, FIELD. All generated from a shared, seeded arrangement. The three-note motif changes degrees/spacing/registral role by movement, with a return in the third movement.
- Timeline click-to-seek, movement cards, per-part muting, volume, replay and seed regeneration. Audio requires a genuine click due to browser autoplay rules.

## Studio interchange
- **MIDI + tempo + markers ZIP:** `MZ_SONIC_001_CONDUCTOR.mid` Type-1 standard MIDI with six musical parts and a conductor track containing per-bar tempo metadata, 5/4 → 7/8 → 4/4 time signatures, textual movement/cue markers and key/mode notes. Import behavior for markers/key in Ableton Live may differ by version; inspect the imported session.
- **WAV:** individual movement mix (5 min), 6 separate mono stems for the chosen movement, or complete continuous 15-min mono mix. The initial prototype renders **22,050 Hz, 16-bit PCM mono**, for practical browser memory limits. A 5-minute six-stem ZIP is approximately 80 MB; the whole album WAV approximately 40 MB. Exports synthesize the score in `OfflineAudioContext`, and on less capable mobile browsers a large render may fail. Stem renders intentionally align from the selected movement's t=0. In Live place HEADLAND stems at 0:00, LOCH RAVEN at 5:00, 48 PLANT at 10:00, and turn Warp off if exact alignment is required.
- **Automation CSV:** per-bar normalized wind/flow/growth and tempo/meter in portable columns. These are meaningful score controls but are **not directly native Ableton automation envelopes**.
- **XML:** a semantic project *manifest* for movement names, start seconds, meters, keys, stem roles and suggested Ableton instruments. **NOT an Ableton .als file; not importable as Live device/plugin state**. Device chains and automation require a future validated Ableton template/live API integration.
- All generated performances are deterministic by `?seed=NNN`. There are no proprietary samples, plugins, external libraries or external audio assets.

## Audio architecture
- Original procedural Web Audio oscillators + deterministic filtered noise, per-part buses, 26Hz high-pass, 6.8kHz low-pass, dynamic compressor.
- 45ms scheduler with a short future lookahead, serialized note events, separate performance clock and pause/seek voice stopping.
- One 900-second score generated up front, per-bar tempo changes reflected in both playback timestamps and Type-1 MIDI clock. Generated tempo follows modelled environmental controllers (not live measured weather or discharge).
- This is a *first compositional study*, not certified for mastering, broadcast, multichannel surround, or sample-exact DAW parity.

## Technical gate
- Score generation tested at seed 8001: 176 bars, 1583 note events, starts at 0 and ends at 900 seconds; 16,627-byte MIDI and valid ZIP headers generated.
- `core.js` and `app.js` JavaScript static parse: PASS on creation.
- Browser player, HTML/CSS layouts, full OfflineAudioContext export time and imported Ableton markers have **not yet been validated inside Ableton**. If the preview/test browser reports any functional errors, document and patch those before treating this as a finished tool.

## Next phase (not implemented)
- Verified Ableton template + remote scripting/Max for Live/device macro mapping and marker restoration
- Device automation, recorded multi-channel stems and 8.2 spatial arrangement
- Plug directly into HEADLAND, LOCH RAVEN and 48 PLANT engines via a stable audio-event API so album performances can use live authentic world inputs
- Movie edit/visual timeline synced to the narrative score

No source code from the private HEADLAND build-standard document is copied into this public app.
