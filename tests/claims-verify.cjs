// tests/claims-verify.cjs
//
// Proves the claims policy is enforced, not just written down.
//
//   1. GUARD — MYCO's live replies: medicinal claims are removed, safety
//      warnings survive, soft claims are rewritten.
//   2. ENDPOINT — a claim invented by the model never reaches the caller.
//   3. SCANNER — the site scan still detects a planted claim, so the
//      pre-publish check can't silently stop working.
//
//   node tests/claims-verify.cjs

const { execFileSync } = require('child_process');
const path = require('path');

const { guardReply, SAFE_REPLY } = require('../src/server/myco/claims-guard.cjs');
const { RULES, rulesOf } = require('../src/server/myco/claim-rules.cjs');

let passed = 0, failed = 0;
const ok   = (n, d) => { passed++; console.log('  ✓ ' + n + (d ? '  — ' + d : '')); };
const bad  = (n, d) => { failed++; console.log('  ✗ ' + n + (d ? '  — ' + d : '')); };

console.log('\n── CLAIMS GUARD (MYCO replies) ──');

// Medicinal claims must be removed sentence-by-sentence.
const CLAIMS = [
  ['Reishi treats anxiety and is widely used.',                    'cure'],
  ['This blend cures insomnia within two weeks.',                  'cure'],
  ['Chaga prevents cancer according to our experience.',           'prevent'],
  ['It kills viruses on contact.',                                 'kills'],
  ['This is a natural alternative to antidepressants.',            'replace_med'],
  ['Ashwagandha may help treat depression.',                       'may_treat'],
  ['You have adrenal fatigue, which is why you are tired.',        'diagnose'],
];
for (const [sentence, rule] of CLAIMS) {
  const r = guardReply('Here is some background on the plant. ' + sentence + ' It grows on birch trees in the north, and we extract it in two stages.');
  const gone = !r.text.includes(sentence.slice(0, 26));
  // Which rule catches it doesn't matter — overlapping rules are healthy
  // ("may help treat depression" trips both may_treat and cure). What
  // matters is that the sentence is gone and the removal was recorded.
  const flagged = r.removed.length > 0;
  if (gone && flagged) ok(rule.padEnd(12) + sentence.slice(0, 44), 'caught by ' + r.removed.map(x => x.rule).join('/'));
  else bad(rule.padEnd(12) + sentence.slice(0, 44), 'gone=' + gone + ' flagged=' + flagged + ' → ' + r.text.slice(0, 80));
}

// Safety information naming a condition must SURVIVE — removing it would
// be the genuinely dangerous failure.
const SAFETY = [
  'Avoid this if you take medication for hypertension.',
  'Do not use during pregnancy, and discuss with your doctor if you have thyroid disease.',
  'If insomnia persists beyond three weeks, please see a clinician.',
];
for (const s of SAFETY) {
  const r = guardReply('Reishi is a traditional tonic mushroom. ' + s);
  if (r.text.includes(s)) ok('safety kept: ' + s.slice(0, 48));
  else bad('safety kept: ' + s.slice(0, 48), 'got → ' + r.text);
}

// Soft claims get rewritten rather than deleted.
const SOFT = [
  ['Milk thistle detoxifies the liver.',        /detoxif/i],
  ['This boosts your immune system.',           /boosts?\s+(your\s+)?immun/i],
  ['It is clinically proven to work.',          /clinically\s+proven/i],
];
for (const [text, gone] of SOFT) {
  const r = guardReply('A note on the plant. ' + text + ' It has a long traditional record.');
  if (!gone.test(r.text) && r.rewritten > 0) ok('rewritten: ' + text);
  else bad('rewritten: ' + text, 'got → ' + r.text);
}

// A reply that is nothing but claims is replaced wholesale.
{
  const r = guardReply('This cures insomnia.');
  if (r.replaced && r.text === SAFE_REPLY) ok('all-claim reply replaced with the safe answer');
  else bad('all-claim reply replaced with the safe answer', 'replaced=' + r.replaced);
}

// A clean reply must pass through untouched.
{
  const clean = 'Chaga is traditionally taken as a dual extract. We run a hot-water stage for the beta-glucans and an alcohol stage for the triterpenes, then combine them.';
  const r = guardReply(clean);
  if (r.text === clean && !r.removed.length && !r.rewritten) ok('clean answer passes through unchanged');
  else bad('clean answer passes through unchanged', 'removed=' + r.removed.length + ' rewritten=' + r.rewritten);
}

console.log('\n── ENDPOINT (/api/myco-agent) ──');
(async () => {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key-not-used';
  const mod = await import('../netlify/functions/myco-agent.mjs');
  const realFetch = global.fetch;
  global.fetch = async () => ({
    ok: true, status: 200,
    json: async () => ({ content: [{ type: 'text', text: 'Valerian treats insomnia [K1]. It is a traditional evening herb used across Europe, and we extract it cold.' }] }),
  });
  const res = await mod.handler({
    httpMethod: 'POST',
    headers: { origin: 'http://localhost:5173' },
    body: JSON.stringify({ message: 'tell me about valerian' }),
  });
  global.fetch = realFetch;
  const body = JSON.parse(res.body);

  if (!/treats insomnia/i.test(body.reply)) ok('medicinal claim stripped before the reply is sent');
  else bad('medicinal claim stripped before the reply is sent', body.reply);
  if (/traditional evening herb/i.test(body.reply)) ok('the legitimate part of the answer survives');
  else bad('the legitimate part of the answer survives', body.reply);

  console.log('\n── SCANNER ──');
  // Every BLOCKER rule must actually match its own example — a rule that
  // silently stops matching is worse than no rule.
  const SAMPLES = {
    cure:        'our tincture treats anxiety',
    prevent:     'prevents cancer',
    kills:       'kills bacteria',
    replace_med: 'a natural alternative to antidepressants',
    may_treat:   'may help relieve depression',
    diagnose:    'you have insomnia',
  };
  for (const rule of rulesOf('BLOCKER')) {
    const sample = SAMPLES[rule.id];
    if (!sample) { bad('sample exists for rule ' + rule.id); continue; }
    if (rule.re().test(sample)) ok('rule matches its example: ' + rule.id);
    else bad('rule matches its example: ' + rule.id, sample);
  }

  // The scanner binary runs and reports the known ADHD naming blocker.
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'check-claims.cjs')], { encoding: 'utf8' });
    if (/disease_in_name/.test(out)) ok('site scan reports the product-name blocker');
    else bad('site scan reports the product-name blocker');
    if (/BLOCKER: \d/.test(out)) ok('site scan prints a summary');
    else bad('site scan prints a summary');
  } catch (e) {
    bad('site scan runs', String(e.message).slice(0, 120));
  }

  console.log('\n  rules loaded: ' + RULES.length);
  console.log('  passed: ' + passed);
  console.log('  failed: ' + failed + '\n');
  process.exit(failed ? 1 : 0);
})();
