// src/server/myco/terminology.cjs
//
// MYCO's TERMINOLOGY layer. It sits between a question as a person typed
// it and the retrieval that answers it, and it does one job: make the
// words match.
//
// Why it exists. BM25 is a lexical scorer — it can only find a chunk that
// literally shares a term with the question. Before this module, these
// were all misses against a corpus that plainly holds the answer:
//
//   "what are ashwaganda contraindacations"   → NOTHING retrieved at all
//   "is rishi safe with warfrin"              → three unrelated herbs
//   "lions mane for memory"                   → Tremella, Kelp, Clubmoss
//   "standardised extract" / "standardized"   → two disjoint result sets
//   "is it safe with coumadin"                → nothing about warfarin
//
// None of those are exotic. They are a member typing quickly, an American
// spelling, a missing apostrophe, and a brand name. A knowledge base that
// answers only the well-spelled question is a knowledge base with a
// hidden entry exam.
//
// ── FIVE PASSES, CHEAPEST AND SUREST FIRST ───────────────────────
//
//   1. the term is already in the corpus            → leave it alone
//   2. an orthographic variant is in the corpus     → UK/US, æ/œ, -ise
//   3. the curated misspelling table has it         → vocabulary.cjs
//   4. bounded fuzzy match against the corpus       → ≤1 edit, ≤2 if long
//   5. nothing fits                                 → keep it as typed
//
// Pass 1 first is the important one: a word the corpus already contains is
// never "corrected". That is what stops this from turning a real term into
// a more common neighbour.
//
// ── THE CORPUS IS THE DICTIONARY ─────────────────────────────────
// There is no external word list. Corrections target the terms that are
// actually in the knowledge base, so a correction can only ever point at
// something retrievable. Spelling "grounding" correctly is no use if the
// corpus never says it; pointing "warfrin" at "warfarin" is useful
// precisely because 447 safety chunks do.
//
// ── EXPANSION IS NOT CORRECTION ──────────────────────────────────
// A correction replaces a term at full weight, because the member meant
// that word. An expansion ADDS terms at a fraction of the weight, because
// we are guessing at what else they'd accept. They are reported
// separately and they are never allowed to outvote what was typed.
//
// ── NEGATION ─────────────────────────────────────────────────────
// "grounding but not sedating" must not expand into the sedative corpus.
// A trigger with a negator shortly before it is recorded as suppressed.
// This is deliberately shallow — a window of a couple of words, not a
// parser. It catches the phrasing people actually use when they rule
// something out, and it fails by declining to expand, which is the safe
// direction.

const { EQUIVALENT, IMPLIES, MISSPELLINGS, NEGATORS, NEGATION_WORDS } = require('./vocabulary.cjs');

// ── Tuning ───────────────────────────────────────────────────────
const MIN_CANDIDATE_LEN = 4;    // below this a typo is indistinguishable from a word
const MIN_CANDIDATE_DF  = 2;    // a term in one chunk only is too thin to correct toward
const LONG_WORD         = 8;    // at this length, two edits are still recognisably the same word
const MAX_EXPANSIONS    = 24;   // a question is a question, not a thesaurus
const W_TYPED           = 1.0;
const W_CORRECTED       = 1.0;  // table / orthographic: we are confident
const W_FUZZY           = 0.85; // a guess, so it does not quite carry a typed term's weight
const W_VARIANT         = 0.90; // the same word, spelled the other way
const W_EXPANSION       = 0.45;

// ── Stopwords ────────────────────────────────────────────────────
// Moved here from retrieve.cjs: tokenising IS part of the terminology
// layer, and the index and the query must be built by the same function
// or nothing matches.
const STOP = new Set(('a an the and or but if of for to in on with without at by from as is are was were be been being ' +
  'it its this that these those i you he she they we me my your what which who how when where why can could should ' +
  'would will do does did not no yes any some more most much many very there here about into than then so such own ' +
  'good best help me please tell give show').split(' '));

// ── Normalisation ────────────────────────────────────────────────

