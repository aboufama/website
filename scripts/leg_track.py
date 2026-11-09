"""Tracking and overlay for the leg-jump film (used by leg_jump.py).

Three points are followed through the registered frames: the hip (the red carriage on the
rail), the knee (the white joint disc) and the foot tip. The hip is found by colour in every
frame. The knee and foot are found by colour too, except in the four frames where the leg is
a motion-blurred smear (147-150); there they were placed by eye on enlarged frames.
The graph plots height against real time, as a fraction of the highest point the hip reaches.
"""
import cv2, numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

FPS = 30.0
BY_EYE = {      # frame: (knee, foot) in registered-crop pixels
    147: ((495, 415), (335, 660)),
    148: ((550, 365), (595, 575)),
    149: ((510, 340), (525, 560)),
    150: ((470, 330), (350, 600)),
}
BRIDGED = (154,)   # landing frame where the knee blob merges with the bracket: mean of its neighbours
FONT = Path(__file__).resolve().parent.parent / "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"


def _hip(f):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV); h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    red = (((h < 8) | (h > 170)) & (s > 110) & (v > 70)).astype(np.uint8)
    band = np.zeros_like(red); band[:, 560:705] = red[:, 560:705]
    band = cv2.morphologyEx(band, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, _, st, cen = cv2.connectedComponentsWithStats(band, 8)
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    return float(cen[k][0]), float(cen[k][1])


def _limb(f):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV); s, v = hsv[..., 1], hsv[..., 2]
    m = ((s < 62) & (v > 138)).astype(np.uint8)
    roi = np.zeros_like(m); roi[150:806, 40:480] = m[150:806, 40:480]
    roi = cv2.morphologyEx(roi, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(roi, 8)
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    ys, xs = np.where(lab == k)
    y0, y1 = np.percentile(ys, 2), np.percentile(ys, 98)
    top = ys < y0 + 0.28 * (y1 - y0); bot = ys > y1 - 0.10 * (y1 - y0)
    return (float(xs[top].mean()), float(ys[top].mean())), (float(xs[bot].mean()), float(y1))


class Track:
    def __init__(self, frames):
        self.ids = sorted(frames)
        hip, knee, foot = [], [], []
        for i in self.ids:
            hip.append(_hip(frames[i]))
            k, f = BY_EYE[i] if i in BY_EYE else _limb(frames[i])
            knee.append(k); foot.append(f)
        self.hip, self.knee, self.foot = (np.array(a, np.float32) for a in (hip, knee, foot))
        for i in BRIDGED:
            j = self.ids.index(i)
            self.knee[j] = (self.knee[j - 1] + self.knee[j + 1]) / 2
        # the carriage only moves along the rail: keep its measured height, steady its sideways jitter
        self.hip[:, 0] = cv2.medianBlur(self.hip[:, 0].reshape(-1, 1), 5).ravel()
        rest = slice(0, self.ids.index(140))
        self.hip0 = float(np.median(self.hip[rest, 1])); self.foot0 = float(np.median(self.foot[rest, 1]))
        self.peak = self.hip0 - float(self.hip[:, 1].min())        # pixels the hip rises

    def at(self, t):
        """Hip, knee and foot at fractional frame t (linear between measured frames)."""
        x = np.clip(t - self.ids[0], 0, len(self.ids) - 1)
        i = int(np.floor(x)); j = min(i + 1, len(self.ids) - 1); a = x - i
        return tuple(p[i] * (1 - a) + p[j] * a for p in (self.hip, self.knee, self.foot))

    def heights(self, t):
        hip, _, foot = self.at(t)
        return (self.hip0 - hip[1]) / self.peak, (self.foot0 - foot[1]) / self.peak


def _g2(w, h, r, n=5.0, steps=24):
    """Rounded rectangle with curvature-continuous (superellipse) corners, as a polygon."""
    r = min(r * 1.45, w / 2, h / 2)
    t = np.linspace(0, np.pi / 2, steps)
    cx, cy = r * (1 - np.cos(t) ** (2 / n)), r * (1 - np.sin(t) ** (2 / n))
    tl = list(zip(cx, cy))                                   # (0, r) -> (r, 0)
    pts = tl + [(w - x, y) for x, y in tl[::-1]] + [(w - x, h - y) for x, y in tl] + [(x, h - y) for x, y in tl[::-1]]
    return pts


class Overlay:
    """Draws the trackers and the height graph on an output frame.

    `ui` scales every stroke, label and the panel, so the overlay keeps its proportions
    when the film is rendered larger (the page clip is 960 wide, the export for posting 1080)."""

    def __init__(self, track, t0, t1, takeoff, to_out, size, panel, ui=1.0):
        self.tr, self.t0, self.t1, self.takeoff = track, t0, t1, takeoff
        self.to_out = to_out                  # crop pixel -> output pixel
        self.W, self.H = size
        self.px, self.py, self.pw, self.ph = (int(round(v)) for v in panel)
        self.S = 2                            # supersampling for clean lines and type
        self.u = ui
        s = self.S * ui
        f = str(FONT)
        self.f_title = ImageFont.truetype(f, int(round(13 * s))); self.f_title.set_variation_by_axes([560])
        self.f_small = ImageFont.truetype(f, int(round(11 * s))); self.f_small.set_variation_by_axes([430])
        self.ts = np.arange(t0, t1 + 1e-6, 0.25)
        self.hs = np.array([track.heights(t) for t in self.ts])
        mask = Image.new("L", (self.pw * self.S, self.ph * self.S), 0)
        ImageDraw.Draw(mask).polygon(_g2(self.pw * self.S, self.ph * self.S, 16 * s), fill=255)
        self.mask = np.asarray(mask.resize((self.pw, self.ph), Image.LANCZOS), np.float32)[..., None] / 255

    def _plot_xy(self, t, h):
        S, s = self.S, self.S * self.u
        left, right, top, bottom = 16 * s, self.pw * S - 16 * s, 44 * s, self.ph * S - 30 * s
        x = left + (t - self.t0) / (self.t1 - self.t0) * (right - left)
        lo, hi = -0.12, 1.08
        y = bottom - (h - lo) / (hi - lo) * (bottom - top)
        return x, y

    def draw(self, frame, t, alpha):
        """frame: uint8 BGR at output size. t: source frame (fractional). alpha: 0..1."""
        if alpha <= 0:
            return frame
        S, s = self.S, self.S * self.u
        # glass panel: the footage behind it, blurred and darkened
        x, y, w, h = self.px, self.py, self.pw, self.ph
        region = frame[y:y + h, x:x + w].astype(np.float32)
        glass = cv2.GaussianBlur(region, (0, 0), 14 * self.u) * 0.42 + np.array([26, 24, 24], np.float32) * 0.58
        m = self.mask * alpha
        out = frame.astype(np.float32)
        out[y:y + h, x:x + w] = region * (1 - m) + glass * m

        layer = Image.new("RGBA", (self.W * S, self.H * S), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        white, soft, dim, shade = (255, 255, 255, 255), (255, 255, 255, 150), (255, 255, 255, 70), (0, 0, 0, 90)
        px = lambda v: max(1, int(round(v * s)))

        # --- trackers on the leg
        hip, knee, foot = (np.array(self.to_out(p)) * S for p in self.tr.at(t))
        for trail in (0, 2):                                    # where the hip and the foot have been
            path = [tuple(np.array(self.to_out(self.tr.at(tt)[trail])) * S) for tt in np.arange(self.t0, t + 1e-6, 0.25)]
            if len(path) > 1:
                d.line(path, fill=(255, 255, 255, 120), width=px(1.2), joint="curve")
            for i in range(int(np.ceil(self.t0)), int(np.floor(t)) + 1):      # one dot per real frame
                p = np.array(self.to_out(self.tr.at(i)[trail])) * S
                d.ellipse([p[0] - 2 * s, p[1] - 2 * s, p[0] + 2 * s, p[1] + 2 * s], fill=(255, 255, 255, 215))
        for a, b in ((hip, knee), (knee, foot)):
            d.line([tuple(a), tuple(b)], fill=shade, width=px(4.5))
            d.line([tuple(a), tuple(b)], fill=white, width=px(1.8))
        for p, label in ((hip, "hip"), (knee, "knee"), (foot, "foot")):
            r = 8 * s
            d.ellipse([p[0] - r - s / 2, p[1] - r - s / 2, p[0] + r + s / 2, p[1] + r + s / 2], outline=shade, width=px(4))
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], outline=white, width=px(1.8))
            d.ellipse([p[0] - 2.4 * s, p[1] - 2.4 * s, p[0] + 2.4 * s, p[1] + 2.4 * s], fill=white)
            tx, ty = p[0] - r - 8 * s - d.textlength(label, font=self.f_small), p[1] - 7 * s
            d.text((tx + s / 2, ty + s / 2), label, font=self.f_small, fill=(0, 0, 0, 120))
            d.text((tx, ty), label, font=self.f_small, fill=white)

        # --- graph: height against real time
        ox, oy = x * S, y * S
        d.text((ox + 16 * s, oy + 13 * s), "Height", font=self.f_title, fill=white)
        tag = "replayed at quarter speed"
        d.text((ox + w * S - 16 * s - d.textlength(tag, font=self.f_small), oy + 15 * s), tag, font=self.f_small, fill=soft)
        for hval in (0.0, 1.0):
            gx0, gy = self._plot_xy(self.t0, hval); gx1, _ = self._plot_xy(self.t1, hval)
            d.line([(ox + gx0, oy + gy), (ox + gx1, oy + gy)], fill=(255, 255, 255, 46), width=px(0.5))
        for sec in (0.0, 0.2, 0.4):
            tx_, ty_ = self._plot_xy(self.takeoff + sec * FPS, -0.12)
            label = f"{sec:.1f} s" if sec else "0"
            d.text((ox + tx_ - d.textlength(label, font=self.f_small) / 2, oy + ty_ + 6 * s), label, font=self.f_small, fill=soft)
            d.line([(ox + tx_, oy + ty_ - 3 * s), (ox + tx_, oy + ty_ + 2 * s)], fill=soft, width=px(0.5))
        for col, (colour, future, width, name) in enumerate(((white, dim, 2.0, "hip"), (soft, (255, 255, 255, 40), 1.5, "foot"))):
            pts = [tuple(np.add(self._plot_xy(tt, hh[col]), (ox, oy))) for tt, hh in zip(self.ts, self.hs)]
            done = [p for p, tt in zip(pts, self.ts) if tt <= t]
            d.line(pts, fill=future, width=px(width), joint="curve")
            if len(done) > 1:
                d.line(done, fill=colour, width=px(width), joint="curve")
            cx_, cy_ = np.add(self._plot_xy(t, self.tr.heights(t)[col]), (ox, oy))
            d.ellipse([cx_ - 3.5 * s, cy_ - 3.5 * s, cx_ + 3.5 * s, cy_ + 3.5 * s], fill=white)
            ly = oy + (48 + 15 * col) * s                           # legend, top left of the plot
            d.line([(ox + 16 * s, ly), (ox + 32 * s, ly)], fill=colour, width=px(width))
            d.text((ox + 38 * s, ly - 7 * s), name, font=self.f_small, fill=colour)
        px_, py_ = self._plot_xy(self.t1, 1.0)
        d.text((ox + px_ - d.textlength("peak", font=self.f_small), oy + py_ - 15 * s), "peak", font=self.f_small, fill=(255, 255, 255, 110))

        layer = np.asarray(layer.resize((self.W, self.H), Image.LANCZOS), np.float32)
        a = layer[..., 3:4] / 255 * alpha
        out = out * (1 - a) + layer[..., 2::-1] * a
        return np.clip(out, 0, 255).astype(np.uint8)
