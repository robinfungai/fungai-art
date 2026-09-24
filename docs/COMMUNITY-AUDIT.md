# /community — full audit

**Date:** 2026-09-24 · **Scope:** everything under `public/community/`, plus
`global-nav.js`, `spore-gate.js`, `supabase-client.js` and the SQL those touch.
**Purpose:** Robin is pivoting the portal into something larger and wants the
data points. Encrypted in-app messaging is the named next feature.

Extends `docs/academy/phase-0-audit.md` (2026-09-17). That file is partly
**stale** — see §12. This one is measured, not remembered: every number below
came from a command, and the commands are in §15 so they can be re-run.

---

## 0 · The thirty-second version

The portal is a **single 5,335-line React file** served as static HTML, with
**two parallel identity systems** — a real one (Supabase Auth + RLS) and a
fictional one (`localStorage`) — and the fictional one owns the economy.

It works today because there are ~12 members and one admin who is also the
developer. Three things break before it gets large, in this order:

| # | Blocker | Breaks at |
|---|---|---|
| **B1** | `fetchAll()` selects every profile with no pagination | **1,000 members** (Supabase's default row cap, silently) |
| **B2** | Economy + PIN + feature gates live in `localStorage` | **the first member who opens devtools** |
| **B3** | `profiles` has no migration in any `.sql` file | **the first time you need a second environment** |

And for the named feature: **the DM crypto has a design gap that makes a normal
chat UI impossible** as written — the sender cannot decrypt their own sent
messages. Details in §9. It is fixable in about twenty lines, but it changes the
table, so it has to be decided before any UI is built.

---

## 1 · Inventory — what /community actually is

44 files, **2.51 MB** on disk.

| file | bytes | note |
|---|---|---|
| `academy/Herbalism Module 1_V3.pdf` | 986,871 | static asset, largest single file |
| `spore/app-living.jsx` | 300,537 | **the portal** — 5,335 lines |
| `spore/app-living.js` | 279,074 | generated, gitignored |
| `academy/index.html` | 185,467 | the Academy, one file |
| `vendor/react-dom.production.min.js` | 132,010 | vendored 2026-09-24 |
| `spore/assets/specimen-fan.png` | 118,375 | |
| `spore/styles-living.css` | 75,606 | |
| `spore/data.jsx` | 38,652 | hardcoded members + helpers |
| `spore/styles.css` | 28,500 | **unreferenced by any page** |
| `spore/styles-tracker.css` | 17,027 | tracker only |
| `dm/crypto.js` | 8,229 | E2E scaffolding, §9 |

### Generated vs source

`spore/*.js` and `myco/agent.js` are compiled from the sibling `.jsx` by
`scripts/build-community.cjs` and are **gitignored** (`.gitignore:56-60`).
One source of truth — good. But it means **reading `app-living.js` is reading a
build artifact**; edit the `.jsx`.

### Dead weight found — 108 KB of source that nothing loads

Checked every `spore/*.jsx` against every `<script src>` in every HTML file in
the repo. Four of nine modules are loaded by no page at all:

| file | source bytes | generated `.js` |
|---|---|---|
| `spore/app.jsx` | 25,354 | 29,591 |
| `spore/tracker-app.jsx` | 25,455 | 25,943 |
| `spore/tracker-data.jsx` | 7,268 | 6,405 |
| `spore/network-map.jsx` | 7,056 | 7,248 |
| `spore/styles.css` | 28,500 | — |
| `spore/styles-tracker.css` | 17,027 | — |
| **total** | **110,660** | **69,187** |

`app.jsx` is the pre-`app-living` portal; `tracker-*` and `network-map` are an
abandoned branch. The only other references anywhere in the repo are their own
copies in `dist/`.

Two consequences: `build-community.cjs` walks `public/**/*.jsx` and **compiles
all four on every build**, and all four are **deployed to the live site** —
never loaded, but served. Nothing breaks; it is 108 KB of source that reads as
current and is not.

- 17 `console.*` calls ship to production (`app-living.js` 7,
  `supabase-client.js` 6, `data.js` 2, `global-nav.js` 2).
- **Zero** TODO/FIXME/HACK markers. Unusual, and genuinely good.

---

## 2 · First-visit payload

654 KB of local JS + CSS, uncompressed, **all of it before anything renders**.

| asset | KB |
|---|---|
| `spore/app-living.js` | 272.5 |
| `vendor/react-dom.production.min.js` | 128.9 |
| `spore/styles-living.css` | 73.8 |
| `spore/data.js` | 32.5 |
| `/global-nav.js` | 31.9 |
| `/supabase-client.js` | 23.1 |
| `spore/tweaks-panel.js` | 15.8 |
| `vendor/cobe.esm.js` | 12.8 |
| `vendor/react.production.min.js` | 10.7 |
| everything else (9 files) | 52 |
| **total** | **654** |

Netlify serves this gzipped, so over the wire it is roughly 180–200 KB. The
problem is not bytes, it is that **there is no code splitting**: the calendar,
the admin panel, the globe, the product inventory editor and the Academy shim
all parse on every visit, including for a signed-out visitor who sees only the
login screen.

`app-living.js` alone is 272 KB of the 654. **Splitting it is the single
biggest available performance win**, and it is the same work as making room for
DMs and the feed (§11).

### Two external dependencies remain on the critical path

| dependency | risk |
|---|---|
| `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` (`supabase-client.js:14`) | **unpinned minor version** — a breaking `@2.x` release changes the portal with no deploy |
| `api.fontshare.com` (3 font families) | render-blocking stylesheet on a third party |

React was the third until 2026-09-24 (commit `c992390`). The same `vendorCobe()`
pattern in `build-community.cjs` applies to supabase-js and would remove the
unpinned-version risk entirely.

---

## 3 · `app-living.jsx` anatomy — 5,335 lines, 26 components

Everything is in one file, in one global scope, with no modules.

| lines | component | what it is |
|---|---|---|
| 41–102 | `useEconomy` | **the economy. localStorage only.** §5 |
| 129–235 | `PinModal` | **plaintext PIN in localStorage.** §6 |
| 236–370 | `WeavePathGraph` | the 5-stage onboarding graph |
| 373–1020 | `LoginScreen` | **647 lines** — invite gate, magic link, profile creation |
| 1047–1142 | `TopBar` | tabs |
| 1201–1280 | `NetworkPage` | globe + node panel |
| 1283–1715 | `ApothecaryPage` | member-exclusive editions, hardcoded `EXCLUSIVE` list |
| 1718–1803 | `ExperiencesPage` | unlockables |
| 1806–2160 | `ProfileEditor` | **354 lines** |
| 2163–2324 | `PublicProfileModal` | |
| 2327–2832 | `MembersPage` | **505 lines** |
| 2835–2898 | `JournalPage` | |
| 2908–4278 | admin: 7 components | **1,370 lines — 26% of the file** |
| 4343–4429 | `AcademyPage` | shim; the real Academy is its own page |
| 4451–4658 | `CalendarPage` | |
| 4753–4787 | `QuickNav` | must be hand-synced with `TopBar` (its comment says so) |
| 4889+ | `App` | root |

### The seams, if you split it

The file already has clean boundaries. In rough order of how easily they lift
out: **admin** (1,370 lines, one tab, admin-only — should not be in the member
bundle at all), **calendar**, **apothecary + experiences**, **members +
profiles**, then the login screen. The `myco/`, `dm/` and `feed/` folders show
the intended structure; it just stopped after `myco/`.

### Navigation surface

6 tabs — `network`, `calendar`, `shop`, `exp`, `members`, `admin` — plus an
external link to `/community/academy/`. `QuickNav` and `TopBar` duplicate the
list and are kept in sync by hand.

---

## 4 · Identity — two systems, only one of them real

### The real one (Supabase)

```
invite code → validate_invite_code() RPC → signInWithOtp(email)
  → magic link → onAuthStateChange → profiles row claimed
  → global-nav.js renders the member banner
```

Passwordless throughout. No password exists anywhere in the system, which
removes reset flows, hashing and breach exposure as whole categories. `profiles`
is claimed, not created, and `supabase-profiles-claim-lockdown.sql` plus
`-insert-lockdown.sql` stop a row being claimed twice or created with
`is_admin = true`. **This half is sound.**

### The fictional one (localStorage)

Nine keys decide what the UI believes:

| key | occurrences | what it controls |
|---|---|---|
| `spore_active_member_full` | 11 | **identity + admin flag + restrictions** |
| `spore_active_member` | 9 | short id |
| `fungai_profile` | 6 | cached profile |
| `fungai_pending_avatar` | 6 | |
| `fungai_profile_draft` | 5 | |
| `spore_state_${id}` | 2 | **balance, reputation, unlocks, inventory** |
| `spore_restrictions_by_cloud` | 2 | feature gates |
| `spore_recruits`, `spore_announcement` | 4 | |

### Members are a hybrid

`data.jsx:459` holds **12 hardcoded member objects** (the "founding six", since
grown) with `rep` and `balance` baked in. `loadProfilesFromCloud()` fetches
Supabase profiles, collapses duplicates by normalised name, and overlays them
onto those hardcoded shells — falling back to the static list if Supabase is
unreachable (`data.jsx:646,650`).

For a pivot this matters: **the member list is partly a constant in the client
bundle.** Adding a member today is a code change unless they self-register.

---

## 5 · The economy is client-side fiction

`useEconomy` (`app-living.jsx:41`) is the whole thing, and it is live —
`App()` calls it at line 4927.

```js
const [state, setState] = useState(() => JSON.parse(localStorage.getItem(key)))
useEffect(() => localStorage.setItem(key, JSON.stringify(state)), [state, key])
```

`earn()`, `unlock()` and `buy()` all mutate that object and write it back. What
follows:

- **Balance is whatever the member types into the console.** `unlock()` gates
  Experiences on `s.balance < amount` — client-side, so every experience is
  free to anyone who looks.
- **Clearing site data erases a member's balance, reputation and unlocks.**
  No recovery, because nothing was ever stored anywhere else.
- **Nothing syncs across devices.** Same member, two browsers, two economies.
- **No server function ever reads or validates it.** Verified: the only
  `balance` match in `netlify/functions/` is the word "balance" in product prose.
- There is **no `wallets` table** in any of the 32 SQL files.

This is a known deviation, not an oversight. `spore/spec/01-architecture.md`
specified the opposite: *"Use server actions for balance mutations (earn, spend,
unlock, buy) so the client can never write balances directly. RLS enforces
this."* The spec folder is marked SUPERSEDED, and the server-side half was never
built.

