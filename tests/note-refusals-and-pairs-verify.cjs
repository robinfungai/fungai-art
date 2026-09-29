// tests/note-refusals-and-pairs-verify.cjs
//
// Engine 2.8 (2026-09-29, Robin + the external audit's ninth finding):
//   A · What the note refuses is kept out of the bottle — named herbs
//       (English and German) and effects ("no caffeine", "nothing
//       sedating", "no mushrooms") — while needs written with a negation
//       ("can't sleep", "no energy") refuse nothing.
//   B · MYCO's own reading of the note (noteAvoid) is a hard exclusion:
//       MYCO may not pick those herbs, and the deterministic bottle it
//       falls back to is rebuilt without them.
//   C · Pair rules (pair-rules.js): BLOCK pairs never share a bottle,
//       CONDITIONAL pairs never under their safety answer — in the
//       picker, in the MYCO validator, across a grid of profiles.
//
// No network: MYCO is a stand-in that answers from the shortlist it is sent.

const path = require('path');
const R = p => require(path.join(__dirname, '..', p));
const E = R('src/server/formula-engine/index.js');
const { ensurePool } = R('src/server/formula-engine/axes.js');
const { detectNoteHerbAvoidance, detectNoteEffectAvoidance } = R('src/server/formula-engine/note-safety.js');
const { newLoad, seat, seatBlocker } = R('src/server/formula-engine/rules.js');
const { PAIR_RULES } = R('src/server/formula-engine/pair-rules.js');
const { validateMycoProposal } = R('src/server/formula-engine/myco-validator.js');

const results = [];
const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });

let pool = ensurePool(); if (!Array.isArray(pool)) pool = pool.herbs || Object.values(pool);
const byName = n => pool.find(h => h.name === n);
const byId = id => pool.find(h => String(h.id) === String(id));

// ── A · the note ─────────────────────────────────────────────────
const REFUSE = [
  ["I don't want valerian", ['Valerian'], []],
  ['no kava please', ['Kava Kava'], []],
  ['Please leave out the ashwagandha', ['Ashwagandha'], []],
  ['something without valerian', ['Valerian'], []],
  ['I would rather not have rhodiola', ['Rhodiola'], []],
  ['I used to take ashwagandha and it made me anxious', ['Ashwagandha'], []],
  ["I don't need ginseng", ['Ginseng'], []],
  ['bitte ohne Baldrian', ['Valerian'], []],
  ['kein Johanniskraut', ["St. John's Wort"], []],
  ['ich vertrage keine Kamille', ['Chamomile'], []],
  ['no caffeine', [], ['stimulating']],
  ['caffeine-free please', [], ['stimulating']],
  ["I don't want anything stimulating", [], ['stimulating']],
  ["I don't want to feel wired", [], ['stimulating']],
  ['nothing that makes me drowsy during the day', [], ['sedating']],
  ['not too sedating', [], ['sedating']],
  ['no mushrooms', [], ['mushroom']],
  ["I don't want anything psychoactive", [], ['psychoactive']],
  ['ohne Koffein bitte', [], ['stimulating']],
  ['keine Pilze', [], ['mushroom']],
  ['koffeinfrei', [], ['stimulating']],
];
const NEEDS = [
  "I can't sleep", 'no energy at all', "I'm sleepy all day and wired at night", 'nothing helps my anxiety',
  "I don't want to feel tired all the time", 'valerian helped me a lot', 'Baldrian hilft mir gut',
  'I love reishi and lions mane', "I can't sleep without melatonin, so something with valerian", 'I drink a lot of coffee',
];
for (const [note, herbs, effects] of REFUSE) {
  const gotH = detectNoteHerbAvoidance(note, pool).map(h => h.name);
  const gotE = detectNoteEffectAvoidance(note, pool).map(e => e.effect);
  check('refuses: "' + note + '"', herbs.every(h => gotH.includes(h)) && effects.every(e => gotE.includes(e)),
    'herbs ' + (gotH.join(', ') || '—') + ' · effects ' + (gotE.join(', ') || '—'));
}
for (const note of NEEDS) {
  const gotH = detectNoteHerbAvoidance(note, pool).map(h => h.name);
  const gotE = detectNoteEffectAvoidance(note, pool).map(e => e.effect);
  check('refuses nothing: "' + note + '"', !gotH.length && !gotE.length, 'herbs ' + (gotH.join(', ') || '—') + ' · effects ' + (gotE.join(', ') || '—'));
}

