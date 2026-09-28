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
    herbs: "271:Oatstraw@24|103:Ashwagandha@21|323:Reishi@20|246:Hawthorn@18|289:Vervain@17",
    rationale: "Engine 2.5 (2026-09-28, external audit decisions D1–D4): no herb above 40% of the bottle, percentages rounded by largest remainder; evidence grade worth 0 to +2 points; safety flags no longer add a herb; one strict fill walk; a medicine or pregnancy named in the note applies its safety flag. On top of 2.4 (recorded goals scored by position, pro answers, laxatives only for reported constipation).",
  },
  '02-ranked-multi-intention': {
    herbs: "103:Ashwagandha@24|323:Reishi@21|545:Jiaogulan@20|246:Hawthorn@18|413:Longan@17",
    rationale: "Engine 2.5 (2026-09-28, external audit decisions D1–D4): no herb above 40% of the bottle, percentages rounded by largest remainder; evidence grade worth 0 to +2 points; safety flags no longer add a herb; one strict fill walk; a medicine or pregnancy named in the note applies its safety flag. On top of 2.4 (recorded goals scored by position, pro answers, laxatives only for reported constipation).",
  },
  '03-conflicting-axes': {
    herbs: "300:Red Dates@23|323:Reishi@18|311:Amanita Muscaria@10|279:Schisandra (Five-Flavour Fruit)@17|413:Longan@17|276:Rhodiola@15",
    rationale: "Engine 2.7.0 (Robin, 2026-09-29, third audit H2): an Amanita takes at most 10% of the bottle and never sits beside St John's Wort; a small-share herb (trace or Amanita) seats only where three full-share herbs remain. On top of 2.6.1 / safety 1.4.1.",
  },
  '04-max-safety-restrictions': {
    herbs: "271:Oatstraw@40|300:Red Dates@16|275:Pine Pollen@14|579:Aguaje@14|314:Button Mushroom@11|282:Star Anise@5",
    rationale: "2026-09-29, third audit (Claude, read main@b3beace): note keywords match at the start of a word, short ones as whole words (\"partner\" no longer scores \"art\", \"reflux\" no longer \"flu\"); the autoimmune flag reads MS in capitals only (26 herbs were flagged through \"symptoms\", \"forms\"). On top of engine 2.6 / safety 1.4.",
  },
  '05-medication-psych': {
    herbs: "287:Vanilla@19|254:Jasmine@17|252:Lemon Balm@16|103:Ashwagandha@16|317:Lion's Mane@16|413:Longan@16",
    rationale: "Engine 2.5 (2026-09-28, external audit decisions D1–D4): no herb above 40% of the bottle, percentages rounded by largest remainder; evidence grade worth 0 to +2 points; safety flags no longer add a herb; one strict fill walk; a medicine or pregnancy named in the note applies its safety flag. On top of 2.4 (recorded goals scored by position, pro answers, laxatives only for reported constipation).",
  },
  '06-medication-cardio': {
    herbs: "103:Ashwagandha@20|271:Oatstraw@18|288:Valerian@14|419:African Dream Root@14|316:Fu Ling@14|132:Calea Zacatachichi@10|508:Dashmool@10",
    rationale: "Engine 2.5 (2026-09-28, external audit decisions D1–D4): no herb above 40% of the bottle, percentages rounded by largest remainder; evidence grade worth 0 to +2 points; safety flags no longer add a herb; one strict fill walk; a medicine or pregnancy named in the note applies its safety flag. On top of 2.4 (recorded goals scored by position, pro answers, laxatives only for reported constipation).",
  },
  '07-pregnancy': {
    herbs: "128:Chamomile@27|252:Lemon Balm@25|271:Oatstraw@25|287:Vanilla@18|268:Mullein@5",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '08-thyroid': {
    herbs: "240:Ginseng@22|296:Yerba Mate@22|280:Shilajit (Mineral Pitch)@19|241:Goji Berry@16|300:Red Dates@16|227:Cinnamon@5",
    rationale: "2026-09-29, third audit (Claude, read main@b3beace): note keywords match at the start of a word, short ones as whole words (\"partner\" no longer scores \"art\", \"reflux\" no longer \"flu\"); the autoimmune flag reads MS in capitals only (26 herbs were flagged through \"symptoms\", \"forms\"). On top of engine 2.6 / safety 1.4.",
  },
  '09-liver-kidney': {
    herbs: "212:Burdock@19|107:Dandelion Root@18|532:Anantmul@17|279:Schisandra (Five-Flavour Fruit)@17|316:Fu Ling@15|206:Barley@14",
    rationale: "2026-09-28, after the second audit round: mushroom category from the recorded botanical family (Dandelion, Ginkgo, Milk Thistle, Schisandra are no longer mushrooms; Fu Ling, Morels, Enoki, Shaggy Mane, Tinder Fungus now are); one rule module shared by picker and MYCO validator (adds one Amanita per bottle); herbs the note says to avoid are excluded. On top of engine 2.5 (40% share cap, engine-set percentages, evidence 0 to +2, note safety words).",
  },
  '10-lifelong-chronic': {
    herbs: "323:Reishi@16|574:Dan Shen Root Extract@15|103:Ashwagandha@14|279:Schisandra (Five-Flavour Fruit)@14|286:Turmeric@14|220:Devil's Claw@14|505:Hadjod@13",
    rationale: "2026-09-29, third audit (Claude, read main@b3beace): note keywords match at the start of a word, short ones as whole words (\"partner\" no longer scores \"art\", \"reflux\" no longer \"flu\"); the autoimmune flag reads MS in capitals only (26 herbs were flagged through \"symptoms\", \"forms\"). On top of engine 2.6 / safety 1.4.",
  },
  '11-trace-heavy': {
    herbs: "285:Tremella@22|241:Goji Berry@21|225:Chickweed@20|548:Astaxanthin@19|589:He Shou Wu / Fo-Ti@18",
    rationale: "Engine 2.5 (2026-09-28, external audit decisions D1–D4): no herb above 40% of the bottle, percentages rounded by largest remainder; evidence grade worth 0 to +2 points; safety flags no longer add a herb; one strict fill walk; a medicine or pregnancy named in the note applies its safety flag. On top of 2.4 (recorded goals scored by position, pro answers, laxatives only for reported constipation).",
  },
  '12-gaba-load': {
    herbs: "273:Passionflower@21|281:Skullcap@21|311:Amanita Muscaria@10|252:Lemon Balm@17|103:Ashwagandha@17|323:Reishi@14",
    rationale: "Engine 2.7.0 (Robin, 2026-09-29, third audit H2): an Amanita takes at most 10% of the bottle and never sits beside St John's Wort; a small-share herb (trace or Amanita) seats only where three full-share herbs remain. On top of 2.6.1 / safety 1.4.1.",
  },
  '13-stim-load': {
    herbs: "240:Ginseng@22|280:Shilajit (Mineral Pitch)@22|109:Guarana@21|241:Goji Berry@19|589:He Shou Wu / Fo-Ti@16",
    rationale: "Engine 2.5 (2026-09-28, external audit decisions D1–D4): no herb above 40% of the bottle, percentages rounded by largest remainder; evidence grade worth 0 to +2 points; safety flags no longer add a herb; one strict fill walk; a medicine or pregnancy named in the note applies its safety flag. On top of 2.4 (recorded goals scored by position, pro answers, laxatives only for reported constipation).",
  },
  '14-min-size': {
    herbs: "221:Echinacea@34|268:Mullein@33|294:Yarrow@33",
    rationale: "Engine 2.5 (2026-09-28, external audit decisions D1–D4): no herb above 40% of the bottle, percentages rounded by largest remainder; evidence grade worth 0 to +2 points; safety flags no longer add a herb; one strict fill walk; a medicine or pregnancy named in the note applies its safety flag. On top of 2.4 (recorded goals scored by position, pro answers, laxatives only for reported constipation).",
  },
  '15-max-size': {
    herbs: "300:Red Dates@23|252:Lemon Balm@20|275:Pine Pollen@19|579:Aguaje@16|287:Vanilla@12|405:Rosehip@5|321:Oyster Mushroom@5",
    rationale: "2026-09-29, third audit (Claude, read main@b3beace): note keywords match at the start of a word, short ones as whole words (\"partner\" no longer scores \"art\", \"reflux\" no longer \"flu\"); the autoimmune flag reads MS in capitals only (26 herbs were flagged through \"symptoms\", \"forms\"). On top of engine 2.6 / safety 1.4.",
  },
  '16-gated-amanita-opt-in': {
    herbs: "302:Rose Petals@20|215:Damiana@19|102:Bobinsana@16|287:Vanilla@15|323:Reishi@15|278:Saffron@15",
    rationale: "2026-09-29, third audit (Claude, read main@b3beace): note keywords match at the start of a word, short ones as whole words (\"partner\" no longer scores \"art\", \"reflux\" no longer \"flu\"); the autoimmune flag reads MS in capitals only (26 herbs were flagged through \"symptoms\", \"forms\"). On top of engine 2.6 / safety 1.4.",
  },
  '17-no-gate': {
    herbs: "302:Rose Petals@20|215:Damiana@19|102:Bobinsana@16|287:Vanilla@15|323:Reishi@15|278:Saffron@15",
    rationale: "2026-09-29, third audit (Claude, read main@b3beace): note keywords match at the start of a word, short ones as whole words (\"partner\" no longer scores \"art\", \"reflux\" no longer \"flu\"); the autoimmune flag reads MS in capitals only (26 herbs were flagged through \"symptoms\", \"forms\"). On top of engine 2.6 / safety 1.4.",
  },
  '18-pro-fields-carried': {
    herbs: "103:Ashwagandha@22|271:Oatstraw@21|246:Hawthorn@15|323:Reishi@15|300:Red Dates@15|316:Fu Ling@12",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '19-notes-heavy': {
    herbs: "240:Ginseng@21|296:Yerba Mate@20|317:Lion's Mane@18|413:Longan@18|4:Bacopa@18|277:Rosemary@5",
    rationale: "2026-09-29, third audit (Claude, read main@b3beace): note keywords match at the start of a word, short ones as whole words (\"partner\" no longer scores \"art\", \"reflux\" no longer \"flu\"); the autoimmune flag reads MS in capitals only (26 herbs were flagged through \"symptoms\", \"forms\"). On top of engine 2.6 / safety 1.4.",
  },
};
