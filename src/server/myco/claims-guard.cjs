// src/server/myco/claims-guard.cjs
//
// Last gate before a MYCO reply reaches a person.
//
// MYCO already refuses medical questions up front, and the knowledge base
// it answers from is written carefully. Neither guarantees the sentence
// that comes back: a model asked "what's good for sleep?" can still
// produce "valerian treats insomnia" from its own weights. On a page we
// would catch that in review; in a chat there is no review, so the check
// runs here.
//
// Behaviour:
//   · a sentence carrying a BLOCKER claim is REMOVED, not rewritten —
//     rewriting a medicinal claim tends to preserve its meaning;
//   · WARN phrasings are rewritten in place (they are wording problems,
//     not substance problems);
//   · if that leaves too little of the answer standing, the whole reply
//     is replaced with a safe one, because a gutted answer reads as
//     evasive and confusing.
//
// Anything removed is reported so it can be logged and reviewed — a
// pattern of removals is a signal the prompt or the knowledge base needs
// fixing, not just this one reply.

const { rulesOf, SAFETY_CONTEXT } = require('./claim-rules.cjs');

const SAFE_REPLY =
  "I can't put that as a health claim — our extracts are traditional herbal " +
  "preparations, not treatments for medical conditions. I can tell you what " +
  "the plants are, how they're traditionally used, how we extract them, and " +
  "what the research literature says. For anything to do with a condition or " +
  "medication, please talk to a herbalist or doctor you trust.";

const WARN_REWRITES = [
  { re: /\b(detoxifies?|detoxify|cleanses?|flushes?|purges?)\s+(?:your\s+|the\s+)?(liver|kidneys?|blood|body|colon|lymph)\b/gi,
    to: 'is traditionally used to support $2 function' },
  { re: /\b(boosts?|strengthens?|enhances?|supercharges?)\s+(?:your\s+|the\s+)?(immune system|immunity)\b/gi,
    to: 'is traditionally taken through the colder months' },
  { re: /\b(boosts?|strengthens?|enhances?)\s+(?:your\s+|the\s+)?metabolism\b/gi,
    to: 'is traditionally taken with food' },
  { re: /\b(clinically|scientifically|medically)\s+(proven|validated|guaranteed)\b/gi,
    to: 'studied' },
  { re: /\b(guaranteed results|100% effective)\b/gi, to: 'varies from person to person' },
  { re: /\bwill definitely\b/gi, to: 'may' },
];

// Split on sentence ends, keeping the terminator AND the whitespace after
// it. Replies are written in sections — "## Heading", "- " bullets — and
// the line breaks are the structure. This used to split on \s+ and rejoin
// with ' ', which flattened every reply onto one line: the client then
// read the whole answer as a single "## …" heading and set it in
// uppercase mono (Robin, 2026-09-27).
function sentences(text) {
  const parts = String(text || '').split(/(?<=[.!?])(\s+)/);
  const out = [];
  for (let i = 0; i < parts.length; i += 2) out.push({ s: parts[i], sep: parts[i + 1] || '' });
  return out;
}

/**
 * @param {string} reply raw model output
 * @returns {{ text, removed: Array<{sentence, rule}>, rewritten: number, replaced: boolean }}
 */
function guardReply(reply) {
  const original = String(reply || '');
  if (!original.trim()) return { text: original, removed: [], rewritten: 0, replaced: false };

  // 1 · WARN phrasings — rewrite in place.
  let rewritten = 0;
  let working = original;
  for (const r of WARN_REWRITES) {
    working = working.replace(r.re, (...args) => { rewritten++; return r.to.replace(/\$(\d)/g, (_, n) => args[Number(n)] || ''); });
  }

  // 2 · BLOCKER claims — drop the sentence.
  const blockers = rulesOf('BLOCKER').map(r => ({ id: r.id, re: r.re() }));
  const removed = [];
  const kept = [];
  for (const part of sentences(working)) {
    const s = part.s;
    let blocked = null;
    // A safety warning that names a condition is not a claim.
    if (!SAFETY_CONTEXT.test(s)) {
      for (const b of blockers) {
        b.re.lastIndex = 0;
        if (b.re.test(s)) { blocked = b; break; }
      }
    }
    if (!blocked) { kept.push({ ...part }); continue; }
    removed.push({ sentence: s.trim().slice(0, 160), rule: blocked.id });
    // A dropped sentence that ended a line or a section hands its break
    // to the sentence before it, so the next heading keeps its own line.
    const prev = kept[kept.length - 1];
    const breaks = s => (s.match(/\n/g) || []).length;
    if (prev && breaks(part.sep) > breaks(prev.sep)) prev.sep = part.sep;
  }

  const text = kept.map(k => k.s + k.sep).join('')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 3 · Too little left standing → replace wholesale.
  const shrunk = text.length < Math.min(60, original.length * 0.4);
  if (removed.length && shrunk) {
    return { text: SAFE_REPLY, removed, rewritten, replaced: true };
  }
  return { text, removed, rewritten, replaced: false };
}

module.exports = { guardReply, SAFE_REPLY, WARN_REWRITES };
