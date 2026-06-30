#!/usr/bin/env python3
"""Validate MAGPIE system packages and upsert them into the public registries."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SYSTEMS = ROOT / "systems"
FAMILIES_PATH = ROOT / "data" / "families.json"
GENERATORS_PATH = ROOT / "data" / "generators.json"
PACKAGES_PATH = ROOT / "data" / "system-packages.json"

ID_PATTERNS = {
    "family": re.compile(r"^MZFS\.FAM\.(\d{4})$"),
    "generator": re.compile(r"^MZFS\.GEN\.(\d{4})$"),
}
VALID_MODES = {"reference-only", "manual", "scheduled", "stateful-scheduled"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def require(mapping: dict, key: str, context: str):
    value = mapping.get(key)
    if value in (None, "", []):
        raise SystemExit(f"{context}: missing required field {key!r}")
    return value


def validate_id(value: str, kind: str, context: str) -> None:
    if not ID_PATTERNS[kind].match(value):
        raise SystemExit(f"{context}: invalid {kind} id {value!r}")


def browser_uri(path: Path) -> str:
    return "../" + path.relative_to(ROOT).as_posix()


def registry_conflict(items: list[dict], candidate: dict, context: str) -> None:
    for item in items:
        if item.get("id") == candidate.get("id") and item.get("slug") != candidate.get("slug"):
            raise SystemExit(
                f"{context}: id {candidate['id']} already belongs to slug {item.get('slug')!r}"
            )
        if item.get("slug") == candidate.get("slug") and item.get("id") != candidate.get("id"):
            raise SystemExit(
                f"{context}: slug {candidate['slug']!r} already belongs to id {item.get('id')!r}"
            )


def upsert(items: list[dict], candidate: dict) -> None:
    for index, item in enumerate(items):
        if item.get("id") == candidate.get("id"):
            items[index] = candidate
            return
    items.append(candidate)


def id_sort(item: dict):
    match = re.search(r"(\d+)$", item.get("id", ""))
    return int(match.group(1)) if match else 999999


def normalize_package(manifest_path: Path) -> tuple[dict, dict | None, dict]:
    package_dir = manifest_path.parent
    slug = package_dir.name
    context = manifest_path.relative_to(ROOT).as_posix()
    manifest = load(manifest_path)

    mode = require(manifest, "mode", context)
    if mode not in VALID_MODES:
        raise SystemExit(f"{context}: unsupported mode {mode!r}")

    family = dict(require(manifest, "family", context))
    family_id = require(family, "id", context)
    validate_id(family_id, "family", context)
    if require(family, "slug", context) != slug:
        raise SystemExit(f"{context}: family slug must match directory name {slug!r}")
    require(family, "title", context)
    require(family, "status", context)
    require(family, "summary", context)

    family["autonomy_mode"] = mode
    family["source_directory"] = f"systems/{slug}"
    family["manifest_uri"] = browser_uri(manifest_path)

    preview_path = package_dir / "reference" / "preview.jpg"
    if preview_path.exists():
        family["preview_uri"] = browser_uri(preview_path)
    elif family.get("preview_uri"):
        family["preview_uri"] = family["preview_uri"]

    generator_payload = manifest.get("generator")
    generator = None
    if generator_payload:
        generator = dict(generator_payload)
        generator_id = require(generator, "id", context)
        validate_id(generator_id, "generator", context)
        if require(generator, "slug", context) != slug:
            raise SystemExit(f"{context}: generator slug must match directory name {slug!r}")
        require(generator, "title", context)
        require(generator, "version", context)
        command = require(generator, "command", context)
        if not isinstance(command, list) or len(command) < 2:
            raise SystemExit(f"{context}: generator command must contain an executable and source path")
        require(generator, "media_type", context)
        require(generator, "extension", context)
        generator["family_id"] = family_id
        generator["package_path"] = f"systems/{slug}"
        generator["autonomy_mode"] = mode
        generator["schedule_weight"] = max(1, int(generator.get("schedule_weight", 1)))

        if mode in {"reference-only", "manual"}:
            generator["enabled"] = False
        else:
            generator["enabled"] = True

        if not str(generator["media_type"]).startswith("image/") and not generator.get("thumbnail_extension"):
            raise SystemExit(f"{context}: non-image generators require thumbnail_extension")

        source_path = ROOT / command[1]
        if mode != "reference-only" and not source_path.exists():
            raise SystemExit(f"{context}: generator source does not exist: {command[1]}")

        stateful = mode == "stateful-scheduled" or bool(generator.get("stateful"))
        generator["stateful"] = stateful
        if stateful:
            generator.setdefault("state_path", f"systems/{slug}/state/current.json")
            generator.setdefault("state_snapshot_directory", f"archive/states/{slug}")
            generator.setdefault("event_log_directory", "archive/events")

    if mode != "reference-only" and generator is None:
        raise SystemExit(f"{context}: mode {mode!r} requires a generator block")

    provenance = dict(manifest.get("provenance") or {})
    provenance.setdefault("origin", "conversation recovery")
    package_summary = {
        "slug": slug,
        "mode": mode,
        "family_id": family_id,
        "generator_id": generator.get("id") if generator else None,
        "title": family["title"],
        "status": family["status"],
        "summary": family["summary"],
        "preview_uri": family.get("preview_uri"),
        "manifest_uri": family["manifest_uri"],
        "source_directory": family["source_directory"],
        "conversation_title": provenance.get("conversation_title", ""),
        "approved_reference_outputs": provenance.get("approved_reference_outputs", []),
    }
    return family, generator, package_summary


def main() -> None:
    families = load(FAMILIES_PATH)
    generators = load(GENERATORS_PATH)
    package_summaries = []

    manifests = sorted(
        path for path in SYSTEMS.glob("*/manifest.json") if path.parent.name != "_template"
    )
    for manifest_path in manifests:
        family, generator, package_summary = normalize_package(manifest_path)
        registry_conflict(families, family, manifest_path.as_posix())
        upsert(families, family)
        if generator:
            registry_conflict(generators, generator, manifest_path.as_posix())
            upsert(generators, generator)
        package_summaries.append(package_summary)

    families.sort(key=id_sort)
    generators.sort(key=id_sort)
    write(FAMILIES_PATH, families)
    write(GENERATORS_PATH, generators)
    write(
        PACKAGES_PATH,
        {
            "schema_version": "1.0.0",
            "generated_at": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
            "count": len(package_summaries),
            "packages": package_summaries,
        },
    )
    print(f"Synced {len(package_summaries)} MAGPIE system package(s).")


if __name__ == "__main__":
    main()
