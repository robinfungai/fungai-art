// scripts/build-atlas.cjs
//
// public/herbs-data.js (243 records) → public/atlas/data/
//
//   index.json             slim record per organism — everything the grid,
//                          the facet rails and the relationship graph need
//   organism/<slug>.json   the full ten-layer dossier, fetched on open
//
// Split deliberately: the whole corpus is ~1.4 MB of prose, which is a
// hostile first paint for a landing page. The index is ~10% of that and
// a dossier is a few KB.
//
// DERIVED vs RECORDED. herbs.ts records tradition, chemistry prose, safety
// and synergy directly — those pass through. Human state, preparation,
// organism type, plant part and ecology are NOT fields in herbs.ts; they are
// classified here from the recorded text. Every derived facet is flagged as
// such in index.json so the UI can say so, and this script prints coverage
// for each one. Where a classifier has no confident answer it emits nothing
// rather than a guess — an atlas that invents a habitat is worse than one
// that admits it does not know.
//
//   node scripts/build-atlas.cjs

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'public', 'atlas', 'data');

// ── Load the built herb corpus ───────────────────────────────────
const herbsDataPath = path.join(ROOT, 'public', 'herbs-data.js');
if (!fs.existsSync(herbsDataPath)) {
  console.error('✗ public/herbs-data.js missing — run `npm run build:herbs-data` first.');
  process.exit(1);
}
global.window = {};
require(herbsDataPath);
const HERBS = global.window.HERB_DB;
if (!Array.isArray(HERBS) || !HERBS.length) {
  console.error('✗ HERB_DB did not load.');
  process.exit(1);
}

// Declared here so record building can read it; populated below the helpers.
let PORTRAITS = {};
let PORTRAITS_FULL = {};
let PORTRAITS_UNMATCHED = [];

const slugify = s => String(s)
  .toLowerCase()
  .replace(/\([^)]*\)/g, ' ')
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// ── Portraits ────────────────────────────────────────────────────
// Robin drops photographs into public/atlas/ named by English or Latin name.
// They are matched to records HERE, at build time, so adding a picture is
// copying a file — no code edit, no manifest to keep in sync.
//
// Matching is STRICT: slug, display name, alias or binomial, compared with
// punctuation and case removed. Nothing fuzzy. "wild-rosemary" must not
// silently become Rosmarinus officinalis, because wild rosemary is
// Rhododendron tomentosum and that is a different plant — the same mistake
// as Ajwain/Ajwan, which cost an afternoon.
//
// Unmatched files are REPORTED rather than ignored, because an unmatched
// photograph means one of two interesting things: the file is misnamed, or
// the catalogue is missing a herb.
const RESERVED_IMAGES = new Set(['first-photo', 'second-photo', 'third-photo', 'new-vid']);

