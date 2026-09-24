// tests/myco-terminology-verify.cjs
//
// MYCO's terminology layer — offline verification. No API calls, no cost.
//
//   1. CORRECTION       misspelled questions reach the right knowledge
//   2. NEVER CORRECT    words the corpus knows are left alone, and a
//                       dangerous flip (coumadin → coumarin) stays fixed
//   3. SPLIT CORPUS     UK/US spellings retrieve one shelf, not two
//   4. EQUIVALENCE      a typo'd question ranks the same herb first as
//                       the clean one
//   5. ENTITIES         binomials, pinyin and trade names resolve
//   6. NEGATION         "not sedating" does not widen into sedatives,
//                       and does not swallow the words after it
//   7. NOTEBOOK         the Academy lab notes read the same question
//   8. ENGINE           a misspelled notes field scores like a clean one
//   9. HYGIENE          the curated tables are reported against the
//                       corpus: dead terms, and entries that pull their
//                       weight nowhere
//
//   node tests/myco-terminology-verify.cjs

const T = require('../src/server/myco/terminology.cjs');
const { search, interpretQuery, lexiconReport, lexicon } = require('../src/server/myco/retrieve.cjs');
const { scoreLabNotes } = require('../src/server/myco/lab-notes.cjs');
const { notesBoost } = require('../src/server/formula-engine/scoring.js');
const { MISSPELLINGS, EQUIVALENT, IMPLIES } = require('../src/server/myco/vocabulary.cjs');

let passed = 0, failed = 0;
const fail = (name, detail) => { failed++; console.log('  ✗ ' + name + (detail ? '  — ' + detail : '')); };
const pass = (name, detail) => { passed++; console.log('  ✓ ' + name + (detail ? '  — ' + detail : '')); };
const topHerb = hits => (hits.length ? (hits[0].chunk.herb || hits[0].chunk.title) : null);
const norm = s => T.normPhrase(s);

// ── 1 · Correction ───────────────────────────────────────────────
// Each case: what a member types, and the herb whose chunks must come
// back first. These are the exact failures that motivated the layer.
console.log('\n── CORRECTION ──');
const CORRECTION_CASES = [
  ['is rishi safe with warfrin',                    'reishi'],
  ['what are ashwaganda contraindacations',         'ashwagandha'],
  ['ashwagandah dosage',                            'ashwagandha'],
  ['cordyseps for stamina',                         'cordyceps'],
  ['ekinacea for immunity',                         'echinacea'],
  ['gingko biloba and memory',                      'ginkgo'],
  ['rodiola for fatigue',                           'rhodiola'],
  ['valarian for sleep',                            'valerian'],
  ['tumeric absorption',                            'turmeric'],
  ['schizandrah in tcm',                            'schisandra'],
  ['ganoderna lucidem preparation',                 'reishi'],
  ['hypericium perforatum interactions',            'st. johns wort'],
  ['is it safe when pregnent',                      null],
  ['insomia remedies',                              null],
];
for (const [q, wantHerb] of CORRECTION_CASES) {
  const reading = interpretQuery(q);
  if (!reading.corrections.length) {
    fail(('reads · ' + q).slice(0, 50).padEnd(52), 'nothing was corrected');
    continue;
  }
  const label = reading.corrections.map(c => c.from + '→' + c.to).join(', ');
  if (!wantHerb) { pass(('reads · ' + q).slice(0, 50).padEnd(52), label); continue; }
  const hits = search(q, { k: 6, interpretation: reading });
  const got = topHerb(hits);
  if (got && norm(got).includes(norm(wantHerb).split(' ')[0])) {
    pass(('reads · ' + q).slice(0, 50).padEnd(52), label + ' → ' + got);
  } else {
    fail(('reads · ' + q).slice(0, 50).padEnd(52), label + ' but top hit was ' + (got || 'NOTHING'));
  }
}

