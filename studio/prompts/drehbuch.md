Schreibe das vollständige Drehbuch für eine neue Folge.

THEMA UND RECHERCHE (nur diese Fakten als Tatsachen verwenden):
{RECHERCHE}

AUFBAU (verbindlich):
1. hook (1 Szene, max. 12 Wörter, 0–3 s): extrem starke Aussage, die sofort neugierig macht. Kein „Heute erzähle ich…“.
2. einleitung: Ausgangssituation in wenigen Sätzen klarmachen (wer, wo, wann).
3. spannung: neue Informationen, unerwartete Entwicklungen, Eskalation. Alle 5–8 Sekunden ein neuer Informationshappen.
4. wendung: überraschende Erkenntnis oder Eskalation – besonders eindrucksvoll inszenieren (Effekt + Geräusch + zoom_schock/vertigo).
5. aufloesung: verständlich und befriedigend abschließen, gern mit einem letzten überraschenden Fakt.
6. outro (1 Szene): kurze natürliche Frage an die Zuschauer, die zum Kommentieren anregt (z. B. „Hättest du …?“).

LÄNGE (verbindlich): Gesamter Erzähltext {MIN_W}–{MAX_W} Wörter (≈ 75–110 s). Unter {MIN_W} Wörtern ist das Video zu kurz. Nicht künstlich strecken – lieber mehr belegte Details.
SZENEN: 18–30 Szenen, jede mit 6–24 gesprochenen Wörtern (1–2 kurze Sätze). Jede Szene hat einen eigenen visuellen Mehrwert.

SPRECHTEXT:
- Für Sprachausgabe geschrieben: Zahlen als Ziffern erlaubt (1963, 129), aber keine Abkürzungen (schreibe „zum Beispiel“, „Kilometer“).
- ElevenLabs-v3-Regieanweisungen in eckigen Klammern sind erlaubt und erwünscht, sparsam: [whispers], [quietly], [dramatic pause] – sie werden nicht als Untertitel angezeigt.
- „hervorheben“: 1–2 Schlüsselwörter pro Szene, die im Untertitel GELB erscheinen (exakt wie im Text geschrieben).

VISUELLER BAUKASTEN (nur diese Werte verwenden):
{BAUKASTEN}

FIGUREN: Lege jede Figur EINMAL unter „figuren“ an (id → Aussehen). Gleiche id = immer gleiches Aussehen (Konsistenz).
Felder: typ (mann|frau|kind), outfit, haut (Hex), haare (Hex), frisur (kurz|lang|glatze|zopf|locken), bart (true/false), brille, augen (Hex), oberteil/hose (Hex, optional), kopf (helm|muetze|kappe|hut|null), helmFarbe, lampe (Helmlampe true/false), dreck (0–1).

SZENEN-REGIE:
- figuren: [{"id", "mark" (Standort) ODER "von"+"nach" (Weg), "aktion", "ausdruck", "blick" ("kamera"|"weg"|"zu:<id>"|"links"|"rechts"), optional "aktion2"+"ab2" (Aktionswechsel nach Sekunden), "lampe" (0–1)}]
  Marken: mitte, links, rechts, vorne, hinten, fern (+ je nach Ort: eingang, ende, turm, halle, tor, tisch, fenster, wand, bug, reling, lichtung, gehweg, maschine)
  Im stollen/tunnel verläuft der Gang von „vorne“ (Kamera) nach „hinten“/„fern“/„ende“.
- kamera: Liste von 1–3 Einstellungen pro Szene, z. B. ["totale", "gesicht"] oder [{"kamera": "detail", "ziel": "prop:zettel"}]. Optional "yaw" (Blickwinkel in Bogenmaß, 0 = frontal), "ziel" (Figuren-id). Wechsle häufig die Perspektive!
- requisiten: [{"name", "pos" (Marke oder [x,y,z]), optional "anim": hochziehen|herablassen|fahren|schweben|wackeln, "text" (bei zettel/schild, Zeilen mit |)}]
- effekte: ["flackern"] oder [{"name": "flut", "farbe": "schlamm"|"wasser", "welle": true, "von": 0, "bis": 1.2}], {"name":"lichtstrahl","pos":[0,2.6,0]}, {"name":"explosion","pos":[0,0,-8]} …
- licht: 0–1 (Grundhelligkeit der Lampen am Ort, 0.3 = fast dunkel), stimmung, uebergang, einblendung {"art": "datum"|"ort"|"zahl"|"zitat", "text", "sub"}
- geraeusche: zusätzliche Sounds zu dieser Szene (Effekte/Übergänge haben automatisch passende Sounds)
- pause_danach: optionale Sprechpause in Sekunden nach der Szene (0.3–1.0) für dramatische Momente

Antworte NUR mit JSON:
```json
{
 "titel": "Kurzer, starker Videotitel (max. 60 Zeichen)",
 "slug": "kebab-case",
 "thema": "…", "kategorie": "…", "wahre_geschichte": true,
 "hook_text": "3–5 WORTE ALS SCHLAGZEILE IM BILD",
 "figuren": {"herbst": {"typ": "mann", "outfit": "bergmann", "haut": "#d8a888", "haare": "#2a1f18", "bart": true}},
 "szenen": [
  {"teil": "hook", "text": "…", "hervorheben": ["…"], "ort": "stollen", "zeit": "nacht", "wetter": "klar", "stimmung": "schock",
   "figuren": [{"id": "herbst", "mark": "mitte", "aktion": "kauern", "ausdruck": "angst", "blick": "kamera"}],
   "kamera": ["zoom_schock"], "effekte": [], "requisiten": [], "geraeusche": ["einschlag"], "uebergang": "schnitt"}
 ],
 "outro_frage": "Hättest du durchgehalten?",
 "fakten_im_video": [{"aussage": "…", "quelle": "URL"}],
 "dramatisierung": ["Was nachgestellt/ausgeschmückt ist"],
 "quellen": [{"titel": "…", "url": "…"}],
 "beschreibung": "TikTok-Beschreibung, 1–3 Sätze, neugierig machend, mit Frage",
 "hashtags": ["#…"],
 "zusammenfassung": "3–5 Sätze"
}
```
