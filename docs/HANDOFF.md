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

## 0.10 · START HERE — 2026-09-27, last session of the day (committed, not pushed)

**Robin runs, in this order:**
1. `supabase-lab-notes-signed-in.sql` (lab notes / snippets: signed-in only; its §5 lists authorless notes to review)
2. `supabase-medium-fixes.sql` (Afghan Saffron split into 3g/5g/10g stock rows — then set real counts in Admin → Product inventory; search_path on two functions)

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