// The regression that started this: a misspelled question used to
// retrieve literally nothing.
{
  const hits = search('what are ashwaganda contraindacations', { k: 6 });
  hits.length ? pass('a doubly-misspelled question retrieves at all', hits.length + ' extracts')
              : fail('a doubly-misspelled question retrieves at all', 'still zero');
}
// A spelling the corpus itself uses is not a typo. Our own material is
// split here — a monograph headed SCHIZANDRA and a database record called
// Schisandra — so neither spelling may be "corrected", and the EQUIVALENT
// group has to carry a question from either one to both.
{
  const r = interpretQuery('schizandra in tcm');
  const untouched = !r.corrections.some(c => /schi/i.test(c.from));
  const hits = search('schizandra in tcm', { k: 6, interpretation: r });
  const herbs = hits.map(h => norm(h.chunk.herb || ''));
  const reachesBoth = herbs.some(h => h.includes('schisandra')) &&
                      herbs.some(h => h.includes('schizandra'));
  if (!untouched) {
    fail('a variant spelling we ourselves use is not corrected', JSON.stringify(r.corrections));
  } else if (reachesBoth) {
    pass('both of our own spellings of one plant are reached', 'schisandra + schizandra');
  } else {
    fail('both of our own spellings of one plant are reached', herbs.join(', '));
  }
}
// A member must never be shown a stem as though it were a word.
{
  const r = interpretQuery('cordyseps for stamina');
  const c = r.corrections.find(x => /cordy/i.test(x.from));
  (c && c.to === 'cordyceps')
    ? pass('a correction is reported as a word, not a stem', c.from + ' → ' + c.to)
    : fail('a correction is reported as a word, not a stem', JSON.stringify(c));
}

// ── 2 · Never correct ────────────────────────────────────────────
console.log('\n── NEVER CORRECT ──');
// Words the corpus contains must survive untouched — this is the rule
// that stops the layer rewriting real terms into commoner neighbours.
const LEAVE_ALONE = ['reishi', 'warfarin', 'ethanol', 'maceration', 'hypericum',
  'sage', 'safe', 'triterpene', 'menstruum', 'decoction'];
for (const w of LEAVE_ALONE) {
  const r = interpretQuery('tell me about ' + w);
  const changed = r.corrections.find(c => norm(c.from) === norm(w));
  changed ? fail('left alone · ' + w, 'was rewritten to ' + changed.to)
          : pass('left alone · ' + w);
}
// The specific flip that a corpus-only fuzzy pass gets wrong: Coumadin is
// warfarin; coumarin is a different molecule that the corpus does contain.
{
  const r = interpretQuery('is it safe with coumadin');
  const flip = r.corrections.find(c => /coumarin/i.test(c.to));
  const reaches = [...r.weights.keys()].includes('warfarin');
  if (flip) fail('coumadin is not "corrected" to coumarin', 'became ' + flip.to);
  else if (!reaches) fail('coumadin reaches warfarin', 'no warfarin term in the reading');
  else pass('coumadin reaches warfarin, and is never read as coumarin');
}
// Nonsense must stay nonsense. A correction layer that finds something in
// gibberish is worse than one that finds nothing.
for (const junk of ['qwertyuiop zxcvbnm', 'flurbgle wobnar', 'asdfgh jkl']) {
  const hits = search(junk, { k: 6 });
  hits.length ? fail('nonsense retrieves nothing · ' + junk, hits.length + ' extracts')
              : pass('nonsense retrieves nothing · ' + junk);
}

// ── 3 · Split corpus ─────────────────────────────────────────────
console.log('\n── SPLIT CORPUS (UK / US spelling) ──');
// 130 monographs written over years carry both spellings. A question in
// one spelling used to reach only half the shelf.
const SPELLING_PAIRS = [
  ['standardised extract', 'standardized extract'],
  ['oestrogen effects', 'estrogen effects'],
  ['anaesthesia before surgery', 'anesthesia before surgery'],
];
// The property that matters is SYMMETRY: whichever spelling is typed, both
// are searched. Asserting on how much the two result sets overlap was a
// proxy, and a brittle one — it moved the moment the corpus grew by 26
// records. Worse, it passed while the layer was still one-directional,
// because the UK-spelled query alone was doing the work.
for (const [a, b] of SPELLING_PAIRS) {
  const ra = interpretQuery(a), rb = interpretQuery(b);
  const ka = [...ra.weights.keys()], kb = [...rb.weights.keys()];
  // The distinguishing term of each spelling, e.g. oestrogen vs estrogen.
  const ta = ka.find(t => t.length > 5 && !kb.includes(t)) ||
             ka.find(t => t.length > 5);
  const tb = kb.find(t => t.length > 5 && !ka.includes(t)) ||
             kb.find(t => t.length > 5);
  const label = a.split(' ')[0] + ' / ' + b.split(' ')[0];

  // Concretely: each reading must contain the OTHER spelling's term.
  const bothInA = tb ? ka.includes(tb) : false;
  const bothInB = ta ? kb.includes(ta) : false;
  (bothInA && bothInB)
    ? pass('searched in both spellings · ' + label)
    : fail('searched in both spellings · ' + label,
           a + ' → [' + ka.join(' ') + ']   ' + b + ' → [' + kb.join(' ') + ']');

  const ha = search(a, { k: 6, interpretation: ra }).map(h => h.chunk.id);
  const hb = search(b, { k: 6, interpretation: rb }).map(h => h.chunk.id);
  const overlap = ha.filter(id => hb.includes(id)).length;
  overlap >= 1 ? pass('  ↳ and they reach common ground', overlap + '/6 extracts shared')
               : fail('  ↳ and they reach common ground', 'no shared extracts at all');
}

