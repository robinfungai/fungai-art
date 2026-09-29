// src/server/formula-engine/traces.js
//
// "Trace" herbs — essential-oil rich or intensely pungent. They belong
// in a balanced formula but must NEVER dominate. Capped at 5% each in
// assignPercentages() so a picker score of "top match" doesn't put
// lavender at 25% of the bottle. Match by id substring or name.
//
// LIFTED VERBATIM from
//   public/find-your-formula/index.html lines 1111–1122
// as of Step 0 of the P0 migration. Do not restructure — this module
// mirrors the client-engine behaviour that fixture 20/20 pass proves.

const TRACE_IDS = [
  'lavender','peppermint','clove','cinnamon','cayenne','ginger','oregano',
  'thyme','sage','rosemary','black_pepper','cardamom','fennel','star_anise',
  'nutmeg','anise','bay_leaf','allspice','wormwood','tarragon','pepper',
  'gentian','goldenseal','coptis','myrrh','frankincense','copal','juniper',
  'eucalyptus','tea_tree','wintergreen','camphor',
];

// Recorded on the herb (herbs.ts `trace_class`, 2026-09-29, external
// audit #26): the record says whether a herb is a trace herb and why.
const TRACE_CLASSES = ['aromatic', 'pungent', 'bitter', 'resin'];
function isTrace(h) {
  return !!h && TRACE_CLASSES.includes(h.trace_class);
}

// The old name list — kept only so tests/herb-record-classes-verify.cjs
// can fail when a herb named like a trace herb has no trace_class.
function nameSuggestsTrace(h) {
  return !!traceKey(h);
}
function traceKey(h) {
  const id   = (h.id || '').toString().toLowerCase();
  const name = (h.name || '').toLowerCase();
  return TRACE_IDS.find(t => id.includes(t) || name.includes(t.replace(/_/g, ' '))) || null;
}

// WHY each trace herb is kept small (external audit 2026-09-29): the
// reveal used to give every one the essential-oil reason, which does not
// describe a bitter root or a resin. The rule itself is unchanged.
const TRACE_REASON_BY_KEY = {
  pungent:  ['cayenne', 'ginger', 'black_pepper', 'pepper'],
  bitter:   ['wormwood', 'gentian', 'goldenseal', 'coptis'],
  resin:    ['myrrh', 'frankincense', 'copal'],
};
const TRACE_REASON_TEXT = {
  aromatic: 'rich in essential oil, so a little carries through the whole bottle',
  pungent:  'pungent heat, so a little warms the blend and more would overwhelm it',
  bitter:   'intensely bitter, so a small share is all the blend needs',
  resin:    'a dense resin, so a small share holds its place without crowding the rest',
};
function traceReason(h) {
  if (!isTrace(h)) return null;
  return { kind: h.trace_class, text: TRACE_REASON_TEXT[h.trace_class] };
}
// What the old name list would have said — for the build check.
function suggestedTraceClass(h) {
  const k = traceKey(h);
  if (!k) return null;
  return Object.keys(TRACE_REASON_BY_KEY).find(r => TRACE_REASON_BY_KEY[r].includes(k)) || 'aromatic';
}

module.exports = { TRACE_IDS, TRACE_CLASSES, isTrace, traceReason, nameSuggestsTrace, suggestedTraceClass };
