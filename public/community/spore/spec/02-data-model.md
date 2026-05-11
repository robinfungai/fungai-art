# 02 · Data Model

Postgres schema (Supabase). All tables have `created_at timestamptz default now()` and `updated_at` (trigger). Money/balance columns use `numeric(20,4)` to avoid float drift; reputation uses `integer`.

## Tables

### `profiles`
One row per authenticated user. Created automatically via Supabase Auth trigger on signup.

| col | type | notes |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `handle` | text unique | display name, e.g. `@birch` |
| `email` | text | mirrored from auth |
| `avatar_url` | text | Supabase Storage path |
| `bio` | text | |
| `home_node_id` | uuid FK → `nodes` | optional |
| `reputation_points` | integer default 0 | derived from approved contributions, but cached here |
| `reputation_tier` | text | computed: `seed` / `forager` / `mycelium` / `keystone` |
| `role` | text default `'member'` | `member` / `forager` / `steward` / `admin` |

### `nodes`
Physical locations / hubs. Berlin Studio, Sweden Foraging, Genoa Castle, etc.

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | `berlin`, `sweden`, `genoa` |
| `name` | text | `Berlin Studio / LAB` |
| `sub` | text | tagline |
| `region` | text | `DE-BE`, `SE-N`, `IT-GE` |
| `coords` | point | `(lat, lon)` for the map |
| `activity` | text | `live` / `proposed` / `seasonal` |
| `color` | text | hex, for the map |
| `requirement` | text | for proposed nodes — what's needed to activate |
| `proposed_by` | uuid FK → `profiles` | for proposed nodes |
| `live_since` | date | |

### `contribution_types`
The catalog of things someone can do to earn $H. Editable by admins.

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `node_id` | uuid FK → `nodes` nullable | null = available at any node |
| `label` | text | "Kitchen help" |
| `sub` | text | "1 day · evening shift" |
| `earn_h` | numeric(20,4) | $H reward |
| `rep_points` | integer | rep gained |
| `requires_approval` | boolean default true | auto-credit vs steward review |
| `active` | boolean default true | |

### `contributions`
The ledger of completed work. **Source of truth for reputation.**

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → `profiles` | who did it |
| `contribution_type_id` | uuid FK → `contribution_types` | |
| `node_id` | uuid FK → `nodes` | where |
| `status` | text | `pending` / `approved` / `rejected` |
| `evidence_url` | text | photo, doc, link |
| `notes` | text | freeform |
| `reviewed_by` | uuid FK → `profiles` | steward who approved |
| `reviewed_at` | timestamptz | |
| `earn_h` | numeric(20,4) | snapshot at time of approval |
| `rep_points` | integer | snapshot |
| `submitted_at` | timestamptz default now() | |

### `wallets`
One row per profile. Append-only ledger lives in `wallet_entries`; this table caches the current balance for fast reads.

| col | type | notes |
|---|---|---|
| `profile_id` | uuid PK FK → `profiles` | |
| `balance_h` | numeric(20,4) default 0 | cached, recomputed by trigger from `wallet_entries` |
| `lifetime_earned_h` | numeric(20,4) default 0 | |
| `lifetime_spent_h` | numeric(20,4) default 0 | |

### `wallet_entries`
**Append-only, immutable** ledger. Every change to balance writes a row. Sum of `delta_h` per profile = `balance_h`.

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → `profiles` | |
| `delta_h` | numeric(20,4) | + earn, − spend |
| `kind` | text | `earn` / `spend` / `unlock` / `buy` / `refund` / `adjustment` |
| `ref_table` | text | `contributions` / `orders` / `bookings` / `experience_unlocks` |
| `ref_id` | uuid | row id in that table |
| `label` | text | human-readable |
| `created_at` | timestamptz default now() | |

Constraint: `delta_h != 0`. No updates allowed (RLS + revoke).

### `products`
Apothecary catalog.

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | |
| `name` | text | |
| `category` | text | `tincture` / `dried` / `composition` |
| `description` | text | |
| `volume` | text | `30ml` |
| `price_eur_cents` | integer | |
| `price_h` | numeric(20,4) | |
| `bg_color` | text | for the prod-art block |
| `image_url` | text | |
| `stock` | integer | null = unlimited |
| `active` | boolean default true | |

