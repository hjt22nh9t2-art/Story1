"""Schritt 11: Automatische Qualitätskontrolle vor der Freigabe.

Jede Prüfung liefert (name, ok, detail, zustaendig). „zustaendig“ ist der Produktionsschritt, der bei einem Fehler
erneut ausgeführt wird (drehbuch | stimme | plan | render | ton | export).
"""
import json
import re
import subprocess

from . import config, schema


def ffprobe(p):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels',
                          '-of', 'json', str(p)], capture_output=True, text=True).stdout
    return json.loads(out)


def _filter_log(p, vf=None, af=None, dauer=None):
    cmd = ['ffmpeg', '-hide_banner', '-nostats', '-i', str(p)]
    if vf: cmd += ['-vf', vf, '-an']
    if af: cmd += ['-af', af, '-vn']
    cmd += ['-f', 'null', '-']
    return subprocess.run(cmd, capture_output=True, text=True).stderr


def video_pruefen(mp4, plan):
    E = []
    info = ffprobe(mp4); dauer = float(info['format']['duration'])
    v = next(s for s in info['streams'] if s['codec_type'] == 'video'); a = next((s for s in info['streams'] if s['codec_type'] == 'audio'), None)
    E.append(('Länge ≥ 60 s', dauer >= config.MIN_DAUER, f'{dauer:.2f} s', 'drehbuch'))
    E.append(('Länge passt zum Plan', abs(dauer - plan['dauer']) < 0.15, f'Plan {plan["dauer"]:.2f} s / Datei {dauer:.2f} s', 'render'))
    E.append(('Auflösung 1080×1920', (v['width'], v['height']) == (config.W, config.H), f'{v["width"]}×{v["height"]}', 'render'))
    E.append(('30 fps, H.264', v['codec_name'] == 'h264' and v['r_frame_rate'] in ('30/1',), f'{v["codec_name"]} {v["r_frame_rate"]}', 'export'))
    E.append(('Tonspur AAC stereo 48 kHz', bool(a) and a['codec_name'] == 'aac' and int(a['channels']) == 2 and a['sample_rate'] == '48000', str(a and a['codec_name']), 'export'))
    # Lautheit
    log = _filter_log(mp4, af='ebur128=peak=true')
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', log); TP = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', log)
    I = float(I[-1]) if I else -99; TP = float(TP[-1]) if TP else 0
    E.append(('Lautheit −16…−12 LUFS', -16.5 <= I <= -11.5, f'{I} LUFS', 'ton'))
    E.append(('True Peak ≤ −1 dBTP', TP <= -0.9, f'{TP} dBTP', 'ton'))
    # Schwarzbilder (außer gewollten Blenden) und eingefrorene Bilder
    log = _filter_log(mp4, vf='blackdetect=d=0.6:pix_th=0.06')
    schwarz = [(float(m[0]), float(m[1])) for m in re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', log)]
    E.append(('Keine Schwarzbilder > 0,6 s', not schwarz, ', '.join(f'{a:.1f}–{b:.1f}s' for a, b in schwarz) or 'keine', 'plan'))
    log = _filter_log(mp4, vf='scale=270:480,freezedetect=n=0.0008:d=2.5')
    frz = re.findall(r'freeze_start: ([\d.]+)', log); frz = [float(x) for x in frz if float(x) < plan['outro']['start'] - 0.5]
    E.append(('Keine Standbilder > 2,5 s', not frz, ', '.join(f'{x:.1f}s' for x in frz) or 'keine', 'plan'))
    # Bildqualität: durchschnittliche Helligkeit/Kontrast (zu dunkel = unbrauchbar auf dem Handy)
    log = _filter_log(mp4, vf='scale=108:192,signalstats,metadata=print:key=lavfi.signalstats.YAVG')
    y = [float(x) for x in re.findall(r'YAVG=([\d.]+)', log)]
    yavg = sum(y) / max(1, len(y)); dunkel = sum(1 for x in y if x < 14) / max(1, len(y))
    E.append(('Bild nicht zu dunkel', yavg > 22 and dunkel < 0.15, f'Ø Helligkeit {yavg:.0f}/255, {dunkel * 100:.0f} % sehr dunkle Frames', 'plan'))
    return E, dauer


def plan_pruefen(plan, db, treffer, ton_info, render_fehler=0):
    E = []
    sz = plan['szenen']
    lueckenlos = all(abs(sz[i]['b'] - sz[i + 1]['a']) < 1e-3 for i in range(len(sz) - 1)) and sz[0]['a'] == 0 and abs(sz[-1]['b'] - plan['dauer']) < 1e-3
    E.append(('Alle Szenen vollständig & lückenlos', lueckenlos and len(sz) == len(db['szenen']), f'{len(sz)} Szenen', 'plan'))
    shots = [s for sc in sz for s in sc['shots']]
    lang = [s for s in shots if s['b'] - s['a'] > 6.0]
    E.append(('Perspektivwechsel (keine Einstellung > 6 s)', not lang, f'{len(shots)} Einstellungen, längste {max(s["b"] - s["a"] for s in shots):.1f} s', 'plan'))
    ids = set(db['figuren']); fremd = {f['id'] for sc in sz for f in sc.get('figuren', [])} - ids
    E.append(('Figuren konsistent (nur definierte Figuren)', not fremd, ', '.join(fremd) or 'ok', 'drehbuch'))
    w = plan['woerter']; mono = all(w[i]['s'] <= w[i + 1]['s'] and w[i]['s'] < w[i]['e'] for i in range(len(w) - 1))
    E.append(('Untertitel synchron (Wortzeiten)', mono and treffer >= 0.8, f'{treffer * 100:.0f} % der Wörter direkt aus der Stimme zugeordnet', 'stimme'))
    E.append(('Untertitel enden vor Videoende', w[-1]['e'] < plan['dauer'] - 1.0, f'letztes Wort {w[-1]["e"]:.1f} s', 'plan'))
    E.append(('Stimme klar über der Musik (≥ 12 dB)', ton_info['abstand_db'] >= 12, f'{ton_info["abstand_db"]} dB', 'ton'))
    E.append(('Stimmpegel', -22 <= ton_info['stimme_rms_db'] <= -15, f'{ton_info["stimme_rms_db"]} dBFS', 'ton'))
    teile = {s.get('teil') for s in db['szenen']}
    E.append(('Geschichte vollständig (Hook→Wendung→Auflösung→Outro)', {'hook', 'wendung', 'aufloesung', 'outro'} <= teile, ', '.join(sorted(t for t in teile if t)), 'drehbuch'))
    E.append(('Renderer ohne Fehler', render_fehler == 0, 'ok' if not render_fehler else f'{render_fehler} Fehler', 'render'))
    return E


def rechtschreibung(db):
    """Prüft den Untertiteltext mit einem deutschen Wörterbuch (Warnung, kein harter Fehler – Eigennamen sind oft unbekannt)."""
    try:
        from spellchecker import SpellChecker
    except ImportError:
        return None
    sp = SpellChecker(language='de')
    ws = {re.sub(r'[^\wäöüÄÖÜß-]', '', w) for s in db['szenen'] for w in schema.woerter(s['text'])}
    ws = {w for w in ws if w and not w.isdigit()}
    unbekannt = sorted(w for w in sp.unknown([w.lower() for w in ws]))
    return unbekannt


def bericht(eintraege):
    zeilen = []
    for name, ok, detail, _ in eintraege:
        zeilen.append(f'{"✅" if ok else "❌"} {name}: {detail}')
    return '\n'.join(zeilen)
