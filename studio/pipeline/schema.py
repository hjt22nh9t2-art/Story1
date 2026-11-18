"""Drehbuch-Format (drehbuch.json) und Prüfung. Einzige Quelle für erlaubte Werte des Renderers."""
import re

ORTE = {
    'stollen': 'Bergwerksstollen: Fels, Holzausbau, Gleise, Grubenlampen (Gang entlang z-Achse)',
    'tunnel': 'Industrie-/Verkehrstunnel aus Beton mit Rohren und Neonlicht (Gang entlang z-Achse)',
    'hoehle': 'Enge Höhle / Hohlraum / eingeschlossener Raum unter der Erde',
    'werk': 'Industriegelände draußen: Förderturm, Backsteinhallen, Schornstein, Zaun, Flutlicht',
    'strasse': 'Stadtstraße mit Häusern, Laternen, nassem Asphalt',
    'halle': 'Fabrikhalle innen: Stahlträger, Maschinen, Laufsteg, Hängelampen',
    'raum': 'Innenraum (variante: buero | labor | wohnung | kontrollraum)',
    'wald': 'Dichter Nadelwald mit Pfad und Nebel',
    'meer': 'Offenes Meer, Figuren stehen auf dem Deck eines Kutters',
    'schnee': 'Verschneites Gebirge mit Felsen',
    'wueste': 'Wüste mit Dünen und Felsen',
}
ZEITEN = ['nacht', 'daemmerung', 'tag']
WETTER = ['klar', 'nebel', 'regen', 'schnee', 'sturm']
STIMMUNGEN = ['spannung', 'ruhig', 'schock', 'trauer', 'hoffnung', 'triumph', 'rueckblick']
TEILE = ['hook', 'einleitung', 'spannung', 'wendung', 'aufloesung', 'outro']
AKTIONEN = ['warten', 'laufen', 'rennen', 'schleichen', 'taumeln', 'reden', 'rufen', 'zeigen', 'umsehen', 'erschrecken', 'fallen',
            'liegen', 'sitzen', 'hocken', 'kauern', 'knien', 'kriechen', 'klopfen', 'graben', 'tragen', 'winken', 'jubeln', 'umarmen',
            'zittern', 'telefonieren', 'schieben', 'schwimmen', 'nachdenken', 'aufschauen']
AUSDRUECKE = ['neutral', 'angst', 'schock', 'freude', 'trauer', 'entschlossen', 'erschoepft', 'wut']
KAMERAS = {
    'weit': 'sehr weite Übersicht von oben (Ort etablieren)', 'totale': 'ganze Szene', 'halbtotale': 'Figuren ganz im Bild',
    'nah': 'Oberkörper', 'gesicht': 'Gesicht groß (Emotion)', 'detail': 'Objekt groß (ziel: "prop:<name>")',
    'frosch': 'von unten, bedrohlich/heroisch', 'vogel': 'von oben, Draufsicht', 'verfolgung': 'hinter laufender Figur her',
    'vorlauf': 'vor laufender Figur, sie kommt auf uns zu', 'seitlich': 'Seitenfahrt neben Figur', 'orbit': 'Kreisfahrt um Figuren',
    'kranfahrt': 'steigt nach oben (Abschluss, Erleichterung)', 'abwaerts': 'senkt sich herab', 'zoom_schock': 'schneller Ruck-Zoom (Schreckmoment)',
    'vertigo': 'Vertigo-Effekt (Schock-Erkenntnis)', 'schulter': 'über die Schulter von Figur 1 auf Figur 2', 'pov': 'Sicht aus den Augen der Figur',
}
OUTFITS = ['bergmann', 'arbeiter', 'zivil', 'anzug', 'uniform', 'kittel', 'pullover', 'kleid', 'taucher', 'polizei', 'feuerwehr', 'pilot']
REQUISITEN = ['lore', 'kiste', 'fass', 'laterne', 'zettel', 'bohrgeraet', 'kapsel', 'fernsehkamera', 'auto', 'absperrung', 'trage',
              'schreibtisch', 'funkgeraet', 'felsbrocken', 'leiter', 'boot', 'schild', 'feuerstelle', 'telefon', 'monitor', 'scheinwerfer']
