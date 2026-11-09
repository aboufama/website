"""Grading and camera moves for the portfolio videos (numpy + OpenCV, piped through ffmpeg).

    python scripts/grade.py stairs IN.mp4 OUT.mp4 TRACK.json
    python scripts/grade.py plain  IN.mp4 OUT.mp4 --look render|footage|sim [--ss S --t T --crop x,y,w,h --fps F]
"""
import json, subprocess, sys
import cv2
import numpy as np

def lut_curve(strength=0.18, lift=0.0, gain=1.0):
    x = np.linspace(0, 1, 256)
    s = x + strength * (x - 0.5) * (1 - np.abs(2 * x - 1))      # gentle S, no clipping
    s = lift + (gain - lift) * s
    return np.clip(s * 255, 0, 255).astype(np.uint8)

def split_tone(img, shadow=(6, 2, -4), highlight=(-4, 0, 5)):
    """BGR offsets: cool shadows, warm highlights (OpenCV order: B, G, R)."""
    f = img.astype(np.float32)
    y = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)[..., None] / 255.0
    f += (1 - y) * np.array(shadow, np.float32) + y * np.array(highlight, np.float32)
    return np.clip(f, 0, 255).astype(np.uint8)

def vignette(h, w, amount):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    return (1 - amount * np.clip(r, 0, 1) ** 2.2)[..., None].astype(np.float32)

LOOKS = {
    # name: (S strength, saturation, vignette, sharpen, split tone on)
    "sim":     (0.22, 1.10, 0.28, 0.6, True),
    "render":  (0.10, 1.04, 0.00, 0.4, False),
    "footage": (0.16, 1.12, 0.18, 0.5, True),
}

class Grader:
    def __init__(self, look, h, w):
        self.s, self.sat, vig, self.sharp, self.tone = LOOKS[look]
        self.lut = lut_curve(self.s)
        self.vig = vignette(h, w, vig) if vig else None
    def __call__(self, img):
        img = cv2.LUT(img, self.lut)
        if self.sat != 1:
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
            hsv[..., 1] = np.clip(hsv[..., 1] * self.sat, 0, 255)
            img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        if self.tone:
            img = split_tone(img)
        if self.sharp:
            blur = cv2.GaussianBlur(img, (0, 0), 1.2)
            img = cv2.addWeighted(img, 1 + self.sharp, blur, -self.sharp, 0)
        if self.vig is not None:
            img = np.clip(img.astype(np.float32) * self.vig, 0, 255).astype(np.uint8)
        return img

def encoder(out, w, h, fps, crf=21):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}",
                             "-r", str(fps), "-i", "-", "-c:v", "libx264", "-crf", str(crf), "-preset", "slow",
                             "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an", out],
                            stdin=subprocess.PIPE)

def smooth(a, sigma):
    k = int(sigma * 4) | 1
    g = cv2.getGaussianKernel(k * 2 + 1, sigma).ravel()
    pad = np.pad(a, (k, k), mode="edge")
    return np.convolve(pad, g, mode="valid")

def ease(t):  # smoothstep
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)

def stairs(src, out, track_path, W=1280, H=720, skip=4):
    pts = json.load(open(track_path))[skip:]          # the simulator's first frames are black, then dim
    n = len(pts)
    last = next(p for p in pts if p)
    xs, ys, ws = [], [], []
    for p in pts:
        last = p or last
        xs.append(last[0]); ys.append(last[1]); ws.append(last[2])
    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS)
    sw, sh = int(cap.get(3)), int(cap.get(4))
    for _ in range(skip):
        cap.read()
    x, y, wr = smooth(np.array(xs), fps * 0.6), smooth(np.array(ys), fps * 0.6), smooth(np.array(ws, float), fps * 1.5)
    cw = np.clip(wr / 0.2, 540, sw)                       # robot about a fifth of the frame width
    cx, cy = x, y - 0.06 * cw * 9 / 16                     # robot a little below centre: steps ahead show above it
    t = np.arange(n) / fps
    zin, zout = ease(t / 2.5), ease((t[-1] - t) / 2.0)    # push in over 2.5 s, pull out over the last 2 s
    k = np.minimum(zin, zout)
    cw = sw + (cw - sw) * k
    cx = sw / 2 + (cx - sw / 2) * k
    cy = sh / 2 + (cy - sh / 2) * k
    g = Grader("sim", H, W)
    enc = encoder(out, W, H, fps)
    for i in range(n):
        ok, f = cap.read()
        if not ok: break
        ww, hh = cw[i], cw[i] * 9 / 16
        x0 = np.clip(cx[i] - ww / 2, 0, sw - ww); y0 = np.clip(cy[i] - hh / 2, 0, sh - hh)
        M = np.array([[W / ww, 0, -x0 * W / ww], [0, H / hh, -y0 * H / hh]], np.float32)
        fr = cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        enc.stdin.write(g(fr).tobytes())
    enc.stdin.close(); enc.wait()

def plain(src, out, look, ss=0.0, dur=None, crop=None, fps_out=None, W=1280):
    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.set(cv2.CAP_PROP_POS_MSEC, ss * 1000)
    sw, sh = int(cap.get(3)), int(cap.get(4))
    x0, y0, cw, ch = crop or (0, 0, sw, sh)
    H = int(round(W * ch / cw / 2) * 2)
    g = Grader(look, H, W)
    step = max(1, int(round(fps / fps_out))) if fps_out else 1
    enc = encoder(out, W, H, fps / step)
    n = int(dur * fps) if dur else 10 ** 9
    for i in range(n):
        ok, f = cap.read()
        if not ok: break
        if i % step: continue
        fr = cv2.resize(f[y0:y0 + ch, x0:x0 + cw], (W, H), interpolation=cv2.INTER_AREA if cw > W else cv2.INTER_LANCZOS4)
        enc.stdin.write(g(fr).tobytes())
    enc.stdin.close(); enc.wait()

if __name__ == "__main__":
    a = sys.argv[1:]
    if a[0] == "stairs":
        stairs(a[1], a[2], a[3])
    else:
        opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
        crop = tuple(int(v) for v in opt("--crop").split(",")) if opt("--crop") else None
        plain(a[1], a[2], opt("--look", "render"), float(opt("--ss", 0)), float(opt("--t")) if opt("--t") else None,
              crop, float(opt("--fps")) if opt("--fps") else None)
