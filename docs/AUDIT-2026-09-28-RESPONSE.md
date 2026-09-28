# Response to the external formula-maker audit · 2026-09-28

The audit ("Formula maker — forensic / exhaustive audit", 64 sections, the
paste was cut off inside its P0 list at item 8) was checked claim by claim
against the code. This file records the verdict on each finding and what
was done, so the work can continue section by section.

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
   is a word search). The local engine: 0 on every count (Yohimbe 3, now 0 —
   see 3). **Fix: deploy.** Robin's call ("push").
2. **The GitHub repository is public**, and `/herbs-data.js` (1.6 MB, every
   field of all 245 herbs) is served to every visitor. The compose endpoint's
   "never send the herb data to the browser" (which the audit praised) does
   not protect anything while both are public. No secrets are exposed:
   the current tree and all 577 commits contain only the public anon key.
   **Decision D7.**
3. **Yohimbe is prohibited in food and food supplements in the EU**
   (Commission Regulation (EU) 2019/650, Annex III Part A of Regulation (EC)
   1925/2006) and was still reaching customer bottles locally. Now pro-only,
   as Ephedra. **Decision D11:** out of the pro composer too?

## Verdicts

✅ = true, fixed now · 🟢 = true on the live site, already fixed locally
(needs deploy) · ⚖️ = true, needs Robin's decision · 🔭 = agreed direction,
long-term · ❌ = false

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
| 15 | Notes are not a safety channel | ✅ Both pages now say medicines/pregnancy/conditions belong in the safety question (the pro page used to *invite* "a bad reaction" into the note). Auto-detecting safety words in notes: **D1**. |
| 52–54 | Invariants, fuzzing, test the engine against its own documentation | ✅ `tests/invariants-verify.cjs`: 600 random profiles (fixed seed) + the HTTP handler; every documented rule on every bottle. |

### Section 2 · The brief vs the code (drift)

| # | Finding | Verdict |
|---|---|---|
| 9–12 | Goals regex-derived; 5/n scoring; no ×0.5 | 🟢 Live only. Local: recorded goals, position weights, ×0.5. |
| 16 | Pro answers collected but ignored; not sent to MYCO | 🟢 Live only. Local 2.4 scores all six and passes them to MYCO. |
| 18 | Serotonergic / laxative caps missing | 🟢 Live only. Local: picker, MYCO validator, analysis. |
| 25 | CNS classifiers are word searches | 🟢 Live only. Local: `cns_action` recorded on 68 herbs; a test fails if an unclassified herb would be flagged. |
| 17 | Stale comments ("opt-in via URL param", "207-herb") | ✅ "opt-in" fixed; "207-herb" is not in the current code. |
| 29 | Validator corrects MYCO's percentage drift, not only vetoes | ✅ True — and the brief was wrong (said ±1; code corrects up to ±3). Brief fixed. |
| 28 | Same answers ≠ same final formula when MYCO composes | ✅ True. Brief now says so. Architecture: **D2**. |

### Section 3 · Building the bottle — needs decisions

| # | Finding | Verdict |
|---|---|---|
| 21 | No cap on an ordinary herb's share | ⚖️ True: up to **80%** (3-herb bottle); 15% of bottles have a herb > 40%. **D3** (proposed: 40% max). |
| 20 | More safety flags → more herbs | ⚖️ True (≥2 flags adds one). Proposed: remove. **D3**. |
| 19 | Second fill walk drops the category cap | ⚖️ True in code, **never triggered** in 24,000 profiles. Proposed: make it strict (costs nothing measurable). **D3**. |
| 30 | MYCO should not set percentages | ⚖️ Agreed. **D2** option C: MYCO chooses the herbs, the engine sets the percentages. |
| 44 | Evidence grade only breaks ties | ⚖️ True. **D4**. |
| 46–47 | "No match" vs "no safe match" | ✅ Small, will do with Section 3. |
| 22 | Separate selection from dosing | 🔭 Agreed; joins the Extraction data. |
| 23–24 | Pair cautions never veto; matching is by name | 🔭 True; needs severity data per pair. |
| 57 | Constrained optimisation instead of a greedy walk | ❌ for now: the greedy walk never needed to relax a rule in 24,000 profiles. Revisit if that changes. |

