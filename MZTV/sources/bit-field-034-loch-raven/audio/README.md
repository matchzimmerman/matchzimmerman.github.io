# MZ WORLD 034 · LOCH RAVEN AUDIO LAB

**Interactive instrument (once published):** https://matchzimmerman.com/MZTV/sources/bit-field-034-loch-raven/audio/

A standalone, audio-only interface to the **modelled** Loch Raven score. This companion intentionally does not load or modify the original `../index.html` broadcast source or its `mzworld-loch-raven-v1` memory. It borrows its D Phrygian scale, Euclidean rhythm, keeper-to-bass relationship, hydraulic tempo formula (6.6−2.45×flow/42 seconds/bar) and master signal chain.

## Ableton workflow

1. Open the URL in Chrome or Edge on desktop and press **START AUDIO**. The score's parameter changes take effect for newly scheduled notes.
2. To capture **live MIDI on macOS**: in **Audio MIDI Setup** → **Window → Show MIDI Studio** → open **IAC Driver** and enable *Device is online*. Back in the Audio Lab, press **CONNECT MIDI DEVICE** and choose the IAC bus. In Ableton Live, enable *Track* for that bus under **Settings/Preferences → Link, Tempo & MIDI** in MIDI Ports input. Create a MIDI track and choose that bus as MIDI From; arm or monitor the track. The app sends notes, velocities, and note-off messages (no MIDI Clock or program-specific transport sync).
3. For **MIDI files**, select 4/8/16/32 bars and press **MIDI / TRACKS**. Import the Type 1 `.mid` into Live. It has tempo metadata and named tracks for Kick, Bass, Pad, Drone, Warren and Knock.
4. For **audio files**, press **WAV / STEREO**. The page uses `OfflineAudioContext`, exporting stereo 16-bit PCM at 44.1 kHz. Drag the `.wav` into an Ableton audio track. This is an offline render of the companion's Web Audio approximation, **not a sample recording of the broadcast's original audio**.
5. Browser audio into a live Ableton audio track requires a host audio loopback or virtual driver (e.g. audio interface loopback / BlackHole). MIDI does not carry water, rain, wind and other noise audio.

## Music and data semantics

- Input `flow` is 0–42, **synthetic and dimensionless**; no municipal or USGS discharge telemetry. Flow sets 4.15–6.6 seconds per bar. Quarter-note tempo in the MIDI is `240/barSeconds`.
- Keeper position maps the five symbolic stops to bass degrees. Its editor position is manual; it does not follow the 3D world keeper. Other sliders also simulate rather than pull live weather.
- Separate mixer gains for kick, bass, pad, drone, water, wind, rain, echo, room and master. Harmonic centre defaults to MIDI D3 (50).
- Instrument family: bass synth saw+sin, sine kick, dual-detuned saw pads, droning oscillators, brown/white-noise water and weather beds, ping echo with tanh feedback and a convolution room. Output processing high-pass 26 Hz, tanh saturator, shelf −10 dB at 2 kHz, low-pass 6.8 kHz and compression.
- The **WARREN BELOW** checkbox creates a musical ♭II, high fifth and low tones. It is compositional and does not depict or claim location-specific history. **HUSH** withdraws kick/bass and nearly all water while leaving the remaining world textures.
- State is stored locally as `mz-loch-raven-audio-lab-v1` and does not touch the broadcast state. Settings are captured as a frozen snapshot at the start of each export. MIDI and WAV have matching timings and note arrangements for this snapshot. Noise IR is deterministically seeded. Web Audio rendering differs from the original broadcast engine and between browsers.
- **Important difference from world:** Independent instrument, not connected bidirectionally to the live scene. Pads are rendered as one oscillator event per chord note every four bars, where the world uses sustained oscillators. The UI is not a MIDI clock source and has no external audio capture bus.

## Tested (2026-10-23 local Chromium / software browser)

- JavaScript syntax: PASS (`node --check`). Page loaded without console or JavaScript exceptions.
- Transport START/STOP: PASS; audio graph created with no errors. Changing flow 0→42 updated bar duration 6.6→4.15 s and BPM.
- Type 1 MIDI downloaded: PASS, `MThd`, seven tracks including tempo, 552 B in a four-bar test.
- Stereo PCM WAV rendered/downloaded: PASS; `RIFF/WAVE`, 44.1 kHz, stereo, 16-bit, 3.2 MB four-bar test.
- UI screenshot: local review. **No real MIDI hardware/IAC port was available for an end-to-end Ableton test**. No numerical spectral comparison or long-session watchdog test yet. No 32-bar export benchmark, Android/iOS/WebMIDI verification, or Ableton import verification.

## Limits and safety

- This is a browser instrument and companion tool, *not* a direct audio remote for the currently-running LOCH RAVEN broadcast.
- WAV exports are stereo **mixes**, not separate stem WAVs; MIDI has separate note tracks. Ambient noise textures do not translate to MIDI.
- Web MIDI must be user-authorized in a secure context; browser and OS support vary. Input MIDI is not implemented, only output.
- No independent ADSR editor or MIDI clock/transport synchronization in this version.
- A 32-bar WAV can be large and memory-intensive. Choose 4–8 bars for a quick export.

**No generated/stock visuals.** UI is CSS; no image generation or external libraries/assets.
