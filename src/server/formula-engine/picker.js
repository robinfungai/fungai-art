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
const { scoreHerb, scoreBreakdown } = require('./scoring');
const { safetyFilter, applyMinorGate, passesAccess, passesProfileSafety } = require('./safety');
const { isTrace } = require('./traces');
const { isGABAergic, isCNSStimulant, isStrongStimulant, isSerotonergic, isLaxative, fitsTimeOfUse, fitsGoal, categoryOf } = require('./pharmacology');
const { RULES, newLoad, seatBlocker, seat } = require('./rules');

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

// Unordered answers are sorted first (audit 2026-09-28): the same safety
// flags ticked in a different order used to seed the tie-break
// differently, and gave a different bottle in 31% of multi-flag
// profiles. `intentions` stays in order — its order IS the ranking.
const setKey = v => (Array.isArray(v) ? [...new Set(v.map(String))].sort().join(',') : '');
function profileSeed(a) {
  return [
    a.intention, (a.intentions || []).join(','), a.pattern, a.patternSub,
    a.time, a.stress, a.duration, a.age, a.sleep, setKey(a.avoid),
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

// Engine 2.5 (D3, 2026-09-28): safety flags no longer add a herb. More
// restrictions used to force a LARGER bottle out of a SMALLER pool.
function targetHerbCount(a) {
  let n = 4;
  if (a.notes && a.notes.trim().length > 80) n += 1;
  if (a.patternSub) n += 1;
  if (a.duration === 'year_plus' || a.duration === 'lifelong') n += 1;
  if (a.sleep === 'very_broken' || a.sleep === 'under_6') n += 1;
  if (!a.notes && !a.patternSub && a.duration === 'weeks' && (a.sleep === 'restorative_6plus' || a.sleep === 'restorative')) {
    n = 3;
  }
  return Math.min(7, Math.max(3, n));
}

// A bottle needs at least three main (non-trace) herbs, so that none of
// them carries more than 40% (percentages.js). Fewer than that is not a
// smaller bottle, it is no bottle: NO_MATCH / NO_SAFE_MATCH.
const MIN_MAIN_HERBS = RULES.MIN_MAIN_HERBS;

// Every herb that may be offered for this profile, scored, best first,
// one per first clause of its main use. `safety: false` skips the
// person's own safety answers (flags, minor gate, pregnancy / history) —
// used ONLY to tell NO_MATCH from NO_SAFE_MATCH, never to fill a bottle.
function rankedCandidates(a, { safety = true } = {}) {
  const pool = ensurePool();
  if (!pool || !pool.length) return [];
  // Two-stage safety: (1) user's own avoid[] filter plus pro-only
  // access (Ephedra reaches a bottle only from the pro composer) and
  // time of use (nothing stimulating in an evening or sleep formula —
  // pharmacology.js fitsTimeOfUse), then (2) minor
  // gate — the second is a no-op unless a._minor is truthy, in which
  // case it strips gated/sedative/psych_med/contraceptive/GABA-heavy/
  // CNS-stimulant herbs regardless of what avoid[] said.
  const safe = pool.filter(h =>
    (!safety || (safetyFilter(h, a.avoid || []) && passesProfileSafety(h, a))) &&
    passesAccess(h, a) && fitsTimeOfUse(h, a) && fitsGoal(h, a));
  const gated = safety ? applyMinorGate(safe, a) : safe;
  const scored = gated.map(h => ({ h, s: scoreHerb(h, a) })).filter(x => x.s > 0);
  sortScored(scored, a);

  const seen = new Set();
  return scored.filter(x => {
    const key = (shortNote(x.h) || x.h.name).slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// One strict walk down the ranking (D3, 2026-09-28). The second walk
// that used to drop the category cap when a bottle came up short is
// gone: a rule that bends when it is inconvenient is not a rule. (It
// never fired in 24,000 test profiles, so no bottle lost anything.)
// A trace herb takes a seat only in a bottle of four or more — in a
// three-herb bottle it would leave two main herbs carrying 95%.
function walk(uniq, a) {
  const target = targetHerbCount(a);
  const openToGated = !!a._gatedOptIn;
  const load = newLoad();
  const composed = [];
  for (const x of uniq) {
    if (composed.length >= target) break;
    if (x.h.gated && !openToGated) continue;
    if (isTrace(x.h) && target < MIN_MAIN_HERBS + 1) continue;
    // Every other seating rule lives in rules.js, shared with the MYCO
    // validator, so the two cannot drift apart.
    if (seatBlocker(load, x.h)) continue;
    composed.push(x);
    seat(load, x.h);
  }
  return composed;
}

const mainCount = composed => composed.filter(x => !isTrace(x.h)).length;

function pickFormula(a) {
  const composed = walk(rankedCandidates(a), a);
  if (mainCount(composed) < MIN_MAIN_HERBS) return [];
  return composed.map(x => Object.assign({}, x.h, { _score: x.s, _cat: categoryOf(x.h) }));
}

// Why pickFormula came back empty. NO_SAFE_MATCH: the answers alone would
// fill a bottle, the person's safety answers are what empty it — the page
// can say so. NO_MATCH: even without them there is not enough to build on.
function noMatchCode(a) {
  return mainCount(walk(rankedCandidates(a, { safety: false }), a)) >= MIN_MAIN_HERBS ? 'NO_SAFE_MATCH' : 'NO_MATCH';
}

// STEP 5.5 · Candidate set builder for the MYCO validator path.
// Returns the top-N scored, deduplicated herbs — BEFORE the category/
// load caps in pickFormula run. This is the bounded universe MYCO is
// allowed to pick within. myco-validator.js rejects any pick outside
// this set, then applies the same caps pickFormula applies.
function buildScoredCandidates(a, limit = 20) {
  const uniq = rankedCandidates(a);
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
      _isStrongStimulant: isStrongStimulant(x.h),
      _isSerotonergic: isSerotonergic(x.h),
      _isLaxative:     isLaxative(x.h),
    }));
}

// ── Pro composer · "why this herb" (2026-09-28) ───────────────────
// For a practitioner only (fyf-compose checks). Re-scores the seated
// herbs with scoreBreakdown — the same function the ranking uses, so the
// explanation cannot drift from the decision — and lists the best herbs
// that passed every safety filter but were not seated, for swapping.
const round2 = x => Math.round(x * 100) / 100;
function describe(h, a) {
  const b = scoreBreakdown(h, a);
  const parts = {};
  for (const k in b.parts) if (Math.abs(b.parts[k]) > 1e-9) parts[k] = round2(b.parts[k]);
  return {
    id:           h.id,
    name:         h.name,
    score:        round2(b.total),
    parts,
    halved:       !b.servesGoal,
    goals:        (h._ax && h._ax.intentions) || [],
    grade:        h.evidence_grade || null,
    caution:      h.caution_level || null,
    cns:          h.cns_action || null,
    serotonergic: isSerotonergic(h),
    trace:        isTrace(h),
    category:     categoryOf(h),
    proOnly:      !!h.proOnly,
  };
}
function explainPicks(a, chosenIds, altLimit = 12) {
  const pool = ensurePool();
  if (!pool || !pool.length) return { herbs: [], alternatives: [] };
  const safe = pool.filter(h => safetyFilter(h, a.avoid || []) && passesAccess(h, a) && passesProfileSafety(h, a) && fitsTimeOfUse(h, a) && fitsGoal(h, a));
  const eligible = applyMinorGate(safe, a).filter(h => !h.gated || a._gatedOptIn);
  const byId = new Map(pool.map(h => [String(h.id), h]));
  const chosen = new Set((chosenIds || []).map(String));
  const herbs = (chosenIds || []).map(id => byId.get(String(id))).filter(Boolean).map(h => describe(h, a));
  const scored = eligible.filter(h => !chosen.has(String(h.id)))
    .map(h => ({ h, s: scoreHerb(h, a) })).filter(x => x.s > 0);
  sortScored(scored, a);
  const alternatives = scored.slice(0, altLimit).map(x => describe(x.h, a));
  return { herbs, alternatives };
}

module.exports = { targetHerbCount, pickFormula, noMatchCode, MIN_MAIN_HERBS, buildScoredCandidates, explainPicks };
