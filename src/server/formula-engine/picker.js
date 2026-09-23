// src/server/formula-engine/picker.js
//
// targetHerbCount + pickFormula. The deterministic composer — filters
// by safety, scores every remaining herb, dedupes by first-clause of
// primary function, then walks the ranked list respecting category
// balance + trace/GABA/stimulant caps + the ceremonial gate.
//
// LIFTED VERBATIM from
//   public/find-your-formula/index.html lines 2283–2362.

const { ensurePool, shortNote } = require('./axes');
const { scoreHerb } = require('./scoring');
const { safetyFilter, applyMinorGate } = require('./safety');
const { isTrace } = require('./traces');
const { isGABAergic, isCNSStimulant, categoryOf } = require('./pharmacology');

// ── Tie-breaking ──────────────────────────────────────────────────
// scoreHerb builds a score from a handful of coarse constants —
// pattern 4, stress 3, time 2, intention 5/n — so exact ties are
// common: for some profiles the top six candidates score identically.
//
// Until 2026-09-23 those ties fell through to Array.prototype.sort's
// stability, which meant POSITION IN herbs.ts decided the bottle. An
// ordering nobody designed was doing the picking, and it showed:
// Ashwagandha appeared in 39.6% of formulas, the top five herbs took
// 28.1% of all seats, and 54 herbs never appeared at all.
//
// Ties now break on two criteria that were actually chosen:
//   1. evidence grade — the better-evidenced herb wins
//   2. a hash of (answers, herb id) — rotates which of several equally
//      graded herbs is seated, from one profile to the next
//
// Determinism is preserved: the hash depends only on the answers and
// the herb, never on clock or randomness, so identical answers always
// yield an identical bottle. (tests/fixtures compare on this.)
const GRADE_RANK = {
  'A+': 0, 'A': 1, 'A-': 2,
  'B+': 3, 'B': 4, 'B-': 5,
  'C+': 6, 'C': 7, 'C-': 8,
  'D+': 9, 'D': 10, 'D-': 11,
};
function gradeRank(h) {
  const g = String((h && h.evidence_grade) || '').trim().toUpperCase();
  // Ungraded sits mid-table: an unknown grade should neither win nor
  // lose a tie against a graded herb on the strength of its blankness.
  return Object.prototype.hasOwnProperty.call(GRADE_RANK, g) ? GRADE_RANK[g] : 6.5;
}

function fnv1a(str) {
  let x = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    x ^= str.charCodeAt(i);
    x = Math.imul(x, 16777619) >>> 0;
  }
  return x >>> 0;
}

function profileSeed(a) {
  return [
    a.intention, (a.intentions || []).join(','), a.pattern, a.patternSub,
    a.time, a.stress, a.duration, a.age, a.sleep, (a.avoid || []).join(','),
  ].join('|');
}

// Comparator for two equally-scored candidates, bound to one profile.
function makeTieBreaker(a) {
  const seed = profileSeed(a);
  return (x, y) => {
    const g = gradeRank(x.h) - gradeRank(y.h);
    if (g !== 0) return g;
    const hx = fnv1a(seed + '::' + String(x.h.id || x.h.name));
    const hy = fnv1a(seed + '::' + String(y.h.id || y.h.name));
    if (hx !== hy) return hx - hy;
    return String(x.h.name).localeCompare(String(y.h.name));
  };
}

// Sort by score, then by the designed tie-break. EPS guards against
// float noise from the 5/n intention term.
const SCORE_EPS = 1e-9;
function sortScored(scored, a) {
  const tie = makeTieBreaker(a);
  scored.sort((x, y) => {
    const d = y.s - x.s;
    if (Math.abs(d) > SCORE_EPS) return d;
    return tie(x, y);
  });
  return scored;
}

function targetHerbCount(a) {
  let n = 4;
  if (a.notes && a.notes.trim().length > 80) n += 1;
  if (a.patternSub) n += 1;
  if (a.duration === 'year_plus' || a.duration === 'lifelong') n += 1;
  if (a.sleep === 'very_broken' || a.sleep === 'under_6') n += 1;
  const medFlags = (a.avoid || []).filter(k => k !== 'none').length;
  if (medFlags >= 2) n += 1;
  if (!a.notes && !a.patternSub && a.duration === 'weeks' && (a.sleep === 'restorative_6plus' || a.sleep === 'restorative')) {
    n = 3;
  }
  return Math.min(7, Math.max(3, n));
}

