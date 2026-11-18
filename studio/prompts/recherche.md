Recherchiere gründlich für eine Folge über: {THEMA}

Vorgehen:
1. Suche mehrere unabhängige, seriöse Quellen (Lexika, Archive, Behörden, Fachartikel, große Medien). Rufe die wichtigsten Seiten ab.
2. Prüfe alle Schlüsseldaten gegeneinander: Datum, Ort, Namen, Zahlen, Ablauf, Ausgang.
3. Markiere Abweichungen zwischen Quellen und entscheide dich für die am besten belegte Angabe – oder formuliere vorsichtig („rund“, „etwa“, „laut Berichten“).
4. Sammle überraschende, wenig bekannte, aber belegte Details (die machen das Video stark).

Antworte als JSON:
```json
{
 "thema": "…",
 "kurzfassung": "5–8 Sätze, was wirklich geschah",
 "zeitleiste": [{"wann": "…", "was": "…"}],
 "fakten": [{"aussage": "…", "belegt_durch": ["URL", "URL"], "sicher": true}],
 "abweichungen": ["Quelle A sagt X, Quelle B sagt Y → wir sagen …"],
 "starke_details": ["…"],
 "offene_fragen": ["was nicht sicher belegt ist und deshalb NICHT als Tatsache erzählt werden darf"],
 "quellen": [{"titel": "…", "url": "…"}]
}
```
