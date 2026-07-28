#!/usr/bin/env python3
"""CLI adapter for the Quartz Transmission conversation generator."""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Render Quartz Transmission.")
    parser.add_argument("--seed", type=int, required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--thumbnail", required=True)
    args = parser.parse_args()

    source_path = Path(__file__).with_name("generator.py")
    source = source_path.read_text(encoding="utf-8")
    source = source.replace(
        "OUT = '/mnt/data/quartz_transmission_90s_1bit.mp4'",
        f"OUT = {args.output!r}",
        1,
    )
    source = source.replace("SEED = 41", f"SEED = {args.seed}", 1)

    namespace = {"__name__": "__main__", "__file__": str(source_path)}
    exec(compile(source, str(source_path), "exec"), namespace, namespace)

    subprocess.run(
        [
            "ffmpeg", "-y", "-ss", "45", "-i", args.output,
            "-frames:v", "1", "-q:v", "2", args.thumbnail,
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
