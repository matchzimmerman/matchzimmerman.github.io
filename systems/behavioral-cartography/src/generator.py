from __future__ import annotations

import argparse
import subprocess
import tempfile
import wave
from pathlib import Path

import cv2
import numpy as np

W, H, FPS, DURATION, SR = 540, 960, 10, 22.0, 32000
BLACK = (0, 0, 0)
PANEL = (3, 5, 8)
EDGE = (10, 44, 76)
ORANGE_HOT = (0, 126, 255)
ORANGE = (0, 88, 235)
ORANGE_SOFT = (16, 144, 255)
ORANGE_DIM = (5, 50, 150)
ORANGE_DARK = (2, 24, 76)
YELLOW = (30, 228, 248)
BLUE = (235, 120, 30)
GREEN = (76, 208, 88)
PURPLE = (150, 28, 90)
FONT = cv2.FONT_HERSHEY_SIMPLEX

START = np.array([72.0, 70.0], np.float32)
END = np.array([255.0, 325.0], np.float32)
VEC = END - START
DIR = VEC / np.linalg.norm(VEC)
PERP = np.array([-DIR[1], DIR[0]], np.float32)

FIGURES = [
    (1.2, 12.8, -18.0, 0),
    (2.8, 15.6, 14.0, 1),
    (4.0, 18.0, -4.0, 2),
    (6.0, 20.6, 22.0, 1),
    (8.0, 21.5, -24.0, 0),
]


def smooth(a, b, x):
    q = np.clip((x - a) / (b - a), 0, 1)
    return q * q * (3 - 2 * q)


def put(img, text, xy, color=ORANGE, scale=.23):
    x, y = xy
    cv2.putText(img, text, (x + 1, y + 1), FONT, scale, BLACK, 3, cv2.LINE_AA)
    cv2.putText(img, text, (x, y), FONT, scale, color, 1, cv2.LINE_AA)


def panel(img, x1, y1, x2, y2, title=""):
    cv2.rectangle(img, (x1, y1), (x2, y2), PANEL, -1)
    cv2.rectangle(img, (x1, y1), (x2, y2), EDGE, 1)
    if title:
        put(img, title, (x1 + 7, y1 + 17))
        cv2.line(img, (x1 + 5, y1 + 26), (x2 - 5, y1 + 26), ORANGE_DARK, 1)


def add_blob(field, cx, cy, sx, sy, strength):
    yy, xx = np.mgrid[0:field.shape[0], 0:field.shape[1]].astype(np.float32)
    field += np.exp(-(((xx - cx) ** 2) / (2 * sx ** 2) + ((yy - cy) ** 2) / (2 * sy ** 2))) * strength


def palette(field):
    stops = np.array([
        [10, 5, 8], [60, 18, 32], [125, 28, 64],
        [60, 58, 165], [0, 138, 255], [58, 245, 255]
    ], np.float32)
    x = np.clip(field, 0, 1) * (len(stops) - 1)
    lo = np.floor(x).astype(int)
    hi = np.minimum(lo + 1, len(stops) - 1)
    q = (x - lo)[..., None]
    return (stops[lo] * (1 - q) + stops[hi] * q).astype(np.uint8)


def state(t):
    figures = []
    for i, (a, b, lane, kind) in enumerate(FIGURES):
        visible = float(smooth(a, a + .8, t) * (1 - smooth(b - .8, b, t)))
        progress = float(np.clip((t - a) / (b - a), 0, 1))
        sway = 4 * np.sin(t * (.9 + .06 * i) + i * 1.2)
        position = START + VEC * progress + PERP * (lane + sway)
        figures.append((visible, progress, position, kind, i))
    count = sum(v > .03 for v, *_ in figures)
    density = float(np.clip(sum(v for v, *_ in figures) / len(figures), 0, 1))
    return figures, count, density


