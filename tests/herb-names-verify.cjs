// tests/herb-names-verify.cjs
//
// 2026-09-29, Robin: "we need to figure out the naming system so it's
// waterproof when people are freely texting in the textbox", and
// "the herbs which induce vividness of dreams, such as mugwort, blue
// lotus and calea, should not be matched when people are already
// having restless sleep".
//
//   A · refusals people actually type: curly apostrophes, typos,
//       plurals, spacing, genus, German word order, lists, "leave X out"
//   B · what must refuse nothing: needs, praise, ordinary words one slip
//       from a herb name
//   C · every herb in the pool is refused by its own catalogue name, and
//       by a one-letter slip in it
//   D · the dream records: a record whose text says it deepens dreams
//       carries sleep_action 'dream_vivid'
//   E · restless sleepers (answer or note) get no dream-deepening herb —
//       deterministic bottle, MYCO's shortlist and MYCO's picks
//
// No network: MYCO is a stand-in that answers from the shortlist it is sent.

const path = require('path');
const R = p => require(path.join(__dirname, '..', p));
const E = R('src/server/formula-engine/index.js');
const { ensurePool } = R('src/server/formula-engine/axes.js');
const { detectNoteHerbAvoidance: herbsIn, detectNoteEffectAvoidance: effectsIn, detectRestlessSleep } = R('src/server/formula-engine/note-safety.js');
const { NEVER_FUZZY, findHerbs } = R('src/server/formula-engine/herb-names.js');
const P = R('src/server/formula-engine/pharmacology.js');

const results = [];
const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });

let pool = ensurePool(); if (!Array.isArray(pool)) pool = pool.herbs || Object.values(pool);
const byId = id => pool.find(h => String(h.id) === String(id));
const names = note => herbsIn(note, pool).map(h => h.name);
const effects = note => effectsIn(note, pool).map(e => e.effect);

// ── A · refusals ─────────────────────────────────────────────────
const REFUSE = [
  // phones curl the apostrophe
  ['I don’t want valerian', ['Valerian']],
  ['I can’t take ashwagandha', ['Ashwagandha']],
  ['I won’t take kava', ['Kava Kava']],
  // spellings
  ['no tumeric please', ['Turmeric']],
  ['allergic to gingko', ['Ginkgo']],
  ['no camomile', ['Chamomile']],
  ['no liquorice', ['Licorice Root']],
  ['no rodiola', ['Rhodiola']],
  ['no schizandra', ['Schisandra (Five-Flavour Fruit)']],
  ['no reshi', ['Reishi']],
  ['no valarian', ['Valerian']],
  ['no ashwaganda', ['Ashwagandha']],
  ['no chamomille', ['Chamomile']],
  ['no cinammon', ['Cinnamon']],
  ['no lions main', ["Lion's Mane"]],
  // name without the part of the plant, plurals, spacing
  ['no licorice', ['Licorice Root']],
  ['no dandelion', ['Dandelion Root']],
  ['no nettles', ['Nettle']],
  ['no rose hips', ['Rosehip']],
  ['no elderberries', ['Elderberry']],
  ['no passion flower', ['Passionflower']],
  ['no lemonbalm', ['Lemon Balm']],
  ['no lemon-balm', ['Lemon Balm']],
  ['no st johns wart', ["St. John's Wort"]],
  ['no St. John’s Wort please', ["St. John's Wort"]],
  ['no Saint Johns wort', ["St. John's Wort"]],
  ['no SJW', ["St. John's Wort"]],
  ['no fo-ti', ['He Shou Wu / Fo-Ti']],
  // genus, family word, other names
  ['no hypericum', ["St. John's Wort"]],
  ['no artemisia', ['Mugwort', 'Wormwood']],
  ['no pepper', ['Long Pepper', 'Szechuan Pepper', 'Black Pepper Extract']],
  ['no lotus', ['Blue Lotus', 'Lotus Leaf Extract']],
  ['allergic to celery', ['Ajwan']],
  ['no triphala', ['Haritaki', 'Bibhitaki', 'Amla / Amalaki']],
  ['no curcumin', ['Turmeric']],
  ['nothing with mint', ['Peppermint']],
  // lists
  ['no valerian, kava, passionflower, hops or skullcap', ['Valerian', 'Kava Kava', 'Passionflower', 'Hops', 'Skullcap']],
  ["I don't want anything with valerian or kava in it", ['Valerian', 'Kava Kava']],
  ["I'm allergic to chamomile and yarrow", ['Chamomile', 'Yarrow']],
  // other ways of saying it
  ['leave the kava out', ['Kava Kava']],
  ['please don’t put mugwort in it', ['Mugwort']],
  ['not valerian', ['Valerian']],
  ['I hate the taste of licorice', ['Licorice Root']],
  ['valerian and kava made me groggy', ['Valerian', 'Kava Kava']],
  ['I used to take ashwagandha and it made me anxious', ['Ashwagandha']],
  ['ginseng is a no-go', ['Ginseng']],
  ['rhodiola upsets my stomach', ['Rhodiola']],
  // German
  ['Baldrian vertrage ich nicht', ['Valerian']],
  ['Johanniskraut mag ich nicht', ["St. John's Wort"]],
  ['bitte ohne Süßholz', ['Licorice Root']],
  ['ohne Suessholz', ['Licorice Root']],
  ['keine Brennnesseln', ['Nettle']],
  ['lass den Baldrian weg', ['Valerian']],
  ['allergisch gegen Kamille', ['Chamomile']],
  ['kein Beifuss', ['Mugwort']],
];
for (const [note, want] of REFUSE) {
  const got = names(note);
  check('refuses: "' + note + '"', want.every(n => got.includes(n)), got.join(', ') || '—');
}
check('"no black pepper" is Black Pepper Extract only (the longest name wins)',
  JSON.stringify(names('no black pepper')) === JSON.stringify(['Black Pepper Extract']), names('no black pepper').join(', '));
