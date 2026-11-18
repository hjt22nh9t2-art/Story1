"""Zusätzliche Geräusche + prozedurale Spannungsmusik (keine Fremd-Samples, keine Lizenzkosten).
Baut auf sfx.py auf (aus der Serie übernommen). Alles 48 kHz, float32, stereo (N, 2).
"""
import numpy as np
from scipy import signal

from . import sfx
from .sfx import SR, secs, noise, lp, hp, bp, stereo, reverb, norm, slow_lfo

R = np.random.default_rng


def env_ad(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))


# ------------------------------------------------------------------ Geräusche
def einschlag(seed=1):
    """Kinoreifer Impact: Sub-Drop + Rauschschlag + Hall"""
    d = 2.5; n = secs(d); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-t * 3) + 28) / SR) * np.exp(-t * 1.6)
    burst = lp(noise(d, seed), 1800) * np.exp(-t * 9) * 0.6
    x = norm(sub + burst, 0.9)
    return reverb(x, 2.2, 0.35, seed=seed)


def explosion(seed=21):
    a = einschlag(seed); g = grollen(3.0, seed); n = max(len(a), len(g)); x = np.zeros((n, 2), np.float32)
    x[:len(a)] += a; x[:len(g)] += g * 0.6
    d = 0.4; t = np.arange(secs(d)) / SR; x[:secs(d)] += stereo(lp(noise(d, seed), 3000) * np.exp(-t * 12))
    return norm(x, 0.95)


def braam(seed=2, f0=43.65):
    """tiefer Blechbläser-artiger Akzent (Wendung)"""
    d = 3.5; n = secs(d); t = np.arange(n) / SR; x = np.zeros(n)
    for m, a in ((1, 1), (1.5, 0.5), (2, 0.6), (3, 0.3), (4, 0.15)):
        for det in (-0.006, 0, 0.007):
            ph = 2 * np.pi * np.cumsum(np.full(n, f0 * m * (1 + det))) / SR
            x += a * (2 * ((ph / (2 * np.pi)) % 1) - 1)
    x = lp(x.astype(np.float32), 1200) * env_ad(n, 0.04, 1.4)
    return reverb(norm(np.tanh(x * 1.5), 0.9), 3.0, 0.4, seed=seed)


def whoosh(d=0.6, seed=3):
    n = secs(d); t = np.arange(n) / SR; e = np.sin(np.pi * t / d) ** 2
    f = 400 + 3000 * (t / d)
    x = np.zeros(n, np.float32); nz = noise(d, seed)
    for k in range(6):
        a, b = k * n // 6, (k + 1) * n // 6; fc = f[(a + b) // 2]
        x[a:b] = bp(nz, max(100, fc * 0.6), min(18000, fc * 1.6))[a:b]
    return stereo(x * e, 0.6)


def riser(d=2.0, seed=4):
    n = secs(d); t = np.arange(n) / SR; k = t / d
    nz = hp(noise(d, seed), 600) * k ** 2
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1400 * k ** 2) / SR) * k ** 3 * 0.25
    return stereo(norm(nz + tone, 0.8), 0.5)


def grollen(d=4.0, seed=5):
    n = secs(d); x = lp(noise(d, seed), 120) * (0.6 + 0.4 * slow_lfo(n, 3, seed)) + lp(noise(d, seed + 1), 400) * 0.2
    e = np.minimum(1, np.arange(n) / secs(0.4)) * np.minimum(1, (n - np.arange(n)) / secs(0.8))
    return stereo(norm(x * e, 0.9), 0.7)


def steinschlag(d=2.5, seed=6):
    r = R(seed); n = secs(d); x = np.zeros(n, np.float32)
    for _ in range(int(d * 14)):
        s = int(r.integers(0, n - secs(0.2))); ln = secs(r.uniform(0.04, 0.15)); tt = np.arange(ln) / SR
        x[s:s + ln] += bp(noise(ln / SR, int(r.integers(1e6))), 300, 4000) * np.exp(-tt * r.uniform(30, 70)) * r.uniform(0.3, 1)
    return reverb(norm(x, 0.8), 1.4, 0.3, seed=seed)


