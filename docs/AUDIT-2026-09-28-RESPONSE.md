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

## Third audit · Claude, "Formula Maker Audit Report" (read main@b3beace)

Also read GitHub `main` (engine 2.1) and said so plainly. Its numbers
are true of the live site. Re-run on the local engine (2.6.1):

| # | Finding | Verdict |
|---|---|---|
| C1 | Pregnancy ignores `safe_pregnancy` (133 of 136 bottles) | 🟢 Fixed 27 Sep: only `safe_pregnancy: true` passes. |
| C2 | Minors get HIGH-caution herbs; Dan Shen in 54% of minor bottles | 🟢 Fixed 27 Sep: Dan Shen (HIGH) fails the under-18 gate. Its point on **ethanol for minors** (EMA: ethanol-free or lowest level for children) is a product decision — ⚖️ Robin. |
| C3 | Stimulant / sedative by substring ("glutamate" → stimulant) | 🟢 Fixed: recorded `cns_action`. Lavender, Barley, Vanilla, Hawthorn, Meadowsweet, Jiaogulan, Cistanche all read correctly now. |
| C4 | "I am 8 weeks pregnant" in the note → Amanita, Mistletoe, Barberry | ✅ Fixed (D1): the note applies the pregnancy filter; every herb in that bottle is recorded pregnancy-safe. |
| C5 | Ephedra, Yohimbe in the consumer pool | 🟢 Both pro-only (Robin's decision D11; the audit would restrict them outright unless a lawyer says a tincture is not food). |
| H1 | Goal decides less than body type; detox 1% | 🟢 Fixed in 2.4 (recorded goals). |
| H2 | A plain adult sleep bottle leads with Amanita Muscaria; two Amanitas together | ✅ **Robin, 2026-09-29 — engine 2.7:** one Amanita per bottle (2.6), at most 10% of the bottle, never beside St John's Wort. The quoted sleep profile now gets Amanita Muscaria at 10% (was 22%). The note can raise an Amanita's score by at most the +6 note cap, like any herb. |
| H3 | Ten checkboxes can't screen St John's Wort ("~50% of medicines"); no "other prescription", breastfeeding, surgery, epilepsy, alcohol questions | ⚖️ True. **Robin, 2026-09-29: St John's Wort stays in customer bottles.** Open: an "any other prescription medicine" answer and the consumer safety questions already listed (handoff §0.16). |
| H4 | Laxatives and sedative + stimulant without gates | 🟢 Fixed in 2.4. |
| H5 | Validator looser than the brief; can accept a 0% herb | ✅ Fixed: MYCO's percentages are ignored (2.5) and the validator uses the picker's own rules (2.6). |
| H6 | Herb data in `public/` | ✅ `herb-engine-pool.json` removed (2.6); `herbs-data.js` remains for `/mixology` and `/extraction` (D7). |
| M1 | Dandelion is a mushroom | ✅ Fixed in 2.6 (recorded family). |
| M2 | "MS\b" case-insensitive flags 25 herbs autoimmune via "symptoms" | ✅ **Fixed in safety 1.4.1**: "MS" in capitals only. 26 herbs lost a false autoimmune flag (75 → 49). |
| M3 | Note keyword "art" fires on "partner", "flu" on "reflux"; +40 possible | ✅ Cap +6 since `1917c9e`; **2.6.1**: keywords match at word starts, short ones as whole words. |
| M4 | Red Dates in 41% of bottles | 🔭 Seat concentration; revisit after the goal lists are reviewed. |
| M5 | No-origin requests pass; limits in memory; each call can spend Opus | ✅ Wallet side fixed (D8 daily budget, idempotency). No-origin requests still pass. |
| L1 | A synergy note names a herb not in the bottle | ⏭ True; the display shows the whole recorded sentence. Small fix, open. |
| L2 | The MYCO path hashes an un-normalised profile | ✅ Fixed in 2.5 (one `prepareProfile`). |
| L3 | "Give it three weeks"; templates bypass the claims sanitiser | ⏭ D9 (planned for 2026-09-29). |
| Q5 | Cap HIGH-caution herbs for adults (≤ 1, ≤ 15%) | ⚖️ Robin (46% of adult bottles hold one today). |
| Q8 | First human test: the safety question with personas | ⚖️ Agreed. |

## Fourth finding · XSS through `patternSub` (2026-09-29)

**Verdict: real, fixed — severity Medium, not HIGH.** Checked on HEAD and origin/main (identical in these files).

- **The chain is real.** `fyf-compose.mjs` accepted any string ≤ 32 characters as `patternSub`; `display.js` `buildWhyText()` wrote it into `whyText` unescaped; both formula pages set `whyText` with `innerHTML`. `<img src=x onerror=…>` is 28 characters.
- **Why not HIGH.** The only browser that renders the response is the one that sent the request, and the site's quiz sends only its own button values — so as found it is self-XSS. A third-party page cannot make fungai.art's script render its payload. The stored copy (`fyf_formulas.profile`) is read back by `reserve-formula` (HTML email escapes it with `esc()`; the customer email only uses it as a map key), `fyf-upgrade` and the idempotent replay (both return to the same requester). `whyText` itself is never stored. It still had to go: one new reader of the stored profile would have made it stored XSS.
- **Fix A — enum.** `patternSub` must be one of the 16 quiz sub-answers; anything else is refused with `PROFILE_INVALID`. `''` (no sub picked) is accepted, and a real sub-answer of a different pattern (a changed answer) is dropped rather than refused, so no genuine quiz run can fail on it.
- **Fix B — escaping.** `display.js` escapes every non-constant string it puts into `storyText` / `whyText`: herb names, herb summaries, percentages, the sub-answer. The phrase maps are our own copy.
- **Not done: structured data instead of HTML.** Right direction, bigger change (both formula pages render these strings). With every input either an enum or escaped at the one place the HTML is built, the class is closed for now; revisit with D10 (reveal redesign), where the reveal markup is rewritten anyway.
- **Tested:** the audit payload → 400 `PROFILE_INVALID`; `''`, `anger` under hot, and `cold_hands` under hot → 200 with the right line in `whyText` (bundled with esbuild as Netlify builds it); `buildWhyText` with the payload emits `&lt;img`, never `<img`; `fyf-compose-storage-verify` 16/16; fixture compare 0 unexpected.

## Fifth finding · D8 does not stop two MYCO calls at the same moment (2026-09-29)

**Verdict: real, fixed — severity Medium, not HIGH.** The race was exactly as described: both copies found no stored row, both took a call from the daily budget and called MYCO, and only the second INSERT failed (23505) and replayed the first. The new test reproduces it on the old code: *MYCO 2, budget 2, rows 1*.

- **Why not HIGH.** The page never retries by itself (one request, a Retry button after an error). The realistic case is a phone dropping its connection mid-reveal and the person tapping Retry while the first request is still with MYCO: one extra Opus call, inside the daily budget. Someone trying to spend money does not need the same key — a fresh requestId skips idempotency altogether — so the cost ceiling is, and stays, the daily budget (`myco_budget_take`, atomic) and the per-IP limit. Idempotency is about not charging one person twice.
- **Fix — claim before MYCO.** New `supabase-fyf-claims.sql`: `fyf_compose_claims` and `fyf_claim_request(key)`, one `INSERT … ON CONFLICT DO UPDATE … WHERE stale` statement, so only one copy gets `true`. Flow in `fyf-compose.mjs`: stored formula? → replay. Otherwise claim → only the claimant takes the budget and asks MYCO → store. A copy that finds the key claimed polls for the stored formula (every 1.5 s, up to 26 s — MYCO's own timeout is 25 s) and replays it; if none appears it answers 503 `COMPOSE_IN_PROGRESS`, which the page shows as "Please retry". A claimant that fails (engine error, rejected, no match, store failed) releases the key; a claim older than two minutes is taken over; claims older than a day are cleared.
- **Before the SQL is run** the claim is skipped (warning logged) and compose behaves as before — nothing breaks.
- **Tested** (`tests/fyf-compose-storage-verify.cjs`, 19/19): two identical requests at once → MYCO once, budget once, one row, the same formulaId to both, exactly one marked replayed; a failure after claiming → 500 and the key is free; the SQL file defines both functions for the service role only. All 16 earlier checks unchanged.

## Sixth finding · the percentage "lock" is a UI lock (2026-09-29)

**Verdict: accurate description — a decision, not a defect.** The compose response carries every herb's real percentage and the full `whyText`; the page shows "??%" and dims the reading until reservation; `window.__authoritativeFormula` holds the lot; "See the full apothecary" deliberately reveals it without reserving (the page's own comments call it "no hard block" and a "marketing hack"). So it is intrigue, not access control. One comment claims more than that — `public/find-your-formula/index.html` CSS: "prevents scrape-and-copy" — and is wrong.

**Decision (Robin, 2026-09-29): A**: a UI experience. The CSS comment on both formula pages now says so (no more "prevents scrape-and-copy").

## Seventh finding · the browser writes the Formula Book entry (2026-09-29)

**Verdict: real, fixed (Medium-High).** After a reservation both formula pages inserted into `public.formulas` from the browser. The database allowed anyone to do the same: `formulas_anon_insert_from_quiz` let anon insert any row marked `source = 'find-your-formula'` (any name, herbs, percentages), and members could insert anything (`WITH CHECK (true)`), including rows credited to another member. Those rows show in the public Formula Book (`formulas_public`). Every entry also carried `quiz_snapshot` (the health answers) into a second table the 30-day purge never touches (readable only by admins, but kept forever).
- **Not XSS:** the Formula Book escapes every field it shows (`esc()`), so injected rows are fake content, not script.
- **Fix (`8d8cb2e`):** `reserve-formula` writes the entry itself, from the formula stored in `fyf_formulas`, once (only when the reservation is the first for that formula), with no notes, name or quiz answers. Both formula pages no longer insert (the device-local Formula Book copy stays). New `supabase-formulas-server-writes.sql`: no anon inserts; members may insert their own Mixology / analysis saves only, credited to themselves or no one, never marked as a Find your formula entry, never with quiz answers. An optional, commented step clears the `quiz_snapshot` copies already there (irreversible; rows from before 2026-09-11 have the answers only there). **Run it only after the 1 October push** (`docs/HANDOFF.md` §0.17).
- **Tested:** reserve tests 8/8, compose storage 19/19. The new write itself is read-reviewed, not run: `reserve-formula` has no database test hook. First live reservation after the push is the check.

## Eighth finding · the AI provider is not named where consent is given (2026-09-29)

**Verdict: fair, fixed (`8d8cb2e`).** The privacy page already names Anthropic's Claude for Find your formula, says the data is not used for training, and lists Anthropic as a processor. The consent checkbox did not. It now reads "...my answers, including health details and any note I write, are used to create my formula, with the help of an AI model (Anthropic's Claude)." The pro composer had no data consent at all (only "I am 18 or older") although a practitioner types a client's health answers into it: its gate now also confirms the client has agreed, AI included, and links the privacy terms.
- **Open (Robin / legal):** the privacy page does not describe the pro composer or practitioners' client files (`practitioner_formulas`). Who is the controller of a client's data there (Robin or the practitioner) is a legal question, so it is not drafted here.
- Also corrected in passing: a comment on the pro page said Amanita is "legal in Sweden"; muscimol is a scheduled narcotic there.