const base = {
  intention: 'energy', intentions: ['energy', 'cognitive'], pattern: 'depleted', time: 'morning', stress: 'push',
  duration: 'months', age: '25_40', sleep: 'restorative_6plus', avoid: ['none'], _ageConfirmed: true,
};
const P = R('src/server/formula-engine/pharmacology.js');
{
  const f = E.compileFormula({ ...base, notes: 'no caffeine please, nothing stimulating' });
  const stim = (f.herbs || []).filter(h => { const x = byId(h.id); return P.isCNSStimulant(x) || P.isStrongStimulant(x); });
  check('an energy bottle with "no caffeine" holds no stimulating herb', f.status === 'ok' ? !stim.length : f.status === 'no_match', f.status + ' · ' + stim.map(h => h.name).join(', '));
  check('… and the reveal names what it left out', (f.noteSafety && f.noteSafety.herbsAvoided || []).some(x => x.name === 'anything stimulating'), JSON.stringify(f.noteSafety && f.noteSafety.herbsAvoided));
}
{
  const sleep = { ...base, intention: 'sleep', intentions: ['sleep'], time: 'night' };
  const f = E.compileFormula({ ...sleep, notes: 'ohne Baldrian bitte' });
  check('"ohne Baldrian" → no Valerian in a sleep bottle', f.status === 'ok' && !(f.herbs || []).some(h => h.name === 'Valerian'), (f.herbs || []).map(h => h.name).join(', '));
}

