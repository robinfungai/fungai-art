// scripts/build-safety-rules.cjs
//
// Academy P2 · safety as machine-readable data.
//
// Today safety lives as prose inside herbs.ts and is re-derived at
// request time by regex in src/server/formula-engine/axes.js. That works
// for the one question the engine asks ("does this herb carry flag X?")
// and for nothing else: severity is invisible, the reason is invisible,
// and MYCO can only quote paragraphs rather than retrieve rules.
//
// The prose is already semi-structured:
//
//   "Hyperthyroidism / Graves disease — ABSOLUTELY CONTRAINDICATED:
//    increases T3/T4; documented thyrotoxicosis cases"
//   "Thyroid medications (levothyroxine) — MONITOR TSH; dose adjustment likely"
//
// so each entry parses into subject / severity / reason, and carries the
// same avoid-flags the engine already uses. The flag patterns below are
// LIFTED VERBATIM from axes.js inferAxes — tests/safety-rules-verify.cjs
// proves the union of per-rule flags equals what the engine infers today,
// herb for herb. Nothing about formula composition changes here; this is
// the same knowledge, addressable.
//
//   node scripts/build-safety-rules.cjs

const fs   = require('fs');
const path = require('path');
const { getAllHerbs } = require('../src/server/herb-data');

const OUT = path.join(__dirname, '..', 'src', 'data', 'safety-rules.generated.json');

// ── Avoid-flag patterns · VERBATIM from formula-engine/axes.js ────
// If these ever drift from the engine, the parity test fails loudly.
const FLAG_PATTERNS = {
  pregnancy:     /pregnan|lactat|breastfeed|uterine.*stim|emmenagog|abortifac|fetal|infant.*transfer/,
  cardio_meds:   /anticoagulant|antiplatelet|blood.?thin|warfarin|heparin|inr|digoxin|cardiac glycoside|heart.*medicat|antihypertens|hypertens/,
  psych_meds:    /maoi|ssri|snri|serotonin syndrome|antidepress|mood stabili|antipsychot|bipolar|lithium|dopaminergi/,
  autoimmune:    /immunostim|autoimmun|immunosuppress|lupus|rheumatoid|multiple sclerosis/,
  liver_kidney:  /hepatotox|liver.*damage|hepatit|nephrotox|kidney.*stone|oxalate|renal fail/,
  thyroid:       /thyroid|hyperthyroid|hypothyroid|graves|hashimoto|iodine/,
  hypertension:  /hypertens|blood pressure|vasoconstrict/,
  contraceptive: /cyp3a4|contracepti|estrogen.*bind|birth control|oral contracepti/,
  sedatives:     /benzodiazepin|cns depress|sedative.*additive|potentiat.*sedat/,
  allergy:       /asteraceae|ragweed|daisy family|compositae|salicylat|aspirin/,
};

// "MS" (multiple sclerosis) is matched on the ORIGINAL text, capitals only,
// as axes.js does since 2026-09-29: /MS\b/i on lower-cased text matched the
// end of "symptoms" and "forms" and flagged 26 herbs autoimmune by accident.
const MS_RAW = /\bMS\b/;

// ── Severity, read from how the entry shouts ─────────────────────
// Ordered: the first match wins, strongest first.
const SEVERITY_MARKERS = [
  ['absolute', /absolutely contraindicated|never (?:use|combine|take)|do not use|strictly contraindicated|contraindicated:/i],
  ['avoid',    /\bavoid\b|not recommended|discontinue|stop use/i],
  ['monitor',  /\bmonitor\b|check .*levels?|dose adjust|watch for|titrate/i],
  ['caution',  /caution|care with|careful|risk of|may (?:increase|reduce|potentiate)|consult/i],
];

// These entries shout their verdict first — "AVOID (bleeding risk)",
// "MONITOR TSH; dose adjustment likely". When a reason opens with one of
// those markers, it IS the severity: Willow Bark's "MONITOR: contains
// salicylates; discontinue if reaction" is a monitor rule with a
// conditional, not an avoid rule.
const LEADING_MARKER = /^\s*\**\s*(ABSOLUTELY CONTRAINDICATED|CONTRAINDICATED|AVOID|MONITOR|CAUTION)/;
const LEADING_TO_SEVERITY = {
  'ABSOLUTELY CONTRAINDICATED': 'absolute',
  'CONTRAINDICATED':            'absolute',
  'AVOID':                      'avoid',
  'MONITOR':                    'monitor',
  'CAUTION':                    'caution',
};

