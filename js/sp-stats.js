/* ════════════════════════════════════════
   SPIELECKE STATS
   Shared logic: tally, relative Häufigkeit vs theoretische Wahrscheinlichkeit
   Used identically by Münzwurf, Würfel, Glücksrad, Kugelbeutel.
   ════════════════════════════════════════ */

const SpStats = (() => {

  /* Render the live Strichliste in the sidebar */
  function renderStrichliste(container, daten, order, labels, colors) {
    if (Object.values(daten).every(v => v === 0)) {
      container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:.8rem;padding:1rem 0">Noch keine Würfe/Versuche.</div>';
      return;
    }
    container.innerHTML = order.map((key, i) => {
      const count = daten[key] || 0;
      return `<div class="sp-strich-row" data-key="${key}">
        <span class="sp-strich-key" style="color:${colors ? colors[i] : 'var(--text)'}">${labels[key] || key}</span>
        <span class="sp-strich-marks">${strichMarks(count)}</span>
        <span class="sp-strich-count">${count}</span>
      </div>`;
    }).join('');
  }

  function strichMarks(n) {
    let s = '';
    for (let i = 0; i < n; i++) {
      if (i > 0 && i % 5 === 4) s += '<span style="color:var(--yellow)">╱</span>';
      else s += '|';
      if ((i + 1) % 5 === 0 && i < n - 1) s += ' ';
    }
    return s;
  }

  /* Flash a row when a new tally is added */
  function flashRow(container, key) {
    const row = container.querySelector(`[data-key="${key}"]`);
    if (row) {
      row.classList.remove('flash');
      void row.offsetWidth; // reflow to restart animation
      row.classList.add('flash');
    }
  }

  /* Render comparison bars: relative Häufigkeit (real, solid) vs theoretische Wahrscheinlichkeit (dashed) */
  function renderVergleich(container, daten, theorie, order, labels) {
    const gesamt = Object.values(daten).reduce((a, b) => a + b, 0);

    if (gesamt === 0) {
      container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:.8rem;padding:1rem 0">Starte das Experiment, um die Häufigkeiten zu sehen.</div>';
      return;
    }

    container.innerHTML = order.map(key => {
      const count    = daten[key] || 0;
      const realPct  = gesamt > 0 ? (count / gesamt * 100) : 0;
      const theoPct  = (theorie[key] || 0) * 100;
      return `
        <div class="vergleich-row">
          <div class="vergleich-label">
            <span class="key">${labels[key] || key}</span>
            <span>${realPct.toFixed(1)}% <span style="color:var(--muted)">(erwartet: ${theoPct.toFixed(1)}%)</span></span>
          </div>
          <div class="vergleich-bars">
            <div class="vbar-track">
              <div class="vbar-fill real" style="width:${realPct}%"></div>
            </div>
            <div class="vbar-track">
              <div class="vbar-fill theorie" style="width:${theoPct}%"></div>
            </div>
          </div>
        </div>`;
    }).join('') + `
      <div style="display:flex;gap:1rem;font-size:.68rem;color:var(--muted);margin-top:.5rem;justify-content:center">
        <span>🟢 Beobachtet (real)</span>
        <span>▦ Erwartet (Theorie)</span>
      </div>`;
  }

  function renderGesamt(container, n) {
    container.innerHTML = `
      <div class="gesamt-counter">
        <div class="big">${n}</div>
        <div class="sub">Durchgeführte Versuche</div>
      </div>`;
  }

  return { renderStrichliste, flashRow, renderVergleich, renderGesamt, strichMarks };
})();
