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
  engineVersion:      '2.6.0-server',
  herbDbVersion:      '2026.09-245herbs',
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
  safetyRulesVersion: '1.4.0',
};
