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
    herbs: "271:Oatstraw@25|103:Ashwagandha@21|323:Reishi@20|246:Hawthorn@17|289:Vervain@17",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '02-ranked-multi-intention': {
    herbs: "103:Ashwagandha@23|323:Reishi@22|545:Jiaogulan@20|246:Hawthorn@18|413:Longan@17",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '03-conflicting-axes': {
    herbs: "300:Red Dates@22|311:Amanita Muscaria@17|323:Reishi@17|413:Longan@17|276:Rhodiola@14|559:Cistanche@13",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '04-max-safety-restrictions': {
    herbs: "271:Oatstraw@44|300:Red Dates@14|579:Aguaje@13|275:Pine Pollen@13|314:Button Mushroom@10|268:Mullein@4|302:Rose Petals@2",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '05-medication-psych': {
    herbs: "287:Vanilla@20|254:Jasmine@18|413:Longan@16|252:Lemon Balm@16|317:Lion's Mane@15|103:Ashwagandha@15",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '06-medication-cardio': {
    herbs: "103:Ashwagandha@21|271:Oatstraw@18|288:Valerian@14|419:African Dream Root@14|316:Fu Ling@13|132:Calea Zacatachichi@10|508:Dashmool@10",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '07-pregnancy': {
    herbs: "128:Chamomile@27|252:Lemon Balm@25|271:Oatstraw@25|287:Vanilla@18|268:Mullein@5",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '08-thyroid': {
    herbs: "109:Guarana@20|296:Yerba Mate@20|280:Shilajit (Mineral Pitch)@17|559:Cistanche@15|300:Red Dates@15|589:He Shou Wu / Fo-Ti@13",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '09-liver-kidney': {
    herbs: "212:Burdock@18|532:Anantmul@18|107:Dandelion Root@17|279:Schisandra (Five-Flavour Fruit)@17|502:Punarnava@16|316:Fu Ling@14",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '10-lifelong-chronic': {
    herbs: "323:Reishi@15|574:Dan Shen Root Extract@15|279:Schisandra (Five-Flavour Fruit)@14|103:Ashwagandha@14|508:Dashmool@14|582:Avocado Extract@14|286:Turmeric@14",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '11-trace-heavy': {
    herbs: "285:Tremella@23|241:Goji Berry@21|225:Chickweed@21|589:He Shou Wu / Fo-Ti@18|548:Astaxanthin@17",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '12-gaba-load': {
    herbs: "273:Passionflower@20|281:Skullcap@19|311:Amanita Muscaria@17|252:Lemon Balm@16|103:Ashwagandha@15|323:Reishi@13",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '13-stim-load': {
    herbs: "280:Shilajit (Mineral Pitch)@21|240:Ginseng@22|109:Guarana@21|241:Goji Berry@20|589:He Shou Wu / Fo-Ti@16",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '14-min-size': {
    herbs: "221:Echinacea@48|283:Thyme@5|268:Mullein@47",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '15-max-size': {
    herbs: "413:Longan@15|300:Red Dates@15|103:Ashwagandha@15|284:Tongkat Ali@14|316:Fu Ling@14|323:Reishi@14|404:Raspberry Leaf@13",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '16-gated-amanita-opt-in': {
    herbs: "302:Rose Petals@19|215:Damiana@19|287:Vanilla@17|102:Bobinsana@16|278:Saffron@15|323:Reishi@14",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '17-no-gate': {
    herbs: "302:Rose Petals@19|215:Damiana@19|287:Vanilla@17|102:Bobinsana@16|278:Saffron@15|323:Reishi@14",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '18-pro-fields-carried': {
    herbs: "103:Ashwagandha@22|271:Oatstraw@21|246:Hawthorn@15|323:Reishi@15|300:Red Dates@15|316:Fu Ling@12",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
  '19-notes-heavy': {
    herbs: "240:Ginseng@21|296:Yerba Mate@20|413:Longan@19|4:Bacopa@18|317:Lion's Mane@17|277:Rosemary@5",
    rationale: "Engine 2.4 (2026-09-28): goals recorded per herb (herbs.ts goals) and scored by position (main use counts most); the pro answers support, digestion, emotional, somatic, cycle and prior_herbs now score herbs; laxatives only for reported constipation, one per bottle. Builds on 2.3: the goal leads, one serotonergic herb, 8 practitioner-only herbs pro-only.",
  },
};
