#!/usr/bin/env python3
"""Generate one deterministic animated FIELD STATION: MAGPIE archive loop."""
from __future__ import annotations

import argparse
import math
import random
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

WIDTH = 960
HEIGHT = 720
FPS = 12
DURATION_SECONDS = 8
FRAME_COUNT = FPS * DURATION_SECONDS

BG = (5, 7, 6, 255)
PAPER = (216, 221, 211, 255)
MUTED = (127, 139, 130, 255)
ORANGE = (255, 104, 28, 255)
PHOSPHOR = (111, 225, 187, 255)


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def quadratic_point(p0, p1, p2, amount: float):
    inverse = 1.0 - amount
    x = inverse * inverse * p0[0] + 2 * inverse * amount * p1[0] + amount * amount * p2[0]
    y = inverse * inverse * p0[1] + 2 * inverse * amount * p1[1] + amount * amount * p2[1]
    return x, y


def draw_curve(draw: ImageDraw.ImageDraw, p0, p1, p2, fill, width: int = 1):
    points = [quadratic_point(p0, p1, p2, index / 28) for index in range(29)]
    draw.line(points, fill=fill, width=width)


def load_fonts():
    try:
        return (
            ImageFont.truetype("DejaVuSansMono.ttf", 18),
            ImageFont.truetype("DejaVuSansMono.ttf", 13),
            ImageFont.truetype("DejaVuSansMono.ttf", 11),
        )
    except OSError:
        fallback = ImageFont.load_default()
        return fallback, fallback, fallback


def build_nodes(rng: random.Random):
    nodes = []
    columns = 8
    rows = 4
    x_margin = 78
    y_margin = 112
    x_step = (WIDTH - x_margin * 2) / (columns - 1)
    y_step = (HEIGHT - y_margin * 2) / (rows - 1)

    for row in range(rows):
        for column in range(columns):
            nodes.append(
                {
                    "x": x_margin + column * x_step + rng.uniform(-24, 24),
                    "y": y_margin + row * y_step + rng.uniform(-30, 30),
                    "phase": rng.uniform(0, math.tau),
                    "weight": rng.uniform(0.35, 1.0),
                    "x_motion": rng.uniform(3, 13),
                    "y_motion": rng.uniform(3, 11),
                }
            )
    return nodes


def build_connections(nodes, rng: random.Random):
    connections = []
    for index, node in enumerate(nodes):
        distances = []
        for other_index, other in enumerate(nodes):
            if other_index <= index:
                continue
            distance = math.hypot(other["x"] - node["x"], other["y"] - node["y"])
            distances.append((distance, other_index))
        distances.sort(key=lambda item: item[0])

        for _, other_index in distances[:2]:
            other = nodes[other_index]
            connections.append(
                {
                    "a": index,
                    "b": other_index,
                    "curve_x": (node["x"] + other["x"]) / 2 + rng.uniform(-34, 34),
                    "curve_y": (node["y"] + other["y"]) / 2 + rng.uniform(-34, 34),
                    "phase": rng.uniform(0, math.tau),
                    "orange": rng.random() < 0.22,
                }
            )
    return connections


def node_position(node, loop_phase: float):
    x = node["x"] + math.sin(loop_phase + node["phase"]) * node["x_motion"]
    y = node["y"] + math.cos(loop_phase + node["phase"]) * node["y_motion"]
    return x, y


