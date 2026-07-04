/* ════════════════════════════════════════
   MATH-UTILS — Shared helpers
   Used identically by Charts and Werkstatt (and any
   future module that needs a consistent color palette
   or numeric-aware sorting of Strichliste-Daten).
   ════════════════════════════════════════ */

const MathUtils = (() => {

  // Shared color palette for bars, dots, chips across all diagrams
  const COLORS = ['#FFD93D','#FF6B35','#4ECDC4','#A855F7','#FF6B9D','#3B82F6','#22C55E','#EF4444','#F97316','#8B5CF6'];

  function colorFor(i) {
    return COLORS[i % COLORS.length];
  }

  // Sorts [key, value] entries numerically when keys are numbers,
  // otherwise keeps insertion order. Accepts either an entries array
  // or a plain "daten" object.
  function sortEntries(entriesOrDaten) {
    const entries = Array.isArray(entriesOrDaten)
      ? entriesOrDaten
      : Object.entries(entriesOrDaten);
    return [...entries].sort((a, b) => {
      const na = parseFloat(a[0]), nb = parseFloat(b[0]);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return 0;
    });
  }

  return { COLORS, colorFor, sortEntries };
})();
