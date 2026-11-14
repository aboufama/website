#!/usr/bin/env python3
"""Draw the tab icon from a headshot: python3 scripts/portrait_icon.py path/to/headshot.jpg

The photo's colours are flattened into a few planes (L0 smoothing) and inked where the photo
has its own edges, so the drawing keeps the likeness. Written for a 1000 x 1000 headshot with
the face centred; CROP and the one retouch below are in that photo's pixels.

Needs numpy + opencv-contrib-python (for ximgproc). Writes public/favicon.png (round) and
public/apple-touch-icon.png (square; iOS rounds it).
"""
import sys
from pathlib import Path
import cv2, numpy as np

OUT = Path(__file__).resolve().parent.parent / "public"
CROP = (167, 66, 650)                 # x, y, side: the head, with the collar just in
INK = (30, 26, 34)                    # BGR: a warm brown-black


def ink_lines(L, sigma=1.7, tau=0.983, phi=2.8):
    """Difference of Gaussians, soft-thresholded: 1 is paper, towards 0 is ink."""
    d = cv2.GaussianBlur(L, (0, 0), sigma) - tau * cv2.GaussianBlur(L, (0, 0), sigma * 1.6)
    return np.where(d > 0, 1.0, 1 + np.tanh(phi * d)).astype(np.float32)


def despeckle(lines, min_area=70):
    """Drop the marks too small to be a stroke."""
    n, labels, stats, _ = cv2.connectedComponentsWithStats((lines < 0.72).astype(np.uint8), connectivity=8)
    small = np.isin(labels, np.where(stats[:, cv2.CC_STAT_AREA] < min_area)[0]).astype(np.uint8)
    out = lines.copy()
    out[cv2.dilate(small, np.ones((3, 3), np.uint8)).astype(bool)] = 1.0
    return out


def draw(photo):
    soft = photo.copy()
    for _ in range(3):
        soft = cv2.bilateralFilter(soft, 9, 28, 6)
    flat = cv2.ximgproc.l0Smooth(photo, None, 0.020, 2.0)
    colour = cv2.addWeighted(flat, 0.65, soft, 0.35, 0).astype(np.float32)   # flat planes, a little of the photo's shading
    L = cv2.cvtColor(soft.astype(np.float32) / 255, cv2.COLOR_BGR2LAB)[..., 0]
    lines = despeckle(ink_lines(L))
    lines[585:608, 528:562] = 1.0     # one stray dash under the lower lip
    lines = cv2.GaussianBlur(lines, (0, 0), 0.6)[..., None]
    art = colour * lines + np.array(INK, np.float32) * (1 - lines)
    x, y, side = CROP
    return art.clip(0, 255).astype(np.uint8)[y:y + side, x:x + side]


def icon(art, size, circle):
    small = cv2.resize(art, (size, size), interpolation=cv2.INTER_AREA).astype(np.float32)
    if size <= 96:                    # a touch of sharpening so the lines survive the shrink
        small = np.clip(small + 0.6 * (small - cv2.GaussianBlur(small, (0, 0), 1.0)), 0, 255)
    alpha = np.full((size, size), 255, np.uint8)
    if circle:
        yy, xx = np.mgrid[0:size, 0:size]
        alpha = (np.clip(size / 2 - np.hypot(xx - size / 2 + .5, yy - size / 2 + .5) + .5, 0, 1) * 255).astype(np.uint8)
    return np.dstack([small.astype(np.uint8), alpha])


if __name__ == "__main__":
    art = draw(cv2.imread(sys.argv[1]))
    cv2.imwrite(str(OUT / "favicon.png"), icon(art, 96, True))
    cv2.imwrite(str(OUT / "apple-touch-icon.png"), icon(art, 180, False))
