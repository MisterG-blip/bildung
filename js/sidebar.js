/* ════════════════════════════════════════════════════════════
   MaLa – zentrale Sidebar-Navigation
   Wird per <script src="js/sidebar.js"></script> (bzw. "../js/sidebar.js"
   aus Unterordnern) in jede Seite eingebunden. Baut sich beim Laden
   selbst auf — keine Kopie von Markup nötig, die man vergessen könnte.
   ════════════════════════════════════════════════════════════ */
(function () {

  /* Pfad-Präfix an Hand des eigenen <script src> bestimmen (Root vs. Unterordner) */
  const scriptEl = document.currentScript;
  const ownSrc = scriptEl ? scriptEl.getAttribute('src') || '' : '';
  const prefix = ownSrc.startsWith('../') ? '../' : '';

  const NAV = [
    { typ: 'top',    href: prefix + 'index.html', label: '🏠 Portal' },

    { typ: 'gruppe', label: 'Klasse 5 & 6' },
    { typ: 'item',   href: prefix + 'jahrgang/Jg56.html', label: '🎒 Übersicht' },
    { typ: 'item',   href: prefix + 'klasse/K56.html', label: '📊 Digitale Klasse' },
    { typ: 'item',   href: prefix + 'spielecke/index.html', label: '🎲 Spielecke' },
    { typ: 'sub',    href: prefix + 'spielecke/muenzwurf.html', label: 'Münzwurf' },
    { typ: 'sub',    href: prefix + 'spielecke/wuerfel.html', label: 'Würfel' },
    { typ: 'sub',    href: prefix + 'spielecke/gluecksrad.html', label: 'Glücksrad' },
    { typ: 'sub',    href: prefix + 'spielecke/kugelbeutel.html', label: 'Kugelbeutel' },
    { typ: 'sub',    href: prefix + 'spielecke/ereignisse.html', label: 'Ereignisse' },
    { typ: 'item',   href: prefix + 'analyse/index.html', label: '📈 Diagramm-Labor' },

    { typ: 'gruppe', label: 'Klasse 7 & 8' },
    { typ: 'item',   href: prefix + 'jahrgang/Jg78.html', label: '🎯 Übersicht' },
    { typ: 'item',   href: prefix + 'modul1/index.html', label: '🎰 Modul 1: Ergebnisräume' },
    { typ: 'locked', label: '🌳 Modul 2 · Baumdiagramme' },
    { typ: 'locked', label: '⚖️ Modul 3 · Laplace' },
    { typ: 'locked', label: '🔮 Modul 4 · Prognose' },
  ];

  /* Aktuelle Seite (ohne Query/Hash) für Aktiv-Markierung normalisieren */
  function normPath(href) {
    try { return new URL(href, location.href).pathname.replace(/\/+$/, ''); }
    catch (e) { return href; }
  }
  const aktuellerPfad = normPath(location.href);

  function itemHTML(item) {
    if (item.typ === 'gruppe') {
      return `<div class="malab-sb-gruppe">${item.label}</div>`;
    }
    if (item.typ === 'locked') {
      return `<div class="malab-sb-link malab-sb-locked">${item.label}</div>`;
    }
    const aktiv = normPath(item.href) === aktuellerPfad;
    const cls = 'malab-sb-link' + (item.typ === 'sub' ? ' malab-sb-sub' : '') + (aktiv ? ' aktiv' : '');
    return `<a class="${cls}" href="${item.href}">${item.label}</a>`;
  }

  const html = `
    <button class="malab-sb-toggle" id="malabSbToggle" aria-label="Navigation öffnen">☰</button>
    <div class="malab-sb-overlay" id="malabSbOverlay"></div>
    <nav class="malab-sb-panel" id="malabSbPanel">
      <div class="malab-sb-kopf">
        <span class="malab-sb-logo">🏫 MaLa</span>
        <button class="malab-sb-close" id="malabSbClose" aria-label="Navigation schließen">✕</button>
      </div>
      <div class="malab-sb-liste">
        ${NAV.map(itemHTML).join('')}
      </div>
    </nav>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .malab-sb-toggle {
      position: fixed; top: 1rem; left: 1rem; z-index: 9998;
      width: 46px; height: 46px; border-radius: 50%;
      background: var(--card-bg, #2a3158); border: 2px solid rgba(255,255,255,0.15);
      color: var(--text, #F0F0FF); font-size: 1.3rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
      transition: transform .15s, border-color .15s;
    }
    .malab-sb-toggle:hover { transform: scale(1.06); border-color: var(--yellow, #FFD93D); }
    .malab-sb-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.55);
      z-index: 9997; opacity: 0; pointer-events: none; transition: opacity .25s;
    }
    .malab-sb-panel {
      position: fixed; top: 0; left: 0; height: 100%; width: 290px; max-width: 85vw;
      background: var(--bg, #1a1f3a); border-right: 2px solid rgba(255,255,255,0.08);
      z-index: 9999; transform: translateX(-100%); transition: transform .3s ease;
      display: flex; flex-direction: column; box-shadow: 12px 0 30px rgba(0,0,0,0.4);
      font-family: 'Nunito', sans-serif;
    }
    body.malab-sb-open .malab-sb-panel { transform: translateX(0); }
    body.malab-sb-open .malab-sb-overlay { opacity: 1; pointer-events: auto; }

    .malab-sb-kopf {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.1rem 1.2rem; border-bottom: 2px solid rgba(255,255,255,0.08);
    }
    .malab-sb-logo { font-size: 1.05rem; font-weight: 800; color: var(--yellow, #FFD93D); }
    .malab-sb-close {
      background: none; border: none; color: var(--muted, #8890BB);
      font-size: 1.1rem; cursor: pointer; padding: .3rem .5rem;
    }
    .malab-sb-close:hover { color: var(--text, #F0F0FF); }

    .malab-sb-liste { flex: 1; overflow-y: auto; padding: .8rem 0 1.5rem; }
    .malab-sb-gruppe {
      padding: 1.1rem 1.2rem .4rem; font-size: .72rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: .06em; color: var(--orange, #FF6B35);
    }
    .malab-sb-link {
      display: block; padding: .65rem 1.2rem; font-size: .92rem; font-weight: 600;
      color: var(--text, #F0F0FF); text-decoration: none; border-left: 3px solid transparent;
      transition: background .15s, border-color .15s;
    }
    .malab-sb-link:hover { background: rgba(255,255,255,0.05); }
    .malab-sb-link.aktiv { border-left-color: var(--mint, #4ECDC4); background: rgba(78,205,196,0.1); color: var(--mint, #4ECDC4); font-weight: 800; }
    .malab-sb-link.malab-sb-sub { padding-left: 2.1rem; font-size: .85rem; color: var(--muted, #8890BB); }
    .malab-sb-link.malab-sb-sub:hover { color: var(--text, #F0F0FF); }
    .malab-sb-link.malab-sb-sub.aktiv { color: var(--mint, #4ECDC4); }
    .malab-sb-locked {
      padding: .65rem 1.2rem; font-size: .92rem; font-weight: 600;
      color: var(--muted, #8890BB); opacity: .5; cursor: default;
    }
  `;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', html);
    const open  = () => document.body.classList.add('malab-sb-open');
    const close = () => document.body.classList.remove('malab-sb-open');
    document.getElementById('malabSbToggle').addEventListener('click', open);
    document.getElementById('malabSbClose').addEventListener('click', close);
    document.getElementById('malabSbOverlay').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  });
})();
