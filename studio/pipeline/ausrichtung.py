"""Schritt 9a: Untertitel-Wörter (exakt aus dem Drehbuch → keine Rechtschreibfehler) mit den Zeiten der Stimme verbinden.

Quelle der Zeiten: Wortzeiten des TTS-Anbieters bzw. der Transkription. Fehlen sie, werden die Zeiten aus der
Sprechpausen-Analyse der Audiodatei geschätzt (Satzzeichen ↔ Pausen).
"""
import difflib
import re

import numpy as np
from scipy.io import wavfile

from .schema import woerter as split_woerter

ZAHLWORT = {'0': 'null', '1': 'eins', '2': 'zwei', '3': 'drei', '4': 'vier', '5': 'fünf', '6': 'sechs', '7': 'sieben', '8': 'acht', '9': 'neun', '10': 'zehn', '11': 'elf', '12': 'zwölf'}


def norm(w):
    w = w.lower().replace('ß', 'ss')
    w = re.sub(r'[^\wäöü]', '', w)
    return ZAHLWORT.get(w, w)


def skript_woerter(db):
    """Alle gesprochenen Wörter mit Szenenindex und Gelb-Markierung."""
    out = []
    for i, s in enumerate(db['szenen']):
        hi = {norm(h) for h in s.get('hervorheben', [])}
        for w in split_woerter(s['text']):
            out.append({'text': w, 'szene': i, 'hi': norm(w) in hi})
    return out


def ausrichten(skript, quelle):
    """Ordnet jedem Skriptwort Start/Ende aus quelle zu. Gibt (wörter, trefferquote) zurück."""
    a = [norm(w['text']) for w in skript]; b = [norm(w['text']) for w in quelle]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    t = [None] * len(skript)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            q = quelle[blk.b + k]; t[blk.a + k] = (q['s'], q['e'])
    treffer = sum(x is not None for x in t) / max(1, len(t))
    # Lücken: proportional zur Zeichenlänge zwischen den bekannten Nachbarn verteilen
    n = len(t); i = 0
    ende = quelle[-1]['e'] if quelle else 0
    while i < n:
        if t[i] is not None: i += 1; continue
        j = i
        while j < n and t[j] is None: j += 1
        a0 = t[i - 1][1] if i > 0 else (quelle[0]['s'] if quelle else 0)
        b0 = t[j][0] if j < n else ende
        L = [len(skript[k]['text']) + 1 for k in range(i, j)]; tot = sum(L); acc = a0
        for k, l in zip(range(i, j), L):
            d = (b0 - a0) * l / tot; t[k] = (acc, acc + d * 0.92); acc += d
        i = j
    res = []
    for w, (s, e) in zip(skript, t):
        res.append({**w, 's': round(float(s), 3), 'e': round(float(max(e, s + 0.06)), 3)})
    for k in range(1, len(res)):  # monoton
        if res[k]['s'] < res[k - 1]['s']: res[k]['s'] = res[k - 1]['s']
        if res[k]['e'] < res[k]['s']: res[k]['e'] = res[k]['s'] + 0.06
    return res, treffer


def schaetzen(skript, wav_pfad):
    """Fallback ohne Wortzeiten: Sprachabschnitte per Energie finden und Wörter nach Silbenlänge verteilen."""
    sr, x = wavfile.read(wav_pfad); x = x.astype(np.float32); x = x if x.ndim == 1 else x.mean(1)
    hop = int(sr * 0.01); fr = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-9) for i in range(0, len(x) - hop, hop)])
    thr = np.percentile(fr, 30) * 1.8
    speech = fr > thr
    # Sprachblöcke (Pausen < 0.18 s überbrücken)
    blocks, s = [], None
    for i, v in enumerate(speech):
        if v and s is None: s = i
        if not v and s is not None:
            k = i
            while k < len(speech) and not speech[k] and k - i < 18: k += 1
            if k < len(speech) and speech[k] and k - i < 18: continue
            blocks.append((s * 0.01, i * 0.01)); s = None
    if s is not None: blocks.append((s * 0.01, len(speech) * 0.01))
    tot = sum(b - a for a, b in blocks); L = [max(1, len(re.findall(r'[aeiouäöüy]+', w['text'].lower()))) for w in skript]; Ls = sum(L)
    res, acc, bi, pos = [], 0.0, 0, blocks[0][0] if blocks else 0
    for w, l in zip(skript, L):
        d = tot * l / Ls; rest = d; st = None
        while rest > 1e-6 and bi < len(blocks):
            a, b = blocks[bi]; pos = max(pos, a)
            if st is None: st = pos
            take = min(rest, b - pos); pos += take; rest -= take
            if pos >= b - 1e-6: bi += 1
        res.append({**w, 's': round(st or pos, 3), 'e': round(pos, 3)})
    return res, 0.0
