/* ════════════════════════════════════════
   CHARTS & STATISTIK
   ════════════════════════════════════════ */

const Charts = (() => {

  // Shared color palette + numeric sort now live in MathUtils (js/utils.js)
  // so Charts and Werkstatt no longer keep their own copies.
  const COLORS = MathUtils.COLORS;
  const sortEntries = MathUtils.sortEntries;

  /* ── Häufigkeitstabelle ── */
  function renderTabelle(container, daten, titel, showRelativ = false) {
    const entries = sortEntries(daten);
    const gesamt  = entries.reduce((s, [, v]) => s + v, 0);

    let html = `<div class="tabelle-wrap">
      <div class="tabelle-titel">${titel}</div>
      <table class="haeufig-tabelle">
        <thead>
          <tr>
            <th>Merkmal</th>
            <th>Strichliste</th>
            <th>Absolute<br>Häufigkeit</th>
            <th>Relative Häufigkeit</th>
          </tr>
        </thead><tbody>`;

    entries.forEach(([key, val], i) => {
      const pct  = (val / gesamt * 100).toFixed(1);
      const dez  = (val / gesamt).toFixed(2);
      html += `<tr>
        <td><span class="tabelle-dot" style="background:${COLORS[i%COLORS.length]}"></span>${key}</td>
        <td>${renderStriche(val)}</td>
        <td class="zahl-cell">${val}</td>
        <td class="zahl-cell">
          <span class="bruch-wrap"><span class="bruch-zaehler">${val}</span><span class="bruch-strich"></span><span class="bruch-nenner">${gesamt}</span></span>
          <span class="rel-dez">${dez}</span>
          <span class="rel-pct">${pct}%</span>
        </td>
      </tr>`;
    });

    html += `<tr class="gesamt-row">
        <td><strong>Gesamt</strong></td><td></td>
        <td class="zahl-cell"><strong>${gesamt}</strong></td>
        <td class="zahl-cell"><strong>1,00 = 100%</strong></td>
      </tr></tbody></table></div>`;

    container.innerHTML = html;
  }

  /* Strichliste in 5er-Gruppen */
  function renderStriche(n) {
    let html = '<span class="strichliste">';
    const groups = Math.floor(n / 5);
    const rest   = n % 5;
    for (let g = 0; g < groups; g++) html += '<span class="strich-gruppe">||||╱</span> ';
    for (let r = 0; r < rest; r++)   html += '<span class="strich">|</span>';
    html += '</span>';
    return html;
  }

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* Größtmögliche Schriftgröße finden, mit der `text` in `maxWidth` passt */
  function fitFontSize(ctx, text, family, weight, maxWidth, maxSize, minSize) {
    let size = maxSize;
    while (size > minSize) {
      ctx.font = `${weight} ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    return size;
  }

  /* Text ggf. mit „…“ kürzen, bis er in maxWidth passt (pixelgenau, nicht zeichenbasiert) */
  function truncateToWidth(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) {
      t = t.slice(0, -1);
    }
    return t + '…';
  }

  /* Titel oben mittig zeichnen — Basislinie wird anhand der Schriftgröße
     bestimmt, damit der Text bei keiner Canvas-Größe an der Oberkante
     abgeschnitten wird. Gibt die für den Titel benötigte Höhe zurück. */
  function drawTitle(ctx, titel, w) {
    const size = clamp(w * 0.032, 15, 26);
    ctx.font = `bold ${size}px Fredoka One, sans-serif`;
    ctx.fillStyle = '#F0F0FF';
    ctx.textAlign = 'center';
    const baseline = Math.ceil(size * 0.95);
    ctx.fillText(titel, w / 2, baseline);
    return baseline; // Höhe, die vom Titel oben eingenommen wird
  }

  /* ── Säulendiagramm ── */
  function renderSaeulen(canvas, daten, titel, opts = {}) {
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
    canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const entries = sortEntries(daten);
    const gesamt  = entries.reduce((s,[,v])=>s+v,0);
    const vals    = opts.relativ
      ? entries.map(([k,v]) => [k, parseFloat((v/gesamt*100).toFixed(1))])
      : entries;
    const maxVal  = Math.max(...vals.map(([,v])=>v));

    // Title (Höhe zuerst ermitteln, damit padT dynamisch passt)
    const titleH = drawTitle(ctx, titel, w);

    const steps = 5;
    const yLabelSize = clamp(w * 0.02, 10, 15);
    ctx.font = `${yLabelSize}px Nunito, sans-serif`;
    // Breiteste Y-Achsen-Beschriftung messen, damit sie nie seitlich abgeschnitten wird
    let widestYLabel = 0;
    for (let i = 0; i <= steps; i++) {
      const v = maxVal * i / steps;
      const label = opts.relativ ? v.toFixed(1) + '%' : Math.round(v) + '';
      widestYLabel = Math.max(widestYLabel, ctx.measureText(label).width);
    }

    const padL = Math.max(40, Math.ceil(widestYLabel) + 18);
    const padR = 24;
    const padT = titleH + 48;

    // Fächer-Labels: Schriftgröße + Rotation dynamisch bestimmen
    const xLabelFamily = 'Nunito, sans-serif';
    const rawLabels = vals.map(([k]) => k);
    const gapPre = (w - padL - padR) / vals.length;
    let xLabelSize = clamp(Math.min(w * 0.02, gapPre * 0.2), 9, 14);
    ctx.font = `700 ${xLabelSize}px ${xLabelFamily}`;
    const widestXLabel = Math.max(...rawLabels.map(l => ctx.measureText(l).width));
    const rotate = widestXLabel > gapPre * 0.88;

    // Wenn gedreht wird, braucht der Text weniger Breite aber mehr Höhe unten
    const padB = rotate
      ? Math.min(160, 34 + widestXLabel * Math.sin(40 * Math.PI / 180) + 26)
      : 78;

    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const gap    = chartW / vals.length;
    const barW   = Math.min(64, gap * 0.62);

    // Gridlines + y labels
    for (let i = 0; i <= steps; i++) {
      const y = padT + chartH - chartH*i/steps;
      const v = (maxVal * i / steps);
      const label = opts.relativ ? v.toFixed(1)+'%' : Math.round(v)+'';
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke();
      ctx.fillStyle   = 'rgba(255,255,255,0.5)';
      ctx.font        = `${yLabelSize}px Nunito, sans-serif`;
      ctx.textAlign   = 'right';
      ctx.fillText(label, padL-7, y+4);
    }

    // Bars
    vals.forEach(([key, val], i) => {
      const barH  = val/maxVal * chartH;
      const x     = padL + gap*i + gap/2 - barW/2;
      const y     = padT + chartH - barH;
      const color = COLORS[i%COLORS.length];

      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      roundRect(ctx, x+3, y+3, barW, barH, 8); ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, x, y, barW, barH, 8); ctx.fill();
      ctx.strokeStyle = '#1a1f3a'; ctx.lineWidth = 2.5;
      roundRect(ctx, x, y, barW, barH, 8); ctx.stroke();

      // Value on bar
      ctx.fillStyle = '#1a1f3a';
      ctx.font      = `bold ${Math.round(barW*0.34)}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      if (barH > 26) {
        const label = opts.relativ ? val.toFixed(1)+'%' : val+'';
        ctx.fillText(label, x+barW/2, y + Math.min(barH/2+8, barH-7));
      }

      // x label (Fach) — dynamisch skaliert, bei Platzmangel gedreht
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font      = `700 ${xLabelSize}px ${xLabelFamily}`;
      const lbl = rotate ? key : truncateToWidth(ctx, key, gap * 0.92);

      if (rotate) {
        ctx.save();
        ctx.translate(x + barW/2, padT + chartH + 10);
        ctx.rotate(-40 * Math.PI / 180);
        ctx.textAlign = 'right';
        ctx.fillText(lbl, 0, 0);
        ctx.restore();
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(lbl, x+barW/2, padT+chartH+22);
      }
    });

    // Axes
    ctx.strokeStyle = 'rgba(255,211,61,0.75)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(padL, padT-6); ctx.lineTo(padL, padT+chartH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL, padT+chartH); ctx.lineTo(w-padR+6, padT+chartH); ctx.stroke();
    // Arrowheads
    ctx.fillStyle = 'rgba(255,211,61,0.75)';
    ctx.beginPath(); ctx.moveTo(padL-6,padT+8); ctx.lineTo(padL+6,padT+8); ctx.lineTo(padL,padT-6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w-padR-2,padT+chartH-6); ctx.lineTo(w-padR-2,padT+chartH+6); ctx.lineTo(w-padR+10,padT+chartH); ctx.closePath(); ctx.fill();

    // Axis labels
    ctx.fillStyle = '#4ECDC4';
    ctx.font      = `bold ${clamp(w*0.02,11,15)}px Nunito, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(opts.relativ ? 'Relative Häufigkeit (%)' : 'Absolute Häufigkeit', padL+4, padT-14);
    ctx.textAlign = 'right';
    if (opts.achsenTitel) ctx.fillText(opts.achsenTitel, w-padR, h - 10);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${yLabelSize}px Nunito, sans-serif`; ctx.textAlign='right';
    ctx.fillText('0', padL-7, padT+chartH+4);
  }

  /* ── Balkendiagramm (horizontal) ── */
  function renderBalken(canvas, daten, titel, opts = {}) {
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
    canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    const entries = sortEntries(daten);
    const gesamt  = entries.reduce((s,[,v])=>s+v,0);
    const vals    = opts.relativ
      ? entries.map(([k,v]) => [k, parseFloat((v/gesamt*100).toFixed(1))])
      : entries;
    const maxVal  = Math.max(...vals.map(([,v])=>v));

    // Title (Höhe zuerst ermitteln, damit padT dynamisch passt)
    const titleH = drawTitle(ctx, titel, w);

    // Fächer-Labels: Schriftgröße dynamisch, padL anhand der tatsächlich
    // gemessenen Textbreite — mit Obergrenze, damit die Beschriftung nicht
    // die halbe Canvas frisst; zu lange Namen werden pixelgenau gekürzt.
    const rowLabelSize = clamp(w * 0.018, 10, 14);
    ctx.font = `600 ${rowLabelSize}px Nunito, sans-serif`;
    const maxLabelW = w * 0.4;
    const widestRowLabel = Math.min(
      maxLabelW,
      Math.max(...vals.map(([k]) => ctx.measureText(k).width))
    );
    const padL = Math.max(70, Math.ceil(widestRowLabel) + 26);
    const padR = 60, padT = titleH + 48, padB = 60;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const rowH   = chartH / vals.length;
    const barH   = Math.min(rowH*0.62, 42);

    // Vertical gridlines + x scale
    const steps = 5;
    const xLabelSize = clamp(w * 0.018, 10, 14);
    for (let i = 0; i <= steps; i++) {
      const x = padL + chartW*i/steps;
      const v = maxVal * i / steps;
      const label = opts.relativ ? v.toFixed(1)+'%' : Math.round(v)+'';
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x,padT); ctx.lineTo(x,padT+chartH); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `${xLabelSize}px Nunito, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(label, x, padT+chartH+20);
    }

    vals.forEach(([key, val], i) => {
      const bW    = val/maxVal * chartW;
      const y     = padT + rowH*i + (rowH-barH)/2;
      const color = COLORS[i%COLORS.length];

      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.font = `600 ${rowLabelSize}px Nunito, sans-serif`; ctx.textAlign = 'right';
      const lbl = truncateToWidth(ctx, key, padL - 20);
      ctx.fillText(lbl, padL-10, y+barH/2+5);

      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      roundRect(ctx,padL+3,y+3,bW,barH,6); ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx,padL,y,bW,barH,6); ctx.fill();
      ctx.strokeStyle = '#1a1f3a'; ctx.lineWidth = 2;
      roundRect(ctx,padL,y,bW,barH,6); ctx.stroke();

      ctx.fillStyle = '#1a1f3a';
      ctx.font = `bold ${Math.round(barH*0.5)}px Nunito, sans-serif`; ctx.textAlign = 'center';
      if (bW > 32) {
        const valLabel = opts.relativ ? val.toFixed(1)+'%' : val+'';
        ctx.fillText(valLabel, padL+bW/2, y+barH/2+5);
      }
    });

    // Y-axis
    ctx.strokeStyle = 'rgba(255,211,61,0.75)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(padL,padT-6); ctx.lineTo(padL,padT+chartH); ctx.stroke();
    ctx.fillStyle = 'rgba(255,211,61,0.75)';
    ctx.beginPath(); ctx.moveTo(padL-6,padT+4); ctx.lineTo(padL+6,padT+4); ctx.lineTo(padL,padT-8); ctx.closePath(); ctx.fill();
    // X-axis
    ctx.strokeStyle = 'rgba(255,211,61,0.75)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(padL,padT+chartH); ctx.lineTo(padL+chartW+8,padT+chartH); ctx.stroke();
    ctx.fillStyle = 'rgba(255,211,61,0.75)';
    ctx.beginPath(); ctx.moveTo(padL+chartW+2,padT+chartH-6); ctx.lineTo(padL+chartW+2,padT+chartH+6); ctx.lineTo(padL+chartW+14,padT+chartH); ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#4ECDC4';
    ctx.font = `bold ${clamp(w*0.02,11,15)}px Nunito, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(opts.relativ ? 'Relative Häufigkeit (%) →' : 'Absolute Häufigkeit →', padL+chartW/2, padT+chartH+46);
  }

  /* ── Kenngrößen (static display, kept for reference) ── */
  function kenngroessen(daten) {
    const values = [];
    Object.entries(daten).forEach(([key, count]) => {
      const n = parseFloat(key);
      if (!isNaN(n)) for (let i = 0; i < count; i++) values.push(n);
    });
    if (values.length === 0) return null;
    values.sort((a,b)=>a-b);
    const n      = values.length;
    const sum    = values.reduce((a,b)=>a+b,0);
    const mittel = sum/n;
    const median = n%2===0 ? (values[n/2-1]+values[n/2])/2 : values[Math.floor(n/2)];
    const spanne = values[n-1]-values[0];
    return { mittel: mittel.toFixed(2), median, spanne, min: values[0], max: values[n-1] };
  }

  /* Helper */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }

  return { renderTabelle, renderSaeulen, renderBalken, kenngroessen };
})();
