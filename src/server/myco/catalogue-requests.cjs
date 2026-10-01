// src/server/myco/catalogue-requests.cjs
//
// Herbs Robin wants in the catalogue that are not in it yet. The monthly
// MYCO digest (netlify/functions/myco-monthly-digest-background.mjs)
// reads this list and drafts a record outline for each — botanical name,
// part, actions, safety, and PubMed SEARCH terms (never PMIDs: Claude Code
// fetches and checks those when it writes the record).
//
// An entry drops out of the digest by itself once a herb of that name is
// in herbs.ts (matched with herb-names.js), so nothing here needs deleting
// by hand — but tidy it when a record lands.

module.exports = [
  // Robin, 2026-10-01 — the digestive actions list (bitters, demulcents, astringents)
  { name: 'Gentian',          botanical: 'Gentiana lutea',      why: 'digestive bitter (the classic bitter tonic)', asked: '2026-10-01 · Robin, digestive actions' },
  { name: 'Marshmallow Root', botanical: 'Althaea officinalis', why: 'demulcent — soothes and protects inflamed gut lining', asked: '2026-10-01 · Robin, digestive actions; also in the Academy curriculum' },
  { name: 'Agrimony',         botanical: 'Agrimonia eupatoria', why: 'astringent — tones lax gut tissue, reduces diarrhoea', asked: '2026-10-01 · Robin, digestive actions' },
  { name: 'Blackberry Root',  botanical: 'Rubus fruticosus',    why: 'astringent (root and leaf) — diarrhoea', asked: '2026-10-01 · Robin, digestive actions' },
  // The Academy curriculum (Antigravity, 2026-10-01) teaches these
  { name: 'Cramp Bark',       botanical: 'Viburnum opulus',     why: 'antispasmodic — taught in the Academy curriculum', asked: '2026-10-01 · Academy curriculum' },
  { name: 'Elecampane',       botanical: 'Inula helenium',      why: 'respiratory expectorant, bitter — taught in the Academy curriculum', asked: '2026-10-01 · Academy curriculum' },
  // Split from Bobinsana (id 102, root and bark). PubMed has NO paper on
  // Calliandra angustifolia, bark or leaf (searched 2026-10-01), so the
  // outline rests on Amazonian practice and must say so.
  { name: 'Bobinsana Leaf',   botanical: 'Calliandra angustifolia (leaf)', why: 'split from Bobinsana (root and bark) — Robin: the bark carries the emotional warmth; outline how the leaf is used differently in Amazonian practice (traditional only — PubMed has no study of the species)', asked: '2026-09-29 · Robin, Bobinsana split' },
];
