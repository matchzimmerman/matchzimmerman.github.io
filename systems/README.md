# MAGPIE recovered interface packages

This directory is the canonical intake point for interface scripts and approved outputs recovered from prior conversations.

Each interface belongs in one self-contained package:

```text
systems/<system-slug>/
├── manifest.json
├── README.md
├── src/
│   └── generator.py        # or the actual source files
├── reference/
│   ├── preview.jpg         # preferred card image
│   └── approved-output.mp4 # optional conversation render
└── state/
    └── current.json        # only for stateful systems
```

Autonomous executions do **not** belong in `reference/`. The archive runner writes them to:

```text
archive/executions/YYYY/MM/
archive/records/
archive/states/<system-slug>/
archive/events/
```

## Required handoff procedure

1. Fetch the latest `main` branch.
2. Read `AGENTS.md` and this file.
3. Create a new package from `systems/_template/` or run:

   ```bash
   python scripts/new_magpie_system.py --slug <slug> --title "<title>" --media-type video/mp4
   ```

4. Put working source code in `systems/<slug>/src/`.
5. Put one approved still or thumbnail at `systems/<slug>/reference/preview.jpg` whenever possible.
6. Update `manifest.json` with accurate metadata.
7. Test the generator locally using the required command-line contract below.
8. Run:

   ```bash
   python scripts/sync_magpie_systems.py
   python scripts/build_archive_index.py
   ```

9. Commit the package, both registry files, and the rebuilt archive index.

When an agent can only commit the package, the `MAGPIE system intake` GitHub Action validates the manifest, synchronizes the registries, and rebuilds the public index automatically.

## Generator command-line contract

Every autonomous generator must accept:

```text
--seed <integer>
--output <path>
```

Non-image generators must also accept:

```text
--thumbnail <path>
```

A stateful generator must additionally accept:

```text
--state-in <path>          # optional on first generation
--state-out <path>
--metadata-out <path>
--generation <integer>
--execution-id <archive id>
--parent-id <archive id>   # optional
--parent-seed <integer>    # optional
```

Stateful metadata may include the lineage fields already supported by `scripts/archive_cycle.py`, including developmental phase, metrics, anomalies, mutation history, and key evolution point.

## Autonomy states

Use one of these manifest modes:

- `reference-only`: script and approved outputs are visible, but nothing runs automatically.
- `manual`: registered generator is retained outside the schedule and can be run with `python scripts/manual_archive_cycle.py --generator <slug>`.
- `scheduled`: generator is eligible for the recurring GitHub Actions archive cycle.
- `stateful-scheduled`: scheduled and inherits persistent state across executions.

New packages should default to `reference-only` or `manual`. Do not enable scheduled execution until the script has completed a local test and produces its required thumbnail and metadata reliably.

## Site behavior

After registry sync and index rebuild:

- the interface appears under **The Project → Living Archive → Recovered Interfaces**;
- its preview image is used before any autonomous execution exists;
- scheduled executions accumulate beneath the system rather than replacing the approved reference output;
- scripts, state, outputs, and narrative interpretation remain linked by the system slug and IDs.

## Do not

- do not place new source files directly in `archive/executions/`;
- do not fabricate lineage or anomaly metadata for older outputs;
- do not reuse an existing family or generator ID;
- do not enable a generator that requires unavailable secrets, network access, proprietary fonts, or interactive input;
- do not overwrite another system's persistent state.
