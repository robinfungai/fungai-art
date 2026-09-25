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