### `orders`
A purchase. Either paid in € (Stripe) or in $H.

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → `profiles` | |
| `product_id` | uuid FK → `products` | |
| `payment_method` | text | `eur` / `hyphae` |
| `amount_eur_cents` | integer nullable | |
| `amount_h` | numeric(20,4) nullable | |
| `status` | text | `pending` / `paid` / `shipped` / `delivered` / `refunded` |
| `stripe_payment_intent` | text | |
| `shipping_address` | jsonb | |
| `tracking_number` | text | |

### `experiences`
Dinners, ceremonies, residencies, labs.

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | |
| `title` | text | |
| `description` | text | |
| `node_id` | uuid FK → `nodes` | |
| `tag` | text | `open` / `locked` / `limited` / `work` |
| `tag_label` | text | display |
| `price_eur_cents` | integer nullable | null = $H only |
| `price_h` | numeric(20,4) nullable | |
| `min_h_to_unlock` | numeric(20,4) default 0 | gate |
| `min_rep_to_unlock` | integer default 0 | gate |
| `earn_back_h` | numeric(20,4) nullable | for "work" experiences |
| `seats` | integer | |
| `seats_taken` | integer default 0 | |
| `starts_at` | timestamptz | |
| `ends_at` | timestamptz | |
| `bg_color` | text | |
| `featured` | boolean default false | |

### `experience_unlocks`
NFT-precursor: when a user spends $H to unlock access to an experience. Becomes the access-key NFT in phase 3.

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → `profiles` | |
| `experience_id` | uuid FK → `experiences` | |
| `paid_h` | numeric(20,4) | snapshot |
| `unlocked_at` | timestamptz default now() | |
| `nft_token_id` | text nullable | populated when minted on-chain |
| `nft_chain` | text nullable | `base` / `optimism` |

Unique (`profile_id`, `experience_id`).

### `bookings`
A seat reservation for a specific experience instance. `experience_unlocks` grants the right to book; this is the actual seat.

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `profile_id` | uuid FK → `profiles` | |
| `experience_id` | uuid FK → `experiences` | |
| `unlock_id` | uuid FK → `experience_unlocks` nullable | null if open-access |
| `payment_method` | text | `eur` / `hyphae` / `unlock` |
| `amount_eur_cents` | integer nullable | |
| `amount_h` | numeric(20,4) nullable | |
| `status` | text | `confirmed` / `attended` / `no-show` / `cancelled` |
| `confirmed_at` | timestamptz | |

### `specimens` (for the catalog you suggested)

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | `schizophyllum-commune` |
| `binomial` | text | `Schizophyllum commune` |
| `family` | text | `Schizophyllaceae` |
| `habitat` | text | |
| `node_id` | uuid FK → `nodes` | foraged at |
| `forager_id` | uuid FK → `profiles` | who found it |
| `foraged_at` | date | |
| `image_url` | text | |
| `notes` | text | |

### `batches`
Provenance: links specimens → products. A batch is a production run.

| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `serial` | text unique | `2024-Q4-014` |
| `product_id` | uuid FK → `products` | |
| `specimen_id` | uuid FK → `specimens` | |
| `yield_units` | integer | |
| `produced_at` | date | |
| `notes` | text | |

`orders.batch_id` (optional FK) ties a delivered order back to a specific batch for full traceability.

## Row-Level Security (RLS) summary

| table | read | write |
|---|---|---|
| `profiles` | self + public fields for others | self (own row) |
| `nodes`, `contribution_types`, `products`, `experiences`, `specimens` | public | admin only |
| `contributions` | self + stewards/admins | insert: self (status=pending); update: stewards |
| `wallets`, `wallet_entries` | self only | **service role only** (server actions) |
| `orders`, `bookings`, `experience_unlocks` | self + admins | insert: server actions only |
| `batches` | public | admin only |

**Critical rule:** the frontend can never write to `wallet_entries`. All earn/spend/unlock/buy go through server actions that validate balance, write the ledger row, and update the cached `wallets.balance_h` in a transaction.