## Ninth finding · herb-to-herb cautions are not hard exclusions (2026-09-29)

**Verdict: accurate; decided and enforced (engine 2.8.0).** Pair cautions were prose (`herb_to_herb_caution`), matched by name after the bottle is composed and shown; they never stopped a pair.
- **Counted:** 241 herbs, 233 with caution prose; 242 herb pairs carry a matched caution, 93 of them strongly worded.
- **Matcher bug fixed first (engine 2.7.1, `8d8cb2e`):** names were matched anywhere in the prose, so "pine" matched "benzodiazepines", "grape" matched "Grapefruit", "tian" matched "Gentian", and a generic first word stood for the herb ("black" for Black Cumin in "Black Cohosh"). Names now match as whole words (plural allowed); generic first words no longer count alone. 279 to 242 pairs: 37 false cautions gone, none added, every removal checked by hand. Display only (the pair check runs after composition).
- **Classes (Robin, 2026-09-29):** SHOW / CONDITIONAL / BLOCK, as the audit suggested. Row decisions at the top of `docs/PAIR-CAUTIONS-REVIEW.md`: 8 BLOCK, 15 CONDITIONAL in `src/server/formula-engine/pair-rules.js`, enforced in `rules.js` `seatBlocker`, so the deterministic picker and the MYCO validator obey them alike. MYCO is also shown the cautions among its shortlist, to steer round SHOW pairs where they do not fit. Checked by `tests/note-refusals-and-pairs-verify.cjs` (47 checks, including a 192-profile grid with no forbidden pair).

