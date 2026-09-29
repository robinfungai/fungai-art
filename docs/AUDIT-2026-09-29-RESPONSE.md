# Audit of 29 Sep (ten weak spots, §12–17) — verdicts

Checked against the code on `main` at 572704b (29 Sep, night). **Nothing edited
yet — Robin approves each change first** (Robin, 29 Sep: "check with me before editing").

## Already fixed (the audit read an older brief)

| Claim | Now |
|---|---|
| #5 Pair cautions never veto | Engine 2.8: `pair-rules.js` — 8 BLOCK pairs never share a bottle, 15 CONDITIONAL under their safety answer, in picker AND validator. |
| #6 Second fill walk ignores category cap | Engine 2.5 (D3): one strict walk; the category cap is in `seatBlocker`. |
| #7 Two Amanitas in one bottle | Engine 2.6: `MAX_AMANITA: 1`; never beside St John's Wort (2.7). |
| "Client engine still live" | Removed — Step 6, and on 29 Sep the last ~1,150 lines (pool, trace list, synergy checker, naming, story, micronutrients). |
| "12-month retention" | Unreserved formulas are purged after 30 days (D6). |
| "MYCO validator code duplication" | One rules module (`rules.js`) for picker and validator since 2.6. |

## True — what Claude would change (each needs Robin's OK)

| # | Claim (verified) | Proposal | Moves bottles? |
|---|---|---|---|
| Q7 | Validator "independence": picker and validator share `rules.js` by design (one rule, no drift) — but the invariant test also uses `rules.js`, so a bug in a rule would pass its own test | Make `test:invariants` check every cap with its own plain code, not `rules.js` | No |
| #9 | Rate limit is in memory, per instance (8/min/IP) | Money is already safe (MYCO daily budget + request claims are in the database). Move the limit into Supabase too (one SQL function) — no new vendor (Upstash not needed) | No |
| Q3 | 10 safety flags miss CYP450 / P-gp, anticoagulant stacking, QT, MAOI, chemo — **real**: on 29 Sep Schisandra's CYP3A interaction was found written backwards | (a) a safety answer "another prescription medicine (incl. chemotherapy, transplant)" that removes the strong CYP3A/P-gp modulators; (b) record `cyp` tags per herb — Claude drafts from PubMed, Robin reviews; start with the ~15 strongest (St John's Wort, Schisandra, Goldenseal, Kava, Licorice…) | Yes, for people who tick it |
| — | Safety flags read by regex from prose at request time (`axes.js`) — same method that went wrong for goals | Record the flags per herb, with a test that fails when prose and record disagree (the pattern used for laxative / trace class in 2.8.2). Claude drafts, Robin reviews — pair it with the goals review | Some |
| #2 | Body pattern, time, stress style regex-inferred — **proved on 29 Sep**: a sentence about "heat injury" in Amanita's text changed its body-pattern score and moved a pinned bottle | Record `body_fit`, `time_fit`, `stress_fit` per herb; start with the 50 herbs in `docs/TOP-HERBS.md` (they fill most bottles) | Some |
| #1 | Goal lists AI-drafted, unreviewed — the most important | A review page: each herb's goals beside the lines of its record they rest on; Robin ticks / edits ~10 a week; Claude applies. Start with TOP-HERBS 1–50 | Yes |
| 12 | No adverse-event reporting; no batch traceability | A "report a reaction" form (Formula Book + confirmation email link) → table → email to Robin; a batch id on each bottle linking formula id → Stripe order → lab batch | No |
| 12 | Quiz open worldwide | Gate at RESERVATION, not the quiz: a shipping-country rule per herb (e.g. Sweden: muscimol scheduled → no Amanita to SE). Blocking the quiz by IP is not needed | Only for reservations |
| #10 | 4 serotonergic herbs recorded | Lemon balm / Bobinsana have no good serotonergic evidence — don't add by name; PubMed-check candidates first | Maybe |

