/* Übungs-Generatoren: erzeugen unendlich viele, zufällige, korrekt ausgewertete Aufgaben.
   Jede Aufgabe: { gen, skill, title, prompt, visual, options:[{label,value}], correct, explain } */
(function (root) {
  'use strict';
  const P = root.Poker, R = root.Ranges;
  const C = (cards, opts) => root.UI.cards(cards, opts);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const pct = (x, d = 0) => (x * 100).toFixed(d) + ' %';
  const shuffleOpts = (o) => P.shuffle(o);
  const deal = (n, excl = []) => P.deckWithout(excl).slice(0, n);

  function numericOptions(correct, fmt, spread) {
    const set = new Set([fmt(correct)]);
    const opts = [{ label: fmt(correct), value: 'c' }];
    let guard = 0;
    while (opts.length < 4 && guard++ < 50) {
      const v = correct + pick(spread);
      if (v <= 0) continue;
      const l = fmt(v);
      if (!set.has(l)) { set.add(l); opts.push({ label: l, value: 'w' + opts.length }); }
    }
    return shuffleOpts(opts);
  }

  const G = {};

  // ---------- Hand-Rankings ----------
  G.handIdentify = () => {
    const cards = deal(7);
    const e = P.evaluate(cards);
    const correct = e.royal ? 9 : e.cat;
    const others = new Set([correct]);
    while (others.size < 4) {
      const c = Math.max(0, Math.min(9, correct + pick([-2, -1, 1, 2, 3, -3])));
      others.add(c);
    }
    return {
      skill: 'handRanking', title: 'Hand erkennen',
      prompt: 'Welche beste 5-Karten-Hand ergibt sich aus den Hole Cards und dem Board?',
      visual: `<div class="cv"><div class="cv-label">Hole Cards</div>${C(cards.slice(0, 2))}</div><div class="cv"><div class="cv-label">Board</div>${C(cards.slice(2))}</div>`,
      options: shuffleOpts([...others].map((c) => ({ label: P.CATEGORY[c], value: c }))),
      correct,
      explain: `Beste Hand: <b>${e.desc}</b>.<div class="cv">${C(e.best)}</div>Es zählen immer genau die fünf besten Karten aus allen sieben.`,
    };
  };

  function compareGen(mode) {
    let board, a, b, ea, eb, tries = 0;
    do {
      const d = deal(9);
      a = d.slice(0, 2); b = d.slice(2, 4); board = d.slice(4, 9);
      ea = P.evaluate([...a, ...board]); eb = P.evaluate([...b, ...board]);
      tries++;
      if (mode === 'any') break;
      if (mode === 'close' && ea.cat === eb.cat) break;
      if (mode === 'kicker' && ea.cat === eb.cat && ea.cat <= 3 && (ea.tb[0] === eb.tb[0] || ea.score === eb.score)) break;
    } while (tries < 3000);
    const diff = P.compare(ea, eb);
    const correct = diff > 0 ? 'A' : diff < 0 ? 'B' : 'S';
    return {
      skill: mode === 'kicker' ? 'kicker' : 'handRanking', title: mode === 'kicker' ? 'Kicker & Split Pot' : 'Wer gewinnt?',
      prompt: 'Showdown! Welcher Spieler gewinnt den Pot?',
      visual: `<div class="cmp"><div class="cv"><div class="cv-label">Spieler A</div>${C(a)}</div><div class="cv"><div class="cv-label">Board</div>${C(board)}</div><div class="cv"><div class="cv-label">Spieler B</div>${C(b)}</div></div>`,
      options: [{ label: 'Spieler A', value: 'A' }, { label: 'Spieler B', value: 'B' }, { label: 'Split Pot', value: 'S' }],
      correct,
      explain: `<b>A:</b> ${ea.desc}<div class="cv">${C(ea.best, { small: true })}</div><b>B:</b> ${eb.desc}<div class="cv">${C(eb.best, { small: true })}</div>${P.explainComparison(ea, eb)}`,
    };
  }
  G.handCompare = () => compareGen(Math.random() < 0.5 ? 'close' : 'any');
  G.kicker = () => compareGen('kicker');

  G.rankOrder = () => {
    let x, y;
    do { x = Math.floor(Math.random() * 10); y = Math.floor(Math.random() * 10); } while (x === y);
    const examples = {
      0: ['Ah', 'Jd', '8c', '6s', '3h'], 1: ['Kh', 'Kd', '9c', '6s', '2h'], 2: ['Qh', 'Qd', '7c', '7s', 'Ah'],
      3: ['8h', '8d', '8c', 'Ks', '4h'], 4: ['5h', '6d', '7c', '8s', '9h'], 5: ['Ah', 'Jh', '8h', '5h', '2h'],
      6: ['Th', 'Td', 'Tc', '4s', '4h'], 7: ['7h', '7d', '7c', '7s', 'Qh'], 8: ['5s', '6s', '7s', '8s', '9s'], 9: ['Ts', 'Js', 'Qs', 'Ks', 'As'],
    };
    const correct = x > y ? 'A' : 'B';
    return {
      skill: 'handRanking', title: 'Ranking',
      prompt: 'Welche Hand ist im Ranking höher?',
      visual: `<div class="cmp"><div class="cv"><div class="cv-label">Hand A</div>${C(examples[x])}</div><div class="cv"><div class="cv-label">Hand B</div>${C(examples[y])}</div></div>`,
      options: [{ label: 'Hand A', value: 'A' }, { label: 'Hand B', value: 'B' }],
      correct,
      explain: `Hand A ist <b>${P.CATEGORY[x]}</b> (Rang ${10 - x} von 10), Hand B ist <b>${P.CATEGORY[y]}</b> (Rang ${10 - y} von 10). Je seltener eine Hand, desto höher steht sie im Ranking.`,
    };
  };

  // ---------- Preflop ----------
  function borderHand(rangeSet) {
    // 55 %: Hand nahe der Range-Grenze (lehrreich), sonst zufällig
    const list = P.HAND_ORDER.list;
    if (Math.random() < 0.55) {
      const idx = list.findIndex((c) => !rangeSet.has(c));
      const i = Math.max(0, Math.min(168, idx + Math.floor((Math.random() - 0.5) * 50)));
      return list[i];
    }
    return pick(list);
  }
  function holeForClass(cls) { return pick(P.classCombos(cls)); }

  G.rfi = () => {
    const pos = pick(['UTG', 'HJ', 'CO', 'BTN', 'SB']);
    const rs = R.set(R.RFI[pos]);
    const cls = borderHand(rs);
    const correct = rs.has(cls) ? 'raise' : 'fold';
    const width = pct(R.rangePercent(rs));
    return {
      skill: 'preflop', title: 'Open oder Fold?',
      prompt: `Alle Spieler vor dir haben gefoldet. Du sitzt auf <b>${pos}</b> (${R.POSITION_INFO[pos].name}). Was tust du?`,
      visual: `<div class="cv">${C(holeForClass(cls))}</div><div class="pill">${cls}</div>`,
      options: [{ label: 'Raise (2,5 BB)', value: 'raise' }, { label: 'Fold', value: 'fold' }],
      correct,
      explain: `<b>${cls}</b> ist ${correct === 'raise' ? '' : '<b>nicht</b> '}Teil der ${pos}-Opening-Range (ca. ${width} aller Hände).` +
        ` ${R.POSITION_INFO[pos].desc}<div class="mini-range" data-range="${R.RFI[pos]}" data-mark="${cls}"></div>`,
    };
  };

  G.vsOpen = () => {
    const key = pick(Object.keys(R.VS_OPEN));
    const s = R.VS_OPEN[key];
    const all = new Set([...R.set(s.threebet), ...R.set(s.call)]);
    const cls = borderHand(all);
    const correct = R.vsOpenAction(key, cls);
    const label = { '3bet': '3-Bet', call: 'Call', fold: 'Fold' };
    return {
      skill: 'preflop3bet', title: '3-Bet, Call oder Fold?',
      prompt: `<b>${s.villain}</b> eröffnet mit 2,5 BB. Alle anderen folden. Du bist auf <b>${s.hero}</b>. Deine Aktion?`,
      visual: `<div class="cv">${C(holeForClass(cls))}</div><div class="pill">${cls}</div>`,
      options: [{ label: '3-Bet', value: '3bet' }, { label: 'Call', value: 'call' }, { label: 'Fold', value: 'fold' }],
      correct,
      explain: `Referenz-Strategie für ${s.hero} gegen ${s.villain}: <b>${cls} → ${label[correct]}</b>. ` +
        (correct === '3bet' ? 'Starke Hände 3-betten wir für Value; Hände wie A5s sind gute Bluffs, weil sie ein Ass blocken und Equity haben.' :
          correct === 'call' ? 'Gut spielbare Hände mit ausreichend Equity, die gegen eine 3-Bet aber zu viel Wert verlieren würden, werden gecallt.' :
            'Gegen diese Range hat die Hand zu wenig Equity bzw. Spielbarkeit. Folden spart Geld.') +
        (s.call ? '' : ' Aus dem Small Blind spielen wir gegen den Button fast nur 3-Bet oder Fold, weil wir postflop ohne Position sind und der BB noch hinter uns ist.') +
        `<div class="mini-range" data-range3="${s.threebet}" data-range="${s.call}" data-mark="${cls}"></div>`,
    };
  };

  // ---------- Position ----------
  G.position = () => {
    const order = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];
    const kind = Math.random();
    if (kind < 0.5) {
      let a, b; do { a = pick(order); b = pick(order); } while (a === b);
      const ip = order.indexOf(a) > order.indexOf(b) ? a : b;
      return {
        skill: 'position', title: 'Wer hat Position?',
        prompt: `Nach dem Flop sind noch <b>${a}</b> und <b>${b}</b> im Pot. Wer hat Position (handelt zuletzt)?`,
        visual: root.UI.miniTable({ highlight: [a, b] }),
        options: [{ label: a, value: a }, { label: b, value: b }],
        correct: ip,
        explain: `Postflop handelt der Spieler, der dem Button am nächsten sitzt (im Uhrzeigersinn), zuletzt. Reihenfolge nach dem Flop: SB → BB → UTG → HJ → CO → BTN. Daher hat <b>${ip}</b> Position.`,
      };
    }
    const pre = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    const first = Math.random() < 0.5;
    return {
      skill: 'position', title: 'Reihenfolge',
      prompt: first ? 'Wer muss <b>preflop</b> als Erster handeln (6-max)?' : 'Wer handelt <b>preflop</b> als Letzter, wenn niemand erhöht?',
      visual: root.UI.miniTable({}),
      options: shuffleOpts(pre.map((p) => ({ label: p, value: p }))).slice(0, 6),
      correct: first ? 'UTG' : 'BB',
      explain: 'Preflop beginnt der Spieler links vom Big Blind (UTG). Die Blinds haben bereits gesetzt und handeln deshalb preflop zuletzt – der Big Blind ganz am Schluss.',
    };
  };

  // ---------- Mathe ----------
  G.potOdds = () => {
    const pot = pick([4, 6, 8, 10, 12, 15, 20, 30, 40, 60, 100]);
    const frac = pick([0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.5]);
    const bet = Math.max(1, Math.round(pot * frac));
    const need = bet / (pot + 2 * bet);
    return {
      skill: 'potOdds', title: 'Pot Odds',
      prompt: `Im Pot liegen <b>${pot} BB</b>. Dein Gegner setzt <b>${bet} BB</b>. Wie viel Equity brauchst du mindestens für einen profitablen Call?`,
      visual: root.UI.potBar(pot, bet),
      options: numericOptions(need, (v) => pct(v), [-0.15, -0.1, -0.07, 0.07, 0.1, 0.15, 0.2]),
      correct: 'c',
      explain: `Formel: <b>Call ÷ (Pot + Einsatz + Call)</b> = ${bet} ÷ (${pot} + ${bet} + ${bet}) = ${bet} ÷ ${pot + 2 * bet} = <b>${pct(need, 1)}</b>.<br>Du riskierst ${bet} BB, um ${pot + bet} BB zu gewinnen (Pot Odds ${((pot + bet) / bet).toFixed(1)} : 1).`,
    };
  };

  const DRAWS = {
    flush: { name: 'Flush Draw', min: 5 },
    oesd: { name: 'Open-Ended Straight Draw', min: 4 },
    gutshot: { name: 'Gutshot', min: 4 },
    combo: { name: 'Flush Draw + Straight Draw', min: 4 },
  };
  function makeDraw(type) {
    for (let t = 0; t < 4000; t++) {
      const d = deal(5);
      const hole = d.slice(0, 2), flop = d.slice(2);
      const e = P.evaluate([...hole, ...flop]);
      if (e.cat >= 1) continue; // nur reine Draws (keine fertige Hand)
      const fo = P.countOuts(hole, flop, 5).filter((c) => P.evaluate([...hole, ...flop, c]).cat === 5);
      const so = P.countOuts(hole, flop, 4).filter((c) => P.evaluate([...hole, ...flop, c]).cat === 4);
      const fd = fo.length === 9, oesd = so.length === 8, gs = so.length === 4;
      if (type === 'flush' && fd && so.length === 0) return { hole, flop, outs: fo };
      if (type === 'oesd' && oesd && fo.length === 0) return { hole, flop, outs: so };
      if (type === 'gutshot' && gs && fo.length === 0) return { hole, flop, outs: so };
      if (type === 'combo' && fd && so.length >= 4) return { hole, flop, outs: [...new Set([...fo, ...so])] };
    }
    return null;
  }
  G.outs = () => {
    const type = pick(Object.keys(DRAWS));
    const r = makeDraw(type) || makeDraw('flush');
    const n = r.outs.length;
    const opts = new Set([n]);
    [4, 6, 8, 9, 12, 15, 2, 11].forEach((v) => { if (opts.size < 4 && v !== n) opts.add(v); });
    return {
      skill: 'outs', title: 'Outs zählen',
      prompt: `Du hältst einen <b>${DRAWS[type].name}</b>. Wie viele Outs hast du für ${type === 'flush' ? 'den Flush' : type === 'combo' ? 'Flush oder Straße' : 'die Straße'}?`,
      visual: `<div class="cv"><div class="cv-label">Deine Hand</div>${C(r.hole)}</div><div class="cv"><div class="cv-label">Flop</div>${C(r.flop)}</div>`,
      options: shuffleOpts([...opts].map((v) => ({ label: `${v} Outs`, value: v }))),
      correct: n,
      explain: `Es gibt <b>${n} Outs</b>:<div class="cv">${C(r.outs, { small: true })}</div>Faustregel (Regel von 2 und 4): Auf dem Flop ca. <b>${n * 4 - (n > 8 ? n - 8 : 0)} %</b> bis zum River (alle Karten gesehen), mit nur einer Karte ca. <b>${n * 2} %</b>.`,
    };
  };

  G.ruleOf4 = () => {
    const outs = pick([4, 6, 8, 9, 12, 15]);
    const street = pick(['flop', 'turn']);
    const exact = street === 'flop' ? 1 - ((47 - outs) / 47) * ((46 - outs) / 46) : outs / 46;
    return {
      skill: 'outs', title: 'Regel von 2 und 4',
      prompt: `Du hast <b>${outs} Outs</b> auf dem <b>${street === 'flop' ? 'Flop (Turn und River kommen noch, Gegner ist All-in)' : 'Turn (nur der River kommt noch)'}</b>. Wie hoch ist deine Trefferwahrscheinlichkeit ungefähr?`,
      visual: '',
      options: numericOptions(exact, (v) => '≈ ' + Math.round(v * 100) + ' %', [-0.12, -0.08, 0.08, 0.12, 0.18]),
      correct: 'c',
      explain: `${street === 'flop' ? `Regel von 4: ${outs} × 4 ≈ ${outs * 4} %.` : `Regel von 2: ${outs} × 2 ≈ ${outs * 2} %.`} Exakt: <b>${pct(exact, 1)}</b>.`,
    };
  };

  G.callFold = () => {
    for (let t = 0; t < 60; t++) {
      const villainRange = pick([0.15, 0.25, 0.4]);
      const rs = P.topRange(villainRange);
      const d = deal(6);
      const hole = d.slice(0, 2), board = d.slice(2, pick([5, 6]));
      const pot = pick([10, 20, 30, 40]);
      const bet = Math.round(pot * pick([0.33, 0.5, 0.75, 1]));
      const need = bet / (pot + 2 * bet);
      const eq = P.equity(hole, [{ range: rs }], board, 1200).equity;
      if (Math.abs(eq - need) < 0.07) continue;
      const correct = eq >= need ? 'call' : 'fold';
      return {
        skill: 'equity', title: 'Call oder Fold?',
        prompt: `Der Gegner (Range: Top ${Math.round(villainRange * 100)} %) setzt <b>${bet} BB</b> in einen Pot von <b>${pot} BB</b> und ist danach All-in. Call oder Fold?`,
        visual: `<div class="cv"><div class="cv-label">Deine Hand</div>${C(hole)}</div><div class="cv"><div class="cv-label">Board</div>${C(board)}</div>${root.UI.potBar(pot, bet)}`,
        options: [{ label: 'Call', value: 'call' }, { label: 'Fold', value: 'fold' }],
        correct,
        explain: `Benötigte Equity: <b>${pct(need, 1)}</b>. Deine Equity gegen die Range: <b>${pct(eq, 1)}</b> (Simulation). ${correct === 'call' ? 'Equity > Pot Odds → Call ist profitabel.' : 'Equity < Pot Odds → Fold. Der Call verliert langfristig Geld.'}`,
      };
    }
  };

  // ---------- Postflop ----------
  const TEXTURE_LABEL = { trocken: 'Trocken', mittel: 'Mittel (etwas koordiniert)', nass: 'Nass (viele Draws)', monoton: 'Monoton (drei gleiche Farben)', gepaart: 'Gepaart' };
  G.boardTexture = () => {
    let b, tex;
    const want = pick(Object.keys(TEXTURE_LABEL));
    for (let t = 0; t < 3000; t++) { b = deal(3); tex = P.boardTexture(b); if (tex.type === want) break; }
    return {
      skill: 'boardTexture', title: 'Boardtextur',
      prompt: 'Wie würdest du diesen Flop klassifizieren?',
      visual: `<div class="cv">${C(b)}</div>`,
      options: Object.keys(TEXTURE_LABEL).map((k) => ({ label: TEXTURE_LABEL[k], value: k })),
      correct: tex.type,
      explain: `Dieser Flop ist <b>${TEXTURE_LABEL[tex.type]}</b>. ` + ({
        trocken: 'Unverbundene Karten, verschiedene Farben – kaum Draws. Wer vorne ist, bleibt meist vorne.',
        mittel: 'Einige Straßen- oder Flush-Möglichkeiten, aber nicht extrem koordiniert.',
        nass: 'Verbundene Karten und/oder Flush-Draws – viele Hände haben Equity, die Führung wechselt oft.',
        monoton: 'Alle drei Karten in einer Farbe: Flushes sind bereits möglich, eine einzelne Karte dieser Farbe ist ein Draw.',
        gepaart: 'Ein Paar auf dem Board reduziert die Anzahl starker Hände. Drillinge und Full Houses sind möglich, aber selten.',
      })[tex.type],
    };
  };

  G.cbet = () => {
    const b = deal(3);
    const tex = P.boardTexture(b);
    let correct;
    if (tex.monotone) correct = 'check';
    else if ((tex.type === 'trocken' || tex.type === 'gepaart') && tex.high >= 11) correct = 'small';
    else if (tex.type === 'trocken' || tex.type === 'gepaart') correct = 'small';
    else if (tex.type === 'nass' && tex.high <= 10) correct = 'check';
    else if (tex.type === 'nass') correct = 'big';
    else correct = tex.high >= 12 ? 'small' : 'big';
    const why = {
      small: 'Das Board trifft die Range des Preflop-Raisers (mehr starke Asse/Könige/Overpairs) besser als die des Callers. Wir haben einen Range-Vorteil und können oft und günstig (25–33 % Pot) setzen.',
      big: 'Das Board ist dynamisch: Viele Draws und die Führung kann sich ändern. Wir setzen seltener, dafür groß (66–75 % Pot), um Equity zu verweigern und mit starken Händen und Draws Druck zu machen.',
      check: 'Das Board trifft die Range des Callers (viele mittlere verbundene Hände bzw. Flush-Kombinationen) gut. Ohne Range-Vorteil checken wir häufig und setzen nur selektiv.',
    }[correct];
    return {
      skill: 'cbet', title: 'C-Bet-Strategie',
      prompt: 'Du hast vom Button geraist, der Big Blind hat gecallt (Heads-up). Welche C-Bet-Strategie passt am besten zu diesem Flop?',
      visual: `<div class="cv">${C(b)}</div><div class="pill">${TEXTURE_LABEL[tex.type]}</div>`,
      options: [{ label: 'Häufig & klein (25–33 %)', value: 'small' }, { label: 'Seltener & groß (66–75 %)', value: 'big' }, { label: 'Überwiegend checken', value: 'check' }],
      correct, explain: why + ' <i>(Vereinfachtes Modell – echte Solver-Strategien mischen mehrere Größen.)</i>',
    };
  };

  G.valueBluff = () => {
    for (let t = 0; t < 40; t++) {
      const d = deal(7);
      const hole = d.slice(0, 2), board = d.slice(2);
      const eq = P.equity(hole, [{ range: P.topRange(0.45) }], board, 600).equity;
      let correct;
      if (eq >= 0.72) correct = 'value';
      else if (eq >= 0.38 && eq <= 0.62) correct = 'check';
      else if (eq < 0.22) correct = 'bluff';
      else continue;
      const e = P.evaluate([...hole, ...board]);
      return {
        skill: 'valueBluff', title: 'River: Value, Check oder Bluff?',
        prompt: 'River. Der Gegner checkt zu dir. Was ist die beste Grundstrategie mit dieser Hand?',
        visual: `<div class="cv"><div class="cv-label">Deine Hand</div>${C(hole)}</div><div class="cv"><div class="cv-label">Board</div>${C(board)}</div>`,
        options: [{ label: 'Value Bet', value: 'value' }, { label: 'Check (Showdown)', value: 'check' }, { label: 'Bluff', value: 'bluff' }],
        correct,
        explain: `Du hast <b>${e.desc}</b>. Equity gegen eine typische Range: <b>${pct(eq)}</b>. ` + ({
          value: 'Schlechtere Hände können dich bezahlen → Value Bet. Wer nicht setzt, verschenkt Geld.',
          check: 'Mittlere Hand mit Showdown-Wert: Bessere Hände callen, schlechtere folden – eine Bet bringt nichts. Check und gewinne oft im Showdown.',
          bluff: 'Deine Hand gewinnt im Showdown fast nie. Wenn du überhaupt Geld gewinnen willst, dann nur, indem du den Gegner zum Folden bringst → guter Bluff-Kandidat (besonders mit Blockern).',
        })[correct],
      };
    }
    return G.valueBluff();
  };

  // ---------- Ranges & GTO ----------
  G.combos = () => {
    const kind = Math.random();
    if (kind < 0.4) {
      const cls = pick(['AA', 'KK', 'AKs', 'AKo', 'QJs', 'T9o', '77', 'AQo']);
      const n = P.comboCount(cls);
      return {
        skill: 'ranges', title: 'Kombinationen',
        prompt: `Wie viele Kartenkombinationen gibt es für <b>${cls}</b>?`, visual: '',
        options: shuffleOpts([4, 6, 12, 16].map((v) => ({ label: `${v} Combos`, value: v }))), correct: n,
        explain: 'Pocket Pairs: 6 Combos (4 über 2). Suited: 4 Combos (eine pro Farbe). Offsuit: 12 Combos (4 × 3). Ungepaart insgesamt: 16.',
      };
    }
    // Blocker
    const cls = pick(['AA', 'KK', 'AKo', 'AKs', 'QQ']);
    const c0 = cls[0] + pick(['s', 'h', 'd', 'c']);
    const d = deal(3, [c0]);
    const known = P.shuffle([c0, ...d]).slice(0, 2 + Math.floor(Math.random() * 2));
    const n = P.classCombos(cls).filter((cb) => !known.includes(cb[0]) && !known.includes(cb[1])).length;
    const opts = new Set([n]); [0, 1, 2, 3, 4, 6, 9, 12].forEach((v) => opts.size < 4 && v !== n && opts.add(v));
    return {
      skill: 'ranges', title: 'Blocker',
      prompt: `Diese Karten sind sichtbar (deine Hand / das Board). Wie viele Combos <b>${cls}</b> kann dein Gegner noch haben?`,
      visual: `<div class="cv">${C(known)}</div>`,
      options: shuffleOpts([...opts].map((v) => ({ label: `${v}`, value: v }))), correct: n,
      explain: `Ohne Blocker hat ${cls} ${P.comboCount(cls)} Combos. Jede sichtbare Karte, die zu ${cls} gehört, entfernt Kombinationen. Übrig: <b>${n}</b>.`,
    };
  };

  G.mdf = () => {
    const f = pick([0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.5, 2]);
    const mdf = 1 / (1 + f);
    return {
      skill: 'gto', title: 'Minimum Defense Frequency',
      prompt: `Der Gegner setzt <b>${Math.round(f * 100)} % des Pots</b>. Wie oft musst du mindestens weitermachen (Call oder Raise), damit sein Bluff mit beliebigen zwei Karten nicht automatisch profitabel ist (MDF)?`,
      visual: '',
      options: numericOptions(mdf, (v) => pct(v), [-0.15, -0.1, 0.1, 0.15, -0.2]),
      correct: 'c',
      explain: `MDF = Pot ÷ (Pot + Einsatz) = 1 ÷ (1 + ${f}) = <b>${pct(mdf, 1)}</b>. Foldest du öfter, druckt jeder Bluff Geld. In der Praxis weicht man ab, wenn der Gegner zu selten blufft.`,
    };
  };

  G.bluffRatio = () => {
    const f = pick([0.33, 0.5, 0.75, 1, 1.5, 2]);
    const br = f / (1 + 2 * f);
    return {
      skill: 'gto', title: 'Bluff-Anteil am River',
      prompt: `Du setzt am River <b>${Math.round(f * 100)} % des Pots</b>. Welcher Anteil deiner Setz-Range sollte im Gleichgewicht aus Bluffs bestehen?`,
      visual: '',
      options: numericOptions(br, (v) => pct(v), [-0.12, -0.08, 0.08, 0.12, 0.18]),
      correct: 'c',
      explain: `Der Gegner bekommt Pot Odds von ${f} : ${1 + 2 * f}. Damit er zwischen Call und Fold indifferent ist, muss dein Bluff-Anteil genau seiner benötigten Equity entsprechen: Einsatz ÷ (Pot + 2 × Einsatz) = <b>${pct(br, 1)}</b>. Größere Bets → mehr Bluffs erlaubt.`,
    };
  };

  G.alpha = () => {
    const f = pick([0.33, 0.5, 0.75, 1, 1.5]);
    const a = f / (1 + f);
    return {
      skill: 'gto', title: 'Break-even eines Bluffs',
      prompt: `Du bluffst mit <b>${Math.round(f * 100)} % Pot</b>. Wie oft muss der Gegner folden, damit der Bluff sofort Break-even ist?`,
      visual: '',
      options: numericOptions(a, (v) => pct(v), [-0.15, -0.1, 0.1, 0.15]),
      correct: 'c',
      explain: `Alpha = Einsatz ÷ (Pot + Einsatz) = ${f} ÷ ${(1 + f).toFixed(2)} = <b>${pct(a, 1)}</b>. Alpha und MDF ergeben zusammen immer 100 %.`,
    };
  };

  G.spr = () => {
    const pot = pick([6, 10, 15, 20, 30]);
    const stack = pick([20, 45, 60, 90, 150]);
    const spr = stack / pot;
    return {
      skill: 'ranges', title: 'Stack-to-Pot Ratio',
      prompt: `Auf dem Flop liegen <b>${pot} BB</b> im Pot, der effektive Stack beträgt <b>${stack} BB</b>. Wie hoch ist die SPR?`,
      visual: '',
      options: numericOptions(spr, (v) => v.toFixed(1), [-2, -1, 1, 2, 3, -0.5]),
      correct: 'c',
      explain: `SPR = effektiver Stack ÷ Pot = ${stack} ÷ ${pot} = <b>${spr.toFixed(1)}</b>. ${spr < 4 ? 'Niedrige SPR: Top Pair / Overpair ist oft stark genug, um All-in zu gehen.' : spr > 10 ? 'Hohe SPR: Ein Paar ist selten gut genug für den ganzen Stack – Vorsicht mit großen Pots.' : 'Mittlere SPR: Plane deine Bet-Größen über mehrere Straßen.'}`,
    };
  };

  const GENERATORS = {
    handIdentify: { fn: G.handIdentify, name: 'Hand erkennen', skill: 'handRanking' },
    rankOrder: { fn: G.rankOrder, name: 'Ranking vergleichen', skill: 'handRanking' },
    handCompare: { fn: G.handCompare, name: 'Wer gewinnt?', skill: 'handRanking' },
    kicker: { fn: G.kicker, name: 'Kicker & Split Pot', skill: 'kicker' },
    position: { fn: G.position, name: 'Position', skill: 'position' },
    rfi: { fn: G.rfi, name: 'Open oder Fold', skill: 'preflop' },
    vsOpen: { fn: G.vsOpen, name: '3-Bet / Call / Fold', skill: 'preflop3bet' },
    potOdds: { fn: G.potOdds, name: 'Pot Odds', skill: 'potOdds' },
    outs: { fn: G.outs, name: 'Outs zählen', skill: 'outs' },
    ruleOf4: { fn: G.ruleOf4, name: 'Regel von 2 und 4', skill: 'outs' },
    callFold: { fn: G.callFold, name: 'Call oder Fold (Equity)', skill: 'equity' },
    boardTexture: { fn: G.boardTexture, name: 'Boardtexturen', skill: 'boardTexture' },
    cbet: { fn: G.cbet, name: 'C-Bet-Strategie', skill: 'cbet' },
    valueBluff: { fn: G.valueBluff, name: 'Value, Check oder Bluff', skill: 'valueBluff' },
    combos: { fn: G.combos, name: 'Combos & Blocker', skill: 'ranges' },
    spr: { fn: G.spr, name: 'Stack-to-Pot Ratio', skill: 'ranges' },
    mdf: { fn: G.mdf, name: 'MDF', skill: 'gto' },
    bluffRatio: { fn: G.bluffRatio, name: 'Bluff-Anteil', skill: 'gto' },
    alpha: { fn: G.alpha, name: 'Bluff Break-even', skill: 'gto' },
  };

  function generate(id) {
    const g = GENERATORS[id];
    const q = g.fn();
    q.gen = id;
    q.skill = q.skill || g.skill;
    return q;
  }

  root.Exercises = { GENERATORS, generate };
})(window);
