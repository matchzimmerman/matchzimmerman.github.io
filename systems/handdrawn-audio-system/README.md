# MZ-CC.HANDDRAWN procedural animation + audio system

## Recovered from

- Conversation: **Hand-drawn branch network / procedural audiovisual system**
- Date recovered: **2026-07-01**
- Recovery agent: **OpenAI GPT-5.5 Thinking**
- System stamp: **MATCH ZIMMERMAN // PROCEDURAL A/V SYSTEM // MZ-CC.HANDDRAWN-V013**

## What the system does

MZ-CC.HANDDRAWN is a synchronized procedural animation and audio instrument built from a paper-colored field, hand-drawn branching connections, blocky red/yellow/blue/orange structures, hard mask collisions, and dub-leaning synthesis. The visual field is treated as one image rather than a dashboard: it can be cropped, enlarged, displaced, thresholded, or briefly reorganized, but the system returns to a single coherent frame.

The audio begins as a restrained drone and rhythmic dub structure. Bass and percussion create camera pressure; filtered chord stabs create spatial echoes; sustained tones enlarge or redirect the field. In the approved late-stage direction, a clear **sonic narrator** enters around the midpoint and becomes the element the listener follows.

The authorship stamp is rendered into the source image before camera transformations. It is therefore tethered to the current frame: sometimes fully visible, sometimes cropped, and sometimes enlarged beyond legibility. It does not float independently above the animation.

## Iteration archive

The `reference/iterations/` directory preserves fifteen web-optimized conversation renders from the initial hand-drawn network through the tethered-stamp / sonic-narrator master. `reference/iterations.json` records the development sequence and key changes.

## Approved traits

- aspect ratio: **1:1 / 640×640**
- palette: warm paper, black graphite, red, yellow, blue, orange
- typography: small monospaced authorship/system stamp embedded into the image field
- motion: uneven hand-drawn tremble, hard-edged masks, decisive crops and zooms, restrained structural displacement
- audio: tuned D-minor/Dorian field, rounded sine/sub percussion, filtered dub chord stabs, tape-like feedback, warm sustained lead
- synchronization: image displacement and crop pressure derived from the same event structure as the audio
- narrative behavior: a distinct sonic narrator enters near the halfway point

## Rejected or deprecated traits

- transparent compositing or ghosted overlay frames
- blurred mask edges
- constant multi-panel collage or dashboard-like layouts
- thin shaker/snare textures
- bright piano-MIDI or metallic FM leads
- high-frequency detail that reads as “90s web MIDI”
- visual effects that move independently of the active source frame
- collage as the governing visual system rather than occasional punctuation

## Runtime

```bash
python systems/handdrawn-audio-system/src/generator.py \
  --seed 12345 \
  --output /tmp/mz-cc-handdrawn.mp4 \
  --thumbnail /tmp/mz-cc-handdrawn.jpg
```

An optional `--duration` argument is available for local testing.

## Autonomy

Current mode: `reference-only`

The recovered generator has passed a short local render test, but the family remains reference-only until its one-minute output is reviewed in the repository environment and unattended runtime behavior is approved.
