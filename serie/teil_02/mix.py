"""Tonmischung Teil 2 – Stimme + Atmosphäre + Musik (Drone/Pad) + Geräusche.
Aufruf: python3 teil_02/mix.py  ->  teil_02/roh/mix.wav
"""
import json, sys, os
import numpy as np
from scipy.io import wavfile
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'assets', 'sound'))
import sfx
from sfx import SR, secs

D = 60.0
N = secs(D)
mix = np.zeros((N, 2), np.float32)


def put(x, t, gain_db=0.0):
    x = sfx.stereo(x) if x.ndim == 1 else x
    s = secs(t); e = min(N, s + len(x))
    if e > s: mix[s:e] += x[: e - s] * 10 ** (gain_db / 20)


def env_mask(intervals, fade=0.03):
    m = np.zeros(N, np.float32)
    for a, b in intervals: m[secs(a):secs(b)] = 1
    k = secs(fade); m = np.convolve(m, np.ones(k) / k, 'same').astype(np.float32)
    return m[:, None]


timing = json.load(open(os.path.join(HERE, 'timing.json')))

# ---------------- Stimme (ein Take, an Pausen geschnitten, Lücken eingefügt)
sr0, v = wavfile.read(os.path.join(HERE, 'roh', 'stimme_take.wav'))
v = v.astype(np.float32) / 32768.0
v = signal.resample_poly(v, SR, sr0).astype(np.float32)
v = sfx.hp(v, 70)
cuts = timing['schnitt']
pts = [0.0] + [c for c, g in cuts['gaps']] + [len(v) / SR]
voice = np.zeros(N, np.float32)
shift = cuts['offset']
for i in range(len(pts) - 1):
    a, b = pts[i], pts[i + 1]
    seg = v[secs(a):secs(b)].copy()
    f = secs(0.008); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    s = secs(a + shift); voice[s:s + len(seg)] += seg
    if i < len(cuts['gaps']): shift += cuts['gaps'][i][1]
# leichte Kompression (Hüllkurven-Folger) für gleichmäßige Lautstärke
envv = np.sqrt(signal.lfilter([0.002], [1, -0.998], voice ** 2)) + 1e-5
gain = np.clip((envv / 0.08) ** -0.35, 0.5, 2.5)
voice_c = voice * gain
speech = voice_c[np.abs(voice_c) > 0.01]
voice_c *= 10 ** ((-19 - sfx.rms_db(speech)) / 20)
voice_st = sfx.reverb(voice_c, 0.6, 0.07, seed=21, damp=5000)

# ---------------- Szenen-Raster
EXT = [(2.4, 3.6), (6.9, 8.0), (10.0, 25.4)]
IN = [(0, 2.4), (3.6, 6.9), (8.0, 10.0), (25.4, 56.8)]
mExt, mIn = env_mask(EXT), env_mask(IN)
RECAP = env_mask([(3.6, 10.0)], 0.05)

w = sfx.wind(D, seed=13); wv = sfx.waves(D, seed=14)
amb_ext = sfx.set_rms(w, -35) + sfx.set_rms(wv, -33)
amb_in = sfx.set_rms(sfx.lp(w, 500), -43) + sfx.set_rms(sfx.lp(wv, 300), -47)
amb_rec = sfx.set_rms(sfx.lp(w, 250), -46)
quiet = sfx.smooth_env(N, [(0, 1), (50.1, 1), (50.3, 0.45), (60, 0.45)])[:, None]
mix += (amb_ext * mExt + amb_in * mIn) * (1 - RECAP) * quiet + amb_rec * RECAP
# Haustür offen: Außengeräusche dringen in den Flur (0–2.4, 25.4–31.3)
mix += sfx.set_rms(sfx.lp(wv, 1200), -40) * env_mask([(0.6, 2.4), (25.4, 31.3)], 0.4)

# ---------------- Musik (≈ −18 dB unter der Stimme)
dr = sfx.set_rms(sfx.drone(D, root=41.2, seed=21), -39)
pd = sfx.set_rms(sfx.pad(D, freqs=(82.41, 98.0, 123.47, 146.83), seed=22), -42)
music_env = sfx.smooth_env(N, [(0, 0.8), (3.5, 1.0), (3.6, 0.5), (10.0, 0.5), (10.1, 1.0), (34.3, 1.15), (35.4, 0.5), (38.3, 0.9), (45.0, 1.25), (50.1, 1.35), (50.2, 0.0), (56.8, 0.0), (57.0, 0.6), (60, 0.5)])[:, None]
pad_env = sfx.smooth_env(N, [(0, 0.0), (10.0, 0.0), (11.5, 1.0), (34.3, 1.0), (35.0, 0.0), (38.3, 0.0), (40.0, 0.8), (50.1, 1.0), (50.2, 0.0), (60, 0)])[:, None]
mix += dr * music_env + pd * pad_env
put(sfx.heartbeat(58, 3.0), 57.0, -14)
put(sfx.heartbeat(66, 4.0), 38.3, -22)

# ---------------- Geräusche
put(sfx.sub_hit(2.0, 42), 0.0, -12)
put(sfx.latch(1), 0.05, -16); put(sfx.creak(1.4, 21, 0.8), 0.15, -12)          # Haustür geht auf
# Rückblick
put(sfx.whoosh_riser(0.5), 3.1, -16); put(sfx.whoosh_riser(0.5), 9.5, -18)
put(sfx.sub_hit(1.6, 50), 5.1, -14)
put(sfx.set_rms(sfx.lamp_flicker(0.5), -30), 7.15, 0); put(sfx.power_down(1.0), 7.6, -28)
for i, t0 in enumerate([8.5, 9.1, 9.7]): put(sfx.knock(40 + i, 1.2, 0.35), t0, -11)
# Taschenlampe, Spuren
put(sfx.latch(5), 14.25, -20)
put(sfx.sub_hit(2.2, 36), 15.95, -17)
for i, t0 in enumerate(np.arange(25.6, 27.6, 0.6)): put(sfx.footstep('wood', 60 + i), t0, -27)
for i, t0 in enumerate(np.arange(28.0, 31.2, 0.55)): put(sfx.footstep('wood', 70 + i), t0, -24)
for i, t0 in enumerate(np.arange(31.4, 34.1, 0.48)):
    put(sfx.footstep('wood', 80 + i), t0, -23); put(sfx.creak(0.35, 90 + i, 1.3, 0.3), t0 + 0.05, -26)
put(sfx.creak(1.6, 33, 0.7), 34.55, -11)                                   # „Oben knarrte etwas.“
put(sfx.creak(1.5, 34, 0.85), 42.6, -15)                                   # Schlafzimmertür
for i, t0 in enumerate([45.6, 47.3, 49.1, 50.6, 51.9, 54.2, 55.7]): put(sfx.drip(10 + i), t0, -24)
put(sfx.creak(1.3, 35, 0.55, 0.6), 51.3, -10); put(sfx.fabric(1.2, 36), 51.3, -20)   # jemand setzt sich aufs Bett
put(sfx.whoosh_riser(0.5), 52.3, -20)
put(sfx.sting(2.6, seed=11), 52.8, -6)

# ---------------- Summe
mix += voice_st
mix = np.tanh(mix * 1.1) / 1.1
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
out = os.path.join(HERE, 'roh', 'mix.wav')
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('Stimme RMS (gesprochen):', round(sfx.rms_db(voice_c[np.abs(voice_c) > 0.01]), 1), 'dBFS')
print('Musik RMS:', round(sfx.rms_db((dr * music_env + pd * pad_env)[: secs(50)]), 1), 'dBFS')
print('geschrieben:', out)
