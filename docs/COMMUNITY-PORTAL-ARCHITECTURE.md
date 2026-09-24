# The Community Portal — what it is made of, and how to fork it

**Written for: Robin, to fork this stack for a client.** It describes what
exists today, where the Fungai-specific parts are wired in, and what a second
tenant would have to change. It is a map, not a tutorial.

---

## 0 · The shape of the whole thing

There is no application server. Every moving part is one of four things:

```
STATIC PAGES        public/**/index.html         hand-written HTML + CSS
REACT ISLANDS       src/islands/*.tsx            compiled by scripts/build-islands.cjs
                                                 mounted into a div on a static page
SERVERLESS          netlify/functions/*.mjs      the only place secrets exist
DATABASE            Supabase (Postgres + Auth)   RLS is the real security boundary
```

This matters for a fork: **there is no Next.js, no App Router, no SSR.** It is
Vite + React 18, and public-facing pages are static HTML that mount islands.
A client project can keep this shape (cheap, fast, no server to run) or move to
a framework — but the functions and the SQL port either way, and they are the
valuable half.

---

## 1 · Identity — how someone becomes a member

**Passwordless, magic-link only.** There is no password anywhere in this
system, which removes a whole class of work (reset flows, hashing, breach
exposure).

```
  visitor has an INVITE CODE
        ↓  public/community/spore/  (the Spore app)
  code checked against public.invite_codes
        ↓
  supabase.auth.signInWithOtp({ email })       ← magic link sent by Supabase
        ↓
  email link returns them to the site, session in localStorage
        ↓
  onAuthStateChange fires → profile row created/claimed
        ↓
  public/global-nav.js renders the member banner on every page
```

Files that matter:

| file | role |
|---|---|
| `public/supabase-client.js` | one shared browser client, loaded from CDN, anon key |
| `public/community/spore/app-living.jsx` | the membership app: invite gate, sign-in, profile, admin |
| `public/spore-gate.js` | gates member-only pages |
| `public/global-nav.js` | the signed-in banner, and the **admin allowlist** |
| `supabase-invite-codes.sql` | codes, uses, expiry |
| `supabase-profiles-claim-lockdown.sql` | stops a profile being claimed twice |
| `supabase-profiles-insert-lockdown.sql` | stops arbitrary profile creation |
| `supabase-banned-users.sql` | + the gmail-normalise variant, so `a.b@gmail` ≠ a new account |

