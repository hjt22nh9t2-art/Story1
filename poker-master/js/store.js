/* Persistenzschicht ("Datenbank"): versioniertes Schema in localStorage,
   Migrationen, Export/Import, Fortschritt, XP, Skills, Fehlerprotokoll, Erfolge. */
(function (root) {
  'use strict';
  const KEY = 'pokermaster.db';
  const SCHEMA_VERSION = 2;

  const SKILLS = {
    rules: 'Regeln & Ablauf',
    handRanking: 'Hand-Rankings',
    kicker: 'Kicker & Split Pots',
    preflop: 'Preflop-Opening',
    preflop3bet: '3-Bet & Verteidigung',
    position: 'Position',
    potOdds: 'Pot Odds',
    outs: 'Outs zählen',
    equity: 'Equity-Entscheidungen',
    boardTexture: 'Boardtexturen',
    cbet: 'C-Bets & Flop-Spiel',
    valueBluff: 'Value Bets & Bluffs',
    ranges: 'Range-Denken',
    gto: 'GTO-Konzepte',
    exploit: 'Exploitatives Spiel',
    mental: 'Bankroll & Mindset',
  };

  const today = () => new Date().toISOString().slice(0, 10);

  function emptyDB() {
    return {
      version: SCHEMA_VERSION,
      createdAt: Date.now(),
      profile: { name: 'Spieler', xp: 0 },
      settings: { fourColor: false, animations: true, sound: false, botSpeed: 700, coach: true, startStack: 100 },
      lessons: {},      // lessonId -> { done, best, attempts, completedAt }
      exams: {},        // moduleId -> { passed, best, attempts, passedAt }
      skills: {},       // skill -> { a: attempts, c: correct, recent: [1,0,...] }
      mistakes: [],     // { ts, skill, q, answer, correct, explain }
      days: {},         // 'YYYY-MM-DD' -> { xp, ex, ok, sec, hands, lessons }
      achievements: {}, // id -> timestamp
      sim: { hands: 0, won: 0, netBB: 0, vpip: 0, pfr: 0, decisions: 0, good: 0, history: [], bluffWins: 0, showdowns: 0, wonShowdown: 0 },
      totals: { exercises: 0, correct: 0, analyzed: 0, correctStreak: 0, bestCorrectStreak: 0 },
      gto: { rangeBest: {}, drills: 0 },
    };
  }

  function migrate(db) {
    if (!db.version || db.version < 2) {
      db.gto = db.gto || { rangeBest: {}, drills: 0 };
      db.settings = Object.assign(emptyDB().settings, db.settings || {});
    }
    // fehlende Felder ergänzen
    const base = emptyDB();
    for (const k of Object.keys(base)) if (db[k] === undefined) db[k] = base[k];
    for (const k of Object.keys(base.sim)) if (db.sim[k] === undefined) db.sim[k] = base.sim[k];
    for (const k of Object.keys(base.totals)) if (db.totals[k] === undefined) db.totals[k] = base.totals[k];
    db.version = SCHEMA_VERSION;
    return db;
  }

  let db;
  const listeners = [];
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? migrate(JSON.parse(raw)) : emptyDB();
    } catch (e) { db = emptyDB(); }
    return db;
  }
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* Speicher evtl. blockiert */ } }, 50);
    listeners.forEach((f) => f(db));
  }
  function onChange(fn) { listeners.push(fn); }

  function day() {
    const d = today();
    if (!db.days[d]) db.days[d] = { xp: 0, ex: 0, ok: 0, sec: 0, hands: 0, lessons: 0 };
    return db.days[d];
  }

  // ---------- XP & Level ----------
  /** XP-Stufe (kosmetisch) – der Poker-Rang ergibt sich ausschließlich aus bestandenen Tests. */
  function xpLevel(xp = db.profile.xp) {
    let lvl = 1, need = 150, acc = 0;
    while (xp >= acc + need) { acc += need; lvl++; need = Math.round(need * 1.18); }
    return { lvl, into: xp - acc, need };
  }
  const toasts = [];
  function addXP(n, reason) {
    db.profile.xp += n;
    day().xp += n;
    if (root.UI && root.UI.toast && n >= 5) root.UI.toast(`+${n} XP${reason ? ' · ' + reason : ''}`, 'xp');
    save();
  }

  // ---------- Skills ----------
  function recordAnswer(skill, ok, meta, opts = {}) {
    const s = db.skills[skill] || (db.skills[skill] = { a: 0, c: 0, recent: [] });
    s.a++; if (ok) s.c++;
    s.recent.push(ok ? 1 : 0); if (s.recent.length > 30) s.recent.shift();
    const d = day();
    d['weak_' + skill] = (d['weak_' + skill] || 0) + 1;
    if (opts.sim) {
      if (!ok && meta) { db.mistakes.unshift({ ts: Date.now(), skill, ...meta }); if (db.mistakes.length > 200) db.mistakes.length = 200; }
      save(); if (root.Achievements) root.Achievements.check();
      return;
    }
    db.totals.exercises++;
    d.ex++;
    if (ok) {
      db.totals.correct++; d.ok++;
      db.totals.correctStreak++;
      db.totals.bestCorrectStreak = Math.max(db.totals.bestCorrectStreak, db.totals.correctStreak);
    } else {
      db.totals.correctStreak = 0;
      if (meta) {
        db.mistakes.unshift({ ts: Date.now(), skill, ...meta });
        if (db.mistakes.length > 200) db.mistakes.length = 200;
      }
    }
    save();
    if (root.Achievements) root.Achievements.check();
  }

  /** Gewichtete Genauigkeit: jüngere Antworten zählen mehr. */
  function skillScore(skill) {
    const s = db.skills[skill];
    if (!s || s.a === 0) return null;
    const r = s.recent;
    let w = 0, sum = 0;
    r.forEach((v, i) => { const wt = 1 + i / r.length; w += wt; sum += v * wt; });
    const recentAcc = w ? sum / w : s.c / s.a;
    return 0.7 * recentAcc + 0.3 * (s.c / s.a);
  }

  function skillList() {
    return Object.keys(SKILLS).map((k) => ({ id: k, name: SKILLS[k], score: skillScore(k), attempts: db.skills[k] ? db.skills[k].a : 0 }));
  }

  function weaknesses(n = 3) {
    return skillList().filter((s) => s.attempts >= 4 && s.score < 0.8).sort((a, b) => a.score - b.score).slice(0, n);
  }
  function strengths(n = 3) {
    return skillList().filter((s) => s.attempts >= 4 && s.score >= 0.7).sort((a, b) => b.score - a.score).slice(0, n);
  }

  // ---------- Serie & Zeit ----------
  function streak() {
    let n = 0;
    const d = new Date();
    const key = (x) => x.toISOString().slice(0, 10);
    const active = (k) => db.days[k] && (db.days[k].ex > 0 || db.days[k].lessons > 0 || db.days[k].hands > 0 || db.days[k].sec >= 60);
    if (!active(key(d))) d.setDate(d.getDate() - 1); // heute noch nicht aktiv: Serie läuft bis gestern
    while (active(key(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function totalSeconds() { return Object.values(db.days).reduce((s, d) => s + (d.sec || 0), 0); }

  let lastInteraction = Date.now();
  function initTimeTracking() {
    ['click', 'keydown', 'touchstart', 'scroll'].forEach((ev) => root.addEventListener(ev, () => (lastInteraction = Date.now()), { passive: true }));
    setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastInteraction < 90000) {
        day().sec += 15;
        try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
      }
    }, 15000);
  }

  function exportJSON() { return JSON.stringify(db, null, 2); }
  function importJSON(str) {
    const data = JSON.parse(str);
    if (!data || typeof data !== 'object' || !data.profile) throw new Error('Ungültige Datei');
    db = migrate(data); save();
  }
  function reset() { db = emptyDB(); save(); }

  const api = {
    SKILLS, load, save, onChange, get db() { return db; }, day, today,
    xpLevel, addXP, recordAnswer, skillScore, skillList, weaknesses, strengths,
    streak, totalSeconds, initTimeTracking, exportJSON, importJSON, reset,
  };
  root.Store = api;
})(window);
