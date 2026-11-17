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
| Nutzername | Rolle in der Serie | Serienhandlung | Real (außerhalb der Serie) | seit |
|---|---|---|---|---|
| **Örlando** | möchte BOXtrainer werden („seit sieben Jahren Kampferfahrung“) | nicht eingestellt; Abstimmung d-005 (Probetraining) ohne Ergebnis; F6-Frage: Emres Kampf oder erst Örlandos Probetraining (d-006) | – | Folge 5 |
| **Vexo_on_MTB 🌲🚲** | Ausrüstungssponsor | F6: Lieferung eingetroffen (Handschuhe, Pratzen, Sandsäcke) + **Koffer mit 20.000 € (fiktiv)** | Angebot o-003 offen, nichts bestätigt | Folge 5 |
| **Faro_wpt** | Renovierung + Ausstattung | F6: Renovierung durchgeführt, Ring, Sandsäcke, Pratzen, Handschuhe, Tennisbälle; „kein problem ❤️“. Zahlungen pro Kampf offen (kein Betrag) | Angebot o-001 offen, nichts bestätigt | Folge 4 (anonym), ab F5 mit Namen |
| **Vexo_on_MTB 🌲🚲 (F7)** | Miete + Ring bezahlt, dreimal so große Halle mit Gym, Kurier mit goldenem Koffer (50k) | F7: Umzug in die neue Halle, 50.000 € im goldenen Koffer (fiktiv) | Angebot o-005 offen | Folge 7 |
| **Faro_wpt (F7)** | „und morgen sollten die 40 k ankommen“ + Kommentar „b“ | F7: 40.000 € nur angekündigt | Angebot o-006 offen | Folge 7 |
| **J’** | „ich bin emres sparing partner“ | ab F8 als Figur: Emres Sparringspartner (kein Wettkampfgegner), wiederkehrend | – | Folge 8 |
| **Community-Kommentar** (kein Name sichtbar) | „Jetzt kommt ein Profi und bringt Emre das Boxen bei“ | ab F8: fiktiver Boxtrainer Marek Wolski | – | Folge 8 |
| **Community-Kommentar** (kein Name sichtbar) | Kooperation mit der Marke „IRON“, komplette Boxausrüstung | F8: nur angekündigt (fiktive Marke) | Angebot o-009 offen | Folge 8 |
| **hakir_373 2** | verspricht neue große Halle + Wing-Tsun-Trainer | F6: nur Versprechen/Vorstellung (Traum), noch nicht da | Angebot o-004 offen | Folge 6 |
Keine erfundenen Profilbilder/Identitäten: Kommentatoren erscheinen nur als Kommentar-Karten (grauer Platzhalter-Avatar).
In der Serie umgesetzte Angebote sind **fiktive Handlung**; reale Zahlungen/Lieferungen gelten erst nach Bestätigung durch den Produzenten.

## Konten (ab Folge 7 strikt getrennt – alles Spielelemente, keine echten Einnahmen)
| Konto | Inhalt | Stand nach F7 |
|---|---|---|
| **Vereinskonto (Serie)** | Grundbestand der Geschichte seit Folge 1 | 300 € |
| **Like-Kasse (symbolisch)** | nur echte, genau gemeldete Likes × 2 € (F4: 46, F5: 25, F6: 36) | 214 € |
| **Story-Fonds (fiktiv)** | Koffer aus der Handlung: 20.000 € (F6, Vexo_on_MTB) + 50.000 € goldener Koffer (F7, Vexo_on_MTB) | 70.000 € eingegangen (in der Serie) |
| **Story-Fonds – angekündigt** | 40.000 € von Faro_wpt („und morgen sollten die 40 k ankommen“) | 40.000 € NUR angekündigt |
Laufende Kosten: Miete der Halle übernimmt in der Serie Vexo_on_MTB (ab F7). Reale Zahlungen gelten nie als bestätigt, solange der Produzent sie nicht bestätigt.

