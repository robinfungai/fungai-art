#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────
// port-missing-herbs.js
//
// The practitioner engine (/herbal-engine-2) carries 201 herb entries
// in its inline HB array. The source-of-truth rich file
// (src/data/herbs.ts → public/herbs-data.js) currently holds 152 fully-
// documented entries. This script generates the missing ~49 as MINIMAL
// STUB entries appended to public/herbs-data.js so /find-your-formula's
// picker can score them.
//
// Stub shape:
//   { id, name, botanical, tcm_meridians, tcm_element, energetics,
//     primary_functions, secondary_benefits, pharmacology, flavor_profile,
//     contraindications, herb_interactions, dosage_range, spiritual_layer,
//     best_preparation, _stub: true }
//
// Stubs use HB's condensed metadata + primary_functions inferred from
// HB.i (intention tags) + a marker flag `_stub: true` so future work
// can identify which herbs still need enrichment.
//
// Idempotent — running twice won't duplicate. Reads the current file
// each run, checks by name, only appends new ones.
// ────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const HERBS_JS = path.join(REPO, 'public', 'herbs-data.js');
const ENGINE  = path.join(REPO, 'public', 'herbal-engine-2', 'index.html');

// Full pharmacology data for Ayurvedic herbs — see ayurvedic-herbs-data.cjs
const ENRICHMENT = require('./ayurvedic-herbs-data.cjs');

// ── Extract HB from engine-2 ─────────────────────────────
const engineHtml = fs.readFileSync(ENGINE, 'utf8');
const m = engineHtml.match(/const HB\s*=\s*(\[[\s\S]*?\]);/);
if (!m) { console.error('HB not found in engine-2'); process.exit(1); }
const HB = JSON.parse(m[1]);

// ── Read current rich file ───────────────────────────────
const herbsJs = fs.readFileSync(HERBS_JS, 'utf8');

// Extract existing names (case-insensitive) + ids
const existingNames = new Set();
const existingIds   = new Set();
// Match either single-quoted OR double-quoted name values — the rich
// file uses single quotes for names without apostrophes and double
// quotes for names WITH apostrophes ("Lion's Mane"). Previous regex
// only handled single-only and truncated apostrophe names → false-
// negatives → duplicate stub imports of Lion's Mane / St. John's Wort.
const nameRe = /name:\s*(?:'([^']+)'|"([^"]+)")/g;
let mm; while ((mm = nameRe.exec(herbsJs))) existingNames.add((mm[1] || mm[2]).toLowerCase().trim());
const idRe = /^\s*id:\s*(\d+),?\s*$/gm;
while ((mm = idRe.exec(herbsJs))) existingIds.add(Number(mm[1]));

console.log('HB entries:', HB.length);
console.log('rich file names:', existingNames.size);
console.log('rich file ids:',   existingIds.size);

// ── Find missing HB entries ──────────────────────────────
function nameKey(s){ return String(s || '').toLowerCase().replace(/[^a-z ]/g,'').trim(); }
const existingKeys = new Set([...existingNames].map(nameKey));

// Extract REAL herb objects from herbs-data.js (parse `id: N,\n name:` blocks)
// not just any `name:` occurrence — those pick up name mentions inside
// synergy strings and give false positives.
const realNamesFromBlocks = new Set();
const blockRe = /id:\s*\d+,\s*[\r\n]+\s*name:\s*(?:'([^']+)'|"([^"]+)")/g;
let bm; while ((bm = blockRe.exec(herbsJs))) realNamesFromBlocks.add((bm[1] || bm[2]).toLowerCase().trim());
console.log('rich file REAL herb-object entries:', realNamesFromBlocks.size);

const realKeys = new Set([...realNamesFromBlocks].map(nameKey));
const realFirstWords = new Set([...realKeys].map(k => k.split(/\s+/)[0]));

const missing = HB.filter(h => {
  const key = nameKey(h.n);
  if (!key) return false;
  if (realKeys.has(key)) return false;
  const firstWord = key.split(/\s+/)[0];
  // Only exclude by first-word if the first word is distinctive (>= 5 chars)
  if (firstWord.length >= 5 && realFirstWords.has(firstWord)) return false;
  return true;
});

console.log('missing → will port:', missing.length);
if (!missing.length) { console.log('nothing to add — file already up to date'); process.exit(0); }
console.log('sample:', missing.slice(0, 10).map(h => h.n).join(' · '));

// ── Convert HB → stub entry ──────────────────────────────
function nextId(){
  let n = 1000; // stubs start at 1000 to keep rich ids (< 300) untouched
  while (existingIds.has(n)) n++;
  existingIds.add(n);
  return n;
}
function functionsFromIntentions(intentions){
  const map = {
    stress:'Adaptogenic stress support',
    sleep:'Traditional sleep support',
    energy:'Traditional vitality tonic',
    anxiety:'Nervine — calm the nervous system',
    mood:'Traditional mood support',
    digestion:'Digestive support',
    immunity:'Traditional immune support',
    pain:'Traditional anti-inflammatory / pain support',
    hormones:'Traditional endocrine / cycle support',
    cognitive:'Traditional cognitive / memory support',
    beauty:'Traditional beauty / skin support',
    detox:'Traditional detox / liver support',
  };
  const arr = (intentions || []).map(k => map[k]).filter(Boolean);
  return arr.length ? arr : ['Traditional herbal support (pending detailed enrichment)'];
}
function patternsFromConstitution(c){
  const map = { hot:'cool constitution', cold:'warm constitution', mixed:'balanced/mixed', depleted:'nourishing/tonic' };
  return (c || []).map(k => map[k]).filter(Boolean);
}
function contraFromFlags(x){
  return (x || []).map(k => 'Flag: ' + k) ;
}

