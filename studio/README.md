# Story Studio – automatische TikTok-Storytelling-Videos

Ein Befehl erzeugt eine komplette, eigenständige Folge: Geschichte auswählen und recherchieren, Drehbuch schreiben, 3D-Animation rendern, Sprecher, Musik, Geräusche, Untertitel, Export und Qualitätskontrolle.

```bash
python3 studio/folge.py neu                         # „Neue Folge erstellen“ – Thema wählt das System
python3 studio/folge.py neu --thema "Apollo 13"     # Folge zu deinem Thema
```

Ergebnis in `studio/folgen/<datum>_<thema>/`:

| Datei | Inhalt |
|---|---|
| `<titel>.mp4` | fertiges Video, 1080 × 1920, 30 fps, H.264 + AAC, **immer ≥ 60 s** |
| `ergebnis.md` | Titel, TikTok-Beschreibung, Hashtags, Zusammenfassung, tatsächliche Länge, Quellen, was dramatisiert ist, QC-Bericht |
| `beschreibung.txt` | Beschreibung + Hashtags zum Kopieren |
| `cover.png` | Titelbild (Hook-Schlagzeile) |
| `vorschau.jpg` | Kontaktbogen: ein Standbild pro Szene |
| `drehbuch.json` | Drehbuch (Text, Szenen, Figuren, Kamera, Effekte, Fakten, Quellen) |
| `qc_bericht.txt` | Ergebnis aller automatischen Prüfungen |

---

## 1. Gewählte Technik und warum

| Aufgabe | Lösung | Kosten pro Folge (≈ 100 s) | Warum |
|---|---|---|---|
| Themenwahl, Recherche, Faktencheck, Drehbuch | **Claude API** (`claude-opus-5-5`) mit serverseitiger **Websuche/Web-Abruf** | ≈ 0,30–0,80 $ | Recherchiert selbst mit Quellen, prüft Fakten gegen und trennt Belegtes von Dramatisierung |
| 3D-Animation | **Eigener Three.js-Renderer** (headless Chromium), prozedurale Figuren, Orte, Effekte | 0 $ (nur Rechenzeit) | Figuren bleiben 100 % konsistent (gleicher Steckbrief = gleiche Figur). Echte Animation, kein Bilder-Slideshow-Look. Keine Kosten pro Sekunde |
| Deutsche Stimme | **ElevenLabs** `eleven_v3` (direkt oder über Speko) | ≈ 0,10–0,30 $ | Natürlichste deutsche Stimme. Liefert Zeichen-Zeitstempel für exakte Untertitel |
| Ersatzstimmen | Speko → **Cartesia „Sebastian – Orator“** (deutsch); **Edge-TTS** (kostenlos) | ≈ 0,05 $ / 0 $ | Läuft weiter, wenn ElevenLabs ausfällt |
| Musik | prozedurale Spannungsmusik (Drone, Pad je Stimmung, Puls, Klavier) **oder** eigene lizenzfreie Tracks in `studio/musik/<stimmung>/` | 0 $ | Keine Lizenzprobleme. Die Intensität folgt dem Spannungsbogen. Wird automatisch unter die Stimme geduckt |
| Geräusche | prozedurales Sounddesign (Impacts, Flut, Grollen, Bohrer, Klopfen, Jubel, …) | 0 $ | Wird automatisch aus den Effekten, Übergängen und Aktionen der Szene gesetzt |
| Untertitel | Wörter **aus dem Drehbuch** (keine Erkennungsfehler), Zeiten aus der Stimme | 0 $ | Montserrat Black, weiß, Schlüsselwörter **gelb**, max. 3 Wörter, Pop-Animation, sicherer Bereich |
| Schnitt, Export, QC | ffmpeg | 0 $ | Mastering auf −14 LUFS, Filmkorn, Prüfung von Länge, Schwarzbildern, Standbildern, Lautheit |

**Gesamtkosten:** ≈ 0,50–1,20 $ pro Folge.

**Bewusst nicht gewählt:** KI-Videogeneratoren (Veo, Kling, Runway, Sora). Sie kosten etwa 0,30–0,50 $ pro Sekunde, also 30–60 $ pro Folge. Außerdem bleiben Figuren über viele Clips nicht zuverlässig gleich. Der Renderer hat dafür eine klare Schnittstelle (`plan.json` → Szenen), an die sich später einzelne KI-Clips andocken lassen.

## 2. Einrichtung (einmalig)

Voraussetzungen: Python ≥ 3.10, Node.js ≥ 20, ffmpeg und Chromium/Playwright.

```bash
cd studio
pip install -r requirements.txt
npm install                      # three.js + Schriften
npx playwright install chromium  # nur falls noch kein Chromium vorhanden
cp .env.example .env             # Schlüssel eintragen (siehe unten)
```

