// ════════════════════════════════════════════════════════════════
// Fungai Art · Herb Constraints
// ════════════════════════════════════════════════════════════════
// Canonical user-constraint vocabulary, mirrored from the Engine 2
// SF_GROUPS (public/herbal-engine-2/index.html). Defining it here in
// TypeScript means Mixology (src/App.tsx), the Materia Medica view,
// and any future AI layer share the SAME 19 flags as Engine 2 — one
// source of truth for "what is this user not allowed to take".
//
// Derivation strategy:
//   src/data/herbs.ts already has rich free-text `contraindications`
//   per herb (clinical detail, written for humans). Rather than
//   manually adding a structured flag array to all ~200 herbs, we
//   PATTERN-MATCH the free-text once at module load and cache the
//   result. New herbs get flags automatically. Wrong matches can be
//   over-ridden by setting `contra_flags` explicitly on the herb.
// ════════════════════════════════════════════════════════════════

import { HERBS, type Herb } from './herbs';

// ── 1. Canonical flag vocabulary ────────────────────────────────
// Matches Engine 2's SF_GROUPS verbatim, plus a few additions for
// completeness. Use `label` for human UI, `id` for filtering.
export const CONSTRAINT_FLAGS = [
  { id: 'pregnancy',     icon: '🤰', label: 'Pregnancy / trying to conceive',  sub: 'Removes emmenagogues, uterine stimulants, abortifacients' },
  { id: 'breastfeeding', icon: '🤱', label: 'Breastfeeding',                    sub: 'Removes herbs with infant-transfer risk' },
  { id: 'anticoag',      icon: '💊', label: 'Blood thinners',                   sub: 'Warfarin, heparin, aspirin, antiplatelet drugs' },
  { id: 'digoxin',       icon: '❤️', label: 'Digoxin / cardiac glycosides',     sub: 'Removes cardiac-interactive herbs' },
  { id: 'ssri',          icon: '🧠', label: 'Antidepressants (SSRIs / MAOIs)',  sub: 'Prevents serotonin-syndrome risk' },
  { id: 'bipolar',       icon: '🧠', label: 'Bipolar / mania / psychosis',      sub: 'Removes psychoactive and dopaminergic herbs' },
  { id: 'dopamine_d',    icon: '🧠', label: 'Parkinson\'s / dopamine drugs',    sub: 'Removes dopamine-antagonist herbs' },
  { id: 'autoimmune',    icon: '🛡', label: 'Autoimmune / immunosuppressed',   sub: 'Removes immune-stimulating herbs that may trigger flares' },
  { id: 'liver',         icon: '🫁', label: 'Liver disease',                    sub: 'Removes hepatotoxic herbs' },
  { id: 'kidney',        icon: '🫘', label: 'Kidney disease',                   sub: 'Removes nephrotoxic and oxalate-rich herbs' },
  { id: 'thyroid',       icon: '🦋', label: 'Thyroid condition / medication',  sub: 'Removes iodine-affecting and thyroid-active herbs' },
  { id: 'hypertension',  icon: '❤️', label: 'Uncontrolled high blood pressure', sub: 'Removes stimulating and vasoconstrictive herbs' },
  { id: 'contraceptive', icon: '💊', label: 'On contraceptive pill',            sub: 'Removes CYP3A4 inducers that lower contraceptive efficacy' },
  { id: 'gerd',          icon: '🌿', label: 'GERD / acid reflux',               sub: 'Removes sphincter-relaxing herbs' },
  { id: 'gallstones',    icon: '🌿', label: 'Gallstones / biliary obstruction', sub: 'Removes choleretic herbs that move bile' },
  { id: 'asteraceae',    icon: '🌸', label: 'Ragweed / daisy family allergy',   sub: 'Removes chamomile, calendula, echinacea, milk thistle, etc.' },
  { id: 'aspirin_al',    icon: '🌸', label: 'Salicylate sensitivity',           sub: 'Removes willow bark and salicylate-rich herbs' },
  { id: 'cns_dep',       icon: '😴', label: 'Benzodiazepines / sedatives / opioids', sub: 'Removes additive CNS depressants' },
  { id: 'depression',    icon: '🌑', label: 'Diagnosed depressive disorder',    sub: 'Removes sedating nervines that can worsen low mood' },
  // ── Additions beyond Engine 2 ─────────────────────────────────
  { id: 'children',      icon: '🧒', label: 'For a child under 12',             sub: 'Removes adult-only herbs' },
  { id: 'surgery',       icon: '🏥', label: 'Surgery within 2 weeks',           sub: 'Removes bleeding-risk and anaesthesia-interactive herbs' },
  { id: 'alcohol',       icon: '🚫', label: 'No alcohol (religious / recovery)', sub: 'Removes ethanol tinctures from suggestions' },
] as const;

