# Handoff · 2026-09-25

**Read this file first. Do not re-explore the codebase to rebuild context.**

Supersedes the 2026-09-24 handoff, which is preserved as
`docs/HANDOFF-2026-09-24.md`. Everything from it that is **still open** has
been carried forward into §6 and §7 below — nothing was dropped. Its long
"done" narrative was not carried forward; it is history, and it is in the old
file if you need it.

---

## 0 · Where you are, in ten lines

| | |
|---|---|
| branch | **`facelift`** — 2 commits ahead of `main` |
| `main` | **10 commits unpushed** |
| last work | portal facelift Phase 1 (the fairy ring), `e7a8541` |
| next work | facelift Phase 2, **after** Robin looks at Phase 1 in a browser |
| blocked on Robin | four SQL files to run (§2), the ring's look (§3) |
| ⚠ do not run | `supabase-academy-access.sql` — it breaks two things (§2) |
| new docs | `docs/COMMUNITY-AUDIT.md`, `docs/FACELIFT.md` |
| dev server | `npm run dev` → **localhost:5173**, port now pinned |
| tests | 34 suites, all green |
| Netlify | nothing pushed, so nothing deployed. All of this is local. |

---

## 0.5 · Later on 2026-09-25 — the ring became the navigation (committed f5c1f07, merged, pushed)

Robin looked at Phase 1 and redirected it. Everything below is in the
`facelift`, merged into `main` and pushed the same evening. **All six SQL files have been run** (verified from outside with the anon key).

- **The fairy ring is the portal's only nav.** Tab row, QuickNav and
  HEALTH/FLOW/ACTIVITY are gone. Full ring on home; inside a section the
  same instance shrinks into the header (stage height transition →
  ResizeObserver → radius). Section is in the URL hash (`#calendar`).
- **Ring:** centre = Dashboard (home) · Network · Calendar · Apothecary
  (choice: Members shop / Official shop ↗) · Hyphae · Academy ↗ · Root
  (keepers). Fruiting merged into Calendar; Larder/Almanac/Alchemy retired.
- **Fixed:** Phase 1 turned the focused node to the BACK of the ring.
- **New files:** `portal/dashboard.jsx` (draft figures shown to keepers
  only), `portal/rsvps.jsx` (guest lists from `event_rsvps`, which
  exists), `portal/portal.css`, `dm/dm.jsx` (real E2E DMs, any member →
  any member; polls, no Realtime), `scripts/build-forage-baltic.cjs`.
- **Network:** globe dots are tappable in every browser; each node has
  a generic intro (`NODE_INTROS` in `spore/data.jsx`).
- **Site:** global-nav drawer (one X, Kiona, no Explorer/Extraction,
  Contact → `/#invitation`); landing page (hero buttons, manifesto
  lines, two of three Instagram posts removed; Baltic foraging preview
  drawn from Natural Earth replaces the Esri screenshot).
- `test:fairy-ring` rewritten for all this — 68 checks.
- **Keeper tools** (`admin/keeper.jsx`, on the Admin page): orders to
  ship + low stock (≤3) with a badge on Root and a strip on the
  Dashboard; announcements to everyone; Dashboard figures editor;
  rank picker per member. New SQL: **`supabase-dashboard-admin.sql`**
  (site_figures + announcements) — not run yet.
- **Ranks → tiers:** `supabase-rbac-tiers.sql` (still not run) now also
  guards `rep` (rank), guards INSERT as well as UPDATE (the first draft
  let an anon insert carry `access_role='admin'` into a claim), and sets
  `access_tier` from rank: Spore 5 · Palawan 6 · Mycelium 7 · Forager 8 ·
  Root Node 9. Ring gates are `minRank` in `portal/sections.jsx` — none
  set; Robin to decide what each rank opens.
- **Event manager** (Admin page): add / edit / cancel events, guest lists
  with copy. Events move to `public.events` — **`supabase-events.sql`**,
  seeded with the 10 hardcoded events under their existing ids (RSVPs
  stay attached). `portal/events.jsx` swaps them into `SporeData.EVENTS`.
- **Audit 2 → `docs/COMMUNITY-AUDIT-2.md`.** 🔴 members' emails were
  readable with the anon key (client fixed; run
  **`supabase-profiles-privacy.sql` FIRST**). Its §4 is the SQL queue in
  order. Fixed during it: gift-form crash, empty "Newest hyphae"
  (`joined` vs `created_at`), DM inbox Escape.
- **Later that evening:** emails hidden from signed-out visitors (code +
  the privacy SQL now revokes anon down to public columns); gift feature
  removed ($H economy parked); **ranks are now `profiles.rank`** —
  Palawan (default) · Patron (paid) · Facilitator · Alchemist · Founder
  (Robin; Steph = Facilitator), keeper-set only, admin stays a separate
  flag. Supersedes the rep-based ranks above. `test:fairy-ring` = 82.

---

## 0.21 · START HERE (next session) — state on 29 Sep, end of day

`main` is **16 commits ahead of GitHub (0a07052), not pushed** — everything since 29 Sep morning.
All 44 test suites green; typecheck = the known 47-error backlog.
Next session: read this §0.21, then `docs/AUDIT-2026-09-29-RESPONSE.md`
(the newest audit — nothing edited yet, Robin approves each item), then §0.20–0.17 only as needed.

### Robin's list
1. **1 October — push.** Nothing to run first (claims + budget SQL verified live).
   After the push: `supabase-formulas-server-writes.sql`, then step 4 of
   `supabase-fyf-retention.sql` (by hand, look at the count first).
2. **Netlify → Site configuration → Environment variables** — check these exist:
   `ANTHROPIC_API_KEY` · `RESEND_API_KEY` · `SUPABASE_SERVICE_ROLE_KEY` ·
   `SUPABASE_URL` (or `VITE_SUPABASE_URL`) · **`DIGEST_KEY` (new — any long random
   string; it unlocks the manual MYCO-digest link)**. Optional: `FYF_MYCO_DAILY_LIMIT`
   (default 100), `DIGEST_INBOX`, `FORMULA_FROM`. **Never** set `FYF_DB_COMPAT` there.
3. **After the push, on the live site:** §0.17 checks, plus: Formula Maker "✕ forget"
   and "Forget this reading"; a reveal → reserve → "Open the full analysis" (URL shows
   only `?ref=…`); portal Dashboard shows the kingdom split; confirmation email reads
   like the reveal.
4. **MYCO digest:** Netlify → Functions → `myco-monthly-digest` → "Run now" (or open
   `/.netlify/functions/myco-monthly-digest-background?key=<DIGEST_KEY>&dry=1` and read
   the function log). Then paste its **FOR CLAUDE CODE** block into a session.
5. **PubMed into the lab notes:** start with `docs/TOP-HERBS.md` (48 of the top 50
   records carry no reference list).
6. **Decide:** the audit items in `docs/AUDIT-2026-09-29-RESPONSE.md`; under-18 policy;
   San Pedro / Syrian rue / sassafras (declined for formulas — reasons in §0.20);
   why Vanilla is in 13% of bottles (looks like a scoring quirk — worth a look);
   make the GitHub repo private (D7).

---

## 0.20 · 2026-09-29 (night) — Amanita cards, kingdoms, MYCO digest, top herbs

- **Amanita Muscaria is eligible as liquid medicine** (Robin): the "educational
  only / ABSOLUTE BLOCK FOR ALL INTERNAL USE" text is gone; the card says liquid
  preparation at a small share (engine ≤10%, one Amanita, never with St John's
  Wort), batch assay (drying and heating shift ibotenic acid ↔ muscimol, PMID
  42796518, 27063872), Sweden scheduled, plus TOPICAL notes for **Moder Jord**
  (in `best_preparation` — NOT in `primary_functions`: the engine reads body
  pattern from function text, and "heat injury / inflammatory pain" there made
  it a different herb for the picker; caught by fixture 03). 18 references.
- **Amanita Pantherina → practitioners only** (`formula_access: 'pro'`), card
  reworded "practitioners only", every hazard kept.
- **Not done — Robin's call, see the reply of 29 Sep:** San Pedro, Syrian rue
  (Peganum) and sassafras are NOT in the catalogue; the six restricted entries
  (Calamus, Coca Leaf, Kratom, Psilocybe, Thunder God Vine, Comfrey) stay out of
  all formulas, pro included.
- **Kingdoms** — `kingdomOf` / `plantGroupOf` in pharmacology.js (from the record's
  family); the shelf list `herb-engine-ids.json` carries `k` (and `g`); the portal
  Dashboard's herb figure (all 247, restricted included) now reads
  "207 flowering plants · 6 conifers & ginkgo · 2 clubmoss & horsetail · 26 fungi ·
  1 lichen · 4 algae & seaweeds · 1 mineral".
