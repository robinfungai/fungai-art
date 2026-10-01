// src/server/formula-engine/axes.js
//
// RESTRICTED / GATED classification + axis inference from raw herb
// metadata. The `inferAxes` function is what derives searchable
// intentions/patterns/times/stress/flags from each herb's prose
// primary_functions / secondary_benefits / etc, so the picker doesn't
// need hand-tagged data.
//
// LIFTED VERBATIM from
//   public/find-your-formula/index.html lines 1091–1243, 1248–1252.

const { getAllHerbs } = require('../herb-data');

// Legally-restricted / prohibited entries — never offered through the
// consumer quiz regardless of what the catalog holds. Amanita muscaria
// and Calea zacatachichi are intentionally NOT here — Fungai Art
// offers them legally.
const RESTRICTED_NAMES = [
  'psilocybe','psilocybin','psilocin',
  'ayahuasca','banisteriopsis','chacruna','yage','yagé',
  'peyote','lophophora','mescaline','san pedro','trichocereus','echinopsis pachanoi',
  'salvia divinorum',
  'iboga','tabernanthe','ibogaine',
  'kratom','mitragyna',
  'morning glory seed','ololiuhqui','lsa','hawaiian baby woodrose',
  'toad venom','5-meo-dmt','bufo alvarius',
  'dmt','n,n-dmt',
  'coca leaf','erythroxylum','cocaine',
  'acorus calamus','calamus root',
  // Not a recreational drug — a pharmaceutical-grade immunosuppressant.
  // Tripterygium wilfordii (id 564) is teratogenic, abortifacient,
  // hepato- and nephrotoxic, and causes sometimes-irreversible
  // infertility. It earns its place in the Materia Medica as reference,
  // but the quiz must never put it in a bottle. Same treatment as
  // Kratom: catalogued, never recommended.
  'tripterygium','thunder god vine','lei gong teng',
  // Comfrey (id 594) — external use only: its pyrrolizidine alkaloids
  // are liver-toxic when swallowed. In the encyclopedia, the Atlas and
  // the Moder Jord cream; never in a bottle (Robin, 2026-09-28).
  'comfrey','symphytum',
];
// Word-boundary match, NOT a bare substring test. A plain includes()
// let a short entry ban an unrelated botanical by accident: 'lsa'
// (lysergic acid amide) matched Cistanche saLSAa — the legal Kidney
// tonic was silently dropped from the candidate pool with no error
// raised anywhere. Boundaries keep every real entry matching
// ('psilocybe' still catches 'Psilocybe cubensis') while requiring the
// token to sit on its own rather than inside a longer word.
//
// RESTRICTED_NAMES holds only letters, digits, spaces, commas and
// hyphens — no regex metacharacters — so the tokens are used as-is.
const RESTRICTED_RE = RESTRICTED_NAMES.map(
  r => new RegExp('(^|[^a-z0-9])' + r + '([^a-z0-9]|$)', 'i')
);
function isRestricted(h) {
  const s = ((h.name || '') + ' ' + (h.botanical || '')).toLowerCase();
  return RESTRICTED_RE.some(re => re.test(s));
}

// Gated herbs — legal, but held out of the candidate pool until the
// quiz-taker opts in on the entry gate.
//
// EMPTY since 2026-09-23, by Robin's decision: the Amanitas were the
// only entries, and holding them behind an opt-in meant they almost
// never reached a bottle. They are a product Fungai Art sells and
// formulates with, so they now compete for a place like any other
// herb. The mechanism stays — add a name here to gate something again.
//
// This is NOT the under-18 protection. That lives in MINOR_BANNED_NAMES
// below and is unaffected: opening the ceremonial gate must never mean
// a minor can be assigned a psychoactive.
const GATED_NAMES = [];
function isGated(h) {
  if (!GATED_NAMES.length) return false;
  const s = ((h.name || '') + ' ' + (h.botanical || '')).toLowerCase();
  return GATED_NAMES.some(r => s.includes(r));
}