// ── B · MYCO's own reading ───────────────────────────────────────
function mycoStandIn({ pickFirst = 5, refuse = [] }) {
  return async (url, init) => {
    const body = JSON.parse(init.body);
    const text = body.messages[0].content;
    const ids = [...text.matchAll(/\bid=([A-Za-z0-9_-]+)/g)].map(m => m[1]);
    const refused = refuse.map(fn => fn(ids)).flat();
    const load = newLoad([]); const picks = [];
    for (const id of ids) {
      const h = byId(id);
      if (!h || refused.includes(id) || picks.length >= pickFirst || seatBlocker(load, h)) continue;
      seat(load, h); picks.push(id);
    }
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify({
      picked: picks.map(id => ({ id, reason: 'stand-in' })), noteAvoid: refused, overall: 'stand-in reading',
    }) }] }) };
  };
}
(async () => {
  const sleep = { ...base, intention: 'sleep', intentions: ['sleep'], time: 'night', notes: 'please, the one I tried last year was awful' };
  const baseline = E.compileFormula(sleep);
  const target = baseline.herbs && baseline.herbs[0];

  // MYCO understands a refusal the rules did not catch: the herb leaves
  // MYCO's picks AND the fallback.
  const r1 = await E.composeFormulaWithMyco(sleep, { apiKey: 'x', fetchImpl: mycoStandIn({ refuse: [() => [String(target.id)]] }) });
  check('MYCO noteAvoid → that herb is not in the bottle', r1.status === 'ok' && !r1.herbs.some(h => String(h.id) === String(target.id)), target.name + ' · ' + (r1.herbs || []).map(h => h.name).join(', '));
  check('… and the reveal says MYCO read it', (r1.noteSafety.herbsAvoided || []).some(x => x.name === target.name && /MYCO/.test(x.word)), JSON.stringify(r1.noteSafety.herbsAvoided));

  // MYCO names a refusal and picks it anyway → rejected, and the
  // fallback bottle is rebuilt without it.
  const sneaky = async (url, init) => {
    const text = JSON.parse(init.body).messages[0].content;
    const ids = [...text.matchAll(/\bid=([A-Za-z0-9_-]+)/g)].map(m => m[1]);
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify({
      picked: ids.slice(0, 5).map(id => ({ id, reason: 'x' })), noteAvoid: [String(target.id)], overall: 'x' }) }] }) };
  };
  const r2 = await E.composeFormulaWithMyco(sleep, { apiKey: 'x', fetchImpl: sneaky });
  check('MYCO picks a herb it said the note refuses → rejected, fallback without it',
    r2.mycoUsed === false && r2.mycoFallbackReason === 'MYCO_PICKED_NOTE_REFUSED' && !r2.herbs.some(h => String(h.id) === String(target.id)),
    r2.mycoFallbackReason + ' · ' + (r2.herbs || []).map(h => h.name).join(', '));

  // noteAvoid naming a herb outside the shortlist is ignored.
  const r3 = await E.composeFormulaWithMyco(sleep, { apiKey: 'x', fetchImpl: mycoStandIn({ refuse: [() => ['not-a-real-id']] }) });
  check('noteAvoid outside the shortlist is ignored', r3.status === 'ok' && r3.mycoUsed === true, r3.mycoFallbackReason || 'used');

  // ── C · pair rules ─────────────────────────────────────────────
  const pair = (a, b, avoid) => seatBlocker(seat(newLoad(avoid), byName(a)), byName(b));
  check('Kava + Valerian → PAIR_BLOCK', pair('Kava Kava', 'Valerian') === 'PAIR_BLOCK', pair('Kava Kava', 'Valerian'));
  check("Pau d'Arco + Ginkgo → PAIR_BLOCK", pair('Ginkgo', "Pau d'Arco") === 'PAIR_BLOCK', '');
  check('Wormwood + Sage → blocked', !!pair('Wormwood', 'Sage'), pair('Wormwood', 'Sage'));
  check("Valerian + St John's Wort → PAIR_BLOCK", pair('Valerian', "St. John's Wort") === 'PAIR_BLOCK', '');
  check('Angelica + Garlic: allowed without cardio_meds, blocked with it',
    pair('Angelica (Dong Quai)', 'Garlic', []) === null && pair('Angelica (Dong Quai)', 'Garlic', ['cardio_meds']) === 'PAIR_CONDITIONAL',
    pair('Angelica (Dong Quai)', 'Garlic', []) + ' / ' + pair('Angelica (Dong Quai)', 'Garlic', ['cardio_meds']));
  check('Guarana + Rhodiola stays allowed (Robin: SHOW)', pair('Guarana', 'Rhodiola') === null, pair('Guarana', 'Rhodiola'));
  check('every pair rule names two herbs in the catalogue', PAIR_RULES.every(r => byId(r.a) && byId(r.b)), '');

  // The validator refuses a MYCO proposal holding a BLOCK pair.
  const cand = ['Kava Kava', 'Valerian', 'Chamomile', 'Lemon Balm', 'Oatstraw', 'Reishi'].map(byName).filter(Boolean);
  const v = validateMycoProposal({ mycoResponse: cand.slice(0, 5).map(h => ({ id: h.id, reason: 'x' })), candidateSet: cand, gatedOptIn: false });
  check('validator rejects Kava + Valerian from MYCO', !v.ok && v.reason === 'MYCO_PAIR_BLOCKED', v.reason);

  // No composed bottle, across a grid of profiles, holds a forbidden pair.
  const INTENTS = ['stress', 'anxiety', 'sleep', 'energy', 'mood', 'cognitive', 'hormones', 'digestion', 'immunity', 'pain', 'detox', 'beauty'];
  const PATTERNS = ['hot', 'cold', 'mixed', 'depleted'];
  const AVOIDS = [['none'], ['cardio_meds'], ['pregnancy'], ['autoimmune']];
  let bad = [], n = 0;
  for (const i of INTENTS) for (const pt of PATTERNS) for (const av of AVOIDS) {
    const f = E.compileFormula({ ...base, intention: i, intentions: [i], pattern: pt, avoid: av });
    if (f.status !== 'ok') continue;
    n++;
    const ids = f.herbs.map(h => String(h.id));
    for (const r of PAIR_RULES) {
      if (!ids.includes(r.a) || !ids.includes(r.b)) continue;
      if (r.cls === 'BLOCK' || av.includes(r.flag)) bad.push(i + '/' + pt + '/' + av + ': ' + r.why);
    }
  }
  check('no bottle in ' + n + ' profiles holds a forbidden pair', !bad.length, bad.slice(0, 3).join(' | '));

  for (const r of results) console.log('  ' + (r.ok ? '✓' : '✗') + ' ' + r.name + (r.ok || !r.detail ? '' : '  — ' + r.detail));
  const failed = results.filter(r => !r.ok).length;
  console.log('\npassed: ' + (results.length - failed) + '\nfailed: ' + failed);
  process.exit(failed ? 1 : 0);
})();
