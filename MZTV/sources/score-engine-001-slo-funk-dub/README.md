# MZTV · SCORE ENGINE 001 · SLO-FUNK-DUB

A branch of **FIELD ENGINE 004 · RESIDUE GROOVE**. It uses the same OBAS sonic engine (slo-funk-dub, from RESIDUE GROOVE v5), but replaces the invisible public-records stream with an **ingestion and interpretation layer that watches a moving-image clip**. This inverts the visualiser relationship: the image scores the sound.

Drop in a scene, and the engine reads its motion, camera movement, editing, light and texture. That reading plays the band. The data is still arbitrary, and the film is never sonified literally. But because it all derives from the image, the score's pacing and mood tend to fall into sync with the picture: sometimes obviously (a cut lands a dub-out on the edit), mostly not.

## Use
1. Open `https://matchzimmerman.com/MZTV/sources/score-engine-001-slo-funk-dub/` in Chrome.
2. Drop a video file on the page, or click **choose a clip**. The file is read locally and nothing is uploaded.
3. It plays and scores in real time.

**Keys:**
- **space** play/pause
- **I** info box
- **O** mixes in the clip's own audio, quietly, under the score
- **F** fill/fit frame
- **L** loop
- **M** mute
- **R** render

**Render (R):** restarts the clip from the top and records exactly what's on screen (clip, info box if visible, score) to `scored-<clipname>.webm` (VP9 + Opus). Press R again to stop early. The file has no duration header (a MediaRecorder limitation); if an editor complains, `ffmpeg -i in.webm -c copy out.webm` fixes it.

**For the stream:** render first, then play the rendered file in OBS as a Media Source. An OBS browser source can't take a dropped file, and a local `file://` clip blocks pixel analysis. `?src=URL` works for clips hosted with CORS. Films are copyrighted, so streaming film scenes on Twitch can draw DMCA takedowns; your own footage or public-domain material is safest for broadcast.

Params: `?src=URL` · `?info=0` · `?audio=0` · `?orig=1` · `?loop=1`

## Ingestion — what the engine sees (every frame, 160×90)
| Feature | How |
|---|---|
| Motion energy | mean absolute frame difference (fast, 1.2 s and 10 s averages) |
| Motion centroid | difference-weighted position of the movement |
| Camera flow | global Lucas–Kanade optical flow on a 4× downsampled level (whole-frame move, fraction of frame per second) |
| Cuts | luma-histogram chi-square jump relative to its own running level, or a whole-frame change far above recent motion with a real histogram change; 0.45 s minimum gap, warm-up ignored |
| Impacts | motion onsets well above the recent baseline (0.35 s minimum gap), with strength |
| Flashes | luminance jumps > 0.14 |
| Light / darkness, contrast | mean and std of luma |
| Warmth, saturation | mean (R−B) and channel spread |
| Detail | mean gradient magnitude |
| Stillness | fast motion < 0.008 for 1.5 s |
| Pace, tension | composites: pace = long motion + cut rate; tension = motion + contrast + cut rate |

## Interpretation — what it controls
- **Pace → tempo**, 46–60 bpm, smoothed over about 8 s.
- **Tension → space:** how many parts drop out each bar. Busy scenes fill the band; quiet ones open it up. Tension also decides whether phrase mutations grow parts (busier) or thin them.
- **Cut → dub-out and phrase reset:**
  - a unison kick, bass, rim and horn hit lands on the next 16th, thrown into the echo;
  - feedback spikes and the echo filter opens;
  - the rest of the bar holds only tails;
  - if the cut lands in the second half of a bar, the downbeat moves onto the edit, so the music reorganises around the cutting.
- **Impact → a quantised hit** on the next 16th: kick for strong impacts, rim for light ones, both and an echo throw for the strongest.
- **Flash →** a horn note thrown into the echo.
- **Stillness →** the band leaves; strings and echoes hold. Movement brings it back.
- **Darkness and warmth → section choice** (re-evaluated on cuts and every 40 s):
  - dark → D low ♭9;
  - tense → D–E♭ (i–♭II);
  - warm and bright → B♭–C minor;
  - cool and bright → G minor–E♭;
  - otherwise the D one-drop.

  Darkness also raises echo feedback and room size.
- **Motion → string swell. Warmth and light → string tone** (cutoff).
- **Camera flow → echo drift:** the echo's stereo image is dragged in the direction of the camera move. **Motion centroid →** horn and skank pan.
- **Detail → texture bed:** lowpassed brown noise.
- **Lead:** the dominant feature takes it.
  - camera moving → skank;
  - lots of motion → bass;
  - stillness or darkness → strings;
  - otherwise the horn phrase.

  Everything else ducks under the lead via sidechain.

## Engine
The same engine as RESIDUE GROOVE v5:
- one-drop rhythm section in D phrygian;
- string sections at L/R 20–30, saturated and mostly wet, with pre-verb swells into chord changes;
- tape echo with the unity-gain feedback fix, plus spring and room;
- master: soft top, full range.

## Tested (2026-10-06, headless Chromium with a synthetic 16 s clip: pan → still → spinning colour field → Game of Life)
- All three real cuts were detected, at 4.06, 8.03 and 12.07 s.
- Camera pan measured −0.19 frames/s against a true 0.19.
- Stillness was detected 2 s into the still shot, and the band returned on the next cut.
- The spinning hue-cycling section produced two extra "cuts". It changes like cutting at low frame rates; real footage at 30 fps analyses cleaner.
- Render produced a VP9 + Opus file with steady audio (60–120 Hz loudest, above 5 kHz about 69 dB down). No errors.
