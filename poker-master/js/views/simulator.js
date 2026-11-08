/* Poker-Simulator: 6-max No-Limit Hold'em gegen 5 Bots mit Live-Coach. */
(function (root) {
  'use strict';
  const UI = root.UI, S = root.Store, P = root.Poker, AI = root.AI;
  const { Table } = root.Engine;
  const V = (root.Views = root.Views || {});

  const NAMES = ['Lena', 'Marco', 'Sven', 'Aylin', 'Jonas', 'Mira', 'Theo', 'Nora', 'Felix', 'Ida', 'Karim', 'Paula'];
  const LINEUPS = {
    mix: ['TAG', 'LAG', 'NIT', 'STATION', 'MANIAC'],
    easy: ['STATION', 'STATION', 'NIT', 'MANIAC', 'STATION'],
    hard: ['TAG', 'LAG', 'TAG', 'LAG', 'TAG'],
  };

  let T = null;          // Tisch bleibt beim Navigieren erhalten
  let lineup = 'mix';
  let ui = null;         // aktuelles Root-Element
  let timer = null;
  let feed = [];         // Coach-Feedback der aktuellen Session
  let session = { hands: 0, net: 0, good: 0, dec: 0 };
  let autoDeal = false;

  function newTable() {
    const names = P.shuffle(NAMES).slice(0, 5);
    const styles = P.shuffle(LINEUPS[lineup]);
    const bb = 100;
    const start = (S.db.settings.startStack || 100) * bb;
    T = new Table({
      players: [{ name: S.db.profile.name || 'Du', isHero: true }, ...names.map((n, i) => ({ name: n, style: styles[i] }))],
      sb: 50, bb, startStack: start,
    });
    feed = []; session = { hands: 0, net: 0, good: 0, dec: 0 };
  }

  const bbFmt = (chips) => { const v = chips / T.bb; return (Math.round(v * 10) / 10).toLocaleString('de-DE') + ' BB'; };
  const hero = () => T.players[0];

  V.simulator = (el) => {
    ui = el;
    if (!T) newTable();
    el.innerHTML = `
      <header class="page-h compact"><div><h1>Poker-Simulator</h1><p class="muted">6-max No-Limit Hold’em · 100 BB · Der Coach bewertet jede deiner Entscheidungen.</p></div>
        <div class="sim-ctrl"><select id="lineup" aria-label="Gegner"><option value="mix">Gegner: Gemischt</option><option value="easy">Gegner: Leicht</option><option value="hard">Gegner: Stark</option></select>
        <button class="btn ghost sm" id="newTable">Neuer Tisch</button></div></header>
      <div class="sim">
        <div class="sim-main">
          <div class="ptable" id="ptable"></div>
          <div class="actions" id="actions"></div>
        </div>
        <aside class="sim-side">
          <div class="panel tight"><h4>Session</h4><div class="sess" id="sess"></div></div>
          <div class="panel tight"><h4>Coach <label class="switch"><input type="checkbox" id="coachT" ${S.db.settings.coach ? 'checked' : ''}><span></span></label></h4><div id="coach" class="coach"></div></div>
          <div class="panel tight"><h4>Hand-Verlauf</h4><div id="log" class="hlog"></div></div>
        </aside>
      </div>`;
    el.querySelector('#lineup').value = lineup;
    el.querySelector('#lineup').addEventListener('change', (e) => { lineup = e.target.value; newTable(); T.street = 'idle'; render(); });
    el.querySelector('#newTable').addEventListener('click', () => { clearTimeout(timer); newTable(); render(); });
    el.querySelector('#coachT').addEventListener('change', (e) => { S.db.settings.coach = e.target.checked; S.save(); renderCoach(); });
    render();
    if (T.street !== 'idle' && T.street !== 'done') loop();
  };

  function alive() { return ui && document.body.contains(ui) && ui.querySelector('#ptable'); }

  function startHand() {
    clearTimeout(timer);
    T.startHand();
    T._heroDecisions = [];
    render(true);
    loop();
  }

  function loop() {
    clearTimeout(timer);
    if (!alive()) return;
    if (T.street === 'done') return endHand();
    const p = T.players[T.toAct];
    if (p.isHero) { renderActions(); return; }
    renderActions(true);
    timer = setTimeout(() => {
      if (!alive()) return;
      const d = AI.botDecide(T, T.toAct);
      const before = T.board.length;
      T.act(T.toAct, d);
      render(T.board.length !== before);
      loop();
    }, S.db.settings.botSpeed || 700);
  }

  function heroAct(action) {
    if (T.toAct !== 0 || T.street === 'done') return;
    const c = AI.coach(T, 0, action);
    const street = T.street;
    const holeTxt = hero().hole.map((x) => x[0] + P.SUIT_SYMBOL[x[1]]).join(' ');
    if (c) {
      const ok = c.verdict !== 'bad';
      S.db.sim.decisions++; if (ok) S.db.sim.good++;
      S.db.totals.analyzed++;
      session.dec++; if (ok) session.good++;
      const actLbl = { fold: 'Fold', check: 'Check', call: 'Call', raise: T.currentBet === 0 ? 'Bet' : 'Raise' }[action.type];
      c.label = `${street[0].toUpperCase() + street.slice(1)} · ${holeTxt}${T.board.length ? ' · Board ' + T.board.map((x) => x[0] + P.SUIT_SYMBOL[x[1]]).join(' ') : ''} · ${T.positionOf(0)} · Deine Aktion: ${actLbl}`;
      feed.unshift(c); if (feed.length > 30) feed.pop();
      S.recordAnswer(c.skill, ok, { q: 'Simulator – ' + c.label, answer: actLbl, correct: c.rec ? ({ '3bet': '3-Bet', '4bet': '4-Bet', raise: 'Raise', call: 'Call', fold: 'Fold', check: 'Check' })[c.rec] || '' : '', explain: c.text, visual: UI.cards(hero().hole, { small: true }) + (T.board.length ? UI.cards(T.board, { small: true }) : '') }, { sim: true });
      if (ok) S.addXP(c.verdict === 'good' ? 2 : 1);
      if (S.db.settings.coach && c.verdict === 'bad') UI.toast('Coach: Diese Entscheidung war ein Fehler – siehe Analyse.', 'red', 2500);
    }
    const before = T.board.length;
    T.act(0, action);
    render(T.board.length !== before);
    loop();
  }

  function endHand() {
    const h = hero();
    const net = h.delta / T.bb;
    const s = S.db.sim;
    s.hands++; S.day().hands++;
    s.netBB = Math.round((s.netBB + net) * 10) / 10;
    if (h.vpip) s.vpip++; if (h.pfr) s.pfr++;
    if (h.delta > 0) s.won++;
    if (T.result.showdown && !h.folded) { s.showdowns++; if (h.delta > 0) s.wonShowdown++; }
    // Bluff-Erkennung: ohne Showdown gewonnen, postflop zuletzt gesetzt, schwache Hand
    if (!T.result.showdown && h.delta > 0 && T.board.length >= 3 && h.lastAction === 'raise') {
      const e = P.evaluate([...h.hole, ...T.board]);
      const topBoard = Math.max(...T.board.map(P.rankVal));
      if (e.cat === 0 || (e.cat === 1 && e.tb[0] < topBoard)) { s.bluffWins++; UI.toast('🎭 Erfolgreicher Bluff!', 'gold'); }
    }
    s.history.push(s.netBB); if (s.history.length > 1000) s.history.shift();
    session.hands++; session.net += net;
    S.addXP(1);
    S.save(); root.Achievements.check();
    render();
    renderActions();
    if (autoDeal) timer = setTimeout(() => alive() && T.street === 'done' && startHand(), 2600);
  }

  // ---------------------------------------------------------------- Rendering
  const SEAT_POS = [[50, 106], [4, 72], [15, 3], [50, -7], [85, 3], [96, 72]];
  const betPos = (i) => { const [x, y] = SEAT_POS[i]; const k = i === 0 ? 0.5 : 0.36; return [x + (50 - x) * k, y + (50 - y) * (i === 0 ? 0.6 : i === 3 ? 0.5 : 0.42)]; };

  function render(animBoard) {
    if (!alive()) return;
    const tbl = ui.querySelector('#ptable');
    const done = T.street === 'done';
    const idle = T.street === 'idle';
    const winners = done && T.result ? T.result.winners : {};
    const heroEval = !idle && T.board.length >= 3 ? P.evaluate([...hero().hole, ...T.board]) : null;
    tbl.innerHTML = `<div class="pfelt">
      <div class="pcenter">
        <div class="ppot">${idle ? 'POKER MASTER' : 'Pot: ' + bbFmt(T.pot)}</div>
        <div class="pboard">${idle ? '' : T.board.map((c, i) => UI.card(c, { anim: animBoard && i >= T.board.length - (T.board.length === 3 ? 3 : 1), delay: i * 80, hl: done && T.result.showdown && bestOfWinner().includes(c) })).join('') + Array(5 - T.board.length).fill('<div class="card slot"></div>').join('')}</div>
        ${done ? `<div class="presult">${resultText()}</div>` : heroEval ? `<div class="phand">${heroEval.desc}</div>` : ''}
      </div>
      ${T.players.map((p, i) => {
        const [x, y] = SEAT_POS[i];
        const show = p.isHero || (done && T.result.showdown && !p.folded);
        const st = AI.STYLES[p.style];
        return `<div class="pseat ${p.isHero ? 'hero' : ''} ${p.folded ? 'folded' : ''} ${!idle && !done && T.toAct === i ? 'turn' : ''} ${winners[i] ? 'winner' : ''}" style="left:${x}%;top:${y}%">
          <div class="pcards">${idle || (p.folded && !p.isHero) ? '' : p.hole.map((c, k) => UI.card(show ? c : null, { small: !p.isHero, anim: animBoard === true && T.board.length === 0, delay: k * 120 + i * 40, hl: done && winners[i] && T.result.showdown && bestOfSeat(i).includes(c) })).join('')}</div>
          <div class="pinfo"><div class="pname">${UI.esc(p.name)}${st ? `<span class="ptype" title="${st.desc}">${st.label}</span>` : ''}</div><div class="pstack">${bbFmt(p.stack)}</div>
            <div class="ppos">${idle ? '' : T.positionOf(i)}</div></div>
          ${!idle && T.button === i ? '<div class="pdealer">D</div>' : ''}
          ${!idle && p.lastAction && !done ? `<div class="pact a-${p.lastAction}">${{ fold: 'Fold', check: 'Check', call: 'Call', raise: 'Raise' }[p.lastAction]}${p.allIn ? ' · All-in' : ''}</div>` : ''}
          ${done && winners[i] ? `<div class="pact a-win">+${bbFmt(winners[i])}</div>` : ''}
        </div>`;
      }).join('')}
      ${idle ? '' : T.players.map((p, i) => p.bet > 0 ? `<div class="pbet" style="left:${betPos(i)[0]}%;top:${betPos(i)[1]}%"><span class="chipi"></span>${bbFmt(p.bet)}</div>` : '').join('')}
    </div>`;
    renderActions(!done && !idle && T.toAct !== 0);
    renderSession();
    renderCoach();
    renderLog();
  }

  function bestOfSeat(i) { return T.result && T.result.evals && T.result.evals[i] ? T.result.evals[i].best : []; }
  function bestOfWinner() { const w = Object.keys(T.result.winners)[0]; return bestOfSeat(+w); }

  function resultText() {
    const r = T.result;
    const ws = Object.keys(r.winners).map(Number);
    const names = ws.map((s) => (s === 0 ? '<b>Du</b>' : UI.esc(T.players[s].name)));
    if (!r.showdown) return `${names.join(', ')} gewinnt ${bbFmt(r.winners[ws[0]])} – alle anderen haben gefoldet.`;
    return `${names.join(' & ')} ${ws.length > 1 ? 'teilen' : 'gewinnt'} mit <b>${r.evals[ws[0]].desc}</b>`;
  }

  function renderActions(waiting) {
    const box = ui.querySelector('#actions');
    if (!box) return;
    if (T.street === 'idle' || T.street === 'done') {
      box.innerHTML = `<div class="act-row"><button class="btn primary big" id="deal">${T.street === 'idle' ? 'Erste Hand austeilen' : 'Nächste Hand'} <kbd>N</kbd></button>
        <label class="chk"><input type="checkbox" id="auto" ${autoDeal ? 'checked' : ''}> Automatisch weiter</label>
        ${T.street === 'done' ? `<span class="muted small">Ergebnis: ${hero().delta >= 0 ? '+' : ''}${bbFmt(hero().delta)}</span>` : ''}</div>`;
      box.querySelector('#deal').addEventListener('click', startHand);
      box.querySelector('#auto').addEventListener('change', (e) => (autoDeal = e.target.checked));
      return;
    }
    if (waiting || T.toAct !== 0) { box.innerHTML = `<div class="act-row wait"><span class="spinner"></span> ${UI.esc(T.players[T.toAct].name)} überlegt…</div>`; return; }
    const L = T.legal(0);
    const pot = T.pot;
    const presets = [];
    if (L.canRaise) {
      if (T.street === 'preflop') {
        if (T.raisesThisStreet === 0) [2.5, 3, 4].forEach((x) => presets.push([`${String(x).replace('.', ',')} BB`, x * T.bb]));
        else [3, 4].forEach((x) => presets.push([`${x}×`, T.currentBet * x]));
      } else {
        [[0.33, '33 %'], [0.5, '50 %'], [0.75, '75 %'], [1, 'Pot']].forEach(([f, l]) => presets.push([l, L.isBet ? pot * f : T.currentBet + f * (pot + L.toCall)]));
      }
      presets.push(['All-in', L.maxTo]);
    }
    const clamp = (v) => Math.max(L.minTo, Math.min(L.maxTo, Math.round(v / 10) * 10));
    box.innerHTML = `
      <div class="act-row">
        <button class="btn act fold" data-a="fold">Fold <kbd>F</kbd></button>
        <button class="btn act call" data-a="${L.canCheck ? 'check' : 'call'}">${L.canCheck ? 'Check' : 'Call ' + bbFmt(L.toCall)} <kbd>C</kbd></button>
        ${L.canRaise ? `<button class="btn act raise" data-a="raise">${L.isBet ? 'Bet' : 'Raise'} <b id="rv">${bbFmt(clamp(presets[0][1]))}</b> <kbd>R</kbd></button>` : ''}
        <button class="btn ghost sm" id="hint">💡 Hinweis</button>
      </div>
      ${L.canRaise ? `<div class="raise-row"><input type="range" id="rs" min="${L.minTo}" max="${L.maxTo}" step="10" value="${clamp(presets[0][1])}"><div class="presets">${presets.map(([l, v]) => `<button class="chip" data-v="${clamp(v)}">${l}</button>`).join('')}</div></div>` : ''}
      <div id="hintBox"></div>`;
    const rs = box.querySelector('#rs');
    if (rs) {
      rs.addEventListener('input', () => (box.querySelector('#rv').textContent = bbFmt(+rs.value)));
      box.querySelectorAll('.presets .chip').forEach((b) => b.addEventListener('click', () => { rs.value = b.dataset.v; rs.dispatchEvent(new Event('input')); }));
    }
    box.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.a;
      heroAct(a === 'raise' ? { type: 'raise', amount: +rs.value } : { type: a });
    }));
    box.querySelector('#hint').addEventListener('click', showHint);
  }

  function showHint() {
    const box = ui.querySelector('#hintBox');
    box.innerHTML = '<div class="muted small">Coach analysiert…</div>';
    setTimeout(() => {
      const L = T.legal(0);
      const acts = ['fold', L.canCheck ? 'check' : 'call'].concat(L.canRaise ? ['raise'] : []);
      const res = acts.map((a) => ({ a, c: AI.coach(T, 0, { type: a, amount: L.minTo }) }));
      const lbl = { fold: 'Fold', check: 'Check', call: 'Call', raise: L.isBet ? 'Bet' : 'Raise' };
      const ico = { good: '✅', ok: '🟡', bad: '❌' };
      const extra = T.street === 'preflop' ? '' : `<div class="muted small">Equity ≈ ${Math.round(AI.heroEquity(T, 0, 1200) * 100)} %${L.toCall ? ` · benötigt ${Math.round(L.toCall / (T.pot + L.toCall) * 100)} %` : ''}</div>`;
      box.innerHTML = `<div class="hint">${res.map((r) => `<span>${ico[r.c.verdict]} ${lbl[r.a]}</span>`).join('')}${extra}</div>`;
    }, 20);
  }

  function renderSession() {
    const el = ui.querySelector('#sess'); if (!el) return;
    const s = S.db.sim;
    el.innerHTML = `<div class="kv"><span>Hände (Session)</span><b>${session.hands}</b></div>
      <div class="kv"><span>Ergebnis (Session)</span><b class="${session.net >= 0 ? 'pos' : 'neg'}">${session.net >= 0 ? '+' : ''}${session.net.toFixed(1)} BB</b></div>
      <div class="kv"><span>Entscheidungen korrekt</span><b>${session.dec ? Math.round(session.good / session.dec * 100) + ' %' : '–'}</b></div>
      <div class="kv"><span>Gesamt: Hände · VPIP · PFR</span><b>${s.hands} · ${s.hands ? Math.round(s.vpip / s.hands * 100) : 0} % · ${s.hands ? Math.round(s.pfr / s.hands * 100) : 0} %</b></div>`;
  }

  function renderCoach() {
    const el = ui.querySelector('#coach'); if (!el) return;
    if (!S.db.settings.coach) { el.innerHTML = '<div class="muted small">Coach ausgeblendet. Entscheidungen werden trotzdem im Hintergrund ausgewertet.</div>'; return; }
    if (!feed.length) { el.innerHTML = '<div class="muted small">Triff deine erste Entscheidung – der Coach erklärt dir sofort, ob sie gut war und warum.</div>'; return; }
    const lab = { good: 'Gut', ok: 'Vertretbar', bad: 'Fehler' };
    el.innerHTML = feed.slice(0, 8).map((c, i) => `<div class="cfb v-${c.verdict} ${i ? 'old' : ''}"><div class="cfb-h"><span class="vb">${lab[c.verdict]}</span><span class="small muted">${UI.esc(c.label || '')}</span></div><div class="cfb-t">${c.text}</div></div>`).join('');
  }

  function renderLog() {
    const el = ui.querySelector('#log'); if (!el || !T.events) { if (el) el.innerHTML = ''; return; }
    const nm = (s) => (s === 0 ? 'Du' : T.players[s].name);
    const lines = T.events.map((e) => {
      switch (e.type) {
        case 'start': return `<div class="lg-h">Hand #${e.handNo}</div>`;
        case 'blind': return `<div>${nm(e.seat)} setzt ${e.label} (${bbFmt(e.amount)})</div>`;
        case 'fold': return `<div class="dim">${nm(e.seat)} foldet</div>`;
        case 'check': return `<div>${nm(e.seat)} checkt</div>`;
        case 'call': return `<div>${nm(e.seat)} callt ${bbFmt(e.amount)}</div>`;
        case 'raise': return `<div class="agg">${nm(e.seat)} ${e.wasBet ? 'setzt' : 'erhöht auf'} ${bbFmt(e.amount)}</div>`;
        case 'board': return `<div class="lg-b">${{ 3: 'Flop', 4: 'Turn', 5: 'River' }[e.cards.length]}: ${e.cards.map((c) => c[0] + P.SUIT_SYMBOL[c[1]]).join(' ')}</div>`;
        case 'return': return `<div class="dim">${bbFmt(e.amount)} an ${nm(e.seat)} zurück</div>`;
        case 'win': return `<div class="lg-w">${nm(e.seat)} gewinnt ${bbFmt(e.amount)}${e.desc ? ' – ' + e.desc : ''}</div>`;
      }
      return '';
    });
    el.innerHTML = lines.join('');
    el.scrollTop = el.scrollHeight;
  }

  // Tastatur
  document.addEventListener('keydown', (e) => {
    if (!alive() || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    const k = e.key.toLowerCase();
    if (k === 'n' && (T.street === 'done' || T.street === 'idle')) startHand();
    if (T.street === 'done' || T.street === 'idle' || T.toAct !== 0) return;
    const btn = (sel) => { const b = ui.querySelector(sel); if (b) b.click(); };
    if (k === 'f') btn('.act.fold');
    if (k === 'c') btn('.act.call');
    if (k === 'r') btn('.act.raise');
  });
})(window);
