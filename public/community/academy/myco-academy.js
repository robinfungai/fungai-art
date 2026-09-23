/* ────────────────────────────────────────────────────────────────
   MYCO · Alchemy Academy panel
   ────────────────────────────────────────────────────────────────
   The Academy is plain HTML — no React, no Babel — so it cannot load
   /community/myco/agent.jsx, which is why MYCO has only ever existed
   inside the Spore portal. This is the same agent with a vanilla UI:
   it posts to the SAME endpoint (/api/myco-agent → netlify/functions/
   myco-agent.mjs), so the system prompt, the BM25 retrieval over the
   2,744-chunk knowledge base, the citation verifier and the claims
   guard are all shared. Nothing about the agent is duplicated here —
   only the panel.

   Answers carry [K1]-style citations. We render the sources MYCO
   actually read underneath the reply, plus its own coverage
   confidence, because "I don't have that in my knowledge base" is a
   useful answer in a lab and a dangerous one to paper over.

   Positioned above the formula-book FAB (.fb-fab sits at bottom:20px),
   so the two never overlap.
   ──────────────────────────────────────────────────────────────── */
(function () {
  if (document.getElementById('myco-academy-fab')) return;

  var ENDPOINT = '/api/myco-agent';

  // Mirrors the server's REFUSE_PATTERNS so a medical ask gets the
  // softer copy immediately instead of after a round-trip. The server
  // enforces the same list — this is convenience, not the control.
  var REFUSE = [
    /diagnos(e|is)/i,
    /prescri(be|ption)/i,
    /cure my /i,
    /replace (my )?(doctor|medication|prescription)/i,
    /am i (safe|okay) to (take|combine)/i,
  ];
  var REFUSE_REPLY = "MYCO can't give medical or diagnostic advice. For dosing questions with medications, talk to a herbalist or physician you trust. I can talk about traditions, extraction, ceremony framing.";

  // Academy-shaped openers — extraction and materia medica, not portal
  // logistics. These are the questions the knowledge base answers best.
  var CHIPS = [
    'Dual extraction — when does a plant actually need it?',
    'Best solvent ratio for a volatile-oil herb like lemon balm',
    'What does calcination change in a spagyric tincture?',
    'Which mushrooms need both hot water and alcohol, and why?',
  ];

  var history = [];      // [{role, content}] — last 10 are sent
  var busy = false;

  // ── Styles ──────────────────────────────────────────────────
  var st = document.createElement('style');
  st.textContent = [
    '#myco-academy-fab{position:fixed;right:20px;bottom:86px;z-index:901;width:54px;height:54px;border-radius:50%;',
    '  display:flex;align-items:center;justify-content:center;background:rgba(15,12,8,.92);',
    '  border:1px solid rgba(158,212,56,.5);color:#9ED438;cursor:pointer;',
    '  box-shadow:0 10px 30px -8px rgba(0,0,0,.7),0 0 0 4px rgba(158,212,56,.06);',
    '  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
    '  font-family:"Geist Mono",monospace;font-size:10px;letter-spacing:.14em;transition:transform .25s,border-color .25s}',
    '#myco-academy-fab:hover{transform:translateY(-2px);border-color:#9ED438}',
    '#myco-academy-panel{position:fixed;right:20px;bottom:150px;z-index:902;width:min(420px,calc(100vw - 40px));',
    '  max-height:min(620px,calc(100vh - 190px));display:none;flex-direction:column;',
    '  background:rgba(10,16,11,.97);border:0.5px solid rgba(158,212,56,.32);border-radius:14px;overflow:hidden;',
    '  box-shadow:0 24px 60px -12px rgba(0,0,0,.8);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}',
    '#myco-academy-panel.open{display:flex}',
    '.myco-ac-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 16px;',
    '  border-bottom:0.5px solid rgba(158,212,56,.2);background:rgba(158,212,56,.04)}',
    '.myco-ac-title{font-family:"Geist Mono",monospace;font-size:9.5px;letter-spacing:.26em;text-transform:uppercase;color:#9ED438}',
    '.myco-ac-sub{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:12.5px;color:#8B7E62;margin-top:3px}',
    '.myco-ac-close{background:none;border:none;color:#8B7E62;font-size:16px;cursor:pointer;line-height:1;padding:2px 4px}',
    '.myco-ac-close:hover{color:#E6D9B5}',
    '.myco-ac-body{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px}',
    '.myco-ac-msg{font-family:"Cormorant Garamond",Georgia,serif;font-size:14.5px;line-height:1.65;white-space:pre-wrap;word-break:break-word}',
    '.myco-ac-msg.user{color:#E6D9B5;padding:9px 13px;border-radius:10px 10px 2px 10px;background:rgba(232,177,75,.07);',
    '  border:0.5px solid rgba(232,177,75,.22);align-self:flex-end;max-width:85%}',
    '.myco-ac-msg.bot{color:#C9B894;align-self:flex-start;max-width:100%}',
    '.myco-ac-sources{margin-top:8px;padding-top:8px;border-top:0.5px solid rgba(255,255,255,.08);',
    '  font-family:"Geist Mono",monospace;font-size:8.5px;letter-spacing:.06em;line-height:1.75;color:#7E8F6B}',
    '.myco-ac-conf{display:inline-block;margin-top:7px;font-family:"Geist Mono",monospace;font-size:8px;',
    '  letter-spacing:.18em;text-transform:uppercase;padding:2px 8px;border-radius:999px}',
    '.myco-ac-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 12px}',
    '.myco-ac-chip{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:12.5px;color:#C9B894;',
    '  padding:6px 11px;border-radius:999px;background:rgba(255,255,255,.03);',
    '  border:0.5px solid rgba(158,212,56,.24);cursor:pointer;text-align:left}',
    '.myco-ac-chip:hover{border-color:rgba(158,212,56,.5);color:#E6D9B5}',
    '.myco-ac-foot{display:flex;gap:8px;padding:11px 14px;border-top:0.5px solid rgba(255,255,255,.08)}',
    '.myco-ac-input{flex:1;background:#0a140e;border:0.5px solid rgba(158,212,56,.26);border-radius:9px;',
    '  padding:9px 12px;color:#E6D9B5;font-family:"Cormorant Garamond",Georgia,serif;font-size:14px;',
    '  outline:none;resize:none;max-height:110px;line-height:1.5}',
    '.myco-ac-input::placeholder{color:#6B6552;font-style:italic}',
    '.myco-ac-send{font-family:"Geist Mono",monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;',
    '  padding:0 15px;border-radius:9px;border:none;background:linear-gradient(135deg,#9ED438,#6ABF88);',
    '  color:#0d1610;font-weight:600;cursor:pointer}',
    '.myco-ac-send:disabled{opacity:.45;cursor:default}',
    '.myco-ac-note{font-family:"Geist Mono",monospace;font-size:8px;letter-spacing:.14em;color:#6B6552;padding:0 16px 11px;line-height:1.7}',
    '@media(max-width:620px){#myco-academy-panel{right:12px;left:12px;width:auto;bottom:146px}',
    '  #myco-academy-fab{right:14px;bottom:82px}}',
  ].join('\n');
  document.head.appendChild(st);

  // ── DOM ─────────────────────────────────────────────────────
  var fab = document.createElement('button');
  fab.id = 'myco-academy-fab';
  fab.setAttribute('aria-label', 'Ask MYCO');
  fab.setAttribute('aria-expanded', 'false');
  fab.textContent = 'MYCO';

  var panel = document.createElement('div');
  panel.id = 'myco-academy-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Ask MYCO');
  panel.innerHTML = [
    '<div class="myco-ac-head">',
    '  <div><div class="myco-ac-title">MYCO · Academy</div>',
    '  <div class="myco-ac-sub">Extraction, materia medica, ratios — answered from our own knowledge base.</div></div>',
    '  <button class="myco-ac-close" aria-label="Close">✕</button>',
    '</div>',
    '<div class="myco-ac-body" id="myco-ac-body"></div>',
    '<div class="myco-ac-chips" id="myco-ac-chips"></div>',
    '<div class="myco-ac-note">Traditional preparation and research framing. Not medical advice.</div>',
    '<div class="myco-ac-foot">',
    '  <textarea class="myco-ac-input" id="myco-ac-input" rows="1" placeholder="Ask about a plant, a solvent, a ratio…"></textarea>',
    '  <button class="myco-ac-send" id="myco-ac-send">Ask</button>',
    '</div>',
  ].join('');

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var body   = panel.querySelector('#myco-ac-body');
  var input  = panel.querySelector('#myco-ac-input');
  var sendBtn = panel.querySelector('#myco-ac-send');
  var chipRow = panel.querySelector('#myco-ac-chips');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  function addMsg(role, text, extra) {
    var el = document.createElement('div');
    el.className = 'myco-ac-msg ' + (role === 'user' ? 'user' : 'bot');
    el.innerHTML = esc(text);

    // Show what MYCO actually read. A citation the model invented has
    // already been stripped server-side, so anything here is real.
    if (extra && extra.sources && extra.sources.length) {
      var src = document.createElement('div');
      src.className = 'myco-ac-sources';
      src.innerHTML = extra.sources.map(function (s, i) {
        var label = typeof s === 'string' ? s : (s.title || s.source || '');
        var kind  = (s && s.kind) ? ' · ' + s.kind : '';
        return '[K' + (i + 1) + '] ' + esc(label) + esc(kind);
      }).join('<br>');
      el.appendChild(src);
    }
    if (extra && extra.confidence && extra.confidence.level) {
      var lvl = String(extra.confidence.level);
      var tone = lvl === 'high' ? ['rgba(107,214,111,.12)', '#B6F0AE']
               : lvl === 'none' ? ['rgba(225,107,107,.10)', '#E1A7A0']
               :                  ['rgba(232,177,75,.10)',  '#F0C46A'];
      var c = document.createElement('div');
      c.className = 'myco-ac-conf';
      c.style.background = tone[0];
      c.style.color = tone[1];
      c.textContent = 'coverage: ' + lvl;
      if (extra.confidence.reason) c.title = extra.confidence.reason;
      el.appendChild(c);
    }
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function renderChips() {
    chipRow.innerHTML = '';
    if (history.length) return;          // openers only on an empty thread
    CHIPS.forEach(function (text) {
      var b = document.createElement('button');
      b.className = 'myco-ac-chip';
      b.textContent = text;
      b.onclick = function () { ask(text); };
      chipRow.appendChild(b);
    });
  }

  async function ask(text) {
    var msg = String(text || input.value || '').trim();
    if (!msg || busy) return;

    for (var i = 0; i < REFUSE.length; i++) {
      if (REFUSE[i].test(msg)) {
        addMsg('user', msg);
        addMsg('bot', REFUSE_REPLY);
        input.value = '';
        history.push({ role: 'user', content: msg });
        history.push({ role: 'assistant', content: REFUSE_REPLY });
        renderChips();
        return;
      }
    }

    input.value = '';
    input.style.height = 'auto';
    addMsg('user', msg);
    renderChips();

    busy = true;
    sendBtn.disabled = true;
    var thinking = addMsg('bot', 'Reading the knowledge base…');

    try {
      var res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: history.slice(-10),
          context: { now: new Date().toLocaleString('en-GB', { timeZone: 'Europe/Berlin' }), tab: 'academy' },
        }),
      });
      var data = await res.json();
      thinking.remove();
      if (data.error) {
        addMsg('bot', 'MYCO could not answer: ' + data.error);
      } else {
        addMsg('bot', data.reply || '(empty reply)', {
          sources: Array.isArray(data.sources) ? data.sources : [],
          confidence: data.confidence || null,
        });
        history.push({ role: 'user', content: msg });
        history.push({ role: 'assistant', content: data.reply || '' });
      }
    } catch (e) {
      thinking.remove();
      addMsg('bot', 'Network error — MYCO is unreachable. ' + (e && e.message ? e.message : ''));
    }
    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }

  // ── Wiring ──────────────────────────────────────────────────
  function toggle(force) {
    var open = typeof force === 'boolean' ? force : !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    fab.setAttribute('aria-expanded', String(open));
    if (open) {
      if (!body.children.length) {
        addMsg('bot', 'I answer from the Fungai Art knowledge base — herb monographs, extraction protocols and our own practice. I cite what I read, and I say so when a question falls outside it.');
        renderChips();
      }
      input.focus();
    }
  }

  fab.onclick = function () { toggle(); };
  panel.querySelector('.myco-ac-close').onclick = function () { toggle(false); };
  sendBtn.onclick = function () { ask(); };

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); }
  });
  input.addEventListener('input', function () {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 110) + 'px';
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) toggle(false);
  });
})();
