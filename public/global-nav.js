/* ════════════════════════════════════════════════════════════════
   Membership banner — follows the signed-in member across every page.
   ────────────────────────────────────────────────────────────────
   Robin's revision after the first global-nav pass:
     • The first pass tried to be a generic site nav (Home · Shop ·
       Mixology …) and ended up duplicating every page's hand-crafted
       header. He didn't like that.
     • The replacement: a thin, sticky band that ONLY surfaces the
       member's identity + a tight list of member-relevant destinations.
       It rides above the per-page nav and never tries to replace it.

   What it shows:
     • Signed-in: ✦ Name · Node · → Portal · Academy · Mycelium ·
                  Membership · Sporing · Patronage
     • Signed-out: thin "Become a thread" CTA that links to /community
       so the page itself doesn't have to.

   Identity source:
     localStorage.spore_active_member_full (written by app-living.jsx
     after a successful sign-in). Listens for `storage` events so a
     sign-in in another tab refreshes this banner without a reload.
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (document.getElementById('fa-member-banner')) return;

  // Hide / replace the old generic global nav if it exists from a
  // cached version of this script.
  const stale = document.getElementById('fa-global-nav');
  if (stale) stale.remove();

  // Destinations a member would actually want to reach from anywhere
  // on the site. Order matters: highest-value member action first.
  const MEMBER_LINKS = [
    { href: '/community',           label: 'Portal',     match: /^\/community(\/?$|\/(?!academy))/ },
    { href: '/community/academy/',  label: 'Academy',    match: /^\/community\/academy\// },
    { href: '/mycelium',            label: 'Mycelium',   match: /^\/mycelium\/?$/ },
    { href: '/members',             label: 'Membership', match: /^\/members\/?$/ },
    { href: '/sporing',             label: 'Sporing',    match: /^\/sporing\/?$/ },
    { href: '/patron',              label: 'Patronage',  match: /^\/patron\/?$/ },
  ];

  function readMember(){
    try {
      const cached = JSON.parse(localStorage.getItem('spore_active_member_full') || 'null');
      if (!cached || !cached.id) return null;
      return {
        id: cached.id,
        name: cached.name || cached.character_name || '',
        admin: !!(cached.admin || cached.is_admin),
        node: cached.node || '',
        email: cached.email || '',
      };
    } catch { return null; }
  }

  // The hardcoded node labels live in spore data. We don't import that
  // file from arbitrary pages so use a small local map; falls back to
  // the raw id if no friendly label is known.
  const NODE_LABELS = {
    berlin:   'Berlin · Lab',
    sweden:   'Sweden · Forage',
    festival: 'Festival circuit',
    lisbon:   'Lisbon · Studio',
    beirut:   'Beirut',
    atitlan:  'Lake Atitlán',
    zanzibar: 'Zanzibar',
    bangkok:  'Bangkok',
    bali:     'Bali',
  };
  function nodeLabel(id){ return NODE_LABELS[id] || (id ? id : 'Unattached'); }

  const css = `
  #fa-member-banner, #fa-member-banner *, #fa-member-banner *::before, #fa-member-banner *::after {
    box-sizing: border-box;
  }
  #fa-member-banner {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 9000;
    display: flex; align-items: center; justify-content: space-between;
    gap: 14px;
    padding: 7px 16px;
    background: linear-gradient(180deg, rgba(7, 11, 8, 0.86), rgba(7, 11, 8, 0.74));
    backdrop-filter: blur(14px) saturate(130%);
    -webkit-backdrop-filter: blur(14px) saturate(130%);
    border-bottom: 0.5px solid rgba(232,177,75,0.18);
    font-family: 'Geist Mono', 'Courier New', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #C9B894;
    transition: transform 0.25s ease, opacity 0.25s ease;
  }
  /* Auto-hide on scroll-down, re-show on scroll-up. Mirrors Apple-style
     headers so it never blocks reading flow. */
  #fa-member-banner.fa-mb-hidden { transform: translateY(-110%); opacity: 0; }
  body.fa-has-member-banner { padding-top: 36px; }

  #fa-member-banner .fa-mb-id {
    display: inline-flex; align-items: center; gap: 10px;
    color: #EDE5D8; text-decoration: none;
    flex-shrink: 0; min-width: 0;
  }
  #fa-member-banner .fa-mb-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #E8B14B; box-shadow: 0 0 10px rgba(232,177,75,0.65);
    flex-shrink: 0;
  }
  #fa-member-banner.fa-mb-admin .fa-mb-dot {
    background: #6BD66F; box-shadow: 0 0 10px rgba(107,214,111,0.7);
  }
  #fa-member-banner .fa-mb-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic; font-size: 15px;
    letter-spacing: -0.005em; text-transform: none;
    color: #EDE5D8;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 28ch;
  }
  #fa-member-banner .fa-mb-node {
    font-size: 9px; letter-spacing: 0.22em; color: #8B7E62;
    white-space: nowrap;
  }
  #fa-member-banner .fa-mb-node::before { content: '· '; opacity: 0.5; }
  #fa-member-banner .fa-mb-admin-chip {
    font-size: 7.5px; letter-spacing: 0.28em;
    padding: 2px 6px; border-radius: 3px;
    background: rgba(107,214,111,0.14);
    border: 0.5px solid rgba(107,214,111,0.4);
    color: #B6F0AE;
  }

  #fa-member-banner .fa-mb-links {
    display: flex; gap: 2px; flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  #fa-member-banner .fa-mb-links::-webkit-scrollbar { display: none; }
  #fa-member-banner .fa-mb-links a {
    color: #C9B894;
    text-decoration: none;
    padding: 5px 10px;
    border-radius: 999px;
    transition: background 0.18s, color 0.18s;
    white-space: nowrap;
  }
  #fa-member-banner .fa-mb-links a:hover { color: #F5D689; background: rgba(232,177,75,0.06); }
  #fa-member-banner .fa-mb-links a.on {
    color: #F5D689; background: rgba(232,177,75,0.08);
  }

  /* Signed-out variant: very minimal — just the CTA */
  #fa-member-banner.fa-mb-guest .fa-mb-id { color: #8B7E62; }
  #fa-member-banner.fa-mb-guest .fa-mb-id .fa-mb-name {
    color: #C9B894; font-size: 13px;
  }
  #fa-member-banner.fa-mb-guest .fa-mb-links a.fa-mb-cta {
    color: #1A1208; background: #E8B14B;
    border: 0.5px solid rgba(232,177,75,0.6);
    font-weight: 600;
  }
  #fa-member-banner.fa-mb-guest .fa-mb-links a.fa-mb-cta:hover {
    background: #F5D689;
  }

  @media (max-width: 760px) {
    #fa-member-banner { padding: 6px 12px; gap: 8px; }
    #fa-member-banner .fa-mb-name { font-size: 13px; max-width: 16ch; }
    #fa-member-banner .fa-mb-node { display: none; }
    #fa-member-banner .fa-mb-links a { padding: 4px 8px; font-size: 9.5px; }
    body.fa-has-member-banner { padding-top: 34px; }
  }
  `;

  const style = document.createElement('style');
  style.id = 'fa-member-banner-style';
  style.textContent = css;
  document.head.appendChild(style);

  function renderBanner(){
    const m = readMember();
    let bar = document.getElementById('fa-member-banner');
    if (!bar) {
      bar = document.createElement('nav');
      bar.id = 'fa-member-banner';
      bar.setAttribute('aria-label', 'Membership banner');
      document.body.insertBefore(bar, document.body.firstChild);
      document.body.classList.add('fa-has-member-banner');
    }
    bar.classList.toggle('fa-mb-admin', !!(m && m.admin));
    bar.classList.toggle('fa-mb-guest', !m);

    const path = window.location.pathname;
    const isOn = (re) => re.test(path) ? 'on' : '';

    if (m) {
      bar.innerHTML = `
        <a class="fa-mb-id" href="/community/" title="${m.email || m.name}">
          <span class="fa-mb-dot"></span>
          <span class="fa-mb-name">${escapeHtml(m.name) || 'Member'}</span>
          <span class="fa-mb-node">${escapeHtml(nodeLabel(m.node))}</span>
          ${m.admin ? '<span class="fa-mb-admin-chip">Keeper</span>' : ''}
        </a>
        <div class="fa-mb-links" aria-label="Member destinations">
          ${MEMBER_LINKS.map(l => `<a href="${l.href}" class="${isOn(l.match)}">${l.label}</a>`).join('')}
        </div>
      `;
    } else {
      bar.innerHTML = `
        <a class="fa-mb-id" href="/community/" title="The Mycelium">
          <span class="fa-mb-dot"></span>
          <span class="fa-mb-name">The Mycelium</span>
        </a>
        <div class="fa-mb-links">
          <a href="/community/" class="fa-mb-cta">Become a thread &rarr;</a>
          <a href="/members" class="${isOn(/^\/members\/?$/)}">Membership</a>
        </div>
      `;
    }
  }

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // Auto-hide on scroll-down to keep above-the-fold breathing room.
  let lastY = window.scrollY || 0;
  let hideT = null;
  function onScroll(){
    const y = window.scrollY || 0;
    const bar = document.getElementById('fa-member-banner');
    if (!bar) return;
    if (y < 24) { bar.classList.remove('fa-mb-hidden'); lastY = y; return; }
    const dy = y - lastY;
    if (dy > 6)      bar.classList.add('fa-mb-hidden');
    else if (dy < -4) bar.classList.remove('fa-mb-hidden');
    lastY = y;
  }
  window.addEventListener('scroll', () => {
    if (hideT) cancelAnimationFrame(hideT);
    hideT = requestAnimationFrame(onScroll);
  }, { passive: true });

  // Cross-tab sync: re-render when the spore portal writes a new
  // member, or on a sign-out.
  window.addEventListener('storage', (e) => {
    if (e.key === 'spore_active_member_full' || e.key === 'spore_active_member') renderBanner();
  });

  // Same-tab events (the portal fires its own custom signals on
  // login / member-update).
  ['spore:member-changed', 'spore:login', 'spore:logout'].forEach(evt => {
    window.addEventListener(evt, renderBanner);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBanner);
  } else {
    renderBanner();
  }
})();