check('"no blue lotus" is Blue Lotus only', JSON.stringify(names('no blue lotus')) === JSON.stringify(['Blue Lotus']), names('no blue lotus').join(', '));

const REFUSE_EFFECT = [
  ['no dream herbs', 'dreaming'],
  ["I don’t want anything that gives me vivid dreams", 'dreaming'],
  ['no more nightmares please', 'dreaming'],
  ['nothing that keeps me up at night', 'stimulating'],
  ['I don’t want anything sedating', 'sedating'],
  ['without caffeine or anything sedating', 'sedating'],
];
for (const [note, effect] of REFUSE_EFFECT) check('refuses ' + effect + ': "' + note + '"', effects(note).includes(effect), effects(note).join(', ') || '—');

// ── B · refuses nothing ──────────────────────────────────────────
const NEEDS = [
  "I can't sleep", 'I can’t sleep', 'no energy at all', "I'm sleepy all day and wired at night", 'nothing helps my anxiety',
  'valerian helped me a lot', 'Baldrian hilft mir gut', 'I love reishi and lions mane',
  "I can't sleep without melatonin, so something with valerian",
  "I'm not sleepy at night", 'I barely sleep and I get chills', 'I want something grounding',
  'no potential side effects I hope', 'I have parasites and saliva issues', 'medical student, long hours',
  "lion's mane felt clean and I want more of that",
];
for (const note of NEEDS) {
  const h = names(note), e = effects(note);
  check('refuses nothing: "' + note + '"', !h.length && !e.length, 'herbs ' + (h.join(', ') || '—') + ' · effects ' + (e.join(', ') || '—'));
}
{
  const note = "lion's mane felt clean and I want more of that, rhodiola gave me a headache";
  const got = names(note);
  check('a complaint names its subject, not the herb praised before it', got.includes('Rhodiola') && !got.includes("Lion's Mane"), got.join(', '));
}
{
  const hits = [...NEVER_FUZZY].filter(w => findHerbs(w, pool).length);
  check('no guarded ordinary word is read as a herb', !hits.length, hits.join(', '));
}

// ── C · every herb, by its own name and with a slip ──────────────
{
  const missed = [], slipMissed = [];
  for (const h of pool) {
    if (!names('no ' + h.name).includes(h.name) || !names("I don't want " + h.name).includes(h.name)) missed.push(h.name);
    // One letter dropped from the middle of a one-word name of 7+ letters.
    if (/^[A-Za-z]{7,}$/.test(h.name)) {
      const i = Math.floor(h.name.length / 2);
      const typo = h.name.slice(0, i) + h.name.slice(i + 1);
      if (!names('no ' + typo).includes(h.name)) slipMissed.push(h.name + ' (' + typo + ')');
    }
  }
  check('every herb (' + pool.length + ') is refused by its catalogue name', !missed.length, missed.join(', '));
  check('every one-word name of 7+ letters is refused with one letter missing', !slipMissed.length, slipMissed.join(', '));
}

// ── D · the dream records ────────────────────────────────────────
{
  const untagged = pool.filter(h => P.dreamDeepeningInProse(h) && !P.isDreamDeepening(h)).map(h => h.name);
  check('every record whose text says it deepens dreams is tagged dream_vivid', !untagged.length, untagged.join(', '));
  const soften = pool.filter(h => (h.sleep_action || []).includes('dream_soften')).map(h => h.name);
  check('dream_soften is on the herbs that calm dreaming (Rose Petals, Reishi, Schisandra — TCM, PubMed 2026-09-29)',
    soften.length === 3 && ['Rose Petals', 'Reishi', 'Schisandra (Five-Flavour Fruit)'].every(n => soften.includes(n)), soften.join(', '));
  for (const n of ['Mugwort', 'Blue Lotus', 'Calea Zacatachichi', 'African Dream Root', 'Wild Dagga', 'Amanita Muscaria', 'Amanita Pantherina']) {
    check(n + ' is dream_vivid', P.isDreamDeepening(pool.find(h => h.name === n)), '');
  }
  check('Schisandra is not dream_vivid', !P.isDreamDeepening(pool.find(h => h.name === 'Schisandra (Five-Flavour Fruit)')), '');
  const noProse = pool.filter(h => P.isDreamDeepening(h) && !P.dreamDeepeningInProse(h)).map(h => h.name);
  if (noProse.length) console.log('  note: tagged dream_vivid without a sentence saying so (Robin to confirm): ' + noProse.join(', '));
}

