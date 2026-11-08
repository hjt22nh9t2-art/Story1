/* No-Limit Hold'em Spiel-Engine (6-max): Blinds, Setzrunden, Min-Raise, All-in, Side Pots, Showdown. */
(function (root) {
  'use strict';
  const P = root.Poker || (typeof require !== 'undefined' ? require('./poker.js') : null);
  const STREETS = ['preflop', 'flop', 'turn', 'river'];
  const POS6 = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];

  class Table {
    constructor({ players, sb = 50, bb = 100, startStack = 10000, rng = Math.random }) {
      this.players = players.map((p, i) => ({ seat: i, name: p.name, style: p.style || null, isHero: !!p.isHero, stack: p.stack != null ? p.stack : startStack }));
      this.sb = sb; this.bb = bb; this.startStack = startStack; this.rng = rng;
      this.button = Math.floor(rng() * this.players.length);
      this.handNo = 0;
      this.street = 'idle';
    }

    seatAfter(i) { return (i + 1) % this.players.length; }
    positionOf(seat) { return POS6[(seat - this.button + this.players.length) % this.players.length]; }
    seatOfPosition(pos) { return (this.button + POS6.indexOf(pos)) % this.players.length; }

    startHand(presetDeck) {
      this.handNo++;
      this.button = this.seatAfter(this.button);
      for (const p of this.players) {
        if (p.stack < this.bb) { p.rebuys = (p.rebuys || 0) + 1; p.stack = this.startStack; }
        Object.assign(p, { hole: [], folded: false, allIn: false, bet: 0, total: 0, acted: false, startStack: p.stack, vpip: false, pfr: false, lastAction: null });
      }
      this.deck = presetDeck ? presetDeck.slice() : P.shuffle(P.fullDeck(), this.rng);
      this.board = [];
      this.street = 'preflop';
      this.events = [];
      this.result = null;
      this.raisesThisStreet = 0;
      this.lastAggressor = null;
      this.preflopAggressor = null;
      this.raiserSeats = [];
      // Karten
      for (let r = 0; r < 2; r++) for (let k = 1; k <= this.players.length; k++) this.players[(this.button + k) % this.players.length].hole.push(this.deck.pop());
      // Blinds
      const sbSeat = this.seatOfPosition('SB'), bbSeat = this.seatOfPosition('BB');
      this.post(sbSeat, this.sb, 'SB');
      this.post(bbSeat, this.bb, 'BB');
      this.currentBet = this.bb;
      this.minRaise = this.bb;
      this.toAct = this.seatOfPosition('UTG');
      this.log({ type: 'start', handNo: this.handNo, button: this.button });
      return this;
    }

    post(seat, amt, label) {
      const p = this.players[seat];
      const a = Math.min(amt, p.stack);
      p.stack -= a; p.bet += a; p.total += a;
      if (p.stack === 0) p.allIn = true;
      this.log({ type: 'blind', seat, amount: a, label });
    }

    log(e) { e.street = this.street; this.events.push(e); }
    get pot() { return this.players.reduce((s, p) => s + p.total, 0); }
    get potBeforeStreet() { return this.players.reduce((s, p) => s + p.total - p.bet, 0); }
    inHand() { return this.players.filter((p) => !p.folded); }
    canAct() { return this.players.filter((p) => !p.folded && !p.allIn); }

    legal(seat = this.toAct) {
      const p = this.players[seat];
      const toCall = Math.min(this.currentBet - p.bet, p.stack);
      const maxTo = p.bet + p.stack;
      const minTo = Math.min(this.currentBet + this.minRaise, maxTo);
      // Raise erlaubt, wenn mehr als Call möglich und noch jemand anderes handeln kann
      const others = this.players.filter((o) => o !== p && !o.folded && !o.allIn).length;
      return { toCall, canCheck: toCall === 0, canRaise: maxTo > this.currentBet && others > 0, minTo, maxTo, isBet: this.currentBet === 0 };
    }

    act(seat, action) {
      if (this.street === 'done' || seat !== this.toAct) throw new Error('Nicht am Zug');
      const p = this.players[seat];
      const L = this.legal(seat);
      let { type, amount } = action;
      if (type === 'check' && !L.canCheck) type = 'call';
      if (type === 'call' && L.toCall === 0) type = 'check';
      if (type === 'raise' && !L.canRaise) type = L.canCheck ? 'check' : 'call';

      if (type === 'fold') {
        p.folded = true;
      } else if (type === 'check') {
        // nichts
      } else if (type === 'call') {
        const a = L.toCall;
        p.stack -= a; p.bet += a; p.total += a;
        if (p.stack === 0) p.allIn = true;
        amount = a;
        if (this.street === 'preflop') p.vpip = true;
      } else if (type === 'raise') {
        let to = Math.max(L.minTo, Math.min(Math.round(amount), L.maxTo));
        const add = to - p.bet;
        const raiseSize = to - this.currentBet;
        p.stack -= add; p.bet = to; p.total += add;
        if (p.stack === 0) p.allIn = true;
        if (raiseSize >= this.minRaise) this.minRaise = raiseSize; // volle Erhöhung
        this.currentBet = to;
        this.raisesThisStreet++;
        this.lastAggressor = seat;
        this.raiserSeats.push(seat);
        if (this.street === 'preflop') { p.vpip = true; p.pfr = true; this.preflopAggressor = seat; }
        for (const o of this.players) if (o !== p && !o.folded && !o.allIn) o.acted = false;
        amount = to;
      }
      p.acted = true;
      p.lastAction = type;
      this.log({ type, seat, amount, wasBet: type === 'raise' && L.isBet, pot: this.pot });
      this.advance();
    }

    advance() {
      if (this.inHand().length === 1) return this.finishUncontested();
      const pending = this.canAct().filter((p) => !p.acted || p.bet < this.currentBet);
      if (pending.length > 0) {
        // nächster Spieler im Uhrzeigersinn
        let s = this.seatAfter(this.toAct);
        for (let k = 0; k < this.players.length; k++) {
          const o = this.players[s];
          if (!o.folded && !o.allIn && (!o.acted || o.bet < this.currentBet)) { this.toAct = s; return; }
          s = this.seatAfter(s);
        }
      }
      // Setzrunde beendet
      this.nextStreet();
    }

    nextStreet() {
      // Ungecallte Überschüsse zurückgeben
      this.returnUncalled();
      for (const p of this.players) { p.bet = 0; p.acted = false; }
      this.currentBet = 0; this.minRaise = this.bb; this.raisesThisStreet = 0; this.lastAggressor = null; this.raiserSeats = [];
      const idx = STREETS.indexOf(this.street);
      if (idx === 3) return this.showdown();
      this.street = STREETS[idx + 1];
      this.deck.pop(); // Burn Card
      const n = this.street === 'flop' ? 3 : 1;
      for (let i = 0; i < n; i++) this.board.push(this.deck.pop());
      this.log({ type: 'board', cards: this.board.slice() });
      if (this.canAct().length <= 1) return this.nextStreet(); // alle All-in: Board durchlaufen lassen
      let s = this.seatAfter(this.button);
      while (this.players[s].folded || this.players[s].allIn) s = this.seatAfter(s);
      this.toAct = s;
    }

    returnUncalled() {
      const live = this.players.filter((p) => !p.folded);
      const sortedBets = this.players.map((p) => p.bet).sort((a, b) => b - a);
      const top = this.players.find((p) => p.bet === sortedBets[0]);
      const second = sortedBets[1] || 0;
      if (top && top.bet > second && live.includes(top)) {
        const back = top.bet - second;
        top.bet -= back; top.total -= back; top.stack += back;
        if (top.stack > 0) top.allIn = false;
        if (back > 0) this.log({ type: 'return', seat: top.seat, amount: back });
      }
    }

    finishUncontested() {
      this.returnUncalled();
      const w = this.inHand()[0];
      const pot = this.pot;
      w.stack += pot;
      this.street = 'done';
      this.result = { showdown: false, pots: [{ amount: pot, winners: [w.seat] }], winners: { [w.seat]: pot } };
      this.log({ type: 'win', seat: w.seat, amount: pot, showdown: false });
      this.settle();
    }

    /** Side Pots berechnen: [{amount, eligible:[seats]}] */
    sidePots() {
      const levels = [...new Set(this.players.filter((p) => p.total > 0).map((p) => p.total))].sort((a, b) => a - b);
      const pots = [];
      let prev = 0;
      for (const lvl of levels) {
        let amount = 0;
        for (const p of this.players) amount += Math.max(0, Math.min(p.total, lvl) - prev);
        const eligible = this.players.filter((p) => !p.folded && p.total >= lvl).map((p) => p.seat);
        if (amount > 0) {
          if (eligible.length === 0 && pots.length) pots[pots.length - 1].amount += amount;
          else pots.push({ amount, eligible });
        }
        prev = lvl;
      }
      // Pots mit identischen Berechtigten zusammenführen
      const merged = [];
      for (const pt of pots) {
        const last = merged[merged.length - 1];
        if (last && last.eligible.join() === pt.eligible.join()) last.amount += pt.amount; else merged.push({ ...pt });
      }
      return merged;
    }

    showdown() {
      while (this.board.length < 5) this.board.push(this.deck.pop());
      this.street = 'showdown';
      const evals = {};
      for (const p of this.inHand()) evals[p.seat] = P.evaluate([...p.hole, ...this.board]);
      const pots = this.sidePots();
      const winners = {};
      const potResults = [];
      for (const pt of pots) {
        let best = -1, ws = [];
        for (const s of pt.eligible) {
          const sc = evals[s].score;
          if (sc > best) { best = sc; ws = [s]; } else if (sc === best) ws.push(s);
        }
        // Odd Chips an den ersten Gewinner links vom Button
        const n = this.players.length;
        ws.sort((a, b) => ((a - this.button + n) % n || n) - ((b - this.button + n) % n || n));
        const share = Math.floor(pt.amount / ws.length);
        let rem = pt.amount - share * ws.length;
        for (const s of ws) {
          const amt = share + (rem > 0 ? 1 : 0); if (rem > 0) rem--;
          this.players[s].stack += amt;
          winners[s] = (winners[s] || 0) + amt;
        }
        potResults.push({ amount: pt.amount, winners: ws });
      }
      this.result = { showdown: true, evals, pots: potResults, winners };
      for (const s of Object.keys(winners)) this.log({ type: 'win', seat: +s, amount: winners[s], showdown: true, desc: evals[s].desc });
      this.street = 'done';
      this.settle();
    }

    settle() {
      for (const p of this.players) p.delta = p.stack - p.startStack;
    }
  }

  const api = { Table, STREETS, POS6 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
