// tests/fixtures/profiles.cjs
//
// The 20 input profiles for the FYF regression baseline. Kept in a
// single file so all 20 are visible in one review pass. Running this
// file writes each profile to tests/fixtures/profiles/NN-slug.json.
//
// The shape mirrors state.answers as it exists in the current client
// (public/find-your-formula/index.html). Field semantics documented
// in the QUESTIONS array at line 1160 of that file.
//
//   node tests/fixtures/profiles.cjs
//
// Idempotent — safe to re-run; overwrites existing profile files.
//
// Fixture design notes are in tests/README.md.

const fs = require('fs');
const path = require('path');

/**
 * Each profile object below is state.answers as the current client
 * would build it at reveal time. Fields:
 *   intention          — primary intention key (string)
 *   intentions         — full ranking (up to 3, ordered)
 *   pattern            — body archetype: hot|cold|mixed|depleted
 *   patternSub         — sub-selection under pattern
 *   time               — hardest time of day: morning|midday|evening|night|any
 *   stress             — how they meet stress: push|collapse|numb|ride|off
 *   duration           — weeks|months|year_plus|lifelong
 *   avoid              — safety-flag array (may include 'none')
 *   age                — under_25|25_40|41_60|60_plus
 *   sleep              — sleep quality/pattern (client currently 4 or 7 opts)
 *   notes              — free text
 *   _gatedOptIn        — 18+ + ceremonial opt-in from entry gate
 *   _ageConfirmed      — always true at reveal time (gate ticked)
 *
 * Pro-only fields (carried through, not consumed by current engine):
 *   nervous, energy_curve, digestion, emotional, somatic (array),
 *   cycle, prior_herbs (array), support
 */
