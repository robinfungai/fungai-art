// tests/fyf-compose-storage-verify.cjs
//
// /api/fyf/compose and the database, 2026-09-28:
//   · D8   — the daily MYCO budget (myco_budget_take) is taken before a
//            MYCO call and never for a rejected profile; past it, or when
//            it cannot be checked, the formula is composed without MYCO.
//   · P0 #11 — the same requestId with the same answers returns the
//            stored formula (no second row, no second MYCO call); changed
//            answers compose afresh; two at once still store one.
//   · Audit #2 (2026-09-29) — two copies at the SAME moment: only the one
//            that claims the key (fyf_claim_request) asks MYCO; the other
//            waits and returns that formula. A failure hands the key back.
//   · D6   — every stored row carries retention_tracked = true, and
//            reserve-formula marks reserved_at.
//   · If the SQL files have not been run, reveals still work.
//
// Runs the real handler against a stand-in for Supabase and a stand-in
// for Anthropic: no network, no cost.

const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('node:url');

const results = [];
const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });

// ── Stand-ins ────────────────────────────────────────────────────
function fakeSupabase({ rpcError = null, missingColumns = [], storedByOther = null, insertError = null } = {}) {
  const db = { rows: [], budgetCalls: 0, rpcCalls: 0, claims: new Set(), claimCalls: 0 };
  db.rpc = async (name, args) => {
    if (name === 'fyf_claim_request' || name === 'fyf_release_request') {
      db.claimCalls++;
      if (rpcError) return { data: null, error: { message: rpcError } };
      if (name === 'fyf_release_request') { db.claims.delete(args.p_key); return { data: null, error: null }; }
      if (db.claims.has(args.p_key)) return { data: false, error: null };
      db.claims.add(args.p_key);
      return { data: true, error: null };
    }
    db.rpcCalls++;
    if (rpcError) return { data: null, error: { message: rpcError } };
    if (db.budgetCalls >= args.p_limit) return { data: false, error: null };
    db.budgetCalls++;
    return { data: true, error: null };
  };
  db.from = () => ({
    select: () => ({ eq: (col, val) => ({ maybeSingle: async () => ({ data: db.rows.find(r => r[col] === val) || null, error: null }) }) }),
    insert: async row => {
      if (insertError) return { error: insertError };
      for (const c of missingColumns) if (c in row) return { error: { code: 'PGRST204', message: "Could not find the '" + c + "' column of 'fyf_formulas' in the schema cache" } };
      if (storedByOther && row.request_key) {
        // Another request with the same key stored first, a moment ago.
        db.rows.push(Object.assign({}, row, { id: storedByOther }));
        storedByOther = null;
        return { error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
      }
      if (row.request_key && db.rows.some(r => r.request_key === row.request_key)) return { error: { code: '23505', message: 'duplicate key' } };
      db.rows.push(row);
      return { error: null };
    },
  });
  return db;
}

let mycoCalls = 0;
// A moment's delay, like the real call, so two requests overlap.
global.fetch = async () => { mycoCalls++; await new Promise(r => setTimeout(r, 200)); return { ok: false, status: 503, json: async () => ({}) }; };
process.env.ANTHROPIC_API_KEY = 'test-stand-in';

const profile = extra => Object.assign({
  intention: 'stress', intentions: ['stress'], pattern: 'mixed', time: 'any', stress: 'push',
  duration: 'months', age: '25_40', sleep: 'restorative_6plus', avoid: ['none'], _ageConfirmed: true,
}, extra);
let ipN = 0;

(async () => {
  const mod = await import(pathToFileURL(path.join(__dirname, '../netlify/functions/fyf-compose.mjs')).href);
  const call = async (body) => {
    const res = await mod.default(new Request('http://localhost:8888/api/fyf/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.' + (++ipN) },
      body: JSON.stringify(body),
    }));
    return { status: res.status, body: await res.json() };
  };
  const log = console.log, warn = console.warn, err = console.error;
  console.log = console.warn = console.error = () => {};
  try {
    // 1 · same request twice → one formula, one MYCO call
    let db = fakeSupabase(); mod._setSupabaseForTests(db); mycoCalls = 0;
    process.env.FYF_MYCO_DAILY_LIMIT = '100';
    const a1 = await call({ profile: profile(), requestId: 'visit00000001' });
    const a2 = await call({ profile: profile(), requestId: 'visit00000001' });
    check('same requestId + answers → the same formula', a1.status === 200 && a2.status === 200 && a1.body.formulaId === a2.body.formulaId && a2.body.replayed === true, a1.body.formulaId + ' / ' + a2.body.formulaId);
    check('… stored once, MYCO asked once', db.rows.length === 1 && mycoCalls === 1, 'rows ' + db.rows.length + ', MYCO calls ' + mycoCalls);
    check('… row carries retention_tracked and a request_key', db.rows[0] && db.rows[0].retention_tracked === true && /^[0-9a-f]{64}$/.test(db.rows[0].request_key || ''), JSON.stringify({ t: db.rows[0] && db.rows[0].retention_tracked }));
    check('… the replay shows the same herbs', JSON.stringify(a1.body.formula.herbs) === JSON.stringify(a2.body.formula.herbs), '');

    // 2 · same requestId, changed answers → a new formula
    const a3 = await call({ profile: profile({ intention: 'sleep', intentions: ['sleep'] }), requestId: 'visit00000001' });
    check('same requestId, changed answers → a new formula', a3.status === 200 && a3.body.formulaId !== a1.body.formulaId && !a3.body.replayed && db.rows.length === 2, a3.body.formulaId);

    // 3 · no requestId / malformed → composes every time, no request_key
    const n1 = await call({ profile: profile() });
    const n2 = await call({ profile: profile(), requestId: 'x' });
    check('no or malformed requestId → composed every time, no request_key', n1.body.formulaId !== n2.body.formulaId && db.rows.slice(-2).every(r => !('request_key' in r)), db.rows.length + ' rows');

    // 4 · the daily budget
    db = fakeSupabase(); mod._setSupabaseForTests(db); mycoCalls = 0;
    process.env.FYF_MYCO_DAILY_LIMIT = '1';
    const b1 = await call({ profile: profile(), requestId: 'visit00000002' });
    const b2 = await call({ profile: profile({ intention: 'mood', intentions: ['mood'] }), requestId: 'visit00000002' });
    check('within the budget → MYCO is asked', mycoCalls === 1 && b1.body.mycoFallbackReason === 'MYCO_UNAVAILABLE', 'calls ' + mycoCalls + ', ' + b1.body.mycoFallbackReason);
    check('budget used up → no MYCO call, a full formula anyway', b2.status === 200 && mycoCalls === 1 && b2.body.mycoFallbackReason === 'MYCO_DAILY_BUDGET_REACHED' && b2.body.formula.herbs.length >= 3, b2.body.mycoFallbackReason);
    const rpcBefore = db.rpcCalls;
    const rej = await call({ profile: profile({ avoid: [] }), requestId: 'visit00000003' });
    check('a rejected profile takes nothing from the budget', rej.status === 400 && db.rpcCalls === rpcBefore, 'status ' + rej.status + ', rpc ' + (db.rpcCalls - rpcBefore));

    // 5 · budget cannot be checked → fail closed (no MYCO), formula still made
    db = fakeSupabase({ rpcError: 'function public.myco_budget_take(integer) does not exist' }); mod._setSupabaseForTests(db); mycoCalls = 0;
    process.env.FYF_MYCO_DAILY_LIMIT = '100';
    const c1 = await call({ profile: profile(), requestId: 'visit00000004' });
    check('budget check fails → no MYCO call, formula still made', c1.status === 200 && mycoCalls === 0 && c1.body.mycoFallbackReason === 'MYCO_BUDGET_UNAVAILABLE', c1.body.mycoFallbackReason);

    // 6 · SQL not run yet → stored without the new columns
    db = fakeSupabase({ missingColumns: ['retention_tracked', 'request_key'] }); mod._setSupabaseForTests(db);
    const d1 = await call({ profile: profile(), requestId: 'visit00000005' });
    check('new columns missing → the reveal still works and is stored', d1.status === 200 && d1.body.persisted === true && db.rows.length === 1 && !('retention_tracked' in db.rows[0]), 'status ' + d1.status);

    // 7 · two identical requests at once → one stored formula returned to both
    const other = 'fyf_' + 'a'.repeat(32);
    db = fakeSupabase({ storedByOther: other }); mod._setSupabaseForTests(db);
    const e1 = await call({ profile: profile(), requestId: 'visit00000006' });
    check('identical request stored first by another → its formula is returned', e1.status === 200 && e1.body.formulaId === other && e1.body.replayed === true && db.rows.length === 1, e1.body.formulaId);

    // 8 · shadow calls touch nothing
    db = fakeSupabase(); mod._setSupabaseForTests(db); mycoCalls = 0;
    const res = await mod.default(new Request('http://localhost:8888/api/fyf/compose', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-FYF-Mode': 'shadow', 'x-forwarded-for': '198.51.100.250' },
      body: JSON.stringify({ profile: profile(), requestId: 'visit00000007' }),
    }));
    check('shadow call → no storage, no budget, no MYCO', res.status === 200 && db.rows.length === 0 && db.rpcCalls === 0 && db.claimCalls === 0 && mycoCalls === 0, '');

    // 8b · Audit #2 — two identical requests at the SAME moment
    db = fakeSupabase(); mod._setSupabaseForTests(db); mycoCalls = 0;
    const [f1, f2] = await Promise.all([
      call({ profile: profile(), requestId: 'visit00000008' }),
      call({ profile: profile(), requestId: 'visit00000008' }),
    ]);
    check('two at once → MYCO asked once, one row, the same formula to both',
      f1.status === 200 && f2.status === 200 && mycoCalls === 1 && db.budgetCalls === 1 && db.rows.length === 1 &&
      f1.body.formulaId === f2.body.formulaId && [f1, f2].filter(x => x.body.replayed).length === 1,
      'MYCO ' + mycoCalls + ', budget ' + db.budgetCalls + ', rows ' + db.rows.length + ', ' + f1.status + '/' + f2.status);

    // 8c · a request that fails after claiming hands the key back
    db = fakeSupabase({ insertError: { code: '08006', message: 'connection lost' } }); mod._setSupabaseForTests(db);
    const g1 = await call({ profile: profile(), requestId: 'visit00000009' });
    check('failed after claiming → 500 and the key is free for a retry', g1.status === 500 && db.claims.size === 0, 'status ' + g1.status + ', claims ' + db.claims.size);
  } finally {
    console.log = log; console.warn = warn; console.error = err;
    mod._setSupabaseForTests(null);
  }

  // 9 · reserve-formula marks the reservation (D6)
  const SRC = fs.readFileSync(path.join(__dirname, '../netlify/functions/reserve-formula.mjs'), 'utf8');
  check('reserve-formula sets reserved_at once a reservation email lands',
    /if \(\(robinOk \|\| customerOk\) && sbClient\)[\s\S]{0,200}\.update\(\{ reserved_at:/.test(SRC), '');
  // 10 · the SQL files exist with what the code calls
  const sqlB = fs.readFileSync(path.join(__dirname, '../supabase-myco-budget.sql'), 'utf8');
  const sqlR = fs.readFileSync(path.join(__dirname, '../supabase-fyf-retention.sql'), 'utf8');
  const sqlC = fs.readFileSync(path.join(__dirname, '../supabase-fyf-claims.sql'), 'utf8');
  check('SQL: fyf_claim_request and fyf_release_request, service role only',
    /FUNCTION public\.fyf_claim_request\(p_key text, p_stale_seconds integer DEFAULT 120\)/.test(sqlC) &&
    /FUNCTION public\.fyf_release_request\(p_key text\)/.test(sqlC) &&
    /REVOKE ALL ON FUNCTION public\.fyf_claim_request\(text, integer\) FROM PUBLIC, anon, authenticated/.test(sqlC), '');
  check('SQL: myco_budget_take and request_key', /FUNCTION public\.myco_budget_take\(p_limit integer\)/.test(sqlB) && /ADD COLUMN IF NOT EXISTS request_key/.test(sqlB) && /UNIQUE INDEX IF NOT EXISTS fyf_formulas_request_key_uniq/.test(sqlB), '');
  check('SQL: reserved_at, retention_tracked, nightly purge of tracked unreserved rows only',
    /ADD COLUMN IF NOT EXISTS reserved_at/.test(sqlR) && /ADD COLUMN IF NOT EXISTS retention_tracked boolean NOT NULL DEFAULT false/.test(sqlR) &&
    /WHERE retention_tracked\s+AND reserved_at IS NULL/.test(sqlR) && /cron\.schedule\('fyf-purge-unreserved'/.test(sqlR), '');

  for (const r of results) console.log('  ' + (r.ok ? '✓' : '✗') + ' ' + r.name + (r.ok || !r.detail ? '' : '  — ' + r.detail));
  const failed = results.filter(r => !r.ok).length;
  console.log('\npassed: ' + (results.length - failed) + '\nfailed: ' + failed);
  process.exit(failed ? 1 : 0);
})();
