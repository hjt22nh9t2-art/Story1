"""Tonmischung Teil 3 – Jonas (Erzähler) + Fischer (Funk) + Atmo + Musik + Geräusche -> teil_03/roh/mix.wav"""
import json, sys, os
import numpy as np
from scipy.io import wavfile
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'assets', 'sound'))
import sfx
from sfx import SR, secs

D = 60.0; N = secs(D)
mix = np.zeros((N, 2), np.float32)
def put(x, t, gain_db=0.0):
    x = sfx.stereo(x) if x.ndim == 1 else x
    s = secs(t); e = min(N, s + len(x))
    if e > s: mix[s:e] += x[: e - s] * 10 ** (gain_db / 20)
def env_mask(iv, fade=0.03):
    m = np.zeros(N, np.float32)
    for a, b in iv: m[secs(a):secs(b)] = 1
    k = secs(fade); return np.convolve(m, np.ones(k) / k, 'same').astype(np.float32)[:, None]
def load(name):
    sr0, v = wavfile.read(os.path.join(HERE, 'roh', name)); v = v.astype(np.float32) / 32768.0
    return sfx.hp(signal.resample_poly(v, SR, sr0).astype(np.float32), 70)
def compress(v, target):
    env = np.sqrt(signal.lfilter([0.002], [1, -0.998], v ** 2)) + 1e-5
    v = v * np.clip((env / 0.08) ** -0.35, 0.5, 2.5)
    sp = v[np.abs(v) > 0.01]; return v * 10 ** ((target - sfx.rms_db(sp)) / 20)

timing = json.load(open(os.path.join(HERE, 'timing.json')))
J, F = load('stimme_take.wav'), load('fischer_take.wav')
vJ = np.zeros(N, np.float32); vF = np.zeros(N, np.float32); vF_dry = np.zeros(N, np.float32)
for sp, a, b, v0 in timing['segmente']:
    src = J if sp == 'J' else F
    seg = src[secs(a):secs(b)].copy(); f = secs(0.01); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    tgt = vJ if sp == 'J' else vF; s = secs(v0); tgt[s:s + len(seg)] += seg[: N - s]
vJ = compress(vJ, -19)
vF = compress(vF, -18)
radioF = sfx.radio_voice(vF, seed=7)
radioF *= 10 ** ((-20.5 - sfx.rms_db(radioF[np.abs(radioF) > 0.01])) / 20)
# Finale Flüsterzeile: wird von Funk zu „ganz nah“ (trocken) – als stünde er im Raum
x_dry = sfx.smooth_env(N, [(0, 0), (53.7, 0), (54.1, 1), (60, 1)])
fvoice = radioF * (1 - x_dry * 0.85) + vF * x_dry * 0.9
mix += sfx.reverb(vJ, 0.6, 0.07, seed=21, damp=5000)
mix += sfx.stereo(fvoice)

# ---------------- Atmo
ROOM = [(0, 3.0), (9.8, 17.0), (20.5, 23.2), (29.3, 44.6), (47.9, 56.8)]
EXT = [(17.0, 20.5), (23.2, 29.3), (44.6, 47.9)]
REC = [(3.0, 9.8)]
w = sfx.wind(D, seed=23); wv = sfx.waves(D, seed=24, period=5.5)
mix += (sfx.set_rms(w, -34) + sfx.set_rms(wv, -31)) * env_mask(EXT)
mix += (sfx.set_rms(sfx.lp(w, 500), -42) + sfx.set_rms(sfx.lp(wv, 300), -47)) * env_mask(ROOM)
mix += sfx.set_rms(sfx.lp(w, 250), -46) * env_mask(REC)
# Funkrauschen: Pegelverlauf je nach Funkaktivität
rs = sfx.set_rms(sfx.radio_static(D, seed=31, tune=1.2), -31)
rs_env = sfx.smooth_env(N, [(0, 1.0), (2.9, 1.0), (3.0, 0), (14.6, 0), (14.7, 0.9), (17.0, 0.6), (20.5, 0.5), (29.3, 0.35), (44.6, 0.3), (47.9, 0.45), (51.0, 0.0), (52.0, 0.0), (52.3, 0.5), (54.8, 0.6), (54.9, 0), (60, 0)])[:, None]
mix += rs * rs_env

# ---------------- Musik (≈ −18 dB unter der Stimme)
dr = sfx.set_rms(sfx.drone(D, root=38.9, seed=31), -39)
pd = sfx.set_rms(sfx.pad(D, freqs=(77.78, 92.5, 116.54, 138.59), seed=32), -42)
menv = sfx.smooth_env(N, [(0, 0.9), (3.0, 0.5), (9.8, 0.5), (9.9, 0.9), (17.0, 1.2), (29.3, 0.9), (41.1, 1.2), (47.9, 1.3), (51.0, 0.0), (52.1, 0.0), (52.3, 0.7), (54.85, 1.0), (54.9, 0.0), (56.8, 0.0), (57.0, 0.6), (60, 0.5)])[:, None]
penv = sfx.smooth_env(N, [(0, 0), (9.8, 0), (11.0, 1.0), (47.9, 1.0), (50.5, 0.0), (60, 0)])[:, None]
mix += dr * menv + pd * penv
put(sfx.heartbeat(58, 3.0), 57.0, -14)

# ---------------- Geräusche
put(sfx.squelch(0.4, 1), 0.0, -14); put(sfx.sub_hit(2.0, 44), 0.0, -12)
put(sfx.whoosh_riser(0.5), 2.6, -16); put(sfx.whoosh_riser(0.5), 9.3, -18)
put(sfx.drip(1), 4.2, -24); put(sfx.creak(0.6, 50, 1.2, 0.3), 6.0, -24); put(sfx.sub_hit(1.6, 48), 7.4, -16)
put(sfx.latch(51), 12.45, -18); put(sfx.sub_hit(1.8, 46), 12.45, -15)
put(sfx.latch(52), 14.62, -16); put(sfx.squelch(0.5, 53), 14.7, -12)
put(sfx.creak(1.5, 54, 0.6, 0.8), 17.3, -20)
put(sfx.latch(55), 20.7, -18); put(sfx.squelch(0.3, 56), 20.75, -20); put(sfx.latch(57), 25.95, -18); put(sfx.squelch(0.3, 58), 26.0, -16)
for i, t0 in enumerate(np.arange(34.6, 37.9, 0.59)): put(sfx.page_turn(60 + i, 0.45), t0, -21)
put(sfx.page_turn(70, 0.8), 38.25, -18)
put(sfx.sub_hit(2.4, 36), 41.1, -15)
put(sfx.bubbles(3.2, 71), 44.7, -18); put(sfx.creak(1.8, 72, 0.45, 1.0), 44.8, -20)
put(sfx.latch(73), 50.6, -22)
put(sfx.whoosh_riser(0.5), 54.4, -20)
put(sfx.glass_hit(74), STING := 54.9, -6)
put(sfx.sting(2.6, seed=12), 54.9, -7)

mix = np.tanh(mix * 1.1) / 1.1
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
wavfile.write(os.path.join(HERE, 'roh', 'mix.wav'), SR, (mix * 32767).astype(np.int16))
print('Jonas RMS:', round(sfx.rms_db(vJ[np.abs(vJ) > 0.01]), 1), 'Fischer(Funk) RMS:', round(sfx.rms_db(radioF[np.abs(radioF) > 0.01]), 1))
print('Musik RMS:', round(sfx.rms_db((dr * menv + pd * penv)[: secs(50)]), 1))
