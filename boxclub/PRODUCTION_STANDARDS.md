# PRODUCTION STANDARDS – Boxclub Rostfaust

## Format
- 9:16, 1080 × 1920, 30 fps, H.264 (CRF 18), AAC 256 kbit/s, 48 kHz, `+faststart`.
- **Safe-Zone:** wichtige Texte nicht in den unteren ~300 px und rechten ~150 px (TikTok-Bedienelemente).
  Untertitel: Mitte bei y ≈ 1255–1400, rechts 140 px frei. Einblendungen oben (y ≈ 300).
- Länge nach Geschichte (meist 30–60 s), nie künstlich strecken.

## Animation (unverändert seit Folge 1)
- Figuren ausschließlich aus dem parametrischen Rig (`src/remotion/Character.tsx`) – identische Optik.
- Kulissen aus `src/remotion/Sets.tsx`, abhängig vom gespeicherten Vereinszustand.
- Kamera: Totale/Halbnah/Nah/Schwenk/Zoom/Dolly mit Parallaxe, Handkamera-Wackler, Wischschnitt.
- Requisiten pro Szene (`props`, z. B. Sandsack schwingt/reißt ab), Daueraktionen (`cast.action`).
- Lippenbewegung während der Zeile, Blinzeln, Atmen, Emotion + Geste je Zeile.
- Wenn der Hook visuell ist: Totale verwenden, damit der Folgentitel die Aktion nicht verdeckt.
- Zeigt der Hook selbst Text (z. B. Kommentar-Karte): `titleCard: 'klein'` (kompakter Titel unter dem Logo).
- Einblendungen: Kommentar-Karte (`comment`, anonym, „noch nicht bestätigt“), Arena-Zähler mit Ziel (`seats.goal`),
  Vereinskasse (`kasse`, nur gespeicherter Stand + Like-Regel, keine erfundenen Zahlen), Traumsequenz (`fx: 'traum'`).

## Audio (seit Folge 3: eigener Mischer `scripts/mix.py`)
| Spur | Regel |
|---|---|
| Sprache | jede Zeile auf aktiven RMS −18 dBFS normalisiert, Spitzen per Begrenzer ≤ −3,5 dBFS (Ziel: −6 … −3 dBFS) |
| Musik | Grundpegel ≈ −27 dBFS RMS, unter Sprache automatisch −10 dB (Ducking, 80 ms an / 350 ms ab) |
| Geräusche | feste Zielspitzen je Effekt (z. B. Glocke −15, Kasse −17, Aufprall −9 dBFS); in Sprache zusätzlich −6 dB |
| Atmosphäre | dezentes Hallenrauschen −42 dBFS in Halle/Ring/Umkleide |
| Master | True-Peak-Begrenzer (4× Überabtastung) −1,5 dBTP; Kontrolle nach AAC: ≤ −1 dBTP |
- Jeder Export schreibt `data/renders/<id>-master-bericht.json` (Spitzen, Musikabstand, SFX-Pegel).
- **Keine Hörkontrolle** durch die KI möglich – nur Messungen. Hörkontrolle durch den Produzenten.

## Stimmen
- Erzeugung über Speko: Günther/Paule/Emre ElevenLabs `eleven_v3`; **Rosa: Inworld `inworld-tts-2`, Stimme „Annika“** (ohne Regie-Tags). Siehe CHARACTERS_AND_VOICES.md.
- Stimmauswahl neuer Figuren: nur deutsche Muttersprachler-Stimmen bzw. Akzent-Angabe prüfen; Messung mit `scripts/voice_check.py` (Tonhöhe, Anteil Tonlage, Sprünge) + Spracherkennung.
- Ausreißer neu erzeugen: Zeilen, deren Tonhöhe deutlich vom Figuren-Median abweicht (z. B. Emre > 165 Hz), ohne Stimmungs-Tag neu generieren.
- Prüfung je Zeile: Grundtonhöhe (`scripts/pitch.py`, männlich < 160 Hz) und Spracherkennung → Abgleich mit Untertitel.
- Tempo darf tonhöhenneutral angepasst werden (atempo 1,0–1,15), Pausen innerhalb der Zeile ≤ 0,25 s.

## Qualitätskontrolle vor Export (Checkliste)
Hook in den ersten Sekunden · verständliche Handlung · Spannungsbogen · Figuren korrekt ·
Stimmen = Referenz (Paule männlich, Rosa klar & selbstbewusst) · Dialoge verständlich ·
Musik/SFX ausgewogen (Bericht) · Untertitel = gesprochener Text · Format · Grund für nächste Folge ·
genau eine klare Community-Aktion. Interne Bewertung 1–10 je Bereich (keine Reichweitenprognose).

## Produktionsablauf (im Chat)
1. Projektdateien lesen → 2. Hook-Ideen (3) → 3. Drehbuch `src/drehbuecher/folge-XXX.ts` →
4. `npx tsx scripts/drehbuch.ts folge-XXX` + Konsistenzprüfung → 5. Testbilder (`npm run stills`) →
6. Stimmen erzeugen + prüfen (`scripts/import-voice.sh`, `scripts/pitch.py`, Spracherkennung) →
7. `npm run render -- ep-XXX` (Video + Mischer + Bericht) → 8. Technische Prüfung →
9. Veröffentlichen (Seriengedächtnis) → 10. `npx tsx scripts/projektdateien.ts`.
