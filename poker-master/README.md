# POKER MASTER – Die interaktive Poker-Akademie

*Vom Anfänger zum Poker-Profi.* Eine vollständig interaktive Web-App, die Texas Hold’em von den Regeln bis zu GTO und Exploitative Play beibringt.

## Starten

Keine Installation, kein Build-Schritt. Entweder `index.html` direkt im Browser öffnen oder lokal servieren:

```bash
cd poker-master
python3 -m http.server 8000   # dann http://localhost:8000 öffnen
```

Der Fortschritt wird lokal im Browser gespeichert (`localStorage`) und kann unter *Einstellungen* als JSON exportiert und importiert werden.

## Funktionen

| Bereich | Inhalt |
|---|---|
| **Dashboard** | Poker-Level (1–7), Gesamtfortschritt, Lektionen, Tagesserie, Trainingszeit, richtige/falsche Entscheidungen, Schwächen & Stärken, Tagesziele, empfohlene nächste Lektion, 18 Erfolge |
| **Poker lernen** | 10 Module, 26 Lektionen mit Erklärungen, interaktiven Tisch-Demos, Range-Matrizen, Equity-Simulationen, Lernkontrolle pro Lektion und Abschlusstest pro Modul (≥ 80 %) |
| **Training** | 19 Aufgaben-Generatoren mit unbegrenzt vielen Aufgaben, adaptives Smart-Training (Schwächen werden häufiger abgefragt), Skill-Training, Fehler-Wiederholung |
| **Simulator** | 6-max No-Limit Hold’em gegen 5 Bots (TAG, LAG, Nit, Calling Station, Maniac), Side Pots, Live-Coach bewertet jede Entscheidung (Ranges, Equity vs. Pot Odds), Hinweis-Funktion, Hand-Verlauf |
| **Strategie** | Preflop-Charts, Equity-Rechner, Postflop-Leitfaden, Spielertypen & Exploits, häufigste Fehler |
| **GTO-Trainer** | Range-Builder mit Auswertung, Preflop-Drill, MDF-/Bluff-Ratio-Drills, Indifferenz-Labor |
| **Statistiken** | Genauigkeit je Fähigkeit, Simulator-Ergebnisverlauf, VPIP/PFR, Aktivität der letzten 14 Tage, Modulergebnisse |
| **Glossar** | ~95 Begriffe mit Suche |

### Levelsystem

Das Poker-Level steigt **nur durch bestandene Abschlusstests**, nicht durch XP:

1. Anfänger → 2. Grundlagen beherrschen (Module 1+2) → 3. Fortgeschrittener (3+4) → 4. Strategischer Spieler (5+6) → 5. Advanced (7+8) → 6. Expert (9) → 7. Master (10 **plus** 150 analysierte Simulator-Entscheidungen mit ≥ 70 % Coach-Quote).

Module und Lektionen werden nacheinander freigeschaltet. XP sind eine zusätzliche Motivationsstufe.

## Architektur

```
poker-master/
  index.html          App-Shell
  css/styles.css      Design (Anthrazit, Pokergrün, Gold), responsive
  js/poker.js         Karten, 7-Karten-Handbewertung, Vergleich & Erklärung, Equity (Monte Carlo), Outs, Boardtextur, Range-Parser
  js/ranges.js        Preflop-Referenz-Ranges (RFI, vs. Open, vs. 3-Bet)
  js/engine.js        NLHE-Spiel-Engine (Blinds, Min-Raise, All-in, Side Pots, Showdown)
  js/ai.js            Bot-Spielertypen und Coach-Bewertung
  js/store.js         Persistenz (versioniertes Schema, Migration, Export/Import), XP, Skills, Fehlerprotokoll
  js/curriculum.js    Lehrplan (Level, Module, Lektionen, Quizfragen)
  js/progress.js      Freischaltungen, Level, Erfolge, Tagesziele
  js/exercises.js     Aufgaben-Generatoren
  js/ui.js            UI-Bausteine (Karten, Quiz-Runner, Demos, Range-Matrix)
  js/views/*.js       Ansichten
  tests/*.test.js     Tests für Handbewertung, Equity, Outs, Ranges und Engine
```

## Tests

```bash
node tests/poker.test.js
node tests/engine.test.js
```
