/* Lehrplan der Poker-Akademie: Level, Module, Lektionen, Quizfragen.
   Abschnittstypen: text | tip | example | cards | demo | ranks | range | potodds | equity | mdf */
(function (root) {
  'use strict';

  const LEVELS = [
    { id: 1, name: 'Anfänger', requires: [], desc: 'Du lernst die Regeln und Hand-Rankings.' },
    { id: 2, name: 'Grundlagen beherrschen', requires: ['m1', 'm2'], desc: 'Regeln und Hand-Rankings sicher beherrscht.' },
    { id: 3, name: 'Fortgeschrittener Spieler', requires: ['m3', 'm4'], desc: 'Solide Preflop-Strategie und Positionsspiel.' },
    { id: 4, name: 'Strategischer Spieler', requires: ['m5', 'm6'], desc: 'Mathematik und Flop-Spiel verstanden.' },
    { id: 5, name: 'Advanced Player', requires: ['m7', 'm8'], desc: 'Turn-/River-Spiel und Range-Denken.' },
    { id: 6, name: 'Expert Level', requires: ['m9'], desc: 'GTO-Grundlagen verinnerlicht.' },
    { id: 7, name: 'Master Level', requires: ['m10'], practice: { decisions: 150, accuracy: 0.7 }, desc: 'Exploitatives Spiel + nachgewiesene Praxis im Simulator (150 analysierte Entscheidungen, ≥ 70 % korrekt).' },
  ];

  const q = (s, text, o, a, e) => ({ s, q: text, o, a, e });

  const MODULES = [
    // ===================================================================== M1
    {
      id: 'm1', num: 1, title: 'Poker-Grundlagen', icon: '♠', level: 1,
      desc: 'Was ist Texas Hold’em? Blinds, Button, Setzrunden und alle Aktionen.',
      gens: ['position'],
      lessons: [
        {
          id: 'm1l1', title: 'Was ist Texas Hold’em?', min: 5,
          sections: [
            { t: 'text', h: '<p><b>Texas Hold’em</b> ist die weltweit populärste Pokervariante. Jeder Spieler erhält <b>zwei verdeckte Karten</b> (Hole Cards). In der Tischmitte werden nach und nach <b>fünf offene Gemeinschaftskarten</b> (Board) aufgedeckt, die alle Spieler nutzen dürfen.</p><p>Ziel ist es, den <b>Pot</b> – alle gesetzten Chips – zu gewinnen. Das geht auf zwei Wegen:</p><ul><li>Du hast im <b>Showdown</b> die beste 5-Karten-Hand.</li><li>Alle anderen Spieler <b>geben auf (folden)</b>, bevor es zum Showdown kommt.</li></ul>' },
            { t: 'cards', rows: [{ label: 'Deine Hole Cards (nur du siehst sie)', cards: ['Ah', 'Kd'] }, { label: 'Board: Flop · Turn · River', cards: ['Kc', '7s', '2h', 'Jd', '9c'] }] },
            { t: 'text', h: '<p>Deine Hand besteht aus den <b>besten fünf Karten</b> aus deinen zwei Hole Cards und den fünf Boardkarten – du darfst beliebig kombinieren, auch nur eine oder sogar keine deiner Hole Cards nutzen.</p><p><b>Spieleranzahl:</b> 2 bis 10 Spieler. Online sehr verbreitet: <b>6-max</b> (bis zu 6 Spieler) – darauf basiert diese Akademie. Mit 2 Spielern spricht man von <b>Heads-up</b>, mit 9–10 von <b>Full Ring</b>.</p>' },
            { t: 'tip', h: 'Poker ist ein Spiel mit unvollständiger Information. Du kennst die Karten der Gegner nicht – gute Spieler treffen trotzdem langfristig profitable Entscheidungen, weil sie in Wahrscheinlichkeiten und Ranges denken.' },
          ],
          quiz: [
            q('rules', 'Wie viele verdeckte Karten erhält jeder Spieler beim Texas Hold’em?', ['1', '2', '4', '5'], 1, 'Jeder Spieler erhält genau zwei Hole Cards.'),
            q('rules', 'Aus wie vielen Karten besteht eine Pokerhand im Showdown?', ['5', '6', '7', '2'], 0, 'Es zählt immer die beste Kombination aus genau fünf Karten.'),
            q('rules', 'Auf welche zwei Arten kannst du den Pot gewinnen?', ['Nur durch die beste Hand', 'Beste Hand im Showdown oder alle anderen folden', 'Durch die meisten Chips', 'Durch den höchsten Einsatz'], 1, 'Du gewinnst entweder im Showdown oder, wenn alle Gegner aufgeben.'),
            q('rules', 'Was bedeutet „6-max“?', ['Maximal 6 Chips Einsatz', 'Höchstens 6 Spieler am Tisch', '6 Setzrunden', '6 Gemeinschaftskarten'], 1, '6-max-Tische haben maximal sechs Spieler.'),
          ],
        },
        {
          id: 'm1l2', title: 'Dealer Button, Small Blind und Big Blind', min: 6,
          sections: [
            { t: 'text', h: '<p>Damit es in jeder Hand etwas zu gewinnen gibt, müssen zwei Spieler <b>Pflichteinsätze</b> leisten, bevor Karten verteilt werden:</p><ul><li><b>Small Blind (SB):</b> sitzt links vom Button und setzt meist einen halben Big Blind.</li><li><b>Big Blind (BB):</b> sitzt links vom Small Blind und setzt einen ganzen Big Blind.</li></ul><p>Der <b>Dealer Button</b> markiert den nominellen Kartengeber. Er wandert nach jeder Hand <b>einen Platz im Uhrzeigersinn</b> weiter – so zahlt jeder reihum die Blinds.</p>' },
            { t: 'demo', demo: 'positions' },
            { t: 'text', h: '<p>Einsätze werden in diesem Kurs meist in <b>Big Blinds (BB)</b> angegeben. Ein Stack von 100 BB ist die Standardtiefe in Cash Games.</p>' },
            { t: 'example', title: 'Beispiel', h: 'Blinds 0,50 € / 1 €. Der SB setzt 0,50 €, der BB 1 €. Ein Spieler mit 100 € hat also 100 BB.' },
          ],
          quiz: [
            q('rules', 'Wer sitzt direkt links vom Dealer Button?', ['Big Blind', 'Small Blind', 'UTG', 'Cutoff'], 1, 'Links vom Button sitzt der Small Blind, dann der Big Blind.'),
            q('rules', 'Wie bewegt sich der Dealer Button?', ['Er bleibt beim Gewinner', 'Einen Platz im Uhrzeigersinn pro Hand', 'Zufällig', 'Zum Spieler mit den meisten Chips'], 1, 'Der Button rotiert nach jeder Hand einen Platz nach links (im Uhrzeigersinn).'),
            q('rules', 'Warum gibt es Blinds?', ['Damit der Dealer bezahlt wird', 'Damit in jeder Hand ein Anreiz (Pot) existiert', 'Um Anfänger zu schützen', 'Sie sind optional'], 1, 'Ohne Pflichteinsätze könnte jeder auf Premium-Hände warten. Die Blinds erzwingen Action.'),
          ],
        },
        {
          id: 'm1l3', title: 'Die Aktionen: Check, Call, Bet, Raise, Fold, All-in', min: 7,
          sections: [
            { t: 'text', h: '<p>Wenn du am Zug bist, hast du je nach Situation folgende Optionen:</p><table class="tbl"><tr><th>Aktion</th><th>Bedeutung</th><th>Wann möglich?</th></tr><tr><td><b>Check</b></td><td>Schieben, ohne zu setzen</td><td>Nur wenn noch niemand in dieser Runde gesetzt hat</td></tr><tr><td><b>Bet</b></td><td>Den ersten Einsatz der Runde machen</td><td>Wenn noch niemand gesetzt hat</td></tr><tr><td><b>Call</b></td><td>Den aktuellen Einsatz mitgehen</td><td>Wenn jemand gesetzt hat</td></tr><tr><td><b>Raise</b></td><td>Den Einsatz erhöhen</td><td>Wenn jemand gesetzt hat</td></tr><tr><td><b>Fold</b></td><td>Aufgeben, Karten weglegen</td><td>Immer (sinnvoll nur bei Einsatz)</td></tr><tr><td><b>All-in</b></td><td>Alle Chips setzen</td><td>Immer</td></tr></table>' },
            { t: 'text', h: '<p><b>Mindest-Raise:</b> Im No-Limit Hold’em muss eine Erhöhung mindestens so groß sein wie die vorherige Bet bzw. Erhöhung. Setzt jemand 10, musst du auf mindestens 20 erhöhen. Nach oben gibt es (No-Limit) keine Grenze außer deinem Stack.</p><p><b>All-in &amp; Side Pots:</b> Wer All-in ist, kann nur den Teil des Pots gewinnen, den er auch abdecken konnte. Weitere Einsätze der anderen Spieler bilden einen <b>Side Pot</b>.</p>' },
            { t: 'example', title: 'Side Pot', h: 'A ist mit 20 BB All-in, B und C callen mit jeweils 100 BB Stack. Main Pot: 3 × 20 = 60 BB (A, B, C spielen darum). Setzen B und C danach weiter, entsteht ein Side Pot nur zwischen B und C.' },
            { t: 'tip', h: 'Folden ist keine Schwäche. Die meisten Hände solltest du folden – Profis spielen nur ca. 20–30 % ihrer Starthände an einem 6-max-Tisch.' },
          ],
          quiz: [
            q('rules', 'Spieler A setzt 4 BB. Was darfst du NICHT tun?', ['Call', 'Raise', 'Fold', 'Check'], 3, 'Sobald gesetzt wurde, ist Check nicht mehr möglich – nur Call, Raise oder Fold.'),
            q('rules', 'Der Gegner bettet 10 BB. Wie hoch muss dein Raise mindestens sein (No-Limit)?', ['15 BB', '20 BB', '11 BB', '30 BB'], 1, 'Die Erhöhung muss mindestens so groß sein wie die letzte Bet: 10 + 10 = 20 BB.'),
            q('rules', 'Was passiert, wenn ein Spieler mit weniger Chips All-in geht?', ['Er kann den ganzen Pot gewinnen', 'Es entsteht ggf. ein Side Pot, den er nicht gewinnen kann', 'Die Hand wird abgebrochen', 'Die anderen müssen folden'], 1, 'Er spielt nur um den Main Pot, den er abdecken konnte.'),
            q('rules', 'Was bedeutet „Call“?', ['Den Einsatz erhöhen', 'Den aktuellen Einsatz mitgehen', 'Aufgeben', 'Schieben ohne Einsatz'], 1, 'Call = mitgehen.'),
          ],
        },
        {
          id: 'm1l4', title: 'Ablauf einer Hand: Preflop, Flop, Turn, River', min: 8,
          sections: [
            { t: 'text', h: '<p>Eine Hand hat bis zu <b>vier Setzrunden</b>. Klicke dich durch den interaktiven Ablauf:</p>' },
            { t: 'demo', demo: 'flow' },
            { t: 'text', h: '<p><b>Wer beginnt?</b> Preflop beginnt der Spieler links vom Big Blind (<b>UTG</b> – „Under the Gun“). Ab dem Flop beginnt der erste aktive Spieler links vom Button (meist der Small Blind). Der Button handelt postflop immer zuletzt.</p><p>Eine Setzrunde endet, wenn alle verbleibenden Spieler gleich viel gesetzt haben (oder All-in sind) und jeder die Chance hatte zu handeln.</p>' },
            { t: 'tip', h: 'Merke: Preflop handeln die Blinds zuletzt, postflop zuerst. Das ist der Grund, warum die Blinds die unprofitabelsten Positionen am Tisch sind.' },
          ],
          quiz: [
            q('rules', 'Wie viele Karten werden auf dem Flop aufgedeckt?', ['1', '2', '3', '5'], 2, 'Flop = 3 Karten, Turn = 1, River = 1.'),
            q('rules', 'In welcher Reihenfolge kommen die Setzrunden?', ['Flop, Preflop, Turn, River', 'Preflop, Flop, Turn, River', 'Preflop, Turn, Flop, River', 'Flop, Turn, River, Showdown, Preflop'], 1, 'Preflop → Flop → Turn → River → (Showdown).'),
            q('rules', 'Wer handelt nach dem Flop zuerst?', ['UTG', 'Button', 'Erster aktiver Spieler links vom Button', 'Big Blind immer'], 2, 'Postflop beginnt der erste noch aktive Spieler links vom Button.'),
            q('position', 'Wer handelt preflop zuerst (6-max)?', ['Small Blind', 'Big Blind', 'UTG', 'Button'], 2, 'UTG sitzt links vom Big Blind und handelt preflop zuerst.'),
          ],
        },
      ],
    },
    // ===================================================================== M2
    {
      id: 'm2', num: 2, title: 'Pokerhand-Rankings', icon: '♥', level: 1,
      desc: 'Alle zehn Hände, Kicker, Gleichstände, Split Pots und „Board spielt“.',
      gens: ['handIdentify', 'rankOrder', 'handCompare', 'kicker'],
      lessons: [
        {
          id: 'm2l1', title: 'Die 10 Hände von Royal Flush bis High Card', min: 8,
          sections: [
            { t: 'text', h: '<p>Je seltener eine Hand, desto höher ist sie. Präge dir die Reihenfolge gut ein – sie ist das Fundament jeder Entscheidung:</p>' },
            { t: 'ranks' },
            { t: 'tip', h: 'Häufige Verwechslung: <b>Flush schlägt Straße</b>, und <b>Full House schlägt Flush</b>. Farben haben im Hold’em keinen Rang – Pik ist nicht mehr wert als Herz.' },
          ],
          quiz: [
            q('handRanking', 'Was ist höher?', ['Straße', 'Flush'], 1, 'Ein Flush ist seltener als eine Straße und daher höher.'),
            q('handRanking', 'Was ist höher?', ['Full House', 'Flush'], 0, 'Full House schlägt Flush.'),
            q('handRanking', 'Welche Hand ist die stärkste?', ['Vierling', 'Straight Flush', 'Full House', 'Royal Flush'], 3, 'Royal Flush (A-K-Q-J-T in einer Farbe) ist die beste mögliche Hand.'),
            q('handRanking', 'Was ist ein Drilling?', ['Drei Karten gleicher Farbe', 'Drei Karten gleichen Rangs', 'Drei Karten in Folge', 'Zwei Paare + eine Karte'], 1, 'Drilling (Three of a Kind) = drei Karten gleichen Rangs.'),
            q('handRanking', 'Ist A-2-3-4-5 eine gültige Straße?', ['Ja, das Ass zählt als 1 (Wheel)', 'Nein', 'Nur in derselben Farbe', 'Nur im Showdown'], 0, 'Das Ass kann hoch (A-K-Q-J-T) oder niedrig (5-4-3-2-A) sein. Q-K-A-2-3 ist aber keine Straße.'),
          ],
        },
        {
          id: 'm2l2', title: 'Kicker und Gleichstände', min: 7,
          sections: [
            { t: 'text', h: '<p>Haben zwei Spieler dieselbe Handkategorie, entscheidet ein festes Verfahren:</p><ol><li>Zuerst der <b>Rang der Kombination</b> (Paar Asse schlägt Paar Könige).</li><li>Ist dieser gleich, entscheiden die <b>Kicker</b> – die höchsten verbleibenden Beikarten – der Reihe nach.</li><li>Sind alle fünf Karten gleich, wird der Pot <b>geteilt</b>.</li></ol>' },
            { t: 'cards', rows: [{ label: 'Board', cards: ['Ac', '9d', '7s', '4h', '2c'] }, { label: 'Spieler A: A♥ K♦ → Paar Asse, Kicker K-9-7', cards: ['Ah', 'Kd'] }, { label: 'Spieler B: A♠ Q♣ → Paar Asse, Kicker Q-9-7', cards: ['As', 'Qc'] }] },
            { t: 'example', title: 'Ergebnis', h: 'Spieler A gewinnt – beide haben ein Paar Asse, aber der König-Kicker schlägt den Dame-Kicker. Deshalb sind Hände wie A-K so viel stärker als A-7: Sie gewinnen die Kicker-Duelle.' },
            { t: 'text', h: '<p><b>Wichtig:</b> Nur fünf Karten zählen. Hat das Board bereits vier hohe Kicker, spielt dein zweiter Kicker eventuell keine Rolle mehr.</p><p>Bei <b>Straßen</b> entscheidet nur die höchste Karte. Bei <b>Full Houses</b> zuerst der Drilling, dann das Paar. Bei <b>Flushes</b> werden alle fünf Karten der Reihe nach verglichen.</p>' },
          ],
          quiz: [
            q('kicker', 'Board: K♠ 8♦ 5♣ 3♥ 2♠. A hält K♥ J♣, B hält K♦ T♠. Wer gewinnt?', ['A', 'B', 'Split'], 0, 'Beide haben ein Paar Könige. Kicker: Bube (A) schlägt Zehn (B).'),
            q('kicker', 'Wer gewinnt: Full House 8-8-8-K-K oder Full House 7-7-7-A-A?', ['8er voll', '7er voll', 'Split'], 0, 'Beim Full House entscheidet zuerst der Drilling: Achten schlagen Siebenen.'),
            q('kicker', 'Zwei Spieler haben eine Straße bis zur Zehn. Was passiert?', ['Höhere Farbe gewinnt', 'Split Pot', 'Kicker entscheidet', 'Wer zuerst gesetzt hat, gewinnt'], 1, 'Gleiche Straße = Split Pot. Farben und Kicker spielen keine Rolle.'),
            q('kicker', 'Was ist ein Kicker?', ['Die höchste Karte im Deck', 'Eine Beikarte, die bei gleicher Kombination entscheidet', 'Ein Bluff', 'Die letzte Boardkarte'], 1, 'Der Kicker ist eine nicht an der Kombination beteiligte Karte innerhalb der besten fünf.'),
          ],
        },
        {
          id: 'm2l3', title: 'Split Pots und „Das Board spielt“', min: 6,
          sections: [
            { t: 'text', h: '<p>Ist die beste mögliche 5-Karten-Hand <b>komplett auf dem Board</b>, und kein Spieler kann sie mit seinen Hole Cards verbessern, sagt man: <b>„Das Board spielt.“</b> Alle verbleibenden Spieler teilen sich den Pot.</p>' },
            { t: 'cards', rows: [{ label: 'Board: Straße bis zum Ass', cards: ['Ts', 'Jd', 'Qc', 'Kh', 'As'] }, { label: 'Spieler A', cards: ['2c', '3d'] }, { label: 'Spieler B', cards: ['Ac', 'Ad'] }] },
            { t: 'example', title: 'Split!', h: 'Beide haben die Straße bis zum Ass vom Board. B hat zwar ein Drilling Asse in sieben Karten, aber die Straße ist besser und bei beiden identisch → Split Pot.' },
            { t: 'text', h: '<p><b>Odd Chip:</b> Lässt sich der Pot nicht exakt teilen, erhält der erste Spieler links vom Button den übrigen Chip.</p>' },
          ],
          quiz: [
            q('kicker', 'Board: 7♣ 7♦ 7♥ 7♠ A♦. A hält K♠ Q♠, B hält 2♣ 2♦. Wer gewinnt?', ['A', 'B', 'Split'], 2, 'Beide spielen Vierling Siebenen mit Ass-Kicker vom Board. Die Hole Cards spielen keine Rolle → Split.'),
            q('kicker', 'Board: A♠ K♠ Q♠ J♠ 2♦. A hält T♥ 3♣, B hält T♠ 4♦. Wer gewinnt?', ['A', 'B', 'Split'], 1, 'B hat mit T♠ einen Royal Flush! A hat „nur“ eine Straße bis zum Ass.'),
            q('kicker', 'Was bedeutet „Das Board spielt“?', ['Die beste Hand liegt komplett auf dem Board', 'Der Dealer gewinnt', 'Alle müssen folden', 'Die Hand wird wiederholt'], 0, 'Die besten fünf Karten sind die Boardkarten – Split Pot unter allen verbleibenden Spielern.'),
          ],
        },
      ],
    },
    // ===================================================================== M3
    {
      id: 'm3', num: 3, title: 'Preflop-Strategie', icon: '♦', level: 2,
      desc: 'Starthände, Opening Ranges, 3-Bets, 4-Bets, Limps und Squeeze.',
      gens: ['rfi', 'vsOpen', 'combos'],
      lessons: [
        {
          id: 'm3l1', title: 'Starthände: stark, schwach, spielbar', min: 8,
          sections: [
            { t: 'text', h: '<p>Es gibt 1.326 mögliche Starthand-Kombinationen, die sich auf <b>169 strategisch verschiedene Klassen</b> reduzieren:</p><ul><li><b>13 Pocket Pairs</b> (z. B. 77) – je 6 Kombinationen</li><li><b>78 Suited-Hände</b> (z. B. AKs, gleiche Farbe) – je 4 Kombinationen</li><li><b>78 Offsuit-Hände</b> (z. B. AKo) – je 12 Kombinationen</li></ul><p>Die Matrix unten zeigt alle 169 Klassen. Oben rechts: suited. Unten links: offsuit. Diagonale: Paare.</p>' },
            { t: 'range', title: 'Top 15 % der Starthände', top: 0.15 },
            { t: 'text', h: '<p><b>Was macht eine Hand stark?</b></p><ul><li><b>Hohe Karten</b> (A, K, Q) – bilden Top Pair mit gutem Kicker.</li><li><b>Paare</b> – sind bereits eine fertige Hand, kleine Paare hoffen auf ein Set (Drilling, ca. 12 % am Flop).</li><li><b>Suited</b> – ca. 2–3 % mehr Equity und Flush-Potenzial.</li><li><b>Connected</b> (z. B. 87s) – Straßen-Potenzial, gute Spielbarkeit.</li></ul><p><b>Schwache Hände</b> sind unverbundene, offsuited, niedrige Karten wie 72o, 93o, J4o. „Dominierte“ Hände wie KJo oder A9o sind gefährlich, weil sie oft gegen bessere Kicker (AK, AJ) verlieren.</p>' },
            { t: 'equity', title: 'Equity-Vergleich (Preflop, All-in)', matchups: [[['Ah', 'Ad'], ['Kc', 'Ks']], [['Ah', 'Kd'], ['Qc', 'Qs']], [['Ah', 'Kd'], ['Ac', 'Js']], [['8h', '7h'], ['Ac', 'Ks']]] },
          ],
          quiz: [
            q('preflop', 'Wie viele Kombinationen hat ein Pocket Pair wie 99?', ['4', '6', '12', '16'], 1, '4 Karten eines Rangs → 4 über 2 = 6 Kombinationen.'),
            q('preflop', 'Warum ist A-J offsuit eine gefährliche Hand?', ['Sie ist zu schwach für jede Situation', 'Sie wird oft von AK/AQ dominiert', 'Sie kann keine Straße bilden', 'Sie ist suited'], 1, 'Trifft A-J ein Ass, liegt sie oft gegen AK/AQ mit schlechterem Kicker hinten.'),
            q('preflop', 'Welche Hand ist preflop stärker?', ['K-Q suited', '7-2 offsuit', 'J-4 offsuit', '9-3 suited'], 0, 'KQs hat hohe Karten, ist verbunden und suited.'),
          ],
        },
        {
          id: 'm3l2', title: 'Opening Ranges nach Position', min: 9,
          sections: [
            { t: 'text', h: '<p>Wenn alle vor dir gefoldet haben, ist die Standardaktion: <b>Raise oder Fold</b> („Raise First In“, RFI). Limpen (nur den Big Blind callen) ist fast immer schwächer.</p><p>Je mehr Spieler hinter dir noch handeln, desto höher die Wahrscheinlichkeit, dass einer eine starke Hand hat – und desto öfter bist du postflop ohne Position. Deshalb gilt: <b>je später die Position, desto breiter die Range</b>.</p>' },
            { t: 'range', title: 'UTG – ca. 16 %', rfi: 'UTG' },
            { t: 'range', title: 'Cutoff – ca. 27 %', rfi: 'CO' },
            { t: 'range', title: 'Button – ca. 43 %', rfi: 'BTN' },
            { t: 'tip', h: 'Standard-Opengröße: 2–2,5 BB aus früher Position und vom Button, 3 BB aus dem Small Blind. Gegen Limper: 3 BB + 1 BB pro Limper.' },
          ],
          quiz: [
            q('preflop', 'Warum ist die UTG-Range am engsten?', ['UTG muss die Blinds zahlen', 'Es sitzen noch 5 Spieler hinter dir', 'UTG hat Position', 'Weil der Pot größer ist'], 1, 'Mehr Spieler hinter dir = höhere Chance auf eine starke Hand dort + meist keine Position.'),
            q('preflop', 'Alle folden zu dir auf dem Button. Was ist die Standardaktion mit K8o?', ['Fold', 'Limp', 'Raise', 'All-in'], 2, 'K8o ist Teil einer typischen Button-Opening-Range (~43 %).'),
            q('preflop', 'Was ist ein „Limp“?', ['Preflop nur den Big Blind callen', 'Ein Mini-Raise', 'Eine 3-Bet', 'Ein Fold'], 0, 'Limp = als Erster nur den Big Blind mitgehen. In modernen Strategien kaum genutzt (Ausnahme: teils aus dem SB).'),
            q('preflop', 'Welche Opengröße ist vom Cutoff üblich?', ['1 BB', '2–2,5 BB', '6 BB', '10 BB'], 1, '2–2,5 BB ist der heutige Standard.'),
          ],
        },
        {
          id: 'm3l3', title: '3-Bet, 4-Bet, Cold Call, Squeeze', min: 9,
          sections: [
            { t: 'text', h: '<p><b>Begriffe:</b></p><ul><li><b>Open-Raise</b> (2-Bet): die erste Erhöhung preflop. (Der Big Blind gilt als 1. „Bet“.)</li><li><b>3-Bet:</b> Re-Raise auf einen Open-Raise.</li><li><b>4-Bet:</b> Re-Raise auf eine 3-Bet. Danach folgt die 5-Bet (meist All-in).</li><li><b>Cold Call:</b> Callen eines Raises, ohne vorher Geld investiert zu haben.</li><li><b>Squeeze:</b> 3-Bet, nachdem ein Spieler geraist und mindestens einer gecallt hat. Der Caller hat seine Stärke „gecappt“ – der Raiser steht unter Druck.</li></ul>' },
            { t: 'text', h: '<p><b>Polarisierte 3-Bet-Range:</b> Gegen frühe Opens 3-betten wir sehr starke Hände (QQ+, AK) für Value und wenige Bluffs mit Blockern (A5s, A4s). Mittlere Hände (88, AJs, KQs) callen wir.</p><p><b>Lineare 3-Bet-Range:</b> Gegen weite Opens (z. B. vom Button) 3-betten wir die besten X % unserer Hände – inkl. AJo, KQo, 99.</p>' },
            { t: 'range', title: 'Button vs. Cutoff-Open: 3-Bet (gold) / Call (grün)', vs: 'BTN_vs_CO' },
            { t: 'text', h: '<p><b>3-Bet-Größen:</b> In Position ca. 3× des Opens, ohne Position ca. 4×. <b>4-Bet:</b> ca. 2,2–2,5× der 3-Bet.</p>' },
            { t: 'tip', h: 'A5s ist ein klassischer 3-Bet-Bluff: Das Ass blockt AA/AK beim Gegner, und die Hand hat Straßen- und Flush-Potenzial, falls gecallt wird.' },
          ],
          quiz: [
            q('preflop3bet', 'UTG raist, CO callt, du erhöhst vom Button. Wie nennt man das?', ['4-Bet', 'Squeeze', 'Limp', 'Cold Call'], 1, 'Eine 3-Bet nach Raise + Call ist ein Squeeze.'),
            q('preflop3bet', 'Du raist, der Gegner re-raist, du erhöhst erneut. Das ist eine …', ['3-Bet', '4-Bet', '5-Bet', 'Squeeze'], 1, 'Open (2-Bet) → 3-Bet → 4-Bet.'),
            q('preflop3bet', 'Warum eignet sich A5s gut als 3-Bet-Bluff?', ['Es ist die stärkste Hand', 'Blocker auf AA/AK + Spielbarkeit', 'Weil es offsuit ist', 'Weil es ein Paar ist'], 1, 'Blocker reduzieren die Combos starker Gegnerhände; Flush/Wheel-Potenzial gibt Equity.'),
            q('preflop3bet', 'Was ist ein Cold Call?', ['Callen eines Raises ohne vorherige Investition', 'Callen aus dem Big Blind', 'Ein Limp', 'Callen einer 4-Bet'], 0, 'Cold Call = Raise callen, ohne bereits Geld im Pot zu haben.'),
          ],
        },
      ],
    },
    // ===================================================================== M4
    {
      id: 'm4', num: 4, title: 'Position & Tischdynamik', icon: '♣', level: 2,
      desc: 'Warum Position so wichtig ist, Blind-Verteidigung und Initiative.',
      gens: ['position', 'rfi', 'vsOpen'],
      lessons: [
        {
          id: 'm4l1', title: 'Warum Position Geld wert ist', min: 7,
          sections: [
            { t: 'text', h: '<p><b>In Position (IP)</b> zu sein heißt, nach dem Gegner zu handeln. Das ist einer der größten Vorteile im Poker:</p><ul><li>Du siehst die Aktion des Gegners, bevor du entscheidest – <b>mehr Information</b>.</li><li>Du kontrollierst die Potgröße: Du kannst günstig mitchecken oder Value holen.</li><li>Du kannst Equity <b>realisieren</b>: Mit Draws bekommst du öfter Freikarten.</li><li>Bluffs funktionieren besser, weil du auf Schwäche (Checks) reagieren kannst.</li></ul>' },
            { t: 'demo', demo: 'positions' },
            { t: 'text', h: '<p>Statistiken aus Millionen Online-Händen zeigen dasselbe Muster bei allen Gewinnern: <b>Button &gt; Cutoff &gt; Hijack &gt; UTG &gt; SB &gt; BB</b> (die Blinds verlieren in Summe sogar, weil sie Pflichteinsätze zahlen).</p>' },
            { t: 'tip', h: 'Out of Position (OOP) solltest du enger spielen und mehr checken. In Position kannst du breiter spielen.' },
          ],
          quiz: [
            q('position', 'Was bedeutet „in Position“?', ['Als Erster handeln', 'Nach dem Gegner handeln', 'Den Button bezahlen', 'Den größten Stack haben'], 1, 'In Position = du handelst nach deinem Gegner.'),
            q('position', 'Welche Position ist die profitabelste?', ['Small Blind', 'UTG', 'Button', 'Big Blind'], 2, 'Der Button handelt postflop immer zuletzt.'),
            q('position', 'Warum realisieren Draws in Position mehr Equity?', ['Weil sie mehr Outs haben', 'Weil man öfter Freikarten bekommt und Bets besser einschätzen kann', 'Weil der Pot kleiner ist', 'Das stimmt nicht'], 1, 'In Position kannst du hinterher checken und erhältst so Freikarten.'),
          ],
        },
        {
          id: 'm4l2', title: 'Blinds verteidigen & Initiative', min: 7,
          sections: [
            { t: 'text', h: '<p>Der <b>Big Blind</b> hat bereits 1 BB investiert und bekommt gegen einen Open-Raise einen sehr guten Preis. Gegen einen Button-Open auf 2,5 BB musst du nur 1,5 BB callen, um einen Pot von 5,5 BB zu spielen → du brauchst nur ca. <b>27 % Equity</b>. Deshalb verteidigt der BB sehr breit.</p>' },
            { t: 'range', title: 'BB vs. Button-Open: 3-Bet (gold) / Call (grün)', vs: 'BB_vs_BTN' },
            { t: 'text', h: '<p><b>Small Blind:</b> Ohne Position und mit dem BB hinter dir ist Callen unattraktiv. Moderne Strategie: überwiegend <b>3-Bet oder Fold</b>.</p><p><b>Initiative:</b> Der letzte Aggressor preflop (Raiser) hat die Initiative. Seine Range ist stärker, deshalb kann er auf vielen Flops eine <b>Continuation Bet (C-Bet)</b> machen.</p>' },
          ],
          quiz: [
            q('position', 'Warum verteidigt der Big Blind so breit?', ['Er hat Position', 'Er bekommt einen guten Preis, da schon 1 BB investiert ist', 'Er muss immer callen', 'Weil er zuletzt den Flop sieht'], 1, 'Der bereits investierte Blind verbessert die Pot Odds deutlich.'),
            q('preflop3bet', 'Welche Strategie empfiehlt sich im Small Blind gegen einen Button-Open?', ['Immer callen', 'Überwiegend 3-Bet oder Fold', 'Immer folden', 'Limpen'], 1, 'Callen aus dem SB ist unattraktiv (OOP, BB dahinter).'),
            q('position', 'Wer hat nach dem Preflop-Raise die „Initiative“?', ['Der Caller', 'Der letzte Aggressor', 'Der Big Blind', 'Niemand'], 1, 'Der letzte Raiser hat die Initiative.'),
          ],
        },
      ],
    },
    // ===================================================================== M5
    {
      id: 'm5', num: 5, title: 'Pot Odds, Outs & Equity', icon: '%', level: 3,
      desc: 'Die Mathematik hinter jeder Entscheidung: Outs, Regel von 2 und 4, Pot Odds, EV.',
      gens: ['potOdds', 'outs', 'ruleOf4', 'callFold'],
      lessons: [
        {
          id: 'm5l1', title: 'Outs zählen', min: 8,
          sections: [
            { t: 'text', h: '<p><b>Outs</b> sind die verbleibenden Karten, die deine Hand zur (vermutlich) besten Hand machen.</p><table class="tbl"><tr><th>Draw</th><th>Outs</th></tr><tr><td>Flush Draw (4 zur Farbe)</td><td>9</td></tr><tr><td>Open-Ended Straight Draw</td><td>8</td></tr><tr><td>Gutshot (Innenstraße)</td><td>4</td></tr><tr><td>Zwei Overcards</td><td>6</td></tr><tr><td>Flush Draw + OESD</td><td>15</td></tr><tr><td>Pocket Pair → Set</td><td>2</td></tr></table>' },
            { t: 'cards', rows: [{ label: 'Flush Draw: A♥ K♥ auf 9♥ 5♥ 2♣ → 13 Herz − 4 sichtbar = 9 Outs', cards: ['Ah', 'Kh', '9h', '5h', '2c'] }, { label: 'OESD: 8♣ 9♦ auf T♥ J♠ 2♣ → jede 7 oder Q = 8 Outs', cards: ['8c', '9d', 'Th', 'Js', '2c'] }] },
            { t: 'tip', h: 'Vorsicht vor „schmutzigen“ Outs: Eine Karte, die dir die Straße gibt, aber gleichzeitig einen Flush für den Gegner ermöglicht, ist kein sauberes Out.' },
          ],
          quiz: [
            q('outs', 'Wie viele Outs hat ein Flush Draw?', ['4', '8', '9', '13'], 2, '13 Karten der Farbe − 4 sichtbare = 9.'),
            q('outs', 'Wie viele Outs hat ein Gutshot?', ['2', '4', '8', '9'], 1, 'Nur ein Rang vervollständigt die Straße → 4 Karten.'),
            q('outs', 'Flush Draw + OESD ergeben wie viele Outs?', ['17', '15', '12', '9'], 1, '9 + 8 = 17, minus 2 doppelt gezählte Karten = 15.'),
          ],
        },
        {
          id: 'm5l2', title: 'Equity & die Regel von 2 und 4', min: 7,
          sections: [
            { t: 'text', h: '<p><b>Equity</b> ist dein Anteil am Pot, wenn die Hand bis zum Ende ohne weitere Einsätze ausgespielt würde – also deine Gewinnwahrscheinlichkeit (Splits anteilig).</p><p><b>Schnelle Kopfrechnung:</b></p><ul><li>Flop → River (2 Karten): <b>Outs × 4</b></li><li>Turn → River (1 Karte): <b>Outs × 2</b></li></ul><p>Beispiel: Flush Draw auf dem Flop: 9 × 4 ≈ 36 % (exakt 35 %). Auf dem Turn: 9 × 2 ≈ 18 % (exakt 19,6 %).</p>' },
            { t: 'equity', title: 'Equity am Flop', matchups: [[['Ah', 'Kh'], ['Qs', 'Qd']]], board: ['9h', '5h', '2c'] },
            { t: 'tip', h: 'Bei mehr als 8 Outs überschätzt die Regel von 4 leicht. Korrektur: (Outs × 4) − (Outs − 8).' },
          ],
          quiz: [
            q('outs', 'Du hast 8 Outs auf dem Turn. Ungefähre Trefferchance am River?', ['8 %', '16 %', '32 %', '50 %'], 1, 'Regel von 2: 8 × 2 = 16 % (exakt 17,4 %).'),
            q('equity', 'Was bedeutet Equity?', ['Dein Stack', 'Dein Anteil am Pot bei Ausspielen ohne weitere Einsätze', 'Die Potgröße', 'Die Anzahl Outs'], 1, 'Equity = erwarteter Anteil am Pot.'),
            q('outs', 'Flush Draw auf dem Flop, Gegner All-in. Wie hoch ist deine Chance bis zum River?', ['≈ 18 %', '≈ 35 %', '≈ 50 %', '≈ 9 %'], 1, '9 Outs × 4 ≈ 36 % (exakt 35 %).'),
          ],
        },
        {
          id: 'm5l3', title: 'Pot Odds & Expected Value (EV)', min: 9,
          sections: [
            { t: 'text', h: '<p><b>Pot Odds</b> vergleichen, was du investieren musst, mit dem, was du gewinnen kannst. Daraus folgt die <b>benötigte Equity</b>:</p><p class="formula">Benötigte Equity = Call ÷ (Pot nach deinem Call)</p><p>Liegt deine Equity darüber, ist der Call profitabel (+EV).</p>' },
            { t: 'potodds' },
            { t: 'text', h: '<p><b>Expected Value (EV)</b> ist der durchschnittliche Gewinn einer Entscheidung, wenn man sie unendlich oft treffen würde:</p><p class="formula">EV(Call) = Equity × (Pot + Bet) − (1 − Equity) × Call</p><p>Beispiel: Pot 10, Bet 5, deine Equity 35 %. EV = 0,35 × 15 − 0,65 × 5 = 5,25 − 3,25 = <b>+2 BB</b>. Der Call ist profitabel, auch wenn du die Hand meistens verlierst!</p><p><b>Implied Odds:</b> Geld, das du zusätzlich gewinnst, wenn du triffst. Sie rechtfertigen manchmal Calls mit etwas zu wenig Equity – vor allem mit versteckten Draws und tiefen Stacks.</p>' },
            { t: 'tip', h: 'Poker ist ein Spiel von Entscheidungen, nicht von Ergebnissen. Ein +EV-Call, der verliert, war trotzdem richtig.' },
          ],
          quiz: [
            q('potOdds', 'Pot 10 BB, Gegner setzt 10 BB (Pot-Bet). Welche Equity brauchst du?', ['25 %', '33 %', '50 %', '20 %'], 1, '10 ÷ (10 + 10 + 10) = 33 %.'),
            q('potOdds', 'Pot 9 BB, Gegner setzt 3 BB. Benötigte Equity?', ['20 %', '25 %', '33 %', '10 %'], 0, '3 ÷ (9 + 3 + 3) = 20 %.'),
            q('equity', 'Pot 10, Bet 5, Equity 35 %. Wie ist der EV des Calls?', ['Negativ', 'Positiv (+2 BB)', 'Genau 0', 'Nicht berechenbar'], 1, '0,35 × 15 − 0,65 × 5 = +2 BB.'),
            q('equity', 'Was sind Implied Odds?', ['Die aktuellen Pot Odds', 'Zusätzlicher Gewinn auf späteren Straßen, wenn du triffst', 'Die Wahrscheinlichkeit eines Bluffs', 'Rake'], 1, 'Implied Odds berücksichtigen zukünftige Gewinne.'),
          ],
        },
      ],
    },
    // ===================================================================== M6
    {
      id: 'm6', num: 6, title: 'Flop-Spiel & C-Bets', icon: '▲', level: 3,
      desc: 'Boardtexturen, Range-Vorteil, Continuation Bets und Bet-Sizing.',
      gens: ['boardTexture', 'cbet', 'outs', 'callFold'],
      lessons: [
        {
          id: 'm6l1', title: 'Boardtexturen lesen', min: 8,
          sections: [
            { t: 'text', h: '<p>Die <b>Textur</b> des Flops bestimmt, wie stark Hände sind und wie sich die Equity entwickelt:</p><ul><li><b>Trocken</b> (K♠ 7♦ 2♣): unverbunden, Regenbogen. Kaum Draws.</li><li><b>Nass</b> (9♥ T♥ J♣): verbunden, Flush-Draws. Viele starke Hände und Draws.</li><li><b>Monoton</b> (A♠ 8♠ 3♠): drei Karten einer Farbe.</li><li><b>Gepaart</b> (8♣ 8♦ 4♥): weniger Kombinationen, die das Board treffen.</li></ul>' },
            { t: 'cards', rows: [{ label: 'Trocken', cards: ['Ks', '7d', '2c'] }, { label: 'Nass', cards: ['9h', 'Th', 'Jc'] }, { label: 'Monoton', cards: ['As', '8s', '3s'] }, { label: 'Gepaart', cards: ['8c', '8d', '4h'] }] },
            { t: 'text', h: '<p><b>Statische vs. dynamische Boards:</b> Auf statischen Boards ändert sich die beste Hand selten bis zum River. Auf dynamischen Boards wechselt die Führung oft – wer vorne ist, sollte Equity verweigern (größer setzen).</p>' },
          ],
          quiz: [
            q('boardTexture', 'Wie klassifizierst du K♠ 7♦ 2♣?', ['Nass', 'Trocken', 'Monoton', 'Gepaart'], 1, 'Unverbunden, drei Farben → trocken.'),
            q('boardTexture', 'Was ist charakteristisch für ein nasses Board?', ['Keine Draws', 'Viele Straßen- und Flush-Draws', 'Immer ein Paar', 'Nur hohe Karten'], 1, 'Nasse Boards bieten viele Draws.'),
            q('boardTexture', 'Auf welchem Board solltest du mit einer starken Hand eher groß setzen?', ['Statisch und trocken', 'Dynamisch und nass', 'Gepaart und trocken', 'Egal'], 1, 'Auf nassen Boards verweigert man Draws die günstige Equity.'),
          ],
        },
        {
          id: 'm6l2', title: 'Continuation Bets & Range-Vorteil', min: 9,
          sections: [
            { t: 'text', h: '<p>Eine <b>Continuation Bet (C-Bet)</b> ist eine Bet am Flop durch den Preflop-Aggressor. Ob sie sinnvoll ist, hängt vom <b>Range-Vorteil</b> ab:</p><ul><li><b>Range-Vorteil:</b> Wessen Range hat insgesamt mehr Equity auf diesem Board?</li><li><b>Nut-Vorteil:</b> Wer hat mehr der stärksten Hände (Sets, Two Pair, Nuts)?</li></ul><p>Der Button-Opener hat auf <b>A-K-x</b>- oder <b>K-7-2</b>-Boards einen klaren Vorteil (mehr AA, KK, AK). Der BB-Verteidiger trifft <b>tiefe, verbundene Boards</b> (7-6-5, 9-8-6) besser.</p>' },
            { t: 'text', h: '<table class="tbl"><tr><th>Situation</th><th>Strategie</th></tr><tr><td>Trockenes, hohes Board, Range-Vorteil</td><td>Häufig, klein (25–33 % Pot)</td></tr><tr><td>Nasses Board mit Nut-Vorteil</td><td>Seltener, groß (66–75 % Pot)</td></tr><tr><td>Tiefes, verbundenes Board, kein Vorteil</td><td>Häufig checken</td></tr><tr><td>Multiway (3+ Spieler)</td><td>Deutlich seltener, mehr Value</td></tr></table>' },
            { t: 'tip', h: 'Eine C-Bet ist keine Pflicht! Automatische C-Bets auf jedem Board sind ein typischer Leak, den gute Gegner mit Check-Raises bestrafen.' },
          ],
          quiz: [
            q('cbet', 'BTN raist, BB callt. Flop K♣ 7♦ 2♠. Welche C-Bet-Strategie ist typisch?', ['Nie setzen', 'Häufig und klein', 'Immer All-in', 'Nur mit Sets'], 1, 'Trockenes, hohes Board → großer Range-Vorteil des Raisers.'),
            q('cbet', 'Auf welchem Board hat der BB-Verteidiger oft den Range-Vorteil?', ['A-K-2', 'K-K-3', '7-6-5', 'A-Q-J'], 2, 'Tiefe, verbundene Boards treffen die BB-Range (viele 76, 65, 87, kleine Paare).'),
            q('cbet', 'Was ist ein Nut-Vorteil?', ['Mehr Chips', 'Mehr der stärksten Hände in der Range', 'Position', 'Die Initiative'], 1, 'Nut-Vorteil = Anteil an sehr starken Händen.'),
            q('cbet', 'Wie ändert sich die C-Bet-Frequenz multiway?', ['Steigt', 'Sinkt deutlich', 'Bleibt gleich', 'Wird 100 %'], 1, 'Gegen mehrere Gegner hat oft jemand getroffen – weniger Bluffs.'),
          ],
        },
      ],
    },
    // ===================================================================== M7
    {
      id: 'm7', num: 7, title: 'Turn, River, Value & Bluff', icon: '◆', level: 4,
      desc: 'Value Betting, Bluffing, Semi-Bluffs, Bet-Sizing und Showdown-Wert.',
      gens: ['valueBluff', 'callFold', 'potOdds', 'alpha'],
      lessons: [
        {
          id: 'm7l1', title: 'Value Bets: Bezahlt werden', min: 8,
          sections: [
            { t: 'text', h: '<p>Eine <b>Value Bet</b> setzt du, wenn <b>schlechtere Hände callen</b>. Die meisten Gewinne im Poker kommen aus Value Bets – nicht aus Bluffs.</p><p>Frag dich am River: <i>„Welche schlechteren Hände bezahlen mich? Welche besseren Hände callen oder raisen?“</i> Callen mehr schlechtere als bessere Hände, ist die Bet profitabel.</p><p><b>Thin Value:</b> Eine Value Bet mit einer nur knapp starken Hand (z. B. Top Pair mit schwachem Kicker), die gegen passive Gegner Geld bringt.</p>' },
            { t: 'cards', rows: [{ label: 'River – du hältst A♦ Q♦ (Top Pair, guter Kicker)', cards: ['Ad', 'Qd', 'Qs', '8c', '4h', '2d', '3s'] }] },
            { t: 'example', title: 'Analyse', h: 'Der Gegner hat preflop gecallt und den Flop gecallt. Hände wie KQ, QJ, QT, 99, 88 können dich bezahlen. Nur AA, Sets oder zwei Paare schlagen dich – Value Bet mit ca. 50–66 % Pot.' },
          ],
          quiz: [
            q('valueBluff', 'Wann ist eine Value Bet sinnvoll?', ['Wenn bessere Hände folden', 'Wenn schlechtere Hände callen', 'Wenn der Gegner All-in ist', 'Immer am River'], 1, 'Value Bets leben davon, dass schlechtere Hände bezahlen.'),
            q('valueBluff', 'Was bedeutet „Thin Value“?', ['Eine sehr kleine Bet', 'Value Bet mit knapp starker Hand', 'Ein Bluff', 'Ein Check'], 1, 'Thin Value = dünne, aber profitable Value Bet.'),
            q('valueBluff', 'Mittlere Hand am River, der Gegner checkt. Bessere Hände callen, schlechtere folden. Was tun?', ['Value Bet', 'Bluff', 'Check (Showdown-Wert nutzen)', 'All-in'], 2, 'Eine Bet würde nur von besseren Händen gecallt – Check.'),
          ],
        },
        {
          id: 'm7l2', title: 'Bluffs & Semi-Bluffs', min: 9,
          sections: [
            { t: 'text', h: '<p>Ein <b>Bluff</b> soll eine <b>bessere Hand zum Folden</b> bringen. Ein <b>Semi-Bluff</b> ist eine Bet mit einer aktuell schwächeren Hand, die sich noch verbessern kann (Draw). Er gewinnt auf zwei Wegen: Fold Equity + Treffer-Equity.</p><p><b>Gute Bluff-Kandidaten:</b></p><ul><li>Hände <b>ohne Showdown-Wert</b> (gewinnen nie, wenn gecheckt wird).</li><li>Hände mit <b>Blockern</b> auf die Calling-Range des Gegners (z. B. das A♠ auf einem Board mit drei Pik blockt den Nut-Flush).</li><li>Draws auf Flop und Turn (Semi-Bluffs).</li></ul>' },
            { t: 'text', h: '<p><b>Break-even des Bluffs:</b> Ein Bluff mit Einsatz B in Pot P muss so oft funktionieren: <span class="formula-inline">B ÷ (P + B)</span>. Eine Pot-Bet muss also in 50 % der Fälle Folds erzeugen, eine halbe Pot-Bet nur in 33 %.</p>' },
            { t: 'tip', h: 'Bluffe nicht gegen Calling Stations! Exploitativ gilt: Gegen Gegner, die zu viel callen, wenig bluffen und mehr dünn value-betten.' },
          ],
          quiz: [
            q('valueBluff', 'Was ist ein Semi-Bluff?', ['Bluff mit halber Potgröße', 'Bet mit einem Draw, der sich noch verbessern kann', 'Ein Check-Call', 'Ein Bluff am River'], 1, 'Semi-Bluff = Bet mit Verbesserungs-Equity.'),
            q('valueBluff', 'Wie oft muss eine Pot-große Bluff-Bet funktionieren, um Break-even zu sein?', ['25 %', '33 %', '50 %', '66 %'], 2, 'P ÷ (P + P) = 50 %.'),
            q('valueBluff', 'Welche Hand ist am River ein besserer Bluff-Kandidat?', ['Mittleres Paar', 'Verpasster Draw ohne Showdown-Wert', 'Top Pair', 'Set'], 1, 'Hände ohne Showdown-Wert verlieren durch Checken – sie können nur durch Bluffen gewinnen.'),
            q('exploit', 'Gegen eine Calling Station solltest du …', ['mehr bluffen', 'weniger bluffen, mehr Value betten', 'immer checken', 'nur All-in gehen'], 1, 'Calling Stations folden zu selten – Bluffs verlieren, Value Bets gewinnen.'),
          ],
        },
        {
          id: 'm7l3', title: 'Bet-Sizing & Planung über mehrere Straßen', min: 8,
          sections: [
            { t: 'text', h: '<p>Die Bet-Größe ist eine strategische Entscheidung:</p><ul><li><b>Klein (25–40 %)</b>: Viele Hände (auch schwache) setzen, Range-Vorteil nutzen, billig Informationen holen.</li><li><b>Mittel (50–75 %)</b>: Standard für Value + Draws.</li><li><b>Groß/Overbet (100 %+)</b>: <b>Polarisierte Range</b> – sehr starke Hände oder Bluffs, keine mittleren Hände.</li></ul><p><b>Geometrisches Sizing:</b> Wenn du mit einer starken Hand bis zum River All-in kommen willst, wähle Größen, mit denen der Stack über die Straßen gleichmäßig in den Pot gelangt.</p><p><b>Stack-to-Pot Ratio (SPR):</b> Effektiver Stack ÷ Pot am Flop. Bei niedriger SPR (&lt; 4) ist Top Pair oft genug für All-in; bei hoher SPR (&gt; 10) brauchst du stärkere Hände für große Pots.</p>' },
            { t: 'tip', h: 'Bet-Größe sollte von Board und Range abhängen – nicht von deiner konkreten Hand. Sonst verrätst du deine Stärke.' },
          ],
          quiz: [
            q('valueBluff', 'Was signalisiert eine Overbet typischerweise?', ['Mittlere Hand', 'Polarisierte Range (Nuts oder Bluff)', 'Einen Draw', 'Schwäche'], 1, 'Overbets sind polarisiert.'),
            q('ranges', 'Pot 20 BB, effektiver Stack 60 BB. SPR?', ['2', '3', '6', '40'], 1, '60 ÷ 20 = 3.'),
            q('valueBluff', 'Warum sollte die Bet-Größe nicht von der konkreten Hand abhängen?', ['Weil es Regeln verbieten', 'Weil du sonst deine Handstärke verrätst', 'Weil sie immer 50 % sein muss', 'Das ist egal'], 1, 'Unterschiedliche Größen für starke und schwache Hände sind leicht auszunutzen.'),
          ],
        },
      ],
    },
    // ===================================================================== M8
    {
      id: 'm8', num: 8, title: 'Ranges & Hand Reading', icon: '◎', level: 5,
      desc: 'In Ranges statt Händen denken: Kombinatorik, Blocker, Range-Verengung.',
      gens: ['combos', 'spr', 'vsOpen', 'callFold'],
      lessons: [
        {
          id: 'm8l1', title: 'Denken in Ranges', min: 8,
          sections: [
            { t: 'text', h: '<p>Anfänger fragen: <i>„Was hat mein Gegner?“</i> Profis fragen: <i>„Welche <b>Range</b> von Händen hat mein Gegner, und wie stehe ich dagegen?“</i></p><p>Eine Range ist die Menge aller Hände, die ein Spieler in einer Situation haben kann. Jede Aktion (Raise, Call, Check) <b>verengt</b> die Range:</p><ol><li>UTG-Open: ca. 16 % der Hände.</li><li>C-Bet auf A-8-3: Value (Ax, Sets) + Bluffs.</li><li>Turn-Bet nach Call: noch stärker/fokussierter.</li><li>River-Overbet: polarisiert – Nuts oder Bluff.</li></ol>' },
            { t: 'range', title: 'UTG-Open-Range (Startpunkt des Hand Readings)', rfi: 'UTG' },
            { t: 'text', h: '<p><b>Gecappte Range:</b> Eine Range ohne die stärksten Hände. Wer preflop nur callt (statt 3-bettet), hat meist kein AA/KK → gecappt. Gecappte Ranges sind anfällig für großen Druck.</p>' },
          ],
          quiz: [
            q('ranges', 'Was ist eine Range?', ['Die Potgröße', 'Alle Hände, die ein Spieler in einer Situation haben kann', 'Die Anzahl der Spieler', 'Der Stack'], 1, 'Range = Verteilung möglicher Hände.'),
            q('ranges', 'Was bedeutet „gecappte Range“?', ['Range ohne die stärksten Hände', 'Range nur mit Nuts', 'Zu breite Range', 'Range mit Bluffs'], 0, 'Gecappt = nach oben begrenzt.'),
            q('ranges', 'Wie verändert sich die Range eines Spielers, der auf jeder Straße setzt?', ['Wird breiter', 'Wird stärker/enger (polarisierter)', 'Bleibt gleich', 'Wird zufällig'], 1, 'Mit jeder aggressiven Aktion verengt sich die Range.'),
          ],
        },
        {
          id: 'm8l2', title: 'Kombinatorik & Blocker', min: 9,
          sections: [
            { t: 'text', h: '<p><b>Kombinatorik</b> zählt, wie viele konkrete Kombinationen eine Hand hat:</p><ul><li>Pocket Pair: <b>6</b> Combos. Mit einer sichtbaren Karte: <b>3</b>. Mit zwei: <b>1</b>.</li><li>Ungepaarte Hand (z. B. AK): <b>16</b> Combos (4 suited + 12 offsuit). Pro sichtbarem Ass/König: 12 → 9 usw.</li></ul>' },
            { t: 'example', title: 'Sets vs. Bluffs', h: 'Board K♠ 8♦ 3♣. Der Gegner hat entweder ein Set (KK, 88, 33 = 3 × 3 = 9 Combos) oder einen Bluff wie QJ (16 Combos). Die Bluffs sind fast doppelt so häufig wie die Sets!' },
            { t: 'text', h: '<p><b>Blocker:</b> Karten in deiner Hand reduzieren die Kombinationen des Gegners. Hältst du A♠ auf einem Board mit drei Pik, kann der Gegner keinen Nut-Flush haben – ideal zum Bluffen. Hältst du K♥ auf einem K-8-3-Board, bleibt dem Gegner nur noch <b>1</b> KK-Combo statt 3 (ein König liegt bereits auf dem Board, einer in deiner Hand).</p>' },
          ],
          quiz: [
            q('ranges', 'Wie viele Combos AK gibt es insgesamt?', ['4', '12', '16', '6'], 2, '4 × 4 = 16.'),
            q('ranges', 'Eine Dame liegt auf dem Board. Wie viele QQ-Combos sind noch möglich?', ['6', '3', '1', '0'], 1, '3 verbleibende Damen → 3 über 2 = 3.'),
            q('ranges', 'Warum ist A♠ auf einem Pik-Monoton-Board ein guter Bluff-Blocker?', ['Er gibt dir einen Flush', 'Der Gegner kann keinen Nut-Flush haben', 'Er ist die höchste Karte', 'Er blockt Bluffs'], 1, 'Du entfernst die stärksten Calling-Hände aus der Range des Gegners.'),
          ],
        },
      ],
    },
    // ===================================================================== M9
    {
      id: 'm9', num: 9, title: 'GTO-Grundlagen', icon: '∑', level: 6,
      desc: 'Gleichgewicht, MDF, Bluff-Ratios, Polarisierung, Indifferenz und Mixed Strategies.',
      gens: ['mdf', 'bluffRatio', 'alpha', 'cbet'],
      lessons: [
        {
          id: 'm9l1', title: 'Was ist GTO?', min: 8,
          sections: [
            { t: 'text', h: '<p><b>GTO (Game Theory Optimal)</b> beschreibt eine Strategie im <b>Nash-Gleichgewicht</b>: Kein Spieler kann seinen Erwartungswert verbessern, indem er allein seine Strategie ändert. Eine GTO-Strategie ist <b>unausnutzbar</b> – sie verliert gegen keine Gegenstrategie.</p><p>Moderne <b>Solver</b> (z. B. PioSolver, GTO Wizard) berechnen solche Strategien näherungsweise. Typische Eigenschaften:</p><ul><li><b>Balance:</b> In jeder Aktion stecken Value-Hände und Bluffs im richtigen Verhältnis.</li><li><b>Gemischte Strategien:</b> Dieselbe Hand wird manchmal gesetzt, manchmal gecheckt.</li><li><b>Indifferenz:</b> Der Gegner soll mit seinen Bluff-Catchern zwischen Call und Fold indifferent sein.</li></ul>' },
            { t: 'tip', h: 'GTO ist eine Verteidigungsstrategie und ein Referenzrahmen. Den meisten Gewinn gegen schwache Spieler macht man, indem man gezielt von GTO abweicht (exploitativ) – dazu Modul 10.' },
          ],
          quiz: [
            q('gto', 'Was zeichnet eine GTO-Strategie aus?', ['Sie gewinnt maximal gegen jeden Spieler', 'Sie ist unausnutzbar', 'Sie blufft nie', 'Sie spielt nur Premiumhände'], 1, 'GTO = Gleichgewicht, nicht ausnutzbar.'),
            q('gto', 'Was ist eine gemischte Strategie?', ['Mehrere Spieler gleichzeitig', 'Dieselbe Hand mit verschiedenen Aktionen in festen Frequenzen spielen', 'Bluff und Value gleichzeitig', 'Zufälliges Spielen'], 1, 'Mixed Strategy: z. B. 60 % Bet, 40 % Check.'),
            q('gto', 'Was bedeutet Indifferenz?', ['Der Gegner ist gelangweilt', 'Call und Fold haben für den Gegner denselben EV', 'Alle Hände sind gleich stark', 'Kein Spieler setzt'], 1, 'Bei Indifferenz bringt keine Option mehr als die andere.'),
          ],
        },
        {
          id: 'm9l2', title: 'MDF & Bluff-Ratios', min: 10,
          sections: [
            { t: 'text', h: '<p><b>Minimum Defense Frequency (MDF):</b> Wie oft musst du gegen eine Bet mindestens weitermachen, damit ein Bluff mit beliebigen Karten nicht automatisch profitabel ist?</p><p class="formula">MDF = Pot ÷ (Pot + Bet)</p><p><b>Optimaler Bluff-Anteil am River</b> (damit der Gegner indifferent ist):</p><p class="formula">Bluffs = Bet ÷ (Pot + 2 × Bet)</p>' },
            { t: 'mdf' },
            { t: 'text', h: '<p><b>Polarisierung:</b> Große Bets enthalten nur sehr starke Hände und Bluffs (polarisiert). Kleine Bets enthalten viele mittlere Hände (merged/linear). Je größer die Bet, desto mehr Bluffs sind erlaubt – aber desto mehr Nuts brauchst du auch.</p><p>Auf Flop und Turn sind mehr „Bluffs“ erlaubt, weil sie noch Equity haben (Semi-Bluffs).</p>' },
          ],
          quiz: [
            q('gto', 'Der Gegner setzt die Hälfte des Pots. MDF?', ['50 %', '67 %', '33 %', '75 %'], 1, '1 ÷ (1 + 0,5) = 66,7 %.'),
            q('gto', 'River-Pot-Bet. Optimaler Bluff-Anteil der Setzrange?', ['50 %', '33 %', '25 %', '10 %'], 1, '1 ÷ (1 + 2) = 33 %.'),
            q('gto', 'Was passiert mit dem erlaubten Bluff-Anteil, wenn die Bet größer wird?', ['Sinkt', 'Steigt', 'Bleibt gleich', 'Wird 0'], 1, 'Größere Bets geben dem Gegner schlechtere Odds → mehr Bluffs möglich.'),
            q('gto', 'Was ist eine polarisierte Range?', ['Nur mittlere Hände', 'Sehr starke Hände und Bluffs, keine mittleren', 'Nur Bluffs', 'Alle Hände'], 1, 'Polarisiert = zwei Pole: Nuts und Bluffs.'),
          ],
        },
      ],
    },
    // ===================================================================== M10
    {
      id: 'm10', num: 10, title: 'Exploitative Play & Mindset', icon: '★', level: 7,
      desc: 'Spielertypen erkennen und ausnutzen, Bankroll-Management, Tilt-Kontrolle.',
      gens: ['valueBluff', 'mdf', 'callFold', 'vsOpen'],
      lessons: [
        {
          id: 'm10l1', title: 'Spielertypen & Exploits', min: 9,
          sections: [
            { t: 'text', h: '<p><b>Exploitatives Spiel</b> weicht gezielt von GTO ab, um die Fehler eines Gegners maximal auszunutzen. Dazu musst du Spielertypen erkennen – z. B. über HUD-Statistiken wie <b>VPIP</b> (wie oft freiwillig Geld investiert) und <b>PFR</b> (wie oft preflop erhöht).</p><table class="tbl"><tr><th>Typ</th><th>Merkmale</th><th>Exploit</th></tr><tr><td><b>Nit / Rock</b></td><td>VPIP &lt; 15, spielt nur Premium</td><td>Oft stehlen, bei Gegenwehr folden</td></tr><tr><td><b>TAG</b></td><td>VPIP 20–25, PFR 17–21, solide</td><td>Nahe GTO spielen</td></tr><tr><td><b>LAG</b></td><td>VPIP 30+, aggressiv</td><td>Breiter callen, Fallen stellen</td></tr><tr><td><b>Calling Station</b></td><td>Hoher VPIP, niedriger PFR, callt alles</td><td>Nicht bluffen, dünn value-betten</td></tr><tr><td><b>Maniac</b></td><td>Extrem aggressiv</td><td>Starke Hände spielen lassen, Bluff-Catcher callen</td></tr></table>' },
            { t: 'tip', h: 'Die größten Leaks im Low-Stakes-Bereich: Spieler bluffen am River zu wenig und callen zu viel. Exploit: Gegen unbekannte Gegner River-Raises respektieren, dünner value-betten.' },
          ],
          quiz: [
            q('exploit', 'Gegner hat VPIP 45 / PFR 6. Welcher Typ?', ['Nit', 'TAG', 'Calling Station', 'Maniac'], 2, 'Viele Hände, kaum Aggression → passive Calling Station.'),
            q('exploit', 'Wie nutzt du einen Nit aus?', ['Viel gegen ihn bluffen/stehlen, bei Gegenwehr folden', 'Nie gegen ihn spielen', 'Ihn immer callen', 'Ihn ständig 4-betten'], 0, 'Nits folden zu viel und haben bei Gegenwehr fast immer eine starke Hand.'),
            q('exploit', 'Was misst VPIP?', ['Wie oft jemand preflop raist', 'Wie oft jemand freiwillig Geld in den Pot investiert', 'Gewinnrate', 'Showdown-Quote'], 1, 'VPIP = Voluntarily Put money In Pot.'),
          ],
        },
        {
          id: 'm10l2', title: 'Bankroll-Management & Mentale Stärke', min: 8,
          sections: [
            { t: 'text', h: '<p><b>Varianz</b> ist im Poker enorm. Selbst starke Spieler haben Downswings über zehntausende Hände. Deshalb:</p><ul><li><b>Bankroll-Management:</b> Mindestens <b>30–50 Buy-ins</b> für Cash Games, 100+ für Turniere.</li><li><b>Stop-Loss:</b> Lege fest, wann du eine Session beendest.</li><li><b>Tilt erkennen:</b> Emotionale, schlechte Entscheidungen nach Bad Beats. Warnsignale: schneller spielen, Rache-Gedanken, Ranges ausweiten.</li><li><b>Ergebnis ≠ Entscheidung:</b> Bewerte deine Entscheidungen, nicht die Ergebnisse (Stichwort „Resulting“).</li></ul>' },
            { t: 'tip', h: 'Spiele nur mit Geld, dessen Verlust du dir leisten kannst. Poker sollte Freude machen – setze dir Zeit- und Geldlimits.' },
          ],
          quiz: [
            q('mental', 'Wie viele Buy-ins empfiehlt man mindestens für Cash Games?', ['5', '10', '30–50', '1'], 2, '30–50 Buy-ins schützen vor Varianz.'),
            q('mental', 'Was ist „Tilt“?', ['Eine Bet-Größe', 'Emotional beeinflusstes, schlechteres Spiel', 'Ein Kartentrick', 'Ein Spielertyp'], 1, 'Tilt = Frust führt zu schlechten Entscheidungen.'),
            q('mental', 'Du verlierst mit AA gegen KK All-in preflop. War deine Entscheidung falsch?', ['Ja', 'Nein – die Entscheidung war +EV, das Ergebnis Varianz', 'Nur online', 'Kommt auf die Farbe an'], 1, 'Bewerte Entscheidungen, nicht Ergebnisse.'),
          ],
        },
      ],
    },
  ];

  // Hilfsfunktionen
  const lessonIndex = {};
  MODULES.forEach((m) => m.lessons.forEach((l, i) => { lessonIndex[l.id] = { module: m, lesson: l, index: i }; }));

  function allQuizQuestions(filterSkill) {
    const out = [];
    MODULES.forEach((m) => m.lessons.forEach((l) => l.quiz.forEach((qq, i) => {
      if (!filterSkill || qq.s === filterSkill) out.push({ ...qq, id: `${l.id}q${i}`, module: m.id });
    })));
    return out;
  }

  root.Curriculum = { LEVELS, MODULES, lessonIndex, allQuizQuestions };
})(window);
