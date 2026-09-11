// src/server/formula-engine/interactions.js
//
// Pair-wise herb-to-herb synergy / caution check across the composed
// formula. Loose first-word name matching against each herb's
// `herb_to_herb_synergy` / `herb_to_herb_caution` fields.
//
// LIFTED VERBATIM from
//   public/find-your-formula/index.html lines 2634–2656.

function checkFormulaPairs(herbs) {
  const synergies = [];
  const cautions  = [];
  function firstWord(name) { return String(name || '').toLowerCase().split(/[\s()]+/).filter(Boolean)[0] || ''; }
  function match(h, target) {
    const key = firstWord(target.name);
    if (!key || key.length < 4) return null;
    const syn = (h.herb_to_herb_synergy || []).find(s => s.toLowerCase().includes(key));
    const cau = (h.herb_to_herb_caution || []).find(s => s.toLowerCase().includes(key));
    return { syn, cau };
  }
  for (let i = 0; i < herbs.length; i++) {
    for (let j = i + 1; j < herbs.length; j++) {
      const m1 = match(herbs[i], herbs[j]);
      const m2 = match(herbs[j], herbs[i]);
      const synNote = (m1 && m1.syn) || (m2 && m2.syn);
      const cauNote = (m1 && m1.cau) || (m2 && m2.cau);
      if (synNote) synergies.push({ a: herbs[i].name, b: herbs[j].name, note: synNote });
      if (cauNote) cautions.push({ a: herbs[i].name, b: herbs[j].name, note: cauNote });
    }
  }
  return { synergies, cautions };
}

module.exports = { checkFormulaPairs };
