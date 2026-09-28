// src/server/formula-engine/percentages.js
//
// Score-weighted percentage distribution with two ceilings:
//   · a trace herb (lavender, ginger etc — potent essential oils /
//     dominant flavours) never exceeds 5% of the bottle;
//   · any other herb never exceeds 40% (Robin, D3 2026-09-28 — before
//     this, one herb could take up to 80% of a 3-herb bottle).
// Share a capped herb cannot take is handed to the uncapped herbs in
// proportion to their scores, repeated until nothing is over its cap.
// Every herb keeps at least 1%.
//
// Since engine 2.5 this is the ONLY place percentages are set — MYCO
// chooses herbs but no longer sends percentages (D2, option C).
//
// Originally lifted from public/find-your-formula/index.html
// lines 2602–2627 (trace cap only, Math.round + drift to the top herb).

const { isTrace } = require('./traces');

const TRACE_PCT_CAP = 5;
const MAX_SHARE_PCT = 40;
const MIN_SHARE_PCT = 1;

// The ceiling for each herb. A bottle needs at least three main herbs
// for 40% to be reachable (3 × 40 ≥ 100); the engine never composes a
// smaller one (picker.js MIN_MAIN_HERBS), but the pro analysis can hand
// us any list, so a short list gets the smallest ceiling that still adds
// up to 100 instead of a total that cannot.
function ceilings(herbs) {
  const trace = herbs.map(h => isTrace(h));
  const mains = trace.filter(t => !t).length;
  const traceRoom = trace.filter(Boolean).length * TRACE_PCT_CAP;
  const mainCap = mains ? Math.max(MAX_SHARE_PCT, Math.ceil((100 - traceRoom) / mains)) : 100;
  let hi = trace.map(t => (t ? TRACE_PCT_CAP : mainCap));
  if (hi.reduce((a, b) => a + b, 0) < 100) {
    const even = Math.ceil(100 / herbs.length);
    hi = hi.map(c => Math.max(c, even));
  }
  return hi;
}

// Proportional shares with ceilings (water-filling): any herb whose
// proportional share is over its ceiling is fixed at the ceiling and the
// rest is re-shared among the others, until no one is over.
function cappedShares(weights, hi, total) {
  const n = weights.length;
  const val = new Array(n).fill(null);
  let fixed = 0;
  for (let pass = 0; pass <= n; pass++) {
    const free = val.map((v, i) => (v === null ? i : -1)).filter(i => i >= 0);
    if (!free.length) break;
    const room = total - fixed;
    const wFree = free.reduce((s, i) => s + weights[i], 0);
    let capped = false;
    for (const i of free) {
      if (room * weights[i] / wFree > hi[i]) { val[i] = hi[i]; fixed += hi[i]; capped = true; }
    }
    if (!capped) { for (const i of free) val[i] = room * weights[i] / wFree; break; }
  }
  return val.map(v => (v === null ? 0 : v));
}

function assignPercentages(herbs) {
  if (!herbs || !herbs.length) return [];
  const weights = herbs.map(h => Math.max(1, h._score || 1));
  const hi = ceilings(herbs);
  const val = cappedShares(weights, hi, 100);

  // Whole numbers that still add to 100 and respect every ceiling:
  // round down, then hand the missing points to the largest remainders.
  // A herb below its ceiling always has room for one more point, since
  // the ceilings are whole numbers.
  const pct = val.map(v => Math.floor(v + 1e-9));
  let left = 100 - pct.reduce((a, b) => a + b, 0);
  const order = val.map((v, i) => i).sort((i, j) =>
    (val[j] - pct[j]) - (val[i] - pct[i]) || weights[j] - weights[i] || i - j);
  for (const i of order) {
    if (left <= 0) break;
    if (pct[i] + 1 <= hi[i]) { pct[i] += 1; left -= 1; }
  }

  // Every herb in the bottle is at least 1%, taken from the largest
  // share that has a point to spare.
  for (let i = 0; i < pct.length; i++) {
    if (pct[i] >= MIN_SHARE_PCT) continue;
    let top = -1;
    for (let j = 0; j < pct.length; j++) if (pct[j] > MIN_SHARE_PCT && (top < 0 || pct[j] > pct[top])) top = j;
    if (top < 0) break;
    pct[top] -= MIN_SHARE_PCT - pct[i];
    pct[i] = MIN_SHARE_PCT;
  }
  return pct;
}

module.exports = { assignPercentages, TRACE_PCT_CAP, MAX_SHARE_PCT, MIN_SHARE_PCT };