function severityOf(text, reason) {
  const lead = String(reason || '').match(LEADING_MARKER);
  if (lead) return LEADING_TO_SEVERITY[lead[1].toUpperCase()];
  for (const [level, re] of SEVERITY_MARKERS) if (re.test(text)) return level;
  return 'unspecified';
}

// How the ENGINE infers flags today: every contraindication and drug
// interaction joined into one blob, then pattern-matched. Because the
// patterns allow '.*', a match can span two unrelated entries — which is
// how Bacopa picks up 'cardio_meds' from "slow heart rate" in one line
// and "Thyroid medications" in another. Reproduced here verbatim so the
// generated file can drive today's behaviour unchanged, while the
// per-entry flags record what each rule actually supports.
function engineFlagsFor(h) {
  const raw = ((h.contraindications || []).concat(h.herb_to_drug_interactions || [])).join(' | ');
  const con = raw.toLowerCase();
  const out = [];
  for (const [flag, re] of Object.entries(FLAG_PATTERNS)) {
    if (flag === 'pregnancy') continue;          // read from the record — recordFlagsFor
    if (re.test(con) || (flag === 'autoimmune' && MS_RAW.test(raw))) out.push(flag);
  }
  for (const flag of recordFlagsFor(h)) if (!out.includes(flag)) out.push(flag);
  return out.sort();
}

// Since 2026-09-27 the engine also reads two record fields directly —
// VERBATIM with axes.js inferAxes:
//   · pregnancy comes from safe_pregnancy alone: only true passes;
//     unknown (null) and false both mean avoid;
//   · the recorded CNS class implies its medication conflicts.
function recordFlagsFor(h) {
  const out = [];
  if (h.safe_pregnancy !== true) out.push('pregnancy');
  if (h.cns_action === 'sedative')     out.push('sedatives');
  if (h.cns_action === 'stimulant')    out.push('hypertension', 'cardio_meds', 'psych_meds');
  if (h.cns_action === 'psychoactive') out.push('psych_meds');
  return out;
}

// The same facts as addressable rules, so every engine flag has a rule
// behind it and MYCO can retrieve "no pregnancy record — avoid".
function recordRulesFor(h) {
  const rules = [];
  if (h.safe_pregnancy !== true) {
    rules.push({
      id: 'safety:' + h.id + ':record:pregnancy', botanicalId: h.id, botanical: h.name,
      ruleType: 'record', subject: 'Pregnancy and breastfeeding',
      severity: 'avoid',
      reason: h.safe_pregnancy === false
        ? 'Recorded as not safe in pregnancy (safe_pregnancy: false).'
        : 'No pregnancy safety record (safe_pregnancy unknown), so it is kept away from pregnant and breastfeeding customers.',
      flags: ['pregnancy'], source: 'herbs.ts · safe_pregnancy',
    });
  }
  const cnsFlags = recordFlagsFor(h).filter(f => f !== 'pregnancy');
  if (cnsFlags.length) {
    const why = {
      sedative: 'Recorded as a sedative: it adds to sleeping pills, benzodiazepines, alcohol and other sedatives.',
      stimulant: 'Recorded as a stimulant: it raises blood pressure and clashes with MAO inhibitors, lithium and clozapine.',
      psychoactive: 'Recorded as psychoactive: it does not belong beside psychiatric medication.',
    }[h.cns_action];
    rules.push({
      id: 'safety:' + h.id + ':record:cns', botanicalId: h.id, botanical: h.name,
      ruleType: 'record', subject: 'CNS class: ' + h.cns_action,
      severity: 'caution', reason: why, flags: cnsFlags, source: 'herbs.ts · cns_action',
    });
  }
  return rules;
}

function flagsFor(text) {
  const t = String(text || '');
  const out = [];
  for (const [flag, re] of Object.entries(FLAG_PATTERNS)) {
    // The engine lowercases the joined blob before testing; match that,
    // plus "MS" in capitals on the original text for autoimmune.
    if (re.test(t.toLowerCase()) || (flag === 'autoimmune' && MS_RAW.test(t))) out.push(flag);
  }
  return out;
}

/**
 * Split one prose entry into subject / reason.
 * "Warfarin — AVOID (bleeding risk)"  → subject 'Warfarin', reason 'AVOID (bleeding risk)'
 * Entries without a dash keep the whole string as the subject.
 */
