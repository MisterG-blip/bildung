/* ════════════════════════════════════════
   AVATAR GENERATOR — Brawl-Stars Style
   Big head, small body, thick outlines, vivid colors.
   Each avatar is a self-contained SVG string.
   ════════════════════════════════════════ */

const AvatarGen = (() => {

  const SKIN_TONES = ['#FDBCB4','#F1A07A','#C68642','#8D5524','#FFDBB4','#FFE0BD'];
  const HAIR_COLORS = ['#1a0a00','#3d2200','#8B4513','#DAA520','#FF6B35','#A855F7','#EF4444','#22C55E','#3B82F6','#FF6B9D','#e8e8e8','#222'];
  const EYE_COLORS  = ['#1a1a1a','#3B82F6','#22C55E','#8B4513','#A855F7'];

  // Shirt color palettes (vivid, Brawl-Stars like)
  const SHIRT_COLORS = [
    ['#FF6B35','#cc4a1a'], ['#3B82F6','#1d4ed8'], ['#A855F7','#7c3aed'],
    ['#22C55E','#15803d'], ['#EF4444','#b91c1c'], ['#FFD93D','#ca9d0a'],
    ['#FF6B9D','#db2777'], ['#4ECDC4','#0d9488'], ['#F97316','#c2410c'],
    ['#8B5CF6','#6d28d9'],
  ];

  /* ── Haar-System ──────────────────────────────────────────
     Jede Frisur besteht aus zwei Ebenen:
       - back:  liegt HINTER dem Kopf (Zopf, Dutt, Afro-Volumen,
                lange Strähnen). Wird VOR dem Gesichtskreis gezeichnet,
                sichtbar nur dort, wo es über die Kopf-Silhouette hinausragt.
       - front: Pony + Seitenteile + Oberkopf — die einzige Haarpartie,
                die man von vorne wirklich sieht. Wird NACH dem
                Gesichtskreis gezeichnet, bleibt aber immer oberhalb
                der Augenbrauen, damit das Gesicht frei bleibt.
     ─────────────────────────────────────────────────────── */

  // Baut die front-Silhouette: Oberkopf, der an den Schläfen als
  // "Seitenteil" etwas tiefer zu den Ohren herunterreicht, aber in der
  // Mitte klar oberhalb der Augenbrauen (Augenbrauen liegen bei ca. -0.22r bis -0.32r) endet.
  function capPath(cx, cy, r, { top = 1.05, fringe = 0.42, temple = 0.95, sideDip = 0.02 } = {}) {
    return `M ${cx-r*temple},${cy-r*sideDip}
      C ${cx-r*(temple+0.1)},${cy-r*(top*0.55)} ${cx-r*0.72},${cy-r*top} ${cx-r*0.28},${cy-r*(top+0.02)}
      C ${cx-r*0.1},${cy-r*(top+0.04)} ${cx+r*0.1},${cy-r*(top+0.04)} ${cx+r*0.28},${cy-r*(top+0.02)}
      C ${cx+r*0.72},${cy-r*top} ${cx+r*(temple+0.1)},${cy-r*(top*0.55)} ${cx+r*temple},${cy-r*sideDip}
      C ${cx+r*(temple-0.15)},${cy-r*(sideDip+0.05)} ${cx+r*0.62},${cy-r*(sideDip+0.05)} ${cx+r*0.52},${cy-r*(fringe*0.4)}
      C ${cx+r*0.42},${cy-r*fringe} ${cx+r*0.22},${cy-r*(fringe+0.08)} ${cx},${cy-r*(fringe+0.08)}
      C ${cx-r*0.22},${cy-r*(fringe+0.08)} ${cx-r*0.42},${cy-r*fringe} ${cx-r*0.52},${cy-r*(fringe*0.4)}
      C ${cx-r*0.62},${cy-r*(sideDip+0.05)} ${cx-r*(temple-0.15)},${cy-r*(sideDip+0.05)} ${cx-r*temple},${cy-r*sideDip}
      Z`;
  }

  const HAIR_STYLES = [
    // Kurz & spikey
    {
      back: null,
      front: (cx, cy, r, col) => `
        <path d="${capPath(cx, cy, r, { top: 1.02, fringe: 0.4, temple: 0.9, sideDip: 0.05 })}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
        <polygon points="${cx-r*0.5},${cy-r*0.85} ${cx-r*0.62},${cy-r*1.22} ${cx-r*0.26},${cy-r*0.95}" fill="${col}" stroke="#1a1f3a" stroke-width="1.5"/>
        <polygon points="${cx-r*0.08},${cy-r*0.95} ${cx-r*0.14},${cy-r*1.32} ${cx+r*0.16},${cy-r*1.0}" fill="${col}" stroke="#1a1f3a" stroke-width="1.5"/>
        <polygon points="${cx+r*0.28},${cy-r*0.88} ${cx+r*0.4},${cy-r*1.24} ${cx+r*0.54},${cy-r*0.92}" fill="${col}" stroke="#1a1f3a" stroke-width="1.5"/>`
    },
    // Lange glatte Haare
    {
      back: (cx, cy, r, col) => `
        <rect x="${cx-r*1.05}" y="${cy+r*0.05}" width="${r*0.32}" height="${r*1.3}" rx="10" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
        <rect x="${cx+r*0.73}" y="${cy+r*0.05}" width="${r*0.32}" height="${r*1.3}" rx="10" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>`,
      front: (cx, cy, r, col) => `
        <path d="${capPath(cx, cy, r, { top: 1.05, fringe: 0.44, temple: 0.97, sideDip: -0.05 })}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>`
    },
    // Locken/Afro
    {
      back: (cx, cy, r, col) => `
        <circle cx="${cx}" cy="${cy-r*0.35}" r="${r*1.0}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
        <circle cx="${cx-r*0.85}" cy="${cy-r*0.05}" r="${r*0.5}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
        <circle cx="${cx+r*0.85}" cy="${cy-r*0.05}" r="${r*0.5}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>`,
      front: (cx, cy, r, col) => `
        <path d="${capPath(cx, cy, r, { top: 1.1, fringe: 0.42, temple: 0.92, sideDip: 0.1 })}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
        <circle cx="${cx-r*0.5}" cy="${cy-r*0.5}" r="${r*0.18}" fill="${col}" stroke="#1a1f3a" stroke-width="1.5"/>
        <circle cx="${cx-r*0.2}" cy="${cy-r*0.6}" r="${r*0.18}" fill="${col}" stroke="#1a1f3a" stroke-width="1.5"/>
        <circle cx="${cx+r*0.1}" cy="${cy-r*0.6}" r="${r*0.18}" fill="${col}" stroke="#1a1f3a" stroke-width="1.5"/>
        <circle cx="${cx+r*0.4}" cy="${cy-r*0.52}" r="${r*0.18}" fill="${col}" stroke="#1a1f3a" stroke-width="1.5"/>`
    },
    // Zopf
    {
      back: (cx, cy, r, col) => `
        <path d="M ${cx-r*0.9},${cy-r*0.15}
          C ${cx-r*0.95},${cy-r*0.75} ${cx-r*0.4},${cy-r*1.1} ${cx},${cy-r*1.1}
          C ${cx+r*0.4},${cy-r*1.1} ${cx+r*0.95},${cy-r*0.75} ${cx+r*0.9},${cy-r*0.15}
          L ${cx+r*0.8},${cy+r*0.15} L ${cx-r*0.8},${cy+r*0.15} Z" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
        <ellipse cx="${cx+r*1.02}" cy="${cy+r*0.35}" rx="${r*0.2}" ry="${r*0.5}" fill="${col}" stroke="#1a1f3a" stroke-width="2" transform="rotate(-15,${cx+r*1.02},${cy+r*0.35})"/>`,
      front: (cx, cy, r, col) => `
        <path d="${capPath(cx, cy, r, { top: 1.0, fringe: 0.42, temple: 0.88, sideDip: 0.02 })}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>`
    },
    // Kurzhaarschnitt / Buzzcut
    {
      back: null,
      front: (cx, cy, r, col) => `
        <path d="${capPath(cx, cy, r, { top: 1.0, fringe: 0.58, temple: 0.85, sideDip: 0.25 })}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>`
    },
    // Dutt
    {
      back: (cx, cy, r, col) => `
        <circle cx="${cx}" cy="${cy-r*1.05}" r="${r*0.3}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>`,
      front: (cx, cy, r, col) => `
        <path d="${capPath(cx, cy, r, { top: 1.0, fringe: 0.46, temple: 0.9, sideDip: 0.15 })}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>`
    },
  ];

  // Accessories (glasses, hat, etc.) — some kids have them
  const ACCESSORIES = [
    null, null, null, // most kids have none
    // Round glasses
    (cx, cy, r) => `
      <circle cx="${cx-r*0.28}" cy="${cy+r*0.05}" r="${r*0.22}" fill="none" stroke="#1a1f3a" stroke-width="3"/>
      <circle cx="${cx+r*0.28}" cy="${cy+r*0.05}" r="${r*0.22}" fill="none" stroke="#1a1f3a" stroke-width="3"/>
      <line x1="${cx-r*0.06}" y1="${cy+r*0.05}" x2="${cx+r*0.06}" y2="${cy+r*0.05}" stroke="#1a1f3a" stroke-width="2.5"/>`,
    // Star hairclip
    (cx, cy, r) => `
      <text x="${cx+r*0.55}" y="${cy-r*0.55}" font-size="${r*0.4}" fill="#FFD93D" stroke="#1a1f3a" stroke-width="1">⭐</text>`,
  ];

  // Mouth expressions (resting face — no "black hole" mouth here, see YAWN_SHAPE for that)
  const MOUTHS = [
    // Big smile
    (cx, cy, r) => `<path d="M${cx-r*0.3},${cy+r*0.35} Q${cx},${cy+r*0.6} ${cx+r*0.3},${cy+r*0.35}" fill="none" stroke="#1a1f3a" stroke-width="3" stroke-linecap="round"/>`,
    // Huge grin with teeth
    (cx, cy, r) => `
      <path d="M${cx-r*0.32},${cy+r*0.32} Q${cx},${cy+r*0.62} ${cx+r*0.32},${cy+r*0.32}" fill="#fff" stroke="#1a1f3a" stroke-width="2.5"/>
      <line x1="${cx}" y1="${cy+r*0.32}" x2="${cx}" y2="${cy+r*0.5}" stroke="#1a1f3a" stroke-width="1.5"/>`,
    // Smirk
    (cx, cy, r) => `<path d="M${cx-r*0.1},${cy+r*0.38} Q${cx+r*0.2},${cy+r*0.55} ${cx+r*0.3},${cy+r*0.35}" fill="none" stroke="#1a1f3a" stroke-width="3" stroke-linecap="round"/>`,
  ];

  // Offener Mund — wird NICHT als Ruhe-Ausdruck vergeben, sondern nur kurz
  // während der Gähn-Animation eingeblendet (siehe av-mouth-yawn in generate()).
  const YAWN_SHAPE = (cx, cy, r) => `<ellipse cx="${cx}" cy="${cy + r*0.4}" rx="${r*0.16}" ry="${r*0.22}" fill="#3a2420"/>`;

  // Eyes
  const EYES = [
    // Normal happy
    (cx, cy, r, col) => `
      <circle cx="${cx-r*0.28}" cy="${cy+r*0.02}" r="${r*0.2}" fill="#fff" stroke="#1a1f3a" stroke-width="2"/>
      <circle cx="${cx-r*0.24}" cy="${cy+r*0.04}" r="${r*0.11}" fill="${col}"/>
      <circle cx="${cx-r*0.21}" cy="${cy+r*0.01}" r="${r*0.04}" fill="#fff"/>
      <circle cx="${cx+r*0.28}" cy="${cy+r*0.02}" r="${r*0.2}" fill="#fff" stroke="#1a1f3a" stroke-width="2"/>
      <circle cx="${cx+r*0.32}" cy="${cy+r*0.04}" r="${r*0.11}" fill="${col}"/>
      <circle cx="${cx+r*0.35}" cy="${cy+r*0.01}" r="${r*0.04}" fill="#fff"/>`,
    // Squint/happy lines
    (cx, cy, r, col) => `
      <path d="M${cx-r*0.42},${cy+r*0.05} Q${cx-r*0.28},${cy-r*0.08} ${cx-r*0.14},${cy+r*0.05}" fill="none" stroke="#1a1f3a" stroke-width="3" stroke-linecap="round"/>
      <path d="M${cx+r*0.14},${cy+r*0.05} Q${cx+r*0.28},${cy-r*0.08} ${cx+r*0.42},${cy+r*0.05}" fill="none" stroke="#1a1f3a" stroke-width="3" stroke-linecap="round"/>`,
    // Stars
    (cx, cy, r, col) => `
      <text x="${cx-r*0.42}" y="${cy+r*0.12}" font-size="${r*0.38}" fill="${col}" stroke="#1a1f3a" stroke-width="1">★</text>
      <text x="${cx+r*0.1}"  y="${cy+r*0.12}" font-size="${r*0.38}" fill="${col}" stroke="#1a1f3a" stroke-width="1">★</text>`,
  ];

  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  /* Generate one avatar SVG (viewBox 0 0 120 140) */
  function generate(seed) {
    // Seeded random using simple LCG so same seed = same avatar
    let s = seed || Math.floor(Math.random() * 999999);
    function sr() { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }
    function srArr(arr) { return arr[Math.floor(sr() * arr.length)]; }
    function srInt(min, max) { return Math.floor(sr() * (max - min + 1)) + min; }

    const cx = 60, cy = 58, r = 36; // head centre and radius
    const skin   = srArr(SKIN_TONES);
    const hairC  = srArr(HAIR_COLORS);
    const eyeC   = srArr(EYE_COLORS);
    const shirtC = srArr(SHIRT_COLORS);
    const hairStyle = HAIR_STYLES[srInt(0, HAIR_STYLES.length - 1)];
    const mouthFn = MOUTHS[srInt(0, MOUTHS.length - 1)];
    const eyeFn  = EYES[srInt(0, EYES.length - 1)];
    const accFn  = ACCESSORIES[srInt(0, ACCESSORIES.length - 1)];

    // Blushy cheeks (50% chance)
    const blush = sr() > 0.5
      ? `<circle cx="${cx-r*0.52}" cy="${cy+r*0.28}" r="${r*0.2}" fill="rgba(255,120,120,0.25)"/>
         <circle cx="${cx+r*0.52}" cy="${cy+r*0.28}" r="${r*0.2}" fill="rgba(255,120,120,0.25)"/>`
      : '';

    // Freckles (30% chance)
    const freckles = sr() > 0.7
      ? `<circle cx="${cx-r*0.38}" cy="${cy+r*0.2}" r="2" fill="rgba(139,90,43,0.5)"/>
         <circle cx="${cx-r*0.28}" cy="${cy+r*0.26}" r="1.5" fill="rgba(139,90,43,0.5)"/>
         <circle cx="${cx+r*0.28}" cy="${cy+r*0.2}" r="2" fill="rgba(139,90,43,0.5)"/>
         <circle cx="${cx+r*0.38}" cy="${cy+r*0.26}" r="1.5" fill="rgba(139,90,43,0.5)"/>`
      : '';

    // Body (small, Brawl-Stars proportion)
    const bodyW = r * 1.1, bodyH = r * 0.85;
    const bodyY = cy + r * 0.88;
    const armW = bodyW * 0.22, armH = bodyH * 0.7;
    const armLX = cx - bodyW * 0.62, armRX = cx + bodyW * 0.4;
    const armY  = bodyY + bodyH * 0.1;
    // Sehr dezente, individuell versetzte Idle-Bewegung pro Kind (Seed-basiert, damit
    // die Klasse nicht im Gleichschritt "atmet", aber bei Reload gleich bleibt)
    const waveDelay  = (sr() * 6).toFixed(2),  waveDur  = (5 + sr() * 3).toFixed(2);
    const blinkDelay = (sr() * 5).toFixed(2),  blinkDur = (4 + sr() * 3).toFixed(2);
    const yawnDelay  = (sr() * 15).toFixed(2), yawnDur  = (12 + sr() * 8).toFixed(2);
    const bobDelay   = (sr() * 4).toFixed(2),  bobDur   = (3.5 + sr() * 2).toFixed(2);

    const body = `
      <rect x="${cx - bodyW/2}" y="${bodyY}" width="${bodyW}" height="${bodyH}"
            rx="12" fill="${shirtC[0]}" stroke="#1a1f3a" stroke-width="3"/>
      <rect x="${cx - bodyW/2}" y="${bodyY}" width="${bodyW}" height="${bodyH*0.35}"
            rx="12" fill="${shirtC[1]}" opacity="0.5"/>
      <rect x="${armLX}" y="${armY}" width="${armW}" height="${armH}"
            rx="8" fill="${shirtC[0]}" stroke="#1a1f3a" stroke-width="2.5"/>
      <g class="av-arm-right" style="transform-origin:${(armRX+armW/2).toFixed(1)}px ${armY.toFixed(1)}px; animation-delay:-${waveDelay}s; animation-duration:${waveDur}s;">
        <rect x="${armRX}" y="${armY}" width="${armW}" height="${armH}"
              rx="8" fill="${shirtC[0]}" stroke="#1a1f3a" stroke-width="2.5"/>
      </g>`;

    // Ears
    const ears = `
      <circle cx="${cx - r*1.02}" cy="${cy + r*0.08}" r="${r*0.28}" fill="${skin}" stroke="#1a1f3a" stroke-width="2.5"/>
      <circle cx="${cx + r*1.02}" cy="${cy + r*0.08}" r="${r*0.28}" fill="${skin}" stroke="#1a1f3a" stroke-width="2.5"/>`;

    // Nose
    const nose = `<ellipse cx="${cx}" cy="${cy + r*0.22}" rx="${r*0.1}" ry="${r*0.07}" fill="rgba(0,0,0,0.15)"/>`;

    // Eyebrows
    const brows = `
      <path d="M${cx-r*0.42},${cy-r*0.22} Q${cx-r*0.28},${cy-r*0.32} ${cx-r*0.14},${cy-r*0.24}" fill="none" stroke="${hairC}" stroke-width="3" stroke-linecap="round"/>
      <path d="M${cx+r*0.14},${cy-r*0.24} Q${cx+r*0.28},${cy-r*0.32} ${cx+r*0.42},${cy-r*0.22}" fill="none" stroke="${hairC}" stroke-width="3" stroke-linecap="round"/>`;

    return `<svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
      <g class="av-figure" style="animation-delay:-${bobDelay}s; animation-duration:${bobDur}s;">
      ${body}
      ${hairStyle.back ? hairStyle.back(cx, cy, r, hairC) : ''}
      ${ears}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${skin}" stroke="#1a1f3a" stroke-width="3"/>
      ${hairStyle.front(cx, cy, r, hairC)}
      ${blush}
      ${freckles}
      ${brows}
      <g class="av-eyes" style="transform-origin:${cx}px ${cy.toFixed(1)}px; animation-delay:-${blinkDelay}s; animation-duration:${blinkDur}s;">${eyeFn(cx, cy, r, eyeC)}</g>
      ${nose}
      <g class="av-mouth-normal" style="animation-delay:-${yawnDelay}s; animation-duration:${yawnDur}s;">${mouthFn(cx, cy, r)}</g>
      <g class="av-mouth-yawn" style="animation-delay:-${yawnDelay}s; animation-duration:${yawnDur}s;">${YAWN_SHAPE(cx, cy, r)}</g>
      ${accFn ? accFn(cx, cy, r) : ''}
      </g>
    </svg>`;
  }

  return { generate };
})();
