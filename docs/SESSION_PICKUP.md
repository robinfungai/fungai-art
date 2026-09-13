# Session pickup — 2026-09-13 early hours

Written at the end of a long session so tomorrow's context lands cleanly.

## Where things stand

### On `main` (pushed to production)

Round 2 security audit — **10 items shipped**, in this order:

| Commit  | Item | What |
|---------|------|------|
| `ecc4e26` | #2  | Geo/IP minimisation (country only, dropped lat/lng/IP/city/timezone) |
| `c438eef` | #0  | Server-derive `_minor` from age answer (canonical, client can't lie) |
| `6af38ae` | #5  | Bottle-size allowlist `[15, 30]` |
| `7ae5bae` | #6  | Micronutrient advisory labelled UNVERIFIED in Robin's email |
| `3c8b381` | #16 | Client/server synergy consistency lock-in |
| `4d0116d` | #1  | `_fyfDeepFreeze` authoritative formula; separate `__displayFormula` |
| `c6b29e2` | #8  | Extended MYCO adversarial matrix (22 new validator cases) |
| `c9dc011` | #7  | MYCO customer-narrative sanitiser (claim taxonomy + safe fallback) |
| `51a9e08` | #3  | Reservation semantics tri-state — confirmed / partial / failed |
| `ec910e8` | #4  | Reservation idempotency (light, in-memory, 5-min TTL) |
| `ab732de` | —   | Defensive paint — one section failure no longer nukes the reveal |

**16 test suites green** — 234 unit assertions + 19 fixture parity + 1 intentional SECURITY_FIX. Every commit ships with its own regression proof.

Zero formulation methodology drift across all Round 2 changes.

### Local-only (working commit, NOT pushed)

`c89d606` — **wip: visual redesign draft**. Botanical progress nodes (seed/root/stem/leaf/flower SVGs), persistent central growth visual, cohesive stage names (Rhythm · State · Arc · Voice · Ground), contextual Continue button hidden on auto-advance pages, top counter agrees with botanical nav, transition copy per stage, reduced-motion + a11y.

**Not pushed** — awaits Robin's end-to-end test on `localhost:8888` and OK.

### Untracked (not adding to git)

- `deno.lock` — created by `netlify dev`, not needed in repo
- `src/assets/dinner exp/` — Robin's local assets
- `src/assets/newest products/` — Robin's local assets

## Immediate next steps for tomorrow

**1. Test the visual redesign on `localhost:8888/find-your-formula/`**

Netlify dev may or may not still be running (background process from tonight, ID `bpgoqwwy3`). If not:

```bash
npx netlify dev
```

Open F12 → Console. Walk the quiz to the reveal. Look for `[reveal:X] failed:` warnings — those pinpoint any paint issue.

**2. Decision on `c89d606`**

- If the vibe lands → `git push` (single commit ships the whole visual redesign)
- If tweaks needed → iterate on the working tree, amend or add commits
- If the botanical metaphor doesn't sit right → `git reset --hard ab732de` reverts cleanly (the defensive paint fix is preserved on main)

## Remaining Round 2 audit items (Batch D — need proposals + approval before code)

These are architectural — the brief says "produce a proposal, get approval, then execute." **Do not code these without a proposal round first.**

| Item | What | Proposal needed on |
|------|------|--------------------|
| #9  | Distributed rate limiting | Choice: Netlify Edge RL vs Upstash Redis vs Supabase-table. Cost + latency + failure-mode analysis. |
| #10 | MYCO cost cache | Cache-store choice + key-hash design (normalized profile hash) + retention. |
| #11 | Full Supabase RLS audit | Table-by-table matrix (unauth/user-A-reads-user-B/etc). Then fix + test. |
| #12 | Formula Book / private separation | Redesign `public.formulas` writes from FYF — opt-in vs stop entirely. |
| #13 | Retention automation | Choice: Supabase edge cron vs Netlify scheduled function. |
| #14 | Legacy client-engine cleanup | Dead code sweep (`shortNote`, `storyFor`, `buildWhyText`, `checkFormulaPairs`, etc). |
| #15 | Private repo split | Architecture proposal only — deployment, build, secrets, local dev implications. |

## Visual redesign items deferred (each its own session)

The user's redesign brief has 18 sections. Tonight covered ~4-5 of them (progress nav + growth visual + cohesive labels + hidden CTA + transition copy). Deferred:

- Per-answer-option custom SVGs (rising sun / crescent moon / waveform per option)
- Waveform for the nervous-system stage (illustrative only — brief was explicit about no "physiological measurement" claims)
- Trust-building intro panel before question 1
- Fieldset + native radio semantic refactor of answer cards
- Result-reveal copy pass (non-diagnostic language)
- Full accessibility audit (focus management, live regions, WCAG contrast)

## Non-audit follow-ups noted this session

- **`public.formulas` origin_lat/lng/ip/etc. columns** are now null-inserted (Item #2). A Supabase migration to actually DROP those columns is deferred — worth doing when the private-repo split lands (Item #15).
- **`/extraction` and `/mixology` pages** still load `public/herbs-data.js`. Robin plans to rebuild those pages to fetch from server. Then `/herbs-data.js` can be deleted (was Item #14 territory).
- **`ANTHROPIC_API_KEY`** is unset locally, so MYCO falls back to deterministic every time on `localhost:8888` (`mycoUsed:false`, `mycoFallbackReason:MYCO_UNAVAILABLE`). Production has the key; local dev doesn't need it unless you want to test MYCO end-to-end.

## Repo state at close

- Branch: `main` (clean of uncommitted changes after `c89d606`)
- Last pushed: `ab732de`
- Last local: `c89d606`
- Working tree: clean (no unstaged edits, no orphaned files)
- Backup: `/tmp/session-checkpoint/basic-full.html` — the pre-commit visual state, in case the local commit gets lost somehow

Goodnight.
