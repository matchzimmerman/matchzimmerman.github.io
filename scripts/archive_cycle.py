#!/usr/bin/env python3
"""Run one registered procedural generator and append an archive record."""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import random
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATORS = ROOT / "data" / "generators.json"
RECORDS = ROOT / "archive" / "records"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_timestamp(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(dt.timezone.utc)


def latest_generated_at() -> dt.datetime | None:
    latest = None
    if not RECORDS.exists():
        return None
    for path in RECORDS.glob("*.json"):
        try:
            record = load_json(path)
            generated_at = parse_timestamp(record["generated_at"])
        except (KeyError, ValueError, json.JSONDecodeError):
            continue
        if latest is None or generated_at > latest:
            latest = generated_at
    return latest


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

    subprocess.run(command, cwd=ROOT, check=True)
    if not asset_path.exists() or not thumbnail_path.exists():
        raise SystemExit("Generator output or thumbnail is missing.")

    record = {
        "id": execution_id,
        "record_type": "execution",
        "title": generator["title"],
        "generated_at": now.isoformat().replace("+00:00", "Z"),
        "generator_id": generator["id"],
        "generator_version": generator["version"],
        "family_id": generator["family_id"],
        "seed": seed,
        "parent_ids": [],
        "status": "UNREVIEWED / RETAINED",
        "media_type": generator["media_type"],
        "asset_uri": browser_uri(relative_asset),
        "thumbnail_uri": browser_uri(relative_thumbnail),
        "source_ref": generator["command"][1],
        "dimensions": generator.get("dimensions"),
        "checksum_sha256": file_hash(asset_path),
        "thumbnail_checksum_sha256": file_hash(thumbnail_path),
        "storage_policy": generator.get("storage_policy"),
        "tags": ["procedural", "scheduled-execution", generator["slug"]]
    }
    RECORDS.mkdir(parents=True, exist_ok=True)
    (RECORDS / f"{execution_id}.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    subprocess.run([sys.executable, "scripts/build_archive_index.py"], cwd=ROOT, check=True)
    print(execution_id)


if __name__ == "__main__":
    main()
