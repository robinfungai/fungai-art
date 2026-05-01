import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Read the herbs.ts file and extract HERBS data dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const herbsPath = path.resolve(__dirname, '../src/data/herbs.ts');

interface HerbPoolEntry {
  id: number;
  name: string;
  primary_functions: string[];
  energetics: string[];
  tcm_meridians: string[];
  caution_level: 'LOW' | 'LOW-MEDIUM' | 'MEDIUM' | 'MEDIUM-HIGH' | 'HIGH' | 'VERY HIGH';
}

function buildHerbPool(): void {
  // Read the herbs.ts file as text
  const herbsContent = fs.readFileSync(herbsPath, 'utf-8');

  // Extract the HERBS array using a simple regex pattern
  // This finds the export const HERBS array and extracts herb objects
  const herbsMatch = herbsContent.match(/export const HERBS:\s*Herb\[\]\s*=\s*\[([\s\S]*?)\n  \];/);

  if (!herbsMatch) {
    console.error('Could not find HERBS array in herbs.ts');
    process.exit(1);
  }

  // For now, use dynamic import with a workaround
  // Import tsx/node loader or use a different strategy
  console.log('Building herb pool from herbs.ts...');

  // Since direct import is problematic, let's construct the pool by parsing the file
  // Extract herb objects manually (simplified for now)
  const pool: HerbPoolEntry[] = [];

  // Parse individual herb objects from the file
  const herbPattern = /{\s*id:\s*(\d+),[\s\S]*?name:\s*['"]([^'"]+)['"],[\s\S]*?primary_functions:\s*\[([\s\S]*?)\],[\s\S]*?energetics:\s*\[([\s\S]*?)\],[\s\S]*?tcm_meridians:\s*\[([\s\S]*?)\],[\s\S]*?caution_level:\s*['"]([^'"]+)['"]/g;

  let match;
  while ((match = herbPattern.exec(herbsContent)) !== null) {
    const id = parseInt(match[1], 10);
    const name = match[2];
    const primaryFuncs = match[3]
      .split(',')
      .map(s => s.trim())
      .filter(s => s)
      .map(s => s.replace(/^['"]|['"]$/g, ''));
    const energetics = match[4]
      .split(',')
      .map(s => s.trim())
      .filter(s => s)
      .map(s => s.replace(/^['"]|['"]$/g, ''));
    const meridians = match[5]
      .split(',')
      .map(s => s.trim())
      .filter(s => s)
      .map(s => s.replace(/^['"]|['"]$/g, ''));
    const cautionLevel = match[6] as 'LOW' | 'LOW-MEDIUM' | 'MEDIUM' | 'MEDIUM-HIGH' | 'HIGH' | 'VERY HIGH';

    pool.push({
      id,
      name,
      primary_functions: primaryFuncs,
      energetics,
      tcm_meridians: meridians,
      caution_level: cautionLevel
    });
  }

  if (pool.length === 0) {
    console.warn('No herbs extracted; the regex may need adjustment');
  }

  const outputPath = path.resolve(__dirname, '../public/herb-engine-pool.json');
  fs.writeFileSync(outputPath, JSON.stringify(pool, null, 2), 'utf-8');
  console.log(`✓ Built herb pool: ${pool.length} herbs written to public/herb-engine-pool.json`);
}

buildHerbPool();
