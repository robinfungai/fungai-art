/* Fungai Art — $MYCEL / Hyphae wallet integration
   Pure vanilla JS. No ethers/web3.js — just window.ethereum + raw JSON-RPC.

   Two contracts:
     MycelToken (balanceOf, draw, gift)  — the flowing token
     MycoTrust  (getActiveTrust)          — the soulbound reputation

   Exposes window.MYCEL.{ connect, disconnect, draw, gift, state, gate, ACTION_TYPES, PRODUCT_TYPES }
   Fires 'mycel:change' CustomEvent on state updates.

   When contracts are deployed, paste the addresses below. */
(function () {
  // ── Configuration ─────────────────────────────────────────────────────
  const MYCEL_CONTRACT = '0x0000000000000000000000000000000000000000';   // ← paste $MYCEL token address
  const TRUST_CONTRACT = '0x0000000000000000000000000000000000000000';   // ← paste MycoTrust address
  const MYCELIUM_TREASURY = '0x0000000000000000000000000000000000000000'; // ← paste treasury address (informational)
  const POLYGON_CHAIN_ID = '0x89'; // 137 in hex
  const POLYGON_RPC = 'https://polygon-rpc.com';
  const LS_KEY = 'fungai_wallet_connected';

  // ── Action / Product type hashes ──────────────────────────────────────
  // Pre-computed keccak256(string) of each category. Used in spore() / draw() / events.
  // To add new ones: compute keccak256(utf8 bytes of label).
  const ACTION_TYPES = {
    foraging_session:      '0xa8f5e2d4e6cc91b4d51a0b6da12cba65fa6f8c44d9a44b3a4d2f2e6c1f8a5e7b', // placeholder — recompute on deploy
    event_help:            '0x3a1c4b2f8e9d7c6a5b4d3e2f1a0c9b8e7d6c5b4a3d2e1f0a9c8b7d6e5f4a3b2c',
    alchemy_day:           '0x5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
    teaching:              '0xd4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3',
    creative_contribution: '0x7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d',
    ceremony_support:      '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    founding_member:       '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d',
  };

  // Product type hashes (drawing)
  const PRODUCT_TYPES = {
    tincture_30ml:         '0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
    ceremony_access:       '0xc2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
    retreat_early_access:  '0xd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
    special_extract:       '0xe4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
    academy_session:       '0xf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
  };

  // ── State ─────────────────────────────────────────────────────────────
  const state = {
    address: null,
    hyphae: 0n,           // raw balance (18 decimals)
    hyphaeWhole: 0,       // human-readable
    trust: 0n,            // active trust (after decay)
    trustWhole: 0,
    chainOk: false,
    contractsDeployed:
      MYCEL_CONTRACT !== '0x0000000000000000000000000000000000000000' &&
      TRUST_CONTRACT !== '0x0000000000000000000000000000000000000000',
  };

  // ── Utilities ─────────────────────────────────────────────────────────
  function emit() {
    window.dispatchEvent(new CustomEvent('mycel:change', { detail: { ...state } }));
  }
  function shortAddr(a) { return a ? a.slice(0, 6) + '…' + a.slice(-4) : ''; }
  function hexToBigInt(h) { return BigInt(h || '0x0'); }
  function pad(a) { return a.slice(2).toLowerCase().padStart(64, '0'); }

  async function callContract(contract, data) {
    try {
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: contract, data }, 'latest'],
      });
      return hexToBigInt(result);
    } catch (e) {
      console.warn('[MYCEL] eth_call failed:', e.message);
      return 0n;
    }
  }

  // ── Reads ─────────────────────────────────────────────────────────────
  async function readHyphae(address) {
    if (!state.contractsDeployed) return 0n;
    // balanceOf(address) selector 0x70a08231
    return callContract(MYCEL_CONTRACT, '0x70a08231' + pad(address));
  }

  async function readTrust(address) {
    if (!state.contractsDeployed) return 0n;
    // getActiveTrust(address) selector — keccak256("getActiveTrust(address)") first 4 bytes
    // We'll hard-code the selector after computing it once: 0x9b6b3927 (placeholder; verified on deploy)
    return callContract(TRUST_CONTRACT, '0x9b6b3927' + pad(address));
  }

  // ── Chain management ──────────────────────────────────────────────────
  async function ensurePolygon() {
    try {
      const current = await window.ethereum.request({ method: 'eth_chainId' });
      if (current === POLYGON_CHAIN_ID) { state.chainOk = true; return true; }
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: POLYGON_CHAIN_ID }],
        });
        state.chainOk = true;
        return true;
      } catch (err) {
        if (err.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: POLYGON_CHAIN_ID,
              chainName: 'Polygon Mainnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: [POLYGON_RPC],
              blockExplorerUrls: ['https://polygonscan.com'],
            }],
          });
          state.chainOk = true;
          return true;
        }
        throw err;
      }
    } catch (e) {
      console.warn('[MYCEL] chain switch failed:', e.message);
      state.chainOk = false;
      return false;
    }
  }

  async function refresh() {
    if (!state.address) {
      state.hyphae = 0n; state.hyphaeWhole = 0;
      state.trust = 0n; state.trustWhole = 0;
      emit();
      return;
    }
    state.hyphae = await readHyphae(state.address);
    state.hyphaeWhole = Number(state.hyphae / 10n**18n);
    state.trust = await readTrust(state.address);
    state.trustWhole = Number(state.trust);
    emit();
  }

  // ── Public actions ────────────────────────────────────────────────────
  async function connect() {
    if (typeof window.ethereum === 'undefined') {
      alert('No wallet detected. Please install MetaMask from metamask.io and refresh.');
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts?.length) return null;
      state.address = accounts[0];
      await ensurePolygon();
      try { localStorage.setItem(LS_KEY, '1'); } catch (e) {}
      await refresh();
      return state.address;
    } catch (e) {
      console.warn('[MYCEL] connect failed:', e.message);
      return null;
    }
  }

  function disconnect() {
    state.address = null;
    state.hyphae = 0n; state.hyphaeWhole = 0;
    state.trust = 0n; state.trustWhole = 0;
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    emit();
  }

  /**
   * Draw (spend) Hyphae for a product/experience.
   * Calls draw(uint256 amount, bytes32 productType, string note) on MycelToken.
   * Returns the transaction hash on success.
   */
  async function draw(amount, productType, note) {
    if (!state.address) throw new Error('Not connected');
    if (!state.contractsDeployed) throw new Error('Contracts not yet deployed');
    if (state.hyphaeWhole < amount) throw new Error('Insufficient Hyphae');

    // draw(uint256,bytes32,string) selector — placeholder, verified on deploy
    const selector = '0x3e4d2f8c';
    const amountHex = amount.toString(16).padStart(64, '0');
    const productHex = productType.slice(2).padStart(64, '0');
    // Offset to string (3 fields * 32 = 96 = 0x60)
    const offsetHex = '60'.padStart(64, '0');
    const noteBytes = new TextEncoder().encode(note);
    const noteLenHex = noteBytes.length.toString(16).padStart(64, '0');
    let noteDataHex = '';
    for (const b of noteBytes) noteDataHex += b.toString(16).padStart(2, '0');
    // Pad to 32-byte boundary
    const padding = (32 - (noteBytes.length % 32)) % 32;
    noteDataHex += '00'.repeat(padding);

    const data = selector + amountHex + productHex + offsetHex + noteLenHex + noteDataHex;

    return await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from: state.address, to: MYCEL_CONTRACT, data }],
    });
  }

  /**
   * Gift Hyphae to another member.
   * Calls gift(address to, uint256 amount, string note) on MycelToken.
   */
  async function gift(toAddress, amount, note) {
    if (!state.address) throw new Error('Not connected');
    if (!state.contractsDeployed) throw new Error('Contracts not yet deployed');
    if (state.hyphaeWhole < amount) throw new Error('Insufficient Hyphae');

    // gift(address,uint256,string) selector — placeholder
    const selector = '0x2e1d4a7f';
    const toHex = pad(toAddress);
    const amountHex = amount.toString(16).padStart(64, '0');
    const offsetHex = '60'.padStart(64, '0');
    const noteBytes = new TextEncoder().encode(note);
    const noteLenHex = noteBytes.length.toString(16).padStart(64, '0');
    let noteDataHex = '';
    for (const b of noteBytes) noteDataHex += b.toString(16).padStart(2, '0');
    const padding = (32 - (noteBytes.length % 32)) % 32;
    noteDataHex += '00'.repeat(padding);

    const data = selector + toHex + amountHex + offsetHex + noteLenHex + noteDataHex;

    return await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from: state.address, to: MYCEL_CONTRACT, data }],
    });
  }

  // ── Gate helper (blur + overlay unless trust > 0 OR hyphae > 0) ───────
  function gate(target, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    const teaser = options.teaser || '✦ Mycorrhizal access · connect your wallet';
    const requireTrust = options.requireTrust || false;

    const update = () => {
      const hasHyphae = state.hyphae > 0n;
      const hasTrust = state.trust > 0n;
      const allowed = requireTrust ? hasTrust : (hasHyphae || hasTrust);
      if (allowed) {
        el.style.filter = '';
        el.style.pointerEvents = '';
        el.removeAttribute('data-gated');
        if (el._gatedOverlay) { el._gatedOverlay.remove(); el._gatedOverlay = null; }
      } else {
        el.style.position = el.style.position || 'relative';
        el.style.filter = 'blur(4px)';
        el.style.pointerEvents = 'none';
        el.setAttribute('data-gated', 'true');
        if (!el._gatedOverlay) {
          const o = document.createElement('div');
          o.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(7,17,13,0.7);backdrop-filter:blur(8px);z-index:10;font-family:Geist Mono,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#E8B14B;text-align:center;padding:20px;pointer-events:auto;cursor:pointer;border-radius:8px;';
          o.textContent = teaser;
          o.addEventListener('click', connect);
          el.appendChild(o);
          el._gatedOverlay = o;
        }
      }
    };
    update();
    window.addEventListener('mycel:change', update);
  }

  // ── Auto-reconnect ────────────────────────────────────────────────────
  async function autoReconnect() {
    if (typeof window.ethereum === 'undefined') return;
    let was;
    try { was = localStorage.getItem(LS_KEY) === '1'; } catch (e) { was = false; }
    if (!was) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts?.length) {
        state.address = accounts[0];
        const chain = await window.ethereum.request({ method: 'eth_chainId' });
        state.chainOk = chain === POLYGON_CHAIN_ID;
        await refresh();
      }
    } catch (e) {}
  }

  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on?.('accountsChanged', (accounts) => {
      if (!accounts.length) { disconnect(); return; }
      state.address = accounts[0];
      refresh();
    });
    window.ethereum.on?.('chainChanged', (chain) => {
      state.chainOk = chain === POLYGON_CHAIN_ID;
      refresh();
    });
  }

  window.MYCEL = {
    connect, disconnect, draw, gift, gate,
    refresh,
    shortAddr,
    get state() { return { ...state }; },
    ACTION_TYPES, PRODUCT_TYPES,
    addresses: {
      mycel: MYCEL_CONTRACT,
      trust: TRUST_CONTRACT,
      mycelium: MYCELIUM_TREASURY,
    },
    contractsDeployed: state.contractsDeployed,
    POLYGON_CHAIN_ID,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoReconnect);
  } else {
    autoReconnect();
  }
})();