function buildPortraits(herbs) {
  const dir = path.join(ROOT, 'public', 'atlas');
  const key = v => String(v || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]/g, '');
  const byKey = new Map();
  for (const h of herbs) {
    const names = [slugify(h.name), h.name, ...(h.aliases || []), ...String(h.name).split('/')];
    // Binomial without the parenthetical part-of-plant note.
    const bino = String(h.botanical || '').replace(/\([^)]*\)/g, ' ').split('/')[0].trim();
    if (bino) names.push(bino, bino.split(/\s+/).slice(0, 2).join(' '));
    for (const n of names) {
      const k = key(n);
      if (k.length >= 4 && !byKey.has(k)) byKey.set(k, h.name);
    }
  }

  const portraits = {};   // card-sized
  const full = {};        // original, for the dossier
  const unmatched = [];
  let files = [];
  try { files = fs.readdirSync(dir); } catch (_) { return { portraits, full, unmatched }; }
  for (const f of files) {
    if (!/\.(jpe?g|png|webp|avif)$/i.test(f)) continue;
    const base = f.replace(/\.[^.]+$/, '');
    if (RESERVED_IMAGES.has(base)) continue;
    const k = key(base);
    let hit = byKey.get(k);
    // A filename may be SHORTER than the record name — dandelion.jpg for
    // "Dandelion Root" — and that is safe when exactly one record starts with
    // it. The reverse is not: "wild-rosemary" carries an extra qualifier, so
    // it can never match "rosemary", which is the whole point. Ambiguity is
    // left unmatched rather than guessed.
    if (!hit && k.length >= 5) {
      const starts = [...byKey.entries()].filter(([rk]) => rk.startsWith(k));
      const names = new Set(starts.map(([, v]) => v));
      if (names.size === 1) hit = starts[0][1];
    }
    if (hit) {
      // A card is ~260 px wide; the originals are 130–1200 KB. Use the
      // generated thumbnail when build:thumbnails has been run, and fall back
      // to the original so the grid still works before anyone runs it.
      const thumb = path.join(dir, 'thumb', base + '.webp');
      portraits[hit] = fs.existsSync(thumb) ? '/atlas/thumb/' + base + '.webp' : '/atlas/' + f;
      full[hit] = '/atlas/' + f;
    } else unmatched.push(f);
  }
  return { portraits, full, unmatched };
}

// ── Layer 01 · Identity — organism type ──────────────────────────
// MUSHROOM_NAMES mirrors the set in src/App.tsx.
const MUSHROOM_NAMES = new Set([
  "Birch Polypore", "Button Mushroom", "Chaga", "Cordyceps", "Enoki", "Fu Ling",
  "Lion's Mane", "Maitake", "Mesima", "Morels", "Oyster Mushroom",
  "Red-Belted Polypore", "Reishi", "Royal Sun Mushroom", "Shaggy Bracket",
  "Shaggy Mane", "Shiitake", "Tinder Fungus", "Tremella", "Turkey Tail",
  "Willow Bracket", "Zhu Ling", "Psilocybe Cubensis", "Amanita Muscaria",
  "Agarikon",
]);
const FUNGAL_GENERA = /\b(amanita|psilocybe|ganoderma|inonotus|hericium|lentinula|grifola|trametes|cordyceps|ophiocordyceps|fomitopsis|fomes|tremella|pleurotus|agaricus|wolfiporia|polyporus|laetiporus|phellinus|piptoporus|coprinus|flammulina|morchella|auricularia)\b/i;

function organismType(h) {
  const n = h.name, b = String(h.botanical || '');
  if (MUSHROOM_NAMES.has(n) || FUNGAL_GENERA.test(b)) return 'fungus';
  if (/\b(resin|myrrh|frankincense|benzoin|dragons blood|copal|mastic|amber)\b/i.test(n)) return 'resin';
  if (/\b(shilajit|mineral pitch|zeolite)\b/i.test(n)) return 'mineral';
  if (/\b(kefir|kombucha|miso|natto|tempeh|ferment|koji)\b/i.test(n)) return 'ferment';
  if (/\b(kelp|bladderwrack|wakame|nori|dulse|spirulina|chlorella|irish moss|sea moss)\b/i.test(n + ' ' + b)) return 'algae';
  if (/\b(honey|bee pollen|royal jelly|propolis)\b/i.test(n)) return 'hive';
  return 'plant';
}

