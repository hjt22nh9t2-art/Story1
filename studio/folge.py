#!/usr/bin/env python3
"""Story Studio – automatische Produktion animierter Storytelling-Videos (TikTok, 9:16, ≥ 60 s).

  python3 studio/folge.py neu                       „Neue Folge erstellen“ – Thema wird selbst gewählt
  python3 studio/folge.py neu --thema "Apollo 13"   Folge zu einem vorgegebenen Thema
  python3 studio/folge.py weiter <ordner>           unterbrochene Produktion fortsetzen
  python3 studio/folge.py ab <ordner> <stufe>       ab einer Stufe neu produzieren (z. B. nach Änderung am Drehbuch)
  python3 studio/folge.py vorschau <ordner>         Kontaktbogen mit Standbildern jeder Szene (schnell)
  python3 studio/folge.py qc <ordner>               nur Qualitätskontrolle
  python3 studio/folge.py liste                     produzierte Folgen

Stufen: thema → recherche → drehbuch → stimme → plan → vorschau → render → ton → export → qc → ausgabe
"""
import argparse
import json
import re
import sys
import time
import traceback
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline import archiv, ausrichtung, config, export, llm, qc, schema, stimme, ton, zeitplan  # noqa: E402

STUFEN = ['thema', 'recherche', 'drehbuch', 'stimme', 'plan', 'vorschau', 'render', 'ton', 'export', 'qc', 'ausgabe']
MAX_RUNDEN = 3


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def jload(p, d=None):
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else d


def jsave(p, o):
    p.write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding='utf-8')


def slugify(s):
    s = s.lower().replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:50]


