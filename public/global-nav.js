/* ════════════════════════════════════════════════════════════════
   Global navigation — one consistent nav, every page.
   ────────────────────────────────────────────────────────────────
   Why: the site used to have two disjoint nav clusters (storefront
   pages linked to Shop / Mixology / Trance; network pages linked to
   Sporing / Draw / Patronage / Portal). A visitor on /members
   couldn't reach the shop without going Home first. Each page also
   hand-rolled its own nav with different labels for the same URL
   (mixology was called "Mixology", "Herbal Engine", "Herbals",
   "Herbal Blending Engine" depending on which page linked to it).

   This file injects ONE thin top bar at the very top of every page
   that includes it, with canonical labels and groupings:

     Primary, always visible:
       Home · Shop · Herbal Engine · Mixology · Community
     "More" dropdown:
       Academy · Foraging · Extraction · Health · Trance
       Sporing · Draw · Patronage · Membership

   The bar uses backdrop-blur + dark glass so it sits cleanly on top
   of every page background. The page's existing per-page nav is
   left untouched — the global bar is additional, hovering above.

   Include with:  <script src="/global-nav.js" defer></script>
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Don't double-inject if a page already calls this twice.
  if (document.getElementById('fa-global-nav')) return;

  // Mapping: every nav entry → canonical href + label. Order matters
  // for the primary row; secondary entries appear in the dropdown.
  const PRIMARY = [
    { href: '/',                       label: 'Home',          slug: 'home' },
    { href: '/shop',                   label: 'Shop',          slug: 'shop' },
    { href: '/herbal-engine-2/',       label: 'Herbal Engine', slug: 'engine' },
    { href: '/mixology',               label: 'Mixology',      slug: 'mixology' },
    { href: '/community',              label: 'Community',     slug: 'community' },
  ];
  const SECONDARY = [
    { href: '/community/academy/',     label: 'Academy',      slug: 'academy' },
    { href: '/foraging',               label: 'Foraging',     slug: 'foraging' },
    { href: '/extraction',             label: 'Extraction',   slug: 'extraction' },
    { href: '/health',                 label: 'Practice',     slug: 'health' },
    { href: '/mycelium-trance',        label: 'Trance',       slug: 'trance' },
    { href: '/sporing',                label: 'Sporing',      slug: 'sporing' },
    { href: '/draw',                   label: 'Draw',         slug: 'draw' },
    { href: '/patron',                 label: 'Patronage',    slug: 'patron' },
    { href: '/members',                label: 'Membership',   slug: 'members' },
  ];

  // Which entry should appear active? Match against the current path,
  // with longest-prefix winning so /community/academy → "Academy" not
  // "Community".
  function activeSlugFor(path) {
    const all = PRIMARY.concat(SECONDARY);
    const norm = path.replace(/\/$/, '') || '/';
    let best = null, bestLen = -1;
    for (const e of all) {
      const eh = e.href.replace(/\/$/, '') || '/';
      if (norm === eh || (eh !== '/' && norm.startsWith(eh))) {
        if (eh.length > bestLen) { best = e.slug; bestLen = eh.length; }
      }
    }
    if (!best) best = norm === '/' || /\/home\/?$/.test(norm) ? 'home' : null;
    return best;
  }
  const active = activeSlugFor(window.location.pathname);

  // ── Styles — scoped to the bar so they don't clash with the page.
  const css = `
  #fa-global-nav, #fa-global-nav *, #fa-global-nav *::before, #fa-global-nav *::after {
    box-sizing: border-box;
  }
  #fa-global-nav {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 9000;
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px;
    padding: 9px 16px;
    background: rgba(7, 11, 8, 0.78);
    backdrop-filter: blur(14px) saturate(120%);
    -webkit-backdrop-filter: blur(14px) saturate(120%);
    border-bottom: 0.5px solid rgba(232,177,75,0.16);
    font-family: 'Geist Mono', 'Courier New', monospace;
    font-size: 10.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #C9B894;
  }
  body.fa-has-global-nav { padding-top: 42px; }
  #fa-global-nav .fa-gn-brand {
    display: inline-flex; align-items: center; gap: 8px;
    text-decoration: none; color: #EDE5D8;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic; font-size: 16px;
    letter-spacing: -0.005em;
    text-transform: none;
    flex-shrink: 0;
  }
  #fa-global-nav .fa-gn-brand .fa-gn-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #E8B14B; box-shadow: 0 0 10px rgba(232,177,75,0.65);
  }
  #fa-global-nav .fa-gn-primary {
    display: flex; gap: 4px; flex: 1; justify-content: center;
    flex-wrap: nowrap; overflow: hidden;
  }
  #fa-global-nav .fa-gn-primary a, #fa-global-nav .fa-gn-more {
    color: #C9B894;
    text-decoration: none;
    padding: 6px 11px;
    border-radius: 999px;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
    border: 0.5px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    background: none;
    font: inherit;
  }
  #fa-global-nav .fa-gn-primary a:hover, #fa-global-nav .fa-gn-more:hover {
    color: #F5D689;
    background: rgba(232,177,75,0.06);
  }
  #fa-global-nav .fa-gn-primary a.on {
    color: #F5D689;
    border-color: rgba(232,177,75,0.32);
    background: rgba(232,177,75,0.08);
  }
  #fa-global-nav .fa-gn-more-wrap { position: relative; flex-shrink: 0; }
  #fa-global-nav .fa-gn-more::after { content: ' ▾'; opacity: 0.55; }
  #fa-global-nav .fa-gn-menu {
    position: absolute; top: 100%; right: 0; margin-top: 8px;
    min-width: 200px;
    background: rgba(10, 14, 11, 0.96);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 0.5px solid rgba(232,177,75,0.22);
    border-radius: 10px;
    padding: 8px;
    display: none;
    box-shadow: 0 12px 36px rgba(0,0,0,0.55);
  }
  #fa-global-nav .fa-gn-more-wrap.open .fa-gn-menu { display: block; }
  #fa-global-nav .fa-gn-menu a {
    display: block;
    padding: 9px 13px;
    color: #C9B894;
    text-decoration: none;
    border-radius: 6px;
    font-size: 10px;
    letter-spacing: 0.18em;
  }
  #fa-global-nav .fa-gn-menu a:hover {
    background: rgba(232,177,75,0.07);
    color: #F5D689;
  }
  #fa-global-nav .fa-gn-menu a.on {
    color: #F5D689;
    background: rgba(232,177,75,0.08);
  }

  /* Mobile — collapse primary into the menu, keep brand + More. */
  @media (max-width: 760px) {
    #fa-global-nav { padding: 8px 12px; font-size: 9.5px; }
    #fa-global-nav .fa-gn-brand { font-size: 14px; }
    #fa-global-nav .fa-gn-primary { display: none; }
    body.fa-has-global-nav { padding-top: 38px; }
  }
  `;

  // Inject the stylesheet once.
  const style = document.createElement('style');
  style.id = 'fa-global-nav-style';
  style.textContent = css;
  document.head.appendChild(style);

  // Build secondary menu — on mobile we inject the primary entries too
  // so the dropdown becomes a complete nav.
  function buildMenuHtml() {
    const allForMenu = window.innerWidth <= 760
      ? PRIMARY.concat(SECONDARY)
      : SECONDARY;
    return allForMenu.map(e =>
      `<a href="${e.href}" class="${e.slug === active ? 'on' : ''}">${e.label}</a>`
    ).join('');
  }

  // Build primary row HTML.
  const primaryHtml = PRIMARY.map(e =>
    `<a href="${e.href}" class="${e.slug === active ? 'on' : ''}">${e.label}</a>`
  ).join('');

  const nav = document.createElement('nav');
  nav.id = 'fa-global-nav';
  nav.setAttribute('aria-label', 'Global navigation');
  nav.innerHTML = `
    <a href="/" class="fa-gn-brand" title="Fungai Art">
      <span class="fa-gn-dot"></span>
      fungai art
    </a>
    <div class="fa-gn-primary">${primaryHtml}</div>
    <div class="fa-gn-more-wrap" id="fa-gn-more-wrap">
      <button type="button" class="fa-gn-more" id="fa-gn-more-btn" aria-haspopup="true" aria-expanded="false">More</button>
      <div class="fa-gn-menu" id="fa-gn-menu" role="menu">${buildMenuHtml()}</div>
    </div>
  `;

  // Insert as first child of body. This is the earliest place that
  // preserves user keyboard nav order (skip-link, then global header).
  function inject() {
    if (document.getElementById('fa-global-nav')) return;
    document.body.insertBefore(nav, document.body.firstChild);
    document.body.classList.add('fa-has-global-nav');

    const wrap = document.getElementById('fa-gn-more-wrap');
    const btn  = document.getElementById('fa-gn-more-btn');
    const menu = document.getElementById('fa-gn-menu');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    // Rebuild menu contents on resize so mobile/desktop swap correctly.
    let rT = null;
    window.addEventListener('resize', () => {
      if (rT) clearTimeout(rT);
      rT = setTimeout(() => { menu.innerHTML = buildMenuHtml(); }, 150);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