def wasser(d=4.0, seed=7):
    """rauschende, strömende Wasser-/Schlammmassen"""
    n = secs(d); nz = noise(d, seed)
    x = lp(nz, 900) * 0.8 + bp(noise(d, seed + 1), 1500, 5000) * 0.25 * (0.5 + 0.5 * slow_lfo(n, 6, seed))
    gl = np.zeros(n, np.float32); r = R(seed)
    for _ in range(int(d * 25)):  # Gluckern
        s = int(r.integers(0, n - secs(0.05))); ln = secs(0.04); tt = np.arange(ln) / SR
        gl[s:s + ln] += np.sin(2 * np.pi * r.uniform(300, 900) * tt * (1 + tt * 20)) * np.exp(-tt * 60) * 0.2
    e = np.minimum(1, np.arange(n) / secs(0.5))
    return stereo(norm((x + gl) * e, 0.9), 0.8)


def alarm(d=3.0):
    n = secs(d); t = np.arange(n) / SR; f = 700 + 300 * np.sign(np.sin(2 * np.pi * 1.6 * t))
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4
    return reverb(stereo(lp(x.astype(np.float32), 3000)), 1.2, 0.3)


def bohrer(d=4.0, seed=8):
    n = secs(d); t = np.arange(n) / SR
    motor = sum(np.sin(2 * np.pi * f * t + p) * a for f, a, p in ((49, 1, 0), (98, 0.6, 1), (147, 0.4, 2), (196, 0.2, 0.5)))
    grind = bp(noise(d, seed), 800, 3000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * t)))
    return stereo(norm(motor * 0.5 + grind * 0.4, 0.8), 0.4)


def klopfen_stein(seed=9, n_schlaege=3, abstand=0.42):
    d = n_schlaege * abstand + 0.6; x = np.zeros(secs(d), np.float32)
    for k in range(n_schlaege):
        s = secs(k * abstand); ln = secs(0.25); tt = np.arange(ln) / SR
        hit = (np.sin(2 * np.pi * 1900 * tt) * 0.5 + np.sin(2 * np.pi * 3100 * tt) * 0.3) * np.exp(-tt * 45) + hp(noise(0.25, seed + k), 2000) * np.exp(-tt * 120)
        x[s:s + ln] += hit
    return reverb(norm(x, 0.8), 1.6, 0.45, seed=seed, damp=3000)


def metall(seed=10):
    d = 2.0; n = secs(d); t = np.arange(n) / SR; x = np.zeros(n)
    for f, a, dec in ((220, 1, 2), (347, 0.7, 2.6), (531, 0.5, 3.2), (812, 0.3, 4), (1290, 0.2, 6)):
        x += a * np.sin(2 * np.pi * f * t) * np.exp(-t * dec)
    return reverb(norm(x.astype(np.float32) + hp(noise(d, seed), 1500) * np.exp(-t * 80) * 0.5, 0.7), 2.0, 0.4)


def jubel(d=4.0, seed=11):
    """Menschenmenge jubelt (Formant-Rauschen + einzelne Rufe)"""
    n = secs(d); r = R(seed); x = np.zeros(n, np.float32)
    for f1, f2 in ((500, 1500), (700, 1100), (400, 2300), (600, 1800)):
        x += bp(noise(d, int(r.integers(1e6))), f1 * 0.8, f1 * 1.3) * 0.5 + bp(noise(d, int(r.integers(1e6))), f2 * 0.85, f2 * 1.2) * 0.3
    x *= 0.7 + 0.3 * slow_lfo(n, 4, seed)
    for _ in range(14):  # Rufe
        s = int(r.integers(0, n - secs(0.6))); ln = secs(r.uniform(0.25, 0.5)); tt = np.arange(ln) / SR
        f = r.uniform(250, 420) * (1 + 0.3 * np.sin(np.pi * tt / tt[-1]))
        ph = 2 * np.pi * np.cumsum(f) / SR; v = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)) * np.sin(np.pi * tt / tt[-1])
        x[s:s + ln] += bp(v.astype(np.float32), 300, 3000) * 0.25
    e = np.minimum(1, np.arange(n) / secs(0.6)) * np.minimum(1, (n - np.arange(n)) / secs(1.0))
    return reverb(stereo(norm(x * e, 0.8), 0.9), 1.8, 0.35)


