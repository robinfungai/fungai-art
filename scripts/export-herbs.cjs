/**
 * Converts src/data/herbs.ts → public/herbs-data.js
 * Strips TypeScript syntax with regex, outputs window.HERB_DB = [...]
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
console.log(`✓ herbs-data.js written — ${size} KB — ${js.split("name:").length - 1} herbs`);