- **MYCO monthly digest** — was one scheduled function (Netlify: 30 s limit) asking
  Opus to read a month of notes + PDFs: it would very likely have timed out. Now
  `myco-monthly-digest.mjs` (schedule 09:00 UTC on the 1st + manual trigger) starts
  `myco-monthly-digest-background.mjs` (15 min). MYCO now also gets the CURRENT
  RECORD of every herb the notes/PDFs name (found with herb-names.js), and the
  email ends with **── FOR CLAUDE CODE ──**: a block to paste into the terminal
  (file, herb + id, field, new text, quoted source; standing orders: check PMIDs,
  herbs-everywhere, show the diff, one commit, no push). It still never writes.
  Needs on Netlify: ANTHROPIC_API_KEY, RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY
  (for the PDFs), DIGEST_KEY (for the manual link). The copy already live on
  GitHub main is the old single function; the new one goes out with the push.
  **Manual run:** Netlify → Functions → myco-monthly-digest → "Run now", or open
  `/.netlify/functions/myco-monthly-digest-background?key=<DIGEST_KEY>` (add
  `&dry=1` to log instead of email). A scheduled function can't be opened by URL
  (Netlify docs), so the "?key=" link both digests documented never worked.
- **Traffic email** (`visitor-digest.mjs`) — live on GitHub main, 09:00 UTC on the
  1st and 15th, table exists; needs RESEND_API_KEY + a service key on Netlify.
  Manual run: "Run now" in Netlify (its ?key= link can't work, see above).
- **`npm run report:top-herbs`** → `docs/TOP-HERBS.md`: the 50 herbs the engine
  puts in bottles most over N random consumer profiles, with each record's
  reference count and a PubMed link (trials, meta-analyses, reviews). No MYCO, free.

---

## 0.19 · 2026-09-29 (later still) — the hardening checklist (committed, not pushed)

### The 1 October order — checked, nothing new to run first
**Compose now FAILS CLOSED when a database protection is missing** (checklist #6).
It needs `fyf_claim_request` and `myco_budget_take`: **both exist in production**
(checked 29 Sep from outside with the anon key: "permission denied", not "not found"),
so `supabase-fyf-claims.sql` IS run. `page_views` exists too (the traffic email's
table — `supabase-visits.sql` IS run; §7's "not run" is out of date). `supabase-formulas-server-writes.sql`
still goes AFTER the push (§0.17). Local development: `netlify dev` sets NETLIFY_DEV
and keeps the old lenient behaviour; `FYF_DB_COMPAT=1` forces it anywhere (don't
set it on Netlify).

### Done (checklist numbers)
- **#3 dead client code** — ~1,150 lines out of the two quiz pages: the client herb
  pool + restricted list + trace list, the client synergy checker, client naming, the
  client story/"why" copy, and the micronutrient engine. The last three were still
  LIVE in one place: the reservation sent browser-computed story text, herb notes
  and micronutrients, and the confirmation email printed them — so the email could
  say something the reveal did not. Now `reserve-formula` writes all three from the
  STORED formula (display.js + MYCO's stored reading through the sanitiser +
  `src/server/formula-engine/micronutrients.js`, ported verbatim); the page sends
  contact details + formula id only (no quiz answers, no herbs). Robin's email lost
  its "UNVERIFIED / client-computed" banner. `test:micronutrient-untrusted` rewritten.
- **#4 answers in the browser** — unfinished readings in sessionStorage (gone when
  the tab closes); old localStorage copies deleted on every load; "✕ forget" on the
  progress row and "✕ Forget this reading" on the result. The local formula-book
  copy keeps no note and no location. Trade-off: if Instagram's in-app browser is
  killed in the background, a half-done reading may be lost.
- **#5 no formula in URLs** — `/formula-analysis/?ref=<one-time key>`; the formula
  waits in localStorage and is deleted on arrival (`public/formula-analysis/handoff.js`,
  used by Find your formula, Mixology, the formula book and the analysis page).
  Not `?id=` as the audit suggested: Mixology formulas are never stored, and a new
  public read-by-id endpoint would be a new way in. Old `?h=&p=` links still open
  and the address is cleaned at once.
- **#6 fail closed** — above. reserve-formula's `reserved_at` stays best-effort on
  purpose (it runs after the emails have gone).
- **#8** `_ageConfirmed` → `_privacyConsentAcknowledged` (server still accepts the old
  name from pages loaded before the deploy; code `PRIVACY_CONSENT_NOT_ACKNOWLEDGED`).
- **#9 zoom** — already fixed on 27 Sep (and on GitHub main); the auditor read older code.
- **#10** `npm run test:adversarial` (34 checks: HTML, Unicode, duplicates, pattern
  mismatch, concurrency, missing SQL, oversized, prompt injection, "I do NOT want
  energy", SQL/`__proto__`, URLs, replay). Found and fixed: "I do NOT want energy"
  used to BOOST energy herbs (a refused wish counted only before "anything"/"something");
  Cyrillic lookalike letters ("vаlerian") hid a herb name.

### Robin to decide
- **#7 under-18 policy** — today an under-18 answer gets a restricted formula (no
  HIGH-caution, psychoactive or stronger calming herbs). Options: keep it (and say so
  in the UX), stop at the age question with a kind message (server refuses
  `under_18`), or require a parent/guardian. Encode whichever in page + server.
- **#1 load model, #2 roles** — "do later"; the plan is §0.16 ¶3–4 (Claude drafts
  0–3 loads and roles per herb from the records, Robin reviews).

---

## 0.18 · 2026-09-29 (last) — the note's naming system, restless sleepers (engine 2.9.0, safety 1.5.0)

Committed on `main`, **not pushed** (goes out with the 1 October push; §0.17 still holds).

**The naming system for the free-text note — `src/server/formula-engine/herb-names.js`.**
Before: 25 of 28 ordinary notes slipped through the refusal reader. Worst: every
iPhone curls the apostrophe, so "I don’t want valerian" / "I can’t take
ashwagandha" refused nothing; "no licorice" (record: *Licorice Root*), "no
dandelion", "no nettles", "no tumeric", "gingko", "camomile", "passion flower",
"St Johns wart", "hypericum", "Baldrian vertrage ich nicht", "leave the kava out"
all missed. Now: note and names folded the same way (case, umlauts, accents,
curly quotes, apostrophes, dots, invisible characters); spacing ignored; a herb
answers to its name, its parts, its name without the plant part, aliases,
binomial, **genus** ("artemisia" → Mugwort + Wormwood), the last word of its
name ("pepper" → every pepper; the longest name wins, so "black pepper" is only
Black Pepper Extract), German names (≈140 now) and `EXTRA_NAMES` (liquorice, SJW,
triphala, celery → Ajwan, berberine…); plurals; one slip in 6–7 letters, two in
8+ (first letter must match). The refusal reader in `note-safety.js` also learned
lists ("no valerian, kava, passionflower, hops or skullcap"), "won't take",
"don't put … in", "leave X out", "X is a no-go", "X upsets my stomach", German
word order ("Baldrian vertrage ich nicht", "lass den Baldrian weg"), and a
complaint names its subject, not a herb praised earlier in the sentence.
Fuzzy is safe here only because a match can only take a herb OUT (fails closed);
ordinary words one slip from a herb ("grounding", "chills", "potential",
"parasites", "medical", "barely") are guarded (`NEVER_FUZZY`, found by scanning
the 13,000 words of the herb records, quiz pages and docs).
`npm run test:herb-names` (new) — every herb by its own name and with a slip,
the table above, the must-not-refuse table. **Herbs-everywhere checklist:**
German names now live in `GERMAN_NAMES` in **herb-names.js** (moved from
note-safety.js), other names in `EXTRA_NAMES` beside it.

**Restless sleepers get no dream-deepening herb (Robin).** `dream_soften` was on
dream-DEEPENING herbs. Split: `dream_soften` stays on Rose Petals + Reishi only;
new `dream_vivid` on Blue Lotus, Bobinsana, Calea, Mugwort, African Dream Root,
Guayusa, Mucuna, Schisandra, Toothed Clubmoss (each record's own text says it
deepens / vivifies dreams — `test:herb-names` fails if a record says so and
lacks the tag) **plus Wild Dagga and Amanita Muscaria** (tagged, no sentence
says so — see below). They leave the pool — not a score — for the sleep answers
*vivid, restless dreams* · *very broken sleep* · *wakes in the night*, or a note
saying "nightmares", "bad dreams", "restless sleep", "Albträume". Deterministic
bottle, MYCO's shortlist and the fallback alike (tested with a stand-in MYCO that
pushes Mugwort in). The reveal mentions it only when the NOTE said it. "No dream
herbs" / "nothing that gives vivid dreams" is now a refusable effect. MYCO sees
"deepens dreams" / "calms dreaming" instead of "acts on dreams". Fixtures 06, 10,
12 (all *very broken sleep*) re-pinned: African Dream Root, Calea, Schisandra,
Amanita Muscaria left their bottles.

