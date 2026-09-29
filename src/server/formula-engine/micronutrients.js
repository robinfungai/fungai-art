// src/server/formula-engine/micronutrients.js
//
// Possible micronutrient allies for Robin's reservation email — moved
// here from the Find-your-formula page (hardening checklist #3,
// 2026-09-29: "browser = questionnaire + visual experience, server =
// formulation intelligence"). The page used to compute this list and
// send it with the reservation, so reserve-formula had to print it under
// an "UNVERIFIED / client-computed" banner. Now reserve-formula computes
// it from the STORED answers and the STORED formula; nothing the browser
// sends is used. Logic and catalogue unchanged from the page.

// ═══════════════════════════════════════════════════════════════
// Step 6: client engine stripped
// ═══════════════════════════════════════════════════════════════
// The block that used to live here contained the deterministic
// picker (pickFormula), all scoring boosts (subPattern/duration/age/
// sleep/notes), safetyFilter, load caps (isGABAergic/isCNSStimulant/
// categoryOf), targetHerbCount and SUBPATTERN_AFFINITY. Every one of
// those moved to src/server/formula-engine/* and is invoked exclusively
// via /api/fyf/compose. The client is now a rendering shell that
// receives an authoritative formula from the server. Removing this
// stripped ~330 lines from each questionnaire client.
// ── Micronutrient / vitamin / amino-acid advisory engine ──────────
// Reads the quiz answers and produces a shortlist of possible
// mineral / vitamin / amino-acid allies that may sit underneath
// the presentation. This is ROBIN-ONLY information — the client
// sends it to /api/reserve-formula, which renders it in Robin's
// admin email but NEVER in the customer confirmation.
//
// The engine is opinionated, not diagnostic: it points at nutrients
// that plausibly connect to what the customer described. Robin then
// decides — with his own eye — whether to mention any of them.
//
// Design:
//   - MN_CATALOGUE holds ONE canonical entry per nutrient: a plain,
//     evidence-level "why", a standing caution, the safety flags that
//     remove it, and whether it may appear for under-18s / pregnancy.
//   - Every answer ADDS points to the nutrients it points at — ranked
//     intentions 3/2/1, the body pattern, and all the rhythm answers
//     (time, stress response, energy feel, energy curve, sleep pattern,
//     duration), age, the pill and a few notes keywords. A nutrient
//     several answers converge on outranks a one-off match. Some
//     answers SUBTRACT (e.g. L-tyrosine for a wired or reactive system).
//   - "Test first", weak-evidence and legally-grey entries carry a
//     damp factor so a single signal never puts them at the top.
//   - avoid[] flags remove contraindicated entries; pregnancy and
//     under-18 switch to whitelists.
//   - Nutrients duplicated by a herb already in the formula drop out.
//
// Returns [{ nutrient, reason, priority }] — top 10. `reason` is kept
// under the 300-char cap reserve-formula applies to each entry.
const MN_CATALOGUE = {
  mg:          { n:'Magnesium glycinate', why:'Often low under long-term stress; supports muscle relaxation and sleep quality', warn:'Not with kidney disease; take 4 h apart from thyroid meds and some antibiotics', drop:['liver_kidney'], minor:true, preg:true },
  theanine:    { n:'L-Theanine', why:'Calm focus without sedation (~200 mg); small human trials for stress and sleep', warn:'Can add to sedatives; may slightly lower blood pressure', drop:['sedatives'] },
  bcomplex:    { n:'B-complex (activated forms)', why:'Cofactors for energy metabolism and neurotransmitter synthesis; helps most where intake is poor', warn:'Check the B6 dose: EU upper limit is 12 mg/day (nerve symptoms above that long-term)' },
  b6:          { n:'Vitamin B6 (P5P)', why:'Cofactor for GABA and serotonin; some evidence for PMS symptoms', warn:'Low dose only (EU upper limit 12 mg/day); can make dreams more vivid' },
  vitc:        { n:'Vitamin C', why:'Needed for collagen and immune-cell function; the adrenal glands store and use large amounts', warn:'High doses raise kidney-stone risk', drop:['liver_kidney'], minor:true },
  glycine:     { n:'Glycine', why:'3 g before bed improved sleep quality and next-day alertness in small trials', warn:'Mildly sedating; not with sedatives', drop:['sedatives'] },
  htp:         { n:'5-HTP', why:'Serotonin precursor; small, mixed trials for low mood', warn:'Never with antidepressants, triptans or tramadol (serotonin syndrome)', drop:['psych_meds','sedatives'] },
  melatonin:   { n:'Melatonin (0.5–1 mg)', why:'Best evidence for shifting a late body clock earlier; modest effect on falling asleep', warn:'Classed as a medicine in Sweden and some EU countries: check before recommending. Not with sedatives', drop:['sedatives'], damp:0.7 },
  b12:         { n:'Vitamin B12', why:'Deficiency causes tiredness and low mood; common if vegan, over 60, or on metformin or acid-reducers', warn:'Blood test first where possible', minor:true },
  iron:        { n:'Iron (bisglycinate)', why:'Low iron stores cause fatigue, cold hands, poor exercise tolerance and restless legs', warn:'Only if ferritin tests low, never blind. Take 4 h apart from thyroid meds', drop:['liver_kidney'], minor:true, preg:true, damp:0.6 },
  coq10:       { n:'CoQ10 (ubiquinol)', why:'Part of cellular energy production; levels fall with age and on statins', warn:'Can weaken warfarin; may lower blood pressure', drop:['cardio_meds'] },
  nad:         { n:'NAD+ precursor (nicotinamide riboside)', why:'NAD+ declines with age; human benefits are still early', warn:'Prefer nicotinamide riboside (EU-authorised); check NMN\'s EU novel-food status before recommending it', damp:0.6 },
  carnitine:   { n:'Acetyl-L-carnitine', why:'Moves fats into mitochondria; best evidence for fatigue in older adults', warn:'Can blunt thyroid hormone; avoid with thyroid conditions', drop:['thyroid'], damp:0.8 },
  creatine:    { n:'Creatine monohydrate', why:'Strong evidence for strength and recovery; small trials for mental fatigue and sleep loss', warn:'Avoid with kidney disease; raises creatinine on blood tests', drop:['liver_kidney'] },
  vitd:        { n:'Vitamin D3 + K2', why:'Commonly low in northern Europe; deficiency is linked to low mood, fatigue and frequent infections', warn:'Test 25(OH)D where possible. Use D3 alone with blood thinners (K2 counteracts warfarin)', minor:true, preg:true },
  omega3:      { n:'Omega-3 (EPA + DHA)', why:'EPA-rich oils (~1 g EPA) help low mood in meta-analyses; DHA is structural in the brain; mildly anti-inflammatory', warn:'High doses add bleeding risk with blood thinners', drop:['cardio_meds'], minor:true },
  citicoline:  { n:'Citicoline (CDP-choline)', why:'Choline source for acetylcholine; small trials for attention and mental energy', warn:'Prefer over alpha-GPC, which was linked to higher stroke risk in one large study' },
  ps:          { n:'Phosphatidylserine', why:'Some evidence for memory in older adults and for blunting the cortisol response to stress', warn:'May add to blood thinners', drop:['cardio_meds'], damp:0.8 },
  huperzine:   { n:'Huperzine-A', why:'Slows acetylcholine breakdown; small trials, mostly in dementia', warn:'Drug-like: not with heart-rhythm meds or beta-blockers. Treated as a medicine in several EU countries, so check first', drop:['cardio_meds'], damp:0.5 },
  zinc:        { n:'Zinc (picolinate)', why:'Needed for immune function, hormone production and skin healing; intake is often low', warn:'Stay under 25 mg/day long-term (causes copper loss)', minor:true },
  dim:         { n:'DIM (diindolylmethane)', why:'Shifts oestrogen metabolism; human evidence is limited', warn:'Not with the pill, hormone therapy or hormone-sensitive conditions', drop:['contraceptive'], damp:0.7 },
  iodine:      { n:'Iodine', why:'Needed for thyroid hormone; only helps if intake is truly low', warn:'Test thyroid (TSH) first; excess can trigger thyroid disease', drop:['thyroid'], damp:0.5 },
  zinccarn:    { n:'Zinc-carnosine', why:'Supports stomach-lining repair; small trials', warn:'Counts toward the daily zinc total' },
  glutamine:   { n:'L-Glutamine', why:'Main fuel for gut-lining cells; small trials for gut permeability and IBS', warn:'Avoid with liver disease', drop:['liver_kidney'] },
  betaine:     { n:'Betaine HCl', why:'Only for confirmed low stomach acid', warn:'Not with ulcers, gastritis, NSAIDs or steroids', damp:0.5 },
  probiotics:  { n:'Probiotics (strain-specific)', why:'Pick strains with trials for the specific complaint (IBS, antibiotic recovery)', warn:'Avoid with severe immune suppression', drop:['autoimmune'], minor:true },
  enzymes:     { n:'Digestive enzymes', why:'For bloating and heaviness after meals; evidence is limited', warn:'', damp:0.8 },
  selenium:    { n:'Selenium', why:'Intake is low across much of Europe; needed for antioxidant enzymes and thyroid function', warn:'Narrow safe range: stay under 255 µg/day in total' },
  quercetin:   { n:'Quercetin', why:'Antihistamine-like effects in lab studies; human evidence is limited', warn:'Liver-enzyme interactions (e.g. blood thinners, ciclosporin)', drop:['cardio_meds','autoimmune'], damp:0.7 },
  curcumin:    { n:'Curcumin', why:'Matched ibuprofen for knee osteoarthritis pain in several trials', warn:'Adds bleeding risk with blood thinners; rare liver injury with high-absorption forms; not with gallstones', drop:['cardio_meds','liver_kidney'], herbs:['turmeric','curcuma'] },
  msm:         { n:'MSM', why:'Small trials for joint pain and stiffness', warn:'' },
  boswellia:   { n:'Boswellia serrata', why:'Anti-inflammatory through a different pathway to NSAIDs; trials in osteoarthritis', warn:'Limited data with blood thinners', drop:['cardio_meds'], herbs:['boswellia','frankincense'] },
  pea:         { n:'PEA (palmitoylethanolamide)', why:'Fatty-acid compound the body makes itself; trials for nerve and chronic pain', warn:'' },
  nac:         { n:'NAC (N-acetylcysteine)', why:'Glutathione precursor for liver antioxidant defence; small trials for cravings and compulsive habits', warn:'Not with nitrate heart medication; rarely triggers asthma', drop:['cardio_meds'] },
  ala:         { n:'Alpha-lipoic acid', why:'Antioxidant; best evidence for diabetic nerve pain', warn:'Can lower blood sugar; may affect thyroid medication', drop:['thyroid'] },
  chromium:    { n:'Chromium picolinate', why:'Small trials for steadier blood sugar and fewer sugar cravings', warn:'Can lower blood sugar with diabetes medication', damp:0.8 },
  collagen:    { n:'Collagen peptides', why:'Trials show better skin elasticity and hydration after 8–12 weeks', warn:'' },
  biotin:      { n:'Biotin', why:'Only helps hair and nails when deficient, which is rare', warn:'Distorts thyroid, heart and hormone blood tests: stop 3 days before testing', drop:['thyroid'], damp:0.6 },
  betacarotene:{ n:'Beta-carotene', why:'Converted to vitamin A as needed; some protection against sun sensitivity', warn:'Not for smokers or ex-smokers (raised lung-cancer risk in trials)', damp:0.7 },
  hyaluronic:  { n:'Hyaluronic acid (oral)', why:'Small trials show better skin moisture', warn:'' },
  saffron:     { n:'Saffron extract', why:'Standardised extract (~30 mg/day) matched some antidepressants in small trials', warn:'Not with antidepressants; high doses are unsafe in pregnancy', drop:['psych_meds'], herbs:['saffron','crocus'] },
  tyrosine:    { n:'L-Tyrosine', why:'Dopamine building block; small trials for focus under stress and sleep loss', warn:'Not with MAOIs, thyroid medication or levodopa; can raise blood pressure', drop:['psych_meds','thyroid','hypertension'] },
  same:        { n:'SAMe', why:'Trials for depression and osteoarthritis', warn:'Not with antidepressants or bipolar disorder (can trigger mania)', drop:['psych_meds'] },
  // Pregnancy-only entries (added by the prenatal whitelist below).
  choline:     { n:'Choline', why:'Needed for fetal brain development; most prenatal vitamins contain too little', warn:'Confirm the dose with a midwife or doctor', preg:true },
  folate:      { n:'Folate (methylfolate)', why:'Lowers neural-tube defect risk; ideally started before conception', warn:'Confirm the dose with a midwife or doctor', preg:true },
  dha:         { n:'DHA (algal)', why:'Supports fetal brain and eye development; algal source avoids mercury', warn:'Confirm the dose with a midwife or doctor', preg:true },
};

