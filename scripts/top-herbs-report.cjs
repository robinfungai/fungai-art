// scripts/top-herbs-report.cjs — npm run report:top-herbs
//
// Which herbs the Formula Maker actually puts in bottles (Robin,
// 2026-09-29: "take the 50 most common herbs and list them" — so their
// PubMed can go into the Academy lab notes first, where MYCO reads it).
// Runs the deterministic engine — the same one MYCO's picks are checked
// against and the one every fallback uses — over N random consumer
// profiles spread across every answer, and counts. No MYCO, no network,
// no cost. Writes docs/TOP-HERBS.md.

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const E = require(path.join(ROOT, 'src/server/formula-engine/index.js'));
const RECORDS = (() => { const m = require(path.join(ROOT, 'src/server/herb-data/herbs.generated.cjs')); return Array.isArray(m) ? m : (m.herbs || Object.values(m)); })();
const byId = new Map(RECORDS.map(h => [String(h.id), h]));

const N = Number(process.argv[2]) || 20000;
const TOP = 50;

let seed = 20260929;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];

const GOALS = ['stress', 'anxiety', 'sleep', 'energy', 'mood', 'cognitive', 'hormones', 'digestion', 'immunity', 'pain', 'detox', 'beauty'];
const FLAGS = ['pregnancy', 'cardio_meds', 'psych_meds', 'autoimmune', 'liver_kidney', 'thyroid', 'hypertension', 'contraceptive', 'sedatives', 'allergy'];
function profile() {
  const goals = [pick(GOALS)];
  while (goals.length < 3 && rnd() < 0.5) { const g = pick(GOALS); if (!goals.includes(g)) goals.push(g); }
  // Most people tick "none of these"; the rest one or two.
  const flags = rnd() < 0.65 ? ['none'] : [...new Set([pick(FLAGS), ...(rnd() < 0.3 ? [pick(FLAGS)] : [])])];
  return {
    intention: goals[0], intentions: goals,
    pattern: pick(['hot', 'cold', 'mixed', 'depleted']),
    time: pick(['morning', 'midday', 'evening', 'night', 'any']),
    stress: pick(['push', 'collapse', 'numb', 'ride', 'off']),
    duration: pick(['weeks', 'months', 'year_plus', 'lifelong']),
    age: pick(['under_25', '25_40', '25_40', '41_60', '41_60', '60_plus']),
    sleep: pick(['restorative_6plus', 'not_restorative_6plus', 'under_6', 'very_broken', 'hard_onset', 'wakes_middle', 'early_wake', 'sleeps_no_rest', 'vivid_restless']),
    nervous: pick(['wired', 'tired', 'wired_tired', 'steady', 'reactive', 'flat']),
    energy_curve: pick(['low_waking', 'am_good_pm_crash', 'slow_am_strong_pm', 'moderate', 'high_unstable', 'waves', 'crash_mental', 'crash_physical']),
    avoid: flags, notes: '', _gatedOptIn: rnd() < 0.3, _privacyConsentAcknowledged: true,
  };
}

const seen = new Map();   // id → { bottles, shareSum }
let bottles = 0;
for (let i = 0; i < N; i++) {
  const f = E.compileFormula(profile());
  if (f.status !== 'ok') continue;
  bottles++;
  for (const h of f.herbs) {
    const e = seen.get(String(h.id)) || { bottles: 0, shareSum: 0 };
    e.bottles++; e.shareSum += Number(h.percentage) || 0;
    seen.set(String(h.id), e);
  }
}

const rows = [...seen.entries()]
  .map(([id, e]) => ({ id, rec: byId.get(id), ...e }))
  .filter(r => r.rec)
  .sort((a, b) => b.bottles - a.bottles);
const binomial = r => String(r.botanical || '').replace(/\(.*?\)/g, ' ').split(/[/—;]/)[0].trim().split(/\s+/).slice(0, 2).join(' ');
const pubmed = r => 'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent('"' + binomial(r) + '"[tiab]') + '&filter=pubt.clinicaltrial&filter=pubt.meta-analysis&filter=pubt.systematicreview';

const pct = x => (100 * x).toFixed(1) + '%';
const lines = [
  '# The herbs in the bottles — top ' + TOP,
  '',
  '`npm run report:top-herbs` · ' + new Date().toISOString().slice(0, 10) + ' · ' + N.toLocaleString('en') + ' random consumer profiles → ' +
    bottles.toLocaleString('en') + ' bottles · ' + rows.length + ' different herbs used at least once.',
  '',
  'The deterministic engine (the one every MYCO pick is checked against, and every fallback uses). Answers spread',
  'evenly; 65% of profiles tick no safety flag; 30% opt in to gated herbs. **References** = how many the herb record',
  'carries now — the ones with few are where PubMed in the lab notes helps most. The PubMed link opens that plant\'s',
  'clinical trials, meta-analyses and systematic reviews.',
  '',
  '| # | Herb | in bottles | avg share | evidence | caution | references | PubMed |',
  '|---|---|---|---|---|---|---|---|',
  ...rows.slice(0, TOP).map((r, i) => '| ' + (i + 1) + ' | ' + r.rec.name + ' (id ' + r.id + ') | ' + pct(r.bottles / bottles) + ' | ' +
    (r.shareSum / r.bottles).toFixed(0) + '% | ' + (r.rec.evidence_grade || '—') + ' | ' + (r.rec.caution_level || '—') + ' | ' +
    (Array.isArray(r.rec.references) ? r.rec.references.length : 0) + ' | [search](' + pubmed(r.rec) + ') |'),
  '',
  'Herbs in the catalogue that no bottle used in this run: ' + (RECORDS.length - rows.length) + '.',
  '',
];
fs.writeFileSync(path.join(ROOT, 'docs/TOP-HERBS.md'), lines.join('\n'));
console.log('✓ docs/TOP-HERBS.md — ' + bottles + ' bottles from ' + N + ' profiles; top ' + TOP + ' written');
console.log(rows.slice(0, TOP).map((r, i) => (i + 1) + '. ' + r.rec.name + ' ' + pct(r.bottles / bottles) + ' · refs ' + (Array.isArray(r.rec.references) ? r.rec.references.length : 0)).join('\n'));
