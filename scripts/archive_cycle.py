#!/usr/bin/env python3
"""Run one registered procedural generator and append an immutable archive record."""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import random
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATORS = ROOT / "data" / "generators.json"
RECORDS = ROOT / "archive" / "records"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_timestamp(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(dt.timezone.utc)


def all_records():
    records = []
    if not RECORDS.exists():
        return records
    for path in RECORDS.glob("*.json"):
        try:
            records.append(load_json(path))
        except (ValueError, json.JSONDecodeError):
            continue
    return records


def latest_generated_at() -> dt.datetime | None:
    timestamps = []
    for record in all_records():
        try:
            timestamps.append(parse_timestamp(record["generated_at"]))
        except (KeyError, ValueError):
            continue
    return max(timestamps, default=None)


def latest_generator_record(generator_id: str):
    records = [record for record in all_records() if record.get("generator_id") == generator_id]
    records.sort(key=lambda item: item.get("generated_at", ""), reverse=True)
    return records[0] if records else None


def generator_generation(generator_id: str) -> int:
    records = [record for record in all_records() if record.get("generator_id") == generator_id]
    explicit = [int(record.get("lineage_generation", 0)) for record in records if record.get("lineage_generation")]
    return max(explicit, default=len(records)) + 1


def next_serial(day: str) -> int:
    prefix = f"MZFS.EXE.{day}."
    serials = []
    for path in RECORDS.glob(f"{prefix}*.json"):
        try:
            serials.append(int(path.stem.rsplit(".", 1)[-1]))
        except ValueError:
            continue
    return max(serials, default=0) + 1


def select_generator(slug: str | None):
    generators = [item for item in load_json(GENERATORS) if item.get("enabled")]
    if slug:
        for generator in generators:
            if generator["slug"] == slug:
                return generator
        raise SystemExit(f"No enabled generator named {slug!r}.")
    weighted = []
    for generator in generators:
        weighted.extend([generator] * max(1, int(generator.get("schedule_weight", 1))))
    if not weighted:
        raise SystemExit("No enabled generators are registered.")
    return random.SystemRandom().choice(weighted)


def browser_uri(relative_path: Path) -> str:
    return "../" + relative_path.as_posix()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--generator")
    parser.add_argument("--seed", type=int)
    parser.add_argument("--timestamp")
    parser.add_argument(
        "--minimum-age-minutes",
        type=int,
        default=0,
        help="Skip generation when the newest retained execution is younger than this threshold.",
    )
    args = parser.parse_args()

    now = parse_timestamp(args.timestamp) if args.timestamp else dt.datetime.now(dt.timezone.utc)
    latest = latest_generated_at()
    if latest is not None and args.minimum_age_minutes > 0:
        age_minutes = (now - latest).total_seconds() / 60
        if age_minutes < args.minimum_age_minutes:
            print(
                f"Archive is current: newest execution is {age_minutes:.1f} minutes old; "
                f"minimum age is {args.minimum_age_minutes} minutes."
            )
            return

    day = now.strftime("%Y%m%d")
    execution_id = f"MZFS.EXE.{day}.{next_serial(day):06d}"
    generator = select_generator(args.generator)
    seed = args.seed if args.seed is not None else random.SystemRandom().randrange(1, 2_147_483_647)
    parent = latest_generator_record(generator["id"])
    parent_id = parent.get("id") if parent else None

    output_directory = Path("archive") / "executions" / now.strftime("%Y/%m")
    relative_asset = output_directory / f"{execution_id}.{generator['extension']}"
    asset_path = ROOT / relative_asset
    asset_path.parent.mkdir(parents=True, exist_ok=True)

    command = list(generator["command"]) + ["--seed", str(seed), "--output", str(asset_path)]
    if generator["media_type"].startswith("image/"):
        relative_thumbnail = relative_asset
        thumbnail_path = asset_path
    else:
        thumbnail_extension = generator.get("thumbnail_extension")
        if not thumbnail_extension:
            raise SystemExit("Non-image generators must declare thumbnail_extension.")
        relative_thumbnail = output_directory / f"{execution_id}.thumb.{thumbnail_extension}"
        thumbnail_path = ROOT / relative_thumbnail
        command.extend(["--thumbnail", str(thumbnail_path)])

    generated_metadata = {}
    relative_state_snapshot = None
    event_record = None

    with tempfile.TemporaryDirectory() as temporary_directory:
        temporary = Path(temporary_directory)
        next_state = temporary / "next-state.json"
        metadata_path = temporary / "metadata.json"

        if generator.get("stateful"):
            generation = generator_generation(generator["id"])
            state_path = ROOT / generator["state_path"]
            command.extend(
                [
                    "--state-out", str(next_state),
                    "--metadata-out", str(metadata_path),
                    "--generation", str(generation),
                    "--execution-id", execution_id,
                ]
            )
            if state_path.exists():
                command.extend(["--state-in", str(state_path)])
            if parent_id:
                command.extend(["--parent-id", parent_id])
            if parent and parent.get("seed") is not None:
                command.extend(["--parent-seed", str(parent["seed"])])

        subprocess.run(command, cwd=ROOT, check=True)
        if not asset_path.exists() or not thumbnail_path.exists():
            raise SystemExit("Generator output or thumbnail is missing.")

        if generator.get("stateful"):
            if not next_state.exists() or not metadata_path.exists():
                raise SystemExit("Stateful generator did not produce state and metadata outputs.")
            generated_metadata = load_json(metadata_path)
            state_path = ROOT / generator["state_path"]
            state_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(next_state, state_path)

            snapshot_directory = Path(generator["state_snapshot_directory"])
            relative_state_snapshot = snapshot_directory / f"{execution_id}.json"
            snapshot_path = ROOT / relative_state_snapshot
            snapshot_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(next_state, snapshot_path)

            if generated_metadata.get("event_log"):
                event_directory = Path(generator.get("event_log_directory", "archive/events"))
                relative_event = event_directory / f"{execution_id}.json"
                event_record = {
                    "id": f"MZFS.EVENT.{execution_id.split('.', 2)[-1]}",
                    "timestamp": now.isoformat().replace("+00:00", "Z"),
                    "show": generator["title"],
                    "archive_id": execution_id,
                    "parent_archive_id": parent_id,
                    "event": generated_metadata["event_log"],
                    "prior_state": generated_metadata.get("metrics_before"),
                    "resulting_state": generated_metadata.get("metrics_after"),
                    "certainty": "confirmed",
                    "speculative_interpretation": generated_metadata.get("key_change_text"),
                    "related_assets": [browser_uri(relative_asset), browser_uri(relative_state_snapshot)],
                }
                write_json(ROOT / relative_event, event_record)

    record = {
        "id": execution_id,
        "record_type": "execution",
        "title": generated_metadata.get("title", generator["title"]),
        "generated_at": now.isoformat().replace("+00:00", "Z"),
        "generator_id": generator["id"],
        "generator_version": generator["version"],
        "family_id": generator["family_id"],
        "seed": seed,
        "parent_ids": [parent_id] if parent_id else [],
        "status": "UNREVIEWED / RETAINED",
        "media_type": generator["media_type"],
        "asset_uri": browser_uri(relative_asset),
        "thumbnail_uri": browser_uri(relative_thumbnail),
        "source_ref": generator["command"][1],
        "dimensions": generator.get("dimensions"),
        "checksum_sha256": file_hash(asset_path),
        "thumbnail_checksum_sha256": file_hash(thumbnail_path),
        "storage_policy": generator.get("storage_policy"),
        "tags": ["procedural", "scheduled-execution", generator["slug"]],
    }

    lineage_fields = [
        "lineage_generation", "parent_archive_id", "developmental_phase", "topology",
        "node_count", "connection_rules", "field_tension", "drift_direction", "growth_bias",
        "damage", "residue", "anomalies", "palette_state", "mutation_history",
        "metrics_before", "metrics_after", "key_change_type", "key_change_value",
        "key_change_certainty", "key_change_text",
    ]
    for field in lineage_fields:
        if field in generated_metadata:
            record[field] = generated_metadata[field]
    if relative_state_snapshot:
        record["state_snapshot_uri"] = browser_uri(relative_state_snapshot)
    if event_record:
        record["event_log_id"] = event_record["id"]

    RECORDS.mkdir(parents=True, exist_ok=True)
    write_json(RECORDS / f"{execution_id}.json", record)
    subprocess.run([sys.executable, "scripts/build_archive_index.py"], cwd=ROOT, check=True)
    print(execution_id)


if __name__ == "__main__":
    main()