// Never given to a minor, whatever the ceremonial gate says and
// whatever else the pool allows. Previously this protection rode on
// `gated`, so emptying that list would have silently handed Amanita to
// under-18s — it is its own list now precisely so the two decisions
// can never be coupled again.
const MINOR_BANNED_NAMES = [
  'amanita muscaria','amanita_muscaria','amanita pantherina',
  // Salicylate herbs, the plant relatives of aspirin (2026-09-27): the
  // EMA/HMPC monographs contraindicate willow bark under 18 and advise
  // against meadowsweet under 18.
  'filipendula ulmaria','meadowsweet','willow bark','salix alba',
];
function isMinorBanned(h) {
  const s = ((h.name || '') + ' ' + (h.botanical || '')).toLowerCase();
  return MINOR_BANNED_NAMES.some(r => s.includes(r));
}

// The word search behind each goal — the fallback for a record without
// recorded goals, and the way goalNote() finds the line that serves a goal.
const INTENTION_RE = {
  stress: /adaptogen|cortisol|stress|hpa|resilience|burnout|nervine tonic/,
  anxiety: /anxi|nervous|gaba|tension|calm|settle|sedativ|anxiolytic|kava|panic|shen disturb/,
  sleep: /sleep|somno|insomni|circadian|melaton|hypnotic|deep sleep|night wake/,
  energy: /vital|stamina|adren|fatigue|exhaustion|athletic|endurance|yang tonic|qi tonic|energizer|mitochondri/,
  mood: /mood|antidepress|serotonergi|dopamin|heart open|emotional|grief|depression|melanchol|lift|euphoric/,
  cognitive: /cognit|memory|attention|focus|clarity|neuroplast|ngf|nootropi|acetylcholi|neuroprotect|bdnf|concentrat|neurogen/,
  hormones: /hormon|endocrine|estrogen|progester|testoster|libido|cycle|menopaus|luteal|pms|amenorr|dysmenor|androgen|thyroid.*support/,
  digestion: /digest|gastroint|gut|stomach|bloating|ibs|carminativ|bitter|liver.*bile|gastric|dyspepsia|nausea|colon|microbiome|prebiotic/,
  immunity: /immun|antiviral|antibacterial|antimicrobial|innate|leukocyt|lymphocyt|resistance|cold.*flu/,
  pain: /anti.?inflammat|cox|pain|analgesic|arthriti|joint|muscle.*spasm|neuralg|headache|migraine|nsaid/,
  detox: /detox|liver.*cleans|hepatic|phase\s?i{1,2}|glutathion|bile flow|lymphatic drain|chelat|hepatoprotect/,
  beauty: /skin|collagen|ceramid|beauty|glow|hydration|photo.?protect|melanin|antioxidant.*skin|hyaluron/,
};

function inferAxes(h) {
  const text = [
    ...(h.primary_functions   || []),
    ...(h.secondary_benefits  || []),
    ...(h.energetics          || []),
    h.spiritual_layer || '',
    h.pharmacology    || '',
    h.tcm_element     || '',
    ...(h.tcm_meridians       || []),
  ].join(' | ').toLowerCase();
  const has = re => re.test(text);
  const con = ((h.contraindications || []).concat(h.herb_to_drug_interactions || [])).join(' | ').toLowerCase();

  // Recorded goals win (herbs.ts `goals`, 2026-09-28). The word search
  // below is only a fallback for a record without the field, and it
  // keeps its old first-three truncation so nothing that relies on it
  // changes; recorded goals are never truncated.
  if (Array.isArray(h.goals)) return finishAxes(h, text, has, con, h.goals.slice(), true);

  const intentions = Object.keys(INTENTION_RE).filter(k => has(INTENTION_RE[k]));
  if (!intentions.length) intentions.push('stress');
  return finishAxes(h, text, has, con, intentions, false);
}

