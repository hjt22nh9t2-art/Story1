# SERIES BIBLE – Boxclub Rostfaust

> Verbindliche Grundlage für jede Folge. **Vor jeder neuen Folge lesen**, danach `series_state.json`,
> `CHARACTERS_AND_VOICES.md`, `EPISODE_LOG.md` und `PRODUCTION_STANDARDS.md`.
> Maschinenlesbare Quelle der Wahrheit: `data/` (club.json, characters.json, episodes/, snapshots/).

## Prämisse
Kranstadt, eine raue Hafen- und Industriestadt im Ruhrgebiet-Stil. Günther Wallach (63) belebt den
**Boxclub Rostfaust** seines verstorbenen Vaters (gegründet 1961) in einer alten Straßenbahn-Depothalle
(Depotstraße 7) wieder. Wenig Geld, große Träume. Ziel: langfristig der größte Boxverein der Stadt.
Die Zuschauer erleben, wie aus einem heruntergekommenen Club ein erfolgreicher Verein wird – **langsam
und realistisch** (Training → Sparring → Schaukampf → Amateurkämpfe → Turniere …).

## Ton
Humorvolle Vereinsgeschichte + Sportdoku + spannende Serie. Trockener Ruhrpott-Humor, echte Gefühle,
Rückschläge. Nicht kindlich. Nicht jede Folge braucht einen Kampf.

## Feste Regeln (Kontinuität)
1. Figuren sehen immer gleich aus (parametrisches Rig, `data/characters.json` → `look`). Aussehen ist nach
   dem ersten Auftritt gesperrt; Änderungen nur mit Story-Grund (wird protokolliert).
2. Stimmen sind fest (siehe `CHARACTERS_AND_VOICES.md`). **Keine Stimmänderung ohne ausdrückliche
   Zustimmung des Produzenten.** **Ab Folge 5 (mit Zustimmung
   des Produzenten neu besetzt):** Günther = Inworld „Reinhard“, Paule = Speechify „Henrik“ (männlich, tief),
   Emre = Microsoft „Klaus“ (männlich), Rosa = Alibaba „Katerina“ (eindeutig weiblich, per Hörprobe gewählt).
3. Geld, Mitglieder, Ausrüstung, Kämpfe, Arena-Plätze ändern sich **nur** über Zustandsänderungen einer
   Folge. Zahlen im Dialog müssen exakt zum gespeicherten Stand passen.
4. Keine erfundenen Einnahmen/Ausgaben, Ereignisse oder Performance-Zahlen. Fehlende Informationen
   werden als „offen/unbekannt“ markiert.
5. Community-Entscheidungen werden in der Folge nach der Ergebnismeldung **sichtbar** umgesetzt.
6. Die Halle verändert sich nur, wenn die Geschichte es begründet (z. B. Renovierung, abgerissener Sandsack).

## Community-Mechaniken (spielerisch – keine echten TikTok-Einnahmen)
| Mechanik | Bedeutung | seit |
|---|---|---|
| **Follower = Arena-Platz** | 1 neuer Follower = 1 symbolisch besetzter Platz in der Kranstadt Arena (100 Plätze) | Folge 2 |
| **Like = 2 €** | 1 Like = 2 € symbolisch für die Vereinskasse. Wird erst gebucht, wenn der Produzent eine **genaue** Like-Zahl meldet (Schätzungen werden nicht gebucht). In der Serie eingeführt in Folge 4. | festgelegt vor Folge 3 |
| **Kommentare = Entscheidungen** | Abstimmung A/B/(C/D) in den Kommentaren, Ergebnis meldet der Produzent | Folge 1 |
Pro Folge **eine** Hauptaufforderung zur Interaktion.

## Angebote aus Kommentaren (seit Folge 4)
Zuschauer-Kommentare mit Sponsoring-/Spendenangeboten werden als **unbestätigte Angebote** dargestellt
(Kommentar-Karte mit Hinweis „Noch nicht bestätigt“) und in `series_state.json → offeneAngebote` geführt.
Erst eine echte Bestätigung durch den Produzenten ändert ihren Status. Story-Bedingungen (z. B. „erst ein Sieg“)
sind fiktiv und werden nie einem realen Kommentator zugeschrieben.

## Wiederkehrende Community-Mitglieder (echte TikTok-Nutzer, Namen exakt so schreiben)
| Nutzername | Rolle in der Serie | Stand | seit |
|---|---|---|---|
| **Örlando** | möchte Trainer werden („seit sieben Jahren Kampferfahrung“) | NICHT eingestellt – Abstimmung „Probetraining JA/NEIN“ läuft (d-005) | Folge 5 |
| **Vexo_on_MTB 🌲🚲** | möglicher Ausrüstungssponsor: Sandsäcke, guter Boxring, Pratzen, 10 Paar Handschuhe, Logo-Design; schrieb „Bestätigt“ | Angebot o-003 offen, nichts geliefert | Folge 5 |
| **Faro_wpt** | Unterstützer: 5 Sandsäcke, 3 Pratzen, 4 Paar Handschuhe, Renovierung; später angepasst (weitere Unterstützung, Zahlungen pro Kampf) | Angebot o-001 offen, Details ungeklärt | Folge 4 (anonym), Folge 5 (mit Namen) |
Keine erfundenen Profilbilder/Identitäten: In der Serie erscheinen sie nur als Kommentar-Karten (grauer Platzhalter-Avatar).

## Erzählzeit vs. echte Zeit
Story-Tage (Countdown zum Kampf) und echte Abstimmungsfristen laufen getrennt. Der Kampfabend wird erst erzählt,
wenn die Ausrüstungs-Abstimmung abgeschlossen und umgesetzt ist (Countdown wird bei Bedarf nicht weitergezählt).

## Episodenaufbau (flexibel)
Hook (0–3 s, sofort Aktion/Überraschung) → Problem → Entwicklung → Überraschung → Höhepunkt →
Community-Aktion → Cliffhanger (möglichst Loop zum Anfang). 30–60 s, nie künstlich strecken.

## Schauplätze
Depotstraße (außen) · Die Halle (Ring rot/blau, Sandsäcke, Risse, Plakate von 1987) · Der Ring ·
Empfang · Günthers Büro · Umkleide · **Kranstadt Arena** (100 rote Klappsitze, 5×20, wiederverwendbar) ·
Titan Boxing Gym (Rivale, noch gesperrt).

## Figuren (Kurzfassung – Details in CHARACTERS_AND_VOICES.md)
Günther (Gründer, Optimist) · Rosa (Cheftrainerin, streng & fair) · Paule (Hausmeister/Kassenwart, trocken) ·
Emre (17, erster Boxer) · Bruno (Ex-Profi, **nicht verpflichtet**, Kandidat; Paule kennt ein Geheimnis) ·
Nico (Problemfall, Kandidat, noch nicht aufgetreten) · Viktor Hahn (Rivale, noch nicht aufgetreten).