## Tenth finding · patternSub and intentions[] not validated as meaning (2026-09-29)

**Verdict: real, fixed.**
- **patternSub** — already fixed by the fourth finding (`5bf7aa2`): only the 16 quiz sub-answers are accepted, and one that does not belong to the chosen pattern is dropped, so `pattern = cold, patternSub = anger` earns no anger boost.
- **intentions[]** — could repeat a goal (`['stress','stress','stress']` = three scoring events) and need not start with `intention`. `fyf-compose` now builds it as `intention` first, then the rest, each goal once, at most three. Normalised rather than refused: the quiz always sends that shape (it stores the top pick as `intention`, and a tapped goal cannot be picked twice), and an old saved quiz still composes.

## Eleventh finding · the note scorer is keyword matching (2026-09-29)

**Verdict: accurate — bounded, one narrow fix, the rest is the long-term plan.** `notesBoost` matches keywords at word starts (since M3, 2026-09-28) and is capped at +6 — half of the first goal's 12 — so a misread note moves a herb, it cannot lead a bottle. The audit's own example ("I do NOT want something stimulating") scores nothing: "stimulat" is not a keyword. The same shape does bite with real keywords: "I don't want anything for sleep" boosted sleep herbs.
- **Fixed (engine 2.7.2):** words after a refused wish — a negated want/need followed by *anything / something / any / a / an* — are not scored, to the end of that phrase. Deliberately narrow, because negation in symptom language is a need: "can't sleep", "no energy", "nothing helps my anxiety", "I don't want to feel tired" all still count (tested).
- **Not fixed:** past vs present ("I used to sleep badly"), strength of statement, desire vs history. Those need structured extraction, not more keywords. When MYCO composes (engine 2.5) it reads the note as a whole; the keyword boost matters for the ranking MYCO chooses from and for the deterministic fallback. A structured extraction of the note (wants / avoid / history) is a candidate for the next engine round.
- **Tested:** 600-profile invariants, safety rules, safety conflicts, compose storage 19/19, analysis 27/27, fixtures 0 unexpected.