function pickFormula(a) {
  const pool = ensurePool();
  if (!pool || !pool.length) return [];
  // Two-stage safety: (1) user's own avoid[] filter, then (2) minor
  // gate — the second is a no-op unless a._minor is truthy, in which
  // case it strips gated/sedative/psych_med/contraceptive/GABA-heavy/
  // CNS-stimulant herbs regardless of what avoid[] said.
  const safe        = pool.filter(h => safetyFilter(h, a.avoid || []));
  const minorGated  = applyMinorGate(safe, a);
  const scored = minorGated.map(h => ({ h, s: scoreHerb(h, a) })).filter(x => x.s > 0);
  sortScored(scored, a);

  const seen = new Set();
  const uniq = scored.filter(x => {
    const key = (shortNote(x.h) || x.h.name).slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const target = targetHerbCount(a);
  const openToGated = !!a._gatedOptIn;

  const catCount = {};
  const composed = [];
  let traceUsed = 0, gabaUsed = 0, stimUsed = 0;
  for (const x of uniq) {
    if (composed.length >= target) break;
    if (x.h.gated && !openToGated) continue;
    const cat = categoryOf(x.h);
    if ((catCount[cat] || 0) >= 2) continue;
    if (isTrace(x.h)) { if (traceUsed >= 1) continue; }
    if (isGABAergic(x.h)) { if (gabaUsed >= 2) continue; }
    if (isCNSStimulant(x.h)) { if (stimUsed >= 2) continue; }
    composed.push(x);
    catCount[cat] = (catCount[cat] || 0) + 1;
    if (isTrace(x.h)) traceUsed += 1;
    if (isGABAergic(x.h)) gabaUsed += 1;
    if (isCNSStimulant(x.h)) stimUsed += 1;
  }

  if (composed.length < target) {
    for (const x of uniq) {
      if (composed.length >= target) break;
      if (composed.includes(x)) continue;
      if (x.h.gated && !openToGated) continue;
      if (isTrace(x.h) && traceUsed >= 1) continue;
      if (isGABAergic(x.h) && gabaUsed >= 2) continue;
      if (isCNSStimulant(x.h) && stimUsed >= 2) continue;
      composed.push(x);
      if (isTrace(x.h)) traceUsed += 1;
      if (isGABAergic(x.h)) gabaUsed += 1;
      if (isCNSStimulant(x.h)) stimUsed += 1;
    }
  }

  return composed.map(x => Object.assign({}, x.h, { _score: x.s, _cat: categoryOf(x.h) }));
}

// STEP 5.5 · Candidate set builder for the MYCO validator path.
// Returns the top-N scored, deduplicated herbs — BEFORE the category/
// load caps in pickFormula run. This is the bounded universe MYCO is
// allowed to pick within. myco-validator.js rejects any pick outside
// this set, then applies the same caps pickFormula applies.
function buildScoredCandidates(a, limit = 20) {
  const pool = ensurePool();
  if (!pool || !pool.length) return [];
  const safe       = pool.filter(h => safetyFilter(h, a.avoid || []));
  const minorGated = applyMinorGate(safe, a);
  const scored = minorGated.map(h => ({ h, s: scoreHerb(h, a) })).filter(x => x.s > 0);
  sortScored(scored, a);

  const seen = new Set();
  const uniq = scored.filter(x => {
    const key = (shortNote(x.h) || x.h.name).slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const openToGated = !!a._gatedOptIn;
  return uniq
    .filter(x => openToGated || !x.h.gated)
    .slice(0, limit)
    .map(x => Object.assign({}, x.h, {
      _score:          x.s,
      _cat:            categoryOf(x.h),
      _isTrace:        isTrace(x.h),
      // Include the load-cap flags MYCO needs so it can respect the
      // GABA / STIM / TRACE caps in its picks. Without these, MYCO
      // doesn't know which herbs the validator will treat as
      // pharmacologically loaded and regularly proposes formulas
      // the validator rejects (MYCO_GABA_LOAD_EXCEEDED etc).
      _isGABAergic:    isGABAergic(x.h),
      _isCNSStimulant: isCNSStimulant(x.h),
    }));
}

module.exports = { targetHerbCount, pickFormula, buildScoredCandidates };
