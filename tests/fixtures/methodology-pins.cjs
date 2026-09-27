// tests/fixtures/methodology-pins.cjs
//
// Profiles whose output changed because of a DELIBERATE methodology
// change after the Step 0 baseline. The Step 0 files stay frozen; the
// new output is pinned here instead, so the fixture still regression-
// locks the engine rather than getting a free pass.
//
// One list, read by both tests/compare-fixtures.cjs (engine) and
// tests/shadow-verify.cjs (the HTTP handler), so the two cannot drift.
// Format: "id:Name@percentage|…" in the engine's order.

module.exports = {
  '01-baseline': {
    herbs: '302:Rose Petals@34|251:Lavender@5|323:Reishi@21|301:Rhubarb Root@20|552:Grape Leaf Extract@20',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: evening formula: Bitter Orange (stimulant) and Cordyceps (activating) out.',
  },
  '02-ranked-multi-intention': {
    herbs: '241:Goji Berry@23|275:Pine Pollen@23|280:Shilajit (Mineral Pitch)@20|103:Ashwagandha@17|323:Reishi@17',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: evening sleep wish: Black Maca (activating) out.',
  },
  '03-conflicting-axes': {
    herbs: '323:Reishi@20|311:Amanita Muscaria@18|243:Hops@17|413:Longan@15|316:Fu Ling@15|561:Toothed Clubmoss@15',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: true labels free the sedative cap: Hops in, Rosemary out.',
  },
  '04-max-safety-restrictions': {
    herbs: '300:Red Dates@19|275:Pine Pollen@19|271:Oatstraw@16|314:Button Mushroom@16|579:Aguaje@15|552:Grape Leaf Extract@8|268:Mullein@7',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: pregnancy: unknown = avoid, so Shatavari, Enoki and Dashmool out.',
  },
  '05-medication-psych': {
    herbs: '103:Ashwagandha@18|316:Fu Ling@18|300:Red Dates@18|413:Longan@18|271:Oatstraw@15|262:Maca@13',
    rationale: 'Drifted from the Step 0 snapshot before 2026-09-27 (catalogue grew to 242 herbs; engine 2.1 scoring); engine 2.2 leaves it unchanged. Pinned 2026-09-27.',
  },
  '06-medication-cardio': {
    herbs: '300:Red Dates@15|288:Valerian@16|287:Vanilla@16|103:Ashwagandha@15|316:Fu Ling@14|212:Burdock@13|405:Rosehip@11',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: Ashwagandha is calming, no longer a capped sedative: in; Astragalus out on the category cap.',
  },
  '07-pregnancy': {
    herbs: '300:Red Dates@26|271:Oatstraw@23|128:Chamomile@19|287:Vanilla@17|268:Mullein@15',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: pregnancy: Chaga (marked unsafe) and Reishi (unknown) out; Chamomile and Vanilla in.',
  },
  '08-thyroid': {
    herbs: '204:Astragalus@17|280:Shilajit (Mineral Pitch)@18|262:Maca@18|240:Ginseng@16|267:Mugwort@16|316:Fu Ling@15',
    rationale: 'Drifted from the Step 0 snapshot before 2026-09-27 (catalogue grew to 242 herbs; engine 2.1 scoring); engine 2.2 leaves it unchanged. Pinned 2026-09-27.',
  },
  '09-liver-kidney': {
    herbs: '300:Red Dates@20|103:Ashwagandha@16|316:Fu Ling@16|279:Schisandra (Five-Flavour Fruit)@16|276:Rhodiola@16|215:Damiana@16',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: Schisandra and Rhodiola fill the stimulant cap, so Cordyceps out.',
  },
  '10-lifelong-chronic': {
    herbs: '323:Reishi@14|317:Lion\'s Mane@16|545:Jiaogulan@16|288:Valerian@14|300:Red Dates@14|287:Vanilla@14|316:Fu Ling@12',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: Vanilla is neutral, no longer a capped sedative: in.',
  },
  '11-trace-heavy': {
    herbs: '285:Tremella@24|241:Goji Berry@22|4:Bacopa@18|570:White Kidney Bean Extract@18|223:Cat\'s Claw@18',
    rationale: 'Drifted from the Step 0 snapshot before 2026-09-27 (catalogue grew to 242 herbs; engine 2.1 scoring); engine 2.2 leaves it unchanged. Pinned 2026-09-27.',
  },
  '12-gaba-load': {
    herbs: '273:Passionflower@20|281:Skullcap@20|323:Reishi@17|311:Amanita Muscaria@17|103:Ashwagandha@13|300:Red Dates@13',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: only true sedatives count: Passionflower + Amanita muscaria; Reishi and Ashwagandha (calming) in.',
  },
  '13-stim-load': {
    herbs: '262:Maca@22|280:Shilajit (Mineral Pitch)@22|263:Maca Negra (Black Maca)@20|241:Goji Berry@19|589:He Shou Wu / Fo-Ti@17',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: He Shou Wu is neutral (the "glutamate" match is gone) and HIGH herbs stay eligible (Robin): in.',
  },
  '14-min-size': {
    herbs: '549:Black Pepper Extract@5|268:Mullein@47|543:Elderberry (Cooked Berry)@48',
    rationale: 'Drifted from the Step 0 snapshot before 2026-09-27 (catalogue grew to 242 herbs; engine 2.1 scoring); engine 2.2 leaves it unchanged. Pinned 2026-09-27.',
  },
  '16-gated-amanita-opt-in': {
    herbs: '215:Damiana@20|302:Rose Petals@19|110:Holy Basil (Tulsi)@18|323:Reishi@15|102:Bobinsana@14|287:Vanilla@14',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: evening sleep wish: Yerba Mate (caffeine) and Cordyceps out.',
  },
  '17-no-gate': {
    herbs: '215:Damiana@20|302:Rose Petals@19|110:Holy Basil (Tulsi)@18|323:Reishi@15|102:Bobinsana@14|287:Vanilla@14',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: evening sleep wish: Yerba Mate (caffeine) and Cordyceps out.',
  },
  '18-pro-fields-carried': {
    herbs: '271:Oatstraw@21|103:Ashwagandha@19|300:Red Dates@17|323:Reishi@15|413:Longan@14|316:Fu Ling@14',
    rationale: 'Engine 2.2 (2026-09-27): stimulant/sedative read from herbs.ts cns_action; nothing stimulating in an evening or sleep formula; no sedative beside a true stimulant; unknown pregnancy safety = avoid. Here: evening sleep wish: Schisandra (activating) out, Reishi in.',
  },
  '19-notes-heavy': {
    herbs: '275:Pine Pollen@18|280:Shilajit (Mineral Pitch)@17|241:Goji Berry@17|296:Yerba Mate@16|262:Maca@16|413:Longan@16',
    rationale: 'Drifted from the Step 0 snapshot before 2026-09-27 (catalogue grew to 242 herbs; engine 2.1 scoring); engine 2.2 leaves it unchanged. Pinned 2026-09-27.',
  },
};
