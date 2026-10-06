# MZTV · FIELD ENGINE 004 · RESIDUE GROOVE

*Working title: TAUT, renamed 2026-10-06. The URL folder keeps the old slug so existing OBS sources keep working.*

A second interpretation of the brief behind FIELD ENGINE 002 (*the field does not reset*). FE002 drops the records into SOUNDING's terrain. TAUT starts from a different material: a membrane held under tension by a small band.

- `index.html` is **v4** (current): slow funk-rooted ambient orchestration in D phrygian with dub space. String sections sit on the sides, and a rotating lead ducks everything else through a sidechain.
- `v3.html` is v3: ultra-slow funk in dub space, with no strings and no lead/sidechain. It is darker, with a 3 kHz ceiling.
- `v2.html` is v2: the same players and membrane with a busier 98 bpm funk groove (it repeats too much over long runs).
- `v1.html` is v1, kept for the record: fixed exciters and a drone chord.

## v4 — funk-rooted ambient orchestration (2026-10-06)
v4 is slower and more composed, with a crafted stereo and frequency field.
- **Tempo / key:** about 52 bpm, half-time, drifting ±2 over 90 minutes and dragged slower by pressure and residue. Tonal center D phrygian. The sections are vamps inside the mode:
  - D one-drop
  - D – E♭ (i – ♭II)
  - B♭ – C minor
  - G minor – E♭
  - D low ♭9

  The bass line is chosen from chord tones, so every note stays in key.
- **Stereo field (fixed):** bass and kick dead center; rim slightly right; skank right; horn left; low strings hard left; high strings and the lead string line hard right. Node position nudges each part by ±0.15. Measured side/mid: −19.5 dB below 150 Hz (near-mono low end), −4 to −5.5 dB above (wide), L/R balanced within 0.3 dB.
- **Strings:** two continuous string sections, each with three voices of two detuned saws, vibrato, a lowpass and a room send.
  - They glide legato between voicings, using nearest-note voice leading.
  - They swell on 32-bar arcs.
  - **They are the membrane:** each side's level and brightness follow wave energy on that half of the field. More space means more strings.
- **Lead + sidechain:** the lead rotates on 16-bar phrases between horn, strings, bass and skank.
  - **Horn lead:** a short stepwise D-phrygian phrase played call, call, answer, rest.
  - **String lead:** long notes moving by step at the top of the right side.
  - **Bass lead:** opens up and adds fills.
  - **Skank lead:** pushed forward.

  Lead notes go to a lead bus. Everything else, including echoes, spring and rooms, sits on a bed bus whose gain dips under each lead note (about 0.3–0.42 depth, 100 ms hold, 0.3 s release). The kick separately pumps the strings.
- **Master:** highpass 26 Hz → light saturation → −5 dB presence dip at 3 kHz → high shelf −7 dB from 5.5 kHz → lowpass 9.5 kHz → glue compressor (2.2:1, soft knee). Measured band energy relative to the loudest band:

  | Band | Level |
  |---|---|
  | 20–60 Hz | −9 dB |
  | 60–120 Hz | −2 dB |
  | 120–250 Hz | −7.5 dB |
  | 250–1k | −16 dB |
  | 1–2k | −23 dB |
  | 2–5k | −37 dB |
  | >5k | −60 dB |

  That is full range with a soft top.
- Everything from v3 carries over: dub drop-outs, throws, tape echo with swept return, dub-outs on impulses, phrase mutation, section changes, nodes, collisions and flash safety. State key `mztv-fe004-v4` (starts fresh).

