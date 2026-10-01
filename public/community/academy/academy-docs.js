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
  // jsdelivr, not cdnjs: the site's Content-Security-Policy (netlify.toml)
  // allows scripts from cdn.jsdelivr.net only — cdnjs would be blocked live.
  var PDFJS   = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  var WORKER  = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

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
  function onPhone() {
    try { return window.matchMedia('(pointer: coarse) and (max-width: 900px)').matches; } catch (_) { return false; }
  }

  // One reader per chapter, full width under the grid; the card that is
  // open is marked, and its Read button closes it again.
  async function openDoc(d, holder, card) {
    var grid = card.parentNode;
    var wasOpen = card.classList.contains('is-open');
    grid.querySelectorAll('.ad-doc.is-open').forEach(function (c) {
      c.classList.remove('is-open'); c.querySelector('.ad-read').textContent = 'Read';
    });
    holder.innerHTML = '';
    if (wasOpen) return;
    var btn = card.querySelector('.ad-read');
    btn.textContent = 'Opening…';
    var res = await sb().storage.from(BUCKET).createSignedUrl(d.storage_path, 3600);
    if (res.error || !res.data) { btn.textContent = 'Read'; alert('Could not open it: ' + (res.error ? res.error.message : 'no link')); return; }
    var url = res.data.signedUrl;
    card.classList.add('is-open');
    btn.textContent = 'Close';
    // Phones: Android Chrome cannot show a PDF inside the page at all and
    // iOS shows only its first page, so hand it to the phone's own viewer
    // — through a link the member taps, after seeing how heavy it is.
    if (onPhone()) {
      var big = d.bytes > 10 * 1048576;
      holder.innerHTML =
        '<div class="ad-viewer-head"><span class="ad-viewer-title">' + esc(d.title) + '</span>' +
          '<button type="button" class="ad-btn ad-close">Close</button></div>' +
        '<div class="ad-phone">' +
          (d.bytes ? '<p class="ad-note">' + kb(d.bytes) + (d.pages ? ' · ' + d.pages + ' pages' : '') +
            (big ? ' — a heavy file. On mobile data, Wi-Fi is kinder.' : '') + '</p>' : '') +
          '<a class="ad-btn ad-open" href="' + esc(url) + '" target="_blank" rel="noopener">Open the PDF ↗</a>' +
        '</div>';
      holder.querySelector('.ad-close').addEventListener('click', function () { openDoc(d, holder, card); });
      holder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    holder.innerHTML =
      '<div class="ad-viewer-head"><span class="ad-viewer-title">' + esc(d.title) + '</span>' +
        '<a class="ad-link" href="' + esc(url) + '" target="_blank" rel="noopener">Open full screen ↗</a>' +
        '<button type="button" class="ad-btn ad-close">Close</button></div>' +
      '<iframe class="ad-view" src="' + esc(url) + '#view=FitH" title="' + esc(d.title) + '"></iframe>';
    holder.querySelector('.ad-close').addEventListener('click', function () { openDoc(d, holder, card); });
    holder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    var chunks = [], buf = '', from = 1, heading = '';
    var meta = null;
    try { meta = await pdf.getMetadata(); } catch (_) {}
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
      if (p === 1) heading = biggestLine(tc.items);
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
    var t = meta && meta.info && String(meta.info.Title || '').trim();
    return { pages: pdf.numPages, chunks: chunks, title: goodTitle(t) || goodTitle(heading) };
  }

  // Editors leave junk in the Title field ("Microsoft Word - draft3.docx").
  function goodTitle(t) {
    t = String(t || '').replace(/\s+/g, ' ').trim();
    if (t.length < 6 || t.length > 160) return '';
    if (/^(untitled|document\d*|microsoft (word|powerpoint)|slide ?\d+)|\.(pdf|docx?|pptx?|indd|tex)$/i.test(t)) return '';
    if (!/[a-z]{3}/i.test(t)) return '';
    return t;
  }
  // The largest type on the first page, in reading order — for most
  // papers and books that is the title.
  function biggestLine(items) {
    var size = function (it) { return Math.abs((it.transform && it.transform[3]) || it.height || 0); };
    var words = items.filter(function (it) { return it.str && it.str.trim().length > 1; });
    if (!words.length) return '';
    var max = Math.max.apply(null, words.map(size));
    return words.filter(function (it) { return size(it) >= max * 0.92; })
      .map(function (it) { return it.str.trim(); }).join(' ').slice(0, 160);
  }

  async function upload(chapterId, file, status) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) { status.textContent = 'That is not a PDF.'; return; }
    if (file.size > MAX_MB * 1048576) { status.textContent = 'Over ' + MAX_MB + ' MB — too large for the library.'; return; }
    try {
      status.textContent = 'Reading the PDF…';
      var ex = await extract(file, function (p, n) { status.textContent = 'Reading page ' + p + ' of ' + n + '…'; });

      // The card shows this as its headline — offer the PDF's own title.
      var fromName = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
      var title = prompt('Title for this document — it is the headline on its card', ex.title || fromName);
      if (title === null) { status.textContent = ''; return; }
      title = (title.trim() || fromName || file.name).slice(0, 160);

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

  async function renameDoc(d) {
    var t = prompt('New title for this document', d.title);
    if (t === null) return;
    t = t.trim().slice(0, 160);
    if (!t || t === d.title) return;
    var r = await sb().from('academy_docs').update({ title: t }).eq('id', d.id);
    if (r.error) { alert('Could not rename it: ' + r.error.message); return; }
    await load();
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
    var grid = document.createElement('div');
    grid.className = 'ad-grid';
    var viewer = document.createElement('div');
    viewer.className = 'ad-viewer';
    if (list.length > 6) {
      var find = document.createElement('input');
      find.type = 'search';
      find.className = 'ad-find';
      find.placeholder = 'Search ' + list.length + ' documents…';
      find.setAttribute('aria-label', 'Search the documents in this chapter');
      find.addEventListener('input', function () {
        var q = find.value.trim().toLowerCase();
        grid.querySelectorAll('.ad-doc').forEach(function (c) {
          c.hidden = !!q && c.dataset.title.indexOf(q) === -1;
        });
      });
      el.appendChild(find);
    }
    list.forEach(function (d) {
      var card = document.createElement('div');
      card.className = 'ad-doc';
      card.dataset.title = String(d.title || '').toLowerCase();
      card.innerHTML =
        '<div class="ad-title" title="' + esc(d.title) + '">' + esc(d.title) + '</div>' +
        // Title, pages and size only (Robin, 2026-10-01). A keeper still
        // sees "no text layer": that one means MYCO cannot read the PDF.
        '<div class="ad-meta"><span class="ad-icon" aria-hidden="true">▤</span>' +
          (d.pages ? d.pages + ' pages · ' : '') + (d.bytes ? kb(d.bytes) : '') +
          (!d.text_chars && isAdmin ? ' · no text layer' : '') + '</div>' +
        '<div class="ad-actions">' +
          '<button type="button" class="ad-btn ad-read">Read</button>' +
          (isAdmin ? '<button type="button" class="ad-btn ad-ren" aria-label="Rename" title="Rename">✎</button>' +
                     '<button type="button" class="ad-btn ad-del" aria-label="Remove" title="Remove">✕</button>' : '') +
        '</div>';
      card.querySelector('.ad-read').addEventListener('click', function () { openDoc(d, viewer, card); });
      var ren = card.querySelector('.ad-ren');
      if (ren) ren.addEventListener('click', function () { renameDoc(d); });
      var del = card.querySelector('.ad-del');
      if (del) del.addEventListener('click', function () { removeDoc(d); });
      grid.appendChild(card);
    });
    if (list.length) { el.appendChild(grid); el.appendChild(viewer); }
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
    '.ad-find{display:block;width:100%;max-width:320px;margin:0 0 10px;padding:7px 12px;border-radius:999px;border:0.5px solid rgba(232,177,75,0.3);background:rgba(232,177,75,0.04);color:#E6D9B5;font-family:"Geist Mono",monospace;font-size:10.5px;letter-spacing:.06em}' +
    '.ad-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 10px}' +
    '@media (max-width:760px){.ad-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
    '@media (max-width:440px){.ad-grid{grid-template-columns:1fr}}' +
    '.ad-doc{display:flex;flex-direction:column;gap:6px;min-width:0;padding:9px 11px;border:0.5px solid rgba(232,177,75,0.25);border-radius:10px;background:rgba(232,177,75,0.03)}' +
    '.ad-doc[hidden]{display:none}' +
    '.ad-doc.is-open{border-color:rgba(245,214,137,0.7);background:rgba(232,177,75,0.09)}' +
    '.ad-icon{color:#F5D689;font-size:11px;margin-right:5px}' +
    '.ad-title{font-family:"Cormorant Garamond",Georgia,serif;font-size:15.5px;line-height:1.25;color:#F1E6C6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}' +
    '.ad-meta{font-family:"Geist Mono",monospace;font-size:9px;letter-spacing:.06em;color:#8B7E62;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ad-actions{display:flex;gap:6px;margin-top:auto}' +
    '.ad-actions .ad-btn{padding:4px 10px}' +
    '.ad-viewer:empty{display:none}' +
    '.ad-viewer{margin:0 0 14px;border:0.5px solid rgba(232,177,75,0.35);border-radius:10px;overflow:hidden}' +
    '.ad-phone{padding:4px 12px 14px;display:flex;flex-direction:column;align-items:flex-start;gap:10px}' +
    '.ad-open{text-decoration:none;padding:9px 16px}' +
    '.ad-viewer-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 12px}' +
    '.ad-viewer-title{flex:1;min-width:0;font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:16px;color:#E6D9B5}' +
    '.ad-btn{font-family:"Geist Mono",monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;padding:6px 12px;border-radius:999px;cursor:pointer;background:rgba(232,177,75,0.06);border:0.5px solid rgba(232,177,75,0.4);color:#F5D689}' +
    '.ad-btn:hover{background:rgba(232,177,75,0.14)}' +
    '.ad-del{border-color:rgba(225,107,107,0.4);color:#E1A7A0;background:rgba(225,107,107,0.05)}' +
    '.ad-view{display:block;width:100%;height:min(78vh,900px);border:0;border-top:0.5px solid rgba(232,177,75,0.2);background:#1a1a1a}' +
    '.ad-link{display:inline-block;font-family:"Geist Mono",monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#C9B894;text-decoration:none}' +
    '.ad-upload{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 14px}' +
    '.ad-status,.ad-note{font-family:"Geist Mono",monospace;font-size:10px;letter-spacing:.06em;color:#C9B894;line-height:1.6}';
  document.head.appendChild(css);

  window.AcademyDocs = {
    render: render,
    count: function (id) { return forChapter(id).length; },
    // Newest first — the closed chapter card shows the first two.
    titles: function (id) { return forChapter(id).map(function (d) { return d.title || ''; }).filter(Boolean); },
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
