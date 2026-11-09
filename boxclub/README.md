# BOXCLUB – Serienstudio für eine fortlaufende animierte Boxclub-Serie

Eine lauffähige Produktionsumgebung (Next.js + TypeScript + Remotion + FFmpeg) für eine
deutschsprachige 9:16-Kurzvideo-Serie über den **Boxclub Rostfaust** in Kranstadt.
Jede Folge baut auf dem gespeicherten Seriengedächtnis auf; die Community entscheidet am Ende
jeder Folge, wie es weitergeht.

```
Dashboard → Abstimmung eintragen → „Neue Episode erstellen“ → Drehbuch prüfen/anpassen
→ Vertonen → MP4 rendern → Veröffentlichen (Seriengedächtnis wird fortgeschrieben)
```

---

## 1. Schnellstart

Voraussetzungen: **Node.js ≥ 20**, **FFmpeg/ffprobe** im `PATH`. Chrome lädt Remotion beim ersten
Rendern selbst herunter (oder `REMOTION_BROWSER` setzen).

```bash
cd boxclub
npm install
npm run seed          # legt die Startwelt + Folge 1 an (nur beim ersten Mal nötig)
cp .env.example .env.local   # optional: API-Schlüssel eintragen
npm run dev           # → http://localhost:3000
```

Ohne Schlüssel läuft alles im **Demo-Modus**: regelbasierter Drehbuchautor, Brabbelstimme statt
echter Stimmen, Musik und Geräusche werden lokal synthetisiert. Rendern funktioniert immer.

## 2. Bedienung (Produktionsablauf)

| Schritt | Wo | Was passiert |
|---|---|---|
| 1 | **Dashboard** | lädt automatisch den letzten Stand: Folgen, Kasse, Mitglieder, offene Abstimmung, Cliffhanger |
| 2 | **Episoden-Generator** → Schritt 1 | Ergebnis der letzten Abstimmung eintragen (Gewinner + Stimmen, optional Top-Kommentare) |
| 3 | **Episoden-Generator** → Schritt 2 | eigene Ideen notieren, Autor wählen, **„Neue Episode erstellen“** |
| 4 | **Episode** (Editor) | Live-Vorschau im Player; Szenen, Kamera, Musik, Dialoge, Emotionen, Aktionen, Geräusche, Besetzung, Entscheidung und Zustandsänderungen bearbeiten → *Speichern* |
| 5 | Editor → **Vertonen** | erzeugt pro Dialogzeile eine Sprachdatei (ElevenLabs/OpenAI); geänderte Zeilen werden automatisch neu vertont |
| 6 | Editor → **MP4 rendern** | 1080×1920, 30 fps, H.264 CRF 18, AAC 192 k, −14 LUFS, Faststart; Fortschrittsbalken |
| 7 | Editor → **Veröffentlichen** | Konsistenzprüfung → Zustandsänderungen anwenden → Figuren sperren → neue Abstimmung → Sicherungspunkt |
| 8 | **Videoarchiv** | alle Folgen mit Nummer, Titel, Datum, Vorschau, MP4-Download und Social-Text |

Veröffentliche eine Folge in der App erst, wenn du sie wirklich gepostet hast – ab dann ist sie
Teil der Geschichte. Die letzte Veröffentlichung lässt sich unter **Boxclub → Sicherungspunkte**
zurücknehmen.

## 3. API-Schlüssel und Anbieter

Alle Anbieter sind optional und austauschbar (`src/lib/providers/`). Eintragen in `.env.local`,
danach den Server neu starten. Status unter **Einstellungen**.