// ── 4 · Equivalence ──────────────────────────────────────────────
console.log('\n── EQUIVALENCE (typo vs clean) ──');
const EQUIV_PAIRS = [
  ['is reishi safe with warfarin',         'is rishi safe with warfrin'],
  ['ashwagandha contraindications',        'ashwaganda contraindacations'],
  ["lion's mane for memory",               'lions mane for memory'],
  ['ginkgo biloba and memory',             'gingko biloba and memory'],
];
for (const [clean, typo] of EQUIV_PAIRS) {
  const a = topHerb(search(clean, { k: 6 }));
  const b = topHerb(search(typo,  { k: 6 }));
  (a && b && norm(a) === norm(b))
    ? pass('same first hit · ' + typo.slice(0, 34).padEnd(36), a)
    : fail('same first hit · ' + typo.slice(0, 34).padEnd(36), 'clean=' + a + ' typo=' + b);
}

// ── 5 · Entities ─────────────────────────────────────────────────
console.log('\n── ENTITIES (binomial · pinyin · alias) ──');
const ENTITY_CASES = [
  ['ganoderma lucidum dosage',       'Reishi'],
  ['hericium erinaceus',             "Lion's Mane"],
  ['withania somnifera and thyroid', 'Ashwagandha'],
  ['fo ti for hair',                 'He Shou Wu'],
  ['lingzhi in tcm',                 'Reishi'],
  ['hypericum perforatum',           "St. John's Wort"],
  ['tulsi every morning',            'Holy Basil'],
  ['st johns wort and the pill',     "St. John's Wort"],
];
for (const [q, wantHerb] of ENTITY_CASES) {
  const r = interpretQuery(q);
  const hit = r.entities.find(e => norm(e).includes(norm(wantHerb).split(' ')[0]));
  const got = topHerb(search(q, { k: 6, interpretation: r }));
  if (hit) pass('resolves · ' + q.slice(0, 34).padEnd(36), hit);
  else if (got && norm(got).includes(norm(wantHerb).split(' ')[0])) {
    pass('resolves · ' + q.slice(0, 34).padEnd(36), 'via terms, top hit ' + got);
  } else {
    fail('resolves · ' + q.slice(0, 34).padEnd(36),
         'entities=[' + r.entities.join(', ') + '] top=' + got);
  }
}
// An unambiguous genus is a key; a shared one must never be. Vaccinium
// covers four of our plants, so it cannot stand for any one of them.
{
  const r = interpretQuery('vaccinium species');
  r.entities.length === 0
    ? pass('a shared genus resolves to no single plant', 'vaccinium → none')
    : fail('a shared genus resolves to no single plant', 'resolved ' + r.entities.join(', '));
}

