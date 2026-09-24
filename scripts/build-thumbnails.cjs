#!/usr/bin/env node
/**
 * scripts/build-thumbnails.cjs
 *
 *   npm i -D sharp          (once — not installed yet)
 *   npm run build:thumbnails
 *
 * Makes a small card-sized derivative of every organism photograph.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────
 * The 16 images in public/atlas/ average 430 KB. At Robin's target of ~260
 * herbs that is roughly 112 MB of photographs. Lazy loading means a phone
 * only fetches what scrolls into view, but the FIRST screen of the grid is
 * about a dozen cards — some 5 MB before anything is readable, on a network
 * that may be a train window.
 *
 * A card is displayed at roughly 260 px wide. Sending a 1600 px photograph to
 * fill it wastes about 95% of the bytes. So: one 520 px WebP per image at
 * quality 72, which lands around 30–45 KB. The same first screen becomes
 * ~0.5 MB, and the full 260-card grid about 10 MB instead of 112 MB.
 *
 * The ORIGINAL is untouched and is what the dossier and Lumina use — when you
 * have opened one organism, one full-size photograph is a fair thing to send.
 *
 * Output: public/atlas/thumb/<name>.webp, gitignored like other build output.
 * scripts/build-atlas.cjs prefers a thumbnail when one exists.
 */
const fs = require('fs');
const path = require('path');

let sharp;
try { sharp = require('sharp'); } catch (_) {
  console.error('✗ sharp is not installed. It is the only dependency this needs:');
  console.error('    npm i -D sharp');
  console.error('  Until then the cards use the full-size photographs, which works');
  console.error('  and is heavy. See the note at the top of this file for the maths.');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const SRC  = path.join(ROOT, 'public', 'atlas');
const OUT  = path.join(SRC, 'thumb');
const RESERVED = new Set(['first-photo', 'second-photo', 'third-photo']);
const WIDTH = 520;

fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const files = fs.readdirSync(SRC).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  let before = 0, after = 0, made = 0;
  for (const f of files) {
    const base = f.replace(/\.[^.]+$/, '');
    if (RESERVED.has(base)) continue;
    const src = path.join(SRC, f);
    const out = path.join(OUT, base + '.webp');
    const s = fs.statSync(src);
    // Skip work already done, unless the source is newer.
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= s.mtimeMs) {
      before += s.size; after += fs.statSync(out).size; continue;
    }
    await sharp(src).resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: 72 }).toFile(out);
    before += s.size; after += fs.statSync(out).size; made++;
    console.log('  ✓ ' + base + '.webp');
  }
  const kb = n => (n / 1024).toFixed(0) + ' KB';
  console.log('\n  ' + made + ' written · ' + kb(before) + ' → ' + kb(after) +
              '  (' + Math.round(100 - (after / Math.max(1, before)) * 100) + '% smaller)');
})();
