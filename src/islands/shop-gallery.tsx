// /shop entrance — the apothecary as an infinite 3D gallery, once per visit.
//
// This entry is tiny on purpose. It decides whether to show the intro, puts
// up the overlay (title + "Enter" button) straight away, and only then
// fetches the heavy part — three.js + the gallery — as a separate chunk.
// Someone who clicks Enter before it arrives never downloads it.
//
// Skipped (the shop shows immediately) when:
//   · already seen this browser session
//   · the URL is a deep link (#basket, ?open=basket, any #hash) — e.g. the
//     explorer's "Continue in basket" must land in the basket, not an intro
//   · a phone-sized screen, reduced motion, data-saver / 2G, or no WebGL
//
// Built by scripts/build-islands.cjs → public/islands/shop-gallery.js.

const SEEN_KEY = 'fa_shop_intro_seen_v1';

function shouldShow(): boolean {
  try { if (sessionStorage.getItem(SEEN_KEY)) return false; } catch { /* private mode — still show */ }
  if (location.hash || /[?&]open=basket\b/.test(location.search)) return false;
  if (!window.matchMedia('(min-width: 768px)').matches) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return false;
  try {
    const c = document.createElement('canvas');
    if (!(c.getContext('webgl2') || c.getContext('webgl'))) return false;
  } catch { return false; }
  return true;
}

const CSS = `
#fa-shop-intro{position:fixed;inset:0;z-index:9500;background:#05090C;color:#EDE5D8;opacity:0;transition:opacity .45s ease}
#fa-shop-intro.is-in{opacity:1}
#fa-shop-intro.is-out{opacity:0;pointer-events:none}
#fa-shop-intro .fsi-stage{position:absolute;inset:0}
#fa-shop-intro .fsi-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 16px;pointer-events:none}
#fa-shop-intro .fsi-eyebrow{font-family:'DM Sans',system-ui,sans-serif;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:#88BAC8;mix-blend-mode:difference}
#fa-shop-intro h2{margin:10px 0 0;font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;font-size:clamp(48px,9vw,120px);line-height:.95;letter-spacing:-.01em;color:#fff;mix-blend-mode:exclusion}
#fa-shop-intro h2 em{font-style:italic}
#fa-shop-intro .fsi-enter{pointer-events:auto;margin-top:34px;padding:14px 30px;border-radius:999px;border:.5px solid rgba(237,229,216,.55);background:rgba(5,9,12,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#EDE5D8;font-family:'DM Sans',system-ui,sans-serif;font-size:11px;letter-spacing:.24em;text-transform:uppercase;cursor:pointer;transition:background .25s,color .25s}
#fa-shop-intro .fsi-enter:hover,#fa-shop-intro .fsi-enter:focus-visible{background:#EDE5D8;color:#05090C;outline:none}
#fa-shop-intro .fsi-hint{position:absolute;left:0;right:0;bottom:28px;text-align:center;font-family:'DM Sans',system-ui,sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(192,180,154,.7);pointer-events:none}
`;

function show() {
  const style = document.createElement('style');
  style.id = 'fa-shop-intro-style';
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'fa-shop-intro';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'The apothecary in pictures');
  el.innerHTML =
    '<div class="fsi-stage"></div>' +
    '<div class="fsi-center">' +
      '<span class="fsi-eyebrow">Fungai Art</span>' +
      '<h2>The <em>Apothecary</em></h2>' +
      '<button type="button" class="fsi-enter">Enter the apothecary</button>' +
    '</div>' +
    '<p class="fsi-hint">Scroll or use the arrow keys to wander &middot; Esc to enter</p>';
  document.body.appendChild(el);

  const html = document.documentElement;
  const prevOverflow = html.style.overflow;
  html.style.overflow = 'hidden';
  requestAnimationFrame(() => el.classList.add('is-in'));

  const enterBtn = el.querySelector<HTMLButtonElement>('.fsi-enter')!;
  enterBtn.focus({ preventScroll: true });

  let closed = false;
  let unmount: (() => void) | null = null;

  function close() {
    if (closed) return;
    closed = true;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    document.removeEventListener('keydown', onKey);
    el.classList.add('is-out');
    html.style.overflow = prevOverflow;
    window.setTimeout(() => {
      if (unmount) unmount();
      el.remove();
      style.remove();
    }, 480);
  }
  function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
  enterBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);

  import('./shop-gallery-overlay')
    .then((m) => { if (!closed) unmount = m.mount(el.querySelector<HTMLElement>('.fsi-stage')!); })
    .catch((err) => { console.warn('[shop] gallery intro failed to load:', err); close(); });
}

if (shouldShow()) show();
