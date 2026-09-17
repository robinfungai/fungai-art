# Fungai Academy · Phase 0 — Architecture Audit

Date: 2026-09-17 · Engine 2.1 · Herb DB 199 · KB 2,744 chunks
Scope: `/public/community`, MYCO, formula engine, botanical data, Supabase schema, build/deploy.
Status: **audit only — no UI rewrite performed.**

---

## 1 · Executive summary

Five systems already exist and are worth keeping: the **server-authoritative formula engine**, the **199-herb botanical database**, the **MYCO knowledge + citation layer**, the **Supabase schema with RLS on 17 tables**, and the **compliance/claims layer**. The Academy should be assembled around these, not beside them.

Three things block the target architecture and must be fixed before any Academy feature is built on top:

| # | Blocker | Why it blocks |
|---|---|---|
| **B1** | **Identity and authorisation live in the browser.** `localStorage.spore_active_member_full` decides who you are; the admin flag is re-stamped client-side from a cached email string. The member PIN is stored in plaintext localStorage. | §30/§31 require access control at the data layer. Today any visitor can present themselves as any member to the UI. |
| **B2** | **Academy knowledge tables are world-readable.** `lab_notes`, `snippets`, `lab_chapters` all have `SELECT USING (true)`, and the anon key is public by design. | Proprietary knowledge is retrievable over the REST API regardless of the frontend. §31 says never rely on hiding a button. |
| **B3** | **No stable IDs across domains.** Products are keyed by display string (`Chaga Extract`, and a malformed `Afghan Saffron (`); monographs are filenames; formulas store `herb_names` as text. | §01/§57 require relations by ID. Every graph edge in §08 is currently un-joinable. |

The single highest-value structural change after those: **safety as machine-readable data**. Today safety is prose inside `herbs.ts`, re-derived at runtime by regex in `axes.js`. §16/§23 need it as rules.

---

## 2 · Current architecture map

```
BROWSER                                  NETLIFY EDGE / FUNCTIONS            DATA
---------------------------------------  ----------------------------------  ---------------------
/community/index.html                    ip-block (edge, every request)      Supabase Postgres
  - React 18 UMD (unpkg)                                                       - 17 RLS tables
  - Babel standalone (JSX in browser)    /api/* -> functions/*                 - storage: avatars
  - supabase-client.js (anon key)          myco-agent.mjs                      - auth: magic link
  - spore/data.jsx (static MEMBERS)        fyf-compose.mjs
  - spore/app-living.jsx (299 KB)          fyf-upgrade.mjs     -> src/server/  Anthropic API
  - myco/{prompts,context,agent}           reserve-formula.mjs    formula-engine/  (claude-haiku-4-5)
  - mycelium-field.js                      create-payment-intent  myco/        Stripe · Resend
                                           stripe-webhook         herb-data/
/community/academy/index.html
  - inline JS, no shared shell           18 functions total
```

**Reality vs. the spec in the repo.** `public/community/spore/spec/*` describes Next.js 15 on Vercel with server actions. The implementation is static HTML on Netlify with browser-compiled JSX. That spec is aspirational and should be marked superseded, or the migration decided deliberately (see §10).

---

## 3 · Route map

| Route | Served by | Auth | Notes |
|---|---|---|---|
| `/community/` | `public/community/index.html` | none at the edge | React app; the login screen is a UI state, not a gate |
| `/community/academy/` | 147 KB standalone HTML | none | lab notes, chapters, snippets, formula viewer, PDF |
| `/find-your-formula/`, `-pro/` | static + `/api/fyf/compose` | none (public) | server-authoritative engine |
| `/foraging`, `/shop`, `/home`, `/dinner-experience`, `/privacy`, `/terms` | static | none | public site |
| `/mycelium/`, `/covenant/` | static + `code-gate.js` | code 8888 | soft curtain, not auth |
| `/api/*` | Netlify functions | per-function origin gate + rate limits | `no-store`, noindex |

There is no authenticated shell, no route-level middleware and no server-rendered gate anywhere. Every "members-only" surface is `noindex` plus client-side rendering.

---

## 4 · Data map

### Botanical (canonical + generated)

| Artifact | Size | Role |
|---|---|---|
| `src/data/herbs.ts` | 1.19 MB, 199 herbs | **canonical source** |
| `public/herbs-data.js` | 1.19 MB | generated mirror (browser) |
| `src/server/herb-data/herbs.generated.cjs` | 1.19 MB | generated mirror (server) |
| `public/herb-engine-pool.json` | 212 KB | generated subset (engine 2) |
| `src/server/myco/kb.generated.cjs` | 3.2 MB, 2,744 chunks | generated retrieval index |
| `public/home/markdowns all plants/` | 130 files, 2.2 MB | **second, unlinked corpus** |
| `knowledge/proprietary/` | 2 files | house protocols (labelled) |