function finishAxes(h, text, has, con, intentions, recorded) {
  const patterns = [];
  const enr = (h.energetics || []).join(' ').toLowerCase();
  if (has(/cool|cold energetic|clear.*heat|liver.*heat|damp.?heat|inflam|hot.*natur/) || /cool|cold/.test(enr)) patterns.push('hot');
  if (has(/warm|warming|hot energetic|yang tonic|dispel.*cold|move blood|circulation/) || /warm|hot/.test(enr))  patterns.push('cold');
  if (has(/move.*qi|regulate.*qi|liver qi stagnat|resolve.*damp|resolve.*phlegm|dispel.*stag/)) patterns.push('mixed');
  if (has(/tonify|nourish|blood tonic|yin tonic|essence|jing|marrow|convalescence|nutriti|restorat|deplet/)) patterns.push('depleted');
  if (!patterns.length) patterns.push(intentions.includes('stress') || intentions.includes('anxiety') ? 'mixed' : 'depleted');

  const times = [];
  if (intentions.includes('sleep')) { times.push('evening', 'night'); }
  if (intentions.includes('energy') || intentions.includes('cognitive')) { times.push('morning', 'midday'); }
  if (intentions.includes('anxiety') || intentions.includes('stress')) { times.push('evening', 'any'); }
  if (intentions.includes('mood')) { times.push('morning', 'midday', 'any'); }
  if (!times.length) times.push('any');

  const stress = [];
  if (has(/adaptogen/))                       stress.push('push', 'collapse');
  if (has(/nervine|gaba|anxiolytic/))         stress.push('off', 'ride');
  if (has(/stimulant|caffeine|energizer/))    stress.push('numb', 'push');
  if (has(/restorat|deplet|nourish|nutriti/)) stress.push('collapse');
  if (has(/heart open|serotonergi|mood.*lift|antidepress/)) stress.push('numb', 'off');
  if (!stress.length) stress.push('ride', 'off');

  const flags = [];
  // 2026-09-27 · Pregnancy reads the record's own verdict, not its prose.
  // Only an explicit safe_pregnancy: true lets a herb near a pregnant or
  // breastfeeding customer. Unknown (null, 84 herbs) is avoid — it used
  // to pass whenever the contraindication text happened not to mention
  // pregnancy (Ginkgo, Bladderwrack, Shatavari…), and six herbs marked
  // false (Fadogia, Tongkat Ali, Chaga…) passed the same way. The prose
  // test also caught the 9 records whose text says "safe in pregnancy",
  // so it is not kept as a second opinion.
  if (h.safe_pregnancy !== true) flags.push('pregnancy');
  if (/anticoagulant|antiplatelet|blood.?thin|warfarin|heparin|inr|digoxin|cardiac glycoside|heart.*medicat|antihypertens|hypertens/.test(con)) flags.push('cardio_meds');
  if (/maoi|ssri|snri|serotonin syndrome|antidepress|mood stabili|antipsychot|bipolar|lithium|dopaminergi/.test(con)) flags.push('psych_meds');
  // "MS" (multiple sclerosis) is read from the original text, capitals
  // only: /MS\b/i on the lower-cased text matched the end of "symptoms",
  // "forms", "stems", "systems" and flagged 26 herbs autoimmune by
  // accident (external audit 2026-09-28, M2).
  const conRaw = ((h.contraindications || []).concat(h.herb_to_drug_interactions || [])).join(' | ');
  if (/immunostim|autoimmun|immunosuppress|lupus|rheumatoid|multiple sclerosis/.test(con) || /\bMS\b/.test(conRaw)) flags.push('autoimmune');
  if (/hepatotox|liver.*damage|hepatit|nephrotox|kidney.*stone|oxalate|renal fail/.test(con)) flags.push('liver_kidney');
  if (/thyroid|hyperthyroid|hypothyroid|graves|hashimoto|iodine/.test(con)) flags.push('thyroid');
  if (/hypertens|blood pressure|vasoconstrict/.test(con)) flags.push('hypertension');
  if (/cyp3a4|contracepti|estrogen.*bind|birth control|oral contracepti/.test(con)) flags.push('contraceptive');
  if (/benzodiazepin|cns depress|sedative.*additive|potentiat.*sedat/.test(con)) flags.push('sedatives');
  if (/asteraceae|ragweed|daisy family|compositae|salicylat|aspirin/.test(con)) flags.push('allergy');
  // The recorded CNS class implies the obvious medication conflicts,
  // whatever the prose remembered to say: a sedative adds to sleeping
  // pills and benzodiazepines; a stimulant raises blood pressure and
  // clashes with MAOIs, lithium and clozapine; a psychoactive does not
  // belong beside psychiatric medication.
  if (h.cns_action === 'sedative')     flags.push('sedatives');
  if (h.cns_action === 'stimulant')    flags.push('hypertension', 'cardio_meds', 'psych_meds');
  if (h.cns_action === 'psychoactive') flags.push('psych_meds');
  // Recorded flags (herbs.ts safety_flags) — the record's own verdict
  // where the prose is not enough (whole Licorice Root, 2026-10-02).
  if (Array.isArray(h.safety_flags)) flags.push(...h.safety_flags);

  const uniqIntentions = [...new Set(intentions)];
  return {
    intentions: recorded ? uniqIntentions : uniqIntentions.slice(0, 3),
    patterns:   [...new Set(patterns)],
    times:      [...new Set(times)],
    stress:     [...new Set(stress)],
    flags:      [...new Set(flags)],
    _polyvalent: uniqIntentions.length > 3,
  };
}