function splitEntry(entry) {
  const s = String(entry || '').trim();
  const m = s.match(/^(.{2,80}?)\s+[—–-]\s+(.*)$/s);
  if (!m) return { subject: s, reason: '' };
  return { subject: m[1].trim(), reason: m[2].trim() };
}

const SOURCES = [
  ['contraindications',         'contraindication'],
  ['herb_to_drug_interactions', 'drug_interaction'],
  ['herb_to_herb_caution',      'herb_interaction'],
];

function main() {
  const herbs = getAllHerbs();
  const rules = [];
  const perHerbFlags = {};
  const perRuleFlags = {};
  const divergence   = [];
  const bySeverity = {};
  const byType = {};

  for (const h of herbs) {
    const union = new Set();
    for (const [field, ruleType] of SOURCES) {
      const entries = Array.isArray(h[field]) ? h[field] : [];
      entries.forEach((entry, i) => {
        const { subject, reason } = splitEntry(entry);
        const whole    = subject + ' ' + reason;
        const severity = severityOf(whole, reason);
        // The engine only reads contraindications + drug interactions
        // when inferring flags; herb-to-herb cautions are scored
        // separately. Keep that boundary so parity is exact.
        // A record marked safe in pregnancy mentions pregnancy only to
        // say so ("safe in pregnancy and breastfeeding"); the word is not
        // a flag there, and the engine agrees since 2026-09-27.
        const flags = (field === 'herb_to_herb_caution') ? []
          : flagsFor(whole).filter(f => !(f === 'pregnancy' && h.safe_pregnancy === true));
        flags.forEach(f => union.add(f));

        rules.push({
          id:          'safety:' + h.id + ':' + ruleType + ':' + (i + 1),
          botanicalId: h.id,
          botanical:   h.name,
          ruleType,
          subject,
          severity,
          reason:      reason || null,
          flags,
          source:      'herbs.ts · ' + field,
        });
        bySeverity[severity] = (bySeverity[severity] || 0) + 1;
        byType[ruleType]     = (byType[ruleType] || 0) + 1;
      });
    }
    for (const r of recordRulesFor(h)) {
      rules.push(r);
      r.flags.forEach(f => union.add(f));
      bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
      byType[r.ruleType]     = (byType[r.ruleType] || 0) + 1;
    }
    perHerbFlags[h.id] = engineFlagsFor(h);          // what the engine does today
    perRuleFlags[h.id] = [...union].sort();           // what the individual rules support
  }

  for (const h of herbs) {
    const engine = perHerbFlags[h.id] || [];
    const clean  = perRuleFlags[h.id] || [];
    const extra  = engine.filter(f => !clean.includes(f));
    if (extra.length) {
      divergence.push({
        botanicalId: h.id,
        botanical:   h.name,
        engineOnly:  extra,
        why: 'engine pattern matched across two unrelated entries in the joined text',
      });
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    counts: {
      botanicals: herbs.length,
      rules:      rules.length,
      byType,
      bySeverity,
    },
    // What the engine's safety filter consumes today (blob matching).
    flagsByBotanicalId: perHerbFlags,
    // What the individual rules actually support (per-entry matching).
    // Cleaner, and the target once a switch is deliberately made.
    flagsPerRuleByBotanicalId: perRuleFlags,
    // Herbs where the two disagree — over-flagging, listed not hidden.
    divergence,
    rules,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');

  console.log('botanicals   : ' + herbs.length);
  console.log('rules        : ' + rules.length);
  console.log('  by type    : ' + Object.entries(byType).map(([k, v]) => k + ' ' + v).join(' · '));
  console.log('  by severity: ' + Object.entries(bySeverity).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
  const flagged = Object.values(perHerbFlags).filter(f => f.length).length;
  console.log('herbs with ≥1 safety flag: ' + flagged + ' / ' + herbs.length);
  if (divergence.length) {
    console.log('');
    console.log('⚠ engine over-flags ' + divergence.length + ' herb(s) via cross-entry pattern matches:');
    for (const d of divergence) console.log('   · ' + d.botanical + ' — ' + d.engineOnly.join(', '));
  }
  console.log('');
  console.log('wrote ' + path.relative(path.join(__dirname, '..'), OUT));
}

if (require.main === module) main();
module.exports = { FLAG_PATTERNS, severityOf, flagsFor, splitEntry };
