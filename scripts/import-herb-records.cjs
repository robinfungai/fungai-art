#!/usr/bin/env node
/**
 * scripts/import-herb-records.cjs
 *
 * Imports a batch of authored herb records into src/data/herbs.ts.
 *
 *   node scripts/import-herb-records.cjs "<staging dir>"            # report only
 *   node scripts/import-herb-records.cjs "<staging dir>" --apply
 *   node scripts/import-herb-records.cjs "<dir>" --apply --skip=414,523,526
 *   node scripts/import-herb-records.cjs "<dir>" --diff=414,523,526  # field diff
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────
 * Batches arrive as `NNN Name.md` files, each wrapping a JS object
 * literal in a ```js fence. Three things make hand-importing them
 * dangerous, and all three are what this script checks:
 *
 *   1. THE NUMBER IN THE FILENAME IS NOT A HERB ID. It is the batch's
 *      own document number. The first Ayurvedic batch ran 301–329,
 *      where herbs.ts already had Rhubarb Root at 301, Lion's Mane at
 *      317 and Reishi at 323. Importing on the file number would have
 *      overwritten 29 unrelated plants.
 *
 *   2. MOST OF A BATCH USUALLY ALREADY EXISTS. 24 of the first 29 were
 *      already in herbs.ts under different ids, as thin stubs. They
 *      need their EXISTING id kept and their contents upgraded — not a
 *      second record, which is how you end up with two knotweeds.
 *
 *   3. AUTHORED VALUES DRIFT FROM THE TYPE. Every record in the first
 *      batch used `origin_region: 'Indian'` and `caution_level:
 *      'MODERATE'`, neither of which is in the Herb union. A value the
 *      union does not allow is a value no `===` in the engine will ever
 *      match, so it fails silently rather than loudly.
 *
 * ── RAW TEXT, NOT ROUND-TRIPPED OBJECTS ──────────────────────────
 * The authored source text is spliced in as written. The records are
 * long-form prose — spiritual layers, pharmacology, API karma lists —
 * and re-serialising a parsed object would reflow every string, reorder
 * fields and turn a reviewable diff into a rewrite of the file. The
 * object is parsed only to VALIDATE and to match names; what lands in
 * herbs.ts is the author's own formatting with targeted edits.
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const HERBS_TS  = path.join(ROOT, 'src', 'data', 'herbs.ts');
const NEW_ID_FROM = 590;   // first free id above the current max (589)

// ── Normalisations ───────────────────────────────────────────────
// Authored vocabulary → the vocabulary the Herb type and the engine use.
// Each one is a mapping, never a guess at intent:
//
//   origin_region 'Indian'   → 'Ayurvedic' is the union's name for this block
//   caution_level 'MODERATE' → 'MEDIUM' is the same level, spelled the way
//                              the union spells it
//   regional_affinity chakras → this field maps 1:1 to the somatic-map QUIZ
//                              answer, so a value the quiz cannot emit is a
//                              dead value. Mapped to the nearest body region.
//   digestion_fit 'laxative' → 'moving', same reason
//
// evidence_grade 'D' is deliberately NOT mapped: picker.js GRADE_RANK already
// ranks 'D' at 10, so the engine understands it and only the TS union was
// missing it. The union is widened to the full ladder instead.
const NORMALISE = {
  origin_region:     { Indian: 'Ayurvedic' },
  caution_level:     { MODERATE: 'MEDIUM' },
  regional_affinity: { root: 'pelvis', sacral: 'pelvis', throat: 'chest', third_eye: 'head' },
  digestion_fit:     { laxative: 'moving' },
};

const UNIONS = {
  caution_level:      ['LOW', 'LOW-MEDIUM', 'MEDIUM', 'MEDIUM-HIGH', 'HIGH', 'VERY HIGH'],
  nervous_system_fit: ['wired', 'tired', 'wired_tired', 'steady', 'reactive', 'flat'],
  energy_pattern:     ['am_boost', 'sustained', 'pm_stabilise', 'restorative_only', 'acute_only', 'crash_repair'],
  sleep_action:       ['onset', 'maintenance', 'early_wake', 'restoration', 'dream_soften'],
  digestion_fit:      ['warming', 'cooling', 'moving', 'astringent', 'demulcent', 'bitter', 'carminative'],
  regional_affinity:  ['head', 'chest', 'heart', 'solar_plexus', 'gut', 'liver', 'kidneys', 'pelvis', 'joints', 'skin', 'whole'],
  onset_time:         ['immediate', 'hours', 'days', 'weeks', 'months'],
  origin_region:      ['Nordic wild', 'European', 'Ayurvedic', 'Chinese', 'North American',
                       'Central American', 'South American', 'African', 'Mediterranean', 'Global'],
  evidence_grade:     ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'traditional'],
};

// Fields whose EXISTING value is kept when upgrading a record.
//
// spiritual_layer and epithet because they are Robin's own writing rather
// than data.
//
// `name` because a herb's display name is an identifier in everything but
// name: other herbs' synergy prose is matched against it (nameKeys), the
// entity map and shop strings resolve through it, `public/herb-engine-ids.json`
// is a COMMITTED list holding it verbatim, and sync-engine2 derives each
// Engine 2 slug id from it. The first run of this script renamed Guggulu to
// Guggul from the batch file and would have silently orphaned all of those.
// If a name genuinely should change, change it deliberately in herbs.ts and
// update what references it — never as a side effect of an import.
const VOICE_FIELDS = ['spiritual_layer', 'epithet', 'name'];

const nrm = s => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

// ── herbs.ts, split into top-level records ───────────────────────
// A character scanner rather than a regex: record bodies contain braces
// inside strings, apostrophes inside comments ("the tree's wound") and
// box-drawing comment rules. Anything less careful mis-slices the file.
function splitRecords(src) {
  const decl = src.indexOf('export const HERBS: Herb[] = [');
  if (decl < 0) throw new Error('HERBS array not found in herbs.ts');
  const open = src.indexOf('[', decl) + 1;
  const close = src.lastIndexOf('\n];');
  const body = src.slice(open, close);

  const recs = [];
  let depth = 0, start = -1;
  let inStr = false, quote = '', esc = false, inLine = false, inBlock = false;

  for (let i = 0; i < body.length; i++) {
    const c = body[i], n = body[i + 1];
    if (inLine)  { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === quote) inStr = false;
      continue;
    }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = true; quote = c; continue; }
    if (c === '{') { if (depth === 0) start = i; depth++; continue; }
    if (c === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        recs.push({ from: open + start, to: open + i + 1, text: body.slice(start, i + 1) });
        start = -1;
      }
    }
  }
  return { recs, insertAt: close };
}

const idOf   = text => { const m = text.match(/\bid:\s*(\d+)/);   return m ? Number(m[1]) : null; };
const nameOf = text => { const m = text.match(/\bname:\s*'((?:[^'\\]|\\.)*)'/); return m ? m[1].replace(/\\'/g, "'") : null; };

/**
 * The source LINES for one field, including a multi-line string value.
 *
 * Line-based, not a regex over the whole record. These values are long
 * prose containing braces, apostrophes, colons and slashes, and an
 * offset-based regex that over-captures by one field silently splices a
 * duplicate key into the file — which is exactly what happened on the
 * first run of this script against Amaltas.
 */
