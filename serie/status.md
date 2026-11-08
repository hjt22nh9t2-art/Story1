# Status – Der Leuchtturm von Nebelsand

## Fortschritt
| Teil | Titel | Status |
|---|---|---|
| 1 | Die Ankunft | ✅ fertig (`teil_01/teil_01.mp4`) |
| 2 | Die Spuren | ✅ fertig (`teil_02/teil_02.mp4`) |
| 3 | Das Funkgerät | ⏳ wartet auf „Weiter mit Teil 3“ |
| 4–10 | – | offen |

## Stimme (für alle Teile beibehalten)
- **Dienst:** Speko `audio.synthesize`, geroutet zu ElevenLabs
- **Stimme:** „Thomas – Authentic & Natural“ (deutsch, männlich), Voice-ID `5faieqDE3osz75KiOI2M`
- **Modell:** `eleven_v3_conversational`, `intent.language = "de"`, `optimizeFor = "accuracy"`
- **Stil:** Audio-Tags `[whispers]` (Hook, Logbuch-Satz, Cliffhanger) und `[quietly]` (Rest). Pausen mit „…“
- **Arbeitsweise:** Den gesamten Erzähltext in EINEM Take erzeugen (gleichbleibende Stimmfarbe). Danach mit `audio.transcribe` (`word_timestamps: true`, `language: de`) die Wortzeiten holen und an Pausen schneiden. Schnittpunkte stehen in `teil_XX/timing.json`.
- **Pegel:** Stimme ≈ −19 dBFS RMS (gesprochen), Musik/Drone ≈ 18 dB darunter, Master −14 LUFS / −1,5 dBTP

## Look (fix)
- Nebel `FogExp2` Farbe `#163a42`, Dichte 0.016–0.026; Hintergrund `#10303a`
- Mond `#5f8fa8` (Richtungslicht 2.2) + Hemisphäre `#5f93a0`/`#0c1618` (1.1) + Fill `#3d7080` (0.9)
- Lampenlicht nur Orange: `#ffa04a` / heiß `#ffd29a`; Leuchtfeuer-Kegel `#ffc68a`, eine Umdrehung pro 9 s
- Post: ACES-Tonemapping, Bloom 0.55 (Schwelle 0.78), Split-Toning (Schatten Blaugrün), 12 % entsättigt, Vignette, leichte chromatische Aberration
- Filmkorn wird NICHT eingerendert, sondern beim Export mit `noise=c0s=3:c0f=t` (ffmpeg) aufgelegt. Eingerendertes Pixelkorn hätte 544 MB pro Minute ergeben, und Entrauschen erzeugt Geisterschrift bei Untertiteln
- Kamera: Handkamera-Wackler über `handheld()` in `assets/lib.js`, vertikales FOV 34–62°
- Untertitel: Montserrat 900, 84 px, weiß mit schwarzem Rand (17 % der Schriftgröße), aktives Wort orange `#ffb04a`, max. 3 Wörter pro Einblendung, Mitte bei y = 1410 px. Frei bleiben unten 250 px und rechts 150 px
- Titel: Anton 180 px „TEIL X/10“ + Serienname Montserrat 800 34 px, 0–3 s
- Endtafel: „FOLGE FÜR TEIL X+1 👁“ + Frage + „Schreib’s in die Kommentare“

## Figuren & Orte (Koordinaten in `assets/world.js` → `SPOTS`)
- Turm (−2, −3), Haus (7, 5), Steg x = −5 von z = 15 bis 33, Wrack (38, −34)
- Jonas: `createJonas()`, Jacke `#1f4a33`, Mütze `#6d6f72`. Doppelgänger: `createJonas({ wet: true })` mit Tropfen
- Die Ertrunkenen: `createDrowned(seed)`, Silhouette hinter Milchglas über `hallway.update({ figure })`

## Technik
- Blender ist nicht installiert, deshalb **Three.js 0.170** + headless Chromium (Playwright, SwiftShader). Frames gehen per JPEG an ffmpeg
- Rendern: `cd serie && npm i && node render.mjs teil_01 --workers 3` (≈ 45 min für 60 s)
- Testbilder: `node render.mjs teil_01 --stills 1,12.5,30` · Cover: `node render.mjs teil_01 --cover teil_01/cover.png`
- Ton: `python3 teil_01/mix.py` (numpy/scipy, alle Geräusche prozedural in `assets/sound/sfx.py`)
- Export: `bash teil_01/export.sh` → H.264 `-crf 18 -preset veryfast`, AAC 192 kbps, `-movflags +faststart`
- Mastering: KEIN dynamisches `loudnorm` (es hebt die Stille vor dem Schreck an). Stattdessen feste Verstärkung, 15 ms Einblendung, Limiter mit 4-fachem Oversampling → ≈ −14,8 LUFS / −1,4 dBTP

## Neu in Teil 2 (wiederverwendbar)
- `assets/props.js`: `createFootprints(path)` (nasse Barfuß-Abdrücke, L/R gespiegelt), `createStairPrints`, `createPuddle`
- `assets/interior.js`: Flur mit Treppe (12 Stufen), Türöffnung mit Nebel dahinter (`doorOpen`); `createBedroom()` mit Absatz, Bett (Decke mit `dent`/`stain`), Wecker auf 3:33, Fenster mit Mondlicht
- `figures.js`: volumetrischer Taschenlampen-Kegel (`holdTorch(on, cone)`)
- `sfx.py`: `creak`, `latch`, `fabric`
- Rückblick-Look: `exposure 0.9, chroma 2.2, flicker 0.12, vignette 1.4` + Tafel „WAS BISHER GESCHAH“
- Achtung: Im Wachraum `room.update(t, { beam: 0 })` setzen, wenn kein Leuchtfeuer-Streiflicht gewünscht ist (sonst weißer Blitz alle 9 s)
- Taschenlampen-Spots innen: Intensität 6–30 (darüber brennt das Bild aus); Spuren draußen mit `lift: 0.07`

## Für Teil 3 verbessern
- Funkgerät-Nahaufnahmen mit animierter Skala/Nadel, Stimmenverzerrung (Funk-Filter) für den Fischer
- Bett-Delle im Cliffhanger deutlicher (Decke heller, Seitenlicht)
- Mehr Kamerabewegung bei Dialog-Momenten
