// tests/myco-kb-verify.cjs
//
// MYCO knowledge layer — offline verification. No API calls, no cost.
//
//   1. RETRIEVAL EVAL — every question in tests/myco-kb/eval-set.json
//      must surface the knowledge it names, in the top 6.
//   2. CITATION INTEGRITY — invented references are stripped, real ones
//      survive, confidence reflects the retrieval.
//   3. ENDPOINT WIRING — /api/myco-agent actually attaches the knowledge
//      block, and never returns an unverified citation to the caller.
//
//   node tests/myco-kb-verify.cjs

const fs   = require('fs');
const path = require('path');

const { search, kbStats } = require('../src/server/myco/retrieve.cjs');
const { groundQuestion, verifyAnswer } = require('../src/server/myco/grounding.cjs');

const EVAL = JSON.parse(fs.readFileSync(path.join(__dirname, 'myco-kb', 'eval-set.json'), 'utf8'));

let passed = 0, failed = 0;
const fail = (name, detail) => { failed++; console.log('  ✗ ' + name + (detail ? '  — ' + detail : '')); };
const pass = (name, detail) => { passed++; console.log('  ✓ ' + name + (detail ? '  — ' + detail : '')); };

// ── 1 · Retrieval eval ───────────────────────────────────────────
console.log('\n── RETRIEVAL EVAL (' + EVAL.cases.length + ' questions) ──');
const K = 6;
for (const c of EVAL.cases) {
  const hits = search(c.q, { k: K });
  // Known coverage gaps: assert the subject really is absent, so MYCO
  // answering "I don't have that" is correct rather than a failure. The
  // day the knowledge arrives, this case flips and asks to be updated.
  if (c.expectGap) {
    const KBALL = require('../src/server/myco/kb.generated.cjs');
    const covered = KBALL.chunks.filter(x => new RegExp(c.expectGap, 'i').test((x.herb || '') + ' ' + x.title)).length;
    if (covered === 0) pass(('gap · ' + c.q).slice(0, 54).padEnd(56), c.expectGap + ' genuinely absent → MYCO must say so');
    else fail(('gap · ' + c.q).slice(0, 54).padEnd(56), c.expectGap + ' now has ' + covered + ' chunks — update the eval case');
    continue;
  }
  const herbOk = !c.herb || hits.some(h => {
    const hay = ((h.chunk.herb || '') + ' ' + h.chunk.title).toLowerCase();
    return hay.includes(c.herb.toLowerCase());
  });
  const typeOk = !c.type || hits.some(h => h.chunk.type === c.type);
  const label = c.q.slice(0, 54).padEnd(56);
  if (herbOk && typeOk) {
    pass(label, hits.length ? hits[0].chunk.title.slice(0, 40) : 'no hits');
  } else {
    fail(label, (herbOk ? '' : 'missing herb ' + c.herb + ' ') + (typeOk ? '' : 'missing type ' + c.type) +
      ' · got: ' + hits.slice(0, 3).map(h => h.chunk.type + '/' + (h.chunk.herb || h.chunk.title).slice(0, 22)).join(', '));
  }
}

// ── 2 · Citation integrity ───────────────────────────────────────
console.log('\n── CITATION INTEGRITY ──');
{
  const g = groundQuestion('is reishi safe with warfarin', { k: 6 });
  if (g.sources.length) pass('grounding returns numbered sources', g.sources.length + ' extracts');
  else fail('grounding returns numbered sources');

  if (/\[K1\]/.test(g.block) && /kind: /.test(g.block) && /source: /.test(g.block)) {
    pass('knowledge block carries refs, kind labels and provenance');
  } else fail('knowledge block carries refs, kind labels and provenance');

  const v = verifyAnswer('Reishi interacts with anticoagulants [K1]. It also cures cancer [K9]. Third point [K2].', g.sources);
  if (!/K9/.test(v.text)) pass('invented citation [K9] stripped from the answer');
  else fail('invented citation [K9] stripped from the answer', v.text);
  if (/\[K1\]/.test(v.text)) pass('valid citation [K1] preserved');
  else fail('valid citation [K1] preserved', v.text);
  if (v.invalidRefs.includes('K9')) pass('invalid ref reported for logging', v.invalidRefs.join(','));
  else fail('invalid ref reported for logging');
  if (v.citations.length === 2 && v.citations.every(s => s.label && s.source)) {
    pass('citations resolve to labelled sources', v.citations.map(s => s.ref + '=' + s.label).join(' · '));
  } else fail('citations resolve to labelled sources', JSON.stringify(v.citations.map(s => s.ref)));

  const strong = verifyAnswer('Answer [K1] and more [K2].', g.sources);
  if (strong.confidence.level === 'high') pass('confidence high when strongly matched + cited', strong.confidence.reason);
  else fail('confidence high when strongly matched + cited', strong.confidence.level);

  const uncited = verifyAnswer('A confident answer with no sources at all.', g.sources);
  if (uncited.confidence.level === 'low') pass('confidence low when nothing is cited');
  else fail('confidence low when nothing is cited', uncited.confidence.level);

  const admitted = verifyAnswer("I don't have that in my knowledge base — I'd need a monograph for it.", g.sources);
  if (admitted.confidence.level === 'none') pass('confidence none when MYCO admits a gap');
  else fail('confidence none when MYCO admits a gap', admitted.confidence.level);

  const empty = groundQuestion('zzzz qqqq xxxx', { k: 6 });
  if (empty.sources.length === 0 && empty.block === '') pass('nonsense question retrieves nothing rather than noise');
  else fail('nonsense question retrieves nothing rather than noise', String(empty.sources.length));
}

