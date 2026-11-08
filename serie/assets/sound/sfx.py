"""Prozedurales Sounddesign für „Der Leuchtturm von Nebelsand“ – wiederverwendbar für alle Teile.
Alles wird synthetisch erzeugt (keine Fremd-Samples): Wind, Wellen, Möwen, Drone, Funkrauschen,
Klopfen, Schritte, Seiten, Bootsmotor, Schreck-Sound. 48 kHz, float32, stereo (N, 2).
"""
import numpy as np
from scipy import signal

SR = 48000
_rng = np.random.default_rng(1953)


def secs(n):
    return int(round(n * SR))


def noise(d, seed=None):
    r = np.random.default_rng(seed) if seed is not None else _rng
    return r.standard_normal(secs(d)).astype(np.float32)


def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'low'); return signal.lfilter(b, a, x, axis=0).astype(np.float32)


def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'high'); return signal.lfilter(b, a, x, axis=0).astype(np.float32)


def bp(x, f1, f2, order=2):
    b, a = signal.butter(order, [f1 / (SR / 2), f2 / (SR / 2)], 'band'); return signal.lfilter(b, a, x, axis=0).astype(np.float32)


def smooth_env(n, points):
    """points: [(t_sec, value), ...] -> lineare Hüllkurve der Länge n"""
    ts = np.array([p[0] for p in points]) * SR; vs = np.array([p[1] for p in points])
    return np.interp(np.arange(n), ts, vs).astype(np.float32)


def slow_lfo(n, rate, seed=0, depth=1.0):
    r = np.random.default_rng(seed)
    k = max(4, int(n / SR * rate) + 4)
    pts = r.uniform(-1, 1, k)
    return (np.interp(np.linspace(0, k - 3, n), np.arange(k), pts) * depth).astype(np.float32)


def stereo(x, width=0.0, seed=0):
    if x.ndim == 2: return x
    if width <= 0: return np.stack([x, x], 1)
    d = int(0.012 * SR * width)
    r = np.roll(x, d)
    return np.stack([x, (1 - width) * x + width * r], 1)


def pan(x, p):
    """p: -1 links … +1 rechts (Mono-Input)"""
    l = np.cos((p + 1) * np.pi / 4); r = np.sin((p + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1).astype(np.float32)


def reverb(x, decay=1.6, mix=0.3, pre=0.02, seed=3, damp=4000):
    """einfacher Faltungshall mit exponentiell abklingendem Rauschen"""
    n = secs(decay)
    r = np.random.default_rng(seed)
    t = np.arange(n) / SR
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)], 1) * np.exp(-6.9 * t / decay)[:, None]
    ir = lp(ir, damp)
    ir[: secs(pre)] = 0
    ir /= np.sqrt((ir ** 2).sum(0, keepdims=True)) + 1e-9
    xs = stereo(x) if x.ndim == 1 else x
    wet = np.stack([signal.fftconvolve(xs[:, c], ir[:, c])[: len(xs)] for c in range(2)], 1)
    return ((1 - mix) * xs + mix * wet).astype(np.float32)


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) + 1e-9; return (x / m * peak).astype(np.float32)


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x.astype(np.float64) ** 2)) + 1e-12)


def set_rms(x, db):
    return (x * 10 ** ((db - rms_db(x)) / 20)).astype(np.float32)


# ------------------------------------------------------------ Atmosphäre
def wind(d, seed=1, gust=1.0):
    n = secs(d)
    base = noise(d, seed)
    lfo = 0.55 + 0.45 * slow_lfo(n, 0.25, seed, 1.0) * gust
    # zwei Bänder: tiefes Rauschen + pfeifendes Band mit wandernder Frequenz
    low = lp(base, 420) * 1.0
    whistle = bp(noise(d, seed + 1), 700, 1400) * 0.35
    out = (low * lfo + whistle * np.clip(lfo - 0.5, 0, 1) * 1.6)
    return stereo(out, 0.6, seed)


def waves(d, seed=2, period=6.5):
    n = secs(d); t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    r = np.random.default_rng(seed)
    pos = 0.0
    while pos < d:
        p = period * r.uniform(0.7, 1.3); s0 = secs(pos)
        ln = secs(p * 1.4); seg = noise(p * 1.4, int(r.integers(1e6)))
        tt = np.arange(ln) / SR
        env = (np.clip(tt / (p * 0.45), 0, 1) ** 2) * np.exp(-np.clip(tt - p * 0.45, 0, None) * 1.6)
        wave = (lp(seg, 900) * 0.9 + hp(lp(seg, 5000), 1800) * 0.25) * env
        e = min(n, s0 + ln); out[s0:e] += wave[: e - s0] * r.uniform(0.6, 1.0)
        pos += p
    return stereo(out, 0.8, seed)


