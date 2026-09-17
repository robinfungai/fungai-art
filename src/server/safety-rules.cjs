// src/server/safety-rules.cjs
//
// Academy P2 · the safety lookup layer (§16, §23).
//
// Safety stops being prose the model paraphrases and becomes rules any
// consumer can retrieve: MYCO can cite "ABSOLUTELY CONTRAINDICATED in
// Graves disease" with its severity and source, the reveal can explain
// WHY a herb was filtered out, and the admin panel can show what a
// formula is carrying.
//
// Reads src/data/safety-rules.generated.json (scripts/build-safety-rules.cjs).
//
//   rulesFor(110)                     → every rule for that plant
//   rulesFor(110, { minSeverity: 'avoid' })
//   flagsFor(110)                     → what the engine filters on today
//   whyFiltered(110, ['pregnancy'])   → the rules that justify exclusion
//   byFlag('thyroid')                 → every rule carrying that flag
//
// Two flag sets exist deliberately (see the generator): `engine` is what
// the formula engine acts on today, `perRule` is what individual rules
// actually support. They differ for 3 herbs where the engine's blob
// matching spans unrelated sentences. Callers get `engine` by default so
// nothing diverges from live behaviour without a deliberate decision.

const fs   = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'safety-rules.generated.json');

const SEVERITY_ORDER = ['unspecified', 'caution', 'monitor', 'avoid', 'absolute'];

let DB = null;
function load() {
  if (DB) return DB;
  try {
    DB = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  } catch (_) {
    DB = { rules: [], flagsByBotanicalId: {}, flagsPerRuleByBotanicalId: {}, divergence: [], counts: {} };
  }
  DB._byBotanical = new Map();
  for (const r of DB.rules) {
    if (!DB._byBotanical.has(r.botanicalId)) DB._byBotanical.set(r.botanicalId, []);
    DB._byBotanical.get(r.botanicalId).push(r);
  }
  return DB;
}

function severityRank(s) {
  const i = SEVERITY_ORDER.indexOf(String(s || 'unspecified'));
  return i < 0 ? 0 : i;
}

/** Every safety rule for one plant, strongest first. */
function rulesFor(botanicalId, opts) {
  const o = opts || {};
  const min = severityRank(o.minSeverity || 'unspecified');
  return (load()._byBotanical.get(Number(botanicalId)) || [])
    .filter(r => severityRank(r.severity) >= min)
    .filter(r => !o.ruleType || r.ruleType === o.ruleType)
    .slice()
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

/**
 * Safety flags for a plant. `which` is 'engine' (default — what the
 * formula engine filters on today) or 'perRule' (what the individual
 * rules support, which is stricter about evidence).
 */
function flagsFor(botanicalId, which) {
  const db = load();
  const src = which === 'perRule' ? db.flagsPerRuleByBotanicalId : db.flagsByBotanicalId;
  return (src && src[botanicalId]) || [];
}

/**
 * Why would this plant be withheld from someone carrying these avoid
 * flags? Returns the rules that justify it — the answer the reveal and
 * MYCO should give instead of "it was filtered".
 */
function whyFiltered(botanicalId, avoidFlags) {
  const flags = Array.isArray(avoidFlags) ? avoidFlags.filter(f => f && f !== 'none') : [];
  if (!flags.length) return [];
  return rulesFor(botanicalId).filter(r => r.flags.some(f => flags.includes(f)));
}

/** Every rule carrying a flag, across the catalogue. */
function byFlag(flag) {
  return load().rules.filter(r => r.flags.includes(flag));
}

/** Herbs where the engine's inference is stricter than its own rules. */
function divergence() { return load().divergence || []; }

function counts() { return load().counts || {}; }

module.exports = {
  SEVERITY_ORDER, severityRank,
  rulesFor, flagsFor, whyFiltered, byFlag, divergence, counts,
};
