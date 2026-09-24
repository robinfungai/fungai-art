// src/server/myco/retrieve.cjs
//
// MYCO's RETRIEVAL layer. Lexical BM25 over the generated knowledge
// base, with four domain adjustments that matter more here than any
// clever ranking maths would:
//
//   1. Terminology. A question is read through terminology.cjs first, so
//      misspellings, UK/US spellings, pinyin, Latin binomials and brand
//      names land on the words the corpus actually uses. Before that
//      layer existed, "what are ashwaganda contraindacations" retrieved
//      nothing whatsoever.
//   2. Entity matching. "is reishi safe with warfarin" must reach
//      Reishi's chunks even though "reishi" is one token among many —
//      and "Ganoderma lucidum" and "lingzhi" must reach the same place.
//   3. Intent boosting. A question about interactions should surface
//      safety chunks; a question about ratios should surface
//      preparation chunks.
//   4. Source diversity. Without a cap, six sections of one monograph
//      crowd out the herb database and our own protocols.
//
// No embeddings, no vector service, no per-query cost — the corpus is
// small (~3.2k chunks) and the vocabulary is domain-specific, which is
// exactly where BM25 holds up once the vocabulary problem is solved. A
// vector layer can be added later behind this same `search()` signature
// without touching callers.

const KB = require('./kb.generated.cjs');
const {
  tokenize, tokenPairs, normPhrase, buildLexicon, interpret,
} = require('./terminology.cjs');

// ── Index (built once per function instance) ─────────────────────
let INDEX = null;
function buildIndex() {
  if (INDEX) return INDEX;
  const docs = KB.chunks;
  const postings = new Map();   // term → [docIndex, tf, docIndex, tf, …]
  const lengths = new Float64Array(docs.length);
  const herbDocs = new Map();   // herb display name → Set(docIndex)

  // Stemmed terms are what we match on, but they are not always words:
  // "cordyceps" indexes as "cordycep". Telling a member we read their
  // "cordyseps" as "cordycep" looks like a second typo, so the first
  // surface form seen for each stem is kept purely for display.
  const surfaceOf = new Map();

  docs.forEach((d, i) => {
    // The title is indexed twice: a term in "Reishi — safety" should
    // outweigh the same term buried in a paragraph.
    const titleTerms = tokenize(d.title);
    const bodyPairs = tokenPairs(d.text);
    for (const { surface, term } of bodyPairs) {
      if (surface !== term && !surfaceOf.has(term)) surfaceOf.set(term, surface);
    }
    const terms = titleTerms.concat(titleTerms, tokenize(d.section), bodyPairs.map(p => p.term));
    lengths[i] = terms.length;
    const tf = new Map();
    for (const t of terms) tf.set(t, (tf.get(t) || 0) + 1);
    for (const [t, n] of tf) {
      let p = postings.get(t);
      if (!p) { p = []; postings.set(t, p); }
      p.push(i, n);
    }
    if (d.herb) {
      if (!herbDocs.has(d.herb)) herbDocs.set(d.herb, new Set());
      herbDocs.get(d.herb).add(i);
    }
  });

  // The same plant appears under two spellings of its own name: the herb
  // database says "Ashwagandha", the monographs shout "ASHWAGANDHA". They
  // are one organism, so one entity hit has to light up both sets of
  // chunks — otherwise a member who misspells the name reaches the
  // database record and not the monograph, or the other way round.
  const docsByNorm = new Map();
  for (const [herb, set] of herbDocs) {
    const key = normPhrase(herb);
    let merged = docsByNorm.get(key);
    if (!merged) { merged = new Set(); docsByNorm.set(key, merged); }
    for (const i of set) merged.add(i);
  }

  let total = 0;
  for (let i = 0; i < lengths.length; i++) total += lengths[i];

  // Document frequency per term — the corpus IS the dictionary the
  // terminology layer corrects against.
  const vocabulary = new Map();
  for (const [t, p] of postings) vocabulary.set(t, p.length / 2);

  const lexicon = buildLexicon(vocabulary, entityTable(herbDocs), surfaceOf);

  INDEX = {
    docs, postings, lengths, herbDocs, docsByNorm, lexicon,
    avgLen: total / Math.max(1, docs.length),
  };
  return INDEX;
}

/**
 * The names each herb answers to.
 *
 * `KB.entities` is emitted by scripts/build-myco-kb.cjs, where the herb
 * records are in hand: display name, slash-separated aliases, the full
 * binomial and an unambiguous genus. When an older KB artifact has no
 * entities table we fall back to the chunk herb names alone — degraded,
 * but never broken, and "St. John's Wort" still resolves from
 * "st johns wort" because both sides go through normPhrase.
 */
function entityTable(herbDocs) {
  // One entry per plant, keyed by the normalised name, so the database's
  // "Ashwagandha" and a monograph's "ASHWAGANDHA" do not become two
  // organisms. The display name we keep is the readable one.
  const byNorm = new Map();
  const merge = (herb, keys) => {
    const norm = normPhrase(herb);
    if (!norm) return;
    let e = byNorm.get(norm);
    if (!e) { e = { herb, keys: new Set() }; byNorm.set(norm, e); }
    else if (e.herb === e.herb.toUpperCase() && herb !== herb.toUpperCase()) e.herb = herb;
    for (const k of keys) if (k && k.length >= 4) e.keys.add(k);
  };

  const fromChunks = [...herbDocs.keys()];
  if (Array.isArray(KB.entities) && KB.entities.length) {
    for (const e of KB.entities) {
      if (!e || !e.herb) continue;
      merge(e.herb, (e.keys || []).map(normPhrase));
    }
  }
  // Chunk herb names are added either way: a monograph heading the
  // builder never saw still has to be reachable by its own name.
  for (const herb of fromChunks) {
    const keys = String(herb).split('/').map(normPhrase);
    keys.push(normPhrase(herb));
    merge(herb, keys);
  }

  const out = [];
  for (const e of byNorm.values()) if (e.keys.size) out.push({ herb: e.herb, keys: [...e.keys] });
  return out;
}

