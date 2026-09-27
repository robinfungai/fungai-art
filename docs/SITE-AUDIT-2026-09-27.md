# Fungai Art — the whole-site audit · 2026-09-27

**Asked for:** "the most extensive, exhaustive, expressive, exaggerated audit of the
WHOLE site — before I test on localhost or push everything."

**Measured on:** `main` at `e3d1e6e` plus the two fixes committed with this file.
Every number below comes from a command that was actually run (§11). The tone is
loud on purpose; the facts are not inflated. Where something could not be
measured, §9 says so.

**Severity:** 🔴 act before (or right after) the next push · 🟠 this month ·
🟡 when you are nearby · ⚪ noted, fine as is.

---

## Status after Robin's answers (same day, evening)

| # | Robin decided | Done |
|---|---|---|
| C1 | Ephedra only in pro mode; HIGH / VERY HIGH herbs **stay** in customer formulas; make the stimulant/sedative call pharmacologically, with PubMed data in herbs.ts | ✅ `formula_access: 'pro'` on Ephedra (engine, validator, pro page). 65 herbs carry `cns_action` + `cns_evidence` (83 PMIDs cited, each read; 4 more read and dropped). The "glutamate" misfire is gone; nothing stimulating in evening or sleep formulas (the old engine bottled Yerba Mate and Bitter Orange there); no sedative beside a true stimulant. He Shou Wu now competes like any herb. Under-18s: no HIGH-caution, psychoactive or above-LOW calming herb, no meadowsweet or willow bark (EMA). `tests/cns-classification-verify.cjs` |
| C2 | Fix it | ✅ Only `safe_pregnancy: true` reaches a pregnant customer. Unknown and false both mean avoid (the old rule also let six herbs marked false through, Chaga among them). Meadowsweet: EMA "not recommended" for lack of data, not known harm — written into its record |
| C3 | "ADHD is fine" | ⚪ kept by Robin's decision |
| C4 | "I don't run a German herbal site, do I?" | ⏳ answered in chat — the duty follows where the business is run from, not the language; decision pending |
| C5 | "teyae as admin is fine" | ⚪ kept by Robin's decision |
| C6 | Only logged-in members write | ✅ page side done; ⏳ **run `supabase-lab-notes-signed-in.sql`** |
| C7 | No fines for fonts | ✅ every font self-hosted (`public/fonts/`, 16 Google families + Fontshare, 1.5 MB); Google/Fontshare removed from 46 files and from the CSP; Stripe's card fields use `/fonts/stripe.css` |
| H1 | Shrink photos, remove unused ones | ✅ 41 unused files deleted (~92 MB); 12 heavy ones recompressed 27 MB → 3.6 MB (portrait 16 MB → 328 KB; hero now WebP). Built site 160 MB → 60 MB. Untracked uploads and the atlas's unmatched photos (catalogue-gap signals) left alone |
| H3 | "Explain more" | answered in chat |
| H4 | Fine as long as products claim nothing | ⚪ kept |
| H5 | Align every herb count | ✅ all say 242; `scripts/sync-herb-counts.cjs` rewrites them on every build, `npm run test:herb-counts` fails if one drifts |
| H6 | SQL sent | ✅ |
| H8 | "What is right visually?" | ✅ pinch-zoom back on 4 pages; double-tap zoom off on the quiz; fields 16px on phones so iOS never jump-zooms |
| H9 | "???" | ✅ supabase-js pinned and self-hosted (`/vendor/supabase-js-2.105.1.js`, the React app's exact build) |
| /health | Suggestions wanted | Sci-Hub advice removed; "HerbMeister" (does not exist) replaced by the EMA herbal monographs; the rest in chat |
| 🟡 | "Medium I do next" | open |

---

## 0 · The verdict on one screen

The foundations are **solid**. The site builds clean the way Netlify builds it
(37 s). Prices cannot be forged — the server prices every basket. The Stripe
webhook checks signatures. No secret key sits anywhere in the code. **Not one
internal link is broken** across 40 pages. 31 of 34 test suites pass, and the
three that do not are old, known, or a date that ran out.

And then there are **seven fires**, each of which could hurt you the day someone
looks closely — a regulator, a competitor's lawyer, a pregnant customer, a
bored stranger with the anon key:

| # | Fire | Why it burns |
|---|---|---|
| 🔴 C1 | **The formula engine can put Ephedra in a customer's bottle** — and 41 other HIGH / VERY HIGH caution herbs | Ephedra herb is prohibited in EU foods. He Shou Wu (liver injury) is one of the 42. |
| 🔴 C2 | **"Unknown in pregnancy" counts as "safe in pregnancy"** | 21 herbs with no pregnancy record reach a customer who ticked *pregnant* — Bladderwrack, Ginkgo, Meadowsweet among them. |
| 🔴 C3 | **A product is named after a disease: "ADHD Support"** | The claims scanner's only BLOCKERs (4). Naming a condition makes a food a *medicine by presentation*. |
| 🔴 C4 | **No imprint, and no postal address anywhere on the site** | A German commercial site without an Impressum is an Abmahnung waiting to be sent. |
| 🔴 C5 | **Someone who has left is still an admin** | `teyae@fungai.art` is hard-coded as admin in five places in shipped code. |
| 🔴 C6 | **Anyone on the internet can write MYCO's "own practice"** | Lab notes and snippets accept inserts without sign-in. MYCO treats lab notes as authoritative and cites them. |
| 🔴 C7 | **Google Fonts are loaded from Google on 29 pages** | German courts have fined exactly this (LG München I, 2022); it sparked a wave of warning letters. |

Seven 🟠 and fourteen 🟡 follow. None of them is on fire; several are heavy
(the landing page references **20.6 MB** of images; one portrait is **16 MB**).

---

## 1 · Fixed today, before and during this audit

| What | Where | Commit |
|---|---|---|
| **Extract doses moved to the 1:3 house strength.** 58 records quoted 1:5-tincture doses; each ml / drop dose is × 0.6 — the *same amount of herb* (0.2 → 0.333 g/ml). Teas, powders, glycerites, fluid extracts, times and weights untouched. The rule is documented on `dosage_range` in `herbs.ts`. | `src/data/herbs.ts` → herbs-data.js, server copy, MYCO KB | `e3d1e6e` |
| **"Biofrequency (MHz)" removed** from /extraction, /health, the Mixology modal and `herb-meta.js` (142 fields), with a footnote on both pages saying why. | 4 files | `e3d1e6e` |
| 🔴→✅ **The PDF library would have died in production.** The site's Content-Security-Policy only allows scripts from `cdn.jsdelivr.net`; `academy-docs.js` loaded pdf.js from `cdnjs.cloudflare.com` — blocked. And the in-page PDF viewer frames Supabase storage, which was not in `frame-src` — blocked. Both worked on localhost (no CSP there) and would have failed live. pdf.js now comes from jsdelivr (both files verified 200); `frame-src` now allows the Supabase host. | `academy-docs.js`, `netlify.toml` | with this file |

---

## 2 · 🔴 Critical

### C1 · The engine can bottle a banned plant

The consumer formula engine (find-your-formula) keeps two kinds of plant out of
a customer's bottle: `RESTRICTED_NAMES` (psilocybe, iboga, kratom, calamus,
thunder god vine…) and "gated" ceremonial plants. **Caution level is not a
filter.** Of the 47 herbs marked HIGH or VERY HIGH in `herbs.ts`, **42 are
eligible** for a customer's bottle:

