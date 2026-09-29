// src/server/formula-engine/herb-names.js
//
// The naming system for the free-text note: which herb did the person
// mean? (Robin, 2026-09-29: "figure out the naming system so it's
// waterproof when people are freely texting in the textbox".)
// note-safety.js asks it inside every refusal it finds.
//
// People do not type catalogue names. Against the old matcher, 25 of 28
// ordinary notes slipped through: "I don’t want valerian" (an iPhone
// curls every apostrophe), "no tumeric", "allergic to gingko", "no
// camomile", "no liquorice", "no licorice" (the record is "Licorice
// Root"), "no dandelion", "no nettles", "no passion flower", "no St Johns
// wart", "no hypericum", "Baldrian vertrage ich nicht", "leave the kava
// out". So:
//
//   · the note and every name are FOLDED the same way: lower case,
//     ä/ö/ü → ae/oe/ue, ß → ss, accents dropped, curly quotes
//     straightened, apostrophes and dots removed ("Lion's" = "lions",
//     "St." = "st"), zero-width characters and soft hyphens dropped;
//   · spacing does not count ("lemonbalm" = "lemon balm",
//     "passion flower" = "Passionflower", "St.John's" = "St John's");
//   · a herb answers to its name, each part of it ("Angelica (Dong
//     Quai)"), its name without the part of the plant ("Licorice Root" →
//     licorice, "Rose Petals" → rose), its aliases, its binomial, its
//     genus ("hypericum"; "artemisia" → Mugwort AND Wormwood), the last
//     word of its name ("pepper" → every pepper, "lotus" → Blue Lotus and
//     Lotus Leaf), its German names, and the other names people use
//     (EXTRA_NAMES: liquorice, SJW, triphala, celery…);
//   · plurals count ("nettles", "rose hips", "elderberries");
//   · a misspelling is forgiven: one slip in a name of 6–7 letters, two
//     in 8 or more ("valarian", "tumeric", "gingko", "ashwaganda").
//
// The longest name wins: "black pepper" is Black Pepper Extract, not
// every pepper; "pepper" alone is every pepper.
//
// Why fuzzy here when scoring.js refuses it: there a false match ADDS a
// herb to a bottle; here a match only ever takes one OUT (fails closed,
// like the rest of note-safety.js) and the reveal names what it left
// out. Guarded all the same: the first letter must match, names of five
// letters or fewer must be exact (plural allowed), and ordinary words
// that sit one slip from a herb are never read as one ("barely" is not
// Barley). tests/herb-names-verify.cjs holds both directions.

