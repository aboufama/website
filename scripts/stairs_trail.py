"""Stairs remaster: the simulator camera is static, so the whole climb can be shown as one stroboscopic image.

    python scripts/stairs_trail.py IN.mp4 OUT.mp4 TRACK.json [--w 1280] [--crf 18] [--debug DIR]

The robot leaves a translucent copy of itself every body-length or so. The camera starts on a framing that
holds the whole route, pushes in and tracks the robot, then pulls back out to show every copy at once.
Every pixel of the robot comes from the run itself; nothing is synthesised.
"""
import json, sys
import cv2
import numpy as np
from grade import Grader, encoder, smooth, ease

SKIP = 6            # the simulator's first frames are black, then dim
WIN = (130, 120, 110)   # matte window around the tracked centre: half width, up, down (source px)

def plate_of(src, pts):
    """Mean of every frame with the robot's neighbourhood masked out: the empty terrain."""
    cap = cv2.VideoCapture(src)
    acc = cnt = None
    i = -1
    while True:
        ok, f = cap.read(); i += 1
        if not ok: break
        if i < SKIP or i % 3: continue
        cx, cy = int(pts[i][0]), int(pts[i][1])
        m = np.ones(f.shape[:2], np.float32)
        cv2.rectangle(m, (cx - 110, cy - 110), (cx + 110, cy + 100), 0, -1)
        if acc is None:
            acc = np.zeros(f.shape, np.float32); cnt = np.zeros(f.shape[:2], np.float32)
        acc += f.astype(np.float32) * m[..., None]; cnt += m
    return acc / np.maximum(cnt, 1)[..., None]

def main(src, out, track, W=1280, crf=18, debug=None):
    raw = json.load(open(track))
    last = next(p for p in raw if p)
    pts = []
    for p in raw:
        last = p or last; pts.append(last)
    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS); sw, sh = int(cap.get(3)), int(cap.get(4))
    n = min(int(cap.get(7)), len(pts)) - SKIP
    H = W * 9 // 16
    plate = plate_of(src, pts)
    plate_g = cv2.cvtColor(np.clip(plate, 0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)

    P = np.array(pts[SKIP:SKIP + n], np.float32)
    x, y = smooth(P[:, 0], fps * 0.6), smooth(P[:, 1], fps * 0.6)
    wr = smooth(P[:, 2].astype(float), fps * 1.5)

    # where the copies are left: one per ~0.82 body widths of travel
    drops, lx, ly = [], x[0], y[0]
    for i in range(1, n):
        if np.hypot(x[i] - lx, y[i] - ly) >= 0.82 * wr[i]:
            drops.append(i); lx, ly = x[i], y[i]
    drops = [0] + drops
    while drops and np.hypot(x[-1] - x[drops[-1]], y[-1] - y[drops[-1]]) < 0.6 * wr[-1]:
        drops.pop()                                           # no copy right under the final pose
    K = len(drops)
    opac = [0.30 + 0.24 * k / max(K - 1, 1) for k in range(K)]  # older copies a little fainter

    # camera: route framing -> tracked close-up -> route framing
    xr = (x.min() - 105, x.max() + 105); yr = (y.min() - 95, y.max() + 105)
    Wp = min(sw, max(xr[1] - xr[0], (yr[1] - yr[0]) * 16 / 9) * 1.10)
    cxp, cyp = (xr[0] + xr[1]) / 2, (yr[0] + yr[1]) / 2
    wt = np.clip(wr / 0.22, 460, 620)
    t = np.arange(n) / fps; T = t[-1]
    k = np.minimum(ease((t - 0.7) / 2.6), ease((T - 2.0 - t) / 2.6))
    cw = Wp + (wt - Wp) * k
    cx = cxp + (x - cxp) * k
    cy = cyp + (y - 0.07 * wt * 9 / 16 - cyp) * k
    print(f"frames {n}  copies {K} at {drops}  route framing {Wp:.0f}px wide at ({cxp:.0f},{cyp:.0f})")

    g = Grader("sim", H, W)
    enc = encoder(out, W, H, fps, crf)
    for _ in range(SKIP): cap.read()
    gl = np.zeros((sh, sw, 3), np.float32)   # copies, premultiplied by their opacity
    ga = np.zeros((sh, sw), np.float32)
    first = None; fade = int(fps * 0.7); di = 0
    for i in range(n):
        ok, f = cap.read()
        if not ok: break
        ff = f.astype(np.float32)
        d = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) - plate_g
        a = np.zeros((sh, sw), np.float32)
        px, py = int(P[i, 0]), int(P[i, 1])
        x0, x1 = max(0, px - WIN[0]), min(sw, px + WIN[0]); y0, y1 = max(0, py - WIN[1]), min(sh, py + WIN[2])
        a[y0:y1, x0:x1] = np.clip((d[y0:y1, x0:x1] - 18) / 40, 0, 1)
        a = cv2.GaussianBlur(a, (0, 0), 0.8)
        if di < K and i == drops[di]:
            m = a * opac[di]
            gl = gl * (1 - a[..., None]) + ff * m[..., None]   # newer copy sits over older ones
            ga = ga * (1 - a) + m
            di += 1
        comp = ff * (1 - ga[..., None]) + gl
        comp = comp * (1 - a[..., None]) + ff * a[..., None]   # the live robot stays on top
        ww, hh = cw[i], cw[i] * 9 / 16
        xo = np.clip(cx[i] - ww / 2, 0, sw - ww); yo = np.clip(cy[i] - hh / 2, 0, sh - hh)
        M = np.array([[W / ww, 0, -xo * W / ww], [0, H / hh, -yo * H / hh]], np.float32)
        fr = cv2.warpAffine(np.clip(comp, 0, 255).astype(np.uint8), M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        fr = g(fr)
        if first is None: first = fr.copy()
        if i >= n - fade:                                      # dissolve back to the first frame so the loop has no cut
            u = float(ease((i - (n - fade)) / (fade - 1)))
            fr = cv2.addWeighted(fr, 1 - u, first, u, 0)
        if debug and (i % 62 == 0 or i == n - fade - 1):
            cv2.imwrite(f"{debug}/s_{i:04d}.jpg", fr, [cv2.IMWRITE_JPEG_QUALITY, 90])
        enc.stdin.write(fr.tobytes())
    enc.stdin.close(); enc.wait()

if __name__ == "__main__":
    a = sys.argv[1:]
    opt = lambda key, d=None: a[a.index(key) + 1] if key in a else d
    main(a[0], a[1], a[2], int(opt("--w", 1280)), int(opt("--crf", 18)), opt("--debug"))