> Barberry · Blue Lotus · Black Walnut · Calea Zacatachichi · **Ephedra (Ma Huang)
> [VERY HIGH]** · Fadogia [VERY HIGH] · Kava Kava · **Lobelia [VERY HIGH]** ·
> Mucuna · Pau d'Arco · Rhodiola · St. John's Wort · Tongkat Ali · Wormwood ·
> Rhubarb Root · Senna · Amanita Muscaria [VERY HIGH] · Amanita Pantherina
> [VERY HIGH] · Royal Sun Mushroom · Mistletoe · Bakuchi · Guggulu · Kalmegh ·
> Nishoth · Karanja · Feverfew · Black Pepper Extract · Citrus Aurantium Extract ·
> Horse Chestnut Extract · **Red Yeast Rice** · **Yohimbe Bark** · Toothed Clubmoss ·
> Indian Barberry · Goldenseal · Genistein · Garcinia Cambogia Extract ·
> Dan Shen Root Extract · Hedyotis Diffusa · Sophora Root · Phellodendron ·
> Buckthorn Bark · **He Shou Wu / Fo-Ti**

Three of those are regulated in EU food law, not just cautious:
- **Ephedra** herb and preparations are in Annex III **Part A (prohibited)** of
  Regulation 1925/2006, added by Regulation (EU) 2015/403.
