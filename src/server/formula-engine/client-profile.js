// src/server/formula-engine/client-profile.js
//
// The client's profile in plain clinical words, for the practitioner
// (Robin, 2026-10-01). Every quiz answer, the client's own note and
// MYCO's reading of them, as ONE block. It is printed in Robin's
// reservation email, and he pastes it into /formula-analysis, so the
// analysis MYCO knows who the formula is for (age, conditions,
// medicines, constitution) - it used to see only the herbs.
//
// Pseudonymous on purpose: no name, email or city - only what the
// formulation needs (age range, country, the answers). The block is
// pasted into an AI tool, and identity is not part of the herbal picture.
//
// The wording matches the Pro quiz's clinical labels
// (public/find-your-formula-pro/index.html); an unknown value prints
// as itself with underscores spaced, never as nothing.

const GOAL = {
  stress: 'Stress & resilience', anxiety: 'Anxiety & calm', sleep: 'Sleep & restoration',
  energy: 'Energy & vitality', mood: 'Mood & emotion', cognitive: 'Cognition & memory',
  hormones: 'Hormonal balance', digestion: 'Digestion & gut', immunity: 'Immunity & defence',
  pain: 'Pain & inflammation', detox: 'Liver & detoxification', beauty: 'Skin',
};
const SUPPORT = {
  gentle_daily: 'gentle maintenance, sustained over months', noticeable: 'short-course intervention (shift expected in 2–6 weeks)',
  deep_restore: 'restorative protocol after prolonged depletion', acute: 'acute / situational window',
  constitutional: 'constitutional — a lifelong tendency', performance: 'optimisation from a healthy baseline',
  seasonal: 'seasonal support', exploring: 'exploratory — no defined aim yet',
};
const PATTERN = {
  hot: 'heat / excess', cold: 'cold / deficiency', mixed: 'stagnation / variable', depleted: 'depletion / dryness',
};
const PATTERN_SUB = {
  anger: 'irritability, reactive temper', flushed: 'facial or chest flushing', inflamed: 'inflammatory, burning sensations',
  hot_night: 'nocturnal heat, night sweats', cold_hands: 'cold extremities', heavy: 'heaviness, low motility',
  pale: 'pallor, poor appetite', low_drive: 'low drive, apathy', stuck: 'stagnation', up_down: 'labile mood',
  tension: 'migrating tension', sighing: 'frequent sighing, chest constriction', purposeless: 'loss of purpose, emptiness',
  dry: 'dryness of skin, eyes, throat', overworked: 'prolonged overexertion', anxious_empty: 'anxious depletion',
};
const NERVOUS = {
  wired: 'sympathetic dominance — hyperaroused, hard to down-regulate', tired: 'hypoarousal — low activation, easily depleted',
  wired_tired: 'wired and tired — burnout trajectory', steady: 'regulated', reactive: 'sensory reactivity — over-responsive to noise, people, caffeine, stress',
  flat: 'blunted affect',
};
const CURVE = {
  low_waking: 'low from waking', am_good_pm_crash: 'afternoon trough (14:00–16:00)', slow_am_strong_pm: 'delayed phase — evening chronotype',
  moderate: 'even, moderate', high_unstable: 'high but unstable peaks and drops', waves: 'irregular',
  crash_mental: 'post-cognitive fatigue', crash_physical: 'post-exertional fatigue',
};
const TIME = {
  morning: 'morning — slow activation', midday: 'midday — post-prandial dip', evening: 'evening — cannot disengage',
  night: 'night — nocturnal waking around 03:00', any: 'no diurnal pattern',
};
const STRESS = {
  push: 'over-functioning — pushes through', collapse: 'shutdown — withdraws into recovery mode',
  numb: 'avoidant coping — distraction or alcohol', ride: 'adaptive', off: 'non-specific — something feels off',
};
const DURATION = {
  weeks: 'acute — weeks', months: 'subacute — months', year_plus: 'chronic — a year or more', lifelong: 'constitutional — lifelong',
};
const AVOID = {
  pregnancy: 'pregnancy, preconception or lactation', cardio_meds: 'anticoagulants / antiplatelets / cardiac medication',
  psych_meds: 'antidepressants or mood stabilisers', autoimmune: 'autoimmune disease or immunosuppressants',
  liver_kidney: 'hepatic or renal impairment', thyroid: 'thyroid disorder or medication', hypertension: 'uncontrolled hypertension',
  contraceptive: 'oral contraceptive', sedatives: 'benzodiazepines or sedatives', allergy: 'Asteraceae allergy or salicylate sensitivity',
  other_rx: 'another prescription medicine', none: 'none declared',
};
const AGE = { under_18: 'under 18', under_25: 'under 25', '18_25': '18–25', '25_40': '25–40', '41_60': '41–60', '60_plus': '60+' };
const SLEEP = {
  restorative: 'sleeps well, wakes restored', restorative_6plus: '6+ hours, wakes rested', not_restorative_6plus: '6+ hours but unrested',
  under_6: 'under 6 hours', very_broken: 'very broken sleep', hard_onset: 'sleep-onset difficulty', wakes_middle: 'nocturnal waking (2–4 am)',
  early_wake: 'early-morning waking', sleeps_no_rest: 'non-restorative sleep', vivid_restless: 'vivid, restless dreams',
};
const DIGESTION = {
  strong: 'strong, regular', bloated: 'post-prandial bloating', burning: 'burning, reflux, acidity', cold_sluggish: 'cold, sluggish, low appetite',
  anxious_gut: 'anxious gut', irregular: 'irregular, alternating', constipated: 'chronic constipation',
};
const EMOTIONAL = {
  spacious: 'spacious, generally clear', grief_chest: 'grief, heaviness in the chest', worry_loops: 'worry loops, rumination',
  flat: 'flat', overwhelmed: 'overwhelmed, easily flooded', angry: 'irritable undercurrent', lonely: 'lonely, disconnected',
};
const SOMATIC = {
  head_mind: 'head / mind', eyes: 'eyes', jaw_neck: 'jaw / neck', chest_breath: 'chest / breath', heart: 'heart area',
  solar_plexus: 'solar plexus / stomach', gut: 'gut / lower abdomen', liver_right: 'liver / right upper quadrant',
  kidneys_back: 'kidneys / lower back', pelvis: 'pelvis', muscles_joints: 'muscles / joints', skin: 'skin',
  whole_body: 'whole body', cant_locate: 'cannot locate',
};
const CYCLE = {
  not_applicable: 'not applicable', regular: 'regular, comfortable', pms_heavy: 'PMS-heavy, luteal crash', painful: 'dysmenorrhoea, heavy flow',
  irregular: 'irregular', absent: 'amenorrhoea', perimenopause: 'perimenopause', post_menopause: 'post-menopause',
  trying_conceive: 'trying to conceive',
};
const PRIOR = {
  adaptogens_regular: 'regular adaptogen use', mushrooms_regular: 'regular medicinal mushrooms', nootropics: 'nootropics / focus stacks',
  ceremonial: 'ceremonial / psychedelic-adjacent', tcm_ayurveda: 'TCM or Ayurveda protocols', never: 'no serious prior herb use',
  bad_reaction: 'a previous bad reaction to an herb', stimulants_sensitive: 'sensitive to stimulants',
};