export type ConstraintFlagId = typeof CONSTRAINT_FLAGS[number]['id'];

// ── 2. Pattern matching: free-text → flags ──────────────────────
// Each regex is broad enough to catch the common phrasings in the
// herbs.ts contraindications, but narrow enough not to false-positive.
// Order doesn't matter — every herb is tested against all patterns.

const FLAG_PATTERNS: Array<{ flag: ConstraintFlagId; pattern: RegExp }> = [
  { flag: 'pregnancy',     pattern: /pregnan|emmenagog|uterine.?stim|abortifac|uterotonic/i },
  { flag: 'breastfeeding', pattern: /breast.?feed|lactat|nursing.?mother/i },
  { flag: 'anticoag',      pattern: /anticoag|antiplatelet|antiplt|blood.?thin|warfar|coumadin|heparin|bleeding.?disord|haemorrhag|hemorrhag/i },
  { flag: 'digoxin',       pattern: /digoxin|cardiac.?glycosid|digitalis/i },
  { flag: 'ssri',          pattern: /\bssri|\bmaoi|serotonin.?syndr|serotonergic|antidepress/i },
  { flag: 'bipolar',       pattern: /bipolar|mania\b|manic\b|psychosis|psychotic/i },
  { flag: 'dopamine_d',    pattern: /dopaminergic|dopamine.?antag|parkinson|antipsychot/i },
  { flag: 'autoimmune',    pattern: /autoimmun|lupus|rheumatoid|crohn|hashimoto|immunosuppress|immune.?stim|MS\s|sclero|psoriasis/i },
  { flag: 'liver',         pattern: /hepatotox|liver.?diseas|liver.?damag|hepatitis|cirrhos|jaundice|liver.?fail|hepatic/i },
  { flag: 'kidney',        pattern: /\brenal|kidney.?diseas|kidney.?fail|nephrotox|oxalate.?rich|\bgout\b/i },
  { flag: 'thyroid',       pattern: /thyroid|iodine|hashimoto|graves.?diseas|hyperthyr|hypothyr/i },
  { flag: 'hypertension',  pattern: /hypertens|high.?blood.?pressur|vasoconstri|elevated.?bp/i },
  { flag: 'contraceptive', pattern: /contracept|oral.?contracep|cyp3a4.?induc|estrogen.?metabol/i },
  { flag: 'gerd',          pattern: /\bgerd\b|reflux|gastro.?esophag|heartburn|esophageal.?sphincter/i },
  { flag: 'gallstones',    pattern: /gallston|biliary.?obstr|cholestasis|gallbladd.?obstr/i },
  { flag: 'asteraceae',    pattern: /asteraceae|daisy.?fam|ragweed|composite.?fam/i },
  { flag: 'aspirin_al',    pattern: /salicylate|aspirin.?allerg|salicylic.?acid/i },
  { flag: 'cns_dep',       pattern: /sedativ|cns.?depress|benzodiazepin|opioid|narcotic/i },
  { flag: 'depression',    pattern: /\bdepress|low.?mood|melanchol/i },
  { flag: 'children',      pattern: /child|infant|under.?(\d{1,2}|twelve|six)|paediatric|pediatric/i },
  { flag: 'surgery',       pattern: /surger|pre.?operative|peri.?operative|anaesth|anesth/i },
  // No 'alcohol' pattern — that's a user preference, not a herb contraindication
];

