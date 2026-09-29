// tests/micronutrient-untrusted-verify.cjs
//
// Round 2 · Item #6, then hardening checklist #3 (2026-09-29). The
// micronutrient advisory, the reading and the herb notes in the
// reservation emails used to be computed in the browser and sent with
// the reservation — untrusted, so Robin's email printed them under an
// "UNVERIFIED / client-computed" banner. Now reserve-formula computes all
// three from the STORED answers and formula. These tests prove:
//   · reserve-formula reads none of them from the request body
//   · it computes them server-side (micronutrients.js, display.js, and
//     MYCO's stored reading through the sanitiser)
//   · the server module gives the same answers the page used to
//   · the page no longer computes or sends them
//
//   node tests/micronutrient-untrusted-verify.cjs

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const SRC  = read('netlify/functions/reserve-formula.mjs');
const PAGE = read('public/find-your-formula/index.html');
const PRO  = read('public/find-your-formula-pro/index.html');
const { computeMicronutrients, MN_CATALOGUE } = require(path.join(ROOT, 'src/server/formula-engine/micronutrients.js'));

const results = [];
const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail: detail || '' });

// ── The server ignores what the browser sends ──────────────────────
for (const f of ['possibleMicronutrients', 'storyText', 'herbNotes']) {
  check('reserve-formula never reads body.' + f, !new RegExp('body\\.' + f + '\\b').test(SRC));
}
check('reserve-formula computes the micronutrients itself', /computeMicronutrients\(quiz, enrichedHerbs\)/.test(SRC));
check('… the reading from display.js or MYCO\'s stored reading, sanitised', /buildDisplayBundle\(/.test(SRC) && /sanitiseNarrative\(storedFormula\.mycoOverall/.test(SRC));
check('Robin\'s email no longer calls the list client-computed', !/UNVERIFIED \(client-computed\)/.test(SRC.replace(/\/\/.*$/gm, '')));

// ── The server module works ────────────────────────────────────────
const a = { intention: 'sleep', intentions: ['sleep', 'stress'], pattern: 'depleted', time: 'night', stress: 'push', avoid: ['none'], age: '25_40', sleep: 'hard_onset' };
const list = computeMicronutrients(a, [{ name: 'Valerian' }, { name: 'Chamomile' }]);
check('a sleep + stress profile gets suggestions, best first', Array.isArray(list) && list.length > 0 && list[0].nutrient === MN_CATALOGUE.mg.n, list.map(x => x.nutrient).slice(0, 3).join(', '));
check('every suggestion has a nutrient, a reason under 300 characters and a priority 1–10',
  list.every(x => typeof x.nutrient === 'string' && typeof x.reason === 'string' && x.reason.length <= 300 && x.priority >= 1 && x.priority <= 10));
check('at most 10 suggestions', list.length <= 10, String(list.length));
const preg = computeMicronutrients({ ...a, avoid: ['pregnancy'] }, []);
check('pregnancy switches to its whitelist (no melatonin, no 5-HTP)', !preg.some(x => /melatonin|5-HTP/i.test(x.nutrient)), preg.map(x => x.nutrient).join(', '));
check('empty answers do not throw', Array.isArray(computeMicronutrients({}, [])));

// ── The page no longer computes or sends them ──────────────────────
for (const [name, page] of [['Find your formula', PAGE], ['pro', PRO]]) {
  check(name + ': no computeMicronutrients / MN_CATALOGUE in the browser', !/function computeMicronutrients|const MN_CATALOGUE/.test(page));
  check(name + ': the reservation sends no possibleMicronutrients, storyText or herbNotes', !/^\s*(possibleMicronutrients|storyText|herbNotes)\s*[,:]/m.test(page));
}

for (const r of results) console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.name + (r.ok || !r.detail ? '' : '  — ' + r.detail));
const failed = results.filter(r => !r.ok).length;
console.log('\n  passed: ' + (results.length - failed) + '   failed: ' + failed);
process.exit(failed ? 1 : 0);
