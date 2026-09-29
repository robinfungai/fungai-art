// src/server/formula-engine/pharmacology.js
//
// Pharmacological load classifiers + category classifier.
// These are ORTHOGONAL to the taste/tonic `categoryOf` classification.
// The load caps in picker.js consume the GABAergic/CNS-stimulant
// classifiers so a formula can't end up with 4 strong GABAergics
// (valerian + hops + passionflower + magnolia) or 4 CNS drivers
// (ginseng + cordyceps + rhodiola + guarana) — the category guard
// alone missed these because each herb sat in a DIFFERENT categoryOf
// bucket (mushroom / adaptogen / nervine).
//
// 2026-09-27 — the herb's own `cns_action` field (src/data/herbs.ts) is
// the answer whenever a record carries one. It was added because the
// word search below misfired both ways: it matched the id words inside
// the prose, so 'mate' (yerba mate) fired inside "glutamate" and made
// Lavender, St John's Wort, He Shou Wu and six others stimulants; any
// mention of GABA made Barley and Hawthorn sedatives; and it never
// caught Ephedra, Yohimbe or Bitter Orange. Every herb the search
// flags now carries an explicit class with its PubMed evidence
// (cns_evidence), and tests/cns-classification-verify.cjs keeps it so.
//
// The search stays only as the fallback for a record without the
// field, with the id words matched against the herb's own id and name
// on word boundaries, never against the prose.

const GABAERGIC_IDS = [
  'valerian','passionflower','hops','magnolia','skullcap','kava',
  'california_poppy','blue_lotus','ashwagandha_sedating',
];

const STIMULANT_IDS = [
  'ginseng','panax_ginseng','cordyceps','rhodiola','guarana','yerba_mate',
  'mate','guayusa','kola_nut','coffee','green_tea','gotu_kola_stim','maca',
];

const CNS_ACTIONS = ['stimulant', 'activating', 'neutral', 'calming', 'sedative', 'psychoactive'];

function namedIn(h, ids) {
  const who = (String(h.id || '') + ' ' + String(h.name || '')).toLowerCase().replace(/_/g, ' ');
  return ids.some(id => new RegExp('(^|[^a-z])' + id.replace(/_/g, '[ _]') + '([^a-z]|$)').test(who));
}
function proseText(h) {
  return ((h.primary_functions || []).join(' ') + ' ' + (h.pharmacology || '')).toLowerCase();
}

// The fallback, exported so the coverage test can ask what it would say.
function guessGABAergic(h) {
  return namedIn(h, GABAERGIC_IDS) ||
    /gaba|benzodiazepine.receptor|hypnotic|strong.sedativ|cns.depressant/.test(proseText(h));
}
function guessCNSStimulant(h) {
  return namedIn(h, STIMULANT_IDS) ||
    /cns.stimulant|caffeine.rich|methylxanthine|adrenergic.stim/.test(proseText(h));
}

// The herb's CNS class: its recorded cns_action, or the fallback's
// verdict ('sedative' / 'stimulant' / 'neutral') when it has none.
function cnsAction(h) {
  if (h && CNS_ACTIONS.includes(h.cns_action)) return h.cns_action;
  if (!h) return 'neutral';
  if (guessGABAergic(h)) return 'sedative';
  if (guessCNSStimulant(h)) return 'stimulant';
  return 'neutral';
}

// Counts toward the sedative cap (≤ 2 per formula).
function isGABAergic(h) {
  return cnsAction(h) === 'sedative';
}

// Counts toward the stimulant cap (≤ 2 per formula).
function isCNSStimulant(h) {
  const a = cnsAction(h);
  return a === 'stimulant' || a === 'activating';
}

