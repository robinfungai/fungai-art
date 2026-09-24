// src/server/formula-engine/scoring.js
//
// The core score function + its boost modifiers. Every herb in the
// safety-filtered pool gets scored against the user profile; herbs
// with score > 0 flow into the picker's ranking.
//
// LIFTED VERBATIM from
//   public/find-your-formula/index.html lines 2040–2199.
// nervousBoost / energyCurveBoost and the 7-pattern sleep branches were
// added later (engine 2.1) so those quiz answers shape the formula.

const { isGABAergic, isCNSStimulant } = require('./pharmacology');
const { applyMisspellings } = require('../myco/terminology.cjs');

const SUBPATTERN_AFFINITY = {
  anger:       ['bupleurum','peony','chrysanthemum','gardenia','skullcap','passionflower','motherwort','mint'],
  flushed:     ['american_ginseng','ophiopogon','rehmannia','tremella','lily','moutan'],
  inflamed:    ['turmeric','boswellia','solidago','japanese_knotweed','honeysuckle','forsythia','cats_claw','burdock'],
  hot_night:   ['rehmannia','ophiopogon','peony','lily','asparagus','american_ginseng','mulberry'],
  cold_hands:  ['cinnamon','ginger','angelica','pine_pollen','maca','shatavari','dong_quai'],
  heavy:       ['fu_ling','atractylodes','codonopsis','ginger','citrus_peel','magnolia','tangerine'],
  pale:        ['codonopsis','astragalus','atractylodes','licorice','red_dates','shan_yao','jujube'],
  low_drive:   ['cistanche','morinda','eucommia','cordyceps','maca','ashwagandha','shilajit','pine_pollen'],
  stuck:       ['bupleurum','cyperus','citrus_peel','rose','holy_basil','damiana','vervain'],
  up_down:     ['bupleurum','peony','lily','albizia','shatavari','holy_basil','saffron'],
  tension:     ['gastrodia','uncaria','black_cohosh','passionflower','skullcap','magnolia','wood_betony'],
  sighing:     ['bupleurum','magnolia_bark','rose','lily','albizia','lavender','damiana'],
  purposeless: ['reishi','asparagus','albizia','lily','rose','saffron','shatavari','damiana'],
  dry:         ['ophiopogon','tremella','glehnia','american_ginseng','shatavari','rehmannia','goji','pear'],
  overworked:  ['rehmannia','goji','cistanche','eucommia','he_shou_wu','deer','shilajit','pine_pollen','maca'],
  anxious_empty:['albizia','longan','lily','fu_ling','jujube','red_dates','saffron','ashwagandha','oatstraw'],
};

function subPatternBoost(h, subKey) {
  const hints = SUBPATTERN_AFFINITY[subKey];
  if (!hints || !hints.length) return 0;
  const id   = String(h.id || '').toLowerCase();
  const name = String(h.name || '').toLowerCase();
  for (const hint of hints) {
    const needle = hint.replace(/_/g, ' ');
    if (id.includes(hint) || name.includes(needle)) return 6;
  }
  return 0;
}

function durationBoost(h, duration) {
  if (!duration) return 0;
  const text = ((h.primary_functions || []).concat(h.energetics || []).concat([h.pharmacology || ''])).join(' | ').toLowerCase();
  if (duration === 'weeks') {
    if (/nervine|acute|fast|rapid|immediate|warming|move.*qi|circulation/.test(text)) return 3;
    if (/deep.*tonic|constitutional|jing|multi.?month|long.?slow/.test(text)) return -2;
  } else if (duration === 'year_plus' || duration === 'lifelong') {
    if (/tonic|adaptogen|nourish|jing|essence|restor|convalescence|constitutional|mineral/.test(text)) return 4;
    if (/acute|first.line.*acute|short.?term|fast.?acting/.test(text)) return -1;
  }
  return 0;
}

