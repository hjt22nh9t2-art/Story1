/* Strategie-Bibliothek, Equity-Rechner, Glossar, Einstellungen. */
(function (root) {
  'use strict';
  const UI = root.UI, S = root.Store, P = root.Poker, R = root.Ranges;
  const V = (root.Views = root.Views || {});

  // ---------------------------------------------------------------- Strategie
  const ARTICLES = [
    { id: 'charts', title: 'Preflop-Charts', icon: '▦', desc: 'Alle Referenz-Ranges interaktiv' },
    { id: 'calc', title: 'Equity-Rechner', icon: '%', desc: 'Hand gegen Hand oder Range' },
    { id: 'postflop', title: 'Postflop-Leitfaden', icon: '▲', desc: 'C-Bets, Sizing, Boardtexturen' },
    { id: 'exploit', title: 'Spielertypen & Exploits', icon: '★', desc: 'So schlägst du typische Gegner' },
    { id: 'leaks', title: 'Die 12 häufigsten Fehler', icon: '⚠', desc: 'Leaks, die dich Geld kosten' },
  ];

  V.strategy = (el, params) => {
    const a = params[0] || 'charts';
    el.innerHTML = `<header class="page-h"><div><h1>Strategie</h1><p class="muted">Nachschlagewerk und Werkzeuge für dein Spiel.</p></div></header>
      <div class="tabs">${ARTICLES.map((x) => `<a class="tab ${a === x.id ? 'on' : ''}" href="#/strategy/${x.id}">${x.icon} ${x.title}</a>`).join('')}</div><div id="stBody"></div>`;
    const b = el.querySelector('#stBody');
    ({ charts, calc, postflop, exploit, leaks }[a] || charts)(b);
    UI.activateDemos(b);
  };

  function charts(b) {
    const opts = [
      ...Object.keys(R.RFI).map((p) => [`rfi:${p}`, `Open-Raise ${p} (${R.POSITION_INFO[p].name})`]),
      ...Object.keys(R.VS_OPEN).map((k) => [`vs:${k}`, `${R.VS_OPEN[k].hero} gegen Open von ${R.VS_OPEN[k].villain}`]),
      ...Object.keys(R.VS_3BET).map((k) => [`v3:${k}`, `${R.VS_3BET[k].hero}-Open gegen 3-Bet von ${R.VS_3BET[k].villain}`]),
    ];
    let cur = opts[3][0];
    const render = () => {
      const [kind, k] = cur.split(':');
      let grid, legend, pct;
      if (kind === 'rfi') { const s = R.set(R.RFI[k]); grid = UI.rangeGrid({ raise: s }); legend = '<span class="lg r3"></span>Raise <span class="lg"></span>Fold'; pct = `Range: ${Math.round(R.rangePercent(s) * 100)} % der Hände`; }
      else if (kind === 'vs') { const s = R.VS_OPEN[k]; const a = R.set(s.threebet), c = R.set(s.call); grid = UI.rangeGrid({ raise: a, call: c }); legend = '<span class="lg r3"></span>3-Bet <span class="lg rcall"></span>Call <span class="lg"></span>Fold'; pct = `3-Bet ${Math.round(R.rangePercent(a) * 100)} % · Call ${Math.round(R.rangePercent(c) * 100)} %`; }
      else { const s = R.VS_3BET[k]; const a = R.set(s.fourbet), c = R.set(s.call); grid = UI.rangeGrid({ raise: a, call: c }); legend = '<span class="lg r3"></span>4-Bet <span class="lg rcall"></span>Call <span class="lg"></span>Fold'; pct = `4-Bet ${Math.round(R.rangePercent(a) * 100)} % · Call ${Math.round(R.rangePercent(c) * 100)} %`; }
      b.innerHTML = `<div class="grid-side"><div class="panel"><select id="ch">${opts.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`).join('')}</select><div class="muted small" style="margin:8px 0">${pct}</div>${grid}<div class="rlegend">${legend}</div></div>
        <div class="panel"><h3>So liest du die Matrix</h3><ul class="ul"><li>Diagonale: Pocket Pairs (AA … 22)</li><li>Oberhalb: suited Hände (z. B. AKs)</li><li>Unterhalb: offsuit Hände (z. B. AKo)</li></ul>
        <p class="muted small">Die Charts sind vereinfachte, solver-nahe Referenzen für 6-max Cash Games mit 100 BB und ohne Ante. In echten Solver-Lösungen werden manche Hände gemischt gespielt.</p>
        <a class="btn primary" href="#/gto/builder">Im Range-Builder üben</a></div></div>`;
      b.querySelector('#ch').addEventListener('change', (e) => { cur = e.target.value; render(); });
    };
    render();
  }

  function parseCards(str) {
    const s = (str || '').replace(/[\s,]/g, '').replace(/10/g, 'T');
    const out = [];
    for (let i = 0; i + 1 < s.length; i += 2) {
      const c = s[i].toUpperCase() + s[i + 1].toLowerCase();
      if (!P.RANKS.includes(c[0]) || !P.SUITS.includes(c[1])) throw new Error(`Ungültige Karte: ${s.slice(i, i + 2)}`);
      out.push(c);
    }
    return out;
  }

  function calc(b) {
    b.innerHTML = `<div class="grid-side"><div class="panel"><h3>Equity-Rechner</h3>
      <p class="muted small">Karten im Format <code>AhKd</code> (Rang: 2–9, T, J, Q, K, A · Farbe: s=Pik, h=Herz, d=Karo, c=Kreuz).</p>
      <label class="field">Deine Hand<input id="eh" value="AhKh" maxlength="6"></label>
      <label class="field">Gegner<select id="ev"><option value="hand">Konkrete Hand</option><option value="range">Range (Top x %)</option><option value="random">Zufällige Hand</option></select></label>
      <label class="field" id="evHandF">Hand des Gegners<input id="evh" value="QsQd" maxlength="6"></label>
      <label class="field hidden" id="evRangeF">Range: Top <b id="rp">20</b> %<input type="range" id="evr" min="2" max="100" value="20"></label>
      <label class="field">Anzahl Gegner<select id="en"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>
      <label class="field">Board (optional, 0–5 Karten)<input id="eb" value="" placeholder="z. B. 9h5h2c" maxlength="15"></label>
      <button class="btn primary" id="go">Berechnen</button></div>
      <div class="panel" id="out"><div class="muted">Ergebnis erscheint hier.</div></div></div>`;
    const mode = b.querySelector('#ev');
    mode.addEventListener('change', () => { b.querySelector('#evHandF').classList.toggle('hidden', mode.value !== 'hand'); b.querySelector('#evRangeF').classList.toggle('hidden', mode.value !== 'range'); });
    b.querySelector('#evr').addEventListener('input', (e) => (b.querySelector('#rp').textContent = e.target.value));
    b.querySelector('#go').addEventListener('click', () => {
      const out = b.querySelector('#out');
      try {
        const h = parseCards(b.querySelector('#eh').value), board = parseCards(b.querySelector('#eb').value);
        if (h.length !== 2) throw new Error('Deine Hand braucht genau 2 Karten.');
        if (board.length > 5 || board.length === 1 || board.length === 2) throw new Error('Board: 0, 3, 4 oder 5 Karten.');
        const n = +b.querySelector('#en').value;
        let vill;
        if (mode.value === 'hand') { const v = parseCards(b.querySelector('#evh').value); if (v.length !== 2) throw new Error('Gegnerhand braucht 2 Karten.'); vill = [v, ...Array(n - 1).fill(null)]; }
        else if (mode.value === 'range') { const rs = P.topRange(+b.querySelector('#evr').value / 100); vill = Array(n).fill({ range: rs }); }
        else vill = Array(n).fill(null);
        const all = [...h, ...board, ...vill.filter(Array.isArray).flat()];
        if (new Set(all).size !== all.length) throw new Error('Eine Karte ist doppelt vergeben.');
        out.innerHTML = '<div class="muted">Simuliere…</div>';
        setTimeout(() => {
          const t0 = performance.now();
          const e = P.equity(h, vill, board, 6000);
          const ms = Math.round(performance.now() - t0);
          const cur = board.length >= 3 ? P.evaluate([...h, ...board]) : null;
          out.innerHTML = `<h3>Ergebnis</h3><div class="cv">${UI.cards(h)}</div>${board.length ? `<div class="cv"><div class="cv-label">Board</div>${UI.cards(board, { small: true })}</div>` : ''}
            <div class="big-num">${(e.equity * 100).toFixed(1)} %</div><div class="muted">Equity · Sieg ${(e.win * 100).toFixed(1)} % · Split ${(e.tie * 100).toFixed(1)} %</div>
            ${UI.bar(e.equity)}${cur ? `<p>Aktuelle Hand: <b>${cur.desc}</b></p>` : ''}
            <p class="muted small">6.000 Monte-Carlo-Durchläufe in ${ms} ms. Benötigte Equity für Calls: ½-Pot-Bet 25 %, ⅔-Pot 28,6 %, Pot 33,3 %.</p>`;
        }, 30);
      } catch (err) { out.innerHTML = `<div class="neg">${UI.esc(err.message)}</div>`; }
    });
  }

  function postflop(b) {
    b.innerHTML = `<div class="panel prose">
      <h3>1. Wer hat den Range-Vorteil?</h3><p>Frage dich auf jedem Flop: Welche Range trifft dieses Board besser? Der Preflop-Raiser profitiert von hohen Karten (A, K), der Caller von tiefen, verbundenen Boards.</p>
      <h3>2. C-Bet-Matrix (Heads-up, in Position)</h3>
      <table class="tbl"><tr><th>Board</th><th>Beispiel</th><th>Frequenz</th><th>Größe</th></tr>
      <tr><td>Hoch & trocken</td><td>K♠ 7♦ 2♣</td><td>Hoch (70–90 %)</td><td>25–33 %</td></tr>
      <tr><td>Ass-hoch</td><td>A♥ 8♣ 3♦</td><td>Hoch</td><td>25–33 %</td></tr>
      <tr><td>Gepaart</td><td>8♣ 8♦ 4♥</td><td>Hoch</td><td>25–33 %</td></tr>
      <tr><td>Broadway, nass</td><td>K♥ Q♥ T♣</td><td>Mittel</td><td>50–75 %</td></tr>
      <tr><td>Tief & verbunden</td><td>7♠ 6♠ 5♦</td><td>Niedrig (30–45 %)</td><td>50–75 %</td></tr>
      <tr><td>Monoton</td><td>J♦ 8♦ 3♦</td><td>Niedrig–Mittel</td><td>25–33 %</td></tr></table>
      <h3>3. Turn-Strategie</h3><p>Gute Turnkarten für den Aggressor: Overcards, die seine Range verbessern (A, K), Blanks auf trockenen Boards. Schlechte: Karten, die Straßen/Flushes der Caller-Range komplettieren. Barrel mit: Value, starke Draws, Hände mit Blockern.</p>
      <h3>4. River-Entscheidungen</h3><ul class="ul"><li><b>Value Bet</b>, wenn schlechtere Hände callen.</li><li><b>Check</b> mit mittlerer Stärke (Showdown-Wert).</li><li><b>Bluff</b> mit Händen ohne Showdown-Wert und guten Blockern.</li><li>Bluff-Anteil ≈ Bet ÷ (Pot + 2 × Bet).</li></ul>
      <h3>5. Gegen Bets verteidigen</h3><p>Nutze die MDF als Orientierung: gegen ½-Pot mindestens ~67 % der Range weiterspielen, gegen Pot ~50 %. Gegen passive Gegner, die selten bluffen, darfst du deutlich mehr folden.</p></div>`;
  }

  function exploit(b) {
    b.innerHTML = `<div class="grid2">${[
      ['Nit / Rock', 'VPIP < 15 %', 'Stiehl seine Blinds ständig. Folde gegen seine 3-Bets und große Bets fast alles außer Premium. Bezahle ihn nicht mit Top Pair aus, wenn er Druck macht.'],
      ['Calling Station', 'VPIP hoch, PFR niedrig', 'Niemals bluffen. Value-bette dünn und groß. Isoliere seine Limps mit breiter Range. Sie zahlt Top Pair bis zum River.'],
      ['Maniac', 'Extrem aggressiv', 'Lass ihn bluffen: Checke starke Hände, calle Bluff-Catcher weiter. Weite deine Calling-Range aus, verenge deine Bluffs.'],
      ['LAG', 'Loose-aggressiv', 'Häufiger 3-betten (auch für Value mit mehr Händen), gegen seine C-Bets öfter check-raisen. Vermeide marginale Calls ohne Position.'],
      ['TAG', 'Solide Regs', 'Nahe an GTO bleiben. Suche Spots, in denen er überfoldet (z. B. Turn-Probes, Overbets auf Scare Cards).'],
      ['Tilter', 'Emotional nach Verlusten', 'Er spielt nach Bad Beats zu loose und aggressiv. Value-bette stärker, bluffe weniger, gib ihm Gelegenheit, Fehler zu machen.'],
    ].map(([t, s, d]) => `<div class="panel"><div class="ph-row"><h3>${t}</h3><span class="badge">${s}</span></div><p>${d}</p></div>`).join('')}</div>
    <div class="tip"><span class="tip-i">💡</span><div>Im Simulator triffst du auf genau diese Spielertypen (Label unter dem Namen). Übe, deine Strategie anzupassen!</div></div>`;
  }

  function leaks(b) {
    const L = [
      ['Zu viele Hände spielen', 'Halte dich an die Opening Ranges. Besonders aus früher Position und den Blinds werden zu viele Hände gespielt.'],
      ['Limpen', 'Raise oder Fold statt Limp. Limps geben die Initiative ab und laden zu Isolations-Raises ein.'],
      ['Zu passiv mit starken Händen', 'Setze für Value! Wer slowplayt, verliert viel Geld gegen Gegner, die gerne callen.'],
      ['Ohne Pot Odds callen', 'Vergleiche Equity mit benötigter Equity, bevor du callst.'],
      ['Automatische C-Bets', 'Setze nur auf Boards, die deiner Range helfen. Checke öfter auf tiefen, verbundenen Boards.'],
      ['Position ignorieren', 'Spiele in Position breiter und out of Position enger.'],
      ['Gegen Calling Stations bluffen', 'Passe dich an! Gegen Stations nur Value.'],
      ['Ergebnisorientiert denken', 'Bewerte Entscheidungen, nicht Ergebnisse. Varianz ist normal.'],
      ['Tilt', 'Pausiere nach großen Verlusten. Setze Stop-Loss-Limits.'],
      ['Schlechtes Bankroll-Management', 'Mindestens 30–50 Buy-ins für dein Limit.'],
      ['Overcalling am River', 'Viele Gegner bluffen am River zu selten. Große River-Raises respektieren.'],
      ['Gedankenloses Bet-Sizing', 'Größe nach Board und Range, nicht nach der eigenen Hand wählen.'],
    ];
    b.innerHTML = `<div class="leaks">${L.map(([t, d], i) => `<div class="panel leak"><div class="leak-n">${i + 1}</div><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}</div>`;
  }

  // ---------------------------------------------------------------- Glossar
  const GLOSSARY = [
    ['3-Bet', 'Re-Raise auf einen Open-Raise (zweite Erhöhung preflop).'], ['4-Bet', 'Re-Raise auf eine 3-Bet.'],
    ['All-in', 'Alle verbleibenden Chips setzen.'], ['Alpha', 'Wie oft ein Bluff funktionieren muss: Bet ÷ (Pot + Bet).'],
    ['Ante', 'Kleiner Pflichteinsatz aller Spieler (v. a. in Turnieren).'], ['Backdoor', 'Draw, der Turn UND River benötigt (z. B. Backdoor-Flush).'],
    ['Bad Beat', 'Eine starke Hand verliert gegen einen unwahrscheinlichen Treffer.'], ['Bankroll', 'Das ausschließlich für Poker reservierte Geld.'],
    ['Barrel', 'Weitere Bet auf einer späteren Straße (Double/Triple Barrel).'], ['Bet', 'Erster Einsatz in einer Setzrunde.'],
    ['Big Blind (BB)', 'Größerer Pflichteinsatz; auch Maßeinheit für Stacks und Gewinne.'], ['Blocker', 'Eigene Karten, die Kombinationen des Gegners unmöglich machen.'],
    ['Bluff', 'Bet mit einer schwachen Hand, um bessere Hände zum Folden zu bringen.'], ['Bluff-Catcher', 'Hand, die nur Bluffs schlägt.'],
    ['Board', 'Die offenen Gemeinschaftskarten.'], ['Broadway', 'Karten von Zehn bis Ass; auch die Straße A-K-Q-J-T.'],
    ['Button (BTN)', 'Dealer-Position; handelt postflop zuletzt.'], ['Call', 'Den aktuellen Einsatz mitgehen.'],
    ['Calling Station', 'Passiver Spieler, der zu viel callt.'], ['Cap / gecappt', 'Range ohne die stärksten Hände.'],
    ['C-Bet', 'Continuation Bet: Bet des Preflop-Aggressors am Flop.'], ['Check', 'Schieben ohne Einsatz.'],
    ['Check-Raise', 'Erst checken, dann auf eine Bet erhöhen.'], ['Cold Call', 'Einen Raise callen, ohne vorher investiert zu haben.'],
    ['Combo', 'Konkrete Kartenkombination einer Hand (AKs hat 4 Combos).'], ['Cutoff (CO)', 'Platz rechts vom Button.'],
    ['Donk Bet', 'Bet in den Preflop-Aggressor hinein, out of Position.'], ['Draw', 'Unfertige Hand, die sich verbessern kann.'],
    ['Effektiver Stack', 'Der kleinere der beteiligten Stacks – mehr kann nicht verloren/gewonnen werden.'], ['Equity', 'Anteil am Pot bei Ausspielen ohne weitere Einsätze.'],
    ['EV', 'Expected Value – durchschnittlicher Gewinn einer Entscheidung.'], ['Exploit', 'Gezielte Abweichung von GTO, um Gegnerfehler auszunutzen.'],
    ['Flop', 'Die ersten drei Gemeinschaftskarten.'], ['Fold', 'Aufgeben.'], ['Fold Equity', 'Wert, der daraus entsteht, dass der Gegner folden könnte.'],
    ['Freeroll', 'Situation, in der man nur gewinnen oder splitten kann.'], ['GTO', 'Game Theory Optimal – unausnutzbare Gleichgewichtsstrategie.'],
    ['Gutshot', 'Straßen-Draw mit einer Lücke in der Mitte (4 Outs).'], ['Heads-up', 'Nur zwei Spieler.'],
    ['Hero Call', 'Mutiger Call mit einer schwachen Hand, in Erwartung eines Bluffs.'], ['Hijack (HJ)', 'Zwei Plätze rechts vom Button.'],
    ['Hole Cards', 'Die beiden verdeckten Karten eines Spielers.'], ['Implied Odds', 'Zusätzliche zukünftige Gewinne, wenn man trifft.'],
    ['In Position (IP)', 'Nach dem Gegner handeln.'], ['Indifferenz', 'Zwei Optionen haben denselben EV.'],
    ['Kicker', 'Beikarte, die bei gleicher Kombination entscheidet.'], ['LAG', 'Loose-aggressiver Spieler.'],
    ['Limp', 'Preflop nur den Big Blind callen.'], ['MDF', 'Minimum Defense Frequency: Pot ÷ (Pot + Bet).'],
    ['Monoton', 'Flop mit drei Karten einer Farbe.'], ['Multiway', 'Pot mit mehr als zwei Spielern.'],
    ['Nit', 'Sehr enger, passiver Spieler.'], ['Nuts', 'Die bestmögliche Hand in der aktuellen Situation.'],
    ['OESD', 'Open-Ended Straight Draw – beidseitig offener Straßen-Draw (8 Outs).'], ['Offsuit', 'Zwei Karten unterschiedlicher Farbe.'],
    ['Out of Position (OOP)', 'Vor dem Gegner handeln müssen.'], ['Outs', 'Karten, die die eigene Hand zur besten machen.'],
    ['Overbet', 'Bet größer als der Pot.'], ['Overpair', 'Pocket Pair höher als alle Boardkarten.'],
    ['Pocket Pair', 'Zwei Hole Cards gleichen Rangs.'], ['Polarisiert', 'Range aus sehr starken Händen und Bluffs.'],
    ['Position', 'Reihenfolge des Handelns relativ zu den Gegnern.'], ['Pot', 'Summe aller Einsätze einer Hand.'],
    ['Pot Odds', 'Verhältnis von Potgröße zu Call-Betrag.'], ['Preflop', 'Setzrunde vor dem Flop.'],
    ['PFR', 'Preflop Raise – wie oft ein Spieler preflop erhöht.'], ['Raise', 'Einen Einsatz erhöhen.'],
    ['Rake', 'Gebühr des Anbieters/Casinos aus dem Pot.'], ['Range', 'Alle Hände, die ein Spieler in einer Situation haben kann.'],
    ['RFI', 'Raise First In – Open-Raise, wenn alle vorher gefoldet haben.'], ['River', 'Fünfte und letzte Gemeinschaftskarte.'],
    ['Semi-Bluff', 'Bet mit einem Draw.'], ['Set', 'Drilling mit Pocket Pair + einer Boardkarte.'],
    ['Showdown', 'Aufdecken der Karten am Ende.'], ['Side Pot', 'Separater Pot, wenn ein Spieler All-in ist.'],
    ['Slowplay', 'Starke Hand passiv spielen, um den Gegner zu täuschen.'], ['Small Blind (SB)', 'Kleiner Pflichteinsatz links vom Button.'],
    ['SPR', 'Stack-to-Pot Ratio: effektiver Stack ÷ Pot.'], ['Squeeze', '3-Bet nach Raise und mindestens einem Call.'],
    ['Suited', 'Zwei Karten gleicher Farbe.'], ['TAG', 'Tight-aggressiver Spieler.'], ['Thin Value', 'Value Bet mit knapp starker Hand.'],
    ['Tilt', 'Emotional beeinträchtigtes Spiel.'], ['Trips', 'Drilling mit einem Paar auf dem Board + einer Hole Card.'],
    ['Turn', 'Vierte Gemeinschaftskarte.'], ['UTG', 'Under the Gun – erster Spieler preflop.'],
    ['Value Bet', 'Bet, um von schlechteren Händen bezahlt zu werden.'], ['Varianz', 'Schwankung der Ergebnisse um den Erwartungswert.'],
    ['VPIP', 'Voluntarily Put money In Pot – wie oft freiwillig investiert wird.'], ['Wheel', 'Straße A-2-3-4-5.'],
  ];

  V.glossary = (el) => {
    el.innerHTML = `<header class="page-h"><div><h1>Glossar</h1><p class="muted">${GLOSSARY.length} Poker-Begriffe von A bis Z.</p></div></header>
      <input class="search" id="gs" placeholder="Begriff suchen…" autocomplete="off"><div id="gl" class="glossary"></div>`;
    const render = (f) => {
      const ff = (f || '').toLowerCase();
      const items = GLOSSARY.filter(([t, d]) => !ff || t.toLowerCase().includes(ff) || d.toLowerCase().includes(ff)).sort((a, b) => a[0].localeCompare(b[0], 'de'));
      let last = '';
      el.querySelector('#gl').innerHTML = items.map(([t, d]) => { const L = /[0-9]/.test(t[0]) ? '#' : t[0].toUpperCase(); const h = L !== last ? `<div class="gl-l">${L}</div>` : ''; last = L; return `${h}<div class="gl-i"><b>${t}</b><span>${d}</span></div>`; }).join('') || '<div class="empty">Kein Begriff gefunden.</div>';
    };
    el.querySelector('#gs').addEventListener('input', (e) => render(e.target.value));
    render('');
  };

  // ---------------------------------------------------------------- Einstellungen
  V.settings = (el) => {
    const st = S.db.settings;
    el.innerHTML = `<header class="page-h"><div><h1>Einstellungen</h1></div></header>
      <div class="grid2"><div class="panel"><h3>Profil & Darstellung</h3>
        <label class="field">Dein Name<input id="sn" value="${UI.esc(S.db.profile.name)}" maxlength="24"></label>
        <label class="chk"><input type="checkbox" id="s4" ${st.fourColor ? 'checked' : ''}> Vierfarbiges Deck (♦ blau, ♣ grün)</label>
        <label class="chk"><input type="checkbox" id="sa" ${st.animations ? 'checked' : ''}> Animationen</label>
        <div class="cv">${UI.cards(['As', 'Kh', 'Qd', 'Jc'])}</div></div>
      <div class="panel"><h3>Simulator</h3>
        <label class="field">Bot-Geschwindigkeit<select id="sp"><option value="250">Schnell</option><option value="700">Normal</option><option value="1300">Langsam</option></select></label>
        <label class="field">Startstack<select id="ss"><option value="50">50 BB</option><option value="100">100 BB</option><option value="200">200 BB</option></select></label>
        <label class="chk"><input type="checkbox" id="sc" ${st.coach ? 'checked' : ''}> Coach-Feedback anzeigen</label></div>
      <div class="panel"><h3>Daten</h3><p class="muted small">Dein Fortschritt wird lokal in diesem Browser gespeichert. Exportiere ihn als Backup oder um ihn auf ein anderes Gerät zu übertragen.</p>
        <div class="btn-row"><button class="btn ghost" id="ex">Exportieren</button><label class="btn ghost">Importieren<input type="file" id="im" accept="application/json" hidden></label><button class="btn danger" id="rs">Fortschritt zurücksetzen</button></div></div>
      <div class="panel"><h3>Über POKER MASTER</h3><p class="muted small">Interaktive Poker-Akademie für Texas Hold’em: 10 Module, 26 Lektionen, 19 Aufgaben-Generatoren, Simulator mit 5 Gegnertypen und Live-Coach, GTO-Trainer. Alle Berechnungen (Handbewertung, Equity per Monte-Carlo, Side Pots) laufen lokal.</p>
        <p class="muted small">Hinweis: Poker um echtes Geld birgt finanzielle Risiken. Spiele verantwortungsvoll.</p></div></div>`;
    el.querySelector('#sp').value = String(st.botSpeed); el.querySelector('#ss').value = String(st.startStack);
    const bind = (id, fn) => el.querySelector(id).addEventListener('change', (e) => { fn(e.target); S.save(); root.App.applySettings(); });
    bind('#sn', (t) => (S.db.profile.name = t.value.trim() || 'Spieler'));
    bind('#s4', (t) => (st.fourColor = t.checked));
    bind('#sa', (t) => (st.animations = t.checked));
    bind('#sp', (t) => (st.botSpeed = +t.value));
    bind('#ss', (t) => (st.startStack = +t.value));
    bind('#sc', (t) => (st.coach = t.checked));
    el.querySelector('#ex').addEventListener('click', () => {
      const blob = new Blob([S.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pokermaster-backup-${S.today()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    el.querySelector('#im').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((txt) => { try { S.importJSON(txt); UI.toast('Import erfolgreich ✓', 'xp'); root.App.route(); } catch (err) { UI.toast('Import fehlgeschlagen: ' + UI.esc(err.message), 'red'); } });
    });
    el.querySelector('#rs').addEventListener('click', () => {
      if (confirm('Wirklich den gesamten Fortschritt löschen? Das kann nicht rückgängig gemacht werden.')) { S.reset(); UI.toast('Fortschritt zurückgesetzt.'); root.App.route(); }
    });
  };
})(window);
