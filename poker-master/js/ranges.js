/* Preflop-Ranges (6-max, 100 BB, vereinfachte GTO-nahe Referenz-Charts). */
(function (root) {
  'use strict';
  const P = root.Poker || (typeof require !== 'undefined' ? require('./poker.js') : null);

  const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const POSITION_INFO = {
    UTG: { name: 'Under the Gun', short: 'UTG', desc: 'Erster Spieler nach dem Big Blind. Handelt preflop zuerst und hat postflop meistens keine Position – deshalb die engste Range.' },
    HJ: { name: 'Hijack', short: 'HJ', desc: 'Zwei Plätze vor dem Button. Etwas breiter als UTG, aber noch vier Spieler hinter dir.' },
    CO: { name: 'Cutoff', short: 'CO', desc: 'Direkt vor dem Button. Eine der profitabelsten Positionen – nur Button und Blinds sind noch hinter dir.' },
    BTN: { name: 'Button (Dealer)', short: 'BTN', desc: 'Beste Position am Tisch: Du handelst nach dem Flop in jeder Setzrunde zuletzt. Deshalb die breiteste Opening Range.' },
    SB: { name: 'Small Blind', short: 'SB', desc: 'Zahlt einen halben Big Blind blind. Postflop immer zuerst am Zug – schlechteste Position nach dem Flop.' },
    BB: { name: 'Big Blind', short: 'BB', desc: 'Zahlt einen ganzen Big Blind blind. Handelt preflop zuletzt und verteidigt wegen des guten Preises sehr breit.' },
  };

  // Raise First In (Open-Raise, wenn alle vor dir gefoldet haben)
  const RFI = {
    UTG: '55+, A2s+, K9s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, ATo+, KJo+, QJo',
    HJ: '44+, A2s+, K8s+, Q9s+, J9s+, T8s+, 98s, 87s, 76s, 65s, A9o+, KTo+, QTo+, JTo',
    CO: '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, A8o+, A5o, KTo+, QTo+, JTo',
    BTN: '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K8o+, Q9o+, J9o+, T9o, 98o, 87o',
    SB: '22+, A2s+, K3s+, Q5s+, J7s+, T7s+, 96s+, 86s+, 75s+, 64s+, 54s, A4o+, K9o+, Q9o+, J9o+, T9o',
  };

  // Reaktion auf einen Open-Raise: 3-Bet / Call / Fold
  const VS_OPEN = {
    'CO_vs_UTG': { hero: 'CO', villain: 'UTG', threebet: 'QQ+, AKs, AKo, A5s, A4s', call: 'JJ-66, AQs-ATs, KQs, KJs, QJs, JTs, T9s, 98s, AQo' },
    'BTN_vs_UTG': { hero: 'BTN', villain: 'UTG', threebet: 'QQ+, AKs, AKo, A5s, A4s, KQs', call: 'JJ-55, AQs-A9s, KJs, KTs, QJs, QTs, JTs, T9s, 98s, 87s, AQo, AJo' },
    'BTN_vs_CO': { hero: 'BTN', villain: 'CO', threebet: 'TT+, AJs+, KQs, AKo, AQo, A5s-A3s, K9s, 76s, 65s', call: '99-22, ATs-A6s, KJs-KTs, Q9s+, J9s+, T8s+, 97s+, 86s+, 75s+, AJo, KQo' },
    'SB_vs_BTN': { hero: 'SB', villain: 'BTN', threebet: '88+, A9s+, KTs+, QTs+, JTs, A5s-A4s, AJo+, KQo, 76s, 65s', call: '' },
    'BB_vs_BTN': { hero: 'BB', villain: 'BTN', threebet: 'TT+, AJs+, KQs, AQo+, A5s-A2s, K9s, Q9s, J9s, T8s, 65s, 54s', call: '99-22, ATs-A6s, KJs-K2s, QJs-Q2s, JTs, J8s-J5s, T9s, T7s-T6s, 96s+, 85s+, 74s+, 63s+, 53s, 43s, AJo-A2o, KQo-K5o, Q8o+, J8o+, T8o+, 98o, 87o, 76o' },
    'BB_vs_CO': { hero: 'BB', villain: 'CO', threebet: 'JJ+, AQs+, AKo, A5s-A4s, KQs, 76s', call: 'TT-22, AJs-A2s, KJs-K6s, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 64s+, 54s, AQo-A8o, KTo+, QTo+, JTo' },
  };

  // Reaktion auf eine 3-Bet nach eigenem Open
  const VS_3BET = {
    'BTN_vs_BB3bet': { hero: 'BTN', villain: 'BB', fourbet: 'QQ+, AKs, AKo, A5s', call: 'JJ-66, AQs-ATs, KJs+, QJs, JTs, T9s, 98s, AQo' },
    'UTG_vs_BTN3bet': { hero: 'UTG', villain: 'BTN', fourbet: 'KK+, AKs, A5s', call: 'QQ-88, AKo, AQs, AJs, KQs' },
  };

  const cache = {};
  function set(str) { if (!cache[str]) cache[str] = P.parseRange(str); return cache[str]; }

  function rfiAction(pos, cls) {
    if (pos === 'BB') return 'check';
    return set(RFI[pos]).has(cls) ? 'raise' : 'fold';
  }

  function vsOpenAction(key, cls) {
    const s = VS_OPEN[key];
    if (set(s.threebet).has(cls)) return '3bet';
    if (set(s.call).has(cls)) return 'call';
    return 'fold';
  }

  function vs3betAction(key, cls) {
    const s = VS_3BET[key];
    if (set(s.fourbet).has(cls)) return '4bet';
    if (set(s.call).has(cls)) return 'call';
    return 'fold';
  }

  function rangePercent(rangeSet) {
    let n = 0;
    for (const c of rangeSet) n += P.comboCount(c);
    return n / 1326;
  }

  /** Generische Einschätzung für den Simulator-Coach, wenn kein exaktes Chart existiert. */
  function genericVsRaise(heroPos, raiserPos, cls, raisesBefore) {
    const pct = P.HAND_ORDER.pct[cls];
    if (raisesBefore >= 2) { // gegen 3-Bet oder mehr
      if (set('QQ+, AKs, AKo').has(cls)) return '4bet';
      if (set('JJ-99, AQs, AJs, KQs').has(cls)) return 'call';
      return 'fold';
    }
    const late = ['UTG', 'HJ'].includes(raiserPos) ? 0 : 1;
    const ip = ['BTN', 'CO'].includes(heroPos) ? 1 : 0;
    const bb = heroPos === 'BB';
    const tbLimit = 0.035 + late * 0.025;
    const callLimit = 0.12 + late * 0.06 + ip * 0.04 + (bb ? 0.15 : 0);
    if (pct <= tbLimit || (late && set('A5s, A4s').has(cls))) return '3bet';
    if (pct <= callLimit && heroPos !== 'SB') return 'call';
    if (heroPos === 'SB' && pct <= tbLimit + 0.03) return '3bet';
    return 'fold';
  }

  const api = { POSITIONS, POSITION_INFO, RFI, VS_OPEN, VS_3BET, set, rfiAction, vsOpenAction, vs3betAction, rangePercent, genericVsRaise };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Ranges = api;
})(typeof window !== 'undefined' ? window : globalThis);
