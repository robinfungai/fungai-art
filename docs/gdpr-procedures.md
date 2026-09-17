# GDPR procedures — internal runbook

**Audience: Robin.** This is what to actually *do* when a request or an
incident arrives. The public promises live in `public/privacy/index.html`;
this file is how those promises get kept.

Controller: Fungai Art — **legal business name and postal address still
need filling in here and in the privacy policy.**
Supervisory authority: Integritetsskyddsmyndigheten (IMY), Sweden — imy.se.

---

## Where personal data actually lives

| Where | What | Deletable |
|---|---|---|
| Supabase `profiles` | name, email, node, tier, admin flag, picture URL | yes |
| Supabase `fyf_formulas` | quiz answers (incl. health answers) in `profile`, composed formula. **No email column** — rows are not keyed to a person | yes, by formula id |
| Supabase `formulas` | one row per completed quiz, incl. `quiz_snapshot` (health answers) and `notes` (their free text). Locked to author/admin by `supabase-formulas-health-lockdown.sql` | yes |
| Supabase `lab_notes`, `snippets`, `feed_events`, `messages_e2e`, `member_herbs`, `event_rsvps`, `hypha_gifts`, `formula_comments` | member-written content | yes |
| Supabase `orders` | order + delivery details (`customer_email`) | **7 years** (accounting law) |
| Supabase `newsletter_subscribers` | email, consent timestamp | yes |
| Supabase Storage `avatars` | uploaded pictures, under `<auth_user_id>/` | yes |
| Supabase `auth.users` | the account itself | yes |
| Stripe | payments, last4, billing | Stripe's own retention |
| Resend | sent-email logs | Resend's own retention |
| Robin's inbox | enquiry threads | yes — delete manually |
| Anthropic | MYCO messages, briefly, for abuse monitoring | not ours to delete |
| Netlify logs | IP addresses in request logs, short-lived | rolls over |

MYCO stores **nothing** in our database today. If that changes, add the
table here and update the privacy policy *before* shipping it.

---

## 1 · Access / export request

**Clock: 30 days.** Free. Identity: if the mail comes from the address on
the account, that is enough; otherwise ask one confirming question (an
order number, the node they joined). Never ask for ID documents.

1. Run the export SQL below in Supabase (SQL editor) with their email.
2. Save the result as JSON; export `orders` rows as CSV as well.
3. Include the uploaded picture if there is one.
4. Send it as an attachment to the address on the account. Say what's in
   it, and note what you kept and why (orders, accounting law).
5. Log the request in the register at the bottom of this file.

```sql
-- Replace the email in BOTH places; everything below keys off it.
with me as (
  select id, auth_user_id from public.profiles
  where lower(email) = lower('PERSON@EXAMPLE.COM')
)
select 'profile'  as source, to_jsonb(p) as row from public.profiles p join me on p.id = me.id
union all select 'orders',       to_jsonb(o) from public.orders o  where lower(o.customer_email) = lower('PERSON@EXAMPLE.COM')
union all select 'lab_notes',    to_jsonb(l) from public.lab_notes l    join me on l.author_id = me.id
union all select 'snippets',     to_jsonb(s) from public.snippets s     join me on s.author_id = me.id
union all select 'feed',         to_jsonb(e) from public.feed_events e  join me on e.actor_profile = me.id
union all select 'rsvps',        to_jsonb(r) from public.event_rsvps r  join me on r.auth_user_id = me.auth_user_id
union all select 'member_herbs', to_jsonb(h) from public.member_herbs h join me on h.profile_id = me.id
union all select 'messages',     to_jsonb(m) from public.messages_e2e m join me on m.from_auth_user_id = me.auth_user_id or m.to_profile_id = me.id
union all select 'gifts',        to_jsonb(g) from public.hypha_gifts g  join me on g.from_auth_user_id = me.auth_user_id or g.to_profile_id = me.id
union all select 'shared_formulas', to_jsonb(f) from public.formulas f  join me on f.author_id = me.auth_user_id
union all select 'newsletter',   to_jsonb(n) from public.newsletter_subscribers n where lower(n.email) = lower('PERSON@EXAMPLE.COM');
```

**Formula readings are a special case.** `fyf_formulas` has no email
column — a reading is not linked to a person in the database. If they
want their readings, ask for the formula id from their reservation email
and fetch it directly:

```sql
select * from public.fyf_formulas where id = 'fyf_…';
```

Messages in `messages_e2e` are end-to-end encrypted: you can export the
rows, but you cannot read or decrypt the contents, and neither can we.

Column names drift as tables change — if a join errors, check the table
first rather than skipping it silently.

---

## 2 · Deletion request

