const fs = require('fs');
const path = require('path');

const herbsPath = path.resolve(__dirname, '../src/data/herbs.ts');

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

    // Extract name
    const nameMatch = section.match(/name:\s*['"]([^'"]+)['"]/);
    if (!nameMatch) continue;
    const name = nameMatch[1];

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
  // Match quoted strings in the array
  const stringMatches = arrayContent.match(/['"][^'"]*['"]/g) || [];

  for (let match of stringMatches) {
    result.push(match.slice(1, -1)); // Remove quotes
  }

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
