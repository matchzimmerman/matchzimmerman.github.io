# MZCMG website and MAGPIE living archive

The public index has two destinations:

- `field-station-magpie/` for the continually expanding iteration archive
- `non-magpie/` for selected work outside MAGPIE

## Archive references

The archive separates system families, versioned generators, and individual retained runs:

- `MZFS.FAM.*` identifies a canonical system lineage
- `MZFS.GEN.*` identifies a procedural generator and version
- `MZFS.EXE.YYYYMMDD.NNNNNN` identifies one retained run

Every run has a JSON record under `archive/records/`. Media and poster images live under `archive/executions/`. The index builder compiles these records into `data/archive-index.json`, which directly populates the public grid.

Image runs may use the same file as both the artwork and poster. Animation generators export a lightweight poster for the grid and a full moving file for the lightbox.

## Automatic growth

The archive workflow runs one enabled generator hourly. It retains the output and poster, writes the record, rebuilds the public index, and commits the updated archive.

The first generator creates deterministic SVG relation fields. Larger moving-image and audio files can later move to external storage without changing their archive references.

## Local run

```bash
python scripts/archive_cycle.py --generator signal-field-svg --seed 1701
python -m http.server 8000
```
