// src/server/formula-engine/version.js
//
// Version markers embedded in every compileFormula response and
// stored alongside reservations so a formula produced by engine 2.0.0
// against herbDbVersion 2026.09 stays reproducible even after the
// engine or the database moves on.

module.exports = {
  // 2.1.0 — nervous / energy_curve / 7-pattern sleep answers score herbs.
  engineVersion:      '2.1.0-server',
  herbDbVersion:      '2026.09-198herbs',
  safetyRulesVersion: '1.0.0',
};