EFFEKTE = ['flut', 'feuer', 'rauch', 'explosion', 'funken', 'beben', 'lichtstrahl', 'alarm', 'blitz', 'wasserstrahl', 'flackern', 'dunkel', 'stromausfall']
UEBERGAENGE = ['schnitt', 'blitz', 'schwarz', 'zoom']
EINBLENDUNGEN = ['datum', 'ort', 'zahl', 'zitat']
GERAEUSCHE = ['einschlag', 'whoosh', 'riser', 'herzschlag', 'ticken', 'explosion', 'grollen', 'steinschlag', 'wasser', 'alarm', 'bohrer',
              'klopfen', 'schritte', 'metall', 'funk', 'jubel', 'donner', 'feuer', 'schrei_fern', 'tuer', 'glocke', 'kamera', 'stille']

MIN_WOERTER = 175      # ≈ 65 s bei ruhigem, dramatischem Erzähltempo
ZIEL_WOERTER = (210, 300)
MAX_WOERTER_SZENE = 30


def woerter(text):
    return [w for w in re.split(r'\s+', re.sub(r'\[[^\]]*\]', ' ', text or '')) if re.search(r'\w', w)]


def pruefen(db, streng=True):
    """Prüft ein Drehbuch. Gibt (fehler, warnungen) zurück und korrigiert harmlose Abweichungen direkt im Objekt."""
    F, Wn = [], []
    for k in ['titel', 'szenen', 'figuren', 'outro_frage', 'beschreibung', 'hashtags', 'zusammenfassung']:
        if k not in db:
            F.append(f'Feld „{k}“ fehlt')
    if F:
        return F, Wn
    if db.get('wahre_geschichte') and not db.get('quellen'):
        F.append('Wahre Geschichte ohne Quellen – Recherche fehlt')
    figs = db['figuren']
    for fid, spec in figs.items():
        if spec.get('outfit') and spec['outfit'] not in OUTFITS:
            Wn.append(f'Figur {fid}: Outfit „{spec["outfit"]}“ unbekannt → zivil'); spec['outfit'] = 'zivil'
    gesamt = 0; teile = set()
    for i, s in enumerate(db['szenen']):
        n = len(woerter(s.get('text', ''))); gesamt += n; tag = f'Szene {i + 1}'
        if n == 0:
            F.append(f'{tag}: kein Erzähltext')
        if n > MAX_WOERTER_SZENE:
            F.append(f'{tag}: {n} Wörter – zu lang für eine Einstellung (max. {MAX_WOERTER_SZENE}); bitte teilen')
        teile.add(s.get('teil'))
        if s.get('ort') not in ORTE:
            Wn.append(f'{tag}: Ort „{s.get("ort")}“ unbekannt → werk'); s['ort'] = 'werk'
        for k, erlaubt, std in [('zeit', ZEITEN, 'nacht'), ('wetter', WETTER, 'klar'), ('stimmung', STIMMUNGEN, 'spannung'), ('uebergang', UEBERGAENGE, 'schnitt')]:
            if s.get(k) is not None and s[k] not in erlaubt:
                Wn.append(f'{tag}: {k} „{s[k]}“ unbekannt → {std}'); s[k] = std
        for f in s.get('figuren', []):
            if f.get('id') not in figs:
                F.append(f'{tag}: Figur „{f.get("id")}“ ist nicht unter „figuren“ definiert (Konsistenz!)')
            for k in ['aktion', 'aktion2', 'danach']:
                if f.get(k) and f[k] not in AKTIONEN:
                    Wn.append(f'{tag}: Aktion „{f[k]}“ unbekannt → warten'); f[k] = 'warten'
            for k in ['ausdruck', 'ausdruck2']:
                if f.get(k) and f[k] not in AUSDRUECKE:
                    Wn.append(f'{tag}: Ausdruck „{f[k]}“ unbekannt → neutral'); f[k] = 'neutral'
        s['requisiten'] = [r for r in s.get('requisiten', []) if r.get('name') in REQUISITEN or Wn.append(f'{tag}: Requisite „{r.get("name")}“ unbekannt – entfernt')]
        eff = []
        for e in s.get('effekte', []):
            name = e if isinstance(e, str) else e.get('name')
            if name in EFFEKTE: eff.append(e)
            else: Wn.append(f'{tag}: Effekt „{name}“ unbekannt – entfernt')
        s['effekte'] = eff
        kam = s.get('kamera') or []
        if isinstance(kam, str): kam = [kam]
        s['kamera'] = [k for k in kam if (k if isinstance(k, str) else k.get('kamera')) in KAMERAS or Wn.append(f'{tag}: Kamera „{k}“ unbekannt – entfernt')]
        s['geraeusche'] = [g for g in s.get('geraeusche', []) if g in GERAEUSCHE or Wn.append(f'{tag}: Geräusch „{g}“ unbekannt – entfernt')]
        e = s.get('einblendung')
        if e and e.get('art') not in EINBLENDUNGEN:
            Wn.append(f'{tag}: Einblendung „{e.get("art")}“ unbekannt – entfernt'); s['einblendung'] = None
        for h in s.get('hervorheben', []):
            if h.lower().strip('.,!?') not in [w.lower().strip('.,!?:;…“„"') for w in woerter(s.get('text', ''))]:
                Wn.append(f'{tag}: Hervorhebung „{h}“ kommt im Text nicht vor')
    if gesamt < MIN_WOERTER:
        F.append(f'Erzähltext hat nur {gesamt} Wörter – für mindestens 60 s Video werden ≥ {MIN_WOERTER} benötigt (ideal {ZIEL_WOERTER[0]}–{ZIEL_WOERTER[1]}). Geschichte mit NEUEN Informationen erweitern, nichts wiederholen.')
    elif gesamt < ZIEL_WOERTER[0]:
        Wn.append(f'Erzähltext {gesamt} Wörter – etwas kurz (ideal {ZIEL_WOERTER[0]}–{ZIEL_WOERTER[1]})')
    if gesamt > 340:
        F.append(f'Erzähltext hat {gesamt} Wörter – über 120 s, bitte straffen')
    for t in ['hook', 'wendung', 'aufloesung']:
        if t not in teile:
            F.append(f'Erzählteil „{t}“ fehlt (Aufbau: Hook → Einleitung → Spannung → Wendung → Auflösung → Outro)')
    if db['szenen'] and db['szenen'][0].get('teil') != 'hook':
        F.append('Die erste Szene muss der Hook sein')
    if db['szenen'] and len(woerter(db['szenen'][0].get('text', ''))) > 16:
        F.append('Hook zu lang – max. 16 Wörter, er muss in 3 Sekunden wirken')
    if len(db['szenen']) < 14:
        F.append(f'Nur {len(db["szenen"])} Szenen – für visuelle Abwechslung mindestens 14')
    orte = {s.get('ort') for s in db['szenen']}
    if len(orte) < 2:
        Wn.append('Nur ein Schauplatz – mehr visuelle Abwechslung wäre besser')
    if not 3 <= len(db.get('hashtags', [])) <= 12:
        Wn.append('3–12 Hashtags empfohlen')
    return F, Wn


def baukasten_text():
    """Beschreibung aller Bausteine für den Drehbuch-Prompt."""
    L = ['ORTE (ort):'] + [f'  - {k}: {v}' for k, v in ORTE.items()]
    L += [f'ZEIT: {", ".join(ZEITEN)}', f'WETTER: {", ".join(WETTER)}', f'STIMMUNG (Farbgebung + Musik): {", ".join(STIMMUNGEN)}',
          f'AKTIONEN der Figuren: {", ".join(AKTIONEN)}', f'AUSDRÜCKE: {", ".join(AUSDRUECKE)}', 'KAMERA:'] + [f'  - {k}: {v}' for k, v in KAMERAS.items()]
    L += [f'OUTFITS: {", ".join(OUTFITS)}', f'REQUISITEN: {", ".join(REQUISITEN)}', f'EFFEKTE: {", ".join(EFFEKTE)}',
          f'ÜBERGÄNGE: {", ".join(UEBERGAENGE)}', f'EINBLENDUNGEN (art): {", ".join(EINBLENDUNGEN)}', f'GERÄUSCHE (zusätzlich): {", ".join(GERAEUSCHE)}']
    return '\n'.join(L)
