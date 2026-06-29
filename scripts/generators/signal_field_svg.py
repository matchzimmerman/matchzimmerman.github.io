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
    lines = []
    node_count = 54
    nodes = []
    for i in range(node_count):
        x = 56 + (i % 9) * 106 + rng.uniform(-22, 22)
        y = 54 + (i // 9) * 112 + rng.uniform(-28, 28)
        weight = rng.uniform(.3, 1.0)
        nodes.append((x, y, weight))

    for i, (x1, y1, _) in enumerate(nodes):
        distances = sorted(
            ((math.hypot(x1-x2, y1-y2), j, x2, y2) for j, (x2, y2, _) in enumerate(nodes) if j > i),
            key=lambda item: item[0]
        )[:rng.randint(1, 3)]
        for distance, _, x2, y2 in distances:
            if distance < 240:
                opacity = max(.08, .52 - distance / 520)
                color = '#ff681c' if rng.random() < .16 else '#6fe1bb'
                control_x = (x1 + x2) / 2 + rng.uniform(-36, 36)
                control_y = (y1 + y2) / 2 + rng.uniform(-36, 36)
                lines.append(f'<path d="M{x1:.1f},{y1:.1f} Q{control_x:.1f},{control_y:.1f} {x2:.1f},{y2:.1f}" stroke="{color}" stroke-opacity="{opacity:.3f}"/>')

    circles = []
    for x, y, weight in nodes:
        color = '#ff681c' if weight > .86 else '#6fe1bb'
        circles.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{1.6 + weight*4.8:.1f}" fill="{color}" fill-opacity="{.42 + weight*.48:.3f}"/>')

    traces = []
    for row in range(12):
        points = []
        phase = rng.uniform(0, math.tau)
        for col in range(49):
            x = 20 + col * 20
            y = 34 + row * 58 + math.sin(phase + col * rng.uniform(.12, .2)) * rng.uniform(2, 15)
            points.append(f'{x:.1f},{y:.1f}')
        traces.append(f'<polyline points="{" ".join(points)}" stroke="#d8ddd3" stroke-opacity=".055"/>')

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
<rect width="100%" height="100%" fill="#050706"/>
<g fill="none" stroke-width="1">{''.join(traces)}</g>
<g fill="none" stroke-width="1.25">{''.join(lines)}</g>
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
