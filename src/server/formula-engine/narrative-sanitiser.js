// src/server/formula-engine/narrative-sanitiser.js
//
// AUDIT_FIX (Round 2, Item #7). MYCO stays clever internally — it
// reasons over pharmacology, neuroscience, physiology, botanical
// constituents, extraction knowledge, and the structured herb DB.
// That richness feeds the deterministic validator, the ranking, the
// pairing decisions — all internal.
//
// The CUSTOMER-FACING narrative (mycoOverall on the wire, rendered
// as "✦ MYCO's reasoning" on the reveal card) must NOT create:
//
//   · diagnosis                           ("you have cortisol dysregulation")
//   · treatment claims                    ("this treats anxiety")
//   · cure claims                         ("cures insomnia")
//   · disease claims                      ("addresses your PTSD")
//   · guaranteed outcomes                 ("this will restore your sleep")
//   · unsupported physiological certainty ("lowers your cortisol by 30%")
//   · drug-like framing                   ("acts like an SSRI on")
//   · practitioner-level advice           ("stop taking your paroxetine")
//   · specific pharmacokinetic dosing     ("blocks the H1 receptor for 8h")
//
// The sanitiser runs on the RAW MYCO OUTPUT before it reaches the
// wire (or the "Composed by MYCO" badge lights up). Two responses:
//
//   HIGH-severity hit  → the whole narrative is REPLACED with a safe
//                        deterministic template ("This blend was
//                        composed to support your ___ pattern with
//                        traditional herbal allies..."). mycoUsed
//                        stays true (MYCO still picked the herbs),
//                        but the narrative doesn't leak the unsafe
//                        claim into the customer's inbox.
//
//   LOW-severity hit   → soft-rewrite: replace the offending phrase
//                        with a neutral equivalent. Keeps the
//                        narrative alive but scrubbed.
//
// The claim taxonomy below is intentionally conservative. False
// positives are a smaller cost than a genuine medical claim reaching
// a customer. Edge-cases (a herb name overlapping a claim regex) are
// handled by allowlisting.

// ── Claim taxonomy ────────────────────────────────────────────────
// Ordered by severity. HIGH triggers full-narrative replacement;
// LOW triggers phrase-level rewrite via `rewriteTo`.
const CLAIM_RULES = [
  // ── HIGH · direct treatment / cure claims ────────────────────
  { severity: 'HIGH', category: 'TREATMENT', re: /\btreats?\s+(?:your\s+)?(?:anxiety|depression|insomnia|adhd|ptsd|ocd|bipolar|schizophrenia|arthritis|diabetes|hypertension|cancer|epilepsy|ibs|crohn|colitis|fibromyalgia|autoimmune|thyroid|dementia|alzheimer|parkinson|copd|asthma|migraine|chronic\s+pain|infection)\b/i },
  { severity: 'HIGH', category: 'CURE',      re: /\b(?:cures?|heals?|resolves?|fixes?|repairs?|reverses?)\s+(?:your\s+)?(?:anxiety|depression|insomnia|adhd|ptsd|ocd|bipolar|schizophrenia|arthritis|diabetes|hypertension|cancer|epilepsy|ibs|crohn|colitis|fibromyalgia|autoimmune|thyroid|dementia|alzheimer|parkinson|copd|asthma|migraine|chronic\s+pain|infection|nervous\s+system|gut|liver|adrenals?)\b/i },
  { severity: 'HIGH', category: 'DIAGNOSIS', re: /\byou\s+(?:have|suffer\s+from|are\s+diagnosed\s+with|show\s+signs\s+of|clearly\s+have)\s+(?:anxiety|depression|insomnia|adhd|ptsd|ocd|bipolar|hypothyroid|hyperthyroid|adrenal\s+fatigue|hormonal\s+imbalance|leaky\s+gut|adhd|dysautonomia)\b/i },
  { severity: 'HIGH', category: 'GUARANTEE', re: /\b(?:this\s+will|guaranteed\s+to|guarantees?\s+that|guarantees?\s+you|will\s+(?:definitely|absolutely|certainly|fully)|100%\s+(?:effective|guaranteed))\b/i },
  { severity: 'HIGH', category: 'DRUG_LIKE', re: /\b(?:acts?\s+(?:like|as)\s+(?:an?\s+)?(?:ssri|snri|maoi|benzodiazepine|opioid|antidepressant|antipsychotic|stimulant\s+drug)|equivalent\s+to\s+(?:prozac|xanax|adderall|ambien|ativan|klonopin|zoloft|lexapro))\b/i },
  { severity: 'HIGH', category: 'STOP_MED',  re: /\b(?:stop\s+taking|discontinue|replace|substitute\s+for)\s+(?:your\s+)?(?:medication|meds|ssri|antidepressant|prescription|prescriptions|birth\s+control|pill)\b/i },
  { severity: 'HIGH', category: 'CERTAINTY_QUANT', re: /\b(?:lowers?|raises?|increases?|decreases?|reduces?|boosts?)\s+(?:your\s+)?[a-z]+\s+by\s+\d+\s*%/i },

  // ── LOW · softer phrasing, rewrite the phrase inline ─────────
  { severity: 'LOW', category: 'CURE_SOFT',   re: /\b(?:will\s+)?repair\s+(?:your\s+)?(?:nervous\s+system|gut|liver|adrenals?|hormones?)\b/gi,
    rewriteTo: 'support the $&'.replace('$&', match => match) /* replaced below */ },
  { severity: 'LOW', category: 'ABSOLUTE',    re: /\b(?:completely|totally|fully|absolutely)\s+(?:restores?|balances?|regulates?|resolves?)\b/gi,
    rewriteTo: 'gently supports' },
  { severity: 'LOW', category: 'MEDICAL_TONE', re: /\b(?:prescribed|prescription)\b/gi,
    rewriteTo: 'chosen' },
];