- **Yohimbe** bark is in Part C (**under Union scrutiny**), same regulation.
- **Red yeast rice** monacolins are capped at 3 mg/day with mandatory warnings
  (Regulation (EU) 2022/860).

Whether the scorer would ever *choose* them for a given quiz is a matter of
luck, not of rule. (Verify the legal points with a food-law adviser; the code
facts are certain.)

**Fix, one decision, three lines:** keep HIGH and VERY HIGH herbs out of
*consumer* bottles (they stay in the catalogue, atlas, Mixology and the formula
analysis), and add Ephedra to `RESTRICTED_NAMES`. This is also the answer to
He Shou Wu — see §6.

### C2 · "We don't know" is treated as "safe in pregnancy"

84 herbs (35%) have `safe_pregnancy: null`. The engine only removes a herb for
a pregnant customer when its contraindication *text* mentions pregnancy,
lactation or uterine effects. **21 herbs with no pregnancy record and no such
text stay eligible** when a customer ticks *pregnant*:

> Aronia Berry · Astragalus · Barley · **Bladderwrack** [MEDIUM-HIGH, iodine] ·
> Dandelion Root · Cardamom · Cranberry · Iceland Moss · Fennel · **Ginkgo** ·
> Lingonberry · **Meadowsweet** (salicylates) · Spirulina · Shaggy Mane · Enoki ·
> Maitake · Morels · Reishi · **Shatavari** · Dashmool · Rudraksha

**Fix:** for a pregnant customer, `null` means *avoid*. One condition in the
safety filter. Then fill in the 84 records over time.

### C3 · "ADHD Support"

The site's own claims scanner (`scripts/check-claims.cjs`) finds exactly four
BLOCKERs, all the same one: a product **named after a condition** — on the home
page, the shop, and the product page's title and h1. Its explanation: *"the
single strongest medicinal-presentation signal, and 'support' does not
neutralise it."* A food supplement presented as being for a disease is a
medicinal product by presentation under EU law.

**Fix:** rename the product (a name about *focus*, *clarity*, *attention* —
your call) everywhere it appears: `public/home/index.html`,
`public/shop/index.html`, `public/shop/adhd-support/` (slug too, with a
redirect), the server price catalogue, the stock table row, the explorer.

### C4 · No imprint, no address

There is no `/imprint` (Impressum) page, and a search of every page finds **no
postal address** at all. The terms page names Robin Floræsta as the contract
party — correct — but §5 DDG requires name, a *ladungsfähige Anschrift*
(serviceable address), an email and more on any commercial site, and EU
distance-selling rules require the trader's address before a purchase.

