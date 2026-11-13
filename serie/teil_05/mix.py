"""Tonmischung Teil 5 – Stimme + Atmosphäre (Watt, Wrack, Flut) + Musik + Geräusche.
Aufruf: python3 teil_05/mix.py  ->  teil_05/roh/mix.wav
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
STING = 52.3
UNDER = 55.3   # Kamera taucht unter


def put(x, t, gain_db=0.0, target=None):
    target = mix if target is None else target
    x = sfx.stereo(x) if x.ndim == 1 else x
    s = secs(t); e = min(N, s + len(x))
    if e > s: target[s:e] += x[: e - s] * 10 ** (gain_db / 20)


def env_mask(intervals, fade=0.03):
    m = np.zeros(N, np.float32)
    for a, b in intervals: m[secs(a):secs(b)] = 1
    k = secs(fade); m = np.convolve(m, np.ones(k) / k, 'same').astype(np.float32)
    return m[:, None]


timing = json.load(open(os.path.join(HERE, 'timing.json')))

# ---------------- Stimme (ein Take, Segmente an neue Zeitpunkte gesetzt)
sr0, v = wavfile.read(os.path.join(HERE, 'roh', 'stimme_take.wav'))
v = v.astype(np.float32) / 32768.0
v = signal.resample_poly(v, SR, sr0).astype(np.float32)
v = sfx.hp(v, 70)
# etwas dunkler und näher: leichte Absenkung der Höhen, Bass-Wärme
v = v - 0.25 * sfx.hp(v, 6500)
voice = np.zeros(N, np.float32)
for sp, a, b, v0 in timing['segmente']:
    seg = v[secs(a):secs(b)].copy(); f = secs(0.01); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    s = secs(v0); voice[s:s + len(seg)] += seg[: N - s]
envv = np.sqrt(signal.lfilter([0.002], [1, -0.998], voice ** 2)) + 1e-5
voice_c = voice * np.clip((envv / 0.08) ** -0.35, 0.5, 2.5)
voice_c *= 10 ** ((-19 - sfx.rms_db(voice_c[np.abs(voice_c) > 0.01])) / 20)
voice_st = sfx.reverb(voice_c, 0.6, 0.07, seed=21, damp=5000)

# ---------------- Szenen-Raster
IN = [(0, 4.6), (27.35, 44.8)]
REC = [(4.6, 13.6)]
EXT = [(13.6, 27.35), (44.8, 56.8)]
w = sfx.wind(D, seed=51); wv = sfx.waves(D, seed=52, period=7.5)
mix += (sfx.set_rms(w, -36) + sfx.set_rms(sfx.lp(wv, 600), -44)) * env_mask([(13.6, 27.35), (44.8, UNDER)])
mix += (sfx.set_rms(sfx.lp(w, 400), -42)) * env_mask(IN)                       # Wind durch die Planken
mix += sfx.set_rms(sfx.lp(w, 250), -46) * env_mask(REC)
hum = sfx.set_rms(sfx.bulb_hum(D), -46); mix += hum * env_mask(REC)
for i, t0 in enumerate([14.2, 17.0, 19.4, 25.8]): put(sfx.gull(60 + i), t0, -30)
# Tropfen im Wrack
for i, t0 in enumerate([0.6, 1.9, 3.3, 27.5, 28.1, 28.7, 30.2, 31.9, 34.0, 35.8, 37.6, 39.4, 41.1, 42.6, 43.3]): put(sfx.drip(70 + i), t0, -24 if t0 < 28.9 else -28)
for t0, d, s in [(1.2, 1.4, 80), (29.3, 1.6, 81), (38.0, 1.8, 82)]: put(sfx.creak(d, s, 0.55, 0.6), t0, -26)   # Rumpf ächzt

# ---------------- Musik (≈ −18 dB unter der Stimme)
dr = sfx.set_rms(sfx.drone(D, root=34.65, seed=51), -39)
pd = sfx.set_rms(sfx.pad(D, freqs=(69.3, 82.41, 103.83, 138.59), seed=52), -42)
menv = sfx.smooth_env(N, [(0, 0.9), (4.6, 0.5), (13.6, 0.6), (13.8, 0.85), (32.8, 1.0), (39.0, 1.25), (42.4, 1.3), (52.1, 1.45), (52.3, 0.0), (56.8, 0.0), (57.0, 0.6), (60, 0.5)])[:, None]
penv = sfx.smooth_env(N, [(0, 0), (13.6, 0), (15.5, 1.0), (40.0, 1.0), (43.0, 0.0), (60, 0)])[:, None]
mix += dr * menv + pd * penv
put(sfx.heartbeat(58, 3.0), 57.0, -14)

# ---------------- Geräusche
put(sfx.sub_hit(2.0, 44), 0.0, -12)
put(sfx.whoosh_riser(0.5), 4.1, -16); put(sfx.whoosh_riser(0.5), 13.1, -18)
put(sfx.glass_tone(2.0), 11.65, -24)
# Schritte im Schlick
for i, t0 in enumerate(np.arange(21.0, 24.6, 0.56)): put(sfx.mud_step(90 + i), t0, -17 if t0 > 22.6 else -21)
# Kiste, Buch
put(sfx.creak(0.8, 95, 1.2, 0.4), 29.2, -24)
put(sfx.page_turn(96, 0.7), 31.4, -18); put(sfx.page_turn(97, 0.5), 33.0, -24)
put(sfx.sub_hit(2.2, 36), 32.8, -16)
put(sfx.whoosh_riser(3.0, 98), 36.0, -27); put(sfx.sub_hit(2.4, 33), 39.1, -12)
# Die Flut: Rauschen wächst – im Wrack dumpf, draußen voll
fl = sfx.rush(D, seed=99)
g_in = sfx.smooth_env(N, [(0, 0), (42.4, 0), (43.6, 0.5), (44.8, 0.9), (60, 0.9)])
g_out = sfx.smooth_env(N, [(0, 0), (44.8, 0), (44.85, 0.75), (46.6, 0.9), (49.5, 1.0), (STING, 1.15), (STING + 0.3, 1.3), (UNDER, 1.3), (60, 1.3)])
fl_in = sfx.set_rms(sfx.lp(fl, 700), -26) * g_in[:, None] * env_mask([(42.4, 44.8)])
fl_out = sfx.set_rms(fl, -27) * g_out[:, None] * env_mask([(44.8, UNDER)], 0.02)
mix += fl_in + fl_out
put(sfx.creak(1.0, 101, 0.7, 1.0), 42.5, -18)                                # Rumpf ächzt unter dem Wasser
for i, t0 in enumerate(np.arange(44.85, 49.4, 0.3)): put(sfx.splash_step(110 + i), t0, -16)
put(sfx.whoosh_riser(0.5), 44.3, -18)
put(sfx.sub_hit(2.0, 38), 49.45, -15)
# SCHRECK
put(sfx.sting(2.6, seed=15), STING, -6)
put(sfx.whoosh_riser(0.4, 120), STING - 0.35, -14)
put(sfx.set_rms(sfx.rush(1.6, seed=121), -19), STING, 0)                      # Welle schlägt an
put(sfx.heartbeat(84, 2.6), 52.8, -17)
# Unter Wasser
uw = np.zeros((N, 2), np.float32)
put(sfx.set_rms(sfx.rush(2.0, seed=130), -22), UNDER - 0.3, 0, uw)
put(sfx.bubbles(1.6, 131), UNDER, -10, uw)
mix += sfx.underwater(uw) * env_mask([(UNDER - 0.05, 56.5)], 0.05)

# Stimme vorne; ab UNDER keine Stimme mehr
mix += voice_st
mix = np.tanh(mix * 1.1) / 1.1
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
wavfile.write(os.path.join(HERE, 'roh', 'mix.wav'), SR, (mix * 32767).astype(np.int16))
print('Stimme RMS:', round(sfx.rms_db(voice_c[np.abs(voice_c) > 0.01]), 1), 'Musik RMS:', round(sfx.rms_db((dr * menv + pd * penv)[: secs(50)]), 1))
