#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 input.svg output.png"
  exit 1
fi

INPUT="$1"
OUTPUT="$2"

# Temp file
TMP_PNG="$(mktemp /tmp/svg2png.XXXXXX).png"

set -x

# 1) Render SVG to 96x96 PNG with transparency
magick -background none -size 116x116 "$INPUT" "$TMP_PNG"
# magick -background none -size 96x96 "$INPUT" "$TMP_PNG"

# 2) Place it centered on a 128x128 transparent canvas
magick "$TMP_PNG" -background none -gravity center -extent 128x128 "$OUTPUT"

rm -f "$TMP_PNG"

echo "Wrote $OUTPUT"
# ./scripts/svg_to_128_with_border.sh icons/hoverboard.svg icons/hoverboard_128_margin.png
