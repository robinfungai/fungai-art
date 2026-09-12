// tests/narrative-sanitiser-verify.cjs
//
// Round 2 · Item #7. MYCO's customer-facing narrative must never
// reach the browser with diagnosis / treatment / cure / guarantee /
// drug-like / stop-your-meds language.
//
// Tests two contracts:
//   HIGH-severity hits  → full replacement with safe template
//                         (narrative + action:'replaced')
//   LOW-severity hits   → soft-rewrite (narrative + action:'rewritten')
//   No hits             → passed through unchanged (action:'passed')
//
//   node tests/narrative-sanitiser-verify.cjs

const { sanitiseNarrative } = require('../src/server/formula-engine/narrative-sanitiser');

const profile = { intention: 'stress', pattern: 'mixed' };

const cases = [];
const check = (name, run) => cases.push({ name, run });

// ── Adversarial HIGH-severity strings (from the brief's list) ─────
const HIGH_STRINGS = [
  // diagnosis
  'Based on your answers, you have adrenal fatigue and hormonal imbalance.',
  'You clearly have ADHD, so this blend focuses on dopamine regulation.',
  'You suffer from insomnia — this formula is designed to fix that.',
  // treatment / cure / disease claim
  'This formula treats your anxiety by modulating GABA pathways.',
  'This blend cures insomnia within three weeks of nightly use.',
  'This will repair your nervous system and reverse your chronic pain.',
  // guarantee
  'This will definitely restore your sleep — 100% effective for stress.',
  'This blend guarantees you a settled nervous system.',
  // drug-like framing
  'Ashwagandha acts like an SSRI on your serotonin receptors.',
  'This is equivalent to Xanax without the side effects.',
  // stop-your-meds
  'You can safely stop taking your SSRI once this blend takes effect.',
  'Discontinue your antidepressant and use this formula instead.',
  // certainty with quantification
  'This blend lowers your cortisol by 40% within two weeks.',
];

for (const [i, s] of HIGH_STRINGS.entries()) {
  check('HIGH #' + (i + 1) + ' — ' + s.slice(0, 60) + '…', () => {
    const r = sanitiseNarrative(s, profile);
    return {
      pass: r.action === 'replaced' && r.hits.length > 0 && !new RegExp(s.slice(0, 20)).test(r.text),
      detail: 'action=' + r.action + ' hits=' + r.hits.length,
    };
  });
}

// ── Safe / passing strings (must NOT be flagged) ──────────────────
const SAFE_STRINGS = [
  'This blend leans on adaptogens and nervines to gently support your rhythm.',
  'Reishi anchors the composition; rose petals hold the heart-space.',
  'A slow-build, evening-weighted formula for your mixed pattern.',
  'Traditional herbal support for daily rhythm, not a treatment or diagnosis.',
  'Ashwagandha and reishi form the backbone — a classic pairing in TCM.',
];

for (const [i, s] of SAFE_STRINGS.entries()) {
  check('SAFE #' + (i + 1) + ' — passes unchanged', () => {
    const r = sanitiseNarrative(s, profile);
    return { pass: r.action === 'passed' && r.text === s, detail: 'action=' + r.action };
  });
}

// ── LOW-severity rewrites (softer phrases scrubbed in place) ──────
// Note: "repair your nervous system" matches the HIGH CURE regex, so
// it gets full replacement — good, that's the more protective outcome.
// The LOW branch below covers phrases the HIGH regex doesn't catch.

check('LOW — "completely restores" → "gently supports"', () => {
  const r = sanitiseNarrative('This blend completely restores your natural rhythm.', profile);
  return {
    pass: r.action === 'rewritten' && /gently supports/.test(r.text) && !/completely restores/.test(r.text),
    detail: r.text.slice(0, 80),
  };
});

check('LOW — "prescription" → "chosen"', () => {
  const r = sanitiseNarrative('The prescription blend was tuned for stress.', profile);
  return {
    pass: r.action === 'rewritten' && !/prescription/i.test(r.text) && /chosen/i.test(r.text),
    detail: r.text.slice(0, 80),
  };
});

// ── Empty / null / non-string ─────────────────────────────────────
check('empty string → passed, empty text', () => {
  const r = sanitiseNarrative('', profile);
  return { pass: r.action === 'passed' && r.text === '', detail: '' };
});
check('null → passed, empty text', () => {
  const r = sanitiseNarrative(null, profile);
  return { pass: r.action === 'passed' && r.text === '', detail: '' };
});
check('undefined → passed, empty text', () => {
  const r = sanitiseNarrative(undefined, profile);
  return { pass: r.action === 'passed' && r.text === '', detail: '' };
});
check('non-string (number) → coerced', () => {
  const r = sanitiseNarrative(42, profile);
  return { pass: r.action === 'passed' && r.text === '42', detail: '' };
});

// ── Fallback narrative shape ──────────────────────────────────────
check('HIGH triggers → fallback contains "traditional herbal support"', () => {
  const r = sanitiseNarrative('This cures your PTSD in six weeks.', profile);
  return {
    pass: r.action === 'replaced' && /traditional herbal support/i.test(r.text),
    detail: r.text.slice(0, 100),
  };
});

check('HIGH triggers → fallback strips the ORIGINAL user claim (PTSD/cures)', () => {
  const r = sanitiseNarrative('This cures your PTSD in six weeks.', profile);
  // Fallback intentionally includes the WORDS "diagnosis" and
  // "practitioner" in a safety disclaimer — those are protective
  // context, not a claim. The assertion is that the ORIGINAL user
  // claim (PTSD / "cures your") is gone.
  const cleanOfClaim = !/PTSD/i.test(r.text) && !/cures your/i.test(r.text);
  return { pass: cleanOfClaim, detail: 'original claim removed' };
});

check('HIGH triggers → fallback still personalises to profile', () => {
  const r = sanitiseNarrative('You have depression — this treats it.', { intention: 'sleep', pattern: 'depleted' });
  return {
    pass: r.action === 'replaced' && /restorative sleep/.test(r.text) && /depleted/.test(r.text),
    detail: r.text.slice(0, 200),
  };
});

// ── Composed input: HIGH + LOW → still HIGH replaces everything ──
check('HIGH takes precedence — mixed HIGH+LOW hits → full replacement', () => {
  const s = 'This treats anxiety and completely restores your gut.';
  const r = sanitiseNarrative(s, profile);
  return {
    pass: r.action === 'replaced' && !/treats/i.test(r.text) && !/completely restores/i.test(r.text),
    detail: r.text.slice(0, 100),
  };
});

// ── Hit-payload doesn't leak the raw claim back to caller ─────────
check('hits[] carries category + severity, no unsanitised text at top level', () => {
  const r = sanitiseNarrative('This blend treats anxiety.', profile);
  const okShape = Array.isArray(r.hits) && r.hits.every(h => h.severity && h.category);
  const cleanTop = !/treats anxiety/i.test(r.text);
  return { pass: okShape && cleanTop, detail: 'hits=' + r.hits.length };
});

// ── Runner ────────────────────────────────────────────────────────
(async () => {
  let passed = 0, failed = 0;
  for (const c of cases) {
    let out;
    try { out = await c.run(); }
    catch (e) { out = { pass: false, detail: 'THREW: ' + e.message }; }
    console.log(`  ${out.pass ? '✓' : '✗'} ${c.name}${out.detail ? '  — ' + out.detail : ''}`);
    if (out.pass) passed++; else failed++;
  }
  console.log('');
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
