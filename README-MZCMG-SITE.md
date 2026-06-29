# MZCMG website + MAGPIE living archive

This site has one public index with two destinations:

- `field-station-magpie/` — continually expanding execution archive
- `non-magpie/` — selected work outside MAGPIE

## Archive model

The archive separates stable system families, versioned generators, and immutable executions:

- `MZFS.FAM.*` — canonical interface/system lineage
- `MZFS.GEN.*` — a specific procedural generator and version
- `MZFS.EXE.YYYYMMDD.NNNNNN` — one retained execution

`data/families.json` and `data/generators.json` define the systems. Every execution has an individual JSON record under `archive/records/`; generated media is placed under `archive/executions/`. `scripts/build_archive_index.py` compiles these into the browser-facing `data/archive-index.json`.

## Automatic growth

`.github/workflows/magpie-archive-cycle.yml` runs one enabled generator hourly. The workflow retains the output and execution record, rebuilds the public index, and commits the new archive state.

The initial generator creates lightweight deterministic SVG relation fields. Video, audio, and large raster output should use external object storage while preserving the same execution records and stable IDs.

## Run locally

```bash
python scripts/archive_cycle.py --generator signal-field-svg --seed 1701
python -m http.server 8000
```
