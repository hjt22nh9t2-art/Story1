"""
BOXCLUB Audio-Mischer – erzeugt die komplette Tonspur einer Folge und einen Messbericht.

  python3 scripts/mix.py data/renders/ep-003-timeline.json data/renders/ep-003-master.wav

Regeln (siehe PRODUCTION_STANDARDS.md):
  * Sprache hat Vorrang: jede Zeile auf gleiche Lautheit (aktiver RMS -18 dBFS), Spitzen per
    Begrenzer auf -3.5 dBFS – damit liegen Sprachspitzen im Bereich -6 … -3 dBFS.
  * Musik: Grundpegel ~-27 dBFS RMS, unter Sprache automatisch um 10 dB abgesenkt (Ducking).
  * Geräusche: feste Zielspitzen je Effekt; fallen sie in Sprache, nochmals -6 dB.
  * Atmosphäre: dezentes Hallenrauschen (-42 dBFS RMS) in Halle/Ring/Umkleide.
  * Master: True-Peak-Begrenzer (4x Überabtastung) auf -1.5 dBFS.
"""
import json, subprocess, sys
import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
db = lambda v: 20 * np.log10(max(float(v), 1e-9))
g_of = lambda d: 10 ** (d / 20)

# Zielspitzen der Geräusche (dBFS) – bewusst deutlich unter der Sprache
SFX_PEAK = {
    'glocke': -15, 'schlag': -14, 'sandsack': -13, 'tuer': -16, 'kasse': -17, 'muenzen': -19,
    'whoosh': -27, 'publikum': -21, 'pfiff': -19, 'telefon': -17, 'kratzer': -18,
    'trommelwirbel': -18, 'stempel': -15, 'krach': -9, 'quietschen': -18,
}
SPEECH_RMS = -18.0
SPEECH_CEIL = -3.5
MUSIC_RMS = -27.0
MUSIC_DUCK = -10.0
ATMO_RMS = -42.0
MASTER_CEIL = -1.5


def load(path, stereo=True):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2' if stereo else '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    return x.reshape(-1, 2) if stereo else x


def active_rms(x):
    m = x if x.ndim == 1 else x.mean(axis=1)
    fr = int(0.03 * SR)
    n = len(m) // fr
    if n == 0: return 1e-9
    r = np.sqrt((m[: n * fr].reshape(n, fr) ** 2).mean(axis=1))
    act = r[r > g_of(-45)]
    return float(np.sqrt((act ** 2).mean())) if len(act) else 1e-9


def true_peak_env(x):
    """Spitzenwert je Sample inkl. Zwischenwerten (4x Überabtastung des Signals)."""
    chans = x.T if x.ndim == 2 else x[None]
    env = np.zeros(chans.shape[1], np.float32)
    for c in chans:
        up = np.abs(signal.resample_poly(c, 4, 1))[: 4 * len(c)]
        up = np.pad(up, (0, 4 * len(c) - len(up)))
        env = np.maximum(env, np.maximum(np.abs(c), up.reshape(-1, 4).max(axis=1)))
    return env


