# Quartz Transmission

A long-form 1-bit procedural mineral animation developed from a rotating found-quartz study.

The piece begins as a broad faceted monolith, develops fixed optical mark fields and contour echoes, ruptures into orbiting shards, captures those fragments in a helical return, and settles into an expanded cubic cage. It is intentionally non-photoreal and treats refraction as discrete black-and-white pattern transitions rather than grayscale shading.

## Render

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

Reference-only. The generator has been tested in the conversation sandbox but is not scheduled for autonomous execution.
