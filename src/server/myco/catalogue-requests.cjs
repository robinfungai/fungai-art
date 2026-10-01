// src/server/myco/catalogue-requests.cjs
//
// Herbs Robin wants in the catalogue that are not in it yet. The monthly
// MYCO digest (netlify/functions/myco-monthly-digest-background.mjs)
// reads this list and drafts a record outline for each — botanical name,
// part, actions, safety, and PubMed SEARCH terms (never PMIDs: Claude Code
// fetches and checks those when it writes the record).
//
// An entry drops out of the digest by itself once a herb of exactly that
// name is in herbs.ts, so nothing here needs deleting by hand — but tidy
// it when a record lands.

module.exports = [
  // Gentian, Marshmallow Root, Agrimony, Blackberry Root - added to herbs.ts 2026-10-01.
  // The Academy curriculum (Antigravity, 2026-10-01) teaches these
  { name: 'Cramp Bark',       botanical: 'Viburnum opulus',     why: 'antispasmodic — taught in the Academy curriculum', asked: '2026-10-01 · Academy curriculum' },
  { name: 'Elecampane',       botanical: 'Inula helenium',      why: 'respiratory expectorant, bitter — taught in the Academy curriculum', asked: '2026-10-01 · Academy curriculum' },
  // Split from Bobinsana (id 102, root and bark). PubMed has NO paper on
  // Calliandra angustifolia, bark or leaf (searched 2026-10-01), so the
  // outline rests on Amazonian practice and must say so.
  // Named in the Academy lab notes (scan of 2026-10-01) but not in the catalogue
  { name: 'Wood Sorrel',      botanical: 'Oxalis acetosella',   why: 'named in the lab notebook (formulas chapter); Nordic forageable — note the oxalate content', asked: '2026-10-01 · lab notes' },
  { name: 'Spruce',           botanical: 'Picea abies (tips, resin)', why: 'named in the lab notebook (microbes and formulas chapters); Nordic spring tips and resin', asked: '2026-10-01 · lab notes' },
  { name: 'Bobinsana Leaf',   botanical: 'Calliandra angustifolia (leaf)', why: 'split from Bobinsana (root and bark) — Robin: the bark carries the emotional warmth; outline how the leaf is used differently in Amazonian practice (traditional only — PubMed has no study of the species)', asked: '2026-09-29 · Robin, Bobinsana split' },
];
