# Projekt: TikTok-Storytelling-Kanal

Zwei Teile:
- `studio/` – **automatische Produktion eigenständiger Folgen** (Hauptsystem, Anleitung in `studio/README.md`)
- `serie/` – handgebaute 10-teilige Serie „Der Leuchtturm von Nebelsand“ (eigene Regeln in `serie/status.md`)

## Befehl „Neue Folge erstellen“

Sagt der Nutzer „Neue Folge erstellen“ (optional mit Thema), dann:

**Mit `ANTHROPIC_API_KEY` in `studio/.env`** (Vollautomatik):
```bash
python3 studio/folge.py neu [--thema "…"]
```
Das Rendern dauert lange. Starte den Befehl im Hintergrund und melde am Ende die Ergebnisse aus `ergebnis.md`.

**Ohne API-Schlüssel** übernimmt Claude Code die Text-Schritte selbst:
1. Thema wählen. Ein Thema aus `studio/archiv.json` darf nicht wiederholt werden. Gibt der Nutzer ein Thema vor, wird es verwendet.
2. Mit der Websuche recherchieren und die Schlüsseldaten (Datum, Ort, Namen, Zahlen) in mindestens zwei Quellen gegenprüfen. Nichts erfinden. Unsicheres wird vorsichtig formuliert oder weggelassen.
3. Ordner `studio/folgen/<JJJJ-MM-TT>_<slug>/` anlegen und `drehbuch.json` nach `studio/prompts/drehbuch.md` schreiben. Erlaubte Werte stehen in `studio/pipeline/schema.py`.
   Prüfen mit: `python3 -c "import json,sys; sys.path.insert(0,'studio'); from pipeline import schema; print(schema.pruefen(json.load(open('<pfad>'))))"`. Es dürfen keine Fehler übrig bleiben.
4. Stimme erzeugen:
   - Mit `ELEVENLABS_API_KEY` oder `SPEKO_API_KEY` macht das die Pipeline selbst.
   - Sonst über das **Speko-MCP**: `audio.synthesize` mit dem Sprechtext (`pipeline/stimme.sprechtext(db)`), `language de`. ElevenLabs „Thomas“ (`5faieqDE3osz75KiOI2M`) ist nur nach einer Aufladung des Speko-Kontos verfügbar. Sonst Cartesia „Sebastian – Orator“ (`b7187e84-fe22-4344-ba4a-bc013fcb533e`, Modell `sonic-3.5`, `speed 0.9`).
   - Das WAV als `roh/stimme_take.wav` speichern (48 kHz mono).
   - Dann `audio.transcribe` mit `word_timestamps: true` aufrufen und die Wörter als `roh/transkript.json` speichern: `{"words":[{"text","start_ms","end_ms"}]}`.
   - Danach `status.json` anlegen: `{"fertig": [], "anpassung": {"tts": "datei"}, "protokoll": []}`.
5. `python3 studio/folge.py weiter studio/folgen/<ordner>` im Hintergrund starten. Den Kontaktbogen `vorschau.jpg` ansehen, sobald er existiert, und offensichtliche Bildfehler im Drehbuch korrigieren. Dann `ab <ordner> plan`.
6. Am Ende dem Nutzer melden: MP4-Pfad, Titel, Beschreibung, Hashtags, Zusammenfassung und tatsächliche Länge (aus `ergebnis.md`).

## Harte Regeln
- **Kein Video unter 60 Sekunden.** Die Pipeline bricht sonst ab bzw. erweitert das Drehbuch. Ideal sind 75–120 s (210–300 gesprochene Wörter).
- Wahre Geschichten: nur belegte Fakten. Dramatisierungen gehören in `dramatisierung`, die Quellen in `quellen`.
- Figuren nur über `figuren` im Drehbuch definieren. Gleiche ID heißt gleiches Aussehen in jeder Szene.
- Untertitel kommen aus dem Drehbuchtext. Fehlerfreies Deutsch ist Pflicht.