// Time of use. A formula taken in the evening or at night, or composed
// for sleep, carries nothing that raises arousal: no stimulant
// (caffeine, synephrine, ephedrine…) and no activating herb (rhodiola,
// ginseng, cordyceps…). Sleep as a second or third wish still keeps the
// true stimulants out. Until 2026-09-27 the engine could bottle Bitter
// Orange for an evening sleep formula.
function fitsTimeOfUse(h, a) {
  const cls = cnsAction(h);
  if (cls !== 'stimulant' && cls !== 'activating') return true;
  if (!a) return true;
  if (a.time === 'evening' || a.time === 'night' || a.intention === 'sleep') return false;
  if (cls === 'stimulant' && Array.isArray(a.intentions) && a.intentions.includes('sleep')) return false;
  return true;
}

// Push-pull. A sedative and a true stimulant in one bottle work against
// each other (valerian with guarana, kava with bitter orange). The
// activating herbs are allowed beside a sedative — rhodiola with
// passionflower is a classic pairing for the anxious and exhausted.
function isStrongStimulant(h) {
  return cnsAction(h) === 'stimulant';
}

// Serotonin load. St John's Wort, Kanna, Saffron and Rhodiola each act
// on serotonin; two in one bottle stack toward serotonin syndrome, so the
// engine bottles at most one (Robin, 2026-09-28). Read from the record's
// `serotonergic` flag in herbs.ts — no word search.
const MAX_SEROTONERGIC = 1;
function isSerotonergic(h) {
  return !!(h && h.serotonergic === true);
}

// Laxatives only when digestion (or detox) is one of the goals. Rhubarb
// Root and Senna were reaching stress and beauty bottles because they
// scored on the body-pattern and stress answers (Robin, 2026-09-28).
// Recorded on the herb (herbs.ts `laxative: true`, 2026-09-29, external
// audit #26: the herb record, not a word search, is the source of truth).
function isLaxative(h) {
  return !!h && h.laxative === true;
}
// The old word search — kept only so tests/herb-record-classes-verify.cjs
// can fail when a herb's prose says laxative and its record does not.
function laxativeInProse(h) {
  if (!h) return false;
  const t = (h.energetics || []).join(' ') + ' ' + (h.primary_functions || []).slice(0, 2).join(' ');
  return /laxativ|purgativ|cathartic/i.test(t);
}
// Dream-deepening herbs (oneirogens: Mugwort, Blue Lotus, Calea…) —
// recorded as sleep_action 'dream_vivid' (2026-09-29). Robin: they "should
// not be matched when people are already having restless sleep"; the
// engine keeps them out of the pool for those answers (note-safety.js
// detectRestlessSleep). The prose search exists only so
// tests/herb-names-verify.cjs fails when a record's text claims it and
// the tag is missing.
function isDreamDeepening(h) {
  return !!h && Array.isArray(h.sleep_action) && h.sleep_action.includes('dream_vivid');
}
const DREAM_DEEPENING_PROSE = /oneirogen|lucid dream|dream[- ]?(?:enhanc|induc|open|deepen)|vivid(?:,)? (?:\w+ )?dream|dream (?:vivid|lucid|recall)|REM (?:density|access)|enhances REM/i;
function dreamDeepeningInProse(h) {
  if (!h) return false;
  const own = Object.entries(h).filter(([k]) => !/sleep_action|synerg|pair|combin|interact/i.test(k));
  return DREAM_DEEPENING_PROSE.test(JSON.stringify(own));
}

// Engine 2.4 tightened it: "digestion" as a goal usually means bloating
// or indigestion, and the goal alone had put Senna AND Buckthorn in one
// bottle. A laxative now needs digestion or detox as a goal AND the
// person saying they are constipated — the pro quiz's digestion answer
// 'constipated', or the word in their note. At most one per bottle
// (MAX_LAXATIVE, picker.js / myco-validator.js / analyze.js).
const MAX_LAXATIVE = 1;
function fitsGoal(h, a) {
  if (!isLaxative(h)) return true;
  const goals = a ? [a.intention].concat(Array.isArray(a.intentions) ? a.intentions : []) : [];
  if (!goals.includes('digestion') && !goals.includes('detox')) return false;
  return !!a && (a.digestion === 'constipated' || /constipat/i.test(String(a.notes || '')));
}

