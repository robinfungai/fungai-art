// scripts/build-myco-kb.cjs
//
// Builds MYCO's KNOWLEDGE LAYER — the retrieval corpus the agent
// answers from. Run by `npm run build:myco-kb` (part of `npm run build`).
//
//   sources                                    → chunks
//   ─────────────────────────────────────────────────────────────
//   src/data/herbs.ts (via herbs.generated)    → 5 chunks per herb
//   public/home/markdowns all plants/*.md      → one per ## section
//   knowledge/proprietary/*.md                 → one per ## section
//
// Every chunk carries a SOURCE TYPE, which is what lets MYCO say
// "this is established evidence" vs "this is traditional knowledge"
// vs "this is our own formulation" instead of blending all three:
//
//   evidence       — pharmacology, mechanisms, trials, clinical notes
//   traditional    — TCM/Ayurvedic framing, energetics, spiritual layer
//   safety         — contraindications, interactions, cautions
//   preparation    — extraction, ratios, dosage ranges
//   identification — botany, part used, harvest, quality markers
//   proprietary    — Fungai Art's own protocols, formulas, observations
//
// Output: src/server/myco/kb.generated.cjs (module.exports = { chunks,
// version }). Committed like herbs.generated.cjs so Netlify functions
// bundle it without a build step of their own.

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const MONOGRAPHS  = path.join(ROOT, 'public', 'home', 'markdowns all plants');
const PROPRIETARY = path.join(ROOT, 'knowledge', 'proprietary');
const OUT         = path.join(ROOT, 'src', 'server', 'myco', 'kb.generated.cjs');

const MAX_CHUNK_CHARS = 1400;   // ~350 tokens — big enough to hold a whole
                                // section, small enough that 6 chunks fit a prompt
const MIN_CHUNK_CHARS = 60;     // below this a section is a stub, not knowledge

// ── Monograph section → source type ──────────────────────────────
// Headings are near-consistent across the 130 files; anything
// unmatched lands in 'general' rather than being silently dropped.
const SECTION_TYPES = [
  [/contraindicat|interaction|safety|warning|toxicit/i,            'safety'],
  [/dosage|preparation|dosing|extract|tea|infusion|tincture/i,     'preparation'],
  [/botanical|identification|harvest|quality|storage/i,            'identification'],
  [/tcm|five element|spiritual|philosoph|historical|traditional/i, 'traditional'],
  [/pharmacolog|mechanism|research|evidence|clinical|benefit/i,    'evidence'],
];
// Sections that are instructions to a previous AI integration rather
// than knowledge about the plant — they pollute retrieval.
const SKIP_SECTION = /^(ai app integration|practical everything to-do|master monograph)/i;

function sectionType(heading) {
  for (const [re, type] of SECTION_TYPES) if (re.test(heading)) return type;
  return 'general';
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48);
}

