/* ════════════════════════════════════════
   DIAGRAMM-WERKSTATT v2
   - Strichlisten-Sidebar neben dem Koordinatensystem
   - Toggle: absolute Häufigkeit / relative Häufigkeit (%)
   - Drag&Drop Balken ins SVG-Koordinatensystem
   ════════════════════════════════════════ */

const Werkstatt = (() => {

  // Shared color palette + numeric sort now live in MathUtils (js/utils.js)
  // so Charts and Werkstatt no longer keep their own copies.
  const COLORS = MathUtils.COLORS;
  const sortEntries = MathUtils.sortEntries;

  let state    = null;
  let relativ  = false; // false = absolute, true = relative Häufigkeit
  let activeKey  = null;
  let ghostEl    = null;

  function render(container, daten, merkmal) {
    const raw = Object.entries(daten).filter(([,v])=>v>0);
    if (raw.length===0) {
      container.innerHTML='<div class="empty-state"><div class="empty-icon">🛠️</div><p>Erfasse zuerst alle Kinder in der Strichliste!</p></div>';
      return;
    }
    const entries = sortEntries(raw);
    const gesamt  = entries.reduce((s,[,v])=>s+v,0);
    const yMax    = relativ ? 100 : niceMax(Math.max(...entries.map(([,v])=>v)));

    state = { entries, gesamt, yMax, placed:{}, merkmal };

    container.innerHTML = `
      <div class="werkstatt-wrap">
        <div class="werkstatt-hinweis">
          Ziehe jeden Balken an die <strong>richtige Stelle</strong> im Koordinatensystem —
          achte auf die Beschriftung der y-Achse!
        </div>

        <div style="display:flex;gap:.6rem;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:.5rem">
          <span style="font-size:.85rem;color:var(--muted)">Diagrammart:</span>
          <button class="btn ${!relativ?'btn-yellow':'btn-ghost'}" onclick="Werkstatt.setRelativ(false)">Absolute Häufigkeit</button>
          <button class="btn ${relativ?'btn-mint':'btn-ghost'}" onclick="Werkstatt.setRelativ(true)">Relative Häufigkeit (%)</button>
        </div>

        <div class="werkstatt-layout">
          <div class="werkstatt-left">
            <div class="werkstatt-strichliste">
              <div class="werkst-sl-titel">📋 Strichliste</div>
              <table class="werkst-sl-table">
                <thead>
                  <tr>
                    <th>Merkmal</th>
                    <th>Strichliste</th>
                    <th>Absolute<br>Häufigkeit</th>
                    <th>Relative<br>Häufigkeit</th>
                  </tr>
                </thead>
                <tbody>
                  ${entries.map(([key,val],i)=>`
                  <tr>
                    <td class="werkst-sl-key" style="color:${COLORS[i%COLORS.length]}">${key}</td>
                    <td class="werkst-sl-striche">${renderStriche(val)}</td>
                    <td class="werkst-sl-num">${val}</td>
                    <td class="werkst-sl-num">
                      <span class="rel-zeile">
                        <span class="bruch-wrap"><span class="bruch-zaehler">${val}</span><span class="bruch-strich"></span><span class="bruch-nenner">${gesamt}</span></span>
                        <span class="rel-gleich">=</span>
                        <span class="rel-dez">${(val/gesamt).toFixed(2).replace('.', ',')}</span>
                        <span class="rel-gleich">=</span>
                        <span class="rel-pct">${(val/gesamt*100).toFixed(1).replace('.', ',')}%</span>
                      </span>
                    </td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
            <div class="werkbank" id="werkbank">
              <div class="werkst-sl-titel">🧱 Werkbank</div>
              ${entries.map(([key,val],i)=>{
                const dispVal = relativ ? (val/gesamt*100).toFixed(1)+'%' : val;
                return `<div class="werk-block" id="werkblock-${cssKey(key)}" data-key="${key}" data-val="${val}">
                  <div class="werk-block-bar" style="background:${COLORS[i%COLORS.length]}">${dispVal}</div>
                  <div class="werk-block-label">${key}</div>
                </div>`;
              }).join('')}
            </div>
          </div>
          <div class="koordinatensystem-wrap">
            <svg id="koordSystem" viewBox="0 0 580 440" xmlns="http://www.w3.org/2000/svg"></svg>
          </div>
        </div>

        <div class="werkstatt-feedback" id="werkstattFeedback"></div>
        <div class="werkstatt-actions">
          <button class="btn btn-ghost" onclick="Werkstatt.reset()">🔄 Zurücksetzen</button>
        </div>
      </div>`;

    drawKoordSystem();
    attachDragHandlers();
  }

  function renderStriche(n) {
    let s = '';
    const groups = Math.floor(n/5), rest = n%5;
    for(let g=0;g<groups;g++) s+='<span class="strich-gruppe">||||╱</span> ';
    for(let r=0;r<rest;r++)   s+='<span class="strich">|</span>';
    return s;
  }

  function cssKey(k){ return String(k).replace(/[^a-zA-Z0-9]/g,'_'); }

  function niceMax(v){
    for(const s of [5,10,15,20,25,30,40,50,60,80,100]) if(v<=s) return s;
    return Math.ceil(v/10)*10+10;
  }

  function setRelativ(val){
    relativ = val;
    const container = document.getElementById('auswertContent');
    if(container && state) render(container, Object.fromEntries(state.entries), state.merkmal);
  }

  /* ── SVG Koordinatensystem ── */
  const PAD_L=70, PAD_R=20, PAD_T=30, PAD_B=60;
  const SVG_W=580, SVG_H=440;

  function drawKoordSystem(){
    const svg = document.getElementById('koordSystem');
    if(!svg||!state) return;
    const {entries,gesamt,yMax}=state;
    const chartW=SVG_W-PAD_L-PAD_R, chartH=SVG_H-PAD_T-PAD_B;
    const slotW=chartW/entries.length;
    const barW=Math.min(62,slotW*0.56);
    let s='';

    // gridlines + y labels
    const steps=5;
    for(let i=0;i<=steps;i++){
      const v   = yMax*i/steps;
      const y   = PAD_T+chartH - chartH*i/steps;
      const lbl = relativ ? v.toFixed(0)+'%' : Math.round(v)+'';
      s+=`<line x1="${PAD_L}" y1="${y}" x2="${SVG_W-PAD_R}" y2="${y}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>`;
      s+=`<text x="${PAD_L-8}" y="${y+4}" fill="rgba(255,255,255,0.55)" font-size="13" text-anchor="end" font-family="Nunito,sans-serif">${lbl}</text>`;
    }

    // Drop zones + ghost outlines + x labels
    entries.forEach(([key,val],i)=>{
      const slotX=PAD_L+slotW*i, cx=slotX+slotW/2;
      const dispVal = relativ ? val/gesamt*100 : val;
      const correctH = (dispVal/yMax)*chartH;

      s+=`<rect class="koord-droptarget" id="drop-${cssKey(key)}"
              x="${slotX+2}" y="${PAD_T}" width="${slotW-4}" height="${chartH}"
              data-key="${key}" rx="6" fill="transparent"/>`;

      s+=`<rect x="${cx-barW/2}" y="${PAD_T+chartH-correctH}" width="${barW}" height="${correctH}"
              fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-dasharray="5,4" rx="4"
              id="ghost-${cssKey(key)}"/>`;

      s+=`<text x="${cx}" y="${PAD_T+chartH+20}" fill="rgba(255,255,255,0.85)" font-size="13" font-weight="700" text-anchor="middle" font-family="Nunito,sans-serif">${key}</text>`;
    });

    // Axes
    s+=`<line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T+chartH}" stroke="rgba(255,211,61,0.75)" stroke-width="2.5"/>`;
    s+=`<line x1="${PAD_L}" y1="${PAD_T+chartH}" x2="${SVG_W-PAD_R}" y2="${PAD_T+chartH}" stroke="rgba(255,211,61,0.75)" stroke-width="2.5"/>`;
    s+=`<polygon points="${PAD_L-6},${PAD_T+8} ${PAD_L+6},${PAD_T+8} ${PAD_L},${PAD_T-4}" fill="rgba(255,211,61,0.75)"/>`;
    s+=`<polygon points="${SVG_W-PAD_R-8},${PAD_T+chartH-6} ${SVG_W-PAD_R-8},${PAD_T+chartH+6} ${SVG_W-PAD_R+4},${PAD_T+chartH}" fill="rgba(255,211,61,0.75)"/>`;
    s+=`<text x="${PAD_L+4}" y="${PAD_T-12}" fill="#4ECDC4" font-size="13" font-weight="800" font-family="Nunito,sans-serif">${relativ?'Relative Häufigkeit (%)':'Absolute Häufigkeit'}</text>`;
    s+=`<text x="${SVG_W-PAD_R}" y="${PAD_T+chartH+50}" fill="#4ECDC4" font-size="12" font-weight="800" text-anchor="end" font-family="Nunito,sans-serif">${state.merkmal.label?state.merkmal.label.replace(/^\S+\s/,''):''}</text>`;
    s+=`<text x="${PAD_L-8}" y="${PAD_T+chartH+4}" fill="rgba(255,255,255,0.45)" font-size="13" text-anchor="end" font-family="Nunito,sans-serif">0</text>`;

    svg.innerHTML=s;
  }

  function attachDragHandlers(){
    document.querySelectorAll('.werk-block').forEach(b=>{
      b.addEventListener('pointerdown', onPointerDown);
    });
  }

  function onPointerDown(e){
    const block=e.currentTarget;
    if(block.classList.contains('placed')) return;
    activeKey=block.dataset.key;
    ghostEl=block.cloneNode(true);
    ghostEl.style.cssText=`position:fixed;pointer-events:none;z-index:999;left:${e.clientX-25}px;top:${e.clientY-25}px;opacity:.9;`;
    document.body.appendChild(ghostEl);
    block.classList.add('dragging');
    document.addEventListener('pointermove',onPointerMove);
    document.addEventListener('pointerup',onPointerUp);
  }

  function onPointerMove(e){
    if(!ghostEl) return;
    ghostEl.style.left=e.clientX-25+'px';
    ghostEl.style.top =e.clientY-25+'px';
    document.querySelectorAll('.koord-droptarget').forEach(d=>d.classList.remove('drag-over'));
    const el=document.elementFromPoint(e.clientX,e.clientY);
    const dt=el?.closest?.('.koord-droptarget');
    if(dt) dt.classList.add('drag-over');
  }

  function onPointerUp(e){
    document.removeEventListener('pointermove',onPointerMove);
    document.removeEventListener('pointerup',onPointerUp);
    document.querySelectorAll('.koord-droptarget').forEach(d=>d.classList.remove('drag-over'));
    const el=document.elementFromPoint(e.clientX,e.clientY);
    const dt=el?.closest?.('.koord-droptarget');
    const src=document.getElementById('werkblock-'+cssKey(activeKey));
    if(src) src.classList.remove('dragging');
    if(ghostEl){ghostEl.remove();ghostEl=null;}
    if(dt) handleDrop(activeKey,dt.dataset.key);
    activeKey=null;
  }

  function handleDrop(dragKey,targetKey){
    const fb=document.getElementById('werkstattFeedback');
    if(dragKey===targetKey){
      placeBar(dragKey);
      fb.textContent='✅ Richtig platziert!'; fb.className='werkstatt-feedback richtig';
      const src=document.getElementById('werkblock-'+cssKey(dragKey));
      if(src) src.classList.add('placed');
      if(state.entries.every(([k])=>state.placed[k])){
        setTimeout(()=>{fb.textContent='🏆 Super! Du hast das Diagramm selbst gebaut!';},500);
      }
    } else {
      fb.textContent='❌ Falsche Spalte — schau auf die Beschriftung!'; fb.className='werkstatt-feedback falsch';
    }
  }

  function placeBar(key){
    if(state.placed[key]) return;
    state.placed[key]=true;
    const idx=state.entries.findIndex(([k])=>k===key);
    const val=state.entries[idx][1];
    const dispVal=relativ ? val/state.gesamt*100 : val;
    const color=COLORS[idx%COLORS.length];
    const chartW=SVG_W-PAD_L-PAD_R, chartH=SVG_H-PAD_T-PAD_B;
    const slotW=chartW/state.entries.length;
    const barW=Math.min(62,slotW*0.56);
    const cx=PAD_L+slotW*idx+slotW/2;
    const barH=(dispVal/state.yMax)*chartH;
    const barY=PAD_T+chartH-barH;
    const svg=document.getElementById('koordSystem');
    const ghost=document.getElementById('ghost-'+cssKey(key));
    if(ghost) ghost.remove();
    const ns='http://www.w3.org/2000/svg';
    const rect=document.createElementNS(ns,'rect');
    rect.setAttribute('x',cx-barW/2); rect.setAttribute('y',PAD_T+chartH);
    rect.setAttribute('width',barW);  rect.setAttribute('height',0);
    rect.setAttribute('fill',color);  rect.setAttribute('stroke','#1a1f3a');
    rect.setAttribute('stroke-width','2.5'); rect.setAttribute('rx','6');
    svg.appendChild(rect);
    const txt=document.createElementNS(ns,'text');
    txt.setAttribute('x',cx); txt.setAttribute('y',barY-10);
    txt.setAttribute('font-size','14'); txt.setAttribute('font-weight','800');
    txt.setAttribute('text-anchor','middle'); txt.setAttribute('opacity','0');
    txt.setAttribute('fill','rgba(255,255,255,0.95)');
    txt.textContent=relativ ? dispVal.toFixed(1)+'%' : val;
    svg.appendChild(txt);
    requestAnimationFrame(()=>{
      rect.style.transition='height .45s cubic-bezier(0.34,1.56,0.64,1),y .45s cubic-bezier(0.34,1.56,0.64,1)';
      rect.setAttribute('y',barY); rect.setAttribute('height',barH);
      txt.style.transition='opacity .3s ease .35s'; txt.style.opacity='1';
    });
  }

  function reset(){
    const container=document.getElementById('auswertContent');
    if(container&&state) render(container,Object.fromEntries(state.entries),state.merkmal);
  }

  return { render, reset, setRelativ };
})();
