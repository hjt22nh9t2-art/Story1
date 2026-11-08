/* UI-Bausteine: Karten, Toasts, Tisch-Grafiken, Range-Matrix, Quiz-Runner, Lektions-Abschnitte. */
(function (root) {
  'use strict';
  const P = root.Poker, R = root.Ranges;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------------------------------------------------------------- Karten
  function card(c, o = {}) {
    if (!c || o.hidden) return `<div class="card back${o.small ? ' sm' : ''}${o.anim ? ' deal' : ''}" style="${o.delay ? `animation-delay:${o.delay}ms` : ''}"></div>`;
    const r = c[0] === 'T' ? '10' : c[0];
    return `<div class="card s-${c[1]}${o.small ? ' sm' : ''}${o.hl ? ' hl' : ''}${o.dim ? ' dim' : ''}${o.anim ? ' deal' : ''}" style="${o.delay ? `animation-delay:${o.delay}ms` : ''}" aria-label="${P.RANK_NAME[P.rankVal(c)]} ${P.SUIT_NAME[c[1]]}"><span class="r">${r}</span><span class="s">${P.SUIT_SYMBOL[c[1]]}</span><span class="s2">${P.SUIT_SYMBOL[c[1]]}</span></div>`;
  }
  function cards(list, o = {}) {
    return `<div class="cards">${list.map((c, i) => card(c, { ...o, delay: o.anim ? i * 90 : 0, hl: o.highlight && o.highlight.includes(c), dim: o.highlight && !o.highlight.includes(c) })).join('')}</div>`;
  }

  // ---------------------------------------------------------------- Toast
  function toast(msg, kind = '', ms = 2200) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    while (box.children.length >= 3) box.firstChild.remove();
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.innerHTML = msg;
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), ms);
    setTimeout(() => t.remove(), ms + 400);
  }

  // ---------------------------------------------------------------- Mini-Tisch
  const SEAT_XY = [[50, 92], [10, 70], [10, 28], [50, 8], [90, 28], [90, 70]];
  function miniTable({ highlight = [], labels = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'], onClick } = {}) {
    // Sitz 0 = BTN unten; im Uhrzeigersinn SB, BB …
    const order = [[50, 92], [10, 70], [10, 28], [50, 8], [90, 28], [90, 70]];
    return `<div class="mtable"><div class="mfelt"></div>${labels.map((l, i) => `<div class="mseat${highlight.includes(l) ? ' on' : ''}${onClick ? ' clickable' : ''}" data-pos="${l}" style="left:${order[i][0]}%;top:${order[i][1]}%">${l}${l === 'BTN' ? '<span class="dbtn">D</span>' : ''}</div>`).join('')}</div>`;
  }

  function potBar(pot, bet) {
    const total = pot + 2 * bet;
    return `<div class="potbar"><div class="pb-seg pot" style="flex:${pot}"><span>Pot ${pot}</span></div><div class="pb-seg bet" style="flex:${bet}"><span>Bet ${bet}</span></div><div class="pb-seg call" style="flex:${bet}"><span>Dein Call ${bet}</span></div></div><div class="pb-legend">Du zahlst ${bet} von insgesamt ${total} BB → ${(bet / total * 100).toFixed(1)} %</div>`;
  }

  // ---------------------------------------------------------------- Range-Matrix
  function rangeGrid({ raise = null, call = null, mark = null, user = null, compare = false, small = false } = {}) {
    const M = P.matrixClasses();
    let html = `<div class="rgrid${small ? ' sm' : ''}">`;
    for (const row of M) for (const c of row) {
      let cls = 'rc';
      if (compare) {
        const inRef = raise.has(c), inUser = user.has(c);
        cls += inRef && inUser ? ' hit' : inRef ? ' miss' : inUser ? ' extra' : '';
      } else {
        if (raise && raise.has(c)) cls += ' r3';
        else if (call && call.has(c)) cls += ' rcall';
        if (user && user.has(c)) cls += ' r3';
      }
      if (mark === c) cls += ' mark';
      html += `<div class="${cls}" data-c="${c}">${c}</div>`;
    }
    return html + '</div>';
  }

  function hydrate(el) {
    el.querySelectorAll('.mini-range').forEach((d) => {
      const r3 = d.dataset.range3 ? R.set(d.dataset.range3) : null;
      const r = d.dataset.range ? R.set(d.dataset.range) : null;
      d.innerHTML = r3 ? rangeGrid({ raise: r3, call: r, mark: d.dataset.mark, small: true }) : rangeGrid({ raise: r, mark: d.dataset.mark, small: true });
      d.insertAdjacentHTML('beforeend', `<div class="rlegend">${r3 ? '<span class="lg r3"></span>3-Bet <span class="lg rcall"></span>Call' : '<span class="lg r3"></span>Raise'} <span class="lg mark"></span>Deine Hand</div>`);
    });
  }

  function ring(frac, size = 120, label = '', sub = '') {
    const r = size / 2 - 8, c = 2 * Math.PI * r;
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.max(0, Math.min(1, frac)))}"/></svg><div class="ring-txt"><b>${label}</b><span>${sub}</span></div></div>`;
  }

  function bar(frac, cls = '') { return `<div class="bar ${cls}"><div style="width:${Math.max(0, Math.min(100, frac * 100))}%"></div></div>`; }

  // ---------------------------------------------------------------- Quiz-Runner
  function normalize(item) {
    if (item.options) return item;
    return { skill: item.s, title: 'Frage', prompt: item.q, visual: '', options: item.o.map((l, i) => ({ label: l, value: i })), correct: item.a, explain: item.e, qid: item.id };
  }

  /**
   * Führt eine Folge von Fragen aus.
   * opts: { mode: 'practice'|'exam', source: Array | () => question, count, title, onFinish(result), onAnswer(q, ok), xpPerCorrect }
   */
  function quiz(container, opts) {
    const st = { i: 0, correct: 0, answers: [], cur: null };
    const count = opts.count || (Array.isArray(opts.source) ? opts.source.length : 10);
    const nextQ = () => normalize(Array.isArray(opts.source) ? opts.source[st.i] : opts.source(st.i));

    function render() {
      if (st.i >= count) return finish();
      let q;
      try { q = nextQ(); } catch (e) { console.error(e); st.i++; return render(); }
      st.cur = q;
      container.innerHTML = `
        <div class="quiz">
          <div class="quiz-top"><span class="quiz-count">${opts.title ? esc(opts.title) + ' · ' : ''}Aufgabe ${st.i + 1} / ${count}</span><span class="quiz-skill">${esc(root.Store.SKILLS[q.skill] || '')}</span></div>
          ${bar(st.i / count, 'thin')}
          ${q.title && q.title !== 'Frage' ? `<div class="quiz-title">${esc(q.title)}</div>` : ''}
          <div class="quiz-prompt">${q.prompt}</div>
          <div class="quiz-visual">${q.visual || ''}</div>
          <div class="quiz-opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}"><span class="key">${k + 1}</span>${esc(o.label)}</button>`).join('')}</div>
          <div class="quiz-fb"></div>
        </div>`;
      container.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.k)));
      hydrate(container);
    }

    function answer(k) {
      const q = st.cur;
      if (q.answered) return;
      q.answered = true;
      const chosen = q.options[k];
      const ok = chosen.value === q.correct;
      if (ok) st.correct++;
      const correctOpt = q.options.find((o) => o.value === q.correct);
      st.answers.push({ q, chosen, ok });
      const meta = { q: stripHTML(q.prompt).slice(0, 220), answer: chosen.label, correct: correctOpt ? correctOpt.label : '', explain: q.explain, visual: q.visual, gen: q.gen, qid: q.qid };
      root.Store.recordAnswer(q.skill, ok, meta);
      if (opts.onAnswer) opts.onAnswer(q, ok);
      if (ok && opts.xpPerCorrect) root.Store.addXP(opts.xpPerCorrect);
      const btns = container.querySelectorAll('.opt');
      btns.forEach((b, i) => {
        b.disabled = true;
        if (q.options[i].value === q.correct) b.classList.add(opts.mode === 'exam' ? 'chosen' : 'right');
        if (i === k && !ok) b.classList.add(opts.mode === 'exam' ? 'chosen' : 'wrong');
      });
      if (opts.mode === 'exam') {
        btns.forEach((b, i) => { b.classList.remove('chosen'); if (i === k) b.classList.add('chosen'); });
        container.querySelector('.quiz-fb').innerHTML = `<button class="btn primary next">${st.i + 1 < count ? 'Weiter' : 'Auswerten'} →</button>`;
      } else {
        container.querySelector('.quiz-fb').innerHTML = `
          <div class="fb ${ok ? 'ok' : 'no'}"><div class="fb-h">${ok ? '✓ Richtig!' : '✗ Leider falsch'}${!ok && correctOpt ? ` – richtig ist: <b>${esc(correctOpt.label)}</b>` : ''}</div><div class="fb-e">${q.explain || ''}</div></div>
          <button class="btn primary next">${st.i + 1 < count ? 'Nächste Aufgabe' : 'Abschließen'} →</button>`;
        hydrate(container);
      }
      const nb = container.querySelector('.next');
      nb.addEventListener('click', () => { st.i++; render(); });
      nb.focus({ preventScroll: true });
    }

    function finish() {
      const res = { correct: st.correct, total: count, frac: st.correct / count, answers: st.answers };
      if (opts.onFinish) opts.onFinish(res, container);
    }

    const keyH = (e) => {
      if (!document.body.contains(container)) return document.removeEventListener('keydown', keyH);
      if (e.target.tagName === 'INPUT') return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) { const b = container.querySelectorAll('.opt')[n - 1]; if (b && !b.disabled) b.click(); }
      if (e.key === 'Enter') { const b = container.querySelector('.next'); if (b) { e.preventDefault(); b.click(); } }
    };
    document.addEventListener('keydown', keyH);
    render();
    return st;
  }

  function reviewList(answers) {
    return `<div class="review">${answers.map((a, i) => `
      <details class="rv ${a.ok ? 'ok' : 'no'}"${a.ok ? '' : ' open'}><summary><span class="rv-i">${a.ok ? '✓' : '✗'}</span> ${i + 1}. ${stripHTML(a.q.prompt).slice(0, 120)}</summary>
      <div class="rv-b">${a.q.visual || ''}<p>Deine Antwort: <b>${esc(a.chosen.label)}</b>${a.ok ? '' : ` · Richtig: <b>${esc((a.q.options.find((o) => o.value === a.q.correct) || {}).label || '')}</b>`}</p><div class="fb-e">${a.q.explain || ''}</div></div></details>`).join('')}</div>`;
  }

  function stripHTML(h) { const d = document.createElement('div'); d.innerHTML = h; return d.textContent || ''; }

  // ---------------------------------------------------------------- Lektions-Abschnitte
  function section(sec) {
    switch (sec.t) {
      case 'text': return `<div class="sec-text">${sec.h}</div>`;
      case 'tip': return `<div class="tip"><span class="tip-i">💡</span><div>${sec.h}</div></div>`;
      case 'example': return `<div class="example"><div class="ex-h">${esc(sec.title || 'Beispiel')}</div><div>${sec.h}</div></div>`;
      case 'cards': return `<div class="card-rows">${sec.rows.map((r) => `<div class="cv"><div class="cv-label">${esc(r.label)}</div>${cards(r.cards, { anim: true })}</div>`).join('')}</div>`;
      case 'ranks': return handRanks();
      case 'range': {
        let html;
        if (sec.rfi) html = rangeGrid({ raise: R.set(R.RFI[sec.rfi]) });
        else if (sec.vs) html = rangeGrid({ raise: R.set(R.VS_OPEN[sec.vs].threebet), call: R.set(R.VS_OPEN[sec.vs].call) });
        else html = rangeGrid({ raise: P.topRange(sec.top) });
        return `<div class="range-box"><div class="rb-h">${esc(sec.title)}</div>${html}<div class="rlegend">${sec.vs ? '<span class="lg r3"></span>3-Bet <span class="lg rcall"></span>Call <span class="lg"></span>Fold' : '<span class="lg r3"></span>Spielen <span class="lg"></span>Fold'}</div></div>`;
      }
      case 'demo': return `<div class="demo" data-demo="${sec.demo}"></div>`;
      case 'potodds': return '<div class="demo" data-demo="potodds"></div>';
      case 'mdf': return '<div class="demo" data-demo="mdf"></div>';
      case 'equity': return `<div class="demo" data-demo="equity" data-m='${JSON.stringify({ m: sec.matchups, b: sec.board || [] })}' data-title="${esc(sec.title || '')}"></div>`;
    }
    return '';
  }

  function handRanks() {
    const ex = [
      ['Royal Flush', 'Ass bis Zehn in einer Farbe', ['As', 'Ks', 'Qs', 'Js', 'Ts']],
      ['Straight Flush', 'Fünf Karten in Folge, gleiche Farbe', ['9h', '8h', '7h', '6h', '5h']],
      ['Vierling (Four of a Kind)', 'Vier Karten gleichen Rangs', ['Qc', 'Qd', 'Qh', 'Qs', '7d']],
      ['Full House', 'Drilling + Paar', ['Jc', 'Jd', 'Jh', '4s', '4d']],
      ['Flush', 'Fünf Karten einer Farbe', ['Ad', 'Td', '8d', '5d', '2d']],
      ['Straße (Straight)', 'Fünf Karten in Folge', ['Tc', '9d', '8h', '7s', '6c']],
      ['Drilling (Three of a Kind)', 'Drei Karten gleichen Rangs', ['8s', '8h', '8c', 'Kd', '3c']],
      ['Zwei Paare (Two Pair)', 'Zwei verschiedene Paare', ['Ah', 'Ac', '9d', '9s', 'Qh']],
      ['Ein Paar (One Pair)', 'Zwei Karten gleichen Rangs', ['Kh', 'Ks', 'Jc', '7d', '2s']],
      ['Höchste Karte (High Card)', 'Keine Kombination', ['Ac', 'Jh', '8d', '5s', '3c']],
    ];
    const freq = ['0,0032 %', '0,028 %', '0,17 %', '2,6 %', '3,0 %', '4,6 %', '4,8 %', '23,5 %', '43,8 %', '17,4 %'];
    return `<div class="ranks">${ex.map((e, i) => `<div class="rank-row"><div class="rank-n">${i + 1}</div><div class="rank-info"><b>${e[0]}</b><span>${e[1]}</span><small>Häufigkeit (7 Karten): ${freq[i]}</small></div>${cards(e[2], { small: true })}</div>`).join('')}</div>`;
  }

  // Interaktive Demos nach dem Rendern aktivieren
  function activateDemos(el) {
    el.querySelectorAll('.demo').forEach((d) => {
      const k = d.dataset.demo;
      if (k === 'flow') demoFlow(d);
      else if (k === 'positions') demoPositions(d);
      else if (k === 'potodds') demoPotOdds(d);
      else if (k === 'mdf') demoMDF(d);
      else if (k === 'equity') demoEquity(d);
    });
    hydrate(el);
  }

  function feltTable({ seats, board = [], pot = 0, text = '' }) {
    const pos = [[50, 88], [12, 70], [12, 26], [50, 9], [88, 26], [88, 70]];
    return `<div class="felt-wrap"><div class="felt">
      <div class="felt-center"><div class="felt-pot">${pot ? 'Pot: ' + pot.toLocaleString('de-DE') + ' BB' : ''}</div>${cards(board, { small: true })}</div>
      ${seats.map((s, i) => `<div class="fseat${s.active ? ' active' : ''}${s.folded ? ' folded' : ''}" style="left:${pos[i][0]}%;top:${pos[i][1]}%"><div class="fs-name">${s.label}</div>${s.cards ? cards(s.cards, { small: true }) : ''}${s.chip ? `<div class="chip-tag">${s.chip}</div>` : ''}${s.btn ? '<span class="dbtn">D</span>' : ''}</div>`).join('')}
    </div></div><div class="demo-text">${text}</div>`;
  }

  function demoFlow(d) {
    const hero = ['Ah', 'Kh'];
    const board = ['Kc', '9h', '4h', '2s', 'Th'];
    const base = () => [
      { label: 'BTN (Du)', cards: hero, btn: true }, { label: 'SB' }, { label: 'BB' }, { label: 'UTG' }, { label: 'HJ' }, { label: 'CO' },
    ];
    const steps = [
      { title: '1. Blinds', text: 'Bevor Karten verteilt werden, setzen <b>Small Blind (0,5 BB)</b> und <b>Big Blind (1 BB)</b> ihre Pflichteinsätze.', mod: (s) => { s[1].chip = '0,5'; s[2].chip = '1'; s[0].cards = null; }, pot: 1.5, b: 0 },
      { title: '2. Karten austeilen', text: 'Jeder Spieler erhält <b>zwei verdeckte Karten</b>. Du sitzt am Button und hast A♥ K♥.', mod: (s) => { s[1].chip = '0,5'; s[2].chip = '1'; s.forEach((x, i) => { if (i) x.cards = [null, null]; }); }, pot: 1.5, b: 0 },
      { title: '3. Preflop-Setzrunde', text: '<b>UTG</b> beginnt (links vom BB). UTG, HJ und CO folden. Du erhöhst vom Button auf 2,5 BB. SB foldet, BB callt.', mod: (s) => { s[3].folded = s[4].folded = s[5].folded = s[1].folded = true; s[0].chip = '2,5'; s[2].chip = '2,5'; s[2].cards = [null, null]; s[0].active = true; }, pot: 5.5, b: 0 },
      { title: '4. Flop', text: 'Drei Gemeinschaftskarten: K♣ 9♥ 4♥. Du hast <b>Top Pair mit Ass-Kicker</b> plus Flush Draw. Ab jetzt handelt der BB <b>zuerst</b>. BB checkt, du setzt 3 BB, BB callt.', mod: (s) => { s[3].folded = s[4].folded = s[5].folded = s[1].folded = true; s[2].cards = [null, null]; s[0].active = true; }, pot: 11.5, b: 3 },
      { title: '5. Turn', text: 'Vierte Karte: 2♠. Keine Änderung. BB checkt, du setzt 7 BB, BB callt.', mod: (s) => { s[3].folded = s[4].folded = s[5].folded = s[1].folded = true; s[2].cards = [null, null]; }, pot: 25.5, b: 4 },
      { title: '6. River', text: 'Fünfte Karte: T♥ – du triffst den <b>Ass-hohen Flush</b> (die Nuts)! BB setzt 15 BB, du erhöhst auf 45 BB, BB callt.', mod: (s) => { s[3].folded = s[4].folded = s[5].folded = s[1].folded = true; s[2].cards = [null, null]; s[0].active = true; }, pot: 115.5, b: 5 },
      { title: '7. Showdown', text: 'Die Karten werden aufgedeckt. BB zeigt K♠ 9♠ (Zwei Paare). Dein Flush gewinnt den Pot von <b>115,5 BB</b>.', mod: (s) => { s[3].folded = s[4].folded = s[5].folded = s[1].folded = true; s[2].cards = ['Ks', '9s']; s[0].active = true; }, pot: 115.5, b: 5 },
    ];
    let i = 0;
    const render = () => {
      const st = steps[i]; const s = base(); st.mod(s);
      d.innerHTML = `<div class="demo-h">Interaktiver Ablauf: ${st.title}</div>${feltTable({ seats: s, board: board.slice(0, st.b), pot: st.pot, text: st.text })}
        <div class="demo-nav"><button class="btn ghost" ${i === 0 ? 'disabled' : ''} data-a="-1">← Zurück</button><div class="dots">${steps.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div><button class="btn primary" ${i === steps.length - 1 ? 'disabled' : ''} data-a="1">Weiter →</button></div>`;
      d.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { i += +b.dataset.a; render(); }));
    };
    render();
  }

  function demoPositions(d) {
    const render = (sel) => {
      const info = sel ? R.POSITION_INFO[sel] : null;
      const pct = sel && R.RFI[sel] ? Math.round(R.rangePercent(R.set(R.RFI[sel])) * 100) : null;
      d.innerHTML = `<div class="demo-h">Positionen am 6-max-Tisch – klicke auf einen Platz</div>${miniTable({ highlight: sel ? [sel] : [], onClick: true })}
      <div class="demo-text">${info ? `<b>${sel} – ${info.name}</b><br>${info.desc}${pct ? `<br>Typische Opening Range: <b>ca. ${pct} %</b> der Hände.` : ''}` : 'Der Dealer Button (D) rotiert jede Hand. Preflop-Reihenfolge: UTG → HJ → CO → BTN → SB → BB. Postflop: SB → BB → UTG → HJ → CO → BTN.'}</div>`;
      d.querySelectorAll('.mseat').forEach((s) => s.addEventListener('click', () => render(s.dataset.pos)));
    };
    render(null);
  }

  function demoPotOdds(d) {
    d.innerHTML = `<div class="demo-h">Pot-Odds-Rechner</div>
      <label class="slider">Pot vor der Bet: <b class="v-pot">10</b> BB<input type="range" min="2" max="100" value="10" class="i-pot"></label>
      <label class="slider">Bet des Gegners: <b class="v-bet">5</b> BB<input type="range" min="1" max="150" value="5" class="i-bet"></label>
      <div class="po-out"></div>`;
    const upd = () => {
      const pot = +d.querySelector('.i-pot').value, bet = +d.querySelector('.i-bet').value;
      d.querySelector('.v-pot').textContent = pot; d.querySelector('.v-bet').textContent = bet;
      const need = bet / (pot + 2 * bet);
      d.querySelector('.po-out').innerHTML = `${potBar(pot, bet)}<div class="big-num">${(need * 100).toFixed(1)} %</div><div class="muted">benötigte Equity · Pot Odds ${((pot + bet) / bet).toFixed(2)} : 1 · Bet = ${Math.round(bet / pot * 100)} % Pot</div>`;
    };
    d.querySelectorAll('input').forEach((i) => i.addEventListener('input', upd));
    upd();
  }

  function demoMDF(d) {
    const sizes = [0.25, 0.33, 0.5, 0.75, 1, 1.5, 2];
    d.innerHTML = `<div class="demo-h">Bet-Größe → MDF und Bluff-Anteil</div><table class="tbl mdf"><tr><th>Bet</th><th>MDF (Verteidiger)</th><th>Bluff-Anteil (River)</th><th>Break-even Bluff</th></tr>
      ${sizes.map((s) => { const mdf = 1 / (1 + s), bl = s / (1 + 2 * s), al = s / (1 + s); return `<tr><td>${Math.round(s * 100)} %</td><td>${bar(mdf)}<span>${Math.round(mdf * 100)} %</span></td><td>${bar(bl, 'gold')}<span>${Math.round(bl * 100)} %</span></td><td>${Math.round(al * 100)} %</td></tr>`; }).join('')}</table>`;
  }

  function demoEquity(d) {
    const { m, b } = JSON.parse(d.dataset.m);
    d.innerHTML = `<div class="demo-h">${esc(d.dataset.title || 'Equity')}</div>${b.length ? `<div class="cv"><div class="cv-label">Board</div>${cards(b, { small: true })}</div>` : ''}<div class="eq-list">${m.map((x, i) => `<div class="eq-row" data-i="${i}">${cards(x[0], { small: true })}<div class="eq-bar"><div class="eq-a"></div><div class="eq-b"></div></div>${cards(x[1], { small: true })}<div class="eq-txt">Berechne…</div></div>`).join('')}</div><div class="muted small">Monte-Carlo-Simulation, live berechnet.</div>`;
    setTimeout(() => {
      m.forEach((x, i) => {
        const e = P.equity(x[0], [x[1]], b, 3000);
        const row = d.querySelector(`.eq-row[data-i="${i}"]`);
        const a = e.equity, bb = 1 - a;
        row.querySelector('.eq-a').style.width = a * 100 + '%';
        row.querySelector('.eq-b').style.width = bb * 100 + '%';
        row.querySelector('.eq-txt').innerHTML = `<b>${Math.round(a * 100)} %</b> : <b>${Math.round(bb * 100)} %</b>`;
      });
    }, 60);
  }

  root.UI = { esc, card, cards, toast, miniTable, potBar, rangeGrid, hydrate, ring, bar, quiz, reviewList, section, activateDemos, feltTable, stripHTML, normalize };
})(window);
