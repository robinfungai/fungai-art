// tests/invariants-verify.cjs
//
// The formula engine's rules, stated in docs/FORMULA-ENGINE-BRIEF.md, as
// executable checks (external audit 2026-09-28: "test the engine against
// its own documentation", "property-based fuzzing").
//
// Part A throws 600 random but reproducible profiles — consumer and
// pro, adults and minors, pregnancy, every safety flag, notes that name
// medicines — at the engine and asserts every rule on every bottle it
// returns. Part B checks the safety question's input rules and the note's
// safety words. Part C goes through the real HTTP handler, because the
// audit's first "P0" claimed the server does not derive under-18 status
// from the age answer: it does, and this proves it on the wire. Part D
// runs the MYCO path with a stand-in for Anthropic (no network, no cost)
// that asks for absurd percentages, and checks the engine's rules still
// hold on the bottle MYCO chose.
//
// Fixed seed: a failure reproduces exactly.

const path = require('path');
const { pathToFileURL } = require('node:url');
const R = p => require(path.join(__dirname, '..', p));
const E = R('src/server/formula-engine/index.js');
const { ensurePool, isRestricted } = R('src/server/formula-engine/axes.js');
const { passesMinorGate } = R('src/server/formula-engine/safety.js');
const { isTrace } = R('src/server/formula-engine/traces.js');
const { targetHerbCount } = R('src/server/formula-engine/picker.js');
const { assignPercentages } = R('src/server/formula-engine/percentages.js');
const { detectNoteSafety, detectNoteHerbAvoidance } = R('src/server/formula-engine/note-safety.js');
const { isAmanita } = R('src/server/formula-engine/rules.js');
const P = R('src/server/formula-engine/pharmacology.js');

// ── Reproducible randomness (mulberry32) ──────────────────────────
let seed = 20260928;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const some = (arr, max) => { const out = new Set(); const n = Math.floor(rnd() * (max + 1)); while (out.size < n) out.add(pick(arr)); return [...out]; };

const GOALS = ['stress', 'anxiety', 'sleep', 'energy', 'mood', 'cognitive', 'hormones', 'digestion', 'immunity', 'pain', 'detox', 'beauty'];
const FLAGS = ['pregnancy', 'cardio_meds', 'psych_meds', 'autoimmune', 'liver_kidney', 'thyroid', 'hypertension', 'contraceptive', 'sedatives', 'allergy'];
const SLEEP = ['restorative_6plus', 'not_restorative_6plus', 'under_6', 'very_broken', 'restorative', 'hard_onset', 'wakes_middle', 'early_wake', 'sleeps_no_rest', 'vivid_restless'];
const NOTES = ['', '', 'sleep first', 'constipated for weeks', 'energy back before anything else', 'grief since July, heavy heart',
  'on sertraline since spring', 'just found out I am pregnant', 'Hashimoto, on levothyroxine',
  'bad reaction to ashwagandha last year', 'valerian made me groggy, reishi was lovely'];

function randomProfile() {
  const goals = [pick(GOALS)];
  while (goals.length < 3 && rnd() < 0.5) { const g = pick(GOALS); if (!goals.includes(g)) goals.push(g); }
  const flags = rnd() < 0.35 ? ['none'] : some(FLAGS, 3);
  const pro = rnd() < 0.5;
  const p = {
    intention: goals[0], intentions: goals,
    pattern: pick(['hot', 'cold', 'mixed', 'depleted']),
    time: pick(['morning', 'midday', 'evening', 'night', 'any']),
    stress: pick(['push', 'collapse', 'numb', 'ride', 'off']),
    duration: pick(['weeks', 'months', 'year_plus', 'lifelong']),
    age: pick(['under_18', 'under_25', '25_40', '41_60', '60_plus']),
    sleep: pick(SLEEP),
    avoid: flags.length ? flags : ['none'],
    notes: pick(NOTES),
    nervous: pick([undefined, 'wired', 'tired', 'wired_tired', 'steady', 'reactive', 'flat']),
    energy_curve: pick([undefined, 'low_waking', 'am_good_pm_crash', 'high_unstable', 'waves', 'crash_mental']),
    _gatedOptIn: rnd() < 0.3, _ageConfirmed: true,
  };
  if (pro) Object.assign(p, {
    _pro: rnd() < 0.5,
    support: pick(['gentle_daily', 'noticeable', 'deep_restore', 'acute', 'constitutional', 'performance', 'seasonal', 'exploring']),
    digestion: pick(['strong', 'bloated', 'burning', 'cold_sluggish', 'anxious_gut', 'irregular', 'constipated']),
    emotional: pick(['spacious', 'grief_chest', 'worry_loops', 'flat', 'overwhelmed', 'angry', 'lonely']),
    somatic: some(['head_mind', 'chest_breath', 'heart', 'gut', 'liver_right', 'pelvis', 'muscles_joints', 'skin'], 3),
    cycle: pick(['not_applicable', 'regular', 'pms_heavy', 'painful', 'perimenopause', 'trying_conceive']),
    prior_herbs: some(['never', 'bad_reaction', 'stimulants_sensitive', 'adaptogens_regular', 'mushrooms_regular'], 2),
  });
  return p;
}

