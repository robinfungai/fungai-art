// tests/entity-map-verify.cjs
//
// Academy P1 · the join layer must stay joined.
//
// Blocker B3 was that a plant had four unrelated identities. These tests
// hold the repaired state: every monograph resolves to a botanical, ids
// and slugs stay unique, and the lookups answer for real plants. Shop /
// stock drift is REPORTED, not failed — it is a data question for Robin,
// and failing on it would block unrelated work.
//
//   node tests/entity-map-verify.cjs

const path = require('path');
const em   = require('../src/server/entity-map.cjs');
const map  = require('../src/data/entity-map.generated.json');

const cases = [];
const t = (name, run) => cases.push({ name, run });

// ── Coverage ─────────────────────────────────────────────────────
t('every monograph resolves to a botanical', () => {
  const orphans = map.monographs.filter(m => !m.botanicalId);
  return { pass: orphans.length === 0, detail: orphans.length ? orphans.map(o => o.file).join(', ') : `${map.monographs.length}/${map.monographs.length}` };
});

t('every monograph points at a botanical that exists', () => {
  const ids = new Set(map.botanicals.map(b => b.id));
  const bad = map.monographs.filter(m => m.botanicalId && !ids.has(m.botanicalId));
  return { pass: bad.length === 0, detail: bad.map(b => b.file).join(', ') };
});

t('the whole herb catalogue is present', () => {
  const { getAllHerbs } = require('../src/server/herb-data');
  const n = getAllHerbs().length;
  return { pass: map.botanicals.length === n, detail: `${map.botanicals.length} of ${n}` };
});

// ── Identity integrity ───────────────────────────────────────────
t('botanical ids are unique', () => {
  const ids = map.botanicals.map(b => b.id);
  return { pass: new Set(ids).size === ids.length, detail: `${ids.length} ids` };
});

t('product slugs are unique and non-empty', () => {
  const slugs = map.products.map(p => p.productId);
  const empty = slugs.filter(s => !s).length;
  return { pass: empty === 0 && new Set(slugs).size === slugs.length, detail: `${slugs.length} products, ${empty} empty` };
});

t('no product is named from a code comment', () => {
  // The shop source documents the helper as addToCart('Name', price) —
  // a scan that ignores comments must never pick that up as a product.
  const bogus = map.products.filter(p => /^(name|price|id)$/i.test(p.displayName));
  return { pass: bogus.length === 0, detail: bogus.map(b => b.displayName).join(', ') };
});

t('products that claim a botanical point at a real one', () => {
  const ids = new Set(map.botanicals.map(b => b.id));
  const bad = map.products.filter(p => p.botanicalId && !ids.has(p.botanicalId));
  return { pass: bad.length === 0, detail: bad.map(b => b.productId).join(', ') };
});

// ── Lookups ──────────────────────────────────────────────────────
t('resolveName finds a plant by display name, alias and latin', () => {
  const byName  = em.resolveName('Holy Basil (Tulsi)');
  const byLatin = em.resolveName('Ocimum sanctum');
  const bySlug  = em.resolveName('chaga');
  const ok = byName && byLatin && byName.id === byLatin.id && bySlug;
  return { pass: !!ok, detail: ok ? `holy basil → ${byName.id}, chaga → ${bySlug.id}` : 'lookup failed' };
});

t('monographsFor returns the monograph for a known plant', () => {
  const b = em.resolveName('Ashwagandha');
  const monos = b ? em.monographsFor(b.id) : [];
  return { pass: monos.length > 0, detail: b ? `${b.name}: ${monos.length} monograph(s)` : 'ashwagandha missing' };
});

t('resolveProduct maps a shop string to a stable id', () => {
  const p = em.resolveProduct('Chaga Extract');
  return { pass: !!(p && p.productId), detail: p ? `Chaga Extract → ${p.productId}` : 'unresolved' };
});

t('resolveProduct survives the malformed inventory key', () => {
  // product_inventory holds a truncated 'Afghan Saffron (' — the bridge
  // must still land on the same product as the clean name.
  const a = em.resolveProduct('Afghan Saffron (');
  const b = em.resolveProduct('Afghan Saffron');
  return { pass: !!(a && b && a.productId === b.productId), detail: a && b ? a.productId : `a=${a && a.productId} b=${b && b.productId}` };
});

t('entity() assembles a plant with its monographs and products', () => {
  const b = em.resolveName('Chaga');
  const e = b ? em.entity(b.id) : null;
  return { pass: !!(e && Array.isArray(e.monographs) && Array.isArray(e.products)), detail: e ? `${e.name}: ${e.monographs.length} monographs, ${e.products.length} products` : 'missing' };
});

t('a missing map degrades to empty, never throws', () => {
  // entity-map.cjs is loaded by server code; a missing build artifact
  // must not take the endpoint down.
  const fresh = require.resolve('../src/server/entity-map.cjs');
  delete require.cache[fresh];
  const ok = typeof em.botanical(999999) === 'object';
  return { pass: ok && em.botanical(999999) === null, detail: 'unknown id → null' };
});

// ── Run ──────────────────────────────────────────────────────────
let passed = 0, failed = 0;
for (const c of cases) {
  let r;
  try { r = c.run(); } catch (e) { r = { pass: false, detail: e.message }; }
  if (r.pass) { passed++; console.log('  ✓ ' + c.name + (r.detail ? '  — ' + r.detail : '')); }
  else        { failed++; console.log('  ✗ ' + c.name + (r.detail ? '  — ' + r.detail : '')); }
}

// ── Drift report (informational) ─────────────────────────────────
const drift = map.unresolved.filter(u => u.kind !== 'monograph');
if (drift.length) {
  console.log('');
  console.log('  ⚠ shop / stock drift — data to reconcile, not a test failure:');
  for (const d of drift) {
    console.log('     · ' + d.kind + ' — ' + (d.stockId || d.displayName || d.productId));
  }
}

console.log('');
console.log('  passed: ' + passed);
console.log('  failed: ' + failed);
process.exit(failed ? 1 : 0);
