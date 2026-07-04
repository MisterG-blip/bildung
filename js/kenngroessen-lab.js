/* ════════════════════════════════════════
   KENNGRÖSSEN-LABOR  v2
   1) Median     — Drag&Drop sortieren, dann Mitte anklicken
   2) Spannweite — Karten zufällig gemischt, Min dann Max anklicken
   3) Mittelwert — Ausgleichs-Modell mit Viertel-Schritten (0.25)
                   + Live-Anzeige des aktuellen Mittelwerts
   ════════════════════════════════════════ */

const KenngroessenLab = (() => {

  let rawValues   = [];
  let bezeichnung = '';
  let subTab      = 'median';

  /* ── Entry point ── */
  function render(container, daten, label) {
    bezeichnung = label;
    rawValues   = [];
    Object.entries(daten).forEach(([key, count]) => {
      const n = parseFloat(key);
      if (!isNaN(n)) for (let i = 0; i < count; i++) rawValues.push(n);
    });

    if (rawValues.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔢</div>
          <p>Kenngrößen funktionieren nur für <strong>Zahlen-Merkmale</strong>.<br><br>
          Wähle <strong>Geschwister</strong> als Merkmal und erfasse alle Kinder!</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="kg-lab-tabs">
        <button class="kg-lab-tab ${subTab==='median'?'active':''}"     onclick="KenngroessenLab.setSubTab('median')">📐 Median</button>
        <button class="kg-lab-tab ${subTab==='spannweite'?'active':''}" onclick="KenngroessenLab.setSubTab('spannweite')">↔️ Spannweite</button>
        <button class="kg-lab-tab ${subTab==='mittel'?'active':''}"     onclick="KenngroessenLab.setSubTab('mittel')">⚖️ Mittelwert</button>
      </div>
      <div id="kgLabBody"></div>`;

    renderSubTab();
  }

  function setSubTab(tab) {
    subTab = tab;
    document.querySelectorAll('.kg-lab-tab').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderSubTab();
  }

  function renderSubTab() {
    const body = document.getElementById('kgLabBody');
    if (subTab === 'median')      MedianAufgabe.init(body, rawValues, bezeichnung);
    if (subTab === 'spannweite')  SpannweiteAufgabe.init(body, rawValues, bezeichnung);
    if (subTab === 'mittel')      MittelAufgabe.init(body, rawValues, bezeichnung);
  }

  /* ════════════════════════════════════════
     1) MEDIAN — Drag&Drop sortieren, dann Mitte anklicken
     ════════════════════════════════════════ */
  const MedianAufgabe = (() => {
    let karten       = [];  // [{val, id}]
    let reihenfolge  = [];  // ordered list of ids (current sort order)
    let geklickt     = new Set();
    let geloest      = false;
    let dragSrcId    = null;

    function init(container, values, label) {
      karten      = values.map((v, i) => ({ val: v, id: i }));
      reihenfolge = shuffle(karten.map(k => k.id));
      geklickt    = new Set();
      geloest     = false;
      dragSrcId   = null;
      renderAll(container, label);
    }

    function renderAll(container, label) {
      const n = karten.length;
      const istGerade = n % 2 === 0;
      container.innerHTML = `
        <div class="kg-aufgabe-hinweis">
          <strong>Aufgabe:</strong> Bringe alle ${n} Werte per <strong>Drag&nbsp;&amp;&nbsp;Drop</strong>
          in aufsteigende Reihenfolge. Klicke danach auf
          ${istGerade ? 'die <strong>beiden mittleren</strong> Karten' : 'die <strong>mittlere</strong> Karte'}.
        </div>
        <div class="kg-sortier-area" id="sortierArea"></div>
        <div class="kg-sortier-actions">
          <button class="btn btn-mint"  onclick="KenngroessenLab.median.autoSortStep()">↕️ Einen Schritt sortieren</button>
          <button class="btn btn-ghost" onclick="KenngroessenLab.median.mischen()">🔀 Neu mischen</button>
        </div>
        <div class="kg-feedback" id="medianFeedback"></div>
        <div id="medianErgebnis"></div>`;
      renderArea();
    }

    /* Render cards into the sortier area and attach drag handlers */
    function renderArea() {
      const area = document.getElementById('sortierArea');
      if (!area) return;
      area.innerHTML = reihenfolge.map(id => {
        const k = karten.find(k => k.id === id);
        const isMitte = geklickt.has(id);
        return `<div class="kg-karte ${isMitte ? 'kg-karte-mitte' : ''}"
                     draggable="true"
                     data-id="${id}"
                     onclick="KenngroessenLab.median.klick(${id})"
                     ondragstart="KenngroessenLab.median.onDragStart(event,${id})"
                     ondragover="KenngroessenLab.median.onDragOver(event)"
                     ondrop="KenngroessenLab.median.onDrop(event,${id})"
                     ondragend="KenngroessenLab.median.onDragEnd(event)"
                     >${k.val}</div>`;
      }).join('');
    }

    function onDragStart(e, id) {
      dragSrcId = id;
      e.currentTarget.classList.add('kg-karte-dragging');
      e.dataTransfer.effectAllowed = 'move';
    }

    function onDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.currentTarget.classList.add('kg-karte-dragover');
    }

    function onDrop(e, targetId) {
      e.preventDefault();
      e.currentTarget.classList.remove('kg-karte-dragover');
      if (dragSrcId === null || dragSrcId === targetId) return;
      const srcPos    = reihenfolge.indexOf(dragSrcId);
      const targetPos = reihenfolge.indexOf(targetId);
      reihenfolge.splice(srcPos, 1);
      reihenfolge.splice(targetPos, 0, dragSrcId);
      renderArea();
    }

    function onDragEnd(e) {
      dragSrcId = null;
      document.querySelectorAll('.kg-karte-dragging, .kg-karte-dragover')
              .forEach(el => el.classList.remove('kg-karte-dragging', 'kg-karte-dragover'));
    }

    function istSortiert() {
      for (let i = 1; i < reihenfolge.length; i++) {
        if (karten.find(k=>k.id===reihenfolge[i-1]).val >
            karten.find(k=>k.id===reihenfolge[i]).val) return false;
      }
      return true;
    }

    function autoSortStep() {
      for (let i = 0; i < reihenfolge.length - 1; i++) {
        const a = karten.find(k=>k.id===reihenfolge[i]).val;
        const b = karten.find(k=>k.id===reihenfolge[i+1]).val;
        if (a > b) {
          [reihenfolge[i], reihenfolge[i+1]] = [reihenfolge[i+1], reihenfolge[i]];
          renderArea();
          return;
        }
      }
      const fb = document.getElementById('medianFeedback');
      if (fb) { fb.textContent = '✅ Schon vollständig sortiert! Jetzt die Mitte anklicken.'; fb.className = 'kg-feedback richtig'; }
    }

    function mischen() {
      reihenfolge = shuffle(karten.map(k => k.id));
      geklickt    = new Set();
      renderArea();
      const fb = document.getElementById('medianFeedback');
      if (fb) { fb.textContent = ''; fb.className = 'kg-feedback'; }
    }

    function klick(id) {
      if (geloest) return;
      if (!istSortiert()) {
        const fb = document.getElementById('medianFeedback');
        fb.textContent = '⚠️ Erst sortieren! Ziehe die Karten in die richtige Reihenfolge.';
        fb.className = 'kg-feedback falsch';
        return;
      }

      const n = karten.length;
      const istGerade   = n % 2 === 0;
      const mitteIdx    = istGerade ? [n/2-1, n/2] : [Math.floor(n/2)];
      const posInArray  = reihenfolge.indexOf(id);

      if (geklickt.has(id)) { geklickt.delete(id); renderArea(); return; }

      if (mitteIdx.includes(posInArray)) {
        geklickt.add(id);
        renderArea();
        const fb = document.getElementById('medianFeedback');
        const fertig = istGerade ? geklickt.size === 2 : geklickt.size === 1;

        if (fertig) {
          geloest = true;
          const vals   = [...geklickt].map(cid => karten.find(k=>k.id===cid).val).sort((a,b)=>a-b);
          const median = istGerade ? (vals[0]+vals[1])/2 : vals[0];
          fb.textContent = '🏆 Richtig! Das ist die Mitte der sortierten Reihe.';
          fb.className = 'kg-feedback richtig';
          document.getElementById('medianErgebnis').innerHTML = `
            <div class="kg-ergebnis-box">
              ${istGerade
                ? `<div class="kg-rechenweg">Median = (${vals[0]} + ${vals[1]}) ÷ 2 = <strong>${median}</strong></div>`
                : `<div class="kg-rechenweg">Median = <strong>${median}</strong> (mittlerer Wert)</div>`}
            </div>`;
        } else {
          fb.textContent = 'Gut! Jetzt noch die zweite mittlere Karte anklicken.';
          fb.className = 'kg-feedback richtig';
        }
      } else {
        const fb = document.getElementById('medianFeedback');
        fb.textContent = '❌ Das ist nicht die Mitte — zähl nochmal von beiden Seiten rein!';
        fb.className = 'kg-feedback falsch';
      }
    }

    return { init, autoSortStep, mischen, klick, onDragStart, onDragOver, onDrop, onDragEnd };
  })();

  /* ════════════════════════════════════════
     2) SPANNWEITE — Karten gemischt, Min dann Max anklicken
     ════════════════════════════════════════ */
  const SpannweiteAufgabe = (() => {
    let karten   = [];
    let minVal   = null, maxVal = null;
    let gewaehlt = { min: null, max: null };

    function init(container, values, label) {
      // Build cards shuffled (not sorted!)
      const shuffled = shuffle(values.map((v, i) => ({ val: v, id: i })));
      karten   = shuffled;
      minVal   = Math.min(...karten.map(k => k.val));
      maxVal   = Math.max(...karten.map(k => k.val));
      gewaehlt = { min: null, max: null };
      render(container, label);
    }

    function render(container, label) {
      container.innerHTML = `
        <div class="kg-aufgabe-hinweis">
          <strong>Aufgabe:</strong> Die Karten liegen durcheinander — genau wie in echten Daten!
          Klicke zuerst auf den <strong style="color:#4ade80">kleinsten</strong>, dann auf den
          <strong style="color:#f87171">größten</strong> Wert.
        </div>
        <div class="kg-modus-zeile" id="spannModus">
          <span class="kg-modus-tag kg-modus-min active">1️⃣ Kleinsten Wert klicken</span>
          <span class="kg-modus-tag kg-modus-max">2️⃣ Größten Wert klicken</span>
        </div>
        <div class="kg-sortier-area">
          ${karten.map(w => `
            <div class="kg-karte" data-id="${w.id}"
                 onclick="KenngroessenLab.spannweite.klick(${w.id})">${w.val}</div>`).join('')}
        </div>
        <div class="kg-feedback" id="spannFeedback"></div>
        <div id="spannErgebnis"></div>`;
    }

    function klick(id) {
      const karte = karten.find(w => w.id === id);
      const fb    = document.getElementById('spannFeedback');

      if (gewaehlt.min === null) {
        if (karte.val === minVal) {
          gewaehlt.min = karte.val;
          markiere(id, 'min');
          fb.textContent = '✅ Richtig! Das ist der kleinste Wert. Jetzt den größten finden.';
          fb.className = 'kg-feedback richtig';
          const tags = document.querySelectorAll('.kg-modus-tag');
          tags[0].classList.remove('active'); tags[1].classList.add('active');
        } else {
          fb.textContent = '❌ Das ist nicht der kleinste Wert — schau alle Karten an!';
          fb.className = 'kg-feedback falsch';
        }
      } else if (gewaehlt.max === null) {
        if (karte.val === maxVal) {
          gewaehlt.max = karte.val;
          markiere(id, 'max');
          fb.textContent = '🏆 Beide gefunden! Jetzt kommt die Rechnung:';
          fb.className = 'kg-feedback richtig';
          const spanne = gewaehlt.max - gewaehlt.min;
          document.getElementById('spannErgebnis').innerHTML = `
            <div class="kg-ergebnis-box">
              <div class="kg-rechenweg">Spannweite = größter Wert − kleinster Wert<br>
                = ${gewaehlt.max} − ${gewaehlt.min} = <strong>${spanne}</strong></div>
            </div>`;
        } else {
          fb.textContent = '❌ Das ist nicht der größte Wert — nochmal schauen!';
          fb.className = 'kg-feedback falsch';
        }
      }
    }

    function markiere(id, art) {
      const el = document.querySelector(`.kg-sortier-area [data-id="${id}"]`);
      if (el) el.classList.add(art === 'min' ? 'kg-karte-min' : 'kg-karte-max');
    }

    return { init, render, klick };
  })();

  /* ════════════════════════════════════════
     3) MITTELWERT — Ausgleichs-Modell mit 0.25-Schritten
        Live-Anzeige des aktuellen Mittelwerts während des Ziehens.
        Ziel: alle Säulen so nah wie möglich gleich hoch (±0.5 Toleranz).
        Wenn nahe genug: Rechenweg + Erklärung warum kein ganzzahliges Ergebnis.
     ════════════════════════════════════════ */
  const MittelAufgabe = (() => {
    let werte      = [];  // current values (in 0.25 steps)
    let original   = [];
    let mittelwert = 0;
    let geloest    = false;
    let dragState  = null;
    const STEP     = 0.25;  // quarter-unit steps
    const MAX_H    = 220;   // max bar height in px
    const PX_PER_STEP = 12; // px per 0.25 unit of drag

    function init(container, values, label) {
      original   = [...values];
      werte      = values.map(v => v * 1.0); // ensure float
      mittelwert = werte.reduce((a,b)=>a+b,0) / werte.length;
      geloest    = false;
      dragState  = null;
      render(container, label);
    }

    function render(container, label) {
      const maxVal      = Math.max(...original) + 1; // don't include mittelwert, it's always within range
      const liniePx     = pxForVal(mittelwert, maxVal);
      const sum         = werte.reduce((a,b)=>a+b,0);
      const istGanzzahl = Number.isInteger(mittelwert);

      container.innerHTML = `
        <div class="kg-aufgabe-hinweis">
          <strong>Aufgabe:</strong> Ziehe die Säulen so an, dass alle <strong>gleich hoch</strong> sind,
          ohne die Gesamtmenge zu verändern. Die gestrichelte Linie zeigt den <strong>Ziel-Mittelwert</strong>.
          Du kannst in <strong>Viertel-Schritten (0,25)</strong> justieren.
        </div>

        <div class="kg-ausgleich-stage">
          <div class="kg-ausgleich-linie" id="zielLinie" style="bottom:${liniePx}px">
            <span class="kg-linie-label">← Ziel: ${mittelwert.toFixed(2)}</span>
          </div>
          <div class="kg-ausgleich-bars" id="ausgleichBars">
            ${werte.map((v, i) => `
              <div class="kg-ausgleich-col">
                <div class="kg-ausgleich-bar" id="bar-${i}"
                     style="height:${pxForVal(v, maxVal)}px">
                  <div class="kg-bar-handle"
                       onpointerdown="KenngroessenLab.mittel.startDrag(event,${i})"></div>
                  <span class="kg-bar-val" id="barval-${i}">${formatVal(v)}</span>
                </div>
              </div>`).join('')}
          </div>
        </div>
        <div class="kg-ausgleich-labels">
          ${werte.map((v, i) => `<div class="kg-bar-label">Kind ${i+1}</div>`).join('')}
        </div>

        <div style="text-align:center;margin:.5rem 0">
          <span style="font-size:.78rem;color:var(--muted)">Aktueller Durchschnitt: </span>
          <span id="liveAvg" style="font-family:'Fredoka One',cursive;font-size:1.2rem;color:var(--yellow)">${mittelwert.toFixed(2)}</span>
          <span style="font-size:.78rem;color:var(--muted)"> | Ziel: <strong style="color:var(--mint)">${mittelwert.toFixed(2)}</strong></span>
        </div>

        <div class="kg-feedback" id="mittelFeedback">
          Summe aller Werte: <strong>${sum}</strong> für ${werte.length} Kinder
        </div>
        <div class="werkstatt-actions" style="justify-content:center">
          <button class="btn btn-ghost" onclick="KenngroessenLab.mittel.reset()">🔄 Zurücksetzen</button>
        </div>
        <div id="mittelErgebnis"></div>
        ${!istGanzzahl ? `
          <div class="prozent-callout" style="max-width:540px;margin:0 auto">
            💡 <strong>Hinweis:</strong> Der Mittelwert ist <strong>${mittelwert.toFixed(2)}</strong> —
            keine ganze Zahl! Das passiert oft. Komm so nah wie möglich an die gestrichelte Linie.
          </div>` : ''}`;
    }

    function formatVal(v) {
      return Number.isInteger(v) ? String(v) : v.toFixed(2);
    }

    function pxForVal(v, maxVal) {
      return Math.max(4, (v / maxVal) * MAX_H);
    }

    function aktuellerMittelwert() {
      return werte.reduce((a,b)=>a+b,0) / werte.length;
    }

    function startDrag(e, idx) {
      if (geloest) return;
      e.preventDefault();
      dragState = { idx, startY: e.clientY, startVal: werte[idx] };
      document.addEventListener('pointermove', onDrag);
      document.addEventListener('pointerup',   endDrag);
    }

    function onDrag(e) {
      if (!dragState) return;
      const deltaY    = dragState.startY - e.clientY;
      // snap to 0.25 steps
      const rawSteps  = deltaY / PX_PER_STEP;
      const steps     = Math.round(rawSteps * 4) / 4; // round to nearest 0.25
      let   newVal    = Math.round((dragState.startVal + steps) * 4) / 4;
      newVal          = Math.max(0, newVal);
      if (newVal === werte[dragState.idx]) return;

      const trial = redistribute(werte, dragState.idx, newVal);
      if (trial) {
        werte = trial;
        updateBars();
      }
    }

    /* Take/give 0.25 units at a time from the tallest/shortest OTHER bar.
       Guarantees constant sum and no bar goes below 0. */
    function redistribute(current, idx, newVal) {
      const trial = current.map(v => Math.round(v * 4) / 4); // ensure clean 0.25 steps
      let remaining = Math.round((newVal - trial[idx]) * 4); // in quarter-units
      trial[idx] = newVal;
      const others = current.map((_,i)=>i).filter(i=>i!==idx);
      if (others.length === 0) return null;

      let safetyLimit = Math.abs(remaining) * 4 + 10; // prevent infinite loop
      while (remaining !== 0 && safetyLimit-- > 0) {
        if (remaining > 0) {
          const cands = others.filter(i => trial[i] >= STEP);
          if (cands.length === 0) return null;
          const tallest = cands.reduce((a,b) => trial[a] >= trial[b] ? a : b);
          trial[tallest] = Math.round((trial[tallest] - STEP) * 4) / 4;
          remaining--;
        } else {
          const shortest = others.reduce((a,b) => trial[a] <= trial[b] ? a : b);
          trial[shortest] = Math.round((trial[shortest] + STEP) * 4) / 4;
          remaining++;
        }
      }
      return trial;
    }

    function endDrag() {
      dragState = null;
      document.removeEventListener('pointermove', onDrag);
      document.removeEventListener('pointerup',   endDrag);
      checkGeloest();
    }

    function updateBars() {
      const maxVal = Math.max(...original) + 1;
      werte.forEach((v, i) => {
        const bar = document.getElementById('bar-' + i);
        const val = document.getElementById('barval-' + i);
        if (bar) bar.style.height = pxForVal(v, maxVal) + 'px';
        if (val) val.textContent  = formatVal(v);
      });
      // Live avg display
      const liveEl = document.getElementById('liveAvg');
      if (liveEl) liveEl.textContent = aktuellerMittelwert().toFixed(2);
      const fb = document.getElementById('mittelFeedback');
      if (fb && !geloest) {
        const sum = werte.reduce((a,b)=>a+b,0);
        fb.textContent = `Summe aller Werte: ${formatVal(sum)} für ${werte.length} Kinder`;
      }
    }

    function checkGeloest() {
      const avg = aktuellerMittelwert();
      // Toleranz: alle Werte innerhalb 0.5 vom Mittelwert
      const nah = werte.every(v => Math.abs(v - avg) <= 0.5);
      // Und der aktuelle Durchschnitt muss nah am echten Mittelwert sein
      const korrekt = Math.abs(avg - mittelwert) < 0.4;

      if (nah && korrekt && !geloest) {
        geloest = true;
        const sum = original.reduce((a,b)=>a+b,0);
        const fb  = document.getElementById('mittelFeedback');
        if (fb) { fb.textContent = '🏆 Super! Alle Säulen sind ausgeglichen.'; fb.className = 'kg-feedback richtig'; }
        document.querySelectorAll('.kg-ausgleich-bar').forEach(b => b.classList.add('kg-bar-solved'));
        const istGanzzahl = Number.isInteger(mittelwert);
        document.getElementById('mittelErgebnis').innerHTML = `
          <div class="kg-ergebnis-box">
            <div class="kg-rechenweg">
              Mittelwert = Summe ÷ Anzahl = ${sum} ÷ ${original.length} = <strong>${mittelwert.toFixed(2)}</strong>
            </div>
            ${!istGanzzahl ? `<div style="margin-top:.5rem;font-size:.8rem;color:var(--muted)">
              Da ${sum} ÷ ${original.length} keine ganze Zahl ergibt, ist der Mittelwert eine Kommazahl —
              das ist völlig normal!
            </div>` : ''}
          </div>`;
      }
    }

    function reset() {
      const container = document.getElementById('kgLabBody');
      init(container, original, bezeichnung);
    }

    return { init, startDrag, reset };
  })();

  /* ── Utility ── */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return {
    render, setSubTab,
    median:      MedianAufgabe,
    spannweite:  SpannweiteAufgabe,
    mittel:      MittelAufgabe,
  };
})();
