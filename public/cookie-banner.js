/* Fungai Art — minimal cookie / privacy notice
   Self-contained, no dependencies. Injects a sleek bottom banner on first visit.
   Dismissed state persists in localStorage. */
(function () {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem('fungai_cookie_ack') === '1') return;
  } catch (e) { return; } // localStorage blocked → don't show banner

  // Don't show on privacy/terms pages themselves
  var path = window.location.pathname;
  if (path === '/privacy' || path === '/privacy/' || path === '/terms' || path === '/terms/') return;

  function inject() {
    if (document.getElementById('fungai-cookie-banner')) return;

    var style = document.createElement('style');
    style.id = 'fungai-cookie-style';
    style.textContent = [
      '#fungai-cookie-banner{',
      '  position:fixed;left:50%;bottom:18px;transform:translateX(-50%);',
      '  z-index:9999;max-width:min(620px,calc(100vw - 32px));width:max-content;',
      '  background:rgba(7,17,13,0.96);backdrop-filter:blur(20px);',
      '  -webkit-backdrop-filter:blur(20px);',
      '  border:0.5px solid rgba(196,134,46,0.25);border-radius:10px;',
      '  padding:14px 18px;color:#C9B894;font-family:"Geist Mono",ui-monospace,monospace;',
      '  font-size:11.5px;line-height:1.55;letter-spacing:0.02em;',
      '  display:flex;align-items:center;gap:14px;flex-wrap:wrap;',
      '  animation:fungai-cookie-in 0.4s cubic-bezier(0.22,1,0.36,1);',
      '  box-shadow:0 10px 40px rgba(0,0,0,0.4);',
      '}',
      '@keyframes fungai-cookie-in{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}',
      '#fungai-cookie-banner .fc-text{flex:1;min-width:200px;}',
      '#fungai-cookie-banner .fc-text b{color:#E6D9B5;font-weight:500;}',
      '#fungai-cookie-banner a{color:#E8B14B;text-decoration:none;border-bottom:0.5px solid rgba(232,177,75,0.4);transition:color 0.15s;}',
      '#fungai-cookie-banner a:hover{color:#F5D689;}',
      '#fungai-cookie-banner .fc-actions{display:flex;gap:8px;align-items:center;flex-shrink:0;}',
      '#fungai-cookie-banner button{',
      '  font-family:inherit;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;',
      '  background:rgba(107,214,111,0.1);border:0.5px solid rgba(107,214,111,0.4);',
      '  color:#6BD66F;padding:8px 16px;border-radius:5px;cursor:pointer;',
      '  transition:background 0.15s,border-color 0.15s;',
      '}',
      '#fungai-cookie-banner button:hover{background:rgba(107,214,111,0.18);border-color:rgba(107,214,111,0.6);}',
      '@media (max-width:520px){#fungai-cookie-banner{font-size:10.5px;padding:12px 14px;gap:10px;}#fungai-cookie-banner button{padding:7px 12px;font-size:8.5px;}}',
    ].join('');
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'fungai-cookie-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie notice');
    bar.innerHTML = [
      '<div class="fc-text">',
      '<b>The forest leaves few traces.</b> We store only what your cart and saved formulas need — no analytics, no tracking. ',
      '<a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>',
      '</div>',
      '<div class="fc-actions">',
      '<button type="button" id="fungai-cookie-ok">Understood</button>',
      '</div>',
    ].join('');
    document.body.appendChild(bar);

    document.getElementById('fungai-cookie-ok').addEventListener('click', function () {
      try { localStorage.setItem('fungai_cookie_ack', '1'); } catch (e) {}
      bar.style.animation = 'fungai-cookie-in 0.3s reverse forwards';
      setTimeout(function () { bar.remove(); }, 320);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
