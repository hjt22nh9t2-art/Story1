"""Stimmanalyse für die Besetzung: Tonhöhe, Anteil weiblicher Tonhöhe, Sprünge, Klarheit, Tempo.
Aufruf: python3 scripts/voice_check.py datei1 [datei2 …]"""
import subprocess, sys
import numpy as np

def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32)

print(f"{'Datei':22s} {'Dauer':>5s} {'F0 Med':>6s} {'F0 P10–P90':>11s} {'>165Hz':>6s} {'Sprünge':>7s} {'Klarheit':>8s} {'Pegel':>6s}")
for p in sys.argv[1:]:
    x = load(p); fr, hop = 640, 160; f0 = []; cent = []; rms = []
    for i in range(0, len(x) - fr, hop):
        s = x[i:i + fr] * np.hanning(fr); r = np.sqrt(np.mean(s ** 2))
        if r < 0.015: f0.append(np.nan); continue
        rms.append(r); sp = np.abs(np.fft.rfft(s)); fq = np.fft.rfftfreq(fr, 1 / 16000); cent.append((sp * fq).sum() / sp.sum())
        ac = np.correlate(s, s, 'full')[fr - 1:]; k = 32 + np.argmax(ac[32:267])
        f0.append(16000 / k if ac[k] > 0.4 * ac[0] else np.nan)
    f = np.array(f0); v = f[~np.isnan(f)]
    pairs = [(a, b) for a, b in zip(f[:-1], f[1:]) if not (np.isnan(a) or np.isnan(b))]
    jumps = np.mean([abs(np.log2(b / a)) > 0.5 for a, b in pairs]) if pairs else 0  # > halbe Oktave
    print(f"{p.split('/')[-1][:22]:22s} {len(x)/16000:5.1f} {np.median(v):6.0f} {np.percentile(v,10):5.0f}–{np.percentile(v,90):4.0f} {np.mean(v>165)*100:5.0f}% {jumps*100:6.1f}% {np.median(cent):7.0f}Hz {20*np.log10(np.median(rms)):5.1f}")