// ── Text ─────────────────────────────────────────────────────────
// Straighten what phones and word processors curl, drop invisible
// characters. Punctuation stays — note-safety.js splits on it.
function normaliseNote(s) {
  return String(s || '').normalize('NFKC')
    .replace(/[­​-‍⁠﻿]/g, '')
    .replace(/[‘’‚‛ʼ´′`]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/[‐-―−]/g, '-');
}

function fold(s) {
  return normaliseNote(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['.]/g, '');
}

const tokens = s => fold(s).split(/[^a-z0-9]+/).filter(Boolean);

// ── Names ────────────────────────────────────────────────────────
// The part of the plant, not the plant: "Licorice Root" is licorice.
const PART_WORDS = new Set(['root', 'roots', 'rhizome', 'bark', 'leaf', 'leaves', 'petal', 'petals', 'seed', 'seeds',
  'berry', 'berries', 'flower', 'flowers', 'bud', 'buds', 'extract', 'powder', 'needles', 'skin', 'peel', 'fruit',
  'herb', 'mushroom', 'cooked']);
// Words that never stand for a herb on their own ("no wild", "no tea").
const NOT_A_NAME = new Set([...PART_WORDS, 'tea', 'wild', 'red', 'black', 'white', 'green', 'blue', 'yellow', 'golden',
  'sweet', 'common', 'royal', 'true', 'indian', 'african', 'chinese', 'korean', 'american', 'european', 'mineral',
  'compound', 'formula', 'spp', 'var', 'syn', 'tree', 'weed', 'dong', 'ling', 'shen', 'mane', 'tail', 'claw', 'ali',
  'quai', 'sun', 'cork', 'pitch', 'belted', 'kidney', 'five', 'flavour', 'dream', 'yeast', 'diffusa', 'fungus', 'fungi']);

// German names (the house is in Berlin), keyed by catalogue name.
const GERMAN_NAMES = {
  'Valerian': ['baldrian'], "St. John's Wort": ['johanniskraut'], 'Chamomile': ['kamille'],
  'Lavender': ['lavendel'], 'Lemon Balm': ['melisse', 'zitronenmelisse'], 'Passionflower': ['passionsblume'],
  'Hops': ['hopfen'], 'Ginger': ['ingwer'], 'Turmeric': ['kurkuma', 'gelbwurz'],
  'Peppermint': ['pfefferminze', 'minze'], 'Nettle': ['brennnessel', 'brennessel'],
  'Dandelion Root': ['löwenzahn'], 'Sage': ['salbei'], 'Rosemary': ['rosmarin'],
  'Thyme': ['thymian'], 'Fennel': ['fenchel'], 'Milk Thistle': ['mariendistel'],
  'Hawthorn': ['weißdorn'], 'Elderberry': ['holunder', 'holunderbeere'],
  'Elderberry (Cooked Berry)': ['holunder', 'holunderbeere'], 'Elderflower': ['holunderblüte', 'holunderblüten'],
  'Rosehip': ['hagebutte'], 'Yarrow': ['schafgarbe'], 'Mugwort': ['beifuß'],
  'Wormwood': ['wermut'], 'Garlic': ['knoblauch'], 'Licorice Root': ['süßholz', 'lakritz', 'lakritze'],
  'Linden': ['linde', 'lindenblüten'], 'Oatstraw': ['hafer', 'haferstroh'],
  'Skullcap': ['helmkraut'], 'Motherwort': ['herzgespann'], 'Cinnamon': ['zimt'],
  'Cloves': ['nelken', 'gewürznelken'], 'Cardamom': ['kardamom'], 'Saffron': ['safran'],
  "Lion's Mane": ['igelstachelbart'], 'Birch Buds': ['birkenknospen'], 'Horsetail': ['schachtelhalm', 'zinnkraut'],
  'Calendula': ['ringelblume'], 'Echinacea': ['sonnenhut'], 'Juniper': ['wacholder'],
  'Meadowsweet': ['mädesüß'], 'Willow Bark': ['weidenrinde'], 'Cranberry': ['moosbeere'],
  'Bilberry': ['heidelbeere'], 'Lingonberry': ['preiselbeere'], 'Pomegranate Seeds': ['granatapfel'], 'Pomegranate Skin': ['granatapfel'],
  'Green Tea': ['grüntee', 'grüner tee'], 'Black Pepper Extract': ['schwarzer pfeffer', 'pfeffer'],
  'California Poppy': ['kalifornischer mohn', 'goldmohn'], 'Star Anise': ['sternanis'], 'Rhodiola': ['rosenwurz'],
  'Vitex': ['mönchspfeffer'], 'Angelica (Dong Quai)': ['engelwurz'], 'Vervain': ['eisenkraut'],
  'Black Cumin': ['schwarzkümmel'], 'Caraway': ['kümmel'], 'Fenugreek': ['bockshornklee'], 'Ajwan': ['sellerie', 'selleriesamen'],
  'Broadleaf Plantain': ['wegerich', 'breitwegerich'], 'Horse Chestnut Extract': ['rosskastanie'],
  "Devil's Claw": ['teufelskralle'], "Lady's Mantle": ['frauenmantel'], 'Mistletoe': ['mistel'],
  'Evening Primrose': ['nachtkerze'], 'Raspberry Leaf': ['himbeerblätter', 'himbeerblatt'], 'Feverfew': ['mutterkraut'],
  'Artichoke Extract': ['artischocke'], 'Kava Kava': ['rauschpfeffer'], 'Amanita Muscaria': ['fliegenpilz'],
  'Amanita Pantherina': ['pantherpilz'], 'Burdock': ['klette'], 'Butterbur': ['pestwurz'], "Butcher's Broom": ['mäusedorn'],
  'Eyebright': ['augentrost'], 'Chickweed': ['vogelmiere'], 'Mullein': ['königskerze'], 'Ground Ivy': ['gundermann', 'gundelrebe'],
  'Marjoram (Sweet Marjoram)': ['majoran'], 'Lucerne (Alfalfa)': ['luzerne'], 'Barley': ['gerste'], 'Black Walnut': ['walnuss'],
  'Bladderwrack': ['blasentang'], 'Barberry': ['berberitze'], 'Grape Seed': ['traubenkern', 'traubenkerne'],
  'Grape Leaf Extract': ['weinlaub'], 'Mulberry Leaf': ['maulbeere'], 'Goldenrod': ['goldrute'], 'Jasmine': ['jasmin'],
  'Vanilla': ['vanille'], 'Rhubarb Root': ['rhabarber'], 'Yellow Dock Root': ['ampfer'], 'Saw Palmetto': ['sägepalme'],
  'Senna': ['sennesblätter'], 'Galangal': ['galgant'], 'Knotweed': ['knöterich'], 'Iceland Moss': ['isländisch moos'],
  'Oyster Mushroom': ['austernpilz', 'austernseitling'], 'Turkey Tail': ['schmetterlingstramete'],
  'Tinder Fungus': ['zunderschwamm'], 'Reishi': ['lackporling'], 'Morels': ['morcheln'], 'Maitake': ['klapperschwamm'],
  'Cordyceps': ['raupenpilz'], 'Shaggy Mane': ['schopftintling'], 'Button Mushroom': ['champignon', 'champignons'],
  'Eucalyptus': ['eukalyptus'], 'Cayenne': ['chili', 'cayennepfeffer'], 'Hibiscus': ['hibiskus'],
};

// Other names people use, keyed by catalogue name: spellings, older and
// trade names, compounds a person may name ("curcumin"), and what a
// shared name covers ("brahmi" is Bacopa AND Gotu Kola; "triphala" is
// three fruits). Matched whole — no last-word rule on these.
const EXTRA_NAMES = {
  "St. John's Wort": ['saint johns wort', 'sjw'],
  'Licorice Root': ['liquorice', 'glycyrrhizin'],
  'Chamomile': ['camomile'],
  'Ashwagandha': ['indian ginseng', 'winter cherry'],
  'Rhodiola': ['golden root', 'roseroot', 'rose root', 'arctic root'],
  'Schisandra (Five-Flavour Fruit)': ['schizandra', 'wu wei zi', 'magnolia vine'],
  'Turmeric': ['curcumin'],
  'Kava Kava': ['kawa'],
  'Oatstraw': ['oats', 'oat straw', 'milky oats'],
  'Nettle': ['stinging nettle'],
  'Echinacea': ['coneflower'],
  'Elderberry': ['elder'], 'Elderberry (Cooked Berry)': ['elder'],
  'Cayenne': ['chili', 'chilli', 'chile', 'hot pepper'],
  'Amanita Muscaria': ['fly agaric'], 'Amanita Pantherina': ['panther cap'],
  'Blue Lotus': ['blue water lily', 'blue waterlily'],
  'Wild Dagga': ['lions tail'],
  'Wormwood': ['absinthe'],
  'Reishi': ['lingzhi', 'ling zhi'],
  'Turkey Tail': ['coriolus'],
  'Fu Ling': ['poria'],
  'Maitake': ['hen of the woods'],
  'Peppermint': ['mint'],
  'Black Cumin': ['black seed', 'kalonji', 'nigella seed'],
  'Ajwan': ['celery', 'celery seed'],
  'Toothed Clubmoss': ['huperzine'],
  'Pine Pollen': ['pine'],
  'Mucuna': ['velvet bean', 'l dopa'],
  'Tongkat Ali': ['longjack'],
  'Barberry': ['berberine'], 'Indian Barberry': ['berberine'], 'Goldenseal': ['berberine'],
  'Phellodendron / Amur Cork Tree': ['berberine'],
  'Calendula': ['marigold'],
  'Linden': ['lime flower', 'lime blossom'],
  'Red Dates': ['jujube'],
  'Goji Berry': ['wolfberry'],
  'Haritaki': ['triphala'], 'Bibhitaki': ['triphala'], 'Amla / Amalaki': ['triphala'],
  'Shallaki': ['frankincense'],
  'Bacopa': ['brahmi'], 'Gotu Kola': ['brahmi'],
  'Bladderwrack': ['seaweed', 'iodine'], 'Kelp Extract Powder': ['seaweed', 'iodine'],
  'Barley': ['gluten'],
  "Pau d'Arco": ['lapacho', 'taheebo'],
  "Cat's Claw": ['una de gato'],
  'Angelica (Dong Quai)': ['dang gui'],
  'Astragalus': ['huang qi'],
  'Green Tea': ['matcha'],
  'Gokshura': ['puncture vine'],
};

// Ordinary words one slip from a herb name. Never read as a herb.
// Found by running the matcher over the 13,000 words of the herb
// records, the quiz pages and docs/ (tests/herb-names-verify.cjs keeps
// the scan): "grounding" is not Ground Ivy, "chills" not Cayenne,
// "potential" not Tormentil, "parasites" not Butterbur.
const NEVER_FUZZY = new Set([
  'achilles', 'alchemical', 'barely', 'bearberry', 'champion', 'champions', 'chill', 'chills', 'chilly', 'chinese', 'close', 'closed', 'closer',
  'closes', 'closet', 'clover', 'copious', 'curious', 'fling', 'funnel', 'gallic', 'grounding', 'hydrates', 'illicit',
  'knotted', 'match', 'matches', 'medica', 'medical', 'models', 'morals', 'morinda', 'palette', 'parasites', 'persia',
  'plantation', 'potential', 'potentially', 'potentials', 'restrict', 'restricts', 'saliva', 'sativa', 'selenium',
  'silent',
]);

const _index = new WeakMap();

function namesOf(h) {
  const name = String(h.name || '');
  const out = [];          // { text, head: bool }
  const add = (text, head = true) => { if (text) out.push({ text: String(text), head }); };
  add(name);
  for (const part of name.split(/[()/,]/)) add(part);
  // Aliases whole: a Latin alias ("Eschscholzia californica") must not
  // turn its species word into a name ("california").
  for (const a of h.aliases || []) add(a, false);
  // botanical: "Piper methysticum (peeled rhizome — …)", several species
  // split by "/", notes after a dash ("Ephedra sinica (aerial stem) —
  // BANNED/RESTRICTED"). Only a capitalised genus and its lower-case
  // species count; "Phellodendron amurense / chinense" gives no genus
  // "chinense".
  const bot = String(h.botanical || '').replace(/\(.*?\)/g, ' ').split(/\s[—–-]\s|;/)[0];
  for (const part of bot.split('/')) {
    const m = part.trim().match(/^([A-Z][a-z]{3,})(?:\s+(?:×\s+|x\s+)?([a-z][a-z-]{2,}))?/);
    if (!m) continue;
    add(m[1], false);                                    // genus
    if (m[2]) add(m[1] + ' ' + m[2], false);
  }
  for (const g of GERMAN_NAMES[name] || []) add(g, false);
  for (const x of EXTRA_NAMES[name] || []) add(x, false);
  return out;
}

// All the keys (folded, spaces removed) a herb answers to.
function keysOf(h) {
  const keys = new Set();
  // Four letters at least, three for a name kept on purpose ("SJW"). A
  // single word must mean a plant ("wild", "tea" never do); several
  // words together always name one ("Royal Sun", "African Dream Root").
  const keep = (t, min = 4) => t.length && (t.length > 1 || !NOT_A_NAME.has(t[0])) && t.join('').length >= min;
  for (const { text, head } of namesOf(h)) {
    const t = tokens(text);
    if (!t.length) continue;
    if (keep(t, head ? 4 : 3)) keys.add(t.join(''));
    // "Kava Kava" is also "kava", "Camu Camu" "camu".
    if (t.length === 2 && t[0] === t[1] && keep([t[0]])) keys.add(t[0]);
    if (!head) continue;
    // Without the part of the plant: "Licorice Root" → licorice.
    const core = t.filter(w => !PART_WORDS.has(w));
    if (core.length && core.length < t.length && keep(core)) keys.add(core.join(''));
    // The last word, when it names a kind of plant: "Blue Lotus" → lotus.
    const last = core[core.length - 1];
    if (core.length >= 2 && last && last.length >= 4 && !NOT_A_NAME.has(last)) keys.add(last);
  }
  return keys;
}

function indexFor(pool) {
  let idx = _index.get(pool);
  if (idx) return idx;
  const byKey = new Map();
  for (const h of pool || []) {
    for (const k of keysOf(h)) {
      if (!byKey.has(k)) byKey.set(k, new Set());
      byKey.get(k).add(h);
    }
  }
  const byFirst = new Map();
  for (const k of byKey.keys()) {
    if (k.length < 6) continue;
    if (!byFirst.has(k[0])) byFirst.set(k[0], []);
    byFirst.get(k[0]).push(k);
  }
  idx = { byKey, byFirst };
  _index.set(pool, idx);
  return idx;
}

// Optimal string alignment distance (a swap of two letters is one slip),
// giving up once it passes max.
function slips(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      if (v < best) best = v;
    }
    if (best > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[b.length];
}

// The herbs a run of words (joined, folded) names: exactly, as a plural,
// or with a slip.
function lookup(idx, w) {
  const exact = idx.byKey.get(w);
  if (exact) return exact;
  const variants = [w + 's'];
  if (w.endsWith('s')) variants.push(w.slice(0, -1));
  if (w.endsWith('es')) variants.push(w.slice(0, -2));
  if (w.endsWith('ies')) variants.push(w.slice(0, -3) + 'y');
  if (w.endsWith('n')) variants.push(w.slice(0, -1));         // German plural: Nelken, Morcheln
  for (const v of variants) {
    const hit = v.length >= 4 && idx.byKey.get(v);
    if (hit) return hit;
  }
  if (w.length < 5 || NEVER_FUZZY.has(w)) return null;
  // Fewest slips wins; then the longest shared beginning ("lions main"
  // is Lion's Mane, not "lions tail"); a true tie names both.
  const prefix = k => { let i = 0; while (i < k.length && k[i] === w[i]) i++; return i; };
  let best = null, bestD = 3, bestP = -1;
  for (const k of idx.byFirst.get(w[0]) || []) {
    const max = k.length >= 8 ? 2 : 1;
    const d = slips(w, k, max);
    if (d > max) continue;
    const p = prefix(k);
    if (d < bestD || (d === bestD && p > bestP)) { best = new Set(idx.byKey.get(k)); bestD = d; bestP = p; }
    else if (d === bestD && p === bestP) for (const h of idx.byKey.get(k)) best.add(h);
  }
  return best;
}

const MAX_WORDS = 4;

/**
 * The herbs a stretch of text names, longest name first.
 * @returns {Array<{herb, words}>} words = what the person typed for it
 */
function findHerbs(text, pool) {
  const T = tokens(text);
  if (!T.length || !Array.isArray(pool)) return [];
  const idx = indexFor(pool);
  const found = new Map();
  for (let i = 0; i < T.length;) {
    let hit = null;
    for (let w = Math.min(MAX_WORDS, T.length - i); w >= 1 && !hit; w--) {
      const herbs = lookup(idx, T.slice(i, i + w).join(''));
      if (herbs && herbs.size) hit = { w, herbs };
    }
    if (!hit) { i++; continue; }
    const words = T.slice(i, i + hit.w).join(' ');
    for (const h of hit.herbs) if (!found.has(h)) found.set(h, words);
    i += hit.w;
  }
  return [...found].map(([herb, words]) => ({ herb, words }));
}

// Filler around a name in a list ("the kava", "any hops in it please").
const FILLER = new Set(['the', 'a', 'an', 'any', 'some', 'also', 'either', 'neither', 'no', 'nor', 'or', 'and',
  'in', 'it', 'please', 'thanks', 'too', 'at', 'all', 'as', 'well', 'of', 'kein', 'keine', 'keinen', 'den', 'die',
  'das', 'der', 'bitte', 'danke', 'auch']);

/** True when the text is nothing but herb names (and filler): a list item. */
function isHerbPhrase(text, pool) {
  const T = tokens(text).filter(w => !FILLER.has(w));
  if (!T.length || T.length > MAX_WORDS) return false;
  const idx = indexFor(pool);
  for (let i = 0; i < T.length;) {
    let w = Math.min(MAX_WORDS, T.length - i);
    while (w >= 1 && !(lookup(idx, T.slice(i, i + w).join('')) || { size: 0 }).size) w--;
    if (w < 1) return false;
    i += w;
  }
  return true;
}

module.exports = { normaliseNote, fold, tokens, findHerbs, isHerbPhrase, keysOf, GERMAN_NAMES, EXTRA_NAMES, NEVER_FUZZY };
