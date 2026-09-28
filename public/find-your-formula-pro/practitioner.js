/* ════════════════════════════════════════════════════════════════
   practitioner.js — the pro composer's practitioner tools (2026-09-28)
   ────────────────────────────────────────────────────────────────
   Robin: "yes to all 8". What this file adds to /find-your-formula-pro:

   · The door. /api/pro-access says whether the signed-in member is a
     practitioner (rank Facilitator / Alchemist / Founder, or admin —
     src/server/practitioner.mjs). If not, a wall explains why. The
     compose endpoint checks again on every request; this is courtesy.
   · Why each herb — the named points behind every seated herb, from the
     engine's own scoreBreakdown (the `pro` block fyf-compose returns to
     a verified practitioner only), plus the best herbs not seated.
   · Adjust — change percentages, lock, remove, swap or add herbs. Every
     change is re-checked by /api/formula-analysis against the engine's
     own rules (size, category, trace, sedative, stimulant, serotonin,
     push-pull, restricted, pro-only). MYCO can read the adjusted formula.
   · Dose sheet — ml per herb for the bottle size, each herb's ethanol
     and recorded dose, the lab plan at the house 1:3.
   · Client file — save the formula under a client code with notes
     (Supabase public.practitioner_formulas, owner-only by RLS —
     supabase-practitioner-formulas.sql), reopen, delete, and print or
     save as PDF.

   Nothing here decides a formula on its own: the engine and the
   analysis do; this file shows their answers and carries the edits.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const S = {
    access: null, a: null, body: null,
    rows: [], engineRows: [], alts: [],
    analysis: null, analysing: false,
    bottle: 30, dose: '', duration: '', notes: '', client: '',
    savedId: null, tab: 'why', myco: null,
  };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = id => document.getElementById(id);

  // ── Session ────────────────────────────────────────────────────
  async function client() {
    if (window.SBready) { try { await window.SBready; } catch (_) {} }
    return window.SBclient || null;
  }
  async function token() {
    const c = await client();
    if (!c || !c.auth) return null;
    try { const { data } = await c.auth.getSession(); return (data && data.session && data.session.access_token) || null; }
    catch (_) { return null; }
  }
  async function authHeader() {
    const t = await token();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  // ── The door ───────────────────────────────────────────────────
  const WALL_TEXT = {
    SIGNED_OUT:            ['Sign in first', 'The pro composer is for Fungai Art practitioners. Sign in with your practitioner account, then come back to this page.'],
    NO_PROFILE:            ['Finish your member profile', 'You are signed in, but your account has no member profile yet. Claim it in the community portal, then ask a keeper to set your practitioner rank.'],
    RANK_NOT_PRACTITIONER: ['Practitioner accounts only', 'Your account is signed in but is not a practitioner account. A keeper can set your rank to Facilitator, Alchemist or Founder on the Admin page.'],
    IDENTITY_UNAVAILABLE:  ['Could not check your access', 'The server could not confirm who you are just now. Try again in a moment.'],
    NETWORK:               ['Could not check your access', 'The check did not reach the server. Try again in a moment.'],
  };
  function showWall(reason) {
    let w = $('fpWall');
    if (!w) {
      w = document.createElement('div');
      w.id = 'fpWall';
      document.body.appendChild(w);
    }
    const [title, text] = WALL_TEXT[reason] || WALL_TEXT.SIGNED_OUT;
    w.innerHTML =
      '<div class="fp-wall-card" role="dialog" aria-modal="true" aria-labelledby="fpWallTitle">' +
        '<div class="fp-eyebrow">◇ Pro composer</div>' +
        '<h2 id="fpWallTitle">' + esc(title) + '</h2>' +
        '<p>' + esc(text) + '</p>' +
        '<div class="fp-wall-actions">' +
          (reason === 'SIGNED_OUT' || reason === 'NO_PROFILE' || !WALL_TEXT[reason]
            ? '<a class="fp-btn fp-btn-primary" href="/community/">Sign in →</a>' : '') +
          (reason === 'IDENTITY_UNAVAILABLE' || reason === 'NETWORK'
            ? '<button type="button" class="fp-btn fp-btn-primary" id="fpWallRetry">Try again</button>' : '') +
          '<a class="fp-btn" href="/find-your-formula/">Take the customer quiz instead</a>' +
        '</div>' +
      '</div>';
    w.hidden = false;
    document.documentElement.classList.add('fp-walled');
    const r = $('fpWallRetry');
    if (r) r.addEventListener('click', () => { w.hidden = true; document.documentElement.classList.remove('fp-walled'); checkAccess(); });
  }
  function showBadge(r) {
    let b = $('fpBadge');
    if (!b) { b = document.createElement('div'); b.id = 'fpBadge'; document.body.appendChild(b); }
    b.textContent = '◇ Practitioner' + (r.name ? ' · ' + r.name : '');
  }
  async function checkAccess() {
    let r;
    try {
      const res = await fetch('/api/pro-access', { headers: await authHeader(), cache: 'no-store' });
      r = await res.json();
    } catch (_) { r = { practitioner: false, reason: 'NETWORK' }; }
    S.access = r;
    if (r.practitioner) showBadge(r); else showWall(r.reason);
    return r;
  }

  // ── After the reveal ───────────────────────────────────────────
  function onReveal(a, body) {
    const root = $('fyfProTools');
    if (!root || !body || !body.formula) return;
    S.a = a; S.body = body;
    const pro = body.pro || null;
    const why = name => (pro && Array.isArray(pro.herbs) ? pro.herbs.find(x => x.name === name) : null) || null;
    S.rows = (body.formula.herbs || []).map(h => ({ name: h.name, pct: h.percentage, locked: false, why: why(h.name) }));
    S.engineRows = S.rows.map(r => Object.assign({}, r));
    S.alts = (pro && pro.alternatives) || [];
    S.savedId = null; S.myco = null;
    root.hidden = false;
    render();
    analyse(true);
    loadSaved();
  }

  const PART_LABEL = {
    goal1: '1st goal', goal2: '2nd goal', goal3: '3rd goal', body: 'Body pattern',
    time: 'Time of day', stress: 'Stress style', notes: 'Your note', subPattern: 'Sub-pattern',
    duration: 'Duration', age: 'Age', sleep: 'Sleep', nervous: 'Nervous system',
    energy: 'Energy curve', digestion: 'Digestion', somatic: 'Body area',
    emotional: 'Emotional weather', support: 'Support wanted', cycle: 'Cycle', history: 'Herb history',
    evidence: 'Evidence grade',
  };
  const GOAL_LABEL = {
    stress: 'stress', anxiety: 'anxiety', sleep: 'sleep', energy: 'energy', mood: 'mood',
    cognitive: 'focus', hormones: 'hormones', digestion: 'digestion', immunity: 'immunity',
    pain: 'pain', detox: 'detox', beauty: 'skin & beauty',
  };

  function whyCard(w, label) {
    if (!w) return '<div class="fp-why"><div class="fp-why-name">' + esc(label) + '</div><div class="fp-muted">Added by you — not scored by the engine.</div></div>';
    const chips = Object.entries(w.parts || {})
      .sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]))
      .map(([k, v]) => '<span class="fp-chip ' + (v < 0 ? 'neg' : '') + '">' + esc(PART_LABEL[k] || k) + ' ' + (v > 0 ? '+' : '') + v + '</span>')
      .join('');
    const flags = [
      w.grade ? 'Evidence ' + w.grade : 'Evidence ungraded',
      w.caution ? 'Caution ' + w.caution : null,
      w.cns ? 'CNS ' + w.cns : null,
      w.serotonergic ? 'Serotonergic' : null,
      w.trace ? 'Trace herb' : null,
      w.proOnly ? 'Pro-only' : null,
    ].filter(Boolean);
    return '<div class="fp-why">' +
      '<div class="fp-why-head"><span class="fp-why-name">' + esc(w.name) + '</span><span class="fp-why-score">' + w.score + ' pts</span></div>' +
      '<div class="fp-chips">' + chips + '</div>' +
      (w.halved ? '<div class="fp-note">Serves none of the chosen goals, so it kept half its points.</div>' : '') +
      '<div class="fp-meta">Goals: ' + (w.goals.length ? w.goals.map(g => esc(GOAL_LABEL[g] || g)).join(', ') : 'none recorded') + ' · ' + flags.map(esc).join(' · ') + '</div>' +
    '</div>';
  }

  // ── Render ─────────────────────────────────────────────────────
  function total() { return S.rows.reduce((s, r) => s + (Number(r.pct) || 0), 0); }

  function render() {
    const root = $('fyfProTools');
    if (!root) return;
    const tabs = [['why', 'Why each herb'], ['adjust', 'Adjust'], ['dose', 'Dose sheet'], ['client', 'Client file']];
    root.innerHTML =
      '<div class="fp-wrap">' +
        '<div class="fp-eyebrow">◇ Practitioner tools</div>' +
        '<div class="fp-tabs" role="tablist">' +
          tabs.map(([k, l]) => '<button type="button" role="tab" class="fp-tab' + (S.tab === k ? ' on' : '') + '" data-tab="' + k + '" aria-selected="' + (S.tab === k) + '">' + l + '</button>').join('') +
        '</div>' +
        '<div class="fp-panel">' + panel() + '</div>' +
      '</div>';
    root.querySelectorAll('.fp-tab').forEach(b => b.addEventListener('click', () => { S.tab = b.dataset.tab; render(); }));
    bind(root);
  }

  function checksHtml() {
    const A = S.analysis;
    if (!A) return '<div class="fp-muted">' + (S.analysing ? 'Checking…' : 'Not checked yet.') + '</div>';
    const rows = A.checks.map(c =>
      '<li class="' + (c.ok ? 'ok' : 'bad') + '"><span>' + (c.ok ? '✓' : '✗') + '</span><b>' + esc(c.label) + '</b> ' + esc(c.detail) + '</li>').join('');
    const pairs = (A.cautions || []).map(p => '<li class="bad"><span>⚠</span><b>' + esc(p.a) + ' + ' + esc(p.b) + '</b> ' + esc(p.note) + '</li>').join('');
    const unres = (A.unresolved || []).length ? '<div class="fp-note">Not in the catalogue: ' + A.unresolved.map(esc).join(', ') + '</div>' : '';
    return '<ul class="fp-checks">' + rows + pairs + '</ul>' + unres;
  }

  function panel() {
    if (S.tab === 'why') {
      const seated = S.rows.map(r => whyCard(r.why, r.name)).join('');
      const alts = S.alts.length
        ? '<h4>Next in line</h4><p class="fp-muted">Passed every safety filter for this client but were not seated.</p>' +
          '<div class="fp-alts">' + S.alts.map((w, i) =>
            '<div class="fp-alt"><span>' + esc(w.name) + '</span><span class="fp-muted">' + w.score + ' pts · ' + esc(w.grade || 'ungraded') + '</span>' +
            '<button type="button" class="fp-btn fp-btn-small" data-add-alt="' + i + '">Add</button></div>').join('') + '</div>'
        : '';
      return (S.body && !S.body.pro ? '<div class="fp-note">The server sent no scoring detail (older response). Recompose to see it.</div>' : '') +
        '<div class="fp-whys">' + seated + '</div>' + alts;
    }
    if (S.tab === 'adjust') {
      const altOpts = S.alts.map((w, i) => '<option value="' + i + '">' + esc(w.name) + ' (' + w.score + ')</option>').join('');
      const t = total();
      return '<table class="fp-table"><thead><tr><th>Herb</th><th>%</th><th>Lock</th><th>Swap for</th><th></th></tr></thead><tbody>' +
        S.rows.map((r, i) =>
          '<tr><td>' + esc(r.name) + '</td>' +
          '<td><input type="number" min="0" max="100" step="1" class="fp-pct" data-i="' + i + '" value="' + (Number(r.pct) || 0) + '"></td>' +
          '<td><input type="checkbox" class="fp-lock" data-i="' + i + '"' + (r.locked ? ' checked' : '') + ' aria-label="Lock ' + esc(r.name) + '"></td>' +
          '<td>' + (altOpts ? '<select class="fp-swap" data-i="' + i + '"><option value="">—</option>' + altOpts + '</select>' : '') + '</td>' +
          '<td><button type="button" class="fp-btn fp-btn-small" data-remove="' + i + '" aria-label="Remove ' + esc(r.name) + '">×</button></td></tr>').join('') +
        '</tbody><tfoot><tr><td>Total</td><td class="' + (t === 100 ? '' : 'fp-warn') + '">' + t + '%</td><td colspan="3"></td></tr></tfoot></table>' +
        '<div class="fp-row">' +
          '<input type="text" id="fpAddName" placeholder="Add a herb by name" list="fpAltList" autocomplete="off">' +
          '<datalist id="fpAltList">' + S.alts.map(w => '<option value="' + esc(w.name) + '">').join('') + '</datalist>' +
          '<button type="button" class="fp-btn" id="fpAddBtn">Add</button>' +
          '<button type="button" class="fp-btn" id="fpRebalance">Rebalance to 100%</button>' +
          '<button type="button" class="fp-btn" id="fpReset">Reset to engine formula</button>' +
        '</div>' +
        '<h4>The engine\'s rules</h4>' + checksHtml() +
        '<div class="fp-row"><input type="text" id="fpMycoQ" placeholder="Ask MYCO about this formula (optional)" maxlength="600">' +
        '<button type="button" class="fp-btn" id="fpMycoBtn">Ask MYCO</button></div>' +
        (S.myco ? '<div class="fp-myco">' + (S.myco.text ? esc(S.myco.text).replace(/\n/g, '<br>') : esc(S.myco.unavailable || 'MYCO did not answer.')) + '</div>' : '');
    }
    if (S.tab === 'dose') {
      const A = S.analysis;
      const byName = n => (A && A.herbs || []).find(h => h.name === n) || {};
      const armLabel = { dual: 'Double extraction', decoction: 'Decoction', maceration: 'Cold extract' };
      return '<div class="fp-row"><label>Bottle <select id="fpBottle">' +
          [30, 50, 100].map(v => '<option value="' + v + '"' + (S.bottle === v ? ' selected' : '') + '>' + v + ' ml</option>').join('') +
        '</select></label><span class="fp-muted">House strength 1:3 (plant : solvent)</span></div>' +
        '<table class="fp-table"><thead><tr><th>Herb</th><th>%</th><th>ml</th><th>Extraction</th><th>Ethanol</th></tr></thead><tbody>' +
        S.rows.map(r => {
          const h = byName(r.name);
          const ml = Math.round((Number(r.pct) || 0) * S.bottle) / 100;
          return '<tr><td>' + esc(r.name) + (h.dosage ? '<details><summary>Recorded dose (single herb)</summary><div class="fp-muted">' + esc(h.dosage) + '</div></details>' : '') + '</td>' +
            '<td>' + (Number(r.pct) || 0) + '%</td><td>' + ml.toFixed(1) + '</td>' +
            '<td>' + esc(armLabel[h.arm] || '—') + '</td><td>' + (h.ethanol ? esc(h.ethanol) : '<a href="/extraction/" target="_blank" rel="noopener" class="fp-muted">bench table ↗</a>') + '</td></tr>';
        }).join('') +
        '</tbody></table>' +
        (A && A.extraction ? '<h4>Lab plan</h4><ul class="fp-plan">' + A.extraction.map(p => '<li><b>' + esc(p.arm) + '</b> — ' + p.herbs.map(esc).join(', ') + '<div class="fp-muted">' + esc(p.how) + '</div></li>').join('') + '</ul>' : '') +
        '<div class="fp-grid2">' +
          '<label>Dose for this client<input type="text" id="fpDose" value="' + esc(S.dose) + '" placeholder="e.g. 1 ml twice daily, under the tongue"></label>' +
          '<label>Duration<input type="text" id="fpDuration" value="' + esc(S.duration) + '" placeholder="e.g. 6 weeks, then review"></label>' +
        '</div>' +
        '<p class="fp-muted">Recorded doses are for each herb on its own; the formula\'s dose is yours to set.</p>';
    }
    // client
    return '<div class="fp-grid2">' +
        '<label>Client code<input type="text" id="fpClient" maxlength="80" value="' + esc(S.client) + '" placeholder="Initials or a code, not a full name"></label>' +
        '<label>Formula name<input type="text" id="fpName" maxlength="80" value="' + esc((S.body && S.body.formula && S.body.formula.name) || '') + '" disabled></label>' +
      '</div>' +
      '<label class="fp-block">Notes<textarea id="fpNotes" maxlength="4000" rows="4" placeholder="Case notes, what to review next time">' + esc(S.notes) + '</textarea></label>' +
      '<div class="fp-row">' +
        '<button type="button" class="fp-btn fp-btn-primary" id="fpSave">' + (S.savedId ? 'Update saved formula' : 'Save to client file') + '</button>' +
        '<button type="button" class="fp-btn" id="fpPrint">Print / save as PDF</button>' +
        '<span class="fp-muted" id="fpSaveMsg"></span>' +
      '</div>' +
      '<p class="fp-muted">Client files are visible only to you. They hold health information, so use a code rather than a name.</p>' +
      '<h4>Saved formulas</h4><div id="fpSaved" class="fp-saved"><span class="fp-muted">Loading…</span></div>';
  }

  // ── Events ─────────────────────────────────────────────────────
  function bind(root) {
    root.querySelectorAll('[data-add-alt]').forEach(b => b.addEventListener('click', () => {
      const w = S.alts[Number(b.dataset.addAlt)];
      if (w) addHerb(w.name, w);
      S.tab = 'adjust'; render();
    }));
    root.querySelectorAll('.fp-pct').forEach(inp => inp.addEventListener('change', () => {
      S.rows[Number(inp.dataset.i)].pct = Math.max(0, Math.min(100, Math.round(Number(inp.value) || 0)));
      render(); analyse();
    }));
    root.querySelectorAll('.fp-lock').forEach(inp => inp.addEventListener('change', () => {
      S.rows[Number(inp.dataset.i)].locked = inp.checked;
    }));
    root.querySelectorAll('.fp-swap').forEach(sel => sel.addEventListener('change', () => {
      const w = S.alts[Number(sel.value)];
      if (!w) return;
      const i = Number(sel.dataset.i), old = S.rows[i];
      if (S.rows.some(r => r.name === w.name)) return;
      S.rows[i] = { name: w.name, pct: old.pct, locked: old.locked, why: w };
      render(); analyse();
    }));
    root.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
      S.rows.splice(Number(b.dataset.remove), 1);
      render(); analyse();
    }));
    const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };
    on('fpAddBtn', 'click', () => { const v = ($('fpAddName').value || '').trim(); if (v) { addHerb(v); render(); analyse(); } });
    on('fpRebalance', 'click', () => { rebalance(); render(); analyse(); });
    on('fpReset', 'click', () => { S.rows = S.engineRows.map(r => Object.assign({}, r)); render(); analyse(); });
    on('fpMycoBtn', 'click', askMyco);
    on('fpBottle', 'change', e => { S.bottle = Number(e.target.value) || 30; render(); });
    on('fpDose', 'input', e => { S.dose = e.target.value; });
    on('fpDuration', 'input', e => { S.duration = e.target.value; });
    on('fpClient', 'input', e => { S.client = e.target.value; });
    on('fpNotes', 'input', e => { S.notes = e.target.value; });
    on('fpSave', 'click', save);
    on('fpPrint', 'click', printSheet);
    if (S.tab === 'client') loadSaved();
  }

  function addHerb(name, why) {
    if (S.rows.length >= 12 || S.rows.some(r => r.name.toLowerCase() === name.toLowerCase())) return;
    S.rows.push({ name, pct: 0, locked: false, why: why || S.alts.find(w => w.name === name) || null });
  }

  // Unlocked herbs share whatever the locked ones leave, in proportion to
  // their current share (equal shares if they are all at zero).
  function rebalance() {
    const locked = S.rows.filter(r => r.locked).reduce((s, r) => s + (Number(r.pct) || 0), 0);
    const free = S.rows.filter(r => !r.locked);
    if (!free.length) return;
    const room = Math.max(0, 100 - locked);
    const cur = free.reduce((s, r) => s + (Number(r.pct) || 0), 0);
    free.forEach(r => { r.pct = cur > 0 ? Math.round((Number(r.pct) || 0) / cur * room) : Math.round(room / free.length); });
    const drift = 100 - total();
    if (drift) { const top = free.reduce((m, r) => (r.pct > m.pct ? r : m), free[0]); top.pct += drift; }
  }

  // ── Analysis ───────────────────────────────────────────────────
  let timer = null;
  function analyse(now) {
    clearTimeout(timer);
    timer = setTimeout(run, now ? 0 : 350);
  }
  async function run() {
    if (!S.rows.length) { S.analysis = null; render(); return; }
    S.analysing = true;
    try {
      const res = await fetch('/api/formula-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          herbs: S.rows.map(r => r.name),
          percentages: S.rows.map(r => Number(r.pct) || 0),
          name: S.body && S.body.formula && S.body.formula.name,
        }),
      });
      const out = await res.json();
      S.analysis = out && out.base ? out.base : null;
    } catch (_) { S.analysis = null; }
    S.analysing = false;
    render();
  }
  async function askMyco() {
    const q = ($('fpMycoQ') && $('fpMycoQ').value) || '';
    S.myco = { unavailable: 'MYCO is reading…' }; render();
    try {
      const res = await fetch('/api/formula-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ herbs: S.rows.map(r => r.name), percentages: S.rows.map(r => Number(r.pct) || 0), myco: true, question: q }),
      });
      const out = await res.json();
      S.myco = (out && out.myco) || { unavailable: (out && out.error) || 'MYCO did not answer.' };
    } catch (_) { S.myco = { unavailable: 'MYCO could not be reached.' }; }
    render();
  }

  // ── Client file (Supabase, owner-only) ─────────────────────────
  function formulaPayload() {
    return {
      name: (S.body && S.body.formula && S.body.formula.name) || null,
      herbs: S.rows.map(r => ({ name: r.name, percentage: Number(r.pct) || 0 })),
      bottle_ml: S.bottle, dose: S.dose, duration: S.duration,
    };
  }
  async function save() {
    const msg = $('fpSaveMsg');
    const say = t => { if (msg) msg.textContent = t; };
    if (!S.client.trim()) { say('Give the client a code first.'); return; }
    const c = await client();
    if (!c) { say('Sign-in is not available on this page.'); return; }
    const row = {
      client_label: S.client.trim().slice(0, 80),
      notes: S.notes.slice(0, 4000),
      formula: formulaPayload(),
      profile: S.a || null,
      engine_version: (S.body && S.body.engineVersion) || null,
      updated_at: new Date().toISOString(),
    };
    say('Saving…');
    const q = S.savedId
      ? c.from('practitioner_formulas').update(row).eq('id', S.savedId).select('id').single()
      : c.from('practitioner_formulas').insert(row).select('id').single();
    const { data, error } = await q;
    if (error) {
      say(error.code === '42P01' ? 'Client files are not set up yet — run supabase-practitioner-formulas.sql.' : 'Could not save: ' + error.message);
      return;
    }
    S.savedId = data.id;
    say('Saved.');
    loadSaved();
  }
  async function loadSaved() {
    const box = $('fpSaved');
    if (!box) return;
    const c = await client();
    if (!c) { box.innerHTML = '<span class="fp-muted">Sign in to see saved formulas.</span>'; return; }
    const { data, error } = await c.from('practitioner_formulas')
      .select('id, client_label, formula, notes, created_at, updated_at')
      .order('updated_at', { ascending: false }).limit(50);
    if (error) {
      box.innerHTML = '<span class="fp-muted">' + (error.code === '42P01' ? 'Client files are not set up yet — run supabase-practitioner-formulas.sql.' : 'Could not load: ' + esc(error.message)) + '</span>';
      return;
    }
    if (!data || !data.length) { box.innerHTML = '<span class="fp-muted">Nothing saved yet.</span>'; return; }
    box.innerHTML = data.map(r =>
      '<div class="fp-saved-row"><span><b>' + esc(r.client_label) + '</b> · ' + esc((r.formula && r.formula.name) || 'Formula') +
      ' <span class="fp-muted">' + esc(new Date(r.updated_at || r.created_at).toLocaleDateString()) + '</span></span>' +
      '<span><button type="button" class="fp-btn fp-btn-small" data-open="' + esc(r.id) + '">Open</button>' +
      '<button type="button" class="fp-btn fp-btn-small" data-del="' + esc(r.id) + '">Delete</button></span></div>').join('');
    box.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
      const r = data.find(x => x.id === b.dataset.open);
      if (!r || !r.formula) return;
      S.savedId = r.id; S.client = r.client_label || ''; S.notes = r.notes || '';
      S.bottle = Number(r.formula.bottle_ml) || 30; S.dose = r.formula.dose || ''; S.duration = r.formula.duration || '';
      S.rows = (r.formula.herbs || []).map(h => ({ name: h.name, pct: h.percentage, locked: false, why: null }));
      S.tab = 'adjust'; render(); analyse(true);
    }));
    box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!window.confirm('Delete this saved formula? This cannot be undone.')) return;
      const { error: e } = await c.from('practitioner_formulas').delete().eq('id', b.dataset.del);
      if (!e && S.savedId === b.dataset.del) S.savedId = null;
      loadSaved();
    }));
  }

  // ── Print / PDF ────────────────────────────────────────────────
  function printSheet() {
    const A = S.analysis;
    const byName = n => (A && A.herbs || []).find(h => h.name === n) || {};
    let root = $('fpPrintRoot');
    if (!root) { root = document.createElement('div'); root.id = 'fpPrintRoot'; document.body.appendChild(root); }
    const failed = A ? A.checks.filter(c => !c.ok) : [];
    const warnings = [];
    S.rows.forEach(r => {
      const h = byName(r.name);
      (h.contraindications || []).forEach(t => warnings.push(r.name + ': ' + t));
      (h.drugInteractions || []).forEach(t => warnings.push(r.name + ' (medication): ' + t));
    });
    root.innerHTML =
      '<h1>Fungai Art · Formula sheet</h1>' +
      '<p class="p-meta">Client ' + esc(S.client || '—') + ' · ' + esc(new Date().toLocaleDateString()) +
        (S.access && S.access.name ? ' · Practitioner ' + esc(S.access.name) : '') + '</p>' +
      '<h2>' + esc((S.body && S.body.formula && S.body.formula.name) || 'Formula') + '</h2>' +
      '<table><thead><tr><th>Herb</th><th>%</th><th>ml in ' + S.bottle + ' ml</th><th>Ethanol</th></tr></thead><tbody>' +
      S.rows.map(r => {
        const h = byName(r.name);
        return '<tr><td>' + esc(r.name) + (h.botanical ? '<br><i>' + esc(h.botanical) + '</i>' : '') + '</td><td>' + (Number(r.pct) || 0) + '%</td><td>' +
          (Math.round((Number(r.pct) || 0) * S.bottle) / 100).toFixed(1) + '</td><td>' + esc(h.ethanol || '—') + '</td></tr>';
      }).join('') +
      '</tbody></table>' +
      '<p><b>Dose:</b> ' + esc(S.dose || '—') + '<br><b>Duration:</b> ' + esc(S.duration || '—') + '<br><b>Strength:</b> 1:3 (plant : solvent)</p>' +
      (failed.length ? '<h3>Rules not met</h3><ul>' + failed.map(c => '<li>' + esc(c.label) + ' — ' + esc(c.detail) + '</li>').join('') + '</ul>' : '') +
      (A && A.cautions && A.cautions.length ? '<h3>Herb pairings to watch</h3><ul>' + A.cautions.map(p => '<li>' + esc(p.a) + ' + ' + esc(p.b) + ' — ' + esc(p.note) + '</li>').join('') + '</ul>' : '') +
      (warnings.length ? '<h3>Cautions and medication interactions</h3><ul>' + warnings.slice(0, 30).map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '') +
      (S.notes ? '<h3>Notes</h3><p>' + esc(S.notes).replace(/\n/g, '<br>') + '</p>' : '') +
      '<p class="p-foot">Traditional herbal support, not medical treatment. Fungai Art · fungai.art</p>';
    window.print();
  }

  // ── Styles ─────────────────────────────────────────────────────
  const css = `
#fyfProTools{margin:48px auto 24px;max-width:880px;padding:0 16px}
.fp-wrap{border:0.5px solid rgba(232,177,75,.3);border-radius:14px;background:rgba(7,17,13,.72);padding:22px 20px}
.fp-eyebrow{font-family:var(--mono,monospace);font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#E8B14B;margin-bottom:12px}
.fp-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
.fp-tab{font:inherit;font-size:12px;padding:8px 14px;border-radius:999px;border:0.5px solid rgba(232,177,75,.3);background:none;color:#C9B894;cursor:pointer}
.fp-tab.on{background:rgba(232,177,75,.16);color:#F5D689;border-color:#E8B14B}
.fp-panel h4{font-family:var(--serif,Georgia,serif);font-weight:400;font-size:18px;color:#EDE5D8;margin:22px 0 8px}
.fp-muted{color:#8B7E62;font-size:12.5px}
.fp-note{color:#E8B14B;font-size:12.5px;margin:6px 0}
.fp-whys{display:grid;gap:10px}
.fp-why{border:0.5px solid rgba(201,184,148,.18);border-radius:10px;padding:12px 14px}
.fp-why-head{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.fp-why-name{color:#EDE5D8;font-size:15px}
.fp-why-score{font-family:var(--mono,monospace);font-size:11px;color:#B6F0AE}
.fp-chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.fp-chip{font-family:var(--mono,monospace);font-size:10.5px;padding:3px 8px;border-radius:999px;background:rgba(107,214,111,.1);color:#B6F0AE}
.fp-chip.neg{background:rgba(225,107,107,.12);color:#F2A5A5}
.fp-meta{font-size:11.5px;color:#8B7E62}
.fp-alts{display:grid;gap:6px}
.fp-alt,.fp-saved-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;border-bottom:0.5px solid rgba(201,184,148,.1);color:#C9B894;font-size:13px;flex-wrap:wrap}
.fp-table{width:100%;border-collapse:collapse;font-size:13px;color:#C9B894}
.fp-table th,.fp-table td{text-align:left;padding:7px 6px;border-bottom:0.5px solid rgba(201,184,148,.12);vertical-align:top}
.fp-table th{font-family:var(--mono,monospace);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8B7E62;font-weight:400}
.fp-table input[type=number]{width:64px}
.fp-table details{margin-top:4px}.fp-table summary{cursor:pointer;font-size:11px;color:#8B7E62}
.fp-warn{color:#F2A5A5}
.fp-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:14px 0}
.fp-row input[type=text]{flex:1;min-width:180px}
#fyfProTools input,#fyfProTools select,#fyfProTools textarea{font:inherit;font-size:13px;background:rgba(0,0,0,.3);color:#EDE5D8;border:0.5px solid rgba(201,184,148,.3);border-radius:6px;padding:7px 9px}
#fyfProTools textarea{width:100%;resize:vertical}
.fp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}
.fp-grid2 label,.fp-block{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#8B7E62}
@media (max-width:640px){.fp-grid2{grid-template-columns:1fr}.fp-table{font-size:12px}}
.fp-btn{font:inherit;font-size:12px;padding:8px 14px;border-radius:999px;border:0.5px solid rgba(201,184,148,.35);background:none;color:#C9B894;cursor:pointer;text-decoration:none;display:inline-block}
.fp-btn:hover{border-color:#E8B14B;color:#F5D689}
.fp-btn-primary{background:linear-gradient(135deg,#E8B14B,#B58A38);color:#07110d;border:none}
.fp-btn-small{padding:4px 10px;font-size:11px;margin-left:4px}
.fp-checks{list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:12.5px;color:#C9B894}
.fp-checks li span{display:inline-block;width:18px}
.fp-checks li.ok span{color:#B6F0AE}.fp-checks li.bad span{color:#F2A5A5}
.fp-checks b{color:#EDE5D8;font-weight:500;margin-right:4px}
.fp-plan{padding-left:18px;color:#C9B894;font-size:13px}
.fp-myco{margin-top:10px;padding:12px 14px;border-left:1.5px solid rgba(232,177,75,.4);font-size:13.5px;line-height:1.6;color:#C9B894}
#fpBadge{position:fixed;right:14px;bottom:14px;z-index:60;font-family:var(--mono,monospace);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#E8B14B;background:rgba(7,17,13,.85);border:0.5px solid rgba(232,177,75,.35);border-radius:999px;padding:6px 12px}
#fpWall{position:fixed;inset:0;z-index:9000;background:rgba(5,9,12,.92);display:flex;align-items:center;justify-content:center;padding:16px}
#fpWall[hidden]{display:none}
.fp-wall-card{max-width:460px;background:#0B1612;border:0.5px solid rgba(232,177,75,.35);border-radius:14px;padding:28px 24px;color:#C9B894}
.fp-wall-card h2{font-family:var(--serif,Georgia,serif);font-weight:400;color:#EDE5D8;margin:0 0 10px;font-size:26px}
.fp-wall-card p{font-size:14px;line-height:1.65;margin:0 0 18px}
.fp-wall-actions{display:flex;flex-wrap:wrap;gap:8px}
html.fp-walled body{overflow:hidden}
#fpPrintRoot{display:none}
@media print{
  body>*:not(#fpPrintRoot){display:none!important}
  #fpPrintRoot{display:block;color:#000;background:#fff;font-family:Georgia,serif;font-size:11pt;padding:0}
  #fpPrintRoot h1{font-size:16pt;margin:0 0 4pt}#fpPrintRoot h2{font-size:14pt;margin:14pt 0 6pt}#fpPrintRoot h3{font-size:11.5pt;margin:12pt 0 4pt}
  #fpPrintRoot table{width:100%;border-collapse:collapse}#fpPrintRoot th,#fpPrintRoot td{border-bottom:0.5pt solid #999;padding:4pt;text-align:left;vertical-align:top}
  #fpPrintRoot .p-meta,#fpPrintRoot .p-foot{color:#444;font-size:9.5pt}
}`;
  const st = document.createElement('style');
  st.id = 'fp-style';
  st.textContent = css;
  document.head.appendChild(st);

  window.FyfPro = { checkAccess, authHeader, onReveal, showWall };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', checkAccess);
  else checkAccess();
})();