## v3 — ultra-slow funk, dub space (2026-10-06)
v2's groove was effectively the same for hours. v3 slows it to a half-time one-drop and opens it up with dub negative space. It also makes the groove itself evolve.
- **Tempo:** about 66 bpm, drifting ±3 over a 90-minute cycle. Pressure and accumulated residue drag it slower. Swing is deeper, and every player sits behind the beat; the horn lays back furthest.
- **Parts:** sub bass (long, round notes from a mutating bass line), kick on the one and three, one-drop rim/snare into a spring reverb, an offbeat skank chop, and a soft horn/melodica swell. Nothing bright: everything above 2 kHz sits about 60 dB down.
- **Space:** a slow *space* value (17-minute and 4-minute cycles, plus pressure and residue) decides how much the mix leaves out. Each bar, each part may drop out. Bass or kick always holds the floor. On screen, dropped parts show dimmed and marked `out`.
- **Throws:** skank, snare and horn hits are randomly thrown into the echo. There are more throws when there's more space.
- **Echo:** a tape-style ping-pong delay (dotted 8th and quarter, with slight wow) whose return passes through a resonant lowpass that sweeps slowly. Feedback is bounded by tanh, a lowpass and a highpass.
- **Impulse → dub-out:** on the next one, a single unison hit is flung into the echo, feedback spikes and the return filter opens and closes, then the bar is empty apart from tails.
- **Phrase mutation:** every 16 bars, one player gains or loses a hit inside its role's grammar (allowed steps, minimum and maximum density), so the parts drift over hours. Impulses and collisions still displace and trade beats on top of that.
- **Sections:** five modal vamps (G minor one-drop, G–C dorian, Bb–A drift, F up to G, C minor sink). The section changes every 20–45 minutes on an 8-bar boundary. As residue grows, the choice leans toward the darker vamps, and each change rewrites part of the bass line.
- **Memory:** state is saved under `mztv-fe004-v3`, so v3 starts fresh.

## Concept
Five players hold a membrane at tension: bass, kick, snare, clav and stab. Each is a node tethered to the spot where it emerged. It moves within its tether, shoved by its own hits, and its waves spread across the membrane and interfere with the others'. Together the five lock into one groove.

Public incident records strike the membrane in order. They carry time and position only, and each incident gives one impulse of equal force. Each strike does three things:
- It rings out across the membrane.
- The band answers with a stop-time hit on the next downbeat.
- It knocks the nearest player's part out of place. Most of that displacement heals back over the following bars, but some never does.

The struck ground stays changed. Waves slow and bend around scars, damaged ground goes dark and still, and past a threshold the membrane tears.

When a player's ground is spent, the player falls silent, and its frequency drops out of the band. It then re-emerges on intact ground near the most recent wounds, which brings it close to the others. When two players collide, the change is permanent: they trade a beat, settle into each other's timing, tighten their tethers, and each carries one more ring.

The question it puts to the system is what repeated real-world violence does to a band that keeps trying to hold its groove.

## System
- **Membrane:** a 480×270 wave equation on the GPU (WebGL2, float textures, 2 substeps per frame). Waves are slow: about 24 px/s at simulation resolution, under 0.6 Hz. A viscosity term suppresses grid noise.
- **Damage:** fresh damage *T* heals over a few minutes. It heals more slowly on scarred ground and under pressure, and faster near a singing player. Permanent residue *P* only grows. Health is `h = 1 − P − 0.6·T`. Lower health means slower waves, more damping and a darker image. Ground with `P > 0.5` is torn.
- **Players (nodes):** each player has an anchor where it emerged and a tether radius, starting at 46 px. It wanders slowly inside the tether, and each of its hits shoves it, the kick and bass hardest. It leans toward a nearby wound for a minute after an impulse. Its exciter drives the membrane at its mode ratio (1 : 1.594 : 2.136 : 2.653 : 3.156).
- **Emergence:** bass, kick and snare start. The clav emerges after the 3rd impulse and the stab after the 8th. A silenced player re-emerges on intact ground (`h > 0.72`) nearest the centroid of the last 12 wounds, at least 22 px from other anchors. If no intact ground remains, the player is gone from the band for good.
- **Collisions:** two singing players closer than 14 px bounce elastically, and the change is permanent. They swap a 4-step window of their base patterns, though never the kick's or bass's "one". Their timing offsets move 60% toward each other. Their tethers shrink to 0.85×, and each gains a ring. Each pair has a 4-minute cooldown.
- **Silence:** a player whose ground health stays below 0.55 for 90 s falls silent.
- **Equal force:** no record attribute scales any effect. Rows from the same minute within about 100 m are merged into one incident.
- **Pressure:** a leaky count of recent records, with a 6 record-day half-life. High pressure (above 0.6) does four things:
  - healing slows;
  - the band drops to a breakdown (bass, kick and snare only, held on Gm7);
  - the tempo drags from 98 toward 93 bpm;
  - swing deepens and the echoes lengthen.

