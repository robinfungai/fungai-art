# Herb-pair cautions — review draft (2026-09-29)

**For Robin to approve.** Nothing in this table is enforced yet.

From the external audit's ninth finding (verdict in `docs/AUDIT-2026-09-28-RESPONSE.md`): a caution between two herbs is prose in the herb records (`herb_to_herb_caution`), matched by name after the bottle is made, and shown — it never stops a pair. Robin chose the audit's three classes on 2026-09-29:

| Class | What the engine does |
|---|---|
| **SHOW** | Composes the pair and shows the caution (what happens today for every pair). |
| **CONDITIONAL** | Never seats the pair when the person's safety answer matches (e.g. `cardio_meds`, `pregnancy`); otherwise SHOW. |
| **BLOCK** | Never seats the two herbs in the same bottle. |

Once approved, the classes go into one pair table read by `rules.js` `seatBlocker`, so the deterministic picker and the MYCO validator obey it alike (the same place the Amanita + St John's Wort rule lives).

## What is in the table

The 93 pairs whose caution uses strong words (avoid, do not combine, dangerous, bleeding, serotonin syndrome…), out of 242 pairs with any caution, after the 2.7.1 matcher fix removed 37 false ones. The other 149 are mild ("monitor", "at high doses") and stay SHOW unless you say otherwise.

| Suggested | Pairs | Meaning |
|---|---|---|
| BLOCK | 11 | The caution is unconditional ("absolutely avoid combination", "do not combine"). |
| CONDITIONAL, covered | 15 | Conditional — and that safety answer **already** keeps one of the two herbs out, so nothing new is needed. |
| ALREADY BLOCKED | 12 | An existing bottle rule already never seats them together (one serotonergic herb, stimulant cap, laxative cap, …). |
| SHOW | 55 | Strong words about high doses or long use; our shares are capped (no herb above 40%). Worth a glance — a few may deserve BLOCK. |

No conditional pair is left uncovered: every "avoid if on anticoagulants / if autoimmune / in pregnancy" caution names a condition whose safety answer already removes at least one of the two herbs.

**Worth your eye:**
- **Kava + Valerian** (BLOCK suggested) — "both potently GABAergic… avoid combining", yet the GABAergic cap does not stop them today. Either BLOCK the pair, or one of them is missing its GABAergic tag.
- **Guarana + Guayusa / Rhodiola** (BLOCK suggested) — "dangerous overstimulation", but the stimulant cap does not stop them: Rhodiola is not tagged as a CNS stimulant. BLOCK, or SHOW if Rhodiola is an adaptogen here.
- **Passionflower / Valerian + Rosemary** (BLOCK suggested) — the reason given is "contradictory energies", not harm. SHOW may be enough.
- **Wormwood + Sage** (ALREADY BLOCKED, by `TRACE_COUNT`) — "cumulative thujone toxicity: convulsant risk". They are kept apart only because both are trace herbs and a bottle holds one; if that rule ever changes they could meet. Suggest an explicit BLOCK as well, so it does not hang on an unrelated rule.
- **Pau d'Arco + Garlic / Ginkgo / Turmeric / Ginger** (BLOCK suggested) — "DANGEROUS additive bleeding risk; absolutely avoid combination", unconditional as written.

**How to answer:** change the "Suggested" cell of any row you disagree with (or reply with row numbers, e.g. "7 BLOCK, 8 and 11 SHOW, the rest as suggested").

Generated from the live catalogue by counting every pair's matched caution; the class is a suggestion from the wording, the "covered" and "already blocked" columns are the engine's own answer (`safetyFilter`, `seatBlocker`).

| # | Pair (herb ids) | Suggested | If the person answered | Why | The caution, as written in the herb record |
|---|---|---|---|---|---|
| 1 | **Astragalus** (204) + **Echinacea** (221) | BLOCK |  | unconditional: avoid / do not combine | Astragalus — DO NOT COMBINE: conflicting mechanisms (Echinacea overstimulates; Astragalus balances); choose one |
| 2 | **Garlic** (238) + **Pau d'Arco** (274) | BLOCK |  | unconditional: avoid / do not combine | Anticoagulant herbs (Ginkgo, Garlic, Turmeric, Ginger) — DANGEROUS additive bleeding risk; absolutely avoid combination |
| 3 | **Ginkgo** (239) + **Pau d'Arco** (274) | BLOCK |  | unconditional: avoid / do not combine | Anticoagulant herbs (Ginkgo, Garlic, Turmeric, Ginger) — DANGEROUS additive bleeding risk; absolutely avoid combination |
| 4 | **Guarana** (109) + **Guayusa** (245) | BLOCK |  | unconditional: avoid / do not combine | Other stimulants (Coffee, Rhodiola, Ginseng, Guayusa) — cumulative dangerous overstimulation |
| 5 | **Guarana** (109) + **Rhodiola** (276) | BLOCK |  | unconditional: avoid / do not combine | Other stimulants (Coffee, Rhodiola, Ginseng, Guayusa) — cumulative dangerous overstimulation |
| 6 | **Guayusa** (245) + **Rhodiola** (276) | BLOCK |  | unconditional: avoid / do not combine | Other stimulant herbs (Guarana, Coffee, Rhodiola) — cumulative overstimulation; dangerous |
| 7 | **Kava Kava** (257) + **Valerian** (288) | BLOCK |  | unconditional: avoid / do not combine | Kava — both potently GABAergic; potential excessive CNS depression; avoid combining |
| 8 | **Passionflower** (273) + **Rosemary** (277) | BLOCK |  | unconditional: avoid / do not combine | Valerian, Passionflower and sedative herbs — contradictory energies; stimulating vs. sedating; do not combine |
| 9 | **Pau d'Arco** (274) + **Turmeric** (286) | BLOCK |  | unconditional: avoid / do not combine | Anticoagulant herbs (Ginkgo, Garlic, Turmeric, Ginger) — DANGEROUS additive bleeding risk; absolutely avoid combination |
| 10 | **Pau d'Arco** (274) + **Ginger** (537) | BLOCK |  | unconditional: avoid / do not combine | Anticoagulant herbs (Ginkgo, Garlic, Turmeric, Ginger) — DANGEROUS additive bleeding risk; absolutely avoid combination |
| 11 | **Rosemary** (277) + **Valerian** (288) | BLOCK |  | unconditional: avoid / do not combine | Valerian, Passionflower and sedative herbs — contradictory energies; stimulating vs. sedating; do not combine |
| 12 | **Angelica (Dong Quai)** (202) + **Cranberry** (230) | CONDITIONAL, covered | cardio_meds | that answer already keeps Angelica (Dong Quai) out | Ginkgo, Garlic, Angelica (high-dose) — cumulative antiplatelet effect; particularly dangerous with Warfarin |
| 13 | **Angelica (Dong Quai)** (202) + **Garlic** (238) | CONDITIONAL, covered | cardio_meds | that answer already keeps Angelica (Dong Quai) out | Ginkgo, Garlic, Turmeric (high dose) — all have antiplatelet activity; avoid stacking if on anticoagulant medications |
| 14 | **Angelica (Dong Quai)** (202) + **Ginkgo** (239) | CONDITIONAL, covered | cardio_meds | that answer already keeps Angelica (Dong Quai) out | Ginkgo, Garlic, Turmeric (high dose) — all have antiplatelet activity; avoid stacking if on anticoagulant medications |
| 15 | **Angelica (Dong Quai)** (202) + **Turmeric** (286) | CONDITIONAL, covered | cardio_meds | that answer already keeps Angelica (Dong Quai) out | Ginkgo, Garlic, Turmeric (high dose) — all have antiplatelet activity; avoid stacking if on anticoagulant medications |
| 16 | **Ashwagandha** (103) + **Elderberry** (216) | CONDITIONAL, covered | autoimmune | that answer already keeps Ashwagandha out | Other immune-stimulating herbs (Echinacea, Elderberry) — AVOID if autoimmune disease |
| 17 | **Ashwagandha** (103) + **Echinacea** (221) | CONDITIONAL, covered | autoimmune | that answer already keeps Ashwagandha out | Other immune-stimulating herbs (Echinacea, Elderberry) — AVOID if autoimmune disease |
| 18 | **Ashwagandha** (103) + **Elderberry (Cooked Berry)** (543) | CONDITIONAL, covered | autoimmune | that answer already keeps Ashwagandha out | Other immune-stimulating herbs (Echinacea, Elderberry) — AVOID if autoimmune disease |
| 19 | **Cranberry** (230) + **Garlic** (238) | CONDITIONAL, covered | cardio_meds | that answer already keeps Cranberry out | Ginkgo, Garlic, Angelica (high-dose) — cumulative antiplatelet effect; particularly dangerous with Warfarin |
| 20 | **Cranberry** (230) + **Ginkgo** (239) | CONDITIONAL, covered | cardio_meds | that answer already keeps Cranberry out | Ginkgo, Garlic, Angelica (high-dose) — cumulative antiplatelet effect; particularly dangerous with Warfarin |
| 21 | **Garlic** (238) + **Willow Bark** (292) | CONDITIONAL, covered | cardio_meds | that answer already keeps Garlic out | Other anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) with Warfarin — additive bleeding; monitor INR |
| 22 | **Ginkgo** (239) + **Willow Bark** (292) | CONDITIONAL, covered | cardio_meds | that answer already keeps Ginkgo out | Other anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) with Warfarin — additive bleeding; monitor INR |
| 23 | **Guggulu** (525) + **Manjistha** (527) | CONDITIONAL, covered | pregnancy | that answer already keeps Guggulu out | Emmenagogue herbs in pregnancy (Nirgundi, Guggul, Kalmegh): never combine in pregnancy |
| 24 | **Kalmegh / Andrographis** (526) + **Manjistha** (527) | CONDITIONAL, covered | pregnancy | that answer already keeps Kalmegh / Andrographis out | Emmenagogue herbs in pregnancy (Nirgundi, Guggul, Kalmegh): never combine in pregnancy |
| 25 | **Milk Thistle** (266) + **Sage** (303) | CONDITIONAL, covered | pregnancy | that answer already keeps Milk Thistle out | Other anti-galactagogue herbs (Peppermint, Parsley at high doses) in breastfeeding — additive milk-drying effect; avoid if wanting to maintain supply |
| 26 | **Nirgundi** (511) + **Manjistha** (527) | CONDITIONAL, covered | pregnancy | that answer already keeps Nirgundi out | Emmenagogue herbs in pregnancy (Nirgundi, Guggul, Kalmegh): never combine in pregnancy |
| 27 | **Cassia Seed Extract** (550) + **Buckthorn Bark** (586) | ALREADY BLOCKED |  | the engine already never seats these together (LAXATIVE_LOAD) | Other stimulant laxatives (Senna, Rhubarb, Aloe resin, Cascara, Cassia Seed) — compounding anthraquinones causes violent, dangerous purgation |
| 28 | **Peppermint** (298) + **Sage** (303) | ALREADY BLOCKED |  | the engine already never seats these together (TRACE_COUNT) | Other anti-galactagogue herbs (Peppermint, Parsley at high doses) in breastfeeding — additive milk-drying effect; avoid if wanting to maintain supply |
| 29 | **Rhodiola** (276) + **St. John's Wort** (542) | ALREADY BLOCKED |  | the engine already never seats these together (SEROTONERGIC_LOAD) | St. John's Wort — SEROTONIN SYNDROME RISK: both serotonergic; avoid combination |
| 30 | **Rhubarb Root** (301) + **Senna** (305) | ALREADY BLOCKED |  | the engine already never seats these together (LAXATIVE_LOAD) | Other stimulant laxatives (Senna, Cascara, Aloe vera latex) — ADDITIVE PURGATION: serious electrolyte loss and cramping; avoid combining |
| 31 | **Rhubarb Root** (301) + **Amaltas** (536) | ALREADY BLOCKED |  | the engine already never seats these together (LAXATIVE_LOAD) | Senna, Rhubarb, Aloe latex, Cascara: additive anthraquinone load; avoid stacking |
| 32 | **Rhubarb Root** (301) + **Buckthorn Bark** (586) | ALREADY BLOCKED |  | the engine already never seats these together (LAXATIVE_LOAD) | Other stimulant laxatives (Senna, Rhubarb, Aloe resin, Cascara, Cassia Seed) — compounding anthraquinones causes violent, dangerous purgation |
| 33 | **Saffron** (278) + **St. John's Wort** (542) | ALREADY BLOCKED |  | the engine already never seats these together (SEROTONERGIC_LOAD) | St. John's Wort with SSRI medications — combined serotonergic herbs; monitor serotonin syndrome symptoms |
| 34 | **Senna** (305) + **Amaltas** (536) | ALREADY BLOCKED |  | the engine already never seats these together (LAXATIVE_LOAD) | Senna, Rhubarb, Aloe latex, Cascara: additive anthraquinone load; avoid stacking |
| 35 | **Senna** (305) + **Buckthorn Bark** (586) | ALREADY BLOCKED |  | the engine already never seats these together (LAXATIVE_LOAD) | Other stimulant laxatives (Senna, Rhubarb, Aloe resin, Cascara, Cassia Seed) — compounding anthraquinones causes violent, dangerous purgation |
| 36 | **Wormwood** (293) + **Sage** (303) | ALREADY BLOCKED |  | the engine already never seats these together (TRACE_COUNT) | Other thujone-rich herbs (Mugwort, Sage at high dose, Tansy) — CUMULATIVE THUJONE TOXICITY: convulsant risk; NEVER combine with other high-thujone herbs |
| 37 | **Yellow Dock Root** (295) + **Rhubarb Root** (301) | ALREADY BLOCKED |  | the engine already never seats these together (LAXATIVE_LOAD) | Other stimulant laxatives (Senna, Cascara, Rhubarb root) — ADDITIVE: increased risk of cramping, diarrhoea and electrolyte imbalance; avoid combining |
| 38 | **Yellow Dock Root** (295) + **Senna** (305) | ALREADY BLOCKED |  | the engine already never seats these together (LAXATIVE_LOAD) | Other stimulant laxatives (Senna, Cascara, Rhubarb root) — ADDITIVE: increased risk of cramping, diarrhoea and electrolyte imbalance; avoid combining |
| 39 | **Amla / Amalaki** (523) + **Guggulu** (525) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other antiplatelet herbs (Ginkgo, high dose Garlic, Turmeric extracts, Amla extracts): additive bleeding tendency |
| 40 | **Angelica (Dong Quai)** (202) + **Black Cumin** (208) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other mild anticoagulant herbs (Ginkgo, Garlic, Angelica) at high combined doses — monitor bleeding |
| 41 | **Ashwagandha** (103) + **Tongkat Ali** (284) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other testosterone-stimulating herbs (Fadogia Agrestis, high-dose Ashwagandha) — CAUTION: cumulative testosterone increase; prostate and cardiovascular considerations; avoid excessive stacking |
| 42 | **Black Cumin** (208) + **Garlic** (238) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other mild anticoagulant herbs (Ginkgo, Garlic, Angelica) at high combined doses — monitor bleeding |
| 43 | **Black Cumin** (208) + **Ginkgo** (239) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other mild anticoagulant herbs (Ginkgo, Garlic, Angelica) at high combined doses — monitor bleeding |
| 44 | **Bobinsana** (102) + **Rhodiola** (276) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | St. John's Wort, high-dose Rhodiola, 5-HTP — other serotonergic herbs; avoid stacking or extreme caution |
| 45 | **Bobinsana** (102) + **St. John's Wort** (542) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | St. John's Wort, high-dose Rhodiola, 5-HTP — other serotonergic herbs; avoid stacking or extreme caution |
| 46 | **Cinnamon** (227) + **Vijaysar** (510) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other hypoglycaemic herbs (Gymnema, Bitter melon, Fenugreek, Cinnamon extracts, Guduchi) in medicated diabetics: stacking risk |
| 47 | **Dandelion Root** (107) + **Lotus Leaf Extract** (555) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Excessive stacking with other strong diuretics (Dandelion leaf, Juniper) leading to electrolyte depletion |
| 48 | **Echinacea** (221) + **Ginseng** (240) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Ginseng, high-dose mushrooms — excessive combined immune activation |
| 49 | **Fadogia** (236) + **Tongkat Ali** (284) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other testosterone-stimulating herbs (Fadogia Agrestis, high-dose Ashwagandha) — CAUTION: cumulative testosterone increase; prostate and cardiovascular considerations; avoid excessive stacking |
| 50 | **Garlic** (238) + **Ginkgo** (239) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Ginkgo, Angelica (high dose), Turmeric (high dose) — cumulative antiplatelet effect; stacking increases bleeding risk |
| 51 | **Garlic** (238) + **Turmeric** (286) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Ginkgo, Angelica (high dose), Turmeric (high dose) — cumulative antiplatelet effect; stacking increases bleeding risk |
| 52 | **Garlic** (238) + **Cordyceps** (308) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) — additive antiplatelet risk; monitor in bleeding-risk individuals |
| 53 | **Garlic** (238) + **Lion's Mane** (317) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Anticoagulant herbs (Garlic, Ginkgo at high doses, Turmeric) — additive antiplatelet effect via hericenone B; monitor in bleeding-risk individuals |
| 54 | **Garlic** (238) + **Reishi** (323) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) — mild additive antiplatelet; monitor in bleeding-risk individuals |
| 55 | **Garlic** (238) + **Grape Seed** (420) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other antiplatelet herbs (Ginkgo, Garlic, high-dose Turmeric, Ginger) — additive bleeding risk |
| 56 | **Garlic** (238) + **Guggulu** (525) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other antiplatelet herbs (Ginkgo, high dose Garlic, Turmeric extracts, Amla extracts): additive bleeding tendency |
| 57 | **Garlic** (238) + **Feverfew** (546) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Concurrent use with other strong antiplatelet herbs (Ginkgo, Garlic) increases bleeding risk |
| 58 | **Ginger** (537) + **Grape Seed** (420) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other antiplatelet herbs (Ginkgo, Garlic, high-dose Turmeric, Ginger) — additive bleeding risk |
| 59 | **Ginkgo** (239) + **Turmeric** (286) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Garlic, Angelica, high-dose Turmeric, high-dose Fish Oil — cumulative antiplatelet effect; stacking increases bleeding risk significantly |
| 60 | **Ginkgo** (239) + **Cordyceps** (308) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) — additive antiplatelet risk; monitor in bleeding-risk individuals |
| 61 | **Ginkgo** (239) + **Lion's Mane** (317) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Anticoagulant herbs (Garlic, Ginkgo at high doses, Turmeric) — additive antiplatelet effect via hericenone B; monitor in bleeding-risk individuals |
| 62 | **Ginkgo** (239) + **Reishi** (323) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) — mild additive antiplatelet; monitor in bleeding-risk individuals |
| 63 | **Ginkgo** (239) + **Grape Seed** (420) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other antiplatelet herbs (Ginkgo, Garlic, high-dose Turmeric, Ginger) — additive bleeding risk |
| 64 | **Ginkgo** (239) + **Guggulu** (525) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other antiplatelet herbs (Ginkgo, high dose Garlic, Turmeric extracts, Amla extracts): additive bleeding tendency |
| 65 | **Ginkgo** (239) + **Feverfew** (546) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Concurrent use with other strong antiplatelet herbs (Ginkgo, Garlic) increases bleeding risk |
| 66 | **Gotu Kola** (108) + **Passionflower** (273) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Sedative herbs (Valerian, Passionflower) — additive CNS depression; monitor |
| 67 | **Gotu Kola** (108) + **Valerian** (288) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Sedative herbs (Valerian, Passionflower) — additive CNS depression; monitor |
| 68 | **Gromwell Root / Shikonin** (565) + **He Shou Wu / Fo-Ti** (589) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Avoid stacking with harsh cold purgatives or any other known hepatotoxic botanical (Gromwell id 565 internally, Comfrey, Kava) |
| 69 | **Guarana** (109) + **Yerba Mate** (296) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other high-caffeine herbs (Guarana, Green Tea extract, Guayusa) — additive caffeine; risk of excessive stimulation; monitor total caffeine load |
| 70 | **Guayusa** (245) + **Yerba Mate** (296) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other high-caffeine herbs (Guarana, Green Tea extract, Guayusa) — additive caffeine; risk of excessive stimulation; monitor total caffeine load |
| 71 | **Guduchi** (501) + **Vijaysar** (510) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other hypoglycaemic herbs (Vijaysar, Gymnema, Bitter melon): additive glucose lowering |
| 72 | **Hadjod** (505) + **Vijaysar** (510) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other hypoglycaemic herbs (Vijaysar, Gymnema): additive glucose lowering |
| 73 | **Hops** (243) + **Vervain** (289) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Hypnotic sedatives (Valerian, Hops) at high combined doses — can produce excessive CNS depression; reduce doses |
| 74 | **Hops** (243) + **California Poppy** (596) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other sedative herbs (Valerian, Hops, Kava, Skullcap at high dose): additive sedation |
| 75 | **Juniper** (255) + **Lotus Leaf Extract** (555) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Excessive stacking with other strong diuretics (Dandelion leaf, Juniper) leading to electrolyte depletion |
| 76 | **Kava Kava** (257) + **He Shou Wu / Fo-Ti** (589) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Avoid stacking with harsh cold purgatives or any other known hepatotoxic botanical (Gromwell id 565 internally, Comfrey, Kava) |
| 77 | **Kava Kava** (257) + **California Poppy** (596) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other sedative herbs (Valerian, Hops, Kava, Skullcap at high dose): additive sedation |
| 78 | **Lavender** (251) + **Valerian** (288) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Valerian at high combined doses — additive sedation; monitor and reduce Valerian dose |
| 79 | **Mugwort** (267) + **Wormwood** (293) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other thujone-rich Artemisia species (Wormwood, Tarragon) — cumulative thujone; avoid at high doses or long-term |
| 80 | **Mugwort** (267) + **Sage** (303) | SHOW |  | strong words, but about high doses — our caps keep shares small; check | Other thujone-rich herbs (Wormwood, Mugwort) at high combined doses — theoretical cumulative thujone toxicity (Tea doses are fine; this caution is for concentrated preparations) |
| 81 | **Skullcap** (281) + **California Poppy** (596) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other sedative herbs (Valerian, Hops, Kava, Skullcap at high dose): additive sedation |
| 82 | **Turmeric** (286) + **Cordyceps** (308) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) — additive antiplatelet risk; monitor in bleeding-risk individuals |
| 83 | **Turmeric** (286) + **Lion's Mane** (317) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Anticoagulant herbs (Garlic, Ginkgo at high doses, Turmeric) — additive antiplatelet effect via hericenone B; monitor in bleeding-risk individuals |
| 84 | **Turmeric** (286) + **Reishi** (323) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) — mild additive antiplatelet; monitor in bleeding-risk individuals |
| 85 | **Turmeric** (286) + **Grape Seed** (420) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other antiplatelet herbs (Ginkgo, Garlic, high-dose Turmeric, Ginger) — additive bleeding risk |
| 86 | **Turmeric** (286) + **Guggulu** (525) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other antiplatelet herbs (Ginkgo, high dose Garlic, Turmeric extracts, Amla extracts): additive bleeding tendency |
| 87 | **Valerian** (288) + **Vervain** (289) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Hypnotic sedatives (Valerian, Hops) at high combined doses — can produce excessive CNS depression; reduce doses |
| 88 | **Valerian** (288) + **California Poppy** (596) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other sedative herbs (Valerian, Hops, Kava, Skullcap at high dose): additive sedation |
| 89 | **Vijaysar** (510) + **Gokshura** (522) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other hypoglycaemic herbs (Vijaysar, Gymnema, Bitter melon): additive glucose lowering |
| 90 | **Vijaysar** (510) + **Neem** (531) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other hypoglycaemic herbs (Vijaysar, Gymnema, Bitter melon): additive glucose lowering |
| 91 | **Vijaysar** (510) + **Fenugreek** (577) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other hypoglycaemic herbs (Gymnema, Bitter melon, Fenugreek, Cinnamon extracts, Guduchi) in medicated diabetics: stacking risk |
| 92 | **Yellow Dock Root** (295) + **Chaga** (307) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Yellow Dock and other high-oxalate herbs — cumulative oxalate load; avoid in kidney-risk individuals |
| 93 | **Yerba Mate** (296) + **Green Tea** (592) | SHOW |  | dose- or context-dependent (high dose, monitor, cumulative) | Other high-caffeine herbs (Guarana, Green Tea extract, Guayusa) — additive caffeine; risk of excessive stimulation; monitor total caffeine load |
