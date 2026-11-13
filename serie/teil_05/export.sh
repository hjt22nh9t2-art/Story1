#!/bin/bash
# Finaler Export Teil 5: Bild (Filmkorn) + Ton (Mastering) -> teil_05.mp4
set -e
cd "$(dirname "$0")"
ffmpeg -hide_banner -loglevel error -y -i roh/mix.wav \
  -af "afade=t=in:d=0.015,volume=3.4dB,aresample=192000,alimiter=limit=0.68:level=false:attack=0.5:release=80,aresample=48000" roh/master.wav
ffmpeg -hide_banner -loglevel error -y -i roh/video_stumm.mp4 -i roh/master.wav -map 0:v -map 1:a \
  -vf "noise=c0s=3:c0f=t" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -t 60 teil_05.mp4
ffprobe -v error -show_entries format=duration,size -of compact teil_05.mp4
ffmpeg -hide_banner -i teil_05.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
