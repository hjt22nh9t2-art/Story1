const assert = require('assert');
const P = require('../js/poker.js');
const { Table } = require('../js/engine.js');
const mk = (stacks) => new Table({ players: stacks.map((s, i) => ({ name: 'P' + i, stack: s })), sb: 50, bb: 100, rng: () => 0 });
const total = (t) => t.players.reduce((s, p) => s + p.stack, 0) + t.pot * (t.street === 'done' ? 0 : 1);
let n = 0;
// 1) everybody folds to BB
{ const t = mk([1e4,1e4,1e4,1e4,1e4,1e4]); t.startHand();
  const bb = t.seatOfPosition('BB');
  for (let k = 0; k < 5; k++) t.act(t.toAct, { type: 'fold' });
  assert.equal(t.street, 'done'); assert.equal(t.players[bb].stack, 10050); assert.equal(total(t), 6e4); n++; }
// 2) random play conservation over many hands
for (let h = 0; h < 3000; h++) {
  const t = new Table({ players: Array.from({ length: 6 }, (_, i) => ({ name: 'P' + i, stack: 2000 + Math.floor(Math.random() * 15000) })), sb: 50, bb: 100 });
  t.startHand();
  const before = t.players.reduce((s, p) => s + p.startStack, 0);
  let guard = 0;
  while (t.street !== 'done' && guard++ < 200) {
    const L = t.legal(); const r = Math.random();
    if (r < 0.2) t.act(t.toAct, { type: 'fold' });
    else if (r < 0.65) t.act(t.toAct, { type: L.canCheck ? 'check' : 'call' });
    else t.act(t.toAct, { type: 'raise', amount: L.minTo + Math.floor(Math.random() * 3) * t.bb * (r > 0.95 ? 100 : 1) });
  }
  assert.equal(t.street, 'done', 'hand finished');
  const after = t.players.reduce((s, p) => s + p.stack, 0);
  assert.equal(after, before, 'chips conserved hand ' + h);
  t.players.forEach((p) => assert(p.stack >= 0));
}
n++;
// 3) side pot: short all-in wins main only
{ const t = mk([1000, 5000, 5000, 5000, 5000, 5000]);
  // deck preset: deal order from button+1; we just check pot structure
  t.startHand();
  const seats = t.players;
  // put short stack (seat0) all in, two others call
  while (t.toAct !== 0) t.act(t.toAct, { type: 'fold' });
  t.act(0, { type: 'raise', amount: 1000 });
  let guard = 0;
  while (t.street === 'preflop' && guard++ < 10) { const L = t.legal(); t.act(t.toAct, { type: L.toCall ? 'call' : 'check' }); }
  const pots = t.sidePots();
  assert(pots[0].eligible.includes(0));
  n++;
}
console.log(n, 'engine tests passed');
{ const t = new Table({ players: [{ name: 'A', stack: 0 }, { name: 'B', stack: 0 }, { name: 'C', stack: 0 }], sb: 50, bb: 100, rng: () => 0 });
  t.players.forEach((p) => Object.assign(p, { folded: false, allIn: true, bet: 0, startStack: 0 }));
  t.players[0].total = 1000; t.players[1].total = 5000; t.players[2].total = 5000;
  t.players[0].hole = ['As', 'Ah']; t.players[1].hole = ['Ks', 'Kh']; t.players[2].hole = ['Qs', 'Qh'];
  t.board = ['2c', '7d', '9h', 'Jc', '3s']; t.deck = []; t.events = []; t.button = 2;
  t.showdown();
  assert.equal(t.players[0].stack, 3000); assert.equal(t.players[1].stack, 8000); assert.equal(t.players[2].stack, 0);
  console.log('side pot showdown ok'); }
