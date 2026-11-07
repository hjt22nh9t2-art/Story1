"""Tonmischung Teil 1 – Stimme + Atmosphäre + Musik (Drone/Pad) + Geräusche.
Aufruf: python3 teil_01/mix.py  ->  teil_01/roh/mix.wav
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
EXT = [(0, 2.3), (4.7, 20.35), (32.9, 36.9), (49.9, 51.6)]
ROOM = [(20.35, 32.9), (36.9, 49.9)]
HALL = [(2.3, 4.7), (51.6, 56.8)]
mExt, mRoom, mHall = env_mask(EXT), env_mask(ROOM), env_mask(HALL)

# Atmosphäre: draußen offen, drinnen gedämpft
w = sfx.wind(D, seed=3); wv = sfx.waves(D, seed=4)
amb_ext = sfx.set_rms(w, -36) + sfx.set_rms(wv, -34)
amb_in = sfx.set_rms(sfx.lp(w, 500), -42) + sfx.set_rms(sfx.lp(wv, 300), -46)
lights_out = sfx.smooth_env(N, [(0, 1), (50.9, 1), (51.0, 0.35), (60, 0.35)])[:, None]
mix += amb_ext * mExt * lights_out + amb_in * (mRoom + mHall) * lights_out
# Endtafel: nur noch leiser Wind
mix += sfx.set_rms(sfx.lp(w, 400), -48) * env_mask([(56.8, 60)], 0.3)

# Möwen in der Ferne
for t0, sd, g in ((5.3, 1, -30), (9.6, 2, -33), (15.2, 3, -31)):
    put(sfx.pan(sfx.gull(sd)[:, 0], [-0.6, 0.5, -0.2][sd - 1]), t0, g + 6)

# ---------------- Musik: Drone + dunkle Fläche (≈ −18 dB unter der Stimme)
dr = sfx.set_rms(sfx.drone(D, seed=11), -39)
pd = sfx.set_rms(sfx.pad(D, seed=12), -42)
music_env = sfx.smooth_env(N, [(0, 0.7), (2.3, 1.0), (20, 0.9), (30, 1.15), (40.6, 1.2), (46.9, 1.35), (47.05, 0.8), (50.9, 1.0), (50.95, 0.0), (56.8, 0.0), (57.0, 0.6), (60, 0.5)])[:, None]
pad_env = sfx.smooth_env(N, [(0, 0.0), (4.6, 0.0), (6.0, 1.0), (46.9, 1.0), (47.05, 0.0), (60, 0)])[:, None]
mix += dr * music_env + pd * pad_env
put(sfx.heartbeat(58, 3.0), 57.0, -14)

# ---------------- Geräusche
put(sfx.sub_hit(2.2, 45), 0.0, -9)                     # Hook-Einschlag
put(sfx.knock(1, 1.2, 0.3), 2.33, -3)                  # Hook: Klopfen
eng = sfx.set_rms(sfx.boat_engine(4.6), -34)
eng *= sfx.smooth_env(len(eng), [(0, 0), (0.3, 1), (4.0, 0.8), (4.6, 0)])[:, None]
put(eng, 7.3, 0)
for i, t0 in enumerate(np.arange(13.3, 14.15, 0.42)): put(sfx.footstep('wood', i), t0, -22)
for i, t0 in enumerate(np.arange(17.35, 20.3, 0.5)): put(sfx.footstep('gravel', 10 + i), t0, -24)
put(sfx.page_turn(1), 24.15, -20); put(sfx.page_turn(2, 0.8), 25.9, -18)
put(sfx.sub_hit(2.5, 38), 29.95, -16)                  # „Mach das Licht nicht aus.“
# Funkgerät: setzt ein, wird laut, bricht bei 3:33 ab
rs = sfx.set_rms(sfx.radio_static(9.5, seed=5), -30)
rs *= sfx.smooth_env(len(rs), [(0, 0), (0.6, 0.25), (3.0, 0.5), (3.1, 1.0), (4.7, 1.0), (4.8, 0.45), (9.4, 0.5), (9.45, 0)])[:, None]
put(rs, 37.6, 0)
# 3:33 – Ziffernwechsel
clk = sfx.stereo((sfx.hp(sfx.noise(0.05, 4), 2000) * np.exp(-np.arange(secs(0.05)) / SR * 80)).astype(np.float32))
put(clk, 47.05, -10); put(sfx.sub_hit(2.0, 50), 47.05, -8)
# Licht stirbt
put(sfx.set_rms(sfx.lamp_flicker(0.65), -24), 50.3, 0); put(sfx.power_down(1.4), 50.9, -26)
# Dreimal Klopfen
for i, t0 in enumerate([52.6, 53.3, 54.0]): put(sfx.knock(20 + i, 1.4, 0.45), t0, -1.5)
for i, t0 in enumerate([53.7, 54.45, 55.9]): put(sfx.drip(i), t0, -26)
put(sfx.whoosh_riser(0.6), 54.3, -20)
put(sfx.sting(2.6), 54.9, -6)

# ---------------- Summe
mix += voice_st
mix = np.tanh(mix * 1.1) / 1.1                          # weiche Begrenzung
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
out = os.path.join(HERE, 'roh', 'mix.wav')
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
# Pegelvergleich (Kontrolle: Musik ~18 dB unter Stimme)
print('Stimme RMS (gesprochen):', round(sfx.rms_db(voice_c[np.abs(voice_c) > 0.01]), 1), 'dBFS')
print('Musik RMS:', round(sfx.rms_db((dr * music_env + pd * pad_env)[: secs(50)]), 1), 'dBFS')
print('geschrieben:', out)