def donner(seed=12):
    d = 4.0; n = secs(d); t = np.arange(n) / SR
    crack = hp(noise(0.3, seed), 800); x = lp(noise(d, seed + 1), 300) * np.exp(-t * 0.9) * (0.6 + 0.4 * slow_lfo(n, 5, seed))
    x[:len(crack)] += crack * np.exp(-np.arange(len(crack)) / SR * 15) * 0.8
    return stereo(norm(x, 0.9), 0.8)


def feuer(d=4.0, seed=13):
    n = secs(d); r = R(seed); x = lp(noise(d, seed), 500) * 0.4
    for _ in range(int(d * 30)):
        s = int(r.integers(0, n - 200)); x[s:s + 80] += hp(noise(80 / SR, int(r.integers(1e6))), 2000) * r.uniform(0.2, 1)
    return stereo(norm(x, 0.8), 0.6)


def tuer(seed=14):
    return np.concatenate([sfx.creak(1.1, seed, 0.9), sfx.stereo(sfx.latch(seed))[:secs(0.4)]])


def glocke(seed=15):
    d = 4; n = secs(d); t = np.arange(n) / SR; x = np.zeros(n)
    for m, a in ((1, 1), (2.76, 0.5), (5.4, 0.3), (8.9, 0.15)):
        x += a * np.sin(2 * np.pi * 330 * m * t) * np.exp(-t * (0.8 + m * 0.3))
    return reverb(norm(x.astype(np.float32), 0.7), 3, 0.4)


def kamera_klick(seed=16):
    d = 0.25; t = np.arange(secs(d)) / SR
    x = hp(noise(d, seed), 2500) * (np.exp(-t * 200) + 0.6 * np.exp(-np.maximum(0, t - 0.09) * 250) * (t > 0.09))
    return stereo(x.astype(np.float32))


def ticken(d=4.0, bpm=120):
    n = secs(d); x = np.zeros(n, np.float32); per = 60 / bpm
    for k in range(int(d / per)):
        s = secs(k * per); ln = secs(0.03); tt = np.arange(ln) / SR
        x[s:s + ln] += np.sin(2 * np.pi * (3200 if k % 2 else 2600) * tt) * np.exp(-tt * 300)
    return stereo(x)


def tippen(n_zeichen=14, dauer=0.7, seed=17):
    """Schreibmaschinen-Klicks für Datumseinblendungen"""
    x = np.zeros(secs(dauer + 0.2), np.float32); r = R(seed)
    for k in range(n_zeichen):
        s = secs(k * dauer / n_zeichen + r.uniform(0, 0.01)); ln = secs(0.03); tt = np.arange(ln) / SR
        x[s:s + ln] += hp(noise(0.03, int(r.integers(1e6))), 1500) * np.exp(-tt * 250) * r.uniform(0.6, 1)
    return stereo(x)


def funk(d=2.0, seed=18):
    return sfx.radio_static(d, seed)