const raw = v => String(v).replace(/_/g, ' ');
const one = (map, v) => (v == null || v === '' ? '' : (map[v] || raw(v)));
const many = (map, list) => (Array.isArray(list) ? list : (list ? [list] : [])).map(v => one(map, v)).filter(Boolean).join('; ');

/**
 * @param {object} quiz   the stored profile (fyf_formulas.profile)
 * @param {object} [ctx]  { formulaId, country, reading, engineVersion }
 * @returns {string} plain text, one block, safe to paste into an AI tool
 */
function clientProfileText(quiz, ctx = {}) {
  const q = quiz && typeof quiz === 'object' ? quiz : {};
  const goals = Array.isArray(q.intentions) && q.intentions.length ? q.intentions : (q.intention ? [q.intention] : []);
  const lines = [];
  const add = (label, value) => { if (value) lines.push(label.padEnd(22) + value); };

  add('Reservation', String(ctx.formulaId || '').slice(0, 12) + (ctx.engineVersion ? ' · engine ' + ctx.engineVersion : ''));
  const pro = q._pro === true || !!(q.support || q.digestion || q.emotional || q.cycle || (Array.isArray(q.somatic) && q.somatic.length));
  add('Quiz', pro ? 'practitioner (Pro)' : 'consumer');
  add('Age range', one(AGE, q.age));
  add('Country', String(ctx.country || '').replace(/\s+/g, ' ').trim().slice(0, 40));
  add('Priorities', goals.map((g, i) => (i + 1) + '. ' + one(GOAL, g)).join('  '));
  add('Approach', one(SUPPORT, q.support));
  add('Constitution', [one(PATTERN, q.pattern), one(PATTERN_SUB, q.patternSub)].filter(Boolean).join(' — '));
  add('Autonomic pattern', one(NERVOUS, q.nervous));
  add('Energy curve', one(CURVE, q.energy_curve));
  add('Symptoms peak', one(TIME, q.time));
  add('Stress response', one(STRESS, q.stress));
  add('Chronicity', one(DURATION, q.duration));
  add('Sleep', one(SLEEP, q.sleep));
  add('Digestion', one(DIGESTION, q.digestion));
  add('Emotional state', one(EMOTIONAL, q.emotional));
  add('Felt in the body', many(SOMATIC, q.somatic));
  add('Cycle', one(CYCLE, q.cycle));
  add('Herb history', many(PRIOR, q.prior_herbs));
  add('Contraindications', many(AVOID, q.avoid) || 'none declared');

  const note = String(q.notes || '').replace(/\s+/g, ' ').trim().slice(0, 800);
  const reading = String(ctx.reading || '').replace(/\s+/g, ' ').trim().slice(0, 1500);

  return [
    '── CLIENT PROFILE · for Formula Analysis ──',
    ...lines,
    note ? '\nClient\'s own note (their words):\n"' + note + '"' : '',
    reading ? '\nMYCO\'s reading at composition:\n' + reading : '',
    '── END PROFILE ──',
  ].filter(Boolean).join('\n');
}

module.exports = { clientProfileText };
