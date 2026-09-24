// tests/atlas-geography-verify.cjs
//
// The Atlas globe's geography. Holds one line above all others:
//
//   NO ORGANISM IS GIVEN A LOCATION THE DATABASE DOES NOT RECORD.
//
// herbs.ts has no latitude, longitude or geometry for any organism. The globe
// therefore places nodes at REGIONS derived from `native_range` (92% recorded)
// and `tradition` (100% recorded), and leaves the rest off the map. The brief
// forbids fabricating geographic data; this file is what stops that happening
// by accident later — the easiest possible regression here is someone adding a
// fallback that scatters the unplaced across the Pacific to make the globe look
// fuller.
//
//   node tests/atlas-geography-verify.cjs

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');

// atlas-regions.ts is TypeScript. Compiled through esbuild's Node API — the
// same library build-islands uses — rather than the .bin shim, which does not
// exist under that name on Windows.
const out = path.join(os.tmpdir(), 'atlas-regions-test.cjs');
esbuild.buildSync({
  entryPoints: [path.join(ROOT, 'src', 'islands', 'atlas-regions.ts')],
  outfile: out, format: 'cjs', platform: 'node', logLevel: 'error',
});

const R = require(out);
const INDEX = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'atlas', 'data', 'index.json'), 'utf8'));
const ORGANISMS = INDEX.organisms;

let passed = 0, failed = 0;
const ok  = (n, d) => { passed++; console.log('  ✓ ' + n + (d ? '  — ' + d : '')); };
const bad = (n, d) => { failed++; console.log('  ✗ ' + n + (d ? '  — ' + d : '')); };
const test = (n, cond, d) => (cond ? ok(n, d) : bad(n, d));

// ── 1 · Nothing is invented ──────────────────────────────────────
console.log('\n── NO FABRICATED GEOGRAPHY ──');
const { placed, unplaced } = R.placeAll(ORGANISMS);

test('every organism is either placed or explicitly unplaced',
  placed.length + unplaced.length === ORGANISMS.length,
  placed.length + ' placed, ' + unplaced.length + ' unplaced, ' + ORGANISMS.length + ' total');

{
  // The core assertion. A node may only exist because a RECORDED field put it
  // there — its native_range or its tradition, nothing else.
  const unjustified = placed.filter(p => {
    const o = p.organism;
    const byRange = (o.native_range || []).some(r => p.region.ranges.includes(r));
    const byTradition = p.region.traditions.includes(o.tradition);
    return !byRange && !byTradition;
  });
  test('every placed node is justified by a recorded field',
    unjustified.length === 0,
    unjustified.length ? unjustified.slice(0, 5).map(p => p.organism.slug).join(', ')
                       : 'native_range or tradition for all ' + placed.length);
}

{
  // The regression this file exists to prevent.
  const wronglyPlaced = ORGANISMS.filter(o => {
    const hasGeo = (o.native_range || []).length > 0 || (o.tradition && o.tradition !== 'GLOBAL');
    return !hasGeo && placed.some(p => p.organism.slug === o.slug);
  });
  test('an organism with no recorded geography is NEVER given a position',
    wronglyPlaced.length === 0,
    wronglyPlaced.length ? wronglyPlaced.map(o => o.slug).join(', ') : unplaced.length + ' correctly left off');
}

test('unplaced organisms are the cosmopolitan/unrecorded ones',
  unplaced.every(o => !(o.native_range || []).length && (!o.tradition || o.tradition === 'GLOBAL')),
  unplaced.slice(0, 4).map(o => o.name).join(', ') + (unplaced.length > 4 ? ' …' : ''));

// ── 2 · Placement is stable ──────────────────────────────────────
console.log('\n── A PLACE STAYS A PLACE ──');
{
  // If a node moved between renders the globe would stop being a map.
  const a = R.placeAll(ORGANISMS).placed;
  const b = R.placeAll(ORGANISMS).placed;
  const drifted = a.filter((p, i) =>
    p.position.some((v, k) => Math.abs(v - b[i].position[k]) > 1e-12));
  test('placement is deterministic across runs', drifted.length === 0,
    drifted.length ? drifted.length + ' nodes moved' : 'all ' + a.length + ' identical');

  const off1 = R.offsetFor('chaga', 10), off2 = R.offsetFor('chaga', 10);
  test('the same slug always yields the same offset',
    off1.dLat === off2.dLat && off1.dLon === off2.dLon);
  test('different slugs yield different offsets',
    JSON.stringify(R.offsetFor('chaga', 10)) !== JSON.stringify(R.offsetFor('reishi', 10)));
}

