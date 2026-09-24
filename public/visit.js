/* visit.js — one beacon, one page view.
   ────────────────────────────────────────────────────────────────
   Deliberately its own file rather than a few lines inside
   global-nav.js: global-nav is only on 30 of the 37 pages, and the two
   missing ones were /atlas and /find-your-formula — the pages most worth
   measuring. This loads everywhere instead.

   It sets no cookie, writes no localStorage, and generates no visitor
   id. Nothing here can tie two page views to the same person, which is
   why the report counts VIEWS and never claims to count visitors.
   Country, device and language are worked out server-side from headers
   the browser already sends (see netlify/functions/collect-visit.mjs).

   `keepalive` so the request survives the page being closed straight
   after load, and a `catch` that swallows everything — an analytics
   failure must never be visible on the page or block anything. */
(function () {
  try {
    // Never count our own browsing, and never count a preview build.
    var h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')) return;
    if (/deploy-preview|--.*\.netlify\.app/.test(h)) return;

    // Respect Do Not Track. It costs one visit and it is the difference
    // between counting people and watching them.
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

    var body = JSON.stringify({
      p: location.pathname,
      r: document.referrer || '',
      l: (navigator.language || '').slice(0, 8)
    });

    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      keepalive: true,
      credentials: 'omit'
    }).catch(function () {});
  } catch (e) { /* analytics never breaks a page */ }
})();
