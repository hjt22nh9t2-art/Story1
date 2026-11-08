/* Dashboard & Statistiken */
(function (root) {
  'use strict';
  const UI = root.UI, S = root.Store, PR = root.Progress;
  const { LEVELS } = root.Curriculum;
  const V = (root.Views = root.Views || {});

  const fmtTime = (sec) => { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60); return h ? `${h} h ${m} min` : `${m} min`; };

  V.dashboard = (el) => {
    const db = S.db;
    const lvl = PR.pokerLevel();
    const ov = PR.overall();
    const xl = S.xpLevel();
    const rec = PR.recommendation();
    const weak = S.weaknesses(3), strong = S.strengths(3);
    const goals = PR.dailyGoals();
    const t = db.totals, sim = db.sim;
    const wrong = t.exercises - t.correct + (sim.decisions - sim.good);
    const right = t.correct + sim.good;
    const next = lvl.next;
    const reqTxt = next ? next.requires.map((r) => { const m = root.Curriculum.MODULES.find((x) => x.id === r); return `${PR.examPassed(r) ? '✓' : '○'} Modul ${m.num}: ${m.title}`; }).concat(next.practice ? [`${PR.practiceStatus().decisions >= next.practice.decisions && PR.practiceStatus().accuracy >= next.practice.accuracy ? '✓' : '○'} Simulator: ${PR.practiceStatus().decisions}/${next.practice.decisions} Entscheidungen, ${Math.round(PR.practiceStatus().accuracy * 100)} % korrekt (≥ 70 %)`] : []) : [];

    let recHTML;
    if (rec.kind === 'lesson') recHTML = `<div class="eyebrow">Empfohlene nächste Lektion</div><h3>${rec.lesson.title}</h3><p class="muted">Modul ${rec.module.num}: ${rec.module.title} · ${rec.lesson.min} Min.</p><a class="btn primary" href="${rec.href}">Lektion starten →</a>`;
    else if (rec.kind === 'exam') recHTML = `<div class="eyebrow">Nächster Schritt</div><h3>Abschlusstest Modul ${rec.module.num}</h3><p class="muted">${rec.module.title} – bestehe mit ≥ 80 %, um weiterzukommen.</p><a class="btn gold" href="${rec.href}">Test starten 🏆</a>`;
    else recHTML = `<div class="eyebrow">Alle Module bestanden</div><h3>Weiter trainieren</h3><p class="muted">Halte dein Niveau mit Smart-Training und dem Simulator.</p><a class="btn primary" href="#/training/smart">Smart-Training</a>`;

    el.innerHTML = `
      <header class="page-h"><div><div class="eyebrow">Willkommen zurück, ${UI.esc(db.profile.name)}</div><h1>Dein Dashboard</h1></div>
        <a class="btn primary" href="#/training/smart">⚡ Schnelltraining</a></header>
      <div class="dash-top">
        <div class="panel level-card">
          ${UI.ring(ov.frac, 132, Math.round(ov.frac * 100) + ' %', 'Gesamt')}
          <div class="lc-info"><div class="eyebrow">Poker-Level ${lvl.current.id} / 7</div><h2 class="gold-t">${lvl.current.name}</h2>
            <p class="muted small">${lvl.current.desc}</p>
            ${next ? `<div class="lc-next"><div class="small"><b>Nächstes Level: ${next.name}</b></div>${reqTxt.map((r) => `<div class="small ${r.startsWith('✓') ? 'ok-t' : 'muted'}">${r}</div>`).join('')}</div>` : '<div class="ok-t">Höchstes Level erreicht! 👑</div>'}
          </div>
        </div>
        <div class="panel rec-card">${recHTML}</div>
      </div>
      <div class="stat-row">
        ${tile('XP-Stufe ' + xl.lvl, db.profile.xp.toLocaleString('de-DE') + ' XP', UI.bar(xl.into / xl.need, 'gold') + `<span class="small muted">${xl.need - xl.into} XP bis Stufe ${xl.lvl + 1}</span>`)}
        ${tile('Lektionen', `${ov.lessonsDone} / ${ov.lessonsTotal}`, `<span class="small muted">${ov.examsPassed} / 10 Abschlusstests bestanden</span>`)}
        ${tile('Tagesserie', `${S.streak()} 🔥`, `<span class="small muted">Tage in Folge aktiv</span>`)}
        ${tile('Trainingszeit', fmtTime(S.totalSeconds()), `<span class="small muted">heute ${fmtTime(S.day().sec)}</span>`)}
        ${tile('Entscheidungen', `<span class="pos">${right}</span> / <span class="neg">${wrong}</span>`, `<span class="small muted">richtig / falsch · ${right + wrong ? Math.round(right / (right + wrong) * 100) : 0} % Quote</span>`)}
      </div>
      <div class="grid3">
        <div class="panel"><h3>Tagesziele</h3>${goals.map((g) => `<a class="goal ${g.cur >= g.max ? 'done' : ''}" href="${g.href}"><div class="g-h"><span>${g.cur >= g.max ? '✓ ' : ''}${g.label}</span><span class="small">${Math.min(g.cur, g.max)}/${g.max}</span></div>${UI.bar(g.cur / g.max)}</a>`).join('')}</div>
        <div class="panel"><h3>Größte Schwächen</h3>${weak.length ? weak.map((w) => skillRow(w, true)).join('') : '<p class="muted small">Noch nicht genug Daten. Löse einige Übungen – dann erkennt das System deine Schwächen automatisch.</p>'}
          ${weak.length ? '<a class="btn ghost sm" href="#/training/smart">Schwächen gezielt trainieren</a>' : ''}</div>
        <div class="panel"><h3>Stärkste Fähigkeiten</h3>${strong.length ? strong.map((w) => skillRow(w, false)).join('') : '<p class="muted small">Deine Stärken erscheinen hier, sobald du genug Aufgaben gelöst hast.</p>'}</div>
      </div>
      <div class="panel"><div class="ph-row"><h3>Erfolge</h3><span class="muted small">${Object.keys(db.achievements).length} / ${PR.ACHIEVEMENTS.length}</span></div>
        <div class="ach-grid">${PR.ACHIEVEMENTS.map((a) => `<div class="ach ${db.achievements[a.id] ? 'on' : ''}" title="${UI.esc(a.desc)}"><div class="ach-i">${a.icon}</div><div><b>${a.name}</b><span>${a.desc}</span></div></div>`).join('')}</div></div>`;
  };

  const tile = (label, val, sub) => `<div class="tile"><div class="t-l">${label}</div><div class="t-v">${val}</div>${sub}</div>`;
  const skillRow = (s, weak) => `<a class="srow" href="#/training/skill/${s.id}"><span>${s.name}</span><span class="${weak ? 'neg' : 'pos'}">${Math.round(s.score * 100)} %</span>${UI.bar(s.score, weak ? 'red' : '')}</a>`;

  // ---------------------------------------------------------------- Statistiken
  V.stats = (el) => {
    const db = S.db, sim = db.sim, t = db.totals;
    const skills = S.skillList();
    const days = [];
    for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = d.toISOString().slice(0, 10); days.push({ k, label: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }), v: db.days[k] || { xp: 0, ex: 0, ok: 0, sec: 0, hands: 0 } }); }
    el.innerHTML = `
      <header class="page-h"><div><h1>Statistiken</h1><p class="muted">Deine Entwicklung in Zahlen.</p></div></header>
      <div class="stat-row">
        ${tile('Aufgaben gelöst', t.exercises.toLocaleString('de-DE'), `<span class="small muted">${t.exercises ? Math.round(t.correct / t.exercises * 100) : 0} % richtig</span>`)}
        ${tile('Beste Serie', t.bestCorrectStreak, '<span class="small muted">richtige Antworten in Folge</span>')}
        ${tile('Simulator-Hände', sim.hands.toLocaleString('de-DE'), `<span class="small muted">${sim.hands ? Math.round(sim.won / sim.hands * 100) : 0} % gewonnen</span>`)}
        ${tile('Ergebnis Simulator', `<span class="${sim.netBB >= 0 ? 'pos' : 'neg'}">${sim.netBB >= 0 ? '+' : ''}${sim.netBB.toFixed(1)} BB</span>`, `<span class="small muted">${sim.hands ? (sim.netBB / sim.hands * 100).toFixed(1) : '0'} BB/100</span>`)}
        ${tile('Coach-Quote', sim.decisions ? Math.round(sim.good / sim.decisions * 100) + ' %' : '–', `<span class="small muted">${sim.decisions} analysierte Entscheidungen</span>`)}
      </div>
      <div class="grid2">
        <div class="panel"><h3>Genauigkeit nach Fähigkeit</h3>${skillChart(skills)}</div>
        <div class="panel"><h3>Simulator-Ergebnis (BB, kumuliert)</h3>${lineChart(sim.history)}
          <div class="kv-grid"><div class="kv"><span>VPIP</span><b>${sim.hands ? Math.round(sim.vpip / sim.hands * 100) : 0} %</b></div><div class="kv"><span>PFR</span><b>${sim.hands ? Math.round(sim.pfr / sim.hands * 100) : 0} %</b></div><div class="kv"><span>Showdowns gewonnen</span><b>${sim.showdowns ? Math.round(sim.wonShowdown / sim.showdowns * 100) : 0} %</b></div><div class="kv"><span>Erfolgreiche Bluffs</span><b>${sim.bluffWins}</b></div></div>
          <p class="muted small">Richtwerte für 6-max: VPIP 22–28 %, PFR 18–23 %. Ein großer Abstand zwischen VPIP und PFR deutet auf zu passives Spiel hin.</p></div>
      </div>
      <div class="panel"><h3>Aktivität – letzte 14 Tage</h3>${barChart(days)}</div>
      <div class="panel"><h3>Modul-Ergebnisse</h3><table class="tbl"><tr><th>Modul</th><th>Lektionen</th><th>Abschlusstest</th><th>Versuche</th></tr>
        ${root.Curriculum.MODULES.map((m) => { const p = PR.moduleProgress(m); const e = db.exams[m.id]; return `<tr><td>${m.num}. ${m.title}</td><td>${p.done}/${p.total}</td><td>${e ? `${Math.round(e.best * 100)} % ${e.passed ? '<span class="ok-t">✓</span>' : ''}` : '–'}</td><td>${e ? e.attempts : 0}</td></tr>`; }).join('')}</table></div>`;
    bindTips(el);
  };

  function skillChart(skills) {
    return `<div class="hbars">${skills.map((s) => `<div class="hb" data-tip="${s.name}: ${s.score == null ? 'keine Daten' : Math.round(s.score * 100) + ' % (' + s.attempts + ' Antworten)'}"><span class="hb-l">${s.name}</span><div class="hb-t"><div class="hb-f ${s.score != null && s.score < 0.6 ? 'lo' : ''}" style="width:${(s.score || 0) * 100}%"></div></div><span class="hb-v">${s.score == null ? '–' : Math.round(s.score * 100) + ' %'}</span></div>`).join('')}</div>`;
  }

  function lineChart(hist) {
    if (hist.length < 2) return '<div class="empty small">Spiele einige Hände im Simulator, um deinen Verlauf zu sehen.</div>';
    const W = 600, H = 200, pad = 30;
    const data = [0, ...hist];
    const min = Math.min(0, ...data), max = Math.max(0, ...data);
    const rng = max - min || 1;
    const x = (i) => pad + (i / (data.length - 1)) * (W - pad - 10);
    const y = (v) => 10 + (1 - (v - min) / rng) * (H - 30);
    const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Kumuliertes Ergebnis">
      <line x1="${pad}" x2="${W - 10}" y1="${y(0)}" y2="${y(0)}" class="ch-zero"/>
      <text x="4" y="${y(max) + 4}" class="ch-t">${max.toFixed(0)}</text><text x="4" y="${y(min) + 4}" class="ch-t">${min.toFixed(0)}</text>
      <polyline points="${pts}" class="ch-line"/>
      <circle cx="${x(data.length - 1)}" cy="${y(data[data.length - 1])}" r="4" class="ch-dot"/>
      ${data.map((v, i) => `<rect x="${x(i) - (W / data.length) / 2}" y="0" width="${W / data.length}" height="${H}" fill="transparent" data-tip="Hand ${i}: ${v >= 0 ? '+' : ''}${v.toFixed(1)} BB"/>`).join('')}
    </svg>`;
  }

  function barChart(days) {
    const max = Math.max(1, ...days.map((d) => d.v.ex + d.v.hands / 5));
    return `<div class="vbars">${days.map((d) => { const val = d.v.ex + d.v.hands / 5; return `<div class="vb" data-tip="${d.label}: ${d.v.ex} Aufgaben, ${d.v.hands} Hände, ${Math.round(d.v.sec / 60)} min, ${d.v.xp} XP"><div class="vb-t"><div class="vb-f" style="height:${(val / max) * 100}%"></div></div><span>${d.label.slice(0, 5)}</span></div>`; }).join('')}</div>`;
  }

  function bindTips(el) {
    let tip = document.getElementById('ctip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'ctip'; document.body.appendChild(tip); }
    el.querySelectorAll('[data-tip]').forEach((n) => {
      n.addEventListener('mousemove', (e) => { tip.textContent = n.dataset.tip; tip.style.display = 'block'; tip.style.left = e.clientX + 12 + 'px'; tip.style.top = e.clientY - 30 + 'px'; });
      n.addEventListener('mouseleave', () => (tip.style.display = 'none'));
    });
  }
})(window);
