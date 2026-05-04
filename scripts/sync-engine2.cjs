/**
 * sync-engine2.cjs
 * Reads herbs.ts → maps each Herb to Engine 2.0's HB format → injects into
 * public/herbal-engine-2/index.html, replacing the existing HB array.
 *
 * Run:  node scripts/sync-engine2.cjs
 * Also runs as part of:  npm run build
 */

const fs   = require('fs');
const path = require('path');

// ─── paths ───────────────────────────────────────────────────────────────────
const HERBS_PATH  = path.resolve(__dirname, '../src/data/herbs.ts');
const ENGINE2     = path.resolve(__dirname, '../public/herbal-engine-2/index.html');

// ─── mushroom names (same set as in App.tsx) ─────────────────────────────────
const MUSHROOMS = new Set([
  'Birch Polypore','Button Mushroom','Chaga','Cordyceps','Enoki','Fu Ling',
  "Lion's Mane",'Maitake','Mesima','Morels','Oyster Mushroom',
  'Red-Belted Polypore','Reishi','Royal Sun Mushroom','Shaggy Bracket',
  'Shaggy Mane','Shiitake','Tinder Fungus','Tremella','Turkey Tail',
  'Willow Bracket','Zhu Ling',
]);

// ─── derive HB fields from Herb data ─────────────────────────────────────────

