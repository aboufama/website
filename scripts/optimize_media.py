"""Build the served media in public/ from the full-size originals in media-src/.

    python scripts/optimize_media.py            # everything
    python scripts/optimize_media.py gauntlet   # only paths containing "gauntlet"

Needs numpy + opencv-python, and cwebp + ffmpeg on PATH. Every output is sized for how it is
shown on the page (gallery tiles never exceed ~700 device px, cut-outs ~1400), photos get one
restrained grade so the whole page shares a look, and src/data/media.json records each
image's pixel size so the page can reserve its space before it loads.
"""
import json, subprocess, sys, tempfile, os
from pathlib import Path
import cv2, numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "media-src", ROOT / "public"
MANIFEST = ROOT / "src" / "data" / "media.json"

# (source, output, kind, longest side in px)
#   photo  = phone photo: white balance, levels, gentle curve
#   cutout = has transparency: resize only
#   plain  = render / drawing / screenshot: resize only
IMAGES = [
    ("CutoutAndre.png",                              "CutoutAndre.webp",                             "cutout", 680),
    ("projects/hexapod/HexapodCAD.png",              "projects/hexapod/HexapodCAD.webp",             "cutout", 900),
    ("projects/hexapod/LegDetail.jpg",               "projects/hexapod/LegDetail.webp",              "plain",  900),
    ("projects/hexapod/LegOnRail.jpg",               "projects/hexapod/LegOnRail.webp",              "photo",  900),
    ("projects/face-mask/FaceMask.png",              "projects/face-mask/FaceMask.webp",             "cutout", 1280),
    ("projects/face-mask/Exploded View.png",         "projects/face-mask/ExplodedView.webp",         "cutout", 900),
    ("projects/face-mask/MechanismA.png",            "projects/face-mask/MechanismA.webp",           "plain",  800),
    ("projects/face-mask/MechanismB.png",            "projects/face-mask/MechanismB.webp",           "plain",  800),
    ("projects/plant-bot/CutePlant.png",             "projects/plant-bot/CutePlant.webp",            "cutout", 1000),
    ("projects/plant-bot/RobotCad.png",              "projects/plant-bot/RobotCad.webp",             "cutout", 900),
    ("projects/plant-bot/ExplodedView.png",          "projects/plant-bot/ExplodedView.webp",         "cutout", 900),
    ("projects/plant-bot/Used.png",                  "projects/plant-bot/Used.webp",                 "photo",  900),
    ("projects/plant-bot/Misbehaved.png",            "projects/plant-bot/Misbehaved.webp",           "photo",  900),
    ("projects/gauntlet/GloveHands.png",             "projects/gauntlet/GloveHands.webp",            "cutout", 1200),
    ("projects/gauntlet/FusionGauntlet.png",         "projects/gauntlet/FusionGauntlet.webp",        "plain",  900),
    ("projects/gauntlet/Gauntlet.png",               "projects/gauntlet/Gauntlet.webp",              "photo",  900),
    ("projects/gauntlet/HandTesting.png",            "projects/gauntlet/HandTesting.webp",           "photo",  900),
    ("projects/gauntlet/HappyTesting.jpg",           "projects/gauntlet/HappyTesting.webp",          "photo",  900),
    ("projects/gauntlet/WithHandModel.png",          "projects/gauntlet/WithHandModel.webp",         "photo",  900),
    ("projects/gauntlet/Open.png",                   "projects/gauntlet/Open.webp",                  "photo",  900),
    ("projects/gauntlet/Closed.png",                 "projects/gauntlet/Closed.webp",                "photo",  900),
    ("projects/modular-hydroponics/Hydroponics.png", "projects/modular-hydroponics/Hydroponics.webp", "cutout", 1200),
    ("projects/modular-hydroponics/Image1.jpg",      "projects/modular-hydroponics/Image1.webp",     "plain",  1100),
    ("projects/modular-hydroponics/Image2.png",      "projects/modular-hydroponics/Image2.webp",     "photo",  900),
    ("projects/modular-hydroponics/Image3.png",      "projects/modular-hydroponics/Image3.webp",     "photo",  900),
    ("projects/modular-hydroponics/Image4.png",      "projects/modular-hydroponics/Image4.webp",     "photo",  900),
    ("projects/autonomous-rover/Rover.png",          "projects/autonomous-rover/Rover.webp",         "cutout", 1600),
    ("projects/autonomous-rover/Image1.png",         "projects/autonomous-rover/Image1.webp",        "photo",  900),
    ("projects/autonomous-rover/Image2.png",         "projects/autonomous-rover/Image2.webp",        "photo",  900),
    ("projects/autonomous-rover/Image3.png",         "projects/autonomous-rover/Image3.webp",        "photo",  900),
    ("projects/autonomous-rover/Image4.png",         "projects/autonomous-rover/Image4.webp",        "photo",  900),
    ("projects/helios-x/Field.jpg",                  "projects/helios-x/Field.webp",                 "plain",  2000),
    ("projects/helios-x/Field.jpg",                  "projects/helios-x/Field-1100.webp",            "plain",  1100),
    ("projects/veridien/Operating.jpg",              "projects/veridien/Operating.webp",             "plain",  1000),
    ("projects/veridien/SessionSummary.jpg",         "projects/veridien/SessionSummary.webp",        "plain",  1000),
    ("projects/veridien/RigCameras.jpg",             "projects/veridien/RigCameras.webp",            "plain",  1000),
    ("projects/veridien/MachineVision.jpg",          "projects/veridien/MachineVision.webp",         "plain",  1000),
]

