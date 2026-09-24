/**
 * Converts src/data/herbs.ts → public/herbs-data.js
 * Strips TypeScript syntax with regex, outputs window.HERB_DB = [...]
 *
 * Also runs an integrity check: fails loudly if the source file has
 * duplicate `id:` values. This class of bug is invisible at runtime
 * (name-based lookups still work; id-based ones return the wrong
 * herb) so we catch it at build time instead of in production.
 */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '../src/data/herbs.ts'),
  'utf8'
);

// Find the start of the HERBS array — everything before it is interface definitions
const herbsStart = src.indexOf('export const HERBS');
if (herbsStart === -1) {
  console.error('Could not find "export const HERBS" in herbs.ts');
  process.exit(1);
}

// ── Integrity check: no duplicate ids ──────────────────────────────
// Scans the entire file (both 4-space and 2-space indented blocks)
// for id assignments and flags any that appear twice. Runs BEFORE
// generating the .js so a broken source aborts the build.
const idRe = /^ *id:\s*(\d+)\s*,/gm;
const seen = new Map(); // id -> [line, ...]
let m;
while ((m = idRe.exec(src)) !== null) {
  const id = Number(m[1]);
  const line = src.slice(0, m.index).split('\n').length;
  if (!seen.has(id)) seen.set(id, []);
  seen.get(id).push(line);
}
const dupes = [...seen.entries()].filter(([, lines]) => lines.length > 1);
if (dupes.length) {
  console.error('✗ Duplicate herb ids in src/data/herbs.ts:');
  dupes.forEach(([id, lines]) => {
    console.error(`    id ${id} appears at lines: ${lines.join(', ')}`);
  });
  console.error('  Renumber the newer entries to a fresh id above the max.');
  process.exit(1);
}
console.log(`✓ No duplicate ids (${seen.size} unique herbs).`);

// Take only the data portion (from export const HERBS onwards)
// and strip the 'export' keyword — the data itself is pure JS
let js = src.slice(herbsStart)
  .replace(/^export const /m, 'const ')
  // Remove export on PROTOCOLS if present
  .replace(/^export const PROTOCOLS/m, 'const PROTOCOLS');

// Also remove TypeScript array type annotation on the declaration line
// e.g. "const HERBS: Herb[] = [" -> "const HERBS = ["
js = js.replace(/const HERBS: Herb\[\]/g, 'const HERBS')
       .replace(/const PROTOCOLS: Protocol\[\]/g, 'const PROTOCOLS');

// Find the HERBS array
const herbsMatch = js.match(/const HERBS\s*=\s*(\[[\s\S]*?\]);?\s*(?:\/\/|export|const|$)/);

if (!herbsMatch) {
  console.error('Could not extract HERBS array. Attempting full-file approach.');
  // Write the whole thing wrapped
  const out = `/* Auto-generated from herbs.ts — do not edit */\n${js}\nwindow.HERB_DB = typeof HERBS !== 'undefined' ? HERBS : [];\n`;
  fs.writeFileSync(path.join(__dirname, '../public/herbs-data.js'), out);
  console.log('Wrote full herbs-data.js');
  process.exit(0);
}

// Try to parse as JSON to validate
let herbsStr = herbsMatch[1];

// Write as window.HERB_DB
const output = `/* Auto-generated from src/data/herbs.ts — do not edit directly */
const HERBS = ${herbsStr};
window.HERB_DB = HERBS;
`;

const outPath = path.join(__dirname, '../public/herbs-data.js');
fs.writeFileSync(outPath, output);

const size = (fs.statSync(outPath).size / 1024).toFixed(1);
// Count top-level records, not occurrences of "name:" — the Ayurvedic
// layer added a nested `sanskrit_name:` key, which made the old
// substring count report 274 herbs for a file holding 248.
const recordCount = (herbsStr.match(/\n\s*id:\s*\d+/g) || []).length;
console.log(`✓ herbs-data.js written — ${size} KB — ${recordCount} herbs`);

// ── Also emit a Node-safe copy for the private server engine ───────
// public/herbs-data.js uses `window.HERB_DB = HERBS` which crashes in
// Node (no window). src/server/formula-engine/ needs to require the
// data from a Netlify function context, so we also emit a plain
// module.exports copy here. Both files are byte-equivalent in the
// HERBS payload; only the export wrapper differs.
//
// This file is SERVER-ONLY. Nothing under src/server/ is imported by
// any client (React or static-HTML) code — the whole subtree is
// invisible to the Vite client bundle by construction.
const serverOutput = `/* Auto-generated from src/data/herbs.ts — do not edit directly.
 * SERVER-ONLY: this file lives under src/server/ and must never be
 * imported by client code. The Vite client bundle does not touch
 * src/server/**.
 */
const HERBS = ${herbsStr};
module.exports = HERBS;
`;
const serverPath = path.join(__dirname, '../src/server/herb-data/herbs.generated.cjs');
// Ensure the destination dir exists so a fresh clone works.
fs.mkdirSync(path.dirname(serverPath), { recursive: true });
fs.writeFileSync(serverPath, serverOutput);
const serverSize = (fs.statSync(serverPath).size / 1024).toFixed(1);
console.log(`✓ src/server/herb-data/herbs.generated.cjs written — ${serverSize} KB (Node-safe copy for the private engine)`);