### API-Schlüssel (`studio/.env`)

| Variable | Wofür | Woher |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vollautomatik: Thema, Recherche, Drehbuch, Faktencheck, Bildkritik | console.anthropic.com → API Keys |
| `ELEVENLABS_API_KEY` | beste deutsche Stimme (empfohlen; Creator-Abo ≈ 22 $/Monat reicht für ≈ 50 Folgen) | elevenlabs.io → Profil → API Keys |
| `SPEKO_API_KEY` | Alternative: Stimme über Speko (ElevenLabs nach erster Aufladung, sonst Cartesia & Co.) | platform.speko.ai |
| – | ohne Stimmen-Schlüssel wird automatisch die kostenlose Edge-Stimme genutzt | – |

Ohne `ANTHROPIC_API_KEY` funktioniert alles ab dem Drehbuch. Thema, Recherche und Drehbuch schreibt dann Claude Code direkt im Chat (siehe `CLAUDE.md` im Projektordner).

## 3. Bedienung

```bash
python3 studio/folge.py neu                       # neue Folge, Thema automatisch
python3 studio/folge.py neu --thema "Tschernobyl-Taucher"
python3 studio/folge.py weiter studio/folgen/…    # nach Abbruch fortsetzen (fertige Render-Blöcke bleiben erhalten)
python3 studio/folge.py vorschau studio/folgen/…  # nur Kontaktbogen (≈ 2 min) – zum Prüfen vor dem langen Rendern
python3 studio/folge.py ab studio/folgen/… stimme # nach Änderungen am Drehbuch ab einer Stufe neu produzieren
python3 studio/folge.py qc studio/folgen/…        # nur Qualitätskontrolle
python3 studio/folge.py liste                     # alle produzierten Folgen (Archiv gegen Wiederholungen)
```

**Dauer:** Text und Stimme ≈ 3–6 min. Rendern ohne Grafikkarte (CPU, 4 Kerne) ≈ 1,5–2,5 Stunden für 110 s. Mit `STUDIO_GPU=1` auf einem Rechner mit Grafikkarte sind es meist nur 5–15 Minuten. Das Rendern läuft in Blöcken und kann jederzeit mit `weiter` fortgesetzt werden.

## 4. Ablauf (automatisch)

```
thema → recherche → drehbuch → stimme → plan → vorschau → render → ton → export → qc → ausgabe
```

1. **Thema**: Claude prüft drei Kandidaten mit Websuche und schließt bereits produzierte Geschichten aus (`studio/archiv.json`).
2. **Recherche**: mehrere unabhängige Quellen, Abgleich der Schlüsseldaten, Liste von Abweichungen und offenen Fragen.
3. **Drehbuch**: Hook → Einleitung → Spannung → Wendung → Auflösung → Outro, 210–300 Wörter, 18–30 Szenen. Danach automatische Formatprüfung (`pipeline/schema.py`) und ein zweiter Durchgang als strenger **Faktenprüfer/Lektor**. Fehler gehen zur Überarbeitung zurück.
4. **Stimme**: ein durchgehender Take, damit die Stimmfarbe gleich bleibt. Wortzeiten kommen vom Anbieter oder aus der Transkription.
5. **Plan**: Die Szenenlänge folgt der Sprache. Jede Szene bekommt 1–3 Kameraeinstellungen; die Schnitte liegen auf Wortanfängen. Keine Einstellung ist länger als ≈ 4 s.
   **Ist das Video kürzer als 60 s, wird das Drehbuch automatisch um neue, belegte Details erweitert** und neu vertont. Es wird nie künstlich gestreckt.
6. **Vorschau**: Standbilder aller Szenen. Mit API-Schlüssel prüft Claude den Kontaktbogen (Figuren erkennbar? Bild passt zum Text?).
7. **Render**: Three.js, 1080 × 1920, 30 fps. Fortsetzbar in Blöcken zu 2 s.
8. **Ton**: Stimme (Kompression, −18 dBFS), Atmosphäre je Ort, Musik ≥ 15 dB unter der Stimme mit Ducking, Geräusche zu Effekten, Übergängen und Aktionen.
9. **Export**: Mastering (−14 LUFS, −1 dBTP), Filmkorn, H.264 CRF 18, AAC 192 kbit/s, `faststart`.
10. **QC**: siehe unten. Bei Fehlern wird der zuständige Schritt automatisch angepasst und wiederholt (bis zu 3 Runden).
11. **Ausgabe**: `ergebnis.md`, `beschreibung.txt` und ein Archiveintrag.

## 5. Qualitätskontrolle (automatisch vor der Freigabe)

