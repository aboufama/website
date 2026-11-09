"""The real leg jumping on its rail: phone clip -> locked-off, graded loop with a slow replay.

    python scripts/leg_jump.py IMG_7556.MOV OUT.mp4 [--w 960] [--crf 20] [--debug DIR]
    python scripts/leg_jump.py IMG_7556.MOV OUT.mp4 --wide --w 1080   # 16:9: the frame tilts to follow the jump
    python scripts/leg_jump.py IMG_7556.MOV OUT.mp4 --w 1080 --loops 3   # for posting: full size, played three times

The phone was hand-held, so every frame is first registered to one reference frame using the
bench behind the leg. The loop then plays the jump once at real speed and once at quarter
speed (the in-between frames of the replay are motion-interpolated by ffmpeg). During the
replay the hip, knee and foot are marked and their height is plotted (see leg_track.py).
"""
import argparse, sys, os, glob, subprocess, tempfile
import cv2, numpy as np
from grade import Grader, encoder
from leg_track import Track, Overlay

FIRST, LAST = 104, 189          # steady part of the clip (the camera whips away before this)
REF = 130                        # registration reference
CROP = (0, 800, 1080, 810)       # x, y, w, h in the reference frame: 4:3 around the rail
LEG = (60, 820, 700, 800)        # x, y, w, h: where the leg can be; ignored when registering
TAKEOFF, LANDED = 144, 158
SLOW = 4                         # the replay runs at 1/SLOW speed


def read(path):
    cap = cv2.VideoCapture(path)
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    return frames


HEADROOM = 110                   # extra rows kept above the crop for the 16:9 version, which tilts up


def register(frames, extra_top=0):
    """Similarity transform of each frame onto the reference, from features on the bench."""
    ref = cv2.cvtColor(frames[REF], cv2.COLOR_BGR2GRAY)
    mask = np.full(ref.shape, 255, np.uint8)
    x, y, w, h = LEG
    mask[y:y + h, x:x + w] = 0
    orb = cv2.ORB_create(4000)
    kr, dr = orb.detectAndCompute(ref, mask)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    out = {}
    for i in range(FIRST, LAST + 1):
        g = cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY)
        k, d = orb.detectAndCompute(g, mask)
        m = sorted(bf.match(d, dr), key=lambda a: a.distance)[:800]
        src = np.float32([k[a.queryIdx].pt for a in m])
        dst = np.float32([kr[a.trainIdx].pt for a in m])
        M, _ = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=2.0)
        out[i] = M
    # smooth nothing: a locked-off frame is the point. Return warped crops.
    x, y, w, h = CROP
    warped = {}
    for i, M in out.items():
        full = cv2.warpAffine(frames[i], M, (frames[i].shape[1], frames[i].shape[0]), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        warped[i] = full[y - extra_top:y + h, x:x + w]
    return warped


def slow(frames, first, last, factor):
    """frames[first..last] stretched `factor` times with motion-compensated in-betweens."""
    with tempfile.TemporaryDirectory() as tmp:
        for i in range(first, last + 1):
            cv2.imwrite(f"{tmp}/in_{i - first:03d}.png", frames[i])
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", f"{tmp}/in_%03d.png",
                        "-vf", f"minterpolate=fps={30 * factor}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:search_param=96",
                        f"{tmp}/out_%04d.png"], check=True)
        return [cv2.imread(f) for f in sorted(glob.glob(f"{tmp}/out_*.png"))]


