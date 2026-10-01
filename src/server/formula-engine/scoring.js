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

const { isGABAergic, isCNSStimulant, isWarmingAromatic, avoidsWarming } = require('./pharmacology');
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

const NOTES_MAX_BOOST = 6;
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

// A keyword matches at the START of a word, never inside one (external
// audit 2026-09-28, M3): as a bare substring "art" fired on "partner"
// and "heart", "flu" on "reflux", "gut" on "gutted". The short words
// below must also END there (a plural s allowed): "open" is not
// "opening up the chest", "heart" is not "heartburn". The longer keys
// stay prefixes on purpose — "anxi" is meant to catch anxiety/anxious.
const NOTES_WHOLE_WORDS = new Set(['art', 'flu', 'gut', 'ibs', 'open', 'love', 'flat', 'cold', 'wake', 'loop', 'ache', 'pain', 'skin', 'glow', 'heart']);
const NOTES_KEYWORD_RX = new Map(NOTES_KEYWORDS.map(kw => [kw, new RegExp(
  '\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (NOTES_WHOLE_WORDS.has(kw) ? 's?\\b' : ''))]));

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
// A refused wish is not a wish (external audit 2026-09-29): in "I don't
// want anything for sleep" the words after the refusal, to the end of
// that phrase, are not scored. Deliberately narrow — only a negated
// want/need followed by anything / something / any / a / an. Negation
// in symptom language is a NEED ("can't sleep", "no energy", "nothing
// helps my anxiety", "I don't want to feel tired"), so it is left alone.
// Past and present ("I used to sleep badly") are not told apart here;
// MYCO reads the note as a whole when it composes.
// 2026-09-29 (hardening checklist #10): a refused wish may name the thing
// straight away — "I do NOT want energy", "don't need more focus" — so
// any object counts, except "to …": "I don't want to feel tired" is a
// need and stays scored.
const NEGATED_WISH = /\b(?:do\s+not|don'?t|does\s+not|doesn'?t|never|not)\s+(?:really\s+)?(?:want|need)\s+(?!to\b)[^.,;:!?\n|]*/g;

function notesBoost(h, notes) {
  if (!notes) return 0;
  const raw = String(notes).toLowerCase().replace(/[’‘]/g, "'").replace(NEGATED_WISH, ' ');
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
    const rx = NOTES_KEYWORD_RX.get(kw);
    if (rx.test(n) && rx.test(t)) boost += kw.includes(' ') ? 4 : 2;
  }
  // Capped (audit 2026-09-28): a keyword-stuffed note reached +30, more
  // than twice the first goal (12). A real note scores at most about +4,
  // so the cap only ever bites on stuffing.
  return Math.min(NOTES_MAX_BOOST, boost);
}

// ── Pro-quiz answers (engine 2.4, 2026-09-28) ─────────────────────
// The pro composer asks six questions the engine used to ignore:
// support, digestion, emotional, somatic, cycle, prior_herbs. Each now
// nudges the ranking, read from the herb's own structured tags
// (digestion_fit, regional_affinity, onset_time, caution_level, goals)
// rather than from its prose. The consumer quiz never sends them, so
// its bottles are untouched. The safety consequences of `cycle` and
// `prior_herbs` live in safety.js (passesProfileSafety), not here —
// a nudge can be outvoted, an exclusion cannot.

// "How does your digestion usually feel?" → herbs.ts digestion_fit.
const DIGESTION_FIT = {
  bloated:       { plus: ['carminative', 'moving'],              minus: [] },
  burning:       { plus: ['cooling', 'demulcent'],               minus: ['warming'] },
  cold_sluggish: { plus: ['warming', 'bitter'],                  minus: ['cooling'] },
  anxious_gut:   { plus: ['carminative', 'demulcent'],           minus: [] },
  irregular:     { plus: ['carminative', 'demulcent', 'moving'], minus: [] },
  constipated:   { plus: ['moving', 'demulcent'],                minus: ['astringent'] },
};
function digestionBoost(h, digestion) {
  const rule = DIGESTION_FIT[digestion];
  const fit = Array.isArray(h.digestion_fit) ? h.digestion_fit : [];
  if (!rule || !fit.length) return 0;
  let b = 0;
  if (rule.plus.some(t => fit.includes(t)))  b += 2;
  if (rule.minus.some(t => fit.includes(t))) b -= 2;
  return b;
}

// "Where in the body do you feel it?" (several allowed) → regional_affinity.
const SOMATIC_REGION = {
  head_mind: ['head'], eyes: ['head'], jaw_neck: ['head', 'joints'],
  chest_breath: ['chest'], heart: ['heart', 'chest'], solar_plexus: ['solar_plexus'],
  gut: ['gut'], liver_right: ['liver'], kidneys_back: ['kidneys'],
  pelvis: ['pelvis'], muscles_joints: ['joints'], skin: ['skin'], whole_body: ['whole'],
};
function somaticBoost(h, somatic) {
  const areas = Array.isArray(somatic) ? somatic : [];
  const aff = Array.isArray(h.regional_affinity) ? h.regional_affinity : [];
  if (!areas.length || !aff.length) return 0;
  let b = 0;
  for (const s of areas) if ((SOMATIC_REGION[s] || []).some(r => aff.includes(r))) b += 2;
  return Math.min(4, b);
}

const hasGoal = (h, g) => ((h._ax && h._ax.intentions) || []).includes(g);
const hasRegion = (h, r) => Array.isArray(h.regional_affinity) && h.regional_affinity.includes(r);
const isCooling = h => /cool|cold/i.test((h.energetics || []).join(' '));

// "What is the emotional weather?"
function emotionalBoost(h, emotional) {
  if (!emotional || emotional === 'spacious') return 0;
  const stim = isCNSStimulant(h), gaba = isGABAergic(h);
  switch (emotional) {
    case 'grief_chest':
      return hasGoal(h, 'mood') || hasRegion(h, 'heart') || hasRegion(h, 'chest') ? 2 : 0;
    case 'worry_loops':
      if (stim) return -2;
      return hasGoal(h, 'anxiety') || RX.calming.test(rhythmText(h)) ? 2 : 0;
    case 'flat':
      if (gaba) return -2;
      return hasGoal(h, 'mood') || RX.lifting.test(rhythmText(h)) ? 2 : 0;
    case 'overwhelmed':
      if (stim) return -2;
      return hasGoal(h, 'stress') || hasGoal(h, 'anxiety') ? 2 : 0;
    case 'angry':
      if (stim) return -2;
      return isCooling(h) || hasRegion(h, 'liver') ? 2 : 0;
    case 'lonely':
      return hasGoal(h, 'mood') || hasRegion(h, 'heart') ? 2 : 0;
  }
  return 0;
}

// "What kind of support are you looking for?"
const HIGH_CAUTION = new Set(['HIGH', 'VERY HIGH']);
function supportBoost(h, support) {
  if (!support || support === 'exploring') return 0;
  const onset = h.onset_time || '';
  const fast = onset === 'immediate' || onset === 'hours';
  const slow = onset === 'weeks' || onset === 'months';
  switch (support) {
    case 'gentle_daily':
      if (HIGH_CAUTION.has(h.caution_level)) return -3;
      return h.caution_level === 'LOW' ? 2 : 0;
    case 'noticeable':     return fast || onset === 'days' ? 1 : 0;
    case 'deep_restore':   return slow ? 2 : 0;
    case 'acute':          return fast ? 2 : (onset === 'months' ? -2 : 0);
    case 'constitutional': return (slow ? 1 : 0) + (RX.restoring.test(rhythmText(h)) ? 1 : 0);
    case 'performance':    return RX.physical.test(rhythmText(h)) || RX.focus.test(rhythmText(h)) ? 2 : 0;
    case 'seasonal':       return hasGoal(h, 'immunity') ? 2 : 0;
  }
  return 0;
}

// "Where is your cycle?" — the nudge only; trying_conceive is a safety
// rule in safety.js.
const CYCLE_HORMONAL = new Set(['pms_heavy', 'painful', 'irregular', 'absent', 'perimenopause', 'post_menopause']);
function cycleBoost(h, cycle) {
  if (!CYCLE_HORMONAL.has(cycle)) return 0;
  let b = hasGoal(h, 'hormones') ? 2 : 0;
  if (cycle === 'painful' && hasGoal(h, 'pain')) b += 1;
  return b;
}

// "What is your history with herbs?" — the nudge only; bad_reaction and
// stimulants_sensitive are safety rules in safety.js.
function priorHerbsBoost(h, prior) {
  const p = Array.isArray(prior) ? prior : [];
  if (!p.includes('never')) return 0;
  if (HIGH_CAUTION.has(h.caution_level)) return -3;
  return h.caution_level === 'LOW' ? 1 : 0;
}

// Evidence grade (engine 2.5, Robin D4 2026-09-28): 0 to +2 points,
// where before it only broke exact ties. Deliberately smaller than every
// answer-driven term (body 4, stress 3, time 2), so evidence decides
// between herbs that fit the person about equally and never overrides
// the fit. 'traditional' (use documented, not trialled) and ungraded
// herbs sit with C. Earned only by a herb that scored something else —
// evidence alone never brings a herb into the ranking.
const EVIDENCE_POINTS = {
  'A+': 2, 'A': 2, 'A-': 2,
  'B+': 1.5, 'B': 1, 'B-': 0.75,
  'C+': 0.5, 'C': 0.5, 'TRADITIONAL': 0.5,
  'C-': 0, 'D+': 0, 'D': 0, 'D-': 0,
};
function evidenceBoost(h) {
  const g = String((h && h.evidence_grade) || '').trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(EVIDENCE_POINTS, g) ? EVIDENCE_POINTS[g] : 0.5;
}

// Share of a goal's points a herb earns by where that goal sits in its
// own recorded goals: main use, second, third, fourth.
const GOAL_POSITION_WEIGHT = [1, 0.75, 0.625, 0.54];
// What a herb serving none of the chosen goals keeps of its score.
const NON_GOAL_FACTOR = 0.3;

/**
 * Every term of a herb's score, named, so the pro composer can show a
 * practitioner WHY a herb was seated. scoreHerb returns this total —
 * one implementation, so the explanation can never drift from the ranking.
 */
function scoreBreakdown(h, a) {
  const ax = h._ax;
  // The goal leads (engine 2.3, 2026-09-28). The client's first goal is
  // worth up to 12, the second up to 6, the third up to 3 — and within
  // each, a herb earns the full amount when that goal is its MAIN use
  // (first in its recorded goals) and less the further down its list the
  // goal sits (GOAL_POSITION_WEIGHT). Engine 2.4 replaced a "specialist
  // bonus" that gave full points to any herb with a single goal, which
  // seated Dan Shen (a heart herb, calming as a side) in every sleep
  // bottle. The hierarchy stays strict: the weakest first-goal match
  // (12 × 0.54 = 6.48) outranks the strongest second (6), and the
  // weakest second (3.24) outranks the strongest third (3).
  // A herb serving none of the chosen goals keeps 30% of its score
  // (half until 2026-10-02 — Robin's verdict 6: Shatavari took 17% of a
  // bottle for "reproductive nourishment" nobody asked for; having a
  // property does not earn a main share).
  const wanted = Array.isArray(a.intentions) && a.intentions.length ? a.intentions : [a.intention];
  const goalPoints = (max, g) => {
    const i = g ? ax.intentions.indexOf(g) : -1;
    return i < 0 ? 0 : max * GOAL_POSITION_WEIGHT[Math.min(i, GOAL_POSITION_WEIGHT.length - 1)];
  };
  const parts = {};
  parts.goal1 = goalPoints(12, a.intention);
  parts.goal2 = goalPoints(6, wanted[1]);
  parts.goal3 = goalPoints(3, wanted[2]);
  const servesGoal = parts.goal1 > 0 || parts.goal2 > 0 || parts.goal3 > 0;
  if (ax.patterns.includes(a.pattern)) {
    parts.body = 4;
  } else if (ax.patterns.length === 1 && ax.patterns[0] === 'mixed') {
    // 'mixed' is the fallback axes.js assigns when a plant does not sort
    // cleanly into hot / cold / depleted: constitutionally NEUTRAL. Half
    // credit, and ONLY when it is the herb's sole pattern — consolation
    // credit for herbs that also carry a real pattern once lifted
    // Cordyceps into 45% of bottles.
    parts.body = 2;
  } else {
    parts.body = 0;
  }
  parts.time       = ax.times.includes(a.time) ? 2 : 0;
  parts.stress     = ax.stress.includes(a.stress) ? 3 : 0;
  parts.notes      = notesBoost(h, a.notes);
  parts.subPattern = subPatternBoost(h, a.patternSub);
  parts.duration   = durationBoost(h, a.duration);
  parts.age        = ageBoost(h, a.age);
  parts.sleep      = sleepBoost(h, a.sleep);
  parts.nervous    = nervousBoost(h, a.nervous);
  parts.energy     = energyCurveBoost(h, a.energy_curve);
  parts.digestion  = digestionBoost(h, a.digestion);
  parts.somatic    = somaticBoost(h, a.somatic);
  parts.emotional  = emotionalBoost(h, a.emotional);
  parts.support    = supportBoost(h, a.support);
  parts.cycle      = cycleBoost(h, a.cycle);
  parts.history    = priorHerbsBoost(h, a.prior_herbs);
  // A hot, pungent herb for a wired nervous system or a body that reads
  // hot (Robin, 2026-10-02, verdict 8: Ajwain 17% beside Cinnamon for a
  // wired client). rules.js also seats only one such herb in that bottle.
  parts.warming    = isWarmingAromatic(h) && avoidsWarming(a) ? -4 : 0;
  let sum = 0;
  for (const k in parts) sum += parts[k];
  parts.evidence = sum > 0 ? evidenceBoost(h) : 0;
  sum += parts.evidence;
  const factor = servesGoal ? 1 : NON_GOAL_FACTOR;
  return { parts, sum, factor, servesGoal, total: sum * factor };
}

function scoreHerb(h, a) {
  return scoreBreakdown(h, a).total;
}

module.exports = {
  SUBPATTERN_AFFINITY, NOTES_KEYWORDS,
  subPatternBoost, durationBoost, ageBoost, sleepBoost, notesBoost,
  nervousBoost, energyCurveBoost,
  digestionBoost, somaticBoost, emotionalBoost, supportBoost, cycleBoost, priorHerbsBoost,
  EVIDENCE_POINTS, evidenceBoost,
  scoreBreakdown, scoreHerb,
};