// ── 3. Derivation + caching ─────────────────────────────────────

const _cache = new Map<number, ConstraintFlagId[]>();

export function deriveContraFlags(herb: Herb): ConstraintFlagId[] {
  const text = (herb.contraindications || []).join(' ').toLowerCase();
  const flags = new Set<ConstraintFlagId>();
  // safe_pregnancy explicit boolean overrides any text inference
  if (herb.safe_pregnancy === false) flags.add('pregnancy');
  for (const { flag, pattern } of FLAG_PATTERNS) {
    if (pattern.test(text)) flags.add(flag);
  }
  return [...flags];
}

export function getContraFlags(herb: Herb): ConstraintFlagId[] {
  if (!_cache.has(herb.id)) _cache.set(herb.id, deriveContraFlags(herb));
  return _cache.get(herb.id)!;
}

// ── 4. Public helpers used by Mixology / Materia Medica / AI ───

export interface ConstraintCheckResult {
  safe: boolean;
  conflictingFlags: ConstraintFlagId[];
  // Human-readable labels for UI badges
  conflictingLabels: string[];
}

export function checkHerbAgainstConstraints(
  herb: Herb,
  userConstraints: readonly ConstraintFlagId[],
): ConstraintCheckResult {
  const herbFlags = getContraFlags(herb);
  const conflictingFlags = userConstraints.filter(uc => herbFlags.includes(uc));
  const conflictingLabels = conflictingFlags.map(
    f => CONSTRAINT_FLAGS.find(cf => cf.id === f)?.label ?? f
  );
  return {
    safe: conflictingFlags.length === 0,
    conflictingFlags,
    conflictingLabels,
  };
}

export function filterHerbsByConstraints(
  herbs: Herb[],
  userConstraints: readonly ConstraintFlagId[],
): Herb[] {
  if (!userConstraints || userConstraints.length === 0) return herbs;
  return herbs.filter(h => checkHerbAgainstConstraints(h, userConstraints).safe);
}

// Group herbs by safety-vs-user — useful for "you searched X, here's
// what's safe / what's flagged for caution given your constraints".
export interface PartitionedHerbs {
  safe: Herb[];
  flagged: Array<{ herb: Herb; conflictingFlags: ConstraintFlagId[]; conflictingLabels: string[] }>;
}

export function partitionHerbsByConstraints(
  herbs: Herb[],
  userConstraints: readonly ConstraintFlagId[],
): PartitionedHerbs {
  const safe: Herb[] = [];
  const flagged: PartitionedHerbs['flagged'] = [];
  for (const h of herbs) {
    const result = checkHerbAgainstConstraints(h, userConstraints);
    if (result.safe) safe.push(h);
    else flagged.push({ herb: h, conflictingFlags: result.conflictingFlags, conflictingLabels: result.conflictingLabels });
  }
  return { safe, flagged };
}

// ── 5. Stats / debug ────────────────────────────────────────────
// Useful when wiring this into a new tool — confirms the derivation
// captures most herbs and lets you see which herbs lack flags
// (probably food-grade, but worth verifying).

export function getAllHerbsWithFlags(): Array<{ herb: Herb; flags: ConstraintFlagId[] }> {
  return HERBS.map(h => ({ herb: h, flags: getContraFlags(h) }));
}

export function getHerbsWithoutFlags(): Herb[] {
  return HERBS.filter(h => getContraFlags(h).length === 0);
}

export function getFlagDistribution(): Record<ConstraintFlagId, number> {
  const dist = Object.fromEntries(
    CONSTRAINT_FLAGS.map(f => [f.id, 0])
  ) as Record<ConstraintFlagId, number>;
  for (const h of HERBS) {
    for (const f of getContraFlags(h)) dist[f] = (dist[f] || 0) + 1;
  }
  return dist;
}