### Decided by Robin (29 Sep) and done
1. **Restless = all three answers** (vivid-restless, very broken, wakes in the night).
2. **Wild Dagga and the Amanitas are dream_vivid** (Muscaria and Pantherina — same
   isoxazoles). Cards upgraded from PubMed (every PMID and author line generated from
   PubMed's own record, 29 Sep):
   - **Wild Dagga:** the "leonurine" on its card was an internet myth — never found
     in *Leonotis leonurus* (review PMID 26292023; HPLC found none, PMID 23346757).
     Real chemistry: labdane diterpenes, marrubiin chief. Anticonvulsant in mice and
     (smoke diterpenoids) zebrafish; anti-inflammatory, hypoglycaemic in rodents.
     **Rat toxicity with chronic oral dosing** (blood, kidney, liver markers from
     200 mg/kg; deaths at 3200) — so "safe indefinite daily use / non-addictive / no
     tolerance" is gone; liver or kidney disease now AVOID. 9 references.
   - **Amanita Muscaria:** user survey 2023 (n=684: men take it for stress, low mood,
     insomnia; side effects nausea, vomiting, drowsiness), Reddit analysis 2025 (more
     positive than adverse, **no clinical studies exist**), a fatality case, cholinergic
     cases needing atropine, content variability, gummies sold as Amanita holding **no
     muscimol but psilocin**, two syndromes vs Pantherina. 14 references.
   - **Amanita Pantherina:** more coma than Muscaria (5/17 vs 2/32), EEG-confirmed
     epileptiform activity, prolonged convulsions. 4 references.
   - No study anywhere measures dreams for any of the three — the tag is Robin's call.
3. **Schisandra — TCM is right.** No PubMed support for "dream vividness"; its lignans
   are sedative-hypnotic in rodents (schizandrin, schisandrin B; NREM regulation in an
   insomnia model), TCM uses it for dream-disturbed sleep → `onset, maintenance,
   dream_soften`, back in restless sleepers' bottles. **Its drug interaction was
   written backwards**: the card said the lignans *induce* CYP450 so drug levels
   fall; in people they **inhibit CYP3A** — midazolam exposure +119% in volunteers
   (PMID 19552749), tacrolimus levels raised (meta-analysis PMID 38150711). Fixed.
   Its `cns_action` stays `activating` (mixed profile) — changing it would move many
   bottles; Robin's call if wanted.
4. Parked branch `engine-recorded-fits`: see below.

### ⚠ Robin to decide — the Amanita cards contradict the engine
Both Amanita cards say **"EDUCATIONAL AND TAXONOMIC ENTRY ONLY — ABSOLUTE BLOCK FOR
ALL INTERNAL USE"** (Pantherina: "ALL populations … without exception"), yet the
engine seats them for gated opt-in bottles (≤10%, one per bottle, never with St
John's Wort). Before this session Panther Cap sat at 8% in fixture 06 (a cardio-meds
profile). Either the cards are rewritten for the product Robin sells, or Pantherina
(at least) leaves customer bottles — pro-only like Ephedra, or restricted. The cards'
safety wording was NOT softened.

### Coming up (external audit, noted 29 Sep — not started)
- **D7, not closed:** Formula Maker no longer loads `/herbs-data.js`, but the file
  is still public for /mixology and /extraction, and the GitHub repo is public.
  System-wide task: serve those two pages what they need from the server (or a
  trimmed file), and make the repo private (Robin).
- **D10, wording:** the five-stage wait animates while the formula is already
  computed. Fine as metaphor; the stage labels must not claim "this is the order
  the engine found your herbs" (the truthful labels in §0.16 ¶2 already avoid it
  — keep it that way when the botanical art goes in).
- **D8, fail visibly:** budget exhausted → deterministic fallback (fine);
  budget table unreachable → today also fallback + console log only. Make it an
  ops alert (a row the Admin page shows, or an email), and in production
  consider MYCO off until someone clears it.
- **Observability:** the formula already carries engineVersion, herbDbVersion,
  safetyRulesVersion, capturedAt, mycoUsed, mycoFallbackReason,
  mycoNarrativeAction. Add `formulaRulesVersion` (rules.js + pair-rules.js),
  `displayVersion` (display.js copy) and, once D9 is formal,
  `claimsPolicyVersion`.

---

## 0.17 · START HERE — push on 1 October, then the SQL

**State on 2026-09-29 (late night):** engine **2.7.2**, safety rules 1.4.1.
GitHub `main` = `0a07052` (pushed 29 Sep). Everything after it is committed
on `main`, **not pushed** — Robin will say "push" on **1 October**:
502 fix for `/api/formula-analysis` (MYCO + analysis on /mixology, the pro
client-file save), favicon.ico, lab-notebook PDF grid, live herb count on
the Dashboard, and the fourth external audit's fixes (XSS through
`patternSub`, one MYCO call per request, Formula Book written by the
server, consent names the AI, pair-caution matcher, intentions and note
scorer). Verdicts: `docs/AUDIT-2026-09-28-RESPONSE.md`, findings four to nine and on.

### After the push on 1 October — Robin runs, in this order

1. **`supabase-formulas-server-writes.sql`** — only AFTER the push is live.
   Closes the anon insert into `formulas`; `reserve-formula` now writes the
   Formula Book entry itself. Run before the push and live reservations
   stop adding Formula Book cards until the deploy.
   Its step 3 (clearing `quiz_snapshot` copies) is optional and cannot be
   undone — look at the count first.
2. **`supabase-fyf-claims.sql`** — if not already run (Robin was running it
   on 29 Sep). Check: `SELECT to_regproc('public.fyf_claim_request');` —
   not NULL = done. Order does not matter for this one.
3. **Step 4 of `supabase-fyf-retention.sql`** — protect old reserved
   formulas by id, then delete the rest older than 30 days (by hand, once).

### Then check on the live site

- `/mixology` → a formula → MYCO analysis answers (was 502).
- `/find-your-formula-pro/` → Client file → Save → "Saved." and it lists.
- One test reservation → a Formula Book card with no notes, and no second
  card if the same formula is reserved again.
- `https://www.fungai.art/favicon.ico` → 200 (was 404).

### Engine 2.8.0 (29 Sep, late) — also in the 1 October push

- **Pair rules** (`pair-rules.js`, decided in `docs/PAIR-CAUTIONS-REVIEW.md`):
  8 BLOCK (Kava + Valerian, Wormwood + Sage, Pau d'Arco + Garlic / Ginkgo /
  Turmeric / Ginger, Valerian + St John's Wort, Astragalus + Echinacea),
  15 CONDITIONAL. MYCO is shown the cautions among its shortlist.
- **"I don't want …" is a hard exclusion, two layers.** (1) Rules, always
  on: named herbs (English, Latin, and German names for ~50 common herbs:
  "ohne Baldrian") and refused effects ("no caffeine", "nothing
  sedating", "no mushrooms", "nothing psychoactive", "koffeinfrei") leave
  the pool; needs written with a negation ("can't sleep", "no energy")
  refuse nothing. (2) MYCO lists every shortlist herb the note refuses
  (`noteAvoid`); those are excluded from its picks AND from the fallback
  bottle. The reveal names what was left out. 47 checks in
  `tests/note-refusals-and-pairs-verify.cjs` (`npm run test:note-refusals`).
  Found on the way: the excluded-herb list compared a number to text;
  now compared as strings.
- Reading and "why this formula" name herbs in one order (largest share
  first). "Give it three weeks" is gone: the closing line follows the
  duration answer (weeks / months / a year or more / lifelong). The trace
  sentence names that herb and its own reason (aromatic / pungent / bitter
  / resin), and appears only when the bottle has one.

### D9 (claims pass): include these

- The four duration closing lines in `display.js` `DURATION_CLOSE` are new
  customer copy (pace, never results); review them with the rest of D9.
- The duration question asks how long the person has *had* this pattern,
  not how long they will take the bottle. A usage-duration answer (and
  what the reading may say about it) is a D9 / reveal-design question.

### Saffron, and why the engine cannot judge potency yet: Phase 3

Robin, 2026-09-29: saffron is very potent in flavour and effect, and one
formula came out at **18% saffron**. The engine cannot judge that well: it
knows no extract ratio, no content of the active compounds (safranal,
crocin, essential oils), and not how a given extract was made. A share of
the bottle is not a dose of the plant.

**Phase 3:** send Fungai Art's own (and others') single-herb extracts to a
lab for analysis and proper documentation (extract ratio, marker
compounds, solvent) and let the engine dose from measured extracts, not
from the plant's name. Until then, a potent herb can be held small by
listing it as a trace or small-share herb (open question for Robin:
should saffron be capped now?).

### Waiting on Robin

- **Saffron cap: done** (Robin, 29 Sep: 7%). `herbs.ts` `max_share_pct: 7`, engine 2.8.1; the analysis tool flags a saffron share above 7% and any ruled-out pair.
- **Audit 26 to 28: first steps done (engine 2.8.2).** Every stored formula carries its score breakdown and runners-up (server-side only). `laxative` (9) and `trace_class` (21) are recorded in `herbs.ts` and the engine reads them; `npm run test:herb-classes` fails if a herb's text and its record disagree — **add it to the herbs-everywhere checklist**. `npm run report:ontology` writes `docs/ONTOLOGY.md` (coverage per section, 11 items missing).
- **Every answer counts — MYCO (done, on main):** MYCO never received two consumer answers (how the energy usually feels = `nervous`; how it moves through the day = `energy_curve`) and could not see the herb notes. Now it gets all 11 quiz answers in plain words, each shortlisted herb's recorded fit (nervous system, energy, sleep, onset), and a rule to weigh every answer. `npm run test:myco-every-answer` reads the questions from the quiz page and fails if any answer does not reach MYCO.
- **Every answer counts — the engine (tested, parked on local branch `engine-recorded-fits`, NOT on main):** the recorded `nervous_system_fit` / `energy_pattern` / `sleep_action` used beside the prose reading (stronger wins). Test on 960 profiles (every intention × body type, one answer varied at a time): the deterministic engine ALREADY tells answers apart (per profile, 6 nervous options give ~5 different bottles, 8 energy options ~6.5, 6 sleep options ~5.4). Version 1 (record replaces prose) changed 61% of bottles and made the energy answers LESS distinct (145 herbs are "sustained"). Version 2 (parked) changes 19%, distinctness unchanged; moves mixed (tired → Ginkgo / Rosemary / Cinnamon in, good; Mugwort in for "reactive" and "flat", doubtful). **Before merging, the records need a review:** (1) `dream_soften` is recorded on dream-DEEPENING herbs (Mugwort, Calea, African Dream Root, Blue Lotus, Wild Dagga) — what does it mean? Read literally it put them into bottles for restless dreamers, so it is not used; (2) Mugwort's `nervous_system_fit` (flat, reactive). Merge = `git merge engine-recorded-fits` + re-pin fixtures. Robin's call.
- **Roles** (primary / bridge / foundation / regulator / trace) and minimum share: the next ontology step; needs Robin's data.
- Privacy page: the pro composer and practitioners' client files are not
  described. Who is the controller of a client's data (Robin or the
  practitioner) is a legal question.
