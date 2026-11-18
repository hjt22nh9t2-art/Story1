"""Schritte 4–6: Drehbuch + Wortzeiten → plan.json (Szenen mit Zeiten, Einstellungen/Schnitte, Untertitel, Einblendungen).

Die Bildlänge folgt immer der Sprecherlänge: Szene i beginnt kurz vor ihrem ersten gesprochenen Wort.
"""
import json
import math

from . import config

VARIANZ = ['halbtotale', 'nah', 'totale', 'gesicht', 'frosch', 'orbit', 'seitlich', 'vogel']
YAWS = [0.35, -0.5, 0.15, -0.3, 0.6, -0.15]


class ZuKurz(Exception):
    def __init__(self, dauer):
        self.dauer = dauer; self.fehlend = config.MIN_DAUER - dauer
        super().__init__(f'Gesprochene Länge ergibt nur {dauer:.1f} s Video (< {config.MIN_DAUER:.0f} s)')


def stimm_timeline(db, woerter):
    """Pausen nach Szenen (pause_danach) einfügen. Liefert Schnittliste für den Ton und verschobene Wortzeiten."""
    gaps = []  # (take_zeit, pause)
    for i, s in enumerate(db['szenen'][:-1]):
        p = float(s.get('pause_danach') or 0)
        if p <= 0: continue
        last = [w for w in woerter if w['szene'] == i]; nxt = [w for w in woerter if w['szene'] == i + 1]
        if not last or not nxt: continue
        cut = (last[-1]['e'] + nxt[0]['s']) / 2
        gaps.append((round(cut, 3), round(min(p, 1.5), 3)))
    off = config.VORLAUF  # der Take beginnt nach VORLAUF Sekunden Stille

    def shift(t):
        return t + off + sum(p for c, p in gaps if c <= t)
    out = [{**w, 's': round(shift(w['s']), 3), 'e': round(shift(w['e']), 3)} for w in woerter]
    return out, {'offset': off, 'gaps': gaps}


def _shot_typen(s, d, figs_bewegt):
    kam = [k if isinstance(k, dict) else {'kamera': k} for k in (s.get('kamera') or [])]
    if not kam:
        if s.get('teil') == 'hook': kam = [{'kamera': 'zoom_schock'}]
        elif figs_bewegt: kam = [{'kamera': 'vorlauf'}, {'kamera': 'verfolgung'}]
        elif not s.get('figuren'): kam = [{'kamera': 'totale'}]
        else: kam = [{'kamera': 'halbtotale'}, {'kamera': 'nah'}]
    n = max(len(kam), math.ceil(d / 3.8))
    i = 0
    while len(kam) < n:
        prev = kam[-1]['kamera']; c = VARIANZ[(i + len(kam)) % len(VARIANZ)]
        if c == prev or (not s.get('figuren') and c in ('gesicht', 'nah', 'frosch')): i += 1; continue
        kam.append({'kamera': c}); i += 1
    return kam


def plan_bauen(db, woerter, schnitt, voice_dauer):
    szenen_w = {}
    for w in woerter: szenen_w.setdefault(w['szene'], []).append(w)
    letzte_e = woerter[-1]['e']
    dauer = round(letzte_e + config.OUTRO_DAUER, 2)
    if dauer < config.MIN_DAUER:
        raise ZuKurz(dauer)
    starts = []
    for i in range(len(db['szenen'])):
        ws = szenen_w.get(i)
        starts.append(0.0 if i == 0 else (ws[0]['s'] - 0.12 if ws else None))
    for i in range(len(starts)):  # Szenen ohne Wörter: zwischen Nachbarn
        if starts[i] is None: starts[i] = starts[i - 1] + 1.0
    szenen = []; yaw_i = 0
    for i, s in enumerate(db['szenen']):
        a = round(starts[i], 3); b = round(starts[i + 1] if i + 1 < len(starts) else dauer, 3); d = b - a
        bewegt = any(f.get('nach') for f in s.get('figuren', []))
        typen = _shot_typen(s, d, bewegt)
        # Schnittpunkte möglichst auf Wortanfänge legen
        ws = szenen_w.get(i, []); cuts = [a]
        for k in range(1, len(typen)):
            ideal = a + d * k / len(typen)
            cand = [w['s'] - 0.05 for w in ws if a + 0.9 < w['s'] - 0.05 < b - 0.9]
            c = min(cand, key=lambda x: abs(x - ideal)) if cand else ideal
            if c - cuts[-1] < 0.9: c = cuts[-1] + max(0.9, d / len(typen))
            if c < b - 0.6: cuts.append(round(c, 3))
        cuts.append(b)
        shots = []
        for k in range(len(cuts) - 1):
            t = dict(typen[min(k, len(typen) - 1)])
            if 'yaw' not in t: t['yaw'] = YAWS[yaw_i % len(YAWS)]; yaw_i += 1
            shots.append({**t, 'a': cuts[k], 'b': cuts[k + 1]})
        sc = {k: v for k, v in s.items() if k not in ('text', 'kamera', 'hervorheben', 'geraeusche', 'pause_danach')}
        sc.update({'a': a, 'b': b, 'shots': shots})
        if s.get('einblendung'):
            e = dict(s['einblendung']); e['a'] = round(a + 0.15, 3); e['b'] = round(min(b - 0.05, a + 3.4), 3); sc['einblendung'] = e
        szenen.append(sc)
    # Endtafel ab der Outro-Szene
    outro_i = next((i for i, s in enumerate(db['szenen']) if s.get('teil') == 'outro'), len(szenen) - 1)
    cover_i = next((i for i, s in enumerate(db['szenen']) if s.get('teil') == 'wendung'), len(szenen) // 2)
    hook_b = szenen[1]['a'] if len(szenen) > 1 else 3.0
    plan = {
        'fps': config.FPS, 'dauer': dauer, 'titel': db['titel'],
        'headline': {'text': db.get('hook_text') or db['titel'], 'a': 0.0, 'b': round(min(max(hook_b, 2.2), 3.2), 2)},
        'figuren': db['figuren'],
        'woerter': [{'text': w['text'], 's': w['s'], 'e': w['e'], 'hi': w.get('hi', False)} for w in woerter],
        'szenen': szenen,
        'outro': {'start': szenen[outro_i]['a'], 'frage': db['outro_frage'], 'cta': 'Schreib es in die Kommentare 👇'},
        'cover': {'t': round((szenen[cover_i]['a'] + szenen[cover_i]['b']) / 2, 2), 'text': db.get('hook_text') or db['titel']},
        'ton': {'schnitt': schnitt, 'stimme_dauer': voice_dauer},
    }
    return plan


def speichern(plan, ordner):
    (ordner / 'plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding='utf-8')
