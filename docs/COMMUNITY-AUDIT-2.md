# /community — audit 2 · 2026-09-25, evening

The second full pass over the member portal, after one day of large changes:
the fairy ring became the navigation, and the portal gained a Dashboard, guest
lists, encrypted DMs, keeper tools and an Event manager. It builds on
[COMMUNITY-AUDIT.md](COMMUNITY-AUDIT.md) from the same morning, and §1 reports
the status of every finding in that one. Every number here comes from a
command; §7 lists them.

---

> **Update, later the same evening**
> - **P1 closed in code:** nothing writes a login email into a profile any
>   more — including `claimSeededProfile`, a third write found after this
>   audit. A signed-out visitor now reads only public columns
>   (`PUBLIC_PROFILE_COLS`). `supabase-profiles-privacy.sql` now also
>   revokes everything else from `anon`. Once it has run, emails cannot be
>   read from outside at all.
> - **P3 decided:** Steph stays an admin (Robin).
> - **P4 gone:** the Gift $H form was removed. The $H economy is parked.
> - **Ranks replaced the reputation ladder** (Robin): Palawan (everyone) ·
>   Patron (paid) · Facilitator · Alchemist · Founder (Robin), set only by
>   keepers, in `profiles.rank`. Admin is a flag, not a rank. The profile
>   editor no longer offers those words as a persona.

## 0 · The short version

**One serious problem.** 🔴 **Members' email addresses are readable by anyone on
the internet.** `public.profiles` answers to the anon key, which is in every
page of the site. Checked with that key alone, signed out: all 12 profiles,
with `email` filled in 8 of them and a login email sitting in `contact` in 2
more. The portal itself put them there: it wrote each member's login email
into both columns on sign-in. The client stopped doing that today (§2 · P1). The
emails already stored come out when `supabase-profiles-privacy.sql` runs —
**run that one first.**

**Fixed during this audit**

| | fix |
|---|---|
| P1 | the portal no longer writes login emails into `profiles.email` or `contact` |
| bug | the admin **Gift $H** form threw `ReferenceError: onToast` after every gift |
| bug | "Newest hyphae" on the Dashboard was always empty — the live table calls the column `joined`, the code read `created_at`; the duplicate-profile tiebreak had the same mismatch (`updated`) |
| a11y | the DM inbox did not close on Escape |

**Everything new depends on SQL that has not run yet.** Until it does, each
feature falls back quietly: the calendar shows the built-in list, the Dashboard
its built-in numbers, and the admin editors say which file to run (§4).

---

## 1 · The morning's findings, now

| id | finding | status tonight |
|---|---|---|
| **B1** | `fetchAll()` selects every profile, no pagination — ceiling at 1,000 | **open** · acknowledged, not urgent at 12 |
| **B2** | economy, PIN and feature gates live in `localStorage` | **partly closed** · rank now lives in `profiles.rep`, keeper-only once `supabase-rbac-tiers.sql` runs, and the portal reads rank from there. $H balance, contributions and Experience unlocks are still local |
| **B3** | `profiles` has no migration | **open** · the live columns are now known (§7) — the DDL can be written from them |
| D1 | sender could not read sent DMs | done (`ciphertext_self`) |
| D2 | new device silently lost history | done — fails legibly; the vault that fixes it for good has no screen yet |
| **D3** | server can forge a DM (no signature) | **open** |
| D4 · D5 | three keypairs · wrong SQL comments | done |
| D6 | Realtime not used anywhere | **open** · DMs poll (10 s open, 60 s for the badge) |
| — | `maximum-scale=1` blocked pinch-zoom | done |
| — | supabase-js unpinned at `@2` on jsdelivr | **open** |
| — | 4 hardcoded admin allowlists in client JS | **open** · and they still include `teyae@fungai.art` (§2 · P3) |
| — | dead modules | **open, and one more** (§2 · P9) |
| — | admin code inside the member bundle | **worse** · keeper tools added 30 KB that every member downloads (§2 · P5) |
| — | `lab_notes`, `snippets` world-readable | open, by design for MYCO — now joined by `profiles`, which is not by design |

---

## 2 · Findings

Severity: 🔴 act now · 🟠 soon · 🟡 when nearby · ⚪ note

### 🔴 P1 · Members' emails are public

**Evidence.** Anon key, no session, `profiles?select=*`: 12 rows, columns
`id, auth_user_id, email, character_name, avatar_url, bio, role, location,
pronouns, contact, specialties, founding, rep, balance, focus, node, joined,
updated, is_admin, favorite_plant, dm_public_key`. `email` filled in 8 rows,
`contact` holds an address in 2.

**Cause.** `SBprofiles.upsert()` set `email: user.email` on every save, and
`tryAutoLogin` copied the login email into `contact` when it was blank, "so the
admin panel's email column populates itself". Nothing reads `profiles.email`:
`netlify/functions/me.mjs` falls back to `auth.users.email`, and keepers get
emails from the `get_member_emails` RPC.

**Done.** Both writes removed (`supabase-client.js`, `app-living.jsx`).

