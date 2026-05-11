# 04 · Auth & Permissions

## Auth provider

**Supabase Auth** with:
- Email magic link (primary — frictionless, matches the editorial tone)
- Optionally Google + Apple for v1.1
- **No password.** Wallet sign-in (SIWE) added in phase 2 when we have on-chain accounts.

On signup, a Postgres trigger creates the `profiles` and `wallets` rows.

## Roles

`profiles.role` ∈ `{ member, forager, steward, admin }`

| role | who | can |
|---|---|---|
| `member` | default for everyone | read public data, submit contributions, buy, book |
| `forager` | granted at `forager` rep tier | propose nodes, log foraging specimens |
| `steward` | trusted contributors per hub | approve/reject contributions at their home node |
| `admin` | core team | everything; CRUD on nodes, products, experiences, batches |

Roles are checked in server actions and in RLS policies via a `auth_role(uid)` SQL function.

## Reputation tiers

Computed from `profiles.reputation_points`; cached on the row, recomputed on every contribution approval.

| tier | points | unlocks |
|---|---|---|
| `seed` | 0–9 | open experiences, apothecary |
| `forager` | 10–49 | propose nodes, locked experiences |
| `mycelium` | 50–149 | residencies, governance proposals (phase 3) |
| `keystone` | 150+ | steward eligibility, deep-access labs |

Tiers are one-way. Inactivity decay (optional) is out-of-scope for v1.

## Gating logic

A user can unlock an experience iff:

```ts
balance_h >= experience.min_h_to_unlock &&
reputation_points >= experience.min_rep_to_unlock &&
!already_unlocked
```

All three checks must run server-side in `unlockExperience`. The frontend hints work the same way it does in the prototype (`exp-lock-hint`), but the server is the gatekeeper.

## RLS examples

```sql
-- profiles: anyone can read public fields, only self can update
create policy "profiles_read_public" on profiles
  for select using (true);
create policy "profiles_update_self" on profiles
  for update using (auth.uid() = id);

-- contributions: members insert their own as pending; stewards/admins update
create policy "contrib_insert_self_pending" on contributions
  for insert with check (
    auth.uid() = profile_id and status = 'pending'
  );
create policy "contrib_read_self_or_steward" on contributions
  for select using (
    auth.uid() = profile_id or auth_role(auth.uid()) in ('steward','admin')
  );
create policy "contrib_update_steward" on contributions
  for update using (auth_role(auth.uid()) in ('steward','admin'));

-- wallet_entries: read self, no client writes ever
create policy "we_read_self" on wallet_entries
  for select using (auth.uid() = profile_id);
-- no insert/update policy → service role only
```

## Session shape (client)

```ts
type Session = {
  user: { id: string; email: string };
  profile: {
    handle: string;
    avatarUrl: string;
    role: 'member' | 'forager' | 'steward' | 'admin';
    tier: 'seed' | 'forager' | 'mycelium' | 'keystone';
    reputationPoints: number;
    homeNode: { id: string; name: string } | null;
  };
  wallet: { balanceH: number; lifetimeEarnedH: number };
};
```

Provided to every page via a server component that reads from Supabase once.