## Robin's decisions (formulation / product, not bugs)

- **#4 One trace herb per bottle** — audit wants a budget of 2 (≤10% combined). Changes aromatic digestive formulas.
- **Q5 HIGH-caution cap** — Robin decided HIGH herbs stay in adult bottles; a *count* cap (≤1 HIGH per consumer bottle) is a different, still-open question. 42 HIGH / VERY HIGH herbs in the pool.
- **Q1/Q2 non-goal ×0.5 → ×0.7** — would reshuffle many bottles; run `npm run report:top-herbs` before and after to see it.
- **#3 validation** — 20 practitioners, blind review (the audit's Q8 design is good). Organisational; Claude can build the review page.
- **#8 self-reported age** — standard; the under-18 policy itself is still open (§0.19).
- **§12 regulatory** — not code. Agree: an EU/DE herbal-medicine lawyer before scaling the consumer funnel. The claims wording (D9) is the biggest lever on "medicinal product by presentation".
- CSRF / missing origin — low: nothing uses cookie auth (compose is anonymous; pro uses a bearer token). No change proposed.

## Claude's suggested order
1. Independent invariant checks · 2. DB rate limit · 3. "other prescription medicine" + CYP tags (top 15) · 4. Adverse-event form + batch id · 5. Shipping-country gate · 6. Goals + recorded axes review for TOP-HERBS 1–50 (with Robin) · 7. Trace budget / HIGH cap / ×0.7 when Robin decides.

---

# Second audit of 29 Sep (F1–F8, Find-your-formula page) — verdicts

Line numbers in the audit are from the page on GitHub main (older). Checked 29 Sep,
night, against local `main` and — for F1 — the live database (anon key, ids only).
**Robin, 30 Sep: F2 → A; F3 → optional; F4, F5, F7, F8 → go. Done 30 Sep** (F1 needs only the push + SQL step 3).

| # | Verdict | Proposal | Moves bottles? |
|---|---|---|---|
| F1 HIGH — health answers into the shared `formulas` table | **Not readable, but still being written.** Live DB: the base table is locked (anon: "permission denied"); the view members read (`formulas_public`) has no `quiz_snapshot`. Local code no longer writes it (Formula Book entry is written server-side without answers, since the 29 Sep audit #4). BUT the live site (GitHub main) still writes `quiz_snapshot` on every reservation until the 1 Oct push. | Push on 1 Oct, run `supabase-formulas-server-writes.sql`, and **do its step 3** (clear the stored `quiz_snapshot` copies — look at the count first). Nothing to code. | No |
| F2 MEDIUM — percentage gate is cosmetic | **True.** `/api/fyf/compose` sends every herb's percentage; the page hides them until reserve. | A: compose omits percentages for consumer bottles; `reserve-formula` returns them on confirmation (it already has the stored formula). B: keep it and change the copy so it promises a reveal, not secrecy. Robin's call (marketing vs enforcement). | No |
| F3 MEDIUM — city required | **True.** Page requires name, city, country; server only prints city in Robin's email. | Make city optional (shipping address comes at payment anyway) — or keep it deliberately and say why in the privacy page. | No |
| F4 LOW — `'NETWORK' : 'NETWORK'` | **True** (both pages). | A `TIMEOUT` kind with its own line ("took longer than usual — try again"). | No |
| F5 LOW — stuck-button guard compares button text | **True** (both pages). | A boolean `reserving` flag instead of the text. | No |
| F6 LOW — reveal before confirm | **True, deliberate.** | Goes with F2: under A the reveal waits for the server's answer. | No |
| F7 LOW — accretion | **Partly outdated:** the legacy reserve fields went on 29 Sep (−1,150 lines). Still two escapers (`_escapeHtml`, `escapeHtml`) and two `wait` helpers. | Merge each pair; comment clean-up with D9. Low value. | No |
| F8 LOW — no maxlength | **True** (quiz note, reserve note). | `maxlength` = the server's caps. | No |
