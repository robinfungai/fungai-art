const fs = require('fs');
const path = require('path');

const herbsPath = path.resolve(__dirname, '../src/data/herbs.ts');

// Legally-restricted / prohibited names — never reach the consumer
// pool. Applied at BUILD time here so the output JSON is safe to load
// on any surface without a runtime filter. Amanita muscaria + Calea
// zacatechichi are intentionally NOT here — Fungai Art offers them
// legally, with opt-in gating enforced by the quiz UI.
const RESTRICTED_NAMES = [
  'psilocybe','psilocybin','psilocin',
  'ayahuasca','banisteriopsis','chacruna','yage','yagé',
  'peyote','lophophora','mescaline','san pedro','trichocereus',
  'salvia divinorum',
  'iboga','tabernanthe','ibogaine',
  'kratom','mitragyna',
  'morning glory seed','ololiuhqui','lsa','hawaiian baby woodrose',
  'toad venom','5-meo-dmt','bufo alvarius',
  'dmt','n,n-dmt',
  'coca leaf','erythroxylum','cocaine',
  'acorus calamus','calamus root',
];
function isRestricted(name, botanical){
  const s = (String(name || '') + ' ' + String(botanical || '')).toLowerCase();
  return RESTRICTED_NAMES.some(r => s.includes(r));
}

function extractHerbsFromFile() {
  const content = fs.readFileSync(herbsPath, 'utf-8');

  const pool = [];

  // Split by herb comment blocks (e.g., "// BILBERRY")
  const sections = content.split('// ─────────────────────────────────────────────\n  // ');

  for (let section of sections) {
    // Extract herb name and full object
    const lines = section.split('\n');

    // Look for id: pattern
    const idMatch = section.match(/id:\s*(\d+)/);
    if (!idMatch) continue;

    const id = parseInt(idMatch[1], 10);

    // Extract name — handle BOTH single-quoted (name: 'Bilberry') and
    // double-quoted (name: "Lion's Mane") entries. Previous regex
    // used [^'"] which truncates apostrophe names to "St. John",
    // "Cat", "Butcher". Now single- and double-quoted paths are split
    // so an apostrophe inside a double-quoted string doesn't terminate.
    const nameMatch = section.match(/name:\s*(?:'([^']+)'|"([^"]+)")/);
    if (!nameMatch) continue;
    const name = nameMatch[1] || nameMatch[2];

    // Extract botanical for the restricted-name check
    const botMatch = section.match(/botanical:\s*(?:'([^']+)'|"([^"]+)")/);
    const botanical = botMatch ? (botMatch[1] || botMatch[2]) : '';

    // Skip restricted herbs at build time — no runtime filter needed.
    if (isRestricted(name, botanical)) {
      console.log('  · restricted, skipping: ' + name);
      continue;
    }

    // Extract primary_functions array
    const primaryFuncsMatch = section.match(/primary_functions:\s*\[([\s\S]*?)\],\s*secondary_benefits/);
    const primaryFuncs = extractArrayStrings(primaryFuncsMatch ? primaryFuncsMatch[1] : '');

    // Extract energetics array
    const energeticsMatch = section.match(/energetics:\s*\[([\s\S]*?)\],/);
    const energetics = extractArrayStrings(energeticsMatch ? energeticsMatch[1] : '');

    // Extract tcm_meridians array
    const meridiansMatch = section.match(/tcm_meridians:\s*\[([\s\S]*?)\],/);
    const meridians = extractArrayStrings(meridiansMatch ? meridiansMatch[1] : '');

    // Extract caution_level
    const cautionMatch = section.match(/caution_level:\s*['"]([^'"]+)['"]/);
    if (!cautionMatch) continue;
    const cautionLevel = cautionMatch[1];

    pool.push({
      id,
      name,
      primary_functions: primaryFuncs,
      energetics,
      tcm_meridians: meridians,
      caution_level: cautionLevel
    });
  }

  return pool;
}

function extractArrayStrings(arrayContent) {
  const result = [];
  // Match single- OR double-quoted strings separately so apostrophes
  // inside double-quoted entries ("Lion's mane synergy") don't split
  // the match mid-word.
  const single = arrayContent.match(/'([^']*)'/g) || [];
  const double = arrayContent.match(/"([^"]*)"/g) || [];
  for (const m of single) result.push(m.slice(1, -1));
  for (const m of double) result.push(m.slice(1, -1));
  return result;
}

function main() {
  try {
    const pool = extractHerbsFromFile();

    if (pool.length === 0) {
      console.error('✗ Failed to extract any herbs from herbs.ts');
      process.exit(1);
    }

    const outputPath = path.resolve(__dirname, '../public/herb-engine-pool.json');

    // Ensure public directory exists
    const publicDir = path.dirname(outputPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(pool, null, 2), 'utf-8');
    console.log(`✓ Built herb pool: ${pool.length} herbs written to public/herb-engine-pool.json`);
  } catch (err) {
    console.error('✗ Error building herb pool:', err.message);
    process.exit(1);
  }
}

main();
