# Folge 5 – „Wir bekommen einen neuen Trainer?!“ · Produktionsstatus

**Status: Drehbuch + Bild fertig, VERTONUNG FEHLT – noch kein fertiges Video.**
Grund: Die Sprachausgabe (Speko-Connector) war in der Sitzung vom 13.11.2026 nicht erreichbar (Verbindungsfehler 503).
Ohne sie können die festen Stimmen (Günther/Paule/Emre ElevenLabs, Rosa Inworld „Annika“) nicht erzeugt werden.
Ersatzstimmen werden bewusst NICHT verwendet (Regel: keine Stimmänderung ohne Zustimmung).

## Fertig
- Drehbuch `src/drehbuecher/folge-005.ts` → `data/episodes/ep-005.json` (Entwurf, 10 Szenen, 22 Zeilen), Regietexte `ep-005.tts.json`
- Kommentar-Karten mit exakten Nutzernamen: Örlando · Vexo_on_MTB 🌲🚲 · Faro_wpt (graue Platzhalter-Avatare, keine erfundenen Profilbilder)
- Kasse zählt symbolisch 300 € → 392 € (46 echte Likes aus Folge 4 × 2 €), Like-Ziel 100; Arena 35 → 43 von 100, Ziel 50
- Abstimmungstafel: „Sollen wir Örlando zum Probetraining einladen?“ JA/NEIN
- Testbilder: `data/renders/ep-005-stills/`

## Noch zu tun (nächste Sitzung mit funktionierendem Speko)
1. Rosa: mehrere deutsche Frauenstimmen testen (Annika als Referenz + Alternativen), Messung `scripts/voice_check.py` + Spracherkennung, Auswahl festschreiben
2. 22 Zeilen erzeugen → `scripts/import-voice.sh`, Tonhöhen-/Text-Prüfung
3. Länge prüfen (Schätzung ≈ 75–82 s; Ziel 65–75 s, ggf. atempo bis 1,15)
4. `npm run render -- ep-005`, technische Prüfung, veröffentlichen, `npx tsx scripts/projektdateien.ts`

## Erst beim Veröffentlichen gebucht (bereits im Drehbuch hinterlegt)
Follower 43 · Likes Folge 4: 46 → +92 € symbolisch · Kennzahlen Folge 4 (842 Aufrufe) · Angebote o-001 (Faro_wpt, angepasst), o-003 (Vexo_on_MTB, „Bestätigt“ geschrieben, nicht geliefert) · Abstimmung d-005 Örlando · Countdown bleibt bei 4 Tagen.
