// src/server/formula-engine/interactions.js
//
// Pair-wise herb-to-herb synergy / caution check across the composed
// formula. Loose first-word name matching against each herb's
// `herb_to_herb_synergy` / `herb_to_herb_caution` fields.
//
// LIFTED VERBATIM from
//   public/find-your-formula/index.html lines 2634–2656.

// 2026-09-24 — matching was `firstWord(name)` with keys under 4 chars
// dropped entirely. That made 11 of 243 herbs UNMATCHABLE, so any
// caution naming them was invisible to this checker. The list included
// St. John's Wort ("st."), the single most interaction-prone herb in the
// pharmacopeia, plus Dan Shen ("dan"), Red Yeast Rice ("red") and
// He Shou Wu ("he"). A written caution that the engine cannot see is not
// a safety control, it is a comment.
//
// Keys are MULTI-WORD PHRASES plus the original single first word. Phrases
// are specific enough to be safe — 'red yeast rice' cannot collide the way
// bare 'red' would. Deliberately NOT every 4+ char token: that would make
// 'extract', 'root', 'leaf' and 'bark' into match keys and fire on almost
// any prose, which is a worse failure than the one being fixed.
// 2026-09-24 — now takes the HERB, not just its name, so `aliases` count.
// A plant answers to more than one word: Shankhpushpi is also
// Shankhapushpi, Anantmul is also Sariva, Guggulu is also Guggul. Another
// herb's prose naming it by any of those has to match, or the synergy is
// written down and invisible — the Schisandra failure, generalised.
function nameKeys(herb) {
  const names = typeof herb === 'string'
    ? [herb]
    : [herb && herb.name, ...((herb && herb.aliases) || [])];
  const keys = new Set();
  for (const name of names) {
    if (!name) continue;
    collectKeys(String(name).toLowerCase().replace(/\s+/g, ' ').trim(), keys);
  }
  return [...keys];
}

function collectKeys(raw, keys) {
  if (!raw) return;
  const add = s => {
    const v = String(s || '').replace(/[/,]+$/, '').replace(/^[/,]+/, '')
      .replace(/\s+/g, ' ').trim();
    if (v.length >= 4) keys.add(v);
  };
  // Each slash-separated alias, and the whole string, each also with any
  // "(...)" qualifier stripped: 'He Shou Wu / Fo-Ti', 'Amla / Amalaki'.
  const variants = [raw, ...raw.split('/')];
  for (const v of variants) {
    const clean = v.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    add(v);
    add(clean);
    // Progressive multi-word prefixes, so prose naming 'Dan Shen' still
    // matches the record called 'Dan Shen Root Extract'.
    const toks = clean.split(' ').filter(Boolean);
    for (let n = 2; n < toks.length; n++) add(toks.slice(0, n).join(' '));
    // The original single-first-word key, unchanged, 4+ chars only.
    if (toks[0] && toks[0].length >= 4) keys.add(toks[0]);
  }
}

function checkFormulaPairs(herbs) {
  const synergies = [];
  const cautions  = [];
  function match(h, target) {
    const keys = nameKeys(target);
    if (!keys.length) return null;
    const hit = list => (list || []).find(s => {
      const t = String(s).toLowerCase();
      return keys.some(k => t.includes(k));
    });
    return { syn: hit(h.herb_to_herb_synergy), cau: hit(h.herb_to_herb_caution) };
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
