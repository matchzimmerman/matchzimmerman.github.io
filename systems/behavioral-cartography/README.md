# Thermal behavioral cartography

Reserved package for `MZFS.FAM.0004` and `MZFS.GEN.0006`.

This package contains the recovered FIELD STATION: MAGPIE thermal-surveillance lineage developed through direct MZ.human × MZ.gpt iteration.

## Current system

The generator produces an overhead, slightly isometric diagonal-alley view populated by several blurry thermal signatures. Each figure differs in proportions, route lane, cadence, thermal profile, and tracker color. When signatures overlap, the thermal field uses non-additive compositing and the tracker boundaries remain separate, so the system records occlusion complexity rather than merging bodies into a single blob.

The interface includes:

- `FIELD STATION: MAGPIE` operational framing;
- diagonal thermal alley geometry;
- multiple distinct moving signatures;
- persistent route and residual-path visualization;
- tracked occlusion behavior;
- rolling `AB'S LOGS`;
- tonal audio driven by subject density, movement progress, and stereo position.

## Source

- `src/generator.py`

Required command:

```bash
python systems/behavioral-cartography/src/generator.py \
  --seed 1701 \
  --output /tmp/behavioral-cartography.mp4 \
  --thumbnail /tmp/behavioral-cartography.jpg
```

## Approved references

- `reference/preview.jpg`
- `reference/approved-overhead-thermal-alley.mp4`

The committed MP4 is a compact site preview of the approved direction, not the full-resolution conversation master. The original full-resolution output remains pending verified recovery.

## Autonomy

The package remains `reference-only`. Do not schedule it until the recovered generator has been validated by the repository intake workflow and a full local run confirms reliable video, thumbnail, and audio generation.