// ── 3 · The offset never leaves its region ───────────────────────
console.log('\n── AN OFFSET IS LAYOUT, NOT A CLAIM ──');
{
  const escaped = placed.filter(p => {
    const dLat = Math.abs(p.lat - p.region.lat);
    // Latitude is clamped at ±84 so a polar region legitimately shifts more.
    return dLat > p.region.spread + 1 && Math.abs(p.lat) < 84;
  });
  test('no node drifts outside its own region', escaped.length === 0,
    escaped.length ? escaped.slice(0, 3).map(p => p.organism.slug).join(', ') : 'all within spread');

  const offGlobe = placed.filter(p => Math.abs(p.lat) > 90);
  test('no node has an impossible latitude', offGlobe.length === 0);
}

// ── 4 · Regions are coherent ─────────────────────────────────────
console.log('\n── THE REGION TABLE ──');
test('region ids are unique', new Set(R.REGIONS.map(r => r.id)).size === R.REGIONS.length,
  R.REGIONS.length + ' regions');
test('every region has a plausible centroid',
  R.REGIONS.every(r => r.lat >= -90 && r.lat <= 90 && r.lon >= -180 && r.lon <= 180));
test('every region claims at least one recorded value',
  R.REGIONS.every(r => r.traditions.length || r.ranges.length));
{
  // A tradition mapped to two regions would place the same organism twice.
  const seen = new Set(); const dupes = [];
  for (const r of R.REGIONS) for (const t of r.traditions) {
    if (seen.has(t)) dupes.push(t); else seen.add(t);
  }
  test('no tradition is claimed by two regions', dupes.length === 0, dupes.join(', '));
}
{
  // Every tradition the data actually uses should resolve, except GLOBAL.
  const used = [...new Set(ORGANISMS.map(o => o.tradition))].filter(t => t && t !== 'GLOBAL');
  const orphans = used.filter(t => !R.REGIONS.some(r => r.traditions.includes(t)));
  test('every tradition in the data maps to a region', orphans.length === 0,
    orphans.length ? 'unmapped: ' + orphans.join(', ') : used.length + ' traditions mapped');
}

// ── 5 · Zoom changes information, not size ───────────────────────
console.log('\n── ZOOM TIERS ──');
test('the far camera is at world scale', R.tierForDistance(3.4) === 'WORLD');
test('the near camera is at organism scale', R.tierForDistance(1.6) === 'ORGANISM');
{
  // Pulling the camera back must never reveal MORE detail. TIERS is ordered
  // world-first, so as distance grows the index must be non-increasing.
  const order = R.TIERS;
  let prev = Infinity, monotonic = true, brokeAt = null;
  for (let d = 1.6; d <= 3.4; d += 0.05) {
    const idx = order.indexOf(R.tierForDistance(d));
    if (idx > prev) { monotonic = false; brokeAt = d.toFixed(2); break; }
    prev = idx;
  }
  test('pulling back never reveals more detail', monotonic,
    monotonic ? 'ORGANISM → BIOME → REGION → WORLD' : 'broke at distance ' + brokeAt);
  const distinct = new Set();
  for (let d = 1.6; d <= 3.4; d += 0.02) distinct.add(R.tierForDistance(d));
  test('all four tiers are reachable in the camera range', distinct.size === 4,
    [...distinct].join(' → '));
}

// ── 6 · Projection ───────────────────────────────────────────────
console.log('\n── PROJECTION ──');
{
  const north = R.latLonToVec3(90, 0, 1);
  test('the north pole is at the top', Math.abs(north[1] - 1) < 1e-6);
  const eq = R.latLonToVec3(0, 0, 1);
  test('the equator sits on the sphere', Math.abs(Math.hypot(...eq) - 1) < 1e-6);
  const allOnSphere = placed.every(p => Math.abs(Math.hypot(...p.position) - 1.008) < 1e-3);
  test('every node sits on the globe surface', allOnSphere);
}

// ── 7 · Counts feed the world tier ───────────────────────────────
console.log('\n── REGION DENSITY ──');
{
  const counts = R.regionCounts(placed);
  const sum = counts.reduce((s, c) => s + c.count, 0);
  test('region counts account for every placed node', sum === placed.length,
    sum + ' = ' + placed.length);
  test('counts are ordered densest first',
    counts.every((c, i) => i === 0 || counts[i - 1].count >= c.count));
  console.log('');
  for (const { region, count } of counts) {
    console.log('    ' + region.label.padEnd(30) + String(count).padStart(4));
  }
  console.log('    ' + '(not on the globe)'.padEnd(30) + String(unplaced.length).padStart(4));
}

console.log('\n  passed: ' + passed);
console.log('  failed: ' + failed);
process.exit(failed ? 1 : 0);
