"""Grundtonhöhe (F0) einer Sprachdatei schätzen – zur Stimmprüfung (männlich ~85–155 Hz, weiblich ~165–255 Hz).
Aufruf: python3 scripts/pitch.py datei1.mp3 [datei2 ...]"""
import subprocess, sys
import numpy as np

def f0(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    fr, hop, out = 640, 160, []
    for i in range(0, len(x) - fr, hop):
        s = x[i:i + fr] * np.hanning(fr)
        if np.sqrt(np.mean(s ** 2)) < 0.02: continue
        ac = np.correlate(s, s, 'full')[fr - 1:]
        lo, hi = 16000 // 400, 16000 // 60
        k = lo + np.argmax(ac[lo:hi])
        if ac[k] > 0.35 * ac[0]: out.append(16000 / k)
    return np.median(out) if out else 0

for p in sys.argv[1:]:
    v = f0(p)
    print(f'{p.split("/")[-1]:12s} F0 ≈ {v:5.0f} Hz  →  {"männlich" if v < 160 else "weiblich/hoch"}')