**Admin is currently a hardcoded email allowlist** in `global-nav.js`
(`teyae@fungai.art`, Robin's address) and mirrored in the Academy and Spore
admin checks. That is the single biggest thing to change for a client: it
should be a `role` column on the profile with an RLS policy, not a list in
client-side JS. It works because the *database* policies are the real gate —
the allowlist only decides what UI to show — but it does not survive a second
tenant.

---

## 2 · Supabase — the real security boundary

~32 `.sql` files in the repo root, each idempotent and safe to re-run. They are
the schema, and they are also the documentation of every decision.

Main tables:

```
profiles            members, claimed via magic link
invite_codes        the only way in
orders              shop
formulas            find-your-formula results (locked down — see below)
lab_notes           the Academy notebook, MYCO reads it live
lab_chapters        notebook sections
feed_events         the community feed
messages_e2e        DMs, encrypted client-side (public/community/dm/crypto.js)
event_rsvps         gatherings
member_herbs        per-member stock/interest
product_inventory   shop stock
myco_memory         MYCO analytics + generation events
page_views          site traffic (new — supabase-visits.sql)
banned_users        with gmail normalisation
```

**The pattern worth copying:** anon may INSERT where the public needs to write
(a formula, a page view, a newsletter signup) and may NOT SELECT it back.
Reads that matter happen in a function with the service role. That is why
`supabase-formulas-lockdown.sql`, `-health-lockdown` and `hardening-round-2`
exist — each one closed a hole where anon could read other people's rows.

For a fork: take the lockdown files and the `*-lockdown` / `hardening` naming
convention. They encode "we got this wrong once" and are the cheapest security
review you will ever get.

---

## 3 · Email — Resend

One provider, used by several functions. `RESEND_API_KEY` is set in Netlify
env; it never reaches the browser.

| function | what it sends |
|---|---|
| `reserve-formula.mjs` | a formula reservation to Robin + confirmation |
| `subscribe-newsletter.js` | newsletter opt-in (+ `RESEND_AUDIENCE_ID`) |
| `unsubscribe.js` | the other half, legally required |
| `dinner-contact.mjs` | dinner enquiries |
| `myco-monthly-digest.mjs` | monthly lab-notebook digest → `DIGEST_INBOX` |
| `visitor-digest.mjs` | traffic report, 1st and 15th |

**The lesson embedded here** (commit `e6aca82`): `reserve-formula` used to
return HTTP 200 with `{ok:true, sent:false}` when the key was missing — the
customer read "Reservation received" while nothing was sent and nothing was
stored. Silent lost orders on a live shop. Any fork must make a missing email
provider a **loud 503**, never a quiet success.

Scheduled functions use Netlify's `export const config = { schedule: '...' }`.
That is the whole cron system — no extra service.

---

## 4 · MYCO — the assistant

MYCO is **Claude plus a BM25 retrieval layer over our own corpus.** It is not
a fine-tuned model and it has no memory of individuals.

```
  question
     ↓  src/server/myco/terminology.cjs     read the question: misspellings,
     ↓                                       synonyms, binomials, negation
     ↓  src/server/myco/retrieve.cjs        BM25 over 3,184 chunks
     ↓  src/server/myco/lab-notes.cjs       + live Academy notes from Supabase
     ↓  src/server/myco/grounding.cjs       build the prompt, demand citations
     ↓  netlify/functions/myco-agent.mjs    call Claude (haiku for chat)
     ↓  grounding.verifyAnswer()            strip citations the model invented
     ↓  src/server/myco/claims-guard.cjs    remove medicinal claims
  answer + sources + confidence
```

Corpus is built at deploy time by `scripts/build-myco-kb.cjs` into
`src/server/myco/kb.generated.cjs` (committed, 3.4 MB) from `herbs.ts`,
`extraction.ts`, the monographs and `knowledge/proprietary/`.

Three properties worth porting verbatim:

1. **Citations are verified server-side.** The model is told to cite `[K1]`;
   anything it invents is stripped before the member sees it.
2. **The claims guard.** A medicinal claim in a chat reply is a medicinal claim
   by the brand. `docs/claims-policy.md` + `src/server/myco/claim-rules.cjs`.
3. **Lab notes are DATA, not instructions.** Members write them; the grounding
   prompt says so twice, because one line of defence against prompt injection
   is not one.

For a client in a different domain, the swappable parts are `vocabulary.cjs`
(the domain words) and the corpus builder. The terminology layer, grounding,
citation verification and claims guard are domain-agnostic.

---

## 5 · The Academy

`public/community/academy/` — a member-only lab notebook.

- notes go into `lab_notes`, grouped by `lab_chapters`
- `myco-academy.js` is the in-page MYCO chat, showing sources + a coverage
  badge, and now "read as X → Y" when a spelling was corrected
- **posting a note teaches MYCO within two minutes** — `lab-notes.cjs` reads
  Supabase at request time with a 2-minute cache, rather than waiting for a
  rebuild. This is the nicest idea in the system and is easy to port.

---

## 6 · Money

- **Stripe** — `create-payment-intent.js`, `stripe-webhook.js`, `orders` table
- the shop is static HTML + Stripe; prices live in three places (see
  `docs/HANDOFF.md`)
- `$MYCEL` / Hyphae is a **utility token concept, not deployed** —
  `contract_deployed: false`. A fork almost certainly drops this entirely.

---

## 7 · What a client fork must change

Ordered by how much it will hurt if missed.

1. **Admin allowlist → a role column.** Hardcoded emails in `global-nav.js`,
   `academy/index.html` and `spore/app-living.jsx`. Non-negotiable for a
   second tenant.
2. **Legal identity.** `public/terms/`, `public/privacy/` — see commit
   `fc897e0` for how wrong this can get. Contracting party, data controller,
   jurisdiction.
3. **Supabase project + env.** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (public by
   design), `SUPABASE_SERVICE_KEY` (never client-side), `RESEND_API_KEY`,
   `ANTHROPIC_API_KEY`, `STRIPE_*`, `DIGEST_INBOX`, `DIGEST_KEY`.
4. **Run every `.sql` in order.** They are idempotent; the `*-lockdown` and
   `hardening` ones are not optional.
5. **The corpus.** `herbs.ts` is Fungai's. A client brings their own domain
   data and re-runs `build:myco-kb`.
6. **Brand tokens.** One CSS variable block per page defines the palette —
   see the top of `public/atlas/index.html`.
7. **Known debt, inherited if you fork today:** the compose endpoint has no
   spend cap (in-memory rate limit only), the typecheck backlog is 47 errors,
   and `entitlements` is referenced but the table does not exist.

---

## 8 · The one thing that is genuinely reusable as a product

Strip the botany and what remains is a **passwordless, invite-only member
portal with a grounded AI assistant that cites its sources, a member-written
knowledge base that feeds that assistant live, scheduled email digests, and a
security model where the database — not the UI — decides what anyone can
read.**

That is the fork. The herbs are the easy part to replace.