// ── 6 · Negation ─────────────────────────────────────────────────
console.log('\n── NEGATION ──');
{
  const q = 'something grounding but not sedating with a nordic forest profile as an ethanol extract';
  const r = interpretQuery(q);
  const sup = r.suppressed.map(s => s.trigger);
  const exp = new Set(r.expansions.map(e => e.term));

  sup.includes('sedating') ? pass('"not sedating" is not widened into the sedative corpus')
                           : fail('"not sedating" is not widened', 'suppressed=[' + sup.join(', ') + ']');
  // The bug this caught during development: a character-based window let
  // "not" reach four words forward and suppress "nordic" too.
  !sup.includes('nordic') ? pass('the negator does not reach past its own object', 'nordic still widened')
                          : fail('the negator does not reach past its own object', 'nordic was suppressed');
  exp.has('boreal') ? pass('nordic widens to the boreal vocabulary')
                    : fail('nordic widens to the boreal vocabulary', [...exp].join(' '));
  exp.has('tincture') ? pass('ethanol extract widens to our preparation vocabulary')
                      : fail('ethanol extract widens to our preparation vocabulary', [...exp].join(' '));
  ['soporific', 'hypnotic', 'drowsiness'].every(t => !exp.has(t))
    ? pass('no sedative term was added')
    : fail('no sedative term was added', [...exp].join(' '));
}
{
  const r = interpretQuery('i want something calming without alcohol');
  r.suppressed.some(s => s.trigger === 'alcohol')
    ? pass('"without alcohol" is not widened')
    : fail('"without alcohol" is not widened', JSON.stringify(r.suppressed));
}

// ── 7 · Notebook ─────────────────────────────────────────────────
console.log('\n── LAB NOTEBOOK (the /academy snippets) ──');
// The notebook is scored through the SAME reading as the static corpus.
// A question spelled wrong must reach a bench note as surely as a
// monograph — a member at the bench types no more carefully than one on
// the sofa.
const NOTES = [
  { id: 'lab_t1', type: 'lab', title: 'Lab notebook · reishi',
    source: 'Academy lab note — tester, 2026-09-24', herb: null,
    text: 'Double extraction on Ganoderma lucidum: 1:5 in 60% ethanol for fourteen days, ' +
          'then a four-hour decoction of the marc. Triterpene yield measured markedly higher ' +
          'than the single-solvent control, and the polysaccharide fraction survives.' },
  { id: 'lab_t2', type: 'lab', title: 'Lab notebook · st johns wort',
    source: 'Academy lab note — tester, 2026-09-23', herb: null,
    text: 'Hypericum perforatum and the contraceptive pill: hyperforin induces CYP3A4, which ' +
          'is why this pairing is a hard contraindication for us rather than a caution. ' +
          'Noted after re-reading the interaction literature this week.' },
];
const NOTE_CASES = [
  ['double extraction ratio for reishi',        'lab_t1'],
  ['dubble extracton ratio for rishi',          'lab_t1'],
  ['does st johns wort affect the pill',        'lab_t2'],
  ['does st jonhs wart affect the pill',        'lab_t2'],
];
for (const [q, wantId] of NOTE_CASES) {
  const reading = interpretQuery(q);
  const hits = scoreLabNotes(q, NOTES, 2, reading);
  const got = hits.length ? hits[0].chunk.id : null;
  got === wantId ? pass('notebook · ' + q.slice(0, 34).padEnd(36), wantId)
                 : fail('notebook · ' + q.slice(0, 34).padEnd(36), 'got ' + (got || 'NOTHING'));
}
// The relevance gate must still hold: expansion terms score, but they do
// not let an unrelated note in on their own.
{
  const hits = scoreLabNotes('what time does the berlin dinner start', NOTES, 2,
    interpretQuery('what time does the berlin dinner start'));
  hits.length === 0 ? pass('an unrelated question surfaces no note')
                    : fail('an unrelated question surfaces no note', hits[0].chunk.id);
}

