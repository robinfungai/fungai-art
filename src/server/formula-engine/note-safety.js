// src/server/formula-engine/note-safety.js
//
// Safety words in the free-text note (Robin, D1 2026-09-28).
//
// The note is not a safety channel — both pages say medicines,
// pregnancy and conditions belong in the safety question. People write
// them in the note anyway ("on sertraline since spring"), and until now
// the engine read that note only for scoring. So: a note that names a
// medicine, a pregnancy or a condition gets the matching safety flag
// applied, exactly as if the box had been ticked, and the reveal says so.
//
// It fails CLOSED on purpose. "Not pregnant" still applies the pregnancy
// filter — the cost is a slightly narrower bottle, the reveal names the
// word it read, and the person can take it out of the note. The other
// direction (missing a real medicine) is the one that can hurt.
//
// It only ever ADDS flags; it never removes one the person ticked.
// English plus the common German words (the house is in Berlin).
// Conditions with no safety flag of their own (epilepsy, chemotherapy)
// are not guessed at here — there is no filter to map them to.

const RULES = [
  ['pregnancy', /\b(pregn\w*|pregant|preganant|expecting a baby|trying to (?:conceive|get pregnant)|ttc|ivf|fertility treatment|breast[- ]?feed\w*|lactating|lactation|post-?partum|schwanger\w*|stillzeit|ich stille)\b/i],
  ['psych_meds', /\b(anti-?\s?depress?ant\w*|antidepressiva|ssris?|snris?|maois?|tricyclic\w*|mood[- ]stabili[sz]er\w*|anti-?psychotic\w*|lithium|sertralin\w*|fluoxetin\w*|citalopram|escitalopram|paroxetin\w*|venlafaxin\w*|duloxetin\w*|bupropion|mirtazapin\w*|trazodon\w*|amitriptylin\w*|lamotrigin\w*|quetiapin\w*|olanzapin\w*|aripiprazol\w*|risperidon\w*|valpro\w*|zoloft|prozac|lexapro|cipralex|celexa|paxil|effexor|cymbalta|wellbutrin|elontril|seroquel|abilify|methylphenidat\w*|ritalin|medikinet|concerta|adderall|vyvanse|elvanse|lisdexamfetamin\w*|atomoxetin\w*|strattera|adhd (?:meds?|medication))\b/i],
  ['sedatives', /\b(benzos?|benzodiazepin\w*|diazepam|valium|lorazepam|ativan|tavor|alprazolam|xanax|clonazepam|klonopin|rivotril|temazepam|oxazepam|zolpidem|ambien|stilnox|zopiclon\w*|sleeping (?:pills?|tablets?)|sleep(?:ing)? (?:meds?|medication)|schlaftablette\w*|on sedatives|sedative (?:meds?|medication|drugs?|tablets?)|gabapentin|pregabalin|lyrica|opioid\w*|opiate\w*|codein\w*|tramadol|oxycodon\w*|morphin\w*|fentanyl|methadon\w*|buprenorphin\w*)\b/i],
  ['cardio_meds', /\b(blood[- ]?thinner\w*|blutverd[üu]nner\w*|anti-?coagula\w*|anti-?platelet\w*|warfarin|coumadin|marcumar|phenprocoumon|apixaban|eliquis|rivaroxaban|xarelto|dabigatran|pradaxa|edoxaban|lixiana|clopidogrel|plavix|ticagrelor|aspirin|ass 100|heparin|digoxin|digitoxin|statins?|atorvastatin|simvastatin|rosuvastatin|beta[- ]?blocker\w*|metoprolol|bisoprolol|propranolol|amiodaron\w*|heart (?:meds?|medication|condition|disease|failure)|arrhythmi\w*|atrial fibrillation|a-?fib|herzmedikament\w*)\b/i],
  ['hypertension', /\b(high blood[- ]pressure|hypertens\w*|blood[- ]pressure (?:meds?|medication|pills?|tablets?)|bluthochdruck|ace[- ]inhibitor\w*|ramipril|lisinopril|enalapril|amlodipin\w*|losartan|candesartan|valsartan|telmisartan|hydrochlorothiazid\w*)\b/i],
  ['thyroid', /\b(thyroid\w*|hypo-?thyroid\w*|hyper-?thyroid\w*|hashimoto\w*|graves'? disease|morbus basedow|levothyrox\w*|l-?thyroxin\w*|thyroxin\w*|euthyrox|synthroid|carbimazol\w*|methimazol\w*|thiamazol\w*|schilddr\w*)\b/i],
  ['autoimmune', /\b(auto-?\s?immun\w*|lupus|multiple sclerosis|rheumatoid|crohn'?s?|ulcerative colitis|colitis ulcerosa|coeliac|celiac|z[öo]liakie|hashimoto\w*|graves'? disease|morbus basedow|psoria\w*|sj[öo]gren\w*|ankylosing|type[- ]?1 diabet\w*|immuno-?suppress\w*|methotrexat\w*|ciclosporin|cyclosporin\w*|tacrolimus|azathioprin\w*|mycophenol\w*|(?:organ|kidney|liver|heart|lung|stem[- ]cell) transplant\w*|transplant (?:patient|recipient))\b/i],
  ['liver_kidney', /\b(liver (?:disease|condition|damage|failure|problems?|issues?)|hepatitis|cirrhosis|fatty liver|nafld|kidney (?:disease|condition|damage|failure|problems?|issues?|stones?)|renal\w*|dialysis|nephr\w*|leber(?:erkrankung|schaden|zirrhose)\w*|niere\w*)\b/i],
  ['contraceptive', /\b(the pill|birth[- ]control|contracepti\w*|verh[üu]tung\w*|anti-?baby-?pille|die pille|mini-?pill|hormonal iud|mirena|kyleena|nexplanon|implanon|nuva-?ring|depo-?provera)\b/i],
  ['allergy', /\b(allerg\w*|anaphyla\w*|hay ?fever|heuschnupfen|ragweed|ambrosia|asteraceae|compositae|daisy family|salicylat\w*)\b/i],
];

const NOTE_SAFETY_FLAGS = RULES.map(r => r[0]);

/**
 * Safety flags named in a note, each with the first word that named it.
 * @returns {Array<{flag: string, word: string}>}
 */
function detectNoteSafety(notes) {
  const text = String(notes || '').slice(0, 4000);
  if (!text.trim()) return [];
  const hits = [];
  for (const [flag, rx] of RULES) {
    const m = text.match(rx);
    if (m) hits.push({ flag, word: m[0].slice(0, 40) });
  }
  return hits;
}

/**
 * Merge the note's flags into an already-validated avoid[].
 * "none" gives way to any flag the note names.
 * @returns {{ avoid: string[], added: string[], hits: Array<{flag, word}> }}
 *   hits lists only the flags the note ADDED (not ones already ticked).
 */
function applyNoteSafety(avoid, notes) {
  const ticked = (avoid || []).filter(f => f !== 'none');
  const hits = detectNoteSafety(notes).filter(h => !ticked.includes(h.flag));
  if (!hits.length) return { avoid: avoid.slice(), added: [], hits: [] };
  const added = hits.map(h => h.flag);
  return { avoid: ticked.concat(added), added, hits };
}

// ── A named herb to avoid (2026-09-28) ─────────────────────────────
// "Allergic to chamomile", "bad reaction to ashwagandha", "no more
// rhodiola", "valerian made me groggy": that herb leaves the pool —
// a hard exclusion, never a score. Each clause of the note is read on
// its own; a herb counts when it follows an avoid-phrase in the same
// clause (up to a turn like "but" or "helped"), or comes just before a
// "made me …" / "didn't agree with me". Fails closed like the flags
// above, and the reveal names every herb it left out.
const AVOID_BEFORE = /\b(?:allerg\w*(?: (?:to|with|reaction to))?|(?:bad |adverse |strong )?reactions? (?:to|with|from)|react(?:ed|s)? (?:badly |poorly |strongly )?(?:to|with)|intoleran\w* (?:to|of)|sensitive to|can'?t (?:take|tolerate|have|use|stand)|cannot (?:take|tolerate|have|use|stand)|(?:do|did|does)(?:n'?t| not) (?:tolerate|want|use|like|need)|(?:would |'d )?rather not(?: have)?|not a fan of|avoid(?:ing)?|no more|never again|stay(?:ing)? away from|not (?:allowed|supposed) to (?:take|have)|vertrag\w* (?:kein\w*|nicht)|mag (?:kein\w*|nicht)|allergisch (?:gegen|auf)|nicht mehr)\b/gi;
// Short refusals govern only the next few words (2026-09-29): "no
// valerian", "without caffeine", "ohne Koffein", "leave out the kava" —
// but not "I can't sleep without melatonin, so something with valerian".
const AVOID_NEAR   = /\b(?:no|without|ohne|kein(?:e|en|er|em)?|free (?:of|from)|please no|nothing (?:with|containing|that)|leave out|keep out|exclude|skip|except|anything but|not too)\b/gi;
const NEAR_WORDS   = 4;
const AVOID_AFTER  = /\b(?:made|makes|make|gave|gives) me (?:feel )?(?:sick|ill|nause\w*|queasy|anxious|jittery|wired|groggy|dizzy|worse|a rash|rashes|hives|headaches?|migraines?|palpitations|heartburn|insomnia)\b|\b(?:do|did|does)(?:n'?t| not) agree with me\b/gi;
const CLAUSE_TURN  = /\b(?:but|however|though|although|except|prefer|love|loved|help|helps|helped|works|worked|maybe|perhaps)\b/i;

// The parts of a clause a refusal governs: after a long refusal, the
// rest of the clause up to a turn; after a short one, the next few words.
function refusedSegments(clause) {
  const out = [];
  AVOID_BEFORE.lastIndex = 0;
  let m;
  while ((m = AVOID_BEFORE.exec(clause))) {
    let rest = clause.slice(m.index + m[0].length);
    const turn = rest.search(CLAUSE_TURN);
    if (turn >= 0) rest = rest.slice(0, turn);
    out.push({ marker: m[0], text: rest });
  }
  AVOID_NEAR.lastIndex = 0;
  while ((m = AVOID_NEAR.exec(clause))) {
    const rest = clause.slice(m.index + m[0].length).trim().split(/\s+/).slice(0, NEAR_WORDS).join(' ');
    out.push({ marker: m[0], text: ' ' + rest });
  }
  return out;
}

// ── An effect the note refuses (2026-09-29) ──────────────────────────
// Robin: "when the user doesn't want [a herb or an effect] … this needs
// to be waterproof." "No caffeine", "nothing sedating", "I don't want
// anything that makes me drowsy", "no mushrooms", "caffeine-free",
// "ohne Koffein": every herb with that effect leaves the pool, exactly
// like a named herb. The effect words are only read after a refusal —
// "I'm sleepy all day" refuses nothing. Fails closed, and the reveal
// names what it left out and the words it read.
const P = require('./pharmacology');
const EFFECTS = [
  { effect: 'stimulating', label: 'anything stimulating',
    words: /\b(?:stimula\w*|caffein\w*|koffein\w*|energi[sz]ing|wired|jitter\w*|uppers?|anregend\w*|aufputsch\w*)/i,
    test: h => P.isCNSStimulant(h) || P.isStrongStimulant(h) },
  { effect: 'sedating', label: 'anything sedating',
    words: /\b(?:sedat\w*|drows\w*|sleepy|groggy|knock(?:s|ed|ing)? (?:me )?out|makes? me tired|beruhig\w*|schl[äa]frig\w*|m[üu]de mach\w*)/i,
    test: h => P.isGABAergic(h) },
  { effect: 'psychoactive', label: 'anything psychoactive',
    words: /\b(?:psycho-?activ\w*|psychedel\w*|hallucinogen\w*|mind[- ]altering|trippy|intoxicat\w*|getting high|psychoaktiv\w*|berausch\w*)/i,
    test: h => !!h.gated || P.cnsAction(h) === 'psychoactive' },
  { effect: 'laxative', label: 'laxative herbs',
    words: /\b(?:laxativ\w*|purgativ\w*|abf[üu]hr\w*)/i,
    test: h => P.isLaxative(h) },
  { effect: 'mushroom', label: 'mushrooms',
    words: /\b(?:mushrooms?|fung(?:i|us)|funghi|pilz\w*)\b/i,
    test: h => P.isFungus(h) },
  { effect: 'serotonergic', label: 'serotonergic herbs',
    words: /\bserotonerg\w*/i,
    test: h => P.isSerotonergic(h) },
];
// "caffeine-free", "koffeinfrei", "alcohol free" style.
const FREE_OF = /\b(\w+)[- ]?(?:free|frei)\b/gi;

/**
 * Effects the note refuses, each with the herbs it removes.
 * @returns {Array<{effect, label, word, ids: Array}>}
 */
function detectNoteEffectAvoidance(notes, pool) {
  const text = String(notes || '').slice(0, 4000);
  if (!text.trim() || !Array.isArray(pool)) return [];
  const found = new Map();
  const hit = (e, word) => { if (!found.has(e.effect)) found.set(e.effect, { effect: e.effect, label: e.label, word: word.replace(/\s+/g, ' ').trim().slice(0, 60) }); };
  for (const clause of text.split(/[.;!?\n]+/)) {
    for (const seg of refusedSegments(clause)) {
      for (const e of EFFECTS) { const w = seg.text.match(e.words); if (w) hit(e, seg.marker + ' ' + seg.text.slice(0, seg.text.indexOf(w[0]) + w[0].length)); }
    }
    FREE_OF.lastIndex = 0;
    let m;
    while ((m = FREE_OF.exec(clause))) for (const e of EFFECTS) if (e.words.test(m[1] + ' ') || e.words.test(m[0])) hit(e, m[0]);
  }
  return [...found.values()].map(x => {
    const e = EFFECTS.find(y => y.effect === x.effect);
    return { ...x, ids: pool.filter(h => { try { return e.test(h); } catch (_) { return false; } }).map(h => h.id) };
  });
}

// Every name a herb answers to, lower-cased: the name, its parts
// ("He Shou Wu / Fo-Ti", "Schisandra (Five-Flavour Fruit)"), aliases and
// the botanical binomial. Four letters or more, matched as whole words.
const _namesCache = new WeakMap();
function herbNames(h) {
  let names = _namesCache.get(h);
  if (names) return names;
  // botanical often carries notes after the binomial ("Piper methysticum
  // (peeled rhizome — …)"), sometimes two species split by "/": keep
  // each binomial only.
  const binomials = String(h.botanical || '').split('/')
    .map(s => s.replace(/\(.*?\)/g, ' ').trim().split(/\s+/).slice(0, 2).join(' '));
  const name = String(h.name || '');
  const words = name.toLowerCase().split(/\s+/);
  const raw = [name, ...(h.aliases || []), ...binomials]
    .concat(name.split(/[()/,]/))
    // "Kava Kava" is also written "kava".
    .concat(words.length === 2 && words[0] === words[1] ? [words[0]] : [])
    .map(s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim())
    .filter(s => s.length >= 4);
  names = [...new Set(raw)].map(s => new RegExp('\\b' + s
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\./g, '\\.?')            // "St. John's" = "St John's"
    .replace(/['’]/g, "['’]?")           // "Lion's" = "Lions" = "Lion’s"
    + '\\b', 'i'));
  // German names (the house is in Berlin): "ohne Baldrian". Letter-aware
  // edges, because \b does not see ä/ö/ü/ß as letters.
  for (const g of GERMAN_NAMES[name] || []) {
    names.push(new RegExp('(?<!\\p{L})' + g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\p{L})', 'iu'));
  }
  _namesCache.set(h, names);
  return names;
}

// German names for the common herbs, keyed by the catalogue name. Used
// only to read refusals in the note; the herb records are unchanged.
const GERMAN_NAMES = {
  'Valerian': ['baldrian'], "St. John's Wort": ['johanniskraut'], 'Chamomile': ['kamille'],
  'Lavender': ['lavendel'], 'Lemon Balm': ['melisse', 'zitronenmelisse'], 'Passionflower': ['passionsblume'],
  'Hops': ['hopfen'], 'Ginger': ['ingwer'], 'Turmeric': ['kurkuma', 'gelbwurz'],
  'Peppermint': ['pfefferminze', 'minze'], 'Nettle': ['brennnessel', 'brennessel'],
  'Dandelion Root': ['löwenzahn', 'loewenzahn'], 'Sage': ['salbei'], 'Rosemary': ['rosmarin'],
  'Thyme': ['thymian'], 'Fennel': ['fenchel'], 'Milk Thistle': ['mariendistel'],
  'Hawthorn': ['weißdorn', 'weissdorn'], 'Elderberry': ['holunder', 'holunderbeere', 'holunderbeeren'],
  'Elderberry (Cooked Berry)': ['holunder', 'holunderbeere', 'holunderbeeren'],
  'Rosehip': ['hagebutte', 'hagebutten'], 'Yarrow': ['schafgarbe'], 'Mugwort': ['beifuß', 'beifuss'],
  'Wormwood': ['wermut'], 'Garlic': ['knoblauch'], 'Licorice Root': ['süßholz', 'suessholz', 'lakritz', 'lakritze'],
  'Linden': ['linde', 'lindenblüten', 'lindenblueten'], 'Oatstraw': ['hafer', 'haferstroh'],
  'Skullcap': ['helmkraut'], 'Motherwort': ['herzgespann'], 'Cinnamon': ['zimt'],
  'Cloves': ['nelken', 'gewürznelken', 'gewuerznelken'], 'Cardamom': ['kardamom'], 'Saffron': ['safran'],
  "Lion's Mane": ['igelstachelbart'], 'Birch Buds': ['birkenknospen'], 'Horsetail': ['schachtelhalm', 'zinnkraut'],
  'Calendula': ['ringelblume'], 'Echinacea': ['sonnenhut'], 'Juniper': ['wacholder'],
  'Meadowsweet': ['mädesüß', 'maedesuess'], 'Willow Bark': ['weidenrinde'], 'Cranberry': ['moosbeere'],
  'Bilberry': ['heidelbeere', 'heidelbeeren'], 'Pomegranate Seeds': ['granatapfel'], 'Pomegranate Skin': ['granatapfel'],
  'Green Tea': ['grüntee', 'grüner tee', 'gruener tee'], 'Black Pepper Extract': ['schwarzer pfeffer', 'pfeffer'],
  'California Poppy': ['kalifornischer mohn', 'goldmohn'],
};

/**
 * Herbs the note says to avoid.
 * @param {string} notes
 * @param {Array} pool — ensurePool() herbs
 * @returns {Array<{id, name, word}>} word = the phrase that named it
 */
function detectNoteHerbAvoidance(notes, pool) {
  const text = String(notes || '').slice(0, 4000);
  if (!text.trim() || !Array.isArray(pool)) return [];
  const found = new Map();
  const note = (h, word) => { if (!found.has(h.id)) found.set(h.id, { id: h.id, name: h.name, word: word.trim().slice(0, 60) }); };
  for (const clause of text.split(/[.;!?\n]+/)) {
    let m;
    for (const seg of refusedSegments(clause)) {
      for (const h of pool) if (herbNames(h).some(rx => rx.test(seg.text))) note(h, seg.marker + seg.text.replace(/\s+/g, ' ').slice(0, 40));
    }
    AVOID_AFTER.lastIndex = 0;
    while ((m = AVOID_AFTER.exec(clause))) {
      const before = clause.slice(Math.max(0, m.index - 60), m.index);
      for (const h of pool) if (herbNames(h).some(rx => rx.test(before))) note(h, before.trim().split(/\s+/).slice(-4).join(' ') + ' ' + m[0]);
    }
  }
  return [...found.values()];
}

module.exports = { NOTE_SAFETY_FLAGS, detectNoteSafety, applyNoteSafety, detectNoteHerbAvoidance, detectNoteEffectAvoidance, EFFECTS };
