# Repository agent instructions

## FIELD STATION: MAGPIE interface work

Any agent adding, restoring, or automating a MAGPIE interface must begin with:

1. Read `systems/README.md`.
2. Check `systems/` for an existing reserved package before creating anything new.
3. Update the matching package when the interface already belongs to a registered family; do not create a duplicate family.
4. Only scaffold a new package when no existing slug or family matches the recovered work.
5. Keep approved conversation renders in that package's `reference/` directory and executable source in `src/`.
6. Register the package by running `python scripts/sync_magpie_systems.py`.
7. Rebuild the public archive index with `python scripts/build_archive_index.py`.
8. Do not hand-edit generated execution records or overwrite another system's state.

The public handoff page is `/field-station-magpie/system-intake.html`.

Existing legacy generators under `scripts/generators/` may remain in place until their source is deliberately migrated. New generators should use the package structure documented in `systems/README.md`.