// ── 8 · Engine ───────────────────────────────────────────────────
console.log('\n── ENGINE (find-your-formula notes field) ──');
// notesBoost matches by substring, so a misspelling did not weaken an
// intention, it deleted it. Correction is table-only here (see the
// comment on notesBoost) and may only ever ADD.
const HERB = {
  name: 'Ashwagandha',
  primary_functions: ['Anxiolytic — lowers anxiety and cortisol', 'Adaptogenic HPA support'],
  secondary_benefits: ['fatigue and exhaustion recovery', 'sleep onset'],
  energetics: ['Warming'], spiritual_layer: '', pharmacology: 'withanolides, insomnia, stress',
};
const NOTE_PAIRS = [
  ['anxiety and fatigue',      'anxeity and fatuige'],
  ['insomnia most nights',     'insomia most nights'],
  ['cortisol is high',         'cortizol is high'],
  ['exhaustion and stress',    'exhaustion and stres'],
];
for (const [clean, typo] of NOTE_PAIRS) {
  const a = notesBoost(HERB, clean), b = notesBoost(HERB, typo);
  b >= a ? pass('notes score holds · ' + typo.slice(0, 26).padEnd(28), 'clean=' + a + ' typo=' + b)
         : fail('notes score holds · ' + typo.slice(0, 26).padEnd(28), 'clean=' + a + ' typo=' + b);
}
// Correction must never REMOVE an intention that was spelled correctly.
{
  const before = notesBoost(HERB, 'anxiety, fatigue, insomnia, cortisol, stress, exhaustion');
  const withTypo = notesBoost(HERB, 'anxiety, fatigue, insomnia, cortisol, stress, exhaustion, anxeity');
  withTypo >= before
    ? pass('adding a misspelling never lowers a score', before + ' → ' + withTypo)
    : fail('adding a misspelling never lowers a score', before + ' → ' + withTypo);
}
{
  const r = T.applyMisspellings('i have anxeity and cant sleep');
  const onlyTable = r.corrections.every(c => c.via === 'table');
  (r.corrections.length && onlyTable && /anxiety/.test(r.text))
    ? pass('engine correction is table-only', JSON.stringify(r.corrections))
    : fail('engine correction is table-only', JSON.stringify(r));
}
{
  // No corpus, no fuzzy: a word the table does not know is left as typed,
  // because guessing here changes what goes in a bottle.
  const r = T.applyMisspellings('i need somthing for stammina');
  r.corrections.length === 0
    ? pass('engine never guesses at an unlisted misspelling')
    : fail('engine never guesses at an unlisted misspelling', JSON.stringify(r.corrections));
}

// ── 9 · Hygiene ──────────────────────────────────────────────────
console.log('\n── VOCABULARY HYGIENE ──');
const report = lexiconReport();
const deadByTable = {};
for (const d of report.dead) (deadByTable[d.table] = deadByTable[d.table] || []).push(d.term);

// A MISSPELLINGS entry whose target is absent from the corpus can never
// do anything — unlike an EQUIVALENT member, which is one of several
// names for a thing and may reasonably outrun the corpus.
const deadMiss = deadByTable.MISSPELLINGS || [];
deadMiss.length === 0
  ? pass('every misspelling points at a word the corpus has')
  : fail('every misspelling points at a word the corpus has', deadMiss.join(' | '));

// A no-op entry: key and value are the same word once stemmed. That is a
// plural, not a misspelling, and it does nothing for either caller.
const LEX = lexicon();
const noop = [];
let fuzzyWouldCatch = 0;
for (const [wrong, right] of Object.entries(MISSPELLINGS)) {
  const w = T.stem(wrong), target = T.stem(right);
  if (w === target) { noop.push(wrong + ' → ' + right); continue; }
  const f = T.fuzzyCorrect(w, LEX);
  if (f && f.term === target) fuzzyWouldCatch++;
}
noop.length === 0
  ? pass('no misspelling entry is a plural in disguise')
  : fail('no misspelling entry is a plural in disguise', noop.join(' | '));
// Informational, not a failure: these are the entries MYCO would have got
// without help. They are still load-bearing for the formula engine, which
// has no corpus to correct against (see the header of vocabulary.cjs).
console.log('  · ' + fuzzyWouldCatch + ' of ' + Object.keys(MISSPELLINGS).length +
  ' misspellings would also be caught by the fuzzy pass — kept for the engine, ' +
  'which is table-only');
// Every remaining entry must at least be REACHED by the engine path.
{
  const unreachable = [];
  for (const wrong of Object.keys(MISSPELLINGS)) {
    if (!/^[a-z]+$/.test(wrong)) continue;            // keys with _ are notes-field shapes
    if (!T.applyMisspellings(wrong).corrections.length) unreachable.push(wrong);
  }
  unreachable.length === 0
    ? pass('every misspelling is reachable through the engine path')
    : fail('every misspelling is reachable through the engine path', unreachable.join(' '));
}

// Determinism: the same question must read the same way twice, or a
// logged answer cannot be reproduced.
{
  const a = interpretQuery('ashwaganda and rodiola for burnout');
  const b = interpretQuery('ashwaganda and rodiola for burnout');
  const key = r => JSON.stringify([r.corrected, [...r.weights.entries()].sort(), r.entities.sort()]);
  key(a) === key(b) ? pass('one question reads the same way twice')
                    : fail('one question reads the same way twice');
}