### Section 4 · AI and data flow

| # | Finding | Verdict |
|---|---|---|
| 27 | MYCO chooses the formula, not just explains it | ✅ True; the brief now says so. **D2**. |
| 31 | A second AI call sends the personal note again (reading paragraph) | ⚖️ True on both pages. **D5** (proposed: drop it, or fold it into the one server call). |
| 32 | The claims sanitiser is regex, not a guarantee | ✅ True; it is last-line hygiene. No change. |
| 39–40 | Health data, minimisation | ⚖️ Partly: explicit consent and Anthropic are disclosed on the privacy page. **Real gap:** unreserved quiz answers are kept **forever** — the "scheduled cleanup" the code mentions does not exist, and the privacy page says answers are kept "while we prepare and follow up". **D6** (how many days). |

### Section 5 · Abuse and robustness

| # | Finding | Verdict |
|---|---|---|
| 41 | Rate limit is per server instance; no-origin requests pass | ⚖️ True. Proposed: a global daily MYCO budget in the database — past it, the free deterministic engine only. **D8**. |
| 42 | No server-side idempotency | ⚖️ True; low impact (duplicate rows and MYCO calls). Later. |

### Section 6 · Copy, claims and the reveal

| # | Finding | Verdict |
|---|---|---|
| 35 | "10 questions · 90 seconds" / "Six questions" / "about 2 minutes" | ✅ Now "10 questions · about 2 minutes" and "Ten questions". |
| 33–34 | Claims wording ("slow-pace medicine", "Give it three weeks", why-copy "does the deeper work") | ⚖️ True as a risk. **D9**: a claims pass over every formula-maker string. |
| 38 | Show the herbs before reservation | ❌ Already the case — names are shown; only percentages wait for the reservation. The role grouping idea is good (Section 7). |
| 36–37, 58–61 | Reveal ritual (emoji placeholders, teach the stages) | ⚖️ Design. **D10**. |

### Section 7 · The data model — long-term direction

| # | Finding | Verdict |
|---|---|---|
| 13, 48–51, 55–56 | Move meaning out of prose into structured herb fields; formulation roles; layered scoring | 🔭 Agreed and under way: `goals`, `cns_action`, `safe_pregnancy`, `serotonergic`, `formula_access`, `digestion_fit`, `regional_affinity` are recorded. Still regex: body pattern, time, stress style, the ten safety flags, categories. |
| 26 | "Trace" is a formulation class | 🔭 True; the 5% is a house rule and is now labelled as one. |
| 45 | A confidence concept | 🔭 Later. |

## Decisions for Robin

| | Question | Recommendation |
|---|---|---|
| **D0** | Deploy (push) the unpushed commits? | **Yes, soon** — the live site composes Ephedra and non-pregnancy-safe bottles today. |
| D1 | Safety words in the note: warn only, or also apply the matching flag automatically (and say so)? | Apply and say so: failing closed costs a slightly narrower bottle. |
| D2 | MYCO: A explain only · B compose freely (today) · C choose herbs, engine sets percentages | C |
| D3 | Share cap per herb; drop the "+1 herb for 2+ flags"; strict second walk | 40% cap; yes; yes |
| D4 | Evidence grade: tie-break only (today) or a small score modifier? | Small modifier (0–2 points) |
| D5 | The second AI call for the reading paragraph | Drop it; the compose call already writes one |
| D6 | Keep unreserved quiz answers for how long? | 30 days, then delete automatically |
| D7 | Make the GitHub repo private? (Netlify deploys from private repos) | Yes |
| D8 | Global daily MYCO budget | Yes |
| D9 | Claims pass over the formula-maker copy | Yes — draft for Robin to approve |
| D10 | Reveal: real botanical art + the five stages | Robin's design call |
| D11 | Yohimbe: pro-only (now) or out entirely? | Out entirely (EU-prohibited in food) |
