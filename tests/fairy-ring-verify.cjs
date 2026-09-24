// tests/fairy-ring-verify.cjs — npm run test:fairy-ring
//
// The fairy ring on the portal home. Three classes of check:
//
//   1. portalSections is coherent — ids match what app-living actually
//      dispatches on, and every thread is declared at BOTH ends. A
//      one-way relation draws a thread from one node and not the other.
//
//   2. The six reference bugs stay fixed. They are easy to reintroduce
//      by copying from the 21st.dev source, so each is pinned here.
//
//   3. Nothing invents a number. HEALTH, ACTIVITY, FLOW and Pulse have
//      no real source (docs/COMMUNITY-AUDIT.md §5) and Robin's call on
//      2026-09-25 was to hide them, so the code must not render one.
const fs = require('fs'), vm = require('vm'), path = require('path');
const React = require('react'), RDS = require('react-dom/server');

let p = 0, f = 0;
const ok  = (n, d) => { p++; console.log('  ✓ ' + n + (d ? '  — ' + d : '')); };
const bad = (n, d) => { f++; console.log('  ✗ ' + n + (d ? '  — ' + d : '')); };

function load() {
  const sb = {
    console, React, setTimeout, clearTimeout,
    cancelAnimationFrame() {}, requestAnimationFrame: () => 0,
    performance: { now: () => 0 },
    document: {
      hidden: false, addEventListener() {}, removeEventListener() {},
      getElementById: () => null, querySelectorAll: () => [],
    },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    Math, JSON, Object, Array, String, Number, Error, Map, Set, Boolean,
  };
  sb.window = sb; sb.globalThis = sb;
  const ctx = vm.createContext(sb);
  for (const name of ['sections', 'organism', 'fairy-ring']) {
    const file = path.join('public/community/portal', name + '.js');
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: name });
  }
  return sb;
}

const sb = load();
const PS = sb.PortalSections;
const app     = fs.readFileSync('public/community/spore/app-living.jsx', 'utf8');
const ringSrc = fs.readFileSync('public/community/portal/fairy-ring.jsx', 'utf8');
const css     = fs.readFileSync('public/community/portal/fairy-ring.css', 'utf8');
const html    = fs.readFileSync('public/community/index.html', 'utf8');

console.log('\n── the config ──');
PS                                      ? ok('window.PortalSections is set') : bad('window.PortalSections is set');
typeof sb.FairyRing === 'function'      ? ok('window.FairyRing is set')      : bad('window.FairyRing is set');
typeof sb.PortalOrganism === 'function' ? ok('window.PortalOrganism is set') : bad('window.PortalOrganism is set');

// Ids are load-bearing: app-living switches on them. academy is a
// separate page rather than a tab, so it has no dispatch.
const unknown = PS.ALL
  .map(s => s.id)
  .filter(id => id !== 'academy' && app.indexOf("tab === '" + id + "'") === -1);
unknown.length === 0
  ? ok('every section id is one app-living dispatches on', PS.ALL.map(s => s.id).join(' '))
  : bad('unknown section id', unknown.join(', '));

const probs = PS.relationProblems();
probs.length === 0 ? ok('every thread is declared at both ends') : bad('thread problems', probs.join(' · '));

PS.RING.every(s => s.label && s.line && s.subtitle)
  ? ok('every ring node has a label, subtitle and one-liner') : bad('missing copy');
PS.ROOT.requiresRole === 'admin'      ? ok('Root requires the admin role') : bad('Root role');
PS.RING.every(s => s.id !== 'admin')  ? ok('Root is NOT on the ring', 'roots are underground') : bad('Root on the ring');

console.log('\n── nothing invents a number ──');
!/fr-pulse-bar|pulseValue/.test(ringSrc) ? ok('no Pulse bar is rendered') : bad('a Pulse bar exists');
PS.byId('exp').metric === null  ? ok('Fruiting shows no metric', 'nothing real behind it')     : bad('Fruiting metric');
PS.ORGANISM.metric === null     ? ok('The Organism shows no metric', 'no health signal exists') : bad('Organism metric');
PS.RING.filter(s => s.metric).every(s => s.metric.source)
  ? ok('every declared metric names a real table') : bad('metric without a source');

