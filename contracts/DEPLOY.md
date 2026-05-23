# Deploying $MYCEL + MycoTrust on Polygon

This guide walks you through deploying both Fungai Art contracts to Polygon mainnet:

- **`MycelToken.sol`** — the $MYCEL token (members call them "Hyphae")
- **`MycoTrust.sol`** — soulbound reputation for Mycorrhizal Governance

Total time: ~25 minutes. Total cost: ~$0.10 in gas (paid in MATIC).

Everything happens in your browser via [Remix IDE](https://remix.ethereum.org). No CLI, no Hardhat, no local setup.

---

## 1. Install MetaMask

If you don't have it yet: [metamask.io](https://metamask.io) → Install browser extension → Create wallet → **Save your seed phrase somewhere safe** (write it on paper, never digital). This wallet will be the **owner** of both contracts.

**Strongly recommended**: get a hardware wallet (Ledger or Trezor, ~€80). The owner wallet controls minting forever — protect it.

---

## 2. Add Polygon network to MetaMask

1. Click the network dropdown at the top of MetaMask
2. Click **Add network → Add a network manually**
3. Fill in:
   - **Network name:** `Polygon Mainnet`
   - **RPC URL:** `https://polygon-rpc.com`
   - **Chain ID:** `137`
   - **Currency symbol:** `MATIC` (or POL — same thing)
   - **Block explorer:** `https://polygonscan.com`
4. Save and switch to Polygon

---

## 3. Fund the wallet with MATIC

You need ~$1 worth of MATIC to deploy both contracts + mint to your first members.

**Easiest path:** buy MATIC directly inside MetaMask via the "Buy" button (uses Moonpay or Transak). Or:

- Buy on any exchange (Coinbase, Binance, Kraken)
- Withdraw to your MetaMask address **on Polygon network** (not Ethereum)

Wait until the MATIC shows in MetaMask before continuing.

---

## 4. Open Remix and load the contracts

1. Open [remix.ethereum.org](https://remix.ethereum.org)
2. In the **File explorer**, create a folder `contracts/`
3. Create two files inside it:
   - `MycelToken.sol` — paste contents from this repo
   - `MycoTrust.sol` — paste contents from this repo

The OpenZeppelin imports (`@openzeppelin/contracts/...`) are auto-resolved by Remix on first compile.

---

## 5. Compile both contracts

- **Solidity compiler** tab → compiler version `0.8.20` or higher
- Click **Compile MycelToken.sol** → wait for green checkmark
- Click **Compile MycoTrust.sol** → wait for green checkmark

If you see any red errors, check the file contents are exactly as in the repo.

---

## 6. Deploy MycoTrust FIRST

We deploy the trust contract before the token, so the token can be configured to ping the trust contract on every activity.

1. **Deploy & run transactions** tab → Environment: `Injected Provider - MetaMask`
2. Approve the MetaMask connection
3. **Contract:** select `MycoTrust`
4. Click the orange **Deploy** button
5. MetaMask pops up showing gas (~$0.02). Confirm.
6. Wait ~5 seconds
7. Copy the deployed contract address from the bottom-left of Remix — **save this as `MYCOTRUST_ADDRESS`**

---

## 7. Decide your Mycelium treasury address

The MycelToken needs a treasury address (`mycelium`) that drawn Hyphae flow into.

**Options:**

- **(Simplest, year 1)** Use a separate MetaMask account you create just for this. Call it "Fungai Art · The Mycelium". Save the seed separately.
- **(Recommended, when ready)** Set up a Gnosis Safe at [safe.global](https://safe.global) on Polygon — multi-sig with you + Steph + one trusted advisor (2-of-3). Use the Safe address as treasury.

Whatever you choose, copy the address — **save this as `MYCELIUM_TREASURY`**.

---

## 8. Deploy MycelToken

1. Back in Remix, still on **Deploy & run transactions** tab
2. **Contract:** select `MycelToken`
3. Beside the orange Deploy button, you'll see a field for the constructor parameter — enter your `MYCELIUM_TREASURY` address
4. Click **Deploy**
5. MetaMask confirms (~$0.05). Confirm.
6. Wait for confirmation
7. Copy the deployed contract address — **save this as `MYCEL_ADDRESS`**

---

## 9. Wire the contracts together

The MycelToken needs to know about MycoTrust, and MycoTrust needs to authorise MycelToken as a pinger.

In Remix, expand the deployed `MycelToken` (bottom of sidebar):

1. Call **`setTrustContract`** with parameter: `MYCOTRUST_ADDRESS`
2. Click `transact` → confirm in MetaMask

Then expand the deployed `MycoTrust`:

1. Call **`setPinger`** with parameters: `MYCEL_ADDRESS`, `true`
2. Click `transact` → confirm in MetaMask

Now whenever someone is sporeed or draws, the MycelToken automatically pings MycoTrust to refresh their `lastActivity` timestamp — keeping their trust from decaying.

---

## 10. Verify both contracts on Polygonscan (recommended)

For each contract:

1. Open `https://polygonscan.com/address/CONTRACT_ADDRESS`
2. Click **Contract** tab → **Verify and Publish**
3. Compiler type: `Solidity (Single file)`
4. Compiler version: match Remix (e.g. `0.8.20`)
5. License: `MIT`
6. Paste the source code
7. Submit

Verified contracts get a green checkmark and let anyone read your source on the public explorer.

---

## 11. Add the addresses to the site

Open `public/mycel-wallet.js` and update:

```js
const MYCEL_CONTRACT = '0xYourMycelTokenAddress...';
const TRUST_CONTRACT = '0xYourMycoTrustAddress...';
const MYCELIUM_TREASURY = '0xYourTreasuryAddress...';
```

Commit and push. The wallet integration goes live immediately.

---

## 12. Spore your first members

Back in Remix, expand the deployed `MycelToken` and use **`spore`**:

| Parameter | Value | Example |
|---|---|---|
| `to` | Member's wallet | `0xabc123...` |
| `amount` | Whole Hyphae | `100` |
| `actionType` | bytes32 of action category | `0x...` (see table below) |
| `note` | Free-form context | `"Königshyttan circle, 15 June"` |

**Action type hashes (compute once, reuse forever):**

In Remix's deploy tab, expand the deployed `MycelToken` → look for any `view` function that takes a `bytes32` → no, easier: use the keccak256 encoder at [emn178.github.io/online-tools/keccak_256.html](https://emn178.github.io/online-tools/keccak_256.html) or simply compute in your browser console:

```js
// Run in any browser console with ethers loaded, or use ethers.utils.id()
// These are the canonical action types — feel free to add more
"foraging_session"     // ~10-15 MYCEL
"event_help"           // ~50-75 MYCEL
"alchemy_day"          // ~100 MYCEL
"teaching"             // varies
"creative_contribution" // varies
"ceremony_support"     // ~75 MYCEL
"founding_member"      // 144 MYCEL one-time
```

Bytes32 hashes for these are pre-computed in `public/mycel-wallet.js` (`ACTION_TYPES` object) so you can copy them from there.

**For batch operations:**

- `batchSpore` — same amount to many members
- `preciseSpore` — different amounts to different members (arrays must be same length)

Each transaction costs ~$0.001 in gas.

---

## 13. Award trust to founding members

Trust is separate from Hyphae. Use `MycoTrust.awardTrust`:

| Parameter | Value | Example |
|---|---|---|
| `member` | Wallet address | `0xabc123...` |
| `amount` | Trust points | `100` (founding members), `50` (long-time contributors), `10` (recent additions) |
| `reason` | Free-form context | `"Founding cohort 001"` |

For batch: `batchAward(address[], amount, reason)`.

---

## Cost summary

| Action | Approximate cost on Polygon |
|---|---|
| Deploy MycoTrust | ~$0.02 |
| Deploy MycelToken | ~$0.05 |
| Wire contracts together (2 txns) | ~$0.005 |
| Spore one member | ~$0.001 |
| Batch spore 20 members | ~$0.01 |
| Award trust | ~$0.001 |
| Member draws a product | ~$0.001 (paid by the member, not you) |

Total to deploy and onboard 20 founding members: **under €0.20.**

---

## Owner safety

- The wallet that deployed the contracts is the **owner** of both. Only this wallet can:
  - Spore (mint) Hyphae
  - Award trust
  - Set the treasury address
  - Change decay rates
- **Never share that wallet's seed phrase.**
- Use a hardware wallet for this address (Ledger, Trezor)
- To transfer ownership later (e.g. to a multi-sig DAO): call `transferOwnership(address)` on each contract

---

## Mycelial growth pattern — recommended cadence

Mycorrhizal Governance grows on natural rhythms, not VC pressure. A suggested cadence:

| Phase | When | Action |
|---|---|---|
| **Seed** | Now | Deploy contracts. Mint $MYCEL to 0 (nothing yet). |
| **Inoculation** | Founding 144 invitation phase | Spore each founding member with a one-time `founding_member` action (e.g. 144 Hyphae). Award 100 trust to each. |
| **Sporulation** | Monthly on the full moon | Spore active contributors for the previous lunar cycle. Publish the spore-list on `/sporing`. |
| **Fruiting** | Quarterly | Open a `/draw` cycle where members can redeem accumulated Hyphae for special extracts or ceremony slots. |
| **Composting** | Annually | Burn 10-25% of treasury Hyphae. Renews scarcity. |

This is your protocol — but it gives you a starting rhythm.

---

Questions? Email yourself at robin@fungai.art (literally — write a note for future-you when you hit a step).
