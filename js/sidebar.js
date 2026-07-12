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

  /* Verschachtelte Struktur: Gruppen enthalten Einträge, Einträge können
     selbst wieder Unterpunkte (Dropdown) enthalten. */
  const NAV = [
    { typ: 'top', href: prefix + 'index.html', label: '🏠 Portal' },

    {
      typ: 'gruppe', id: 'g56', label: 'Klasse 5 & 6',
      kinder: [
        { typ: 'item', href: prefix + 'jahrgang/Jg56.html', label: '🎒 Übersicht' },
        { typ: 'item', href: prefix + 'klasse/K56.html', label: '📊 Digitale Klasse' },
        {
          typ: 'dropdown', id: 'spielecke', href: prefix + 'spielecke/index.html', label: '🎲 Spielecke',
          kinder: [
            { typ: 'item', href: prefix + 'spielecke/muenzwurf.html', label: 'Münzwurf' },
            { typ: 'item', href: prefix + 'spielecke/wuerfel.html', label: 'Würfel' },
            { typ: 'item', href: prefix + 'spielecke/gluecksrad.html', label: 'Glücksrad' },
            { typ: 'item', href: prefix + 'spielecke/kugelbeutel.html', label: 'Kugelbeutel' },
            { typ: 'item', href: prefix + 'spielecke/ereignisse.html', label: 'Ereignisse' },
          ]
        },
        { typ: 'item', href: prefix + 'analyse/index.html', label: '📈 Diagramm-Labor' },
      ]
    },

    {
      typ: 'gruppe', id: 'g78', label: 'Klasse 7 & 8',
      kinder: [
        { typ: 'item', href: prefix + 'jahrgang/Jg78.html', label: '🎯 Übersicht' },
        { typ: 'item', href: prefix + 'modul1/index.html', label: '🎰 Modul 1: Ergebnisräume' },
        { typ: 'item', href: prefix + 'modul2/index.html', label: '🌳 Modul 2: Baumdiagramme' },
        { typ: 'locked', label: '⚖️ Modul 3 · Laplace' },
        { typ: 'locked', label: '🔮 Modul 4 · Prognose' },
      ]
    },
  ];

  /* Aktuelle Seite (ohne Query/Hash) für Aktiv-Markierung normalisieren */
  function normPath(href) {
    try { return new URL(href, location.href).pathname.replace(/\/+$/, ''); }
    catch (e) { return href; }
  }
  const aktuellerPfad = normPath(location.href);

  /* Prüft rekursiv, ob ein Knoten (oder eines seiner Kinder) die aktive Seite enthält */
  function enthaeltAktiv(knoten) {
    if (knoten.href && normPath(knoten.href) === aktuellerPfad) return true;
    if (knoten.kinder) return knoten.kinder.some(enthaeltAktiv);
    return false;
  }

  function linkHTML(item) {
    if (item.typ === 'locked') {
      return `<div class="malab-sb-link malab-sb-locked">${item.label}</div>`;
    }
    const aktiv = normPath(item.href) === aktuellerPfad;
    const cls = 'malab-sb-link' + (aktiv ? ' aktiv' : '');
    return `<a class="${cls}" href="${item.href}">${item.label}</a>`;
  }

  /* Rendert eine Liste von Einträgen; Dropdown-Einträge bekommen einen
     eigenen Klapp-Button, der Link selbst bleibt normal klickbar. */
  function eintraegeHTML(kinder) {
    return kinder.map(item => {
      if (item.typ === 'dropdown') {
        const offen = enthaeltAktiv(item);
        return `
          <div class="malab-sb-dropdown${offen ? ' offen' : ''}" data-dd="${item.id}">
            <div class="malab-sb-dropdown-kopf">
              <a class="malab-sb-link" href="${item.href}">${item.label}</a>
              <button type="button" class="malab-sb-caret" aria-label="Unterpunkte ein-/ausblenden" data-caret="${item.id}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
            <div class="malab-sb-kinder">
              ${item.kinder.map(sub => `<a class="malab-sb-link malab-sb-sub${normPath(sub.href) === aktuellerPfad ? ' aktiv' : ''}" href="${sub.href}">${sub.label}</a>`).join('')}
            </div>
          </div>`;
      }
      return linkHTML(item);
    }).join('');
  }

  function gruppeHTML(g) {
    const offen = enthaeltAktiv(g);
    return `
      <div class="malab-sb-gruppe-block${offen ? ' offen' : ''}" data-gruppe="${g.id}">
        <button type="button" class="malab-sb-gruppe" data-gtoggle="${g.id}">
          <span>${g.label}</span>
          <svg class="malab-sb-gruppe-caret" viewBox="0 0 24 24" width="15" height="15"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="malab-sb-gruppe-kinder">
          ${eintraegeHTML(g.kinder)}
        </div>
      </div>`;
  }

  function knotenHTML(item) {
    if (item.typ === 'top') return linkHTML(item);
    if (item.typ === 'gruppe') return gruppeHTML(item);
    return '';
  }

  const html = `
    <button class="malab-sb-tab" id="malabSbTab" aria-label="Navigation ein-/ausblenden">
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="malab-sb-overlay" id="malabSbOverlay"></div>
    <nav class="malab-sb-panel" id="malabSbPanel">
      <div class="malab-sb-kopf">
        <span class="malab-sb-logo">🏫 MaLa</span>
      </div>
      <div class="malab-sb-liste">
        ${NAV.map(knotenHTML).join('')}
      </div>
    </nav>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .malab-sb-tab {
      position: fixed; top: 50%; left: 0; transform: translateY(-50%);
      width: 26px; height: 62px; z-index: 9998;
      border: 2px solid rgba(255,255,255,0.15); border-left: none;
      border-radius: 0 12px 12px 0;
      background: var(--card-bg, #2a3158);
      color: var(--yellow, #FFD93D);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 4px 4px 14px rgba(0,0,0,0.35);
      transition: left .3s ease, background .15s, border-color .15s;
    }
    .malab-sb-tab svg { transition: transform .3s ease; }
    .malab-sb-tab:hover { border-color: var(--yellow, #FFD93D); }
    body.malab-sb-open .malab-sb-tab { left: 290px; }
    body.malab-sb-open .malab-sb-tab svg { transform: rotate(180deg); }
    @media (max-width: 380px) {
      body.malab-sb-open .malab-sb-tab { left: 85vw; }
    }

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
      display: flex; align-items: center;
      padding: 1.1rem 1.2rem; border-bottom: 2px solid rgba(255,255,255,0.08);
    }
    .malab-sb-logo { font-size: 1.05rem; font-weight: 800; color: var(--yellow, #FFD93D); }

    .malab-sb-liste { flex: 1; overflow-y: auto; padding: .8rem 0 1.5rem; }

    /* ── Gruppen (Klasse 5&6 / 7&8) als Dropdown ── */
    .malab-sb-gruppe {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      background: none; border: none; cursor: pointer; text-align: left;
      padding: 1rem 1.2rem .5rem; font-size: .72rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: .06em; color: var(--orange, #FF6B35);
    }
    .malab-sb-gruppe-caret { flex-shrink: 0; transition: transform .25s ease; color: var(--orange, #FF6B35); }
    .malab-sb-gruppe-block.offen .malab-sb-gruppe-caret { transform: rotate(180deg); }
    .malab-sb-gruppe-kinder { max-height: 0; overflow: hidden; transition: max-height .3s ease; }
    .malab-sb-gruppe-block.offen .malab-sb-gruppe-kinder { max-height: 900px; }

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

    /* ── Dropdown innerhalb einer Gruppe (z. B. Spielecke) ── */
    .malab-sb-dropdown-kopf { display: flex; align-items: stretch; }
    .malab-sb-dropdown-kopf .malab-sb-link { flex: 1; }
    .malab-sb-caret {
      flex-shrink: 0; width: 2.4rem; background: none; border: none; cursor: pointer;
      color: var(--muted, #8890BB); display: flex; align-items: center; justify-content: center;
    }
    .malab-sb-caret svg { transition: transform .25s ease; }
    .malab-sb-dropdown.offen .malab-sb-caret svg { transform: rotate(180deg); }
    .malab-sb-dropdown .malab-sb-kinder {
      max-height: 0; overflow: hidden; transition: max-height .28s ease;
    }
    .malab-sb-dropdown.offen .malab-sb-kinder { max-height: 400px; }
  `;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', html);

    const open  = () => document.body.classList.add('malab-sb-open');
    const close = () => document.body.classList.remove('malab-sb-open');
    const toggle = () => document.body.classList.toggle('malab-sb-open');

    document.getElementById('malabSbTab').addEventListener('click', toggle);
    document.getElementById('malabSbOverlay').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    /* Gruppen-Dropdowns (Klasse 5&6 / 7&8) */
    document.querySelectorAll('[data-gtoggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.malab-sb-gruppe-block').classList.toggle('offen');
      });
    });

    /* Unterpunkt-Dropdowns (z. B. Spielecke) */
    document.querySelectorAll('[data-caret]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        btn.closest('.malab-sb-dropdown').classList.toggle('offen');
      });
    });
  });
})();
