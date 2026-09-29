// src/server/formula-engine/pair-rules.js
//
// Herb pairs the bottle must not hold together (external audit
// 2026-09-29, ninth finding; Robin's decisions the same night on
// docs/PAIR-CAUTIONS-REVIEW.md). Read by rules.js seatBlocker, so the
// deterministic picker and the MYCO validator both obey it.
//
//   BLOCK        never in the same bottle.
//   CONDITIONAL  never in the same bottle when the person's safety
//                answers (ticked, or named in the note) include `flag`.
//   SHOW         everything else: composed, and the caution is shown
//                (interactions.js). Not listed here.
//
// Every CONDITIONAL pair below is already covered today — that safety
// answer keeps one of the two herbs out on its own. They are written
// down anyway so the pair holds if a herb's flags ever change.
//
// Ids are herbs.ts ids. A pair is unordered.

const PAIR_RULES = [
  // ── BLOCK ─────────────────────────────────────────────────────
  { a: '204', b: '221', cls: 'BLOCK', why: 'Astragalus + Echinacea — "do not combine: conflicting mechanisms; choose one"' },
  { a: '238', b: '274', cls: 'BLOCK', why: "Garlic + Pau d'Arco — additive bleeding risk" },
  { a: '239', b: '274', cls: 'BLOCK', why: "Ginkgo + Pau d'Arco — additive bleeding risk" },
  { a: '274', b: '286', cls: 'BLOCK', why: "Pau d'Arco + Turmeric — additive bleeding risk" },
  { a: '274', b: '537', cls: 'BLOCK', why: "Pau d'Arco + Ginger — additive bleeding risk" },
  { a: '257', b: '288', cls: 'BLOCK', why: 'Kava + Valerian — both potently sedative; the sedative cap (2) alone let them share a bottle' },
  { a: '293', b: '303', cls: 'BLOCK', why: 'Wormwood + Sage — cumulative thujone, convulsant risk (was kept apart only by the one-trace rule)' },
  { a: '288', b: '542', cls: 'BLOCK', why: "Valerian + St John's Wort — Robin, 2026-09-29" },

  // ── CONDITIONAL ───────────────────────────────────────────────
  { a: '202', b: '230', cls: 'CONDITIONAL', flag: 'cardio_meds', why: 'Angelica + Cranberry — antiplatelet, with warfarin' },
  { a: '202', b: '238', cls: 'CONDITIONAL', flag: 'cardio_meds', why: 'Angelica + Garlic — antiplatelet stacking on anticoagulants' },
  { a: '202', b: '239', cls: 'CONDITIONAL', flag: 'cardio_meds', why: 'Angelica + Ginkgo — antiplatelet stacking on anticoagulants' },
  { a: '202', b: '286', cls: 'CONDITIONAL', flag: 'cardio_meds', why: 'Angelica + Turmeric — antiplatelet stacking on anticoagulants' },
  { a: '230', b: '238', cls: 'CONDITIONAL', flag: 'cardio_meds', why: 'Cranberry + Garlic — antiplatelet, with warfarin' },
  { a: '230', b: '239', cls: 'CONDITIONAL', flag: 'cardio_meds', why: 'Cranberry + Ginkgo — antiplatelet, with warfarin' },
  { a: '238', b: '292', cls: 'CONDITIONAL', flag: 'cardio_meds', why: 'Garlic + Willow Bark — additive bleeding with warfarin' },
  { a: '239', b: '292', cls: 'CONDITIONAL', flag: 'cardio_meds', why: 'Ginkgo + Willow Bark — additive bleeding with warfarin' },
  { a: '103', b: '216', cls: 'CONDITIONAL', flag: 'autoimmune',  why: 'Ashwagandha + Elderberry — immune-stimulating, autoimmune' },
  { a: '103', b: '221', cls: 'CONDITIONAL', flag: 'autoimmune',  why: 'Ashwagandha + Echinacea — immune-stimulating, autoimmune' },
  { a: '103', b: '543', cls: 'CONDITIONAL', flag: 'autoimmune',  why: 'Ashwagandha + Elderberry (cooked) — immune-stimulating, autoimmune' },
  { a: '525', b: '527', cls: 'CONDITIONAL', flag: 'pregnancy',   why: 'Guggulu + Manjistha — emmenagogues, never in pregnancy' },
  { a: '526', b: '527', cls: 'CONDITIONAL', flag: 'pregnancy',   why: 'Kalmegh + Manjistha — emmenagogues, never in pregnancy' },
  { a: '511', b: '527', cls: 'CONDITIONAL', flag: 'pregnancy',   why: 'Nirgundi + Manjistha — emmenagogues, never in pregnancy' },
  { a: '266', b: '303', cls: 'CONDITIONAL', flag: 'pregnancy',   why: 'Milk Thistle + Sage — anti-galactagogue, breastfeeding' },
];

const key = (x, y) => [String(x), String(y)].sort().join('|');
const BY_PAIR = new Map(PAIR_RULES.map(r => [key(r.a, r.b), r]));

// The rule that forbids `id` beside any of `seatedIds` under these
// safety answers, or null.
function pairBlocker(id, seatedIds, avoid) {
  for (const other of seatedIds || []) {
    const r = BY_PAIR.get(key(id, other));
    if (!r) continue;
    if (r.cls === 'BLOCK') return r;
    if (r.cls === 'CONDITIONAL' && (avoid || []).includes(r.flag)) return r;
  }
  return null;
}

// Pairs among `ids` that may never meet under these answers — for the
// MYCO prompt, so it does not propose them in the first place.
function blockedPairsAmong(ids, avoid) {
  const out = [];
  const list = (ids || []).map(String);
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const r = BY_PAIR.get(key(list[i], list[j]));
    if (r && (r.cls === 'BLOCK' || (avoid || []).includes(r.flag))) out.push([list[i], list[j]]);
  }
  return out;
}

module.exports = { PAIR_RULES, pairBlocker, blockedPairsAmong };
