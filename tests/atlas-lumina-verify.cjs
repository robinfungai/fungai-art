// tests/atlas-lumina-verify.cjs
//
// Lumina — the Fungi Kingdom's morph — against the brief that governs it.
//
// The supplied reference component was a demo: CDN-loaded three and gsap, six
// stock photographs, a five-second autoplay timer, progress bars, and captions
// written with innerHTML into elements found by getElementById. The brief
// (§16–21, §32) says to keep the shader and strip all of that.
//
// Every one of those is the kind of thing that comes BACK — a stock URL pasted
// in to fill a gap, an autoplay "so it looks alive in a demo", a getElementById
// because it was quicker. This file fails if any of them does.
//
//   node tests/atlas-lumina-verify.cjs

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const LUMINA   = R('src/components/ui/atlas-lumina.tsx');
const EXPLORER = R('src/islands/atlas-explorer.tsx');
const INDEX    = JSON.parse(R('public/atlas/data/index.json'));

// Absence checks run against CODE. These files document at length what they
// refuse to do, and naming a thing in a comment is not doing it.
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const L = code(LUMINA);
const E = code(EXPLORER);

let passed = 0, failed = 0;
const ok   = (n, d) => { passed++; console.log('  ✓ ' + n + (d ? '  — ' + d : '')); };
const bad  = (n, d) => { failed++; console.log('  ✗ ' + n + (d ? '  — ' + d : '')); };
const test = (n, cond, d) => (cond ? ok(n, d) : bad(n, d));

