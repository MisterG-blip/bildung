/* ════════════════════════════════════════
   DIAGRAMM-WERKSTATT
   Schüler ziehen Balken-Bausteine von einer Werkbank
   in ein echtes Koordinatensystem (mit x- und y-Achse,
   Beschriftung, Gitterlinien) an die richtige Stelle.
   ════════════════════════════════════════ */

const Werkstatt = (() => {

  const COLORS = ['#FFD93D','#FF6B35','#4ECDC4','#A855F7','#FF6B9D','#3B82F6','#22C55E','#EF4444','#F97316','#8B5CF6'];

  let state = null; // current puzzle state
  let dragInfo = null; // { key, pointerId, ghostEl }

  function render(container, daten, merkmal) {
    const entries = Object.entries(daten).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);

    if (entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛠️</div>
          <p>Erfasse zuerst Daten in der Strichliste, dann kannst du hier dein eigenes Diagramm bauen!</p>
        </div>`;
      return;
    }

    const maxVal = Math.max(...entries.map(([,v]) => v));
    // Round y-axis max up to a "nice" number for clean gridlines
    const yMax = niceMax(maxVal);

    state = {
      entries,
      yMax,
      placed: {}, // key -> true once correctly placed
      merkmal,
    };

    container.innerHTML = `
      <div class="werkstatt-wrap">
        <div class="werkstatt-hinweis">
          Ziehe jeden Balken aus der Werkbank an die <strong>richtige Stelle</strong> im Koordinatensystem.
          Achte auf die <strong>y-Achse</strong> — sie zeigt dir die Häufigkeit!
        </div>

        <div class="werkbank" id="werkbank">
          ${entries.map(([key, val], i) => `
            <div class="werk-block" id="werkblock-${cssKey(key)}" data-key="${key}" data-val="${val}">
              <div class="werk-block-bar" style="background:${COLORS[i % COLORS.length]}">${val}</div>
              <div class="werk-block-label">${key}</div>
            </div>`).join('')}
        </div>

        <div class="koordinatensystem-wrap">
          <svg id="koordSystem" viewBox="0 0 760 440" xmlns="http://www.w3.org/2000/svg"></svg>
        </div>

        <div class="werkstatt-feedback" id="werkstattFeedback"></div>

        <div class="werkstatt-actions">
          <button class="btn btn-ghost" onclick="Werkstatt.reset()">🔄 Werkstatt zurücksetzen</button>
        </div>
      </div>`;

    drawKoordinatensystem();
    attachDragHandlers();
  }

  function cssKey(key) {
    return String(key).replace(/[^a-zA-Z0-9]/g, '_');
  }

  /* Round up to a clean axis maximum (1, 2, 5, 10, 20, 25, 50, 100...) */
  function niceMax(val) {
    const steps = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100];
    for (const s of steps) if (val <= s) return s;
    return Math.ceil(val / 10) * 10 + 10;
  }

  /* ── Draw the coordinate system (axes, gridlines, labels, drop zones) ── */
  const PAD_L = 70, PAD_R = 30, PAD_T = 30, PAD_B = 70;
  const SVG_W = 760, SVG_H = 440;

  function drawKoordinatensystem() {
    const svg = document.getElementById('koordSystem');
    if (!svg || !state) return;

    const { entries, yMax } = state;
    const chartW = SVG_W - PAD_L - PAD_R;
    const chartH = SVG_H - PAD_T - PAD_B;
    const slotW  = chartW / entries.length;
    const barW   = Math.min(70, slotW * 0.55);

    let svgContent = '';

    // Background
    svgContent += `<rect x="0" y="0" width="${SVG_W}" height="${SVG_H}" fill="transparent"/>`;

    // Gridlines + y-axis labels
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round(yMax * i / ySteps);
      const y = PAD_T + chartH - (chartH * i / ySteps);
      svgContent += `<line x1="${PAD_L}" y1="${y}" x2="${SVG_W - PAD_R}" y2="${y}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>`;
      svgContent += `<text x="${PAD_L - 10}" y="${y + 4}" fill="rgba(255,255,255,0.55)" font-size="13" text-anchor="end" font-family="Nunito, sans-serif">${val}</text>`;
    }

    // Drop zone columns + x-axis labels
    entries.forEach(([key, val], i) => {
      const slotX = PAD_L + slotW * i;
      const cx    = slotX + slotW / 2;

      // Invisible drop target covering the full column height
      svgContent += `<rect class="koord-droptarget" id="drop-${cssKey(key)}"
                       x="${slotX + 2}" y="${PAD_T}" width="${slotW - 4}" height="${chartH}"
                       data-key="${key}" rx="6"/>`;

      // x-axis tick label
      svgContent += `<text x="${cx}" y="${PAD_T + chartH + 22}" fill="rgba(255,255,255,0.85)" font-size="13" font-weight="700" text-anchor="middle" font-family="Nunito, sans-serif">${key}</text>`;

      // Placeholder ghost outline showing where the bar belongs (height-correct, faint)
      const correctH = (val / yMax) * chartH;
      svgContent += `<rect x="${cx - barW/2}" y="${PAD_T + chartH - correctH}" width="${barW}" height="${correctH}"
                       fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-dasharray="5,4" rx="4"
                       id="ghost-${cssKey(key)}"/>`;
    });

    // Axes (drawn on top of gridlines)
    svgContent += `<line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T + chartH}" stroke="rgba(255,211,61,0.7)" stroke-width="2.5"/>`;
    svgContent += `<line x1="${PAD_L}" y1="${PAD_T + chartH}" x2="${SVG_W - PAD_R}" y2="${PAD_T + chartH}" stroke="rgba(255,211,61,0.7)" stroke-width="2.5"/>`;

    // Axis arrowheads
    svgContent += `<polygon points="${PAD_L-6},${PAD_T+8} ${PAD_L+6},${PAD_T+8} ${PAD_L},${PAD_T-4}" fill="rgba(255,211,61,0.7)"/>`;
    svgContent += `<polygon points="${SVG_W-PAD_R-8},${PAD_T+chartH-6} ${SVG_W-PAD_R-8},${PAD_T+chartH+6} ${SVG_W-PAD_R+4},${PAD_T+chartH}" fill="rgba(255,211,61,0.7)"/>`;

    // Axis titles
    svgContent += `<text x="${PAD_L}" y="${PAD_T - 12}" fill="var(--mint)" font-size="13" font-weight="800" text-anchor="middle" font-family="Nunito, sans-serif">Häufigkeit</text>`;
    svgContent += `<text x="${SVG_W - PAD_R}" y="${PAD_T + chartH + 50}" fill="var(--mint)" font-size="13" font-weight="800" text-anchor="end" font-family="Nunito, sans-serif">${state.merkmal.label.replace(/^\S+\s/, '')}</text>`;

    // Origin label
    svgContent += `<text x="${PAD_L - 10}" y="${PAD_T + chartH + 4}" fill="rgba(255,255,255,0.55)" font-size="13" text-anchor="end" font-family="Nunito, sans-serif">0</text>`;

    svg.innerHTML = svgContent;
  }

  /* ── Drag & Drop logic (pointer events, works for mouse + touch) ── */
  function attachDragHandlers() {
    const blocks = document.querySelectorAll('.werk-block');
    blocks.forEach(block => {
      block.addEventListener('pointerdown', onPointerDown);
    });
  }

  let ghostEl = null;
  let activeKey = null;

  function onPointerDown(e) {
    const block = e.currentTarget;
    if (block.classList.contains('placed')) return;
    activeKey = block.dataset.key;

    // Create a floating ghost element that follows the pointer
    ghostEl = block.cloneNode(true);
    ghostEl.style.position = 'fixed';
    ghostEl.style.pointerEvents = 'none';
    ghostEl.style.zIndex = '999';
    ghostEl.style.left = e.clientX - 25 + 'px';
    ghostEl.style.top  = e.clientY - 25 + 'px';
    ghostEl.style.opacity = '0.9';
    document.body.appendChild(ghostEl);

    block.classList.add('dragging');

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }

  function onPointerMove(e) {
    if (!ghostEl) return;
    ghostEl.style.left = e.clientX - 25 + 'px';
    ghostEl.style.top  = e.clientY - 25 + 'px';

    // Highlight drop target under pointer
    document.querySelectorAll('.koord-droptarget').forEach(d => d.classList.remove('drag-over'));
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const dropTarget = el ? el.closest('.koord-droptarget') : null;
    if (dropTarget) dropTarget.classList.add('drag-over');
  }

  function onPointerUp(e) {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const dropTarget = el ? el.closest('.koord-droptarget') : null;

    document.querySelectorAll('.koord-droptarget').forEach(d => d.classList.remove('drag-over'));

    const sourceBlock = document.getElementById('werkblock-' + cssKey(activeKey));
    if (sourceBlock) sourceBlock.classList.remove('dragging');

    if (ghostEl) { ghostEl.remove(); ghostEl = null; }

    if (dropTarget) {
      const targetKey = dropTarget.dataset.key;
      handleDrop(activeKey, targetKey);
    }

    activeKey = null;
  }

  function handleDrop(draggedKey, targetKey) {
    const feedback = document.getElementById('werkstattFeedback');

    if (draggedKey === targetKey) {
      // Correct! Place the real bar in the SVG
      placeBar(draggedKey);
      feedback.textContent = '✅ Richtig platziert!';
      feedback.className = 'werkstatt-feedback richtig';

      const block = document.getElementById('werkblock-' + cssKey(draggedKey));
      if (block) block.classList.add('placed');

      const allPlaced = state.entries.every(([k]) => state.placed[k]);
      if (allPlaced) {
        setTimeout(() => {
          feedback.textContent = '🏆 Super! Du hast das ganze Diagramm selbst gebaut!';
        }, 600);
      }
    } else {
      feedback.textContent = '❌ Das ist nicht die richtige Spalte — schau genau auf die Beschriftung!';
      feedback.className = 'werkstatt-feedback falsch';
    }
  }

  function placeBar(key) {
    if (state.placed[key]) return;
    state.placed[key] = true;

    const idx = state.entries.findIndex(([k]) => k === key);
    const val = state.entries[idx][1];
    const color = COLORS[idx % COLORS.length];

    const chartW = SVG_W - PAD_L - PAD_R;
    const chartH = SVG_H - PAD_T - PAD_B;
    const slotW  = chartW / state.entries.length;
    const barW   = Math.min(70, slotW * 0.55);
    const slotX  = PAD_L + slotW * idx;
    const cx     = slotX + slotW / 2;
    const barH   = (val / state.yMax) * chartH;
    const barY   = PAD_T + chartH - barH;

    const svg = document.getElementById('koordSystem');
    const ghost = document.getElementById('ghost-' + cssKey(key));
    if (ghost) ghost.remove();

    const ns = 'http://www.w3.org/2000/svg';
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', cx - barW/2);
    rect.setAttribute('y', PAD_T + chartH); // start collapsed at baseline
    rect.setAttribute('width', barW);
    rect.setAttribute('height', 0);
    rect.setAttribute('fill', color);
    rect.setAttribute('stroke', '#1a1f3a');
    rect.setAttribute('stroke-width', '2.5');
    rect.setAttribute('rx', '6');
    svg.appendChild(rect);

    // Value label above bar
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', cx);
    text.setAttribute('y', barY - 10);
    text.setAttribute('fill', '#1a1f3a');
    text.setAttribute('font-size', '15');
    text.setAttribute('font-weight', '800');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('opacity', '0');
    text.textContent = val;
    svg.appendChild(text);

    // Animate grow
    requestAnimationFrame(() => {
      rect.style.transition = 'height .4s cubic-bezier(0.34,1.56,0.64,1), y .4s cubic-bezier(0.34,1.56,0.64,1)';
      rect.setAttribute('y', barY);
      rect.setAttribute('height', barH);
      text.style.transition = 'opacity .3s ease .3s';
      text.setAttribute('fill', 'rgba(255,255,255,0.95)');
      text.style.opacity = '1';
    });
  }

  function reset() {
    const container = document.getElementById('auswertContent');
    if (!container || !state) return;
    render(container, Object.fromEntries(state.entries), state.merkmal);
  }

  return { render, reset };
})();
