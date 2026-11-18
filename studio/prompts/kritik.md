Du bist ein strenger Lektor und Faktenprüfer. Prüfe dieses Drehbuch:

{DREHBUCH}

Recherche-Grundlage:
{RECHERCHE}

Prüfe:
1. Stimmen alle Tatsachenbehauptungen mit der Recherche überein? Wird irgendetwas erfunden (Namen, Zahlen, Zitate, Abläufe)?
2. Rechtschreibung, Grammatik, Zeichensetzung (Deutsch). Natürlich sprechbar?
3. Hook stark genug? Spannungsbogen ohne Durchhänger? Wiederholungen? Ist die Geschichte vollständig und verständlich?
4. Passen Bilder (Ort, Figuren, Aktionen, Kamera, Effekte) zum jeweils gesprochenen Satz?
5. Gesamtlänge {MIN_W}–{MAX_W} Wörter?

Antworte als JSON:
```json
{"ok": true, "fehler": ["konkrete Probleme, die behoben werden MÜSSEN"], "verbesserungen": ["optionale Vorschläge"], "drehbuch": { …korrigiertes vollständiges Drehbuch, falls nicht ok… }}
```
