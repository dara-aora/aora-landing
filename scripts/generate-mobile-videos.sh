#!/usr/bin/env bash
#
# Generate mobile-optimized variants of the hero videos.
#
# Produces 720px-wide H.264 MP4s alongside the existing desktop assets
# in public/video/. The site references these via `<source media>`
# selectors so cellular users download the smaller files.
#
# If the variants don't exist, browsers will silently fall through to
# the desktop file — no breakage. Re-run this script any time you swap
# in new source footage.
#
# Requires: ffmpeg (brew install ffmpeg)

set -euo pipefail

cd "$(dirname "$0")/.."

VIDEO_DIR="public/video"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "error: ffmpeg not found on PATH. Install with: brew install ffmpeg" >&2
  exit 1
fi

generate() {
  local input="$1"
  local output="$2"
  if [[ ! -f "$input" ]]; then
    echo "skip: $input does not exist"
    return
  fi
  echo "→ generating $output"
  ffmpeg -y -i "$input" \
    -vf "scale='min(720,iw)':-2" \
    -c:v libx264 -preset slow -crf 28 -profile:v main \
    -an \
    -movflags +faststart \
    "$output"
}

generate "$VIDEO_DIR/aora-hero.mp4"        "$VIDEO_DIR/aora-hero.mobile.mp4"
generate "$VIDEO_DIR/aora-howitworks.mp4"  "$VIDEO_DIR/aora-howitworks.mobile.mp4"

echo "done. Files written:"
ls -lh "$VIDEO_DIR"/*.mobile.mp4 2>/dev/null || true