**Clock: 30 days.** Confirm in writing what will go and what must stay
*before* deleting, because it cannot be undone.

1. Export first (section 1) and send it — people often want a copy.
2. Delete storage: Supabase → Storage → `avatars` → the folder named with
   their `auth_user_id`.
3. Run the deletion SQL below.
4. Delete the account: Supabase → Authentication → Users → delete.
5. Unsubscribe them from the newsletter if it wasn't caught above.
6. Delete the email thread from the inbox once the request is closed.
7. Tell them it's done, and mention that encrypted backups roll over
   within about a week.
8. Log it below.

```sql
-- Run as a block. Order matters: child rows before the profile.
begin;
create temp table me as
  select id, auth_user_id from public.profiles
  where lower(email) = lower('PERSON@EXAMPLE.COM');

delete from public.event_rsvps  where auth_user_id in (select auth_user_id from me);
delete from public.member_herbs where profile_id   in (select id from me);
delete from public.lab_notes    where author_id    in (select id from me);
delete from public.snippets     where author_id    in (select id from me);
delete from public.feed_events  where actor_profile in (select id from me);
delete from public.messages_e2e where from_auth_user_id in (select auth_user_id from me)
                                   or to_profile_id     in (select id from me);
delete from public.hypha_gifts  where from_auth_user_id in (select auth_user_id from me)
                                   or to_profile_id     in (select id from me);
delete from public.formulas     where author_id in (select auth_user_id from me);
delete from public.newsletter_subscribers where lower(email) = lower('PERSON@EXAMPLE.COM');
delete from public.profiles     where id in (select id from me);
drop table me;
commit;
```

Then the readings, if they asked for those too and gave you the id(s)
from their reservation email:

```sql
delete from public.fyf_formulas where id = 'fyf_…';
```

**Orders stay.** Swedish accounting law (bokföringslagen) requires the
record for seven years. Say so plainly; do not delete them, and do not
promise you will.

---

## 3 · Retention — what expires when

Retention only means something if something actually expires. Until this
is automated, review it **once a quarter** (put it in the calendar):

- `orders` older than 7 years → delete.
- `fyf_formulas` that were never reserved and are older than 12 months →
  delete. They are quiz answers including health data, kept for no reason
  once the reading is stale.
- `newsletter_subscribers` marked unsubscribed → delete after 30 days.
- Enquiry threads in the inbox older than 2 years → delete.

```sql
-- Quarterly cleanup. Read the counts first, then run the deletes.
select count(*) from public.orders       where created_at < now() - interval '7 years';
select count(*) from public.fyf_formulas where created_at < now() - interval '12 months';
select count(*) from public.formulas     where created_at < now() - interval '12 months'
                                           and source like 'find-your-formula%';
select count(*) from public.newsletter_subscribers
  where unsubscribed_at is not null and unsubscribed_at < now() - interval '30 days';

-- delete from public.orders       where created_at < now() - interval '7 years';
-- delete from public.fyf_formulas where created_at < now() - interval '12 months';
-- delete from public.formulas     where created_at < now() - interval '12 months'
--                                   and source like 'find-your-formula%';
-- delete from public.newsletter_subscribers
--   where unsubscribed_at is not null and unsubscribed_at < now() - interval '30 days';
```

Deleting old `formulas` rows also clears their `quiz_snapshot` health
answers, which is the main reason to keep this on a schedule. Robin's
analytics views read that column, so expect the stats to cover the last
12 months only — that is the trade, and it is the right side of it.

---

## 4 · Breach procedure

A breach is not only a hacker. A wrong-recipient email with member data,
a leaked key, a lost laptop and a public bucket all count.

**Hour 0 — contain.** Rotate the exposed key (Netlify → environment
variables; Supabase → API keys; Stripe → API keys), revoke sessions, take
the affected surface down if needed. Do not clean up evidence.

**Hours 0–24 — establish the facts.** Write down, as you learn them:
what happened and when, how you found out, which data and roughly how
many people, whether it's still ongoing, and what could realistically
happen to those people as a result.

**By hour 72 — report to IMY** at imy.se, unless it is genuinely unlikely
to pose any risk (record that reasoning either way). If you don't have
the full picture yet, report anyway and update — late is worse than
incomplete.

**Then — tell the people affected**, without undue delay, if the risk to
them is high (passwords, health answers, contact details in the wrong
hands). Write it plainly: what happened, what it means for them, what
you've done, what they should do, and how to reach you.

**Afterwards.** Record the incident in the register below — including
breaches you decided not to report, and why. IMY can ask to see it.

---

## 5 · Register

Keep every request and incident here. One line each.

| Date | Type (access/deletion/breach) | Person or scope | What was done | Closed |
|---|---|---|---|---|
| | | | | |
