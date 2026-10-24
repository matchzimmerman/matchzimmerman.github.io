# MZ CINEMA 001 · THE WATER KEEPS
**A 15-minute procedural short film composed from the actual MZ WORLDS, their MZCAM camera crews and MZ SONIC audio systems.**

**Format:** browser film with cinematic cut clock, live rendered world cameras, evolving generative score, five named movements and a 10-bus internal spatial mixer (8 main, 2 sub). This is a working-source prototype, **not a pre-rendered MP4**.

## Entry
`/MZTV/cinema/short-001-the-water-keeps/`

**Length:** exactly 900 seconds of film performance when played at normal speed with the tab visible. The transport supports start, pause, replay, timeline seek, notes, mute and full screen.

**Viewer note:** click **BEGIN FILM WITH SOUND**. The title page is not a frozen video splash; the first MZ WORLD is already loading behind it. On slow GPUs it may take time for the first WebGL scene to initialize. The soundtrack can play while scene loading is still incomplete.

**Optional debug parameters:**
- `?lines=420` — lower internal rendering resolution (recommended for weaker machines; desktop defaults to 640 in film).
- `?edition=12345` — reproducible random seed for the same nominal composition family. Actual world weather and persistence may still vary.
- `?live=0` — ask constituent worlds to use simulated weather.
- `?rate=10` — **QA only**: accelerate film clock, not a faithful real-time musical performance. Production uses rate 1.

## The 15-minute edit (five movements)
| Time | Length | Movement | Source | Proposed center | Meter | Musical behavior |
|---|---:|---|---|---|---|---|
| 00:00–03:30 | 3:30 | I — THE FIELD | HEADLAND, BIT FIELD 031 | D Dorian, D3 | 5/4 | establishes three-note interval [0,3,7] |
| 03:30–06:15 | 2:45 | II — THE CURRENT | SRUTHÁN, BIT FIELD 033 v3 | A Mixolydian, A2 | 7/8 | smaller, quicker divisions, water inherits motif |
| 06:15–11:20 | 5:05 | III — THE WATER KEEPS | LOCH RAVEN, BIT FIELD 034 | D Phrygian, D3 | 4/4 (film meter) | keeper, hydraulic pulse, ♭II disruption |
| 11:20–13:00 | 1:40 | IV — AFTERIMAGE | SRUTHÁN v3 | F Lydian, F3 | 3/4 | earlier motif fragments reform |
| 13:00–15:00 | 2:00 | V — RETURN | HEADLAND 031 | D Dorian, D3 | 5/4 | motif returns holding other worlds' material |

**Total: 900 seconds.** These harmonic/meter choices belong to the film's added score. **They are not a claim that the original world engines use those meters or pitch modes.** Loch Raven's native sonic bar continues to follow its modelled hydraulic index, while the film adds a separate D Phrygian 4/4 layer.

The film's visual world boundaries are at 3:30, 6:15, 11:20 and 13:00. Scenes crossfade over a 14-second interval centered at the boundary, so spatial and musical transitions are deliberately not hard cuts. The coming score is audible approximately 18–22 seconds ahead of each change.

**WARREN BELOW at 08:55** is a direct, explicit artistic cue: the parent sends `MZ.force('warren')` to the original LOCH RAVEN source while it is on camera. This deliberately causes modelled low water so the apparition can be seen during the finite film. **It is not an observation of actual water level or a reconstruction of Warren.** The real village site was farther upstream; no mapped street grid or historically verified architecture is shown.

## Film architecture
- The film is a **controller**, not a copied or edited MZ WORLD engine. It uses same-origin iframes of BIT FIELD 031, 033 and 034 with `?capture=1&info=0` and calls their published `window.MZ.tick(dt)`. The original files remain untouched.
- The active world and the next world may both render during a short crossfade. The older iframe is fully destroyed afterward, including its WebGL and AudioContext resources. Pausing the film halts the world tick and the film score; seeking creates a new world frame at the target movement.
- Inside each world, camera operators retain their autonomous framing/cuts. The film directs movement and transition structure, not individual actor behavior.
- The LOCH RAVEN event is the film's one scripted intervention. All other world behavior remains procedural and local-weather-driven when its live feed works.
- The film's own seed is stored as `mz-cinema-water-keeps-edition-v1`. Original world memory remains under their separate `mzworld-...` keys; this film does **not** clear it.

