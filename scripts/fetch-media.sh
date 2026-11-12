#!/usr/bin/env bash
# Downloads every file listed in media/manifest.tsv from Cargo's file server
# and converts it into a web-friendly format:
#   copy -> saved as is
#   img  -> JPEG, longest side 2400px
#   mp3  -> WAV converted to 320 kbps MP3
#   mp4  -> MOV converted to H.264 MP4
# Files that already exist in media/ are skipped, so it is safe to rerun.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p media /tmp/cargo-src

grep -v '^#' media/manifest.tsv | while IFS=$'\t' read -r name url kind; do
	[ -z "$name" ] && continue
	out="media/$name"
	if [ -s "$out" ]; then echo "skip  $name"; continue; fi
	src="/tmp/cargo-src/$name.src"
	echo "fetch $name"
	curl -fsSL --retry 3 -o "$src" "$url"
	case "$kind" in
		copy) mv "$src" "$out" ;;
		img)  convert "$src[0]" -auto-orient -resize '2400x2400>' -strip -quality 85 "$out" ;;
		mp3)  ffmpeg -nostdin -loglevel error -y -i "$src" -codec:a libmp3lame -b:a 320k "$out" ;;
		mp4)  ffmpeg -nostdin -loglevel error -y -i "$src" -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k "$out" ;;
		*)    echo "unknown process '$kind' for $name" >&2; exit 1 ;;
	esac
	rm -f "$src"
done
echo "done"