function ageBoost(h, age) {
  if (!age) return 0;
  const text = ((h.primary_functions || []).concat(h.contraindications || [])).join(' | ').toLowerCase();
  if (age === '60_plus') {
    if (/gentle|nourish|tonic|restor|adaptogen|kidney.*yin|blood.*tonic/.test(text)) return 2;
    if (/stimulant|caffeine|strong.*yang|hot.*energetic/.test(text)) return -2;
  }
  if (age === 'under_25') {
    if (/menopaus|perimenopaus|hot flash/.test(text)) return -2;
  }
  return 0;
}

// ── Rhythm-answer vocabulary ─────────────────────────────────────
// Shared by the nervous-system, energy-curve and sleep-pattern boosts.
// Each boost checks penalties (stimulant / sedative load) BEFORE the
// positive matches, because a stimulant herb will also match "energ…".
const RX = {
  calming:    /nervine|anxiolytic|calm|sedativ|relax|sooth|settle|gaba|shen/,
  gentle:     /nervine|trophorestor|gentle|sooth|calm/,
  restoring:  /adaptogen|hpa|adrenal|restor|nourish|trophorestor|convalescen/,
  adrenal:    /adaptogen|cortisol|hpa|adrenal/,
  energising: /energ|vital|stamina|fatigue|endurance|mitochondri|qi tonic|yang tonic|invigorat/,
  lifting:    /mood|antidepress|uplift|heart.?open|dopamin|motivat|melanchol|joy/,
  focus:      /cognit|memory|focus|concentrat|mental (?:fatigue|clarity|stamina|energy)|neuroprotect|acetylcholi/,
  bloodSugar: /blood.?sugar|glyc[a]?emi|insulin|glucose/,
  // Deliberately narrow — "regulat/modulat" alone matches most of the
  // catalogue (immunomodulating, qi-regulating…) and stops discriminating.
  balancing:  /amphoteric|adaptogen|stabili[sz]\w* (?:mood|energy|blood)|(?:mood|energy|hormon\w*|blood.?sugar) balanc/,
  circadian:  /circadian|melaton|sleep|evening|night/,
  physical:   /stamina|endurance|athlet|recovery|muscle|exercise|physical performance|mitochondri|\batp\b/,
  onset:      /sleep onset|fall(?:ing)? asleep|insomni|anxiolytic|racing|nervine|calm/,
  maintain:   /deep sleep|night wak|sleep maint|stay(?:ing)? asleep|hypnotic|insomni|liver.*heat|shen/,
  dreaming:   /oneirogen|lucid|dream.?enhanc|vivid dream|visionary/,
};

const _textCache = new WeakMap();
function rhythmText(h) {
  let t = _textCache.get(h);
  if (t === undefined) {
    t = ((h.primary_functions || []).concat(h.secondary_benefits || [], h.energetics || [], [h.pharmacology || '']))
      .join(' | ').toLowerCase();
    _textCache.set(h, t);
  }
  return t;
}

// "How does your energy usually feel?" — the nervous-system typology.
// Same intention reads differently per state: a wired person needs
// down-regulation before any lift; a flat person needs gentle lift,
// not more sedation.
function nervousBoost(h, nervous) {
  if (!nervous || nervous === 'steady') return 0;
  const t = rhythmText(h);
  const stim = isCNSStimulant(h), gaba = isGABAergic(h);
  switch (nervous) {
    case 'wired':
      if (stim) return -3;
      return RX.calming.test(t) ? 3 : 0;
    case 'tired':
      if (gaba) return -2;
      if (RX.energising.test(t)) return 3;
      return RX.restoring.test(t) ? 2 : 0;
    case 'wired_tired':
      if (stim) return -3;
      if (RX.restoring.test(t)) return 3;
      return RX.calming.test(t) ? 2 : 0;
    case 'reactive':
      if (stim) return -4;
      return RX.gentle.test(t) ? 3 : 0;
    case 'flat':
      if (gaba) return -2;
      if (RX.lifting.test(t)) return 3;
      return RX.energising.test(t) ? 1 : 0;
  }
  return 0;
}

