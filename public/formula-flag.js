/* ────────────────────────────────────────────────────────────────
   formula-flag.js — "⚑ Flag this formula" (Robin, 2026-10-02)

   Wherever a formula's full percentages show (the pro composer's
   practitioner tools, the formula analysis page), a formula that did
   not live up to the standard can be flagged: a reason in a line and
   what kind of failure it is. The flag goes to public.formula_flags
   (supabase-formula-flags-2026-10-02.sql) — anyone signed in may file
   one, only an admin reads them, in "Formula e-book · flagged" on the
   Admin page; the MYCO monthly digest proposes a fix for each.

     FormulaFlag.mount(el, snapshot)
       el       — the element the flag box goes into (filled once)
       snapshot — () => { source: 'pro' | 'analysis', name, herbs:
                  [{ name, percentage }], engineVersion, answers }
   ──────────────────────────────────────────────────────────────── */
(function () {
  var TAGS = [
    ['relevance', 'Relevance'], ['hierarchy', 'Hierarchy'], ['extraction', 'Extraction'],
    ['identity', 'Ingredient identity'], ['safety', 'Safety'], ['other', 'Other'],
  ];
  var CSS =
    '.ff-flag{margin:14px 0 0;border:0.5px solid rgba(225,107,107,.35);border-radius:10px;padding:10px 14px;background:rgba(225,107,107,.04);font-family:inherit}' +
    '.ff-flag summary{cursor:pointer;color:#E8A0A0;font-size:13px;letter-spacing:.04em}' +
    '.ff-flag p{font-size:12px;opacity:.75;margin:8px 0}' +
    '.ff-tags{display:flex;flex-wrap:wrap;gap:6px 14px;margin:6px 0 8px;font-size:12.5px}' +
    '.ff-tags label{display:inline-flex;gap:5px;align-items:center;cursor:pointer}' +
    '.ff-reason{width:100%;box-sizing:border-box;font:inherit;font-size:13px;padding:8px;border-radius:6px;border:0.5px solid rgba(201,184,148,.3);background:rgba(0,0,0,.2);color:inherit}' +
    '.ff-row{display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap}' +
    '.ff-send{font:inherit;font-size:12.5px;padding:6px 14px;border-radius:999px;border:0.5px solid rgba(225,107,107,.6);background:transparent;color:#E8A0A0;cursor:pointer}' +
    '.ff-send:disabled{opacity:.5;cursor:default}' +
    '.ff-msg{font-size:12px;opacity:.85}';

  function html() {
    return '<details class="ff-flag"><summary>⚑ Flag this formula</summary>' +
      '<p>When a formula does not live up to the standard. It goes to the formula e-book on the Admin page, and MYCO proposes a fix in the monthly digest.</p>' +
      '<div class="ff-tags">' + TAGS.map(function (t) {
        return '<label><input type="checkbox" value="' + t[0] + '"> ' + t[1] + '</label>';
      }).join('') + '</div>' +
      '<textarea class="ff-reason" maxlength="2000" rows="3" aria-label="What is wrong with this formula" ' +
        'placeholder="What is wrong, in a line — e.g. Slippery Elm 15% in a tincture: the mucilage is not extracted"></textarea>' +
      '<div class="ff-row"><button type="button" class="ff-send">Send flag</button><span class="ff-msg" role="status"></span></div>' +
    '</details>';
  }

  var missing = function (e) { return /42P01|PGRST205|does not exist|schema cache/i.test((e.code || '') + ' ' + (e.message || '')); };

  async function send(box, snapshot) {
    var btn = box.querySelector('.ff-send'), msg = box.querySelector('.ff-msg');
    var reasonEl = box.querySelector('.ff-reason');
    var reason = reasonEl.value.trim();
    var tags = Array.prototype.map.call(box.querySelectorAll('.ff-tags input:checked'), function (i) { return i.value; });
    if (!reason) { msg.textContent = 'Say in a line what is wrong.'; return; }
    var snap = snapshot();
    if (!snap || !snap.herbs || !snap.herbs.length) { msg.textContent = 'There is no formula to flag yet.'; return; }
    if (window.SBready) { try { await window.SBready; } catch (_) {} }
    var c = window.SBclient;
    if (!c || !c.auth) { msg.textContent = 'Sign-in is not available on this page.'; return; }
    var uid = null;
    try { var s = await c.auth.getSession(); uid = s.data && s.data.session && s.data.session.user && s.data.session.user.id; } catch (_) {}
    if (!uid) { msg.textContent = 'Sign in first — a flag is filed under your account.'; return; }
    btn.disabled = true; msg.textContent = 'Sending…';
    var r = await c.from('formula_flags').insert({
      flagged_by: uid,
      source: snap.source === 'analysis' ? 'analysis' : 'pro',
      formula_name: snap.name ? String(snap.name).slice(0, 120) : null,
      herbs: snap.herbs.map(function (h) { return { name: String(h.name).slice(0, 80), percentage: Number(h.percentage) || 0 }; }),
      engine_version: snap.engineVersion ? String(snap.engineVersion).slice(0, 40) : null,
      answers: snap.answers || null,
      reason: reason.slice(0, 2000),
      tags: tags,
    });
    btn.disabled = false;
    if (r.error) {
      msg.textContent = missing(r.error) ? 'The formula e-book is not set up yet — run supabase-formula-flags-2026-10-02.sql.' : 'Could not send: ' + r.error.message;
      return;
    }
    reasonEl.value = '';
    box.querySelectorAll('.ff-tags input').forEach(function (i) { i.checked = false; });
    msg.textContent = '⚑ Flagged — it is in the formula e-book.';
  }

  function mount(el, snapshot) {
    if (!el || el.querySelector('.ff-flag')) return;
    if (!document.getElementById('ff-css')) {
      var st = document.createElement('style'); st.id = 'ff-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    el.innerHTML = html();
    var box = el.querySelector('.ff-flag');
    box.querySelector('.ff-send').addEventListener('click', function () { send(box, snapshot); });
  }

  window.FormulaFlag = { mount: mount, TAGS: TAGS };
})();