// Build the consumer pool once. Excludes RESTRICTED_NAMES entries,
// tags every remaining herb with derived axes, caches the result.
// Process-local cache — Netlify function containers re-hydrate this
// on cold start.
let POOL = null;
function ensurePool() {
  if (POOL) return POOL;
  const herbs = getAllHerbs();
  if (!Array.isArray(herbs) || !herbs.length) return null;
  POOL = herbs
    .filter(h => !isRestricted(h))
    .map(h => Object.assign({}, h, {
      _ax: inferAxes(h),
      gated: isGated(h),
      minorBanned: isMinorBanned(h),
      // formula_access: 'pro' in herbs.ts — only the pro composer may
      // bottle it (safety.js passesAccess). Ephedra, 2026-09-27.
      proOnly: h.formula_access === 'pro',
    }));
  return POOL;
}

// shortNote — compact one-liner used by the picker's diversity guard
// (dedupes the "5 adaptogens all reading 'adaptogen: X'" copy-paste
// feel). Takes the first primary_function clause + hard-caps length.
function shortNote(h) {
  const src = (h.primary_functions && h.primary_functions[0]) || h.spiritual_layer || h.pharmacology || '';
  const chunk = String(src).split(/[—.–:;]/)[0].trim();
  return chunk.length > 140 ? chunk.slice(0, 137) + '…' : chunk;
}

// The line a client reads for a herb on the reveal (Robin, 2026-10-02,
// verdict 4): the first function or benefit that serves the person's
// goals, in their ranked order — Barley showed "LDL cholesterol" to a
// client who asked for digestion and calm. Falls back to shortNote.
function goalNote(h, goals) {
  const lines = (h.primary_functions || []).concat(h.secondary_benefits || []);
  for (const g of (goals || []).filter(Boolean)) {
    const re = INTENTION_RE[g];
    const hit = re && lines.find(l => re.test(String(l).toLowerCase()));
    if (hit) {
      const chunk = String(hit).split(/[—.–:;]/)[0].trim();
      return chunk.length > 140 ? chunk.slice(0, 137) + '…' : chunk;
    }
  }
  return shortNote(h);
}

module.exports = {
  RESTRICTED_NAMES, GATED_NAMES, MINOR_BANNED_NAMES, isMinorBanned,
  isRestricted, isGated, inferAxes, ensurePool, shortNote, goalNote, INTENTION_RE,
};