GERAEUSCH = {
    'einschlag': lambda: einschlag(), 'whoosh': lambda: whoosh(), 'riser': lambda: riser(1.6), 'herzschlag': lambda: sfx.heartbeat(76, 3.5),
    'ticken': lambda: ticken(3.5), 'explosion': lambda: explosion(),
    'grollen': lambda: grollen(4), 'steinschlag': lambda: steinschlag(2.5), 'wasser': lambda: wasser(4), 'alarm': lambda: alarm(3),
    'bohrer': lambda: bohrer(4), 'klopfen': lambda: klopfen_stein(), 'schritte': lambda: _schritte(), 'metall': lambda: metall(),
    'funk': lambda: funk(2), 'jubel': lambda: jubel(4), 'donner': lambda: donner(), 'feuer': lambda: feuer(4), 'schrei_fern': lambda: whoosh(0.9, 31),
    'tuer': lambda: tuer(), 'glocke': lambda: glocke(), 'kamera': lambda: kamera_klick(), 'stille': lambda: np.zeros((secs(0.1), 2), np.float32),
}


def _schritte(n=6, per=0.45, kind='gravel'):
    x = np.zeros((secs(n * per + 0.3), 2), np.float32)
    for k in range(n):
        f = sfx.footstep(kind, 100 + k); s = secs(k * per); x[s:s + len(f)] += f
    return x


# ------------------------------------------------------------------ Atmosphäre je Ort
def atmo(ort, d, wetter='klar', seed=0):
    n = secs(d); x = np.zeros((n, 2), np.float32)
    if ort in ('stollen', 'tunnel', 'hoehle'):
        x += sfx.set_rms(stereo(lp(noise(d, seed), 160), 0.8), -46)              # dumpfes Grummeln
        x += sfx.set_rms(stereo(bp(noise(d, seed + 1), 60, 120), 0.5), -50)
        r = R(seed)
        for _ in range(int(d / 1.7)):                                          # Tropfen
            dr = sfx.drip(int(r.integers(1e5))); s = int(r.integers(0, max(1, n - len(dr)))); x[s:s + len(dr)] += dr * 10 ** (-30 / 20)
        if ort == 'tunnel': x += sfx.set_rms(sfx.bulb_hum(d), -48)
    elif ort in ('halle',):
        x += sfx.set_rms(stereo(lp(noise(d, seed), 300), 0.8), -44) + sfx.set_rms(sfx.bulb_hum(d), -50)
    elif ort == 'raum':
        x += sfx.set_rms(stereo(lp(noise(d, seed), 250), 0.5), -54) + sfx.set_rms(ticken(d, 60), -48)
    elif ort == 'meer':
        x += sfx.set_rms(sfx.waves(d, seed), -36) + sfx.set_rms(sfx.wind(d, seed), -42)
    elif ort in ('schnee', 'wueste'):
        x += sfx.set_rms(sfx.wind(d, seed, 1.5), -36)
    else:  # draußen: werk, strasse, wald
        x += sfx.set_rms(sfx.wind(d, seed), -44)
        if ort == 'werk': x += sfx.set_rms(stereo(lp(noise(d, seed + 3), 90), 0.6), -46)
    if wetter in ('regen', 'sturm'):
        x += sfx.set_rms(stereo(bp(noise(d, seed + 9), 800, 8000), 0.9), -38 if ort not in ('stollen', 'tunnel', 'hoehle', 'raum', 'halle') else -50)
    return x


# ------------------------------------------------------------------ Musik
STIMMUNG_TONART = {  # Grundton (Hz) und Akkord (Halbtöne über Grundton)
    'spannung': (36.71, [0, 3, 7, 10]), 'schock': (34.65, [0, 1, 6, 7]), 'trauer': (38.89, [0, 3, 7, 14]), 'ruhig': (41.2, [0, 7, 12, 15]),
    'hoffnung': (43.65, [0, 4, 7, 11]), 'triumph': (43.65, [0, 4, 7, 12]), 'rueckblick': (36.71, [0, 3, 7, 10]),
}
INTENSITAET = {'hook': 0.9, 'einleitung': 0.45, 'spannung': 0.7, 'wendung': 1.0, 'aufloesung': 0.6, 'outro': 0.5}


