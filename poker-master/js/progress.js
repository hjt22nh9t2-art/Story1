/* Fortschritt, Freischaltungen, Poker-Level und Erfolge. */
(function (root) {
  'use strict';
  const { LEVELS, MODULES, lessonIndex } = root.Curriculum;
  const S = () => root.Store.db;

  const lessonDone = (id) => !!(S().lessons[id] && S().lessons[id].done);
  const examPassed = (mid) => !!(S().exams[mid] && S().exams[mid].passed);

  function moduleUnlocked(m) {
    if (m.num === 1) return true;
    const prev = MODULES[m.num - 2];
    return examPassed(prev.id);
  }
  function lessonUnlocked(id) {
    const { module, index } = lessonIndex[id];
    if (!moduleUnlocked(module)) return false;
    return index === 0 || lessonDone(module.lessons[index - 1].id);
  }
  function moduleProgress(m) {
    const done = m.lessons.filter((l) => lessonDone(l.id)).length;
    return { done, total: m.lessons.length, exam: examPassed(m.id), frac: (done + (examPassed(m.id) ? 1 : 0)) / (m.lessons.length + 1) };
  }
  const examAvailable = (m) => moduleUnlocked(m) && m.lessons.every((l) => lessonDone(l.id));

  function practiceStatus() {
    const s = S().sim;
    return { decisions: s.decisions, accuracy: s.decisions ? s.good / s.decisions : 0 };
  }

  function levelReached(L) {
    if (!L.requires.every(examPassed)) return false;
    if (L.practice) {
      const p = practiceStatus();
      if (p.decisions < L.practice.decisions || p.accuracy < L.practice.accuracy) return false;
    }
    return true;
  }
  function pokerLevel() {
    let cur = LEVELS[0];
    for (const L of LEVELS) { if (levelReached(L)) cur = L; else break; }
    const next = LEVELS[cur.id] || null;
    return { current: cur, next };
  }

  function overall() {
    let total = 0, done = 0;
    MODULES.forEach((m) => { total += m.lessons.length + 2; done += m.lessons.filter((l) => lessonDone(l.id)).length + (examPassed(m.id) ? 2 : 0); });
    return { frac: done / total, lessonsDone: Object.values(S().lessons).filter((l) => l.done).length, lessonsTotal: MODULES.reduce((a, m) => a + m.lessons.length, 0), examsPassed: MODULES.filter((m) => examPassed(m.id)).length };
  }

  function recommendation() {
    for (const m of MODULES) {
      if (!moduleUnlocked(m)) break;
      for (const l of m.lessons) if (!lessonDone(l.id)) return { kind: 'lesson', module: m, lesson: l, href: `#/learn/${m.id}/${l.id}` };
      if (!examPassed(m.id)) return { kind: 'exam', module: m, href: `#/exam/${m.id}` };
    }
    return { kind: 'training', href: '#/training' };
  }

  // ---------- Erfolge ----------
  const ACHIEVEMENTS = [
    { id: 'first_lesson', icon: '📘', name: 'Erste Schritte', desc: 'Erste Lektion abgeschlossen', test: (d) => Object.values(d.lessons).some((l) => l.done) },
    { id: 'rules', icon: '♠', name: 'Regelkundig', desc: 'Modul 1 „Poker-Grundlagen“ bestanden', test: () => examPassed('m1') },
    { id: 'rankings', icon: '♥', name: 'Hand-Kenner', desc: 'Modul 2 „Hand-Rankings“ bestanden', test: () => examPassed('m2') },
    { id: 'preflop', icon: '♦', name: 'Preflop-Grundlagen gemeistert', desc: 'Modul 3 bestanden', test: () => examPassed('m3') },
    { id: 'position', icon: '♣', name: 'Position verstanden', desc: 'Modul 4 bestanden', test: () => examPassed('m4') },
    { id: 'math', icon: '%', name: 'Mathematiker', desc: 'Modul 5 „Pot Odds & Equity“ bestanden', test: () => examPassed('m5') },
    { id: 'flop', icon: '▲', name: 'Flop-Experte', desc: 'Modul 6 bestanden', test: () => examPassed('m6') },
    { id: 'gto', icon: '∑', name: 'GTO-Grundlagen gemeistert', desc: 'Modul 9 bestanden', test: () => examPassed('m9') },
    { id: 'master', icon: '👑', name: 'Poker Master', desc: 'Master Level erreicht', test: () => pokerLevel().current.id === 7 },
    { id: 'hands100', icon: '🃏', name: 'Erste 100 Hände gespielt', desc: '100 Hände im Simulator', test: (d) => d.sim.hands >= 100 },
    { id: 'hands1000', icon: '🎰', name: 'Grinder', desc: '1.000 Hände im Simulator', test: (d) => d.sim.hands >= 1000 },
    { id: 'bluff', icon: '🎭', name: 'Bluff-Künstler', desc: '10 Pots postflop mit einer Bet gewonnen, ohne Showdown und ohne beste Hand', test: (d) => d.sim.bluffWins >= 10 },
    { id: 'analyzed100', icon: '🔍', name: 'Analytiker', desc: '100 Entscheidungen hintereinander vom Coach analysiert', test: (d) => d.totals.analyzed >= 100 },
    { id: 'streak25', icon: '🔥', name: 'Fehlerlos', desc: '25 richtige Antworten in Folge', test: (d) => d.totals.bestCorrectStreak >= 25 },
    { id: 'perfect', icon: '💯', name: 'Perfektionist', desc: 'Einen Abschlusstest mit 100 % bestanden', test: (d) => Object.values(d.exams).some((e) => e.best >= 1) },
    { id: 'ex500', icon: '🏋', name: 'Fleißig', desc: '500 Trainingsaufgaben gelöst', test: (d) => d.totals.exercises >= 500 },
    { id: 'days7', icon: '📅', name: 'Eine Woche dran', desc: '7 Tage Lernserie', test: () => root.Store.streak() >= 7 },
    { id: 'range90', icon: '🎯', name: 'Range-Architekt', desc: 'Eine Range im GTO-Trainer mit ≥ 90 % Genauigkeit gebaut', test: (d) => Object.values(d.gto.rangeBest).some((v) => v >= 0.9) },
  ];

  function checkAchievements() {
    const d = S();
    let changed = false;
    for (const a of ACHIEVEMENTS) {
      if (!d.achievements[a.id] && a.test(d)) {
        d.achievements[a.id] = Date.now();
        changed = true;
        if (root.UI) root.UI.toast(`${a.icon} Erfolg freigeschaltet: <b>${a.name}</b>`, 'gold', 4500);
      }
    }
    if (changed) root.Store.save();
  }

  // ---------- Tagesziele ----------
  function dailyGoals() {
    const d = root.Store.day();
    const weak = root.Store.weaknesses(1)[0];
    const goals = [
      { label: '20 Trainingsaufgaben lösen', cur: d.ex, max: 20, href: '#/training' },
      { label: 'Eine Lektion abschließen', cur: d.lessons, max: 1, href: recommendation().href },
      { label: '25 Hände im Simulator spielen', cur: d.hands, max: 25, href: '#/simulator' },
    ];
    if (weak) {
      const key = 'weak_' + weak.id;
      goals.push({ label: `Schwäche trainieren: ${weak.name} (10 Aufgaben)`, cur: Math.min(10, (d[key] || 0)), max: 10, href: `#/training/skill/${weak.id}` });
    }
    return goals;
  }

  root.Progress = { lessonDone, examPassed, moduleUnlocked, lessonUnlocked, moduleProgress, examAvailable, pokerLevel, levelReached, practiceStatus, overall, recommendation, ACHIEVEMENTS, dailyGoals };
  root.Achievements = { check: checkAchievements };
})(window);
