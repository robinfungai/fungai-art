// tests/safety-rules-verify.cjs
//
// Academy P2 · the structured safety rules must carry exactly the same
// meaning as the prose the engine reads today.
//
// The engine filters herbs by avoid-flags inferred with regex at request
// time (formula-engine/axes.js). If the extracted rules disagree with
// that inference on even one herb, switching consumers over would
// silently change who gets which formula. So: parity first, herb for
// herb, before anything reads the new file.
//
//   node tests/safety-rules-verify.cjs

const { getAllHerbs } = require('../src/server/herb-data');
const { inferAxes }   = require('../src/server/formula-engine/axes');
const safety          = require('../src/data/safety-rules.generated.json');

const cases = [];
const t = (name, run) => cases.push({ name, run });

// ── Parity with the live engine ──────────────────────────────────
t('per-herb flags match the engine, herb for herb', () => {
  const herbs = getAllHerbs();
  const diffs = [];
  for (const h of herbs) {
    const engine = [...new Set(inferAxes(h).flags)].sort();
    const rules  = (safety.flagsByBotanicalId[h.id] || []).slice().sort();
    if (engine.join(',') !== rules.join(',')) {
      diffs.push(`${h.name}: engine[${engine}] vs rules[${rules}]`);
    }
  }
  return {
    pass: diffs.length === 0,
    detail: diffs.length ? diffs.slice(0, 5).join(' | ') + (diffs.length > 5 ? ` … +${diffs.length - 5}` : '')
                         : `${herbs.length} herbs identical`,
  };
});

t('the divergence between engine and per-rule flags is exactly the known 3', () => {
  // The engine joins every contraindication and drug interaction into one
  // string before matching, so a pattern can span two unrelated entries.
  // Bacopa, Catuaba and Peppermint pick up 'cardio_meds' that way — they
  // are withheld from anyone on heart medication with no rule behind it.
  // Documented here rather than silently fixed: changing it changes which
  // formulas those customers get, which is Robin's call.
  const expected = ['Bacopa', 'Catuaba', 'Peppermint'];
  const actual = safety.divergence.map(d => d.botanical).sort();
  return {
    pass: actual.join(',') === expected.join(','),
    detail: actual.length ? actual.map(a => a + ' (over-flagged)').join(', ') : 'none',
  };
});

t('per-rule flags never exceed what the engine allows', () => {
  // The opposite direction would be dangerous: a rule claiming a flag the
  // engine misses means the engine is under-filtering today.
  const worse = [];
  for (const [id, clean] of Object.entries(safety.flagsPerRuleByBotanicalId)) {
    const engine = safety.flagsByBotanicalId[id] || [];
    const missing = clean.filter(f => !engine.includes(f));
    if (missing.length) worse.push(id + ': ' + missing.join(','));
  }
  return { pass: worse.length === 0, detail: worse.slice(0, 5).join(' | ') || 'engine is never less strict' };
});

t('every herb in the catalogue has a flags entry', () => {
  const herbs = getAllHerbs();
  const missing = herbs.filter(h => !(h.id in safety.flagsByBotanicalId));
  return { pass: missing.length === 0, detail: missing.map(m => m.name).join(', ') || `${herbs.length} covered` };
});

// ── Structure ────────────────────────────────────────────────────
t('rule ids are unique', () => {
  const ids = safety.rules.map(r => r.id);
  return { pass: new Set(ids).size === ids.length, detail: `${ids.length} rules` };
});

t('every rule points at a real botanical', () => {
  const ids = new Set(getAllHerbs().map(h => h.id));
  const bad = safety.rules.filter(r => !ids.has(r.botanicalId));
  return { pass: bad.length === 0, detail: bad.slice(0, 3).map(b => b.id).join(', ') };
});

t('every rule has a subject and a known severity', () => {
  const known = new Set(['absolute', 'avoid', 'monitor', 'caution', 'unspecified']);
  const bad = safety.rules.filter(r => !r.subject || !known.has(r.severity));
  return { pass: bad.length === 0, detail: bad.slice(0, 3).map(b => b.id + ' ' + b.severity).join(', ') };
});

t('herb-to-herb cautions carry no avoid-flags', () => {
  // The engine reads only contraindications + drug interactions when
  // inferring flags. Flagging herb pairs here would quietly widen the
  // safety filter and drop herbs the engine currently allows.
  const leaked = safety.rules.filter(r => r.ruleType === 'herb_interaction' && r.flags.length);
  return { pass: leaked.length === 0, detail: leaked.slice(0, 3).map(l => l.id).join(', ') };
});

// ── Severity is actually being read, not guessed ─────────────────
t('the strongest wording lands as "absolute"', () => {
  const ash = safety.rules.filter(r => r.botanical === 'Ashwagandha');
  const graves = ash.find(r => /graves|hyperthyroid/i.test(r.subject));
  return {
    pass: !!(graves && graves.severity === 'absolute' && graves.flags.includes('thyroid')),
    detail: graves ? `${graves.subject} → ${graves.severity} [${graves.flags}]` : 'ashwagandha thyroid rule missing',
  };
});

t('"MONITOR" wording lands as monitor, not avoid', () => {
  const monitors = safety.rules.filter(r => /\bMONITOR\b/.test(r.reason || ''));
  const wrong = monitors.filter(r => r.severity !== 'monitor');
  return { pass: monitors.length > 0 && wrong.length === 0, detail: `${monitors.length} monitor rules, ${wrong.length} misread` };
});

t('subjects were split off the prose, not left whole', () => {
  // A parse that failed would leave the entire sentence as the subject.
  const longSubjects = safety.rules.filter(r => r.subject.length > 80);
  const share = longSubjects.length / Math.max(1, safety.rules.length);
  return { pass: share < 0.1, detail: `${longSubjects.length} of ${safety.rules.length} unsplit (${Math.round(share * 100)}%)` };
});

// ── Coverage ─────────────────────────────────────────────────────
t('pregnancy, cardio and psych flags all have rules behind them', () => {
  const need = ['pregnancy', 'cardio_meds', 'psych_meds', 'thyroid', 'autoimmune'];
  const missing = need.filter(f => !safety.rules.some(r => r.flags.includes(f)));
  return { pass: missing.length === 0, detail: missing.length ? 'no rules for ' + missing.join(', ') : need.join(', ') + ' covered' };
});

let passed = 0, failed = 0;
for (const c of cases) {
  let r;
  try { r = c.run(); } catch (e) { r = { pass: false, detail: e.message }; }
  if (r.pass) { passed++; console.log('  ✓ ' + c.name + (r.detail ? '  — ' + r.detail : '')); }
  else        { failed++; console.log('  ✗ ' + c.name + (r.detail ? '  — ' + r.detail : '')); }
}
console.log('');
console.log('  passed: ' + passed);
console.log('  failed: ' + failed);
process.exit(failed ? 1 : 0);
