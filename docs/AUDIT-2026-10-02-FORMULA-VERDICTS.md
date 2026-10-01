# Formula verdicts of 2 Oct 2026 — one client, several readings (Robin)

Robin ran the same client through the Pro quiz several times, changing a few
answers each time, and judged the last formula (17/17/16/4/16/15/15 %,
Ajwain, Shatavari, Barley, a trace, Cinnamon, Licorice, Slippery Elm). The
arithmetic is right. What fails is **relevance → hierarchy → extraction
compatibility → ingredient identity → safety**.

**Done on 2 Oct:** item 9, the no-pseudo-diagnosis rule, in MYCO's composer
prompt and the analysis prompt. **Robin approved every proposal the same
evening ("OK on props", licorice cap 10%) — engine 2.11.0 does 1, 3, 4, 6,
7, 8:**

- **3** Licorice Root: `max_share_pct: 10`, `safety_flags` hypertension /
  cardio_meds / liver_kidney, and `max_share_note` (a 4–6 week course,
  then pause) in "why this formula".
- **8** `pharmacology.js isWarmingAromatic` (Hot + pungent, or Warm + Dry +
  pungent: 21 hot spices, not Jasmine / Turmeric / Mugwort) scores −4 and
  seats once (`rules.js MAX_WARMING`, tag WARM for MYCO) when the person is
  wired / wired-tired / reactive or reads hot.
- **7** `rules.js coverageGoals / uncovered`: the picker swaps in the best
  herb whose main goal is an uncovered top-two goal; the validator rejects
  a MYCO bottle that misses one the shortlist had.
- **6** A herb serving no chosen goal keeps 30% of its score (was 50%).
- **1** `menstruum: 'water'` on Slippery Elm and Marshmallow — left out of
  the tincture (`fitsMenstruum`).
- **4** The reveal's line per herb is `axes.js goalNote` — the first
  function serving the person's goals.

Eight test bottles moved, each re-pinned with its reason. **Still open:**
2 (licorice whole / DGL split) and 5 (barley split) — new records, herbs
everywhere.

| # | Verdict | Proposal | Moves bottles? | Size |
|---|---|---|---|---|
| 1 | Slippery Elm 15% in an ethanol tincture: its mucilage is not captured | Record a menstruum per herb (`extraction: water / glycerite / ethanol / oil`); the engine excludes or caps water-only herbs (mucilage: Slippery Elm, Marshmallow) in an ethanol bottle, or routes them to a separate glycerite | Yes | M |
| 2 | Whole licorice and DGL are one record | Split into **Licorice Root (whole, glycyrrhizin)** and **Licorice (DGL)** — separate extraction, dosage and safety | Yes | M |
| 3 | Licorice 15% needs a stronger safety gate | Whole root: `max_share_pct` (Robin: 10%?), excluded with hypertension, cardio meds, liver/kidney; a duration note (glycyrrhizin: potassium loss, BP, oedema); DGL keeps none of that | Yes | S |
| 4 | Barley 16% for "LDL cholesterol" — no cholesterol goal | (a) The reveal's line for a herb shows the function matching the client's goal, not the record's first line; (b) relevance weighting (see 6, 10) | Yes (b) | S / M |
| 5 | Barley mixes grain, bran and grass | Split into separate records, or keep one material and say which | Yes | M |
| 6 | Shatavari 17% for "reproductive nourishment" — weak relevance | A herb whose recorded goals miss the ranked intentions should not earn a main share: today it keeps half its points (×0.5, audit Q1/Q2); option ×0.3, or "main share only for goal-matching herbs" | Yes | S |
| 7 | The calming layer (Skullcap + Rose) was lost to digestion | **Coverage rule:** each of the top two ranked intentions keeps at least one herb whose PRIMARY goal it is; if missing, the weakest herb is swapped for the best candidate for that intention | Yes | M |
| 8 | Ajwain 17% + Cinnamon: two warming aromatics for a wired client | When nervous = wired / wired+tired / reactive, or the pattern is heat: penalise hot/pungent herbs, and at most one strongly warming aromatic per bottle | Yes | S |
| 9 | Client words must not become pseudo-diagnosis | **Done** — MYCO keeps reported symptoms as the person's words; no "toxins", "blocked liver", "dysbiosis", "inflammation", "trauma stored in tissue" unless they framed it so | No | — |
| 10 | Score four layers before percentages: client relevance, functional role, extraction compatibility, safety | This is Engine 3.0 (roles, extraction compatibility, the optimiser) — items 1, 6, 7, 8 are its first concrete pieces | Yes | L |

**Suggested order** (after the weekly usage reset): 3 → 8 → 7 → 6 → 2 →
1 → 4 → 5, re-pinning the test bottles with each rule's rationale.

## The flag feature — spec (not built)

Robin: after "open the full apothecary" reveals the percentages, flag a
formula that did not live up to the standard; flagged formulas collect in a
**formula e-book in the admin portal**, and MYCO picks them up.

- **Button** "⚑ Flag this formula" wherever the full percentages show (Pro
  reveal, formula analysis): a short reason plus tags — relevance, hierarchy,
  extraction, ingredient identity, safety, other.
- **Table** `formula_flags` (new SQL, admin-only RLS): formula id, herbs and
  percentages (snapshot), engine version, the pseudonymous client profile
  (client-profile.js — no name, email or city), reason, tags, flagged by,
  time, status (open / explained / fixed).
- **Admin portal**: "Formula e-book · flagged" — list, open, mark explained or
  fixed, link to the formula analysis with the client profile filled in.
- **MYCO**: the monthly digest reads the month's open flags and proposes
  engine or record changes per flag (FOR CLAUDE CODE block), like the
  catalogue requests.
- **Size:** M — about tonight's client-profile feature. Needs one SQL file
  run by Robin.
