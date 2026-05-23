# Deploying $HYPHA on Polygon — step by step

This guide walks you through deploying the `HyphaToken.sol` contract to Polygon mainnet. Total time: ~15 minutes. Total cost: ~$0.05 in gas (paid in MATIC).

Everything happens in your browser via [Remix IDE](https://remix.ethereum.org). No CLI, no Hardhat, no local setup.

---

## 1. Install MetaMask

If you don't have it yet: [metamask.io](https://metamask.io) → Install browser extension → Create wallet → **Save your seed phrase somewhere safe** (write it on paper, never digital). This wallet will be the **owner** of the contract — only this wallet can mint new $HYPHA.

---

## 2. Add Polygon network to MetaMask

MetaMask opens with Ethereum mainnet selected. Switch to Polygon:

1. Click the network dropdown at the top
2. Click **Add network → Add a network manually**
3. Fill in:
   - **Network name:** `Polygon Mainnet`
   - **RPC URL:** `https://polygon-rpc.com`
   - **Chain ID:** `137`
   - **Currency symbol:** `MATIC` (or POL — same thing)
   - **Block explorer:** `https://polygonscan.com`
4. Save and switch to Polygon

---

## 3. Get a small amount of MATIC for gas

You need ~$1 worth of MATIC to deploy + mint to your first few members.

**Easiest path:** buy MATIC directly inside MetaMask via the "Buy" button (uses Moonpay or Transak). Or:

- Buy on any exchange (Coinbase, Binance, Kraken)
- Withdraw to your MetaMask address **on Polygon network** (not Ethereum — Polygon is its own chain)

Wait until the MATIC shows in MetaMask before continuing.

---

## 4. Open Remix and load the contract

1. Open [remix.ethereum.org](https://remix.ethereum.org)
2. In the **File explorer** (left sidebar), create a new folder `contracts/`
3. Inside it, create a file `HyphaToken.sol`
4. Paste the entire contents of `contracts/HyphaToken.sol` from this repo

---

## 5. Install the OpenZeppelin import

Remix needs the OpenZeppelin contracts that `HyphaToken.sol` imports. The simplest way:

- Click the **Solidity compiler** tab (third icon on the left)
- Click **Advanced Configurations** → enable **Auto compile**
- Remix will automatically resolve the `@openzeppelin/contracts/...` import from the npm registry the first time you compile

---

## 6. Compile

- **Solidity compiler** tab → Compiler version: `0.8.20` or higher
- Click **Compile HyphaToken.sol**
- Should turn green with no errors. If there's a warning about license SPDX, ignore it (it's already set).

---

## 7. Deploy

- Click the **Deploy & run transactions** tab (fourth icon)
- **Environment:** select `Injected Provider - MetaMask`
- MetaMask will pop up asking to connect — approve it
- Confirm at the top that the network shows `Polygon (137)`
- **Contract:** make sure `HyphaToken` is selected (not the OpenZeppelin ones)
- Click the orange **Deploy** button
- MetaMask will pop up showing the gas fee (~$0.01-0.05). Confirm.
- Wait ~5 seconds for confirmation

The deployed contract will appear at the bottom of the Remix sidebar, with its address. **Copy this address** — it's your $HYPHA contract.

---

## 8. Verify the contract on Polygonscan (optional but recommended)

This lets anyone read your contract source on the public blockchain explorer.

1. Open `https://polygonscan.com/address/YOUR_CONTRACT_ADDRESS`
2. Click the **Contract** tab → **Verify and Publish**
3. Compiler type: `Solidity (Single file)`
4. Compiler version: match what Remix used (e.g. `0.8.20`)
5. License: `MIT`
6. Paste the flattened source — Remix can generate this with the "Flatten" plugin if needed
7. Submit

Once verified, your contract appears with a green checkmark on Polygonscan.

---

## 9. Add the contract address to the site

Open `public/hypha-wallet.js` and update:

```js
const HYPHA_CONTRACT = '0xYourDeployedAddress...';
```

Commit and push. The "Connect Wallet" button on the site will now check balances against your real contract.

---

## 10. Mint your first members

Back in Remix, the deployed contract appears at the bottom with all its functions listed. Expand it and use `mintMember`:

- `to`: the member's wallet address (e.g. `0xabc...`)
- `amount`: whole tokens, e.g. `1` (the contract handles the 18-decimal math)
- `note`: any context string, e.g. `"Founding member 001"`

Click the orange **transact** button. MetaMask pops up with the gas fee (~$0.001). Confirm.

The member now holds 1 HYPHA and will be recognised as a member when they connect their wallet to fungai.art.

For batch mints (e.g. distributing to 20 founding members in one transaction), use `batchMint` with an array of addresses.

---

## Cost breakdown

| Action | Approximate cost |
|---|---|
| Deploy contract (one-time) | ~$0.05 |
| Mint to 1 member | ~$0.001 |
| Batch mint to 20 members | ~$0.01 |
| Member balance check (read only) | Free |

Polygon gas is dramatically cheaper than Ethereum mainnet — this is why we use it.

---

## Owner safety

- The wallet that deployed the contract is the **owner** and the only one who can mint. **Never share that wallet's seed phrase.**
- If you ever want to transfer ownership to a multisig or DAO later, the contract has `transferOwnership(address)` from OpenZeppelin's `Ownable`.
- You can deploy a second token contract any time if you need to redo it — there's no central registry.

---

Questions? Email robin@fungai.art (write to yourself when you need to remember a step).
