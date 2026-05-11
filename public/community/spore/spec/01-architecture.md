# 01 · Architecture

## Stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) on Vercel | Reuses the React components from the prototype almost as-is. The two prototype HTML files become two Next.js routes (`/` and `/living`). |
| **Backend + DB + Auth** | **Supabase** (Postgres + Auth + Storage + Row-Level Security) | One service for auth, database, file uploads (specimen photos, contribution evidence), and realtime. RLS lets the frontend talk to the DB directly without a custom API server for most reads. |
| **Server actions / write paths** | Next.js Server Actions + Supabase service role | Use server actions for balance mutations (earn, spend, unlock, buy) so the client can never write balances directly. RLS enforces this — only the service role can mutate `wallet_balance`. |
| **Payments (€)** | Stripe Checkout + Stripe Connect (later, for paying foragers) | Industry standard. Connect handles paying contributors out in € when they want to cash out reputation, in a future phase. |
| **Email / notifications** | Resend | Booking confirmations, contribution-approved emails. |
| **Image hosting** | Supabase Storage + Next/Image | Specimen photos, product photos, experience hero images. |
| **Future on-chain** | Base or Optimism + viem + WalletConnect | When ready to deploy $HYPHAE. See `05-phase-plan.md`. |

## Why not Convex / Firebase / custom Express?

- **Convex** is excellent and tempting; chose Supabase because Postgres + RLS gives you SQL-level guarantees for money-like data, and the eventual on-chain migration is easier when your source-of-truth is a relational schema.
- **Firebase** — auth is fine, but Firestore's data model fights you for anything with relations (contributions ↔ users ↔ nodes ↔ products).
- **Custom Express + Postgres** — fine, but you'd rebuild auth, RLS, storage, and admin UI that Supabase gives you free.

## System diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       NEXT.JS APP (Vercel)                   │
│  ┌─────────────────────────┐  ┌────────────────────────────┐ │
│  │  Client components       │  │  Server actions             │ │
│  │  - NetworkPage           │  │  - earn(amount, label)      │ │
│  │  - ApothecaryPage        │  │  - spend / unlock / buy     │ │
│  │  - ExperiencesPage       │  │  - approveContribution      │ │
│  │  - EconomyPage           │  │  - createCheckout (Stripe)  │ │
│  │                          │  │                             │ │
│  │  reads via supabase-js   │──│  writes via service role    │ │
│  │  (RLS enforces access)   │  │  (bypasses RLS, validated)  │ │
│  └─────────────────────────┘  └────────────────────────────┘ │
└────────────────────┬───────────────────────┬─────────────────┘
                     │                       │
              ┌──────▼──────┐         ┌──────▼──────┐
              │  Supabase   │         │   Stripe    │
              │  Postgres   │         │  (€ payment)│
              │  Auth       │         └─────────────┘
              │  Storage    │
              │  Realtime   │
              └─────────────┘
```

## Hosting cost (rough)

| Service | Tier | $/mo |
|---|---|---|
| Vercel | Hobby → Pro | $0–20 |
| Supabase | Free → Pro | $0–25 |
| Stripe | per-transaction | 1.4% + €0.25 |
| Resend | Free → Pro | $0–20 |
| Domain | — | $1 |
| **Total fixed** | | **~$0–66/mo** |

Plenty of room to validate the economy before any token spend.

## Repository structure

```
spore/
├── apps/
│   └── web/                    # Next.js app
│       ├── app/
│       │   ├── (apothecary)/   # v1 design at /
│       │   ├── (living)/       # v2 design at /living
│       │   ├── network/
│       │   ├── apothecary/
│       │   ├── experiences/
│       │   └── economy/
│       ├── components/         # ported from prototype JSX
│       ├── lib/
│       │   ├── supabase/
│       │   ├── stripe/
│       │   └── economy.ts      # earn/spend/unlock/buy logic
│       └── server-actions/
├── packages/
│   └── db/                     # Supabase schema + migrations
└── spec/                       # this folder
```
