// src/server/myco/retrieve.cjs
//
// MYCO's RETRIEVAL layer. Lexical BM25 over the generated knowledge
// base, with three domain adjustments that matter more here than any
// clever ranking maths would:
//
//   1. Herb-name matching. "is reishi safe with warfarin" must reach
//      Reishi's chunks even though "reishi" is one token among many.
//   2. Intent boosting. A question about interactions should surface
//      safety chunks; a question about ratios should surface
//      preparation chunks.
//   3. Source diversity. Without a cap, six sections of one monograph
//      crowd out the herb database and our own protocols.
//
// No embeddings, no vector service, no per-query cost — the corpus is
// small (~2.7k chunks) and the vocabulary is domain-specific, which is
// exactly where BM25 holds up. A vector layer can be added later behind
// this same `search()` signature without touching callers.

const KB = require('./kb.generated.cjs');

const STOP = new Set(('a an the and or but if of for to in on with without at by from as is are was were be been being ' +
  'it its this that these those i you he she they we me my your what which who how when where why can could should ' +
  'would will do does did not no yes any some more most much many very there here about into than then so such own ' +
  'good best help me please tell give show').split(' '));

function tokenize(s) {
  const out = [];
  for (let raw of String(s).toLowerCase().split(/[^a-z0-9À-ɏ'-]+/)) {
    if (!raw) continue;
    raw = raw.replace(/^'+|'+$/g, '');
    if (raw.length < 2 || STOP.has(raw)) continue;
    // Light suffix folding so "interactions" matches "interaction".
    if (raw.length > 4 && raw.endsWith('ies')) raw = raw.slice(0, -3) + 'y';
    else if (raw.length > 4 && raw.endsWith('es')) raw = raw.slice(0, -2);
    else if (raw.length > 3 && raw.endsWith('s') && !raw.endsWith('ss')) raw = raw.slice(0, -1);
    out.push(raw);
  }
  return out;
}

// ── Index (built once per function instance) ─────────────────────
let INDEX = null;
function buildIndex() {
  if (INDEX) return INDEX;
  const docs = KB.chunks;
  const postings = new Map();   // term → [docIndex, tf, docIndex, tf, …]
  const lengths = new Float64Array(docs.length);
  const herbNames = new Map();  // lowercased herb name → Set(docIndex)

  docs.forEach((d, i) => {
    // The title is indexed twice: a term in "Reishi — safety" should
    // outweigh the same term buried in a paragraph.
    const terms = tokenize(d.title).concat(tokenize(d.title), tokenize(d.section), tokenize(d.text));
    lengths[i] = terms.length;
    const tf = new Map();
    for (const t of terms) tf.set(t, (tf.get(t) || 0) + 1);
    for (const [t, n] of tf) {
      let p = postings.get(t);
      if (!p) { p = []; postings.set(t, p); }
      p.push(i, n);
    }
    if (d.herb) {
      const key = String(d.herb).toLowerCase();
      if (!herbNames.has(key)) herbNames.set(key, new Set());
      herbNames.get(key).add(i);
    }
  });

  let total = 0;
  for (let i = 0; i < lengths.length; i++) total += lengths[i];
  INDEX = { docs, postings, lengths, avgLen: total / Math.max(1, docs.length), herbNames };
  return INDEX;
}

// ── Question intent → which source types matter ──────────────────
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

/**
 * Search the knowledge base.
 *
 * @param {string} query
 * @param {object} [opts]
 * @param {number} [opts.k=6]            how many chunks to return
 * @param {number} [opts.perHerb=3]      max chunks from any one herb
 * @param {string[]} [opts.types]        restrict to these source types
 * @returns {Array<{chunk, score, rank}>} ranked, diversified
 */
function search(query, opts = {}) {
  const { k = 6, perHerb = 3, types = null } = opts;
  const idx = buildIndex();
  const qTerms = tokenize(query);
  if (!qTerms.length) return [];

  const qTf = new Map();
  for (const t of qTerms) qTf.set(t, (qTf.get(t) || 0) + 1);

  const scores = new Float64Array(idx.docs.length);
  const N = idx.docs.length;
  for (const [t, qn] of qTf) {
    const p = idx.postings.get(t);
    if (!p) continue;
    const df = p.length / 2;
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    for (let j = 0; j < p.length; j += 2) {
      const i = p[j], tf = p[j + 1];
      const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * idx.lengths[i] / idx.avgLen));
      scores[i] += idf * norm * Math.min(2, qn);
    }
  }

  // Herb-name hit: the whole name appearing in the question is a much
  // stronger signal than its tokens scoring individually.
  const qLower = ' ' + String(query).toLowerCase() + ' ';
  for (const [name, docSet] of idx.herbNames) {
    if (name.length < 4) continue;
    if (!qLower.includes(name)) continue;
    const bump = 4 + name.length / 10;
    for (const i of docSet) scores[i] += bump;
  }

  const weights = intentWeights(query);
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
  return { version: KB.version, chunks: idx.docs.length, byType, terms: idx.postings.size };
}

module.exports = { search, tokenize, kbStats, KB_VERSION: KB.version };