## Kampf-Strang (ab Folge 7) – über mehrere Folgen aufbauen
| Schritt | Stand |
|---|---|
| 1. Grundlagen | **läuft (F8):** Stellung, Deckung, Beinarbeit, Jab, Cross bei Coach Wolski |
| 2. Trainingsplanung | **Wolski übernimmt (F8)** |
| 3. Sparringspartner | **J’ (F8)** – erstes kontrolliertes Sparring, Emres Deckung zu tief |
| 4. Technik & Kondition | offen – Community-Abstimmung F8: A Schlagkraft / B Schnelligkeit / C Ausdauer (d-008) |
| 5. Ausrüstungspartner | **IRON** (fiktiv) angekündigt F8, Übergabe ggf. F9 |
| 6. Fortschritt | F9: lässt sich nicht provozieren (charakterlich gewachsen), im Techniktest noch unterlegen |
| 7. Gegner | **F9: „Stahl“ fordert Emre heraus – Emre nimmt an** (keine Vertragsdetails) |
| 8. Ankündigung | offen – Event-Name „Rostfaust Fight Night“, Datum offen |
| 9. Kampftag | offen – Sieger NICHT festgelegt. F10 = direkte Vorbereitung |
Örlando bleibt möglicher BOXtrainer-Kandidat (Abstimmungen d-005/d-006 offen), Sifu bleibt Wing Tsun, Wolski ist Emres Boxtrainer.

## Vom Produzenten genannt, in der Serie noch NICHT erzählt (Stand F9)
Drei neue Profi-Trainer (einer mit UFC-Gürtel), Plakate + Menschenmenge vor dem Club, weitere 100.000 € (alles laut Produzent von Vexo_on_MTB 🌲🚲).
Als offene Angebote o-010 – o-012 gespeichert, 100.000 € nur als „angekündigt“ im Story-Fonds. Können in späteren Folgen eingeführt werden
(Plakate + Menschenmenge passen zur Rostfaust Fight Night).

## IRON (fiktive Marke in der Serie)
Kooperationsangebot über komplette Boxausrüstung (Box- und Trainingshandschuhe, Pratzen, Sandsäcke, Bandagen, Trainingskleidung).
Stand F8: nur angekündigt. Keine echte Partnerschaft mit einem realen Unternehmen behaupten; eigenes, neutrales Schriftbild (kein echtes Logo).

## Erzählzeit vs. echte Zeit
Story-Tage (Countdown zum Kampf) und echte Abstimmungsfristen laufen getrennt. Der Kampfabend wird erst erzählt,
wenn die Ausrüstungs-Abstimmung abgeschlossen und umgesetzt ist (Countdown wird bei Bedarf nicht weitergezählt).

## Episodenaufbau (flexibel)
Hook (0–3 s, sofort Aktion/Überraschung) → Problem → Entwicklung → Überraschung → Höhepunkt →
Community-Aktion → Cliffhanger (möglichst Loop zum Anfang). 30–60 s, nie künstlich strecken.

## Schauplätze
Depotstraße (außen) · Die Halle (Ring rot/blau, Sandsäcke, Risse, Plakate von 1987) · Der Ring ·
Empfang · Günthers Büro · Umkleide · **Kranstadt Arena** (100 rote Klappsitze, 5×20, wiederverwendbar) ·
Titan Boxing Gym (Rivale, noch gesperrt) · **Die große Halle** (Angebot von hakir_373 2, bisher nur als Vorstellung).
**Ab Folge 7: Die neue Halle** (dreimal so groß, Gym-Bereich mit Laufbändern/Hantelbank/Hantelregal, großer Ring, Sandsack-Reihe) – Hauptschauplatz.
**Seit Folge 6 renoviert (alte Halle):** helle Wände, roter ROSTFAUST-Schriftzug, neuer Ring, 5 Sandsäcke, neuer Spiegel, Ausrüstungsregal (Handschuhe, Pratzen, Tennisbälle).

## Figuren (Kurzfassung – Details in CHARACTERS_AND_VOICES.md)
Günther (Gründer, Optimist) · Rosa (Cheftrainerin, streng & fair) · Paule (Hausmeister/Kassenwart, trocken) ·
Emre (17, erster Boxer) · Bruno (Ex-Profi, **nicht verpflichtet**, Kandidat; Paule kennt ein Geheimnis) ·
Nico (Problemfall, Kandidat, noch nicht aufgetreten) · Viktor Hahn (Rivale, noch nicht aufgetreten) ·
**Sifu** (Wing-Tsun-Trainer, Kandidat, ab F6 – KEIN Boxtrainer, NICHT Örlando; spricht noch nicht) ·
**Marek Wolski „Coach Wolski“** (fiktiver Profi-Boxtrainer, ab F8 fest: streng, fair, Grundlagen zuerst; Klemmbrett mit Trainingsplan) ·
**J’** (Emres Sparringspartner, ab F8, aus dem Kommentar von J’) · **Der Kurier** (F7, stumm) ·
**Rico Stahl „Stahl“** (ab F9, unbekannter Herausforderer: selbstbewusst, technisch stark, etwas arrogant, kein Bösewicht; blond, weißes STAHL-Shirt, Stimme xAI „Leo“. In der Serie kennt man bisher nur „Stahl“. Herkunft offen. Wiederkehrend.)