## Twelfth to fourteenth findings · reading vs why, "three weeks", trace reasons (2026-09-29)

- **The reading and "why this formula" could disagree: real, fixed (2.8.0).** The reading called the first two picked herbs "the spine"; the why text sorted by share and named the largest as the hero. Both now use one order (largest share first, ties in the engine's order). The roles model (primary / bridge / foundation / regulator / trace) will replace it; noted for the roles work.
- **"Give it three weeks" regardless of duration: real, fixed (2.8.0).** The closing line now follows the duration answer. The question asks how long the person has had the pattern, not how long they will take the bottle; the four lines speak of pace, never results, and go into D9 with the rest of the copy.
- **Trace explanation overgeneralised: real, fixed (2.8.0).** Every trace herb got the essential-oil reason, and the paragraph appeared even when the bottle had no trace herb. Each trace herb now carries its reason (aromatic / pungent / bitter / resin, `traces.js`); the sentence names that herb and appears only when one is in the bottle (and an Amanita's 10% rule when one is). The rule itself (5% or less) is unchanged. Robin's note on saffron (18% in one bottle) and extract-level potency is in `docs/HANDOFF.md` §0.17 (Phase 3).

## Eleventh finding, follow-up · "I don't want ..." made a hard exclusion (2026-09-29, engine 2.8.0)

Robin: "this needs to be waterproof." Two layers: (1) rules, always on, even without MYCO: named herbs (English, Latin, and German names for about 50 common herbs) and refused effects ("no caffeine", "nothing sedating", "no mushrooms", "nothing psychoactive", "koffeinfrei") leave the pool; needs written with a negation ("can't sleep", "no energy") refuse nothing. (2) MYCO lists every shortlist herb the note refuses (`noteAvoid`); those are excluded from its picks and from the deterministic bottle it falls back to, which is rebuilt without them. The reveal names what was left out and why. No text reader is perfect; what makes it hold is that both layers end in the same hard exclusion, the reveal shows it to the person, and Robin reviews every formula before bottling.

## Decisions (Robin, 2026-09-28)

| | Question | Decided | Status |
|---|---|---|---|
| **D0** | Deploy (push) the unpushed commits? | Robin's call | ✅ Pushed 2026-09-29 (`0a07052`). |
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
| H2 | Amanitas in customer bottles (third audit) | At most 10% of the bottle, never beside St John's Wort (Robin, 2026-09-29) | ✅ Engine 2.7 |
| H3 | St John's Wort (third audit) | Stays in customer bottles (Robin, 2026-09-29) | — |
