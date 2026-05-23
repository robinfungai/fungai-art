/* Fungai Art — $HYPHA membership wallet integration
   Pure vanilla JS. No ethers/web3.js — just window.ethereum + raw JSON-RPC.
   Detects MetaMask (or any EIP-1193 wallet), connects, reads $HYPHA balance,
   exposes window.HYPHA.{ connect, disconnect, balance, isMember, gate }
   plus a 'hypha:change' CustomEvent on state changes.

   Once the contract is deployed, update HYPHA_CONTRACT below. */
(function () {
  // ── Configuration ─────────────────────────────────────────────────────
  const HYPHA_CONTRACT = '0x0000000000000000000000000000000000000000'; // ← paste deployed address
  const POLYGON_CHAIN_ID = '0x89'; // 137 in hex
  const POLYGON_RPC = 'https://polygon-rpc.com';
  const LS_KEY = 'fungai_wallet_connected';

  // ── State ─────────────────────────────────────────────────────────────
  const state = {
    address: null,
    balance: 0n,           // BigInt, in wei (18 decimals)
    balanceWhole: 0,       // human-readable integer
    isMember: false,
    chainOk: false,
    contractDeployed: HYPHA_CONTRACT !== '0x0000000000000000000000000000000000000000',
  };

  // ── Utilities ─────────────────────────────────────────────────────────
  function emit() {
    window.dispatchEvent(new CustomEvent('hypha:change', { detail: { ...state } }));
  }

  function shortAddr(a) {
    if (!a) return '';
    return a.slice(0, 6) + '…' + a.slice(-4);
  }

  function hexToBigInt(h) {
    return BigInt(h || '0x0');
  }

  // Call balanceOf(address) on the HYPHA contract — selector 0x70a08231
  async function readBalance(address) {
    if (!state.contractDeployed) return 0n;
    const padded = address.slice(2).toLowerCase().padStart(64, '0');
    const data = '0x70a08231' + padded;
    try {
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: HYPHA_CONTRACT, data }, 'latest'],
      });
      return hexToBigInt(result);
    } catch (e) {
      console.warn('[HYPHA] balanceOf failed:', e.message);
      return 0n;
    }
  }

  async function ensurePolygon() {
    try {
      const current = await window.ethereum.request({ method: 'eth_chainId' });
      if (current === POLYGON_CHAIN_ID) { state.chainOk = true; return true; }
      // Try switching
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: POLYGON_CHAIN_ID }],
        });
        state.chainOk = true;
        return true;
      } catch (err) {
        // Chain not added — request to add
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
      console.warn('[HYPHA] chain switch failed:', e.message);
      state.chainOk = false;
      return false;
    }
  }

  async function refresh() {
    if (!state.address) {
      state.balance = 0n; state.balanceWhole = 0; state.isMember = false;
      emit();
      return;
    }
    state.balance = await readBalance(state.address);
    state.balanceWhole = Number(state.balance / 10n**18n);
    state.isMember = state.balance > 0n;
    emit();
  }

  // ── Public API ────────────────────────────────────────────────────────
  async function connect() {
    if (typeof window.ethereum === 'undefined') {
      alert('No wallet detected. Please install MetaMask from metamask.io and refresh this page.');
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || !accounts.length) return null;
      state.address = accounts[0];
      await ensurePolygon();
      try { localStorage.setItem(LS_KEY, '1'); } catch (e) {}
      await refresh();
      return state.address;
    } catch (e) {
      console.warn('[HYPHA] connect failed:', e.message);
      return null;
    }
  }

  function disconnect() {
    state.address = null;
    state.balance = 0n;
    state.balanceWhole = 0;
    state.isMember = false;
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    emit();
  }

  // Gate an element — show it only if member, otherwise show a teaser
  function gate(targetSelector, options = {}) {
    const el = typeof targetSelector === 'string' ? document.querySelector(targetSelector) : targetSelector;
    if (!el) return;
    const teaser = options.teaser || '✦ $HYPHA members only — connect your wallet';
    const updateGate = () => {
      if (state.isMember) {
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
    updateGate();
    window.addEventListener('hypha:change', updateGate);
  }

  // ── Auto-reconnect on page load if user was connected before ──────────
  async function autoReconnect() {
    if (typeof window.ethereum === 'undefined') return;
    let was;
    try { was = localStorage.getItem(LS_KEY) === '1'; } catch (e) { was = false; }
    if (!was) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length) {
        state.address = accounts[0];
        const chain = await window.ethereum.request({ method: 'eth_chainId' });
        state.chainOk = chain === POLYGON_CHAIN_ID;
        await refresh();
      }
    } catch (e) {}
  }

  // ── Listen for wallet events ──────────────────────────────────────────
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

  // ── Expose globally ───────────────────────────────────────────────────
  window.HYPHA = {
    connect,
    disconnect,
    gate,
    get state() { return { ...state }; },
    shortAddr,
    POLYGON_CHAIN_ID,
    contractAddress: HYPHA_CONTRACT,
    contractDeployed: state.contractDeployed,
  };

  // Auto-reconnect on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoReconnect);
  } else {
    autoReconnect();
  }
})();
