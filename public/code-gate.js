/*
 * Code gate — a quiet access curtain for unlisted pages (/mycelium, /covenant).
 *
 * Load it FIRST inside <head> (plain <script>, no defer) so the page is
 * hidden before anything paints. A correct code unlocks that page on this
 * browser for 7 days. No login needed.
 *
 * This is a curtain, not authentication: the page HTML is still delivered
 * to the browser. Keep genuinely private data out of these pages.
 */
(function () {
  // SHA-256 of the access code — the code itself never appears in source.
  var CODE_SHA256 = '2926a2731f4b312c08982cacf8061eb14bf65c1a87cc5d70e864e079c6220731';
  var UNLOCK_DAYS = 7;
  var KEY = 'fa_gate:' + (location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/');

  try {
    if (Number(localStorage.getItem(KEY) || 0) > Date.now()) return;
  } catch (_) {}

  var root = document.documentElement;
  root.classList.add('fa-gated');
  var style = document.createElement('style');
  style.id = 'fa-gate-style';
  style.textContent =
    'html.fa-gated,html.fa-gated body{background:#05090C !important;overflow:hidden !important}' +
    'html.fa-gated body>*:not(#fa-gate){display:none !important}' +
    '#fa-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;' +
      'background:radial-gradient(ellipse 60% 50% at 50% 40%,rgba(106,191,136,0.08),transparent 70%),#05090C;color:#EDE5D8;' +
      "font-family:'IM Fell English','Cormorant Garamond',Georgia,serif}" +
    '#fa-gate form{width:min(360px,100%);text-align:center}' +
    '#fa-gate .g-eyebrow{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#6abf88;margin-bottom:14px}' +
    '#fa-gate h1{font-weight:400;font-style:italic;font-size:34px;line-height:1.1;margin:0 0 22px}' +
    '#fa-gate input{width:100%;box-sizing:border-box;padding:14px 16px;font:500 22px/1 ui-monospace,monospace;letter-spacing:.5em;text-align:center;' +
      'color:#EDE5D8;background:rgba(155,180,160,.06);border:1px solid rgba(155,180,160,.28);border-radius:12px;outline:none}' +
    '#fa-gate input:focus{border-color:#E8B14B}' +
    '#fa-gate button{margin-top:12px;width:100%;padding:13px;font:500 11px/1 ui-monospace,monospace;letter-spacing:.28em;text-transform:uppercase;' +
      'color:#05090C;background:#E8B14B;border:0;border-radius:999px;cursor:pointer}' +
    '#fa-gate .g-err{min-height:18px;margin-top:12px;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.08em;color:#E16B6B}' +
    '#fa-gate.shake form{animation:faGateShake .35s}' +
    '@keyframes faGateShake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}';
  document.head.appendChild(style);

  function sha256Hex(text) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.resolve(null);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }

  function unlock(gate) {
    try { localStorage.setItem(KEY, String(Date.now() + UNLOCK_DAYS * 864e5)); } catch (_) {}
    root.classList.remove('fa-gated');
    if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
  }

  function build() {
    if (document.getElementById('fa-gate')) return;
    var gate = document.createElement('div');
    gate.id = 'fa-gate';
    gate.innerHTML =
      '<form autocomplete="off" novalidate>' +
        '<div class="g-eyebrow">Fungai Art &middot; a quiet door</div>' +
        '<h1>Enter the code</h1>' +
        '<input type="password" inputmode="numeric" maxlength="12" aria-label="Access code" autofocus>' +
        '<button type="submit">Open</button>' +
        '<div class="g-err" role="status" aria-live="polite"></div>' +
      '</form>';
    document.body.appendChild(gate);
    var form = gate.querySelector('form');
    var input = gate.querySelector('input');
    var err = gate.querySelector('.g-err');
    setTimeout(function () { try { input.focus(); } catch (_) {} }, 50);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = String(input.value || '').trim();
      sha256Hex(value).then(function (hex) {
        if (hex === CODE_SHA256) return unlock(gate);
        err.textContent = hex === null ? 'This browser can’t check the code — try another browser.' : 'That code doesn’t open this door.';
        input.value = '';
        gate.classList.remove('shake'); void gate.offsetWidth; gate.classList.add('shake');
        input.focus();
      });
    });
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