**If the pivot involves money, reputation that means anything, or paid tiers,
this is the first thing to move.** It is also the easiest to justify: the schema
was already designed in `spec/02-data-model.md`.

---

## 6 · Access control — three layers, two of them decorative

### Layer 1 · RLS — real

32 SQL files, ~40 tables and functions, all idempotent. The pattern worth
keeping: **anon may INSERT where the public must write, and may not SELECT it
back**; reads that matter happen in a function with the service role. The
`*-lockdown` and `hardening-round-2` files each closed a specific hole and are
the cheapest security review in the repo.

### Layer 2 · the admin allowlist — decorative, and duplicated

| file | form |
|---|---|
| `global-nav.js:451-452` | `MEMBERS` map with `admin: true` |
| `spore/app-living.jsx:4903` | `KNOWN_ADMIN_EMAILS` array |
| `herbal-engine-2/index.html:1533` | `email === 'robin@…' \|\| email === 'teyae@…'` |
| `academy/index.html:1626` | `if (m && m.admin)` — delegates to global-nav, **not** a fourth copy |

It only decides what UI to show, and RLS is the real gate — so it is not a hole.
But **the server-side replacement already exists**:
`supabase-academy-access.sql` defines `fa_is_admin()` reading
`profiles.is_admin OR profiles.role = 'admin'`, and `supabase-invite-codes.sql`
defines `is_admin_user(uid)` on the same column. The columns are live. The
client lists are a stale duplicate of a fact the database already holds.