/** Strip diacritics so "échinacée" and "echinacea" are one word. */
function deaccent(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * A phrase reduced to matchable shape: lowercase, unaccented, no
 * punctuation, single spaces. "St. John's Wort" and "st johns wort"
 * both become "st johns wort".
 */
function normPhrase(s) {
  return deaccent(String(s).toLowerCase())
    .replace(/\([^)]*\)/g, ' ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The light suffix folding retrieve.cjs has always used. */
function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('es'))  return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

/**
 * Tokenise to {surface, term} pairs.
 *
 * Two fixes over the original live here, and both were costing real
 * retrievals:
 *
 *   APOSTROPHES are removed, not kept. "Lion's" used to tokenise to
 *   "lion'" — a term no question ever produces — so "lions mane" scored
 *   against Tremella and Kelp instead. Now both sides say "lions".
 *
 *   HYPHENS emit the joined form and each part. "beta-glucan",
 *   "beta glucan" and "betaglucan" are one thing, and a corpus that
 *   indexes only the hyphenated form answers only the hyphenated
 *   question.
 */
function tokenPairs(s) {
  const out = [];
  const push = (surface, w) => {
    if (w.length < 2 || STOP.has(w)) return;
    out.push({ surface, term: stem(w) });
  };
  for (const piece of deaccent(String(s).toLowerCase()).split(/[^a-z0-9'’-]+/)) {
    if (!piece) continue;
    const cleaned = piece.replace(/['’]/g, '').replace(/^-+|-+$/g, '');
    if (!cleaned) continue;
    if (cleaned.includes('-')) {
      const parts = cleaned.split(/-+/).filter(Boolean);
      push(cleaned, parts.join(''));
      for (const p of parts) push(cleaned, p);
    } else {
      push(cleaned, cleaned);
    }
  }
  return out;
}

function tokenize(s) {
  return tokenPairs(s).map(p => p.term);
}

/**
 * A rough phonetic skeleton: first letter, then the consonant spine with
 * the usual English spelling collisions folded together. It is not
 * Metaphone and does not try to be — it exists to put "ekinacea" in the
 * same bucket as "echinacea" so bounded edit distance gets a look at it.
 */
function foldSpelling(w) {
  let s = String(w).replace(/[^a-z]/g, '');
  if (!s) return '';
  s = s
    .replace(/^(ps|pn|kn|gn|wr)/, m => m.slice(1))
    .replace(/^rh/, 'r')
    .replace(/ph/g, 'f')
    .replace(/gh/g, 'g')
    .replace(/ck/g, 'k')
    .replace(/sch/g, 'sk')
    .replace(/ch/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/q/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/z/g, 's')
    .replace(/y/g, 'i')
    .replace(/(.)\1+/g, '$1');
  return s[0] + s.slice(1).replace(/[aeiou]/g, '');
}

// ── Orthographic variants ────────────────────────────────────────
// UK/US and ligature spellings are a RULE, not a lookup table. The
// corpus mixes them — 130 monographs written over years — so both
// directions are generated and whichever one the corpus actually holds
// wins. This is the pass that joins "standardised extract" and
// "standardized extract" into one question.

const VARIANT_RULES = [
  [/ise(d|s|r|rs)?$/, 'ize$1'], [/ize(d|s|r|rs)?$/, 'ise$1'],
  [/isation/, 'ization'],       [/ization/, 'isation'],
  [/ising$/, 'izing'],          [/izing$/, 'ising'],
  [/yse(d|s)?$/, 'yze$1'],      [/yze(d|s)?$/, 'yse$1'],
  [/ae/, 'e'],                  [/oe/, 'e'],
  [/([^aeiou])our/, '$1or'],    [/([^aeiou])or([^aeiou]|$)/, '$1our$2'],
  [/ogue$/, 'og'],              [/og$/, 'ogue'],
  [/sulph/, 'sulf'],            [/sulf/, 'sulph'],
  [/ll(ing|ed|er|or|ation)$/, 'l$1'], [/l(ing|ed|er|or|ation)$/, 'll$1'],
];
// Pairs no rule expresses cleanly. Both directions are tried.
//
// This list is deliberately SHORT, and does not include the medical
// ligatures. A rule can strip a ligature (oe → e) but it cannot put one
// back — there is no safe way to decide which "e" in a word wants an "o" in
// front of it. Rather than hand-write every æ/œ word in medicine, the
// reverse direction is DERIVED FROM THE CORPUS: see ligaturePairs() below.
// That way the day a monograph first says "hyperoestrogenism", both
// spellings become searchable without anyone editing this file.
const VARIANT_PAIRS = [
  ['mould', 'mold'], ['licence', 'license'], ['practise', 'practice'],
  ['grey', 'gray'], ['centre', 'center'], ['fibre', 'fiber'],
  ['litre', 'liter'], ['metre', 'meter'], ['ageing', 'aging'],
  ['draught', 'draft'], ['plough', 'plow'], ['storey', 'story'],
];

/**
 * Ligature pairs the CORPUS itself contains.
 *
 * Scans the vocabulary for any term holding "ae" or "oe" whose de-ligatured
 * form is also a term in the corpus — oestrogen/estrogen, anaemia/anemia,
 * haemostatic/hemostatic, glycaemic/glycemic, dysmenorrhoea/dysmenorrhea.
 * Both directions are registered, so whichever spelling a member types,
 * both are searched.
 *
 * Requiring BOTH forms to be present is what makes this safe. It cannot
 * invent a pairing: "algae" stays alone because "alge" is not a word we
 * use, and "aloe" stays alone because "alo" is not either.
 */
function ligaturePairs(vocab) {
  const pairs = new Map();   // term → the other spelling
  for (const term of vocab.keys()) {
    if (!/(ae|oe)/.test(term)) continue;
    const flat = term.replace(/ae/g, 'e').replace(/oe/g, 'e');
    if (flat === term || !vocab.has(flat)) continue;
    pairs.set(term, flat);
    pairs.set(flat, term);
  }
  return pairs;
}

function orthographicVariants(w) {
  const out = new Set();
  if (w.length < 4) return out;
  for (const [re, rep] of VARIANT_RULES) {
    if (!re.test(w)) continue;
    const v = w.replace(re, rep);
    if (v !== w && v.length >= 3) out.add(v);
  }
  for (const [a, b] of VARIANT_PAIRS) {
    if (w.includes(a)) out.add(w.replace(a, b));
    if (w.includes(b)) out.add(w.replace(b, a));
  }
  out.delete(w);
  return out;
}

// ── Bounded Damerau-Levenshtein ──────────────────────────────────
// Bounded because we only ever ask "is this within N edits", never "how
// far apart are these". Abandoning a row whose best cell already exceeds
// the budget is what keeps a few hundred candidates per miss free.

function editDistance(a, b, max) {
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  if (a === b) return 0;
  let prev2 = null;
  let prev = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;
  for (let i = 1; i <= la; i++) {
    const cur = new Array(lb + 1);
    cur[0] = i;
    let rowMin = i;
    const lo = Math.max(1, i - max - 1), hi = Math.min(lb, i + max + 1);
    for (let j = 1; j <= lb; j++) {
      if (j < lo || j > hi) { cur[j] = max + 1; continue; }
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      // Transposition — "gingko" for "ginkgo" is one slip of the fingers,
      // not two substitutions.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[lb];
}

function budgetFor(len) {
  if (len < MIN_CANDIDATE_LEN) return 0;
  return len >= LONG_WORD ? 2 : 1;
}

// ── Lexicon ──────────────────────────────────────────────────────

/**
 * Build the correction and expansion structures for a corpus.
 *
 * @param {Map<string,number>} vocabulary  corpus term → document frequency
 * @param {Array<{herb:string, keys:string[]}>} [entities]  herb → its names
 * @param {Map<string,string>} [surfaceOf]  stem → a readable surface form,
 *        for reporting a correction to a member without showing them a stem
 * @returns {object} lexicon, plus a `dead` report of curated terms the
 *                   corpus does not contain (see vocabulary.cjs).
 */
function buildLexicon(vocabulary, entities = [], surfaceOf = new Map()) {
  const vocab = vocabulary;

  // Terms we are willing to correct TOWARD. A term appearing in a single
  // chunk is usually itself a typo or an OCR artefact in a monograph, and
  // correcting a member's word into one is worse than leaving it alone.
  const candidates = [];
  const byHead = new Map();   // first letter + length → terms
  const byFold = new Map();   // phonetic skeleton → terms
  const byTail = new Map();   // chars 2-4, so a wrong FIRST letter is reachable

  const bucket = (map, key, term) => {
    let a = map.get(key);
    if (!a) { a = []; map.set(key, a); }
    a.push(term);
  };

  // Every name of every herb is a correction target no matter how rare —
  // "Gromwell" appearing in six chunks is not a thin term, it is a plant.
  const entityTokens = new Set();
  for (const e of entities) {
    for (const key of e.keys || []) for (const t of tokenize(key)) entityTokens.add(t);
  }

  for (const [term, df] of vocab) {
    if (term.length < MIN_CANDIDATE_LEN) continue;
    if (df < MIN_CANDIDATE_DF && !entityTokens.has(term)) continue;
    candidates.push(term);
    bucket(byHead, term[0] + '|' + term.length, term);
    bucket(byFold, foldSpelling(term), term);
    bucket(byTail, term.slice(1, 4), term);
  }

  // ── Curated vocabulary, filtered against the corpus ────────────
  // A trigger need not be in the corpus — the member supplies it. Its
  // expansions must be, or they are dead weight in every future query.
  const dead = [];
  const liveTerms = (phrase, table) => {
    const terms = tokenize(phrase).filter(t => vocab.has(t));
    if (!terms.length) dead.push({ table, term: phrase });
    return terms;
  };

  // A trigger carries both the terms it widens to and any HERB it names.
  // "lingzhi" is not just four more search terms, it is Reishi — so the
  // entity bump has to reach it the way the display name does.
  const triggers = new Map();   // normalised trigger phrase → {terms, herbs}
  const addTrigger = (phrase, terms, herbs) => {
    const key = normPhrase(phrase);
    if (!key) return;
    if (!terms.length && !(herbs && herbs.length)) return;
    let e = triggers.get(key);
    if (!e) { e = { terms: new Set(), herbs: new Set() }; triggers.set(key, e); }
    for (const t of terms) e.terms.add(t);
    for (const h of herbs || []) e.herbs.add(h);
  };

  // Which herbs each curated phrase names. A LIST, not one herb: our own
  // records are sometimes split across two spellings of the same organism
  // — a monograph headed "SCHISANDRA / SCHIZANDRA" and a database entry
  // called "Schisandra (Five-Flavour Fruit)" — and both must light up from
  // either spelling, or half the knowledge stays behind.
  const herbsByKey = new Map();
  for (const e of entities) {
    for (const key of e.keys || []) {
      const k = normPhrase(key);
      let list = herbsByKey.get(k);
      if (!list) { list = []; herbsByKey.set(k, list); }
      if (!list.includes(e.herb)) list.push(e.herb);
    }
  }

  for (const group of EQUIVALENT) {
    // Resolve every member once, then give each member the others.
    const resolved = group.map(m => ({
      phrase: m,
      terms: liveTerms(m, 'EQUIVALENT'),
      herbs: herbsByKey.get(normPhrase(m)) || [],
    }));
    const groupHerbs = resolved.flatMap(r => r.herbs);
    for (const self of resolved) {
      const others = [];
      for (const other of resolved) if (other !== self) others.push(...other.terms);
      addTrigger(self.phrase, others, groupHerbs);
    }
  }
  for (const [trigger, expansions] of IMPLIES) {
    const terms = [];
    for (const e of expansions) terms.push(...liveTerms(e, 'IMPLIES'));
    addTrigger(trigger, terms, []);
  }

  // Single-word trigger phrases are vocabulary we have deliberately
  // curated, so they are NEVER treated as typos. Without this,
  // "coumadin" — which the corpus does not contain — gets fuzzy-matched
  // to "coumarin", a different molecule entirely, and the brand-name
  // entry that would have reached warfarin never fires because the word
  // it keys on has already been rewritten.
  const protectedTerms = new Set();
  for (const key of triggers.keys()) {
    const toks = tokenize(key);
    if (toks.length === 1) protectedTerms.add(toks[0]);
  }

  // Misspelling table: keys are what a member types, values must resolve
  // to something in the corpus or the entry is a no-op.
  const misspellings = new Map();
  for (const [wrong, right] of Object.entries(MISSPELLINGS)) {
    const target = stem(right);
    if (vocab.has(target)) misspellings.set(stem(wrong), target);
    else dead.push({ table: 'MISSPELLINGS', term: wrong + ' → ' + right });
  }

  // ── Entity phrases ────────────────────────────────────────────
  const entityKeys = [];   // [{ key, herb }] longest-first, so "red yeast rice" wins over "red"
  for (const e of entities) {
    for (const key of e.keys || []) {
      const k = normPhrase(key);
      if (k.length < 4) continue;
      entityKeys.push({ key: k, herb: e.herb });
    }
  }
  entityKeys.sort((a, b) => b.key.length - a.key.length);

  // What to CALL a term when reporting a correction. The curated table's
  // own right-hand side wins, because it was written by a person; then the
  // corpus's first surface form; then the stem itself.
  const displayOf = new Map(surfaceOf);
  for (const right of Object.values(MISSPELLINGS)) {
    const t = stem(right);
    if (vocab.has(t)) displayOf.set(t, right);
  }

  // Ligature spellings the corpus actually holds, derived not listed.
  const ligatures = ligaturePairs(vocab);

  return {
    vocab, candidates, byHead, byFold, byTail, displayOf, ligatures,
    triggers, misspellings, entityKeys, protectedTerms, dead,
    stats: {
      corpusTerms: vocab.size,
      candidates: candidates.length,
      triggers: triggers.size,
      misspellings: misspellings.size,
      entityKeys: entityKeys.length,
      protected: protectedTerms.size,
      ligaturePairs: ligatures.size / 2,
      dead: dead.length,
    },
  };
}

// ── Correction ───────────────────────────────────────────────────

function fuzzyCorrect(term, lex) {
  const budget = budgetFor(term.length);
  if (!budget) return null;

  const seen = new Set();
  const pool = [];
  const take = arr => { if (arr) for (const t of arr) if (!seen.has(t)) { seen.add(t); pool.push(t); } };
  const fold = foldSpelling(term);
  take(lex.byFold.get(fold));
  for (let d = -budget; d <= budget; d++) take(lex.byHead.get(term[0] + '|' + (term.length + d)));
  take(lex.byTail.get(term.slice(1, 4)));

  // Rank by: fewest edits, then "sounds the same", then how well attested
  // the candidate is in the corpus. Ties on all three are decided
  // alphabetically so one question always reads the same way twice.
  let best = null;
  const better = (a, b) => {
    if (!b) return true;
    if (a.d !== b.d) return a.d < b.d;
    if (a.sameFold !== b.sameFold) return a.sameFold;
    if (a.df !== b.df) return a.df > b.df;
    return a.term < b.term;
  };
  for (const cand of pool) {
    if (Math.abs(cand.length - term.length) > budget) continue;
    const sameFold = foldSpelling(cand) === fold;
    // A different first letter is only believable when the word still
    // SOUNDS the same. Without this, short misses flip to unrelated
    // neighbours that happen to be one edit away.
    if (cand[0] !== term[0] && !sameFold) continue;
    const d = editDistance(term, cand, budget);
    if (d > budget) continue;
    const c = { term: cand, d, sameFold, df: lex.vocab.get(cand) || 0 };
    if (better(c, best)) best = c;
  }
  return best;
}

/**
 * Read a question the way MYCO should read it.
 *
 * @returns {{
 *   raw: string, corrected: string,
 *   weights: Map<string,number>,
 *   corrections: Array<{from:string,to:string,via:string}>,
 *   expansions: Array<{term:string,from:string}>,
 *   suppressed: Array<{trigger:string,by:string}>,
 *   entities: string[]
 * }}
 */
function interpret(query, lex) {
  const raw = String(query || '');
  const pairs = tokenPairs(raw);
  const weights = new Map();
  const corrections = [];
  const seenCorrection = new Map();   // term → corrected term, so one word is corrected once

  const bump = (term, w) => {
    if (!term) return;
    if ((weights.get(term) || 0) < w) weights.set(term, w);
  };

  // Orthographic variants of a term the corpus ALREADY has are not a
  // correction — they are a split corpus. 130 monographs written over
  // years contain both "standardised" and "standardized", and a question
  // using one spelling was reaching only half the shelf. So the other
  // spelling is added alongside, at almost full weight, because it is the
  // same word rather than a guess at a related one.
  const variantsOf = term => {
    const out = [];
    // Derived first: a ligature pair found in the corpus is not a guess.
    const lig = lex.ligatures && lex.ligatures.get(term);
    if (lig && lig !== term) out.push(lig);
    for (const v of orthographicVariants(term)) {
      const sv = stem(v);
      if (sv !== term && sv !== lig && lex.vocab.has(sv)) out.push(sv);
    }
    return out;
  };

  const variantPairs = [];
  for (const { surface, term } of pairs) {
    if (lex.vocab.has(term)) {
      bump(term, W_TYPED);
      for (const v of variantsOf(term)) variantPairs.push({ term: v, from: term });
      continue;
    }
    if (seenCorrection.has(term)) { bump(seenCorrection.get(term), W_CORRECTED); continue; }

    let to = null, via = null, weight = W_CORRECTED;

    const variants = variantsOf(term);
    if (variants.length) { to = variants[0]; via = 'spelling'; }
    if (!to && lex.misspellings.has(term)) { to = lex.misspellings.get(term); via = 'table'; }
    // Curated vocabulary is not a typo. See protectedTerms in buildLexicon.
    if (!to && !lex.protectedTerms.has(term)) {
      const f = fuzzyCorrect(term, lex);
      if (f) { to = f.term; via = 'fuzzy'; weight = W_FUZZY; }
    }

    // Pass 5 — keep the word as typed. It scores nothing against the
    // static corpus, but a lab note written this morning may well use it.
    bump(term, W_TYPED);
    if (to && to !== term) {
      bump(to, weight);
      seenCorrection.set(term, to);
      // `to` is the stem we match on; `label` is what to show a person.
      const label = (lex.displayOf && lex.displayOf.get(to)) || to;
      corrections.push({ from: surface, to: label, term: to, via });
    }
  }

  // ── The corrected question ────────────────────────────────────
  // Rebuilt at SURFACE level, not from stems, because the intent
  // patterns in retrieve.cjs are written against how people write
  // ("how do i make…") and stopwords are gone from the token stream.
  let corrected = raw;
  for (const c of corrections) {
    if (!/^[a-z0-9]+$/i.test(c.from)) continue;
    corrected = corrected.replace(new RegExp('\\b' + c.from + '\\b', 'gi'), c.to);
  }

  // The spelling variants found above, recorded as expansions so the
  // reading stays honest about what was typed and what we added.
  const expansions = [];
  for (const v of variantPairs) {
    if (weights.has(v.term)) continue;
    weights.set(v.term, W_VARIANT);
    expansions.push({ term: v.term, from: v.from, via: 'spelling variant' });
  }

  // ── Expansion ─────────────────────────────────────────────────
  // Three haystacks. The corrected surface text holds phrases
  // ("blood thinner"). The RAW surface text is searched too, because a
  // correction must never be able to hide a trigger — if fuzzy matching
  // rewrote a word the curated tables know, the table still gets its
  // turn. The stemmed term stream holds "tinctures" as "tincture".
  const rawHay     = ' ' + normPhrase(raw) + ' ';
  const surfaceHay = ' ' + normPhrase(corrected) + ' ';
  const stemHay    = ' ' + [...weights.keys()].join(' ') + ' ';

  const suppressed = [];
  const entityHints = new Set();
  for (const [trigger, entry] of lex.triggers) {
    const padded = ' ' + trigger + ' ';
    let hay = surfaceHay, at = surfaceHay.indexOf(padded);
    if (at < 0) { at = rawHay.indexOf(padded); if (at >= 0) hay = rawHay; }
    if (at < 0) {
      const st = tokenize(trigger).join(' ');
      if (!st || stemHay.indexOf(' ' + st + ' ') < 0) continue;
      at = surfaceHay.indexOf(trigger.split(' ')[0]);   // for the negation window
    }
    const neg = negatorBefore(hay, at);
    if (neg) { suppressed.push({ trigger, by: neg }); continue; }
    for (const h of entry.herbs) entityHints.add(h);
    for (const t of entry.terms) {
      if (weights.has(t)) continue;                 // already typed — do not dilute
      if (expansions.length >= MAX_EXPANSIONS) break;
      weights.set(t, W_EXPANSION);
      expansions.push({ term: t, from: trigger, via: 'vocabulary' });
    }
  }

  // ── Entities ──────────────────────────────────────────────────
  const entities = [];
  const claimed = new Set();
  const claim = herb => {
    if (!herb || claimed.has(herb)) return;
    claimed.add(herb);
    entities.push(herb);
  };
  for (const { key, herb } of lex.entityKeys) {
    if (claimed.has(herb)) continue;
    if (surfaceHay.indexOf(' ' + key + ' ') < 0 && rawHay.indexOf(' ' + key + ' ') < 0) continue;
    claim(herb);
  }
  for (const herb of entityHints) claim(herb);

  return { raw, corrected, weights, corrections, expansions, suppressed, entities };
}

// ── Corpus-free correction ───────────────────────────────────────
// The curated misspelling table on its own, for callers that have no
// corpus to correct against — the formula engine's free-text notes field
// is scored by substring match against a fixed keyword list, not by
// retrieval, so there is no vocabulary to be the dictionary.
//
// Table only: no fuzzy matching, no orthographic rules, no widening.
// That is the point. A curated entry is an assertion we have made and can
// be held to; fuzzy matching against a 50-word keyword list would guess,
// and a wrong guess here does not merely rank a chunk lower, it changes
// which herbs go in someone's bottle.
const MISSPELL_BY_STEM = new Map(
  Object.entries(MISSPELLINGS).map(([wrong, right]) => [stem(wrong), right])
);

/**
 * Correct a free-text field against the curated misspelling table.
 * @returns {{text: string, corrections: Array<{from,to,via}>}}
 */
function applyMisspellings(text) {
  const raw = String(text || '');
  if (!raw) return { text: raw, corrections: [] };
  const corrections = [];
  const seen = new Set();
  let out = raw;
  for (const { surface, term } of tokenPairs(raw)) {
    if (seen.has(term)) continue;
    const right = MISSPELL_BY_STEM.get(term);
    if (!right) continue;
    seen.add(term);
    if (!/^[a-z0-9]+$/i.test(surface)) continue;
    out = out.replace(new RegExp('\\b' + surface + '\\b', 'gi'), right);
    corrections.push({ from: surface, to: right, via: 'table' });
  }
  return { text: out, corrections };
}

/**
 * Is the phrase at `at` being ruled out rather than asked for?
 *
 * Counted in words, not characters — see the note on NEGATORS in
 * vocabulary.cjs. Only the handful of words immediately before the
 * trigger are considered, so a negator cannot reach past its own object.
 */
function negatorBefore(hay, at) {
  if (at < 0) return null;
  const words = hay.slice(0, at + 1).trim().split(/\s+/).filter(Boolean);
  const tail = words.slice(-NEGATION_WORDS);
  for (let i = 0; i < tail.length; i++) {
    for (let n = 1; n <= 2 && i + n <= tail.length; n++) {
      const phrase = tail.slice(i, i + n).join(' ');
      if (NEGATORS.includes(phrase)) return phrase;
    }
  }
  return null;
}

module.exports = {
  tokenize, tokenPairs, stem, normPhrase, deaccent, foldSpelling,
  orthographicVariants, ligaturePairs, editDistance, budgetFor, buildLexicon, interpret,
  applyMisspellings, fuzzyCorrect,
  STOP, W_TYPED, W_CORRECTED, W_FUZZY, W_VARIANT, W_EXPANSION,
};
