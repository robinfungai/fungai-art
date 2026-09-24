#!/usr/bin/env node
/**
 * scripts/build-herb-ecology.cjs
 *
 *   node scripts/build-herb-ecology.cjs           # report coverage + gaps
 *   node scripts/build-herb-ecology.cjs --apply   # write ecology into herbs.ts
 *
 * Gives the atlas something to put on a map.
 *
 * ── WHY THE ATLAS SITS AT 38% ────────────────────────────────────
 * Habitat is not a field in herbs.ts. build-atlas.cjs derives a biome by
 * keyword-matching name + botanical + family, which reaches 38% and
 * cannot do better — the words simply are not written down. Widening
 * those patterns makes the number go up and the data worse.
 *
 * Measured before writing this: 75 of 128 monographs contain a
 * habitat-bearing sentence, and only 18 of 245 records mention habitat
 * anywhere in their own text. So most of this cannot be extracted. It has
 * to be written, by a person, per plant.
 *
 * ── WHAT THIS SCRIPT THEREFORE DOES ──────────────────────────────
 * Fills what the repo already records, marks how it knows, and leaves the
 * rest EMPTY with a list of what is missing:
 *
 *   native_range  from `origin_region`, which is populated on 245/245.
 *                 Coarse, recorded, and enough to place every organism on
 *                 a map today. 'Global' yields nothing rather than a
 *                 false range.
 *   habitat       the habitat sentence from that herb's hand-written
 *                 monograph, where it has one. Recorded prose, quoted.
 *   biomes        the atlas's own keyword derivation, carried over and
 *                 marked derived so the UI keeps printing "derived".
 *
 * `source` is per-record: 'recorded' when habitat prose was found,
 * 'derived' when only the keyword match fired, 'mixed' when both.
 *
 * Nothing here is written from general knowledge. A blank habitat means
 * nobody has written it, which is a to-do, not a gap to paper over.
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const HERBS_TS = path.join(ROOT, 'src', 'data', 'herbs.ts');
const MONO_DIR = path.join(ROOT, 'public', 'home', 'markdowns all plants');
const HERBS    = require(path.join(ROOT, 'src', 'server', 'herb-data', 'herbs.generated.cjs'));

// origin_region is recorded on every herb. These are the coarse ranges it
// implies — geography, not habitat.
const NATIVE_RANGE = {
  'Nordic wild':       ['Fennoscandia', 'Northern Europe'],
  'European':          ['Europe'],
  'Mediterranean':     ['Mediterranean basin'],
  'Ayurvedic':         ['Indian subcontinent'],
  'Chinese':           ['East Asia'],
  'North American':    ['North America'],
  'Central American':  ['Central America'],
  'South American':    ['South America'],
  'African':           ['Africa'],
  'Global':            [],   // cosmopolitan or unrecorded — never guess a range
};

// Lifted from build-atlas.cjs so the two agree. Carried over as DERIVED.
const BIOMES = [
  ['BOREAL FOREST', /\b(chaga|birch|betula|pine|pinus|spruce|picea|fir|lingonberry|bilberry|cloudberry|juniper|larch|inonotus|fomitopsis|tinder fungus|polypore|willow bracket|shaggy bracket|labrador)\b/i],
  ['FOREST',        /\b(reishi|lions mane|shiitake|maitake|turkey tail|oyster mushroom|enoki|hericium|ganoderma|lentinula|grifola|trametes|pleurotus|betony|hawthorn|elder|linden|beech|oak|quercus|ginkgo|witch hazel|goldenseal|cohosh|trillium|wild yam|usnea|morels|zhu ling|fu ling|wolfiporia|agarikon|mesima|phellinus)\b/i],
  ['MEADOW',        /\b(dandelion|clover|yarrow|chamomile|plantain|chicory|johns wort|hypericum|mullein|vervain|knapweed|burdock|mugwort|tansy|agrimony|self.?heal|lady.?s mantle|meadow)\b/i],
  ['BOG',           /\b(meadowsweet|cranberry|marshmallow|calamus|sweet flag|bogbean|water mint|watercress|willow bark|comfrey|horsetail|gotu kola|lotus|nymphaea|nelumbo)\b/i],
  ['MOUNTAIN',      /\b(rhodiola|arnica|gentian|edelweiss|shilajit|cordyceps|snow lotus|alpine|himalaya\w*|andean|maca|lepidium|mountain)\b/i],
  ['COAST',         /\b(kelp|bladderwrack|sea buckthorn|dulse|nori|wakame|irish moss|sea moss|samphire|rosehip|rose hip|fucus|laminaria|ascophyllum)\b/i],
  ['GARDEN',        /\b(rosemary|thyme|sage|basil|lavender|fennel|oregano|marjoram|parsley|dill|mint|lemon balm|calendula|borage|nasturtium|garlic|onion|celery)\b/i],
  ['TROPICAL',      /\b(bobinsana|muira puama|cats claw|uncaria|guarana|cacao|kava|noni|moringa|papaya|turmeric|ginger|galangal|cardamom|clove|cinnamon|vanilla|graviola|soursop|banisteriopsis|chacruna|coca|amazon\w*)\b/i],
  ['ARID',          /\b(aloe|jojoba|chaparral|syrian rue|peganum|damiana|ephedra|desert|hoodia|kanna|sceletium|frankincense|myrrh|boswellia|commiphora|opuntia|prickly pear|yucca)\b/i],
  ['STEPPE',        /\b(astragalus|licorice|glycyrrhiza|schisandra|saffron|crocus|steppe|mongolian|siberian|eleuthero|milk vetch)\b/i],
];

const HABITAT_RE = /\b(native|endemic|grows wild|found (?:in|on|across)|habitat|woodland|forest|meadow|alpine|montane|bog|marsh|wetland|coastal|desert|arid|steppe|tropical|temperate|boreal|subarctic|altitude|understor\w+|canopy|riverbank|hedgerow|grassland|savanna|mycorrhiz\w+|saprophyt\w+|parasit\w+|deadwood|conifer\w*|on (?:birch|oak|beech|willow|pine))\b/i;

const nrm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** name/alias key → the habitat sentence from that herb's monograph. */
function habitatFromMonographs() {
  const out = new Map();
  if (!fs.existsSync(MONO_DIR)) return out;
  for (const f of fs.readdirSync(MONO_DIR)) {
    if (!f.endsWith('.md')) continue;             // non-recursive: skips generated/
    const raw = fs.readFileSync(path.join(MONO_DIR, f), 'utf8');
    const title = (raw.match(/^#\s+(.+)$/m) || [, ''])[1];
    const sec = raw.split(/\n(?=##\s+)/).find(s => /^##\s+(BOTANICAL|IDENTIFICATION)/i.test(s)) || '';
    if (!sec) continue;

    // The most habitat-dense sentence in the identification section.
    let best = '';
    for (const s of sec.replace(/\*\*/g, '').split(/(?<=[.;])\s+/)) {
      const t = s.replace(/\s+/g, ' ').replace(/^#+\s*/, '').trim();
      if (t.length < 25 || t.length > 320 || !HABITAT_RE.test(t)) continue;
      const score = (t.match(HABITAT_RE) ? 1 : 0) + (t.match(/native|endemic|habitat|grows/i) ? 1 : 0);
      if (!best || score > 1 && t.length < best.length) best = t;
      if (!best) best = t;
    }
    if (!best) continue;
    for (const n of [title.replace(/\(.*$/, ''), f.replace(/\.md$/, '')].flatMap(x => String(x).split('/'))) {
      const k = nrm(String(n).replace(/\b(full|individual|master|monograph|complete|final)\b/gi, ''));
      if (k.length >= 4 && !out.has(k)) out.set(k, best);
    }
  }
  return out;
}

function biomesFor(h) {
  const src = `${h.name} ${h.botanical || ''} ${h.family || ''}`;
  return BIOMES.filter(([, re]) => re.test(src)).map(([label]) => label);
}

function ecologyFor(h, habitats) {
  const keys = [h.name, ...(h.aliases || [])].flatMap(n => String(n).split('/')).map(nrm);
  const habitat = keys.map(k => habitats.get(k)).find(Boolean) || '';
  const native  = NATIVE_RANGE[h.origin_region] || [];
  const biomes  = biomesFor(h);
  if (!habitat && !native.length && !biomes.length) return null;
  const source = habitat && biomes.length ? 'mixed' : (habitat ? 'recorded' : 'derived');
  return { native_range: native, biomes, habitat, source };
}

const jsStr = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

function renderEcology(e) {
  const L = ['    ecology: {'];
  if (e.native_range.length) L.push('      native_range: [' + e.native_range.map(jsStr).join(', ') + '],');
  if (e.biomes.length)       L.push('      biomes: [' + e.biomes.map(jsStr).join(', ') + '],');
  if (e.habitat)             L.push('      habitat:\n        ' + jsStr(e.habitat) + ',');
  L.push("      source: '" + e.source + "',");
  L.push('    },');
  return L.join('\n');
}

// ── herbs.ts surgery (same scanner as the importer) ──────────────
function splitRecords(src) {
  const decl = src.indexOf('export const HERBS: Herb[] = [');
  const open = src.indexOf('[', decl) + 1;
  const close = src.lastIndexOf('\n];');
  const body = src.slice(open, close);
  const recs = [];
  let depth = 0, start = -1, inStr = false, q = '', esc = false, inLine = false, inBlock = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i], n = body[i + 1];
    if (inLine)  { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inStr)   { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === q) inStr = false; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = true; q = c; continue; }
    if (c === '{') { if (depth === 0) start = i; depth++; continue; }
    if (c === '}') { depth--; if (depth === 0 && start >= 0) { recs.push({ from: open + start, to: open + i + 1, text: body.slice(start, i + 1) }); start = -1; } }
  }
  return recs;
}

function fieldEnd(text, field) {
  const lines = text.split('\n');
  const keyAt = i => lines[i].match(/^(\s*)([A-Za-z_]\w*)\s*:/);
  let start = -1, indent = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = keyAt(i);
    if (m && m[2] === field) { start = i; indent = m[1].length; break; }
  }
  if (start < 0) return null;
  for (let i = start + 1; i < lines.length; i++) {
    const m = keyAt(i);
    const lead = lines[i].match(/^(\s*)/)[1].length;
    if ((m && m[1].length <= indent) || (/^\s*\/\//.test(lines[i]) && lead <= indent) ||
        (/^\s{0,3}[}\]]/.test(lines[i]) && lead <= indent)) return { lines, at: i };
  }
  return { lines, at: lines.length };
}

function main() {
  const apply = process.argv.includes('--apply');
  const habitats = habitatFromMonographs();

  let recorded = 0, derived = 0, mixed = 0, none = 0;
  const gaps = [];
  const plan = new Map();
  for (const h of HERBS) {
    const e = ecologyFor(h, habitats);
    if (!e) { none++; gaps.push(h.id + ' ' + h.name); continue; }
    plan.set(h.id, e);
    if (e.source === 'mixed') mixed++; else if (e.source === 'recorded') recorded++; else derived++;
    if (!e.habitat) gaps.push(h.id + ' ' + h.name + '  (range only, no habitat written)');
  }

  const withHabitat = recorded + mixed;
  console.log('\nECOLOGY COVERAGE  (' + HERBS.length + ' herbs)');
  console.log('  habitat prose from a monograph : ' + withHabitat + '  ' + Math.round(100 * withHabitat / HERBS.length) + '%');
  console.log('  native range from origin_region: ' + [...plan.values()].filter(e => e.native_range.length).length);
  console.log('  biome derived by keyword       : ' + [...plan.values()].filter(e => e.biomes.length).length);
  console.log('  nothing at all                : ' + none);
  console.log('\n  ' + (HERBS.length - withHabitat) + ' herbs still need a habitat line WRITTEN. Range and biome');
  console.log('  are enough to place them on a map; habitat is what makes the map');
  console.log('  worth reading, and it is not in the repo to extract.\n');

  if (!apply) {
    console.log('First 20 needing habitat:');
    gaps.slice(0, 20).forEach(g => console.log('  ' + g));
    if (gaps.length > 20) console.log('  … and ' + (gaps.length - 20) + ' more');
    fs.writeFileSync(path.join(ROOT, 'docs', 'ECOLOGY-GAPS.txt'),
      'Herbs needing a habitat line written into herbs.ts ecology.habitat\n' +
      'Generated by scripts/build-herb-ecology.cjs\n\n' + gaps.join('\n') + '\n');
    console.log('\nFull list: docs/ECOLOGY-GAPS.txt');
    console.log('DRY RUN. Re-run with --apply to write ecology into herbs.ts.');
    return;
  }

  let src = fs.readFileSync(HERBS_TS, 'utf8');
  const recs = splitRecords(src).map(r => ({ ...r, id: Number((r.text.match(/\bid:\s*(\d+)/) || [])[1]) }))
                                .filter(r => r.id && plan.has(r.id) && !/^\s*ecology:/m.test(r.text));
  let written = 0;
  for (const r of recs.sort((a, b) => b.from - a.from)) {
    const anchor = ['origin_region', 'family', 'epithet', 'evidence_grade'].map(f => fieldEnd(r.text, f)).find(Boolean);
    if (!anchor) continue;
    const out = anchor.lines.slice(0, anchor.at)
      .concat(renderEcology(plan.get(r.id)).split('\n'), anchor.lines.slice(anchor.at));
    src = src.slice(0, r.from) + out.join('\n') + src.slice(r.to);
    written++;
  }
  fs.writeFileSync(HERBS_TS, src);
  console.log('wrote ecology into ' + written + ' records.');
  console.log('Next: npm run build:herbs-data && npm run build:atlas');
}

main();