**To run.** `supabase-profiles-privacy.sql`: empties `email`, adds a trigger
that keeps it empty whatever an old cached client sends, and clears every
`contact` that is exactly the member's login email.

**Still open.** Everything else in the row stays public: names, bios, pronouns,
avatars, the `is_admin` flags, and any contact a member typed. Closing
`profiles` to `authenticated` needs two code paths changed first, because both
read it without a session: the signed-out page's `fetchAll()`, and
`createUnclaimed()`, the invite-code signup, which inserts and reads the row
back. Then `REVOKE SELECT ON public.profiles FROM anon`.
This is GDPR territory: personal data of EU residents, published without a
basis. It is worth doing properly, and soon.

### 🟠 P2 · The new features wait on SQL

| feature | needs | until then |
|---|---|---|
| Event manager | `supabase-events.sql` | calendar shows the built-in 10 events; editor says so, saves nothing |
| Dashboard figures + announcements | `supabase-dashboard-admin.sql` | built-in figures; editors say so |
| ranks → tiers, and rank changes | `supabase-rbac-tiers.sql` | rank picker saves `rep`, but members can still edit their own — rank is not yet trustworthy |
| DM sent-copy | `supabase-messages-e2e-sender-copy.sql` | senders cannot re-read their sent DMs after a reload (auto-detected) |
| email exposure | `supabase-profiles-privacy.sql` | P1 |

### 🟠 P3 · Steph's address is still an admin key

`teyae@fungai.art` sits in the client-side admin allowlists
(`app-living.jsx` — five places) and in `supabase-rbac-tiers.sql`'s admin seed.
The client lists only decide what the UI shows. The database decides the data,
through `is_admin` and whatever email-based UPDATE policy the Supabase console
holds for `profiles`, which `SBprofiles.adminUpdate` depends on. Decide
whether that address should still be an admin; if not, remove it from the seed
before running it, and from the allowlists.

### 🟠 P4 · Two gift paths write to the wrong browser

The admin **Gift $H** form adds the amount to `spore_state_<member>` in the
**admin's own** `localStorage`, so the member never sees it. That's the same bug
class as the old DM button, fixed this morning. It also inserts a row into
`hypha_gifts`, and the table exists, but nothing applies those rows to a
balance. Until the economy moves server-side (B2), a gift is a note, not a
transfer. Either say so in the form, or hide it.

### 🟡 P5 · First visit got heavier

834 KB of local JS and CSS (**215 KB gzipped**), plus supabase-js from the CDN
and three Fontshare families. It was 654 KB this morning. Most of the growth is
real features every member uses (DMs 43 KB, the ring, the Dashboard). But
`admin/keeper.js` (30 KB) and `admin/kanban.js` (17 KB) are keeper-only and load
for everyone. Load them for keepers only, after the identity check.
`app-living.js` is still the heaviest file at 280 KB: 5,423 lines, 33
components.

### 🟡 P6 · DMs: what "installed" does and doesn't cover

Working now, with no SQL needed: the table and the key column exist. Crypto is
ECDH P-256 plus AES-GCM-256 through WebCrypto, a fresh key per message, two
sealed copies, private keys only in the device's IndexedDB. Not yet:

- **No rate limit, block or report.** Any member can message any member, and
  there's no brake.
- **Keys are trusted from the server.** Whoever can write
  `profiles.dm_public_key` could swap in their own key and read what's sent
  after that. Showing key fingerprints ("safety numbers") would let two members
  check each other.
- **D3.** Nothing signs a message.
- **One device per inbox.** The vault that carries a key to a new device is
  built and tested but has no screen.
- **No Realtime.** Polling, as above.

### 🟡 P7 · Accessibility

- **132 font-size declarations under 9 px** across the portal's CSS and inline
  styles, mostly Geist Mono micro-labels. They are hard to read on a phone.
  Raise the floor to about 10 px.
- **Escape and focus.** The ring, the kanban and now the DM inbox handle
  Escape. The profile modal, the profile editor and the earn sheet don't, and
  no dialog traps focus.
- Pinch-zoom is allowed again. The ring has a nav landmark, `aria-current`,
  arrow keys and reduced-motion support.

### 🟡 P8 · Guest lists and the inbox are not live

RSVPs load once per page, so another member's "I'm coming" appears on your
next reload. DMs poll. Supabase Realtime on `event_rsvps` and `messages_e2e`
would make both instant, and it is a dashboard toggle plus a subscription each.

### 🟡 P9 · Dead code

- **Compiled every build, loaded by nothing:** `spore/app.jsx`,
  `tracker-app.jsx`, `tracker-data.jsx`, `network-map.jsx` (65 KB of source).
- **Loaded on every visit, used by nothing:** `spore/network-living.js`. The
  globe replaced it.
- **Unused inside `app-living.jsx`:** `dropOpen`, `PHILOSOPHY`, `emailFetched`,
  `getMemberState`, `_ready`, `tick`.

### ⚪ P10 · Content still in code

