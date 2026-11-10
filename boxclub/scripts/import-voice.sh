#!/usr/bin/env bash
# Importiert eine extern erzeugte Sprachdatei (gespeicherte Speko-Antwort) als MP3 für eine Zeile.
# Aufruf: bash scripts/import-voice.sh <antwort-datei> <episode-id> <zeilen-id> [tempo]
set -euo pipefail
json="$1"; ep="$2"; line="$3"; tempo="${4:-1.0}"
out="data/media/episodes/$ep/voice/$line.mp3"
mkdir -p "$(dirname "$out")"
tmp=$(mktemp --suffix=.wav)
python3 "$(dirname "$0")/speko_audio.py" "$json" "$tmp" >&2
# Stille am Anfang/Ende kürzen, optional Tempo anpassen (tonhöhenneutral), MP3 128k
ffmpeg -y -v error -i "$tmp" -af "silenceremove=stop_periods=-1:stop_duration=0.25:stop_threshold=-42dB,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo=$tempo,apad=pad_dur=0.05" -ar 44100 -ac 1 -b:a 128k "$out"
rm -f "$tmp"
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$out"
