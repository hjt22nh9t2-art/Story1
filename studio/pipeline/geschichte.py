"""Schritte 1–4: Thema wählen, recherchieren, Drehbuch schreiben, prüfen (inkl. Faktencheck-Kritik)."""
import json

from . import config, llm, schema
from .archiv import archiv_liste

P = lambda n: (config.PROMPTS / n).read_text(encoding='utf-8')


def thema_waehlen(vorgabe=None):
    v = (f'VORGABE DES KANALBETREIBERS (verbindlich als Grundlage verwenden): {vorgabe}' if vorgabe
         else 'Keine Vorgabe – wähle selbst das stärkste Thema.')
    prompt = P('themenwahl.md').replace('{VORGABE}', v).replace('{ARCHIV}', archiv_liste() or '– noch keine –').replace('{ORTE}', ', '.join(schema.ORTE))
    return llm.fragen_json(P('system.md'), prompt, recherche=True, effort='medium')


def recherchieren(thema):
    prompt = P('recherche.md').replace('{THEMA}', json.dumps(thema, ensure_ascii=False))
    return llm.fragen_json(P('system.md'), prompt, recherche=True, effort='high')


def drehbuch_schreiben(recherche, feedback=None, alt=None):
    prompt = (P('drehbuch.md').replace('{RECHERCHE}', json.dumps(recherche, ensure_ascii=False, indent=1))
              .replace('{BAUKASTEN}', schema.baukasten_text())
              .replace('{MIN_W}', str(schema.ZIEL_WOERTER[0])).replace('{MAX_W}', str(schema.ZIEL_WOERTER[1])))
    if feedback:
        prompt += ('\n\nDEIN LETZTER ENTWURF:\n```json\n' + json.dumps(alt, ensure_ascii=False) + '\n```\n'
                   'DIESE PROBLEME MÜSSEN BEHOBEN WERDEN:\n- ' + '\n- '.join(feedback) + '\nGib das vollständige, korrigierte Drehbuch zurück.')
    return llm.fragen_json(P('system.md'), prompt, effort='high', max_tokens=64000)


def kritik(db, recherche):
    prompt = (P('kritik.md').replace('{DREHBUCH}', json.dumps(db, ensure_ascii=False))
              .replace('{RECHERCHE}', json.dumps(recherche, ensure_ascii=False))
              .replace('{MIN_W}', str(schema.ZIEL_WOERTER[0])).replace('{MAX_W}', str(schema.ZIEL_WOERTER[1])))
    return llm.fragen_json(P('system.md'), prompt, recherche=True, effort='high', max_tokens=64000)


def drehbuch_mit_pruefung(recherche, runden=4, log=print):
    db, feedback = None, None
    for r in range(runden):
        db = drehbuch_schreiben(recherche, feedback, db)
        F, W = schema.pruefen(db)
        for w in W: log('  Hinweis:', w)
        if F:
            log(f'  Drehbuch Runde {r + 1}: {len(F)} Fehler → Überarbeitung'); [log('   -', f) for f in F]
            feedback = F; continue
        k = kritik(db, recherche)
        if k.get('ok') or not k.get('fehler'):
            log('  Faktencheck/Lektorat: ok'); return db
        log(f'  Faktencheck/Lektorat: {len(k["fehler"])} Probleme'); [log('   -', f) for f in k['fehler']]
        if k.get('drehbuch') and k['drehbuch'].get('szenen'):
            db = k['drehbuch']; F2, _ = schema.pruefen(db)
            if not F2:
                return db
        feedback = k['fehler']
    raise RuntimeError('Drehbuch erfüllt nach mehreren Runden die Anforderungen nicht – bitte manuell prüfen (drehbuch.json)')


def drehbuch_erweitern(db, recherche, fehlende_sekunden, log=print):
    """Wird aufgerufen, wenn die gesprochene Länge unter 60 s liegt: Geschichte mit NEUEN belegten Details erweitern."""
    zusatz = max(25, int(fehlende_sekunden * 2.6) + 15)
    fb = [f'Die gesprochene Länge ist {fehlende_sekunden:.1f} Sekunden zu kurz (Mindestlänge 60 s ist Pflicht). '
          f'Füge ca. {zusatz} Wörter mit NEUEN, belegten Details aus der Recherche hinzu (neue Szenen im Spannungsteil oder der Auflösung). '
          'Keine Wiederholungen, keine Füllsätze.']
    log('  Drehbuch wird erweitert:', fb[0])
    return drehbuch_mit_pruefung_von(db, recherche, fb, log)


def drehbuch_mit_pruefung_von(db, recherche, feedback, log=print):
    for r in range(3):
        db = drehbuch_schreiben(recherche, feedback, db)
        F, _ = schema.pruefen(db)
        if not F:
            return db
        feedback = F
    raise RuntimeError('Erweiterung des Drehbuchs fehlgeschlagen')