// ── Layer 03 · Material — which part ─────────────────────────────
const PART_RULES = [
  ['root',          /\b(root|radix|rhizome|taproot|tuber)\b/i],
  ['bark',          /\b(bark|cortex|cambium)\b/i],
  ['leaf',          /\b(leaf|leaves|folium|frond|aerial part)\b/i],
  ['flower',        /\b(flower|blossom|petal|bud|inflorescence|flos)\b/i],
  ['fruit',         /\b(fruit|berry|berries|fructus|hip|pod)\b/i],
  ['seed',          /\b(seed|semen|kernel|nut)\b/i],
  ['fruiting body', /\b(fruiting body|sclerotium|conk|mycelium|cap|stipe)\b/i],
  ['resin',         /\b(resin|gum|oleoresin|sap|latex)\b/i],
  ['whole',         /\b(whole (?:plant|herb)|entire plant)\b/i],
];
function plantPart(h) {
  const src = `${h.botanical || ''} ${h.name} ${h.best_preparation || ''}`;
  const parts = [];
  for (const [label, re] of PART_RULES) if (re.test(src)) parts.push(label);
  if (organismType(h) === 'fungus' && !parts.includes('fruiting body')) parts.unshift('fruiting body');
  return parts.slice(0, 3);
}

// ── Layer 04 · Chemistry — constituent classes ───────────────────
// Pattern-matched out of the recorded `pharmacology` prose. The prose
// itself is the authority and is always shown; these are navigation
// handles, not a replacement for it.
const CONSTITUENT_CLASSES = [
  ['alkaloids',              /\b(alkaloid|berberine|caffeine|harmine|harmaline|mesembrine|muscimol|piperine|hordenine|sanguinarine|boldine|tropane)\b/i],
  ['flavonoids',             /\b(flavonoid|flavone|quercetin|rutin|apigenin|luteolin|hesperidin|baicalin|catechin|kaempferol|silymarin|anthocyanin|proanthocyanidin)\b/i],
  ['terpenes',               /\b(terpene|terpenoid|triterpene|sesquiterpene|monoterpene|diterpene|limonene|pinene|linalool|ginkgolide|withanolide|ganoderic|saponin|glycyrrhizin|bisabolol|thujone)\b/i],
  ['polysaccharides',        /\b(polysaccharide|beta.?glucan|inulin|mucilage|arabinogalactan|fucoidan|glucomannan|pectin)\b/i],
  ['volatile oils',          /\b(volatile oil|essential oil|carvacrol|thymol|menthol|eugenol|cineole|camphor|terpinen)\b/i],
  ['phenolics',              /\b(polyphenol|phenolic|chlorogenic|caffeic|rosmarinic|chicoric|ferulic|gallic|tannin|salicylat|curcumin|hypericin|resveratrol)\b/i],
  ['sterols',                /\b(sterol|phytosterol|sitosterol|ergosterol|stigmasterol)\b/i],
  ['glycosides',             /\b(glycoside|iridoid|salidroside|aucubin|oleuropein|sennoside)\b/i],
  ['amino acids & peptides', /\b(amino acid|peptide|l-theanine|glutathione|ergothioneine|tryptophan|citrulline)\b/i],
  ['fatty acids',            /\b(fatty acid|omega.?3|omega.?6|linoleic|oleic)\b/i],
  ['minerals',               /\b(mineral|potassium|magnesium|calcium|zinc|selenium|silica|fulvic)\b/i],
  ['vitamins',               /\b(vitamin [abcdek]|ascorbic|tocopherol|riboflavin|niacin|folate)\b/i],
  ['enzymes',                /\b(enzyme|bromelain|papain|nattokinase|serrapeptase)\b/i],
];
function constituents(h) {
  const src = `${h.pharmacology || ''} ${(h.primary_functions || []).join(' ')} ${(h.secondary_benefits || []).join(' ')}`;
  return CONSTITUENT_CLASSES.filter(([, re]) => re.test(src)).map(([label]) => label);
}

