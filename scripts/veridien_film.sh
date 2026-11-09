#!/bin/zsh
# Cut the Veridien film for the site from the 16:9 master.
#   scripts/veridien_film.sh path/to/screen_main_16x9_silent.mp4
#
# The master opens on ten seconds of the organ. The site cut is the same loop started later:
# a blink of the organ, then the pull-back to the people operating in the lab, and the
# digital-twin opening moves to the end of the loop.
#   A = master frames 264..1127 (pull-back, lab, procedure)   B = frames 11..263 (twin opening)
set -euo pipefail
master="$1"
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/public/projects/veridien"        # the page shows the film at tile size: 720p is served
keep="$root/media-src/projects/veridien"    # the 1080p cut is kept as a master, not deployed
cut="[0:v]trim=start_frame=264:end_frame=1128,setpts=PTS-STARTPTS[a];[0:v]trim=start_frame=11:end_frame=264,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0"
common=(-an -c:v libx264 -preset slow -pix_fmt yuv420p -profile:v high -movflags +faststart)
ffmpeg -v error -y -i "$master" -filter_complex "$cut,format=yuv420p[v]" -map "[v]" "${common[@]}" -crf 24 -maxrate 6M -bufsize 12M "$keep/VeridienFilm-1080.mp4"
[[ "${2:-}" == "--hd-only" ]] || ffmpeg -v error -y -i "$master" -filter_complex "$cut,scale=1280:-2:flags=lanczos,format=yuv420p[v]" -map "[v]" "${common[@]}" -crf 24 "$out/VeridienFilm-720.mp4"
ls -la "$out"/VeridienFilm*.mp4 "$keep"/VeridienFilm*.mp4
