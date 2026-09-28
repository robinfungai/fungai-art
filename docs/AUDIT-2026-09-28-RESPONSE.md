# Response to the external formula-maker audit · 2026-09-28

The audit ("Formula maker — forensic / exhaustive audit", 69 sections) was
checked claim by claim against the code. The first paste was cut off inside
its P0 list; the rest (P0 items 9–12, sections 65–69) arrived in the next
session and is answered under **The tail of the audit** below. This file
records the verdict on each finding and what was done, so the work can
continue section by section.

## What the audit actually read

The auditor read the code on **GitHub `main`** — which is what the live
site runs: commit `b3beace`, **25 September**. The brief it was checking
against (`docs/FORMULA-ENGINE-BRIEF.md`) describes engine **2.4**, eleven
unpushed commits later. So most "the brief says X but the code does Y"
findings are **true of the live site and already fixed locally**. That is
not a technicality: it means the live site is running the weaker engine.

## Three things the audit missed

1. **The live engine puts restricted herbs in customer bottles.** Running
   the live code (origin/main) over 2,400 customer profiles: **Ephedra in
   57 bottles**, Yohimbe 16, Fadogia 21, and the strong laxatives Rhubarb
   Root 94, Senna 62, Buckthorn 5. Over 1,200 **pregnancy** profiles, **1,191
   bottles contained a herb not recorded as pregnancy-safe** (the live rule
   is a word search). The local engine: 0 on every count. **Fix: deploy.**
   Robin's call ("push").
2. **The GitHub repository is public**, and `/herbs-data.js` (1.6 MB, every
   field of all 245 herbs) is served to every visitor. The compose endpoint's
   "never send the herb data to the browser" (which the audit praised) does
   not protect anything while both are public. No secrets are exposed:
   the current tree and all 577 commits contain only the public anon key.
   **D7:** Robin makes the repo private. `/herbs-data.js`: the two formula
   makers no longer load it; **`/mixology` and `/extraction` still do** (the
   extraction popup reads preparation fields from it), and the Atlas build
   reads it from disk, not over the web. Serving less means giving those two
   pages a trimmed file with only the fields they read — not done yet.
3. **Yohimbe is prohibited in food and food supplements in the EU**
   (Commission Regulation (EU) 2019/650, Annex III Part A of Regulation (EC)
   1925/2006) and was still reaching customer bottles locally. **D11 (Robin):
   pro composer only** — never in a customer bottle; `tests/invariants-verify.cjs`
   fails if it reaches one. No house dose on the pro dose sheet (the
   practitioner enters the dose).

## Verdicts

✅ = true, fixed · 🟢 = true on the live site, already fixed locally
(needs deploy) · ⚖️ = true, needs Robin's decision · ⏭ = decided, next ·
🔭 = agreed direction, long-term · ❌ = false

### Section 1 · Safety correctness — done 2026-09-28

