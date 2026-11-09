"""One robot walking, then the camera pulls back to the whole grid of robots walking differently.

    python scripts/sim_zoom.py SINGLE.mp4 GRID.mp4 OUT.mp4 [--rect 0.34875,0.20856,0.3,0.3]

The two simulation clips show the same render at different scales: one robot filling the frame,
and a grid of twenty. `--rect` is where the single-robot frame sits inside the grid frame
(x, y, w, h as fractions of the grid frame) so that its robot lands exactly on one cell's robot;
the pull-back starts on that rectangle and ends on the full grid while the single clip melts
into the cell under it. The last frames dissolve into the first so the loop has no cut.
"""
import argparse
import cv2, numpy as np
from grade import encoder

def smooth(x):
    x = float(np.clip(x, 0, 1))
    return x * x * x * (x * (x * 6 - 15) + 10)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("single"); ap.add_argument("grid"); ap.add_argument("out")
    ap.add_argument("--rect", default="0.34875,0.20856,0.3,0.3")
    ap.add_argument("--hold", type=float, default=3.6)     # seconds on the single robot
    ap.add_argument("--zoom", type=float, default=2.6)     # seconds pulling back
    ap.add_argument("--after", type=float, default=5.8)    # seconds on the grid
    ap.add_argument("--w", type=int, default=1280)
    ap.add_argument("--crf", type=int, default=18)
    a = ap.parse_args()

    one, many = cv2.VideoCapture(a.single), cv2.VideoCapture(a.grid)
    fps = one.get(cv2.CAP_PROP_FPS)
    W = a.w; H = W * 9 // 16
    gw, gh = int(many.get(cv2.CAP_PROP_FRAME_WIDTH)), int(many.get(cv2.CAP_PROP_FRAME_HEIGHT))
    rx, ry, rw, rh = (float(v) for v in a.rect.split(","))
    r0 = np.array([rx * gw, ry * gh, rw * gw, rh * gh])            # where the single frame sits in the grid
    r1 = np.array([0, 0, gw, gh], np.float64)

    n_hold, n_zoom, n_after = (int(round(s * fps)) for s in (a.hold, a.zoom, a.after))
    # feathered edge for the single frame as it melts into the grid
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    edge = np.minimum(np.minimum(xx, W - 1 - xx) / (0.10 * W), np.minimum(yy, H - 1 - yy) / (0.10 * H))
    feather = np.clip(edge, 0, 1)

    frames = []
    for n in range(n_hold + n_zoom + n_after):
        ok, f1 = one.read() if n < n_hold + n_zoom else (True, None)
        if n < n_hold:
            frames.append(cv2.resize(f1, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32))
            continue
        ok, g = many.read()
        p = (n - n_hold) / max(n_zoom - 1, 1)
        if p >= 1:
            frames.append(cv2.resize(g, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32))
            continue
        e = smooth(p)
        width = r0[2] * (r1[2] / r0[2]) ** e                       # zoom at a steady rate, not a steady size
        k = (width - r0[2]) / (r1[2] - r0[2])
        view = r0 + (r1 - r0) * k
        s = W / view[2]
        M = np.float32([[s, 0, -view[0] * s], [0, s, -view[1] * s]])
        base = cv2.warpAffine(g, M, (W, H), flags=cv2.INTER_CUBIC if s > 1 else cv2.INTER_AREA, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
        # the single clip, still at its place in the grid
        x, y, w, h = (r0[0] - view[0]) * s, (r0[1] - view[1]) * s, r0[2] * s, r0[3] * s
        Ms = np.float32([[w / f1.shape[1], 0, x], [0, h / f1.shape[0], y]])
        top = cv2.warpAffine(f1, Ms, (W, H), flags=cv2.INTER_AREA).astype(np.float32)
        Mf = np.float32([[w / W, 0, x], [0, h / H, y]])
        mask = cv2.warpAffine(np.ones_like(feather) if p == 0 else feather ** (0.35 + 2.2 * p), Mf, (W, H))
        alpha = (mask * (1 - smooth((p - 0.10) / 0.55)))[..., None]
        frames.append(base * (1 - alpha) + top * alpha)

    n_x = int(round(0.6 * fps))
    for j in range(n_x):
        t = (j + 1) / (n_x + 1)
        frames[-n_x + j] = frames[-n_x + j] * (1 - t) + frames[0] * t
    enc = encoder(a.out, W, H, fps, crf=a.crf)
    for f in frames:
        enc.stdin.write(np.clip(f, 0, 255).astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait()
    print(f"frames {len(frames)} ({len(frames) / fps:.2f} s) at {fps:g} fps, {W}x{H}")


if __name__ == "__main__":
    main()
