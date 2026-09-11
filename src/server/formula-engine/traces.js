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

function isTrace(h) {
  const id   = (h.id || '').toString().toLowerCase();
  const name = (h.name || '').toLowerCase();
  return TRACE_IDS.some(t => id.includes(t) || name.includes(t.replace(/_/g, ' ')));
}

module.exports = { TRACE_IDS, isTrace };