## MZ SONIC and 8.2 channel design
- Shared performance score: initial [0,3,7] semitone interval motif. Reharmonize/transpose for each setting. Tempo, meter, texture, bass and spatial trajectories change by movement; the next movement's root arrives before the picture.
- Parent `AudioContext`: **10 distinct logical audio buses**:
  `FL · FC · FR · SR · RR · RL · SL · RC · SUB_A · SUB_B`.
- Eight main buses use continuous azimuth interpolation with constant-power adjacent sends; the two independent sub buses are separately filtered below 105 Hz. This is **a custom artistic 8.2 layout**, not a commercial standard speaker order or Dolby Atmos deliverable.
- Each original MZ WORLD AudioContext plays its original score and beds, but in same-origin browsers its output is additionally connected to a `MediaStreamAudioDestinationNode`, ingested by the master score via `MediaStreamAudioSourceNode`. Direct destination routing is removed for those captured worlds, preventing duplicate audio.
- **Output limitation:** the web player monitors a **stereo fold-down** of those ten logical buses. It does not enumerate or configure a physical ten-speaker audio interface and it does **not yet export ten discrete synchronized WAV stems**. Device-specific 8.2 routing, calibrated bass management and native spatial-render test are future engineering gates.
- The notes panel can download the cue sheet as JSON with all movement boundaries, meter, BPM, cue moments, channel order and actually emitted note events. Full .ALS project assembly and explicit WAV/MIDI exports have not been added.

## Film-viewer controls
- ▶ / Ⅱ: Start / pause film (spacebar).
- Timeline: seek to any of the 900 seconds; left/right arrow seeks 10 seconds.
- Speaker: mute/unmute (M).
- ☷: notes with clickable movement map, cue-sheet JSON export and new random edition (I).
- ⛶: fullscreen.
- Replay: starts another 15-minute performance.

## Rendering and audio QA
**Static gates performed:** script parses under JavaScript `Function` syntax validation; all five movements form an unbroken 900-second timeline and cut boundaries and cues sort correctly; the HEADLAND/SRUTHÁN/LOCH RAVEN `window.MZ` and `?capture=1` interfaces were checked against the actual repository sources.

**Not yet demonstrated in this session:** a full real-browser 900-second uninterrupted WebGL playback; a frame-by-frame verification of all source cameras, especially on phones; 10-channel hardware output; measured loudness/balance; an actual multichannel recorded album; automatic video encoding; Ableton device/automation/XML import; a full runtime WebGL smoke test. Do not mistake the publication of this prototype for those tests.

## Historical and artistic boundary
The real-world sources are interpretive places, not surveyed 3D models. No historical names, inscriptions or reconstruction details have been invented for the film. LOCH RAVEN explicitly distinguishes the actual location of Warren from this evocative displacement.

## Recording the film
For a fixed edition, capture the hosted browser source in OBS at 1920×1080 with the page audio included (the public player outputs stereo fold-down). Keep OBS capture active for 15 minutes from the BEGIN action until END OF PERFORMANCE. The first fixed edition should be considered a **documentation capture**, not a final cinema mix or discrete 8.2 master. For later stems, the spatial-mixer signal topology is already available in `FilmScore.buses` and `FilmScore.discrete`.

## Safety and boundaries
- Scene loader only points to known internal MZTV paths, never remote editable user URLs.
- The film's first source loads early. No arbitrary third-party script injection.
- No edits to the individual MZ WORLD broadcast sources.
- No image generation, external stock photos or generated textures in the cinematic output: all world imagery is rendered by the existing six-ink world engines.
