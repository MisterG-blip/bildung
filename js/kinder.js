/* ════════════════════════════════════════
   KINDER-GENERATOR — Klasse 5/6
   Generates 20-25 children with random attributes.
   All text in German, designed for age 10-12.
   ════════════════════════════════════════ */

const KinderGen = (() => {

  const NAMEN_M = ['Leon','Ben','Luca','Felix','Noah','Elias','Jonas','Paul','Max','Tim',
                   'Moritz','Julian','Finn','Nico','David','Jan','Tom','Luis','Erik','Tobias'];
  const NAMEN_W = ['Emma','Mia','Lena','Hannah','Sofia','Laura','Lisa','Lea','Anna','Marie',
                   'Julia','Sarah','Nele','Clara','Jana','Lina','Amelie','Zoe','Maja','Nina'];
  const NAMEN_D = ['Kim','Alex','Robin','Toni','Mika','Jamie','Sasha','Lou','Ari','Yuki'];

  const NACHNAMEN = ['Müller','Schmidt','Weber','Fischer','Wagner','Becker','Schulz','Hoffmann',
                     'Schäfer','Koch','Bauer','Richter','Klein','Wolf','Schröder','Neumann',
                     'Zimmermann','Braun','Krüger','Hartmann'];

  const HAUSTIERE = [
    { name: 'Hund', emoji: '🐕', art: 'einen Hund' },
    { name: 'Katze', emoji: '🐈', art: 'eine Katze' },
    { name: 'Kaninchen', emoji: '🐇', art: 'ein Kaninchen' },
    { name: 'Hamster', emoji: '🐹', art: 'einen Hamster' },
    { name: 'Vogel', emoji: '🦜', art: 'einen Vogel' },
    { name: 'Fisch', emoji: '🐠', art: 'einen Fisch' },
    { name: 'Schildkröte', emoji: '🐢', art: 'eine Schildkröte' },
    { name: 'Meerschweinchen', emoji: '🐾', art: 'ein Meerschweinchen' },
    // Easter Eggs!
    { name: 'Axolotl', emoji: '🦎', art: 'einen Axolotl', easter: true },
    { name: 'Vogelspinne', emoji: '🕷️', art: 'eine Vogelspinne', easter: true },
    { name: 'Minischwein', emoji: '🐷', art: 'ein Minischwein', easter: true },
  ];

  const SCHULWEGE = [
    { art: 'zu Fuß',       emoji: '🚶', label: 'zu Fuß' },
    { art: 'mit dem Fahrrad', emoji: '🚲', label: 'Fahrrad' },
    { art: 'mit dem Bus',  emoji: '🚌', label: 'Bus' },
    { art: 'mit dem Auto', emoji: '🚗', label: 'Auto (Eltern)' },
    { art: 'mit der Bahn', emoji: '🚆', label: 'Bahn' },
    // Easter Egg
    { art: 'mit dem Einrad', emoji: '🎪', label: 'Einrad', easter: true },
    { art: 'mit dem Roller', emoji: '🛴', label: 'Roller' },
  ];

  const LIEBLINGSFAECHER = [
    'Mathe','Sport','Kunst','Musik','Deutsch','Englisch',
    'Sachkunde','Informatik','Geschichte','Biologie',
    // Easter Egg
    'Pause 😄',
  ];

  const HOBBYS = [
    'Fußball','Basketball','Schwimmen','Turnen','Tanzen','Reiten',
    'Zeichnen','Lesen','Zocken','Kochen','Singen','Klettern',
    'Basteln','Fotografieren','Theater spielen','Yoga',
  ];

  // Dialogue templates
  function buildSatz(k, klassenName) {
    const lines = [];
    const jahrgangText = klassenName ? `die ${klassenName}` : 'die 5. Klasse';

    // Greeting
    lines.push(`Hallo! Ich bin ${k.vorname} und ich gehe in ${jahrgangText}.`);

    // Schulweg
    lines.push(`Ich komme ${k.schulweg.art} zur Schule.`);

    // Geschwister
    if (k.geschwister === 0) {
      lines.push(`Ich bin Einzelkind — also ganz alleine mit meinen Eltern!`);
    } else if (k.geschwister === 1) {
      lines.push(`Ich habe ${k.geschwisterArt === 'Bruder' ? 'einen Bruder' : 'eine Schwester'}.`);
    } else {
      lines.push(`Ich habe ${k.geschwister} Geschwister.`);
    }

    // Haustiere
    if (k.haustiere.length === 0) {
      lines.push(`Leider habe ich kein Haustier. Ich würde so gerne ${Math.random()>0.5?'einen Hund':'eine Katze'} haben!`);
    } else if (k.haustiere.length === 1) {
      lines.push(`Ich habe ${k.haustiere[0].art}.`);
      if (k.haustiere[0].easter) {
        lines.push(`Alle finden das total verrückt! 😅`);
      }
    } else {
      lines.push(`Ich habe ${k.haustiere.map(h=>h.art).join(', und ')}. Bei uns zu Hause ist immer was los!`);
    }

    // Lieblingsfach
    lines.push(`Mein Lieblingsfach ist ${k.lieblingsfach}.`);
    if (k.lieblingsfach === 'Pause 😄') {
      lines.push(`Okay, das zählt vielleicht nicht wirklich...`);
    }

    // Hobby
    lines.push(`In meiner Freizeit mache ich am liebsten ${k.hobby}.`);

    return lines;
  }

  function rnd(arr)       { return arr[Math.floor(Math.random() * arr.length)]; }
  function rndInt(a, b)   { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function rndBool(p=0.5) { return Math.random() < p; }

  function generateKind(id, klassenName) {
    // Gender: 45% m, 45% w, 10% divers
    const r = Math.random();
    const geschlecht = r < 0.45 ? 'm' : r < 0.9 ? 'w' : 'd';
    const vorname = geschlecht === 'm' ? rnd(NAMEN_M)
                  : geschlecht === 'w' ? rnd(NAMEN_W)
                  : rnd(NAMEN_D);
    const nachname = rnd(NACHNAMEN);

    // Haustiere: 0-3, with low chance for easter eggs
    const numHaustiere = rndInt(0, 2);
    const haustierPool = Math.random() < 0.08
      ? HAUSTIERE  // include easter eggs
      : HAUSTIERE.filter(h => !h.easter);
    const haustiere = [];
    const usedH = new Set();
    for (let i = 0; i < numHaustiere; i++) {
      let h;
      let tries = 0;
      do { h = rnd(haustierPool); tries++; } while (usedH.has(h.name) && tries < 10);
      if (!usedH.has(h.name)) { haustiere.push(h); usedH.add(h.name); }
    }

    // Schulweg: easter egg (Einrad) very rare
    const schulwegPool = Math.random() < 0.04
      ? SCHULWEGE
      : SCHULWEGE.filter(s => !s.easter);
    const schulweg = rnd(schulwegPool);

    const geschwister = rndInt(0, 4);
    const geschwisterArt = rndBool() ? 'Bruder' : 'Schwester';

    const lieblingsfach = Math.random() < 0.05
      ? 'Pause 😄'
      : rnd(LIEBLINGSFAECHER.filter(f => f !== 'Pause 😄'));

    const hobby = rnd(HOBBYS);

    // Avatar seed based on id for consistency within a session
    const avatarSeed = id * 7919 + Math.floor(Math.random() * 1000);

    const kind = {
      id, vorname, nachname, geschlecht,
      haustiere, schulweg, geschwister, geschwisterArt,
      lieblingsfach, hobby, avatarSeed,
    };
    kind.saetze = buildSatz(kind, klassenName);
    return kind;
  }

  function generateKlasse(anzahl, klassenName) {
    // Avoid duplicate first names
    const used = new Set();
    const kinder = [];
    let id = 1;
    while (kinder.length < anzahl) {
      const k = generateKind(id++, klassenName);
      if (!used.has(k.vorname)) {
        used.add(k.vorname);
        kinder.push(k);
      }
    }
    // Sort alphabetically by last name (like a real class register)
    return kinder.sort((a, b) => a.nachname.localeCompare(b.nachname));
  }

  // Derive statistics from a class
  function statistik(kinder) {
    return {
      schulwege:     groupBy(kinder, k => k.schulweg.label),
      haustierTypes: groupByHaustier(kinder),
      geschwister:   groupBy(kinder, k => String(k.geschwister)),
      faecher:       groupBy(kinder, k => k.lieblingsfach),
      hatHaustier:   { 'Ja': kinder.filter(k=>k.haustiere.length>0).length,
                       'Nein': kinder.filter(k=>k.haustiere.length===0).length },
    };
  }

  function groupBy(arr, fn) {
    const map = {};
    arr.forEach(item => {
      const key = fn(item);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }

  function groupByHaustier(kinder) {
    const map = {};
    kinder.forEach(k => {
      k.haustiere.forEach(h => {
        map[h.name] = (map[h.name] || 0) + 1;
      });
    });
    return map;
  }

  return { generateKlasse, statistik };
})();
