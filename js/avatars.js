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

  // Hair style generators (returns SVG path data)
  const HAIR_STYLES = [
    // Short spiky
    (cx, cy, r, col) => `
      <ellipse cx="${cx}" cy="${cy - r*0.1}" rx="${r*1.05}" ry="${r*0.75}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
      <polygon points="${cx-r*0.6},${cy-r*0.6} ${cx-r*0.8},${cy-r*1.1} ${cx-r*0.4},${cy-r*0.7}" fill="${col}"/>
      <polygon points="${cx-r*0.1},${cy-r*0.75} ${cx-r*0.2},${cy-r*1.2} ${cx+r*0.15},${cy-r*0.8}" fill="${col}"/>
      <polygon points="${cx+r*0.4},${cy-r*0.65} ${cx+r*0.5},${cy-r*1.1} ${cx+r*0.7},${cy-r*0.7}" fill="${col}"/>`,
    // Long straight
    (cx, cy, r, col) => `
      <ellipse cx="${cx}" cy="${cy - r*0.1}" rx="${r*1.05}" ry="${r*0.75}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
      <rect x="${cx-r*1.0}" y="${cy-r*0.1}" width="${r*0.28}" height="${r*1.1}" rx="6" fill="${col}" stroke="#1a1f3a" stroke-width="2"/>
      <rect x="${cx+r*0.72}" y="${cy-r*0.1}" width="${r*0.28}" height="${r*1.1}" rx="6" fill="${col}" stroke="#1a1f3a" stroke-width="2"/>`,
    // Curly/afro
    (cx, cy, r, col) => `
      <circle cx="${cx}" cy="${cy-r*0.3}" r="${r*0.95}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
      <circle cx="${cx-r*0.7}" cy="${cy-r*0.1}" r="${r*0.45}" fill="${col}" stroke="#1a1f3a" stroke-width="2"/>
      <circle cx="${cx+r*0.7}" cy="${cy-r*0.1}" r="${r*0.45}" fill="${col}" stroke="#1a1f3a" stroke-width="2"/>`,
    // Ponytail
    (cx, cy, r, col) => `
      <ellipse cx="${cx}" cy="${cy - r*0.1}" rx="${r*1.05}" ry="${r*0.75}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
      <ellipse cx="${cx+r*1.1}" cy="${cy+r*0.3}" rx="${r*0.22}" ry="${r*0.55}" fill="${col}" stroke="#1a1f3a" stroke-width="2" transform="rotate(-20,${cx+r*1.1},${cy+r*0.3})"/>`,
    // Buzzcut / very short
    (cx, cy, r, col) => `
      <ellipse cx="${cx}" cy="${cy - r*0.3}" rx="${r*1.0}" ry="${r*0.5}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>`,
    // Bun
    (cx, cy, r, col) => `
      <ellipse cx="${cx}" cy="${cy - r*0.1}" rx="${r*1.05}" ry="${r*0.75}" fill="${col}" stroke="#1a1f3a" stroke-width="2.5"/>
      <circle cx="${cx}" cy="${cy-r*0.85}" r="${r*0.32}" fill="${col}" stroke="#1a1f3a" stroke-width="2"/>`,
  ];

  // Accessories (glasses, hat, etc.) — some kids have them
  const ACCESSORIES = [
    null, null, null, // most kids have none
    // Round glasses
    (cx, cy, r) => `
      <circle cx="${cx-r*0.28}" cy="${cy+r*0.05}" r="${r*0.22}" fill="none" stroke="#1a1f3a" stroke-width="3"/>
      <circle cx="${cx+r*0.28}" cy="${cy+r*0.05}" r="${r*0.22}" fill="none" stroke="#1a1f3a" stroke-width="3"/>
      <line x1="${cx-r*0.06}" y1="${cy+r*0.05}" x2="${cx+r*0.06}" y2="${cy+r*0.05}" stroke="#1a1f3a" stroke-width="2.5"/>`,
    // Cap
    (cx, cy, r) => `
      <ellipse cx="${cx}" cy="${cy-r*0.6}" rx="${r*0.9}" ry="${r*0.25}" fill="#FF6B35" stroke="#1a1f3a" stroke-width="2.5"/>
      <rect x="${cx-r*0.75}" y="${cy-r*0.85}" width="${r*1.5}" height="${r*0.4}" rx="8" fill="#FF6B35" stroke="#1a1f3a" stroke-width="2.5"/>
      <rect x="${cx-r*0.85}" y="${cy-r*0.68}" width="${r*0.25}" height="${r*0.12}" rx="4" fill="#cc4a1a"/>`,
    // Star hairclip
    (cx, cy, r) => `
      <text x="${cx+r*0.55}" y="${cy-r*0.55}" font-size="${r*0.4}" fill="#FFD93D" stroke="#1a1f3a" stroke-width="1">⭐</text>`,
  ];

  // Mouth expressions
  const MOUTHS = [
    // Big smile
    (cx, cy, r) => `<path d="M${cx-r*0.3},${cy+r*0.35} Q${cx},${cy+r*0.6} ${cx+r*0.3},${cy+r*0.35}" fill="none" stroke="#1a1f3a" stroke-width="3" stroke-linecap="round"/>`,
    // Huge grin with teeth
    (cx, cy, r) => `
      <path d="M${cx-r*0.32},${cy+r*0.32} Q${cx},${cy+r*0.62} ${cx+r*0.32},${cy+r*0.32}" fill="#fff" stroke="#1a1f3a" stroke-width="2.5"/>
      <line x1="${cx}" y1="${cy+r*0.32}" x2="${cx}" y2="${cy+r*0.5}" stroke="#1a1f3a" stroke-width="1.5"/>`,
    // Smirk
    (cx, cy, r) => `<path d="M${cx-r*0.1},${cy+r*0.38} Q${cx+r*0.2},${cy+r*0.55} ${cx+r*0.3},${cy+r*0.35}" fill="none" stroke="#1a1f3a" stroke-width="3" stroke-linecap="round"/>`,
    // Surprised O
    (cx, cy, r) => `<ellipse cx="${cx}" cy="${cy+r*0.42}" rx="${r*0.18}" ry="${r*0.14}" fill="#1a1f3a"/>`,
  ];

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
    const hairFn = HAIR_STYLES[srInt(0, HAIR_STYLES.length - 1)];
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
    const body = `
      <rect x="${cx - bodyW/2}" y="${bodyY}" width="${bodyW}" height="${bodyH}"
            rx="12" fill="${shirtC[0]}" stroke="#1a1f3a" stroke-width="3"/>
      <rect x="${cx - bodyW/2}" y="${bodyY}" width="${bodyW}" height="${bodyH*0.35}"
            rx="12" fill="${shirtC[1]}" opacity="0.5"/>
      <rect x="${cx - bodyW*0.62}" y="${bodyY + bodyH*0.1}" width="${bodyW*0.22}" height="${bodyH*0.7}"
            rx="8" fill="${shirtC[0]}" stroke="#1a1f3a" stroke-width="2.5"/>
      <rect x="${cx + bodyW*0.4}"  y="${bodyY + bodyH*0.1}" width="${bodyW*0.22}" height="${bodyH*0.7}"
            rx="8" fill="${shirtC[0]}" stroke="#1a1f3a" stroke-width="2.5"/>`;

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
      ${body}
      ${ears}
      ${hairFn(cx, cy, r, hairC)}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${skin}" stroke="#1a1f3a" stroke-width="3"/>
      ${blush}
      ${freckles}
      ${brows}
      ${eyeFn(cx, cy, r, eyeC)}
      ${nose}
      ${mouthFn(cx, cy, r)}
      ${accFn ? accFn(cx, cy, r) : ''}
    </svg>`;
  }

  return { generate };
})();