function fieldBlock(text, field) {
  const lines = text.split('\n');
  const keyAt = i => lines[i].match(/^(\s*)([A-Za-z_]\w*)\s*:/);
  let start = -1, indent = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = keyAt(i);
    if (m && m[2] === field) { start = i; indent = m[1].length; break; }
  }
  if (start < 0) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = keyAt(i);
    const lead = lines[i].match(/^(\s*)/)[1].length;
    const isComment = /^\s*\/\//.test(lines[i]);
    const isClose   = /^\s{0,3}[}\]]/.test(lines[i]) && lead <= indent;
    if ((m && m[1].length <= indent) || (isComment && lead <= indent) || isClose) { end = i; break; }
  }
  return { start, end, lines, text: lines.slice(start, end).join('\n') };
}

function replaceField(text, field, blockText) {
  const b = fieldBlock(text, field);
  if (!b) return text;
  const out = b.lines.slice(0, b.start).concat(blockText.split('\n'), b.lines.slice(b.end));
  return out.join('\n');
}

/** A single-quoted JS string literal, escaped the way herbs.ts writes them. */
function jsStr(s) {
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

/** Render one field the way the batch files render it: short on one line,
 *  long wrapped onto its own indented line. */
function renderStringField(field, value) {
  const lit = jsStr(value);
  return lit.length + field.length + 10 <= 110
    ? '    ' + field + ': ' + lit + ','
    : '    ' + field + ':\n      ' + lit + ',';
}

// ── Incoming batch ───────────────────────────────────────────────
function readBatch(dir) {
  const out = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!/\.md$/i.test(file)) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const fence = raw.match(/```js\s*([\s\S]*?)```/);
    if (!fence) { out.push({ file, skip: 'no ```js fence' }); continue; }
    let text = fence[1].trim().replace(/,\s*$/, '');
    let obj;
    try {
      obj = new Function('return (' + text + ')')();   // local, authored file
    } catch (e) {
      out.push({ file, skip: 'unparseable: ' + e.message.slice(0, 60) });
      continue;
    }
    out.push({ file, text, obj });
  }
  return out;
}