function computeMicronutrients(a, pickedHerbs){
  a = a || {};
  const bank = new Map(); // id → { score, labels:Set }
  const hit = (id, pts, label) => {
    if (!MN_CATALOGUE[id] || !pts) return;
    const e = bank.get(id) || { score: 0, labels: new Set() };
    e.score += pts;
    if (label && pts > 0) e.labels.add(label);
    bank.set(id, e);
  };
  const apply = (map, key, label, scale) => {
    (map[key] || []).forEach(([id, pts], i) => hit(id, pts * (scale || 1) - (scale ? i * 0.1 : 0), label));
  };

  // ── Intentions (ranked 3 / 2 / 1; list order = strength of evidence) ──
  const INT = {
    stress:    [['mg',1],['theanine',1],['bcomplex',1],['vitc',1]],
    anxiety:   [['mg',1],['theanine',1],['glycine',1],['htp',1],['b6',1]],
    sleep:     [['mg',1],['glycine',1],['theanine',1],['melatonin',1]],
    energy:    [['b12',1],['iron',1],['coq10',1],['creatine',1],['carnitine',1],['nad',1]],
    mood:      [['vitd',1],['omega3',1],['saffron',1],['htp',1],['same',1],['tyrosine',1]],
    cognitive: [['omega3',1],['citicoline',1],['creatine',1],['ps',1],['huperzine',1]],
    hormones:  [['vitd',1],['zinc',1],['mg',1],['b6',1],['dim',1]],
    digestion: [['zinccarn',1],['glutamine',1],['probiotics',1],['enzymes',1],['betaine',1]],
    immunity:  [['vitd',1],['vitc',1],['zinc',1],['selenium',1],['quercetin',1]],
    pain:      [['omega3',1],['curcumin',1],['mg',1],['boswellia',1],['msm',1],['pea',1]],
    detox:     [['nac',1],['ala',1],['bcomplex',1],['selenium',1]],
    beauty:    [['collagen',1],['vitc',1],['zinc',1],['hyaluronic',1],['betacarotene',1],['biotin',1]],
  };
  const ranked = Array.isArray(a.intentions) && a.intentions.length
    ? a.intentions.slice(0, 3)
    : (a.intention ? [a.intention] : []);
  ranked.forEach((intent, idx) => apply(INT, intent, intent, idx === 0 ? 3 : idx === 1 ? 2 : 1));

  // ── Body pattern + sub-pattern ───────────────────────────────────
  apply({
    hot:      [['mg',2],['omega3',1]],
    cold:     [['iron',2],['b12',1],['iodine',1]],
    mixed:    [['theanine',2],['mg',1]],
    depleted: [['bcomplex',2],['vitd',1],['b12',1],['nad',1]],
  }, a.pattern, a.pattern + ' pattern');
  apply({
    anger:         [['mg',1],['theanine',1]],
    inflamed:      [['omega3',2],['curcumin',1]],
    hot_night:     [['mg',1]],
    cold_hands:    [['iron',2]],
    heavy:         [['bcomplex',1],['vitd',1]],
    pale:          [['iron',2],['b12',2]],
    low_drive:     [['vitd',1],['tyrosine',1],['zinc',1]],
    up_down:       [['omega3',1],['mg',1]],
    tension:       [['mg',2]],
    sighing:       [['mg',2]],
    purposeless:   [['omega3',1],['vitd',1],['saffron',1]],
    dry:           [['omega3',2],['hyaluronic',1]],
    overworked:    [['mg',1],['bcomplex',1],['nad',1]],
    anxious_empty: [['mg',2],['theanine',2]],
  }, a.patternSub, String(a.patternSub || '').replace(/_/g, ' '));

  // ── Rhythm: hardest time of day ──────────────────────────────────
  apply({
    morning: [['b12',1],['vitd',1]],
    midday:  [['chromium',1],['bcomplex',1]],
    evening: [['mg',1],['theanine',1]],
    night:   [['mg',1],['glycine',1]],
  }, a.time, { morning:'hard mornings', midday:'midday dip', evening:'can\'t wind down', night:'3am waking' }[a.time]);

  // ── Rhythm: response to stress ───────────────────────────────────
  apply({
    push:     [['mg',2],['bcomplex',2],['vitc',1]],
    collapse: [['bcomplex',2],['b12',1],['iron',1],['vitd',1]],
    numb:     [['nac',2],['chromium',1],['mg',1]],
    off:      [['vitd',2],['b12',1],['iron',1]],
  }, a.stress, { push:'pushes through', collapse:'collapses under stress', numb:'numbs stress', off:'feels "off"' }[a.stress]);

  // ── Energy feel (nervous-system state) ───────────────────────────
  apply({
    wired:       [['mg',2],['theanine',2],['glycine',1],['tyrosine',-2],['huperzine',-1],['citicoline',-1]],
    tired:       [['b12',2],['iron',2],['coq10',1],['vitd',1],['creatine',1]],
    wired_tired: [['mg',2],['bcomplex',2],['theanine',1],['vitc',1],['tyrosine',-2]],
    reactive:    [['mg',2],['theanine',2],['tyrosine',-3],['huperzine',-2],['citicoline',-1]],
    flat:        [['omega3',2],['vitd',2],['saffron',1],['tyrosine',1],['same',1]],
  }, a.nervous, String(a.nervous || '').replace('_', ' + ') + ' energy');

  // ── Energy curve through the day ─────────────────────────────────
  apply({
    low_waking:        [['b12',2],['iron',2],['vitd',2]],
    am_good_pm_crash:  [['chromium',2],['mg',1],['bcomplex',1]],
    slow_am_strong_pm: [['melatonin',3],['mg',1]],
    high_unstable:     [['chromium',2],['mg',1],['omega3',1],['tyrosine',-2]],
    waves:             [['vitd',1],['b12',1],['iron',1]],
    crash_mental:      [['creatine',2],['citicoline',2],['omega3',1],['theanine',1]],
    crash_physical:    [['iron',2],['coq10',2],['creatine',2],['mg',1]],
  }, a.energy_curve, {
    low_waking:'low from waking', am_good_pm_crash:'afternoon crash', slow_am_strong_pm:'late body clock',
    high_unstable:'energy spikes + drops', waves:'energy in waves', crash_mental:'crashes after mental effort',
    crash_physical:'crashes after exertion',
  }[a.energy_curve]);

  // ── Sleep pattern ────────────────────────────────────────────────
  apply({
    hard_onset:     [['mg',2],['theanine',2],['glycine',2],['melatonin',1]],
    wakes_middle:   [['mg',2],['glycine',2]],
    early_wake:     [['omega3',1],['vitd',1],['saffron',1],['mg',1]],
    sleeps_no_rest: [['iron',2],['vitd',1],['mg',1],['b12',1]],
    vivid_restless: [['mg',2],['iron',1],['b6',-2],['melatonin',-1]],
    very_broken:    [['mg',3],['glycine',2]],
    broken:         [['mg',3],['glycine',2]],
  }, a.sleep, {
    hard_onset:'hard to fall asleep', wakes_middle:'wakes at night', early_wake:'wakes too early',
    sleeps_no_rest:'unrefreshing sleep', vivid_restless:'restless sleep', very_broken:'very broken sleep', broken:'broken sleep',
  }[a.sleep]);

  // ── Duration · age · the pill ────────────────────────────────────
  if (a.duration === 'year_plus' || a.duration === 'lifelong') {
    [['vitd',1],['b12',1],['iron',1],['mg',1]].forEach(([id, pts]) => hit(id, pts, 'long-standing'));
  }
  if (a.age === '41_60') { hit('coq10', 1, '41–60'); hit('vitd', 1, '41–60'); }
  if (a.age === '60_plus') { hit('vitd', 2, '60+'); hit('b12', 2, '60+'); hit('coq10', 1, '60+'); hit('nad', 1, '60+'); }
  const avoid = (Array.isArray(a.avoid) ? a.avoid : []).filter(f => f !== 'none');
  if (avoid.includes('contraceptive')) {
    [['bcomplex',1],['mg',1],['zinc',1]].forEach(([id, pts]) => hit(id, pts, 'the pill depletes it'));
  }

  // ── Notes keywords (light-touch) ─────────────────────────────────
  const notes = String(a.notes || '').toLowerCase();
  const NOTE_HITS = [
    [/headache|migraine/,             [['mg',2]],                          'migraine (notes)'],
    [/cramp|spasm/,                   [['mg',1]],                          'cramps (notes)'],
    [/anxiety|panic/,                 [['theanine',1]],                    'anxiety (notes)'],
    [/tinnitus|ear ring/,             [['zinc',1]],                        'tinnitus (notes)'],
    [/vegan|vegetarian|plant.based/,  [['b12',3],['iron',1],['omega3',1]], 'plant-based diet (notes)'],
    [/\bpms\b|period|menstrua/,       [['b6',1],['mg',1]],                 'cycle (notes)'],
    [/restless leg/,                  [['iron',2],['mg',1]],               'restless legs (notes)'],
    [/statin/,                        [['coq10',2]],                       'statins (notes)'],
    [/joint|arthrit/,                 [['curcumin',1],['omega3',1]],       'joints (notes)'],
    [/bloat|\bibs\b/,                 [['probiotics',1]],                  'gut (notes)'],
    [/\bflu\b|\bcolds?\b|infection/,  [['vitc',1],['zinc',1],['vitd',1]],  'infections (notes)'],
  ];
  NOTE_HITS.forEach(([re, hits, label]) => { if (re.test(notes)) hits.forEach(([id, pts]) => hit(id, pts, label)); });

  // B6 sits inside the B-complex — fold it in when both are present.
  if (bank.has('b6') && bank.has('bcomplex')) {
    const b6 = bank.get('b6'), bc = bank.get('bcomplex');
    bc.score += Math.max(0, b6.score) * 0.5;
    b6.labels.forEach(l => bc.labels.add(l));
    bank.delete('b6');
  }

  // ── Safety flags ─────────────────────────────────────────────────
  for (const [id] of [...bank]) {
    const drop = MN_CATALOGUE[id].drop || [];
    if (avoid.some(f => drop.includes(f))) bank.delete(id);
  }
  const minor = a.age === 'under_18';
  const pregnant = avoid.includes('pregnancy');
  if (pregnant) {
    // Prenatal whitelist only — everything else goes.
    for (const [id] of [...bank]) if (!MN_CATALOGUE[id].preg) bank.delete(id);
    hit('folate', 6, 'pregnancy'); hit('choline', 5, 'pregnancy'); hit('dha', 5, 'pregnancy');
  } else if (minor) {
    // Under-18 whitelist: basic, food-level nutrients only. No amino
    // acids, nootropics, hormone modulators or sleep hormones.
    for (const [id] of [...bank]) if (!MN_CATALOGUE[id].minor) bank.delete(id);
  }

  // ── Drop nutrients a herb in the formula already covers ─────────
  const herbNames = (Array.isArray(pickedHerbs) ? pickedHerbs : [])
    .map(h => String((h && h.name) || '').toLowerCase());
  for (const [id] of [...bank]) {
    const needles = MN_CATALOGUE[id].herbs || [];
    if (needles.some(n => herbNames.some(hn => hn.includes(n)))) bank.delete(id);
  }

  const vitdPlain = minor || pregnant || avoid.includes('cardio_meds');
  return [...bank.entries()]
    .map(([id, e]) => ({ id, e, rank: e.score * (MN_CATALOGUE[id].damp || 1) }))
    .filter(x => x.rank > 0.5)
    .sort((x, y) => (y.rank - x.rank) || MN_CATALOGUE[x.id].n.localeCompare(MN_CATALOGUE[y.id].n))
    .slice(0, 10)
    .map(({ id, e, rank }) => {
      const c = MN_CATALOGUE[id];
      let name = c.n, warn = c.warn;
      if (id === 'vitd' && vitdPlain) { name = 'Vitamin D3'; warn = 'Test 25(OH)D where possible'; }
      if (minor) warn ='Under 18: age-appropriate dose, agree with a parent or GP' + (warn ? '. ' + warn : '');
      const head = c.why + '.' + (warn ? ' ⚠ ' + warn + '.' : '');
      let from = [...e.labels].join(', ');
      let reason = from ? head + ' From: ' + from : head;
      if (reason.length > 298) reason = reason.slice(0, 297) + '…';
      return { nutrient: name, reason, priority: Math.max(1, Math.min(10, Math.round(rank))) };
    });
}

module.exports = { MN_CATALOGUE, computeMicronutrients };