console.log('\n── the six reference bugs stay fixed ──');
(/requestAnimationFrame/.test(ringSrc) && !/setInterval\s*\(/.test(ringSrc))
  ? ok('(a) one rAF loop, no setInterval') : bad('(a) setInterval present');
/shortestDelta/.test(ringSrc)   ? ok('(b) angle tweened the short way round') : bad('(b) no shortestDelta');
!/set[A-Z]\w*\(\s*\w+\s*=>\s*\{[\s\S]{0,200}?(window\.location|document\.)/.test(ringSrc)
  ? ok('(c) no side effects inside a state updater') : bad('(c) side effect in updater');
/ref=\{\([^)]*\)\s*=>\s*\{/.test(ringSrc) ? ok('(d) ref callbacks use block bodies') : bad('(d) implicit-return ref');
/focusId === null|focusIndex === null/.test(ringSrc) ? ok('(e) focus compared to null, not truthiness') : bad('(e) truthiness check');
/<button/.test(ringSrc)         ? ok('(f) nodes are real buttons') : bad('(f) clickable divs');

console.log('\n── accessibility + motion ──');
/aria-label="Portal sections"/.test(ringSrc) ? ok('the ring is a labelled nav landmark') : bad('nav landmark');
/ArrowRight|ArrowLeft/.test(ringSrc) ? ok('arrow keys move around the ring')    : bad('arrow keys');
/Escape/.test(ringSrc)               ? ok('Escape closes the card')             : bad('Escape');
/prefers-reduced-motion/.test(ringSrc) ? ok('reduced motion honoured in JS')    : bad('reduced motion JS');
/visibilitychange/.test(ringSrc)     ? ok('loop pauses when the tab is hidden') : bad('visibilitychange');
/ResizeObserver/.test(ringSrc)       ? ok('radius comes from the stage size')   : bad('ResizeObserver');
/aria-pressed/.test(ringSrc)         ? ok('focus state is exposed to AT')       : bad('aria-pressed');
/prefers-reduced-motion/.test(css)   ? ok('reduced motion honoured in CSS')     : bad('reduced motion CSS');
!/@import|tailwind/i.test(css)       ? ok('no Tailwind, no imports', 'portal tokens only') : bad('CSS imports something');

console.log('\n── load order ──');
const iS = html.indexOf('portal/sections.js');
const iR = html.indexOf('portal/fairy-ring.js');
const iA = html.indexOf('spore/app-living.js');
(iS > -1 && iR > iS) ? ok('sections.js loads before fairy-ring.js') : bad('order: sections before ring');
(iR > -1 && iA > iR) ? ok('the ring loads before app-living.js')    : bad('order: ring before app-living');
/portal\/fairy-ring\.css/.test(html) ? ok('stylesheet linked') : bad('stylesheet');
(/window\.FairyRing/.test(app) && /<FairyRing/.test(app))
  ? ok('app-living shims FairyRing and renders it') : bad('app-living wiring');

console.log('\n── it renders ──');
try {
  const out = RDS.renderToStaticMarkup(
    React.createElement(sb.FairyRing, { role: 'member', onOpenSection() {} }));
  ok('renders without throwing');
  (/Hyphae/.test(out) && /Alchemy/.test(out))
    ? ok('ring labels appear', 'Hyphae, Fruiting, Almanac, Larder, Alchemy')
    : bad('labels', out.slice(0, 140));
  !/Root/.test(out) ? ok('Root is hidden for a member') : bad('Root leaked to a member');
  const admin = RDS.renderToStaticMarkup(
    React.createElement(sb.FairyRing, { role: 'admin', onOpenSection() {} }));
  /Root/.test(admin) ? ok('Root appears for a keeper') : bad('Root missing for an admin');
} catch (e) {
  bad('renders without throwing', e.message);
}

console.log('\n  passed: ' + p + '   failed: ' + f);
process.exit(f ? 1 : 0);
