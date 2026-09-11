// src/server/formula-engine/scoring.js
//
// The core score function + its boost modifiers. Every herb in the
// safety-filtered pool gets scored against the user profile; herbs
// with score > 0 flow into the picker's ranking.
//
// LIFTED VERBATIM from
//   public/find-your-formula/index.html lines 2040–2199.

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

function notesBoost(h, notes) {
  if (!notes) return 0;
  const n = String(notes).toLowerCase();
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
  if (ax.patterns.includes(a.pattern))     s += 4;
  if (ax.times.includes(a.time))           s += 2;
  if (ax.stress.includes(a.stress))        s += 3;
  s += notesBoost(h, a.notes);
  s += subPatternBoost(h, a.patternSub);
  s += durationBoost(h, a.duration);
  s += ageBoost(h, a.age);
  s += sleepBoost(h, a.sleep);
  return s;
}

module.exports = {
  SUBPATTERN_AFFINITY, NOTES_KEYWORDS,
  subPatternBoost, durationBoost, ageBoost, sleepBoost, notesBoost,
  scoreHerb,
};
