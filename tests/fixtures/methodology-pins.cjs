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
    herbs: "302:Rose Petals@30|227:Cinnamon@5|552:Grape Leaf Extract@22|323:Reishi@22|405:Rosehip@21",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '02-ranked-multi-intention': {
    herbs: "241:Goji Berry@21|275:Pine Pollen@22|280:Shilajit (Mineral Pitch)@19|103:Ashwagandha@19|323:Reishi@19",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '03-conflicting-axes': {
    herbs: "243:Hops@18|316:Fu Ling@17|508:Dashmool@17|548:Astaxanthin@16|323:Reishi@16|218:Catuaba@16",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '04-max-safety-restrictions': {
    herbs: "300:Red Dates@20|275:Pine Pollen@20|271:Oatstraw@17|314:Button Mushroom@17|552:Grape Leaf Extract@12|302:Rose Petals@8|579:Aguaje@6",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '05-medication-psych': {
    herbs: "246:Hawthorn@17|574:Dan Shen Root Extract@18|103:Ashwagandha@17|316:Fu Ling@17|263:Maca Negra (Black Maca)@16|284:Tongkat Ali@15",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '06-medication-cardio': {
    herbs: "300:Red Dates@16|288:Valerian@18|287:Vanilla@18|103:Ashwagandha@17|234:Eucalyptus@5|405:Rosehip@13|316:Fu Ling@13",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '07-pregnancy': {
    herbs: "300:Red Dates@26|128:Chamomile@20|271:Oatstraw@20|287:Vanilla@19|268:Mullein@15",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '08-thyroid': {
    herbs: "204:Astragalus@16|280:Shilajit (Mineral Pitch)@18|262:Maca@18|559:Cistanche@16|278:Saffron@16|589:He Shou Wu / Fo-Ti@16",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '09-liver-kidney': {
    herbs: "578:Hedyotis Diffusa@19|523:Amla / Amalaki@18|220:Devil's Claw@16|206:Barley@16|212:Burdock@16|328:Willow Bracket@15",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '10-lifelong-chronic': {
    herbs: "323:Reishi@15|317:Lion's Mane@15|545:Jiaogulan@15|288:Valerian@14|300:Red Dates@14|287:Vanilla@14|259:Lingonberry@13",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '11-trace-heavy': {
    herbs: "305:Senna@22|510:Vijaysar@21|285:Tremella@21|523:Amla / Amalaki@19|582:Avocado Extract@17",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '12-gaba-load': {
    herbs: "273:Passionflower@18|281:Skullcap@19|323:Reishi@17|311:Amanita Muscaria@16|103:Ashwagandha@15|300:Red Dates@15",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '13-stim-load': {
    herbs: "262:Maca@22|280:Shilajit (Mineral Pitch)@22|241:Goji Berry@20|589:He Shou Wu / Fo-Ti@18|263:Maca Negra (Black Maca)@18",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '14-min-size': {
    herbs: "549:Black Pepper Extract@5|268:Mullein@48|543:Elderberry (Cooked Berry)@47",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '15-max-size': {
    herbs: "103:Ashwagandha@15|300:Red Dates@16|413:Longan@16|316:Fu Ling@14|323:Reishi@14|317:Lion's Mane@13|254:Jasmine@12",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '16-gated-amanita-opt-in': {
    herbs: "215:Damiana@23|302:Rose Petals@21|311:Amanita Muscaria@18|277:Rosemary@5|102:Bobinsana@17|254:Jasmine@16",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '17-no-gate': {
    herbs: "215:Damiana@23|302:Rose Petals@21|311:Amanita Muscaria@18|277:Rosemary@5|102:Bobinsana@17|254:Jasmine@16",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '18-pro-fields-carried': {
    herbs: "103:Ashwagandha@19|271:Oatstraw@19|300:Red Dates@18|323:Reishi@16|317:Lion's Mane@14|503:Shankhpushpi@14",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
  '19-notes-heavy': {
    herbs: "275:Pine Pollen@18|280:Shilajit (Mineral Pitch)@18|241:Goji Berry@18|110:Holy Basil (Tulsi)@16|262:Maca@15|413:Longan@15",
    rationale: "Engine 2.3 (2026-09-28): the goal leads — intention outweighs body/stress/time and a herb serving none of the chosen goals keeps half its score; laxatives only when digestion or detox is a goal; at most one serotonergic herb; Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja pro-only.",
  },
};
