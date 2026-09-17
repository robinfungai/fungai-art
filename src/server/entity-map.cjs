// src/server/entity-map.cjs
//
// Academy P1 · the join layer. One botanical id (the herbs.ts numeric
// id) now addresses a plant wherever it appears: its monographs, the
// products made from it, and the formulas that contain it.
//
// Read src/data/entity-map.generated.json (built by
// scripts/build-entity-map.cjs) and expose the lookups the rest of the
// system needs, so no caller ever matches plants by display string
// again.
//
//   const em = require('../server/entity-map.cjs');
//   em.botanical(110)                  → { id, slug, name, botanical, … }
//   em.resolveName("Holy Basil")       → botanical or null
//   em.monographsFor(110)              → [{ file, title }]
//   em.productsFor(110)                → [{ productId, displayName }]
//   em.resolveProduct('Chaga Extract') → { productId: 'chaga-extract', … }

const fs   = require('fs');
const path = require('path');

const MAP_PATH = path.join(__dirname, '..', 'data', 'entity-map.generated.json');

let MAP = null;
function load() {
  if (MAP) return MAP;
  try {
    MAP = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  } catch (_) {
    // Not built yet — callers get empty results rather than a crash, so
    // a missing build artifact degrades to "no links known".
    MAP = { botanicals: [], monographs: [], products: [], counts: {}, unresolved: [] };
  }
  MAP._byId   = new Map(MAP.botanicals.map(b => [b.id, b]));
  MAP._byKey  = new Map();
  for (const b of MAP.botanicals) {
    for (const k of [b.name, b.slug, b.latin].filter(Boolean)) {
      const key = normalise(k);
      if (!MAP._byKey.has(key)) MAP._byKey.set(key, b);
    }
  }
  MAP._prodBySlug = new Map(MAP.products.map(p => [p.productId, p]));
  MAP._prodByName = new Map();
  for (const p of MAP.products) {
    for (const s of [p.displayName, ...(p.shopStrings || [])]) {
      MAP._prodByName.set(normalise(s), p);
    }
  }
  return MAP;
}

function normalise(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The botanical record for a herbs.ts id. */
function botanical(id) {
  return load()._byId.get(Number(id)) || null;
}

/** Resolve a display name, slug or latin binomial to a botanical. */
function resolveName(name) {
  const m = load();
  const key = normalise(name);
  const bare = key.replace(/\(.*$/, '').trim();
  return m._byKey.get(key) || m._byKey.get(bare) || null;
}

/** Monographs written about this botanical. */
function monographsFor(id) {
  const n = Number(id);
  return load().monographs
    .filter(x => x.botanicalId === n)
    .map(({ file, title }) => ({ file, title }));
}

/** Products made from this botanical (single-plant products only). */
function productsFor(id) {
  const n = Number(id);
  return load().products
    .filter(p => p.botanicalId === n)
    .map(({ productId, displayName }) => ({ productId, displayName }));
}

/**
 * Resolve whatever string the shop or product_inventory used into the
 * stable product record. This is the bridge that lets stock move off
 * display-string keys without breaking existing rows.
 */
function resolveProduct(displayString) {
  const m = load();
  const key = normalise(displayString);
  const bare = normalise(String(displayString).replace(/\(.*$/, ''));
  return m._prodByName.get(key) || m._prodByName.get(bare) || null;
}

function product(productId) {
  return load()._prodBySlug.get(String(productId)) || null;
}

/** Everything known about a plant in one object — the §51 action bar. */
function entity(id) {
  const b = botanical(id);
  if (!b) return null;
  return { ...b, monographs: monographsFor(id), products: productsFor(id) };
}

function counts() { return load().counts || {}; }
function unresolved() { return load().unresolved || []; }

module.exports = {
  botanical, resolveName, monographsFor, productsFor,
  resolveProduct, product, entity, counts, unresolved, normalise,
};