| Variable | Wofür | Wo bekommen | Verwendeter Endpunkt |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | KI-Drehbuchautor (Fortsetzungen) | console.anthropic.com → *API Keys* | Messages API über `@anthropic-ai/sdk`, Modell `claude-opus-5-5`, strukturierte JSON-Ausgabe |
| `ELEVENLABS_API_KEY` | deutsche Sprecherstimmen (empfohlen) | elevenlabs.io → *Profil → API Keys* | `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` (Header `xi-api-key`) |
| `OPENAI_API_KEY` | alternative Stimmen + KI-Konzeptbilder | platform.openai.com → *API keys* | `POST /v1/audio/speech` (`gpt-4o-mini-tts`), `POST /v1/images/generations` (`gpt-image-1`) |

**ElevenLabs-Stimmen:** Jede Figur hat in der Charakterverwaltung eine feste Voice-ID. Vorbelegt
sind echte ElevenLabs-Stimmen: Günther = „Thomas“ (`5faieqDE3osz75KiOI2M`, deutsch), Rosa =
„Rhea“ (`le3O97c6UClnRdpxkDTb`, deutsch), Emre = „Roman“ (`1YST1S3BrkT7E0wcLKQD`, deutsch), Paule =
„Daniel – Lehrer“ (`6i9HBATmN8DhZRFTlPOK`), Bruno = „Brian“, Nico = „Callum“, Viktor = „Eric“ (mehrsprachig).
Ob eine Stimme in deinem ElevenLabs-Konto verfügbar ist, siehst du in der Voice Library; ggf. dort
hinzufügen oder eine eigene ID eintragen. Die Pilotfolge wurde mit diesen Stimmen vorproduziert
(`data/media/episodes/ep-001/voice/`).

**Kosten-Hinweis:** Eine Folge sind ca. 120–150 Wörter (~800 Zeichen TTS) und eine Claude-Anfrage.

**Anbieter erweitern:** neue Funktion mit derselben Signatur in `src/lib/providers/tts.ts` bzw.
`image.ts` ergänzen und in `config.ts` als Option aufnehmen. Der Drehbuchautor ist über
`src/lib/story/generate.ts` austauschbar (Claude und Demo liefern dasselbe Format `Draft`).

## 4. Wie Konsistenz über hunderte Folgen gesichert wird

1. **Figuren werden nicht von einer Bild-KI gemalt**, sondern aus festen Parametern (`look`:
   Hautfarbe, Frisur, Bart, Nase, Statur, Kleidung, Farben, Accessoires) als Vektorgrafik gezeichnet
   (`src/remotion/Character.tsx`). Gleiche Daten → identisches Bild, in jeder Folge.
2. **Aussehen-Sperre:** Sobald eine Figur in einer veröffentlichten Folge auftritt, ist ihr Aussehen
   gesperrt. Änderungen (z. B. neue Vereinsjacke) gehen nur mit Story-Grund und werden protokolliert.
3. **Kulissen** (`src/remotion/Sets.tsx`) sind ebenfalls gezeichnet und hängen vom Vereinszustand ab:
   Hallenzustand → Risse, flackerndes Licht, fehlender Buchstabe am Schild, Wandfarbe; Ausrüstung →
   Anzahl Sandsäcke, Spiegel, Ring; Mitglieder → trainierende Statisten im Hintergrund.
   Die Halle sieht also erst anders aus, wenn sie in der Geschichte renoviert wurde.
4. **Seriengedächtnis** (`data/`): Vereinsstand, Figuren, Orte, alle Folgen, Abstimmungen,
   Handlungsstränge, Kämpfe, Rivalitäten, Sponsoren, Chronik. Nach jeder Veröffentlichung wird ein
   kompletter **Sicherungspunkt** gespeichert (`data/snapshots/`). Alte Folgen werden beim erneuten
   Rendern mit dem damaligen Stand gezeichnet.
5. **Zustandsänderungen nur über Folgen:** Geld, Mitglieder, Status von Figuren, Ausrüstung, Kämpfe
   usw. ändern sich ausschließlich über typisierte Operationen (`stateChanges`) einer Folge
   (oder eine protokollierte Korrekturbuchung).
