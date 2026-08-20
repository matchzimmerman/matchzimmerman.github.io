#!/usr/bin/env python3
import argparse, math, subprocess, wave
from pathlib import Path

import cv2
import numpy as np

W, H = 640, 360
FPS = 12
DURATION = 60
TOTAL = FPS * DURATION
SR = 44100
ORANGE = (28, 126, 255)  # BGR


def smooth(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def phase(t, a, b):
    return smooth((t - a) / (b - a)) if b > a else 0.0


def project(p, yaw, pitch, scale=390, camera=520):
    x, y, z = p
    cy, sy = math.cos(yaw), math.sin(yaw)
    cp, sp = math.cos(pitch), math.sin(pitch)
    x, z = x * cy - z * sy, x * sy + z * cy
    y, z = y * cp - z * sp, y * sp + z * cp
    s = scale / max(150, z + camera)
    return np.array([W / 2 + x * s, H / 2 + y * s]), z


def build_targets():
    pts = []
    for z in (-115, 0, 115):
        for y in (-92, 92):
            for x in (-210, 210):
                pts.append(np.array([x, y, z], float))

    edges = []
    for k in range(3):
        o = 4 * k
        edges += [(o, o + 1), (o + 1, o + 3), (o + 3, o + 2), (o + 2, o)]
    for k in range(2):
        for j in range(4):
            edges.append((4 * k + j, 4 * (k + 1) + j))
    edges += [
        (0, 7), (1, 6), (2, 5), (3, 4), (4, 11), (5, 10), (6, 9), (7, 8),
        (0, 10), (1, 11), (2, 8), (3, 9),
    ]

    extra = []
    for z in (-58, 58):
        for y in (-46, 46):
            for x in (-105, 0, 105):
                extra.append(np.array([x, y, z], float))
    start = len(pts)
    pts.extend(extra)
    for i in range(start, len(pts) - 1):
        if (i - start) % 3 != 2:
            edges.append((i, i + 1))
    for i in range(start, start + 6):
        edges.append((i, i + 6))
    return pts, edges


def synth_audio(path, seed):
    n = int(SR * DURATION)
    tt = np.arange(n) / SR
    audio = np.zeros(n, np.float64)

    audio += 0.16 * np.sin(2 * np.pi * 43.65 * tt)
    audio += 0.08 * np.sin(2 * np.pi * 65.41 * tt + 0.25 * np.sin(2 * np.pi * 0.07 * tt))
    breath = (0.55 + 0.45 * np.sin(2 * np.pi * 0.11 * tt - 1.2)) ** 2
    audio *= 0.65 + 0.35 * breath

    freqs = [130.81, 174.61, 196.00, 261.63, 293.66, 392.00, 523.25, 659.25]
    for i, f in enumerate(freqs):
        env = 0.5 + 0.5 * np.sin(2 * np.pi * (0.018 + 0.003 * i) * tt + i * 0.9)
        env = env ** 3
        audio += (0.018 / (1 + 0.22 * i)) * env * np.sin(2 * np.pi * f * tt + i * 0.4)

    for center in np.arange(21.5, 32.0, 1.75):
        dt = tt - center
        env = np.exp(-np.maximum(dt, 0) * 7.0) * (dt >= 0)
        audio += 0.085 * env * np.sin(2 * np.pi * 87.31 * tt)

    for center in np.arange(33.0, 45.0, 1.2):
        dt = tt - center
        env = np.exp(-np.maximum(dt, 0) * 11) * (dt >= 0)
        sweep = 82 - 26 * np.clip(dt, 0, 0.45)
        phasev = 2 * np.pi * np.cumsum(sweep) / SR
        audio += 0.055 * env * np.sin(phasev)

    for center in [51.5, 53.0, 55.0, 57.0]:
        for f, amp in [(392, 0.025), (523.25, 0.018), (783.99, 0.012), (1174.66, 0.006)]:
            dt = tt - center
            env = np.exp(-np.maximum(dt, 0) * 5.5) * (dt >= 0)
            audio += amp * env * np.sin(2 * np.pi * f * tt)

    fin = np.clip(tt / 2.0, 0, 1)
    fout = np.clip((DURATION - tt) / 2.5, 0, 1)
    audio *= fin * fout
    audio = np.tanh(audio * 1.35) * 0.78
    pcm = np.int16(np.clip(audio, -1, 1) * 32767)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


def render(output, thumb, seed=107):
    rng = np.random.default_rng(seed)
    targets, edges = build_targets()
    n_lines = max(56, len(edges))

    scatter = []
    for _ in range(n_lines):
        cx, cy = rng.uniform(40, W - 40), rng.uniform(35, H - 35)
        ang, ln = rng.uniform(0, math.tau), rng.uniform(18, 88)
        p1 = np.array([cx - math.cos(ang) * ln / 2, cy - math.sin(ang) * ln / 2])
        p2 = np.array([cx + math.cos(ang) * ln / 2, cy + math.sin(ang) * ln / 2])
        scatter.append((p1, p2, rng.uniform(-0.22, 0.22), rng.uniform(0, math.tau)))

    tmp_video = Path(str(output) + ".silent.mp4")
    tmp_wav = Path(str(output) + ".wav")
    cmd = [
        "ffmpeg", "-y", "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "bgr24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
        "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "veryfast", "-movflags", "+faststart",
        str(tmp_video),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

    for frame in range(TOTAL):
        t = frame / FPS
        canvas = np.zeros((H, W, 3), np.uint8)
        yaw = 0.15 * t + 0.16 * math.sin(t * 0.095)
        pitch = 0.34 + 0.17 * math.sin(t * 0.071)

        form = phase(t, 8, 22)
        locked = phase(t, 20, 24) * (1 - phase(t, 31, 35))
        destabilize = phase(t, 31, 44)
        reorganize = phase(t, 42, 53)
        transmit = phase(t, 50, 56) * (1 - phase(t, 57, 60))
        decay = phase(t, 55, 60)

        proj = []
        for p0 in targets:
            p = p0.copy()
            if destabilize > 0:
                slice_id = int(round((p[2] + 115) / 58))
                a = destabilize * (slice_id - 2.0) * 0.22 + math.sin(t * 0.75 + slice_id) * 0.05 * destabilize
                ca, sa = math.cos(a), math.sin(a)
                p[0], p[1] = p[0] * ca - p[1] * sa, p[0] * sa + p[1] * ca
                p[0] += destabilize * 28 * math.sin(t * 0.9 + p[2] * 0.035)
            q, _ = project(p, yaw, pitch)
            proj.append(q)

        if destabilize > 0.08:
            alpha = int(18 + 34 * reorganize)
            for k in range(11):
                yy = int(H / 2 + math.sin(t * 0.42 + k * 0.72) * 58 + (k - 5) * 12)
                amp = 8 + 18 * reorganize
                pts = []
                for x in range(-20, W + 20, 10):
                    y = yy + amp * math.sin(x * 0.032 + t * (0.7 + 0.03 * k) + k * 0.45)
                    pts.append((x, int(y)))
                cv2.polylines(canvas, [np.array(pts, np.int32)], False, (alpha,) * 3, 1, cv2.LINE_AA)

        for i in range(n_lines):
            sp1, sp2, spin, ph = scatter[i]
            c = (sp1 + sp2) / 2
            v = sp2 - sp1
            a = spin * t * (1 - 0.75 * form)
            ca, sa = math.cos(a), math.sin(a)
            rv = np.array([v[0] * ca - v[1] * sa, v[0] * sa + v[1] * ca])
            a1, a2 = c - rv / 2, c + rv / 2
            e = edges[i % len(edges)]
            tp1, tp2 = proj[e[0]], proj[e[1]]
            local = np.clip(form + 0.08 * math.sin(ph + t * 0.32), 0, 1)
            p1 = a1 * (1 - local * (1 - decay)) + tp1 * (local * (1 - decay))
            p2 = a2 * (1 - local * (1 - decay)) + tp2 * (local * (1 - decay))
            intensity = int(78 + 90 * form + 40 * locked - 32 * destabilize + 26 * transmit)
            cv2.line(canvas, tuple(np.int32(p1)), tuple(np.int32(p2)), (intensity,) * 3, 1 if i % 7 else 2, cv2.LINE_AA)

        if form > 0.45 and decay < 0.95:
            faces = [(0, 1, 3, 2), (4, 5, 7, 6), (8, 9, 11, 10)]
            for fi, face in enumerate(faces):
                poly = np.array([proj[j] for j in face], np.int32)
                mask = np.zeros((H, W), np.uint8)
                cv2.fillConvexPoly(mask, poly, 255)
                step = 8 + fi * 2
                offset = int((t * 8 + fi * 3) % step)
                for y in range(offset, H, step):
                    xs = np.where(mask[y] > 0)[0]
                    if len(xs) > 1:
                        val = int(34 + 34 * locked + 18 * reorganize)
                        cv2.line(canvas, (int(xs[0]), y), (int(xs[-1]), y), (val,) * 3, 1, cv2.LINE_AA)

        if locked > 0.02:
            for ring in range(1, 5):
                sc = 1 + ring * (0.035 + 0.01 * math.sin(t * 0.55))
                base = np.array([proj[i] for i in [0, 1, 3, 2]], float)
                cc = base.mean(axis=0)
                rr = ((base - cc) * sc + cc).astype(np.int32)
                val = int(70 + 52 * locked - ring * 5)
                cv2.polylines(canvas, [rr], True, (val,) * 3, 1, cv2.LINE_AA)

        if reorganize > 0.05:
            for sidx in range(8):
                rad = (38 + sidx * 15) * reorganize
                pts = []
                for k in range(48):
                    a = k / 48 * math.tau
                    wob = 1 + 0.16 * math.sin(3 * a + t * 0.7 + sidx)
                    x = W / 2 + rad * wob * math.cos(a)
                    y = H / 2 + 0.42 * rad * math.sin(a + t * 0.13 * sidx)
                    pts.append((int(x), int(y)))
                val = int(36 + 42 * reorganize + 20 * transmit)
                cv2.polylines(canvas, [np.array(pts, np.int32)], True, (val,) * 3, 1, cv2.LINE_AA)

        cv2.putText(canvas, "BEHAVIOR 001 / ALIGNMENT", (16, H - 17), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (82, 82, 82), 1, cv2.LINE_AA)
        if transmit > 0.1:
            overlay = canvas.copy()
            cv2.rectangle(overlay, (15, 14), (224, 38), (0, 0, 0), -1)
            canvas = cv2.addWeighted(overlay, 0.78, canvas, 0.22, 0)
            c = tuple(int(v * transmit) for v in ORANGE)
            cv2.putText(canvas, "FIELD STATION: MAGPIE", (24, 31), cv2.FONT_HERSHEY_SIMPLEX, 0.46, c, 1, cv2.LINE_AA)
            cv2.line(canvas, (24, 42), (194, 42), c, 1, cv2.LINE_AA)

        scan = int((t * 19) % H)
        if 7 < t < 18 or 48 < t < 57:
            cv2.line(canvas, (0, scan), (W, scan), (28, 28, 28), 1)

        proc.stdin.write(canvas.tobytes())

    proc.stdin.close()
    err = proc.stderr.read().decode("utf8", "replace")
    if proc.wait() != 0:
        raise RuntimeError(err[-3000:])

    synth_audio(tmp_wav, seed)
    subprocess.run([
        "ffmpeg", "-y", "-i", str(tmp_video), "-i", str(tmp_wav), "-c:v", "copy", "-c:a", "aac",
        "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(output),
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run([
        "ffmpeg", "-y", "-ss", "27", "-i", str(output), "-frames:v", "1", "-q:v", "2", str(thumb),
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    tmp_video.unlink(missing_ok=True)
    tmp_wav.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description="Render MAGPIE Behavior 001: Alignment.")
    parser.add_argument("--seed", type=int, required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--thumbnail", required=True)
    args = parser.parse_args()
    render(args.output, args.thumbnail, args.seed)


if __name__ == "__main__":
    main()