// ── 3 · Endpoint wiring ──────────────────────────────────────────
console.log('\n── ENDPOINT WIRING (/api/myco-agent) ──');
(async () => {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key-not-used';
  const mod = await import('../netlify/functions/myco-agent.mjs');
  const realFetch = global.fetch;
  let captured = null;

  global.fetch = async (url, init) => {
    captured = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        content: [{ type: 'text', text: 'Reishi is traditionally used for the heart [K1]. It is also proven to cure disease [K8].' }],
      }),
    };
  };

  const res = await mod.handler({
    httpMethod: 'POST',
    headers: { origin: 'http://localhost:5173' },
    body: JSON.stringify({ message: 'what is reishi traditionally used for?' }),
  });
  global.fetch = realFetch;

  const body = JSON.parse(res.body);
  const systemText = (captured?.system || []).map(s => s.text).join('\n');

  if (res.statusCode === 200) pass('endpoint returns 200');
  else fail('endpoint returns 200', String(res.statusCode) + ' ' + res.body.slice(0, 120));

  if (/KNOWLEDGE BASE EXTRACTS/.test(systemText)) pass('knowledge block sent to the model');
  else fail('knowledge block sent to the model');

  if (/ANSWERING FROM THE KNOWLEDGE BASE/.test(systemText)) pass('grounding rules sent to the model');
  else fail('grounding rules sent to the model');

  if (/reishi/i.test(systemText)) pass('retrieved knowledge is about the question asked');
  else fail('retrieved knowledge is about the question asked');

  if (!/K8/.test(body.reply)) pass('unverified citation never reaches the caller');
  else fail('unverified citation never reaches the caller', body.reply);

  if (Array.isArray(body.sources) && body.sources.length >= 1 && body.sources[0].label) {
    pass('response carries labelled sources', body.sources.map(s => s.ref).join(','));
  } else fail('response carries labelled sources', JSON.stringify(body.sources));

  if (body.confidence && body.confidence.level) pass('response carries a confidence level', body.confidence.level);
  else fail('response carries a confidence level');

  if (body.kbVersion) pass('response carries the knowledge-base version', body.kbVersion);
  else fail('response carries the knowledge-base version');

  // Safety rails must still win over the knowledge base.
  const refused = await mod.handler({
    httpMethod: 'POST',
    headers: { origin: 'http://localhost:5173' },
    body: JSON.stringify({ message: 'diagnose my liver problem and prescribe a dose' }),
  });
  const refusedBody = JSON.parse(refused.body);
  if (/can't give medical or diagnostic advice/i.test(refusedBody.reply || '')) {
    pass('medical questions still refused before any retrieval');
  } else fail('medical questions still refused before any retrieval', JSON.stringify(refusedBody).slice(0, 120));

  const stats = kbStats();
  console.log('\n── KNOWLEDGE BASE ──');
  console.log('  version: ' + stats.version + '  ·  chunks: ' + stats.chunks + '  ·  terms: ' + stats.terms);
  console.log('  ' + Object.entries(stats.byType).map(([t, n]) => t + '=' + n).join('  '));

  console.log('\n  passed: ' + passed);
  console.log('  failed: ' + failed + '\n');
  process.exit(failed ? 1 : 0);
})();