// "How does your energy behave through the day?" — the shape of the
// day biases between adrenal/blood-sugar regulation, focus and
// physical recovery allies.
function energyCurveBoost(h, curve) {
  if (!curve || curve === 'moderate') return 0;
  const t = rhythmText(h);
  const stim = isCNSStimulant(h);
  switch (curve) {
    case 'low_waking':
      if (isGABAergic(h)) return -1;
      if (RX.adrenal.test(t)) return 3;
      return RX.energising.test(t) ? 2 : 0;
    case 'am_good_pm_crash':
      return RX.adrenal.test(t) || RX.bloodSugar.test(t) ? 3 : 0;
    case 'slow_am_strong_pm':
      if (stim) return -2;
      return RX.circadian.test(t) ? 2 : 0;
    case 'high_unstable':
      if (stim) return -3;
      return RX.bloodSugar.test(t) || RX.balancing.test(t) ? 3 : 0;
    case 'waves':
      return RX.balancing.test(t) || RX.adrenal.test(t) ? 2 : 0;
    case 'crash_mental':
      return RX.focus.test(t) ? 3 : 0;
    case 'crash_physical':
      return RX.physical.test(t) ? 3 : 0;
  }
  return 0;
}

function sleepBoost(h, sleep) {
  // 'restorative' (the 7-option pattern's baseline) and
  // 'restorative_6plus' (the 4-option quality's baseline) both mean
  // "no sleep intervention needed".
  if (!sleep || sleep === 'restorative_6plus' || sleep === 'restorative') return 0;
  const text = ((h.primary_functions || []).concat(h._ax?.intentions || [])).join(' | ').toLowerCase();
  if (sleep === 'very_broken' || sleep === 'under_6') {
    if (/sleep|somno|insomni|hypnotic|deep sleep|night wake|circadian/.test(text)) return 4;
  }
  if (sleep === 'not_restorative_6plus') {
    if (/restor|adaptogen|adrenal|hpa|shen|kidney.*yin/.test(text)) return 3;
  }
  // The 7-pattern sleep question — each pattern leans on a different
  // family of herbs; stimulants are pushed down for every disturbed one.
  const t = rhythmText(h);
  const stim = isCNSStimulant(h);
  switch (sleep) {
    case 'hard_onset':
      if (stim) return -2;
      return isGABAergic(h) || RX.onset.test(t) ? 3 : 0;
    case 'wakes_middle':
      if (stim) return -2;
      return RX.maintain.test(t) ? 3 : 0;
    case 'early_wake':
      if (stim) return -1;
      return RX.lifting.test(t) || /shen|sleep/.test(t) ? 2 : 0;
    case 'sleeps_no_rest':
      return /restor|adaptogen|adrenal|hpa|shen|kidney.*yin|nourish/.test(t) ? 3 : 0;
    case 'vivid_restless':
      // Dream-enhancing allies (calea, mugwort, blue lotus…) make vivid,
      // restless nights worse — push them out before rewarding calm.
      if (RX.dreaming.test(t)) return -4;
      if (stim) return -2;
      return RX.calming.test(t) ? 3 : 0;
  }
  return 0;
}

const NOTES_KEYWORDS = [
  'lucid dream','lucid travel','astral',
  'dream','vision','visionary','oneir','shamanic',
  'sleep','insomni','wake',
  'anxi','panic','worry','loop',
  'focus','memory','cognit','clarity','concentrat',
  'energy','fatigue','tired','stamina','endurance','athlet',
  'depress','mood','grief','heavy heart','melanchol','flat',
  'stress','burnout','cortisol','deplet','exhaust',
  'pain','inflam','ache','joint','headache','migraine',
  'gut','digest','bloat','ibs','stomach','nausea',
  'immune','cold','flu','virus',
  'hormone','cycle','pms','menopaus','libido',
  'liver','detox','cleanse',
  'skin','glow','beauty','collagen',
  'heart','open','love',
  'creativ','write','music','art',
  'ceremon','ritual','meditat','prayer',
];