`NETWORK_NODES`, `NODE_INTROS`, `EXPERIENCES` and `PRODUCTS` are hardcoded in
`spore/data.jsx`. Events are the first to move to the database. Experiences
are the natural next one, since they now live inside the Calendar.

### ⚪ P11 · Security checks that came back clean

- No `dangerouslySetInnerHTML`. The two `innerHTML` writes, in
  `claim-notice.js`, are static strings, and the email beside them goes in
  through `textContent`.
- Every `target="_blank"` has `rel="noopener"`.
- Announcements, figures, DMs and event text all render as text, never as HTML.
- Event links are limited by a database CHECK to site paths or `https://`, so
  a `javascript:` link cannot be saved.
- Every new table has row-level security: writes need `fa_is_admin()`, and
  `anon` is revoked.

---

## 3 · What was verified, and what was not

**Verified:**
- 6 test suites pass: fairy-ring 76 checks, admin-board 10, dm-vault 22,
  dm-crypto 11, myco-kb, myco-terminology.
- ESLint core rules over all 24 loaded portal files: 0 errors. It was 1 before
  the gift fix.
- All 19 `.jsx` files compile.
- `/community` loads headless with no console errors.
- The ring was screenshotted at desktop size and 390 px.
- A live anon-key probe of 19 tables.

**Not verified:** any signed-in flow in a real browser — DMs between two
accounts, the keeper tools against live tables (they need the SQL first), the
Event manager's saves, the rank picker. The portal cannot be signed into
headless.

---

## 4 · The SQL queue, in order

1. **`supabase-profiles-privacy.sql`** — P1, the exposure.
2. **`supabase-rbac-tiers.sql`** — ranks → tiers and the privilege guard. Read P3 first.
3. **`supabase-dashboard-admin.sql`** — figures + announcements.
4. **`supabase-events.sql`** — the Event manager; seeds today's 10 events, keeping their ids so existing RSVPs stay attached.
5. `supabase-messages-e2e-sender-copy.sql` — if not already run.
6. `supabase-visits.sql` — the traffic email, carried from 09-24.

**Hold** `supabase-e2e-key-vault.sql` until the vault has a screen.
**Never** run `supabase-academy-access.sql`.

All of them are idempotent. 3 and 4 need `fa_is_admin()`, which exists.

---

## 5 · Ranked next steps

1. Run the SQL queue.
2. Decide what each rank opens: one `minRank` line per section in `portal/sections.jsx`.
3. Close `profiles` to anon (P1, part two).
4. Steph's address (P3).
5. Load keeper code for keepers only (P5).
6. Say what a gift is, or hide the form (P4).
7. Realtime for DMs and guest lists (P8).
8. Delete the dead modules (P9).
9. Escape and focus on the remaining dialogs; lift micro-labels to 10 px (P7).
10. Pin supabase-js; D3 signing; DM rate limit and block (P6).

---

## 6 · Numbers

| metric | value |
|---|---|
| first-visit local JS + CSS | 834,115 bytes · 215,300 gzipped (morning: 654 KB) |
| largest file | `spore/app-living.js`, 280 KB |
| `app-living.jsx` | 5,423 lines · 33 components |
| `.jsx` compiled per build | 19 (4 of them dead) |
| tables the portal touches | 13 + the `avatars` bucket: announcements, board_cards, event_rsvps, events, hypha_gifts, inventory, lab_notes, member_herbs, messages_e2e, orders, product_inventory, profiles, site_figures |
| RPCs | get_member_emails · is_user_banned · validate_invite_code |
| anon-readable tables with rows | profiles 12 · lab_notes 41 · snippets 15 · product_inventory 20 · inventory 142 |
| tables not created yet | events · site_figures · announcements · user_key_vault · entitlements · visits |
| SQL files in the repo | 40 |
| lint (core rules) | 0 errors · 20 warnings, most of them false positives for components used only in JSX |
| font-size declarations under 9 px | 132 |
| `console.*` in shipped source | 10 |

---

## 7 · How this was measured

- **Anon exposure.** `curl "$URL/rest/v1/<table>?select=*&limit=1"` with only
  the anon key and `Prefer: count=exact`, reading `Content-Range`. For
  `profiles`, the rows were piped through node to print column names and
  filled-counts only — no values were printed or stored.
- **Payload.** Every local `src`/`href` in `community/index.html`, sized with
  `wc -c` and `gzip -c | wc -c`.
- **Lint.** ESLint 8.57 through its Node API with core rules (`no-undef`,
  `no-dupe-keys`, `no-unreachable`, `no-unused-vars` and the like). Every file
  `index.html` loads, with every top-level name across them passed in as a
  global, because the portal's scripts share one scope.
- **Tests.** `npm run test:fairy-ring`, `test:admin-board`, `test:dm-vault`,
  `test:dm-crypto`, `test:myco-kb`, `test:myco-terminology`.
- **Runtime.** Headless Edge `--dump-dom` of `localhost:5173/community/` with
  `--enable-logging`, filtering console lines from localhost.
