// src/server/herb-data/index.js
//
// SERVER-ONLY — the Formula Engine's single controlled access point
// to the Herb Knowledge Base. All other server modules go through
// this file rather than importing the raw HERBS array. Two reasons:
//
//   1. The data source can evolve independently (herbs.generated.cjs
//      today, a Supabase table or an S3-backed JSON tomorrow) without
//      touching every scoring/safety/picker file.
//   2. The access layer is where we can layer eligibility, caching,
//      or per-request views later without every engine module knowing.
//
// This file must NEVER be imported by a React component or by any
// script that ends up in the client bundle. See src/server/README.md.

const HERBS = require('./herbs.generated.cjs');

/**
 * Returns the full herb catalogue as a shallow copy. The engine's
 * ensurePool() layers axes/restriction/gate flags on top of this.
 * Callers must not mutate individual herb objects — treat the return
 * value as frozen.
 */
function getAllHerbs() {
  return HERBS;
}

/**
 * Lookup by numeric id. Returns undefined if the id is unknown.
 * Uniqueness is enforced at build time by scripts/export-herbs.cjs.
 */
function getHerbById(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return undefined;
  return HERBS.find(h => h.id === n);
}

/**
 * Case-insensitive lookup by name or botanical. Used by the
 * interactions checker + reservation-time integrity verification.
 */
function findHerbByName(name) {
  if (!name) return undefined;
  const q = String(name).toLowerCase();
  return HERBS.find(h =>
    String(h.name || '').toLowerCase() === q ||
    String(h.botanical || '').toLowerCase() === q
  );
}

/**
 * How many herbs are in the catalogue. Debug/telemetry only.
 */
function getCatalogueSize() {
  return HERBS.length;
}

module.exports = {
  getAllHerbs,
  getHerbById,
  findHerbByName,
  getCatalogueSize,
};
