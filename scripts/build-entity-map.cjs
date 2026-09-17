// scripts/build-entity-map.cjs
//
// Academy P1 · stable IDs across domains.
//
// Blocker B3 in docs/academy/phase-0-audit.md: nothing joins the four
// places a plant exists. The herb database has numeric ids, the 130
// monographs are filenames, the shop sells display strings, and
// product_inventory is keyed by those same strings (including a
// malformed 'Afghan Saffron ('). So "show me the monograph, the
// formulas and the product for this plant" cannot be answered.
//
// This script resolves all three onto one key and writes
// src/data/entity-map.generated.json:
//
//   botanicals  id (herbs.ts numeric id) + slug + name + botanical
//   monographs  file → botanicalId (or null, with the reason)
//   products    stable slug → display names seen in the shop
//                            + botanicalId when it is a single-plant product
//
// Nothing is guessed silently: every unresolved row is listed in
// `unresolved` with what was tried, and tests/entity-map-verify.cjs
// fails if coverage drops below the recorded baseline.
//
//   node scripts/build-entity-map.cjs

const fs   = require('fs');
const path = require('path');
const { getAllHerbs } = require('../src/server/herb-data');

const ROOT        = path.resolve(__dirname, '..');
const MONOGRAPHS  = path.join(ROOT, 'public', 'home', 'markdowns all plants');
const SHOP        = path.join(ROOT, 'public', 'shop', 'index.html');
const INVENTORY   = path.join(ROOT, 'supabase-product-inventory.sql');
const OUT         = path.join(ROOT, 'src', 'data', 'entity-map.generated.json');