def render_frame(frame_index: int, seed: int, nodes, connections, fonts):
    header_font, body_font, small_font = fonts
    loop_phase = math.tau * frame_index / FRAME_COUNT

    base = Image.new("RGBA", (WIDTH, HEIGHT), BG)
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    crisp = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    scan = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))

    base_draw = ImageDraw.Draw(base)
    glow_draw = ImageDraw.Draw(glow)
    crisp_draw = ImageDraw.Draw(crisp)
    scan_draw = ImageDraw.Draw(scan)

    # Background signal traces.
    for band in range(10):
        points = []
        base_y = 84 + band * 62
        amplitude = 6 + (band % 4) * 3
        for x in range(0, WIDTH + 1, 18):
            y = base_y + math.sin(x * 0.012 + loop_phase + band * 0.42) * amplitude
            points.append((x, y))
        crisp_draw.line(points, fill=(216, 221, 211, 12), width=1)

    positions = [node_position(node, loop_phase) for node in nodes]

    # Shared-state connection field.
    for connection in connections:
        a = nodes[connection["a"]]
        b = nodes[connection["b"]]
        p0 = positions[connection["a"]]
        p2 = positions[connection["b"]]
        pulse = 0.5 + 0.5 * math.sin(loop_phase * 2 + connection["phase"])
        color = ORANGE if connection["orange"] else PHOSPHOR
        p1 = (
            connection["curve_x"] + math.sin(loop_phase + connection["phase"]) * 10,
            connection["curve_y"] + math.cos(loop_phase + connection["phase"]) * 10,
        )

        draw_curve(
            glow_draw,
            p0,
            p1,
            p2,
            (color[0], color[1], color[2], int(24 + pulse * 34)),
            width=5,
        )
        draw_curve(
            crisp_draw,
            p0,
            p1,
            p2,
            (color[0], color[1], color[2], int(78 + pulse * 112)),
            width=1,
        )

    # Nodes and event-weight pulses.
    for node, (x, y) in zip(nodes, positions):
        pulse = 0.5 + 0.5 * math.sin(loop_phase * 2 + node["phase"])
        radius = 2.5 + node["weight"] * 4.2 + pulse * 1.6
        color = ORANGE if node["weight"] > 0.82 and pulse > 0.65 else PHOSPHOR
        bounds = (x - radius, y - radius, x + radius, y + radius)
        glow_draw.ellipse(
            (bounds[0] - 3, bounds[1] - 3, bounds[2] + 3, bounds[3] + 3),
            fill=(color[0], color[1], color[2], 42),
        )
        crisp_draw.ellipse(bounds, fill=(color[0], color[1], color[2], 220))

    # Simulated camera/CRT exposure mismatch. Periodic for a clean loop.
    band_center = int((frame_index / FRAME_COUNT) * (HEIGHT + 120)) - 60
    for offset in range(-32, 33):
        alpha = int(clamp(24 - abs(offset) * 0.75, 0, 24))
        y = band_center + offset
        if 0 <= y < HEIGHT:
            scan_draw.line((0, y, WIDTH, y), fill=(255, 104, 28, alpha), width=1)

    # Operational interface layer.
    base_draw.rectangle((18, 18, WIDTH - 18, HEIGHT - 18), outline=(255, 104, 28, 86), width=1)
    base_draw.line((18, 64, WIDTH - 18, 64), fill=(216, 221, 211, 30), width=1)
    base_draw.line((18, HEIGHT - 56, WIDTH - 18, HEIGHT - 56), fill=(216, 221, 211, 20), width=1)
    base_draw.text((34, 32), "FIELD STATION: MAGPIE / M3RØ", font=header_font, fill=ORANGE)
    base_draw.text((34, 84), "SIGNAL LOOP / LIVE EXECUTION", font=body_font, fill=PAPER)
    base_draw.text(
        (WIDTH - 184, 32),
        f"FRAME {frame_index + 1:03d}/{FRAME_COUNT:03d}",
        font=small_font,
        fill=MUTED,
    )

    base_draw.rectangle((34, HEIGHT - 42, 250, HEIGHT - 24), outline=(216, 221, 211, 26), width=1)
    base_draw.rectangle((268, HEIGHT - 42, 540, HEIGHT - 24), outline=(216, 221, 211, 26), width=1)
    base_draw.rectangle((558, HEIGHT - 42, WIDTH - 34, HEIGHT - 24), outline=(216, 221, 211, 26), width=1)
    base_draw.text((42, HEIGHT - 39), f"SEED {seed}", font=small_font, fill=MUTED)
    base_draw.text((276, HEIGHT - 39), "RECOVERY CHANNEL ACTIVE", font=small_font, fill=MUTED)
    base_draw.text((566, HEIGHT - 39), "STATE RETAINED / LOOPING", font=small_font, fill=MUTED)

    glow = glow.filter(ImageFilter.GaussianBlur(radius=4))
    frame = Image.alpha_composite(base, glow)
    frame = Image.alpha_composite(frame, crisp)
    frame = Image.alpha_composite(frame, scan)
    return frame.convert("RGB")


def encode_video(frame_directory: Path, output_path: Path):
    command = [
        "ffmpeg",
        "-y",
        "-framerate",
        str(FPS),
        "-start_number",
        "0",
        "-i",
        str(frame_directory / "frame_%04d.png"),
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-crf",
        "22",
        "-preset",
        "medium",
        str(output_path),
    ]
    subprocess.run(command, check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--thumbnail", type=Path, required=True)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.thumbnail.parent.mkdir(parents=True, exist_ok=True)

    rng = random.Random(args.seed)
    nodes = build_nodes(rng)
    connections = build_connections(nodes, rng)
    fonts = load_fonts()

    with tempfile.TemporaryDirectory() as temporary_directory:
        frame_directory = Path(temporary_directory)
        poster = None

        for frame_index in range(FRAME_COUNT):
            frame = render_frame(frame_index, args.seed, nodes, connections, fonts)
            frame.save(frame_directory / f"frame_{frame_index:04d}.png", format="PNG")
            if frame_index == FRAME_COUNT // 2:
                poster = frame.copy()

        if poster is None:
            poster = render_frame(FRAME_COUNT // 2, args.seed, nodes, connections, fonts)

        poster.save(args.thumbnail, format="JPEG", quality=91, optimize=True)
        encode_video(frame_directory, args.output)


if __name__ == "__main__":
    main()