const pool = ensurePool();
const byName = new Map(pool.map(h => [h.name, h]));
const HIGH = new Set(['HIGH', 'VERY HIGH']);
const fails = [];
const fail = (rule, p, detail) => { if (fails.length < 25) fails.push(rule + ' — ' + detail + '\n      profile: ' + JSON.stringify(p)); };
const counts = {};
const count = rule => { counts[rule] = (counts[rule] || 0) + 1; };

// Every documented rule, on one bottle. `r` is an engine result
// (compileFormula or composeFormulaWithMyco) with status 'ok'.
function checkBottle(p, r, tag) {
  const herbs = r._engineHerbs;
  const minor = p.age === 'under_18';
  // The flags the bottle was built under: the ticked ones AND any the
  // note named (D1). Every rule below reads these, not only p.avoid.
  const flags = (r.safetyFlags || []).filter(f => f !== 'none');
  const pregnant = flags.includes('pregnancy') || p.cycle === 'trying_conceive';
  const prior = p.prior_herbs || [];
  const goals = [p.intention].concat(p.intentions);
  const pcts = r.herbs.map(h => h.percentage);
  const names = tag + herbs.map(h => h.name).join(', ');

  const sum = pcts.reduce((a, b) => a + b, 0);
  if (sum !== 100) fail('percentages sum to 100', p, sum);
  if (pcts.some(x => x < 1)) fail('every herb at least 1%', p, pcts.join(','));
  const withPct = herbs.map((h, k) => [h, pcts[k]]);
  const traces = withPct.filter(([h]) => isTrace(h));
  const mains = withPct.filter(([h]) => !isTrace(h));
  if (traces.length > 1) fail('at most 1 trace herb', p, names);
  if (traces.some(([, x]) => x > 5)) fail('trace herb at most 5%', p, traces.map(([h, x]) => h.name + ' ' + x).join(','));
  if (mains.some(([, x]) => x > 40)) fail('no herb above 40% (D3)', p, mains.map(([h, x]) => h.name + ' ' + x).join(','));
  if (traces.length + herbs.filter(isAmanita).length && herbs.length < 4) fail('a small-share herb only in a bottle of four or more', p, names);
  if (mains.filter(([h]) => !isAmanita(h)).length < 3) fail('at least three herbs at the full share', p, names);
  if (traces.length && herbs.length < 4) fail('a trace herb only in a bottle of four or more', p, names);
  if (JSON.stringify(pcts) !== JSON.stringify(assignPercentages(herbs))) fail('percentages are the engine\'s own (D2)', p, pcts.join(','));
  if (herbs.filter(P.isGABAergic).length > 2) fail('at most 2 sedatives', p, names);
  if (herbs.filter(P.isCNSStimulant).length > 2) fail('at most 2 stimulating herbs', p, names);
  if (herbs.some(P.isGABAergic) && herbs.some(P.isStrongStimulant)) fail('no sedative beside a true stimulant', p, names);
  if (herbs.filter(P.isSerotonergic).length > P.MAX_SEROTONERGIC) fail('at most 1 serotonergic herb', p, names);
  if (herbs.filter(P.isLaxative).length > P.MAX_LAXATIVE) fail('at most 1 laxative', p, names);
  if (herbs.filter(isAmanita).length > 1) fail('at most one Amanita', p, names);
  if (withPct.some(([h, x]) => isAmanita(h) && x > 10)) fail('an Amanita at most 10% of the bottle', p, withPct.filter(([h]) => isAmanita(h)).map(([h, x]) => h.name + ' ' + x).join(','));
  if (herbs.some(isAmanita) && herbs.some(P.isStJohnsWort)) fail("never an Amanita beside St John's Wort", p, names);
  for (const x of detectNoteHerbAvoidance(p.notes, pool)) if (herbs.some(h => h.id === x.id)) fail('a herb the note says to avoid is never seated', p, x.name + ' (' + x.word + ')');
  if (herbs.some(h => isRestricted(h))) fail('no restricted plant', p, names);
  if (herbs.some(h => h.proOnly) && !(p._pro === true && !minor)) fail('pro-only herb only for a pro adult', p, names);
  if (herbs.some(h => /yohimb/i.test(h.name)) && !(p._pro === true && !minor)) fail('Yohimbe never in a customer bottle (D11)', p, names);
  if (minor && herbs.some(h => !passesMinorGate(h))) fail('under-18: every herb passes the minor gate', p, names);
  if (pregnant && herbs.some(h => h.safe_pregnancy !== true)) fail('pregnancy / conceiving: only recorded pregnancy-safe herbs', p, names);
  if (prior.includes('stimulants_sensitive') && herbs.some(P.isCNSStimulant)) fail('stimulant-sensitive: no stimulating herb', p, names);
  if (prior.includes('bad_reaction') && herbs.some(h => HIGH.has(h.caution_level))) fail('bad reaction before: no HIGH-caution herb', p, names);
  for (const hit of detectNoteSafety(p.notes)) if (!flags.includes(hit.flag)) fail('a safety word in the note applies its flag (D1)', p, hit.word + ' → ' + hit.flag);
  for (const h of herbs) for (const f of flags) if ((h._ax.flags || []).includes(f)) fail('no herb carries an applied safety flag', p, h.name + ' has ' + f);
  if ((p.time === 'evening' || p.time === 'night' || p.intention === 'sleep') && herbs.some(P.isCNSStimulant)) fail('evening / sleep: nothing stimulating', p, names);
  if (p.intentions.includes('sleep') && herbs.some(P.isStrongStimulant)) fail('sleep as any goal: no true stimulant', p, names);
  if (herbs.some(P.isLaxative)) {
    const constipated = p.digestion === 'constipated' || /constipat/i.test(p.notes || '');
    if (!constipated || !(goals.includes('digestion') || goals.includes('detox'))) fail('laxative only for reported constipation with a digestion/detox goal', p, names);
  }
}

