// scripts/check-claims.cjs
//
// Scans everything a customer can read for claims that would place a
// product in the MEDICINAL category under EU law — regardless of whether
// the word "medicine" appears.
//
//   node scripts/check-claims.cjs            → report
//   node scripts/check-claims.cjs --ci       → exit 1 if any BLOCKER is found
//   node scripts/check-claims.cjs --surface shop
//
// Why this exists: a product becomes a medicinal product "by
// presentation" (Directive 2001/83/EC Art. 1(2)(a)) if it is PRESENTED as
// treating or preventing disease. The presentation includes the label,
// the website, the advertising — and anything MYCO says. Saying "we never
// call it medicine" is not a defence; the claim itself is the trigger.
//
// Surfaces are scored differently on purpose:
//
//   commercial  — shop, product pages, home, the formula reveal. A
//                 medicinal claim here is a BLOCKER.
//   editorial   — academy, monographs, journal. Discussion of traditional
//                 and scientific literature is legitimate, but it must not
//                 become product claims by proximity, so disease-treatment
//                 phrasing is still flagged (WARN) and must read as
//                 reporting, not promising.
//   agent       — MYCO's prompts and knowledge base. Flagged like
//                 commercial: MYCO speaks in the brand's voice.

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const CI   = args.includes('--ci');
const only = (args.includes('--surface') ? args[args.indexOf('--surface') + 1] : '') || '';

// Rules live in src/server/myco/claim-rules.cjs so the scanner and the
// live MYCO guard can never drift apart.
const { DISEASES, RULES: SHARED_RULES, SAFETY_CONTEXT } = require(path.join(ROOT, 'src', 'server', 'myco', 'claim-rules.cjs'));

// ── Claim rules (shared with the live MYCO guard) ───────────────
// Each shared rule carries re() as a factory so every consumer gets a
// fresh regex with its own lastIndex.
const RULES = SHARED_RULES.map(r => ({ id: r.id, level: r.level, why: r.why, re: r.re() }));

