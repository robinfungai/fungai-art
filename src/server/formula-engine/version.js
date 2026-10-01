// src/server/formula-engine/version.js
//
// Version markers embedded in every compileFormula response and
// stored alongside reservations so a formula produced by engine 2.0.0
// against herbDbVersion 2026.09 stays reproducible even after the
// engine or the database moves on.

module.exports = {
  // 2.1.0 — nervous / energy_curve / 7-pattern sleep answers score herbs.
  // 2.2.0 — stimulant / sedative read from herbs.ts cns_action; nothing
  //         stimulating in an evening or sleep formula; no sedative beside
  //         a true stimulant; Ephedra pro-only (2026-09-27).
  // 2.3.0 — the goal leads: intention outweighs body/stress/time and a
  //         herb serving no chosen goal keeps half its score; laxatives
  //         only for digestion/detox; at most one serotonergic herb;
  //         8 practitioner-only herbs pro-only (2026-09-28).
  // 2.4.0 — goals are recorded per herb (herbs.ts `goals`), not guessed
  //         from prose and truncated to three; the pro quiz's support,
  //         digestion, emotional, somatic, cycle and prior_herbs answers
  //         score herbs (2026-09-28).
  // 2.5.0 — external audit decisions D2–D4 (2026-09-28): no herb above
  //         40% of the bottle; MYCO chooses herbs, the engine sets every
  //         percentage; safety flags no longer add a herb; one strict fill
  //         walk (fewer than three main herbs = NO_MATCH / NO_SAFE_MATCH,
  //         never a relaxed rule); evidence grade worth 0 to +2 points.
  // 2.6.0 — second audit round (2026-09-28): "mushroom" from the recorded
  //         botanical family, not a word search; one rules module shared
  //         by picker and MYCO validator; at most one Amanita per bottle.
  // 2.6.1 — note keywords match at word starts, short ones as whole
  //         words (third audit, 2026-09-29).
  // 2.7.0 — an Amanita takes at most 10% of the bottle and never sits
  //         beside St John's Wort (Robin, 2026-09-29, third audit H2).
  // 2.7.1 — herb-pair synergies and cautions match names as whole words
  //         (plural allowed), and a generic first word ("black", "blue")
  //         no longer stands for the herb: 37 false cautions gone, no
  //         bottle changes (external audit, 2026-09-29).
  // 2.7.2 — the note scorer skips a refused wish ("I don't want anything
  //         for sleep"); symptom negation ("can't sleep") still counts
  //         (external audit, 2026-09-29).
  // 2.8.0 — Robin + fourth external audit (2026-09-29): herb pairs he ruled
  //         out never share a bottle (pair-rules.js: 8 BLOCK, 15
  //         CONDITIONAL); an effect the note refuses ("no caffeine",
  //         "nothing sedating", "no mushrooms") removes every herb with
  //         it, German herb names count, and MYCO's own reading of the
  //         note (noteAvoid) is a hard exclusion for its picks and the
  //         fallback; the reading and "why" name herbs in one order, the
  //         closing line follows the duration answer, and the trace
  //         sentence gives that herb's own reason.
  // 2.8.1 — a herb's recorded max_share_pct (herbs.ts) caps its share and
  //         makes it a small-share herb: Saffron at 7% (Robin,
  //         2026-09-29, until Phase 3 lab data). The analysis tool
  //         checks it, and the ruled-out herb pairs.
  // 2.8.2 — laxative and trace class are read from the herb record
  //         (herbs.ts `laxative`, `trace_class`), not a word search and a
  //         name list — same herbs, same bottles (external audit #26).
  // 2.9.0 — restless sleepers (answers "vivid, restless dreams", "very
  //         broken sleep", "wakes in the night", or a note about
  //         nightmares) get no dream-deepening herb (Robin, 2026-09-29:
  //         Mugwort, Blue Lotus, Calea…); records split dream_soften /
  //         dream_vivid. Herb names in the note are read by herb-names.js
  //         (typos, plurals, spacing, genus, German, curly apostrophes).
  // 2.10.0 — trace herbs share 7% of the bottle (4% + 3%; one alone 4%),
  //         and a consumer bottle holds at most one extremely-high-caution
  //         herb (herbs.ts extreme_caution: both Amanitas, St John's Wort,
  //         Calea); pro is not limited (Robin, 2026-10-01, audit 29 Sep #4, Q5).
  // 2.11.0 — Robin's formula verdicts of 2 Oct (docs/AUDIT-2026-10-02-
  //         FORMULA-VERDICTS.md): whole licorice ≤ 10% and out with high
  //         blood pressure, heart medication, liver / kidney (3); one hot
  //         spice at most, and scored down, for a wired / reactive / hot
  //         person (8); each of the top two goals keeps a herb whose main
  //         goal it is (7); a herb serving no goal keeps 30% of its score,
  //         was 50% (6); water-only mucilage herbs stay out of a tincture
  //         (1); the reveal's line names the function serving the goal (4).
  engineVersion:      '2.11.0-server',
  // 2026.10.01: + Cassia Cinnamon (597; Cinnamon now Ceylon only), Gentian, Marshmallow Root,
  //   Agrimony, Blackberry Root (598–601). 2026.10.02: + Cannabis (CBD Oil 10%, 602, pro-only).
  // 2026.10.02b: Licorice Root ≤ 10% + safety_flags; Marshmallow, Slippery Elm menstruum 'water'.
  herbDbVersion:      '2026.10.02b-253herbs',
  // 1.1.0 — unknown pregnancy safety = avoid; under-18s: no HIGH-caution,
  //         psychoactive, or above-LOW calming herbs (2026-09-27).
  // 1.2.0 — pro quiz: 'trying to conceive' = the pregnancy rule;
  //         'sensitive to stimulants' = no stimulant or activating herb;
  //         'bad reaction before' = nothing at caution HIGH / VERY HIGH
  //         (2026-09-28).
  // 1.3.0 — a medicine, pregnancy or condition named in the note applies
  //         the matching safety flag, and the reveal says so (D1,
  //         2026-09-28).
  // 1.4.0 — a herb the note says to avoid ("allergic to chamomile",
  //         "valerian made me groggy") is excluded (2026-09-28).
  // 1.4.1 — the autoimmune flag reads "MS" in capitals only; 26 herbs
  //         were flagged through "symptoms", "forms" (2026-09-29).
  // 1.5.0 — the note's refusals are read waterproof (herb-names.js: 25 of
  //         28 ordinary notes used to slip through, "I don’t want
  //         valerian" among them); "no dream herbs" refuses the
  //         dream-deepening herbs (2026-09-29).
  safetyRulesVersion: '1.5.0',
};
