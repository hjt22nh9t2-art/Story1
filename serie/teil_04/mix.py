"""Tonmischung Teil 4 – Stimme + Atmosphäre + Musik (Drone/Pad) + Geräusche.
Aufruf: python3 teil_04/mix.py  ->  teil_04/roh/mix.wav
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
CELLAR = [(0, 5.0), (13.4, 56.8)]
REC_ROOM = [(5.0, 8.5), (11.6, 13.4)]
REC_EXT = [(8.5, 11.6)]
w = sfx.wind(D, seed=41); wv = sfx.waves(D, seed=42)
mix += (sfx.set_rms(sfx.lp(w, 300), -48) + sfx.set_rms(sfx.lp(wv, 220), -46)) * env_mask(CELLAR)
mix += sfx.set_rms(sfx.lp(w, 250), -46) * env_mask(REC_ROOM)
mix += (sfx.set_rms(sfx.lp(w, 600), -40) + sfx.set_rms(wv, -38)) * env_mask(REC_EXT)
# Glühbirne brummt, solange sie brennt
hum = sfx.set_rms(sfx.bulb_hum(D), -44)
mix += hum * env_mask([(0, 5.0), (16.95, 55.9)], 0.02)
for i, t0 in enumerate([1.2, 19.8, 26.5, 31.9, 38.4, 44.8, 53.4]): put(sfx.drip(30 + i), t0, -27)

# ---------------- Musik (≈ −18 dB unter der Stimme)
dr = sfx.set_rms(sfx.drone(D, root=36.7, seed=41), -39)
pd = sfx.set_rms(sfx.pad(D, freqs=(73.42, 87.31, 110.0, 130.81), seed=42), -42)
menv = sfx.smooth_env(N, [(0, 0.9), (5.0, 0.5), (13.4, 0.5), (13.5, 0.9), (34.4, 1.2), (40.0, 1.35), (50.4, 1.4), (50.6, 0.0), (56.8, 0.0), (57.0, 0.6), (60, 0.5)])[:, None]
penv = sfx.smooth_env(N, [(0, 0), (13.4, 0), (15.0, 1.0), (43.0, 1.0), (46.0, 0.0), (60, 0)])[:, None]
mix += dr * menv + pd * penv
put(sfx.heartbeat(58, 3.0), 57.0, -14)
put(sfx.heartbeat(80, 1.6), 52.8, -16)

# ---------------- Geräusche
put(sfx.sub_hit(2.0, 44), 0.0, -12)
put(sfx.whoosh_riser(0.5), 4.5, -16); put(sfx.whoosh_riser(0.5), 12.9, -18)
rs = sfx.set_rms(sfx.radio_static(3.5, seed=43), -31); put(rs, 5.0, 0)
put(sfx.bubbles(3.0, 44), 8.6, -18); put(sfx.glass_hit(45), 11.75, -16)
put(sfx.creak(1.2, 46, 0.8), 13.4, -18)                                         # Kellertür
for i, t0 in enumerate(np.arange(13.7, 16.6, 0.42)):
    put(sfx.footstep('wood', 47 + i), t0, -24); put(sfx.creak(0.3, 60 + i, 1.4, 0.3), t0 + 0.04, -28)
put(sfx.latch(70), 16.9, -14); put(sfx.set_rms(sfx.lamp_flicker(0.35), -30), 16.95, 0)
put(sfx.creak(0.9, 71, 1.1, 0.5), 21.0, -20); put(sfx.fabric(0.9, 72), 21.6, -24)
put(sfx.page_turn(73, 0.5), 23.6, -20); put(sfx.page_turn(74, 0.5), 32.8, -22)
put(sfx.sub_hit(2.2, 36), 34.4, -14)
put(sfx.whoosh_riser(3.4, 75), 37.2, -26); put(sfx.sub_hit(2.4, 33), 40.1, -13)
put(sfx.fabric(1.2, 76), 44.3, -22)
put(sfx.glass_tone(4.6), 46.4, -24)
put(sfx.whoosh_riser(0.5), 50.7, -20)
put(sfx.sting(2.6, seed=13), STING := 51.2, -6)
put(sfx.whoosh_riser(0.3, 77), 52.45, -12); put(sfx.fabric(0.4, 78), 52.6, -18)
put(sfx.sub_hit(1.8, 40), 54.3, -9); put(sfx.glass_tone(1.5, 1460, 79), 54.3, -20)
put(sfx.bulb_pop(80), 55.88, 2)

mix += voice_st
mix = np.tanh(mix * 1.1) / 1.1
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
wavfile.write(os.path.join(HERE, 'roh', 'mix.wav'), SR, (mix * 32767).astype(np.int16))
print('Stimme RMS:', round(sfx.rms_db(voice_c[np.abs(voice_c) > 0.01]), 1), 'Musik RMS:', round(sfx.rms_db((dr * menv + pd * penv)[: secs(50)]), 1))
