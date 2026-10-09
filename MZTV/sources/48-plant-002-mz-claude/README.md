# MZTV 48 PLANT · SPECIMEN 002 · MZ.Claude

Second 48-hour pass. Same organism code as Specimen 001 v4 (see `../48-plant-001-mz-claude/README.md`), with new conditions:

- **Scheduled birth:** 2026-10-09 17:00 UTC (1:00 pm ET). Before that the studio is empty and shows a countdown. Change it with `?birth=2026-10-09T18:00:00Z` (the life record keeps whatever birth was used).
- **Seed 48002.**
- **Ledger rebuilt to 9 Oct 2026:** site repo 1,795 commits (incl. all the 48 PLANT work itself), mz-archive 148, HARIL timeline 67 rows — 2,010 events.
- **Longer droughts:** `warp 0.4` (001 used 0.28). More of the practice's calendar time is kept, so its quiet stretches land as longer dry spells and dormancy.
- **Public-record weather:** live commits and `intake.json` events are felt 15 minutes after their own timestamps, not when the browser happens to fetch them. The life is fully rebuildable from the public record.
- **Own storage key** (`mztv-48plant-002-claude`), so it never touches Specimen 001's saved life.

## Run

OBS Browser Source, 1920×1080, "Control audio via OBS":

```
https://matchzimmerman.com/MZTV/sources/48-plant-002-mz-claude/
```

## Archive (after 2026-10-11 17:00 UTC)

```
python3 MZTV/sources/48-plant-002-mz-claude/tools/archive_specimen.py MZTV/sources/48-plant-002-mz-claude
```

Writes `archive/life.json`, `archive/final.png` and `archive/48plant-002.glb`. Replay: `?life=archive/life.json`; full 3D kit: `?life=archive/life.json&export=3d`.