The four generated files are legitimate build artifacts — `npm run build` regenerates all four. **The 130 monographs are the real duplication**: they carry no `botanical_id`, so nothing joins a monograph to its `herbs.ts` entry, to formulas containing it, or to products.

### Commerce

| Entity | Where | Identity |
|---|---|---|
| Products | hardcoded in `public/shop/index.html` | display string |
| Stock | `product_inventory.product_id` (text PK) | same display string |
| Orders | `orders.items` jsonb | name snapshots |
| Batches / raw materials / QC | **do not exist** | — |

Drift is already visible: the seed list holds 20 names including a malformed `Afghan Saffron (`, while the shop sells products (Nervous System Tonic, Nettle Extract, Shilajit Paste, Sleepy Sleepy) that were never added to it.

### Formulas

`public.formulas` mixes two unrelated things:

1. **community blends** — `herb_ids[]`, `herb_names` text, `maker_label`, `notes`
2. **quiz outputs** — `percentages[]`, `bottle_ml`, `quiz_snapshot` (health data), origin geo

No `version`, no `status`, no approval, no link to a product. The `formulas_public` view plus `supabase-formulas-health-lockdown.sql` restrict the health columns — **that SQL has not been run yet**.

### Academy content

`lab_notes`, `lab_chapters`, `snippets` — free text, public read, open insert (size-capped in hardening round 2). No entity model, no publishing states, no sources, no courses, no lessons, no progress. The "Alchemy Academy" tab links to a 147 KB page and a PDF.

---

## 5 · MYCO map