def gull(seed=0):
    """eine entfernte Möwe: mehrere absteigende Rufe"""
    r = np.random.default_rng(seed); calls = []
    for k in range(int(r.integers(2, 5))):
        d = r.uniform(0.18, 0.32); n = secs(d); t = np.arange(n) / SR
        f0 = r.uniform(1100, 1500); f = f0 * (1 - 0.35 * t / d) + 120 * np.sin(2 * np.pi * 9 * t)
        ph = 2 * np.pi * np.cumsum(f) / SR
        tone = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
        env = np.sin(np.pi * t / d) ** 0.7
        calls.append(tone * env); calls.append(np.zeros(secs(r.uniform(0.05, 0.14))))
    x = np.concatenate(calls).astype(np.float32)
    x = bp(x, 700, 4000)
    return reverb(x, 1.8, 0.55, seed=seed + 7, damp=2500)


def drone(d, root=43.65, seed=4, dark=1.0):
    """tiefer, unruhiger Drone (Grundton F1) mit Schwebungen und Sub"""
    n = secs(d); t = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    for i, (mult, amp) in enumerate([(1, 1.0), (1.5, 0.35), (2, 0.4), (2.38, 0.18), (3, 0.12), (0.5, 0.6)]):
        f = root * mult * (1 + 0.0035 * slow_lfo(n, 0.1, seed + i))
        ph = 2 * np.pi * np.cumsum(f) / SR
        x += amp * (np.sin(ph) + 0.15 * np.sin(2 * ph + 0.3))
    air = bp(noise(d, seed + 9), 200, 900) * 0.08 * (0.6 + 0.4 * slow_lfo(n, 0.2, seed + 3))
    x = x * (0.75 + 0.25 * slow_lfo(n, 0.15, seed + 5)) + air
    return stereo(lp(x, 900 if dark else 2000), 0.7, seed)


def pad(d, freqs=(87.31, 103.83, 130.81, 155.56), seed=5):
    """dunkle Fläche (f-Moll mit kleiner None in der Höhe) – sehr leise unter der Stimme"""
    n = secs(d); t = np.arange(n) / SR; x = np.zeros(n, np.float32)
    for i, f0 in enumerate(freqs):
        for det in (-0.004, 0.0, 0.0045):
            f = f0 * (1 + det) * (1 + 0.002 * slow_lfo(n, 0.2, seed + i))
            ph = 2 * np.pi * np.cumsum(f) / SR
            saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
            x += saw * 0.2
    x = lp(x, 700, 2)
    return reverb(x, 3.0, 0.5, seed=seed)


def heartbeat(bpm=62, d=3.0, seed=6):
    n = secs(d); x = np.zeros(n, np.float32); per = 60 / bpm
    for k in range(int(d / per) + 1):
        for off, a in ((0, 1.0), (0.22, 0.7)):
            s = secs(k * per + off)
            if s >= n: continue
            ln = min(secs(0.25), n - s); tt = np.arange(ln) / SR
            x[s:s + ln] += a * np.sin(2 * np.pi * (55 - 20 * tt) * tt) * np.exp(-tt * 22)
    return stereo(x)


# ------------------------------------------------------------ Geräusche
def knock(seed=0, heavy=1.0, room=0.35):
    """ein Klopfen an einer Holztür: Körper-Resonanz + Anschlag"""
    r = np.random.default_rng(seed)
    d = 0.45; n = secs(d); t = np.arange(n) / SR
    body = np.zeros(n)
    for f, a, dec in ((95, 1.0, 26), (180, 0.7, 34), (310, 0.45, 45), (520, 0.25, 60), (800, 0.15, 80)):
        f *= r.uniform(0.96, 1.04); body += a * np.sin(2 * np.pi * f * t) * np.exp(-t * dec)
    click = hp(noise(d, int(r.integers(1e6))), 1500) * np.exp(-t * 300) * 0.6
    x = (body * heavy + click).astype(np.float32)
    x = norm(x, 0.9)
    return reverb(x, 0.9, room, seed=seed + 11, damp=3000)