#### ⚠ `profiles.role` means two different things

Found 2026-09-24, by running the academy file against production and watching
it fail. `role` is **already in use as the portal's member PERSONA** —
`ProfileEditor` (`app-living.jsx` ~2550) writes it from the vocabulary in
`data.jsx`: `forager · herbalist · alchemist · ceremony · sound · artist ·
patron · collaborator · student · seeker · other · founder`.

`supabase-academy-access.sql` assumes the same column is an *authorisation*
role. Two things follow, and neither is theoretical:

1. Its `CHECK (role IN ('member','forager','steward','admin'))` is **violated
   by existing rows** — only `forager` appears in both vocabularies. The
   `ALTER` fails, which is how this was found.
2. Had it succeeded, **saving any profile would fail**, because the editor
   writes `role:'alchemist'` and the constraint rejects it.

And the predicate itself is unsafe here: an admin who edited their own profile
would overwrite `role='admin'` with their persona and silently stop being an
admin.

So `supabase-fa-is-admin.sql` defines the version this schema actually wants —
`is_admin` only, the column `global-nav.js`, the Academy and `is_admin_user()`
already agree on. **The real fix is two columns**: add `profiles.access_role`
for authorisation, leave `role` to the portal, and point `fa_is_admin()` at the
new one. Until then, do not run `supabase-academy-access.sql` on this database.

