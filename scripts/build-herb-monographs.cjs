#!/usr/bin/env node
/**
 * scripts/build-herb-monographs.cjs
 *
 *   node scripts/build-herb-monographs.cjs          # report only
 *   node scripts/build-herb-monographs.cjs --apply
 *
 * Gives every herb a monograph page, generated from its herbs.ts record.
 *
 * ── THE PROBLEM THIS SOLVES ──────────────────────────────────────
 * The repo has two layers and they cover different plants:
 *
 *   public/home/markdowns all plants/   128 long-form monographs, hand-written
 *   src/data/herbs.ts                   245 structured records
 *
 * So ~117 herbs have a record and no page. MYCO reads both, which means a
 * question about one of those herbs reaches five short database chunks
 * while a question about Ashwagandha reaches a 250-line monograph.
 *
 * ── IT WRITES NOTHING NEW ────────────────────────────────────────
 * Every sentence in a generated file comes from the record. Nothing is
 * invented, inferred or recalled — this is a RENDERER. That matters
 * because these pages feed a knowledge base behind a shop selling
 * ingestibles, and a generated paragraph that sounded authoritative but
 * came from a model's memory would be indistinguishable from a sourced
 * one once it was on disk.
 *
 * ── IT NEVER TOUCHES A HAND-WRITTEN FILE ─────────────────────────
 * A herb that already has a monograph is skipped. Generated files carry a
 * front-matter marker and land in a `generated/` subfolder, so the two
 * are never confused and a later hand-written monograph simply wins.
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const MONO_DIR  = path.join(ROOT, 'public', 'home', 'markdowns all plants');
const OUT_DIR   = path.join(MONO_DIR, 'generated');
const HERBS     = require(path.join(ROOT, 'src', 'server', 'herb-data', 'herbs.generated.cjs'));
const MARKER    = '<!-- generated from src/data/herbs.ts by scripts/build-herb-monographs.cjs -->';

const nrm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);

/** Which herbs already have a hand-written monograph, matched the way
 *  build-entity-map does: by the H1 title and by the filename. */
