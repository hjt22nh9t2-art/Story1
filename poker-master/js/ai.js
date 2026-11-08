/* Bot-Gegner mit unterschiedlichen Spielertypen + Coach, der Entscheidungen des Helden bewertet. */
(function (root) {
  'use strict';
  const P = root.Poker, R = root.Ranges;

  const STYLES = {
    TAG: { label: 'TAG', desc: 'Tight-aggressiv, solide', open: 1.0, threebet: 0.06, call: 0.16, aggr: 0.65, bluff: 0.18, sticky: 0.0 },
    LAG: { label: 'LAG', desc: 'Loose-aggressiv', open: 1.35, threebet: 0.11, call: 0.24, aggr: 0.75, bluff: 0.3, sticky: 0.05 },
    NIT: { label: 'Nit', desc: 'Sehr eng, passiv', open: 0.6, threebet: 0.03, call: 0.08, aggr: 0.45, bluff: 0.05, sticky: -0.05 },
    STATION: { label: 'Calling Station', desc: 'Callt zu viel', open: 0.8, threebet: 0.025, call: 0.45, aggr: 0.2, bluff: 0.05, sticky: 0.18 },
    MANIAC: { label: 'Maniac', desc: 'Extrem aggressiv', open: 2.0, threebet: 0.2, call: 0.3, aggr: 0.9, bluff: 0.45, sticky: 0.08 },
  };

  const openBase = { UTG: 0.16, HJ: 0.19, CO: 0.27, BTN: 0.43, SB: 0.38, BB: 0 };

  function villainRangeFor(t, seat) {
    if (t.preflopAggressor === seat) return { range: P.topRange(0.2) };
    const p = t.players[seat];
    if (p.vpip) return { range: P.topRange(0.4) };
    return null; // zufällig (z. B. BB-Check)
  }

  function heroEquity(t, seat, iters) {
    const p = t.players[seat];
    const opps = t.inHand().filter((o) => o.seat !== seat).map((o) => villainRangeFor(t, o.seat));
    return P.equity(p.hole, opps, t.board, iters).equity;
  }

  /** Bot-Entscheidung */
  function botDecide(t, seat) {
    const p = t.players[seat];
    const st = STYLES[p.style] || STYLES.TAG;
    const L = t.legal(seat);
    const rnd = Math.random();
    const pot = t.pot;

    if (t.street === 'preflop') {
      const cls = P.handClass(p.hole);
      const pct = P.HAND_ORDER.pct[cls];
      const pos = t.positionOf(seat);
      const raises = t.raisesThisStreet;
      if (raises === 0) {
        const limit = Math.min(0.9, (openBase[pos] || 0.2) * st.open);
        if (pos === 'BB') {
          if (pct < 0.06 * st.open && L.canRaise) return { type: 'raise', amount: t.currentBet * 4 };
          return { type: 'check' };
        }
        if (pct <= limit) {
          const limpers = t.players.filter((o) => o.bet === t.bb && t.positionOf(o.seat) !== 'BB').length;
          return { type: 'raise', amount: Math.round(t.bb * (pos === 'SB' ? 3 : 2.5) + limpers * t.bb) };
        }
        if (p.style === 'STATION' && pct <= 0.45) return { type: 'call' };
        return L.canCheck ? { type: 'check' } : { type: 'fold' };
      }
      const div = raises === 1 ? 1 : raises * 1.6;
      if (pct <= st.threebet / div && L.canRaise) {
        const to = t.currentBet * (raises >= 2 ? 2.3 : 3.2);
        return { type: 'raise', amount: to > p.stack * 0.4 + p.bet ? p.stack + p.bet : to };
      }
      const priceOk = L.toCall <= p.stack * 0.35 || pct < 0.03;
      const bbBonus = t.positionOf(seat) === 'BB' ? 0.15 : 0;
      if (pct <= (st.call + bbBonus) / div && priceOk) return { type: 'call' };
      return { type: 'fold' };
    }

    // Postflop
    const eq = heroEquity(t, seat, 260);
    if (L.toCall > 0) {
      const need = L.toCall / (pot + L.toCall);
      const sizeFactor = Math.min(1, L.toCall / Math.max(1, t.potBeforeStreet));
      const adj = eq - 0.05 * sizeFactor + st.sticky;
      if (adj > 0.78 && rnd < st.aggr && L.canRaise) return { type: 'raise', amount: t.currentBet * 2.7 };
      if (adj >= need) return { type: 'call' };
      if (rnd < st.bluff * 0.15 && L.canRaise && t.street !== 'river') return { type: 'raise', amount: t.currentBet * 2.5 };
      return { type: 'fold' };
    }
    const nOpp = t.inHand().length - 1;
    const strong = eq > 0.55 + 0.05 * (nOpp - 1);
    if (strong && rnd < st.aggr + 0.15 && L.canRaise) return { type: 'raise', amount: Math.max(t.bb, pot * (eq > 0.8 ? 0.75 : 0.5)) };
    const isAggressor = t.preflopAggressor === seat && t.street === 'flop';
    if (isAggressor && nOpp === 1 && rnd < 0.45 + st.bluff * 0.5 && L.canRaise) return { type: 'raise', amount: Math.max(t.bb, pot * 0.33) };
    if (eq < 0.3 && rnd < st.bluff * 0.6 && nOpp <= 2 && L.canRaise) return { type: 'raise', amount: Math.max(t.bb, pot * 0.6) };
    return { type: 'check' };
  }

  // ---------------------------------------------------------- Coach
  const LBL = { '3bet': '3-Bet', '4bet': '4-Bet', call: 'Call', fold: 'Fold', raise: 'Raise', check: 'Check' };

  function coachPreflop(t, seat, action) {
    const p = t.players[seat];
    const cls = P.handClass(p.hole);
    const pos = t.positionOf(seat);
    const raises = t.raisesThisStreet;
    const a = action.type;

    if (raises === 0) {
      if (pos === 'BB') {
        if (a === 'raise' && P.HAND_ORDER.pct[cls] > 0.12) return { verdict: 'ok', skill: 'preflop', text: `Isolations-Raise mit ${cls} aus dem BB nach Limps ist eher locker. Ein Check ist meist ausreichend.` };
        return { verdict: 'good', skill: 'preflop', text: a === 'raise' ? `Raise mit starker Hand ${cls} gegen Limper – gut, Value!` : `Kostenloser Check im Big Blind mit ${cls}. Richtig.` };
      }
      const rec = R.rfiAction(pos, cls);
      const pctTxt = Math.round(R.rangePercent(R.set(R.RFI[pos])) * 100);
      if (a === 'call') return { verdict: 'bad', skill: 'preflop', rec: rec, text: `Limpen ist fast immer schwächer als Raise oder Fold. Empfehlung von ${pos} mit ${cls}: <b>${LBL[rec]}</b> (Range ca. ${pctTxt} %).` };
      const mine = a === 'raise' ? 'raise' : 'fold';
      if (mine === rec) return { verdict: 'good', skill: 'preflop', text: `${cls} von ${pos}: <b>${LBL[rec]}</b> ist korrekt (Opening Range ca. ${pctTxt} %).` };
      return { verdict: 'bad', skill: 'preflop', rec, text: `${cls} gehört von ${pos} ${rec === 'raise' ? '' : '<b>nicht</b> '}in die Opening Range (ca. ${pctTxt} %). Empfehlung: <b>${LBL[rec]}</b>.` };
    }

    const raiserSeat = t.raiserSeats[t.raiserSeats.length - 1];
    const raiserPos = t.positionOf(raiserSeat);
    let rec;
    const key = `${pos}_vs_${raiserPos}`;
    const iAmOpener = t.raiserSeats.includes(seat);
    if (raises === 1 && R.VS_OPEN[key]) rec = R.vsOpenAction(key, cls);
    else if (raises === 2 && iAmOpener && R.VS_3BET[`${pos}_vs_${raiserPos}3bet`]) rec = R.vs3betAction(`${pos}_vs_${raiserPos}3bet`, cls);
    else rec = R.genericVsRaise(pos, raiserPos, cls, raises);
    const mine = a === 'raise' ? (raises === 1 ? '3bet' : '4bet') : a === 'fold' ? 'fold' : 'call';
    const recNorm = rec === '4bet' && raises === 1 ? '3bet' : rec === '3bet' && raises >= 2 ? '4bet' : rec;
    const skill = 'preflop3bet';
    if (mine === recNorm) return { verdict: 'good', skill, text: `${cls} auf ${pos} gegen ${raises === 1 ? 'Open' : raises === 2 ? '3-Bet' : '4-Bet'} von ${raiserPos}: <b>${LBL[recNorm]}</b> ist korrekt.` };
    if (mine !== 'fold' && recNorm !== 'fold') return { verdict: 'ok', skill, rec: recNorm, text: `${cls}: Weiterspielen ist richtig, aber die Referenz bevorzugt <b>${LBL[recNorm]}</b> statt ${LBL[mine]}.` };
    if (mine === 'fold') return { verdict: 'bad', skill, rec: recNorm, text: `${cls} ist gegen eine Erhöhung von ${raiserPos} zu stark zum Folden. Empfehlung: <b>${LBL[recNorm]}</b>.` };
    return { verdict: 'bad', skill, rec: recNorm, text: `${cls} ist auf ${pos} gegen eine Erhöhung von ${raiserPos} zu schwach. Empfehlung: <b>Fold</b>. Viele Verluste entstehen durch zu loses Callen preflop.` };
  }

  function coachPostflop(t, seat, action) {
    const L = t.legal(seat);
    const eq = heroEquity(t, seat, 900);
    const pot = t.pot;
    const a = action.type;
    const pe = (x) => Math.round(x * 100) + ' %';
    const street = t.street;
    const ev = P.evaluate([...t.players[seat].hole, ...t.board]);
    const handTxt = `Deine Hand: <b>${ev.desc}</b>. Geschätzte Equity gegen die Ranges der Gegner: <b>${pe(eq)}</b>.`;

    if (L.toCall > 0) {
      const need = L.toCall / (pot + L.toCall);
      const implied = street === 'flop' ? 0.08 : street === 'turn' ? 0.04 : 0;
      const base = `${handTxt} Du musst ${(L.toCall / t.bb).toFixed(1)} BB in einen Pot von ${(pot / t.bb).toFixed(1)} BB zahlen → benötigte Equity <b>${pe(need)}</b>.`;
      if (a === 'fold') {
        if (eq > need + 0.1) return { verdict: 'bad', skill: 'equity', rec: 'call', text: `${base} Deine Equity liegt deutlich über den Pot Odds – Fold ist zu tight.` };
        if (eq > need) return { verdict: 'ok', skill: 'equity', text: `${base} Knapp. Ein Call wäre leicht profitabel, Fold ist vertretbar (Position/Folgestraßen).` };
        return { verdict: 'good', skill: 'potOdds', text: `${base} Fold ist korrekt – die Pot Odds reichen nicht.` };
      }
      if (a === 'call' || a === 'check') {
        if (eq >= need) return { verdict: 'good', skill: 'potOdds', text: `${base} Call ist profitabel.${eq > 0.7 ? ' Mit dieser Stärke wäre auch ein Raise für Value möglich.' : ''}` };
        if (eq >= need - implied) return { verdict: 'ok', skill: 'potOdds', text: `${base} Etwas zu wenig Equity, aber Implied Odds können den Call rechtfertigen.` };
        return { verdict: 'bad', skill: 'potOdds', rec: 'fold', text: `${base} Zu wenig Equity – dieser Call verliert langfristig Geld.` };
      }
      if (a === 'raise') {
        if (eq >= 0.6) return { verdict: 'good', skill: 'valueBluff', text: `${handTxt} Raise für Value – stark!` };
        if (street !== 'river' && eq >= 0.3) return { verdict: 'ok', skill: 'valueBluff', text: `${handTxt} Semi-Bluff-Raise: Fold Equity + Verbesserungschancen. Vertretbar.` };
        if (eq >= need) return { verdict: 'ok', skill: 'valueBluff', text: `${handTxt} Ein Call wäre hier meist die einfachere Option.` };
        return { verdict: 'bad', skill: 'valueBluff', rec: 'fold', text: `${handTxt} Raise ohne Equity gegen eine Bet ist sehr riskant – gegen diese Gegner meist ein Fehler.` };
      }
    }
    // Keine Bet vor uns
    if (a === 'check') {
      if (eq > 0.75 && street === 'river') return { verdict: 'ok', skill: 'valueBluff', text: `${handTxt} Mit dieser starken Hand verschenkst du am River Value. Eine Value Bet ist besser.` };
      if (eq > 0.7) return { verdict: 'ok', skill: 'valueBluff', text: `${handTxt} Starke Hand – Setzen baut den Pot auf und schützt deine Equity. Checken ist als Falle möglich, aber selten besser.` };
      return { verdict: 'good', skill: 'valueBluff', text: `${handTxt} Check ist hier sinnvoll (Potkontrolle / Showdown-Wert / Freikarte).` };
    }
    // Bet
    const isCbet = t.preflopAggressor === seat && street === 'flop';
    if (eq >= 0.55) return { verdict: 'good', skill: isCbet ? 'cbet' : 'valueBluff', text: `${handTxt} Value Bet – gut, schlechtere Hände können bezahlen.` };
    if (street === 'river') {
      if (eq < 0.25) return { verdict: 'ok', skill: 'valueBluff', text: `${handTxt} River-Bluff mit einer Hand ohne Showdown-Wert. Kann funktionieren, wenn deine Story glaubwürdig ist – gegen Calling Stations vermeiden.` };
      return { verdict: 'bad', skill: 'valueBluff', rec: 'check', text: `${handTxt} Mittlere Hand am River: Bessere Hände callen, schlechtere folden. Check ist besser.` };
    }
    if (isCbet) return { verdict: t.inHand().length > 2 ? 'ok' : 'good', skill: 'cbet', text: `${handTxt} C-Bet als Preflop-Aggressor${t.inHand().length > 2 ? ' – multiway allerdings mit Vorsicht' : ': nutzt deinen Range-Vorteil'}.` };
    if (eq >= 0.3) return { verdict: 'ok', skill: 'valueBluff', text: `${handTxt} Semi-Bluff mit Equity – vertretbar.` };
    return { verdict: 'ok', skill: 'valueBluff', text: `${handTxt} Bluff ohne viel Equity. Wähle Bluffs mit Draws oder Blockern.` };
  }

  function coach(t, seat, action) {
    try {
      return t.street === 'preflop' ? coachPreflop(t, seat, action) : coachPostflop(t, seat, action);
    } catch (e) { console.error(e); return null; }
  }

  root.AI = { STYLES, botDecide, coach, heroEquity };
})(window);
