// tests/herb-record-classes-verify.cjs
//
// The herb record is the source of truth for the classes the bottle's
// rules count (external audit 2026-09-29, #26). The engine reads:
//   laxative: true        pharmacology.js isLaxative
//   trace_class           traces.js isTrace / traceReason
//   serotonergic: true    pharmacology.js isSerotonergic
//   max_share_pct         percentages.js smallShareCap
// This check fails when a herb's own text points one way and its record
// the other — so a new herb cannot slip past the rules because nobody
// filled in the field. Run it after any herb is added or edited
// (part of the "herbs everywhere" checklist).

const path = require('path');
const R = p => require(path.join(__dirname, '..', p));
const HERBS = R('src/server/herb-data/herbs.generated.cjs');
const { laxativeInProse, isLaxative } = R('src/server/formula-engine/pharmacology.js');
const { TRACE_CLASSES, nameSuggestsTrace, suggestedTraceClass, isTrace } = R('src/server/formula-engine/traces.js');

const results = [];
const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });
const names = list => list.map(h => h.id + ' ' + h.name).join(', ');

// laxative
const laxMissing = HERBS.filter(h => laxativeInProse(h) && !isLaxative(h));
check('every herb whose text says laxative / purgative / cathartic records laxative: true', !laxMissing.length, names(laxMissing));
const laxBad = HERBS.filter(h => h.laxative !== undefined && h.laxative !== true);
check('laxative is only ever true', !laxBad.length, names(laxBad));

// trace
const traceMissing = HERBS.filter(h => nameSuggestsTrace(h) && !isTrace(h));
check('every herb named like a trace herb records a trace_class', !traceMissing.length, names(traceMissing));
const traceBad = HERBS.filter(h => h.trace_class !== undefined && !TRACE_CLASSES.includes(h.trace_class));
check('trace_class is one of ' + TRACE_CLASSES.join(' / '), !traceBad.length, names(traceBad));
const traceOdd = HERBS.filter(h => isTrace(h) && suggestedTraceClass(h) && suggestedTraceClass(h) !== h.trace_class);
check('recorded trace_class agrees with the name-based reason where both exist', !traceOdd.length,
  traceOdd.map(h => h.name + ' recorded ' + h.trace_class + ', name says ' + suggestedTraceClass(h)).join('; '));

// serotonergic
const seroBad = HERBS.filter(h => h.serotonergic !== undefined && h.serotonergic !== true);
check('serotonergic is only ever true', !seroBad.length, names(seroBad));

// max_share_pct
const capBad = HERBS.filter(h => h.max_share_pct !== undefined && !(Number.isFinite(h.max_share_pct) && h.max_share_pct >= 1 && h.max_share_pct < 40));
check('max_share_pct is a number from 1 to 39', !capBad.length, names(capBad));
check('Saffron is held to 7% (Robin, 2026-09-29)', (HERBS.find(h => h.name === 'Saffron') || {}).max_share_pct === 7, '');

for (const r of results) console.log('  ' + (r.ok ? '✓' : '✗') + ' ' + r.name + (r.ok || !r.detail ? '' : '  — ' + r.detail));
const failed = results.filter(r => !r.ok).length;
console.log('\npassed: ' + (results.length - failed) + '\nfailed: ' + failed);
process.exit(failed ? 1 : 0);