function existingCoverage() {
  const covered = new Set();
  if (!fs.existsSync(MONO_DIR)) return covered;
  for (const f of fs.readdirSync(MONO_DIR)) {
    if (!f.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(MONO_DIR, f), 'utf8');
    const title = (raw.match(/^#\s+(.+)$/m) || [, ''])[1];
    const names = [title.replace(/\(.*$/, ''), f.replace(/\.md$/, '')]
      .flatMap(s => String(s).split('/'));
    for (const n of names) {
      const k = nrm(n.replace(/\b(full|individual|master|monograph|complete|final)\b/gi, ''));
      if (k.length >= 4) covered.add(k);
    }
  }
  return covered;
}

const list = v => (Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []));
const bullets = v => list(v).map(x => '- ' + String(x).trim()).join('\n');

function render(h) {
  const L = [];
  const push = (heading, body) => { if (body && String(body).trim()) L.push('## ' + heading + '\n\n' + String(body).trim() + '\n'); };

  L.push('# ' + h.name + (h.botanical ? ' (' + h.botanical + ')' : ''));
  L.push('');
  L.push(MARKER);
  L.push('<!-- Not hand-written. Every line below is rendered from this herb\'s');
  L.push('     record in src/data/herbs.ts. To change the content, change the');
  L.push('     record. To replace this page with a real monograph, write one in');
  L.push('     the parent folder and this file stops being used. -->');
  L.push('');

  const idBits = [
    h.aliases && h.aliases.length ? 'Also known as: ' + h.aliases.join(', ') : '',
    h.family ? 'Family: ' + h.family : '',
    h.origin_region ? 'Origin: ' + h.origin_region : '',
    h.flavor_profile ? 'Flavour: ' + h.flavor_profile : '',
    h.onset_time ? 'Onset: ' + h.onset_time : '',
    h.evidence_grade ? 'Evidence grade: ' + h.evidence_grade : '',
    h.caution_level ? 'Caution level: ' + h.caution_level : '',
    h.safe_pregnancy === false ? 'Pregnancy: avoid' : (h.safe_pregnancy === true ? 'Pregnancy: considered safe' : ''),
  ].filter(Boolean);
  push('BOTANICAL & IDENTIFICATION', idBits.map(b => '- ' + b).join('\n'));

  const tcm = [
    h.tcm_meridians && h.tcm_meridians.length ? 'Meridians: ' + h.tcm_meridians.join(', ') : '',
    h.tcm_element ? 'Element: ' + h.tcm_element : '',
    h.energetics && h.energetics.length ? 'Energetics: ' + h.energetics.join(', ') : '',
  ].filter(Boolean);
  push('TCM FRAMEWORK', tcm.map(b => '- ' + b).join('\n'));

  push('KEY BENEFITS', bullets(h.primary_functions) +
    (list(h.secondary_benefits).length ? '\n\nSecondary:\n\n' + bullets(h.secondary_benefits) : ''));

  push('PHARMACOLOGICAL PROFILE', h.pharmacology);

  const prep = [
    h.best_preparation ? 'Best preparation: ' + h.best_preparation : '',
    h.dosage_range ? 'Traditional range: ' + h.dosage_range : '',
  ].filter(Boolean).join('\n\n');
  push('DOSAGE & PREPARATION', prep);

  const safety = [
    list(h.contraindications).length ? 'Contraindications:\n\n' + bullets(h.contraindications) : '',
    list(h.herb_to_drug_interactions).length ? 'Drug interactions:\n\n' + bullets(h.herb_to_drug_interactions) : '',
    list(h.herb_to_herb_caution).length ? 'Herb-to-herb cautions:\n\n' + bullets(h.herb_to_herb_caution) : '',
  ].filter(Boolean).join('\n\n');
  push('CONTRAINDICATIONS & INTERACTIONS', safety);

  push('SYNERGIES', bullets(h.herb_to_herb_synergy));

  if (h.ayurveda) {
    const a = h.ayurveda;
    const rows = [
      a.sanskrit_name ? 'Sanskrit name: ' + a.sanskrit_name : '',
      a.synonyms && a.synonyms.length ? 'Synonyms: ' + a.synonyms.join(', ') : '',
      a.part_used ? 'Part used: ' + a.part_used : '',
      a.rasa ? 'Rasa: ' + list(a.rasa).join(', ') : '',
      a.guna ? 'Guna: ' + list(a.guna).join(', ') : '',
      a.virya ? 'Virya: ' + a.virya : '',
      a.vipaka ? 'Vipaka: ' + a.vipaka : '',
      a.karma ? 'Karma: ' + list(a.karma).join(', ') : '',
      a.dosha_action ? 'Dosha action: ' + a.dosha_action : '',
      a.therapeutic_uses ? 'Classical indications: ' + list(a.therapeutic_uses).join(', ') : '',
      a.classical_formulations ? 'Classical formulations: ' + list(a.classical_formulations).join(', ') : '',
      a.api_dose ? 'API dose: ' + a.api_dose : '',
      a.quality_standards ? 'Quality standards: ' + a.quality_standards : '',
      a.api_reference ? 'Reference: ' + a.api_reference : '',
    ].filter(Boolean);
    push('AYURVEDIC PHARMACOPOEIA', rows.map(r => '- ' + r).join('\n'));
  }

  push('RESEARCH GRADE & EVIDENCE SUMMARY', h.status);
  push('SPIRITUAL LAYER & PHILOSOPHICAL TEACHING',
    (h.epithet ? '*' + h.epithet + '*\n\n' : '') + (h.spiritual_layer || ''));

  if (list(h.references).length) push('REFERENCES', bullets(h.references));
  if (list(h.research_notes).length) push('RESEARCH NOTES', bullets(h.research_notes));

  return L.join('\n') + '\n';
}

function main() {
  const apply = process.argv.includes('--apply');
  const covered = existingCoverage();

  const todo = [];
  for (const h of HERBS) {
    const keys = [h.name, ...(h.aliases || [])].flatMap(n => String(n).split('/')).map(nrm).filter(k => k.length >= 4);
    if (keys.some(k => covered.has(k))) continue;
    todo.push(h);
  }

  console.log('\nherbs                    : ' + HERBS.length);
  console.log('already have a monograph : ' + (HERBS.length - todo.length));
  console.log('to generate              : ' + todo.length + '\n');

  // Flag the ones whose generated page will be thin, so the gap is visible
  // rather than papered over by a page that exists but says little.
  const thin = todo.filter(h => !h.pharmacology || !list(h.primary_functions).length);
  if (thin.length) {
    console.log('thin records (no pharmacology or no primary_functions) — the page will be short:');
    for (const h of thin) console.log('  ' + h.id + ' ' + h.name);
    console.log('');
  }

  if (!apply) { console.log('DRY RUN. Re-run with --apply to write ' + todo.length + ' files to');
                console.log(path.relative(ROOT, OUT_DIR)); return; }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let written = 0, bytes = 0;
  for (const h of todo) {
    const text = render(h);
    const file = path.join(OUT_DIR, slug(h.name) + '.md');
    fs.writeFileSync(file, text);
    written++; bytes += text.length;
  }
  console.log('wrote ' + written + ' monographs (' + (bytes / 1024).toFixed(0) + ' KB) to ' + path.relative(ROOT, OUT_DIR));
  console.log('Next: npm run build:myco-kb  (they become MYCO chunks)');
}

main();