- Still from §0.16: D9 claims table, D10 reveal order, make the repo
  private (D7).

---

## 0.16 · plan for 2026-09-29 (superseded by 0.17)

**State on 2026-09-29 (night):** both SQL files are RUN. Engine **2.7.0**,
safety rules **1.4.1**, all 39 suites green, `npm run build` passes.
**Not pushed** — Robin said "not yet"; GitHub `main` is still the 25 Sep
engine 2.1, so any outside audit reads old code until he says "push".
After the deploy: step 4 of `supabase-fyf-retention.sql` (protect old
reserved formulas by id, then delete the rest older than 30 days).

Decided 2026-09-29 (third audit, Claude, read main@b3beace — verdicts in
`docs/AUDIT-2026-09-28-RESPONSE.md`): Amanita ≤ 10% of the bottle and
never beside St John's Wort (done, 2.7); St John's Wort stays in customer
bottles. Fixed the same night: autoimmune "MS" false flags (26 herbs), note
keywords matching inside words. Still open from it: L1 (a synergy note
naming a herb not in the bottle), an "any other prescription medicine"
answer, ethanol for under-18s (product decision), HIGH-caution count cap.

Robin still to do: make the GitHub repo private (D7); say "push" (D0).

### 0 · From the 2026-09-29 site round (look at these too)
- **"API key required" on /foraging** (Robin saw it). Not a string in our
  code, so it comes from a map server. Most likely: `VITE_ARCGIS_API_KEY`
  is set in Netlify, so both map modes use Esri's Basemap Styles service,
  and the key is missing the Basemaps privilege or has expired. Check the
  Netlify env var and the key in the ArcGIS developer dashboard; with no
  key the map falls back to CARTO/Esri tiles that need none.
  (Separately fixed that night: the Dark map was broken on the live site
  because `netlify.toml`'s CSP blocked `tiles*.basemaps.cartocdn.com`,
  where the dark style's tiles, fonts and icons live.)
- ✅ **Birch Buds (595) and California Poppy (596) added everywhere**
  (2026-09-29): herbs.ts with PubMed-checked references, /extraction bench
  table (70% / 45%), extraction.ts protocols, /mixology, MYCO vocabulary,
  and every generated file (Atlas, shelf, Engine 2, safety rules, MYCO
  KB, counts → 247). California Poppy is recorded `sedative` (off for
  minors and anyone on sedatives) with a strong CYP-inhibition warning.
  Neither has a photograph yet. Holy Basil gained the alias "Tulsi", so
  tulsi.jpg now shows. **pomegranate.jpg still matches nothing** — there
  are two records (Seeds, Skin); rename the file to pomegranate-seeds.jpg
  or pomegranate-skin.jpg to say which it shows.

### 1 · D9 — claims-safe wording (first task)
Go through every customer-facing string of the formula maker and draft a
table for Robin: **current wording → proposed wording → why**. Nothing
live changes until he approves it. Frame: EU health-claims rules
(Regulation (EC) 1924/2006) — no treating, curing, preventing or healing
a condition, no promised effect or timescale; "traditionally used for"
and "supports" style instead.
- Known starting points: "Slow-pace medicine. Give it three weeks." in
  `src/server/formula-engine/display.js:134`,
  `public/find-your-formula/index.html:3253` and
  `public/find-your-formula-pro/index.html:2513`; "slow-pace medicine" in
  `public/find-your-formula/index.html:1216`; the why-copy "does the
  deeper work" (display.js).
- Also cover: every story/why/short-note template in `display.js`, the
  question and result copy on both pages, the reservation emails
  (`reserve-formula.mjs`), and the MYCO compose prompt's tone rules.
- Deliver the table as a page Robin can read and tick; apply only the
  approved rows, in one commit.

### 2 · D10 — the reveal (needs Robin's design direction)
Parked until D9 is approved. Order, cheapest first:
1. The five stage labels during the ~15 s wait, worded truthfully:
   *reading your pattern · filtering for your safety · checking how the
   herbs pair · balancing the formula · composing your formula* (pairings
   are shown, they don't choose herbs — so not "finding relationships").
2. Real botanical art instead of the emoji placeholders.
3. The constellation view — needs formulation roles (§4 below) first.

### 3 · Load model — NOT done yet
Today the caps are counts ("≤ 2 sedatives"), now all in one place
(`rules.js`). A real load model gives each herb a graded load per
dimension and caps the bottle's total per dimension, plus a caution
budget. What the data allows:
- recorded, usable now: sedative (7 herbs), stimulating (18),
  serotonergic (4), laxative (9), caution level (55 HIGH/VERY HIGH);
- read from prose, **not usable as loads**: bleeding/blood thinners
  (the `cardio_meds` flag is on 123 of 239 herbs — far too broad),
  blood pressure (53), liver/kidney (32).
Plan: record a 0–3 load per herb for bleeding, blood pressure, liver,
sedative, stimulant, serotonergic, laxative and volatile oil (Claude
drafts from each herb's contraindications and interactions, Robin
reviews), then `rules.js` sums them with a ceiling per dimension.
**Robin decides the ceilings** and whether HIGH-caution herbs get a
per-bottle budget.

### 4 · Bridge herbs and roles — partly there
Already: goal points add up, so a herb serving goals #2 and #3 (up to 9)
outranks the weakest goal-#1 match (6.48), and a herb serving #1 and #2
gets up to 18 — bridges are favoured without a special rule.
Missing: explicit roles (primary · bridge · foundation · regulator ·
trace) assigned by the ENGINE from recorded data, so the deterministic
bottle and MYCO's carry the same roles; then bottle rules such as "at
least one primary" and a capped bridge bonus. Needs a role per herb —
same draft-then-review data work as §3. Roles also unlock D10 step 3.

## 0.15 · 2026-09-28, D6 + D8 + the second audit round (committed, not pushed)

**Robin runs two SQL files BEFORE the next deploy**, in this order:
`supabase-fyf-retention.sql` (D6: 30-day purge of unreserved formulas,
nightly pg_cron job; its step 4 is a one-time manual clean-up of rows from
before the deploy — do it AFTER deploying), then `supabase-myco-budget.sql`
(D8: daily MYCO budget + request_key). Optional Netlify env var
`FYF_MYCO_DAILY_LIMIT` (default 100). If the code deploys first nothing
breaks: MYCO is skipped and rows are stored without the new columns.

- Engine **2.6.0**, safety rules **1.4.0**. "Mushroom" comes from the
  recorded family (Dandelion/Ginkgo/Milk Thistle/Schisandra were counted
  as mushrooms). One rules module (`rules.js`) for picker + MYCO validator;
  at most one Amanita. A herb the note says to avoid is excluded. The note
  goes to MYCO fenced as untrusted; links are stripped from MYCO's text.
- Pro editor: restricted plants cannot be saved or printed.
- `public/herb-engine-pool.json` + its build scripts removed (nothing read it).
- Second-round verdicts: `docs/AUDIT-2026-09-28-RESPONSE.md`, "Second round".
- Open, needs Robin: D9 claims table; consumer safety questions (bad
  reaction, stimulant sensitivity, breastfeeding apart from pregnancy);
  HIGH-caution count cap; the safety-persona test; D0 deploy.

## 0.14 · 2026-09-28, audit decisions D1–D5, D11 (committed, not pushed)

Robin answered D0–D11; the verdicts and decisions are in
**`docs/AUDIT-2026-09-28-RESPONSE.md`** (now including the audit's cut-off
tail: P0 #9–12, §65–69, the Formula Object). Engine **2.5.0**, safety rules
**1.3.0**; the brief is updated to match.

- **D1** `note-safety.js`: a medicine, pregnancy or condition named in the
  note applies its safety flag (fail-closed; English + German); the reveal
  says which word triggered which filter (`noteSafety` on the wire).
- **D2** MYCO picks herbs + writes the reading; `percentages.js` sets every
  share (a MYCO `pct` is ignored). **D3** no herb above 40%; flags no longer
  add a herb; one strict walk; < 3 main herbs → 422 `NO_SAFE_MATCH` /
  `NO_MATCH`. **D4** evidence grade 0 to +2 points. **D5** the pages' second
  AI call (`mycoStory` → /api/myco-agent) is gone.
- Tests: 38 suites green; 19 fixtures re-pinned (why: in the pins file);
  `invariants-verify.cjs` also runs the MYCO path with a stand-in (no
  network, no cost).
- **Next, already decided:** D6 (30-day cleanup of unreserved
  `fyf_formulas` + privacy page), D8 (daily MYCO budget + idempotency on
  `requestId` — both need SQL), D9 (claims-safe copy table for Robin's
  approval before anything goes live). D7: `/mixology` and `/extraction`
  still load `/herbs-data.js`.

## 0.13 · 2026-09-28, external audit (committed, not pushed)

Robin ran both SQL files (`supabase-practitioner-formulas.sql`,
`supabase-dm-realtime.sql`). An external "forensic" audit of the formula
maker arrived; **read `docs/AUDIT-2026-09-28-RESPONSE.md`** — verdict per
finding, sections, and decisions D0–D11 for Robin.

- The auditor read GitHub `main` = the LIVE deploy (b3beace, 25 Sep), so
  most "brief vs code" findings are true of the live site and fixed
  locally. Running the live engine: Ephedra in 57/2,400 customer bottles,
  Senna/Rhubarb/Buckthorn in 161, and 1,191/1,200 pregnancy bottles hold a
  herb not recorded pregnancy-safe. Local engine: 0. **D0 = deploy.**
- The GitHub repo is PUBLIC (and /herbs-data.js serves every herb field).
  No secrets in the tree or in all 577 commits (only the anon key). D7.
- Section 1 (safety) done: unknown safety values refused
  (`SAFETY_FLAG_UNKNOWN`), pages no longer default `avoid` to "none",
  tie-break seed sorts the flags (order changed 31% of multi-flag
  bottles), note boost capped at +6, notes hint on both pages, Yohimbe
  pro-only (EU-prohibited in food, Reg. 2019/650), `tests/invariants-
  verify.cjs` (600 random profiles + HTTP; proves the under-18 gate).
- The audit paste was cut off in its P0 list at item 8 — the rest arrived
  and is answered in the response doc (§0.14).

## 0.12 · 2026-09-28, later (committed, not pushed)

**For Robin to run:** `supabase-practitioner-formulas.sql` (client files in
the pro composer) and, from §0.11, `supabase-dm-realtime.sql`.
**For Robin to check:** the 245 recorded herb goals (`goals:` in herbs.ts,
drafted by Claude). Restart `npm run dev` — vite.config.ts changed.

- **Engine 2.4 / safety 1.2** — read `docs/FORMULA-ENGINE-BRIEF.md` (the
  audit brief Robin will run through several LLMs). Goals are recorded per
  herb and scored by position (main use 12 → 4th use 6.48 for goal #1;
  strict #1 > #2 > #3); the six ignored pro answers now score; cycle
  trying_conceive / stimulants_sensitive / bad_reaction are exclusions;
  laxatives only for reported constipation, max 1; MYCO gets the pro
  answers + LAX/STRONG tags. 19 fixture pins re-captured.
- **Pro composer is gated**: `src/server/practitioner.mjs` (rank
  facilitator/alchemist/founder or admin), `/api/pro-access`, fyf-compose
  403s `_pro` without it and returns a `pro` block (score parts +
  alternatives) to practitioners. Tools in
  `public/find-your-formula-pro/practitioner.js`: why each herb, adjust
  (live /api/formula-analysis checks + ask MYCO), dose sheet (ml, arm,
  ethanol where recorded), client file + print/PDF.
- **Local dev**: /api/fyf/compose and /api/pro-access now run on :5173
  (they never did — neither quiz could compose locally). Pro page is open
  locally via FYF_DEV_PRACTITIONER, set only by the Vite process.
- **Logo**: fungi.png cut out (the black box), 140 KB; new favicon.png /
  favicon-48.png / apple-touch-icon.png from it on every page; favicon.svg
  removed. Home Instagram card uses inner-architecture.jpg (from
  src/assets). Foraging map loads tiles only after the acknowledgement.
- Open: house formula dose (none exists anywhere — dose sheet leaves it to
  the practitioner); body pattern / time / stress still regex-inferred;
  one-trace cap squeezes digestive formulas; Skogens Nektar product list.

## 0.11 · 2026-09-28 (committed, not pushed)

**SQL for Robin:** `supabase-dm-realtime.sql` (DMs arrive live; without it the
inbox just keeps polling). **After the next push:** set real saffron counts per
size in Admin → Product inventory (the live admin still shows the old row).

**Done:**
- **Cookie banner gone** (file + 30 script tags). Home "Spore Stories" is one
  static card linking to the "Inner Architecture" post — drop the post photo at
  `public/home/spore/inner-architecture.webp` (it never existed). Instagram out
  of the CSP. Privacy page: no banner because nothing needs consent; ban check
  reads IP, not stored; page-view counting section was already accurate.
- **Engine 2.3** (`version.js`): the goal leads — intention now outweighs
  body/stress/time, a herb serving no chosen goal keeps half its score.
  Measured over 48 profiles: overlap between goals 56% → 6%, herbs serving the
  goal 44% → 99%, same goal across bodies still varies (16% overlap).
  Laxatives only when digestion/detox is a goal (`pharmacology.js fitsGoal`).
  **Max 1 serotonergic herb** (`serotonergic: true` on St John's Wort, Kanna,
  Saffron, Rhodiola) in picker, MYCO validator + prompt, formula analysis.
  Fadogia, Lobelia, Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth,
  Karanja → `formula_access: 'pro'`. 19 fixture pins re-captured.
- **New herbs 592–594:** Green Tea (stimulant, everywhere incl. Mixology),
  Hibiscus (everywhere incl. Mixology), Comfrey (encyclopedia + Atlas only;
  on every RESTRICTED list — never bottled). Catalogue 245. Every PMID checked
  on PubMed (5 of 9 remembered ones were wrong — always check).
- **Atlas photos:** wild-rosemary.jpg is garden rosemary (checked by eye) and
  wild-thyme.jpg is thyme → renamed rosemary.jpg / thyme.jpg, compressed.
  All 22 photos match; none unmatched.
- **Atlas cards more vivid:** photos brighter/saturated, lighter scrim; no-photo
  cards glow in their tradition's hue (`sigilHue`). Robin to judge on localhost.
- **/health** noindex + out of the sitemap; linked from the Academy nav
  ("Build your practice ↗", new tab).
- **Saffron** shop badge per size (sold-out size disabled; all out = card out).
- Portrait 328 → 199 KB. DMs: Realtime with polling fallback (`dm.jsx`).
- 37/37 suites green; typecheck still the known 47.

**Open:**
- **Skogens Nektar** — second sub-brand like Moder Jord (pine cones, chaga
  syrup, pickled spruce, juniper…). Needs Robin's product list; note Chaga
  Syrup is already a live shop product.
- Two Amanitas can share a mood bottle on rare profiles (both 'sedative',
  cap 2) — flagged, not changed.
- Bot check (Turnstile): Robin said not now. Signed DMs: not worth it yet.
- C4 imprint: parked until March (address + OÜ then). No Germany claims.
- M1 sitemap waits for the Atlas homepage.

## 0.10 · 2026-09-27, last session of the day (committed, not pushed)

**SQL:** Robin ran `supabase-lab-notes-signed-in.sql` and `supabase-medium-fixes.sql`
(2026-09-27). He still needs to set real saffron counts per size in Admin →
Product inventory (each size started with the old shared count).

**Also done at the very end:** M7 (pool parser normalises `\r\n`) and H3b
(`myco-agent` compose mode deleted, now answers 410). H3 left: (a) Robin sets a
monthly spend cap in the Anthropic console, (c) Turnstile before the quiz.

**NEXT — cookie banner (Robin's decision, do first):** remove the cookie
banner entirely. Nothing on the site needs consent except the home page's
Instagram embed, and Robin would rather drop the live embed than make every
visitor click (cookie-free browsers never showed it anyway). Plan: delete
`public/cookie-banner.js` and its script tags; replace the Instagram embed
block on `/home` with the static preview photos already there
(`.spore-fallback`, `data-photo=/home/spore/…`) linking to Instagram; remove
www.instagram.com / platform.instagram.com from the CSP; update the privacy
page (no banner, no consent needed: only functional storage — basket, sign-in,
saved formulas). Terms/privacy pages need no approval.

**M1 (sitemap) — wait:** the Atlas becomes the homepage in about a week, once
Robin finishes its visual upgrade. Do M1 then, in one go: sitemap lists `/`
(the Atlas), drops /herbal-engine-2/ and /find-your-formula-pro/ (they stay
live, just not advertised to Google), and settle /extraction/ public vs noindex.

**Done this session (audit 🟡 list, Robin's answers):** M2 Sleepy Sleepy preview €38 ·
M3 saffron stock per size (admin panel + seed + SQL) · M4 SQL above · M5 cookie
banner: NOT added everywhere — nothing on the site needs consent except the
home page's Instagram embed, which now loads only after "accept" · M6 forage
test dates relative → **36/36 suites green** · M9 old React app merges saved
formulas instead of wiping Mixology's · M10 dead portal modules deleted
(app, tracker-app, tracker-data, network-map, styles, styles-tracker, specimen-fan.png)
· M12 the 9 atlas photos committed (garlic, moringa compressed) — **from now on
commit new atlas photos whenever Robin adds them** · M13 ip-block stays (it is the
ban system) · M14 parked by Robin. Typecheck: still the known 47-error backlog.

**Open — waiting on Robin (explained in chat, not yet decided):**
- **M1** sitemap/robots: proposal = drop /herbal-engine-2/ and
  /find-your-formula-pro/ from the sitemap, add /atlas/, list only `/`
  (not /home/), and decide whether /extraction/ is public (it is both "public"
  and noindex today).
- **M7** (Windows line endings in the herb-pool parser — harmless on Netlify,
  one-line normalise) · **M11** "Coming soon" ×3 on Moder Jord, ×1 on the shop:
  keep, date, or remove.
- **M8** Robin wants MORE part-specific herb cards ("more the merrier"): keep
  Elderberry 216 + Elderberry cooked 543 + Elderflower 232, Pomegranate Skin 407
  + Seeds/arils 408, Grape Seed 420 + Leaf 552 + Skin/resveratrol 556. New cards
  to write: pomegranate fruit/juice, grape fruit — full records, follow the
  herbs-everywhere checklist.
- **Missing herbs the atlas already has photos for:** wild thyme
  (Thymus serpyllum), wild rosemary (Rhododendron tomentosum — NOT rosemary),
  green tea, hibiscus, comfrey. Unmatched on purpose; add the records and the
  photos appear.
- **C4 imprint / address:** where Robin runs the business decides it (Berlin →
  §5 DDG: name, serviceable postal address — PO box not enough, a
  business-address service is — and email). EU shops must show a geographic
  address before purchase either way. Build `/imprint` + footer link once
  Robin gives the address.
- **H3 Opus cost exposure:** quiz, formula-analysis reading and the dead
  `myco-agent` compose mode call Opus for anonymous visitors; per-instance
  rate limits only. Do: (a) Robin sets a monthly spend cap in the Anthropic
  console; (b) delete the dead compose mode; (c) Cloudflare Turnstile before
  the quiz's Opus call. (b)+(c) await a yes.
- **St John's Wort + Kanna** (both serotonin-reuptake inhibitors) can share a
  bottle — the engine shows herb-pair cautions but never enforces them. Proposed:
  a "max 1 serotonergic" rule like the sedative/stimulant caps.
- **Quiz scoring:** the intention answer is worth ≤5 points against pattern +
  stress + time; with other answers equal, formulas look alike across
  intentions and laxatives (Rhubarb Root; Senna once) turn up. Look together.
- **8 records say "practitioner only" but reach customers:** Fadogia, Lobelia,
  Pau d'Arco, Wormwood, Rhubarb Root, Bakuchi, Nishoth, Karanja — one word from
  Robin puts them on `formula_access: 'pro'` like Ephedra. The pro page is
  public: `_pro` separates the quizzes, it is not a lock (offer: sign-in gate).
- **/health suggestions:** (1) frame as a learning path, not a clinical-practice
  plan (Heilpraktiker law); (2) members-only "Practitioner path" in the
  Academy linked to the PDF library, lab notes, formula analysis, MYCO, with
  saved progress; (3) show real evidence grades from the herb data; (4) replace
  generic advice with the Fungai method (1:3, doses, pregnancy/under-18 rules);
  (5) it is in the sitemap but unlinked — link from the Academy or noindex.
- Robin will shrink `home/team/robin-portrait.jpg` himself (already 328 KB).

## 0.9 · 2026-09-27, late — Robin's answers to the audit, worked through (committed, not pushed)

The status table at the top of `docs/SITE-AUDIT-2026-09-27.md` is the
summary. In short:

- **Stimulant / sedative is data now.** `herbs.ts` has `cns_action`
  (stimulant · activating · neutral · calming · sedative · psychoactive) and
  `cns_evidence` (mechanism + PMIDs, every one fetched and read) on 65
  herbs; `pharmacology.js` reads them, the word search is only a fallback,
  and `test:cns-classification` fails if any herb the fallback would flag is
  unclassified. **A new herb that sounds sedating or stimulating must be
  classified before the build passes.** Engine 2.2: nothing stimulating in
  evening/sleep formulas, no sedative beside a true stimulant; Ephedra
  `formula_access: 'pro'` (pro page sends `_pro: true`). HIGH-caution herbs
  stay in adult formulas (Robin). Fixture pins moved to
  `tests/fixtures/methodology-pins.cjs`, shared by compare + shadow.
- **Pregnancy:** only `safe_pregnancy: true` reaches a pregnant customer.
- **Under-18s:** no HIGH/VERY HIGH, no psychoactive, calming only at LOW,
  no meadowsweet / willow bark (EMA).
- **Lab notes + snippets:** signed-in members only — page side done;
  **`supabase-lab-notes-signed-in.sql` must be run** (then read its §5).
- **Fonts self-hosted** (`public/fonts/fonts.css`, `/fonts/g/*.woff2`,
  `/fonts/stripe.css`); CSP has no font hosts. **supabase-js** pinned at
  `/vendor/supabase-js-2.105.1.js` (upgrade steps in `supabase-client.js`).
- **Photos:** 41 unused deleted, 12 recompressed; dist 160 → 60 MB.
- **Herb counts:** `build:herb-counts` rewrites every stated count.
- **Zoom** unlocked on 4 pages. **/health:** Sci-Hub advice and the
  non-existent "HerbMeister" removed.
- Open: C4 imprint (Robin's call), the 🟡 list (Robin: "medium I do next"),
  pro page is public so `_pro` separates the quizzes but is not access
  control, `test:forage-proxies` still fails (unchanged since before today).

## 0.8 · Whole-site audit — read `docs/SITE-AUDIT-2026-09-27.md` first

Seven 🔴 items, the top three waiting on one "yes" each: HIGH-caution herbs
(and Ephedra) are eligible for customer bottles (C1, ties to He Shou Wu §6);
unknown pregnancy status counts as safe (C2); "ADHD Support" product name (C3).
Also: no imprint/address (C4), departed admin still hard-coded (C5), lab notes
writable by anyone → MYCO poisoning (C6), Google Fonts from Google (C7).
Doses at 1:3 and biofrequency removal done (`e3d1e6e`); CSP fixes for the PDF
library committed with the audit.

## 0.7 · 2026-09-27, evening — third commit, not pushed

**The standard formula analysis** — `/formula-analysis/?h=A|B&p=40,30&n=Name&src=…`
(page) → `/api/formula-analysis` (`netlify/functions/formula-analysis.mjs`) →
`src/server/formula-engine/analyze.js`. Deterministic: engine balance
(`assignPercentages`), pair synergy/caution (`checkFormulaPairs`), the
validator's caps as "engine checks", temperature, meridians, extraction plan at
1:3, swap/add/remove/re-weigh with a before/after diff. MYCO's reading only on
request (Opus 5, adaptive, effort medium, `fallbacks: "default"`, claims-guarded).
Opened from Mixology (△ Full analysis + MYCO), the formula book (Open analysis →)
and find-your-formula (only AFTER the percentages are revealed). Dev: vite
`devFunctions()` serves the endpoint on :5173 (MYCO needs ANTHROPIC_API_KEY,
which .env.local does not have). `npm run test:formula-analysis` — 24 checks.

**Formula book ×4** — each save is kept twice (device + shared) and the book
never deduped; Mixology's Save also stayed clickable during the cloud write.
Both fixed; the book dedupes by name + herb set within 6 h.

**Herb counts** — Amla 523 + Kalmegh 526 were swallowed by the herbs.ts parsers
in `sync-engine2.cjs` and `build-herb-pool.cjs` (comment lines before `id:`).
Engine, shelf, pool, Academy now **242**.

**Also:** /extraction lists every catalogue herb (bench table + targets read
from each record), 1:3 house standard (extraction page, Academy methods,
Mixology advice, MYCO prompt, 135 protocols in `extraction.ts`, KB rebuilt),
100-term lexicon (`public/alchemy-lexicon.js`, open on /extraction, collapsed on
the Academy), Mixology aligned with the atlas (all 242, 55 added from atlas
records), landing footer cut to Shop / Dinner Experience / Find Your Formula.

### ⚠ Decisions waiting on Robin
1. **Stimulant classifier.** `pharmacology.js isCNSStimulant` substring-matches
   'mate' inside "glutamate" — 9 of 18 "stimulants" are false (Lavender, St John's
   Wort, He Shou Wu…). Left as is ON PURPOSE: fixing it lets **He Shou Wu
   (caution HIGH, liver injury)** into energy bottles (fixture 13 changes).
   Decide: fix + keep HIGH-caution herbs out of consumer bottles? The analysis
   uses `isCNSStimulantStrict`.
2. **1:3 vs the dose lines.** 58 herbs.ts dosage lines say "Extract (1:5 …):
   N ml". A 1:3 extract is ~1.7× stronger per ml. Those were NOT changed —
   they need a deliberate dose decision, not a find-and-replace.
3. `/extraction` "Biofrequency of herbs (MHz)" section — pseudo-science next to
   the claims policy. Not touched.
4. Untracked photos in `public/atlas/` (amla, cardamom, …) — `build:atlas` would
   reference them; commit the photos first or they 404 live.

---

## 0.6 · 2026-09-27 — two commits on `main`, not pushed

`2da158a` MYCO readable (claims guard kept flattening line breaks → all-caps
wall), resizable, per-chat DM drafts, shelf = Engine's 240 herbs (written by
`build:engine2`), banner rank instead of "Unattached", /mycelium asks every visit.

Second commit: **Academy members-only** with a visitor preview (`html.ac-preview`,
a curtain — private material is locked in the DB) · **Academy PDFs**
(`academy/academy-docs.js`; text extracted in the keeper's browser with pdf.js;
MYCO reads it for signed-in members via `src/server/myco/academy-docs.cjs` and
the member's bearer token; the monthly digest reads new PDFs with the service
key and proposes page changes) · **MYCO threads encrypted** (sealed to the DM
device key, `sealLarge` in dm/crypto.js; one row per member per key) ·
**event hosts** (Facilitator/Alchemist see Root = Event manager only) ·
**restrictions** now a real column, persist per device across sign-out, and
"Community" is enforced · **`build:academy`**: `data/academy/<tradition>/*.txt|json`
→ cards between `academy:<id>` markers, claims-screened, plus live counts.

**SQL queue (Robin runs, any order):** `supabase-restrictions.sql` ·
`supabase-event-hosts.sql` · `supabase-myco-threads.sql` (replaces the plaintext
version — drops it if run) · `supabase-academy-docs.sql`.
Netlify needs `SUPABASE_SERVICE_ROLE_KEY` for the digest to read the library
(already used by fyf-compose, so probably set).

Open: `public/community/academy/Herbalism Module 1_V3.pdf` is still a public
file — re-upload it through the library and delete it from the repo.

---

## 1 · What happened on 2026-09-25

Ten commits on `main`, two on `facelift`. In order:

| commit | what |
|---|---|
| `c992390` | **production React.** `/community` was loading 1,162 KB of *development* React from unpkg on every visit. Now 139 KB, vendored locally. |
| `66b6b35` | **`docs/COMMUNITY-AUDIT.md`** — full measured audit of `/community`. 659 lines. |
| `69a970f` | **DM D1 + D2.** The sender can now read their own sent messages; a new device fails legibly instead of silently. |
| `1ad99c2` | **admin planning board** (kanban) on the Admin tab, backed by `board_cards`. |
| `e67d905` | audit updated — D1/D2/D4/D5 closed. |
| `0e0ec12` | **`fa_is_admin()` must read `is_admin`**, not `role`. See §2. |
| `1b838e1` | the board tells an expired session apart from a non-admin. |
| `1c956df` | key-vault + RBAC migrations; **`strictPort` on the dev server**. |
| `76d5932` | **Security Key vault** + **MYCO fails closed** on unsourced claims. |
| `79a4a02` | MYCO tier-filters lab notes, as a no-op. |
| `b47d34b` | facelift Phase 0 — brief + audit. |
| `e7a8541` | facelift Phase 1 — **the fairy ring**. |

### The session-expiry thing, solved

Robin kept being signed out on localhost and thought the token was expiring.
It wasn't. **Vite was hopping 5173 → 5174 when the port was busy, and a
Supabase session is stored per ORIGIN — port included.** Every hop was a fresh
localStorage. `server.strictPort` now makes it fail loudly instead.

Supabase caps JWT expiry at one week, so the "make it a month" ask is not
available — but it is not needed either: `autoRefreshToken` renews indefinitely
on a stable origin. Worth checking Authentication → Sessions that **Inactivity
timeout** and **Time-box user sessions** are both off.

---

## 2 · ⚠ SQL — what to run, what never to run

### Already run (confirmed by Robin)

- `fa_is_admin()` — the corrected `is_admin`-only version
- `supabase-admin-board.sql` — `board_cards` exists, Robin is admin

### Waiting, in this order

| file | why it is waiting |
|---|---|
| `supabase-messages-e2e-sender-copy.sql` | safe to run now. Adds `ciphertext_self`, key fingerprints, and column-scoped UPDATE. |
| `supabase-e2e-key-vault.sql` | **hold.** It installs a trigger that writes `profiles.dm_public_key` from a vault nothing populates until the vault UI exists (§6). |
| `supabase-rbac-tiers.sql` | safe, but pointless until the client reads `access_role` (§6). |
| `supabase-visits.sql` | carried over from 2026-09-24. Traffic email is built and waiting on this one statement. |

### 🔴 NEVER run `supabase-academy-access.sql` as it stands

It breaks two things, and we found both the hard way:

1. **`profiles.role` is the member PERSONA**, not an authorisation role —
   `herbalist`, `patron`, `alchemist`, `founder`, written by ProfileEditor. Its
   `CHECK (role IN ('member','forager','steward','admin'))` is violated by
   existing rows, which is how we found it. Had it passed, **saving any profile
   would then fail**.
2. Its `fa_is_admin()` tests `role = 'admin'`, so **an admin who edited their
   own profile would stop being an admin**.
3. Its §5 closes `lab_notes` to members only — and **MYCO reads `lab_notes`
   with the anon key**. Running it would silently empty MYCO's live bench-note
   retrieval. No error; answers would just quietly stop citing the bench.

The real fix is two columns: `access_role` for authorisation (already in
`supabase-rbac-tiers.sql`), `role` left to the portal. Written up in
`supabase-fa-is-admin.sql` and `docs/COMMUNITY-AUDIT.md` §6.

---

## 3 · The facelift — where it got to

`docs/FACELIFT.md` holds the brief verbatim and the Phase 0 audit. Branch
`facelift`.

**Phase 0 · done.** Four findings differed from what the brief assumed:

- the portal types in **Satoshi / Zodiak / Geist Mono**, not the IM Fell /
  Spectral / Josefin the brief named. **Robin's call: keep the portal's own.**
- **there is no mycelium sphere in this repo.** Robin's call: build one.
- five of seven sections are hardcoded or localStorage-backed, so HEALTH,
  ACTIVITY, FLOW and Pulse have no real source. **Robin's call: hide them.**
- labels lived in two hand-synced arrays plus a heading per page.

**Phase 1 · done, `e7a8541`.** The ring is on the Network tab, additive — the
old tab row and QuickNav still work.

```
public/community/portal/sections.jsx     portalSections — THE config
public/community/portal/fairy-ring.jsx   FairyRing + useOrbit + DetailCard
public/community/portal/organism.jsx     The Organism, a purpose-built SVG
public/community/portal/fairy-ring.css   portal tokens only
tests/fairy-ring-verify.cjs              npm run test:fairy-ring — 35 checks
```

All six reference bugs fixed and pinned by tests: one rAF loop instead of
setState every 50ms · angle tweened the short way round · no side effects in a
state updater · block-bodied ref callbacks · `=== null` not truthiness · real
buttons.

**⏸ WAITING ON ROBIN.** He has not looked at it in a browser yet. Do not start
Phase 2 until he has.

```
npm run dev  →  http://localhost:5173/community  →  Network tab
check at 1440, 768 and 360 wide
```

**Phase 2** live counts on the five sections with real sources, threads, decay,
role awareness. **Phase 3** names everywhere from the config, nav consolidation
(the icon tab row goes), the spore print card. **Phase 4** motion polish,
mobile, keyboard/SR pass, production build.

One-liners for the seven sections are drafted in `sections.jsx` and **Robin
wants to edit them.**

---

## 4 · The community audit — the three that matter

`docs/COMMUNITY-AUDIT.md`, 659 lines, every number from a command (§15 lists
them).

| | finding | status |
|---|---|---|
| **B1** | `fetchAll()` selects every profile, no pagination — silently truncates at **1,000 members** | Robin: *acknowledged, not urgent at 12* |
| **B2** | the economy is `localStorage` only — balance, reputation, unlocks are forgeable from the console, and `unlock()` gates Experiences client-side | **open** |
| **B3** | **`profiles` has no migration.** 23 SQL files reference it, none creates it. "Run every `.sql` in order" does not reproduce the database | **open** |

Also still open from that audit:

- **108 KB of dead source** — `spore/app.jsx`, `tracker-app.jsx`,
  `tracker-data.jsx`, `network-map.jsx`, `styles.css`, `styles-tracker.css`.
  No page loads any of them; all are compiled every build and deployed.
- **`maximum-scale=1`** on `community/index.html` disables pinch-zoom — a WCAG
  2.1 SC 1.4.4 failure on every phone. One attribute. The Academy page does not
  have it.
- **supabase-js is unpinned at `@2`** from jsdelivr — a breaking minor release
  changes the portal with no deploy. Same `vendorCobe()` pattern would fix it.
- **four hardcoded admin allowlists** still in client JS (`global-nav.js`,
  `app-living.jsx`, `herbal-engine-2/index.html`, plus `spore-gate.js` trusting
  localStorage).
- `lab_notes` and `snippets` are `SELECT USING (true)` — world-readable with
  the anon key. May be intentional for `lab_notes`; decide it explicitly.

---

## 5 · Encrypted DMs — where they got to

**Done:** D1 (sender reads own messages), D2 (device-bound failure is legible),
D4 (three keypairs → one), D5 (two wrong SQL comments), plus one the audit
missed — the `mark_read` policy did not restrict *columns*, so a recipient
could rewrite the ciphertext of anything sent to them.

**The Security Key vault is built and tested but has no UI.** PBKDF2 600k +
AES-GCM, `FUNG-XXXX-XXXX-XXXX-XXXX` keys, and `openKeypairForVault()` — the
gate that refuses to mint a new keypair when a vault exists, because otherwise
a new device orphans all history before the member is offered a restore.

`npm run test:dm-vault` — 22 checks. The one that carries it: *a restored
device decrypts mail sent to the original.*

**Still open:**
- **`dm/dm.jsx` does not exist.** No DM UI at all.
- **`dm/vault-ui.jsx` does not exist.** The Security Key card and unlock modal.
- **Realtime is not enabled** on `messages_e2e`, and the portal has never used
  Supabase Realtime anywhere.
- **D3** — nothing signs the ciphertext, so the server cannot *read* a message
  but *can forge* one. Needs a long-term ECDSA key alongside the ECDH one.
- The independent crypto review the file header asks for.

---

## 6 · Half-finished, and it matters which half

| built | not built |
|---|---|
| key vault crypto + SQL | the vault UI, the DM UI |
| `supabase-rbac-tiers.sql` incl. the escalation trigger | the client refactor — the 4 allowlists still hardcoded |
| MYCO tier filter in `lab-notes.cjs` | `myco-agent.mjs` does not pass a JWT, so the tier is always the default |
| the fairy ring, Phase 1 | Phases 2–4 |

**The RBAC trigger is the one to understand.** `profiles` already lets a member
edit their own row, and RLS cannot restrict which *columns* an update touches —
so **any member could have run `update profiles set is_admin = true` on
themselves**, and the client-side allowlist we are deleting was the only thing
in the way. That trigger closes it. It is in the migration and the migration
has not been run.

MYCO stays **open to the whole world** — Robin, 2026-09-25 — through
`/foraging`, `/extraction`, `/mixology` and `/community`. Tiers ship as a no-op:
everything is tier 1, anonymous resolves to tier 1. The switch is for **Q2
2027**, when MYCO goes behind the member portal.

---

## 7 · Carried forward from 2026-09-24 — still open

Nothing here was touched this session.

### ⚠ Three herbs, one with a safety problem

Photographs sit in `public/atlas/` and the atlas build prints them as unmatched
every run, so they cannot be forgotten.

| herb | status |
|---|---|
| **Green tea** — *Camellia sinensis* | straightforward, add it |
| **Hibiscus** — *Hibiscus sabdariffa* | straightforward, add it |
| **Comfrey** — *Symphytum officinale* | **STOP AND THINK** |

Comfrey contains hepatotoxic pyrrolizidine alkaloids. Internal use is
restricted or banned in Germany, the UK and the US. It needs the Thunder God
Vine treatment: in the catalogue and atlas, **never reachable by a formula** —
`RESTRICTED_NAMES`, `caution_level: 'HIGH'`, `safe_pregnancy: false`, and
contraindications saying external-use-only in plain words. A decision to take
deliberately with Robin, not a record to type quickly.

Also unmatched and probably just misnamed: `wild-rosemary.jpg` (*Rhododendron
tomentosum* vs the catalogue's *Rosmarinus officinalis*) and `wild-thyme.jpg`
(*Thymus serpyllum* vs *T. vulgaris*).

### ⚠ Five pharmacology entries Robin must check

Drafted from each record's own recorded botanical, not from a monograph.
`grep "drafted 2026-09-24"` finds all five: **508 Dashmool · 509 Gandira ·
515 Rudraksha · 529 Nishoth · 530 Ajwan**.

### Three things waiting on Robin

1. **Three held herb records** — Amla 523, Haritaki 414, Kalmegh 526 were not
   imported. `node scripts/import-herb-records.cjs "<batch dir>" --diff=523,414,526`.
   414 is safe as-is; 523 and 526 shrink `regional_affinity`, so look first.
2. **More herb batches** — put them in any staging folder and give the path.
   **Not** `public/home/markdowns all plants`, which is the monograph corpus.
3. **Traffic email** — built; `supabase-visits.sql` has not been run.

### Atlas

- **`npm i -D sharp`, then `npm run build:thumbnails`.** Without it the atlas
  cards use full-size photographs: 16 images average 430 KB, and at 260 herbs
  that is ~112 MB and a ~5 MB first screen. `scripts/compress-image.cjs` also
  needs sharp and has been dead the whole time.
- **Habitat is a writing job, not an extraction job.** 180 records have no
  habitat line; full list in `docs/ECOLOGY-GAPS.txt`. Recording it closes the
  atlas's 38% ecology coverage *and* the 10 dead ecology expansions in the
  terminology report — one edit, two payoffs.
- Parked: Botanical Mycelium graph (740 recorded edges behind it), the three
  flagship portals, ecology/human-state/preparation rails as state changes.

### Decisions, not patches

- **Caution-veto severity taxonomy** — cautions still do not block a
  composition, and `interactions.js` has no severity vocabulary at all.
  INFO / CAUTION / HARD-CONTRAINDICATION changes which formulas ship.
- **Compose endpoint hardening** — 8/IP/min in-memory only, no spend cap, no
  bot challenge, and it calls `claude-opus-5` at max_tokens 4000 on an anonymous
  public request. Infra and deploy work.
- **Ajwan 530** is *Apium graveolens* (celery seed) and **590 Ajwain** is
  *Trachyspermum ammi*. Different plants, confusably named. Renaming 530 to
  "Celery Seed" is a display-name change with slug implications.
- **Negation only stops widening**, it does not down-weight the term, so "not
  sedating" still scores `sedating` at full weight.

### Known debt, not regressions

- **Typecheck backlog: 47 errors**, parked in `docs/TYPECHECK-BACKLOG.md`.
  Use **`tsconfig.app.json`** — `tsconfig.json` typechecks nothing.
- **Fixture comparison shows 12 UNEXPECTED.** Baselines need re-capturing
  (`npm run test:fixtures:capture`). Pre-existing.
- **Safety-rules known-divergence allowlist is at 6.** All correct on merits.
- `entitlements` is created by SQL that was never applied, so
  `fa_has_entitlement()` references a table that does not exist.

### From 2026-09-13, still open

`docs/SESSION_PICKUP.md` — foraging. Esri basemap **replacement** (Robin picks
the licensed source), **22 P1/P2 items** from the foraging audit deck, and
`src/foraging/scoring.ts` has no unit tests.

---

## 8 · How to be economical next session

- Read **this file** and, if touching the portal, `docs/COMMUNITY-AUDIT.md`
  and `docs/FACELIFT.md`. Nothing else up front.
- Do **not** re-read `herbs.ts` (14k lines) or re-run the full build chain
  unless herb data actually changes.
- `npm run dev` serves `/community` with `.jsx` compiled **on request** — you
  do **not** need `npm run build:community` in dev. Only for production builds.
- **`git add -A -- public/` is not safe in this repo.** `public/` holds
  deliberately-untracked media beside source. Stage explicit paths.
- Verification that matters: `npx tsc --noEmit -p tsconfig.app.json` ·
  `npm run test:safety-rules` · `test:myco-kb` · `test:myco-terminology` ·
  `test:fairy-ring` · `test:dm-vault` · `test:admin-board`.
- **Never `git push` without an explicit "push" in the same message.** It burns
  Netlify credits. 10 commits are waiting on `main`.
