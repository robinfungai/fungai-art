/**
 * build-academy.cjs — keeps /community/academy/ in step with the data
 * ─────────────────────────────────────────────────────────────────────
 * Robin, 2026-09-27: the Academy has to update "semi-automatically" as we
 * keep working — the materia medica count must be the live one, and new
 * plant lists (his Nordic foraging list, to start) have to land in their
 * tradition without anyone hand-writing cards.
 *
 * What it does, every build:
 *
 *  1. TRADITION CARDS. Every file in data/academy/<tradition>/ (.txt in
 *     the object-literal format Robin writes, or .json) becomes cards in
 *     that tradition's section of the Academy — european, ayurveda, tcm,
 *     amazonian, mesopotamian. They go between
 *         <!-- academy:<tradition>:start --> … <!-- academy:<tradition>:end -->
 *     (inserted at the end of the section the first time). Hand-written
 *     cards outside the markers are never touched, and a generated card
 *     is skipped when a hand-written one already covers the same Latin
 *     name. So the SEMI-automatic part is: drop a file in the folder,
 *     run the build.
 *
 *  2. CLAIMS SCREEN. Every note is read clause by clause against the
 *     site's own claims rules (src/server/myco/claim-rules.cjs) plus a
 *     short list of pseudo-science phrasings. A clause that names a
 *     disease or makes a medicinal claim is DROPPED from the page — the
 *     rest of the note stays — and printed here so a human can decide.
 *     Safety wording ("avoid in pregnancy", "⚠ ID carefully") is kept.
 *
 *  3. COUNTS. The hero's "N-plant materia medica" is the Engine's live
 *     catalogue (public/herb-engine-ids.json, written by build:engine2,
 *     which runs first); "N living traditions" counts the tradition
 *     bubbles; each bubble shows how many plants its section holds.
 *     The page also re-reads the catalogue count at runtime.
 *
 * Run:  npm run build:academy       (also part of npm run build)
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const PAGE    = path.join(ROOT, 'public/community/academy/index.html');
const DATA    = path.join(ROOT, 'data/academy');
const SHELF   = path.join(ROOT, 'public/herb-engine-ids.json');
const { RULES, SAFETY_CONTEXT } = require(path.join(ROOT, 'src/server/myco/claim-rules.cjs'));

const TRADITIONS = ['european', 'ayurveda', 'tcm', 'amazonian', 'mesopotamian'];

// ── Group titles, by the entry's `type` (or an explicit `group`) ────
const GROUPS = {
  tree:     { title: 'Nordic Trees',            em: 'bark, sap, needle and nut' },
  plant:    { title: 'Meadow, Hedge &amp; Field', em: 'the wild pantry' },
  berry:    { title: 'Wild Berries',            em: 'the forest floor in fruit' },
  fungi:    { title: 'Forest Fungi',            em: 'what the mycelium sends up' },
  coastal:  { title: 'Coast &amp; Shore',       em: 'salt-marsh and strand' },
  seaweed:  { title: 'Coast &amp; Shore',       em: 'salt-marsh and strand' },
};
const GROUP_ORDER = ['tree', 'plant', 'berry', 'fungi', 'coastal'];

// Safety a plant must never be shown without, whatever the source file
// says. Keyed by Latin name.
const SAFETY_ADDENDA = {
  'Hypericum perforatum': '⚠ Interacts with many medicines — the contraceptive pill, antidepressants, blood thinners. Ask a pharmacist first.',
  'Sium latifolium':      '⚠ Lookalike of deadly water hemlock; the root is poisonous.',
};

// Pseudo-science we will not print, whatever the rules file allows.
const PSEUDO = [/\bMHz\b/i, /biofrequenc/i, /\bvibration(al)? frequency\b/i, /\bgrade [a-d][+-]? evidence\b/i, /\bhighest (ORAC|frequency)\b/i];

// ── Parse Robin's object-literal lines ──────────────────────────────
//   'Tall': { sv:'Tall', en:'Scots Pine', latin:'Pinus sylvestris', type:'tree', parts:'…', note:'…' },
// A line that does not close its braces (a half-pasted entry) is
// reported and skipped rather than guessed at.
function parseTxt(text, file) {
  const out = [], skipped = [];
  let section = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const head = /^\/\/\s*(.+)$/.exec(line);
    if (head) { section = /coast|seaweed|shore/i.test(head[1]) ? 'coastal' : null; continue; }
    const m = /^'([^']+)'\s*:\s*\{(.*)\}\s*,?\s*$/.exec(line);
    if (!m) {
      if (/^'[^']+'\s*:/.test(line)) skipped.push(file + ': ' + line.slice(0, 60) + '…');
      continue;
    }
    const e = {};
    const re = /(\w+)\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
    let f;
    while ((f = re.exec(m[2]))) e[f[1]] = (f[2] !== undefined ? f[2] : f[3]).replace(/\\(['"\\])/g, '$1');
    if (!e.latin || !(e.en || e.sv)) { skipped.push(file + ': ' + m[1] + ' (no Latin or English name)'); continue; }
    if (section === 'coastal' && !e.group) e.group = 'coastal';
    out.push(e);
  }
  return { entries: out, skipped };
}

function loadTradition(id) {
  const dir = path.join(DATA, id);
  if (!fs.existsSync(dir)) return null;
  const entries = [], skipped = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (name.endsWith('.json')) {
      const list = JSON.parse(fs.readFileSync(p, 'utf8'));
      (Array.isArray(list) ? list : []).forEach(e => entries.push(e));
    } else if (name.endsWith('.txt')) {
      const r = parseTxt(fs.readFileSync(p, 'utf8'), name);
      entries.push(...r.entries); skipped.push(...r.skipped);
    }
  }
  return { entries, skipped };
}

// ── Claims screen, clause by clause ─────────────────────────────────
const claimRes = RULES.map(r => ({ id: r.id, re: r.re() }));
function screen(note, dropped, who) {
  if (!note) return '';
  const kept = [];
  for (const clause of String(note).split(/\s*;\s*|(?<=\.)\s+/)) {
    const c = clause.trim().replace(/[.\s]+$/, '');
    if (!c) continue;
    const safety = SAFETY_CONTEXT.test(c) || /^⚠/.test(c);
    let why = PSEUDO.some(p => p.test(c)) ? 'pseudo-science or evidence claim' : null;
    if (!why && !safety) {
      for (const r of claimRes) { r.re.lastIndex = 0; if (r.re.test(c)) { why = r.id; break; } }
    }
    if (why) { dropped.push(who + ' — "' + c + '" (' + why + ')'); continue; }
    kept.push(c);
  }
  return kept.join('; ');
}

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function card(e, note) {
  const name = e.en || e.sv;
  const bits = [];
  if (e.sv && e.sv !== name) bits.push('<em>' + esc(e.sv) + '</em> in Swedish.');
  if (e.parts) bits.push('Parts used: ' + esc(e.parts) + '.');
  let noteHtml = '';
  if (note) {
    noteHtml = ' ' + note.split('; ').map(c => /^⚠/.test(c)
      ? '<strong style="color:#E8714B;">' + esc(c) + '</strong>'
      : esc(c.charAt(0).toUpperCase() + c.slice(1))).join('. ') + (/[.!?]$/.test(note) ? '' : '.');
  }
  return '        <div class="ayur-herb"><div class="ayur-h-name">' + esc(name) +
    ' <span class="ayur-h-lat">' + esc(e.latin) + '</span></div><div class="ayur-h-desc">' +
    bits.join(' ') + noteHtml + '</div></div>';
}

// ── Page surgery ────────────────────────────────────────────────────
// The section's own closing </div>, found by counting divs from its
// opening tag.
function sectionBounds(html, id) {
  const open = '<div class="trad-section" data-tradition="' + id + '">';
  const start = html.indexOf(open);
  if (start < 0) return null;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return { start, close: m.index };
  }
  return null;
}

function latinKey(s) { return String(s || '').toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/).slice(0, 2).join(' '); }

function run() {
  let html = fs.readFileSync(PAGE, 'utf8');
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const report = { added: {}, dup: [], dropped: [], skipped: [] };

  for (const id of TRADITIONS) {
    const t = loadTradition(id);
    if (!t) continue;
    report.skipped.push(...t.skipped);
    const START = '<!-- academy:' + id + ':start -->', END = '<!-- academy:' + id + ':end -->';
    let b = sectionBounds(html, id);
    if (!b) { console.warn('⚠  no section data-tradition="' + id + '" — ' + t.entries.length + ' entries not placed'); continue; }
    if (html.indexOf(START, b.start) < 0 || html.indexOf(START, b.start) > b.close) {
      html = html.slice(0, b.close) + '  ' + START + nl + '    ' + END + nl + '  ' + html.slice(b.close);
      b = sectionBounds(html, id);
    }
    const s = html.indexOf(START, b.start), e = html.indexOf(END, s);
    // Latin names already written by hand in this section (outside the markers).
    const handText = html.slice(b.start, s) + html.slice(e, b.close);
    const hand = new Set([...handText.matchAll(/class="ayur-h-lat">([^<]+)</g)].map(x => latinKey(x[1])));
    const seen = new Set();
    const groups = {};
    for (const entry of t.entries) {
      const k = latinKey(entry.latin);
      if (hand.has(k)) { report.dup.push(entry.en + ' (' + entry.latin + ') — already a hand-written card'); continue; }
      if (seen.has(k))  { report.dup.push(entry.en + ' (' + entry.latin + ') — listed twice'); continue; }
      seen.add(k);
      const g = entry.group || (entry.type === 'seaweed' ? 'coastal' : entry.type) || 'plant';
      let note = screen(entry.note, report.dropped, entry.en || entry.sv);
      const add = SAFETY_ADDENDA[entry.latin];
      if (add) note = note ? note + '; ' + add : add;
      (groups[g] = groups[g] || []).push(card(entry, note));
    }
    const order = [...GROUP_ORDER, ...Object.keys(groups).filter(g => !GROUP_ORDER.includes(g))];
    const blocks = [];
    let n = 0;
    for (const g of order) {
      if (!groups[g]) continue;
      const meta = GROUPS[g] || { title: g.charAt(0).toUpperCase() + g.slice(1), em: '' };
      n += groups[g].length;
      blocks.push(
        '    <div class="ayur-cat">' + nl +
        '      <div class="ayur-cat-title">' + meta.title + (meta.em ? ' &middot; <em>' + meta.em + '</em>' : '') + '</div>' + nl +
        '      <div class="ayur-list">' + nl + groups[g].join(nl) + nl + '      </div>' + nl +
        '    </div>');
    }
    report.added[id] = n;
    const body = nl + '    <!-- Generated by scripts/build-academy.cjs from data/academy/' + id +
      '/ — edit the data, not this block. -->' + nl + blocks.join(nl) + nl + '    ';
    html = html.slice(0, s + START.length) + body + html.slice(e);
  }

  // ── Counts ──
  let herbCount = null;
  try { herbCount = JSON.parse(fs.readFileSync(SHELF, 'utf8')).length; } catch (_) {}
  if (herbCount) html = html.replace(/(<span data-academy="herb-count">)[^<]*(<\/span>)/g, '$1' + herbCount + '$2');
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const bubbles = [...html.matchAll(/class="trad-bubble" data-go="([a-z]+)"/g)].map(x => x[1]).filter(x => x !== 'all');
  html = html.replace(/(<span data-academy="traditions">)[^<]*(<\/span>)/g, '$1' + (WORDS[bubbles.length] || bubbles.length) + '$2');
  for (const id of bubbles) {
    let plants = 0;
    const re = /<div class="trad-section" data-tradition="([^"]+)">/g;
    let m;
    while ((m = re.exec(html))) {
      if (!m[1].split(',').includes(id)) continue;
      const bb = sectionBounds(html, m[1]);
      if (!bb) continue;
      const chunk = html.slice(bb.start, bb.close);
      plants += (chunk.match(/class="ayur-herb"/g) || []).length + (chunk.match(/<tr><td>/g) || []).length;
    }
    html = html.replace(new RegExp('(<span data-academy="count-' + id + '">)[^<]*(</span>)', 'g'), '$1' + plants + ' plants$2');
  }

  fs.writeFileSync(PAGE, html, 'utf8');

  // ── Report ──
  for (const [id, n] of Object.entries(report.added)) console.log('✓  Academy · ' + id + ': ' + n + ' generated cards');
  if (herbCount) console.log('✓  Academy · materia medica count: ' + herbCount);
  if (report.dup.length)     console.log('·  skipped as duplicates (' + report.dup.length + '):\n     ' + report.dup.join('\n     '));
  if (report.skipped.length) console.log('⚠  unreadable lines (' + report.skipped.length + '):\n     ' + report.skipped.join('\n     '));
  if (report.dropped.length) console.log('⚠  note clauses NOT printed — health claims or pseudo-science (' + report.dropped.length + '):\n     ' + report.dropped.join('\n     '));
}

run();