// ── Facet · Human state ──────────────────────────────────────────
// The eight states from the brief, plus THRESHOLD for the ceremonial
// material the shop actually sells.
const STATES = [
  ['REST',      /\b(sleep|insomnia|sedat\w*|hypnotic|relax\w*|nervine|calm\w*|restless|gaba)\b/i],
  ['ENERGY',    /\b(energy|energis\w*|energiz\w*|fatigue|stamina|endurance|vitality|atp|mitochondri\w*|invigorat\w*|qi tonic|yang tonic|athletic)\b/i],
  ['CLARITY',   /\b(cognitive|cognition|memory|focus|nootropic|bdnf|ngf|acetylcholine|cerebral|concentration|neuroplastic\w*|brain fog)\b/i],
  ['GROUNDING', /\b(adaptogen\w*|cortisol|hpa axis|stress|anxiety|anxiolytic|resilience|grounding|centering)\b/i],
  ['DIGESTION', /\b(digest\w*|carminative|digestive bitter\w*|bile|choleretic|prebiotic|gut|gastric|intestinal|bloating|stomach|microbiome|peristalsis)\b/i],
  ['IMMUNITY',  /\b(immune|immunomodulat\w*|beta.?glucan|antiviral|antimicrobial|antibacterial|nk cell|macrophage|lymphatic|infection)\b/i],
  ['MOOD',      /\b(mood|depression|antidepressant|serotonin|dopamine|euphoria|emotional|grief|uplifting|anhedonia)\b/i],
  ['RHYTHM',    /\b(circadian|hormonal|hormone|menstrual|menopause|endocrine|thyroid|adrenal|libido|fertility|testosterone|estrogen)\b/i],
  ['THRESHOLD', /\b(entheogen\w*|psychoactive|oneirogen\w*|dream|visionary|consciousness|muscimol|trance|ceremonial|ritual|lucid|shamanic)\b/i],
];
// Two tiers, because they answer different questions.
//
//   primary   — what the organism is FOR. Matched against primary_functions
//               plus the structured fields. This is the navigable facet: a
//               visitor filtering on REST wants the things that are for rest,
//               not the 60 that mention relaxation in passing.
//   secondary — what it also touches. Matched against secondary_benefits and
//               shown in the dossier only. Reading both tiers as one facet put
//               Lion's Mane under 7 of 9 states, which navigates nowhere.
function humanStates(h) {
  const primarySrc   = (h.primary_functions || []).join(' ').toLowerCase();
  const secondarySrc = (h.secondary_benefits || []).join(' ').toLowerCase();
  const primary = new Set();
  const secondary = new Set();
  for (const [state, re] of STATES) {
    if (re.test(primarySrc)) primary.add(state);
    else if (re.test(secondarySrc)) secondary.add(state);
  }
  // Structured fields are recorded, not inferred — they outrank prose.
  if (h.sleep_action) primary.add('REST');
  if (Array.isArray(h.digestion_fit) && h.digestion_fit.length) primary.add('DIGESTION');
  if (Array.isArray(h.energy_pattern)) {
    if (h.energy_pattern.includes('am_boost')) primary.add('ENERGY');
    if (h.energy_pattern.includes('pm_stabilise')) primary.add('REST');
  }
  for (const s of primary) secondary.delete(s);
  return { primary: [...primary], secondary: [...secondary] };
}

// ── Facet · Preparation ──────────────────────────────────────────
const PREPARATIONS = [
  ['TINCTURE',  /\b(tincture|extract|drops|ethanol|hydroethanolic|percolation|maceration)\b/i],
  ['TEA',       /\b(infusion|infuse|steep|tea)\b/i],
  ['DECOCTION', /\b(decoct\w*|simmer\w*)\b/i],
  ['OIL',       /\b(infused oil|oil extract|salve|balm|topical|carrier oil|essential oil)\b/i],
  ['FERMENT',   /\b(ferment\w*|kefir|kombucha|koji)\b/i],
  ['OXIMEL',    /\b(oximel|vinegar|acetum)\b/i],
  ['POWDER',    /\b(powder\w*|capsule|churna|encapsulat\w*)\b/i],
  ['SPAGYRIC',  /\b(spagyric|calcination|alchemical)\b/i],
];
function preparations(h) {
  const src = `${h.best_preparation || ''} ${h.dosage_range || ''}`;
  return PREPARATIONS.filter(([, re]) => re.test(src)).map(([label]) => label);
}