## Groove (audio)
- **Grid:** 16 steps at 98 bpm. Odd 16ths are swung. Each player has its own pocket offset: the snare lays back, the clav pushes.
- **Harmony:** a G dorian vamp, Gm7 for 8 bars then C7 for 4.
- **Bass:** saw and square through a resonant lowpass, with octave "pops" on the high root.
- **Kick:** sine dropping from 150 to 46 Hz.
- **Snare:** body plus filtered noise, with ghost notes.
- **Clav:** muted square-wave chord chanks.
- **Stab:** detuned saw chord.
- **Base patterns:** these are the funk grammar. Step 1 is "the one". Every hit's velocity follows the player's life and the ground health under its node.
- **Pitch:** detuned by tension under the node, by accumulated residue, and by each re-emergence.
- **Impulse:** a felt low knock (118→46 Hz), panned by position. On the next downbeat, every player except the clav plays a unison hit, then the bar stops and only the echoes carry.
- **Residue bed:** brown noise lowpassed at 240 Hz, growing with residue and tears. Echo feedback grows with pressure and residue. Delay times are dotted and plain 8ths of the current tempo.
- **Mix:** high shelf at −11 dB from 1.5 kHz and a lowpass at 3.2 kHz. In test recordings, 2–5 kHz sits about 42 dB down and everything above 5 kHz about 79 dB down. The low end (60–120 Hz) is the loudest band. No clicks.
- **Hardening:**
  - one-shot voices are enveloped and disconnect themselves;
  - the feedback loop is bounded;
  - the 40 ms scheduler looks 0.6 s ahead and skips forward after a stall;
  - a watchdog resumes or recreates the context, and rebuilds the graph on NaN, silence, or every 3 h;
  - the sequencer keeps running on a wall clock when sound is off, so the nodes still move.

## Flash safety
- Wave frequencies stay under about 0.6 Hz.
- Every display cell's brightness passes through a slew limiter: at most 2.25% change per frame, so a full swing takes at least about 0.75 s.
- Impulse rings are low-contrast and travel slowly.
- **Measured** (headless, with an impulse every 0.67 s, far denser than the real data): no pixel changed more than 2.25% per frame. At most 9.6% of the screen shifted by more than 10% in any quarter second. No region can oscillate faster than the waves, under 0.6 cycles per second, well below the 3 flashes/s threshold.
- **v1 for comparison:** waves ran up to about 6 Hz with crest contrast unrestricted. Do not stream v1.

## Visual
- **Inks:** four, ordered-dithered on an integer grid: navy, cobalt, pale lilac-white and a lime residue ink.
- **Waves:** slow wavefronts and their energy envelope.
- **Damage:** still ground darkens. Fresh damage shows as a fine line screen. Residue is a rotated halftone printed slightly out of register.
- **Torn ground:** a stippled rim.
- **Players:** a dot with one ring per collision survived, and the tether shown as a faint dashed lime circle.
- **Palette:** drains toward grey-violet as residue grows, then pulls back toward home.

## Data
- **Source:** same public ArcGIS layer as FE002 (NIBRS Group A, `Shooting='Y'`). Only `CrimeDateTime, Latitude, Longitude` are fetched.
- **Geography:** rotated, stretched and warped, and frozen on first load.
- **Replay:** at the default `?pace=4` a year takes about 24 h, and the full archive (Jan 2022 – Sep 2026) about 4.8 days. Real intervals are preserved. After that the piece goes live, polling every 20 min and spacing new records at least 20 s apart.
- **Outages:** records are cached locally.
- **Test data:** `?testdata=1` (synthetic, labelled on screen) is for tests only.
- **On screen:** no place names, addresses, dates, victims or severity.

## Memory
Every 60 s and on unload, the piece saves to localStorage (`mztv-fe004-v2`):
- the damage map;
- players (anchors, tethers, rings, base and current patterns, pocket offsets);
- playhead, pressure, palette, log and geo frame.

v2 starts fresh rather than inheriting v1's state.

## Params / keys
- **Params:** `?info=0` · `?fresh=1` · `?audio=0` · `?pace=MIN` · `?ff=H` · `?capture=1` · `?testdata=1`
- **Keys:** **I** toggles info · **M** mutes. Click to start sound in a normal browser. OBS autoplays.
- **OBS:** Browser Source → `https://matchzimmerman.com/MZTV/sources/field-engine-004-taut/` · 1920×1080 · enable "Control audio via OBS".

## Tested (v2, 2026-10-05, headless Chromium/swiftshader)
- Boot legible within a second; no console errors.
- Flash metrics as above.
- Players emerge near wounds and collide, with beats traded, rings added and tethers tightened.
- Reload resumes exactly. NaN poisoning self-heals. WebGL context loss restores. AudioContext suspend and close both recover.
- The groove is steady at −18 to −20 dB RMS per second.
- Headless note: software rendering can starve the scheduler and cause audible gaps. This was verified to be a test artefact by recording with rendering paused.
