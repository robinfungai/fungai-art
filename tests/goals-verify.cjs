// tests/goals-verify.cjs
//
// Every herb carries a recorded `goals` list (herbs.ts, 2026-09-28), and
// the engine reads it instead of guessing goals from the prose. This test
// keeps it that way: a new herb without goals, or with a goal the quiz
// does not have, fails the build — the same discipline as cns_action.
// It also pins the properties the goal scoring promises.

const path = require('path');
const { getAllHerbs } = require(path.join(__dirname, '../src/server/herb-data'));
const { inferAxes } = require(path.join(__dirname, '../src/server/formula-engine/axes.js'));
const { scoreBreakdown } = require(path.join(__dirname, '../src/server/formula-engine/scoring.js'));

const GOALS = new Set(['stress', 'anxiety', 'sleep', 'energy', 'mood', 'cognitive',
  'hormones', 'digestion', 'immunity', 'pain', 'detox', 'beauty']);

const cases = [];
const check = (name, run) => cases.push({ name, run });
const herbs = getAllHerbs();

check('every herb records goals', () => {
  const missing = herbs.filter(h => !Array.isArray(h.goals)).map(h => h.name);
  return { pass: !missing.length, detail: missing.slice(0, 10).join(', ') };
});

check('every recorded goal is one of the twelve quiz goals', () => {
  const bad = [];
  herbs.forEach(h => (h.goals || []).forEach(g => { if (!GOALS.has(g)) bad.push(h.name + ':' + g); }));
  return { pass: !bad.length, detail: bad.slice(0, 10).join(', ') };
});

check('no herb lists a goal twice or more than four goals', () => {
  const bad = herbs.filter(h => Array.isArray(h.goals) && (new Set(h.goals).size !== h.goals.length || h.goals.length > 4)).map(h => h.name);
  return { pass: !bad.length, detail: bad.join(', ') };
});

check('the engine reads recorded goals, untruncated', () => {
  const bad = herbs.filter(h => Array.isArray(h.goals) && inferAxes(h).intentions.join() !== [...new Set(h.goals)].join()).map(h => h.name);
  return { pass: !bad.length, detail: bad.slice(0, 10).join(', ') };
});

check('the three ranked goals keep a strict hierarchy', () => {
  // A goal that is the herb's 4th use vs one that is its main use.
  const mk = goals => ({ name: 'x', _ax: { intentions: goals, patterns: [], times: [], stress: [] } });
  const a = g => ({ intention: g[0], intentions: g });
  const late = mk(['energy', 'mood', 'sleep', 'stress']), main = mk(['stress']);
  const weakest1   = scoreBreakdown(late, a(['stress', 'pain', 'beauty'])).parts.goal1;
  const strongest2 = scoreBreakdown(main, a(['pain', 'stress', 'beauty'])).parts.goal2;
  const weakest2   = scoreBreakdown(late, a(['pain', 'stress', 'beauty'])).parts.goal2;
  const strongest3 = scoreBreakdown(main, a(['pain', 'beauty', 'stress'])).parts.goal3;
  return { pass: weakest1 > strongest2 && weakest2 > strongest3,
    detail: [weakest1, strongest2, weakest2, strongest3].join(' / ') };
});

let failed = 0;
for (const c of cases) {
  let r;
  try { r = c.run(); } catch (e) { r = { pass: false, detail: e.message }; }
  if (!r.pass) failed++;
  console.log((r.pass ? '  ✓ ' : '  ✗ ') + c.name + (r.pass || !r.detail ? '' : '  — ' + r.detail));
}
console.log('\npassed: ' + (cases.length - failed) + '\nfailed: ' + failed);
process.exit(failed ? 1 : 0);