// ── Facet · Ecology ──────────────────────────────────────────────
// NOT a recorded field. Classified from genus / common name against a
// curated table, and left EMPTY when nothing matches. Coverage is printed
// below — treat anything short of full coverage as an invitation to record
// habitat properly in herbs.ts rather than to widen these patterns.
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
// RECORDED FIRST. herbs.ts now carries an `ecology` block (see
// scripts/build-herb-ecology.cjs); the keyword table below is only the
// fallback for records that have none. That is the whole point of the
// field: a curated biome should never be overruled by a regex.
function ecology(h) {
  const rec = h.ecology && Array.isArray(h.ecology.biomes) ? h.ecology.biomes : null;
  if (rec && rec.length) return rec;
  const src = `${h.name} ${h.botanical || ''} ${h.family || ''}`;
  return BIOMES.filter(([, re]) => re.test(src)).map(([label]) => label);
}

// ── Facet · Tradition ────────────────────────────────────────────
// origin_region IS recorded. Mapped to display labels, nothing invented.
const TRADITION_LABEL = {
  'Ayurvedic': 'AYURVEDA', 'Chinese': 'TCM', 'European': 'EUROPEAN',
  'Mediterranean': 'MEDITERRANEAN', 'Nordic wild': 'NORDIC',
  'Central American': 'MESOAMERICAN', 'South American': 'SOUTH AMERICAN',
  'North American': 'NORTH AMERICAN', 'African': 'AFRICAN', 'Global': 'GLOBAL',
};

// ── Layer 09 · Relationship — resolve the synergy graph ──────────
// nameKeys() is lifted from src/server/formula-engine/interactions.js so the
// graph and the safety checker agree on what counts as a mention of a herb.
// Do not "improve" one without the other.
function nameKeys(name) {
  const raw = String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!raw) return [];
  const keys = new Set();
  const add = s => {
    const v = String(s || '').replace(/[/,]+$/, '').replace(/^[/,]+/, '')
      .replace(/\s+/g, ' ').trim();
    if (v.length >= 4) keys.add(v);
  };
  const variants = [raw, ...raw.split('/')];
  for (const v of variants) {
    const clean = v.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    add(v); add(clean);
    const toks = clean.split(' ').filter(Boolean);
    for (let n = 2; n < toks.length; n++) add(toks.slice(0, n).join(' '));
    if (toks[0] && toks[0].length >= 4) keys.add(toks[0]);
  }
  return [...keys];
}

const KEYED = HERBS.map(h => ({ h, keys: [...new Set([h.name, ...(h.aliases || [])]
  .filter(Boolean).flatMap(n => nameKeys(n)))] }));

// A mention resolves to the herb with the LONGEST matching key, so
// 'Red Yeast Rice' in prose beats bare 'rice' and 'Maca Negra' beats 'Maca'.
function resolveMentions(list, selfId) {
  const out = new Map();
  for (const line of (list || [])) {
    const t = String(line).toLowerCase();
    let best = null, bestLen = 0;
    for (const { h, keys } of KEYED) {
      if (h.id === selfId) continue;
      for (const k of keys) {
        if (k.length > bestLen && t.includes(k)) { best = h; bestLen = k.length; }
      }
    }
    if (best && !out.has(best.id)) out.set(best.id, { id: best.id, note: String(line) });
  }
  return [...out.values()];
}

// ── Build ────────────────────────────────────────────────────────
const slugSeen = new Set();
({ portraits: PORTRAITS, full: PORTRAITS_FULL, unmatched: PORTRAITS_UNMATCHED } = buildPortraits(HERBS));

