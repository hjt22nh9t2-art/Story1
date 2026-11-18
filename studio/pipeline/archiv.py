"""Archiv bereits produzierter Folgen – verhindert, dass Geschichten doppelt verwendet werden."""
import json
from datetime import date

from . import config


def laden():
    if config.ARCHIV.exists():
        return json.loads(config.ARCHIV.read_text(encoding='utf-8'))
    return []


def archiv_liste():
    return '\n'.join(f'- {e["titel"]} ({e.get("thema", "")})' for e in laden())


def eintragen(db, ordner, dauer):
    a = [e for e in laden() if e.get('ordner') != ordner.name]
    a.append({'titel': db['titel'], 'thema': db.get('thema', ''), 'kategorie': db.get('kategorie', ''), 'ordner': ordner.name,
              'datum': date.today().isoformat(), 'dauer': round(dauer, 2)})
    config.ARCHIV.write_text(json.dumps(a, ensure_ascii=False, indent=1), encoding='utf-8')


def schon_produziert(thema):
    t = (thema or '').lower()
    return any(t and (t in e.get('thema', '').lower() or e.get('thema', '').lower() in t) for e in laden())