class Folge:
    def __init__(self, ordner):
        self.o = Path(ordner).resolve(); (self.o / 'roh').mkdir(parents=True, exist_ok=True)
        self.st = jload(self.o / 'status.json', {'fertig': [], 'anpassung': {}, 'protokoll': []})

    def save(self):
        jsave(self.o / 'status.json', self.st)

    def done(self, s):
        if s not in self.st['fertig']: self.st['fertig'].append(s)
        self.st['protokoll'].append(f'{time.strftime("%Y-%m-%d %H:%M")} {s} ok'); self.save()

    def reset_ab(self, s):
        i = STUFEN.index(s); self.st['fertig'] = [x for x in self.st['fertig'] if STUFEN.index(x) < i]; self.save()

    @property
    def db(self):
        return jload(self.o / 'drehbuch.json')

    # ------------------------------------------------------------ Stufen
    def thema(self, vorgabe=None):
        if (self.o / 'drehbuch.json').exists():
            log('  drehbuch.json liegt vor – Themenwahl übersprungen'); return
        if not llm.verfuegbar():
            raise llm.LLMNichtVerfuegbar('Kein ANTHROPIC_API_KEY: Themenwahl, Recherche und Drehbuch übernimmt Claude Code (siehe CLAUDE.md).')
        from pipeline import geschichte
        t = geschichte.thema_waehlen(vorgabe); jsave(self.o / 'thema.json', t); log('  Thema:', t.get('thema'))

    def recherche(self):
        if (self.o / 'recherche.json').exists() or (self.o / 'drehbuch.json').exists(): return
        from pipeline import geschichte
        r = geschichte.recherchieren(jload(self.o / 'thema.json')); jsave(self.o / 'recherche.json', r)
        log(f'  Recherche: {len(r.get("fakten", []))} Fakten, {len(r.get("quellen", []))} Quellen')

    def drehbuch(self):
        p = self.o / 'drehbuch.json'
        if not p.exists():
            from pipeline import geschichte
            jsave(p, geschichte.drehbuch_mit_pruefung(jload(self.o / 'recherche.json'), log=log))
        db = self.db; F, W = schema.pruefen(db); jsave(p, db)
        for w in W: log('  Hinweis:', w)
        if F:
            raise RuntimeError('Drehbuch fehlerhaft:\n - ' + '\n - '.join(F))
        n = sum(len(schema.woerter(s['text'])) for s in db['szenen'])
        log(f'  Drehbuch: „{db["titel"]}“, {len(db["szenen"])} Szenen, {n} Wörter (≈ {n / 2.55:.0f} s)')

    def stimme(self):
        tts = self.st['anpassung'].get('tts') or config.TTS
        stimme.erzeugen(self.db, self.o, tts, log=log)

    def plan(self):
        db = self.db; roh = self.o / 'roh'
        quelle = jload(roh / 'stimme_woerter.json', [])
        sk = ausrichtung.skript_woerter(db)
        if quelle:
            ws, treffer = ausrichtung.ausrichten(sk, quelle)
        else:
            log('  ! keine Wortzeiten vom Anbieter – Schätzung aus Sprechpausen'); ws, treffer = ausrichtung.schaetzen(sk, roh / 'stimme_take.wav')
        vd = stimme.dauer_wav(roh / 'stimme_take.wav')
        woerter, schnitt = zeitplan.stimm_timeline(db, ws)
        a = self.st['anpassung']
        try:
            plan = zeitplan.plan_bauen(db, woerter, schnitt, vd)
        except zeitplan.ZuKurz as e:
            log(f'  ❌ {e}')
            if not llm.verfuegbar():
                raise RuntimeError(f'{e}. Drehbuch um ca. {int(e.fehlend * 2.6) + 15} Wörter mit neuen Fakten erweitern, dann: folge.py ab {self.o} stimme')
            from pipeline import geschichte
            jsave(self.o / 'drehbuch.json', geschichte.drehbuch_erweitern(db, jload(self.o / 'recherche.json', {}), e.fehlend, log))
            self.stimme(); return self.plan()
        if a.get('belichtung'):
            for sc in plan['szenen']: sc['belichtung'] = sc.get('belichtung', 1) * a['belichtung']
        plan['treffer'] = round(treffer, 3)
        zeitplan.speichern(plan, self.o)
        log(f'  Plan: {plan["dauer"]:.1f} s, {len(plan["szenen"])} Szenen, {sum(len(s["shots"]) for s in plan["szenen"])} Einstellungen, Wortzuordnung {treffer * 100:.0f} %')

    def vorschau(self):
        plan = jload(self.o / 'plan.json'); ziel = self.o / 'roh' / 'vorschau'
        if ziel.exists():
            for f in ziel.glob('*.jpg'): f.unlink()
        zeiten = [round((s['a'] + s['b']) / 2, 2) for sc in plan['szenen'] for s in sc['shots'][:1]]
        code = export.standbilder(self.o, zeiten, ziel)
        bogen = kontaktbogen(ziel, self.o / 'vorschau.jpg')
        self.st['render_fehler'] = 1 if code == 3 else 0; self.save()
        if code not in (0, 3): raise RuntimeError('Vorschau-Rendering fehlgeschlagen')
        log(f'  Vorschau: {bogen}')
        if llm.verfuegbar() and self.st['anpassung'].get('bild_kritik', True):
            try:
                krit = bild_kritik(bogen, self.db); jsave(self.o / 'roh' / 'bild_kritik.json', krit)
                for p in krit.get('probleme', []): log('  Bildkritik:', p)
            except Exception as e:
                log('  ! Bildkritik übersprungen:', e)

    def render(self):
        export.rendern(self.o, log=log)
        export.cover(self.o)

    def ton(self):
        plan = jload(self.o / 'plan.json')
        if self.st['anpassung'].get('musik_db'): config.MUSIK_UNTER_STIMME_DB = self.st['anpassung']['musik_db']
        ton.mischen(self.db, plan, self.o, log=log)

    def export(self):
        plan = jload(self.o / 'plan.json')
        mp4 = export.exportieren(self.o, plan['dauer'], self.dateiname(), log=log)
        self.st['mp4'] = mp4.name; self.save()

    def dateiname(self):
        return slugify(self.db.get('slug') or self.db['titel'])

    def qc(self):
        plan = jload(self.o / 'plan.json'); mp4 = self.o / self.st.get('mp4', self.dateiname() + '.mp4')
        E, dauer = qc.video_pruefen(mp4, plan)
        E += qc.plan_pruefen(plan, self.db, plan.get('treffer', 0), jload(self.o / 'roh' / 'ton_info.json'), self.st.get('render_fehler', 0))
        rs = qc.rechtschreibung(self.db)
        self.st['qc'] = [list(e) for e in E]; self.st['dauer'] = dauer; self.st['rechtschreibung'] = rs; self.save()
        (self.o / 'qc_bericht.txt').write_text(qc.bericht(E) + (f'\n\nUnbekannte Wörter (prüfen, oft Eigennamen): {", ".join(rs)}' if rs else ''), encoding='utf-8')
        log('  Qualitätskontrolle:\n' + qc.bericht(E))
        fehler = [e for e in E if not e[1]]
        return fehler, dauer

    def ausgabe(self):
        db = self.db; d = self.st['dauer']; mp4 = self.st['mp4']
        tags = ' '.join(db['hashtags'])
        (self.o / 'beschreibung.txt').write_text(f'{db["beschreibung"]}\n\n{tags}\n', encoding='utf-8')
        q = '\n'.join(f'- [{x.get("titel", x.get("url"))}]({x.get("url")})' for x in db.get('quellen', []))
        dr = '\n'.join(f'- {x}' for x in db.get('dramatisierung', []))
        md = f"""# {db['titel']}

**Video:** `{mp4}` · **Länge:** {d:.1f} s ({int(d // 60)}:{d % 60:04.1f} min) · 1080×1920 · 30 fps · H.264/AAC

## TikTok-Beschreibung
{db['beschreibung']}

## Hashtags
{tags}

## Zusammenfassung
{db['zusammenfassung']}

## Faktenlage
{'Wahre Geschichte – Fakten recherchiert und geprüft.' if db.get('wahre_geschichte') else 'Fiktive / nachempfundene Geschichte.'}

**Dramatisiert bzw. nachgestellt:**
{dr or '- –'}

**Quellen:**
{q or '- –'}

## Qualitätskontrolle
{(self.o / 'qc_bericht.txt').read_text(encoding='utf-8')}
"""
        (self.o / 'ergebnis.md').write_text(md, encoding='utf-8')
        archiv.eintragen(db, self.o, d)
        export.aufraeumen(self.o)
        log(f'  ✅ FERTIG: {self.o / mp4}  ({d:.1f} s)')

    # ------------------------------------------------------------ Ablauf mit automatischer Nachbesserung
    def laufen(self, vorgabe=None):
        for runde in range(MAX_RUNDEN):
            for s in STUFEN:
                if s in self.st['fertig']: continue
                log(f'▶ {s}')
                for v in range(3):  # automatische Wiederholung bei vorübergehenden Fehlern
                    try:
                        if s == 'thema': self.thema(vorgabe)
                        elif s == 'qc':
                            fehler, dauer = self.qc()
                            if fehler:
                                self.nachbessern(fehler); break
                        else: getattr(self, s)()
                        self.done(s); break
                    except (llm.LLMNichtVerfuegbar, FileNotFoundError):
                        raise
                    except RuntimeError as e:
                        if 'Drehbuch fehlerhaft' in str(e) or 'erweitern' in str(e): raise
                        log(f'  ! {s} fehlgeschlagen (Versuch {v + 1}/3): {e}')
                        if v == 2: raise
                    except Exception as e:
                        log(f'  ! {s} fehlgeschlagen (Versuch {v + 1}/3): {e}'); traceback.print_exc()
                        if v == 2: raise
                if 'qc' not in self.st['fertig'] and s == 'qc':
                    break  # Nachbesserung → nächste Runde
            if 'ausgabe' in self.st['fertig']:
                return True
        raise RuntimeError(f'Qualitätskriterien nach {MAX_RUNDEN} Runden nicht erfüllt – siehe {self.o / "qc_bericht.txt"}')

    def nachbessern(self, fehler):
        stufen = {e[3] for e in fehler}; a = self.st['anpassung']
        log('  ↺ Nachbesserung für: ' + ', '.join(e[0] for e in fehler))
        for e in fehler:
            if e[0].startswith('Bild nicht zu dunkel'): a['belichtung'] = round(a.get('belichtung', 1) * 1.3, 2)
            if e[0].startswith('Stimme klar'): a['musik_db'] = a.get('musik_db', config.MUSIK_UNTER_STIMME_DB) + 4
            if e[0].startswith('Untertitel synchron') and config.TTS != 'datei': a['tts'] = 'elevenlabs' if config.env('ELEVENLABS_API_KEY') else 'edge'
        reihenfolge = ['drehbuch', 'stimme', 'plan', 'render', 'ton', 'export']
        start = min((s for s in stufen if s in reihenfolge), key=reihenfolge.index)
        if start == 'drehbuch':
            raise RuntimeError('Drehbuch erfüllt die Anforderungen nicht (z. B. < 60 s) – bitte erweitern und mit „ab <ordner> stimme“ fortsetzen')
        self.reset_ab('vorschau' if start == 'plan' else start); self.save()


