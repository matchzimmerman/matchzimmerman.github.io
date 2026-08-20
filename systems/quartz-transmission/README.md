# Quartz Transmission

A procedural MAGPIE family for crystalline geometry, transparent cages, discrete optical patterning, phase failure, and structural reorganization.

The original Quartz Transmission begins as a broad faceted monolith, develops fixed optical mark fields and contour echoes, ruptures into orbiting shards, captures those fragments in a helical return, and settles into an expanded cubic cage.

## Behavior 001: Alignment

`alignment_behavior_001.py` extends the family away from a single mineral object and toward a behavior-driven MAGPIE system. Independent line segments begin as unrelated observations, gradually align into a crystalline volume, hold a brief structural lock, shear out of phase, reorganize as interference geometry, transmit a FIELD STATION: MAGPIE identification, and decay back toward the scattered opening state.

Visual representation intentionally shifts between wireframe, sparse surface hatching, nested contours, interference waves, and rotating section geometry. Opaque white fills are avoided so the structure remains spatially readable. Audio is generated from the same chapter timing: low sine field, tuned partials, structural lock pulses, destabilization bursts, and restrained transmission pings.

### Render Alignment

```bash
python systems/quartz-transmission/src/alignment_behavior_001.py \
  --seed 107 \
  --output /tmp/magpie-alignment.mp4 \
  --thumbnail /tmp/magpie-alignment.jpg
```

### Render original Quartz Transmission

```bash
python systems/quartz-transmission/src/render.py \
  --seed 41 \
  --output /tmp/quartz-transmission.mp4 \
  --thumbnail /tmp/quartz-transmission.jpg
```

## Requirements

- Python 3
- NumPy
- OpenCV (`cv2`)
- FFmpeg available on `PATH`

## Status

Reference-only. Behavior 001 has completed a conversation-sandbox render but should remain unscheduled while the visual language is being evaluated and evolved.
