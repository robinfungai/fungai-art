// tests/explorer-verify.cjs
//
// /explorer sells through the same basket and checkout as /shop. The
// server prices every order from its own CATALOG, so a product the
// explorer adds under a name or price the server doesn't know fails at
// the payment step — after the customer has typed in their card. These
// tests catch that drift at build time instead.
//
// They also hold the explorer to the shop's availability flags and to
// the claims policy's product-name rule.
//
//   node tests/explorer-verify.cjs

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ── Load the explorer data the way the browser does ──────────────
const sandbox = { window: {} };
vm.runInNewContext(read('public/explorer/chapters.js'), sandbox, { filename: 'chapters.js' });
const DATA = sandbox.window.FA_EXPLORER;

// ── Server catalog: parse the literal in create-payment-intent.js ─
// (The module imports stripe + supabase, so it can't be required here.)
const fnSrc = read('netlify/functions/create-payment-intent.js');
const block = fnSrc.match(/const CATALOG = \{([\s\S]*?)\n\};/);
const CATALOG = {};
if (block) {
  for (const m of block[1].matchAll(/^\s*'([^']+)'\s*:\s*([0-9.]+)\s*,/gm)) CATALOG[m[1]] = Number(m[2]);
}

// ── Shop availability: cards the shop marks .is-unavailable ───────
const shop = read('public/shop/index.html');
const shopUnavailable = new Set();
for (const card of shop.split(/<div class="product-card/).slice(1)) {
  const head = card.slice(0, card.indexOf('>'));
  if (!/is-unavailable/.test(head)) continue;
  const m = card.slice(0, 3000).match(/addToCart\('([^']+)'/);
  if (m) shopUnavailable.add(m[1]);
}

// Every purchasable line the explorer can put in the basket.
function lines(){
  const out = [];
  for (const [key, p] of Object.entries(DATA.products)) {
    if (Array.isArray(p.sizes) && p.sizes.length) {
      for (const s of p.sizes) out.push({ key, name: s.name, price: s.price, unavailable: !!p.unavailable });
    } else {
      out.push({ key, name: key, price: p.price, unavailable: !!p.unavailable });
    }
  }
  return out;
}

const cases = [];
const t = (name, run) => cases.push({ name, run });

// ── Shape ────────────────────────────────────────────────────────
t('chapters.js defines chapters and products', () => {
  const ok = DATA && Array.isArray(DATA.chapters) && DATA.chapters.length > 0 && DATA.products && typeof DATA.products === 'object';
  return { pass: !!ok, detail: ok ? `${DATA.chapters.length} chapters, ${Object.keys(DATA.products).length} products` : 'window.FA_EXPLORER missing or malformed' };
});

t('server catalog parsed', () => {
  const n = Object.keys(CATALOG).length;
  return { pass: n > 0, detail: n ? `${n} entries` : 'CATALOG literal not found in create-payment-intent.js' };
});

t('chapter slugs are unique and URL-safe', () => {
  const slugs = DATA.chapters.map(c => c.slug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  const bad = slugs.filter(s => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s));
  return { pass: !dupes.length && !bad.length, detail: [...dupes.map(d => 'duplicate ' + d), ...bad.map(b => 'bad slug ' + b)].join(', ') };
});

t('every chapter has kicker, title, colour and image', () => {
  const bad = DATA.chapters.filter(c => !c.kicker || !c.title || !/^#[0-9a-f]{6}$/i.test(c.colour || '') || !c.img);
  return { pass: !bad.length, detail: bad.map(c => c.slug).join(', ') };
});

t('every product a chapter lists exists', () => {
  const missing = [];
  for (const c of DATA.chapters) for (const k of c.products || []) if (!DATA.products[k]) missing.push(c.slug + ' → ' + k);
  return { pass: !missing.length, detail: missing.join(', ') };
});

// ── Checkout parity (the one that matters) ───────────────────────
t('every basket name exists in the server CATALOG', () => {
  const missing = lines().filter(l => !(l.name in CATALOG)).map(l => l.name);
  return { pass: !missing.length, detail: missing.length ? 'unknown to checkout: ' + missing.join(', ') : `${lines().length} lines` };
});

t('every price matches the server CATALOG', () => {
  const off = lines().filter(l => l.name in CATALOG && CATALOG[l.name] !== l.price)
    .map(l => `${l.name} explorer €${l.price} ≠ server €${CATALOG[l.name]}`);
  return { pass: !off.length, detail: off.join('; ') };
});

// ── Availability parity ──────────────────────────────────────────
t('products the shop marks unavailable are unavailable here too', () => {
  const leak = lines().filter(l => shopUnavailable.has(l.name) && !l.unavailable).map(l => l.name);
  return { pass: !leak.length, detail: leak.length ? 'sellable here, unavailable in shop: ' + leak.join(', ') : `${shopUnavailable.size} unavailable in shop` };
});

t('products unavailable here are unavailable in the shop too', () => {
  const extra = lines().filter(l => l.unavailable && !shopUnavailable.has(l.name)).map(l => l.name);
  return { pass: !extra.length, detail: extra.length ? 'blocked here, sellable in shop: ' + extra.join(', ') : '' };
});

// ── Claims policy: no condition in a product name ────────────────
t('no product title or basket name names a condition', () => {
  const { DISEASES } = require(path.join(ROOT, 'src', 'server', 'myco', 'claim-rules.cjs'));
  const re = new RegExp(`\\b(${DISEASES})\\b`, 'i');
  const hits = [];
  for (const [key, p] of Object.entries(DATA.products)) {
    for (const s of [key, p.title, ...(p.sizes || []).map(z => z.name)]) if (s && re.test(s)) hits.push(s);
  }
  for (const c of DATA.chapters) if (re.test(c.title)) hits.push('chapter ' + c.title);
  return { pass: !hits.length, detail: hits.join(', ') };
});

// ── Assets + links resolve ───────────────────────────────────────
// Local only: the shop's three Unsplash product photos all 404 (checked
// 2026-09-18), and a test can't watch a third-party CDN. Use `placeholder`
// until there is a real photo in public/.
t('every image is local and exists', () => {
  const imgs = [
    ...DATA.chapters.map(c => c.img),
    ...Object.values(DATA.products).map(p => p.img),
  ].filter(Boolean);
  const remote  = imgs.filter(s => !s.startsWith('/'));
  const missing = imgs.filter(s => s.startsWith('/') && !fs.existsSync(path.join(ROOT, 'public', s)));
  const bad = [...remote.map(r => 'remote ' + r), ...missing.map(m => 'missing ' + m)];
  return { pass: !bad.length, detail: bad.length ? bad.join(', ') : `${imgs.length} images` };
});

t('every internal link points at a page that exists', () => {
  const hrefs = [];
  for (const c of DATA.chapters) {
    for (const l of c.links || []) hrefs.push(l.href);
    if (c.cta) hrefs.push(c.cta.href);
  }
  for (const p of Object.values(DATA.products)) if (p.href) hrefs.push(p.href);
  const slugs = new Set(DATA.chapters.map(c => c.slug));
  const bad = hrefs.filter(h => {
    if (h.startsWith('#')) return !slugs.has(h.slice(1));
    if (!h.startsWith('/')) return false;
    const p = h.split('#')[0].split('?')[0].replace(/\/$/, '');
    if (p === '') return false;
    return !fs.existsSync(path.join(ROOT, 'public', p, 'index.html'))
        && !fs.existsSync(path.join(ROOT, 'public', p))
        // Vite MPA entries at the repo root (foraging.html → /foraging via scripts/swap-index.cjs)
        && !fs.existsSync(path.join(ROOT, p.slice(1) + '.html'));
  });
  return { pass: !bad.length, detail: bad.length ? bad.join(', ') : `${hrefs.length} links` };
});

t('the page is served in local dev', () => {
  const ok = /'\/explorer'/.test(read('vite.config.ts'));
  return { pass: ok, detail: ok ? '' : "add '/explorer' to STATIC_PAGES in vite.config.ts" };
});

t('the claims scan covers the explorer', () => {
  const ok = /'public\/explorer'/.test(read('scripts/check-claims.cjs'));
  return { pass: ok, detail: ok ? '' : "add 'public/explorer' to the commercial surface in scripts/check-claims.cjs" };
});

// ── Run ──────────────────────────────────────────────────────────
let passed = 0, failed = 0;
console.log('');
console.log('  EXPLORER — basket parity with checkout');
console.log('');
for (const c of cases) {
  let r;
  try { r = c.run(); } catch (e) { r = { pass: false, detail: e.message }; }
  if (r.pass) { passed++; console.log('  ✓ ' + c.name + (r.detail ? '  — ' + r.detail : '')); }
  else        { failed++; console.log('  ✗ ' + c.name + (r.detail ? '  — ' + r.detail : '')); }
}
console.log('');
console.log('  passed: ' + passed);
console.log('  failed: ' + failed);
process.exit(failed ? 1 : 0);
