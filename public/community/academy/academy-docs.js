/* ════════════════════════════════════════════════════════════════
   academy-docs.js — whole PDFs in the lab notebook (2026-09-27)
   ────────────────────────────────────────────────────────────────
   Robin: "the pdf needs to be able to be read by anyone logged in but
   more importantly — myco, which can read the pdfs and take knowledge
   from those pages."

   · Keepers attach a PDF to any lab-notebook chapter.
   · Every signed-in member reads it right here, in the page.
   · At upload the PDF's text is pulled out in the keeper's browser
     (pdf.js) and stored page-numbered in academy_doc_chunks. MYCO
     reads those chunks for signed-in members
     (src/server/myco/academy-docs.cjs), and the monthly MYCO digest
     reads new documents and proposes changes to /extraction,
     /mixology, /find-your-formula and the herb records.

   The files sit in a PRIVATE storage bucket; a member opens one through
   a signed link that lasts an hour. Visitors who are not signed in get
   nothing — not the file, not the text (supabase-academy-docs.sql).

   Hooks into buildLabNotebook() in index.html through
   window.AcademyDocs.render(chapterId, element, isAdmin).
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var BUCKET  = 'academy-docs';
  var MAX_MB  = 50;
  var CHUNK   = 1400;               // same size as a lab-note chunk
  var PDFJS   = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  var WORKER  = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  var docs = [];
  var state = 'idle';               // idle · ready · missing (SQL not run) · signed-out · error
  var errorMsg = '';

  function sb() { return window.SBclient; }
  function isMissing(e) { return !!e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(e.message || '')); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }

  async function ready() {
    try { if (window.SBready) await window.SBready; } catch (_) {}
    return sb();
  }
  async function session() {
    try { return window.SBauth ? await window.SBauth.getSession() : null; } catch (_) { return null; }
  }

  async function load() {
    if (!(await ready())) return;
    if (!(await session())) { state = 'signed-out'; return; }
    var res = await sb().from('academy_docs')
      .select('id, chapter_id, title, storage_path, pages, bytes, text_chars, created_at')
      .order('created_at', { ascending: false });
    if (res.error) {
      state = isMissing(res.error) ? 'missing' : 'error';
      errorMsg = res.error.message || '';
    } else {
      docs = res.data || [];
      state = 'ready';
    }
    if (typeof window.buildLabNotebook === 'function') { try { window.buildLabNotebook(); } catch (_) {} }
  }

  function forChapter(id) { return docs.filter(function (d) { return d.chapter_id === id; }); }

  // ── Reading ────────────────────────────────────────────────────
  async function openDoc(d, holder, btn) {
    if (holder.firstChild) { holder.innerHTML = ''; btn.textContent = 'Read'; return; }
    btn.textContent = 'Opening…';
    var res = await sb().storage.from(BUCKET).createSignedUrl(d.storage_path, 3600);
    if (res.error || !res.data) { btn.textContent = 'Read'; alert('Could not open it: ' + (res.error ? res.error.message : 'no link')); return; }
    var url = res.data.signedUrl;
    holder.innerHTML =
      '<iframe class="ad-view" src="' + esc(url) + '#view=FitH" title="' + esc(d.title) + '"></iframe>' +
      '<a class="ad-link" href="' + esc(url) + '" target="_blank" rel="noopener">Open full screen ↗</a>';
    btn.textContent = 'Close';
  }

  // ── Uploading (keepers) ────────────────────────────────────────
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = PDFJS;
      s.onload = function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;
        resolve(window.pdfjsLib);
      };
      s.onerror = function () { reject(new Error('the PDF reader (pdf.js) did not load')); };
      document.head.appendChild(s);
    });
  }

  // Page-numbered text, cut into ~1,400-character pieces on paragraph
  // or sentence boundaries where it can.
  async function extract(file, onPage) {
    var pdfjs = await loadPdfJs();
    var pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    var chunks = [], buf = '', from = 1;
    function flush(to) {
      var t = buf.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      if (t) chunks.push({ text: t.slice(0, 3900), page_from: from, page_to: to });
      buf = '';
    }
    for (var p = 1; p <= pdf.numPages; p++) {
      onPage && onPage(p, pdf.numPages);
      var page = await pdf.getPage(p);
      var tc = await page.getTextContent();
      var text = tc.items.map(function (it) { return it.str + (it.hasEOL ? '\n' : ' '); }).join('');
      if (!buf) from = p;
      buf += (buf ? '\n' : '') + text;
      while (buf.length > CHUNK) {
        var cut = buf.lastIndexOf('\n\n', CHUNK);
        if (cut < CHUNK * 0.5) cut = buf.lastIndexOf('. ', CHUNK) + 1;
        if (cut < CHUNK * 0.5) cut = CHUNK;
        var head = buf.slice(0, cut);
        var rest = buf.slice(cut);
        buf = head; flush(p);
        buf = rest; from = p;
      }
    }
    flush(pdf.numPages);
    return { pages: pdf.numPages, chunks: chunks };
  }

  async function upload(chapterId, file, status) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) { status.textContent = 'That is not a PDF.'; return; }
    if (file.size > MAX_MB * 1048576) { status.textContent = 'Over ' + MAX_MB + ' MB — too large for the library.'; return; }
    var title = prompt('Title for this document', file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim());
    if (title === null) { status.textContent = ''; return; }
    title = (title.trim() || file.name).slice(0, 160);

    try {
      status.textContent = 'Reading the PDF…';
      var ex = await extract(file, function (p, n) { status.textContent = 'Reading page ' + p + ' of ' + n + '…'; });

      status.textContent = 'Uploading…';
      var slug = file.name.toLowerCase().replace(/\.pdf$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'document';
      var path = chapterId + '/' + Date.now() + '-' + slug + '.pdf';
      var up = await sb().storage.from(BUCKET).upload(path, file, { contentType: 'application/pdf', upsert: false });
      if (up.error) throw up.error;

      var by = null;
      try {
        var me = JSON.parse(localStorage.getItem('spore_active_member_full') || 'null');
        if (me && /^[0-9a-f-]{36}$/i.test(me.cloudId || '')) by = me.cloudId;
      } catch (_) {}
      var textChars = ex.chunks.reduce(function (n, c) { return n + c.text.length; }, 0);
      var ins = await sb().from('academy_docs').insert({
        chapter_id: chapterId, title: title, storage_path: path,
        bytes: file.size, pages: ex.pages, text_chars: textChars, uploaded_by: by,
      }).select('id').single();
      if (ins.error) { await sb().storage.from(BUCKET).remove([path]); throw ins.error; }

      var rows = ex.chunks.map(function (c, i) {
        return { doc_id: ins.data.id, chunk_no: i + 1, page_from: c.page_from, page_to: c.page_to, text: c.text };
      });
      for (var i = 0; i < rows.length; i += 200) {
        status.textContent = 'Teaching MYCO… ' + Math.min(i + 200, rows.length) + ' / ' + rows.length;
        var r = await sb().from('academy_doc_chunks').insert(rows.slice(i, i + 200));
        if (r.error) throw new Error('the PDF is saved, but MYCO could not take in its text: ' + r.error.message);
      }
      status.textContent = rows.length
        ? '✓ Added — ' + ex.pages + ' pages, and MYCO has read them.'
        : '✓ Added — but it has no text layer (a scan?), so MYCO cannot read it. Members can still open it.';
      await load();
    } catch (e) {
      status.textContent = 'Upload failed: ' + ((e && e.message) || e);
    }
  }

  async function removeDoc(d) {
    if (!confirm('Remove “' + d.title + '” from the library? MYCO forgets its text too.')) return;
    var r = await sb().from('academy_docs').delete().eq('id', d.id);
    if (r.error) { alert('Could not remove it: ' + r.error.message); return; }
    await sb().storage.from(BUCKET).remove([d.storage_path]);
    await load();
  }

  // ── Rendering into a chapter ───────────────────────────────────
  function render(chapterId, el, isAdmin) {
    if (!el) return;
    el.innerHTML = '';
    var list = forChapter(chapterId);
    if (state === 'missing') {
      if (isAdmin) el.innerHTML = '<p class="ad-note">PDF library not installed yet — run supabase-academy-docs.sql.</p>';
      return;
    }
    if (state === 'error' && isAdmin) {
      el.innerHTML = '<p class="ad-note">The library could not load: ' + esc(errorMsg) + '</p>';
    }
    list.forEach(function (d) {
      var row = document.createElement('div');
      row.className = 'ad-doc';
      row.innerHTML =
        '<div class="ad-head">' +
          '<span class="ad-icon" aria-hidden="true">▤</span>' +
          '<span class="ad-title">' + esc(d.title) + '</span>' +
          '<span class="ad-meta">' + (d.pages ? d.pages + ' pp · ' : '') + (d.bytes ? kb(d.bytes) : '') +
            (d.text_chars ? ' · MYCO has read it' : ' · no text layer') + '</span>' +
          '<button type="button" class="ad-btn ad-read">Read</button>' +
          (isAdmin ? '<button type="button" class="ad-btn ad-del" aria-label="Remove">✕</button>' : '') +
        '</div>' +
        '<div class="ad-viewer"></div>';
      var viewer = row.querySelector('.ad-viewer');
      var readBtn = row.querySelector('.ad-read');
      readBtn.addEventListener('click', function () { openDoc(d, viewer, readBtn); });
      var del = row.querySelector('.ad-del');
      if (del) del.addEventListener('click', function () { removeDoc(d); });
      el.appendChild(row);
    });
    if (isAdmin && state !== 'signed-out') {
      var bar = document.createElement('div');
      bar.className = 'ad-upload';
      bar.innerHTML =
        '<label class="ad-btn ad-add">＋ Attach a PDF<input type="file" accept="application/pdf,.pdf" hidden></label>' +
        '<span class="ad-status" role="status" aria-live="polite"></span>';
      var input = bar.querySelector('input'), status = bar.querySelector('.ad-status');
      input.addEventListener('change', function () { upload(chapterId, input.files && input.files[0], status); input.value = ''; });
      el.appendChild(bar);
    }
  }

  var css = document.createElement('style');
  css.textContent =
    '.ad-doc{margin:0 0 10px;border:0.5px solid rgba(232,177,75,0.25);border-radius:10px;background:rgba(232,177,75,0.03);overflow:hidden}' +
    '.ad-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px}' +
    '.ad-icon{color:#F5D689;font-size:16px}' +
    '.ad-title{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:16px;color:#E6D9B5;flex:1;min-width:160px}' +
    '.ad-meta{font-family:"Geist Mono",monospace;font-size:9.5px;letter-spacing:.08em;color:#8B7E62}' +
    '.ad-btn{font-family:"Geist Mono",monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;padding:6px 12px;border-radius:999px;cursor:pointer;background:rgba(232,177,75,0.06);border:0.5px solid rgba(232,177,75,0.4);color:#F5D689}' +
    '.ad-btn:hover{background:rgba(232,177,75,0.14)}' +
    '.ad-del{border-color:rgba(225,107,107,0.4);color:#E1A7A0;background:rgba(225,107,107,0.05)}' +
    '.ad-view{display:block;width:100%;height:min(78vh,900px);border:0;border-top:0.5px solid rgba(232,177,75,0.2);background:#1a1a1a}' +
    '.ad-link{display:inline-block;margin:8px 14px 12px;font-family:"Geist Mono",monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#C9B894;text-decoration:none}' +
    '.ad-upload{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 14px}' +
    '.ad-status,.ad-note{font-family:"Geist Mono",monospace;font-size:10px;letter-spacing:.06em;color:#C9B894;line-height:1.6}';
  document.head.appendChild(css);

  window.AcademyDocs = {
    render: render,
    count: function (id) { return forChapter(id).length; },
    reload: load,
  };

  // Load now, and again when someone signs in or out on this page.
  // The listener waits for the client: SBauth does not exist until the
  // Supabase SDK has loaded.
  load().then(function () {
    if (window.SBauth && window.SBauth.onAuthChange) {
      try {
        window.SBauth.onAuthChange(function (e) {
          if (e && (e.event === 'SIGNED_IN' || e.event === 'SIGNED_OUT')) load();
        });
      } catch (_) {}
    }
  });
})();