def split(frames, out, crf):
    """16:9 for a wide tile: the same jump twice, side by side and starting together. The left
    panel runs at real speed, the right one at quarter speed."""
    lead = 20
    replay = slow(frames, TAKEOFF - 4, LANDED + 3, SLOW)[2:]
    total = lead + len(replay) + 14
    before = [frames[i] for i in range(TAKEOFF - 4 - lead, TAKEOFF - 4)]
    rest = [frames[i] for i in range(LANDED + 4, LAST + 1)]
    rest = rest + rest[::-1]                                  # the bench is still: there and back
    left = before + [frames[i] for i in range(TAKEOFF - 4, LANDED + 4)]
    left += [rest[k % len(rest)] for k in range(total - len(left))]
    right = before + replay + [frames[LANDED + 3]] * (total - lead - len(replay))
    PW, PH, GAP = 636, 720, 8
    x0 = 115; cw = 720                                         # 8:9 window of the 4:3 crop
    k = PW / cw
    r0 = TAKEOFF - 4
    times = [None] * lead + [r0 + (j + 2) / SLOW for j in range(len(replay))] + [float(LANDED + 3)] * (total - lead - len(replay))
    over = Overlay(Track(frames), times[lead], float(LANDED + 3), TAKEOFF, lambda p: ((p[0] - x0) * k, p[1] * k), (PW, PH),
                   (PW - 300, PH - 190, 286, 176))
    grade = Grader("footage", PH, PW)
    def panel(f):
        return grade(cv2.resize(f[:, x0:x0 + cw], (PW, PH), interpolation=cv2.INTER_AREA))
    seq = []
    for n, (l, r) in enumerate(zip(left, right)):
        canvas = np.full((PH, PW * 2 + GAP, 3), 255, np.float32)
        rp = panel(r)
        if times[n] is not None:
            rp = over.draw(rp, times[n], min(1.0, (n - lead + 1) / 8))
        canvas[:, :PW] = panel(l); canvas[:, PW + GAP:] = rp
        seq.append(canvas)
    n_x = 12
    for j in range(n_x):
        t = (j + 1) / (n_x + 1)
        seq[-n_x + j] = seq[-n_x + j] * (1 - t) + seq[0] * t
    enc = encoder(out, PW * 2 + GAP, PH, 30, crf=crf)
    for f in seq:
        enc.stdin.write(np.clip(f, 0, 255).astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait()
    print(f"split: frames {len(seq)} ({len(seq) / 30:.2f} s), size {PW * 2 + GAP}x{PH}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--w", type=int, default=960)
    ap.add_argument("--crf", type=int, default=20)
    ap.add_argument("--debug")
    ap.add_argument("--split", action="store_true")
    ap.add_argument("--wide", action="store_true")
    ap.add_argument("--loops", type=int, default=1)
    a = ap.parse_args()

    ext = HEADROOM if a.wide else 0
    tall = register(read(a.src), ext)                       # with the headroom rows, for rendering
    frames = {i: f[ext:] for i, f in tall.items()}          # the 4:3 crop everything is measured in
    if a.split:
        return split(frames, a.out, a.crf)
    real = list(range(FIRST + 14, LANDED + 14))                 # once at real speed
    seq = [tall[i].astype(np.float32) for i in real]
    real_n = len(seq)
    r0 = TAKEOFF - 4
    replay = slow(tall, r0, LANDED + 3, SLOW)[2:]
    at = [float(i) for i in real] + [r0 + (j + 2) / SLOW for j in range(len(replay))] + [float(LANDED + 3)] * 12
    seq += [f.astype(np.float32) for f in replay]
    seq += [tall[LANDED + 3].astype(np.float32)] * 12
    track = Track(frames)

    h0, w0 = frames[REF].shape[:2]
    hc = int(round(w0 * 9 / 16 / 2)) * 2 if a.wide else h0     # a 16:9 window of the 4:3 crop
    W = a.w; H = int(round(W * hc / w0 / 2)) * 2
    k = W / w0
    # 16:9 is not tall enough for the whole jump, so the window tilts with it: it keeps the hip
    # and the foot both in frame, smoothed so it reads as one slow camera move
    ids = np.array(track.ids, np.float32)
    mid = ((track.hip[:, 1] - 150) + (track.foot[:, 1] + 45)) / 2
    top = cv2.GaussianBlur(np.clip(mid - hc / 2, -ext, h0 - hc).reshape(-1, 1), (1, 0), 1.6).ravel()
    window = (lambda t: float(np.interp(t, ids, top))) if a.wide else (lambda t: 0.0)

    u = W / 960                                # the overlay was drawn for a 960 wide frame
    over = Overlay(track, at[real_n], float(LANDED + 3), TAKEOFF, None, (W, H),
                   (W - 308 * u, H - 196 * u, 292 * u, 180 * u), ui=u)
    grade = Grader("footage", H, W)
    out = []
    for n, f in enumerate(seq):
        y0 = window(at[n]); yi = int(round(y0))
        g = np.clip(f[yi + ext:yi + ext + hc], 0, 255).astype(np.uint8)
        if (W, H) != (w0, hc):
            g = cv2.resize(g, (W, H), interpolation=cv2.INTER_AREA)
        g = grade(g)
        if n >= real_n:
            over.to_out = lambda p, yi=yi: (p[0] * k, (p[1] - yi) * k)
            g = over.draw(g, at[n], min(1.0, (n - real_n + 1) / 8))
        out.append(g.astype(np.float32))
    n_x = 12                                   # dissolve the tail into the first frame: no cut in the loop
    for j in range(n_x):
        t = (j + 1) / (n_x + 1)
        out[-n_x + j] = out[-n_x + j] * (1 - t) + out[0] * t
    enc = encoder(a.out, W, H, 30, crf=a.crf)
    for n, g in enumerate(out * a.loops):
        g = np.clip(g, 0, 255).astype(np.uint8)
        enc.stdin.write(g.tobytes())
        if a.debug and n % 6 == 0 and n < len(out):
            os.makedirs(a.debug, exist_ok=True)
            cv2.imwrite(f"{a.debug}/j_{n:04d}.jpg", g, [cv2.IMWRITE_JPEG_QUALITY, 88])
    enc.stdin.close(); enc.wait()
    print(f"frames {len(out)} ({len(out) / 30:.2f} s), real-speed part {real_n}, size {W}x{H}")


if __name__ == "__main__":
    main()