Built and working (this week's commits):

```
POST /api/myco-agent
  - origin gate · rate limit 12/min/IP
  - context blob from browser (member name, role, tier, next events)
  - groundQuestion()  -> BM25 over 2,744 typed chunks (~13 ms)
  - system prompt carrying retrieved passages + knowledge-type labels
  - Anthropic claude-haiku-4-5
  - verifyAnswer()    -> strips invented citations
  - guardReply()      -> removes medicinal claims
```

Against §09–§12 the shape is right: retrieval → typed knowledge → citation → verification. Missing:

| § | Requirement | State |
|---|---|---|
| 10 | Tool layer (`searchKnowledge()`, `getFormula()`, …) | none — a single prompt call |
| 11 | Intent classification, retrieval planning | none |
| 12 | Levels A–F | partial — evidence/traditional/safety/preparation/identification/proprietary labels exist; no A/B/E/F distinction |
| 13 | Page context | partial — member context only, not current page/lesson |
| 16 | Safety gate as structured retrieval | **no** — safety is prose inside chunks |
| 31 | Authorisation-aware retrieval | **no** — every chunk is visible to every caller |
| 33 | Memory split | none — stateless, stores nothing (documented in the privacy policy) |
| 34/35 | Feedback → review → knowledge | none |
| 45/46 | Model router | none — the Anthropic SDK is called directly |
| 47 | Evaluation | partial — 20-question fixed set, citation integrity, 40 tests |

---

## 6 · Formula system map

```
/find-your-formula (client)  ->  POST /api/fyf/compose
                                   - validateProfile (enum whitelist, 32 KB cap)
                                   - validateAndNormalizeAvoid (safety question required)
                                   - derive _minor from the age answer
                                   - pickFormula -> scoring -> percentages
                                   - MYCO proposal -> myco-validator -> deterministic fallback
                                   - persist to public.formulas, return formulaId
```

This is the one domain that already satisfies the directive: server-authoritative, client-untrusted, versioned (`engineVersion 2.1.0-server`, `herbDbVersion`, `safetyRulesVersion`), with 20 regression fixtures and an adversarial suite. **Do not rewrite it** (§20/§57). The Formula Library should wrap it.

One boundary worth noting: safety flags are *inferred* per herb by regex over prose (`axes.js:inferAxes`), then applied as filters. Machine-readable safety rules (§23) would replace inference with data, and the engine would read the same rows MYCO retrieves.

---

## 7 · Database / schema map

17 tables with RLS: `profiles`, `formulas`, `formula_comments`, `orders`, `inventory`, `product_inventory`, `member_herbs`, `lab_notes`, `lab_chapters`, `snippets`, `feed_events`, `event_rsvps`, `hypha_gifts`, `invite_codes`, `messages_e2e`, `myco_memory`, `newsletter_subscribers`, `banned_users`.

- **Roles**: `profiles.is_admin` boolean only. No role enum, no membership tiers, no entitlements table. Tiers (`spore → palawan → mycelium → forager → root_node`) are computed **in the browser** from `rep`.
- **Audit**: no `audit_log` table. Admin actions and AI actions are unrecorded.
- **`myco_memory`** exists with RLS but is unused by the current agent.
- Past hardening closed real holes — self-granted admin, open deletes, unbounded inserts — documented in `supabase-hardening-round-2.sql`.

---

## 8 · Duplication report

| Duplicated | Instances | Verdict |
|---|---|---|
| Botanical data | 1 canonical + 4 generated | **fine** — build-time mirrors |
| Botanical *knowledge* | `herbs.ts` prose vs 130 monographs | **merge** under one `botanical_id` |
| Product identity | shop HTML, `product_inventory`, `orders.items` | **fix** — needs a product table with IDs |
| Formula concepts | community blends and quiz outputs in one table | **split** |
| Safety knowledge | `herbs.ts` prose, `axes.js` regex, quiz `avoid[]`, micronutrient catalogue, claims rules | **consolidate** into safety rules |
| Member identity | `data.jsx` MEMBERS, localStorage snapshot, `profiles` | **collapse** onto `profiles` |
| Claims rules | one shared source already (`claim-rules.cjs`) | **the pattern to copy** |
| Auth | one implementation (magic link) | **good — do not duplicate** |

---

## 9 · Security / access-control report

| Finding | Severity | Detail |
|---|---|---|
| Client-side identity | **high** | `spore_active_member_full` in localStorage determines the rendered member and the admin tab |
| Plaintext PIN | **high** | `localStorage.setItem(pinKey(id), code)` — a lock, not a boundary |
| Academy tables public-read | **high** | `lab_notes` / `snippets` / `lab_chapters` readable by anyone holding the anon key |
| Quiz health data | **high** | `supabase-formulas-health-lockdown.sql` written but **not yet run in Supabase** |
| No audit log | medium | no record of admin edits, inventory changes or MYCO calls |
| No authorisation in retrieval | medium | every KB chunk is visible to every MYCO caller |
| `unsafe-eval` in CSP | medium | required by Babel-in-browser; removable only by precompiling JSX |
| No 2FA | medium | the email inbox is the single factor for admin |
| Open-insert tables | low | `lab_notes`, `snippets` accept anonymous writes (size-capped) |

Already good: no service keys client-side; origin gates and rate limits on paid endpoints; magic-link auth (no passwords); server-authoritative formula composition; dependencies patched and CSP added; claims guard on MYCO output.

---

## 10 · Proposed migration plan

Ordered so each step makes the next cheaper. Directive phases in brackets.

**P0.5 · Trust foundation** — blocks everything (§30/§31)
Run the health lockdown SQL. Add roles and entitlements to `profiles`. Derive identity server-side from the Supabase session instead of localStorage. Lock academy tables to member-read. Add `audit_log`. The current UI keeps working throughout.

**P1 · Identity layer** (§01, §42)
Introduce `botanical_id` as the join key across `herbs.ts`, monographs, KB chunks, formulas and products. Give products a real table with stable IDs, migrating the display-string keys. No UI change.

**P2 · Safety as data** (§16, §23)
Extract `safety_rules`, `interaction_rules` and `contraindications` from prose into tables. Point both the formula engine and MYCO at the same rows. Remove the regex inference once parity is proven against the 20 fixtures.

**P3 · Formula library** (§17–§22)
Split community blends from quiz outputs. Add `formula_versions`, `formula_ingredients` and approval status. Products reference an exact formula version; batches follow.

**P4 · Knowledge core** (§04–§08, directive Phase 2)
`knowledge_entities`, `sources`, `relations` and publishing states, seeded from the merged monograph and herb corpus. Publishing triggers KB re-indexing.

**P5 · MYCO tools + authorised retrieval** (§10, §11, §31, §45)
Wrap retrieval in a tool layer, filter chunks by the caller's entitlements *before* inference, add a model-provider interface, page context and feedback capture.

**P6 · Courses** (§25–§28) — built on knowledge entities, never duplicating them.

**P7 · Community** (§40) — contributions as candidate sources with a moderation queue.

**P8 · Academy Studio** (§36) — authoring UI last, once the schema is stable.

### Decisions needed before P0.5

1. **Stay static, or add a build step?** Browser-compiled JSX in a 299 KB file forces `unsafe-eval` and blocks route-level auth. Compiling `/community` through the existing Vite build removes both without a framework migration. Recommended: build step now, no Next.js rewrite.
2. **Mark `spore/spec/*` superseded** so it stops describing a stack that was never built.
3. **Is proprietary knowledge member-only or tier-gated?** P0.5 needs the answer to write the policies once.
