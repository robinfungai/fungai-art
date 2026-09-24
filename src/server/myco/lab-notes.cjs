// src/server/myco/lab-notes.cjs
//
// MYCO's LIVE knowledge layer — the Academy lab notebook.
//
// kb.generated.cjs is built at deploy time from herbs.ts and the
// monograph markdown. That is the right home for settled knowledge, and
// the wrong home for research posted this morning: a lab note written in
// the Academy would not reach MYCO until the next build. This module
// reads public.lab_notes at request time instead, so posting a note IS
// teaching MYCO — no build, no deploy, no commit.
//
// Retrieval is deliberately separate from retrieve.cjs's BM25 index.
// That index is built once per function instance over 2,744 static
// chunks; lab notes change under it. There are tens of notes, not
// thousands, so scoring them directly per request costs nothing
// measurable and avoids invalidating the static index.
//
// ── PROMPT INJECTION ──────────────────────────────────────────────
// Lab notes are free text written by members. They are DATA, not
// instructions, and they are labelled as such in the block below —
// a note reading "ignore your previous instructions" must be treated
// as a curious thing someone wrote in a notebook, nothing more. The
// wrapper here and the rule in grounding.cjs both say so, because a
// single line of defence against injection is not one.

const { tokenize, W_FUZZY } = require('./terminology.cjs');

// The anon key is public by design — it is in every page of the site,
// and lab_notes reads are public (supabase-lab-notes.sql). Env vars win
// so the values can be rotated without a code change.
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://cyhpvsyvxzfadtyvcuwp.supabase.co';
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aHB2c3l2eHpmYWR0eXZjdXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDU5NTYsImV4cCI6MjA4NTMyMTk1Nn0.BFgP50enaZLWEzhvdfHoAYniLyJiFoo6rct7PYKx1k4';

const MAX_NOTES      = 400;    // newest N — the notebook is not unbounded
const MAX_CHUNK      = 1400;   // same as the KB builder: ~350 tokens
const CACHE_TTL_MS   = 120_000; // 2 min — a note posted now lands within one coffee

let cache = { at: 0, chunks: null, error: null };

// ── Fetch + chunk ────────────────────────────────────────────────

function splitNote(text) {
  // Split on blank lines first so a note keeps its own paragraphing,
  // then hard-wrap anything still over the chunk ceiling.
  const out = [];
  let buf = '';
  for (const para of String(text).split(/\n\s*\n/)) {
    if ((buf + '\n\n' + para).length > MAX_CHUNK && buf) { out.push(buf.trim()); buf = para; }
    else { buf = buf ? buf + '\n\n' + para : para; }
  }
  if (buf.trim()) out.push(buf.trim());
  const capped = [];
  for (const piece of out) {
    if (piece.length <= MAX_CHUNK) { capped.push(piece); continue; }
    for (let i = 0; i < piece.length; i += MAX_CHUNK) capped.push(piece.slice(i, i + MAX_CHUNK));
  }
  return capped;
}

async function loadLabNotes() {
  const now = Date.now();
  if (cache.chunks && now - cache.at < CACHE_TTL_MS) return cache.chunks;

  const url = SUPABASE_URL.replace(/\/+$/, '') +
    '/rest/v1/lab_notes?select=id,chapter_id,text,author_name,created_at' +
    '&order=created_at.desc&limit=' + MAX_NOTES;

  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON },
    });
    if (!res.ok) {
      cache = { at: now, chunks: [], error: 'lab_notes HTTP ' + res.status };
      return cache.chunks;
    }
    const rows = await res.json();
    const chunks = [];
    for (const r of Array.isArray(rows) ? rows : []) {
      const text = String(r.text || '').trim();
      if (text.length < 40) continue;              // a stub is not knowledge
      const when = String(r.created_at || '').slice(0, 10);
      const who  = r.author_name ? String(r.author_name).slice(0, 60) : 'a member';
      const parts = splitNote(text);
      parts.forEach((part, i) => {
        chunks.push({
          id:    'lab_' + r.id + (parts.length > 1 ? '_' + (i + 1) : ''),
          type:  'lab',
          title: 'Lab notebook · ' + (r.chapter_id || 'general') +
                 (parts.length > 1 ? ' (' + (i + 1) + '/' + parts.length + ')' : ''),
          source: 'Academy lab note — ' + who + ', ' + when,
          herb:  null,
          text:  part,
        });
      });
    }
    cache = { at: now, chunks, error: null };
    return chunks;
  } catch (e) {
    // Never let the notebook being unreachable break an answer — MYCO
    // falls back to the static knowledge base.
    cache = { at: now, chunks: cache.chunks || [], error: e && e.message };
    return cache.chunks;
  }
}

// ── Scoring ──────────────────────────────────────────────────────
// Plain TF-IDF cosine-ish overlap. With tens of documents, BM25's
// length normalisation buys nothing that matters, and this stays
// readable. Recency breaks ties: a newer note on the same subject is
// usually the better one.
//
// The notebook is scored through the SAME reading of the question as the
// static corpus (terminology.cjs), passed in by the caller. A member who
// types "ashwaganda" must reach a lab note about Ashwagandha as surely as
// they reach the monograph — and the notebook is where a misspelling is
// most likely, because notes are written at the bench in a hurry too.
//
// Expansion terms count for the score but NOT for the relevance gate
// below: a note earns its place by sharing words the member actually
// typed, not words we guessed on their behalf.

function scoreLabNotes(query, chunks, k = 3, interpretation = null) {
  const weights = interpretation && interpretation.weights instanceof Map
    ? interpretation.weights
    : new Map(tokenize(query).map(t => [t, 1]));
  if (!weights.size || !chunks.length) return [];

  const N = chunks.length;
  const typed = new Set();
  for (const [t, w] of weights) if (w >= W_FUZZY) typed.add(t);

  // Document frequency across the notebook.
  const df = new Map();
  const docTerms = chunks.map(c => {
    const terms = tokenize(c.title + ' ' + c.text);
    const seen = new Set(terms);
    for (const t of seen) if (weights.has(t)) df.set(t, (df.get(t) || 0) + 1);
    return terms;
  });

  const ranked = [];
  for (let i = 0; i < N; i++) {
    const tf = new Map();
    for (const t of docTerms[i]) if (weights.has(t)) tf.set(t, (tf.get(t) || 0) + 1);
    if (!tf.size) continue;
    let score = 0;
    let typedHits = 0;
    for (const [t, n] of tf) {
      const idf = Math.log(1 + (N + 1) / ((df.get(t) || 0) + 0.5));
      score += idf * (1 + Math.log(n)) * (weights.get(t) || 1);
      if (typed.has(t)) typedHits++;
    }
    // A note is only worth surfacing if it is actually about the
    // question — one incidental word match is noise.
    if (typedHits < 2 && typed.size > 2) continue;
    ranked.push({ chunk: chunks[i], score: Math.round(score * 100) / 100 });
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, k);
}

/**
 * Retrieve lab-notebook extracts for a question.
 * Returns [] on any failure — the static KB always still answers.
 *
 * @param {object} [interpretation] the reading from interpretQuery(), so
 *        the notebook and the static corpus answer the same question.
 */
async function retrieveLabNotes(question, k = 3, interpretation = null) {
  try {
    const chunks = await loadLabNotes();
    return scoreLabNotes(question, chunks || [], k, interpretation);
  } catch (_) {
    return [];
  }
}

function labNotesStatus() {
  return { cached: (cache.chunks || []).length, at: cache.at, error: cache.error };
}

module.exports = { retrieveLabNotes, loadLabNotes, scoreLabNotes, labNotesStatus };