def footstep(kind='wood', seed=0):
    r = np.random.default_rng(seed); d = 0.22; n = secs(d); t = np.arange(n) / SR
    if kind == 'wood':
        x = (np.sin(2 * np.pi * r.uniform(120, 160) * t) * np.exp(-t * 40) + lp(noise(d, seed), 2500) * np.exp(-t * 60) * 0.5)
    else:  # Kies/Gras
        x = bp(noise(d, seed), 800, 6000) * (np.exp(-t * 25) * (0.5 + 0.5 * (r.random(n) > 0.6)))
    return stereo(x.astype(np.float32))


def page_turn(seed=0, d=0.7):
    n = secs(d); t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    x = bp(noise(d, seed), 1500, 9000) * env * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t) ** 2)
    x += hp(noise(d, seed + 1), 3000) * np.exp(-np.abs(t - d * 0.8) * 60) * 0.8
    return stereo(x.astype(np.float32), 0.3)


def boat_engine(d, seed=7):
    n = secs(d); t = np.arange(n) / SR
    rate = 7.5 * (1 + 0.02 * slow_lfo(n, 0.5, seed))
    ph = 2 * np.pi * np.cumsum(rate) / SR
    puls = (0.5 + 0.5 * np.sin(ph)) ** 6
    x = lp(noise(d, seed), 300) * puls * 3 + np.sin(2 * np.pi * 52 * t) * puls * 0.6
    return stereo(lp(x, 500).astype(np.float32), 0.4)


def radio_static(d, seed=8, tune=1.0):
    n = secs(d); t = np.arange(n) / SR
    x = hp(noise(d, seed), 400) * 0.5 + bp(noise(d, seed + 1), 1800, 3500) * 0.6
    crackle = (np.random.default_rng(seed).random(n) > 0.9993).astype(np.float32)
    crackle = signal.lfilter([1], [1, -0.97], crackle) * 2.5
    # Sendersuche: wandernder Pfeifton
    f = 1200 + 600 * slow_lfo(n, 0.8, seed)
    whine = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.08 * tune * (0.5 + 0.5 * slow_lfo(n, 1.5, seed + 2))
    am = 0.7 + 0.3 * slow_lfo(n, 6, seed + 3)
    x = (x * am + crackle + whine).astype(np.float32)
    return stereo(bp(x, 300, 5000), 0.2)


def lamp_flicker(d, seed=9):
    """elektrisches Brummen + Knistern, wenn das Licht stirbt"""
    n = secs(d); t = np.arange(n) / SR
    hum = (np.sin(2 * np.pi * 100 * t) + 0.5 * np.sin(2 * np.pi * 200 * t) + 0.3 * np.sign(np.sin(2 * np.pi * 50 * t))) * 0.3
    gate = (np.sin(2 * np.pi * 9 * t + 5 * np.sin(2 * np.pi * 1.3 * t)) > 0.1).astype(np.float32)
    crack = hp(noise(d, seed), 2000) * (np.random.default_rng(seed).random(n) > 0.995) * 3
    x = hum * gate + crack
    return stereo(x.astype(np.float32))


def power_down(d=1.4):
    n = secs(d); t = np.arange(n) / SR
    f = 220 * np.exp(-t * 2.2) + 30
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2)
    x += np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR) * 0.3 * np.exp(-t * 2)
    return stereo(lp(x, 1500).astype(np.float32))


def sub_hit(d=2.5, f0=55):
    n = secs(d); t = np.arange(n) / SR
    f = f0 + 60 * np.exp(-t * 12)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    x += lp(noise(d, 99), 200) * np.exp(-t * 8) * 0.5
    return stereo(x.astype(np.float32))


def sting(d=2.6, seed=10):
    """Schreck-Sound: dissonantes Cluster (Streicher-artig) + Sub-Boom + Rauschstoß"""
    n = secs(d); t = np.arange(n) / SR
    x = np.zeros(n)
    for i, f0 in enumerate([311.1, 329.6, 349.2, 466.2, 493.9, 622.3, 659.3, 698.5, 987.8]):
        for det in (-0.006, 0.006):
            f = f0 * (1 + det) * (1 + 0.004 * np.sin(2 * np.pi * (5 + i * 0.3) * t))
            ph = 2 * np.pi * np.cumsum(f) / SR
            x += (2 * ((ph / (2 * np.pi)) % 1) - 1) * 0.12
    env = np.minimum(1, t / 0.015) * np.exp(-t * 1.3)
    x = hp(lp(x * env, 6000), 150)
    burst = bp(noise(d, seed), 300, 8000) * np.exp(-t * 6) * 1.2
    out = reverb((x + burst).astype(np.float32), 2.5, 0.35, seed=seed)
    return out + sub_hit(d, 40) * 1.4


