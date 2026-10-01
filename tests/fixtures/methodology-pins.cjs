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
    herbs: "271:Oatstraw@40|300:Red Dates@16|275:Pine Pollen@14|579:Aguaje@14|314:Button Mushroom@12|282:Star Anise@4",
    rationale: "Engine 2.10.0 (Robin, 2026-10-01, audit 29 Sep #4): trace herbs share 7% of the bottle (4% + 3%), so a lone trace is held to 4% instead of 5% and the point goes to a main herb — same herbs. On top of engine 2.9.0 / safety 1.5.0.",
  },
  '05-medication-psych': {
    herbs: "287:Vanilla@19|254:Jasmine@17|252:Lemon Balm@16|103:Ashwagandha@16|317:Lion's Mane@16|413:Longan@16",
    rationale: "Engine 2.5 (2026-09-28, external audit decisions D1–D4): no herb above 40% of the bottle, percentages rounded by largest remainder; evidence grade worth 0 to +2 points; safety flags no longer add a herb; one strict fill walk; a medicine or pregnancy named in the note applies its safety flag. On top of 2.4 (recorded goals scored by position, pro answers, laxatives only for reported constipation).",
  },
  '06-medication-cardio': {
    herbs: "103:Ashwagandha@22|271:Oatstraw@19|288:Valerian@16|316:Fu Ling@15|300:Red Dates@15|508:Dashmool@10|212:Burdock@3",
    rationale: "Engine 2.11.0 (Robin, 2026-10-02, formula verdicts): a herb serving none of the chosen goals keeps 30% of its score, was 50% (verdict 6) — Burdock falls from 6% to 3% and the points go to the herbs that serve the goals. Same herbs. On top of engine 2.10.0 / safety 1.5.0.",
  },
  '07-pregnancy': {
    herbs: "128:Chamomile@28|252:Lemon Balm@26|271:Oatstraw@25|287:Vanilla@18|268:Mullein@3",
    rationale: "Engine 2.11.0 (Robin, 2026-10-02, formula verdicts): a herb serving none of the chosen goals keeps 30% of its score, was 50% (verdict 6) — Mullein falls from 5% to 3%. Same herbs. On top of engine 2.10.0 / safety 1.5.0.",
  },
  '08-thyroid': {
    herbs: "240:Ginseng@23|296:Yerba Mate@23|280:Shilajit (Mineral Pitch)@19|211:Blueberry@14|300:Red Dates@17|227:Cinnamon@4",
    rationale: "Engine 2.11.0 (Robin, 2026-10-02, formula verdicts): coverage (verdict 7) — the second goal, cognitive, had no herb whose main goal it is; Blueberry (main goal cognitive) takes the seat of Goji Berry, the weakest energy herb. On top of engine 2.10.0 / safety 1.5.0.",
  },
  '09-liver-kidney': {
    herbs: "212:Burdock@19|107:Dandelion Root@18|532:Anantmul@17|279:Schisandra (Five-Flavour Fruit)@17|316:Fu Ling@15|206:Barley@14",
    rationale: "2026-09-28, after the second audit round: mushroom category from the recorded botanical family (Dandelion, Ginkgo, Milk Thistle, Schisandra are no longer mushrooms; Fu Ling, Morels, Enoki, Shaggy Mane, Tinder Fungus now are); one rule module shared by picker and MYCO validator (adds one Amanita per bottle); herbs the note says to avoid are excluded. On top of engine 2.5 (40% share cap, engine-set percentages, evidence 0 to +2, note safety words).",
  },
  '10-lifelong-chronic': {
    herbs: "323:Reishi@16|574:Dan Shen Root Extract@15|103:Ashwagandha@14|279:Schisandra (Five-Flavour Fruit)@14|286:Turmeric@14|220:Devil's Claw@14|596:California Poppy@13",
    rationale: "Engine 2.9.0 (Robin, 2026-09-29): a restless sleeper (here: very broken sleep) gets no dream-deepening herb — tested and unchanged: Schisandra was checked on PubMed and recorded as calming dream-disturbed sleep (TCM), not deepening dreams, so it stays. On top of engine 2.8.2 / safety 1.5.0.",
  },
  '11-trace-heavy': {
    herbs: "285:Tremella@25|241:Goji Berry@23|225:Chickweed@22|548:Astaxanthin@20|258:Licorice Root@10",
    rationale: "Engine 2.11.0 (Robin, 2026-10-02, formula verdicts): coverage (verdict 7) — the second goal, digestion, had no herb whose main goal it is; Licorice Root takes the seat of He Shou Wu, held to 10% (verdict 3: whole root, glycyrrhizin). This profile ticks no blood-pressure, heart or liver / kidney flag. On top of engine 2.10.0 / safety 1.5.0.",
  },
  '12-gaba-load': {
    herbs: "273:Passionflower@21|281:Skullcap@21|252:Lemon Balm@17|103:Ashwagandha@17|323:Reishi@14|254:Jasmine@10",
    rationale: "Engine 2.9.0 (Robin, 2026-09-29): a restless sleeper (here: very broken sleep) gets no dream-deepening herb — Amanita Muscaria (tagged dream_vivid, Robin to confirm) leaves, Jasmine takes the seat. On top of engine 2.8.2 / safety 1.5.0.",
  },
  '13-stim-load': {
    herbs: "240:Ginseng@23|280:Shilajit (Mineral Pitch)@22|109:Guarana@21|241:Goji Berry@20|317:Lion's Mane@14",
    rationale: "Engine 2.11.0 (Robin, 2026-10-02, formula verdicts): coverage (verdict 7) — the second goal, cognitive, had no herb whose main goal it is; Lion's Mane takes the seat of He Shou Wu. On top of engine 2.10.0 / safety 1.5.0.",
  },
  '14-min-size': {
    herbs: "221:Echinacea@34|268:Mullein@33|294:Yarrow@33",
    rationale: "Engine 2.5 (2026-09-28, external audit decisions D1–D4): no herb above 40% of the bottle, percentages rounded by largest remainder; evidence grade worth 0 to +2 points; safety flags no longer add a herb; one strict fill walk; a medicine or pregnancy named in the note applies its safety flag. On top of 2.4 (recorded goals scored by position, pro answers, laxatives only for reported constipation).",
  },
  '15-max-size': {
    herbs: "300:Red Dates@24|252:Lemon Balm@21|275:Pine Pollen@20|579:Aguaje@17|287:Vanilla@12|405:Rosehip@3|321:Oyster Mushroom@3",
    rationale: "Engine 2.11.0 (Robin, 2026-10-02, formula verdicts): a herb serving none of the chosen goals keeps 30% of its score, was 50% (verdict 6) — Rosehip and Oyster Mushroom fall from 5% to 3% each. Same herbs. On top of engine 2.10.0 / safety 1.5.0.",
  },
  '16-gated-amanita-opt-in': {
    herbs: "302:Rose Petals@22|215:Damiana@21|102:Bobinsana@17|287:Vanilla@17|323:Reishi@16|278:Saffron@7",
    rationale: "Engine 2.8.1 (Robin, 2026-09-29): Saffron is held to 7% of the bottle (herbs.ts max_share_pct, until Phase 3 lab data on real extracts) and counts as a small-share herb; the same six herbs, the 8 points spread over the other five. On top of engine 2.8.0.",
    previousRationale: "2026-09-29, third audit (Claude, read main@b3beace): note keywords match at the start of a word, short ones as whole words (\"partner\" no longer scores \"art\", \"reflux\" no longer \"flu\"); the autoimmune flag reads MS in capitals only (26 herbs were flagged through \"symptoms\", \"forms\"). On top of engine 2.6 / safety 1.4.",
  },
  '17-no-gate': {
    herbs: "302:Rose Petals@22|215:Damiana@21|102:Bobinsana@17|287:Vanilla@17|323:Reishi@16|278:Saffron@7",
    rationale: "Engine 2.8.1 (Robin, 2026-09-29): Saffron is held to 7% of the bottle (herbs.ts max_share_pct, until Phase 3 lab data on real extracts) and counts as a small-share herb; the same six herbs, the 8 points spread over the other five. On top of engine 2.8.0.",
    previousRationale: "2026-09-29, third audit (Claude, read main@b3beace): note keywords match at the start of a word, short ones as whole words (\"partner\" no longer scores \"art\", \"reflux\" no longer \"flu\"); the autoimmune flag reads MS in capitals only (26 herbs were flagged through \"symptoms\", \"forms\"). On top of engine 2.6 / safety 1.4.",
  },
  '18-pro-fields-carried': {
    herbs: "103:Ashwagandha@22|271:Oatstraw@21|246:Hawthorn@16|323:Reishi@16|289:Vervain@12|316:Fu Ling@13",
    rationale: "Engine 2.11.0 (Robin, 2026-10-02, formula verdicts): coverage (verdict 7) — the second goal, anxiety, had no herb whose main goal it is; Vervain (main goal anxiety) takes the seat of Red Dates. On top of engine 2.10.0 / safety 1.5.0.",
  },
  '19-notes-heavy': {
    herbs: "240:Ginseng@22|103:Ashwagandha@16|317:Lion's Mane@20|413:Longan@19|4:Bacopa@19|277:Rosemary@4",
    rationale: "Engine 2.11.0 (Robin, 2026-10-02, formula verdicts): coverage (verdict 7) — the second goal, stress, had no herb whose main goal it is; Ashwagandha takes the seat of Yerba Mate (a calming herb may not sit beside a strong stimulant, so the stimulant is the one that goes). On top of engine 2.10.0 / safety 1.5.0.",
  },
};