// ── Part A · every rule, every bottle ─────────────────────────────
const N = 600;
let composed = 0;
const profiles = [];
for (let i = 0; i < N; i++) {
  const p = randomProfile();
  profiles.push(p);
  const r = E.compileFormula(p);
  if (r.status === 'no_match') {
    if (r.code !== 'NO_MATCH' && r.code !== 'NO_SAFE_MATCH') fail('no bottle → NO_MATCH or NO_SAFE_MATCH', p, r.code);
    count('no bottle (' + r.code + ')');
    continue;
  }
  if (r.status !== 'ok') { fail('valid profile rejected', p, r.code); continue; }
  composed++;
  checkBottle(p, r, '');
  const again = E.compileFormula(JSON.parse(JSON.stringify(p)));
  if (JSON.stringify(again.herbs.map(h => [h.name, h.percentage])) !== JSON.stringify(r.herbs.map(h => [h.name, h.percentage]))) fail('same answers, same bottle', p, 'differs on a second run');
  if (p.avoid.length > 1) {
    const flipped = E.compileFormula(Object.assign({}, p, { avoid: [...p.avoid].reverse() }));
    if (flipped.herbs.map(h => h.name).join() !== r.herbs.map(h => h.name).join()) fail('safety answers in any order, same bottle', p, 'order changed the bottle');
  }
  if (r.noteSafety && r.noteSafety.flagsAdded.length) count('bottles where the note added a safety flag');
  if (p.age === 'under_18') count('minor profiles checked');
  if ((r.safetyFlags || []).includes('pregnancy') || p.cycle === 'trying_conceive') count('pregnancy / conceiving profiles checked');
  if (p._pro) count('pro profiles checked');
}

