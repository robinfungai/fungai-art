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

  // Home page (/, /home, /home/) ships its own full-width nav with
  // logo + cart + hamburger. Stacking the membership banner on top of
  // it crowds out the logo and basket on phones (both are position:
  // fixed at top:0). Skip the banner on home — the home nav already
  // links to /community.
  const _path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (_path === '' || _path === '/' || _path === '/home') return;

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
  /* ─── Global brand fonts ─────────────────────────────────────────
     Declared once here so every page gets them without needing its
     own @font-face block. Uses font-display:swap so we never block
     paint on the fallback. */
  @font-face { font-family:'TAN-PARADISO'; src:url('/fonts/TAN-PARADISO.ttf') format('truetype'); font-display:swap; }
  @font-face { font-family:'TAN-PEARL';    src:url('/fonts/fonnts.com-tan-pearl.otf') format('opentype'); font-display:swap; }
  @font-face { font-family:'Bayer';        src:url('/fonts/Bayer-TypeArchiType.otf') format('opentype'); font-display:swap; }

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

  /* ─── FIX: push the main site nav below the member banner ────────
     Every page renders .nav (or #mainNav) as position:fixed;top:0.
     The member banner (z-index:9000) sits at top:0 too, so on ALL
     pages the top ~34-36px of the nav — where the LOGO lives — was
     hidden behind the banner. Especially visible on mobile where
     the logo is the only branding shown.
     This selector kicks in only when the banner is actually present. */
  body.fa-has-member-banner .nav,
  body.fa-has-member-banner #mainNav {
    top: 36px;
  }
  @media (max-width: 760px) {
    body.fa-has-member-banner .nav,
    body.fa-has-member-banner #mainNav {
      top: 34px;
    }
  }

  /* ─── SUBPAGE MOBILE NAV — hamburger + slide-in drawer ─────────
     The shop, dinner-experience and product-detail pages each hide
     their .nav-links on mobile but never grew a hamburger to replace
     them — leaving mobile visitors with LITERALLY no nav access
     besides tapping the logo. This injection gives every non-home
     page a mobile hamburger + drawer so the customer can always
     reach Shop, Dinner, Foraging, Mixology, Community. Desktop is
     untouched (media-query gated).                                */
  #fa-sub-nav-btn {
    display: none;
    position: fixed;
    top: 20px; right: 18px;
    z-index: 8500;
    width: 42px; height: 42px;
    background: rgba(15,18,20,0.85);
    border: 0.5px solid rgba(232,177,75,0.45);
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 14px rgba(0,0,0,0.35);
    -webkit-tap-highlight-color: transparent;
  }
  #fa-sub-nav-btn span {
    display: block;
    width: 20px; height: 1.5px;
    background: #E8B14B;
    transition: transform 0.25s, opacity 0.2s;
  }
  #fa-sub-nav-btn.fa-open span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
  #fa-sub-nav-btn.fa-open span:nth-child(2) { opacity: 0; }
  #fa-sub-nav-btn.fa-open span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }

  #fa-sub-nav-drawer {
    display: none;
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: min(320px, 84vw);
    z-index: 8400;
    background: rgba(5,9,12,0.98);
    backdrop-filter: blur(20px) saturate(140%);
    border-left: 0.5px solid rgba(232,177,75,0.28);
    padding: 84px 28px 28px;
    overflow-y: auto;
    transform: translateX(100%);
    transition: transform 0.28s ease;
  }
  #fa-sub-nav-drawer.fa-open { transform: translateX(0); }
  #fa-sub-nav-drawer .fa-sub-nav-section {
    font-family: 'Bayer', 'DM Sans', sans-serif;
    font-size: 9px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #4D869B;
    margin: 22px 0 10px;
  }
  #fa-sub-nav-drawer .fa-sub-nav-section:first-child { margin-top: 0; }
  #fa-sub-nav-drawer a {
    display: block;
    padding: 12px 4px;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 18px;
    color: #EDE5D8;
    text-decoration: none;
    border-bottom: 0.5px solid rgba(136,186,200,0.08);
    transition: color 0.15s;
  }
  #fa-sub-nav-drawer a:hover,
  #fa-sub-nav-drawer a:active { color: #E8B14B; }
  #fa-sub-nav-drawer a .fa-tag {
    font-family: 'Courier New', monospace;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: lowercase;
    color: #4D869B;
    margin-left: 8px;
    font-weight: 300;
  }

  #fa-sub-nav-overlay {
    display: none;
    position: fixed; inset: 0;
    z-index: 8300;
    background: rgba(5,9,12,0.55);
    backdrop-filter: blur(2px);
    opacity: 0;
    transition: opacity 0.2s;
  }
  #fa-sub-nav-overlay.fa-open { opacity: 1; }

  @media (max-width: 768px) {
    body.fa-subpage #fa-sub-nav-btn { display: flex; }
    body.fa-subpage #fa-sub-nav-drawer.fa-visible,
    body.fa-subpage #fa-sub-nav-overlay.fa-visible { display: block; }
  }
  /* When the banner is present, drop the button down so it doesn't
     collide with the banner's own space. */
  body.fa-subpage.fa-has-member-banner #fa-sub-nav-btn { top: 46px; }
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

  // When localStorage has no member but Supabase has a live auth
  // session (e.g. Robin signed in via magic link on a fresh device and
  // landed directly on /community/academy/ instead of going through
  // /community/ first), fetch the profile, hydrate localStorage, then
  // re-render. Without this the banner stays in guest mode even though
  // the user is authenticated.
  const ADMIN_EMAIL_MAP = {
    'robin@fungai.art':   { id: 'robin',     name: 'Robin',     node: 'unattached', admin: true  },
    'teyae@fungai.art':   { id: 'stephanie', name: 'Stephanie', node: 'unattached', admin: true  },
  };
  let _hydrating = false;
  async function hydrateFromSupabase(){
    if (_hydrating) return;
    if (!window.SBclient || !window.SBauth) return;
    if (readMember()) return;
    _hydrating = true;
    try {
      const user = await window.SBauth.getUser().catch(() => null);
      if (!user || !user.id) return;

      // Look up profile by auth_user_id first.
      let prof = null;
      try {
        const { data } = await window.SBclient
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        prof = data;
      } catch {}

      // Fallback: known admin email → seed from the hardcoded map.
      // The full member identity lives in MEMBERS inside the spore
      // portal; here we only need enough to render the banner.
      if (!prof) {
        const seed = ADMIN_EMAIL_MAP[(user.email || '').toLowerCase()];
        if (seed) prof = { id: seed.id, character_name: seed.name, node: seed.node, is_admin: seed.admin, contact: user.email };
      }
      if (!prof) return;

      const member = {
        id: prof.id,
        name: prof.character_name || prof.name || '',
        character_name: prof.character_name || prof.name || '',
        node: prof.node || 'unattached',
        admin: !!prof.is_admin,
        email: prof.contact || user.email || '',
      };
      // iOS Safari private mode throws on setItem. Render still works
      // off the in-memory `member` we just built, so swallow the throw.
      try {
        localStorage.setItem('spore_active_member', member.id);
        localStorage.setItem('spore_active_member_full', JSON.stringify(member));
      } catch {}
      renderBanner();
    } finally {
      _hydrating = false;
    }
  }

  // If Supabase client is still bootstrapping when this script runs,
  // retry hydration once it's ready.
  window.addEventListener('supabase:ready', () => hydrateFromSupabase());

  // ── Lab-notes global sync ──────────────────────────────────────
  // The academy page has its own retry on load, but that only fires when
  // the member visits /community/academy/. If they wrote notes weeks ago
  // (before the lab_notes SQL existed) and haven't reopened the academy
  // since, those notes are stranded in localStorage — and on a fresh
  // device they appear to be missing because the cloud was never told.
  //
  // This hook runs on EVERY page that loads global-nav.js (i.e. every
  // page except /home), so the moment Robin opens shop / mycelium /
  // community on his desktop, his stuck local entries get pushed and the
  // iPad sees them on its next academy load.
  //
  // Chapter-agnostic on purpose: scans every localStorage key matching
  // `lab_entries_*`, finds entries without `_cloudId`, pushes each.
  // Idempotent — entries that already have `_cloudId` are skipped.
  let _labSyncing = false;
  async function syncStuckLabNotes() {
    if (_labSyncing) return;
    if (!window.SBclient) return;
    _labSyncing = true;
    try {
      // Resolve author identity once for the whole batch — saves N profile
      // lookups when there are many pending entries.
      let profileId = null;
      let authorName = null;
      try {
        const cached = JSON.parse(localStorage.getItem('spore_active_member_full') || 'null');
        if (cached) { profileId = cached.cloudId || null; authorName = cached.name || null; }
      } catch {}

      // Walk localStorage for chapter buckets.
      const chapterKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('lab_entries_')) chapterKeys.push(k);
      }
      if (!chapterKeys.length) return;

      for (const key of chapterKeys) {
        const chapterId = key.slice('lab_entries_'.length);
        let local = [];
        try { local = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
        const pending = local.filter(e => e && !e._cloudId && typeof e.text === 'string' && e.text.trim());
        if (!pending.length) continue;

        for (const entry of pending) {
          try {
            const { data, error } = await window.SBclient
              .from('lab_notes')
              .insert({
                chapter_id:  chapterId,
                text:        entry.text,
                author_id:   profileId,
                author_name: authorName,
                created_at:  new Date(entry.ts || Date.now()).toISOString(),
              })
              .select('id')
              .single();
            if (!error && data?.id) {
              entry._cloudId = data.id;
              if (authorName && !entry._author) entry._author = authorName;
            }
          } catch {}
        }
        try { localStorage.setItem(key, JSON.stringify(local)); } catch {}
      }
    } finally {
      _labSyncing = false;
    }
  }
  window.addEventListener('supabase:ready', () => { syncStuckLabNotes(); });

  // ─── Subpage mobile menu ─────────────────────────────────────────
  // Every non-home page hides its .nav-links on mobile but doesn't ship
  // a hamburger — so mobile customers on /shop, /dinner-experience,
  // product detail pages had zero nav access. Inject a hamburger button
  // + slide-in drawer with the canonical destinations. Home skips this
  // (it has its own full mobile menu already).
  function renderSubpageMobileMenu(){
    document.body.classList.add('fa-subpage');

    if (document.getElementById('fa-sub-nav-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'fa-sub-nav-btn';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';

    const overlay = document.createElement('div');
    overlay.id = 'fa-sub-nav-overlay';

    const drawer = document.createElement('nav');
    drawer.id = 'fa-sub-nav-drawer';
    drawer.setAttribute('aria-label', 'Site navigation');
    drawer.innerHTML = `
      <div class="fa-sub-nav-section">Explore</div>
      <a href="/">Home</a>
      <a href="/shop">Shop <span class="fa-tag">· apothecary</span></a>
      <a href="/dinner-experience">Dinner Experience <span class="fa-tag">· ceremony</span></a>
      <div class="fa-sub-nav-section">Intelligence</div>
      <a href="/foraging">Foraging Map <span class="fa-tag">· ecology</span></a>
      <a href="/herbal-engine-2/">Herbal Engine <span class="fa-tag">· tailored elixir</span></a>
      <a href="/mixology">Mixology <span class="fa-tag">· 212 herbs</span></a>
      <a href="/extraction">Extraction <span class="fa-tag">· alchemy</span></a>
      <div class="fa-sub-nav-section">Community</div>
      <a href="/community">Portal</a>
      <a href="/community/academy/">Alchemy Academy</a>
      <a href="/members">Membership</a>
      <a href="/patron">Patronage</a>
      <div class="fa-sub-nav-section">Sub-lines</div>
      <a href="/moder-jord">Moder Jord <span class="fa-tag">· nordic body-craft</span></a>
      <a href="/tymetonics">Tyme Tonics <span class="fa-tag">· living drinks</span></a>
      <div class="fa-sub-nav-section">Stay in touch</div>
      <a href="/#newsletter">Newsletter <span class="fa-tag">· monthly field notes</span></a>
      <a href="mailto:robin@fungai.art">robin@fungai.art</a>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    document.body.appendChild(btn);

    function open(){
      drawer.classList.add('fa-visible');
      overlay.classList.add('fa-visible');
      // rAF to trigger CSS transition after display switches from none
      requestAnimationFrame(() => {
        drawer.classList.add('fa-open');
        overlay.classList.add('fa-open');
        btn.classList.add('fa-open');
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', 'Close menu');
      });
    }
    function close(){
      drawer.classList.remove('fa-open');
      overlay.classList.remove('fa-open');
      btn.classList.remove('fa-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');
      // Wait for transition, then unmount
      setTimeout(() => {
        drawer.classList.remove('fa-visible');
        overlay.classList.remove('fa-visible');
      }, 280);
    }
    btn.addEventListener('click', () => {
      if (drawer.classList.contains('fa-open')) close(); else open();
    });
    overlay.addEventListener('click', close);
    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('fa-open')) close();
    });
    // Close when a link is clicked (SPA-like nicety, even though it's MPA)
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }

  // ─── Ban check ────────────────────────────────────────────────
  // Runs after Supabase auth hydrates. Looks up the current auth
  // user in the banned_users table (users can only see their own
  // row via RLS, so no ban list leak). If a row is found: sign the
  // user out, blank localStorage, and show a full-screen block. The
  // ban is enforced server-side too (stripe intent + admin RPCs),
  // this is the visible layer.
  let _banChecked = false;
  async function enforceBan(){
    if (_banChecked) return;
    if (!window.SBclient || !window.SBauth) return;
    _banChecked = true;
    try {
      const { data: auth } = await window.SBauth.getUser().catch(() => ({ data: null }));
      const user = auth && auth.user;
      if (!user || !user.id) return;
      // Match by auth_user_id OR email — catches fresh Supabase
      // accounts created with a banned email under a new UUID.
      const emailLc = String(user.email || '').toLowerCase();
      const orClauses = [`auth_user_id.eq.${user.id}`];
      if (emailLc) orClauses.push(`email.eq.${emailLc}`);
      const { data: hits } = await window.SBclient
        .from('banned_users')
        .select('id')
        .or(orClauses.join(','))
        .limit(1);
      if (Array.isArray(hits) && hits.length > 0) {
        try { await window.SBauth.signOut(); } catch {}
        try {
          localStorage.removeItem('spore_active_member_full');
          localStorage.removeItem('spore_active_member');
        } catch {}
        showBannedScreen();
      }
    } catch {}
  }
  function showBannedScreen(){
    if (document.getElementById('fa-banned-screen')) return;
    const el = document.createElement('div');
    el.id = 'fa-banned-screen';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(5,9,12,0.98);color:#EDE5D8;font-family:Georgia,\'Times New Roman\',serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:40px;backdrop-filter:blur(8px);';
    el.innerHTML = ''
      + '<div style="max-width:520px;">'
      + '<div style="font-family:\'Courier New\',monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#8B7E62;margin-bottom:24px;">Access notice</div>'
      + '<p style="font-family:Georgia,serif;font-style:italic;font-size:32px;line-height:1.35;color:#EDE5D8;margin-bottom:20px;">Your access to Fungai Art has been revoked.</p>'
      + '<p style="font-size:14px;line-height:1.7;color:#C0B49A;opacity:0.75;">If you believe this is an error, write to <a href="mailto:robin@fungai.art" style="color:#E8B14B;text-decoration:none;border-bottom:0.5px solid rgba(232,177,75,0.4);">robin@fungai.art</a>.</p>'
      + '</div>';
    document.body.appendChild(el);
  }
  window.addEventListener('supabase:ready', () => { enforceBan(); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { renderBanner(); hydrateFromSupabase(); syncStuckLabNotes(); renderSubpageMobileMenu(); enforceBan(); });
  } else {
    renderBanner();
    hydrateFromSupabase();
    syncStuckLabNotes();
    renderSubpageMobileMenu();
    enforceBan();
  }
})();
