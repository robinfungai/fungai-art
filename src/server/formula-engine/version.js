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
  engineVersion:      '2.4.0-server',
  herbDbVersion:      '2026.09-245herbs',
  // 1.1.0 — unknown pregnancy safety = avoid; under-18s: no HIGH-caution,
  //         psychoactive, or above-LOW calming herbs (2026-09-27).
  // 1.2.0 — pro quiz: 'trying to conceive' = the pregnancy rule;
  //         'sensitive to stimulants' = no stimulant or activating herb;
  //         'bad reaction before' = nothing at caution HIGH / VERY HIGH
  //         (2026-09-28).
  safetyRulesVersion: '1.2.0',
};
