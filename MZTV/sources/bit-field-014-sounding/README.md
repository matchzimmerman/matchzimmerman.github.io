# BIT FIELD 014 — SOUNDING

A low camera drifts across a ground that remembers where it has been. The ground's rules mutate over hours under accumulated pressure; a sun orbits every 38 minutes and weather drifts through. Dub audio shares the environment.

- Piece: https://www.matchzimmerman.com/MZTV/sources/bit-field-014-sounding/
- Mixer: https://www.matchzimmerman.com/MZTV/sources/bit-field-014-sounding/mixer.html

## Mixer

The mixer talks to the piece through the browser itself (BroadcastChannel), with no server, so it must run in the same browser as the piece:

- **OBS:** Docks → Custom Browser Docks → add the mixer URL. It sits next to your scenes and steers the browser source.
- **In the piece:** right-click the source → Interact, then press **M** to open the mixer over the image.
- **Browser:** open the piece and the mixer in two tabs of the same browser.

Groups: audio · influence · sky · camera · look · evolution. Each group is AUTO (the piece runs itself), MANUAL (you drive it, and a tick shows what the piece would do), or, for audio, DUB (the piece mixes its own sound: drops voices, throws echoes). AUTOPILOT hands everything back to the piece. The release setting hands any touched group back after N minutes. Mixer settings persist across reloads.

Params: `?info=0` `?fresh=1` `?audio=0` `?rate=N` `?lines=N`