def kontaktbogen(ordner, ziel):
    from PIL import Image, ImageDraw
    fs = sorted(ordner.glob('*.jpg'), key=lambda f: float(f.stem.split('_')[1]))
    if not fs: return None
    cols = 6; rows = (len(fs) + cols - 1) // cols; w, h = 270, 480
    s = Image.new('RGB', (cols * w, rows * h), 'black'); d = ImageDraw.Draw(s)
    for i, f in enumerate(fs):
        s.paste(Image.open(f).resize((w, h)), ((i % cols) * w, (i // cols) * h)); d.text(((i % cols) * w + 6, (i // cols) * h + 4), f'{i + 1}  {f.stem[2:]}s', fill='yellow')
    s.save(ziel, quality=82); return ziel


def bild_kritik(bogen, db):
    """Optional: Claude prüft den Kontaktbogen (Figuren konsistent? Bild passt zum Text? Bildfehler?)."""
    import base64
    import anthropic
    c = anthropic.Anthropic(max_retries=3)
    texte = '\n'.join(f'{i + 1}. {s["text"]}' for i, s in enumerate(db['szenen']))
    msg = c.messages.create(model=config.LLM_MODEL, max_tokens=4000, output_config={'effort': 'medium'}, messages=[{'role': 'user', 'content': [
        {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': base64.b64encode(Path(bogen).read_bytes()).decode()}},
        {'type': 'text', 'text': 'Kontaktbogen eines animierten TikTok-Videos (ein Standbild je Szene, nummeriert). Sprechertext je Szene:\n' + texte +
         '\n\nPrüfe: Sind Figuren erkennbar und über die Szenen konsistent? Passt jedes Bild zum Text? Gibt es Bildfehler (zu dunkel, '
         'Figur abgeschnitten/verdeckt, Kamera in Wand, leeres Bild)? Antworte als JSON {"ok": bool, "probleme": ["Szene X: …"]}.'}]}])
    return llm.json_aus(''.join(b.text for b in msg.content if b.type == 'text'))


def neuer_ordner(vorgabe=None):
    name = f'{date.today().isoformat()}_{slugify(vorgabe) if vorgabe else "neue-folge"}'
    p = config.FOLGEN / name; i = 2
    while p.exists(): p = config.FOLGEN / f'{name}-{i}'; i += 1
    return p


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    n = sub.add_parser('neu'); n.add_argument('--thema'); n.add_argument('--ordner')
    w = sub.add_parser('weiter'); w.add_argument('ordner')
    a = sub.add_parser('ab'); a.add_argument('ordner'); a.add_argument('stufe', choices=STUFEN)
    v = sub.add_parser('vorschau'); v.add_argument('ordner')
    q = sub.add_parser('qc'); q.add_argument('ordner')
    sub.add_parser('liste')
    args = ap.parse_args()
    if args.cmd == 'liste':
        for e in archiv.laden(): print(f'{e["datum"]}  {e["dauer"]:6.1f}s  {e["titel"]}  ({e["ordner"]})')
        return
    if args.cmd == 'neu':
        if args.thema and archiv.schon_produziert(args.thema): log('! Achtung: ähnliches Thema wurde schon produziert')
        f = Folge(args.ordner or neuer_ordner(args.thema)); log('Neue Folge:', f.o)
        if args.thema: f.st['vorgabe'] = args.thema; f.save()
        f.laufen(args.thema)
    elif args.cmd == 'weiter':
        f = Folge(args.ordner); f.laufen(f.st.get('vorgabe'))
    elif args.cmd == 'ab':
        f = Folge(args.ordner); f.reset_ab(args.stufe); f.laufen(f.st.get('vorgabe'))
    elif args.cmd == 'vorschau':
        f = Folge(args.ordner); f.vorschau()
    elif args.cmd == 'qc':
        f = Folge(args.ordner); fe, d = f.qc(); sys.exit(1 if fe else 0)


if __name__ == '__main__':
    main()
