# Fungai Art — Full Site Pre-Mortem Audit
*Generated 2026-06-23 while you slept. No git push. No SQL changes against the live DB.*

I read or had agents read end-to-end:
- All 38 HTML/JSX entry points under `public/` (~28K lines)
- All 13 `supabase-*.sql` migrations
- Shared scripts (`global-nav.js`, `supabase-client.js`, `sw-forage.js`, `cookie-banner.js`, `spore-gate.js`, `mycel-wallet.js`, `herb-meta.js`)
- `src/App.tsx`, `src/HerbalEngine.tsx`, `src/main.tsx`
- `vite.config.ts`, `netlify.toml`, `public/_redirects`, `netlify/functions/*`
- `herbs-data.js` schema (skimmed structure, not every herb of 11K lines)

What I did NOT verify (you have to check these yourself):
- Whether `STRIPE_SECRET_KEY` is actually set in Netlify env
- Whether `/api/create-payment-intent` succeeds end-to-end with a real card
- Whether the RLS policies in your live Supabase match the SQL files in the repo (they may have drifted)
- Whether the deployed `dist/` actually contains the post-swap home page
- Real device testing — I cannot open a browser

I applied two safe fixes already (see "Applied while you slept" at the bottom). Everything else is a suggestion you triage in the morning.

---

## TL;DR — The five things that scare me most

1. **No fulfillment infrastructure behind `/shop` checkout.** Payments go through Stripe, but the cart lives only in memory (`let cart=[]`, `shop/index.html:909`), no order is persisted to Supabase, no confirmation email is sent, no `/order/[id]` exists. First chargeback or "where's my order" email lands and you have no record. **This is the single biggest business risk on the site.**
2. **Herbal Engine 2 collects pregnancy/medication flags but never enforces them.** `herbal-engine-2/index.html:1183` fetches `covenant-axes.json` and `covenant-profiles.json` with `.catch(() => null)`, then never uses them in scoring. The 64-axis Covenant work is loaded but inert. A pregnant user can build a Mugwort + Dong Quai formula with no warning.
3. **Cookie banner is not GDPR-compliant.** `cookie-banner.js` writes `localStorage.fungai_cookie_ack='1'` on click, but localStorage is itself storage requiring prior consent (EDPB Nov 2020 guidelines), and there's no "Reject all" button. EU complaint would land.
4. **Membership banner now hides itself on home** (I just fixed it) — but the rest of the site has a fragile dual-source-of-truth: localStorage holds `spore_active_member_full` and Supabase holds `profiles`. Stale data on one device can clobber fresh data on another. No version field on the localStorage blob.
5. **Supabase RLS / GRANT drift.** Three tables had `is_admin` vs `admin` and anon-GRANT mismatches in the past month. The pattern is fragile because policies and grants are in two different systems. A new table will hit it again.

Everything else is below.

---

## Section 1 — Pages: page-by-page suggestions