const records = HERBS.map(h => {
  let slug = slugify(h.name);
  if (slugSeen.has(slug)) slug = `${slug}-${h.id}`;   // ids are unique, names are not guaranteed
  slugSeen.add(slug);

  const type   = organismType(h);
  const stateTiers = humanStates(h);
  const states = stateTiers.primary;
  const eco    = ecology(h);
  const preps  = preparations(h);
  const parts  = plantPart(h);
  const chem   = constituents(h);

  // Binomial, stripped of the parenthetical qualifiers the field carries
  // ("Taraxacum officinale (root — preferred over leaf)").
  const binomial = String(h.botanical || '').replace(/\s*\(.*$/, '').replace(/\s*—.*$/, '').trim();

  const synergy = resolveMentions(h.herb_to_herb_synergy, h.id);
  const caution = resolveMentions(h.herb_to_herb_caution, h.id);

  return {
    slim: {
      id: h.id, slug, name: h.name, binomial,
      family: h.family || '', epithet: h.epithet || '',
      type, parts, chem,
      states, statesAlso: stateTiers.secondary,
      ecology: eco, preparations: preps,
      // Recorded coarse geography, for the globe. There are no coordinates
      // anywhere in herbs.ts and none are invented: a node sits at a REGION,
      // never at a collection site. `tradition` is recorded on 100% and
      // native_range on 92%, which is what makes a region-density globe
      // honest where a pin map would not be.
      image: PORTRAITS[h.name] || '',
      native_range: (h.ecology && h.ecology.native_range) || [],
      habitat: (h.ecology && h.ecology.habitat) ? true : false,
      tradition: TRADITION_LABEL[h.origin_region] || 'GLOBAL',
      element: h.tcm_element || '', meridians: h.tcm_meridians || [],
      energetics: h.energetics || [],
      body: h.regional_affinity || [],
      onset: h.onset_time || '', energyPattern: h.energy_pattern || [],
      grade: h.evidence_grade || '', caution_level: h.caution_level || '',
      synergy: synergy.map(s => s.id),
      cautionEdges: caution.map(s => s.id),
    },
    dossier: {
      id: h.id, slug, name: h.name, binomial, botanical: h.botanical || '',
      image: PORTRAITS_FULL[h.name] || '',
      family: h.family || '', epithet: h.epithet || '', type,
      layers: {
        identity:     { family: h.family || '', binomial, epithet: h.epithet || '', type, parts },
        ecology:      { biomes: eco, origin: h.origin_region || '',
                        tradition: TRADITION_LABEL[h.origin_region] || 'GLOBAL',
                        image: PORTRAITS[h.name] || '',
      native_range: (h.ecology && h.ecology.native_range) || [],
                        habitat: (h.ecology && h.ecology.habitat) || '',
                        source: (h.ecology && h.ecology.source) || 'derived' },
        material:     { parts, preparationNote: h.best_preparation || '' },
        chemistry:    { classes: chem, pharmacology: h.pharmacology || '' },
        tradition:    { meridians: h.tcm_meridians || [], element: h.tcm_element || '',
                        energetics: h.energetics || [], flavor: h.flavor_profile || '',
                        spiritual: h.spiritual_layer || '' },
        evidence:     { grade: h.evidence_grade || '', status: h.status || '' },
        extraction:   { best: h.best_preparation || '', dosage: h.dosage_range || '', methods: preps },
        safety:       { level: h.caution_level || '', pregnancy: h.safe_pregnancy,
                        contraindications: h.contraindications || [],
                        drugInteractions: h.herb_to_drug_interactions || [] },
        relationship: { synergy, caution },
        formulation:  { primary: h.primary_functions || [], secondary: h.secondary_benefits || [],
                        body: h.regional_affinity || [], onset: h.onset_time || '',
                        energyPattern: h.energy_pattern || [],
                        states, statesAlso: stateTiers.secondary },
      },
    },
  };
});

// ── Emit ─────────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'organism'), { recursive: true });

const facetCounts = from => {
  const m = new Map();
  records.forEach(r => (from(r.slim) || []).forEach(v => { if (v) m.set(v, (m.get(v) || 0) + 1); }));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
};

const index = {
  generated: new Date().toISOString(),
  count: records.length,
  // `derived: true` facets are classified by this script, not recorded in
  // herbs.ts. The UI labels them so nobody mistakes a pattern match for a
  // curated fact.
  facets: {
    type:         { derived: true,  values: facetCounts(s => [s.type]) },
    states:       { derived: true,  values: facetCounts(s => s.states) },
    ecology:      { derived: true,  values: facetCounts(s => s.ecology) },
    preparations: { derived: true,  values: facetCounts(s => s.preparations) },
    tradition:    { derived: false, values: facetCounts(s => [s.tradition]) },
    body:         { derived: false, values: facetCounts(s => s.body) },
    grade:        { derived: false, values: facetCounts(s => [s.grade]) },
  },
  organisms: records.map(r => r.slim),
};

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
records.forEach(r => {
  fs.writeFileSync(path.join(OUT, 'organism', r.dossier.slug + '.json'), JSON.stringify(r.dossier));
});

// ── Coverage report ──────────────────────────────────────────────
const n = records.length;
const pct = k => String(Math.round((k / n) * 100)).padStart(3) + '%';
const covered = f => records.filter(r => (f(r.slim) || []).filter(Boolean).length).length;
const edgeTotal  = records.reduce((s, r) => s + r.slim.synergy.length, 0);
const byId = new Map(HERBS.map(h => [h.id, h]));
const unresolved = records.reduce((s, r) => {
  const declared = (byId.get(r.slim.id).herb_to_herb_synergy || []).length;
  return s + Math.max(0, declared - r.slim.synergy.length);
}, 0);

const kb = p => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
console.log(`✓ atlas: ${n} organisms → public/atlas/data/`);
console.log(`  index.json ${kb(path.join(OUT, 'index.json'))}, ${records.length} dossiers`);
console.log('  RECORDED facets (straight from herbs.ts):');
console.log('    tradition         ' + pct(covered(s => [s.tradition])));
console.log('    body affinity     ' + pct(covered(s => s.body)));
console.log('    evidence grade    ' + pct(covered(s => [s.grade])));
console.log('  DERIVED facets (classified by this script):');
console.log('    organism type     ' + pct(covered(s => [s.type])));
console.log('    plant part        ' + pct(covered(s => s.parts)));
console.log('    chemistry classes ' + pct(covered(s => s.chem)));
console.log('    human state       ' + pct(covered(s => s.states)));
console.log('    preparation       ' + pct(covered(s => s.preparations)));
console.log('    ecology / biome   ' + pct(covered(s => s.ecology)) + '   <- lowest-confidence facet');
// Biome is not the whole of ecology, and reporting it alone understates what
// the map can actually place. native_range is recorded from origin_region on
// almost every herb; habitat prose is the part still waiting to be written.
{
  const range   = HERBS.filter(h => h.ecology && (h.ecology.native_range || []).length).length;
  const habitat = HERBS.filter(h => h.ecology && h.ecology.habitat).length;
  console.log('    native range      ' + pct(range) + '   <- what the map can place today');
  console.log('    habitat written   ' + pct(habitat) + '   <- see docs/ECOLOGY-GAPS.txt');
}
{
  // Portraits. The unmatched list is the useful half: a photograph with no
  // record means either the file is misnamed or the catalogue is short a herb.
  const n = Object.keys(PORTRAITS).length;
  console.log('  PORTRAITS: ' + n + ' of ' + HERBS.length + ' organisms have a photograph');
  if (PORTRAITS_UNMATCHED.length) {
    console.log('  ' + PORTRAITS_UNMATCHED.length + ' image(s) matched NO record — misnamed, or the herb is missing:');
    for (const f of PORTRAITS_UNMATCHED) console.log('    ' + f);
  }
}
console.log(`  relationship graph: ${edgeTotal} resolved synergy edges, ${unresolved} declared mentions unresolved`);
