> **SUPERSEDED — 17 September 2026.**
> This folder is the original developer handoff written *before* the portal was
> built. It proposes Next.js 15 on Vercel with server actions, and a mock
> `$HYPHAE` economy (the token was later renamed `$MYCEL`). None of that stack
> was built: the portal ships as static HTML + browser-compiled JSX on Netlify,
> with Supabase for auth and data.
>
> Keep it for the economics rationale — earn rates, rep tiers, success metrics
> before going on-chain — which is still the thinking behind the live design.
> For the current architecture and the migration plan, read
> `docs/academy/phase-0-audit.md`.

# Spore — Implementation Spec

This folder is the developer handoff for taking the Spore prototype (`Spore Hub.html` / `Spore Hub v2 Living.html`) into a working multi-user product **without launching a real token yet**.

## Strategy

Run a **mock-token economy** as a real backend (real auth, real database, real money on the € side, real reservations) for 2–3 months before deploying a smart contract. The frontend stays exactly as designed — only the data layer changes from `localStorage` to a server.

This lets you:
- Validate earning rates, prices, reputation thresholds with real users
- Build community + contribution history that ports onto the token at launch
- Take real product orders + experience bookings in € today
- Avoid smart-contract risk while the economy is still a hypothesis

## Files

| File | Contents |
|---|---|
| `01-architecture.md` | Stack, system diagram, hosting |
| `02-data-model.md` | Tables, columns, relations, RLS |
| `03-api-surface.md` | Every endpoint the app calls |
| `04-auth-permissions.md` | Login, roles, rep tiers, gating |
| `05-phase-plan.md` | Mock → Testnet → Mainnet migration |

## Recommended next step

Hand this folder + the prototype HTML files to Claude Code or a contract dev. Implementation estimate: **2–3 weeks for a solo dev**, faster with Claude Code.
