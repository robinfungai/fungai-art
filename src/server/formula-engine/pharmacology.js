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
// LIFTED VERBATIM from
//   public/find-your-formula/index.html lines 2236–2270.

const GABAERGIC_IDS = [
  'valerian','passionflower','hops','magnolia','skullcap','kava',
  'california_poppy','blue_lotus','ashwagandha_sedating',
];

const STIMULANT_IDS = [
  'ginseng','panax_ginseng','cordyceps','rhodiola','guarana','yerba_mate',
  'mate','guayusa','kola_nut','coffee','green_tea','gotu_kola_stim','maca',
];

function isGABAergic(h) {
  const s = String(h.id || '').toLowerCase() + ' ' + String(h.name || '').toLowerCase() + ' ' +
            ((h.primary_functions || []).join(' ') + ' ' + (h.pharmacology || '')).toLowerCase();
  if (GABAERGIC_IDS.some(id => s.includes(id))) return true;
  return /gaba|benzodiazepine.receptor|hypnotic|strong.sedativ|cns.depressant/.test(s);
}

// ⚠ KNOWN OVER-MATCH, deliberately left in place (2026-09-27).
// isCNSStimulant substring-matches the id words against the PROSE, so
// 'mate' (yerba mate) fires inside "glutamate": Lavender, St. John's
// Wort, Amanita, Psilocybe, Rowan Berry, Jiaogulan, Cistanche, Toothed
// Clubmoss and He Shou Wu all count as CNS stimulants — 9 of 18.
// Fixing it here is one line, but it changes what the engine puts in a
// bottle: the false label is what keeps He Shou Wu (caution HIGH,
// documented liver injury) out of energy formulas, and with the fix
// fixture 13-stim-load seats it. That is a decision for Robin — fix the
// match AND decide whether HIGH-caution herbs belong in consumer bottles
// at all — not a side effect of a bug fix. Until then the engine keeps
// this behaviour, and the formula analysis (analyze.js) reads the
// *Strict versions below so its labels are true.
function isCNSStimulant(h) {
  const s = String(h.id || '').toLowerCase() + ' ' + String(h.name || '').toLowerCase() + ' ' +
            ((h.primary_functions || []).join(' ') + ' ' + (h.pharmacology || '')).toLowerCase();
  if (STIMULANT_IDS.some(id => s.includes(id))) return true;
  return /cns.stimulant|caffeine.rich|methylxanthine|adrenergic.stim/.test(s);
}

// The same tests with the id words matched against the herb's own id
// and name, on word boundaries — the prose regexes are unchanged.
function namedIn(h, ids) {
  const who = (String(h.id || '') + ' ' + String(h.name || '')).toLowerCase().replace(/_/g, ' ');
  return ids.some(id => new RegExp('(^|[^a-z])' + id.replace(/_/g, '[ _]') + '([^a-z]|$)').test(who));
}
function isGABAergicStrict(h) {
  if (namedIn(h, GABAERGIC_IDS)) return true;
  const s = ((h.primary_functions || []).join(' ') + ' ' + (h.pharmacology || '')).toLowerCase();
  return /gaba|benzodiazepine.receptor|hypnotic|strong.sedativ|cns.depressant/.test(s);
}
function isCNSStimulantStrict(h) {
  if (namedIn(h, STIMULANT_IDS)) return true;
  const s = ((h.primary_functions || []).join(' ') + ' ' + (h.pharmacology || '')).toLowerCase();
  return /cns.stimulant|caffeine.rich|methylxanthine|adrenergic.stim/.test(s);
}

// Rough category of a herb — used by the balance guard in picker.js.
// Categories: adaptogen · nervine · tonic · mover · mushroom · bitter ·
// aromatic · nutritive · other. Pulled from primary_functions text +
// energetics.
function categoryOf(h) {
  const t = (
    (h.primary_functions || []).join(' | ') + ' | ' +
    (h.energetics || []).join(' | ') + ' | ' +
    (h.pharmacology || '')
  ).toLowerCase();
  const name = (h.name || '').toLowerCase();
  if (/mushroom|reishi|chaga|lion|cordyceps|maitake|shiitake|tremella|turkey.tail|amanita|polypore/.test(name + ' ' + t)) return 'mushroom';
  if (/adaptogen|cortisol|hpa|adrenal|stress.resil/.test(t))                return 'adaptogen';
  if (/nervine|gaba|anxiolytic|sedativ|calm.*nerv/.test(t))                 return 'nervine';
  if (/move.*qi|circulate|regulate.*qi|liver.*qi|disperse|open.*chest/.test(t)) return 'mover';
  if (/bitter|hepatic|liver.*cleans|digest.*bitter|choleretic/.test(t))     return 'bitter';
  if (/tonic|nourish|blood.*tonic|yin.*tonic|yang.*tonic|jing|essence|restor/.test(t)) return 'tonic';
  if (/nutriti|mineral.*rich|silica|iron.*rich|dense.*nutri|deeply nour/.test(t)) return 'nutritive';
  if (/aromatic|essential.*oil|carminativ/.test(t))                         return 'aromatic';
  return 'other';
}

module.exports = { GABAERGIC_IDS, STIMULANT_IDS, isGABAergic, isCNSStimulant, isGABAergicStrict, isCNSStimulantStrict, categoryOf };