def thermal_feed(t, figures, seed):
    rng = np.random.default_rng(seed + int(t * FPS))
    fh, fw = 380, 324
    field = np.full((fh, fw), .045, np.float32)
    yy, xx = np.mgrid[0:fh, 0:fw].astype(np.float32)
    dx, dy = VEC
    dist = np.abs(dy * xx - dx * yy + END[0] * START[1] - END[1] * START[0]) / np.linalg.norm(VEC)
    along = ((xx - START[0]) * dx + (yy - START[1]) * dy) / np.dot(VEC, VEC)
    field[(dist < 34) & (along > -.1) & (along < 1.1)] += .15

    for visible, _, position, kind, index in figures:
        if visible <= .02:
            continue
        px, py = position
        wob = np.sin(t * (4.6 + index * .2) + index)
        profiles = [
            [(0, -16, 9, 11, .74), (5*wob, 5, 13, 18, .86), (-7*wob, 20, 11, 15, .58)],
            [(0, -12, 12, 10, .82), (4*wob, 8, 16, 15, .78), (-5*wob, 24, 14, 11, .48)],
            [(0, -18, 7, 13, .66), (6*wob, 4, 11, 20, .90), (-8*wob, 24, 10, 17, .62)],
        ]
        for ox, oy, sx, sy, strength in profiles[kind]:
            add_blob(field, px + ox, py + oy, sx, sy, strength * visible)
        add_blob(field, px - DIR[0] * 18, py - DIR[1] * 18, 18, 10, .20 * visible)

    field += rng.normal(0, .02, field.shape)
    image = palette(field)
    image = cv2.resize(cv2.resize(image, (fw // 2, fh // 2), interpolation=cv2.INTER_AREA), (fw, fh), interpolation=cv2.INTER_NEAREST)

    for side in (-36, 36):
        a = START + PERP * side
        b = END + PERP * side
        cv2.line(image, tuple(a.astype(int)), tuple(b.astype(int)), BLUE if side < 0 else PURPLE, 1)

    scan_y = int(18 + ((t / 2.6) % 1) * (fh - 36))
    cv2.line(image, (4, scan_y), (fw - 4, scan_y), YELLOW, 1)

    for visible, _, position, kind, index in sorted(figures, key=lambda item: item[2][1]):
        if visible <= .08:
            continue
        px, py = position.astype(int)
        width, height = [(28, 42), (34, 36), (24, 48)][kind]
        color = [YELLOW, ORANGE, BLUE, GREEN, ORANGE_HOT][index]
        cv2.rectangle(image, (px - width // 2, py - height // 2), (px + width // 2, py + height // 2), color, 1)
        cv2.circle(image, (px, py), 2, color, 1)

    return image


def render(seed: int, output: Path, thumbnail: Path):
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp = Path(tmp_dir)
        raw = tmp / "raw.mp4"
        audio_path = tmp / "audio.wav"
        writer = cv2.VideoWriter(str(raw), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (W, H))
        if not writer.isOpened():
            raise RuntimeError("Unable to open video writer")

        thumbnail_frame = None
        for frame_number in range(int(FPS * DURATION)):
            t = frame_number / FPS
            figures, count, density = state(t)
            frame = np.zeros((H, W, 3), np.uint8)
            panel(frame, 12, 12, 528, 74)
            put(frame, "FIELD STATION: MAGPIE", (24, 40), ORANGE_HOT, .67)
            put(frame, "M3R0 // BEHAVIORAL CARTOGRAPHY", (24, 63), ORANGE_SOFT, .33)
            panel(frame, 114, 88, 456, 506, "THERMAL FEED // DIAGONAL ALLEY")
            frame[116:496, 123:447] = thermal_feed(t, figures, seed)
            cv2.rectangle(frame, (123, 116), (447, 496), EDGE, 1)

            panel(frame, 12, 88, 104, 226, "COUNTS")
            put(frame, "SUBJ", (20, 132), ORANGE_DIM)
            put(frame, f"{count:02d}", (62, 132))
            put(frame, "DENS", (20, 160), ORANGE_DIM)
            put(frame, f"{int(density*100):02d}%", (62, 160))

            panel(frame, 12, 516, 528, 664, "RESIDUAL PATH FIELD")
            points = []
            for x in range(24, 516):
                phase = (x - 24) / 492
                y = int(604 - density * (16*np.sin(phase*8+t*1.6) + 7*np.sin(phase*17+t*.7)))
                points.append((x, y))
            cv2.polylines(frame, [np.asarray(points, np.int32)], False, ORANGE, 1)

            panel(frame, 12, 674, 528, 930, "AB'S LOGS // BEHAVIORAL CARTOGRAPHY")
            events = [
                (.5, "CAM 02", "OVERHEAD THERMAL ONLINE"),
                (2.8, "HEAT TRACE", "SUBJECT 01 ENTERING"),
                (4.0, "GROUP", "MULTIPLE SIGNATURES"),
                (6.0, "OCCLUSION", "TRACKS MAINTAINED"),
                (8.0, "FLOW", "DIAGONAL MOVEMENT"),
                (12.4, "PATH FIELD", "RESIDUAL ROUTES ACTIVE"),
                (18.0, "ZONE EXIT", "LEAD SUBJECTS LEAVING"),
                (20.5, "STATUS", "MONITORING"),
            ]
            for i, (event_time, label, message) in enumerate([e for e in events if e[0] <= t][-8:]):
                y = 718 + i * 24
                put(frame, f"12:58:{10+int(event_time):02d}", (20, y), ORANGE_DIM)
                put(frame, label, (103, y))
                put(frame, message, (230, y), ORANGE_SOFT)

            writer.write(frame)
            if thumbnail_frame is None and t >= 10:
                thumbnail_frame = frame.copy()

        writer.release()
        thumbnail.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(thumbnail), thumbnail_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 92])

        timeline = np.linspace(0, DURATION, int(SR * DURATION), endpoint=False, dtype=np.float32)
        density = np.zeros_like(timeline)
        pan_numerator = np.zeros_like(timeline)
        weights = np.zeros_like(timeline)
        for a, b, _, _ in FIGURES:
            visible = smooth(a, a + .8, timeline) * (1 - smooth(b - .8, b, timeline))
            progress = np.clip((timeline - a) / (b - a), 0, 1)
            density += visible / len(FIGURES)
            pan_numerator += visible * progress
            weights += visible
        pan = np.divide(pan_numerator, weights, out=np.full_like(pan_numerator, .5), where=weights > 1e-6)

        def oscillator(frequency, phase=0):
            return np.sin(2*np.pi*np.cumsum(frequency)/SR + phase).astype(np.float32)

        root = 48 + 10 * density
        signal = oscillator(root) * (.045 + .06*density)
        signal += oscillator(root*1.5, .4) * (.015 + .04*density)
        left = signal * np.sqrt(1 - np.clip(pan, .08, .92))
        right = signal * np.sqrt(np.clip(pan, .08, .92))
        audio = np.tanh(np.column_stack([left, right]) * 1.35)
        audio /= max(np.max(np.abs(audio)), 1e-8)
        audio *= .8

        with wave.open(str(audio_path), "wb") as audio_file:
            audio_file.setnchannels(2)
            audio_file.setsampwidth(2)
            audio_file.setframerate(SR)
            audio_file.writeframes((audio*32767).astype(np.int16).tobytes())

        output.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(raw), "-i", str(audio_path),
            "-c:v", "libx264", "-crf", "20", "-profile:v", "main",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
            "-movflags", "+faststart", "-shortest", str(output)
        ], check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--thumbnail", type=Path, required=True)
    args = parser.parse_args()
    render(args.seed, args.output, args.thumbnail)


if __name__ == "__main__":
    main()
