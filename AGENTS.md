# Repository agent instructions

## FIELD STATION: MAGPIE interface work

Any agent adding, restoring, or automating a MAGPIE interface must begin with:

1. Read `systems/README.md`.
2. Create or update one self-contained package in `systems/<system-slug>/`.
3. Keep approved conversation renders in that package's `reference/` directory.
4. Register the package by running `python scripts/sync_magpie_systems.py`.
5. Rebuild the public archive index with `python scripts/build_archive_index.py`.
6. Do not hand-edit generated execution records or overwrite another system's state.

The public handoff page is `/field-station-magpie/system-intake.html`.

Existing legacy generators under `scripts/generators/` may remain in place. New generators should use the package structure documented in `systems/README.md`.