// ── 1 · The asset rule (§17) ─────────────────────────────────────
console.log('\n── ONLY THE TWO LOCAL IMAGES ──');
const ALLOWED = ['/atlas/second-photo.jpg', '/atlas/third-photo.jpg'];
for (const f of ALLOWED) {
  test('exists on disk · ' + f, fs.existsSync(path.join(ROOT, 'public', f.replace(/^\//, ''))));
}
{
  // Any image-ish URL in either file must be one of the two.
  const urls = [...(L + E).matchAll(/['"`]([^'"`]*\.(?:jpg|jpeg|png|webp|avif|gif))['"`]/gi)].map(m => m[1]);
  const strays = urls.filter(u => !ALLOWED.includes(u));
  test('no image other than the two named assets', strays.length === 0,
    strays.length ? strays.join(', ') : urls.length + ' references, all allowed');
}
{
  // `placeholder=` is a legitimate input attribute on the explorer's search
  // box, so strip the attribute before looking for the stock-image kind.
  const hay = (L + E).replace(/placeholder=/g, ' ');
  for (const banned of ['unsplash', '21st.dev', 'cdn.21st', 'placeholder', 'picsum', 'pexels']) {
    test('no ' + banned, !new RegExp(banned, 'i').test(hay));
  }
}

// ── 2 · No CDN, no second copy of three (§32) ────────────────────
console.log('\n── DEPENDENCIES COME FROM package.json ──');
test('three is a real project dependency',
  !!(require(path.join(ROOT, 'package.json')).dependencies || {}).three);
test('no <script> is injected at runtime',
  !/createElement\(\s*['"]script['"]\s*\)/.test(L));
test('no cdnjs / unpkg / jsdelivr URL', !/cdnjs|unpkg|jsdelivr/i.test(L));
test('three is imported, not read off window',
  /import \* as THREE from 'three'/.test(LUMINA) && !/\(window as any\)\[/.test(L));
test('gsap is not used',
  !/\bgsap\b/.test(L) && !(require(path.join(ROOT, 'package.json')).dependencies || {}).gsap,
  'transition is eased in useFrame instead');

// ── 3 · React owns the DOM ───────────────────────────────────────
console.log('\n── NO REACHING OUTSIDE THE TREE ──');
for (const [label, re] of [
  ['getElementById', /getElementById/],
  ['querySelectorAll', /querySelectorAll/],
  ['innerHTML', /innerHTML/],
  ['document.querySelector for the canvas', /document\.querySelector\(\s*['"]\.webgl/],
]) {
  test('no ' + label, !re.test(L));
}
test('the caption is rendered by React', /className="atl-lumina-name"/.test(LUMINA));

// ── 4 · Not a slideshow (§21) ────────────────────────────────────
console.log('\n── THE VISITOR DRIVES IT ──');
// A 7-second ambient drift was asked for AFTER the slideshow was removed.
// The distinction the brief actually cares about is control, so that is what
// is tested: the drift must be visible, interruptible, and indistinguishable
// from a click to the rest of the Atlas.
test('no setInterval / setTimeout timers', !/setInterval|setTimeout/.test(L),
  'rAF, so it stops with the tab');
test('no slide counter', !/slideNumber|slideTotal/.test(L));
test('the dwell is cancellable by pointer or focus',
  /onPointerEnter/.test(L) && /onFocusCapture/.test(L) && /paused/.test(L));
test('the dwell respects prefers-reduced-motion', /prefers-reduced-motion/.test(L));
test('the countdown is shown, not hidden', /atl-lumina-pick-fill/.test(L));
test('an auto-advance goes through the same onSelect as a click',
  /onSelect\(organisms\[\(i \+ 1\) % organisms\.length\]\.slug\)/.test(L));
test('a transition is driven by the selected slug',
  /activeSlug/.test(L) && /anim\.current\s*=\s*\{/.test(L));
test('selecting calls back out to the Atlas', /onSelect\(o\.slug\)/.test(L));

// ── 5 · Lifecycle (§32) ──────────────────────────────────────────
console.log('\n── IT CLEANS UP ──');
test('textures are disposed', /\.dispose\(\)/.test(L) && /map\.forEach\(t => t\.dispose\(\)\)/.test(L));
test('the ShaderMaterial is disposed', /material\.dispose\(\)/.test(L));
test('the render loop belongs to R3F, not hand-rolled',
  !/const render = \(\) =>/.test(L) && /useFrame/.test(L));
test('the only rAF is the dwell, and it is cancelled',
  /cancelAnimationFrame/.test(L));
test('no window resize listener', !/addEventListener\(\s*['"]resize/.test(L),
  'uResolution reads R3F size');
test('rendering goes through R3F Canvas, not a bare WebGLRenderer',
  /<Canvas/.test(LUMINA) && !/new THREE\.WebGLRenderer/.test(L));

// ── 6 · It is not a full-screen page (§18) ───────────────────────
console.log('\n── A PANEL, NOT A PAGE ──');
test('no window.innerWidth sizing', !/window\.innerWidth|window\.innerHeight/.test(L));
test('uResolution comes from the canvas size', /size\.width/.test(L) && /uResolution/.test(L));
test('it is a <section>, not a <main>',
  L.includes('<section') && L.includes('atl-lumina') && !L.includes('<main'));

// ── 7 · Atlas state controls it (§18, §20) ───────────────────────
console.log('\n── WIRED TO ATLAS STATE ──');
test('it mounts only in the fungi kingdom',
  /const fungiKingdom = emphasis === 'fungus'/.test(E) && /\{fungiKingdom &&/.test(E));
test('it is lazy-loaded', /lazy\(\(\) => import\('\.\.\/components\/ui\/atlas-lumina'\)\)/.test(E));
test('selection routes through the SAME open() as globe and grid',
  /onSelect=\{open\}/.test(E), 'so the dossier and the hash stay in step');

// ── 8 · The organisms are real ───────────────────────────────────
console.log('\n── REAL RECORDS, NOT INVENTED ONES ──');
{
  const slugs = [...E.matchAll(/'([a-z-]+)':\s*'\/atlas\/(?:second|third)-photo\.jpg'/g)].map(m => m[1]);
  test('the imagery map names exactly two organisms', slugs.length === 2, slugs.join(', '));
  for (const slug of slugs) {
    const o = INDEX.organisms.find(x => x.slug === slug);
    test('exists in the database · ' + slug, !!o, o ? o.name + ' — ' + o.binomial : 'NOT FOUND');
    test('is a fungus · ' + slug, !!o && o.type === 'fungus', o ? 'type=' + o.type : '');
  }
}

// ── 9 · The shader survived ──────────────────────────────────────
console.log('\n── THE SHADER IS THE POINT ──');
for (const [label, token] of [
  ['cover-fit UV', 'getCoverUV'],
  ['expanding wavefront', 'float br = progress * maxR'],
  ['radial refraction', 'uGlassRefractionStrength'],
  ['chromatic aberration', 'uGlassChromaticAberration'],
  ['rim glow', 'uGlassEdgeGlow'],
  ['liquid flow', 'uGlassLiquidFlow'],
]) {
  test('kept · ' + label, LUMINA.includes(token));
}
{
  // The reference shipped four effects that were all mix(a, b, progress).
  // Dead branches in a fragment shader still compile.
  // Against the code, not the comments — the header explains what was removed.
  const stubs = ['frostEffect', 'rippleEffect', 'plasmaEffect', 'timeshiftEffect', 'uEffectType'];
  const kept = stubs.filter(x => L.includes(x));
  test('the four stub effects and their switch are gone', kept.length === 0, kept.join(', '));
}

console.log('\n  passed: ' + passed);
console.log('  failed: ' + failed);
process.exit(failed ? 1 : 0);
