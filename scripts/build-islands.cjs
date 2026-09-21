// scripts/build-islands.cjs
//
// React "islands" for the static pages. /shop, /mixology and /extraction are
// plain HTML in public/, outside Vite's module graph, so they can't import
// src/components/ui directly. Each island in src/islands/ is bundled here
// (React, three.js, … included) into public/islands/, and the page loads it
// with <script type="module" src="/islands/<name>.js">.
//
// Code splitting is on: /shop's entry is a few KB and pulls the three.js
// chunk only when the intro is actually shown.
//
// Output is a build artifact (.gitignored). `npm run build` and `npm run dev`
// both run this first; rerun it after editing an island or a component it uses:
//   npm run build:islands

const fs      = require('fs');
const path    = require('path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'public', 'islands');

const ENTRIES = {
  'shop-gallery': 'src/islands/shop-gallery.tsx',
  'waves':        'src/islands/waves.tsx',
};

fs.rmSync(OUT, { recursive: true, force: true });

const result = esbuild.buildSync({
  absWorkingDir: ROOT,
  entryPoints: ENTRIES,
  outdir: OUT,
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  target: ['es2020'],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  chunkNames: 'chunks/[name]-[hash]',
  legalComments: 'none',
  metafile: true,
  logLevel: 'warning',
});

for (const [file, info] of Object.entries(result.metafile.outputs)) {
  if (!file.endsWith('.js')) continue;
  console.log('  ✓ ' + file.padEnd(52) + (info.bytes / 1024).toFixed(0) + ' KB');
}