// A disease term in the NAME of a product is the strongest presentation
// signal there is — stronger than any sentence in the body copy. A
// product called "<disease> Support" is offered for that disease, and
// "support" does not undo it.
const NAME_RE = new RegExp(`\\b(${DISEASES})\\b`, 'i');
function productNameFindings(file, raw) {
  const out = [];
  const seen = new Set();
  const push = (what, where) => {
    const m = what.match(NAME_RE);
    if (!m || seen.has(what)) return;
    seen.add(what);
    out.push({ match: what.trim(), disease: m[1], where });
  };
  for (const m of raw.matchAll(/<title[^>]*>([^<]{3,120})<\/title>/gi)) push(m[1], 'page title');
  for (const m of raw.matchAll(/<h1[^>]*>([\s\S]{3,120}?)<\/h1>/gi)) push(m[1].replace(/<[^>]+>/g, ' '), 'h1');
  // Product cards / cart entries: addToCart('adhd-support', 'ADHD Support', …)
  for (const m of raw.matchAll(/addToCart\(\s*'([^']+)'\s*,\s*'([^']+)'/g)) push(m[2], 'product name');
  for (const m of raw.matchAll(/class="product-name"[^>]*>([^<]{3,80})</gi)) push(m[1], 'product name');
  return out;
}

// Disease terms inside a safety warning are not claims — they are the
// opposite, and leaving them out would be the real problem. Recognise
// the sentence around the match before flagging it.
// SAFETY_CONTEXT comes from claim-rules.cjs (imported above).

// A forbidden phrase quoted in order to FORBID it is not a claim. The
// MYCO prompt and the policy docs necessarily contain the exact wording
// they ban ("never say 'cures anxiety'"), and flagging those would make
// the scan unusable. Judged on the text immediately around the match.
const NEGATION_CONTEXT = /\b(never|do not say|don'?t say|do not claim|don'?t claim|avoid saying|must not|cannot say|is still a (treatment|medicinal) claim|forbidden|prohibited|not a compliance|instead of)\b/i;

// ── Surfaces ─────────────────────────────────────────────────────
const SURFACES = [
  { name: 'commercial', weight: 'strict', paths: [
      'public/shop', 'public/home/index.html', 'public/find-your-formula/index.html',
      'public/find-your-formula-pro/index.html', 'public/mixology/index.html',
      'public/dinner-experience/index.html', 'public/patron/index.html',
      'public/explorer',
    ] },
  { name: 'editorial',  weight: 'report', paths: [
      'public/community/academy', 'public/health', 'public/extraction',
    ] },
  { name: 'agent',      weight: 'strict', paths: [
      'netlify/functions/myco-agent.mjs', 'netlify/functions/myco-forage.js',
      'public/community/myco', 'src/server/myco', 'src/server/formula-engine/myco.js',
    ] },
];

// Strip markup and scripts so we only read what a visitor reads.
function visibleText(file) {
  let s = fs.readFileSync(file, 'utf8');
  if (/\.(html?)$/i.test(file)) {
    s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
         .replace(/<style[\s\S]*?<\/style>/gi, ' ')
         .replace(/<!--[\s\S]*?-->/g, ' ')
         .replace(/<[^>]+>/g, ' ');
  }
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&rsquo;|&#39;/g, "'");
}

// The files that DEFINE the forbidden phrasings necessarily contain
// them. Scanning them reports the rulebook as a violation of itself.
const ENFORCEMENT_FILES = /claim-rules\.cjs|claims-guard\.cjs|check-claims\.cjs|narrative-sanitiser\.js/;

function walk(p, out = []) {
  const full = path.join(ROOT, p);
  if (!fs.existsSync(full)) return out;
  const st = fs.statSync(full);
  if (st.isFile()) { out.push(p); return out; }
  for (const entry of fs.readdirSync(full)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const rel = path.join(p, entry);
    const f = path.join(ROOT, rel);
    if (fs.statSync(f).isDirectory()) walk(rel, out);
    else if (/\.(html?|jsx?|mjs|cjs|md)$/i.test(entry) && !/kb\.generated/.test(entry) && !ENFORCEMENT_FILES.test(entry)) out.push(rel);
  }
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const findings = [];
for (const surface of SURFACES) {
  if (only && surface.name !== only) continue;
  for (const p of surface.paths) {
    for (const file of walk(p)) {
      const abs = path.join(ROOT, file);
      const text = visibleText(abs);

      // Product/page naming — commercial surfaces only.
      if (surface.weight === 'strict' && /\.html?$/i.test(file)) {
        for (const hit of productNameFindings(file, fs.readFileSync(abs, 'utf8'))) {
          findings.push({
            surface: surface.name, file, line: lineOf(fs.readFileSync(abs, 'utf8'), fs.readFileSync(abs, 'utf8').indexOf(hit.match)),
            rule: 'disease_in_name', level: 'BLOCKER', match: hit.match, ctx: hit.where + ': "' + hit.match + '"',
            why: 'A product named after a condition ("' + hit.disease + '") is presented as being for that condition. This is the single strongest medicinal-presentation signal, and "support" does not neutralise it.',
          });
        }
      }

      for (const rule of RULES) {
        // NOTE-level disease mentions are expected in editorial writing.
        if (rule.level === 'NOTE' && surface.weight === 'report') continue;
        rule.re.lastIndex = 0;
        let m;
        while ((m = rule.re.exec(text)) !== null) {
          const line = lineOf(text, m.index);
          const ctx = text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60).replace(/\s+/g, ' ').trim();
          // Safety copy naming a condition is not a claim — skip it.
          const sentence = text.slice(Math.max(0, m.index - 220), m.index + m[0].length + 220);
          if (rule.level === 'NOTE' && SAFETY_CONTEXT.test(sentence)) continue;
          // Quoted in order to prohibit it → not a claim.
          // Window is generous on the left: prohibitions are usually a
          // heading ("Never say…") followed by a bulleted list, so the
          // negation can sit several lines above the phrase it bans.
          if (NEGATION_CONTEXT.test(text.slice(Math.max(0, m.index - 420), m.index + m[0].length + 80))) continue;
          const level = (rule.level === 'BLOCKER' && surface.weight === 'report') ? 'WARN' : rule.level;
          findings.push({ surface: surface.name, file, line, rule: rule.id, level, match: m[0].trim(), ctx, why: rule.why });
          if (rule.re.lastIndex === m.index) rule.re.lastIndex++;
        }
      }
    }
  }
}

// NOTE-level noise control: report each file's disease mentions once.
const seenNote = new Set();
const report = findings.filter(f => {
  if (f.level !== 'NOTE') return true;
  const key = f.file + '|' + f.match.toLowerCase();
  if (seenNote.has(key)) return false;
  seenNote.add(key);
  return true;
});

const order = { BLOCKER: 0, WARN: 1, NOTE: 2 };
report.sort((a, b) => order[a.level] - order[b.level] || a.file.localeCompare(b.file) || a.line - b.line);

const counts = { BLOCKER: 0, WARN: 0, NOTE: 0 };
for (const f of report) counts[f.level]++;

console.log('\nCLAIMS SCAN — what a regulator would read\n' + '─'.repeat(64));
let lastLevel = '';
for (const f of report) {
  if (f.level !== lastLevel) { console.log('\n' + f.level + '\n'); lastLevel = f.level; }
  console.log('  ' + f.file + ':' + f.line + '  [' + f.surface + '/' + f.rule + ']');
  console.log('    "' + f.ctx.slice(0, 150) + '"');
  if (f.level !== 'NOTE') console.log('    → ' + f.why);
}
console.log('\n' + '─'.repeat(64));
console.log('BLOCKER: ' + counts.BLOCKER + '   WARN: ' + counts.WARN + '   NOTE: ' + counts.NOTE);
console.log('Policy: docs/claims-policy.md\n');

if (CI && counts.BLOCKER > 0) process.exit(1);