def musik(szenen, dauer, seed=7, bpm=84):
    """Spannungsmusik nach Szenen: Drone + Pad (Akkord je Stimmung) + Puls (Intensität je Erzählteil) + Ticken + Klavier-Motiv.
    szenen: [(a, b, teil, stimmung)]"""
    n = secs(dauer); out = np.zeros((n, 2), np.float32); t = np.arange(n) / SR
    # Intensitätskurve (geglättet) + Stimmungs-Gewichte
    inten = np.zeros(n, np.float32)
    for a, b, teil, st in szenen:
        inten[secs(a):secs(b)] = INTENSITAET.get(teil, 0.6) * (1.15 if st == 'schock' else 1.0)
    # innerhalb von Spannungsteilen langsam ansteigen
    k = secs(1.2); inten = np.convolve(inten, np.ones(k) / k, 'same').astype(np.float32)
    # Drone (durchgehend, Grundton der Hauptstimmung)
    root0 = STIMMUNG_TONART.get(szenen[0][3], STIMMUNG_TONART['spannung'])[0]
    out += sfx.set_rms(sfx.drone(dauer, root=root0, seed=seed), -30) * (0.6 + 0.5 * inten[:, None])
    # Pad je Szene mit Überblendung
    for a, b, teil, st in szenen:
        root, ch = STIMMUNG_TONART.get(st, STIMMUNG_TONART['spannung'])
        d = b - a + 1.2; p = sfx.pad(d, freqs=tuple(root * 2 * 2 ** (c / 12) for c in ch), seed=seed + int(a))
        p = sfx.set_rms(p, -33); m = len(p); e = np.minimum(1, np.arange(m) / secs(0.6)) * np.minimum(1, (m - np.arange(m)) / secs(0.6))
        s = secs(max(0, a - 0.3)); e2 = min(n, s + m); out[s:e2] += (p * e[:, None])[: e2 - s]
    # Puls (Achtel, tiefer Synth) – Lautstärke folgt der Intensität
    per = 60 / bpm / 2; pulse = np.zeros(n, np.float32); ln = secs(per * 0.9); tt = np.arange(ln) / SR
    for k2 in range(int(dauer / per)):
        s = secs(k2 * per); f = root0 * 2 * (1.5 if k2 % 8 in (6, 7) else 1)
        note = (np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sin(2 * np.pi * f * 2 * tt) * 0.3) * np.exp(-tt * 9)
        e = min(n, s + ln); pulse[s:e] += note[: e - s] * (1.0 if k2 % 2 == 0 else 0.6)
    pulse = lp(pulse, 700) * np.clip((inten - 0.5) * 2.2, 0, 1.2)
    out += sfx.set_rms(stereo(pulse, 0.4), -30) * 1.0
    # Ticken (Hi-Hat) nur bei hoher Spannung
    tick = ticken(dauer, bpm * 2)[:n] * np.clip((inten - 0.75) * 3, 0, 1)[:, None]
    out += sfx.set_rms(tick, -44) if np.any(tick) else 0
    # Klavier-Motiv bei Trauer/Hoffnung/Triumph
    for a, b, teil, st in szenen:
        if st not in ('trauer', 'hoffnung', 'triumph', 'ruhig'): continue
        root, ch = STIMMUNG_TONART[st]; notes = [ch[i % len(ch)] + 12 * (i // len(ch)) for i in (0, 1, 2, 3, 2, 1)]
        for j, nn in enumerate(notes):
            tt0 = a + j * 0.75
            if tt0 > b: break
            f = root * 8 * 2 ** (nn / 12); ln2 = secs(2.0); t2 = np.arange(ln2) / SR
            tone = (np.sin(2 * np.pi * f * t2) + 0.3 * np.sin(4 * np.pi * f * t2) + 0.1 * np.sin(6 * np.pi * f * t2)) * np.exp(-t2 * 2.2) * np.minimum(1, t2 / 0.005)
            s = secs(tt0); e = min(n, s + ln2); out[s:e] += reverb(tone.astype(np.float32), 2.5, 0.45, seed=j)[: e - s] * 0.035
    return out.astype(np.float32)