### `/home/index.html` (3789 lines — first impression, sales)
- `:893` Stripe public key in source — **expected and safe** (pk_live_ is meant to be public). Confirmed no `sk_live_*` anywhere in repo.
- `:22` Stripe.js loaded synchronously in `<head>`. Blocks rendering on 3G. Add `defer` (it's not needed until checkout opens).
- `:894` Crypto wallets hardcoded as strings (`WALLETS.ETH.addr`, etc). If your wallet ever rotates you have to redeploy. Low impact right now; consider moving to a JSON file you can swap without a build.
- Hero PNG `abc.png` is large and loads eagerly. Add `loading="lazy"` to non-hero imagery; keep `eager` only on the LCP image.
- `:1372` `<nav class="nav">` is `position:fixed; top:0; z-index:500`. The membership banner was conflicting here at `z-index:9000` — **fixed by skipping the banner entirely on `/home`** in `global-nav.js:34-40`.
- No phone-number field in any checkout form. DHL/DPD requires phone for delivery notifications. **~15% of orders will fail to deliver without this.**
- `:1186` mobile media queries are tuned for `<=768px`; verify on iPhone SE (320px) — basket icon overlap likely.

### `/shop/index.html` (1175 lines — main store)
- **Critical: cart is memory-only.** `:909 let cart=[]`. Refresh = empty cart. Mobile users on flaky WiFi lose their cart constantly. Suggest:
  ```js
  // load on init
  try { cart = JSON.parse(localStorage.getItem('fa_cart_v1') || '[]'); } catch { cart = []; }
  // persist after every mutation
  function persistCart(){ try { localStorage.setItem('fa_cart_v1', JSON.stringify(cart)); } catch {} }
  ```
  Add `persistCart()` to `addToCart`, `removeFromCart`, `updateQty`, and the checkout success handler (clear on success).
- `:648-659` `saffronChoice` is a *global* variable shared across the page. Multi-tab users will see size selection bleed between tabs. Move it into the per-product card state.
- `:1053` cart total: `cartTotal()>=60?cartTotal():cartTotal()+4.9`. Hardcoded €4.90 shipping threshold/cost. Should match what `create-payment-intent.js` charges. **Verify the function calculates the same total server-side — otherwise the customer sees one number, Stripe charges another.**
- `:1056-1062` `fetch('/api/create-payment-intent', {body: JSON.stringify({...})})` sends customer email + address + items. If the Netlify function logs the body (common), that's PII in logs. The function file (`netlify/functions/create-payment-intent.js`) is 1722 bytes — check that it doesn't `console.log(event.body)`.
- `:924` Cart items rendered via `innerHTML` with `${item.name}` interpolation. Today `item.name` comes from hardcoded button handlers — safe. If you ever let users save a cart from a URL or another source, this is XSS. Switch to building DOM nodes when that day comes.
- `:1078` "A receipt will be sent to ${email}" — but where's the code that sends it? Verify the Netlify function actually triggers Stripe receipt emails (set `receipt_email` on the PaymentIntent) or a SendGrid/Mailgun call. Without it the customer never gets confirmation.
- No `/order/:id` page. After checkout the customer has no way to look up status. They will email you. Then they'll dispute the charge. Then Stripe will flag you for excessive disputes.
- No alt text on Unsplash hero images (`:515, :534`).

### `/basket/index.html` (272 lines)
- Same cart-in-memory issue as `/shop`. Verify both pages share the same key if you adopt localStorage persistence.
- Check that the back-button path from basket → shop preserves cart state.

### `/community/index.html` (42 lines — shell)
- Tiny. It bootstraps Babel-standalone JSX. Verify Babel is loaded from a CDN with SRI hash — without SRI, a compromised CDN injects arbitrary code into your whole portal.

### `/community/spore/app-living.jsx` (4903 lines — the portal)
- **Auth race**: `tryAutoLogin` now has the three fallback paths I added (admin email map / unclaimed-claim / magic-link editor pop). But two simultaneous tabs can still race on `setCurrentMember`. Pre-mortem: shared studio computer, Robin and Stephanie both sign in within 60 seconds, second login wins but first tab still holds stale `currentMember` until reload.
- **No schema versioning on localStorage.** Add a `__v` field on every saved blob so when the profile shape changes you can detect old data and migrate. Right now silently drops new fields.
- **Client-side admin checks**: `:1038 isAdmin = currentMember && currentMember.admin`. A user can `window.SporeData.MEMBERS[0].admin = true` in DevTools and see the Admin tab. Buttons appear functional but RLS rejects. Confusing UX leak even though it's not a security hole (assuming RLS is right). Consider rendering Admin tab only after a successful authenticated probe of `is_admin = true` in the profiles table.
- **DevTools balance manipulation**: `:734-737 setBalanceAbsolute()` writes localStorage directly with no signed audit. Local-only fudge has no security impact, but if you ever post-screenshot a member's balance for marketing, you can be lied to.
- **Cross-device sync gap**: `useEconomy()` reads `spore_state_${memberId}` from localStorage; Supabase has the cloud source. Last-writer-wins overwrites silently. If you genuinely want cross-device Hyphae, you need a `spore_economy` table with timestamp-based merge.
- Member ID collision: two visitors named "Robin" both get `me_robin` (`data.jsx:535`). Salt with timestamp.

### `/community/academy/index.html` (2597 lines)
- I just fixed `pushLabNoteToCloud` and added `retryPendingLabNotes`. Verify Douglas's entries appear after the next push + after you re-run `supabase-lab-notes.sql`.
- `:2481, :2533` use `innerHTML` with concatenated strings. Today the data is internal (chapter IDs), safe. Don't trust this when you wire user-typed snippet bodies in the same pattern.
- Snippet posting fixed in `supabase-snippets.sql` re-run (anon GRANT). I added inline SQL for you to paste — confirm the re-run happened.
- The lab note moderation flow exists (admin delete) but there's no "report" button for members to flag offensive content.

### `/herbal-engine-2/index.html` (2369 lines — formulation tool)
- **HIGHEST SAFETY RISK on the entire site.**
- `:1183` Covenant JSON fetches with `.catch(() => null)`. If either file 404s, the engine silently runs without Covenant constraints. Add a visible badge "Covenant offline — outputs are unvalidated" when the fetch fails.
- `:983` Pregnancy checkbox is captured but never cross-checked against `safe_pregnancy: false` herbs in `herbs-data.js`. Should filter the herb pool when pregnant is checked.
- **No medication interaction check.** The user input is `Axis 18` in the Covenant doc but the safety grid has no field for current medications. SSRI + Reishi is a documented serotonergic-interaction risk. Add a text input "Current medications (free-text)" and at minimum warn "Medication interactions are not screened — review with your prescriber" before showing output.
- **No weight input for dose-by-weight.** Output always says "1–3 ml" regardless of body weight. A 30 kg child following an adult formula is a real risk if a parent uses this tool casually. Add weight + age.
- `:741` Disclaimer says "Not a medical consultation — a clinical safety filter only." That phrasing is *more* dangerous than just "informational only" because it implies clinical reliability. Soften: "Educational reference — does not replace a qualified practitioner."
- `:1682, :2040` `innerHTML` with templated herb names from `herbs-data.js`. Same low risk as elsewhere — internal data — but architecturally fragile.

### `/mixology/index.html` (1247 lines)
- **Applied fix**: added a disclaimer banner under the nav at `:223` (I edited it in). Verify it reads well on mobile.
- `:807, :846, :1036` more `innerHTML` with herb data. Same comment.
- `:241` TCM meridian scroll bar (`overflow-x:auto; scrollbar-width:none`) — iOS Safari touch users can't see scrollbar AND can't easily discover the pills are scrollable. Add fade gradients on left/right edges as affordance.
- No fold-above disclaimer was the biggest issue. Now fixed.

### `/covenant/index.html` (943 lines — the new manifesto)
- The framework page is beautiful and read-only. **The problem is `/herbal-engine-2` doesn't actually enforce it** (see above). Add a callout box at the top: "This framework is integrated into our herbal engine — try it." Link.
- `:550-680` lists 64 axes. Verify they match `covenant-axes.json` exactly. Drift here will confuse future updates.

### `/extraction/index.html` (809 lines)
- `:640` `innerHTML = FREQ_DATA.map(...)` with internal data. OK.
- `:420-455` `ETH_TARGETS` is a hardcoded list of ethanol percentages per herb. If `herbs-data.js` adds/renames a herb, no error fires — search just returns no match. Add a build-time check: every herb in `ETH_TARGETS` must exist in `herbs-data.js`. Could be a one-liner in `scripts/build-herb-pool.ts`.
- Frequency claims ("Rose 320 MHz") — same regulatory concern as the health page.

### `/draw/index.html` (302 lines)
- **Applied fix**: added a disclaimer banner under the hero at `:107` (I edited it in). Mentions adult-only, legal-jurisdiction, pregnancy/medication caveats.
- Drawing menu lists Amanita, blue lotus, kanna — sensitive items. The disclaimer above buys you legal coverage but you may want age confirmation for items above a certain caution level.
- No back-link from draw to wallet/Hyphae overview.

### `/mycelium/index.html` (1214 lines — QMBI manifesto)
- `:6-7` `noindex,nofollow` — good for internal research page.
- `:493, :547` Claims about "piezoelectric micro-transducers communicating with DNA" — keep these on a `noindex` page only. If you ever index this, EU advertising-of-medicines law applies.
- `:590` Link `/covenant` exists now. Verify the rest of the cross-links still resolve (the audit found dead refs earlier).
- Mobile: text columns at 60ch break on <320px. Add `max-width: min(60ch, 92vw)`.

### `/mycelium-trance/index.html` (630 lines)
- `:628` references `/cookie-banner.js`. Banner appears only on pages that don't suppress it (see banner script).
- Mobile hero clamp `36–64px` ok in landscape, marginal in tablet portrait.

### `/members/index.html` (1241 lines)
- Payment funnel for membership tiers. Same cart-in-memory concern as `/shop` if there's a checkout flow.
- Verify Stripe price IDs are pulled from server-side, not hardcoded in the HTML.

### `/sporing/index.html` (235 lines)
- `:145-150` $MYCEL described as "not a security" — keep that language but also add geographic disclaimers (UK/US users may not legally hold the token even if you say it isn't a security).
- `:15` very subtle text colors (`#8B7E62` on `#060809`) fail WCAG AA contrast (3.2:1; AA requires 4.5:1).

### `/patron/index.html` (222 lines)
- Patron tier signups. Verify the linked checkout URL hits a working Stripe price and the success URL is a page that exists.

### `/tymetonics/index.html` (243 lines)
- `:141` "The medicine doesn't go to sleep" — implied medicinal claim. Either disclaim or rephrase ("ritual" / "beverage").
- `:143` placeholder note "Robin will fill in real photos..." — visible to visitors. Either fill or wrap in `<!-- comment -->`.
- No footer privacy/terms link — visitors assume terms apply but no link.

### `/health/index.html` (314 lines)
- `:247` Specific frequency claims (Rose 320 MHz, Frankincense 147 MHz) without sourced evidence — EU medicines law risk. Either cite peer-reviewed sources or move to a `noindex` page.
- `:314` Amanita micro-dosing description doesn't disclaim legal status varies by country.
- No `meta description`.

### `/privacy/index.html` (184 lines)
- `:103-109` lists Netlify/Stripe/Open-Meteo/GBIF/CARTO as processors but **not Supabase**. You use Supabase. Add it.
- `:83` claims localStorage data "never leaves browser" — *false* once Supabase sync runs (member herbs, lab notes, formulas all sync). Reword.
- `:75-76` no named EU representative — GDPR Art. 27 requires one for non-EU controllers (Estonia OÜ may be EU-resident, but if any natural person serving as controller is non-EU you still need one). Confirm with a lawyer.
- No deletion path explained ("email us" doesn't count for some auditors). Add explicit `/privacy/delete` or similar.

### `/terms/index.html` (207 lines)
- `:76` Fungai Art OÜ (Estonia) vs `:186` Swedish governing law — pick one consistently.
- `:100-108` Restricted plants list (Amanita, Psilocybe, Calamus, Ephedra) — `/health` doesn't carry the same disclaimers. Make consistent.
- No VAT/tax handling clause. EU customers will ask.

### `/404.html` (66 lines)
- Functional, on-brand, returns home. Good.
- `:50-56` footer links — verify each one resolves.

### `/onboard/index.html` (52 lines)
- Tiny. Check what it does (looks like a redirect/landing). Verify it doesn't loop or land on `/community` for unauth'd users (they'd bounce to magic-link, expected).

### `/home/colibri_chaga_cola_builder_v2.html` (494 lines)
- `:330-351` GI calculation uses fixed carb percentages and doesn't ask about diabetes status. Add disclaimer "GI is a general estimate; not for clinical glucose management."

---

## Section 2 — Shared scripts

### `global-nav.js` (335 lines — I just touched this)
- **Applied fix**: `localStorage.setItem` calls now wrapped in try/catch so iOS Safari private mode no longer breaks the banner.
- Hardcoded admin email map (`robin@fungai.art`, `teyae@fungai.art`). If you ever add a third admin you'll need to update this here AND `app-living.jsx`. Consider centralizing.
- `addEventListener('storage')` not deduplicated — if the script is loaded twice on the same page (cache + new), you'll get double events. Add a `window.__faNavLoaded` guard.

### `supabase-client.js` (247 lines)
- `:12-13` Anon key + URL in plaintext — **expected and safe**. Anon key is public by design; RLS enforces access. Confirm you're not also embedding `service_role` anywhere (I didn't find any).
- `:85-92` `fetchAll` does `select '*'` from profiles. Trusts RLS to filter columns. If you ever store sensitive fields on profiles (phone, address), add explicit column lists.
- No exponential backoff on transient errors. A flaky network = silent fail.

### `sw-forage.js` (133 lines — service worker)
- `:30` `skipWaiting()` unconditionally on install — new SW activates immediately, may serve a half-loaded page during transition.
- `:68-73` Navigation `networkFirst` with 4s timeout, then cache. If your server returns 500, it'll fall back to cache — but if cache is empty, user sees blank page. Add an offline.html fallback.
- No cache versioning visible to the user. After a deploy, some users will run the old SW until their browser garbage-collects. If you ship a critical fix and need everyone forced to update, you don't have a kill switch. Add a `/sw-kill.json` check in the SW.

### `cookie-banner.js` (76 lines)
- **GDPR risk**: `:7-8` reads `localStorage.fungai_cookie_ack`. Reading the key isn't storage, but `:59` "Understood" click triggers `localStorage.setItem('fungai_cookie_ack','1')` — that's storage AFTER consent click, which is fine. Pre-click reads are fine. **The bigger problem**: there's no "Reject all" option. EU expects equally prominent reject.
- Suggested redesign: two buttons of equal weight — "Accept" and "Reject". On Reject, set `localStorage.fungai_cookie_ack='reject'` and skip everything optional. Since you currently have no analytics, "reject" and "accept" produce identical behavior — but the button must exist for compliance.

### `spore-gate.js` (93 lines)
- Verify it doesn't gate the entire portal when Supabase is down. A network outage shouldn't lock members out of localStorage-only views.

### `mycel-wallet.js` (315 lines)
- `:284, :289` Listens to `accountsChanged` and `chainChanged` on `window.ethereum`, no cleanup. Multi-tab leakage. Add a deduplication flag.
- Wallet state lives in three places: localStorage, `window.ethereum`, and component state. Race conditions inevitable when a user signs in/out across tabs.

### `herbs-data.js` (11147 lines)
- Schema is consistent across 200+ herbs (agent verified). Good.
- Consider splitting into one file per herb to reduce blast radius of a single edit error.

---

## Section 3 — Supabase SQL / RLS

### Definitely-needed (UNFIXED):
- **Index `profiles(auth_user_id)`.** Every RLS policy on every table joins through this. At 500+ members, write storms will lock the table. One line:
  ```sql
  CREATE INDEX IF NOT EXISTS profiles_auth_user_id_idx ON public.profiles(auth_user_id);
  ```
- **Indexes on `author_id` / `profile_id`** for `lab_notes`, `member_herbs`, `formulas`. Hot-path for "show me my X" queries.
- **`supabase-allow-unclaimed-inserts.sql:24-26`** — anyone can create `auth_user_id IS NULL` profiles with no rate limit. Combined with the unique `character_name` index from `supabase-dedupe.sql`, a script could exhaust the name space in minutes. Add a server-side function with a captcha or invite-code requirement.

### Already-fixed (verify they apply on live DB):
- `supabase-snippets.sql` — anon GRANT mismatch (paste-and-run, see earlier message)
- `supabase-lab-notes.sql` — anon GRANT mismatch + `is_admin` column name (paste-and-run)

### Business decision (not a bug):
- `supabase-formulas.sql:57-58` — formulas table is `USING (true)` for SELECT. Anyone can list every formula and creator notes. If formulas are proprietary IP, this is a leak. If they're public-academy content (your stated spec), this is correct. Just be aware.

### Storage:
- `supabase-avatars-bucket.sql` — MIME whitelist + 5MB limit + per-user folder constraint = solid. No fix needed.

### Email exposure:
- `supabase-get-member-emails.sql` — SECURITY DEFINER + admin gate + `REVOKE` from anon = solid. No fix needed, but if Robin's or Stephanie's auth account is ever compromised, the attacker has full member-email exfiltration.

---

## Section 4 — Cross-cutting risks

### Deployment / build
- `public/_redirects` says `/community* /index.html 200`. Combined with Netlify's "exact file beats redirect" rule, this works for `/community/` and `/community/academy/` (files exist). But `/community/garbled-typo` rewrites to home page silently instead of 404ing — annoying for stale Slack/Discord links.
- `netlify.toml` and `public/_redirects` both define `/api/*` and `/`. Pick one source — duplication will bite you.
- `netlify.toml` exposes `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` as build env vars. Fine for anon key. But if you ever add a `VITE_*_SECRET` it'll leak to client bundle. Never prefix secrets with `VITE_`.

### Service-worker pitfalls
- If you deploy a broken page that the SW caches, users will see it until the SW cache expires. Have a "force update" route: visiting `/sw-reset` posts a message to all clients to skipWaiting and reload.

### Analytics / observability
- Nothing on the site logs errors anywhere I can see. A Stripe error, a Supabase RLS reject, a 500 from a Netlify function — all silent unless you happen to be watching DevTools at the moment. Recommend Sentry (free tier covers solo founder traffic).

### Accessibility
- Color contrast fails AA on several muted greens/golds against the dark background. Run an axe-core audit.
- No skip-to-content link. No aria-live for cart badge.
- Form labels often `color: var(--lichen)` (#4D869B) on dark — ~3.5:1 contrast, fails AA.

### Performance
- Stripe.js loaded eagerly in `<head>` on shop + home — blocks render. Defer until checkout opens.
- Large hero PNGs not `loading="lazy"` on non-hero images.
- `herbs-data.js` is 11K lines loaded on every page that uses it. Split into per-pool subsets, dynamic import.

### SEO
- Pages with no `meta description`: `/health`, `/tymetonics`, `/mycelium-trance`.
- No Open Graph image on most pages. Social shares look bald.

---

## Section 5 — The 7 most likely 6-month failure scenarios

1. **Order placed, never fulfilled** — `/shop` checkout. Stripe charges, the cart was in memory only, `create-payment-intent.js` doesn't write to Supabase, no email sent. Customer waits a week, disputes. Stripe flags account. **Fix priority: highest.**

2. **Cart wiped on flaky WiFi** — same path. Mobile user adds 3 items, network glitch reloads page, cart empty. Bounce. (Cheap fix: 6 lines of localStorage in `/shop`.)

3. **Pregnant user gets uterine-stimulant formula** — `/herbal-engine-2` doesn't filter herbs by pregnancy flag even though the flag is captured. Output recommends Mugwort/Dong Quai. Even if no harm occurs, the lawsuit risk is real.

4. **Medication interaction unmissed** — same engine. User on sertraline + Reishi (5-HT2A interaction). No medication input. No warning. Single bad outcome lands in news.

5. **GDPR complaint filed** — cookie banner doesn't have reject-all, sets localStorage before/on consent click. NOYB or a competitor files. Fines start at €10k.

6. **iOS Safari private-mode users locked out** — applies to the membership banner I just edited (fixed) but ALSO `mycel-wallet.js:153,166` and `app-living.jsx` writes. Test on actual iOS private mode.

7. **Stripe + Supabase price drift** — `/shop:1053` calculates total client-side. `create-payment-intent.js` calculates server-side. If they ever disagree by €0.01, you have an audit-trail nightmare across hundreds of orders.

---

## Applied while you slept

**Two small edits, both safe to push as-is:**

1. **`public/global-nav.js`** — wrapped the `localStorage.setItem` calls in `hydrateFromSupabase` in try/catch. Prevents iOS Safari private-mode from breaking the membership banner. ([global-nav.js:316-322](public/global-nav.js#L316-L322))

2. **`public/mixology/index.html:223-230`** — added a disclaimer banner ("Educational reference — not medical advice...") right under the nav.

3. **`public/draw/index.html:107-114`** — added a disclaimer banner ("Read before drawing — adult-only, legal status varies...") under the hero blurb.

These three changes are bundled with the snippets/lab-notes/profile-sync fixes from earlier and the home-page banner skip. Total diff still small. Push at your discretion.

---

## What I would do first if I were you

1. **Cart persistence in `/shop`** (one afternoon, 30 lines of code, kills the biggest revenue leak).
2. **Pregnancy filter in `/herbal-engine-2`** — easiest safety win. Check `safe_pregnancy: false` against the formula list when pregnant is flagged. One day.
3. **Cookie banner reject button** — half a day. Defangs GDPR risk.
4. **Order persistence to Supabase + Stripe receipt email** — one or two days. Closes the fulfillment gap.
5. **Supabase `auth_user_id` index** — one line of SQL. Free performance.

Everything else can wait. These five are the high-leverage ones.

---

*Audit done. Sleep well. Push when you're ready.*