// ── helpers ──────────────────────────────────────────────────────
const slugify = s => String(s || '')
  .toLowerCase()
  .replace(/[’'`]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// Comparison key: lowercase words only, so "Lion's Mane" and
// "lions_mane" meet in the middle.
const norm = s => String(s || '')
  .toLowerCase()
  .replace(/[’'`]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// Words that appear in monograph filenames but carry no identity.
const FILE_NOISE = /\b(full|individual|master|monograph|complete|final|v\d+|part\d+)\b/g;

// ── 1 · Botanicals (herbs.ts is canonical) ───────────────────────
function buildBotanicals() {
  return getAllHerbs().map(h => {
    // 'Vaccinium myrtillus (ripe berry)' → binomial + the plant part note
    const latinFull = String(h.botanical || '');
    const latin     = latinFull.replace(/\(.*$/, '').trim();
    const [genus, species] = latin.split(/\s+/);
    return {
      id:        h.id,
      slug:      slugify(h.name),
      name:      h.name,
      botanical: latinFull || null,
      latin:     latin || null,
      genus:     genus || null,
      species:   species || null,
      keys: new Set([
        norm(h.name),
        norm(latin),
        // 'Holy Basil (Tulsi)' is one row but three names people use: the
        // full label, the head name, and the alias in the parenthetical.
        norm(String(h.name).replace(/\(.*$/, '')),
        ...(String(h.name).match(/\(([^)]+)\)/g) || []).map(a => norm(a)),
        norm(h.name).replace(/\b(extract|tincture|root|leaf|berry|mushroom|flower|bark)\b/g, '').trim(),
      ].filter(Boolean)),
    };
  });
}

// ── 2 · Monographs → botanical ───────────────────────────────────
function resolveMonographs(botanicals) {
  if (!fs.existsSync(MONOGRAPHS)) return { monographs: [], unresolved: [] };

  const byKey = new Map();
  for (const b of botanicals) for (const k of b.keys) if (!byKey.has(k)) byKey.set(k, b);

  const monographs = [];
  const unresolved = [];

  for (const file of fs.readdirSync(MONOGRAPHS).filter(f => f.endsWith('.md'))) {
    const raw   = fs.readFileSync(path.join(MONOGRAPHS, file), 'utf8');
    const title = (raw.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
    // "# ASHWAGANDHA (Withania somnifera)" → name + latin
    const titleName  = title.replace(/\(.*$/, '').trim();
    const titleLatin = (title.match(/\(([^)]+)\)/) || [, ''])[1].trim();
    const fileName   = file.replace(/\.md$/, '').replace(/_/g, ' ').replace(FILE_NOISE, '').trim();

    const attempts = [
      ['title',       norm(titleName)],
      ['latin',       norm(titleLatin)],
      ['latin-binomial', norm(titleLatin).split(' ').slice(0, 2).join(' ')],
      ['filename',    norm(fileName)],
      ['title-first', norm(titleName).split(' ')[0]],
      ['file-first',  norm(fileName).split(' ')[0]],
    ].filter(([, v]) => v && v.length > 2);

    let hit = null, via = null;
    for (const [how, key] of attempts) {
      if (byKey.has(key)) { hit = byKey.get(key); via = how; break; }
    }
    // Last resort: a botanical whose whole name appears as words in the
    // filename ("holy basil tulsi master" → Holy Basil). Word-boundary
    // only, so "basil" never swallows "holy basil".
    if (!hit) {
      const fileWords = ' ' + norm(fileName) + ' ';
      const candidates = botanicals.filter(b => fileWords.includes(' ' + norm(b.name) + ' '));
      if (candidates.length === 1) { hit = candidates[0]; via = 'filename-contains'; }
    }

    const record = {
      file,
      title:       title || null,
      botanicalId: hit ? hit.id : null,
      matchedBy:   via,
    };
    monographs.push(record);
    if (!hit) unresolved.push({ kind: 'monograph', file, title, tried: attempts.map(a => a[1]) });
  }

  return { monographs, unresolved };
}

// ── 3 · Products → stable slug (+ botanical when single-plant) ───
function resolveProducts(botanicals) {
  const products   = [];
  const unresolved = [];
  if (!fs.existsSync(SHOP)) return { products, unresolved };

  const shop = fs.readFileSync(SHOP, 'utf8');
  // addToCart('Chaga Extract', 48, …) — the display string IS the id today.
  const names = new Set();
  // Scan line by line and skip JS comments — the shop's source documents
  // the helper with "// … calling addToCart('Name', price)", which would
  // otherwise enter the catalogue as a product called "Name".
  const re = /addToCart\(\s*'([^']+)'/g;
  for (const line of shop.split('\n')) {
    const codeOnly = line.split('//')[0];
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(codeOnly))) names.add(m[1].trim());
  }

  // Stock table rows, so drift between shop and inventory is visible.
  const stockNames = new Set();
  if (fs.existsSync(INVENTORY)) {
    const sql = fs.readFileSync(INVENTORY, 'utf8');
    const rows = sql.split(/INSERT INTO public\.product_inventory/)[1] || '';
    const rre = /\(\s*'([^']+)'\s*,\s*\d+\s*\)/g;
    let r;
    while ((r = rre.exec(rows))) stockNames.add(r[1].trim());
  }

  const byName = new Map();
  for (const b of botanicals) byName.set(norm(b.name), b);

  for (const display of [...names].sort()) {
    // 'Blue Lotus (dried 100g)' → blue-lotus ; 'Afghan Saffron (' → afghan-saffron
    const core = display.replace(/\(.*$/, '').trim();
    const slug = slugify(core);
    // Single-plant products resolve to a botanical; compositions
    // ('ADHD Support', 'Ruby No.7') legitimately do not.
    const key = norm(core)
      .replace(/\b(extract|tincture|syrup|paste|powder|dried|foraged|wild|blend|herbal|smoke)\b/g, '')
      .trim();
    const hit = byName.get(key) || byName.get(norm(core)) || null;
    products.push({
      productId:   slug,
      displayName: core,
      shopStrings: [...names].filter(n => slugify(n.replace(/\(.*$/, '').trim()) === slug),
      botanicalId: hit ? hit.id : null,
      inStockTable: [...stockNames].some(s => slugify(s.replace(/\(.*$/, '').trim()) === slug),
    });
  }

  // Dedupe by slug (several shop buttons per product).
  const bySlug = new Map();
  for (const p of products) {
    const prev = bySlug.get(p.productId);
    if (!prev) bySlug.set(p.productId, p);
    else prev.shopStrings = [...new Set(prev.shopStrings.concat(p.shopStrings))];
  }

  // Stock rows that no shop product claims → drift worth reporting.
  for (const s of stockNames) {
    const slug = slugify(s.replace(/\(.*$/, '').trim());
    if (!bySlug.has(slug)) unresolved.push({ kind: 'stock-row-without-product', stockId: s, slug });
  }
  for (const p of bySlug.values()) {
    if (!p.inStockTable) unresolved.push({ kind: 'product-without-stock-row', productId: p.productId, displayName: p.displayName });
  }

  return { products: [...bySlug.values()], unresolved };
}

// ── main ─────────────────────────────────────────────────────────
function main() {
  const botanicals = buildBotanicals();
  const mono = resolveMonographs(botanicals);
  const prod = resolveProducts(botanicals);

  const matched = mono.monographs.filter(m => m.botanicalId).length;
  const out = {
    generatedAt: new Date().toISOString(),
    counts: {
      botanicals:        botanicals.length,
      monographs:        mono.monographs.length,
      monographsMatched: matched,
      products:          prod.products.length,
      productsWithBotanical: prod.products.filter(p => p.botanicalId).length,
    },
    botanicals: botanicals.map(({ keys, ...rest }) => rest),
    monographs: mono.monographs,
    products:   prod.products,
    unresolved: [...mono.unresolved, ...prod.unresolved],
  };

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');

  console.log('botanicals          : ' + out.counts.botanicals);
  console.log('monographs matched  : ' + matched + ' / ' + mono.monographs.length +
              '  (' + Math.round(100 * matched / Math.max(1, mono.monographs.length)) + '%)');
  console.log('products            : ' + out.counts.products +
              '  (' + out.counts.productsWithBotanical + ' single-plant)');
  console.log('unresolved          : ' + out.unresolved.length);
  for (const u of out.unresolved.slice(0, 12)) {
    console.log('   · ' + u.kind + ' — ' + (u.file || u.stockId || u.displayName || u.productId));
  }
  if (out.unresolved.length > 12) console.log('   … ' + (out.unresolved.length - 12) + ' more in ' + path.relative(ROOT, OUT));
  console.log('');
  console.log('wrote ' + path.relative(ROOT, OUT));
}

if (require.main === module) main();
module.exports = { slugify, norm };
