# BIT FIELD 014 — SOUNDING

A low camera drifts across a ground that remembers where it has been. The ground's rules mutate over hours under accumulated pressure; a sun orbits every 38 minutes and weather drifts through. Dub audio shares the environment.

- **Stream (autonomous):** https://www.matchzimmerman.com/MZTV/sources/bit-field-014-sounding/ — the OBS broadcast source. Never listens to the mixer; keeps its own memory.
- **Play (mixer-linked):** https://www.matchzimmerman.com/MZTV/sources/bit-field-014-sounding/play.html — same piece, steerable, with a separate memory so playing never touches the stream.
- **Mixer:** https://www.matchzimmerman.com/MZTV/sources/bit-field-014-sounding/mixer.html — steers play.html only.

## Mixer

The mixer talks to play.html through the browser itself (BroadcastChannel), with no server, so it must run in the same browser:

- **OBS:** make a browser source with play.html (for example in a separate scene), then Docks → Custom Browser Docks → add the mixer URL.
- **In play.html:** right-click the source → Interact, then press **M** to open the mixer over the image.
- **Browser:** open play.html and the mixer in two tabs of the same browser.

Groups: audio · influence · sky · camera · look · evolution. Each group is AUTO (the piece runs itself), MANUAL (you drive it, and a tick shows what the piece would do), or, for audio, DUB (the piece mixes its own sound: drops voices, throws echoes). AUTOPILOT hands everything back to the piece. The release setting hands any touched group back after N minutes. Mixer settings persist across reloads.

Params: `?info=0` `?fresh=1` `?audio=0` `?rate=N` `?lines=N`