| Prüfung | Bei Fehler |
|---|---|
| Länge ≥ 60 s (harte Regel), Länge = Plan | Drehbuch erweitern bzw. neu rendern |
| 1080 × 1920, 30 fps, H.264, AAC stereo 48 kHz | Export wiederholen |
| Alle Szenen vorhanden und lückenlos, keine Einstellung > 6 s | Plan neu bauen |
| Keine Schwarzbilder > 0,6 s, keine Standbilder > 2,5 s, Bild nicht zu dunkel | Belichtung ×1,3, neu rendern |
| Figuren konsistent (nur definierte Figuren) | Drehbuch |
| Untertitel synchron (≥ 80 % der Wörter direkt der Stimme zugeordnet, monoton) | andere Stimme bzw. neue Zeiten |
| Stimme ≥ 12 dB über der Musik, Stimmpegel, Lautheit −16…−12 LUFS, True Peak ≤ −1 dBTP | Musik leiser, neu mischen |
| Geschichte vollständig (Hook, Wendung, Auflösung, Outro) | Drehbuch |
| Renderer ohne Fehler | neu rendern |
| Rechtschreibung (deutsches Wörterbuch; Eigennamen werden nur gemeldet) | Hinweis im Bericht |

## 6. Visueller Baukasten (erweiterbar)

* **Orte** (`renderer/engine/orte.js`): stollen, tunnel, hoehle, werk, strasse, halle, raum (buero/labor/wohnung/kontrollraum), wald, meer, schnee, wueste. Jeweils mit Tageszeit (nacht/daemmerung/tag) und Wetter (klar/nebel/regen/schnee/sturm).
* **Figuren** (`figuren.js`): große Augen mit Blinzeln und Blickrichtung, Brauen und Mund für 8 Ausdrücke. 12 Outfits (bergmann, arbeiter, anzug, uniform, kittel, polizei, feuerwehr, …), Helme mit Lampe, Frisuren, Bart, Brille, Kinder.
  29 Aktionen, z. B. laufen, rennen, klopfen, graben, erschrecken, fallen, kriechen, jubeln, umarmen, zittern, zeigen und reden.
* **Kamera** (`regie.js`): 18 Einstellungen (weit, totale, nah, gesicht, frosch, vogel, verfolgung, vorlauf, orbit, kranfahrt, zoom_schock, vertigo, pov, …). Dazu kommen Handkamera-Wackeln und automatische Bildgestaltung für das Hochformat.
* **Effekte** (`effekte.js`): flut/Flutwelle, feuer, rauch, explosion, funken, beben, lichtstrahl, alarm, blitz, wasserstrahl, flackern, dunkel und stromausfall.
* **Requisiten** (`requisiten.js`): lore, bohrgeraet, kapsel, auto, boot, laterne, zettel (mit Text), schild, monitor, scheinwerfer, …
* **Look** (`core.js`): ACES-Tonemapping, Bloom, Farbgebung je Stimmung, Vignette, chromatische Aberration und Übergänge (Blitz, Schwarzblende, Zoom-Unschärfe).

Ein neuer Ort, eine Aktion oder ein Effekt wird in der jeweiligen JS-Datei ergänzt und in `pipeline/schema.py` eingetragen. Ab dann kennt ihn auch der Drehbuch-Prompt.

## 7. Projektstruktur

```
studio/
  folge.py              Steuerung (CLI), Stufen, Wiederholungen, Nachbesserung
  pipeline/             config, llm (Claude), geschichte (Thema/Recherche/Drehbuch), schema (Prüfung),
                        stimme (TTS), ausrichtung (Wortzeiten), zeitplan (plan.json), klang + sfx (Sounddesign/Musik),
                        ton (Mischung), export (Render/MP4), qc (Prüfungen), archiv
  prompts/              Systemprompt, Themenwahl, Recherche, Drehbuch, Kritik
  renderer/             render.mjs (headless, parallel, fortsetzbar), player.html, engine/*.js
  musik/<stimmung>/     optional eigene lizenzfreie Musik (spannung, schock, trauer, hoffnung, triumph, ruhig)
  folgen/               produzierte Folgen
  archiv.json           bereits verwendete Geschichten
```

## 8. Tipps für Reichweite

* Poste die ersten Folgen täglich zur gleichen Uhrzeit (z. B. 18–20 Uhr) und beobachte in der TikTok-Analyse die **durchschnittliche Wiedergabedauer**. Ziel: > 50 %.
* Fällt die Kurve in den ersten 3 s stark ab, ist der Hook zu schwach. Dann `hook_text` und die erste Szene im Drehbuch schärfen und mit `ab … stimme` neu produzieren.
* Die Frage am Ende (Outro) treibt Kommentare. Antworte auf Kommentare mit einem Video zum nächsten Thema.
