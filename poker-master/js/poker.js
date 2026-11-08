/* POKER MASTER – Kern-Logik: Karten, Deck, Handbewertung, Equity, Starthand-Notation.
   Klassisches Script (kein Modul), damit die App auch per file:// läuft.
   In Node via require() nutzbar (für Tests). */
(function (root) {
  'use strict';

  const RANKS = '23456789TJQKA';
  const SUITS = 'shdc';
  const SUIT_SYMBOL = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const SUIT_NAME = { s: 'Pik', h: 'Herz', d: 'Karo', c: 'Kreuz' };
  const RANK_NAME = { 2: 'Zwei', 3: 'Drei', 4: 'Vier', 5: 'Fünf', 6: 'Sechs', 7: 'Sieben', 8: 'Acht', 9: 'Neun', 10: 'Zehn', 11: 'Bube', 12: 'Dame', 13: 'König', 14: 'Ass' };
  const RANK_PLURAL = { 2: 'Zweien', 3: 'Dreien', 4: 'Vieren', 5: 'Fünfen', 6: 'Sechsen', 7: 'Siebenen', 8: 'Achten', 9: 'Neunen', 10: 'Zehnen', 11: 'Buben', 12: 'Damen', 13: 'Könige', 14: 'Asse' };
  const CATEGORY = ['Höchste Karte', 'Ein Paar', 'Zwei Paare', 'Drilling', 'Straße', 'Flush', 'Full House', 'Vierling', 'Straight Flush', 'Royal Flush'];
  const CATEGORY_EN = ['High Card', 'One Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'];

  const rankVal = (c) => RANKS.indexOf(c[0]) + 2;
  const rankChar = (v) => RANKS[v - 2];

  function fullDeck() {
    const d = [];
    for (const r of RANKS) for (const s of SUITS) d.push(r + s);
    return d;
  }

  function shuffle(arr, rng = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Deck ohne die angegebenen Karten, gemischt. */
  function deckWithout(excluded, rng) {
    const ex = new Set(excluded);
    return shuffle(fullDeck().filter((c) => !ex.has(c)), rng);
  }

  // ---------- Straßen-Erkennung ----------
  function findStraightHigh(valsSet) {
    for (let high = 14; high >= 5; high--) {
      let ok = true;
      for (let k = 0; k < 5; k++) {
        let v = high - k;
        if (v === 1) v = 14; // Wheel: A-2-3-4-5
        if (!valsSet.has(v)) { ok = false; break; }
      }
      if (ok) return high;
    }
    return 0;
  }

  function straightCards(cards, high) {
    const out = [];
    for (let k = 0; k < 5; k++) {
      let v = high - k;
      if (v === 1) v = 14;
      out.push(cards.find((c) => rankVal(c) === v));
    }
    return out;
  }

  /**
   * Bewertet 5–7 Karten und liefert die beste 5-Karten-Hand.
   * Rückgabe: { cat (0..8), tb (Tiebreak-Werte), score (vergleichbar), best (5 Karten), name, desc }
   */
  function evaluate(cards) {
    if (cards.length < 5) throw new Error('Mindestens 5 Karten nötig');
    const sorted = cards.slice().sort((a, b) => rankVal(b) - rankVal(a));

    // Flush?
    const bySuit = { s: [], h: [], d: [], c: [] };
    for (const c of sorted) bySuit[c[1]].push(c);
    let flush = null;
    for (const s of SUITS) if (bySuit[s].length >= 5) flush = bySuit[s];

    if (flush) {
      const sfHigh = findStraightHigh(new Set(flush.map(rankVal)));
      if (sfHigh) return make(8, [sfHigh], straightCards(flush, sfHigh));
    }

    // Gruppen nach Rang
    const groups = new Map();
    for (const c of sorted) {
      const v = rankVal(c);
      if (!groups.has(v)) groups.set(v, []);
      groups.get(v).push(c);
    }
    const g = [...groups.entries()].map(([v, cs]) => ({ v, cs, n: cs.length }))
      .sort((a, b) => b.n - a.n || b.v - a.v);

    const kickers = (exclude, n) => sorted.filter((c) => !exclude.includes(rankVal(c))).slice(0, n);

    if (g[0].n === 4) {
      const k = kickers([g[0].v], 1);
      return make(7, [g[0].v, rankVal(k[0])], [...g[0].cs, ...k]);
    }
    if (g[0].n === 3 && g.length > 1 && g[1].n >= 2) {
      return make(6, [g[0].v, g[1].v], [...g[0].cs, ...g[1].cs.slice(0, 2)]);
    }
    if (flush) {
      const f = flush.slice(0, 5);
      return make(5, f.map(rankVal), f);
    }
    const stHigh = findStraightHigh(new Set(sorted.map(rankVal)));
    if (stHigh) return make(4, [stHigh], straightCards(sorted, stHigh));
    if (g[0].n === 3) {
      const k = kickers([g[0].v], 2);
      return make(3, [g[0].v, ...k.map(rankVal)], [...g[0].cs, ...k]);
    }
    if (g[0].n === 2 && g[1] && g[1].n === 2) {
      const k = kickers([g[0].v, g[1].v], 1);
      return make(2, [g[0].v, g[1].v, rankVal(k[0])], [...g[0].cs, ...g[1].cs, ...k]);
    }
    if (g[0].n === 2) {
      const k = kickers([g[0].v], 3);
      return make(1, [g[0].v, ...k.map(rankVal)], [...g[0].cs, ...k]);
    }
    const top = sorted.slice(0, 5);
    return make(0, top.map(rankVal), top);
  }

  function make(cat, tb, best) {
    let score = cat;
    for (let i = 0; i < 5; i++) score = score * 16 + (tb[i] || 0);
    const royal = cat === 8 && tb[0] === 14;
    return { cat, tb, score, best, royal, name: royal ? CATEGORY[9] : CATEGORY[cat], desc: describe(cat, tb, royal) };
  }

  function describe(cat, tb, royal) {
    const N = RANK_NAME, P = RANK_PLURAL;
    switch (cat) {
      case 0: return `Höchste Karte ${N[tb[0]]}, dann ${tb.slice(1).map((v) => N[v]).join(', ')}`;
      case 1: return `Ein Paar ${P[tb[0]]}, Kicker ${tb.slice(1).map((v) => N[v]).join(', ')}`;
      case 2: return `Zwei Paare: ${P[tb[0]]} und ${P[tb[1]]}, Kicker ${N[tb[2]]}`;
      case 3: return `Drilling ${P[tb[0]]}, Kicker ${tb.slice(1).map((v) => N[v]).join(', ')}`;
      case 4: return tb[0] === 5 ? 'Straße Ass bis Fünf (Wheel)' : `Straße bis ${N[tb[0]]}`;
      case 5: return `Flush, ${N[tb[0]]}-hoch (${tb.map((v) => rankChar(v)).join(' ')})`;
      case 6: return `Full House: ${P[tb[0]]} voll mit ${P[tb[1]]}`;
      case 7: return `Vierling ${P[tb[0]]}, Kicker ${N[tb[1]]}`;
      case 8: return royal ? 'Royal Flush' : `Straight Flush bis ${N[tb[0]]}`;
    }
    return '';
  }

  /** Vergleicht zwei Bewertungen: >0 wenn a besser, <0 wenn b besser, 0 Split. */
  const compare = (a, b) => a.score - b.score;

  /** Erklärt, warum Hand A gegen Hand B gewinnt/verliert (Deutsch). */
  function explainComparison(a, b) {
    if (a.cat !== b.cat) {
      const w = a.cat > b.cat ? a : b, l = a.cat > b.cat ? b : a;
      return `${w.name} schlägt ${l.name}: Die Kategorie entscheidet zuerst. ${w.name} steht im Ranking über ${l.name}.`;
    }
    if (a.score === b.score) {
      return `Beide Spieler haben exakt dieselbe beste 5-Karten-Hand (${a.desc}). Der Pot wird geteilt (Split Pot). Karten außerhalb der besten fünf zählen nicht.`;
    }
    const w = a.score > b.score ? a : b, l = a.score > b.score ? b : a;
    let i = 0;
    while (i < 5 && w.tb[i] === l.tb[i]) i++;
    const labels = tieLabels(w.cat);
    const what = labels[i] || 'Kicker';
    const isKicker = /Kicker|Beikarte/.test(what);
    return `Beide haben ${w.name}. Gleichstand wird über ${what} aufgelöst: ${RANK_NAME[w.tb[i]]} schlägt ${RANK_NAME[l.tb[i]]}.` +
      (isKicker ? ' Der Kicker ist die höchste Beikarte, die nicht Teil der Kombination ist.' : '');
  }

  function tieLabels(cat) {
    switch (cat) {
      case 0: return ['die höchste Karte', 'die zweithöchste Karte', 'die dritthöchste Karte', 'die vierthöchste Karte', 'die fünfthöchste Karte'];
      case 1: return ['den Rang des Paares', 'den ersten Kicker', 'den zweiten Kicker', 'den dritten Kicker'];
      case 2: return ['das höhere Paar', 'das niedrigere Paar', 'den Kicker'];
      case 3: return ['den Rang des Drillings', 'den ersten Kicker', 'den zweiten Kicker'];
      case 4: return ['die höchste Karte der Straße'];
      case 5: return ['die höchste Flush-Karte', 'die zweite Flush-Karte', 'die dritte Flush-Karte', 'die vierte Flush-Karte', 'die fünfte Flush-Karte'];
      case 6: return ['den Rang des Drillings', 'den Rang des Paares'];
      case 7: return ['den Rang des Vierlings', 'den Kicker'];
      case 8: return ['die höchste Karte der Straße'];
    }
    return [];
  }

  // ---------- Starthand-Notation (169 Klassen) ----------
  /** ['As','Kd'] -> 'AKo' */
  function handClass(hole) {
    let [a, b] = hole;
    if (rankVal(b) > rankVal(a)) [a, b] = [b, a];
    if (a[0] === b[0]) return a[0] + b[0];
    return a[0] + b[0] + (a[1] === b[1] ? 's' : 'o');
  }

  /** Alle 169 Klassen in Matrix-Reihenfolge (Zeile i, Spalte j). */
  function matrixClasses() {
    const R = RANKS.split('').reverse(); // A..2
    const rows = [];
    for (let i = 0; i < 13; i++) {
      const row = [];
      for (let j = 0; j < 13; j++) {
        if (i === j) row.push(R[i] + R[j]);
        else if (j > i) row.push(R[i] + R[j] + 's');
        else row.push(R[j] + R[i] + 'o');
      }
      rows.push(row);
    }
    return rows;
  }

  /** Alle konkreten Kombinationen einer Klasse, z.B. 'AKs' -> 4 Combos. */
  function classCombos(cls) {
    const r1 = cls[0], r2 = cls[1];
    const out = [];
    if (cls.length === 2) {
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) out.push([r1 + SUITS[i], r2 + SUITS[j]]);
    } else if (cls[2] === 's') {
      for (const s of SUITS) out.push([r1 + s, r2 + s]);
    } else {
      for (const s1 of SUITS) for (const s2 of SUITS) if (s1 !== s2) out.push([r1 + s1, r2 + s2]);
    }
    return out;
  }

  const comboCount = (cls) => (cls.length === 2 ? 6 : cls[2] === 's' ? 4 : 12);

  /**
   * Parser für Range-Notation: "22+, A2s+, KTo+, A5s-A2s, QJs, 77-55"
   * Liefert ein Set von Handklassen.
   */
  function parseRange(str) {
    const set = new Set();
    if (!str) return set;
    for (let tok of str.split(',')) {
      tok = tok.trim();
      if (!tok) continue;
      if (tok.includes('-')) {
        const [a, b] = tok.split('-').map((t) => t.trim());
        if (a.length === 2 && a[0] === a[1]) { // Paare 77-55
          const hi = rankVal(a), lo = rankVal(b);
          for (let v = lo; v <= hi; v++) set.add(rankChar(v) + rankChar(v));
        } else { // A5s-A2s
          const suf = a[2];
          const hi = rankVal(a[1]), lo = rankVal(b[1]);
          for (let v = lo; v <= hi; v++) set.add(a[0] + rankChar(v) + suf);
        }
      } else if (tok.endsWith('+')) {
        const t = tok.slice(0, -1);
        if (t.length === 2) { // 22+
          for (let v = rankVal(t); v <= 14; v++) set.add(rankChar(v) + rankChar(v));
        } else { // A2s+ : Kicker bis eine unter erster Karte
          const top = rankVal(t[0]);
          for (let v = rankVal(t[1]); v < top; v++) set.add(t[0] + rankChar(v) + t[2]);
        }
      } else set.add(tok);
    }
    return set;
  }

  /** Chen-Formel – heuristische Starthand-Stärke (für Bots und Erklärungen). */
  function chenScore(cls) {
    const v = { A: 10, K: 8, Q: 7, J: 6, T: 5 };
    const val = (r) => v[r] || rankVal(r) / 2;
    const r1 = cls[0], r2 = cls[1];
    let s = val(r1);
    if (cls.length === 2) return Math.max(5, s * 2);
    if (cls[2] === 's') s += 2;
    const gap = rankVal(r1) - rankVal(r2) - 1;
    s -= gap === 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
    if (gap <= 1 && rankVal(r1) < 12) s += 1;
    return Math.ceil(s);
  }

  /** Rangfolge aller 169 Klassen (stärkste zuerst) und kumulierte Perzentile. */
  const HAND_ORDER = (() => {
    const all = matrixClasses().flat();
    const tie = (c) => rankVal(c[0]) * 15 + rankVal(c[1]) + (c.length === 2 ? 0.5 : c[2] === 's' ? 0.2 : 0);
    all.sort((a, b) => chenScore(b) - chenScore(a) || tie(b) - tie(a));
    const pct = {};
    let acc = 0;
    for (const c of all) { acc += comboCount(c); pct[c] = acc / 1326; }
    return { list: all, pct };
  })();

  /** Top-x%-Range als Set von Klassen. */
  function topRange(fraction) {
    const set = new Set();
    for (const c of HAND_ORDER.list) { if (HAND_ORDER.pct[c] <= fraction + 1e-9 || set.size === 0) set.add(c); else break; }
    return set;
  }

  // ---------- Equity (Monte Carlo) ----------
  /**
   * hero: ['As','Kd']; villains: Array von Handarrays oder null (zufällig) oder {range:Set}
   * board: 0..5 Karten. Liefert { win, tie, equity } für den Helden.
   */
  function equity(hero, villains, board = [], iterations = 1500, rng = Math.random) {
    const known = [...hero, ...board];
    villains.forEach((v) => { if (Array.isArray(v)) known.push(...v); });
    const knownSet = new Set(known);
    const rest = fullDeck().filter((c) => !knownSet.has(c));
    const rangeCombos = villains.map((v) => (v && v.range) ? [...v.range].flatMap(classCombos).filter((cb) => !knownSet.has(cb[0]) && !knownSet.has(cb[1])) : null);

    let win = 0, tie = 0, eqSum = 0, n = 0;
    for (let it = 0; it < iterations; it++) {
      const used = new Set();
      const vHands = [];
      let fail = false;
      for (let i = 0; i < villains.length; i++) {
        const v = villains[i];
        if (Array.isArray(v)) { vHands.push(v); continue; }
        let hand = null;
        if (rangeCombos[i] && rangeCombos[i].length) {
          for (let t = 0; t < 20; t++) {
            const cb = rangeCombos[i][Math.floor(rng() * rangeCombos[i].length)];
            if (!used.has(cb[0]) && !used.has(cb[1])) { hand = cb; break; }
          }
        }
        if (!hand) {
          let a, b;
          do { a = rest[Math.floor(rng() * rest.length)]; } while (used.has(a));
          used.add(a);
          do { b = rest[Math.floor(rng() * rest.length)]; } while (used.has(b));
          hand = [a, b];
        }
        if (!hand) { fail = true; break; }
        used.add(hand[0]); used.add(hand[1]);
        vHands.push(hand);
      }
      if (fail) continue;
      const b = board.slice();
      while (b.length < 5) {
        const c = rest[Math.floor(rng() * rest.length)];
        if (!used.has(c)) { used.add(c); b.push(c); }
      }
      const hs = evaluate([...hero, ...b]).score;
      let best = -1, cnt = 0;
      for (const vh of vHands) {
        const s = evaluate([...vh, ...b]).score;
        if (s > best) { best = s; cnt = 1; } else if (s === best) cnt++;
      }
      n++;
      if (hs > best) { win++; eqSum += 1; } else if (hs === best) { tie++; eqSum += 1 / (cnt + 1); }
    }
    return { win: win / n, tie: tie / n, equity: eqSum / n };
  }

  /** Zählt Outs exakt: Karten, die die Hand auf Turn/River zu einer Mindestkategorie verbessern. */
  function countOuts(hole, board, minCat) {
    const known = new Set([...hole, ...board]);
    const cur = evaluate([...hole, ...board]);
    const target = minCat != null ? minCat : cur.cat + 1;
    const outs = [];
    for (const c of fullDeck()) {
      if (known.has(c)) continue;
      const e = evaluate([...hole, ...board, c]);
      // Verbesserung muss die Hole Cards nutzen (nicht nur das Board)
      const boardOnly = board.length + 1 >= 5 ? evaluate([...board, c]) : null;
      if (e.cat >= target && (!boardOnly || boardOnly.cat < e.cat)) outs.push(c);
    }
    return outs;
  }

  /** Board-Textur klassifizieren. */
  function boardTexture(board) {
    const suits = {}; const vals = board.map(rankVal).sort((a, b) => b - a);
    board.forEach((c) => (suits[c[1]] = (suits[c[1]] || 0) + 1));
    const maxSuit = Math.max(...Object.values(suits));
    const paired = new Set(vals).size < vals.length;
    const uniq = [...new Set(vals)];
    let connected = 0;
    // Wie viele Straßen-Möglichkeiten (Spannweite der Karten innerhalb 4)
    for (let i = 0; i < uniq.length; i++) for (let j = i + 1; j < uniq.length; j++) if (uniq[i] - uniq[j] <= 4) connected++;
    if (uniq.includes(14)) for (const v of uniq) if (v <= 5) connected++;
    const monotone = maxSuit >= 3 && board.length === 3;
    const twoTone = maxSuit === 2;
    let wetness = connected + (monotone ? 3 : twoTone ? 1.5 : 0) - (paired ? 1 : 0);
    let type;
    if (monotone) type = 'monoton';
    else if (paired) type = 'gepaart';
    else if (wetness >= 3) type = 'nass';
    else if (wetness >= 1.5) type = 'mittel';
    else type = 'trocken';
    return { type, monotone, twoTone, paired, connected, wetness, high: vals[0] };
  }

  const api = {
    RANKS, SUITS, SUIT_SYMBOL, SUIT_NAME, RANK_NAME, RANK_PLURAL, CATEGORY, CATEGORY_EN,
    rankVal, rankChar, fullDeck, shuffle, deckWithout, evaluate, compare, explainComparison,
    handClass, matrixClasses, classCombos, comboCount, parseRange, chenScore, HAND_ORDER, topRange,
    equity, countOuts, boardTexture,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Poker = api;
})(typeof window !== 'undefined' ? window : globalThis);