// Rough category of a herb — used by the balance guard in picker.js.
// Categories: adaptogen · nervine · tonic · mover · mushroom · bitter ·
// aromatic · nutritive · other. Pulled from primary_functions text +
// energetics.
// Fungal families recorded in herbs.ts `family` (every herb has one).
// Until 2026-09-28 "mushroom" was a word search over the name AND the
// prose, so "lion" put Dandelion in the mushroom category, and Ginkgo,
// Milk Thistle and Schisandra (whose text mentions mushrooms) followed,
// while Fu Ling and Morel were missed. The category cap then held real
// mushrooms out of bottles for plants that are not mushrooms.
const FUNGAL_FAMILIES = new Set([
  'Agaricaceae', 'Amanitaceae', 'Auriculariaceae', 'Cordycipitaceae', 'Fomitopsidaceae',
  'Ganodermataceae', 'Grifolaceae', 'Hericiaceae', 'Hymenochaetaceae', 'Marasmiaceae',
  'Meripilaceae', 'Morchellaceae', 'Omphalotaceae', 'Ophiocordycipitaceae', 'Physalacriaceae',
  'Pleurotaceae', 'Polyporaceae', 'Sparassidaceae', 'Tremellaceae',
]);
// Only for a record with no family (test fixtures): the name alone,
// whole words, never the prose.
const FUNGUS_NAME = /\b(mushroom|reishi|chaga|lion'?s mane|cordyceps|maitake|shiitake|tremella|turkey tail|amanita|polypore|fu ling|poria|morel)\b/;

function isFungus(h) {
  if (h && h.family) return FUNGAL_FAMILIES.has(String(h.family).trim());
  return FUNGUS_NAME.test(String((h && h.name) || '').toLowerCase());
}

// The two Amanitas (Muscaria, Pantherina), by recorded family or name.
function isAmanita(h) {
  return !!h && (h.family === 'Amanitaceae' || /\bamanita\b/i.test(String(h.name || '') + ' ' + String(h.botanical || '')));
}
// St John's Wort (Hypericum perforatum), however the name is spelled.
function isStJohnsWort(h) {
  return !!h && /\bst\.? john'?s wort\b|hypericum perforatum/i.test(String(h.name || '') + ' ' + String(h.botanical || ''));
}

function categoryOf(h) {
  const t = (
    (h.primary_functions || []).join(' | ') + ' | ' +
    (h.energetics || []).join(' | ') + ' | ' +
    (h.pharmacology || '')
  ).toLowerCase();
  if (isFungus(h)) return 'mushroom';
  if (/adaptogen|cortisol|hpa|adrenal|stress.resil/.test(t))                return 'adaptogen';
  if (/nervine|gaba|anxiolytic|sedativ|calm.*nerv/.test(t))                 return 'nervine';
  if (/move.*qi|circulate|regulate.*qi|liver.*qi|disperse|open.*chest/.test(t)) return 'mover';
  if (/bitter|hepatic|liver.*cleans|digest.*bitter|choleretic/.test(t))     return 'bitter';
  if (/tonic|nourish|blood.*tonic|yin.*tonic|yang.*tonic|jing|essence|restor/.test(t)) return 'tonic';
  if (/nutriti|mineral.*rich|silica|iron.*rich|dense.*nutri|deeply nour/.test(t)) return 'nutritive';
  if (/aromatic|essential.*oil|carminativ/.test(t))                         return 'aromatic';
  return 'other';
}

module.exports = {
  GABAERGIC_IDS, STIMULANT_IDS, CNS_ACTIONS,
  cnsAction, isGABAergic, isCNSStimulant, guessGABAergic, guessCNSStimulant,
  fitsTimeOfUse, isStrongStimulant,
  isSerotonergic, MAX_SEROTONERGIC, isLaxative, laxativeInProse, fitsGoal, MAX_LAXATIVE,
  isDreamDeepening, dreamDeepeningInProse,
  categoryOf, isFungus, FUNGAL_FAMILIES, isAmanita, isStJohnsWort,
};
