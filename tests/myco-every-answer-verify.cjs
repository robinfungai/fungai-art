// tests/myco-every-answer-verify.cjs
//
// "Every answer counts" (Robin, 2026-09-29). Two answers of the consumer
// quiz — how the energy usually feels (nervous system) and how it moves
// through the day — never reached MYCO, and MYCO could not see what each
// herb's record says it suits. This check reads the question keys from
// the quiz page itself, so a question added later cannot be left out
// silently: every answer must appear in what MYCO is sent.

const fs = require('fs');
const path = require('path');
const R = p => require(path.join(__dirname, '..', p));
const M = R('src/server/formula-engine/myco.js');
const { ensurePool } = R('src/server/formula-engine/axes.js');

const results = [];
const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });

const page = fs.readFileSync(path.join(__dirname, '../public/find-your-formula/index.html'), 'utf8');
const keys = [...new Set([...page.matchAll(/key:'(\w+)'/g)].map(m => m[1]))];

// One answer per question, each written so it can be found in the prompt.
const ANSWER = {
  intention: ['energy', 'energy'], pattern: ['cold', 'cold'], time: ['evening', 'evening'], stress: ['collapse', 'collapse'],
  duration: ['year_plus', 'year_plus'], age: ['41_60', '41_60'], sleep: ['wakes_middle', 'wakes in the night'],
  nervous: ['wired_tired', 'wired and tired'], energy_curve: ['am_good_pm_crash', 'crash around 2–4 pm'],
  avoid: [['thyroid'], 'thyroid'], notes: ['my own words about winter', 'my own words about winter'],
};
const quiz = {};
for (const k of keys) if (ANSWER[k]) quiz[k] = ANSWER[k][0];
const text = M._buildComposeUser(quiz, '(shortlist)', '');

check('the quiz page lists its questions (' + keys.length + ')', keys.length >= 10, keys.join(', '));
for (const k of keys) {
  if (!ANSWER[k]) { check('answer "' + k + '" has a test value — add one here', false, 'new question on the quiz page'); continue; }
  check('MYCO is sent the "' + k + '" answer', text.includes(ANSWER[k][1]), '');
}

let pool = ensurePool(); if (!Array.isArray(pool)) pool = pool.herbs || Object.values(pool);
const valerian = pool.find(h => h.name === 'Valerian');
const line = M._buildShortlistText([valerian]);
check("MYCO sees what a herb's record says it suits", /suits nervous system: .*wired/.test(line) && /sleep: falling asleep, staying asleep/.test(line), line.split('\n').pop());

for (const r of results) console.log('  ' + (r.ok ? '✓' : '✗') + ' ' + r.name + (r.ok || !r.detail ? '' : '  — ' + r.detail));
const failed = results.filter(r => !r.ok).length;
console.log('\npassed: ' + (results.length - failed) + '\nfailed: ' + failed);
process.exit(failed ? 1 : 0);