function makeId(name) {
  return name.toLowerCase()
    .replace(/[()[\]']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function deriveIntentions(funcs, name) {
  const text = (funcs.join(' ') + ' ' + name).toLowerCase();
  const i = [];
  if (/adaptogen|hpa|cortisol|stress resili/.test(text))               i.push('stress');
  if (/sleep|insomnia|sedati|hypnotic|rest/.test(text))                 i.push('sleep');
  if (/energy|fatigue|vitality|stimul|atp/.test(text))                  i.push('energy');
  if (/anxiolytic|anxiety|calm|nervine|gaba/.test(text))                i.push('anxiety');
  if (/mood|depress|antidepress|serotonin|limbic/.test(text))           i.push('mood');
  if (/immune|immunity|antiviral|antimicro|beta.glucan/.test(text))     i.push('immunity');
  if (/cognitive|memory|neuroplast|bdnf|ngf|focus|nootropic/.test(text)) i.push('cognitive');
  if (/digest|carminative|gut|ibs|gastric|bowel/.test(text))            i.push('digestion');
  if (/liver|hepatic|hepatoprotect|detox|bile|lymph/.test(text))        i.push('detox');
  if (/pain|anti.inflamm|cox|lox|analges/.test(text))                   i.push('pain');
  if (/hormon|estrogen|testoster|endocrin|menstrual|lh.mediat|androgen/.test(text)) i.push('hormones');
  if (/skin|beauty|collagen|hair|radianc|tremella/.test(text))          i.push('beauty');
  return [...new Set(i)];
}

function deriveBodyPatterns(energetics) {
  const text = energetics.join(' ').toLowerCase();
  const c = [];
  if (/\bhot\b|^warm|slightly warm/.test(text))     c.push('hot');
  if (/\bcold\b|cool|slightly cool/.test(text))      c.push('cold');
  if (/deplet|nourish|building|restor|tonic/.test(text)) c.push('depleted');
  if (/neutral|balanc|mixed/.test(text))             c.push('mixed');
  if (c.length === 0) c.push('mixed');
  return [...new Set(c)];
}

function deriveContraFlags(contraindications) {
  const text = contraindications.join(' ').toLowerCase();
  const x = [];
  if (/pregnan|breastfeed|lactati/.test(text))       x.push('pregnancy');
  if (/autoimmune|immunosuppress/.test(text))         x.push('autoimmune');
  if (/liver disease|hepatotox|high.*liver/.test(text)) x.push('liver');
  if (/anticoag|blood thin|antiplatelet|aspirin/.test(text)) x.push('anticoag');
  if (/ssri|snri|antidepress|serotonin syndrome|mao/.test(text)) x.push('ssri');
  if (/hypertension|high blood pressure/.test(text)) x.push('hypertension');
  if (/thyroid/.test(text))                           x.push('thyroid');
  if (/kidney disease|renal failure/.test(text))      x.push('kidney');
  if (/bipolar/.test(text))                           x.push('bipolar');
  if (/digoxin/.test(text))                           x.push('digoxin');
  if (/cns depressant|sedative medication|sleep med/.test(text)) x.push('cns_dep');
  if (/oral contraceptive|birth control/.test(text))  x.push('contraceptive');
  if (/dopamine antagonist|antipsychotic/.test(text)) x.push('dopamine_d');
  if (/gallstone/.test(text))                         x.push('gallstones');
  if (/gerd|reflux|peptic/.test(text))                x.push('gerd');
  if (/asteraceae|daisy family/.test(text))           x.push('asteraceae');
  return [...new Set(x)];
}

function deriveTraditions(funcs, botanical) {
  const text = (funcs.join(' ') + ' ' + botanical).toLowerCase();
  const p = [];
  if (/tcm|chinese medicine|traditional chinese|\byin\b|\byang\b|qi |jing/.test(text)) p.push('tcm');
  if (/ayurvedic|ayurveda|rasayana|vata|pitta|kapha|siddha/.test(text))  p.push('ayurvedic');
  if (/european|western herbal|british|german commission|ema|traditional european/.test(text)) p.push('european');
  if (p.length === 0) p.push('european'); // fallback
  return [...new Set(p)];
}

function deriveRatio(cautionLevel) {
  const map = { 'LOW': 22, 'LOW-MEDIUM': 18, 'MEDIUM': 15, 'MEDIUM-HIGH': 12, 'HIGH': 8, 'VERY HIGH': 5 };
  return map[cautionLevel] ?? 15;
}

function deriveCategory(funcs, name, isMushr) {
  if (isMushr) return 'Mushroom';
  const text = (funcs.join(' ') + ' ' + name).toLowerCase();
  if (/adaptogen/.test(text))     return 'Adaptogen';
  if (/anti.inflamm/.test(text))  return 'Anti-inflammatory';
  if (/antimicrobial|antifung/.test(text)) return 'Antimicrobial';
  if (/nervine|anxiolytic/.test(text))  return 'Nervine';
  if (/cognitive|nootropic/.test(text)) return 'Cognitive';
  if (/digest|carminative/.test(text))  return 'Digestive';
  if (/hepatic|hepatoprotect/.test(text)) return 'Hepatic';
  if (/immune/.test(text))        return 'Immune';
  if (/hormon|endocrin/.test(text)) return 'Hormonal';
  if (/respiratory|expector/.test(text)) return 'Respiratory';
  if (/urinary|diuretic/.test(text)) return 'Urinary';
  return 'Tonic';
}

// ─── parse herbs.ts ───────────────────────────────────────────────────────────
function parseHerbs() {
  const src = fs.readFileSync(HERBS_PATH, 'utf-8');
  const herbs = [];

  // Split on herb object boundaries (each starts with { id: N, )
  const blocks = src.split(/(?=\s*\{\s*\n\s*id:\s*\d+)/);

  for (const block of blocks) {
    const idM    = block.match(/id:\s*(\d+)/);
    if (!idM) continue;

    const nameM  = block.match(/name:\s*['"]([^'"]+)['"]/);
    const botM   = block.match(/botanical:\s*['"]([^'"]+)['"]/);
    const cautM  = block.match(/caution_level:\s*['"]([^'"]+)['"]/);
    const pregM  = block.match(/safe_pregnancy:\s*(true|false|null)/);
    if (!nameM || !botM || !cautM) continue;

    const name      = nameM[1];
    const botanical = botM[1];
    const caution   = cautM[1];
    const safePregS = pregM ? pregM[1] : 'null';
    const safePreg  = safePregS === 'true' ? true : safePregS === 'false' ? false : null;
    const isMushr   = MUSHROOMS.has(name);
    const restricted = ['HIGH','VERY HIGH'].includes(caution);

    // Extract string arrays
    const funcs  = extractStringArray(block, 'primary_functions');
    const energ  = extractStringArray(block, 'energetics');
    const contra = extractStringArray(block, 'contraindications');
    const merids = extractStringArray(block, 'tcm_meridians');

    const actionRaw = funcs[0] || '';
    // Short action: strip everything after " — " or "."
    const action = actionRaw.split(' — ')[0].split('; ')[0].trim().slice(0, 120);

    herbs.push({
      id:         makeId(name),
      n:          name,
      b:          botanical.split('(')[0].split('—')[0].trim(),
      cat:        deriveCategory(funcs, name, isMushr),
      t:          merids,
      i:          deriveIntentions(funcs, name),
      c:          deriveBodyPatterns(energ),
      x:          deriveContraFlags(contra),
      p:          deriveTraditions(funcs, botanical),
      m:          isMushr,
      r:          deriveRatio(caution),
      restricted,
      a:          action,
      ...(restricted ? { restrictedNote: 'Practitioner context — use clinical judgement.' } : {}),
    });
  }

  return herbs;
}

function extractStringArray(block, field) {
  const re = new RegExp(field + `:\\s*\\[([\\s\\S]*?)\\]`);
  const m = block.match(re);
  if (!m) return [];
  return (m[1].match(/['"]([^'"]*)['"]/g) || []).map(s => s.slice(1,-1));
}

// ─── inject into Engine 2 HTML ────────────────────────────────────────────────
function injectHB(herbs) {
  let html = fs.readFileSync(ENGINE2, 'utf-8');
  const json = JSON.stringify(herbs);

  // Use string indices instead of regex — the minified JSON can contain ]
  // sequences that confuse non-greedy regex matching on second run.
  const OPEN  = 'const HB = [';
  const start = html.indexOf(OPEN);
  if (start === -1) {
    console.error('✗  Could not find "const HB = [" marker in Engine 2 HTML.');
    process.exit(1);
  }
  // Find the matching closing ]; by bracket-counting from the opening [
  let depth = 0, i = start + OPEN.length - 1; // point at '['
  let inStr = false, escape = false;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inStr) { escape = true; continue; }
    if (ch === '"' && !escape) { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) break; }
  }
  // i now points at the closing ], expect ';' at i+1
  if (i >= html.length || html[i+1] !== ';') {
    console.error('✗  Could not find closing ]; for const HB array.');
    process.exit(1);
  }
  const end = i + 2; // position after ';'
  const replaced = html.slice(0, start) + `const HB = ${json};` + html.slice(end);
  fs.writeFileSync(ENGINE2, replaced, 'utf-8');
}

// ─── main ─────────────────────────────────────────────────────────────────────
const herbs = parseHerbs();
if (herbs.length === 0) { console.error('✗  No herbs parsed'); process.exit(1); }
injectHB(herbs);
console.log(`✓  Engine 2 synced: ${herbs.length} herbs injected into herbal-engine-2/index.html`);
