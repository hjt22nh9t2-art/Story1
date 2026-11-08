/* Poker-Akademie: Modulübersicht, Lektionen, Lernkontrollen und Abschlusstests. */
(function (root) {
  'use strict';
  const { MODULES, LEVELS, lessonIndex } = root.Curriculum;
  const PR = root.Progress, UI = root.UI, S = root.Store;
  const V = (root.Views = root.Views || {});

  V.learn = (el, params) => {
    if (params[1]) return lessonView(el, params[0], params[1]);
    if (params[0]) return moduleView(el, params[0]);
    overview(el);
  };

  function overview(el) {
    const lvl = PR.pokerLevel();
    el.innerHTML = `
      <header class="page-h"><div><h1>Poker-Akademie</h1><p class="muted">Vom Anfänger zum Poker-Profi – Schritt für Schritt. Jedes Modul endet mit einem Abschlusstest (≥ 80 %), der das nächste Modul freischaltet.</p></div></header>
      <div class="level-path">${LEVELS.map((L) => `<div class="lp-step ${PR.levelReached(L) ? 'done' : ''} ${lvl.current.id === L.id ? 'cur' : ''}"><div class="lp-dot">${L.id}</div><div class="lp-name">${L.name}</div></div>`).join('')}</div>
      <div class="module-grid">${MODULES.map(moduleCard).join('')}</div>`;
  }

  function moduleCard(m) {
    const un = PR.moduleUnlocked(m), p = PR.moduleProgress(m);
    return `<a class="mcard ${un ? '' : 'locked'} ${p.exam ? 'passed' : ''}" href="${un ? '#/learn/' + m.id : 'javascript:void 0'}">
      <div class="mc-top"><span class="mc-icon">${m.icon}</span><span class="mc-num">Modul ${m.num}</span>${p.exam ? '<span class="badge gold">Bestanden</span>' : un ? '' : '<span class="badge">🔒 Gesperrt</span>'}</div>
      <h3>${m.title}</h3><p>${m.desc}</p>
      ${UI.bar(p.frac)}<div class="mc-foot"><span>${p.done}/${p.total} Lektionen</span><span>Level: ${LEVELS[m.level - 1].name}</span></div></a>`;
  }

  function moduleView(el, mid) {
    const m = MODULES.find((x) => x.id === mid);
    if (!m) return overview(el);
    if (!PR.moduleUnlocked(m)) { el.innerHTML = `<div class="empty">🔒 Dieses Modul ist noch gesperrt. Bestehe zuerst den Abschlusstest von Modul ${m.num - 1}.<br><a class="btn primary" href="#/learn">Zur Übersicht</a></div>`; return; }
    const exam = S.db.exams[m.id];
    el.innerHTML = `
      <a class="back" href="#/learn">← Akademie</a>
      <header class="page-h"><div><div class="eyebrow">Modul ${m.num} ${m.icon}</div><h1>${m.title}</h1><p class="muted">${m.desc}</p></div></header>
      <div class="lesson-list">${m.lessons.map((l, i) => {
        const done = PR.lessonDone(l.id), un = PR.lessonUnlocked(l.id), rec = S.db.lessons[l.id];
        return `<a class="lrow ${done ? 'done' : ''} ${un ? '' : 'locked'}" href="${un ? `#/learn/${m.id}/${l.id}` : 'javascript:void 0'}">
          <div class="lr-n">${done ? '✓' : un ? i + 1 : '🔒'}</div><div class="lr-t"><b>${l.title}</b><span>${l.min} Min. · ${l.quiz.length} Kontrollfragen${rec && rec.best != null ? ` · Bestwert ${Math.round(rec.best * 100)} %` : ''}</span></div><div class="lr-go">›</div></a>`;
      }).join('')}
      <div class="lrow exam ${PR.examAvailable(m) ? '' : 'locked'}"><div class="lr-n">🏆</div><div class="lr-t"><b>Abschlusstest</b><span>12 Aufgaben · Bestehen ab 80 %${exam ? ` · Bestwert ${Math.round(exam.best * 100)} % · ${exam.attempts} Versuch(e)` : ''}</span></div>
        ${PR.examAvailable(m) ? `<a class="btn ${exam && exam.passed ? 'ghost' : 'gold'}" href="#/exam/${m.id}">${exam && exam.passed ? 'Wiederholen' : 'Test starten'}</a>` : '<span class="muted small">Erst alle Lektionen abschließen</span>'}</div>
      </div>
      <div class="panel"><h3>Praxis-Übungen zu diesem Modul</h3><p class="muted">Unbegrenzt viele zufällige Aufgaben – ideal zur Vorbereitung auf den Abschlusstest.</p>
        <div class="chip-row">${m.gens.map((g) => `<a class="chip" href="#/training/gen/${g}">${root.Exercises.GENERATORS[g].name}</a>`).join('')}</div></div>`;
  }

  function lessonView(el, mid, lid) {
    const info = lessonIndex[lid];
    if (!info || !PR.lessonUnlocked(lid)) { el.innerHTML = '<div class="empty">🔒 Diese Lektion ist noch gesperrt.<br><a class="btn primary" href="#/learn">Zur Akademie</a></div>'; return; }
    const { module: m, lesson: l, index } = info;
    const next = m.lessons[index + 1];
    el.innerHTML = `
      <a class="back" href="#/learn/${m.id}">← ${m.title}</a>
      <article class="lesson">
        <div class="eyebrow">Modul ${m.num} · Lektion ${index + 1} von ${m.lessons.length} · ${l.min} Min.</div>
        <h1>${l.title}</h1>
        ${l.sections.map(UI.section).join('')}
      </article>
      <div class="panel check" id="check">
        <h3>Lernkontrolle</h3>
        <p class="muted">Beantworte mindestens ${Math.ceil(l.quiz.length * 0.66)} von ${l.quiz.length} Fragen richtig, um die Lektion abzuschließen. ${PR.lessonDone(lid) ? '<b class="ok-t">✓ Bereits abgeschlossen.</b>' : ''}</p>
        <button class="btn primary" id="startCheck">Lernkontrolle starten</button>
        ${m.gens.length ? `<a class="btn ghost" href="#/training/gen/${m.gens[0]}">Zusätzlich üben</a>` : ''}
      </div>`;
    UI.activateDemos(el);
    el.querySelector('#startCheck').addEventListener('click', () => {
      const box = el.querySelector('#check');
      const qs = root.Poker.shuffle(l.quiz.map((qq, i) => ({ ...qq, id: `${l.id}q${i}` }))).map((qq) => {
        const n = UI.normalize(qq);
        n.options = root.Poker.shuffle(n.options);
        return n;
      });
      UI.quiz(box, {
        source: qs, title: 'Lernkontrolle', mode: 'practice',
        onFinish: (res) => {
          const need = Math.ceil(l.quiz.length * 0.66);
          const passed = res.correct >= need;
          const rec = S.db.lessons[lid] || (S.db.lessons[lid] = { done: false, best: 0, attempts: 0 });
          rec.attempts++; rec.best = Math.max(rec.best || 0, res.frac);
          let xpMsg = '';
          if (passed && !rec.done) {
            rec.done = true; rec.completedAt = Date.now(); S.day().lessons++;
            S.addXP(50, 'Lektion abgeschlossen'); xpMsg = '+50 XP';
          } else if (passed) S.addXP(5);
          S.save(); root.Achievements.check();
          box.innerHTML = `<div class="result ${passed ? 'ok' : 'no'}">
            <div class="res-score">${res.correct} / ${res.total}</div>
            <h3>${passed ? 'Lektion abgeschlossen! ' + xpMsg : 'Noch nicht bestanden'}</h3>
            <p>${passed ? 'Sehr gut – du hast die Inhalte verstanden.' : `Du brauchst mindestens ${need} richtige Antworten. Lies die markierten Erklärungen und versuche es erneut.`}</p>
            ${UI.reviewList(res.answers)}
            <div class="btn-row">${passed ? (next ? `<a class="btn primary" href="#/learn/${m.id}/${next.id}">Nächste Lektion →</a>` : PR.examAvailable(m) ? `<a class="btn gold" href="#/exam/${m.id}">Zum Abschlusstest 🏆</a>` : '') : '<button class="btn primary" id="retry">Erneut versuchen</button>'}<a class="btn ghost" href="#/learn/${m.id}">Modulübersicht</a></div></div>`;
          const r = box.querySelector('#retry'); if (r) r.addEventListener('click', () => lessonView(el, mid, lid));
          UI.hydrate(box);
        },
      });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  V.exam = (el, params) => {
    const m = MODULES.find((x) => x.id === params[0]);
    if (!m || !PR.examAvailable(m)) { el.innerHTML = '<div class="empty">🔒 Der Abschlusstest ist erst verfügbar, wenn alle Lektionen des Moduls abgeschlossen sind.<br><a class="btn primary" href="#/learn">Zur Akademie</a></div>'; return; }
    el.innerHTML = `<a class="back" href="#/learn/${m.id}">← ${m.title}</a>
      <header class="page-h"><div><div class="eyebrow">Abschlusstest</div><h1>Modul ${m.num}: ${m.title}</h1><p class="muted">12 Aufgaben aus Theorie und Praxis. Feedback gibt es am Ende. Bestanden ab 80 % (10/12).</p></div></header>
      <div class="panel" id="exam"><button class="btn gold" id="go">Test starten</button></div>`;
    el.querySelector('#go').addEventListener('click', () => runExam(el.querySelector('#exam'), m));
  };

  function runExam(box, m) {
    const P = root.Poker;
    const theory = P.shuffle(m.lessons.flatMap((l) => l.quiz.map((qq, i) => ({ ...qq, id: `${l.id}q${i}` })))).slice(0, 6).map((qq) => { const n = UI.normalize(qq); n.options = P.shuffle(n.options); return n; });
    const practice = [];
    for (let i = 0; practice.length < 12 - theory.length; i++) practice.push(root.Exercises.generate(m.gens[i % m.gens.length]));
    const qs = P.shuffle([...theory, ...practice]);
    UI.quiz(box, {
      source: qs, mode: 'exam', title: 'Abschlusstest',
      onFinish: (res) => {
        const rec = S.db.exams[m.id] || (S.db.exams[m.id] = { passed: false, best: 0, attempts: 0 });
        rec.attempts++; rec.best = Math.max(rec.best, res.frac);
        const passed = res.frac >= 0.8;
        const before = PR.pokerLevel().current.id;
        if (passed && !rec.passed) { rec.passed = true; rec.passedAt = Date.now(); S.addXP(200, 'Abschlusstest bestanden'); }
        else if (passed) S.addXP(20);
        S.save(); root.Achievements.check();
        const after = PR.pokerLevel().current;
        // Fehleranalyse nach Skill
        const bySkill = {};
        res.answers.forEach((a) => { const k = a.q.skill; bySkill[k] = bySkill[k] || { n: 0, w: 0 }; bySkill[k].n++; if (!a.ok) bySkill[k].w++; });
        const weak = Object.entries(bySkill).filter(([, v]) => v.w > 0).sort((a, b) => b[1].w - a[1].w);
        const nextM = MODULES[m.num];
        box.innerHTML = `<div class="result ${passed ? 'ok' : 'no'}">
          <div class="res-score">${Math.round(res.frac * 100)} %</div>
          <h3>${passed ? '🏆 Bestanden!' : 'Nicht bestanden'}</h3>
          ${after.id > before ? `<div class="levelup">Neues Poker-Level erreicht: <b>${after.name}</b></div>` : ''}
          <p>${res.correct} von ${res.total} richtig. ${passed ? (nextM ? `Modul ${nextM.num} „${nextM.title}“ ist jetzt freigeschaltet.` : 'Du hast alle Module abgeschlossen!') : 'Du brauchst 80 %. Trainiere gezielt deine Schwächen und versuche es erneut.'}</p>
          ${weak.length ? `<div class="weak-box"><h4>Fehleranalyse</h4>${weak.map(([k, v]) => `<div class="wk"><span>${S.SKILLS[k]}</span><span>${v.w} von ${v.n} falsch</span><a class="chip" href="#/training/skill/${k}">Gezielt üben</a></div>`).join('')}</div>` : ''}
          ${UI.reviewList(res.answers)}
          <div class="btn-row">${passed && nextM ? `<a class="btn primary" href="#/learn/${nextM.id}">Weiter zu Modul ${nextM.num} →</a>` : ''}${!passed ? '<button class="btn primary" id="retry">Neuer Versuch</button>' : ''}<a class="btn ghost" href="#/learn">Akademie</a></div></div>`;
        const r = box.querySelector('#retry'); if (r) r.addEventListener('click', () => runExam(box, m));
        UI.hydrate(box);
      },
    });
  }
})(window);
