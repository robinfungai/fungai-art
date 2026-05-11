# 05 · Phase Plan — Mock → Testnet → Mainnet

## Phase 1 — Mock token (months 0–3)

**Goal:** validate the economy with real users without smart-contract risk.

- Everything in `spec/01-04` deployed.
- $HYPHAE is a `numeric` column. Real auth, real DB, real € on the apothecary, real bookings.
- Invite-only beta: 20–50 contributors across Berlin / Sweden / Genoa.
- Track every contribution + ledger entry. **Do not delete data.** This is your token-launch audit trail.

**Success metrics before moving on:**
- ≥ 80% of contributors return for a 2nd contribution
- ≥ 30% of $H earned gets spent (not hoarded)
- ≥ 60% of experiences fill seats
- < 5% of contributions disputed

If those numbers come in soft, **adjust parameters** (earn rates, prices, gates) before deploying anything on-chain. The whole point of phase 1 is having the freedom to tune.

## Phase 2 — Testnet preview (month 3–4)

**Goal:** prove the on-chain mechanics work end-to-end, with no real value at stake.

- Deploy `$HYPHAE` ERC-20 on **Base Sepolia** (testnet).
- Add WalletConnect to the app. Users link a wallet to their profile.
- Add a "Mirror to chain" toggle — when on, every `wallet_entry` mints/burns the corresponding $HYPHAE on testnet to the user's linked wallet. Off-chain ledger stays the source of truth.
- Deploy a simple **AccessKey ERC-721** for `experience_unlocks`. Mint one NFT per unlock on testnet.
- Run 4–6 weeks. Fix anything that breaks.

**No reputation on chain.** Reputation stays in Postgres forever — it's earned, not bought, and putting it on-chain creates a market for it.

## Phase 3 — Mainnet launch (month 4–6)

**Goal:** real token, real ownership, same UX.

### Chain choice: **Base** (Ethereum L2)
- Cheap fees, Coinbase user funnel, EVM compatible.
- Alternative: Optimism. Avoid Solana for v1 (different toolchain, less EVM dev pool).

### Contracts

1. **`$HYPHAE` ERC-20** with:
   - Initial supply minted to a treasury multisig
   - Mintable by a `MINTER_ROLE` (held by the backend service-role account) — this is how off-chain earns become on-chain tokens
   - Burnable by holders (when they spend in the app)
   - No transfer restrictions (Phase 3a) → optional soulbound mode for early period
2. **`SporeAccessKey` ERC-721**
   - One token per `experience_unlocks` row
   - Soulbound (non-transferable) — access keys aren't tradable
   - Metadata: experience name, date, node, foraged-from specimen
3. **`SporeTreasury` Gnosis Safe** (2-of-3 then 3-of-5)
   - Holds the initial mint
   - Approves migrations from off-chain ledger
   - Eventually transitions to community governance

### Migration

For each existing user with a positive `balance_h`:
1. They link a wallet to their profile.
2. The backend `MINTER_ROLE` mints `balance_h` $HYPHAE to their wallet.
3. The `wallet_entries` ledger records a `migration` entry netting their off-chain balance to 0.
4. From that point on, the app reads `balance_h` from chain (via viem) and writes it via mint/burn.
5. Reputation stays in Postgres, displayed alongside chain balance.

Run migration in cohorts of 50 users. Pause if anything diverges by more than 0.0001 $H.

### What stays off-chain forever

- Reputation
- Profiles, avatars, bios
- Contribution evidence and approval history
- Order shipping addresses, booking confirmations
- Specimen + batch metadata (but pin specimen images to IPFS, optionally)

## Phase 4 — Governance (month 12+)

Out of scope here. Mention only: when the multisig dissolves, `$HYPHAE` holders vote on treasury spend, new nodes, and protocol changes via Snapshot or a simple on-chain governor. Reputation gates proposal creation; $HYPHAE gates voting weight.

## Anti-goals (things explicitly not to build)

- DEX listing in phase 3. Token has no liquid market until phase 4+. Avoids speculation, keeps the focus on the economy.
- Yield, staking, vesting. Spore is a labor-credit currency, not a yield instrument.
- Cross-chain bridges. One chain, one canonical $HYPHAE.
- Anon wallets without a profile. Every wallet is linked to a real participant.