**Fix:** a plain `/imprint` page, linked from every footer.
(Fine print is a lawyer's job; the absence is not.)

### C5 · A departed collaborator is still an admin

`teyae@fungai.art` is hard-coded as an admin in shipped code:

| File | What it does |
|---|---|
| `public/community/spore/app-living.jsx` (`KNOWN_ADMIN_EMAILS`, `ADMIN_EMAIL_MAP`) | **forces `admin: true`** for that email on sign-in, and maps it to the Stephanie member record |
| `public/community/spore/data.jsx` | member record `stephanie` with `admin: true` |
| `public/global-nav.js` (`ADMIN_EMAIL_MAP`) | admin banner for that email |
| `public/herbal-engine-2/index.html` | admin check by email |
| `public/sensorium/index.html` | a `mailto:` to that address |

The browser flags only decide what the page *shows*; the database decides what
can be *done*. So the real question is whether her profile still has
`is_admin = true` — §8 gives the one-line check and the one-line revoke. This
was already raised on 2026-09-25 (community audit 2, P3) and is still open.

### C6 · Anyone can write MYCO's knowledge

`lab_notes` and `snippets` have INSERT policies open to **anon** — no sign-in
needed, just the public key that every page carries
(`supabase-lab-notes.sql`, `supabase-lab-notes-sync-fix.sql`,
`supabase-snippets.sql`, `supabase-hardening-round-2.sql`).

That was tolerable when a lab note was a note. It is not tolerable now:
- MYCO retrieves lab notes and is told they are **"our own practice … they
  outrank a general monograph"** (`grounding.cjs`);
- the monthly MYCO email **proposes herb-record edits from them**.

A stranger can insert a "lab note" saying *herb X at N ml is fine with
warfarin* and MYCO will cite it as Fungai Art's bench. The Academy being
members-only does not help — that is a page curtain; the table is open.

**Fix:** INSERT `TO authenticated`, with `author_id` bound to the caller's own
profile; then review the notes that have no author (§8 has the count query).

### C7 · Google Fonts, served by Google

29 pages load `fonts.googleapis.com` / `fonts.gstatic.com` (and 15 load
`api.fontshare.com`). Each visit sends the visitor's IP to Google in the US
before any consent. In January 2022 the Munich regional court (LG München I,
3 O 17493/20) awarded damages for exactly this, and a wave of warning letters
followed across Germany.

**Fix:** self-host the fonts. `public/fonts/` exists and `global-nav.js`
already self-hosts four families — extend that, drop the Google `<link>`s,
remove the hosts from the CSP.

---

## 3 · 🟠 High

### H1 · The weight of the place

| Page | Images referenced | Worst offender |
|---|---|---|
| `/` (home) | **20.6 MB** | `home/team/robin-portrait.jpg` — **16 MB**, one photo (lazy-loaded: it arrives as the visitor scrolls) · `home/abc123.png` 7.6 MB |
| `/shop` | 6.9 MB | |
| `/dinner-experience` | 4.1 MB | |
| each product page | ~2 MB | |

And **54 MB of committed media is referenced by nothing** — 28 files. The
biggest: `home/abcabc.png` 6.7 MB, `amanita123.png` 4.7 MB (twice: root and
`home/`), `home/products/*.jpeg` (2–3 MB each — the pages use the `.webp`
versions; the JPEG originals are leftovers), `dinner-experience/36.png`,
`37.png`, `logo-march.jpg` 2.3 MB, `herbal-engine-2/bottle-bg.jpg.png`.
The built site is **160 MB**.

**Fix:** portrait to ≤ 300 KB WebP; delete (or move out of `public/`) the 28
orphans; target < 3 MB for the home page.

### H2 · Mixology waits for 1.6 MB before it can paint

`/mixology` loads `herbs-data.js` (1.6 MB) **synchronously in `<head>`** — the
page is blank until it arrives. (`/extraction` defers it correctly.) Defer it,
or give Mixology a slim index and fetch a dossier on open (the atlas already
works this way).

### H3 · Opus answers anonymous strangers

Three live paths call **Claude Opus 5** for anyone, signed in or not:

| Endpoint | Limit | Note |
|---|---|---|
| `/api/fyf/compose` | 8 / IP / min | the quiz — intended |
| `/api/formula-analysis` (MYCO's reading) | 6 / IP / min | new today — only on a button |
| `/api/myco-agent` with `mode: 'compose'` | 12 / IP / min | **no page calls it any more** — dead, but open |

All limits are in-memory **per function instance** — a determined script
across IPs is not stopped. **Fix:** delete the dead compose mode; set a hard
monthly spend cap in the Anthropic console (the code comments ask for it);
consider a bot challenge (Turnstile) on the quiz.

### H4 · Medicinal language on the tool pages

The scanner reads the shop; it does not read the tools. By grep:
- `/mixology`: **"anti-cancer adjuvant"**, "cancer adjuvant" (4× in herb
  cards); blend names **"Detox Formula"**, "Liver Intelligence Elixir",
  "Anti-Age Formula", "Purification Extract"; category texts like "Hepatocyte
  protection, Phase I/II detox enzyme induction"; a dose guide.
- `herb-meta.js`: "anti-cancer" 5×.
- `/find-your-formula`: a quiz intention labelled **"Detox & liver"** —
  customer-facing, on the page that sells the bottle; "detoxifies the liver"
  is an unauthorised health claim in the EU.
- Academy: "Kills Parasites" (a TCM action label; scanner WARN).
- `herbs.ts`: brainwave / frequency language in 7 records (Blue Lotus: "shifts
  brainwaves toward theta states (4–8 Hz)"; also Butterbur, Mullein, Muira
  Puama, Saw Palmetto, Arjuna, Genistein) — reaches the atlas and MYCO.

### H5 · Seven different herb counts, none of them right

The catalogue has **242** herbs. The site says:

| Says | Where (visible unless marked) |
|---|---|
| 243 organisms | `/atlas` meta + OG descriptions, the no-JavaScript text; `islands/atlas-hero.js` |
| 212-herb | `/extraction` meta + OG descriptions |
| 203 Botanicals / 199 plants | `/mixology` header and hero; 199 in its meta description |
| 201-herb | `/health` ("Study the 201-herb materia medica") |
| 199 plants / 199 botanicals | `/herbal-engine-2` header and body |
| 207-herb | `/find-your-formula`, `/find-your-formula-pro` — code comments only |
| 168-entry | `/extraction` — code comment only |

**Fix:** let `build:academy`'s counter write every one of them (it already
writes the Academy's), or read `/herb-engine-ids.json` at runtime.

### H6 · SQL still waiting

| File | Until it runs |
|---|---|
| `supabase-myco-threads.sql` (the encrypted version) | MYCO keeps conversations in the browser only (the old plaintext table you ran is dropped by this file) |
| `supabase-academy-docs.sql` | the Academy shows keepers "PDF library not installed" |
| `supabase-restrictions.sql` | restrictions still never reach a member's device |
| `supabase-event-hosts.sql` | Facilitators/Alchemists see Root, but their event saves are refused |

Nothing breaks without them — each feature fails soft — but none of today's
portal work is fully live until they run.

### H7 · Pages that probably should not be live

| Page | State |
|---|---|
| `/herbal-engine-2/` | the retired engine — **in the sitemap**, carries hard-coded admin emails, old claims, its own counts |
| `/find-your-formula-pro/` | linked from nowhere — **in the sitemap**, zoom-locked, a second copy of the quiz |
| `/sensorium/` | an event on **Friday 3 July 2026** (past), Stephanie's email, no cookie banner, orphan |
| `/home/colibri_chaga_cola_builder_v2.html` | a loose builder page, orphan, no description |
| `/health/` | a practitioner/case-notes page — **in the sitemap**; decide whether it belongs |

### H8 · Zoom locked

`maximum-scale=1` / `user-scalable=no` on **/find-your-formula** (the Instagram
landing — phone users), /find-your-formula-pro, /covenant, /mycelium. It blocks
pinch-zoom for people who need it (WCAG 2.1 SC 1.4.4). One attribute each.

### H9 · The Supabase library is unpinned

Every page with sign-in loads `@supabase/supabase-js@2` from jsdelivr — the
*latest* 2.x, whatever that is today. A release changes the site with no
deploy and no test run. Pin an exact version (or vendor it, as React already is).
(Open since the 2026-09-25 audit.)

---

## 4 · 🟡 Medium

- **M1 · Sitemap and robots disagree with reality.** The sitemap lists
  `/herbal-engine-2/` and `/find-your-formula-pro/`, omits `/atlas/` (the one
  page built to be found), and lists both `/` and `/home/` (the same page).
  `robots.txt` says the extraction *teaching* pages are public, then
  disallows `/extraction/` — and a header marks it noindex. Decide which.
- **M2 · Sleepy Sleepy's share preview says €44.** The price is €38
  (`og:description`, `shop/sleepy-sleepy`).
- **M3 · Afghan Saffron's stock row is called "Afghan Saffron ("** — the size is
  added in code, so all three sizes share one stock count and the Admin page
  shows a cut-off name.
- **M4 · Two SECURITY DEFINER functions without a fixed `search_path`:**
  `is_user_banned`, `prune_page_views` (Supabase's own linter flags this).
- **M5 · Uneven chrome.** No cookie banner on 13 pages (atlas, covenant,
  find-your-formula, formula-analysis, moder-jord, mycelium, the dinner
  sub-pages …); no member banner on 9 (atlas, find-your-formula, privacy,
  terms …).
- **M6 · Tests.** `forage-proxies` fails because its fake forecast is
  hard-coded to 5–21 Sept 2026 and "today" fell off the end on the 22nd — a
  time bomb, not a bug; make the dates relative. `fixtures:compare` and
  `shadow` report the same 12 stale baselines as before — re-capture.
- **M7 · The pool parser keeps `\r`** on a Windows checkout — the build output
  depends on line endings. Netlify (Linux) is unaffected; normalise anyway.
- **M8 · Near-duplicates in the catalogue:** Elderberry (216) and Elderberry
  (Cooked Berry, 543) are two records for one berry; Grape ×3 and Sophora ×2
  share binomials by design (parts / isolates) — check the Elderberry pair.
- **M9 · The old React app still ships** (`/app.html`) — and on load it
  *replaces* `fungai_formulas` with its own cloud list, erasing Mixology's
  local saves on that browser.
- **M10 · Dead portal modules still ship:** `spore/app.jsx`,
  `tracker-app.jsx`, `tracker-data.jsx`, `network-map.jsx`, `styles.css`,
  `styles-tracker.css` (~120 KB, compiled every build).
- **M11 · "Coming soon"** ×3 on Moder Jord, ×1 on the shop.
- **M12 · 9 atlas photographs are not committed** (amla, cardamom, cloves,
  garlic, ginkgo, moringa, neem, st-johnswort, wormwood). Locally the atlas
  shows 17 portraits; live it shows 8. Commit them to publish them.
- **M13 · Every request passes an edge function** (`ip-block`) that consults
  Supabase (cached 60 s) — a small latency cost and a dependency on every page.
- **M14 · Portal debt carried forward** (community audit 2): the member list
  stops at 1,000 profiles (B1); `profiles` has no migration (B3); the server
  could forge a DM — nothing signs them (D3); no Realtime (DMs poll).

---

## 5 · ⚪ What came back clean

- **0 broken internal links** across 40 pages and every script that builds links.
- **Clean build passes** — a fresh checkout of `e3d1e6e`, `npm run build`, 37 s,
  exit 0. The committed generated files match what a Linux build produces.
- **No secrets in code.** The only keys anywhere are Supabase **anon** keys
  (public by design, role checked by decoding every JWT found).
- **Payments:** server-side price catalogue (the client cannot set a price);
  Stripe webhook verifies `stripe-signature`.
- **Prices agree** across `/shop`, the ten product pages and the server
  catalogue — all 20 products.
- **Security headers:** HSTS, CSP, nosniff, Referrer-Policy, Permissions-Policy
  on every page; noindex on the private surfaces.
- **RLS is enabled** on every table the SQL files create.
- **Every inline script on every page parses.**
- **Git** passes a connectivity check; 16 orphan pack indexes and some dangling
  objects are leftovers a `git gc` would tidy.
- **Foraging proxies** (GBIF, iNaturalist, Open-Meteo) sit behind a shared
  origin check + rate limit (`src/server/proxy-guard.mjs`).
- **31 of 34 test suites pass** — including safety rules, MYCO adversarial,
  claims, DM crypto, the fairy ring and the new formula analysis.

---

## 6 · He Shou Wu, in plain words

The formula engine keeps a list of *stimulating* plants and allows at most two
in one bottle. To decide whether a plant is a stimulant it searches the plant's
description for the names on that list — one of them is **"mate"**, as in yerba
mate.

But "mate" also sits inside the word **"glutamate"** — which appears in many
plant descriptions. So nine plants that are *not* stimulants are counted as
stimulants: Lavender, St. John's Wort, Amanita, Psilocybe, Rowan Berry,
Jiaogulan, Cistanche, Toothed Clubmoss, and **He Shou Wu**.

That mistake has a side effect: because He Shou Wu counts as a "stimulant",
energy formulas already full of real stimulants never get it. **The bug has
been quietly protecting customers** — He Shou Wu is caution HIGH, with
documented cases of liver injury.

Fixing the word bug is one line. But the moment it is fixed, He Shou Wu can be
chosen again (the engine's own test profile for energy picks it straight away).
So the bug cannot be fixed on its own. The real problem is C1: **the engine
lets HIGH-caution herbs into customer bottles at all.**

**Recommendation — one "yes" does all three:**
1. fix the word match (whole names only);
2. keep HIGH and VERY HIGH herbs out of customer bottles — they stay visible
   in the atlas, Mixology and the formula analysis;
3. add Ephedra to the never-in-a-bottle list.

---

## 7 · Before you push

- [ ] Decide C1 + §6 (one yes), C2 (one yes), C3 (a new name).
- [ ] Run the four SQL files in §3 H6 (any order).
- [ ] Revoke the departed admin in the database (§8, query 3).
- [ ] Optional but cheap: commit the 9 atlas photos (M12).
- [ ] On Netlify: `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` set
      (both already used by live functions, so probably yes); an Anthropic
      **spend cap** (H3).
- [ ] Test on localhost:5173 — /extraction (grid, lexicon, footnote),
      /mixology (all plants, Full analysis + MYCO), /formula-analysis (swap a
      herb), the Academy (preview signed out; library, lexicon signed in),
      the formula book (one card per formula).
- Commits waiting on `main`: `2da158a`, `20d16e3`, `cacccdf`, `e3d1e6e`, and
  the one carrying this file. The build is known to pass.

---

## 8 · Check the live database yourself

The audit tried to read the live tables with the public key (exactly what any
visitor can do) and the permission system stopped it — so the live state is
unverified. These run in Supabase → SQL Editor and change nothing except #4:

```sql
-- 1 · Is RLS on for every table?
SELECT c.relname AS table_name, c.relrowsecurity AS rls_on
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relrowsecurity, c.relname;

-- 2 · Which policies let the public write?
SELECT tablename, policyname, cmd, roles, with_check
FROM pg_policies
WHERE schemaname = 'public' AND cmd <> 'SELECT'
  AND (roles && ARRAY['anon','public']::name[] OR with_check = 'true')
ORDER BY tablename;

-- 3 · Who is an admin right now?
SELECT character_name, contact, rank, is_admin
FROM public.profiles WHERE is_admin = true;

-- 4 · Revoke the departed admin (and her host rank) — ONLY if 3 shows her
UPDATE public.profiles SET is_admin = false, rank = 'palawan'
WHERE contact = 'teyae@fungai.art';

-- 5 · Which of today's SQL files have run?
SELECT to_regclass('public.myco_threads')   AS myco_threads,
       (SELECT count(*) FROM information_schema.columns
         WHERE table_schema='public' AND table_name='myco_threads' AND column_name='ciphertext') AS threads_encrypted,
       to_regclass('public.academy_docs')   AS academy_docs,
       (SELECT count(*) FROM information_schema.columns
         WHERE table_schema='public' AND table_name='profiles' AND column_name='restrictions') AS restrictions_column,
       (SELECT count(*) FROM pg_proc WHERE proname='fa_can_host_events') AS event_hosts;

-- 6 · How many lab notes were written without an author (C6)?
SELECT count(*) FILTER (WHERE author_id IS NULL) AS anonymous_notes,
       count(*) AS all_notes
FROM public.lab_notes;
```

---

## 9 · What this audit did not cover

- **The live database** — blocked (above). Everything about RLS is from the
  SQL files, not from the running project.
- **A real browser** — no rendering, console errors, layout at 360 / 768 /
  1440, contrast, screen readers or Core Web Vitals were measured. Page weights
  are summed from referenced files, not from a network trace.
- **Real payments and real email** — the Stripe and Resend paths were read,
  not exercised.
- **Legal advice** — the legal points (C1, C3, C4, C7) are where to look,
  from the code; the conclusions belong to a lawyer.

---

## 10 · Numbers

| | |
|---|---|
| Pages (HTML in `public/`) | 40 |
| Netlify functions / edge functions | 23 / 1 |
| SQL files / tables they create | 44 / 31 |
| Test suites / passing | 34 / 31 |
| Clean build | 37 s, exit 0 |
| Built site | 160 MB |
| Committed media referenced by nothing | 28 files, 54.1 MB |
| Largest single image in use | 16 MB (`robin-portrait.jpg`) |
| Pages loading Google Fonts / Fontshare | 29 / 15 |
| Claims scan | 4 BLOCKER · 1 WARN · 17 NOTE |
| Herbs | 242 |
| … caution HIGH + VERY HIGH / eligible for a customer bottle | 47 / 42 |
| … pregnancy unknown / reachable when pregnant | 84 / 21 |
| Internal links checked / broken | every `href`/`src`/`action` on 40 pages + scripts / 0 |
| Commits ahead of GitHub | 5 (with this file) |

---

## 11 · How it was measured

- **Pages:** a script walked every HTML file in `public/` — title, description,
  robots, canonical, `lang`, viewport, `h1`, images without `alt`, every
  `href`/`src`/`action`, external hosts, and a syntax check of every inline
  script; links were resolved against files, `netlify.toml` redirects and the
  function list.
- **CSP:** hosts found in HTML *and* JS compared with the policy in
  `netlify.toml` — which is how the pdf.js / Supabase-frame problem surfaced.
- **Security:** secret patterns (Stripe, Resend, Anthropic, AWS, private keys)
  across the repo; every JWT decoded for its role; hard-coded admin identities;
  each function read for origin checks, rate limits, auth, service-role use and
  model calls.
- **Money:** prices extracted from `/shop`, the product pages and the server
  catalogue and compared; webhook signature code read.
- **Database:** all 44 SQL files parsed for tables, RLS, write policies,
  anon/public grants, SECURITY DEFINER hygiene.
- **Claims:** `node scripts/check-claims.cjs`, plus targeted greps on the pages
  it does not read.
- **Herbs:** the server copy of `herbs.ts` read field by field; the consumer
  pool and pregnancy filter checked with the engine's own functions.
- **Build:** a fresh `git worktree` of `e3d1e6e`, Netlify's environment
  variables, `npm run build`; generated files diffed against the committed ones.
- **Tests:** all 34 `test:*` suites.
- **Git:** `git fsck --connectivity-only`, ahead/behind.
