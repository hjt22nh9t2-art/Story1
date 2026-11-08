/* GTO-Trainer: Range-Builder, Preflop-Drills, Mathe-Drills, Indifferenz-Labor. */
(function (root) {
  'use strict';
  const UI = root.UI, S = root.Store, P = root.Poker, R = root.Ranges, E = root.Exercises;
  const V = (root.Views = root.Views || {});

  const SCEN = {
    rfi_UTG: { name: 'Open-Raise UTG', ref: () => R.set(R.RFI.UTG) },
    rfi_HJ: { name: 'Open-Raise Hijack', ref: () => R.set(R.RFI.HJ) },
    rfi_CO: { name: 'Open-Raise Cutoff', ref: () => R.set(R.RFI.CO) },
    rfi_BTN: { name: 'Open-Raise Button', ref: () => R.set(R.RFI.BTN) },
    rfi_SB: { name: 'Open-Raise Small Blind', ref: () => R.set(R.RFI.SB) },
    tb_BTN_vs_CO: { name: '3-Bet-Range: BTN vs. CO-Open', ref: () => R.set(R.VS_OPEN.BTN_vs_CO.threebet) },
    tb_BB_vs_BTN: { name: '3-Bet-Range: BB vs. BTN-Open', ref: () => R.set(R.VS_OPEN.BB_vs_BTN.threebet) },
    def_BB_vs_BTN: { name: 'BB-Verteidigung (Call + 3-Bet) vs. BTN', ref: () => new Set([...R.set(R.VS_OPEN.BB_vs_BTN.threebet), ...R.set(R.VS_OPEN.BB_vs_BTN.call)]) },
  };

  let tab = 'builder';
  V.gto = (el, params) => {
    if (params[0]) tab = params[0];
    el.innerHTML = `
      <header class="page-h"><div><h1>GTO-Trainer</h1><p class="muted">Trainiere spieltheoretisch fundierte Strategien. Die Referenz-Ranges sind vereinfachte, solver-nahe Charts für 6-max mit 100 BB.</p></div></header>
      <div class="tabs">${[['builder', '🎯 Range-Builder'], ['drill', '⚡ Preflop-Drill'], ['math', '∑ MDF & Bluff-Ratios'], ['lab', '⚖️ Indifferenz-Labor']].map(([k, l]) => `<a class="tab ${tab === k ? 'on' : ''}" href="#/gto/${k}">${l}</a>`).join('')}</div>
      <div id="gtoBody"></div>`;
    const b = el.querySelector('#gtoBody');
    if (tab === 'builder') builder(b);
    else if (tab === 'drill') drill(b, ['rfi', 'vsOpen'], 'Preflop-Drill');
    else if (tab === 'math') drill(b, ['mdf', 'bluffRatio', 'alpha'], 'GTO-Mathe');
    else lab(b);
  };

  function builder(b) {
    let key = 'rfi_BTN';
    let user = new Set();
    let checked = false;
    let painting = null;
    const stop = () => { if (painting) { painting = null; if (document.body.contains(b)) render(); } };
    document.addEventListener('pointerup', stop);
    const render = () => {
      const ref = SCEN[key].ref();
      const best = S.db.gto.rangeBest[key];
      let acc = 0, info = '';
      if (checked) {
        let inter = 0, uni = 0, miss = [], extra = [];
        for (const c of P.HAND_ORDER.list) {
          const n = P.comboCount(c), a = ref.has(c), u = user.has(c);
          if (a || u) uni += n;
          if (a && u) inter += n;
          if (a && !u) miss.push(c);
          if (u && !a) extra.push(c);
        }
        acc = uni ? inter / uni : 0;
        info = `<div class="result ${acc >= 0.9 ? 'ok' : acc >= 0.7 ? '' : 'no'}"><div class="res-score">${Math.round(acc * 100)} %</div><p>Übereinstimmung (nach Kombinationen gewichtet). Referenz: ${Math.round(R.rangePercent(ref) * 100)} % der Hände · Deine Range: ${Math.round(R.rangePercent(user) * 100)} %.</p>
          ${miss.length ? `<p><b class="neg">Fehlt (${miss.length}):</b> ${miss.slice(0, 30).join(', ')}${miss.length > 30 ? ' …' : ''}</p>` : ''}${extra.length ? `<p><b class="neg">Zu viel (${extra.length}):</b> ${extra.slice(0, 30).join(', ')}${extra.length > 30 ? ' …' : ''}</p>` : ''}</div>`;
      }
      b.innerHTML = `<div class="grid-side">
        <div class="panel"><div class="ph-row"><select id="scen">${Object.entries(SCEN).map(([k, s]) => `<option value="${k}" ${k === key ? 'selected' : ''}>${s.name}</option>`).join('')}</select><span class="muted small">${best != null ? 'Bestwert: ' + Math.round(best * 100) + ' %' : ''}</span></div>
          <p class="muted small">Klicke oder ziehe über die Felder, um Hände zu deiner Range hinzuzufügen. Oben rechts suited, unten links offsuit, Diagonale Paare.</p>
          <div id="grid">${checked ? UI.rangeGrid({ raise: ref, user, compare: true }) : UI.rangeGrid({ user })}</div>
          ${checked ? '<div class="rlegend"><span class="lg hit"></span>Richtig <span class="lg miss"></span>Fehlt <span class="lg extra"></span>Zu viel</div>' : `<div class="muted small">Ausgewählt: ${Math.round(R.rangePercent(user) * 100)} % der Hände (${[...user].reduce((a, c) => a + P.comboCount(c), 0)} Combos)</div>`}
        </div>
        <div class="panel"><h3>${SCEN[key].name}</h3>
          <div class="btn-col">${checked ? '<button class="btn primary" id="again">Neu versuchen</button><button class="btn ghost" id="show">Referenz anzeigen</button>' : '<button class="btn primary" id="check">Range prüfen</button><button class="btn ghost" id="clear">Leeren</button>'}</div>
          ${info}
          <div class="tip"><span class="tip-i">💡</span><div>Denke in Bausteinen: Welche Paare? Welche suited Asse? Welche suited Connectors? Welche Broadways offsuit? Je später die Position, desto mehr von jeder Kategorie.</div></div>
        </div></div>`;
      b.querySelector('#scen').addEventListener('change', (e) => { key = e.target.value; user = new Set(); checked = false; render(); });
      if (!checked) {
        const grid = b.querySelector('.rgrid');
        const paint = (cell) => {
          const c = cell.dataset.c;
          if (painting === 'add') user.add(c); else user.delete(c);
          cell.classList.toggle('r3', user.has(c));
        };
        grid.addEventListener('pointerdown', (e) => { const cell = e.target.closest('.rc'); if (!cell) return; e.preventDefault(); painting = user.has(cell.dataset.c) ? 'del' : 'add'; paint(cell); });
        grid.addEventListener('pointerover', (e) => { if (!painting) return; const cell = e.target.closest('.rc'); if (cell) paint(cell); });
        grid.addEventListener('touchmove', (e) => { if (!painting) return; const t = e.touches[0]; const cell = document.elementFromPoint(t.clientX, t.clientY); if (cell && cell.classList.contains('rc')) paint(cell); e.preventDefault(); }, { passive: false });
        grid.addEventListener('touchend', stop);
        b.querySelector('#check').addEventListener('click', () => {
          if (!user.size) return UI.toast('Wähle zuerst Hände aus.');
          checked = true;
          // Ergebnis speichern
          const ref = SCEN[key].ref();
          let inter = 0, uni = 0;
          for (const c of P.HAND_ORDER.list) { const n = P.comboCount(c); if (ref.has(c) || user.has(c)) uni += n; if (ref.has(c) && user.has(c)) inter += n; }
          const acc = inter / uni;
          S.db.gto.rangeBest[key] = Math.max(S.db.gto.rangeBest[key] || 0, acc);
          S.db.gto.drills++;
          S.recordAnswer('ranges', acc >= 0.8, acc >= 0.8 ? null : { q: `Range-Builder: ${SCEN[key].name}`, answer: Math.round(acc * 100) + ' % Übereinstimmung', correct: '≥ 80 %', explain: 'Vergleiche deine Range mit der Referenz im GTO-Trainer.' });
          S.addXP(Math.round(acc * 30), 'Range-Builder');
          root.Achievements.check();
          render();
        });
        b.querySelector('#clear').addEventListener('click', () => { user = new Set(); render(); });
      } else {
        b.querySelector('#again').addEventListener('click', () => { user = new Set(); checked = false; render(); });
        b.querySelector('#show').addEventListener('click', () => { b.querySelector('#grid').innerHTML = UI.rangeGrid({ raise: SCEN[key].ref() }); });
      }
    };
    render();
  }

  function drill(b, gens, title) {
    b.innerHTML = '<div class="panel" id="dr"></div>';
    const box = b.querySelector('#dr');
    const startRun = () => UI.quiz(box, {
      source: () => E.generate(gens[Math.floor(Math.random() * gens.length)]), count: 15, title, mode: 'practice', xpPerCorrect: 4,
      onFinish: (res) => {
        S.db.gto.drills++; S.save();
        box.innerHTML = `<div class="result ${res.frac >= 0.8 ? 'ok' : 'no'}"><div class="res-score">${res.correct} / ${res.total}</div><h3>${title} abgeschlossen</h3>${UI.reviewList(res.answers.filter((a) => !a.ok))}<div class="btn-row"><button class="btn primary" id="again">Nochmal</button></div></div>`;
        box.querySelector('#again').addEventListener('click', startRun);
        UI.hydrate(box);
      },
    });
    startRun();
  }

  function lab(b) {
    b.innerHTML = `<div class="grid2">
      <div class="panel"><h3>Indifferenz-Labor (River)</h3>
        <p class="muted small">Du setzt am River mit einer polarisierten Range (Nuts oder Bluff). Stelle Bet-Größe und deinen Bluff-Anteil ein und beobachte, wie sich der EV des Gegners mit einem Bluff-Catcher verändert.</p>
        <label class="slider">Bet-Größe: <b id="vb">75</b> % Pot<input type="range" id="ib" min="10" max="250" value="75"></label>
        <label class="slider">Dein Bluff-Anteil: <b id="vf">30</b> %<input type="range" id="if" min="0" max="80" value="30"></label>
        <div id="labOut"></div></div>
      <div class="panel"><h3>Was du hier lernst</h3>
        <ul class="ul"><li><b>Zu wenige Bluffs</b> → der Gegner foldet profitabel alle Bluff-Catcher. Deine Value-Bets werden selten bezahlt.</li><li><b>Zu viele Bluffs</b> → der Gegner callt profitabel immer.</li><li><b>Im Gleichgewicht</b> ist der Gegner indifferent: Call-EV = 0. Genau dann ist deine Strategie unausnutzbar.</li><li>Gegen echte Gegner, die zu viel callen, solltest du <b>weniger</b> bluffen; gegen Gegner, die zu viel folden, <b>mehr</b>.</li></ul></div></div>`;
    const upd = () => {
      const s = +b.querySelector('#ib').value / 100, f = +b.querySelector('#if').value / 100;
      b.querySelector('#vb').textContent = Math.round(s * 100); b.querySelector('#vf').textContent = Math.round(f * 100);
      const pot = 100, bet = pot * s;
      const evCall = f * (pot + bet) - (1 - f) * bet;
      const opt = s / (1 + 2 * s);
      const verdict = Math.abs(f - opt) < 0.025 ? ['ok-t', 'Nahe am Gleichgewicht – der Gegner ist (fast) indifferent.'] : f < opt ? ['neg', 'Zu wenige Bluffs: Der Gegner sollte mit Bluff-Catchern folden (Call-EV negativ).'] : ['neg', 'Zu viele Bluffs: Der Gegner sollte immer callen (Call-EV positiv).'];
      b.querySelector('#labOut').innerHTML = `<div class="kv"><span>Optimaler Bluff-Anteil</span><b class="gold-t">${(opt * 100).toFixed(1)} %</b></div>
        <div class="kv"><span>MDF des Gegners</span><b>${(100 / (1 + s)).toFixed(1)} %</b></div>
        <div class="kv"><span>EV Call des Gegners (Pot = 100)</span><b class="${evCall > 0.5 ? 'pos' : evCall < -0.5 ? 'neg' : ''}">${evCall >= 0 ? '+' : ''}${evCall.toFixed(1)}</b></div>
        ${UI.bar(f / 0.8, 'gold')}<div class="small muted" style="position:relative;height:14px"><span style="position:absolute;left:${(opt / 0.8) * 100}%;transform:translateX(-50%)">▲ GTO</span></div>
        <p class="${verdict[0]}">${verdict[1]}</p>`;
    };
    b.querySelectorAll('input').forEach((i) => i.addEventListener('input', upd));
    upd();
  }
})(window);
