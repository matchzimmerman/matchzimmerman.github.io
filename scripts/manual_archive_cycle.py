#!/usr/bin/env python3
"""Run one explicitly requested MAGPIE generator, including manual-mode packages."""
from __future__ import annotations

import archive_cycle


def select_explicit_generator(slug: str | None):
    if not slug:
        raise SystemExit("Manual archive execution requires --generator <slug>.")
    for generator in archive_cycle.load_json(archive_cycle.GENERATORS):
        if generator.get("slug") == slug:
            return generator
    raise SystemExit(f"No registered generator named {slug!r}.")


archive_cycle.select_generator = select_explicit_generator


if __name__ == "__main__":
    archive_cycle.main()
