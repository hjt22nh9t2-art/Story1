"""Schritt 8: Tonmischung – Stimme + Atmosphäre je Ort + Musik (geduckt unter der Stimme) + Geräusche zur Handlung.
Ergebnis: roh/mix.wav (48 kHz stereo) und roh/ton_info.json (Pegel für die Qualitätskontrolle).
"""
import json
import random

import numpy as np
from scipy import signal
from scipy.io import wavfile

from . import config, klang, sfx
from .sfx import SR, secs

MUSIK_ENDUNGEN = ('.wav', '.mp3', '.flac', '.ogg', '.m4a')


def _lade_audio(p):
    import subprocess
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def _eigene_musik(stimmung, dauer, seed):
    """Lizenzfreie Musik aus studio/musik/<stimmung>/ (falls vorhanden) – sonst None."""
    d = config.MUSIK / stimmung
    files = sorted(f for f in d.glob('*') if f.suffix.lower() in MUSIK_ENDUNGEN) if d.exists() else []
    if not files: return None
    x = _lade_audio(random.Random(seed).choice(files)); n = secs(dauer)
    while len(x) < n: x = np.concatenate([x, x])
    x = x[:n]; f = secs(2.0); x[-f:] *= np.linspace(1, 0, f)[:, None]
    return x


def mischen(db, plan, ordner, log=print):
    roh = ordner / 'roh'; D = plan['dauer']; N = secs(D)
    mix = np.zeros((N, 2), np.float32)

    def put(x, t, db_gain=0.0, buf=mix):
        x = sfx.stereo(x) if x.ndim == 1 else x
        s = secs(max(0, t)); e = min(N, s + len(x))
        if e > s: buf[s:e] += x[: e - s] * 10 ** (db_gain / 20)

    # ---------------- Stimme
    sr0, v = wavfile.read(roh / 'stimme_take.wav'); v = v.astype(np.float32) / (32768.0 if v.dtype == np.int16 else 1.0)
    if v.ndim == 2: v = v.mean(1)
    if sr0 != SR: v = signal.resample_poly(v, SR, sr0).astype(np.float32)
    v = sfx.hp(v, 75)
    sch = plan['ton']['schnitt']; pts = [0.0] + [c for c, g in sch['gaps']] + [len(v) / SR]
    voice = np.zeros(N, np.float32); shift = sch['offset']
    for i in range(len(pts) - 1):
        seg = v[secs(pts[i]):secs(pts[i + 1])].copy(); f = secs(0.008)
        if len(seg) > 2 * f: seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
        s = secs(pts[i] + shift); e = min(N, s + len(seg)); voice[s:e] += seg[: e - s]
        if i < len(sch['gaps']): shift += sch['gaps'][i][1]
    envv = np.sqrt(signal.lfilter([0.002], [1, -0.998], voice ** 2)) + 1e-5          # sanfte Kompression
    voice *= np.clip((envv / 0.08) ** -0.3, 0.5, 2.5)
    aktiv = np.abs(voice) > 0.01
    voice *= 10 ** ((config.STIMME_DB - sfx.rms_db(voice[aktiv])) / 20)
    voice_st = sfx.reverb(voice, 0.5, 0.06, seed=3, damp=6000)
    # Hüllkurve „Stimme spricht“ für das Ducking der Musik
    sp = np.convolve(aktiv.astype(np.float32), np.ones(secs(0.25)) / secs(0.25), 'same')
    duck = 1 - 0.45 * np.clip(sp * 3, 0, 1)

    # ---------------- Atmosphäre je Szene (überblendet)
    for i, sc in enumerate(plan['szenen']):
        d = sc['b'] - sc['a'] + 0.6; a = klang.atmo(sc['ort'], d, sc.get('wetter', 'klar'), seed=i)
        m = len(a); e = np.minimum(1, np.arange(m) / secs(0.3)) * np.minimum(1, (m - np.arange(m)) / secs(0.3))
        put(a * e[:, None], sc['a'] - 0.3, 0)

    # ---------------- Musik
    teile = [(sc['a'], sc['b'], db['szenen'][i].get('teil', 'spannung'), sc.get('stimmung', 'spannung')) for i, sc in enumerate(plan['szenen'])]
    haupt = max(set(t[3] for t in teile), key=lambda st: sum(b - a for a, b, _, s in teile if s == st))
    mus = _eigene_musik(haupt, D, seed=len(db['titel']))
    quelle = 'eigene Datei' if mus is not None else 'prozedural'
    if mus is None: mus = klang.musik(teile, D, seed=len(db['titel']))
    mus = sfx.set_rms(mus, config.STIMME_DB - config.MUSIK_UNTER_STIMME_DB)
    mus *= duck[:, None]
    fo = secs(1.5); mus[-fo:] *= np.linspace(1, 0.3, fo)[:, None]
    mix += mus

    # ---------------- Geräusche zur Handlung
    wend = next((sc for i, sc in enumerate(plan['szenen']) if db['szenen'][i].get('teil') == 'wendung'), None)
    put(klang.einschlag(1), 0.0, -8)                                                   # Hook-Schlag
    if wend:
        put(klang.riser(2.2), wend['a'] - 2.2, -14); put(klang.braam(), wend['a'], -9)
    for i, sc in enumerate(plan['szenen']):
        s0 = db['szenen'][i]; a = sc['a']
        ub = sc.get('uebergang')
        if ub == 'blitz': put(klang.einschlag(10 + i), a, -12)
        if ub == 'zoom': put(klang.whoosh(0.5, i), a - 0.25, -14)
        for sh in sc['shots']:
            if sh['kamera'] == 'zoom_schock': put(klang.whoosh(0.35, 50 + i), sh['a'] - 0.15, -14); put(klang.einschlag(60 + i), sh['a'], -15)
        e = sc.get('einblendung')
        if e:
            if e['art'] in ('datum', 'ort'): put(klang.tippen(len(e['text'])), e['a'], -20)
            if e['art'] == 'zahl': put(klang.einschlag(70 + i), e['a'], -18)
        for ef in sc.get('effekte', []):
            name = ef if isinstance(ef, str) else ef.get('name'); opt = ef if isinstance(ef, dict) else {}
            d = sc['b'] - a
            if name == 'flut': put(klang.wasser(d + 0.5, i), a, -16); put(klang.grollen(d, i), a, -18)
            elif name == 'explosion': put(klang.explosion(i), a + opt.get('zeit', 0.3), -6)
            elif name == 'beben': put(klang.grollen(d, i), a, -12); put(klang.steinschlag(min(d, 3), i), a + 0.3, -16)
            elif name == 'feuer': put(klang.feuer(d, i), a, -20)
            elif name == 'alarm': put(klang.alarm(d), a, -24)
            elif name == 'blitz': put(klang.donner(i), a + 0.2, -12)
            elif name == 'funken': put(klang.feuer(min(d, 2), 40 + i), a, -22)
            elif name == 'stromausfall': put(sfx.power_down(1.2), a + opt.get('ab', 0.4), -16)
            elif name == 'wasserstrahl': put(klang.wasser(d, 80 + i), a, -20)
        for r in sc.get('requisiten', []):
            if r.get('name') == 'bohrgeraet' and r.get('dreh', True) is not False: put(klang.bohrer(sc['b'] - a, i), a, -24)
            if r.get('anim') in ('hochziehen', 'herablassen'): put(klang.metall(i), a + r.get('ab', 0) + 0.2, -24)
        for f in sc.get('figuren', []):
            akt = {f.get('aktion'), f.get('aktion2')}
            if 'klopfen' in akt: put(klang.klopfen_stein(i, 3), a + 0.4, -16); put(klang.klopfen_stein(i + 1, 3), a + 2.2, -18)
            if akt & {'laufen', 'rennen'} and f.get('nach'):
                rn = 'rennen' in akt; put(klang._schritte(int((sc['b'] - a) / (0.3 if rn else 0.48)), 0.3 if rn else 0.48, 'wood' if sc['ort'] in ('raum', 'halle') else 'gravel'), a, -24)
            if 'jubeln' in akt: put(klang.jubel(sc['b'] - a, i), a, -20)
        for g in s0.get('geraeusche', []):
            put(klang.GERAEUSCH[g](), a + 0.05, -16 if g not in ('herzschlag', 'ticken') else -14)
    put(klang.whoosh(0.6, 99), plan['outro']['start'] - 0.3, -16)

    mix += voice_st
    mix = np.tanh(mix * 1.05) / 1.05
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
    wavfile.write(roh / 'mix.wav', SR, (mix * 32767).astype(np.int16))
    unter = sfx.rms_db(mus[aktiv]) if aktiv.any() else -90
    info = {'stimme_rms_db': round(float(sfx.rms_db(voice[aktiv])), 1), 'musik_unter_stimme_db': round(float(unter), 1),
            'abstand_db': round(float(sfx.rms_db(voice[aktiv]) - unter), 1), 'musikquelle': quelle, 'hauptstimmung': haupt}
    (roh / 'ton_info.json').write_text(json.dumps(info, ensure_ascii=False), encoding='utf-8')
    log(f'  Ton: Stimme {info["stimme_rms_db"]} dB, Musik {info["abstand_db"]} dB darunter ({quelle})')
    return info