// ── E · restless sleepers ────────────────────────────────────────
const dreamIds = new Set(pool.filter(P.isDreamDeepening).map(h => String(h.id)));
const base = {
  pattern: 'depleted', time: 'night', stress: 'freeze', duration: 'months', age: '25_40',
  avoid: ['none'], _privacyConsentAcknowledged: true, _gatedOptIn: true,
};
const INTENTIONS = ['sleep', 'anxiety', 'stress', 'mood', 'cognitive', 'energy', 'hormones', 'digestion'];
{
  let bottles = 0; const bad = [];
  for (const intention of INTENTIONS) {
    for (const sleep of ['vivid_restless', 'very_broken', 'wakes_middle']) {
      const f = E.compileFormula({ ...base, intention, intentions: [intention], sleep, notes: 'I want to dream more vividly, lucid dreams are my thing' });
      if (f.status !== 'ok') continue;
      bottles++;
      const hit = (f.herbs || []).filter(h => dreamIds.has(String(h.id)));
      if (hit.length) bad.push(intention + '/' + sleep + ': ' + hit.map(h => h.name).join(', '));
    }
  }
  check('restless sleep answers → no dream-deepening herb in ' + bottles + ' bottles (even when the note asks for vivid dreams)', bottles > 10 && !bad.length, bad.join(' · '));
}
{
  const sleeper = { ...base, intention: 'sleep', intentions: ['sleep'], sleep: 'restorative_6plus' };
  const calm = detectRestlessSleep(sleeper, pool);
  check('a good sleeper with no complaint keeps the dream herbs in the pool', calm === null, JSON.stringify(calm));
  for (const note of ['I have nightmares most nights', 'bad dreams wake me', 'restless sleep for years', 'ständig Albträume']) {
    const f = E.compileFormula({ ...sleeper, notes: note });
    const hit = (f.herbs || []).filter(h => dreamIds.has(String(h.id)));
    const said = (f.noteSafety && f.noteSafety.herbsAvoided || []).some(x => x.name === 'anything that deepens dreams');
    check('note "' + note + '" → no dream-deepening herb, and the reveal says so', f.status === 'ok' && !hit.length && said,
      f.status + ' · ' + (f.herbs || []).map(h => h.name).join(', '));
  }
  const f = E.compileFormula({ ...sleeper, sleep: 'vivid_restless' });
  check('the sleep ANSWER alone is not announced as "from your note"',
    !(f.noteSafety && f.noteSafety.herbsAvoided || []).length, JSON.stringify(f.noteSafety && f.noteSafety.herbsAvoided));
}

(async () => {
  // MYCO never sees a dream-deepening herb for a restless sleeper, and a
  // proposal naming one is refused by the validator.
  let sent = [];
  const standIn = async (url, init) => {
    const text = JSON.parse(init.body).messages[0].content;
    sent = [...text.matchAll(/\bid=([A-Za-z0-9_-]+)/g)].map(m => m[1]);
    const mugwort = pool.find(h => h.name === 'Mugwort');
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify({
      picked: [String(mugwort.id), ...sent.slice(0, 4)].map(id => ({ id, reason: 'stand-in' })), noteAvoid: [], overall: 'stand-in' }) }] }) };
  };
  const p = { ...base, intention: 'sleep', intentions: ['sleep'], sleep: 'vivid_restless', notes: '' };
  const r = await E.composeFormulaWithMyco(p, { apiKey: 'x', fetchImpl: standIn });
  check("MYCO's shortlist for a restless sleeper holds no dream-deepening herb", sent.length && !sent.some(id => dreamIds.has(String(id))),
    sent.filter(id => dreamIds.has(String(id))).map(id => byId(id).name).join(', ') || sent.length + ' sent');
  check('… and Mugwort pushed in by MYCO does not reach the bottle', r.status === 'ok' && !(r.herbs || []).some(h => dreamIds.has(String(h.id))),
    (r.mycoFallbackReason || 'used') + ' · ' + (r.herbs || []).map(h => h.name).join(', '));

  const failed = results.filter(r => !r.ok);
  for (const r of results) console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.name + (r.ok ? '' : '  — ' + r.detail));
  console.log('\npassed: ' + (results.length - failed.length) + ' failed: ' + failed.length);
  process.exit(failed.length ? 1 : 0);
})();
