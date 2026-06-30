#!/usr/bin/env python3
"""Scaffold a new MAGPIE recovered interface package with collision-safe IDs."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SYSTEMS = ROOT / "systems"
FAMILIES_PATH = ROOT / "data" / "families.json"
GENERATORS_PATH = ROOT / "data" / "generators.json"

MEDIA_DEFAULTS = {
    "video/mp4": ("mp4", "jpg"),
    "image/svg+xml": ("svg", None),
    "image/png": ("png", None),
    "image/jpeg": ("jpg", None),
    "audio/mpeg": ("mp3", "jpg"),
    "audio/wav": ("wav", "jpg"),
}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def next_id(items: list[dict], prefix: str) -> str:
    values = []
    pattern = re.compile(rf"^{re.escape(prefix)}(\d{{4}})$")
    for item in items:
        match = pattern.match(item.get("id", ""))
        if match:
            values.append(int(match.group(1)))
    for manifest_path in SYSTEMS.glob("*/manifest.json"):
        try:
            manifest = load(manifest_path)
        except (ValueError, OSError):
            continue
        block = manifest.get("family") if prefix.endswith("FAM.") else manifest.get("generator")
        match = pattern.match((block or {}).get("id", ""))
        if match:
            values.append(int(match.group(1)))
    return f"{prefix}{max(values, default=0) + 1:04d}"


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--media-type", default="video/mp4")
    parser.add_argument("--dimensions", default="960x720")
    args = parser.parse_args()

    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.slug):
        raise SystemExit("Slug must use lowercase letters, numbers, and single hyphens.")

    package = SYSTEMS / args.slug
    if package.exists():
        raise SystemExit(f"Package already exists: {package.relative_to(ROOT)}")

    try:
        width, height = [int(value) for value in args.dimensions.lower().split("x", 1)]
    except ValueError as error:
        raise SystemExit("Dimensions must look like 960x720.") from error

    extension, thumbnail_extension = MEDIA_DEFAULTS.get(args.media_type, ("bin", "jpg"))
    family_id = next_id(load(FAMILIES_PATH), "MZFS.FAM.")
    generator_id = next_id(load(GENERATORS_PATH), "MZFS.GEN.")

    generator = {
        "id": generator_id,
        "slug": args.slug,
        "title": args.title,
        "version": "0.1.0",
        "enabled": False,
        "schedule_weight": 1,
        "command": ["python", f"systems/{args.slug}/src/generator.py"],
        "media_type": args.media_type,
        "extension": extension,
        "dimensions": [width, height],
        "storage_policy": "repository-under-50mb",
        "stateful": False,
    }
    if thumbnail_extension:
        generator["thumbnail_extension"] = thumbnail_extension

    manifest = {
        "schema_version": "1.0.0",
        "mode": "reference-only",
        "family": {
            "id": family_id,
            "slug": args.slug,
            "title": args.title,
            "status": "DRAFT / INTAKE",
            "summary": "Replace with a concise description of the recovered interface and its behavior.",
            "preview_uri": f"../systems/{args.slug}/reference/preview.jpg",
            "manifest_uri": f"../systems/{args.slug}/manifest.json",
        },
        "generator": generator,
        "provenance": {
            "origin": "conversation recovery",
            "conversation_title": "",
            "source_notes": "",
            "approved_reference_outputs": [],
        },
    }

    readme = f"""# {args.title}

## Recovered from

- Conversation:
- Date recovered:
- Recovery agent:

## What the interface does

Describe the system's visual logic, motion, sound, inputs, outputs, and canonical behavior.

## Approved traits

- aspect ratio: {width}:{height}
- palette:
- typography:
- motion:
- audio:
- display treatment:

## Rejected or deprecated traits

Record failed directions so future agents do not repeat them.

## Runtime

```bash
python systems/{args.slug}/src/generator.py --seed 12345 --output /tmp/output.{extension}"""
    if thumbnail_extension:
        readme += f" --thumbnail /tmp/output.{thumbnail_extension}"
    readme += "\n```\n\n## Autonomy\n\nCurrent mode: `reference-only`\n"

    write(package / "manifest.json", json.dumps(manifest, indent=2) + "\n")
    write(package / "README.md", readme)
    write(package / "src" / "README.md", "Place the working generator source files in this directory.\n")
    write(package / "reference" / "README.md", "Place approved conversation outputs here. Use preview.jpg for the site card.\n")
    write(package / "state" / "README.md", "Persistent runtime state belongs here only when the generator is stateful.\n")

    print(f"Created systems/{args.slug}")
    print(f"Family ID: {family_id}")
    print(f"Generator ID: {generator_id}")
    print("Next: add source and reference output, edit manifest.json, then run sync_magpie_systems.py")


if __name__ == "__main__":
    main()