// ── Question intent → which source types matter ──────────────────
// Run against the CORRECTED question, so "contraindacations" and
// "warfrin" still select the safety corpus.
const INTENT_BOOSTS = [
  [/interact|contraindicat|safe|safety|avoid|warfarin|pregnan|breastfeed|medication|side.?effect|toxic/i,
    { safety: 2.2, evidence: 1.1 }],
  [/extract|ratio|macerat|decoct|tincture|spagyric|solvent|ethanol|how do (i|we) (make|prepare)|preparation|dose|dosage/i,
    { preparation: 1.9, proprietary: 1.5 }],
  [/identif|forage|harvest|look like|which part|botanical|species|family|storage|quality/i,
    { identification: 1.9 }],
  [/tcm|meridian|element|energetic|traditional|ayurved|spirit|ceremony|ritual|folklore/i,
    { traditional: 1.8 }],
  [/mechanism|pharmacolog|study|studies|trial|evidence|research|receptor|clinical/i,
    { evidence: 1.7 }],
  [/our |we |house |fungai|protocol|sop|batch|formula engine|how do you (make|build|compose)/i,
    { proprietary: 2.4 }],
];

function intentWeights(query) {
  const w = {};
  for (const [re, boosts] of INTENT_BOOSTS) {
    if (!re.test(query)) continue;
    for (const [type, mult] of Object.entries(boosts)) w[type] = Math.max(w[type] || 1, mult);
  }
  return w;
}

const K1 = 1.2, B = 0.75;

/** Read a question through the terminology layer. Exported so the lab
 *  notebook and the endpoint can reuse one reading of one question. */
function interpretQuery(query) {
  return interpret(query, buildIndex().lexicon);
}

/**
 * Search the knowledge base.
 *
 * @param {string} query
 * @param {object} [opts]
 * @param {number} [opts.k=6]            how many chunks to return
 * @param {number} [opts.perHerb=3]      max chunks from any one herb
 * @param {string[]} [opts.types]        restrict to these source types
 * @param {object} [opts.interpretation] a reading from interpretQuery(),
 *                                       to avoid interpreting twice
 * @returns {Array<{chunk, score, rank}>} ranked, diversified
 */
function search(query, opts = {}) {
  const { k = 6, perHerb = 3, types = null } = opts;
  const idx = buildIndex();
  const reading = opts.interpretation || interpret(query, idx.lexicon);
  if (!reading.weights.size) return [];

  const scores = new Float64Array(idx.docs.length);
  const N = idx.docs.length;
  for (const [t, weight] of reading.weights) {
    const p = idx.postings.get(t);
    if (!p) continue;
    const df = p.length / 2;
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    for (let j = 0; j < p.length; j += 2) {
      const i = p[j], tf = p[j + 1];
      const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * idx.lengths[i] / idx.avgLen));
      scores[i] += idf * norm * weight;
    }
  }

  // Entity hit: a whole name appearing in the question is a much stronger
  // signal than its tokens scoring individually. The terminology layer
  // resolved these, so a brand name, a binomial or a misspelling gets the
  // same bump the display name would.
  for (const herb of reading.entities) {
    const docSet = idx.docsByNorm.get(normPhrase(herb));
    if (!docSet) continue;
    const bump = 4 + Math.min(10, String(herb).length) / 10;
    for (const i of docSet) scores[i] += bump;
  }

  const weights = intentWeights(reading.corrected);
  const ranked = [];
  for (let i = 0; i < N; i++) {
    if (!scores[i]) continue;
    const d = idx.docs[i];
    if (types && !types.includes(d.type)) continue;
    ranked.push({ i, score: scores[i] * (weights[d.type] || 1) });
  }
  ranked.sort((a, b) => b.score - a.score);

  // Diversify: cap per herb and per source document.
  const perHerbCount = new Map(), perSourceCount = new Map();
  const out = [];
  for (const r of ranked) {
    const d = idx.docs[r.i];
    const hKey = d.herb || d.source;
    const sKey = d.source;
    if ((perHerbCount.get(hKey) || 0) >= perHerb) continue;
    if ((perSourceCount.get(sKey) || 0) >= perHerb) continue;
    perHerbCount.set(hKey, (perHerbCount.get(hKey) || 0) + 1);
    perSourceCount.set(sKey, (perSourceCount.get(sKey) || 0) + 1);
    out.push({ chunk: d, score: Math.round(r.score * 100) / 100, rank: out.length + 1 });
    if (out.length >= k) break;
  }
  return out;
}

function kbStats() {
  const idx = buildIndex();
  const byType = {};
  for (const d of idx.docs) byType[d.type] = (byType[d.type] || 0) + 1;
  return {
    version: KB.version,
    chunks: idx.docs.length,
    byType,
    terms: idx.postings.size,
    lexicon: idx.lexicon.stats,
  };
}

/** The curated vocabulary terms the corpus does not contain. See the
 *  dead-term rule in vocabulary.cjs. */
function lexiconReport() {
  const idx = buildIndex();
  return { stats: idx.lexicon.stats, dead: idx.lexicon.dead };
}

/** The built lexicon itself. For tests that audit the curated tables
 *  against the corpus; callers should use interpretQuery(). */
function lexicon() {
  return buildIndex().lexicon;
}

module.exports = {
  search, tokenize, interpretQuery, kbStats, lexiconReport, lexicon,
  KB_VERSION: KB.version,
};