def whoosh_riser(d=1.2, seed=12):
    n = secs(d); t = np.arange(n) / SR
    env = (t / d) ** 2.5
    x = bp(noise(d, seed), 400, 6000) * env
    return stereo(x.astype(np.float32), 0.8)


def drip(seed=0):
    d = 0.18; n = secs(d); t = np.arange(n) / SR
    f = 900 + 1400 * np.exp(-t * 40)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35)
    return reverb(stereo(x.astype(np.float32)), 0.8, 0.4, seed=seed)


# ------------------------------------------------------------ ab Teil 2
def creak(d=1.2, seed=20, pitch=1.0, rough=1.0):
    """Holzknarren: Reibungs-Impulse mit wandernder Rate durch Resonanzfilter"""
    n = secs(d); t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    rate = (35 + 60 * (0.5 + 0.5 * slow_lfo(n, 2.5, seed))) * pitch
    ph = np.cumsum(rate) / SR
    imp = (np.diff(np.floor(ph), prepend=0) > 0).astype(np.float32) * (0.6 + 0.4 * r.random(n))
    x = np.zeros(n, np.float32)
    for f, q in ((380 * pitch, 18), (820 * pitch, 22), (1450 * pitch, 26)):
        w = 2 * np.pi * f / SR; rr = np.exp(-w / (2 * q))
        x += signal.lfilter([1 - rr], [1, -2 * rr * np.cos(w), rr * rr], imp).astype(np.float32)
    x += bp(noise(d, seed), 300, 2500) * 0.05 * rough
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6
    return reverb(stereo((x * env).astype(np.float32)), 0.9, 0.3, seed=seed)


def latch(seed=30):
    d = 0.12; n = secs(d); t = np.arange(n) / SR
    x = hp(noise(d, seed), 1200) * np.exp(-t * 90) + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 60) * 0.4
    return stereo(x.astype(np.float32))


def fabric(d=1.0, seed=31):
    n = secs(d); t = np.arange(n) / SR
    x = bp(noise(d, seed), 600, 5000) * (0.4 + 0.6 * np.abs(slow_lfo(n, 8, seed))) * np.sin(np.pi * np.clip(t / d, 0, 1))
    return stereo(x.astype(np.float32), 0.4)


def reverse_whoosh(d=0.8, seed=32):
    x = whoosh_riser(d, seed)
    return x


# ------------------------------------------------------------ ab Teil 3
def radio_voice(x, drive=2.5, seed=40, dropouts=True):
    """Seefunk-Klang: Bandpass 350–2800 Hz, leichte Verzerrung, Aussetzer"""
    y = bp(x, 350, 2800, 3)
    y = np.tanh(y * drive) / np.tanh(drive)
    if dropouts:
        n = len(y); m = 0.75 + 0.25 * np.clip(slow_lfo(n, 5, seed) * 2, -1, 1)
        y = y * m
    return y.astype(np.float32)


def squelch(d=0.35, seed=41):
    n = secs(d); t = np.arange(n) / SR
    x = hp(noise(d, seed), 800) * np.exp(-t * 9) * 0.8
    return stereo(bp(x, 500, 5000).astype(np.float32))


def bubbles(d=3.0, seed=42):
    n = secs(d); t = np.arange(n) / SR; x = np.zeros(n, np.float32); r = np.random.default_rng(seed)
    for _ in range(int(d * 14)):
        s = int(r.random() * (n - secs(0.1))); ln = secs(r.uniform(0.03, 0.09)); tt = np.arange(ln) / SR
        f = r.uniform(250, 900) * (1 + tt * 12)
        x[s:s + ln] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 40) * r.uniform(0.2, 1)
    x += lp(noise(d, seed + 1), 300) * 0.6
    return stereo(lp(x, 2000).astype(np.float32), 0.5)


def glass_hit(seed=43):
    d = 1.2; n = secs(d); t = np.arange(n) / SR
    x = np.zeros(n)
    for f, a, dec in ((140, 1.0, 14), (720, 0.35, 20), (1830, 0.2, 9), (3100, 0.12, 12)):
        x += a * np.sin(2 * np.pi * f * t) * np.exp(-t * dec)
    x += hp(noise(d, seed), 2000) * np.exp(-t * 60) * 0.5
    return reverb(stereo(x.astype(np.float32)), 1.0, 0.3, seed=seed)
