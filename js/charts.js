/* ════════════════════════════════════════
   CHARTS & STATISTIK
   Canvas-based bar/column charts + Häufigkeitstabelle
   + Mittelwert, Median, Spannweite
   ════════════════════════════════════════ */

const Charts = (() => {

  const COLORS = ['#FFD93D','#FF6B35','#4ECDC4','#A855F7','#FF6B9D','#3B82F6','#22C55E','#EF4444','#F97316','#8B5CF6'];

  /* ── Häufigkeitstabelle (HTML) ── */
  function renderTabelle(container, daten, titel) {
    // Sort: numeric keys in ascending order, text keys by frequency
    const entries = Object.entries(daten).sort((a, b) => {
      const na = parseFloat(a[0]), nb = parseFloat(b[0]);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;   // numeric: ascending
      return b[1] - a[1];                              // text: by frequency
    });
    const gesamt = entries.reduce((s, [, v]) => s + v, 0);

    let html = `<div class="tabelle-wrap">
      <div class="tabelle-titel">${titel}</div>
      <table class="haeufig-tabelle">
        <thead>
          <tr>
            <th style="text-align:center">Merkmal</th>
            <th style="text-align:center">Strichliste</th>
            <th style="text-align:center">Häufigkeit</th>
            <th style="text-align:center">Anteil</th>
          </tr>
        </thead>
        <tbody>`;

    entries.forEach(([key, val], i) => {
      const striche = renderStriche(val);
      const pct     = Math.round(val / gesamt * 100);
      const bruch   = `${val}/${gesamt}`;
      html += `<tr>
        <td style="text-align:center"><span class="tabelle-dot" style="background:${COLORS[i % COLORS.length]}"></span>${key}</td>
        <td style="text-align:center">${striche}<div class="strich-summe">${val}</div></td>
        <td class="zahl-cell" style="text-align:center">${val}</td>
        <td class="zahl-cell" style="text-align:center">
          <span class="anteil-bruch">${bruch}</span>
          <span class="anteil-pct">${pct}%</span>
        </td>
      </tr>`;
    });

    html += `<tr class="gesamt-row">
        <td style="text-align:center"><strong>Gesamt</strong></td>
        <td></td>
        <td class="zahl-cell" style="text-align:center"><strong>${gesamt}</strong></td>
        <td class="zahl-cell" style="text-align:center"><strong>100%</strong></td>
      </tr>
        </tbody>
      </table>
    </div>`;

    container.innerHTML = html;
  }

  /* Render tally marks grouped in 5s with a count label below each group */
  function renderStriche(n) {
    let html = '<span class="strichliste">';
    const groups = Math.floor(n / 5);
    const rest   = n % 5;
    for (let g = 0; g < groups; g++) {
      html += '<span class="strich-gruppe">||||╱</span> ';
    }
    for (let r = 0; r < rest; r++) {
      html += '<span class="strich">|</span>';
    }
    html += '</span>';
    return html;
  }

  /* ── Säulendiagramm (Canvas) ── */
  function renderSaeulen(canvas, daten, titel, opts = {}) {
    const ctx    = canvas.getContext('2d');
    const W      = canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
    const H      = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    const dpr    = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    const entries  = Object.entries(daten).sort((a, b) => {
      const na = parseFloat(a[0]), nb = parseFloat(b[0]);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;  // numeric: 0,1,2,3...
      return 0;                                        // text: keep insertion order
    });
    const maxVal   = Math.max(...entries.map(([,v]) => v));
    const padL = 48, padR = 20, padT = 40, padB = 70;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const barW   = Math.min(60, chartW / entries.length * 0.65);
    const gap    = chartW / entries.length;

    // Title
    ctx.fillStyle = '#F0F0FF';
    ctx.font      = `bold ${Math.round(w * 0.038)}px Fredoka One, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(titel, w / 2, 26);

    // Grid lines
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const y = padT + chartH - (chartH * i / steps);
      const v = Math.round(maxVal * i / steps);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillStyle   = 'rgba(255,255,255,0.45)';
      ctx.font        = `${Math.round(w * 0.028)}px Nunito, sans-serif`;
      ctx.textAlign   = 'right';
      ctx.fillText(v, padL - 6, y + 4);
    }

    // Bars
    entries.forEach(([key, val], i) => {
      const barH  = val / maxVal * chartH;
      const x     = padL + gap * i + gap / 2 - barW / 2;
      const y     = padT + chartH - barH;
      const color = COLORS[i % COLORS.length];

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      roundRect(ctx, x + 3, y + 3, barW, barH, 8);
      ctx.fill();

      // Bar
      ctx.fillStyle = color;
      roundRect(ctx, x, y, barW, barH, 8);
      ctx.fill();

      // Outline
      ctx.strokeStyle = '#1a1f3a';
      ctx.lineWidth   = 2;
      roundRect(ctx, x, y, barW, barH, 8);
      ctx.stroke();

      // Value label on bar
      ctx.fillStyle = '#1a1f3a';
      ctx.font      = `bold ${Math.round(barW * 0.35)}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      if (barH > 24) ctx.fillText(val, x + barW / 2, y + Math.min(barH / 2 + 7, barH - 6));

      // X-axis label
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font      = `${Math.round(w * 0.028)}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      const label   = key.length > 10 ? key.slice(0, 9) + '…' : key;
      ctx.fillText(label, x + barW / 2, padT + chartH + 18);

      // Emoji under label if available
      if (opts.emojis && opts.emojis[key]) {
        ctx.font = `${Math.round(w * 0.035)}px serif`;
        ctx.fillText(opts.emojis[key], x + barW / 2, padT + chartH + 38);
      }
    });

    // X-axis line
    ctx.strokeStyle = 'rgba(255,211,61,0.7)';
    ctx.lineWidth   = 2.5;
    ctx.beginPath(); ctx.moveTo(padL, padT + chartH); ctx.lineTo(w - padR, padT + chartH); ctx.stroke();

    // X-axis arrowhead
    ctx.beginPath();
    ctx.moveTo(w - padR - 8, padT + chartH - 6);
    ctx.lineTo(w - padR - 8, padT + chartH + 6);
    ctx.lineTo(w - padR + 4, padT + chartH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,211,61,0.7)';
    ctx.fill();

    // Y-axis line
    ctx.strokeStyle = 'rgba(255,211,61,0.7)';
    ctx.lineWidth   = 2.5;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + chartH); ctx.stroke();

    // Y-axis arrowhead
    ctx.beginPath();
    ctx.moveTo(padL - 6, padT + 8);
    ctx.lineTo(padL + 6, padT + 8);
    ctx.lineTo(padL, padT - 4);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,211,61,0.7)';
    ctx.fill();

    // Axis titles
    ctx.fillStyle = '#4ECDC4';
    ctx.font      = `bold ${Math.round(w * 0.026)}px Nunito, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Häufigkeit', padL + 4, padT - 14);

    ctx.textAlign = 'right';
    const achsenTitel = opts.achsenTitel || '';
    if (achsenTitel) ctx.fillText(achsenTitel, w - padR, padT + chartH + 56);

    // Origin "0" label
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font      = `${Math.round(w * 0.028)}px Nunito, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('0', padL - 6, padT + chartH + 4);
  }

  /* ── Balkendiagramm (horizontal) ── */
  function renderBalken(canvas, daten, titel, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W   = canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
    const H   = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    const entries = Object.entries(daten).sort((a, b) => {
      const na = parseFloat(a[0]), nb = parseFloat(b[0]);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return 0;
    });
    const maxVal  = Math.max(...entries.map(([,v]) => v));
    const padL = 130, padR = 50, padT = 50, padB = 55;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const rowH   = chartH / entries.length;
    const barH   = Math.min(rowH * 0.6, 38);

    // Title
    ctx.fillStyle = '#F0F0FF';
    ctx.font      = `bold ${Math.round(w * 0.038)}px Fredoka One, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(titel, w / 2, 26);

    // Vertical gridlines + x-axis scale (Häufigkeit)
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const v = Math.round(maxVal * i / steps);
      const x = padL + chartW * i / steps;
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + chartH); ctx.stroke();
      ctx.fillStyle   = 'rgba(255,255,255,0.45)';
      ctx.font        = `${Math.round(w * 0.026)}px Nunito, sans-serif`;
      ctx.textAlign   = 'center';
      ctx.fillText(v, x, padT + chartH + 18);
    }

    entries.forEach(([key, val], i) => {
      const barW  = val / maxVal * chartW;
      const y     = padT + rowH * i + (rowH - barH) / 2;
      const color = COLORS[i % COLORS.length];

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font      = `600 ${Math.round(w * 0.03)}px Nunito, sans-serif`;
      ctx.textAlign = 'right';
      const label   = key.length > 14 ? key.slice(0, 13) + '…' : key;
      ctx.fillText(label, padL - 10, y + barH / 2 + 5);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      roundRect(ctx, padL + 3, y + 3, barW, barH, 6);
      ctx.fill();

      // Bar
      ctx.fillStyle = color;
      roundRect(ctx, padL, y, barW, barH, 6);
      ctx.fill();

      ctx.strokeStyle = '#1a1f3a';
      ctx.lineWidth   = 2;
      roundRect(ctx, padL, y, barW, barH, 6);
      ctx.stroke();

      // Value
      ctx.fillStyle = '#1a1f3a';
      ctx.font      = `bold ${Math.round(barH * 0.5)}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      if (barW > 30) ctx.fillText(val, padL + barW / 2, y + barH / 2 + 5);
    });

    // Y-axis line (vertical, left)
    ctx.strokeStyle = 'rgba(255,211,61,0.7)';
    ctx.lineWidth   = 2.5;
    ctx.beginPath(); ctx.moveTo(padL, padT - 6); ctx.lineTo(padL, padT + chartH); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padL - 6, padT + 4);
    ctx.lineTo(padL + 6, padT + 4);
    ctx.lineTo(padL, padT - 8);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,211,61,0.7)';
    ctx.fill();

    // X-axis line (horizontal, bottom)
    ctx.strokeStyle = 'rgba(255,211,61,0.7)';
    ctx.lineWidth   = 2.5;
    ctx.beginPath(); ctx.moveTo(padL, padT + chartH); ctx.lineTo(padL + chartW + 6, padT + chartH); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padL + chartW - 2, padT + chartH - 6);
    ctx.lineTo(padL + chartW - 2, padT + chartH + 6);
    ctx.lineTo(padL + chartW + 10, padT + chartH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,211,61,0.7)';
    ctx.fill();

    // Axis title
    ctx.fillStyle = '#4ECDC4';
    ctx.font      = `bold ${Math.round(w * 0.026)}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Häufigkeit →', padL + chartW / 2, padT + chartH + 40);
  }

  /* ── Kenngrößen ── */
  function kenngroessen(daten) {
    // Expand grouped data into flat list of numbers (e.g. geschwister counts)
    const values = [];
    Object.entries(daten).forEach(([key, count]) => {
      const n = parseFloat(key);
      if (!isNaN(n)) for (let i = 0; i < count; i++) values.push(n);
    });
    if (values.length === 0) return null;
    values.sort((a, b) => a - b);
    const n        = values.length;
    const sum      = values.reduce((a, b) => a + b, 0);
    const mittel   = sum / n;
    const median   = n % 2 === 0
      ? (values[n/2 - 1] + values[n/2]) / 2
      : values[Math.floor(n/2)];
    const spanne   = values[n-1] - values[0];
    return { mittel: mittel.toFixed(2), median, spanne, min: values[0], max: values[n-1] };
  }

  function renderKenngroessen(container, kg, bezeichnung) {
    if (!kg) { container.innerHTML = ''; return; }
    container.innerHTML = `
      <div class="kenngroessen-grid">
        <div class="kg-card">
          <div class="kg-label">Arithmetisches Mittel (Durchschnitt)</div>
          <div class="kg-value">${kg.mittel}</div>
          <div class="kg-sub">${bezeichnung}</div>
        </div>
        <div class="kg-card">
          <div class="kg-label">Median (Zentralwert)</div>
          <div class="kg-value">${kg.median}</div>
          <div class="kg-sub">mittlerer Wert</div>
        </div>
        <div class="kg-card">
          <div class="kg-label">Spannweite</div>
          <div class="kg-value">${kg.spanne}</div>
          <div class="kg-sub">von ${kg.min} bis ${kg.max}</div>
        </div>
      </div>`;
  }

  /* Helper: rounded rect path */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  return { renderTabelle, renderSaeulen, renderBalken, kenngroessen, renderKenngroessen };
})();