const PROFILES = [
  //
  // ── 01 · Baseline — happy path, single intention ─────────
  //
  {
    id: '01-baseline',
    description: 'Single stress intention, moderate body, recent onset, no safety flags. The reference "clean" profile — everything else deviates from this.',
    input: {
      intention: 'stress',
      intentions: ['stress'],
      pattern: 'mixed', patternSub: 'sighing',
      time: 'evening', stress: 'push', duration: 'weeks',
      avoid: ['none'], age: '25_40', sleep: 'restorative_6plus',
      notes: '',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 02 · Ranked multi-intention ──────────────────────────
  //
  {
    id: '02-ranked-multi-intention',
    description: 'Three ranked intentions: stress 1st, sleep 2nd, cognitive 3rd. Composer should weight the pick to primary first.',
    input: {
      intention: 'stress',
      intentions: ['stress', 'sleep', 'cognitive'],
      pattern: 'depleted', patternSub: 'overworked',
      time: 'evening', stress: 'collapse', duration: 'months',
      avoid: ['none'], age: '25_40', sleep: 'not_restorative_6plus',
      notes: '',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 03 · Conflicting axes ────────────────────────────────
  //
  {
    id: '03-conflicting-axes',
    description: 'Energy + sleep + anxiety together — inherently in tension (stim vs sedate). Tests the load caps.',
    input: {
      intention: 'energy',
      intentions: ['energy', 'sleep', 'anxiety'],
      pattern: 'mixed', patternSub: 'up_down',
      time: 'midday', stress: 'off', duration: 'months',
      avoid: ['none'], age: '25_40', sleep: 'under_6',
      notes: 'Wired but exhausted, need afternoon focus AND sleep',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 04 · Maximum safety restrictions ─────────────────────
  //
  {
    id: '04-max-safety-restrictions',
    description: 'All 10 avoid flags active except "none". Pool should shrink hard; picker should still produce a formula from what remains.',
    input: {
      intention: 'stress',
      intentions: ['stress'],
      pattern: 'depleted', patternSub: 'dry',
      time: 'evening', stress: 'collapse', duration: 'year_plus',
      avoid: ['pregnancy','cardio_meds','psych_meds','autoimmune','liver_kidney','thyroid','hypertension','contraceptive','sedatives','allergy'],
      age: '41_60', sleep: 'not_restorative_6plus',
      notes: '',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 05 · Psych meds only ─────────────────────────────────
  //
  {
    id: '05-medication-psych',
    description: 'SSRI-compatible filter path — removes MAOIs + serotonin-syndrome-risk herbs (St John\'s Wort etc).',
    input: {
      intention: 'mood',
      intentions: ['mood', 'anxiety'],
      pattern: 'depleted', patternSub: 'anxious_empty',
      time: 'morning', stress: 'numb', duration: 'year_plus',
      avoid: ['psych_meds'], age: '25_40', sleep: 'not_restorative_6plus',
      notes: 'On an SSRI for 3 years',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 06 · Cardio meds + hypertension ──────────────────────
  //
  {
    id: '06-medication-cardio',
    description: 'Cardio + hypertension flags — should remove antiplatelet, digoxin-interactive, and vasoconstrictive herbs.',
    input: {
      intention: 'stress',
      intentions: ['stress', 'sleep'],
      pattern: 'hot', patternSub: 'inflamed',
      time: 'evening', stress: 'push', duration: 'year_plus',
      avoid: ['cardio_meds', 'hypertension'], age: '60_plus', sleep: 'very_broken',
      notes: 'On a beta-blocker and low-dose aspirin',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 07 · Pregnancy ──────────────────────────────────────
  //
  {
    id: '07-pregnancy',
    description: 'Pregnancy flag — removes emmenagogues, uterine stimulants, infant-transfer-risk herbs. Highest-stakes safety path.',
    input: {
      intention: 'anxiety',
      intentions: ['anxiety', 'sleep'],
      pattern: 'depleted', patternSub: 'anxious_empty',
      time: 'night', stress: 'ride', duration: 'weeks',
      avoid: ['pregnancy'], age: '25_40', sleep: 'not_restorative_6plus',
      notes: 'Second trimester, gentle only',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 08 · Thyroid ────────────────────────────────────────
  //
  {
    id: '08-thyroid',
    description: 'Thyroid flag — removes iodine-affecting + thyroid-active herbs (bladderwrack, ashwagandha at high doses etc).',
    input: {
      intention: 'energy',
      intentions: ['energy', 'cognitive'],
      pattern: 'cold', patternSub: 'heavy',
      time: 'morning', stress: 'push', duration: 'year_plus',
      avoid: ['thyroid'], age: '41_60', sleep: 'restorative_6plus',
      notes: 'On levothyroxine for Hashimoto\'s',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 09 · Liver / kidney ─────────────────────────────────
  //
  {
    id: '09-liver-kidney',
    description: 'Liver or kidney condition — removes hepatotoxic + oxalate-rich herbs.',
    input: {
      intention: 'detox',
      intentions: ['detox', 'digestion'],
      pattern: 'depleted', patternSub: 'purposeless',
      time: 'midday', stress: 'off', duration: 'year_plus',
      avoid: ['liver_kidney'], age: '41_60', sleep: 'not_restorative_6plus',
      notes: 'Elevated liver enzymes after a year of chronic stress',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 10 · Lifelong chronic pattern ────────────────────────
  //
  {
    id: '10-lifelong-chronic',
    description: 'Lifelong duration + hot body + inflammation sub-pattern. Complexity trigger paths: patternSub +1, lifelong +1, notes +1 → target 6-7.',
    input: {
      intention: 'pain',
      intentions: ['pain', 'stress', 'sleep'],
      pattern: 'hot', patternSub: 'inflamed',
      time: 'any', stress: 'push', duration: 'lifelong',
      avoid: ['none'], age: '41_60', sleep: 'very_broken',
      notes: 'Chronic pain for 15 years, fibro-adjacent, sleep interrupts nightly, stress is the trigger. Prior herb trial: turmeric helped modestly, ashwagandha was OK but flattening at high doses.',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 11 · Trace-heavy pull (beauty + digestion) ───────────
  //
  {
    id: '11-trace-heavy',
    description: 'Beauty + digestion — pulls in aromatic/carminative traces (ginger, cardamom, fennel, rose). Tests trace-cap: max 1 trace at ≤5%.',
    input: {
      intention: 'beauty',
      intentions: ['beauty', 'digestion'],
      pattern: 'depleted', patternSub: 'dry',
      time: 'midday', stress: 'ride', duration: 'months',
      avoid: ['none'], age: '25_40', sleep: 'restorative_6plus',
      notes: '',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 12 · GABAergic load ─────────────────────────────────
  //
  {
    id: '12-gaba-load',
    description: 'Anxiety + sleep + stress — heavy pull toward valerian/hops/passionflower/magnolia stack. Tests cap: max 2 GABAergics.',
    input: {
      intention: 'anxiety',
      intentions: ['anxiety', 'sleep', 'stress'],
      pattern: 'mixed', patternSub: 'tension',
      time: 'night', stress: 'off', duration: 'months',
      avoid: ['none'], age: '25_40', sleep: 'very_broken',
      notes: 'Racing mind at 3am, tension held in neck and jaw',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 13 · CNS stimulant load ─────────────────────────────
  //
  {
    id: '13-stim-load',
    description: 'Energy + cognitive + performance-lean — pulls toward ginseng/cordyceps/rhodiola/guarana stack. Tests cap: max 2 CNS stimulants.',
    input: {
      intention: 'energy',
      intentions: ['energy', 'cognitive'],
      pattern: 'depleted', patternSub: 'overworked',
      time: 'midday', stress: 'push', duration: 'months',
      avoid: ['none'], age: '25_40', sleep: 'restorative_6plus',
      notes: 'Need cognitive endurance for a long project',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 14 · Minimum size (simple profile → 3-4) ────────────
  //
  {
    id: '14-min-size',
    description: 'Simple clean profile — no notes, no sub, weeks duration, restorative sleep. targetHerbCount() should drop to 3.',
    input: {
      intention: 'immunity',
      intentions: ['immunity'],
      pattern: 'cold', patternSub: '',
      time: 'any', stress: 'ride', duration: 'weeks',
      avoid: ['none'], age: '25_40', sleep: 'restorative_6plus',
      notes: '',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 15 · Maximum size (complex → 6-7) ───────────────────
  //
  {
    id: '15-max-size',
    description: 'Long notes + sub-pattern + year_plus + very_broken sleep + 2 med flags. All +1 triggers fire → target 7.',
    input: {
      intention: 'hormones',
      intentions: ['hormones', 'mood', 'sleep'],
      pattern: 'depleted', patternSub: 'anxious_empty',
      time: 'night', stress: 'collapse', duration: 'year_plus',
      avoid: ['psych_meds', 'contraceptive'], age: '25_40', sleep: 'very_broken',
      notes: 'Postpartum, second baby, deep hormonal-emotional-sleep hole. Prior herb use: passionflower did nothing, ashwagandha helped for a month then plateaued. Really need something that holds the whole weave — mood, sleep, hormonal reset all at once.',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 16 · Gated (Amanita) opt-in ─────────────────────────
  //
  {
    id: '16-gated-amanita-opt-in',
    description: '_gatedOptIn: true → ceremonial allies (Amanita muscaria, blue lotus) become eligible.',
    input: {
      intention: 'mood',
      intentions: ['mood', 'sleep'],
      pattern: 'mixed', patternSub: 'stuck',
      time: 'evening', stress: 'off', duration: 'year_plus',
      avoid: ['none'], age: '41_60', sleep: 'not_restorative_6plus',
      notes: 'Open to ceremonial allies for the deeper work',
      _gatedOptIn: true, _ageConfirmed: true,
    },
  },

  //
  // ── 17 · Same as 16 without opt-in ──────────────────────
  //
  {
    id: '17-no-gate',
    description: 'Same profile as 16 but _gatedOptIn: false — Amanita/blue lotus must be skipped.',
    input: {
      intention: 'mood',
      intentions: ['mood', 'sleep'],
      pattern: 'mixed', patternSub: 'stuck',
      time: 'evening', stress: 'off', duration: 'year_plus',
      avoid: ['none'], age: '41_60', sleep: 'not_restorative_6plus',
      notes: 'Open to ceremonial allies for the deeper work',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 18 · Pro-mode with Pro-only fields ──────────────────
  //
  {
    id: '18-pro-fields-carried',
    description: 'Pro-mode profile carrying nervous, energy_curve, digestion, emotional, somatic, cycle, prior_herbs. Current engine ignores these — regression test confirms they don\'t change output.',
    input: {
      intention: 'stress',
      intentions: ['stress', 'anxiety', 'sleep'],
      pattern: 'depleted', patternSub: 'anxious_empty',
      time: 'evening', stress: 'push', duration: 'year_plus',
      avoid: ['none'], age: '25_40', sleep: 'hard_onset',
      notes: 'Post-burnout, first six months of rebuild',
      // Pro fields — current engine ignores; server engine may consume later.
      nervous: 'wired_tired',
      energy_curve: 'am_good_pm_crash',
      digestion: 'anxious_gut',
      emotional: 'worry_loops',
      somatic: ['chest','solar_plexus','head_mind'],
      cycle: 'not_applicable',
      prior_herbs: ['adaptogens_regular','nootropics'],
      support: 'deep_restore',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 19 · Heavy free-text notes ──────────────────────────
  //
  {
    id: '19-notes-heavy',
    description: 'Long notes field — triggers notes-boost path + notes-length complexity bump. Names specific herbs to test notesBoost keyword matching.',
    input: {
      intention: 'cognitive',
      intentions: ['cognitive', 'stress'],
      pattern: 'depleted', patternSub: 'overworked',
      time: 'morning', stress: 'push', duration: 'months',
      avoid: ['none'], age: '25_40', sleep: 'not_restorative_6plus',
      notes: 'PhD write-up phase. Need focus without the crash. Prior use: bacopa was excellent for memory but too slow to feel, lion\'s mane felt clean and I want more of that, rhodiola gave me a headache above 300mg, and I gave up on caffeine 6 months ago because of anxiety spikes. Deeply prefer nootropics that also support HPA rather than push it.',
      _gatedOptIn: false, _ageConfirmed: true,
    },
  },

  //
  // ── 20 · Adversarial: empty avoid array ─────────────────
  //
  {
    id: '20-adversarial-empty-avoid',
    description: 'Attacker-shaped profile — empty avoid array + gatedOptIn true + all Pro fields set. Documents what the CLIENT engine does today with such input (it applies no safety filter because the array is empty). The SERVER engine in Step 1+ MUST NOT trust an empty avoid and MUST apply baseline safety regardless — this fixture captures the current bypass, not a desired outcome.',
    input: {
      intention: 'energy',
      intentions: ['energy'],
      pattern: 'hot', patternSub: 'anger',
      time: 'any', stress: 'push', duration: 'weeks',
      avoid: [], age: 'under_25', sleep: 'restorative_6plus',
      notes: '',
      _gatedOptIn: true, _ageConfirmed: true,
    },
  },
];

// ── Writer ─────────────────────────────────────────────────
const outDir = path.join(__dirname, 'profiles');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let written = 0;
for (const p of PROFILES) {
  const out = {
    id: p.id,
    description: p.description,
    input: p.input,
  };
  const file = path.join(outDir, p.id + '.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  written++;
}
console.log(`✓ Wrote ${written} profiles to tests/fixtures/profiles/`);

module.exports = PROFILES;
