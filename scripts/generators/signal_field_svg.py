#!/usr/bin/env python3
"""Generate one deterministic MAGPIE signal-field SVG execution."""
from __future__ import annotations

import argparse
import json
import math
import random
from pathlib import Path


def build_svg(seed: int, width: int = 960, height: int = 720) -> str:
    rng = random.Random(seed)
    nodes = []
    for i in range(32):
        x = 64 + (i % 8) * 118 + rng.uniform(-24, 24)
        y = 80 + (i // 8) * 174 + rng.uniform(-30, 30)
        weight = rng.uniform(.3, 1.0)
        nodes.append((x, y, weight))

    paths = []
    for i, (x1, y1, _) in enumerate(nodes):
        nearest = sorted(
            ((math.hypot(x1-x2, y1-y2), x2, y2) for j, (x2, y2, _) in enumerate(nodes) if j > i),
            key=lambda item: item[0]
        )[:2]
        for distance, x2, y2 in nearest:
            if distance < 250:
                color = '#ff681c' if rng.random() < .18 else '#6fe1bb'
                opacity = max(.10, .56 - distance / 520)
                cx = (x1 + x2) / 2 + rng.uniform(-34, 34)
                cy = (y1 + y2) / 2 + rng.uniform(-34, 34)
                paths.append(f'<path d="M{x1:.1f},{y1:.1f}Q{cx:.1f},{cy:.1f} {x2:.1f},{y2:.1f}" stroke="{color}" stroke-opacity="{opacity:.3f}"/>')

    circles = [
        f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{1.8 + weight*5:.1f}" fill="{"#ff681c" if weight > .88 else "#6fe1bb"}" fill-opacity="{.45 + weight*.45:.3f}"/>'
        for x, y, weight in nodes
    ]
    traces = []
    for row in range(8):
        y = 72 + row * 82
        wave = 10 + rng.randint(0, 18)
        traces.append(f'<path d="M20,{y}q120,-{wave} 240,0t240,0t240,0t240,0"/>')

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
<rect width="960" height="720" fill="#050706"/>
<g fill="none" stroke="#d8ddd3" stroke-opacity=".055">{''.join(traces)}</g>
<g fill="none" stroke-width="1.25">{''.join(paths)}</g>
<g>{''.join(circles)}</g>
<rect x="18" y="18" width="924" height="684" fill="none" stroke="#ff681c" stroke-opacity=".34"/>
<text x="34" y="46" fill="#ff681c" font-family="monospace" font-size="13">FIELD STATION: MAGPIE / SIGNAL MEMORY</text>
<text x="34" y="682" fill="#7f8b82" font-family="monospace" font-size="11">SEED {seed} / RELATION FIELD RETAINED</text>
</svg>'''


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--seed', type=int, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--metadata', type=Path)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(build_svg(args.seed), encoding='utf-8')
    if args.metadata:
        args.metadata.write_text(json.dumps({"seed": args.seed, "width": 960, "height": 720, "format": "svg"}, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