// ── Part B · the safety question's input rules ────────────────────
const base = { intention: 'stress', intentions: ['stress'], pattern: 'mixed', time: 'any', stress: 'push', duration: 'months', age: '25_40', sleep: 'restorative_6plus', _ageConfirmed: true };
const expect = (avoid, code) => {
  const r = E.compileFormula(Object.assign({}, base, { avoid }));
  if (r.status !== 'rejected' || r.code !== code) fail('safety input ' + JSON.stringify(avoid) + ' → ' + code, { avoid }, r.status + ' ' + (r.code || ''));
};
expect(undefined, 'SAFETY_QUESTION_NOT_ANSWERED');
expect([], 'SAFETY_QUESTION_NOT_ANSWERED');
expect(['none', 'pregnancy'], 'SAFETY_FLAGS_CONFLICT');
expect(['nonsense', 'none'], 'SAFETY_FLAG_UNKNOWN');
expect(['pregnacy', 'thyroid'], 'SAFETY_FLAG_UNKNOWN');
expect([42], 'SAFETY_FLAG_UNKNOWN');

// D1 · "none" ticked, pregnancy in the note → the pregnancy rule applies.
{
  const p = Object.assign({}, base, { avoid: ['none'], notes: 'Just found out I am pregnant!' });
  const r = E.compileFormula(p);
  if (r.status !== 'ok' || !r.noteSafety.flagsAdded.includes('pregnancy') || r.safetyFlags.includes('none')) fail('note "pregnant" applies the pregnancy flag and drops "none"', p, JSON.stringify(r.noteSafety) + ' ' + JSON.stringify(r.safetyFlags));
  else if (r._engineHerbs.some(h => h.safe_pregnancy !== true)) fail('note "pregnant": only recorded pregnancy-safe herbs', p, r.herbs.map(h => h.name).join(', '));
}
// D1 · a flag already ticked is not reported again.
{
  const r = E.compileFormula(Object.assign({}, base, { avoid: ['psych_meds'], notes: 'on sertraline' }));
  if (r.noteSafety.flagsAdded.length) fail('a ticked flag named again in the note is not "added"', { notes: 'on sertraline' }, JSON.stringify(r.noteSafety));
}
// Categories · "mushroom" is exactly the fungi (recorded family), not a
// word search: Dandelion ("lion") and Ginkgo used to count as mushrooms.
{
  const called = pool.filter(h => P.categoryOf(h) === 'mushroom');
  const plants = called.filter(h => !P.isFungus(h));
  const missed = pool.filter(h => P.isFungus(h) && P.categoryOf(h) !== 'mushroom');
  if (plants.length || missed.length) fail('mushroom category = the fungi', {}, 'plants: ' + plants.map(h => h.name).join(', ') + ' · missed: ' + missed.map(h => h.name).join(', '));
  else count('mushroom category = the ' + called.length + ' fungi');
}

// D3 · more safety flags no longer make a bigger bottle.
if (targetHerbCount(Object.assign({}, base, { avoid: ['none'] })) !== targetHerbCount(Object.assign({}, base, { avoid: ['thyroid', 'allergy', 'autoimmune'] })))
  fail('safety flags do not change the bottle size (D3)', base, 'target changed with 3 flags');