// Cost. The lexicon is built once per function instance alongside the
// index; a reading must stay far below the cost of the model call it
// precedes.
{
  const t0 = Date.now();
  for (let i = 0; i < 200; i++) interpretQuery('is ashwaganda safe with warfrin and the pill');
  const per = (Date.now() - t0) / 200;
  per < 6 ? pass('a reading costs almost nothing', per.toFixed(2) + ' ms')
          : fail('a reading costs almost nothing', per.toFixed(2) + ' ms per question');
}

console.log('\n── LEXICON ──');
console.log('  corpus terms : ' + report.stats.corpusTerms +
            '  ·  correction targets: ' + report.stats.candidates);
console.log('  vocabulary   : ' + report.stats.triggers + ' triggers, ' +
            report.stats.misspellings + ' misspellings, ' +
            report.stats.entityKeys + ' names, ' +
            report.stats.protected + ' protected');
console.log('  curated terms the corpus does not contain: ' + report.dead.length);
for (const [table, terms] of Object.entries(deadByTable)) {
  console.log('    ' + table.padEnd(13) + terms.join(', '));
}
console.log('\n  Dead terms are not failures — they are either a slip in');
console.log('  vocabulary.cjs or knowledge we have not written yet. The');
console.log('  ecology words below are the habitat gap in docs/HANDOFF.md.');

// ── 10 · Endpoint ────────────────────────────────────────────────
// A member must be TOLD what we read. A silent correction is a wrong
// answer they cannot spot.
(async () => {
  console.log('\n── ENDPOINT WIRING (/api/myco-agent) ──');
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key-not-used';
  const mod = await import('../netlify/functions/myco-agent.mjs');
  const realFetch = global.fetch;
  let captured = null;
  global.fetch = async (url, init) => {
    captured = JSON.parse(init.body);
    return {
      ok: true, status: 200,
      json: async () => ({ content: [{ type: 'text', text: 'Ashwagandha is traditionally a rasayana [K1].' }] }),
    };
  };
  const res = await mod.handler({
    httpMethod: 'POST',
    headers: { origin: 'http://localhost:5173' },
    body: JSON.stringify({ message: 'what are ashwaganda contraindacations?' }),
  });
  global.fetch = realFetch;

  const body = JSON.parse(res.body);
  const systemText = (captured?.system || []).map(s => s.text).join('\n');

  res.statusCode === 200 ? pass('endpoint returns 200')
                         : fail('endpoint returns 200', String(res.statusCode) + ' ' + res.body.slice(0, 160));
  /HOW THE QUESTION WAS READ/.test(systemText)
    ? pass('the reading is sent to the model')
    : fail('the reading is sent to the model');
  /ashwaganda → ashwagandha/.test(systemText)
    ? pass('the model is told which word was corrected')
    : fail('the model is told which word was corrected');
  /organisms recognised: .*Ashwagandha/i.test(systemText)
    ? pass('the model is told which plant was recognised')
    : fail('the model is told which plant was recognised');
  (body.readAs && body.readAs.corrections &&
   body.readAs.corrections.some(c => /ashwaganda/i.test(c.from) && /ashwagandha/i.test(c.to)))
    ? pass('the correction reaches the member', JSON.stringify(body.readAs.corrections))
    : fail('the correction reaches the member', JSON.stringify(body.readAs));
  (body.sources || []).length
    ? pass('the misspelled question still retrieves sources', body.sources.length + ' cited/available')
    : fail('the misspelled question still retrieves sources');

  // Nothing corrected → nothing to report. The chip must not appear on
  // every answer.
  let captured2 = null;
  global.fetch = async (url, init) => {
    captured2 = JSON.parse(init.body);
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'Reishi [K1].' }] }) };
  };
  const res2 = await mod.handler({
    httpMethod: 'POST',
    headers: { origin: 'http://localhost:5173' },
    body: JSON.stringify({ message: 'what is reishi traditionally used for?' }),
  });
  global.fetch = realFetch;
  const body2 = JSON.parse(res2.body);
  body2.readAs === null ? pass('a correctly spelled question reports no correction')
                        : fail('a correctly spelled question reports no correction', JSON.stringify(body2.readAs));

  console.log('\n  passed: ' + passed);
  console.log('  failed: ' + failed);
  process.exit(failed ? 1 : 0);
})();