| # | Finding | Verdict |
|---|---|---|
| 4 | Server does not derive under-18 from age | ❌ It has since 24 Sep (`index.js` compileFormula and the MYCO path). Now proven over HTTP in `tests/invariants-verify.cjs`: an under-18 request with `avoid:["none"]` asking for ceremonial herbs gets Fu Ling, Red Dates, Rudraksha, Vanilla. |
| 5 | `_ageConfirmed` is not age verification | ✅ True and already said in the code; it is an acknowledgement. Wording only. |
| 6 | Pregnancy rule is a word search, not `safe_pregnancy` | 🟢 Fixed locally 27 Sep. Live: 1,191 of 1,200 pregnancy bottles affected. |
| 7 | Unknown safety values silently dropped (`["pregnacy","thyroid"]` → thyroid only) | ✅ Now refused (`SAFETY_FLAG_UNKNOWN`). The old test that asserted the fail-open behaviour was rewritten. |
| 8 | The page fills in `avoid:["none"]` when the answer is missing | ✅ Removed on both pages; the server refuses and the page returns to the safety question. |
| 43 | Same safety flags in a different order → different bottle | ✅ True in **31%** of multi-flag profiles (measured). Seed now sorts them. |
| 14 | Notes have no scoring ceiling | ✅ Keyword-stuffed note reached +30 (goal #1 is 12); realistic notes ≈ +4. Capped at +6. |
| 15 | Notes are not a safety channel | ✅ Both pages say medicines/pregnancy/conditions belong in the safety question. **D1 done (safety rules 1.3):** a medicine, pregnancy or condition named in the note applies the matching flag (`note-safety.js`, English + common German words), fail-closed, and the reveal names the word and the filter. Two fixture profiles show why: "On levothyroxine for Hashimoto's" now also gets the autoimmune filter; "Postpartum, second baby…" now gets the pregnancy/breastfeeding filter. |
| 52–54 | Invariants, fuzzing, test the engine against its own documentation | ✅ `tests/invariants-verify.cjs`: 600 random profiles (fixed seed) + the HTTP handler + 120 profiles through the MYCO path with a stand-in for Anthropic; every documented rule on every bottle. |

### Section 2 · The brief vs the code (drift)

| # | Finding | Verdict |
|---|---|---|
| 9–12 | Goals regex-derived; 5/n scoring; no ×0.5 | 🟢 Live only. Local: recorded goals, position weights, ×0.5. |
| 16 | Pro answers collected but ignored; not sent to MYCO | 🟢 Live only. Local 2.4 scores all six and passes them to MYCO. |
| 18 | Serotonergic / laxative caps missing | 🟢 Live only. Local: picker, MYCO validator, analysis. |
| 25 | CNS classifiers are word searches | 🟢 Live only. Local: `cns_action` recorded on 68 herbs; a test fails if an unclassified herb would be flagged. |
| 17 | Stale comments ("opt-in via URL param", "207-herb") | ✅ "opt-in" fixed; "207-herb" is not in the current code. |
| 29 | Validator corrects MYCO's percentage drift, not only vetoes | ✅ Moot since engine 2.5: MYCO no longer sends percentages (D2). |
| 28 | Same answers ≠ same final formula when MYCO composes | ✅ True, and by design (D2 option C): MYCO may choose different herbs; the percentages are always the engine's. The brief says so. |

### Section 3 · Building the bottle — done 2026-09-28 (engine 2.5)

| # | Finding | Verdict |
|---|---|---|
| 21 | No cap on an ordinary herb's share | ✅ **No herb above 40%** (`percentages.js`, capped water-filling, largest-remainder rounding). 4,000 random profiles against 2.4: 101 bottles had a herb above 40% (largest 71%); now none. A bottle needs three main herbs; a trace herb only seats in a bottle of four or more. |
| 20 | More safety flags → more herbs | ✅ Rule removed. |
| 19 | Second fill walk drops the category cap | ✅ One strict walk. Fewer than three main herbs → no bottle, with `NO_SAFE_MATCH` or `NO_MATCH` (below). Neither has fired in 4,000 random profiles. |
| 30 | MYCO should not set percentages | ✅ **D2 option C:** MYCO chooses herbs, reasons and the reading; the engine sets every percentage. A MYCO `pct` is ignored (tests send 90% for one herb and check the bottle). |
| 44 | Evidence grade only breaks ties | ✅ **D4:** 0 to +2 points (A 2 · B+ 1.5 · B 1 · B− 0.75 · C/traditional/ungraded 0.5 · D 0), only for a herb that scored something else. |
| 46–47 | "No match" vs "no safe match" | ✅ `NO_SAFE_MATCH` when the safety answers emptied the pool (the same walk without them would fill a bottle), else `NO_MATCH`. HTTP 422, each with its own words on both pages. |
| 22 | Separate selection from dosing | 🔭 Agreed; joins the Extraction data and formulation roles (§65, §67). |
| 23–24 | Pair cautions never veto; matching is by name | 🔭 True; needs severity data per pair (§65: INFO / CAUTION / STRONG_CAUTION / DO_NOT_COMBINE). |
| 57 | Constrained optimisation instead of a greedy walk | ❌ for now: the greedy walk never needed to relax a rule in 24,000 profiles, and now it cannot. Revisit if NO_MATCH starts firing. |

Every fixture bottle moved (percentages are recomputed); all 19 are
re-pinned in `tests/fixtures/methodology-pins.cjs` with the reason.

### Section 4 · AI and data flow

| # | Finding | Verdict |
|---|---|---|
| 27 | MYCO chooses the formula, not just explains it | ✅ True, and now bounded: it chooses herbs, never shares (D2). |
| 31 | A second AI call sends the personal note again (reading paragraph) | ✅ **D5:** removed from both pages. The compose call's MYCO text is the reading now — one AI call sees the note. |
| 32 | The claims sanitiser is regex, not a guarantee | ✅ True; it is last-line hygiene. The MYCO prompt now also forbids treat/cure/heal/prevent wording. |
| 39–40 | Health data, minimisation | ✅ **D6:** unreserved formulas and answers deleted after 30 days (nightly job in the database); reservations are now marked so they are kept; the privacy page says 30 days. |

### Section 5 · Abuse and robustness

| # | Finding | Verdict |
|---|---|---|
| 41 | Rate limit is per server instance; no-origin requests pass | ✅ **D8:** a daily MYCO budget in the database, across all instances; past it, the deterministic engine only. The per-request rate limit is still per instance. |
| 42 | No server-side idempotency | ✅ **P0 #11:** same request id + same answers → the stored formula. |

### Section 6 · Copy, claims and the reveal

| # | Finding | Verdict |
|---|---|---|
| 35 | "10 questions · 90 seconds" / "Six questions" / "about 2 minutes" | ✅ Now "10 questions · about 2 minutes" and "Ten questions". |
| 33–34 | Claims wording ("slow-pace medicine", "Give it three weeks", why-copy "does the deeper work") | ⏭ **D9 (Robin): yes** — a claims-safe revision table of every formula-maker and `display.js` string, for Robin's approval **before** any live copy changes. |
| 38 | Show the herbs before reservation | ❌ Already the case — names are shown; only percentages wait for the reservation. The role grouping idea is good (Section 7). |
| 36–37, 58–61 | Reveal ritual (emoji placeholders, teach the stages) | 🔭 **D10 (Robin): parked** for a dedicated design pass after the engine and copy work. |

### Section 7 · The data model — long-term direction

| # | Finding | Verdict |
|---|---|---|
| 13, 48–51, 55–56 | Move meaning out of prose into structured herb fields; formulation roles; layered scoring | 🔭 Agreed and under way: `goals`, `cns_action`, `safe_pregnancy`, `serotonergic`, `formula_access`, `digestion_fit`, `regional_affinity` are recorded. Still regex: body pattern, time, stress style, the ten safety flags, categories. |
| 26 | "Trace" is a formulation class | 🔭 True; the 5% is a house rule and is now labelled as one. |
| 45 | A confidence concept | 🔭 Later (§65). |

## The tail of the audit (§64 items 7–12, §65–69)

| Item | Finding | Verdict |
|---|---|---|
| P0 7 | Replace prose-regex goals with explicit data | ✅ Done in `f72bac8` (245 recorded goal lists). |
| P0 8 | Reconcile the scoring maths with the brief | ✅ Done in `f72bac8`; the brief is updated again for 2.5. |
| P0 9 | Decide whether MYCO may produce nondeterministic formulas | ✅ **D2 option C**: it may choose different herbs; never the shares. |
| P0 10 | Percentages back to deterministic logic | ✅ Engine 2.5. |
| P0 11 | Real server-side idempotency (`requestId`, `unique(profileHash + sessionNonce + requestId)` in `fyf-compose.mjs`) | ✅ The page sends one request id per visit; `request_key` = hash of that id + the exact answers, unique in `fyf_formulas`. A repeat returns the stored formula (`replayed: true`); two at once still store one. |
| P0 12 | Global / edge AI abuse protection | ✅ The daily MYCO budget (bot protection such as Turnstile is not added). |
| §65 | P1: cap note influence; canonical unordered inputs | ✅ Both done in `1917c9e`. |
| §65 | P1: remove second-pass category relaxation | ✅ Engine 2.5. |
| §65 | P1: `NO_MATCH` vs `NO_SAFE_MATCH` | ✅ Engine 2.5. |
| §65 | P1: explicit roles (PRIMARY, SECONDARY, REGULATOR, FOUNDATION, BRIDGE, TRACE, FLAVOUR, MUSHROOM_AXIS) | 🔭 Agreed. Roles must be **engine** data (recorded per herb, assigned deterministically) so the baseline and the MYCO path carry the same ones; MYCO-only roles would vanish every time MYCO falls back. Comes with §67. |
| §65 | P1: confidence (HIGH / MEDIUM / LIMITED) | 🔭 With §67. |
| §65 | P1: interaction severity (INFO … DO_NOT_COMBINE) | 🔭 Needs a severity per recorded pair; a DO_NOT_COMBINE pair would then veto. |
| §65 | P1: structured evidence; extraction compatibility | 🔭 Evidence now scores (D4); per-claim evidence and the Extraction link are data work. |
| §65 | Ingredient transparency before reservation | ❌ Already the case (names shown, percentages after reserving). |
| §65 | Botanical visual language, cinematic reveal, constellation | 🔭 D10, parked. |
| §66 | Formula Engine 3.0 architecture | 🔭 Agreed as the destination. Where 2.5 stands on that diagram: safety profile ✅ (now including the note), eligible botanicals ✅, structured scoring (partly — goals, CNS class, pro tags recorded; body/time/stress still regex), MYCO creative proposal inside deterministic constraints ✅, deterministic veto ✅, deterministic dose ✅. Missing: the formulation optimiser step (roles) and the Atlas safety/formulation/evidence graphs. |
| §67 | A canonical "Formula Object" (profile, safety, constellation with role/fit/shareRange, constraints, composition method) | 🔭 Agreed as the target shape for the stored formula, the reveal, the pro tools, the PDF and a future batch record. First pieces are in: the engine result now carries `safetyFlags` (what the bottle was built under) and `noteSafety` (what the note added). Next pieces: `composition: { method, mycoUsed }` (the data exists as `mycoUsed`), then roles and confidence once they are engine data. It should be versioned beside `engineVersion`, since reservations store it. |
| §68–69 | Shift from "find herbs whose descriptions resemble the answers" to "construct the best feasible constellation under explicit constraints"; make the engine internally truthful first | ✅ Agreed. The truthfulness part is what Sections 1–3 did: every structured answer scores, unknown safety fails closed, the brief matches the code (engine 2.5, safety rules 1.3). |

## Second round · the "three audits" synthesis (2026-09-28)

A later summary merged three audits. Its newest audit also read GitHub
`main`, and said so: brief 2.4 vs `main` 2.1 (true — `main` is the live
deploy, `b3beace`). Each claim checked against the local engine:

| Claim | Verdict |
|---|---|
| Everyone must audit the same engine | ✅ The first fix. Deploying (D0) closes the gap; a small `/api/version` (commit, engine, safety, catalogue) would let anyone check what is live — proposed, not built. |
| Minors get HIGH-caution herbs; pregnancy not explicit; laxative / stimulant / sedative caps missing; stimulant/sedative by substring | 🟢 True of `main`; fixed locally since 27–28 Sep. |
| Word searches misclassify ("lion" → Dandelion a mushroom) | ✅ Still true locally for the category: Dandelion, Ginkgo, Milk Thistle and Schisandra counted as mushrooms; Fu Ling, Morels, Enoki, Shaggy Mane, Tinder Fungus did not. **Engine 2.6:** "mushroom" = the recorded botanical family. The other categories are still read from text. |
| "Allergy boomerang": a herb named in the note gets a score boost | ❌ for scoring — note keywords are a fixed list of goal words; "allergic to chamomile" gives chamomile 0. But the herb was not excluded either. **Safety rules 1.4:** a herb the note says to avoid is excluded, and the reveal says so. |
| Notes reach MYCO as possible instructions (prompt injection) | ✅ The note is now fenced and labelled untrusted; links, markup and email addresses are removed from MYCO's text before anyone sees it. |
| One rule engine for picker and validator | ✅ `rules.js`, used by both; the pro analysis reads the same numbers. |
| Amanita needs a genus rule | ✅ At most one per bottle (it happened in 0 of 1,500 bottles; the rule costs nothing). |
| Denial of wallet | ✅ D8: global daily MYCO budget + one formula per request. SQL to run. |
| Health-data retention | ✅ D6: 30 days for unreserved formulas. SQL to run. |
| Public botanical datasets | ✅ `public/herb-engine-pool.json` (270 KB, read by nothing) removed with its build step. `/herbs-data.js` stays while `/mixology` and `/extraction` need it (D7). |
| The pro editor can save forbidden herbs | ✅ A formula with a plant the engine never bottles cannot be saved or printed; other failed checks can, as failures. |
| Primary goal should be a constraint, not points | ❌ Not needed today: 0 of 1,500 adult bottles lack a herb serving goal #1. A formal rule would be insurance only. |
| Multi-goal "bridge" herbs need special maths | ❌ Already: serving #2 + #3 (up to 9 points) outranks the weakest #1 match (6.48). |
| Consumer gets weaker safety questions than the pro | ⚖️ True: the consumer quiz does not ask about past bad reactions or stimulant sensitivity, and breastfeeding is judged by the pregnancy data (lactation safety is not the same thing). Needs Robin's wording for the questions. |
| HIGH-caution herbs need a per-bottle cap | ⚖️ Robin's call (HIGH herbs stay in adult formulas — decided 27 Sep). Measured: 46% of adult bottles hold one, 4.7% two or more. A count cap is a different question from exclusion. |
| Trace budget, load model, hard/soft pair cautions, roles, provenance per field, constrained optimisation, batch traceability | 🔭 Agreed direction. Optimisation pays once scores depend on pairs (bridges, synergy, budgets); an exhaustive search over the 20-herb shortlist (~132,000 bottles of 5–7) needs no solver. |
| Test the safety question with realistic personas first | ⚖️ Agreed as the first human test. |

## Decisions (Robin, 2026-09-28)

| | Question | Decided | Status |
|---|---|---|---|
| **D0** | Deploy (push) the unpushed commits? | Robin's call | Not pushed. The live site still composes Ephedra and non-pregnancy-safe bottles. |
| D1 | Safety words in the note | Apply the matching flag, fail-closed, and say so | ✅ Safety rules 1.3 |
| D2 | MYCO's role | C: MYCO chooses herbs and writes the reasoning; the engine sets percentages | ✅ Engine 2.5 |
| D3 | 40% cap · drop "+1 herb for 2+ flags" · strict walk + NO_MATCH/NO_SAFE_MATCH | Yes to all three | ✅ Engine 2.5 |
| D4 | Evidence grade | 0 to +2 points | ✅ Engine 2.5 |
| D5 | Second AI call for the reading paragraph | Drop it; fold into the compose call | ✅ Both pages |
| D6 | Unreserved quiz answers | Delete after 30 days; privacy page to match | ✅ Code + privacy page; **run `supabase-fyf-retention.sql`** |
| D7 | Public repo; `/herbs-data.js` | Robin makes the repo private; check what still loads the file | `herb-engine-pool.json` removed; `herbs-data.js` still needed by `/mixology`, `/extraction` |
| D8 | Daily MYCO budget + server-side idempotency (P0 #11) | Yes | ✅ Code; **run `supabase-myco-budget.sql`**; set `FYF_MYCO_DAILY_LIMIT` in Netlify (default 100) |
| D9 | Claims pass over the formula-maker copy | Yes — draft a table for approval first | ⏭ Next |
| D10 | Reveal ritual and visual language | Parked for a design pass | 🔭 |
| D11 | Yohimbe | Pro composer only; no house dose; rank gate and brown logo unchanged | ✅ (pro-only since `1917c9e`; test added) |