6. **Konsistenzprüfung** vor dem Veröffentlichen (`src/lib/story/validate.ts`): unbekannte oder
   ausgetretene Figuren, gesperrte Schauplätze, falsche Folgennummer, nicht umgesetzte
   Community-Entscheidung, ungültige Zustandsänderungen → Fehler. Länge außerhalb 35–60 s,
   Kasse im Minus usw. → Warnung. Claude bekommt Fehler zurück und korrigiert sich (bis zu 2 Runden).
7. **Reihenfolge erzwungen:** Neue Folgen entstehen erst, wenn die vorige veröffentlicht und ihr
   Abstimmungsergebnis eingetragen ist.

## 5. Folgenaufbau

Jede Folge hat fünf Beats: **Einstieg** (Hook, 0–5 s) · **Vorstellung** (5–15 s) · **Handlung**
(15–35 s) · **Entwicklung** (35–45 s) · **Entscheidung** (45–60 s, Frage + Cliffhanger).
Am Ende erscheint die Abstimmungstafel (A = rote Ecke, B = blaue Ecke, C = Gold).
Untertitel werden automatisch Wort für Wort aus dem Drehbuch erzeugt, die Kamera folgt dem
jeweiligen Sprecher (Totale, Halbnah, Nah, Schwenk, Zoom, Dolly) mit Parallaxe in drei Ebenen.

## 6. Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Studio starten (http://localhost:3000) |
| `npm run seed` / `npm run seed -- --reset` | Startwelt anlegen / **alles** zurücksetzen |
| `npm run render -- ep-002` | Folge auf der Kommandozeile rendern |
| `npm run stills -- ep-002 2,15,40` | Testbilder einzelner Sekunden (`data/renders/…-stills/`) |
| `npm run bibel` | visuelle Charakterbibel erzeugen (`docs/CHARAKTERBIBEL.md` + PNGs) |
| `npm run test:flow` | End-to-End-Test über 8 Folgen auf einer Datenkopie (`-- claude` mit KI) |
| `npm run studio` | Remotion Studio (Komposition direkt bearbeiten) |
| `npm run typecheck` | TypeScript-Prüfung |

Rendern dauert auf einem 4-Kern-Rechner ohne GPU ca. 10–15 Minuten pro 60-s-Folge.

## 7. Projektstruktur

```
src/lib/types.ts          Datenmodell (Zod) – Figuren, Verein, Folgen, Zustandsänderungen
src/lib/store.ts          JSON-Speicher (atomar), Sicherungspunkte
src/lib/story/            Kontext, Claude-Autor, Demo-Autor, Konsistenzprüfung, Anwenden
src/lib/providers/        Anbieter-Konfiguration, TTS (ElevenLabs/OpenAI), Bild-KI (OpenAI)
src/lib/audio/synth.ts    Musik-Loops (5 Stimmungen), 13 Geräusche, Demo-Stimme
src/lib/service.ts        Veröffentlichen, Abstimmungen, Vertonen, Render-Jobs
src/remotion/             Figuren-Rig, Kulissen, Folgen-Komposition, Charakterblatt
src/app/                  Next.js-Oberfläche + API-Routen
src/seed/                 Startwelt (Serienbibel) und Pilotfolge
scripts/                  seed, render, stills, bibel, test-flow, import-voice
data/                     Seriengedächtnis + Medien (Stimmen, Videos)
```

## 8. Hinweise

- **Remotion-Lizenz:** kostenlos für Einzelpersonen und Firmen bis 3 Mitarbeiter, sonst
  Firmenlizenz (remotion.dev/license).
- **Referenzvideo:** Im Repository lag kein Video; Stil und Aufbau folgen deiner schriftlichen
  Beschreibung (2D/2.5D-Cartoon, klare Konturen, Kamerabewegung, Hook → Entscheidung).
- Bild-KI ist bewusst nur für Konzeptbilder/Thumbnails angebunden – für die Animation selbst würde
  sie die geforderte Konsistenz über hunderte Folgen nicht garantieren.