function buildStub(h){
  const id = nextId();
  // If we have rich enrichment for this herb (Amla, Neem, Guggulu, ...),
  // use it. Otherwise fall back to the stub shape.
  const rich = ENRICHMENT[h.n];
  if (rich) {
    return {
      id,
      name: h.n,
      botanical: h.b,
      tcm_meridians: rich.tcm_meridians || h.t || [],
      tcm_element:   rich.tcm_element   || '',
      energetics:    rich.energetics    || patternsFromConstitution(h.c),
      primary_functions:  rich.primary_functions   || functionsFromIntentions(h.i),
      secondary_benefits: rich.secondary_benefits  || [],
      pharmacology:       rich.pharmacology        || h.a || 'Pending detailed pharmacology',
      flavor_profile:     rich.flavor_profile      || '',
      contraindications:  rich.contraindications   || contraFromFlags(h.x),
      herb_to_herb_synergy:      rich.herb_to_herb_synergy      || [],
      herb_to_herb_caution:      rich.herb_to_herb_caution      || [],
      herb_to_drug_interactions: rich.herb_to_drug_interactions || [],
      herb_interactions:  [],
      dosage_range:       rich.dosage_range        || 'See practitioner guidance',
      spiritual_layer:    rich.spiritual_layer     || '',
      best_preparation:   rich.best_preparation    || 'Full-spectrum spagyric extract',
      _hb_id: h.id || null,
    };
  }
  return {
    id,
    name: h.n,
    botanical: h.b,
    tcm_meridians: h.t || [],
    tcm_element: '',
    energetics: patternsFromConstitution(h.c),
    primary_functions: functionsFromIntentions(h.i),
    secondary_benefits: [],
    pharmacology: h.a || 'Pending detailed pharmacology (stub — imported from practitioner engine)',
    flavor_profile: '',
    contraindications: contraFromFlags(h.x),
    herb_to_herb_synergy: [],
    herb_to_herb_caution: [],
    herb_to_drug_interactions: [],
    herb_interactions: [],
    dosage_range: 'See practitioner guidance',
    spiritual_layer: '',
    best_preparation: 'Full-spectrum spagyric extract',
    _stub: true,
    _hb_id: h.id || null,
  };
}

// ── Serialise + append ───────────────────────────────────
function serialiseHerb(o){
  const q = s => JSON.stringify(s);
  const arr = a => '[' + (a || []).map(q).join(', ') + ']';
  const arrIndented = (a) => (a && a.length)
    ? '[\n      ' + a.map(q).join(',\n      ') + '\n    ]'
    : '[]';
  return (
    '  {\n' +
    '    id: ' + o.id + ',\n' +
    '    name: ' + q(o.name) + ',\n' +
    '    botanical: ' + q(o.botanical) + ',\n' +
    '    tcm_meridians: ' + arr(o.tcm_meridians) + ',\n' +
    '    tcm_element: ' + q(o.tcm_element) + ',\n' +
    '    energetics: ' + arr(o.energetics) + ',\n' +
    '    primary_functions: ' + arrIndented(o.primary_functions) + ',\n' +
    '    secondary_benefits: ' + arrIndented(o.secondary_benefits) + ',\n' +
    '    pharmacology: ' + q(o.pharmacology) + ',\n' +
    '    flavor_profile: ' + q(o.flavor_profile) + ',\n' +
    '    contraindications: ' + arrIndented(o.contraindications) + ',\n' +
    (o.herb_to_herb_synergy ? '    herb_to_herb_synergy: ' + arrIndented(o.herb_to_herb_synergy) + ',\n' : '') +
    (o.herb_to_herb_caution && o.herb_to_herb_caution.length ? '    herb_to_herb_caution: ' + arrIndented(o.herb_to_herb_caution) + ',\n' : '') +
    (o.herb_to_drug_interactions ? '    herb_to_drug_interactions: ' + arrIndented(o.herb_to_drug_interactions) + ',\n' : '') +
    '    herb_interactions: ' + arr(o.herb_interactions) + ',\n' +
    '    dosage_range: ' + q(o.dosage_range) + ',\n' +
    '    spiritual_layer: ' + q(o.spiritual_layer) + ',\n' +
    '    best_preparation: ' + q(o.best_preparation) + ',\n' +
    (o._stub ? '    _stub: true,\n' : '') +
    (o._hb_id ? '    _hb_id: ' + q(o._hb_id) + ',\n' : '') +
    '  }'
  );
}

const stubs = missing.map(buildStub);
const stubHeader =
  '\n' +
  '  // ─────────────────────────────────────────────\n' +
  '  // STUB HERBS — auto-imported from practitioner engine\n' +
  '  // (' + stubs.length + ' entries). Enrich these with full\n' +
  '  // pharmacology, synergy, contraindications when time permits.\n' +
  '  // Generated by scripts/port-missing-herbs.js\n' +
  '  // ─────────────────────────────────────────────\n';

// Insert BEFORE the final closing "]"
const closeIdx = herbsJs.lastIndexOf(']');
if (closeIdx < 0) { console.error('cannot find array close'); process.exit(1); }
// Make sure the last entry ends with a comma
let before = herbsJs.slice(0, closeIdx);
before = before.replace(/}\s*$/, '},');
const after  = herbsJs.slice(closeIdx);
const insert = stubHeader + stubs.map(serialiseHerb).join(',\n') + '\n';
const out = before + insert + after;
fs.writeFileSync(HERBS_JS, out);
console.log('appended', stubs.length, 'stub entries to public/herbs-data.js');
console.log('new total should be', existingNames.size + stubs.length);
