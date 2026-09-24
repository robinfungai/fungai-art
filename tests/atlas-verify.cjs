// tests/atlas-verify.cjs
//
// The atlas has three seams that can break independently:
//
//   1. the generated dataset (scripts/build-atlas.cjs → public/atlas/data/)
//   2. the UI that reads it (src/islands/atlas-explorer.tsx)
//   3. the page wiring (public/atlas/index.html, vite.config.ts, build chain)
//
// Seams 1 and 2 are coupled only by the shape of some JSON, so this renders
// every layer view against every real dossier with react-dom/server. A field
// the build script stops emitting, or a view that starts reading a field that
// was never there, fails here rather than as a blank tab in production.
//
// The hero's motion engine is asserted from source: its mechanics were
// specified (state-driven timeline, absolute pixel growth, title splitting)
// and a later "tidy-up" that swaps pixel growth for transform: scale() would
// be a silent regression of the brief.
//
//   npm run test:atlas

const fs      = require('fs');
const path    = require('path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'public', 'atlas', 'data');

const cases = [];
const check = (name, run) => cases.push({ name, run });

// ── Dataset present ──────────────────────────────────────────────
const indexPath = path.join(DATA, 'index.json');
if (!fs.existsSync(indexPath)) {
  console.error('✗ public/atlas/data/index.json missing — run `npm run build:atlas` first.');
  process.exit(1);
}
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const byId  = new Map(index.organisms.map(o => [o.id, o]));

check('index: every organism carries the fields the grid renders', () => {
  const need = ['id', 'slug', 'name', 'binomial', 'type', 'tradition', 'grade', 'states', 'synergy'];
  const bad = index.organisms.filter(o => need.some(k => o[k] === undefined));
  return { pass: bad.length === 0, detail: bad.length ? bad.slice(0, 3).map(o => o.name).join(', ') : '' };
});

check('index: slugs are unique', () => {
  const seen = new Set(); const dupes = [];
  index.organisms.forEach(o => { if (seen.has(o.slug)) dupes.push(o.slug); seen.add(o.slug); });
  return { pass: dupes.length === 0, detail: dupes.join(', ') };
});

check('index: every slug has a dossier file on disk', () => {
  const missing = index.organisms
    .filter(o => !fs.existsSync(path.join(DATA, 'organism', o.slug + '.json')))
    .map(o => o.slug);
  return { pass: missing.length === 0, detail: missing.slice(0, 5).join(', ') };
});

check('index: every synergy edge points at an organism in the index', () => {
  const dangling = [];
  index.organisms.forEach(o => {
    [...o.synergy, ...o.cautionEdges].forEach(id => {
      if (!byId.has(id)) dangling.push(`${o.name}→${id}`);
    });
  });
  return { pass: dangling.length === 0, detail: dangling.slice(0, 5).join(', ') };
});

check('index: no organism lists itself as its own ally', () => {
  const self = index.organisms.filter(o => o.synergy.includes(o.id) || o.cautionEdges.includes(o.id));
  return { pass: self.length === 0, detail: self.map(o => o.name).join(', ') };
});

check('index: the graph is worth drawing (>400 synergy edges)', () => {
  const edges = index.organisms.reduce((s, o) => s + o.synergy.length, 0);
  return { pass: edges > 400, detail: `${edges} edges` };
});

check('index: every facet the UI renders a rail for exists in the data', () => {
  const rails = ['type', 'states', 'ecology', 'preparations', 'tradition'];
  const missing = rails.filter(r => !index.facets[r] || !index.facets[r].values.length);
  return { pass: missing.length === 0, detail: missing.join(', ') };
});

check('index: derived facets are flagged as derived', () => {
  // The UI prints a "derived" marker off this flag. If the build script stops
  // setting it, the page starts presenting pattern matches as curated fields.
  const shouldBeDerived = ['type', 'states', 'ecology', 'preparations'];
  const wrong = shouldBeDerived.filter(f => index.facets[f] && index.facets[f].derived !== true);
  return { pass: wrong.length === 0, detail: wrong.join(', ') };
});

check('index: tradition is NOT flagged derived (it is a recorded field)', () => ({
  pass: index.facets.tradition && index.facets.tradition.derived === false,
  detail: '',
}));

check('index: no human-state facet swallows the whole catalogue', () => {
  // A facet matching almost everything sorts nothing. 86% under DIGESTION is
  // what the first pass of the classifier did; this is the guard against a
  // later loosening putting it back.
  const worst = index.facets.states.values[0];
  const share = worst.count / index.count;
  return { pass: share < 0.75, detail: `${worst.value} covers ${Math.round(share * 100)}%` };
});

check('index: mean primary states per organism stays navigable (1–4)', () => {
  const mean = index.organisms.reduce((s, o) => s + o.states.length, 0) / index.organisms.length;
  return { pass: mean >= 1 && mean <= 4, detail: mean.toFixed(2) };
});

// ── Dossiers ─────────────────────────────────────────────────────
const dossiers = index.organisms.map(o =>
  JSON.parse(fs.readFileSync(path.join(DATA, 'organism', o.slug + '.json'), 'utf8')));

check('dossiers: all ten layers present on every organism', () => {
  const need = ['identity', 'ecology', 'material', 'chemistry', 'tradition',
                'evidence', 'extraction', 'safety', 'relationship', 'formulation'];
  const bad = dossiers.filter(d => need.some(k => !d.layers || !d.layers[k]));
  return { pass: bad.length === 0, detail: bad.slice(0, 3).map(d => d.slug).join(', ') };
});

check('dossiers: safety contraindications survive the trip from herbs.ts', () => {
  // Safety text is the one thing on this page that can hurt somebody if it
  // silently empties out. Most organisms record contraindications; if almost
  // none do, the field was renamed upstream.
  const withContra = dossiers.filter(d => d.layers.safety.contraindications.length).length;
  return { pass: withContra > dossiers.length * 0.8, detail: `${withContra}/${dossiers.length}` };
});

check('dossiers: relationship notes are carried, not just ids', () => {
  const withNotes = dossiers.filter(d =>
    d.layers.relationship.synergy.every(m => typeof m.note === 'string' && m.note.length)).length;
  return { pass: withNotes === dossiers.length, detail: `${withNotes}/${dossiers.length}` };
});

// ── Render every layer view against every dossier ────────────────
// esbuild → CJS so the TSX can be required here. Same transform the island
// bundler uses.
let LAYER_VIEWS, TABS, React, renderToString, filterOrganisms;
try {
  const built = esbuild.buildSync({
    absWorkingDir: ROOT,
    entryPoints: ['src/islands/atlas-explorer.tsx'],
    bundle: true, write: false, format: 'cjs', platform: 'node',
    jsx: 'automatic', target: ['node18'], logLevel: 'silent',
    external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
  });
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', built.outputFiles[0].text)(mod, mod.exports, require);
  LAYER_VIEWS = mod.exports.LAYER_VIEWS;
  TABS = mod.exports.TABS;
  filterOrganisms = mod.exports.filterOrganisms;
  React = require('react');
  renderToString = require('react-dom/server').renderToStaticMarkup;
} catch (e) {
  check('explorer: module builds and loads outside a browser', () => ({
    pass: false, detail: String(e && e.message).slice(0, 200),
  }));
}

if (LAYER_VIEWS) {
  check('explorer: module builds and loads outside a browser', () => ({ pass: true, detail: '' }));

  check('explorer: a view is exported for every tab', () => {
    const missing = TABS.filter(t => !LAYER_VIEWS[t]);
    return { pass: missing.length === 0, detail: missing.join(', ') };
  });

  check('explorer: every layer view renders every one of the 243 dossiers', () => {
    const failures = [];
    for (const doc of dossiers) {
      for (const tab of TABS) {
        const View = LAYER_VIEWS[tab];
        if (!View) continue;
        try {
          const props = tab === 'ALLIES'
            ? { doc, byId, onNavigate: () => {} }
            : { doc };
          renderToString(React.createElement(View, props));
        } catch (e) {
          failures.push(`${doc.slug}/${tab}: ${String(e && e.message).slice(0, 80)}`);
          if (failures.length > 4) break;
        }
      }
      if (failures.length > 4) break;
    }
    return {
      pass: failures.length === 0,
      detail: failures.length ? failures.join(' | ') : `${dossiers.length} dossiers × ${TABS.length} tabs`,
    };
  });

  check('explorer: the SAFETY view actually prints the contraindications', () => {
    // Renders a known-risky organism and asserts its recorded warnings reach
    // the markup. A view that silently drops this section would still "render".
    const risky = dossiers.find(d => d.layers.safety.contraindications.length >= 3);
    const html = renderToString(React.createElement(LAYER_VIEWS.SAFETY, { doc: risky }));
    const first = risky.layers.safety.contraindications[0].slice(0, 28);
    return { pass: html.includes(first), detail: risky.slug };
  });

  check('explorer: the SAFETY view carries the not-medical-advice line', () => {
    const html = renderToString(React.createElement(LAYER_VIEWS.SAFETY, { doc: dossiers[0] }));
    return { pass: /not medical advice/i.test(html), detail: '' };
  });

  check('explorer: the ALLIES graph draws clickable nodes for a connected organism', () => {
    const hub = dossiers.find(d => d.layers.relationship.synergy.length >= 4);
    const html = renderToString(React.createElement(LAYER_VIEWS.ALLIES, { doc: hub, byId, onNavigate: () => {} }));
    return {
      pass: /<svg/.test(html) && (html.match(/atl-node"/g) || []).length >= 4,
      detail: hub.slug,
    };
  });

  check('explorer: an organism with no allies says so instead of drawing nothing', () => {
    const lonely = dossiers.find(d => d.layers.relationship.synergy.length === 0);
    if (!lonely) return { pass: true, detail: 'none in catalogue' };
    const html = renderToString(React.createElement(LAYER_VIEWS.ALLIES, { doc: lonely, byId, onNavigate: () => {} }));
    return { pass: /No synergies are recorded/.test(html), detail: lonely.slug };
  });

  check('explorer: unrecorded habitat is admitted, not blank', () => {
    const noEco = dossiers.find(d => d.layers.ecology.biomes.length === 0);
    if (!noEco) return { pass: true, detail: 'all organisms have a biome' };
    const html = renderToString(React.createElement(LAYER_VIEWS.BOTANICAL, { doc: noEco }));
    return { pass: /not yet recorded/i.test(html), detail: noEco.slug };
  });
}

// ── Facet semantics ──────────────────────────────────────────────
if (filterOrganisms) {
  const all = index.organisms;

  check('filter: no selection returns the whole catalogue', () => ({
    pass: filterOrganisms(all, {}, '').length === index.count, detail: '',
  }));

  check('filter: two values in ONE facet form a union, not an empty set', () => {
    const fungi  = filterOrganisms(all, { type: ['fungus'] }, '').length;
    const plants = filterOrganisms(all, { type: ['plant'] }, '').length;
    const both   = filterOrganisms(all, { type: ['fungus', 'plant'] }, '').length;
    return { pass: both === fungi + plants && both > fungi, detail: `${fungi}+${plants}=${both}` };
  });

  check('filter: values across TWO facets intersect', () => {
    const fungi = filterOrganisms(all, { type: ['fungus'] }, '');
    const rest  = filterOrganisms(all, { states: ['REST'] }, '');
    const both  = filterOrganisms(all, { type: ['fungus'], states: ['REST'] }, '');
    const ok = both.length <= Math.min(fungi.length, rest.length) &&
               both.every(o => o.type === 'fungus' && o.states.includes('REST'));
    return { pass: ok, detail: `${fungi.length} fungi ∩ ${rest.length} rest = ${both.length}` };
  });

  check('filter: search matches name, binomial and family', () => {
    const byName   = filterOrganisms(all, {}, 'reishi');
    const byBinom  = filterOrganisms(all, {}, 'ganoderma');
    const byFamily = filterOrganisms(all, {}, 'asteraceae');
    return {
      pass: byName.length >= 1 && byBinom.length >= 1 && byFamily.length >= 3,
      detail: `${byName.length} / ${byBinom.length} / ${byFamily.length}`,
    };
  });

  check('filter: search and facets compose rather than override', () => {
    const q = filterOrganisms(all, { type: ['fungus'] }, 'reishi');
    return { pass: q.every(o => o.type === 'fungus' && /reishi/i.test(o.name + o.binomial)), detail: `${q.length}` };
  });

  check('filter: every facet value on every rail returns at least one organism', () => {
    // A chip that always yields an empty grid is a dead control. The counts on
    // the chips come from the same pass that builds the values, so a mismatch
    // here means facetValues() and the build script have drifted apart.
    const dead = [];
    for (const rail of ['type', 'states', 'ecology', 'preparations', 'tradition']) {
      for (const v of index.facets[rail].values) {
        const n = filterOrganisms(all, { [rail]: [v.value] }, '').length;
        if (n !== v.count) dead.push(`${rail}/${v.value}: chip says ${v.count}, filter returns ${n}`);
      }
    }
    return { pass: dead.length === 0, detail: dead.slice(0, 3).join(' | ') };
  });
}

// ── Hero motion engine · asserted from source ────────────────────
const HERO = fs.readFileSync(path.join(ROOT, 'src', 'components', 'ui', 'scroll-expansion-hero.tsx'), 'utf8');

check('hero: drives a single 0→1 progress value (state-driven timeline)', () => ({
  pass: /const \[progress, setProgress\] = useState\(0\)/.test(HERO) && /clamp\(next, 0, 1\)/.test(HERO),
  detail: '',
}));

check('hero: hijacks wheel and touchmove with passive: false', () => ({
  pass: /addEventListener\('wheel', onWheel, \{ passive: false \}\)/.test(HERO) &&
        /addEventListener\('touchmove', onTouchMove, \{ passive: false \}\)/.test(HERO),
  detail: '',
}));

check('hero: grows by absolute pixel maths, never a scaled transform', () => {
  // The brief is explicit: the card grows by computing width/height in pixels,
  // not by scaling, which would resample the video and squash the text inside.
  // A static scale() on the decorative background plate is not the growth
  // mechanism, so what this forbids is a scale() interpolated from progress.
  const pixelGrowth = /const mediaW = baseW \+ p \* \(maxW - baseW\)/.test(HERO) &&
                      /const mediaH = baseH \+ p \* \(maxH - baseH\)/.test(HERO) &&
                      /width: `\$\{mediaW\}px`/.test(HERO) &&
                      /height: `\$\{mediaH\}px`/.test(HERO);
  const progressDrivenScale = /scale\([^)]*\$\{/.test(HERO) || /scale\([^)]*\bp\b/.test(HERO);
  return { pass: pixelGrowth && !progressDrivenScale, detail: '' };
});

check('hero: splits the title and pushes the halves apart', () => ({
  pass: /const firstWord = words\[0\]/.test(HERO) &&
        /const restOfTitle = words\.slice\(1\)/.test(HERO) &&
        /translateX\(\$\{-push\}px\)/.test(HERO) &&
        /translateX\(\$\{push\}px\)/.test(HERO),
  detail: '',
}));

check('hero: children fade in only once the timeline completes', () => ({
  pass: /const complete = p >= 1/.test(HERO) && /opacity: complete \|\| reduced \? 1 : 0/.test(HERO),
  detail: '',
}));

check('hero: honours prefers-reduced-motion by skipping the scroll-jack', () => ({
  pass: /prefers-reduced-motion: reduce/.test(HERO) && /if \(reduced\) return;/.test(HERO),
  detail: '',
}));

check('hero: releases the lock so the page scrolls past it', () => ({
  pass: /window\.scrollY <= 0/.test(HERO),
  detail: '',
}));

check('hero: keeps exactly one h1 for screen readers', () => ({
  pass: /className="sem-sr"/.test(HERO) && /aria-hidden=\{complete \? 'true' : undefined\}/.test(HERO),
  detail: '',
}));

// ── Page wiring ──────────────────────────────────────────────────
const PAGE   = fs.readFileSync(path.join(ROOT, 'public', 'atlas', 'index.html'), 'utf8');
const VITE   = fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8');
const PKG    = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const ISLAND = fs.readFileSync(path.join(ROOT, 'scripts', 'build-islands.cjs'), 'utf8');

check('page: mounts both islands', () => ({
  pass: /id="atlas-hero"/.test(PAGE) && /id="atlas-explorer"/.test(PAGE) &&
        /\/islands\/atlas-hero\.js/.test(PAGE) && /\/islands\/atlas-explorer\.js/.test(PAGE),
  detail: '',
}));

check('page: hero points at the media that exists in public/atlas/', () => {
  const hero = fs.readFileSync(path.join(ROOT, 'src', 'islands', 'atlas-hero.tsx'), 'utf8');
  const refs = [...hero.matchAll(/["'](\/atlas\/[^"']+\.(?:mp4|jpg|jpeg|webp|png))["']/g)].map(m => m[1]);
  const missing = refs.filter(r => !fs.existsSync(path.join(ROOT, 'public', r.replace(/^\//, ''))));
  return { pass: refs.length > 0 && missing.length === 0, detail: missing.join(', ') || refs.join(', ') };
});

check('page: carries the three doors in the agreed order', () => {
  const hero = fs.readFileSync(path.join(ROOT, 'src', 'islands', 'atlas-hero.tsx'), 'utf8');
  const order = ['ENTER THE ATLAS', 'FIND YOUR FORMULA', 'ENTER THE FIELD']
    .map(t => hero.indexOf(t));
  return {
    pass: order.every(i => i >= 0) && order[0] < order[1] && order[1] < order[2],
    detail: '',
  };
});

check('page: primary nav uses the new vocabulary', () => {
  const words = ['Formula', 'Atlas', 'Field', 'Alchemy', 'Journal', 'Apothecary'];
  const nav = (PAGE.match(/<nav class="mast-nav"[\s\S]*?<\/nav>/) || [''])[0];
  const missing = words.filter(w => !nav.includes('>' + w + '<'));
  return { pass: missing.length === 0, detail: missing.join(', ') };
});

check('page: every nav link points at a path that exists', () => {
  const nav = (PAGE.match(/<nav class="mast-nav"[\s\S]*?<\/nav>/) || [''])[0];
  const hrefs = [...nav.matchAll(/href="(\/[^"]*)"/g)].map(m => m[1]);
  const known = p =>
    fs.existsSync(path.join(ROOT, 'public', p.replace(/^\//, ''), 'index.html')) ||
    fs.existsSync(path.join(ROOT, p.replace(/^\//, '') + '.html')) ||
    p === '/';
  const dead = hrefs.filter(h => !known(h));
  return { pass: dead.length === 0, detail: dead.join(', ') };
});

check('page: tells no-JS visitors what happened', () => ({
  pass: /<noscript>/.test(PAGE), detail: '',
}));

check('wiring: /atlas is served in dev (vite.config STATIC_PAGES)', () => ({
  pass: /'\/atlas',/.test(VITE), detail: '',
}));

check('wiring: build:atlas runs before the site build', () => ({
  pass: !!PKG.scripts['build:atlas'] &&
        PKG.scripts.build.indexOf('build:atlas') > 0 &&
        PKG.scripts.build.indexOf('build:atlas') < PKG.scripts.build.indexOf('vite build'),
  detail: '',
}));

check('wiring: both islands are registered with the bundler', () => ({
  pass: /'atlas-hero':\s*'src\/islands\/atlas-hero\.tsx'/.test(ISLAND) &&
        /'atlas-explorer':\s*'src\/islands\/atlas-explorer\.tsx'/.test(ISLAND),
  detail: '',
}));

check('wiring: the generated dataset is gitignored, not committed', () => {
  const gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  return { pass: /public\/atlas\/data\//.test(gi), detail: '' };
});

// ── Runner ───────────────────────────────────────────────────────
(async () => {
  let passed = 0, failed = 0;
  for (const c of cases) {
    let out;
    try { out = await c.run(); }
    catch (e) { out = { pass: false, detail: 'THREW: ' + e.message }; }
    console.log(`  ${out.pass ? '✓' : '✗'} ${c.name}${out.detail ? '  — ' + out.detail : ''}`);
    if (out.pass) passed++; else failed++;
  }
  console.log('');
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
