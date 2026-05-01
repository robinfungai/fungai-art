const fs = require('fs');
const path = require('path');

const herbsPath = path.resolve(__dirname, '../src/data/herbs.ts');

function extractHerbsFromFile() {
  const content = fs.readFileSync(herbsPath, 'utf-8');

  const pool = [];

  // Find all herb objects by matching the pattern: { id: NUMBER, ... caution_level: "..." }
  // This regex finds each herb object from opening brace to closing brace
  const herbPattern = /\{\s*id:\s*(\d+),[\s\S]*?caution_level:\s*['"]([^'"]+)['"]/g;

  let match;
  while ((match = herbPattern.exec(content)) !== null) {
    const herbBlock = match[0];
    const id = parseInt(match[1], 10);
    const cautionLevel = match[2];

    // Extract name from the herb block
    const nameMatch = herbBlock.match(/name:\s*['"]([^'"]+)['"]/);
    if (!nameMatch) continue;
    const name = nameMatch[1];

    // Extract primary_functions array
    const primaryFuncsMatch = herbBlock.match(/primary_functions:\s*\[([\s\S]*?)\]/);
    const primaryFuncs = extractArrayStrings(primaryFuncsMatch ? primaryFuncsMatch[1] : '');

    // Extract energetics array
    const energeticsMatch = herbBlock.match(/energetics:\s*\[([\s\S]*?)\]/);
    const energetics = extractArrayStrings(energeticsMatch ? energeticsMatch[1] : '');

    // Extract tcm_meridians array
    const meridiansMatch = herbBlock.match(/tcm_meridians:\s*\[([\s\S]*?)\]/);
    const meridians = extractArrayStrings(meridiansMatch ? meridiansMatch[1] : '');

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
