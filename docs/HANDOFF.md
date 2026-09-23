# Handoff · 2026-09-24

**Read this file first. Do not re-explore the codebase to rebuild context.**
Everything below was already verified with tests this session; re-deriving it
costs tokens for no new information.

---

## State: 5 commits on `main`, NOTHING PUSHED

```
059a4de  fix(safety): interaction checker could not see 11 herbs, incl St John's Wort
57c4942  docs: park the typecheck backlog
e37793a  fix(types): portal timer's contribution id was never in its own type
e20868a  feat(herbs): 199 → 243 herbs, one knotweed, Thunder God Vine out of formulas
1cb56eb  fix(academy+engine)  ← from the PREVIOUS session, still unpushed
```

Untracked: `src/assets/atlas/` (6 media files, deliberately not committed).

Pushing sends last session's lab-notes fix up too. Robin has a hard rule:
**never push without an explicit "push" in the same message.**

## Done this session

- Herb catalogue **199 → 243**. Five batches, ids 545–589. Six existing
  entries enriched (Kalmegh 526, Amla 523, Gotu Kola 108, Grape Seed 420,
  Gromwell 565, Oyster Mushroom 321). Knotweed consolidated to one entry
  (563); id 572 retired. Thunder God Vine (564) is in `RESTRICTED_NAMES` so
  the formula engine cannot reach it — Robin confirmed he wants it in the
  database and future atlas, never in a formula.
- Fixed a real `isRestricted()` bug: substring matching meant `'lsa'` matched
  *Cistanche sa**lsa*** and silently dropped it from the pool.
- Fixed `checkFormulaPairs()` name matching (see audit item 3 below).
- Portal `ct` type bug in CommunityPortal.

## THE BIG GOTCHA — verify audit claims before acting

`npx tsc --noEmit -p tsconfig.json` **typechecks nothing** (solution-style,
`"files": []`). Always use **`tsconfig.app.json`**.

And: **the find-your-formula audit Robin pasted contains a confidently-stated
P0 that is false.** This is the second audit to do that. Verify every claim
against the code — and preferably with a runnable test — before changing
anything.

---

## Audit verification status — do not redo this

### Item 1 · "under-18 gate is not server-authoritative" — **FALSE, already fixed**

`index.js:71` and `:156` both do `profile.age === 'under_18'` with the comment
*"profile._minor arriving from the client is NEVER trusted."* Applied on both
the deterministic path and the MYCO candidate pool. `passesMinorGate` already
excludes gated / GABAergic / CNS-stimulant / sedatives / psych_meds /
contraceptive — the exact list the audit called missing.

Proof (re-runnable):

```js
// forged payload from the audit: _minor omitted, _gatedOptIn forged true
{ age:'under_18', _ageConfirmed:true, _gatedOptIn:true, avoid:['none'], ... }
→ Fu Ling, Pine Bark Extract, Thyme, Oatstraw     VIOLATIONS: NONE
// same profile as adult, for contrast:
age:'25_40' → Chamomile, Schisandra, Fu Ling, Vervain   ← 3 of 4 are minor-flagged
```

**No action needed.**

### Item 2 · "compose endpoint is public and spends money" — **TRUE, unfixed**

Verified: 8/IP/min **in-memory only**; no spend cap; no bot challenge;
`fyf-compose.mjs:363` passes **no-Origin requests through by design**.
Calls `claude-opus-5`, max_tokens 4000, on an anonymous public request.

Needs WAF/Netlify rule + challenge + a Supabase-backed budget counter
(in-memory has the same per-instance flaw as the rate limiter). Deploy and
config work, not a patch.

### Item 3 · "cautions reported but never veto" — **TRUE. Half fixed in `059a4de`.**

Found worse than reported: name matching used `firstWord()` and dropped keys
under 4 chars, so **11 of 243 herbs were unmatchable** — St. John's Wort
(`"st."`), Dan Shen, Red Yeast Rice, He Shou Wu, Fu Ling, Zhu Ling, Pau
d'Arco, Saw Palmetto, Red Dates, Red Astragalus, Red Wine Extract. SJW —
the most interaction-prone herb in the pharmacopeia — matched nothing.

Fixed: multi-word phrase keys + aliases + progressive prefixes. Deliberately
NOT every 4+ char token (that promotes `"extract"`, `"root"`, `"bark"` to
keys and fires on any prose). Verified: all 11 resolve, 0.07 mean cautions
per random 5-herb formula, zero fixture drift.

**Still open:** cautions do not block a composition, and `interactions.js` has
no severity vocabulary at all. INFO / CAUTION / HARD-CONTRAINDICATION with
rejection changes which formulas ship → **Robin's decision, not a patch.**

### Item on reserve-formula — **TRUE, P1, smallest high-value fix available**

`netlify/functions/reserve-formula.mjs:386` returns HTTP **200** with
`{ok:true, sent:false}` when `RESEND_API_KEY` is missing, telling the customer
*"Reservation received."* while Robin receives nothing. **Silent lost orders
on a live shop.** Fix is small but changes what customers see on failure, so
it was not shipped unasked.

### localStorage claim — **overstated**

`fyf_state` *is* removed in three places. No time-based expiry, so an
abandoned mid-quiz session persists. Fair concern, not "retained
indefinitely".

### Not yet examined

Privacy/transparency gap (Supabase + Anthropic + Resend + Netlify geo vs the
"stays with Robin only" copy), the constituent-level safety model, the
post-MYCO evidence recheck, moving micronutrient inference server-side.
These are a programme of work, not a fix list.

---

## Next session: pick ONE

Robin was asked to choose and the session ended before he did.

1. **reserve-formula 200 → 503** — smallest, actively costing orders. Start here
   unless told otherwise.
2. **Caution-veto severity taxonomy** — needs Robin's decision on what rejects.
3. **Compose endpoint hardening** — needs infra/deploy decisions.
4. **Typecheck backlog** — see `docs/TYPECHECK-BACKLOG.md`; step one is
   deleting four dead page files (47 → 14 errors).

## How to be economical next session

- Read **this file** and `docs/TYPECHECK-BACKLOG.md`. Nothing else up front.
- Do **not** re-read `herbs.ts` (14k lines) or re-run the full build chain
  unless the herb data actually changes.
- Verification commands that matter:
  - `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep "data/herbs"`
  - `npm run test:safety-rules` (and `minor-gate`, `myco-validator`)
- Fixture comparison shows **12 UNEXPECTED**; 10 predate today, 2 are the herb
  additions. Baselines need re-capturing (`npm run test:fixtures:capture`) but
  that is pre-existing debt — do not treat it as a regression.
- Safety-rules known-divergence allowlist is at **6** (Bacopa, Catuaba,
  Genistein, Kudzu Root, Peppermint, Toothed Clubmoss). All correct on the
  merits; the engine is never less strict than the rules.
