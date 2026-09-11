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
];
function isRestricted(h) {
  const s = ((h.name || '') + ' ' + (h.botanical || '')).toLowerCase();
  return RESTRICTED_NAMES.some(r => s.includes(r));
}

// Gated herbs — legal but require explicit user opt-in on the entry
// gate before entering the candidate pool. Amanita muscaria is the
// main one; Robin sells it, but a casual quiz-taker who's never met
// it shouldn't be auto-assigned it.
const GATED_NAMES = [
  'amanita muscaria','amanita_muscaria','amanita pantherina',
];
function isGated(h) {
  const s = ((h.name || '') + ' ' + (h.botanical || '')).toLowerCase();
  return GATED_NAMES.some(r => s.includes(r));
}

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

  const intentions = [];
  if (has(/adaptogen|cortisol|stress|hpa|resilience|burnout|nervine tonic/)) intentions.push('stress');
  if (has(/anxi|nervous|gaba|tension|calm|settle|sedativ|anxiolytic|kava|panic|shen disturb/)) intentions.push('anxiety');
  if (has(/sleep|somno|insomni|circadian|melaton|hypnotic|deep sleep|night wake/)) intentions.push('sleep');
  if (has(/vital|stamina|adren|fatigue|exhaustion|athletic|endurance|yang tonic|qi tonic|energizer|mitochondri/)) intentions.push('energy');
  if (has(/mood|antidepress|serotonergi|dopamin|heart open|emotional|grief|depression|melanchol|lift|euphoric/)) intentions.push('mood');
  if (has(/cognit|memory|attention|focus|clarity|neuroplast|ngf|nootropi|acetylcholi|neuroprotect|bdnf|concentrat|neurogen/)) intentions.push('cognitive');
  if (has(/hormon|endocrine|estrogen|progester|testoster|libido|cycle|menopaus|luteal|pms|amenorr|dysmenor|androgen|thyroid.*support/)) intentions.push('hormones');
  if (has(/digest|gastroint|gut|stomach|bloating|ibs|carminativ|bitter|liver.*bile|gastric|dyspepsia|nausea|colon|microbiome|prebiotic/)) intentions.push('digestion');
  if (has(/immun|antiviral|antibacterial|antimicrobial|innate|leukocyt|lymphocyt|resistance|cold.*flu/)) intentions.push('immunity');
  if (has(/anti.?inflammat|cox|pain|analgesic|arthriti|joint|muscle.*spasm|neuralg|headache|migraine|nsaid/)) intentions.push('pain');
  if (has(/detox|liver.*cleans|hepatic|phase\s?i{1,2}|glutathion|bile flow|lymphatic drain|chelat|hepatoprotect/)) intentions.push('detox');
  if (has(/skin|collagen|ceramid|beauty|glow|hydration|photo.?protect|melanin|antioxidant.*skin|hyaluron/)) intentions.push('beauty');
  if (!intentions.length) intentions.push('stress');

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
  if (/pregnan|lactat|breastfeed|uterine.*stim|emmenagog|abortifac|fetal|infant.*transfer/.test(con)) flags.push('pregnancy');
  if (/anticoagulant|antiplatelet|blood.?thin|warfarin|heparin|inr|digoxin|cardiac glycoside|heart.*medicat|antihypertens|hypertens/.test(con)) flags.push('cardio_meds');
  if (/maoi|ssri|snri|serotonin syndrome|antidepress|mood stabili|antipsychot|bipolar|lithium|dopaminergi/.test(con)) flags.push('psych_meds');
  if (/immunostim|autoimmun|immunosuppress|lupus|MS\b|rheumatoid|multiple sclerosis/i.test(con)) flags.push('autoimmune');
  if (/hepatotox|liver.*damage|hepatit|nephrotox|kidney.*stone|oxalate|renal fail/.test(con)) flags.push('liver_kidney');
  if (/thyroid|hyperthyroid|hypothyroid|graves|hashimoto|iodine/.test(con)) flags.push('thyroid');
  if (/hypertens|blood pressure|vasoconstrict/.test(con)) flags.push('hypertension');
  if (/cyp3a4|contracepti|estrogen.*bind|birth control|oral contracepti/.test(con)) flags.push('contraceptive');
  if (/benzodiazepin|cns depress|sedative.*additive|potentiat.*sedat/.test(con)) flags.push('sedatives');
  if (/asteraceae|ragweed|daisy family|compositae|salicylat|aspirin/.test(con)) flags.push('allergy');

  const uniqIntentions = [...new Set(intentions)];
  return {
    intentions: uniqIntentions.slice(0, 3),
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
    .map(h => Object.assign({}, h, { _ax: inferAxes(h), gated: isGated(h) }));
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

module.exports = {
  RESTRICTED_NAMES, GATED_NAMES,
  isRestricted, isGated, inferAxes, ensurePool, shortNote,
};