Also still wired in: `teyae@fungai.art` → "Stephanie" in five places, including
name-guessing (`if (name.includes('steph'))`), despite commit `fc897e0`.

### Layer 3 · `spore-gate.js` — decorative, and load-bearing if you pivot

```js
const full = readJSON('spore_active_member_full');   // localStorage
function isAdmin() { return !!(a && a.admin); }      // trusts it
```

Any visitor can set that object and become an admin **to every page that calls
`SporeGate.requireAccess()`**. Its own comments are honest ("an internal-network
tool, not a public paywall") and for 12 friends that is fine.

**It stops being fine the moment a restriction is something someone paid for.**
If the pivot has tiers, this must move behind RLS, not be patched.

### `profiles` has no migration

23 SQL files reference `public.profiles`. **None creates it.** It was made in
the Supabase dashboard. So `docs/COMMUNITY-PORTAL-ARCHITECTURE.md` §7.4 — "run
every `.sql` in order" — does not reproduce this database: every lockdown file
fails on a missing relation. Reconstructing the DDL is best done while the live
project is there to read it from.

### Two tables are world-readable

`lab_notes` (`supabase-lab-notes.sql:60`) and `snippets`
(`supabase-snippets.sql:27`) are `SELECT USING (true)`, and the anon key is
public by design — so member-written Academy notes are retrievable over the REST
API by anyone. `supabase-academy-access.sql:11` acknowledges this in a comment.
For `lab_notes` it may be intentional (MYCO reads them; HANDOFF calls them
"genuinely public"). **Decide it explicitly rather than inherit it.**

---

## 7 · Data model

Tables `/community` touches directly, from its `.from(...)` and `.rpc(...)` calls:

```
profiles          avatars           event_rsvps       hypha_gifts
inventory         lab_notes         member_herbs      product_inventory
RPC: validate_invite_code · is_user_banned · get_member_emails
```

Defined but **not reached from the portal**: `messages_e2e`, `feed_events`,
`myco_memory`, `orders`, `formulas`, `lab_chapters`, `banned_users`,
`newsletter_subscribers`, `page_views`, `entitlements`.

`entitlements` is created by SQL but, per HANDOFF, **the schema was never
applied** — so `fa_has_entitlement()` references a table that does not exist in
the live database. If the pivot has tiers, that function is the intended hook.

### Scalability — B1, the hard ceiling

`supabase-client.js:140`:

```js
async fetchAll() {
  const { data, error } = await window.SBclient
    .from('profiles').select('*')
    .order('founding', { ascending: false })
    .order('rep', { ascending: false });
}
```

No `limit`, no `range`, no column list. Every visit to `/community` downloads
**every member's entire profile row**. Consequences, in the order they bite:

1. **Supabase caps unpaginated selects at 1,000 rows by default.** At member
   1,001 the list silently truncates — no error, and the hardcoded-shell merge
   in `data.jsx` will make it look like a data problem rather than a paging one.
2. `select('*')` ships every column, including `dm_public_key` and anything
   added later. A column added for one feature becomes visible to all members.
3. It runs on page load, before the member has asked to see anyone.

**This is the first thing to fix for "something large", and it is small work:**
select named columns, page the list, fetch a single profile on demand.

### Realtime is not used anywhere

Verified: no `.channel(`, `postgres_changes` or `.subscribe(` in any
`/community` source. The only mentions are in `spore/spec/03-api-surface.md`
(superseded) and `herbal-engine-2/index.html`.

**Both the DM and feed READMEs require it** ("Enable Realtime on
`messages_e2e`"). So messaging needs a Supabase dashboard step *and* the
portal's first realtime client code. Budget for it.

---

## 8 · Accessibility and mobile

`community/index.html:6`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
```

`maximum-scale=1` **disables pinch-zoom**. That is a WCAG 2.1 SC 1.4.4 (Resize
Text) failure, it affects every member on a phone, and it is a one-attribute
fix. `academy/index.html` does **not** have it — so the portal and the Academy
disagree, and the Academy is right.

Not examined in depth this pass: colour contrast against the dark palette,
`focus-visible` states, keyboard traps in the six modals, and screen-reader
labelling of the glyph-only nav — `◉ △ 🌿 ✦ ◈ ⚗ ⬡` are decorative characters
used as the only label in `QuickNav`. **If the pivot is outward-facing this
needs its own pass**; glyph-only buttons and a zoom lock are the two findings
most likely to matter legally in the EU.

---

## 9 · Encrypted messaging — readiness assessment

The named next feature. **Further along than "not started", and with one design
gap that has to be decided before any UI is written.**

> **STATUS, 2026-09-24, after commit `69a970f`.** Robin decided both open
> questions and they are implemented: **D1** is fixed (two blobs per message,
> `ciphertext_self`), and **D2** is settled as *device-bound history* with a
> legible failure rather than a silent one. **D4** and **D5** are fixed. A
> sixth finding, not in the original list, was found and fixed with them: the
> `mark_read` policy did not restrict columns, so the recipient could rewrite
> the ciphertext of anything sent to them.
>
> **D3 remains open** — nothing signs the ciphertext, so the server cannot
> read a message but can forge one.
>
> Still to do before members use it: run
> `supabase-messages-e2e-sender-copy.sql`, enable Realtime on `messages_e2e`,
> build `dm/dm.jsx`, and get the independent crypto review the file header
> asks for. Guarded by `npm run test:dm-crypto` (11 checks).

### What exists

| piece | state |
|---|---|
| `dm/crypto.js` | 8.2 KB, ECDH-P256 + AES-GCM, WebCrypto only, no third-party crypto |
| `supabase-messages-e2e.sql` | complete: table, 3 indexes, 4 RLS policies, size cap |
| `profiles.dm_public_key` | added by that file's `ALTER TABLE` |
| `dm/dm.jsx` | **does not exist** — marked "(to build)" |
| Realtime | **not enabled, not used anywhere in the portal** |

The design is sound in outline: a long-term ECDH keypair per member, private
half in IndexedDB (deliberately not localStorage), public half in
`profiles.dm_public_key`, and a **fresh ephemeral sender keypair per message**
so a later leak of the sender's long-term key does not open past messages. RLS
restricts INSERT to `from_auth_user_id = auth.uid()`, SELECT to the two parties,
UPDATE to the recipient setting `read_at`. The file's own header says it is v1
scaffolding wanting an independent review — correct, and here is the start of one.

### 🔴 D1 · The sender cannot read their own sent messages

`encryptTo()` derives the AES key from
`ECDH(ephemeral_private, recipient_public)` and then **discards the ephemeral
private key**. Only `ECDH(recipient_private, ephemeral_public)` reproduces it.

The sender holds neither. So:

- RLS *lets* the sender SELECT their own sent rows (`messages_e2e_read`)
- the sender *cannot decrypt* a single one of them
- **there is no "sent" side to a conversation** — a normal chat UI is impossible
  as written

Standard fix: encrypt each message twice, once to the recipient and once to the
sender's own public key, and store both blobs (a second column, or two rows).
Roughly twenty lines in `encryptTo` plus one column. **Decide this before
building `dm.jsx`**, because it changes the table.

### 🔴 D2 · Key rotation silently destroys history

`getOrCreateMyKeypair()` returns the IndexedDB keypair if present, otherwise
generates one. There is no key version on the message, no backup, no export and
no multi-device path. So:

- a member who clears site data, or opens the portal on a second device,
  generates a **new** keypair, overwrites `dm_public_key`, and **every message
  ever sent to them becomes permanently unreadable** — with no error, because
  decryption simply fails per message
- there is no way to help them, by design; that is what E2E means

For 12 friends this is a conversation. For "something large" it is a support
burden that has to be designed for: a key version on each row, an explicit
"this device has new keys, old messages are unreadable" state, and either a
passphrase-wrapped key backup or an accepted, *stated* policy that history is
device-bound.

### 🟠 D3 · Confidentiality without authenticity

The ephemeral sender key is **unsigned**, and nothing binds the ciphertext to
the sender. The DB authenticates the *metadata* sender via RLS
(`from_auth_user_id = auth.uid()`), but anyone who can write the table — which
includes whoever holds the service key — can replace `ciphertext` with one they
encrypted to the recipient. It decrypts cleanly, and the recipient attributes it
to the named sender.

So the threat model in the file header — *"Server MUST NOT be able to read
message bodies"* — **holds for reading and not for writing.** The server cannot
read, but it can forge. Worth stating plainly in the privacy copy, or fixed by
signing the ciphertext with a long-term ECDSA key alongside the ECDH one.

### 🟡 D4 · `getOrCreateMyKeypair()` generates three keypairs and uses one

The function generates `pair` (non-extractable), then `pubExtractable`, then
`kp` — and **only `kp` is stored or returned**. The first two are dead, with a
comment mid-function narrating the author working out WebCrypto's extractability
rules. Three ECDH keygens per first sign-in instead of one, and exactly the kind
of thing the header warns about ("the code around them is where bugs hide").
Harmless to security; should be deleted.

### 🟡 D5 · Two documentation/code mismatches

| claim | where | reality |
|---|---|---|
| wire format is `ciphertext \| IV \| eph_pubkey` | `supabase-messages-e2e.sql` comment | code writes **`eph_pub(65) \| iv(12) \| ct`** — the reverse |
| `dm_public_key` is `base64(SPKI DER)` | same file | code uses `exportKey('raw')` → **65-byte EC point** |

The code is self-consistent and correct; the SQL comments are wrong in both
places. Anyone implementing a second client from the schema comments — a mobile
app, a server-side indexer — gets a broken reader.

### 🟡 D6 · Practical gaps

- **Message length cap is undocumented to users.**
  `CHECK (char_length(ciphertext) <= 8000)` on base64 of `65 + 12 + ct` works
  out to roughly **5,900 plaintext characters**. The UI needs that number.
- **No spam or blocking story.** `banned_users` exists and is unconnected to
  `messages_e2e`. Any member can message any other member with no rate limit, no
  block list and no report path. Fine for an invite-only network of 12; not fine
  at any size where invites get resold.
- **The social graph is fully visible to the server.** `thread_key` is indexed
  and `to_profile_id` is a foreign key, so who-talks-to-whom, how often and how
  much is queryable even though content is not. The README is honest about this.
  It is a design choice worth restating in the privacy page.

### Suggested order for messaging

1. Decide **D1** (sender copy) — it changes the schema, so it comes first
2. Decide **D2** (key rotation policy) — it changes the UI's states
3. Delete the dead keygens (**D4**), fix the two SQL comments (**D5**)
4. Enable Realtime on `messages_e2e` in the dashboard
5. Build `dm/dm.jsx` as its own island, **not** inside `app-living.jsx`
6. Get the independent crypto review the file header asks for, **before** real
   members rely on it

---

## 10 · What a member can actually do today

| feature | state |
|---|---|
| Join by invite code | **live**, Supabase-backed |
| Magic-link sign-in | **live** |
| Create / edit a profile | **live**, 354-line editor |
| Browse members, open a profile | **live**, but §7 pagination ceiling |
| Network globe | **live** (cobe, WebGL) |
| Calendar | **live** |
| Member shop / Apothecary | **live**, `EXCLUSIVE` list hardcoded |
| Experiences | **live UI, fake gate** — unlock is localStorage (§5) |
| Journal | **live** |
| Balance / reputation / tiers | **fiction** (§5) |
| Admin panel | **live**, 1,370 lines, allowlist-gated (§6) |
| Academy lab notebook + MYCO | **live**, its own 179 KB page |
| **DMs** | **schema + crypto only, no UI** (§9) |
| **Activity feed** | **schema + spec only, no UI** (§11) |
| Realtime anything | **none** (§7) |
| Notifications | **none** |

---

## 11 · The feed — the other half-built feature

`feed/README.md` specifies it fully and `feed/feed.jsx` does not exist.
`supabase-feed.sql` is written. The README names the six emitting events
(`contribution`, `purchase`, `unlock`, `rsvp`, `joined`, `tier_up`), the query
(`feed_events` desc limit 20), the realtime channel, and — usefully — what must
**never** go in it (`messages_e2e` content, `hypha_gifts` amounts).

Two of those six events (`contribution`, `unlock`) are currently localStorage
fictions, so **the feed inherits §5**: it would broadcast numbers a member can
forge. Worth knowing before building it, not after.

The feed is the cheaper of the two features — no key management, no unread
state, no crypto review — and it is the natural first extraction from
`app-living.jsx`, which is the work §3 needs anyway.

---

## 12 · What changed since `docs/academy/phase-0-audit.md` (2026-09-17)

That audit is a week old and several of its statements no longer hold:

| its claim | now |
|---|---|
| "Babel standalone (JSX in browser)" | **gone** — `build-community.cjs` precompiles |
| "React 18 UMD (unpkg)" | **gone** — vendored production UMD, commit `c992390` |
| "`app-living.jsx` (299 KB)" | 300,537 bytes; 5,335 lines |
| "RLS on 17 tables" | 32 SQL files now; ~40 tables and functions |
| B1 identity in the browser | **still true** (§4, §6) |
| B2 knowledge tables world-readable | **still true** (§6) |
| "member PIN stored in plaintext localStorage" | **still true** — `app-living.jsx:186` |

Its B3 (no stable IDs across domains) was not re-examined this pass.

---

## 13 · Ranked backlog

**Before the portal gets larger**

1. Paginate `fetchAll()` and select named columns — the 1,000-member ceiling (§7)
   · *Robin, 2026-09-24: acknowledged, not urgent at 12 members.*
2. Reconstruct the `profiles` DDL into a `.sql` file (§6)
3. Move the economy server-side, or remove it from the UI until it is real (§5)
4. `spore-gate.js` → RLS, if any restriction will ever be paid for (§6)
5. Delete the admin allowlists; read `profiles.is_admin` via `fa_is_admin()` (§6)
   · *Partly under way: the admin board added 2026-09-24 gates on
   `fa_is_admin()` and reads no allowlist, so the pattern now exists in the
   portal to copy.*

**For messaging**

6. ~~Decide D1 and D2~~ — **done 2026-09-24**, commit `69a970f` (§9)
7. Enable Realtime; build `dm.jsx` as its own file
8. Independent crypto review before real members rely on it
9. **D3** — sign the ciphertext, or state plainly that the server can forge (§9)

**Cheap, and worth doing while nearby**

9. Remove `maximum-scale=1` — one attribute, a WCAG failure (§8)
10. Vendor supabase-js; it is unpinned at `@2` (§2)
11. Delete the 4 dead `spore` modules + 2 dead stylesheets — 108 KB (§1)
12. Fix the two wrong SQL comments in `supabase-messages-e2e.sql` (§9 D5)
13. Split admin (1,370 lines) out of the member bundle (§3)

---

## 14 · Data points, collected

| metric | value |
|---|---|
| files under `/community` | 44 |
| bytes on disk | 2,505,255 |
| first-visit local payload | 654 KB uncompressed (~180–200 KB gzipped) |
| largest script | `app-living.js`, 272.5 KB |
| `app-living.jsx` | 5,335 lines · 300,537 bytes · 26 components |
| admin code inside it | 1,370 lines (26%) |
| navigation tabs | 6 + 1 external |
| hardcoded member objects | 12 |
| localStorage keys driving the UI | 9 |
| admin allowlists in client JS | 3 copies + 1 delegation |
| SQL files | 32 |
| tables + functions created by them | ~40 |
| tables `/community` reads or writes | 8 + 3 RPCs |
| tables defined but unreachable from the portal | 10 |
| world-readable tables | 2 (`lab_notes`, `snippets`) |
| tables with no migration | 1 (`profiles`) |
| Realtime subscriptions | 0 |
| external CDN dependencies | 2 (supabase-js unpinned, fontshare) |
| `console.*` in shipped code | 17 |
| TODO/FIXME/HACK markers | 0 |
| unreferenced source | 110,660 bytes (4 modules + 2 stylesheets) |
| dead code compiled every build | 69,187 bytes |
| Academy page | 179 KB · 99 KB inline JS · 32 KB inline CSS |
| DM crypto | 8.2 KB · 6 findings (§9) |
| DM UI | 0 bytes |

---

## 15 · How this was measured

Re-runnable, in case a number looks wrong.

Inventory and sizes:

    find public/community -type f | while read f; do
      printf "%9d  %s\n" "$(wc -c < "$f")" "$f"
    done | sort -rn

Component map:

    grep -nE "^(function|const|class|/\* ──)" public/community/spore/app-living.jsx

Tables and RPCs the portal touches:

    grep -ohE "from\('[a-z_]+'\)|rpc\('[a-z_]+'" \
      public/community/spore/app-living.jsx \
      public/global-nav.js public/supabase-client.js | sort -u

Every table and function the SQL creates:

    grep -hoiE "create (table|or replace function)( if not exists)? (public\.)?[a-z_]+" *.sql \
      | sed -E 's/.* //' | sort -u

Realtime:

    grep -rn "\.channel(\|postgres_changes\|\.subscribe(" public/community/

The first-visit payload was computed with a short Node script that parses
`index.html` for `<script src>` and `<link rel=stylesheet>`, resolves each path
against `public/`, and sums `fs.statSync().size` — external URLs excluded and
listed separately.
