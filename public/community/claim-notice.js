/* ────────────────────────────────────────────────────────────────
   Academy P0.5 · "why is this empty?" notice
   ────────────────────────────────────────────────────────────────
   Academy content (lab notes, chapters, snippets) is about to require
   a CLAIMED member profile, not merely a signed-in account — magic-link
   signup is open to anyone with an email, so "has an account" cannot
   mean "member".

   Today 18 accounts exist and 5 have claimed a profile. Without this,
   the other 13 would open the Academy and see nothing at all, with no
   hint that one step is missing. This renders that hint.

   Three states, from /api/me (server-verified — see netlify/functions/me.mjs):

     signed out            → invite to sign in
     signed in, unclaimed  → invite to claim a member profile
     member                → nothing at all

   Safe to include anywhere: it renders nothing unless there is
   something to say, and never blocks the page.
   ──────────────────────────────────────────────────────────────── */
(function () {
  var MOUNT_ID = 'fa-claim-notice';

  function css() {
    if (document.getElementById(MOUNT_ID + '-style')) return;
    var st = document.createElement('style');
    st.id = MOUNT_ID + '-style';
    st.textContent = [
      '#' + MOUNT_ID + '{position:relative;z-index:40;margin:0 auto;max-width:980px;',
      '  display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;',
      '  padding:14px 18px;border:0.5px solid rgba(232,177,75,0.34);border-radius:10px;',
      '  background:rgba(36,26,15,0.92);color:#C9B894;',
      '  font-family:Georgia,\'Times New Roman\',serif;font-size:14.5px;line-height:1.6}',
      '#' + MOUNT_ID + ' .fa-cn-tag{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:9.5px;',
      '  letter-spacing:0.22em;text-transform:uppercase;color:#E8B14B}',
      '#' + MOUNT_ID + ' .fa-cn-body{flex:1 1 320px;min-width:220px}',
      '#' + MOUNT_ID + ' a.fa-cn-cta{display:inline-block;padding:8px 16px;border-radius:999px;',
      '  border:0.5px solid rgba(232,177,75,0.5);color:#F5D689;text-decoration:none;',
      '  font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.14em;',
      '  text-transform:uppercase;white-space:nowrap}',
      '#' + MOUNT_ID + ' a.fa-cn-cta:hover{background:rgba(232,177,75,0.12)}',
      '#' + MOUNT_ID + ' .fa-cn-who{color:#8B7E62;font-style:italic}',
      '@media (max-width:620px){#' + MOUNT_ID + '{margin:0 12px;padding:13px 14px;font-size:13.5px}}',
    ].join('\n');
    document.head.appendChild(st);
  }

  // The portal renders its own sign-in screen, so a "sign in" banner
  // above it is noise. The Academy has no such screen — there the
  // silence is exactly the problem this notice exists to explain.
  function isPortalRoot() {
    var p = location.pathname.replace(/\/+$/, '');
    return p === '/community' || p === '/community/index.html';
  }

  function render(state, email) {
    var existing = document.getElementById(MOUNT_ID);
    if (existing) existing.remove();
    if (state === 'member') return;
    if (state === 'signed-out' && isPortalRoot()) return;

    css();
    var box = document.createElement('div');
    box.id = MOUNT_ID;
    box.setAttribute('role', 'status');

    var tag  = document.createElement('div');
    tag.className = 'fa-cn-tag';
    tag.textContent = state === 'unclaimed' ? 'One step left' : 'Members only';

    var body = document.createElement('div');
    body.className = 'fa-cn-body';

    var cta = document.createElement('a');
    cta.className = 'fa-cn-cta';
    cta.href = '/community/';

    if (state === 'unclaimed') {
      body.innerHTML = 'You\'re signed in, but this account isn\'t linked to a member profile yet — ' +
                       'so the Academy has nothing to show you. Claim your profile and it opens.';
      if (email) {
        var who = document.createElement('div');
        who.className = 'fa-cn-who';
        who.textContent = 'Signed in as ' + email;
        body.appendChild(who);
      }
      cta.textContent = 'Claim your profile →';
    } else {
      body.textContent = 'The Academy is open to members. Sign in with your email and the notes, ' +
                         'chapters and formulas appear here.';
      cta.textContent = 'Sign in →';
    }

    box.appendChild(tag);
    box.appendChild(body);
    box.appendChild(cta);

    // Sit above the page content, under any fixed site nav.
    var host = document.querySelector('main') || document.body;
    host.insertBefore(box, host.firstChild);
  }

  function resolve() {
    if (!window.SBidentity) return;
    window.SBidentity.get(true).then(function (me) {
      if (!me || me.unavailable) return;           // can't tell → say nothing
      if (me.signedIn && me.profileId) return render('member');
      if (me.signedIn) return render('unclaimed', me.email);
      render('signed-out');
    }).catch(function () {});
  }

  function paint(me) {
    if (!me || me.unavailable) return;
    if (me.signedIn && me.profileId) return render('member');
    if (me.signedIn) return render('unclaimed', me.email);
    render('signed-out');
  }

  if (window.SBidentity) resolve();
  else window.addEventListener('supabase:ready', resolve);
  // Sign-in/out elsewhere on the page repaints from the event payload.
  // It must NOT call resolve() — that fetches, which dispatches this
  // same event, which would loop forever.
  window.addEventListener('fa:identity', function (e) { paint(e && e.detail); });
})();
