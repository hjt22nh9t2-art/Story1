/* App-Shell: Router, Navigation, Kopfzeile. */
(function (root) {
  'use strict';
  const S = root.Store, UI = root.UI, PR = root.Progress;

  const NAV = [
    ['dashboard', 'Dashboard', '◧'],
    ['learn', 'Poker lernen', '♠'],
    ['training', 'Training', '⚡'],
    ['simulator', 'Simulator', '🂠'],
    ['strategy', 'Strategie', '♟'],
    ['gto', 'GTO-Trainer', '∑'],
    ['stats', 'Statistiken', '▥'],
    ['glossary', 'Glossar', 'A–Z'],
    ['settings', 'Einstellungen', '⚙'],
  ];

  function shell() {
    document.getElementById('nav').innerHTML = NAV.map(([id, l, i]) => `<a href="#/${id}" data-nav="${id}"><span class="ni">${i}</span><span class="nl">${l}</span></a>`).join('');
    document.getElementById('bottomnav').innerHTML = NAV.filter(([id]) => ['dashboard', 'learn', 'training', 'simulator', 'gto'].includes(id)).map(([id, l, i]) => `<a href="#/${id}" data-nav="${id}"><span class="ni">${i}</span><span class="nl">${l.split(' ')[0]}</span></a>`).join('') + '<button id="moreBtn" aria-label="Mehr"><span class="ni">☰</span><span class="nl">Mehr</span></button>';
    document.getElementById('moreBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    document.getElementById('scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
  }

  function header() {
    const lvl = PR.pokerLevel().current;
    const xl = S.xpLevel();
    document.getElementById('topstats').innerHTML = `
      <div class="ts-level" title="Poker-Level (durch Abschlusstests nachgewiesen)"><span class="ts-badge">${lvl.id}</span><span class="ts-name">${lvl.name}</span></div>
      <div class="ts-xp" title="${S.db.profile.xp} XP"><span class="small">Stufe ${xl.lvl}</span>${UI.bar(xl.into / xl.need, 'gold thin')}</div>
      <div class="ts-streak" title="Tagesserie">🔥 ${S.streak()}</div>`;
  }

  function applySettings() {
    document.body.classList.toggle('four-color', !!S.db.settings.fourColor);
    document.body.classList.toggle('no-anim', !S.db.settings.animations);
    header();
  }

  function route() {
    const hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [name, ...params] = hash.split('/');
    const view = root.Views[name] ? name : 'dashboard';
    const navKey = view === 'exam' ? 'learn' : view;
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === navKey));
    document.body.classList.remove('nav-open');
    const el = document.getElementById('view');
    const fresh = el.cloneNode(false); // alte Listener verwerfen
    el.replaceWith(fresh);
    fresh.classList.remove('enter'); void fresh.offsetWidth; fresh.classList.add('enter');
    try { root.Views[view](fresh, params.map(decodeURIComponent)); } catch (e) { console.error(e); fresh.innerHTML = `<div class="empty">Fehler beim Laden der Ansicht: ${UI.esc(e.message)}</div>`; }
    window.scrollTo(0, 0);
    header();
  }

  function init() {
    S.load();
    shell();
    applySettings();
    S.onChange(() => header());
    S.initTimeTracking();
    window.addEventListener('hashchange', route);
    route();
    root.Achievements.check();
  }

  root.App = { route, applySettings };
  document.addEventListener('DOMContentLoaded', init);
})(window);
