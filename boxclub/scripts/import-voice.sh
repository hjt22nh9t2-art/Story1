#!/usr/bin/env bash
# Importiert eine extern erzeugte Sprachdatei (JSON mit audio_base64) als MP3 für eine Zeile.
# Aufruf: bash scripts/import-voice.sh <json-datei> <episode-id> <zeilen-id>
set -euo pipefail
json="$1"; ep="$2"; line="$3"
out="data/media/episodes/$ep/voice/$line.mp3"
mkdir -p "$(dirname "$out")"
tmp=$(mktemp --suffix=.bin)
jq -r '.audio_base64' "$json" | base64 -d > "$tmp"
# Stille am Anfang/Ende kürzen, auf MP3 128k bringen
ffmpeg -y -v error -i "$tmp" -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.05" -ar 44100 -ac 1 -b:a 128k "$out"
rm -f "$tmp"
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$out"