# (source, output, width in px, crf, poster time in s). Posters are written next to the video.
VIDEOS = [
    ("projects/hexapod/WalksMaster.mp4",      "projects/hexapod/Walks.mp4",            720, 27, 0.0),   # built by scripts/sim_zoom.py
    ("projects/hexapod/LegStand.mp4",         "projects/hexapod/LegStand.mp4",         720, 27, 0.0),
    ("projects/face-mask/MaskMoving.mp4",     "projects/face-mask/MaskMoving.mp4",     640, 26, 0.0),
    ("projects/plant-bot/Walking.mp4",        "projects/plant-bot/Walking.mp4",        640, 26, 0.0),
    ("projects/plant-bot/Autonomy.mp4",       "projects/plant-bot/Autonomy.mp4",       536, 26, 0.0),
]
# Already final in public/: only a poster is needed.
POSTERS = [
    ("projects/hexapod/Stairs.mp4",        0.0, 960),
    ("projects/hexapod/LegJump.mp4",       0.0, 800),   # the film itself is cut by scripts/leg_jump.py
    ("projects/veridien/VeridienFilm-720.mp4", 3.5, 1280),   # the film itself is cut by scripts/veridien_film.sh
]


# The simulator opening up, frame by frame (rendered for veridienlabs.org; every second frame of
# the part of the shot where something moves). Scrubbed by the scroll position on the page.
OPENING_SRC, OPENING_OUT = "projects/veridien/opening", "projects/veridien/opening"
OPENING_CROP = (0.12, 0.05, 0.68, 0.95)      # x, y, w, h as fractions of the render
OPENING_GROUND = (245.0, 248.0, 245.0)       # the render's flat backdrop (BGR), mapped to white
OPENING_WIDTH = 900


def do_opening():
    files = sorted((SRC / OPENING_SRC).glob("f*.webp"))
    size = None
    for n, f in enumerate(files):
        im = cv2.imread(str(f)).astype(np.float32)
        h, w = im.shape[:2]
        x, y, cw, ch = OPENING_CROP
        im = im[round(y * h):round((y + ch) * h), round(x * w):round((x + cw) * w)]
        im = np.clip(im / np.array(OPENING_GROUND, np.float32) * 255, 0, 255)
        # the floor shadow never quite reaches white: feather the outer 6 % so no frame edge shows
        hh, ww = im.shape[:2]
        fx = np.clip(np.minimum(np.arange(ww), ww - 1 - np.arange(ww)) / (0.06 * ww), 0, 1)
        fy = np.clip(np.minimum(np.arange(hh), hh - 1 - np.arange(hh)) / (0.06 * hh), 0, 1)
        keep = (fy * fy * (3 - 2 * fy))[:, None] * (fx * fx * (3 - 2 * fx))[None, :]
        im = (255 - (255 - im) * keep[..., None]).astype(np.uint8)
        k = OPENING_WIDTH / im.shape[1]
        im = cv2.resize(im, (OPENING_WIDTH, round(im.shape[0] * k)), interpolation=cv2.INTER_AREA)
        write_webp(im, OUT / OPENING_OUT / f"{n:02d}.webp", 78)
        size = [im.shape[1], im.shape[0]]
    return len(files), size


def grade_photo(bgr):
    """One quiet look for every phone photo: neutral whites, full tonal range, a soft S-curve."""
    img = bgr.astype(np.float32) / 255
    lum = img @ np.array([0.114, 0.587, 0.299], np.float32)
    chroma = img.max(2) - img.min(2)
    # white balance from pixels that are already close to neutral, so a wooden desk or a
    # coloured wall cannot drag the whole frame the other way
    ref = (lum > 0.25) & (lum < 0.92) & (chroma < 0.12)
    if ref.mean() > 0.03:
        m = img[ref].mean(0)
        gain = np.clip(1 + (m.mean() / m - 1) * 0.7, 0.93, 1.07)
        img = img * gain
        lum = img @ np.array([0.114, 0.587, 0.299], np.float32)
    # levels: use the range the photo has, without clipping more than a sliver
    lo, hi = np.percentile(lum, [0.3, 99.7])
    lo, hi = min(lo, 0.07) * 0.8, max(hi, 0.82)
    img = (img - lo) / max(hi - lo, 1e-3)
    img = np.clip(img, 0, 1)
    lum = img @ np.array([0.114, 0.587, 0.299], np.float32)
    # exposure: bring a dark or washed-out frame toward a normal midpoint, never all the way
    med = float(np.median(lum))
    gamma = float(np.clip(np.log(0.46) / np.log(max(med, 1e-3)), 0.80, 1.15))
    gamma = 1 + (gamma - 1) * 0.55
    img = img ** gamma
    # soft S-curve around the midpoint
    s = 0.10
    img = img + s * (img - 0.5) * (1 - np.abs(2 * img - 1)) * 1.6
    img = np.clip(img, 0, 1)
    # vibrance: lift muted colour a touch, leave strong colour (skin, wood) alone
    lum = (img @ np.array([0.114, 0.587, 0.299], np.float32))[..., None]
    chroma = (img.max(2) - img.min(2))[..., None]
    img = lum + (img - lum) * (1 + 0.10 * (1 - np.clip(chroma / 0.5, 0, 1)))
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)