def limiter(x, ceil_db, look=0.005, release=0.08):
    """Lookahead-Begrenzer: Absenkung beginnt `look` vor der Spitze, hält `release` nach."""
    raw = np.minimum(1.0, g_of(ceil_db) / np.maximum(true_peak_env(x), 1e-9))
    L, R = max(1, int(look * SR)), max(1, int(release * SR))
    g = minimum_filter1d(raw, size=2 * L + 1)
    g = minimum_filter1d(g, size=R, origin=-(R // 2))  # Haltezeit nach der Spitze
    g = uniform_filter1d(g, size=L)                      # weicher Übergang
    g = np.minimum(g, minimum_filter1d(raw, size=2 * L + 1))
    return x * (g[:, None] if x.ndim == 2 else g), g


def fade(x, ms=6):
    n = min(len(x) // 2, int(ms / 1000 * SR))
    if n > 0:
        r = np.linspace(0, 1, n)[:, None] if x.ndim == 2 else np.linspace(0, 1, n)
        x[:n] *= r; x[-n:] *= r[::-1]
    return x


def envelope(intervals, N, attack=0.08, release=0.35):
    m = np.zeros(N, np.float32)
    for a, b in intervals:
        m[max(0, int(a * SR)):min(N, int(b * SR))] = 1
    # schneller Anstieg, langsamer Abfall
    up = uniform_filter1d(m, size=max(1, int(attack * SR)), origin=0)
    dn = uniform_filter1d(m, size=max(1, int(release * SR)), origin=-int(release * SR) // 2 + 1)
    return np.clip(np.maximum(up, dn), 0, 1)


def place(dst, src, t, gain=1.0):
    s = int(round(t * SR))
    if s >= len(dst): return
    e = min(len(dst), s + len(src))
    dst[s:e] += src[: e - s] * gain


def atmo(N, seed=3):
    rng = np.random.default_rng(seed)
    n = rng.standard_normal((N, 2)).astype(np.float32)
    n = signal.lfilter(*signal.butter(2, [120 / (SR / 2), 900 / (SR / 2)], 'band'), n, axis=0)
    # entfernte Sandsack-Schläge und Seilspringen
    t = 0.7
    while t < N / SR - 0.5:
        k = int(t * SR); L = int(0.18 * SR)
        thump = np.sin(2 * np.pi * 70 * np.arange(L) / SR) * np.exp(-np.arange(L) / (0.05 * SR))
        n[k:k + L] += (thump * 0.6)[:, None]
        t += rng.uniform(0.6, 1.6)
    return n


def main(tl_path, out_path):
    tl = json.load(open(tl_path))
    N = int((tl['totalSec'] + 0.3) * SR)
    speech = np.zeros((N, 2), np.float32)
    music = np.zeros((N, 2), np.float32)
    sfx = np.zeros((N, 2), np.float32)
    amb = np.zeros((N, 2), np.float32)
    report = {'lines': [], 'sfx': [], 'notes': []}

    # ---------------- Sprache
    for l in tl['lines']:
        try:
            x = load(l['file'])
        except Exception:
            report['notes'].append(f"Fehlt: {l['file']}"); continue
        rms = active_rms(x)
        x = x * g_of(SPEECH_RMS - db(rms))
        x, _ = limiter(x, SPEECH_CEIL, look=0.003, release=0.05)
        x = fade(x)
        dur = len(x) / SR
        if l['real'] and dur > (l['end'] - l['start']) + 0.15:
            report['notes'].append(f"{l['id']}: Aufnahme ({dur:.2f}s) länger als Zeitfenster ({l['end'] - l['start']:.2f}s) – wird nicht abgeschnitten, kann in Folgezeile laufen")
        place(speech, x, l['start'])
    sp_iv = [(l['start'], l['end']) for l in tl['lines']]
    duck = envelope(sp_iv, N)

    # ---------------- Musik (Blöcke gleicher Stimmung, 0.3 s Überblendung)
    blocks = []
    for s in tl['scenes']:
        if blocks and blocks[-1]['music'] == s['music']: blocks[-1]['end'] = s['end']
        else: blocks.append({'music': s['music'], 'start': s['start'], 'end': s['end']})
    for b in blocks:
        loop = load(f"{tl['musicDir']}/{b['music']}.wav")
        loop = loop * g_of(MUSIC_RMS - db(active_rms(loop)))
        a, e = int(b['start'] * SR), min(N, int((b['end'] + 0.3) * SR))
        L = e - a
        reps = int(np.ceil(L / len(loop))) + 1
        seg = np.tile(loop, (reps, 1))[:L].copy()
        f = int(0.3 * SR)
        if L > 2 * f:
            seg[:f] *= np.linspace(0, 1, f)[:, None]; seg[-f:] *= np.linspace(1, 0, f)[:, None]
        music[a:e] += seg
    end_fade = int(1.2 * SR)
    music[-end_fade:] *= np.linspace(1, 0, end_fade)[:, None]
    music *= (1 - duck * (1 - g_of(MUSIC_DUCK)))[:, None]

    # ---------------- Atmosphäre (nur Halle/Ring/Umkleide)
    base = atmo(N)
    base *= g_of(ATMO_RMS - db(active_rms(base)))
    mask = np.zeros(N, np.float32)
    for s in tl['scenes']:
        if s['location'] in ('halle', 'ring', 'umkleide'):
            mask[int(s['start'] * SR):int(s['end'] * SR)] = 1
    mask = uniform_filter1d(mask, size=int(0.25 * SR))
    amb = base * (mask * (1 - duck * 0.4))[:, None]

    # ---------------- Geräusche
    for ev in tl['events']:
        try:
            x = load(f"{tl['sfxDir']}/{ev['name']}.wav")
        except Exception:
            report['notes'].append(f"SFX fehlt: {ev['name']}"); continue
        target = SFX_PEAK.get(ev['name'], -18)
        over_speech = any(a - 0.1 <= ev['t'] <= b + 0.1 or (ev['t'] <= a <= ev['t'] + len(x) / SR * 0.5) for a, b in sp_iv)
        if over_speech: target -= 6
        x = x * g_of(target - db(np.abs(x).max()))
        place(sfx, fade(x, 3), ev['t'])
        report['sfx'].append({'name': ev['name'], 't': round(ev['t'], 2), 'peak_dbfs': target, 'unter_sprache': over_speech, 'grund': ev['reason']})

    mix = speech + music + amb + sfx
    pre_peak = db(np.abs(mix).max())
    mix, gain = limiter(mix, MASTER_CEIL)
    gr = db(gain.min())

    # ---------------- Bericht
    for l in tl['lines']:
        a, b = int(l['start'] * SR), int(l['end'] * SR)
        s = speech[a:b]; m = music[a:b]; x = sfx[a:b]
        report['lines'].append({
            'id': l['id'], 'sprecher': l['speaker'],
            'sprache_peak_dbfs': round(db(np.abs(s).max()), 1), 'sprache_rms_dbfs': round(db(active_rms(s)), 1),
            'musik_rms_dbfs': round(db(np.sqrt((m ** 2).mean())), 1), 'sfx_peak_dbfs': round(db(np.abs(x).max()), 1) if np.abs(x).max() > 0 else None,
        })
    lp = [r['sprache_peak_dbfs'] for r in report['lines']]
    report['zusammenfassung'] = {
        'sprachspitzen_dbfs': [min(lp), max(lp)],
        'sprach_rms_spanne_db': round(max(r['sprache_rms_dbfs'] for r in report['lines']) - min(r['sprache_rms_dbfs'] for r in report['lines']), 1),
        'musik_unter_sprache_max_dbfs': max(r['musik_rms_dbfs'] for r in report['lines']),
        'abstand_sprache_zu_musik_min_db': round(min(r['sprache_rms_dbfs'] - r['musik_rms_dbfs'] for r in report['lines']), 1),
        'sfx_max_peak_dbfs': max([e['peak_dbfs'] for e in report['sfx']] or [None]),
        'mix_peak_vor_begrenzer_dbfs': round(pre_peak, 1), 'max_begrenzung_db': round(gr, 1),
    }
    # 16 Bit mit TPDF-Dither schreiben
    d = (np.random.default_rng(1).random(mix.shape) - np.random.default_rng(2).random(mix.shape)) / 32768
    pcm = np.clip((mix + d) * 32767, -32768, 32767).astype('<i2')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', out_path], input=pcm.tobytes(), check=True)
    json.dump(report, open(out_path.replace('.wav', '-bericht.json'), 'w'), indent=1, ensure_ascii=False)
    print(json.dumps(report['zusammenfassung'], ensure_ascii=False))
    for n in report['notes']: print('HINWEIS:', n)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