// D3 · too few herbs for a bottle. No real profile gets here with the
// full catalogue (under-18 + all ten flags still composes), so the
// catalogue is shrunk for a moment: the engine caches one pool array.
const withPool = (herbs, fn) => {
  const live = ensurePool(), saved = live.slice();
  live.splice(0, live.length, ...herbs);
  try { return fn(); } finally { live.splice(0, live.length, ...saved); }
};
const stressBottle = E.compileFormula(Object.assign({}, base, { avoid: ['none'] }))._engineHerbs.map(h => byName.get(h.name));
// Two herbs → NO_MATCH, safety or not.
withPool(stressBottle.slice(0, 2), () => {
  const r = E.compileFormula(Object.assign({}, base, { avoid: ['none'] }));
  if (r.status !== 'no_match' || r.code !== 'NO_MATCH') fail('two herbs in the pool → NO_MATCH', base, r.status + ' ' + r.code);
});
// A pool that fills a bottle until the safety answers empty it → NO_SAFE_MATCH.
const flagged = stressBottle.filter(h => !isTrace(h) && (h._ax.flags || []).length);
const theirFlags = [...new Set(flagged.flatMap(h => h._ax.flags))].filter(f => FLAGS.includes(f));
if (flagged.length >= 3) withPool(flagged, () => {
  const r = E.compileFormula(Object.assign({}, base, { avoid: theirFlags }));
  if (r.status !== 'no_match' || r.code !== 'NO_SAFE_MATCH') fail('safety answers empty the pool → NO_SAFE_MATCH', { avoid: theirFlags }, r.status + ' ' + r.code);
  else count('NO_MATCH and NO_SAFE_MATCH checked on a shrunk pool');
});
else fail('NO_SAFE_MATCH check has a pool to work with', base, flagged.length + ' flagged herbs in the stress bottle');

