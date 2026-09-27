/**
 * scripts/sync-herb-counts.cjs — every page that states how many herbs
 * the catalogue holds says the true number.
 *
 * On 2026-09-27 the site said 243, 212, 203, 201 and 199 in different
 * places while src/data/herbs.ts held 242. Each count had been typed by
 * hand the day it was true. This rewrites them from the catalogue on
 * every build, so adding a herb updates the atlas, /extraction,
 * /mixology, /health and the retired engine page at once. (The Academy's
 * count is written by build-academy.cjs.)
 *
 *   node scripts/sync-herb-counts.cjs          rewrite, report what changed
 *   node scripts/sync-herb-counts.cjs --check  change nothing; exit 1 if stale
 *
 * A new page that states a count: add its file and phrase below.
 */
const fs = require('fs');
const path = require('path');
const { getAllHerbs } = require('../src/server/herb-data');

const ROOT = path.join(__dirname, '..');
const CHECK = process.argv.includes('--check');
const N = getAllHerbs().length;

// [file, pattern with the count as group 1]. Only phrases that mean "the
// whole catalogue" — never a number that counts something else.
const TARGETS = [
  ['public/atlas/index.html',        /\b(\d{3}) organisms\b/g],
  ['src/islands/atlas-hero.tsx',     /\b(\d{3}) organisms\b/g],
  ['src/islands/atlas-explorer.tsx', /\b(\d{3}) organisms\b/g],
  ['public/extraction/index.html',   /\b(\d{3})-herb\b/g],
  ['public/mixology/index.html',     /\b(\d{3}) (?:botanicals|Botanicals|plants)\b/g],
  ['public/health/index.html',       /\b(\d{3})-herb materia medica\b/g],
  ['public/herbal-engine-2/index.html', /\b(\d{3})(?: plants|-plant database| botanicals deep)\b/g],
  ['public/find-your-formula/index.html',     /\b(\d{3})-herb catalog\b/g],
  ['public/find-your-formula-pro/index.html', /\b(\d{3})-herb catalog\b/g],
  ['public/community/spore/app-living.jsx',   /\b(\d{3})-(?:herb|entry) catalogue\b/g],
];

let stale = 0, changedFiles = 0;
for (const [rel, re] of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  let hits = 0, wrong = 0;
  const out = src.replace(re, (m, num) => {
    hits++;
    if (Number(num) === N) return m;
    wrong++;
    return m.replace(num, String(N));
  });
  if (!hits) { console.warn('  ? ' + rel + ' — no count phrase found (page reworded? update TARGETS)'); continue; }
  if (wrong) {
    stale += wrong;
    if (CHECK) console.log('  ✗ ' + rel + ' — ' + wrong + ' stale count(s)');
    else { fs.writeFileSync(file, out); changedFiles++; console.log('  ✓ ' + rel + ' — ' + wrong + ' count(s) → ' + N); }
  }
}
if (CHECK) {
  console.log(stale ? '✗ ' + stale + ' stated herb count(s) differ from the catalogue (' + N + '). Run: node scripts/sync-herb-counts.cjs' : '✓ every stated herb count is ' + N);
  process.exit(stale ? 1 : 0);
}
console.log('✓ herb counts: ' + N + (changedFiles ? ' (' + changedFiles + ' file(s) updated)' : ' (all already true)'));
