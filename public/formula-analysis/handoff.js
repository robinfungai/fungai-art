// public/formula-analysis/handoff.js
//
// A formula travels to /formula-analysis/ OUT of the URL (hardening
// checklist #5, 2026-09-29). Herb names and percentages in a link end up
// in browser history, server and CDN logs, analytics and screenshots.
// The page that opens the analysis leaves the formula in localStorage
// under a one-time random key and passes only that key (?ref=…); the
// analysis page takes it and deletes it on arrival, keeping a copy in its
// own tab's sessionStorage so a reload still works. localStorage, not
// sessionStorage, because the analysis opens in a new tab with noopener,
// which does not share sessionStorage. A key never opened is swept after
// a day. Used by Find your formula, Mixology, the formula book and the
// analysis page itself — one implementation.
(function () {
  'use strict';
  var PREFIX = 'fa_handoff_';
  var DAY = 864e5;
  var REF_RE = /^[0-9a-f]{24}$/;

  function newRef() {
    var a = new Uint8Array(12);
    window.crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  function sweep() {
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (!k || k.indexOf(PREFIX) !== 0) continue;
        var v = null;
        try { v = JSON.parse(localStorage.getItem(k)); } catch (_) {}
        if (!v || !v.t || Date.now() - v.t > DAY) localStorage.removeItem(k);
      }
    } catch (_) {}
  }

  function clean(f) {
    return {
      h: (Array.isArray(f.h) ? f.h : []).map(function (x) { return String(x || '').slice(0, 80); }).filter(Boolean).slice(0, 12),
      p: Array.isArray(f.p) ? f.p.map(Number) : null,
      n: String(f.n || '').slice(0, 80),
      src: String(f.src || '').slice(0, 40),
      myco: !!f.myco,
      t: Date.now(),
    };
  }

  // formula: { h: [herb names], p: [percentages] | null, n: name, src, myco }
  function href(formula) {
    sweep();
    var ref = newRef();
    try { localStorage.setItem(PREFIX + ref, JSON.stringify(clean(formula || {}))); }
    catch (_) { return '/formula-analysis/'; }
    return '/formula-analysis/?ref=' + ref;
  }

  // On the analysis page: the formula it was opened with, or null.
  function take(search) {
    sweep();
    var qs = new URLSearchParams(search);
    var ref = qs.get('ref');
    if (ref && REF_RE.test(ref)) {
      var k = PREFIX + ref, raw = null;
      try {
        raw = localStorage.getItem(k);
        if (raw) { localStorage.removeItem(k); sessionStorage.setItem(k, raw); }
        else raw = sessionStorage.getItem(k);
      } catch (_) {}
      try { var d = JSON.parse(raw); if (d && Array.isArray(d.h)) return d; } catch (_) {}
      return null;
    }
    // A link made before (?h=…&p=…) still opens; the formula leaves the
    // address bar at once, and a reload finds it under a key instead.
    if (qs.get('h')) {
      var p = (qs.get('p') || '').split(',').filter(function (x) { return x !== ''; }).map(Number);
      var d2 = clean({ h: qs.get('h').split('|'), p: p.length ? p : null, n: qs.get('n'), src: qs.get('src'), myco: qs.get('myco') === '1' });
      var r = newRef();
      try { sessionStorage.setItem(PREFIX + r, JSON.stringify(d2)); history.replaceState(null, '', location.pathname + '?ref=' + r); }
      catch (_) { try { history.replaceState(null, '', location.pathname); } catch (_) {} }
      return d2;
    }
    return null;
  }

  // An <a> that opens the analysis: the key is made when it is used, so an
  // unclicked link leaves nothing behind.
  function arm(a, getFormula) {
    var prep = function () { var f = getFormula(); if (f) a.href = href(f); };
    a.addEventListener('pointerdown', prep);
    a.addEventListener('keydown', function (e) { if (e.key === 'Enter') prep(); });
    a.addEventListener('click', function () { if (!/[?&]ref=/.test(a.getAttribute('href') || '')) prep(); });
  }

  window.FormulaHandoff = { href: href, take: take, arm: arm };
})();
