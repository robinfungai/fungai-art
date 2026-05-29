// Spore feature-gate. Cross-page enforcement of the per-member restrictions
// configured in the Admin panel on /community.
//
// Usage on any restricted page:
//   <script src="/spore-gate.js"></script>
//   <script>SporeGate.requireAccess('mixology');</script>
//
// Reads localStorage written by the spore app at login time:
//   spore_active_member        — short id ('robin' / 'stephanie' / etc.)
//   spore_active_member_full   — { id, name, admin, restrictions:[], avatar }
//
// Admins always bypass. Anonymous visitors (no spore login) ALSO bypass —
// we only gate users who have actually signed in to the network. This matches
// the user's stance: restrictions are an internal-network tool, not a public
// paywall.

(function () {
  if (window.SporeGate) return; // already loaded

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }

  function getActive() {
    const full = readJSON('spore_active_member_full');
    if (full && typeof full === 'object') return full;
    // Fallback: id-only marker. We can't enforce restrictions without the full
    // object so we treat this as "not gated."
    const id = (function(){ try { return localStorage.getItem('spore_active_member'); } catch { return null; } })();
    return id ? { id, name: id, admin: false, restrictions: [] } : null;
  }

  function isAdmin() {
    const a = getActive();
    return !!(a && a.admin);
  }

  function getRestrictions() {
    if (isAdmin()) return [];
    const a = getActive();
    return (a && Array.isArray(a.restrictions)) ? a.restrictions : [];
  }

  function isRestricted(feature) {
    return getRestrictions().indexOf(feature) >= 0;
  }

  function showGate(feature, opts) {
    const fl = feature.charAt(0).toUpperCase() + feature.slice(1);
    const memberName = (getActive() && getActive().name) || 'this profile';
    const el = document.createElement('div');
    el.id = 'sporeGateOverlay';
    el.style.cssText = [
      'position:fixed','inset:0','z-index:99999',
      'background:rgba(6,9,11,0.96)',
      'backdrop-filter:blur(16px)','-webkit-backdrop-filter:blur(16px)',
      'display:flex','align-items:center','justify-content:center','padding:24px',
      'font-family:"Geist Mono",ui-monospace,monospace','color:#C9B894',
    ].join(';');
    el.innerHTML =
      '<div style="max-width:520px;background:linear-gradient(160deg,#11100D,#181612);border:0.5px solid rgba(225,107,107,0.32);border-radius:14px;padding:36px 30px;text-align:center;">' +
        '<div style="font-size:8px;letter-spacing:0.32em;text-transform:uppercase;color:#E16B6B;margin-bottom:14px;">Restricted · spore network</div>' +
        '<h2 style="font-family:\'Cormorant Garamond\',Georgia,serif;font-style:italic;font-size:34px;color:#E6D9B5;margin:0 0 14px;line-height:1.1;">' + fl + ' is <em style="color:#E16B6B;">gated</em> for ' + escapeHtml(memberName) + '.</h2>' +
        '<p style="font-size:13px;line-height:1.7;margin:0 0 22px;color:#8B7E62;">A network admin restricted access to ' + fl + ' on your profile. Ask Robin or Stephanie if this is unexpected — the toggle is in the Admin panel on /community.</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">' +
          '<a href="/community" style="display:inline-block;padding:11px 22px;border:0.5px solid rgba(232,177,75,0.45);border-radius:6px;color:#F5D689;text-decoration:none;font-size:9.5px;letter-spacing:0.24em;text-transform:uppercase;background:rgba(232,177,75,0.08);">← Spore portal</a>' +
          '<a href="/" style="display:inline-block;padding:11px 22px;border:0.5px solid rgba(201,184,148,0.25);border-radius:6px;color:#8B7E62;text-decoration:none;font-size:9.5px;letter-spacing:0.24em;text-transform:uppercase;">Home</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function requireAccess(feature, opts) {
    if (!isRestricted(feature)) return;
    function attach() { showGate(feature, opts); }
    if (document.body) attach();
    else document.addEventListener('DOMContentLoaded', attach);
  }

  window.SporeGate = {
    isAdmin: isAdmin,
    getRestrictions: getRestrictions,
    isRestricted: isRestricted,
    requireAccess: requireAccess,
  };
})();