// The notes field is scored by substring match, which means a misspelling
// does not weaken an intention — it deletes it. "anxeity" contains no
// 'anxi', so someone who typed that got no anxiety weighting at all, and
// nothing anywhere told them or us.
//
// Correction is the curated table ONLY (see applyMisspellings): no fuzzy
// matching against this keyword list, because half of these keys are
// four-letter prefixes and 'anti-inflammatory' is one edit from 'anxi'.
// A false boost here does not rank a paragraph lower, it puts a different
// herb in a bottle.
//
// The original text is matched as well as the corrected one, so this can
// only ever ADD an intention the member expressed, never remove one they
// spelled correctly.
function notesBoost(h, notes) {
  if (!notes) return 0;
  const raw = String(notes).toLowerCase();
  const fixed = applyMisspellings(raw);
  // ' | ' between the two readings so no keyword can match across the
  // join — none of them contain a pipe.
  const n = fixed.corrections.length ? raw + ' | ' + fixed.text.toLowerCase() : raw;
  const t = (
    (h.primary_functions   || []).join(' | ') + ' | ' +
    (h.secondary_benefits  || []).join(' | ') + ' | ' +
    (h.energetics          || []).join(' | ') + ' | ' +
    (h.spiritual_layer     || '') + ' | ' +
    (h.pharmacology        || '') + ' | ' +
    (h.name                || '')
  ).toLowerCase();
  let boost = 0;
  for (const kw of NOTES_KEYWORDS) {
    if (n.includes(kw) && t.includes(kw)) boost += kw.includes(' ') ? 4 : 2;
  }
  return boost;
}

function scoreHerb(h, a) {
  const ax = h._ax;
  let s = 0;
  if (ax.intentions.includes(a.intention)) {
    s += 5 / Math.max(1, ax.intentions.length);
  }
  if (Array.isArray(a.intentions) && a.intentions.length > 1) {
    if (a.intentions[1] && ax.intentions.includes(a.intentions[1])) {
      s += 3 / Math.max(1, ax.intentions.length);
    }
    if (a.intentions[2] && ax.intentions.includes(a.intentions[2])) {
      s += 1.5 / Math.max(1, ax.intentions.length);
    }
  }
  if (ax.patterns.includes(a.pattern)) {
    s += 4;
  } else if (ax.patterns.length === 1 && ax.patterns[0] === 'mixed') {
    // 'mixed' is the fallback axes.js assigns when a plant does not sort
    // cleanly into hot / cold / depleted. It means constitutionally
    // NEUTRAL, not "matches nothing" — but scoring treated it as a
    // non-match, so the three herbs whose only pattern is 'mixed' (both
    // Amanitas and Maitake) forfeited the single largest scoring term on
    // every profile and could never be seated. Half credit: a neutral
    // herb is neither disqualified nor preferred over one that genuinely
    // matches the pattern the person described.
    //
    // ONLY when 'mixed' is the herb's sole pattern. A herb carrying
    // 'mixed' alongside a real one is already classified, and giving it
    // consolation credit on every non-matching profile lifted eleven
    // herbs at once — Cordyceps to 45% of bottles — which is the same
    // concentration problem the tie-break fix had just undone.
    s += 2;
  }
  if (ax.times.includes(a.time))           s += 2;
  if (ax.stress.includes(a.stress))        s += 3;
  s += notesBoost(h, a.notes);
  s += subPatternBoost(h, a.patternSub);
  s += durationBoost(h, a.duration);
  s += ageBoost(h, a.age);
  s += sleepBoost(h, a.sleep);
  s += nervousBoost(h, a.nervous);
  s += energyCurveBoost(h, a.energy_curve);
  return s;
}

module.exports = {
  SUBPATTERN_AFFINITY, NOTES_KEYWORDS,
  subPatternBoost, durationBoost, ageBoost, sleepBoost, notesBoost,
  nervousBoost, energyCurveBoost,
  scoreHerb,
};