// ── Part C · through the real HTTP handler ────────────────────────
(async () => {
  const mod = await import(pathToFileURL(path.join(__dirname, '../netlify/functions/fyf-compose.mjs')).href);
  const call = async (profile, ip) => {
    const res = await mod.default(new Request('http://localhost:8888/api/fyf/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-FYF-Mode': 'shadow', 'x-forwarded-for': ip },
      body: JSON.stringify({ profile }),
    }));
    return { status: res.status, body: await res.json() };
  };
  // A modified client: under-18 age, "none" for safety, no _minor flag,
  // asking for the ceremonial herbs. The server must still gate it.
  const kidAsks = { intention: 'sleep', intentions: ['sleep', 'mood'], pattern: 'mixed', time: 'night', stress: 'off', duration: 'months', age: 'under_18', sleep: 'hard_onset', avoid: ['none'], _gatedOptIn: true, _ageConfirmed: true };
  const kid = await call(kidAsks, '203.0.113.7');
  if (kid.status !== 200) fail('HTTP under-18 profile composes', kidAsks, kid.status);
  else {
    const bad = kid.body.formula.herbs.map(h => byName.get(h.name)).filter(h => !h || !passesMinorGate(h));
    if (bad.length) fail('HTTP under-18: server applies the minor gate itself', kidAsks, bad.map(h => h ? h.name : '?').join(', '));
    count('HTTP under-18 bottle: ' + kid.body.formula.herbs.map(h => h.name).join(', '));
  }
  // _pro without a verified practitioner is refused.
  const proAsk = Object.assign({}, base, { avoid: ['none'], _pro: true });
  const pro = await call(proAsk, '203.0.113.8');
  if (pro.status !== 403 || pro.body.code !== 'PRACTITIONER_REQUIRED') fail('HTTP _pro without a practitioner → 403', proAsk, pro.status + ' ' + pro.body.code);
  // An unknown safety value is refused on the wire too.
  const typo = await call(Object.assign({}, base, { avoid: ['pregnacy'] }), '203.0.113.9');
  if (typo.status !== 400 || typo.body.code !== 'SAFETY_FLAG_UNKNOWN') fail('HTTP unknown safety value → 400 SAFETY_FLAG_UNKNOWN', { avoid: ['pregnacy'] }, typo.status + ' ' + typo.body.code);
  // D1 on the wire: the note's safety word comes back so the page can say so.
  const noted = await call(Object.assign({}, base, { avoid: ['none'], notes: 'on sertraline since spring' }), '203.0.113.10');
  const ns = noted.body && noted.body.noteSafety;
  if (noted.status !== 200 || !ns || ns.flagsAdded[0] !== 'psych_meds' || ns.hits[0].word !== 'sertraline' || !noted.body.safetyReport.flagsApplied.includes('psych_meds'))
    fail('HTTP note safety word → noteSafety + flagsApplied', { notes: 'on sertraline since spring' }, noted.status + ' ' + JSON.stringify(ns));
  // No bottle on the wire: 422 with the engine's code, not a 200 with nothing in it.
  const live = ensurePool(), saved = live.slice();
  live.splice(0, live.length, ...stressBottle.slice(0, 2));
  let none;
  try { none = await call(Object.assign({}, base, { avoid: ['none'] }), '203.0.113.11'); }
  finally { live.splice(0, live.length, ...saved); }
  if (none.status !== 422 || none.body.code !== 'NO_MATCH') fail('HTTP too few herbs → 422 NO_MATCH', base, none.status + ' ' + none.body.code);

  // ── Part D · the MYCO path, with a stand-in for Anthropic ────────
  // The stand-in reads the shortlist the engine sends, picks herbs the
  // way a careful MYCO would (respecting every tag), and asks for absurd
  // percentages: 90% for the first herb. The engine must ignore them.
  let calls = 0;
  const fakeMyco = async (url, init) => {
    calls++;
    const user = JSON.parse(init.body).messages[0].content;
    if (!/<<<NOTE\n[\s\S]*\nNOTE>>>/.test(user)) fail('MYCO sees the note fenced as untrusted text', {}, user.slice(0, 120));
    const rows = [...user.matchAll(/^\d+\. id=(\S*) · .*? · category:(\S+) · pre-score:[^\s·]+(?: · (\S+))?$/gm)]
      .map(m => ({ id: m[1], cat: m[2], tags: (m[3] || '').split('/') }));
    const used = { cat: {}, TRACE: 0, GABA: 0, STIM: 0, SERO: 0, LAX: 0, STRONG: 0 };
    const picked = [];
    for (const x of rows) {
      if (picked.length >= 5) break;
      const t = new Set(x.tags);
      if ((used.cat[x.cat] || 0) >= 2 || (t.has('TRACE') && used.TRACE) || (t.has('GABA') && (used.GABA >= 2 || used.STRONG)) ||
          (t.has('STIM') && used.STIM >= 2) || (t.has('STRONG') && used.GABA) || (t.has('SERO') && used.SERO) || (t.has('LAX') && used.LAX)) continue;
      used.cat[x.cat] = (used.cat[x.cat] || 0) + 1;
      for (const k of ['TRACE', 'GABA', 'STIM', 'SERO', 'LAX', 'STRONG']) if (t.has(k)) used[k]++;
      picked.push({ id: x.id, pct: picked.length ? 2 : 90, reason: 'test' });
    }
    const overall = 'A test reading. See https://evil.example and [this](http://x.example) <b>now</b>, write to a@b.example.';
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: JSON.stringify({ picked, overall }) }] }) };
  };
  let mycoBottles = 0;
  const log = console.log; console.log = () => {};   // compose logs every fallback
  try {
    for (const p of profiles.slice(0, 120)) {
      const r = await E.composeFormulaWithMyco(p, { apiKey: 'test-stand-in', fetchImpl: fakeMyco });
      if (r.status !== 'ok') continue;
      if (r.mycoUsed === true) {
        mycoBottles++; checkBottle(p, r, 'MYCO: ');
        if (/https?:|www\.|[<>\[\]]|@/.test(r.mycoOverall)) fail('no links, markup or addresses in MYCO text', p, r.mycoOverall);
      }
      else checkBottle(p, r, 'fallback: ');
    }
  } finally { console.log = log; }
  count('MYCO bottles checked (stand-in, ' + calls + ' calls, no network): ' + mycoBottles);

  console.log('  profiles composed: ' + composed + ' of ' + N);
  for (const [k, v] of Object.entries(counts)) console.log('  · ' + k + (v > 1 ? ': ' + v : ''));
  if (fails.length) {
    console.log('\n  ✗ ' + fails.length + (fails.length === 25 ? '+' : '') + ' rule violation(s):');
    fails.forEach(f => console.log('    ✗ ' + f));
  } else {
    console.log('  ✓ every documented rule held on every bottle, on the wire and through MYCO');
  }
  console.log('\npassed: ' + (fails.length ? 0 : 1) + '\nfailed: ' + (fails.length ? 1 : 0));
  process.exit(fails.length ? 1 : 0);
})();
