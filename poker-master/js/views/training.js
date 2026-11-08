/* Trainingszentrum: adaptives Smart-Training, Skill-Training, Einzelübungen, Fehler-Wiederholung. */
(function (root) {
  'use strict';
  const UI = root.UI, S = root.Store, E = root.Exercises, PR = root.Progress, P = root.Poker;
  const { MODULES } = root.Curriculum;
  const V = (root.Views = root.Views || {});

  // Generator → frühestes Modul
  const genModule = {};
  MODULES.forEach((m) => m.gens.forEach((g) => { if (!genModule[g]) genModule[g] = m; }));
  const genUnlocked = (g) => !genModule[g] || PR.moduleUnlocked(genModule[g]);

  function unlockedQuiz(skill) {
    return root.Curriculum.allQuizQuestions(skill).filter((qq) => PR.moduleUnlocked(MODULES.find((m) => m.id === qq.module)));
  }

  function shuffledQuiz(qq) { const n = UI.normalize(qq); n.options = P.shuffle(n.options); return n; }

  /** Adaptive Auswahl: Schwächen werden häufiger trainiert. */
  function smartSource() {
    const gens = Object.keys(E.GENERATORS).filter(genUnlocked);
    const weights = gens.map((g) => {
      const sc = S.skillScore(E.GENERATORS[g].skill);
      return sc == null ? 0.7 : Math.max(0.08, 1 - sc) + 0.05;
    });
    return () => {
      // 20 %: Theoriefrage aus freigeschalteten Lektionen
      if (Math.random() < 0.2) {
        const pool = unlockedQuiz();
        const wq = pool.map((qq) => { const sc = S.skillScore(qq.s); return sc == null ? 0.6 : 1.05 - sc; });
        return shuffledQuiz(weightedPick(pool, wq));
      }
      return E.generate(weightedPick(gens, weights));
    };
  }

  function weightedPick(items, w) {
    const tot = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }

  function skillSource(skill) {
    const gens = Object.keys(E.GENERATORS).filter((g) => E.GENERATORS[g].skill === skill);
    const pool = root.Curriculum.allQuizQuestions(skill);
    return () => {
      if (!gens.length || (pool.length && Math.random() < 0.3)) return shuffledQuiz(pool[Math.floor(Math.random() * pool.length)]);
      return E.generate(gens[Math.floor(Math.random() * gens.length)]);
    };
  }

  V.training = (el, params) => {
    if (params[0] === 'gen' && E.GENERATORS[params[1]]) return session(el, E.GENERATORS[params[1]].name, () => E.generate(params[1]), 10);
    if (params[0] === 'smart') return session(el, 'Smart-Training', smartSource(), 12);
    if (params[0] === 'skill' && S.SKILLS[params[1]]) return session(el, 'Skill: ' + S.SKILLS[params[1]], skillSource(params[1]), 10);
    if (params[0] === 'mistakes') return mistakes(el);
    if (params[0] === 'redo') return redoMistakes(el);
    hub(el);
  };

  function hub(el) {
    const weak = S.weaknesses(3);
    const skills = S.skillList();
    const groups = {};
    Object.entries(E.GENERATORS).forEach(([id, g]) => { (groups[g.skill] = groups[g.skill] || []).push([id, g]); });
    el.innerHTML = `
      <header class="page-h"><div><h1>Training</h1><p class="muted">Unbegrenzte, zufällig generierte Aufgaben. Das Smart-Training passt sich deinen Schwächen an.</p></div></header>
      <div class="grid2">
        <a class="hero-card" href="#/training/smart"><div class="hc-i">🧠</div><div><h3>Smart-Training</h3><p>12 adaptive Aufgaben – Schwächen werden häufiger abgefragt.${weak.length ? ` Aktueller Fokus: <b>${weak.map((w) => w.name).join(', ')}</b>.` : ''}</p></div><span class="btn primary">Start</span></a>
        <a class="hero-card alt" href="#/training/mistakes"><div class="hc-i">🔁</div><div><h3>Fehler-Wiederholung</h3><p>${S.db.mistakes.length} gespeicherte Fehler mit Erklärungen. Wiederhole ähnliche Aufgaben, bis sie sitzen.</p></div><span class="btn ghost">Öffnen</span></a>
      </div>
      <h2 class="sec-h">Fähigkeiten</h2>
      <div class="skill-grid">${skills.map((s) => {
        const gens = groups[s.id] || [];
        const lockedAll = gens.length && gens.every(([id]) => !genUnlocked(id));
        return `<div class="skill-card ${lockedAll ? 'locked' : ''}">
          <div class="sk-h"><b>${s.name}</b><span class="sk-score ${s.score == null ? '' : s.score >= 0.8 ? 'hi' : s.score >= 0.6 ? 'mid' : 'lo'}">${s.score == null ? '–' : Math.round(s.score * 100) + ' %'}</span></div>
          ${UI.bar(s.score || 0, s.score != null && s.score < 0.6 ? 'red' : '')}
          <div class="muted small">${s.attempts} Antworten${lockedAll ? ' · 🔒 Modul noch gesperrt' : ''}</div>
          <div class="chip-row">${gens.map(([id, g]) => `<a class="chip ${genUnlocked(id) ? '' : 'dim'}" href="#/training/gen/${id}">${g.name}</a>`).join('')}<a class="chip outline" href="#/training/skill/${s.id}">Mix</a></div></div>`;
      }).join('')}</div>`;
  }

  function session(el, title, source, count) {
    el.innerHTML = `<a class="back" href="#/training">← Training</a><div class="panel" id="sess"></div>`;
    const box = el.querySelector('#sess');
    const start = Date.now();
    UI.quiz(box, {
      source, count, title, mode: 'practice', xpPerCorrect: 5,
      onFinish: (res) => {
        const sec = Math.round((Date.now() - start) / 1000);
        const bySkill = {};
        res.answers.forEach((a) => { const k = a.q.skill; bySkill[k] = bySkill[k] || { n: 0, ok: 0 }; bySkill[k].n++; if (a.ok) bySkill[k].ok++; });
        box.innerHTML = `<div class="result ${res.frac >= 0.8 ? 'ok' : res.frac >= 0.5 ? '' : 'no'}">
          <div class="res-score">${res.correct} / ${res.total}</div>
          <h3>${res.frac >= 0.9 ? 'Hervorragend!' : res.frac >= 0.7 ? 'Gute Arbeit!' : 'Weiter üben – du wirst besser!'}</h3>
          <p class="muted">Dauer ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} Min · +${res.correct * 5} XP</p>
          <div class="skill-sum">${Object.entries(bySkill).map(([k, v]) => `<div class="wk"><span>${S.SKILLS[k]}</span><span>${v.ok}/${v.n}</span>${UI.bar(v.ok / v.n, v.ok / v.n < 0.6 ? 'red' : '')}</div>`).join('')}</div>
          ${UI.reviewList(res.answers.filter((a) => !a.ok))}
          <div class="btn-row"><button class="btn primary" id="again">Nochmal</button><a class="btn ghost" href="#/training">Trainingsübersicht</a></div></div>`;
        box.querySelector('#again').addEventListener('click', () => session(el, title, source, count));
        UI.hydrate(box);
      },
    });
  }

  function mistakes(el) {
    const ms = S.db.mistakes;
    const bySkill = {};
    ms.forEach((m) => (bySkill[m.skill] = (bySkill[m.skill] || 0) + 1));
    el.innerHTML = `<a class="back" href="#/training">← Training</a>
      <header class="page-h"><div><h1>Fehler-Wiederholung</h1><p class="muted">Deine letzten ${ms.length} Fehler – aus Übungen, Tests und dem Simulator.</p></div>
      ${ms.length ? '<button class="btn primary" id="redo">Ähnliche Aufgaben üben</button>' : ''}</header>
      ${ms.length ? `<div class="chip-row">${Object.entries(bySkill).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<a class="chip" href="#/training/skill/${k}">${S.SKILLS[k]} · ${n}</a>`).join('')}</div>` : '<div class="empty">Noch keine Fehler gespeichert. 👍</div>'}
      <div class="review">${ms.slice(0, 60).map((m) => `<details class="rv no"><summary><span class="rv-i">✗</span> <span class="tag">${S.SKILLS[m.skill] || m.skill}</span> ${UI.esc(m.q || '')}</summary><div class="rv-b">${m.visual || ''}<p>Deine Antwort: <b>${UI.esc(m.answer || '')}</b>${m.correct ? ` · Richtig: <b>${UI.esc(m.correct)}</b>` : ''}</p><div class="fb-e">${m.explain || ''}</div><div class="muted small">${new Date(m.ts).toLocaleString('de-DE')}</div></div></details>`).join('')}</div>`;
    const b = el.querySelector('#redo'); if (b) b.addEventListener('click', () => redoMistakes(el));
    UI.hydrate(el);
  }

  function redoMistakes(el) {
    const ms = S.db.mistakes.slice(0, 40);
    if (!ms.length) return mistakes(el);
    const quizById = {};
    root.Curriculum.allQuizQuestions().forEach((qq) => (quizById[qq.id] = qq));
    const src = () => {
      const m = ms[Math.floor(Math.random() * ms.length)];
      if (m.gen && E.GENERATORS[m.gen]) return E.generate(m.gen);
      if (m.qid && quizById[m.qid]) return shuffledQuiz(quizById[m.qid]);
      return skillSource(m.skill)();
    };
    session(el, 'Fehler-Wiederholung', src, 10);
  }
})(window);