def resize(img, longest):
    h, w = img.shape[:2]
    k = longest / max(h, w)
    if k >= 1:
        return img
    out = cv2.resize(img, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA)
    # downscaling softens: a light unsharp mask on the colour channels brings the edges back
    blur = cv2.GaussianBlur(out[..., :3], (0, 0), 0.8)
    out[..., :3] = cv2.addWeighted(out[..., :3], 1.35, blur, -0.35, 0)
    return out


def write_webp(img, path, q):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as t:
        tmp = t.name
    cv2.imwrite(tmp, img)
    subprocess.run(["cwebp", "-quiet", "-q", str(q), "-m", "6", "-sharp_yuv", "-alpha_q", "92",
                    tmp, "-o", str(path)], check=True)
    os.unlink(tmp)


def do_image(src, out, kind, longest):
    img = cv2.imread(str(SRC / src), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise SystemExit(f"cannot read {SRC / src}")
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    has_alpha = img.shape[2] == 4 and img[..., 3].min() < 250
    if not has_alpha:
        img = img[..., :3]
    if kind == "photo":
        img = np.ascontiguousarray(img)
        img[..., :3] = grade_photo(img[..., :3])
    img = resize(np.ascontiguousarray(img), longest)
    write_webp(img, OUT / out, 86 if has_alpha else 80)
    return img.shape[1], img.shape[0]


def poster(video, t, width):
    out = video.with_suffix(".webp")
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tf:
        tmp = tf.name
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(video), "-frames:v", "1",
                    "-vf", f"scale='min({width},iw)':-2:flags=lanczos", tmp], check=True)
    img = cv2.imread(tmp)
    os.unlink(tmp)
    write_webp(img, out, 80)
    return img.shape[1], img.shape[0]


def do_video(src, out, width, crf, t):
    dst = OUT / out
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(SRC / src), "-an",
                    "-vf", f"scale='min({width},iw)':-2:flags=lanczos", "-c:v", "libx264", "-preset", "veryslow",
                    "-crf", str(crf), "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
                    str(dst)], check=True)
    return poster(dst, t, width)


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else ""
    sizes = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    for src, out, kind, longest in IMAGES:
        if only in out:
            w, h = do_image(src, out, kind, longest)
            sizes[out] = [w, h]
            print(f"{out:58s} {w}x{h}  {(OUT / out).stat().st_size / 1024:7.0f} kB")
    for src, out, width, crf, t in VIDEOS:
        if only in out:
            w, h = do_video(src, out, width, crf, t)
            sizes[out] = [w, h]
            sizes[str(Path(out).with_suffix(".webp"))] = [w, h]
            print(f"{out:58s} {w}x{h}  {(OUT / out).stat().st_size / 1024:7.0f} kB")
    for out, t, width in POSTERS:
        if only in out:
            w, h = poster(OUT / out, t, width)
            sizes[out] = [w, h]
            sizes[str(Path(out).with_suffix(".webp"))] = [w, h]
            print(f"{str(Path(out).with_suffix('.webp')):58s} {w}x{h}")
    if only in OPENING_OUT:
        count, size = do_opening()
        sizes[OPENING_OUT] = size + [count]
        print(f"{OPENING_OUT:58s} {size[0]}x{size[1]}  {count} frames")
    # hand-finished stills that are already final in public/
    for p in sorted((OUT / "projects").rglob("*.webp")):
        rel = str(p.relative_to(OUT))
        if rel not in sizes and OPENING_OUT not in rel:
            im = cv2.imread(str(p), cv2.IMREAD_UNCHANGED)
            sizes[rel] = [im.shape[1], im.shape[0]]
    sizes = {k: v for k, v in sizes.items() if (OUT / k).exists() and not (OPENING_OUT + "/") in k}
    MANIFEST.write_text(json.dumps(dict(sorted(sizes.items())), indent=1) + "\n")


if __name__ == "__main__":
    main()
