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
  // Amber here, green in the portal (Robin, 2026-09-25) — one layout and
  // one type system in both places; only the accent differs. Type uses
  // only fonts this page loads (Satoshi · Zodiak · Geist Mono). It used
  // to name "Cormorant Garamond", which the page never loaded, so every
  // serif line here silently fell back to Georgia.
  var A = '232,177,75';   // accent, as rgb — amber
  var st = document.createElement('style');
  st.textContent = [
    '#myco-academy-fab{position:fixed;right:20px;bottom:86px;z-index:901;width:56px;height:56px;border-radius:50%;',
    '  display:flex;align-items:center;justify-content:center;background:rgba(15,12,8,.94);',
    '  border:1px solid rgba(' + A + ',.55);color:#E8B14B;cursor:pointer;',
    '  box-shadow:0 10px 30px -8px rgba(0,0,0,.7),0 0 0 4px rgba(' + A + ',.07);',
    '  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
    '  font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.14em;transition:transform .25s,border-color .25s}',
    '#myco-academy-fab:hover{transform:translateY(-2px);border-color:#E8B14B}',
    '#myco-academy-panel{position:fixed;right:20px;bottom:152px;z-index:902;width:min(440px,calc(100vw - 40px));',
    '  max-height:min(660px,calc(100vh - 190px));display:none;flex-direction:column;',
    '  background:rgba(16,13,9,.97);border:0.5px solid rgba(' + A + ',.35);border-radius:16px;overflow:hidden;',
    '  box-shadow:0 24px 60px -12px rgba(0,0,0,.8);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}',
    '#myco-academy-panel.open{display:flex}',
    '.myco-ac-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;',
    '  border-bottom:0.5px solid rgba(' + A + ',.22);background:rgba(' + A + ',.05)}',
    '.myco-ac-title{font-family:"Geist Mono",monospace;font-size:11.5px;letter-spacing:.26em;text-transform:uppercase;color:#E8B14B}',
    '.myco-ac-sub{font-family:"Satoshi",system-ui,sans-serif;font-size:13px;line-height:1.45;color:#A89C80;margin-top:4px}',
    '.myco-ac-close{background:none;border:none;color:#A89C80;font-size:18px;cursor:pointer;line-height:1;padding:2px 6px}',
    '.myco-ac-close:hover{color:#E6D9B5}',
    '.myco-ac-body{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:14px}',
    '.myco-ac-msg{font-family:"Satoshi",system-ui,sans-serif;font-size:15px;line-height:1.6;word-break:break-word}',
    '.myco-ac-msg.user{color:#EFE4C6;padding:10px 14px;border-radius:12px 12px 3px 12px;background:rgba(' + A + ',.10);',
    '  border:0.5px solid rgba(' + A + ',.28);align-self:flex-end;max-width:85%;white-space:pre-wrap}',
    '.myco-ac-msg.bot{color:#DCCFAE;align-self:flex-start;max-width:100%}',
    // Answers in sections — the same rules as the portal panel.
    '.myco-ac-p{margin:0 0 8px}',
    '.myco-ac-p:last-child{margin-bottom:0}',
    '.myco-ac-h{margin:14px 0 6px;font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#E8B14B}',
    '.myco-ac-h:first-child{margin-top:0}',
    '.myco-ac-ul{margin:0 0 8px;padding:0;list-style:none;display:grid;gap:5px}',
    '.myco-ac-ul li{position:relative;padding-left:16px}',
    '.myco-ac-ul li::before{content:"";position:absolute;left:2px;top:.62em;width:5px;height:5px;border-radius:50%;background:#E8B14B}',
    '.myco-ac-num{font-family:"Geist Mono",monospace;font-size:12px;color:#E8B14B}',
    '.myco-ac-cite{font-family:"Geist Mono",monospace;font-size:10.5px;color:#A89C80;vertical-align:1px}',
    '.myco-ac-msg strong{color:#F5E6BF;font-weight:600}',
    '.myco-ac-sources{margin-top:10px;padding-top:9px;border-top:0.5px solid rgba(255,255,255,.08);',
    '  font-family:"Satoshi",system-ui,sans-serif;font-size:12px;line-height:1.7;color:#9C9178}',
    '.myco-ac-readas{margin-top:8px;font-family:"Geist Mono",monospace;font-size:10.5px;letter-spacing:.06em;color:#A89C80}',
    '.myco-ac-conf{display:inline-block;margin-top:8px;font-family:"Geist Mono",monospace;font-size:10px;',
    '  letter-spacing:.14em;text-transform:uppercase;padding:3px 9px;border-radius:999px}',
    '.myco-ac-chips{display:flex;flex-direction:column;gap:6px;padding:0 18px 12px}',
    '.myco-ac-chip{font-family:"Geist Mono",monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;line-height:1.45;',
    '  color:#F0C46A;padding:10px 13px;border-radius:10px;background:rgba(' + A + ',.06);',
    '  border:0.5px solid rgba(' + A + ',.28);cursor:pointer;text-align:left}',
    '.myco-ac-chip:hover{border-color:rgba(' + A + ',.6);background:rgba(' + A + ',.12);color:#F5D689}',
    '.myco-ac-foot{display:flex;gap:8px;align-items:flex-end;padding:12px 16px;border-top:0.5px solid rgba(255,255,255,.08)}',
    '.myco-ac-input{flex:1;background:#130f0a;border:0.5px solid rgba(' + A + ',.3);border-radius:10px;',
    '  padding:10px 12px;color:#EFE4C6;font-family:"Satoshi",system-ui,sans-serif;font-size:14.5px;',
    '  outline:none;resize:none;max-height:120px;line-height:1.5}',
    '.myco-ac-input::placeholder{color:#8B7E62}',
    '.myco-ac-input:focus{border-color:rgba(' + A + ',.6)}',
    '.myco-ac-send{font-family:"Geist Mono",monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;',
    '  height:42px;padding:0 18px;border-radius:10px;border:none;background:linear-gradient(135deg,#F0C46A,#C48838);',
    '  color:#1a1208;font-weight:600;cursor:pointer}',
    '.myco-ac-send:disabled{opacity:.45;cursor:default}',
    '.myco-ac-note{font-family:"Satoshi",system-ui,sans-serif;font-size:12.5px;line-height:1.5;color:#A89C80;padding:0 18px 12px}',
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
    '<div class="myco-ac-note">Traditional preparation and research framing — not medical or diagnostic advice.</div>',
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

  // MYCO answers in short sections: "## Heading" lines, "- " or "1."
  // items, **bold**, and [K1] citations. Built with createElement and
  // text nodes — never innerHTML — so nothing in a reply can inject
  // markup. Same rules as fmtContent() in /community/myco/agent.jsx.
  function inlineInto(parent, text) {
    var re = /(\*\*[^*]+\*\*|\[K\d+\])/g, last = 0, m, el;
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (m[0].indexOf('**') === 0) { el = document.createElement('strong'); el.textContent = m[0].slice(2, -2); }
      else { el = document.createElement('span'); el.className = 'myco-ac-cite'; el.textContent = m[0]; }
      parent.appendChild(el);
      last = m.index + m[0].length;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }

  function renderRich(container, text) {
    var para = [], list = null;
    function flushPara() {
      if (!para.length) return;
      var p = document.createElement('p');
      p.className = 'myco-ac-p';
      inlineInto(p, para.join(' '));
      container.appendChild(p);
      para = [];
    }
    String(text || '').split('\n').forEach(function (raw) {
      var line = raw.trim(), h, num, dot;
      if (!line) { flushPara(); list = null; return; }
      if ((h = line.match(/^#{1,4}\s+(.*)$/))) {
        flushPara(); list = null;
        var d = document.createElement('div');
        d.className = 'myco-ac-h';
        d.textContent = h[1].replace(/\*\*/g, '');
        container.appendChild(d);
        return;
      }
      num = line.match(/^(\d+)[.)]\s+(.*)$/);
      dot = line.match(/^[-•*]\s+(.*)$/);
      if (num || dot) {
        flushPara();
        if (!list) { list = document.createElement('ul'); list.className = 'myco-ac-ul'; container.appendChild(list); }
        var li = document.createElement('li');
        if (num) {
          var n = document.createElement('span');
          n.className = 'myco-ac-num';
          n.textContent = num[1] + '. ';
          li.appendChild(n);
        }
        inlineInto(li, num ? num[2] : dot[1]);
        list.appendChild(li);
        return;
      }
      list = null;
      para.push(line);
    });
    flushPara();
  }

  function addMsg(role, text, extra) {
    var el = document.createElement('div');
    el.className = 'myco-ac-msg ' + (role === 'user' ? 'user' : 'bot');
    if (role === 'user') el.textContent = text;
    else renderRich(el, text);

    // Spelling MYCO corrected before searching. Shown because a silent
    // correction is a wrong answer waiting to happen: if we read "rishi"
    // as Reishi and the member meant something else, they have to be able
    // to see that and say so.
    if (extra && extra.readAs && extra.readAs.corrections && extra.readAs.corrections.length) {
      var ra = document.createElement('div');
      ra.className = 'myco-ac-readas';
      ra.textContent = 'read as ' + extra.readAs.corrections.map(function (c) {
        return c.from + ' → ' + c.to;
      }).join(' · ');
      ra.title = 'MYCO searched for the corrected spelling. Say so if that is not what you meant.';
      el.appendChild(ra);
    }

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
          readAs: data.readAs || null,
        });
        history.push({ role: 'user', content: msg });
        history.push({ role: 'assistant', content: data.reply || '' });
        renderChips();   // the openers go once a conversation starts, as in the portal
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