/** Apply the vocabulary normalisations to the AUTHORED TEXT. */
function normaliseText(text, obj) {
  const applied = [];
  for (const [field, map] of Object.entries(NORMALISE)) {
    const v = obj[field];
    if (v === undefined) continue;
    for (const [from, to] of Object.entries(map)) {
      const re = new RegExp("(" + field + ":[^\\n]*?)'" + from + "'", 'g');
      if (!re.test(text)) continue;
      text = text.replace(new RegExp("(" + field + ":[\\s\\S]{0,400}?)'" + from + "'", 'g'),
                          (m, head) => head + "'" + to + "'");
      applied.push(field + ": '" + from + "' → '" + to + "'");
    }
  }
  return { text, applied };
}

function violations(obj) {
  const bad = [];
  for (const [field, allowed] of Object.entries(UNIONS)) {
    const v = obj[field];
    if (v === undefined) continue;
    for (const item of Array.isArray(v) ? v : [v]) {
      if (!allowed.includes(item)) bad.push(field + ": " + JSON.stringify(item));
    }
  }
  return bad;
}

// ── Main ─────────────────────────────────────────────────────────
function main() {
  const args  = process.argv.slice(2);
  const dir   = args.find(a => !a.startsWith('--'));
  const apply = args.includes('--apply');
  const skip  = new Set((args.find(a => a.startsWith('--skip=')) || '').replace('--skip=', '')
                  .split(',').filter(Boolean).map(Number));
  const diffOnly = (args.find(a => a.startsWith('--diff=')) || '').replace('--diff=', '')
                  .split(',').filter(Boolean).map(Number);

  if (!dir) {
    console.error('usage: node scripts/import-herb-records.cjs "<staging dir>" [--apply] [--skip=id,id] [--diff=id,id]');
    process.exit(2);
  }

  let src = fs.readFileSync(HERBS_TS, 'utf8');
  const { recs } = splitRecords(src);
  const existing = recs.map(r => {
    let obj = null;
    try { obj = new Function('return (' + r.text + ')')(); } catch (_) { /* keep text-only */ }
    return { ...r, id: idOf(r.text), name: nameOf(r.text), obj };
  }).filter(r => r.id !== null);
  const usedIds = new Set(existing.map(r => r.id));
  const batch = readBatch(dir);

  // Match each incoming record to an existing one by name.
  const plan = [];
  let nextId = NEW_ID_FROM;
  while (usedIds.has(nextId)) nextId++;

  for (const item of batch) {
    if (item.skip) { plan.push({ ...item, action: 'skip' }); continue; }
    const incoming = nrm(item.obj.name);
    const match = existing.find(r => {
      const head = nrm(String(r.name).split('/')[0].replace(/\(.*/, ''));
      return nrm(r.name).includes(incoming) || incoming.includes(head);
    });
    if (match) {
      plan.push({ ...item, action: skip.has(match.id) ? 'held' : 'upgrade', target: match });
    } else {
      plan.push({ ...item, action: 'add', newId: nextId });
      usedIds.add(nextId);
      while (usedIds.has(nextId)) nextId++;
    }
  }

  // ── Field diff mode ───────────────────────────────────────────
  if (diffOnly.length) {
    for (const id of diffOnly) {
      const p = plan.find(x => x.target && x.target.id === id);
      if (!p) { console.log('\nid ' + id + ' — not in this batch'); continue; }
      const cur = p.target;
      console.log('\n' + '═'.repeat(66));
      console.log('id ' + id + '  ' + cur.name + '   vs   ' + p.file);
      console.log('═'.repeat(66));
      // Compared as PARSED VALUES, not as source blocks. The two files
      // indent and wrap differently, and a block-based diff reported
      // "name NEW" for a record that plainly has a name.
      const curObj = cur.obj;
      let newObj = null;
      try { newObj = new Function('return (' + p.text.replace(/,\s*$/, '') + ')')(); } catch (_) {}
      if (!curObj || !newObj) { console.log('  (could not parse one side)'); continue; }

      const size = v => (v === undefined ? 0 : JSON.stringify(v).length);
      for (const k of new Set([...Object.keys(curObj), ...Object.keys(newObj)])) {
        if (k === 'id') continue;
        const a = curObj[k], b = newObj[k];
        if (a === undefined) { console.log('  + ' + k.padEnd(26) + 'NEW (' + size(b) + ' chars)'); continue; }
        if (b === undefined) { console.log('  - ' + k.padEnd(26) + 'ONLY IN CURRENT — would be lost (' + size(a) + ')'); continue; }
        if (JSON.stringify(a) === JSON.stringify(b)) { console.log('    ' + k.padEnd(26) + 'identical'); continue; }
        const arr = Array.isArray(a) && Array.isArray(b);
        console.log('  ~ ' + k.padEnd(26) + 'current ' + size(a) + ' → incoming ' + size(b) +
                    (arr ? '   (' + a.length + ' → ' + b.length + ' items)' : ''));
      }
    }
    return;
  }

  // ── Report ────────────────────────────────────────────────────
  console.log('\nherbs.ts: ' + existing.length + ' records, ids ' +
              Math.min(...usedIds) + '–' + Math.max(...existing.map(r => r.id)));
  console.log('batch    : ' + dir + '\n');
  console.log('action    file                        → id    note');
  console.log('─'.repeat(78));

  let nUp = 0, nAdd = 0, nHeld = 0, nSkip = 0;
  const edits = [];

  for (const p of plan) {
    if (p.action === 'skip') { nSkip++; console.log('skip      ' + p.file.padEnd(28) + '        ' + p.skip); continue; }
    if (p.action === 'held') { nHeld++; console.log('HELD      ' + p.file.padEnd(28) + '→ ' + String(p.target.id).padEnd(6) + 'left for review (--diff=' + p.target.id + ')'); continue; }

    const targetId = p.action === 'upgrade' ? p.target.id : p.newId;
    let text = p.text;

    // 1 · vocabulary
    const n = normaliseText(text, p.obj);
    text = n.text;

    // 2 · the id from herbs.ts, never the one in the filename
    text = text.replace(/\bid:\s*\d+/, 'id: ' + targetId);

    // 3 · keep Robin's writing on an upgrade.
    //     Taken from the PARSED existing record and re-rendered, rather than
    //     lifted as source text: the two files indent and wrap differently,
    //     and splicing one's lines into the other is how a duplicate key
    //     gets in.
    const kept = [];
    if (p.action === 'upgrade' && p.target.obj) {
      for (const f of VOICE_FIELDS) {
        const mine = p.target.obj[f];
        if (typeof mine !== 'string' || !mine.trim()) continue;
        if (!fieldBlock(text, f)) continue;
        text = replaceField(text, f, renderStringField(f, mine));
        kept.push(f);
      }
    }

    // Re-parse after every edit. A record that no longer parses must never
    // reach herbs.ts, and the text is dumped so the edit can be seen.
    let reparsed;
    try {
      reparsed = new Function('return (' + text.replace(/,\s*$/, '') + ')')();
    } catch (err) {
      const dump = path.join(require('os').tmpdir(), 'import-fail-' + p.file.replace(/\W+/g, '_') + '.txt');
      fs.writeFileSync(dump, text);
      console.error('\n  ' + p.file + ' no longer parses after normalisation:');
      console.error('  ' + err.message);
      console.error('  text written to ' + dump);
      process.exit(1);
    }
    const bad = violations(reparsed);
    const notes = [];
    if (n.applied.length) notes.push(n.applied.length + ' normalised');
    if (kept.length) notes.push('kept ' + kept.join('+'));
    if (bad.length) notes.push('STILL INVALID: ' + bad.join('; '));

    if (p.action === 'upgrade') { nUp++; console.log('upgrade   ' + p.file.padEnd(28) + '→ ' + String(targetId).padEnd(6) + notes.join(' · ')); }
    else { nAdd++; console.log('ADD       ' + p.file.padEnd(28) + '→ ' + String(targetId).padEnd(6) + notes.join(' · ')); }

    if (bad.length) { console.error('\n  refusing: ' + p.file + ' still violates the Herb type.'); process.exit(1); }
    edits.push({ p, targetId, text });
  }

  console.log('─'.repeat(78));
  console.log('upgrade ' + nUp + ' · add ' + nAdd + ' · held ' + nHeld + ' · skipped ' + nSkip);

  if (!apply) { console.log('\nDRY RUN. Re-run with --apply to write herbs.ts.'); return; }

  // ── Write ─────────────────────────────────────────────────────
  // Upgrades are spliced from the BOTTOM of the file upward so that
  // earlier offsets stay valid while later ones are rewritten.
  const upgrades = edits.filter(e => e.p.action === 'upgrade')
                        .sort((a, b) => b.p.target.from - a.p.target.from);
  for (const e of upgrades) {
    const indented = '  ' + e.text.trim().replace(/,$/, '');
    src = src.slice(0, e.p.target.from) + indented + src.slice(e.p.target.to);
  }

  const additions = edits.filter(e => e.p.action === 'add');
  if (additions.length) {
    const close = src.lastIndexOf('\n];');
    const block = additions.map(e => '  ' + e.text.trim().replace(/,$/, '') + ',').join('\n');
    const banner = '\n\n  // ─────────────────────────────────────────────\n' +
                   '  // Ayurvedic Pharmacopoeia of India batch — ids ' +
                   additions[0].targetId + '–' + additions[additions.length - 1].targetId + '\n' +
                   '  // ─────────────────────────────────────────────\n';
    src = src.slice(0, close) + banner + block + src.slice(close);
  }

  fs.writeFileSync(HERBS_TS, src);
  console.log('\nwrote src/data/herbs.ts  (' + nUp + ' upgraded, ' + nAdd + ' added)');
  console.log('Next: npm run build:herbs-data && npm run build (or the individual build:* steps)');
}

main();