// Split an over-long section on paragraph boundaries so no chunk is
// truncated mid-sentence.
function splitLong(text) {
  if (text.length <= MAX_CHUNK_CHARS) return [text];
  const parts = [];
  let buf = '';
  for (const para of text.split(/\n{2,}/)) {
    if (buf && (buf.length + para.length + 2) > MAX_CHUNK_CHARS) { parts.push(buf.trim()); buf = ''; }
    if (para.length > MAX_CHUNK_CHARS) {
      // A single giant paragraph — fall back to sentence packing.
      let sbuf = '';
      for (const sent of para.split(/(?<=[.!?])\s+/)) {
        if (sbuf && (sbuf.length + sent.length + 1) > MAX_CHUNK_CHARS) { parts.push(sbuf.trim()); sbuf = ''; }
        sbuf += (sbuf ? ' ' : '') + sent;
      }
      if (sbuf.trim()) parts.push(sbuf.trim());
    } else {
      buf += (buf ? '\n\n' : '') + para;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

const chunks = [];
function addChunk(c) {
  const text = String(c.text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < MIN_CHUNK_CHARS) return;
  chunks.push({
    id:      c.id,
    title:   c.title,
    section: c.section || '',
    type:    c.type,
    source:  c.source,          // human-readable provenance, shown in citations
    herb:    c.herb || null,    // herb display name, for name-match boosting
    text,
  });
}

// ── 1 · Herb database (the curated 198) ──────────────────────────
function buildHerbChunks() {
  const mod = require(path.join(ROOT, 'src', 'server', 'herb-data', 'herbs.generated.cjs'));
  const herbs = mod.HERBS || mod.herbs || (Array.isArray(mod) ? mod : Object.values(mod)[0]);
  if (!Array.isArray(herbs)) throw new Error('herbs.generated.cjs did not yield an array');

  const list = v => (Array.isArray(v) ? v.filter(Boolean).join('; ') : (v || ''));
  for (const h of herbs) {
    const base = { herb: h.name, source: 'Fungai herb database · ' + h.name };
    const id = slugify(h.id || h.name);

    addChunk({ ...base, id: 'herb:' + id + ':identity', type: 'identification',
      title: h.name + ' — identity', section: 'Identity',
      text: [
        h.name + (h.botanical ? ' (' + h.botanical + ')' : ''),
        h.family ? 'Family: ' + h.family : '',
        h.origin_region ? 'Origin: ' + h.origin_region : '',
        h.status ? 'Status: ' + h.status : '',
        h.flavor_profile ? 'Flavour: ' + list(h.flavor_profile) : '',
        h.regional_affinity ? 'Regional affinity: ' + list(h.regional_affinity) : '',
      ].filter(Boolean).join('\n') });

    addChunk({ ...base, id: 'herb:' + id + ':actions', type: 'evidence',
      title: h.name + ' — actions and pharmacology', section: 'Actions',
      text: [
        'Primary functions: ' + list(h.primary_functions),
        h.secondary_benefits ? 'Secondary: ' + list(h.secondary_benefits) : '',
        h.pharmacology ? 'Pharmacology: ' + h.pharmacology : '',
        h.evidence_grade ? 'Evidence grade (our grading): ' + h.evidence_grade : '',
        h.onset_time ? 'Onset: ' + h.onset_time : '',
      ].filter(Boolean).join('\n') });

    addChunk({ ...base, id: 'herb:' + id + ':tradition', type: 'traditional',
      title: h.name + ' — traditional framing', section: 'Tradition',
      text: [
        h.tcm_meridians ? 'TCM meridians: ' + list(h.tcm_meridians) : '',
        h.tcm_element ? 'TCM element: ' + h.tcm_element : '',
        h.energetics ? 'Energetics: ' + list(h.energetics) : '',
        h.energy_pattern ? 'Energy pattern: ' + h.energy_pattern : '',
        h.spiritual_layer ? 'Spiritual layer: ' + h.spiritual_layer : '',
      ].filter(Boolean).join('\n') });

    addChunk({ ...base, id: 'herb:' + id + ':safety', type: 'safety',
      title: h.name + ' — safety', section: 'Safety',
      text: [
        h.caution_level ? 'Caution level: ' + h.caution_level : '',
        h.contraindications ? 'Contraindications: ' + list(h.contraindications) : '',
        h.herb_to_drug_interactions ? 'Drug interactions: ' + list(h.herb_to_drug_interactions) : '',
        h.herb_to_herb_caution ? 'Herb-herb cautions: ' + list(h.herb_to_herb_caution) : '',
        h.safe_pregnancy !== undefined ? 'Pregnancy: ' + h.safe_pregnancy : '',
      ].filter(Boolean).join('\n') });

    addChunk({ ...base, id: 'herb:' + id + ':preparation', type: 'preparation',
      title: h.name + ' — preparation', section: 'Preparation',
      text: [
        h.best_preparation ? 'Best preparation: ' + list(h.best_preparation) : '',
        h.dosage_range ? 'Traditional range: ' + h.dosage_range : '',
        h.herb_to_herb_synergy ? 'Synergies: ' + list(h.herb_to_herb_synergy) : '',
      ].filter(Boolean).join('\n') });
  }
}

// ── 2 · Long-form monographs ─────────────────────────────────────
function buildMonographChunks() {
  if (!fs.existsSync(MONOGRAPHS)) return;
  for (const file of fs.readdirSync(MONOGRAPHS).filter(f => f.endsWith('.md'))) {
    const raw  = fs.readFileSync(path.join(MONOGRAPHS, file), 'utf8');
    const slug = slugify(file.replace(/\.md$/, ''));
    // Title line: "# ASHWAGANDHA (Withania somnifera)"
    const titleLine = (raw.match(/^#\s+(.+)$/m) || [, file])[1].trim();
    const herbName  = titleLine.replace(/\(.*$/, '').trim();
    // Split on ## headings, keeping the heading with its body.
    const parts = raw.split(/\n(?=##\s+)/);
    let n = 0;
    for (const part of parts) {
      const m = part.match(/^##\s+(.+)/);
      if (!m) continue;
      const heading = m[1].replace(/[⚠️*_`]/g, '').trim();
      if (SKIP_SECTION.test(heading)) continue;
      const body = part.slice(m[0].length).replace(/^\s*-{3,}\s*$/gm, '').trim();
      for (const piece of splitLong(body)) {
        addChunk({
          id:      'mono:' + slug + ':' + (++n),
          title:   herbName + ' — ' + heading.toLowerCase(),
          section: heading,
          type:    sectionType(heading),
          source:  'Monograph · ' + titleLine,
          herb:    herbName,
          text:    piece,
        });
      }
    }
  }
}

// ── 3 · Fungai Art's own knowledge ───────────────────────────────
// Everything under knowledge/proprietary is OURS — protocols, house
// formulas, lab observations, SOPs. Always typed 'proprietary' so MYCO
// never presents it as published science.
function buildProprietaryChunks() {
  if (!fs.existsSync(PROPRIETARY)) return;
  for (const file of fs.readdirSync(PROPRIETARY).filter(f => f.endsWith('.md'))) {
    const raw  = fs.readFileSync(path.join(PROPRIETARY, file), 'utf8');
    const slug = slugify(file.replace(/\.md$/, ''));
    const titleLine = (raw.match(/^#\s+(.+)$/m) || [, file])[1].trim();
    const parts = raw.split(/\n(?=##\s+)/);
    let n = 0;
    for (const part of parts) {
      const m = part.match(/^##\s+(.+)/);
      if (!m) continue;
      const heading = m[1].replace(/[*_`]/g, '').trim();
      const body = part.slice(m[0].length).trim();
      for (const piece of splitLong(body)) {
        addChunk({
          id:      'own:' + slug + ':' + (++n),
          title:   titleLine + ' — ' + heading.toLowerCase(),
          section: heading,
          type:    'proprietary',
          source:  'Fungai Art house knowledge · ' + titleLine,
          text:    piece,
        });
      }
    }
  }
}

buildHerbChunks();
buildMonographChunks();
buildProprietaryChunks();

// Stable version marker — changes whenever the corpus changes, so a
// logged answer can be traced to the exact knowledge it was given.
const crypto = require('crypto');
const digest = crypto.createHash('sha256')
  .update(chunks.map(c => c.id + ':' + c.text.length).join('|'))
  .digest('hex').slice(0, 12);
const version = new Date().toISOString().slice(0, 7) + '-' + digest;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT,
  '// GENERATED by scripts/build-myco-kb.cjs — do not edit by hand.\n' +
  '// Rebuild with: npm run build:myco-kb\n' +
  'module.exports = ' + JSON.stringify({ version, chunks }, null, 0) + ';\n');

const byType = {};
for (const c of chunks) byType[c.type] = (byType[c.type] || 0) + 1;
const bytes = fs.statSync(OUT).size;
console.log('MYCO knowledge base built');
console.log('  chunks : ' + chunks.length);
console.log('  version: ' + version);
console.log('  size   : ' + (bytes / 1024 / 1024).toFixed(2) + ' MB');
for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log('  ' + t.padEnd(15) + n);
}
