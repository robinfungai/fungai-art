// src/server/formula-engine/percentages.js
//
// Score-weighted percentage distribution with a hard cap on trace
// herbs (lavender, ginger etc — potent essential oils / dominant
// flavours must never exceed 5% of the bottle). Excess % from capped
// traces redistributes proportionally to the non-trace herbs.
//
// LIFTED VERBATIM from
//   public/find-your-formula/index.html lines 2602–2627.

const { isTrace } = require('./traces');

function assignPercentages(herbs) {
  if (!herbs || !herbs.length) return [];
  const scores = herbs.map(h => Math.max(1, h._score || 1));
  const total = scores.reduce((a, b) => a + b, 0);
  let raw = scores.map(s => (s / total) * 100);
  let excess = 0;
  herbs.forEach((h, i) => {
    if (isTrace(h) && raw[i] > 5) { excess += raw[i] - 5; raw[i] = 5; }
  });
  if (excess > 0.01) {
    const nonTraceIdx = herbs.map((h, i) => isTrace(h) ? -1 : i).filter(i => i >= 0);
    const nonTraceTotal = nonTraceIdx.reduce((s, i) => s + raw[i], 0);
    if (nonTraceTotal > 0) {
      nonTraceIdx.forEach(i => { raw[i] += excess * (raw[i] / nonTraceTotal); });
    }
  }
  const pct = raw.map(p => Math.round(p));
  const drift = 100 - pct.reduce((a, b) => a + b, 0);
  if (drift !== 0) {
    let iMax = 0;
    for (let i = 1; i < pct.length; i++) if (pct[i] > pct[iMax]) iMax = i;
    pct[iMax] += drift;
  }
  return pct;
}

module.exports = { assignPercentages };
