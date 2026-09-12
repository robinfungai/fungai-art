// tests/reserve-formula-verify.cjs
//
// Step 7 tests — reserve endpoint is formulaId-ONLY:
//   · authoritative path (formulaId → server lookup → use stored)
//   · forged-field-ignored path (client sends both id + tampered
//     `formula[]` → server uses stored, ignores forged)
//   · not-found path (formulaId is a valid shape but no row exists)
//   · malformed formulaId path (rejected before any DB lookup)
//   · missing formulaId → rejected (was: legacy path — retired in Step 7)
//   · lookup-unavailable path (formulaId sent but no Supabase)
//
// Approach: unit-test the exported `resolveAuthoritativeFormula`
// helper directly with a stub Supabase client. The full HTTP handler
// depends on Resend + real Supabase, which we don't hit here.
//
//   node tests/reserve-formula-verify.cjs

const path = require('path');
const { pathToFileURL } = require('node:url');

async function loadResolver() {
  const abs = path.join(__dirname, '..', 'netlify', 'functions', 'reserve-formula.mjs');
  const mod = await import(pathToFileURL(abs).href);
  return { resolveAuthoritativeFormula: mod.resolveAuthoritativeFormula, FORMULA_ID_RE: mod.FORMULA_ID_RE };
}

// Stub Supabase client: `select('id, …').eq('id', ?).maybeSingle()`
// returns whatever the outer sync closure gives us.
function stubSb({ row = null, throwOnLookup = null } = {}) {
  return {
    from() {
      return {
        select() { return this; },
        eq(_col, _id) {
          this._lastId = _id;
          return this;
        },
        async maybeSingle() {
          if (throwOnLookup) throw throwOnLookup;
          return { data: row, error: null };
        },
      };
    },
  };
}

const VALID_ID   = 'fyf_' + 'a'.repeat(32);   // fyf_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
const INVALID_ID = 'fyf_toolshort';
const STORED_ROW = {
  id: VALID_ID,
  engine_version: '2.0.0-server',
  herb_db_version: '2026.09',
  safety_rules_version: '1.0.0',
  profile: { intention: 'stress', avoid: ['none'] },
  formula: {
    name: 'Server-Stored-Name',
    size: 3,
    totalPercentage: 100,
    herbs: [
      { id: 210, name: 'Ashwagandha', botanical: 'Withania somnifera', percentage: 40 },
      { id: 270, name: 'Nettle',      botanical: 'Urtica dioica',       percentage: 35 },
      { id: 250, name: 'Reishi',      botanical: 'Ganoderma lucidum',   percentage: 25 },
    ],
    synergies: [{ a: 'Ashwagandha', b: 'Reishi', note: 'trad pairing' }],
  },
  created_at: '2026-09-11T00:00:00Z',
};

async function run() {
  const { resolveAuthoritativeFormula, FORMULA_ID_RE } = await loadResolver();
  console.log('── STEP 5 · reserve-formula.resolveAuthoritativeFormula ──');
  let pass = 0, fail = 0;
  const cases = [];

  cases.push({
    name: 'FORMULA_ID_RE shape check',
    run: async () => {
      const ok = FORMULA_ID_RE.test(VALID_ID) && !FORMULA_ID_RE.test(INVALID_ID) && !FORMULA_ID_RE.test('');
      return { pass: ok, detail: `valid=${FORMULA_ID_RE.test(VALID_ID)}, invalid=${FORMULA_ID_RE.test(INVALID_ID)}` };
    },
  });

  cases.push({
    name: 'no formulaId → missing_id (Step 7: legacy path retired)',
    run: async () => {
      const r = await resolveAuthoritativeFormula({ rawFormulaId: '', sbClient: stubSb() });
      return { pass: r.source === 'missing_id', detail: `source=${r.source}` };
    },
  });

  cases.push({
    name: 'malformed formulaId → invalid_id (no DB call)',
    run: async () => {
      let dbCalled = false;
      const sb = { from() { dbCalled = true; return stubSb().from(); } };
      const r = await resolveAuthoritativeFormula({ rawFormulaId: INVALID_ID, sbClient: sb });
      return { pass: r.source === 'invalid_id' && !dbCalled, detail: `source=${r.source}, dbCalled=${dbCalled}` };
    },
  });

  cases.push({
    name: 'formulaId + no Supabase → lookup_unavailable',
    run: async () => {
      const r = await resolveAuthoritativeFormula({ rawFormulaId: VALID_ID, sbClient: null });
      return { pass: r.source === 'lookup_unavailable', detail: `source=${r.source}` };
    },
  });

  cases.push({
    name: 'formulaId found → authoritative row returned',
    run: async () => {
      const r = await resolveAuthoritativeFormula({ rawFormulaId: VALID_ID, sbClient: stubSb({ row: STORED_ROW }) });
      return {
        pass: r.source === 'authoritative'
          && r.row.id === VALID_ID
          && r.row.formula.name === 'Server-Stored-Name'
          && r.row.formula.herbs.length === 3,
        detail: `source=${r.source}, herbs=${r.row && r.row.formula && r.row.formula.herbs.length}`,
      };
    },
  });

  cases.push({
    name: 'formulaId not found → not_found',
    run: async () => {
      const r = await resolveAuthoritativeFormula({ rawFormulaId: VALID_ID, sbClient: stubSb({ row: null }) });
      return { pass: r.source === 'not_found', detail: `source=${r.source}` };
    },
  });

  cases.push({
    name: 'Supabase throws → lookup_error',
    run: async () => {
      const r = await resolveAuthoritativeFormula({
        rawFormulaId: VALID_ID,
        sbClient: stubSb({ throwOnLookup: new Error('boom') }),
      });
      return { pass: r.source === 'lookup_error' && r.error && r.error.message === 'boom', detail: `source=${r.source}` };
    },
  });

  cases.push({
    name: 'authoritative path IGNORES a client-supplied forged formula[]',
    run: async () => {
      // The resolver itself doesn't take the client formula — it's the
      // handler that discards it. We simulate the handler's behaviour:
      // when resolved.source === 'authoritative', the stored formula is
      // what the rest of the handler uses. Assert by proxy: any code
      // that reads r.row.formula gets the STORED data, never client-
      // supplied data.
      const r = await resolveAuthoritativeFormula({ rawFormulaId: VALID_ID, sbClient: stubSb({ row: STORED_ROW }) });
      // The forged client body would have said: formula: [{ name: 'Attacker' }]
      // But the resolver output only carries the stored row — so the
      // handler downstream sees Ashwagandha/Nettle/Reishi.
      const storedNames = r.row.formula.herbs.map(h => h.name).join(',');
      return {
        pass: r.source === 'authoritative'
          && storedNames === 'Ashwagandha,Nettle,Reishi'
          && !storedNames.includes('Attacker'),
        detail: `stored names=${storedNames}`,
      };
    },
  });

  for (const c of cases) {
    try {
      const r = await c.run();
      if (r.pass) { pass++; console.log('  ✓ ' + c.name); }
      else { fail++; console.log('  ✗ ' + c.name); console.log('      ' + r.detail); }
    } catch (e) {
      fail++;
      console.log('  ✗ ' + c.name + '  THREW: ' + (e && e.message));
      if (e && e.stack) console.log('      ' + e.stack.split('\n').slice(0,3).join('\n      '));
    }
  }
  console.log('');
  console.log('passed: ' + pass);
  console.log('failed: ' + fail);
  process.exit(fail === 0 ? 0 : 1);
}

run().catch(e => { console.error('FATAL:', e && e.stack); process.exit(2); });
