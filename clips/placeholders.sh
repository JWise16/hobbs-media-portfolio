#!/usr/bin/env bash
# Generates synthetic placeholder sources into clips/source/ so the pipeline and
# the review site have something to play before Sam's footage lands. These are
# never approved and never ship (SITE_STAGE=live refuses unapproved clips).
# Replace them by pointing manifest.json entries at real files in clips/source/.
set -euo pipefail
cd "$(dirname "$0")/source"
gen() { # name seconds c0 c1 c2 c3
  ffmpeg -y -hide_banner -loglevel error -f lavfi \
    -i "gradients=size=1920x1080:rate=30:duration=$2:speed=0.015:nb_colors=4:c0=$3:c1=$4:c2=$5:c3=$6:x0=200:y0=900:x1=1700:y1=100" \
    -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -an "$1.mp4"
}
gen placeholder-dusk     10 0x0B0D12 0x1F2A3F 0x8C5A3C 0x2C3E5A
gen placeholder-harbor   10 0x0A0F18 0x22304A 0x6E7F9A 0x141C2A
gen placeholder-rise      4 0x0B0D12 0x3A2A22 0xC9A24A 0x12100E
gen placeholder-sound    10 0x101418 0x2A3A44 0x9AA7B0 0x1A2228