// Special phrase-rewrite table for the LOW severity handling — simpler
// than trying to squeeze rewrites through per-rule regex captures.
const LOW_REWRITES = [
  { re: /\b(?:will\s+)?repair\s+(your\s+)?nervous\s+system\b/gi,     to: 'gently support $1nervous system' },
  { re: /\b(?:will\s+)?repair\s+(your\s+)?gut\b/gi,                  to: 'gently support $1gut' },
  { re: /\b(?:will\s+)?repair\s+(your\s+)?liver\b/gi,                to: 'gently support $1liver' },
  { re: /\b(?:will\s+)?repair\s+(your\s+)?adrenals?\b/gi,            to: 'gently support $1adrenals' },
  { re: /\b(?:will\s+)?repair\s+(your\s+)?hormones?\b/gi,            to: 'gently support $1hormonal rhythm' },
  { re: /\b(?:completely|totally|fully|absolutely)\s+(restores?|balances?|regulates?|resolves?)\b/gi, to: 'gently supports' },
  { re: /\bprescription\b/gi,   to: 'chosen' },
  { re: /\bprescribed\b/gi,     to: 'chosen' },
];

// Safe fallback template when a HIGH-severity claim triggers full
// replacement. Reads user's intention + pattern from the profile so
// the fallback still feels personalised. NO clinical claims.
function safeFallbackNarrative(profile) {
  const INT = {
    stress: 'space to steady', anxiety: 'a quieter nervous system',
    sleep: 'more restorative sleep', energy: 'sustained daytime vitality',
    mood: 'gentle emotional lift', cognitive: 'clearer thinking',
    hormones: 'endocrine rhythm support', digestion: 'gut settlement',
    immunity: 'inner defence', pain: 'inflammation ease',
    detox: 'liver + lymphatic support', beauty: 'skin/hair/nail nourishment',
  };
  const PAT = {
    hot: 'a warm, reactive pattern', cold: 'a cool, slow pattern',
    mixed: 'a mixed, variable pattern', depleted: 'a depleted, low-reserves pattern',
  };
  const intent = INT[profile && profile.intention] || 'the intention you shared';
  const pattern = PAT[profile && profile.pattern] || 'the body reading you gave';
  return (
    'This blend was composed by MYCO to support ' + intent + ', ' +
    'chosen for ' + pattern + '. It leans on traditional herbal allies ' +
    'with a slow-build, adaptogenic character. This is a traditional ' +
    'herbal support, not medical treatment or diagnosis — please confirm ' +
    'with a qualified practitioner if you have specific concerns.'
  );
}

// ── Sanitiser entry point ─────────────────────────────────────────
/**
 * @param {string} raw           The candidate customer-facing narrative.
 * @param {object} profile       The user's quiz profile (for the safe fallback).
 * @returns {{ text: string,
 *             action: 'passed' | 'rewritten' | 'replaced',
 *             hits:   Array<{severity, category, matched}> }}
 */
function sanitiseNarrative(raw, profile) {
  const input = String(raw || '').trim();
  if (!input) return { text: '', action: 'passed', hits: [] };

  const hits = [];
  let highHit = false;

  // Scan HIGH-severity rules first. Any HIGH hit → full replacement.
  for (const rule of CLAIM_RULES) {
    if (rule.severity !== 'HIGH') continue;
    const m = input.match(rule.re);
    if (m) {
      hits.push({ severity: 'HIGH', category: rule.category, matched: m[0] });
      highHit = true;
    }
  }
  if (highHit) {
    return { text: safeFallbackNarrative(profile), action: 'replaced', hits };
  }

  // No HIGH hits — try LOW rewrites. Multiple can compose.
  let text = input;
  for (const rw of LOW_REWRITES) {
    const beforeLen = text.length;
    text = text.replace(rw.re, rw.to);
    if (text.length !== beforeLen) {
      hits.push({ severity: 'LOW', category: 'PHRASE_REWRITE', matched: rw.re.source });
    }
  }

  return { text, action: hits.length ? 'rewritten' : 'passed', hits };
}

module.exports = { sanitiseNarrative, safeFallbackNarrative, CLAIM_RULES, LOW_REWRITES };
