// tests/server-mode-verify.cjs
//
// Step 4 tests — 10 scenarios (A–J) proving that when the URL flag is
// active, the server response drives the reveal and the client engine
// (pickFormula) never renders an authoritative formula.
//
// Same regex-extract + vm sandbox pattern as client-shadow-verify.cjs.
// The extracted block covers: _fyfServerModeActive,
// _fyfRenderResultServerMode, _fyfPaintServerReveal, _fyfEnrichServerHerbs,
// _fyfRenderServerErrorState, in-flight guard, and the shadow helpers
// (_fyfShadowHash, _fyfShadowKey) it depends on.
//
// Each test stubs the DOM, the network (fetch), the URL flag, and any
// helpers the paint function calls (bottleCard, storyFor, safetyLine,
// countFilteredOut, isTrace, shortNote, checkFormulaPairs, buildWhyText,
// mycoStory, PAGES, pickName, pickFormula, go, renderResult). Each test
// asserts on what actually happened: which functions were called, what
// DOM ids were mutated, whether the CTA leads back to the safety page.

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const clientPath = path.join(__dirname, '..', 'public', 'find-your-formula', 'index.html');
const src        = fs.readFileSync(clientPath, 'utf8');

// Extract from `function _fyfShadowHash` (Step 3 dependency) through
// end of `_fyfPaintServerReveal` (Step 4 body). Everything in that
// window is self-contained and callable from our sandbox.
const blockStart = src.indexOf('function _fyfShadowHash');
const blockEnd   = src.indexOf('// ── Render the result screen');
const block      = src.slice(blockStart, blockEnd);
if (!block || block.length < 4000) {
  console.error('Could not extract Step 4 block — did the client shape change?');
  process.exit(2);
}

function stubEl() {
  const classNames = new Set();
  const el = {
    innerHTML: '',
    style: {},
    hidden: false,
    textContent: '',
    children: [],
    _listeners: [],
    // classList stub — Step 5.5e added `.classList.add('pct-locked')`
    // on the herbs container so tests that render the reveal need this.
    classList: {
      add:    (n) => classNames.add(n),
      remove: (n) => classNames.delete(n),
      contains: (n) => classNames.has(n),
      toggle: (n) => classNames.has(n) ? classNames.delete(n) : classNames.add(n),
    },
    getAttribute: (_) => null,
    appendChild(c) { this.children.push(c); return c; },
    insertAdjacentHTML(_, html) { this.innerHTML += html; },
    insertBefore(node) { this.children.unshift(node); return node; },
    querySelector() { return stubEl(); },
    querySelectorAll: () => [],
    addEventListener(ev, fn) { this._listeners.push({ ev, fn }); },
    click() { this._listeners.forEach(l => l.fn && l.fn()); },
  };
  return el;
}

function buildSandbox({ fetchImpl, urlHref, herbDb = [] } = {}) {
  const domRegistry = new Map(); // id → stub element
  const getById = (id) => {
    if (!domRegistry.has(id)) domRegistry.set(id, stubEl());
    return domRegistry.get(id);
  };
  const logs = [];
  const goCalls = [];
  const pickFormulaCalls = [];

  const sandbox = {
    console: { log: (...a) => logs.push({ level: 'log', text: a.join(' ') }),
               warn: (...a) => logs.push({ level: 'warn', text: a.join(' ') }) },
    document: {
      getElementById: (id) => getById(id),
      querySelector: () => stubEl(),
      createElement: () => stubEl(),
    },
    window: {},
    location: { href: urlHref || 'https://www.fungai.art/find-your-formula/' },
    URL: URL,
    sessionStorage: (() => { const s = new Map(); return {
      getItem: (k) => s.get(k) || null,
      setItem: (k, v) => s.set(k, String(v)),
    }; })(),
    fetch: fetchImpl || (async () => new Response('{}', { status: 200 })),
    AbortController: class {
      constructor() { this.signal = { aborted: false }; }
      abort() { this.signal.aborted = true; }
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),

    // Stubbed engine helpers — the server-mode path calls into these
    // for DISPLAY only. Tests assert whether/when they fire.
    pickFormula: (...args) => { pickFormulaCalls.push(args); return []; },
    pickName: () => 'Client-Picked-Name',
    assignPercentages: () => [],
    bottleCard: () => '<bottle/>',
    storyFor: () => '<story/>',
    safetyLine: () => 'safety line',
    countFilteredOut: () => ({ removed: 0, total: 100, byFlag: {}, examples: [] }),
    isTrace: () => false,
    shortNote: () => 'short note',
    checkFormulaPairs: () => ({ synergies: [], cautions: [] }),
    buildWhyText: () => 'why',
    mycoStory: async () => null,
    PAGES: [
      { keys: ['intention'] }, { keys: ['pattern'] }, { keys: ['avoid'] },
      { keys: ['time','stress','duration','nervous'] },
      { keys: ['notes','age','sleep','energy_curve'] },
    ],
    go: (step) => { goCalls.push(step); },
    renderResult: () => { /* recursive call from retry */ },
  };
  // Expose HERB_DB on window (server-herb enrichment path).
  sandbox.window.HERB_DB = herbDb;

  vm.createContext(sandbox);
  vm.runInContext(block, sandbox);
  return { sandbox, logs, goCalls, pickFormulaCalls, getById };
}

const VALID_PROFILE = () => ({
  intention: 'stress', intentions: ['stress'],
  pattern: 'mixed', patternSub: 'sighing',
  time: 'evening', stress: 'push', duration: 'weeks',
  avoid: ['none'], age: '25_40', sleep: 'restorative_6plus',
  notes: '',
  _gatedOptIn: false, _ageConfirmed: true,
});

const OK_BODY = {
  status: 'ok',
  formulaId: 'fyf_deadbeefcafe1234',
  engineVersion: '2.0.0-server',
  herbDbVersion: '2026.09',
  formula: {
    name: 'Server-Picked-Name',
    size: 3,
    totalPercentage: 100,
    herbs: [
      { name: 'ServerHerb1', botanical: 'Sh1 latin', percentage: 40 },
      { name: 'ServerHerb2', botanical: 'Sh2 latin', percentage: 35 },
      { name: 'ServerHerb3', botanical: 'Sh3 latin', percentage: 25 },
    ],
  },
  safetyReport: { flagsApplied: [] },
  persisted: true,
};

const respond = (status, body) => async () => new Response(JSON.stringify(body), { status });
const throwErr = (err) => async () => { throw err; };

async function assertA_flagActiveRendersServerFormula() {
  const { sandbox, pickFormulaCalls, getById } = buildSandbox({
    urlHref: 'https://www.fungai.art/find-your-formula/?fyf_server=1',
    fetchImpl: respond(200, OK_BODY),
  });
  await sandbox._fyfRenderResultServerMode(VALID_PROFILE());
  const bottleHtml = getById('bottle').innerHTML;
  const listChildren = getById('rHerbList').children;
  return {
    pass: pickFormulaCalls.length === 0
       && sandbox.window.__currentFormula
       && sandbox.window.__currentFormula._source === 'server'
       && sandbox.window.__currentFormula.name === 'Server-Picked-Name'
       && bottleHtml.includes('bottle')
       && listChildren.length === 3,
    detail: `pickFormula calls=${pickFormulaCalls.length}, __currentFormula._source=${sandbox.window.__currentFormula && sandbox.window.__currentFormula._source}, name=${sandbox.window.__currentFormula && sandbox.window.__currentFormula.name}, listItems=${listChildren.length}`,
  };
}

async function assertB_serverFormulaWinsOverClient() {
  // Server returns different herbs than the client would pick.
  // Assertion: rendered herbs = server's, not client's.
  const { sandbox, getById } = buildSandbox({
    urlHref: 'https://www.fungai.art/find-your-formula/?fyf_server=1',
    fetchImpl: respond(200, OK_BODY),
  });
  await sandbox._fyfRenderResultServerMode(VALID_PROFILE());
  const listHtml = getById('rHerbList').children.map(c => c.innerHTML).join('');
  return {
    pass: listHtml.includes('ServerHerb1') && listHtml.includes('ServerHerb2') && listHtml.includes('ServerHerb3'),
    detail: 'list contains all 3 server herb names',
  };
}

async function assertC_500_noClientFormula() {
  const { sandbox, pickFormulaCalls, getById } = buildSandbox({
    urlHref: 'https://www.fungai.art/find-your-formula/?fyf_server=1',
    fetchImpl: respond(500, { status: 'error', code: 'INTERNAL_ERROR' }),
  });
  await sandbox._fyfRenderResultServerMode(VALID_PROFILE());
  return {
    pass: pickFormulaCalls.length === 0
       && !sandbox.window.__currentFormula
       && getById('rServerErr').innerHTML.includes('Composer unavailable'),
    detail: `pickFormula calls=${pickFormulaCalls.length}, __currentFormula=${!!sandbox.window.__currentFormula}, panel="${getById('rServerErr').innerHTML.slice(0,80)}"`,
  };
}

async function assertD_timeout_noClientFormula() {
  const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
  const { sandbox, pickFormulaCalls, getById } = buildSandbox({
    urlHref: 'https://www.fungai.art/find-your-formula/?fyf_server=1',
    fetchImpl: throwErr(abortErr),
  });
  await sandbox._fyfRenderResultServerMode(VALID_PROFILE());
  return {
    pass: pickFormulaCalls.length === 0
       && !sandbox.window.__currentFormula
       && (getById('rServerErr').innerHTML.includes('Connection lost') || getById('rServerErr').innerHTML.includes('Composer unavailable')),
    detail: `pickFormula calls=${pickFormulaCalls.length}, __currentFormula=${!!sandbox.window.__currentFormula}, panel="${getById('rServerErr').innerHTML.slice(0,80)}"`,
  };
}

async function assertE_429_noClientFormula() {
  const { sandbox, pickFormulaCalls, getById } = buildSandbox({
    urlHref: 'https://www.fungai.art/find-your-formula/?fyf_server=1',
    fetchImpl: respond(429, { status: 'error', code: 'RATE_LIMITED' }),
  });
  await sandbox._fyfRenderResultServerMode(VALID_PROFILE());
  return {
    pass: pickFormulaCalls.length === 0
       && !sandbox.window.__currentFormula
       && getById('rServerErr').innerHTML.includes('too much at once'),
    detail: `pickFormula calls=${pickFormulaCalls.length}, __currentFormula=${!!sandbox.window.__currentFormula}`,
  };
}

async function assertF_safetyMissing_UX() {
  const { sandbox, pickFormulaCalls, goCalls, getById } = buildSandbox({
    urlHref: 'https://www.fungai.art/find-your-formula/?fyf_server=1',
    fetchImpl: respond(400, { status: 'rejected', code: 'SAFETY_QUESTION_NOT_ANSWERED' }),
  });
  const p = VALID_PROFILE(); p.avoid = [];
  await sandbox._fyfRenderResultServerMode(p);
  const panel = getById('rServerErr').innerHTML;
  // The internal code must NOT appear in the user-facing HTML.
  const noCodeExposed = !panel.includes('SAFETY_QUESTION_NOT_ANSWERED');
  const backButton = getById('rServerErrCta');
  backButton.click();
  return {
    pass: pickFormulaCalls.length === 0
       && !sandbox.window.__currentFormula
       && panel.includes('one more detail')
       && noCodeExposed
       && goCalls.length === 1 && goCalls[0] === 2 /* PAGES index of 'avoid' */,
    detail: `pickFormula calls=${pickFormulaCalls.length}, panel="${panel.slice(0,80)}", noCodeExposed=${noCodeExposed}, backTo=${goCalls[0]}`,
  };
}

async function assertG_422_noFormulaReveal() {
  const { sandbox, pickFormulaCalls, getById } = buildSandbox({
    urlHref: 'https://www.fungai.art/find-your-formula/?fyf_server=1',
    fetchImpl: respond(422, { status: 'rejected', code: 'NO_VIABLE_FORMULA' }),
  });
  await sandbox._fyfRenderResultServerMode(VALID_PROFILE());
  return {
    pass: pickFormulaCalls.length === 0
       && !sandbox.window.__currentFormula
       && getById('rServerErr').innerHTML.includes('couldn'),
    detail: `pickFormula calls=${pickFormulaCalls.length}, panel="${getById('rServerErr').innerHTML.slice(0,80)}"`,
  };
}

async function assertH_formulaIdPreserved() {
  const { sandbox } = buildSandbox({
    urlHref: 'https://www.fungai.art/find-your-formula/?fyf_server=1',
    fetchImpl: respond(200, OK_BODY),
  });
  await sandbox._fyfRenderResultServerMode(VALID_PROFILE());
  return {
    pass: sandbox.window.__currentFormula
       && sandbox.window.__currentFormula.formulaId === 'fyf_deadbeefcafe1234',
    detail: `formulaId=${sandbox.window.__currentFormula && sandbox.window.__currentFormula.formulaId}`,
  };
}

async function assertI_clientCannotOverwriteServerFormula() {
  // After a successful server compose, the cache-hit path returns the
  // SAME formulaId + herbs on a second call. The client never runs
  // pickFormula, and the __currentFormula is not replaced with a
  // client-generated object.
  let fetchCount = 0;
  const { sandbox, pickFormulaCalls } = buildSandbox({
    urlHref: 'https://www.fungai.art/find-your-formula/?fyf_server=1',
    fetchImpl: async () => { fetchCount++; return new Response(JSON.stringify(OK_BODY), { status: 200 }); },
  });
  const p = VALID_PROFILE();
  await sandbox._fyfRenderResultServerMode(p);
  const idAfterFirst = sandbox.window.__currentFormula.formulaId;
  await sandbox._fyfRenderResultServerMode(p);
  const idAfterSecond = sandbox.window.__currentFormula.formulaId;
  return {
    pass: pickFormulaCalls.length === 0
       && fetchCount === 1                  // 2nd call served from cache
       && idAfterFirst === idAfterSecond    // formulaId preserved
       && sandbox.window.__currentFormula._source === 'server',
    detail: `pickFormula=${pickFormulaCalls.length}, fetches=${fetchCount}, id1=${idAfterFirst}, id2=${idAfterSecond}, source=${sandbox.window.__currentFormula._source}`,
  };
}

async function assertJ_defaultURL_unchanged() {
  // With NO ?fyf_server=1 param, the server-mode fork is skipped.
  // We verify by calling _fyfServerModeActive() directly.
  const { sandbox } = buildSandbox({
    urlHref: 'https://www.fungai.art/find-your-formula/',
  });
  return {
    pass: sandbox._fyfServerModeActive() === false,
    detail: `_fyfServerModeActive() = ${sandbox._fyfServerModeActive()}`,
  };
}

(async () => {
  console.log('── STEP 4 SERVER-MODE SUITE — 10 scenarios (A–J) ──');
  const cases = [
    ['A · ?fyf_server=1 → server formula rendered',                assertA_flagActiveRendersServerFormula],
    ['B · server formula differs → server wins',                    assertB_serverFormulaWinsOverClient],
    ['C · server 500 → NO client formula rendered',                 assertC_500_noClientFormula],
    ['D · timeout → NO client formula rendered',                    assertD_timeout_noClientFormula],
    ['E · server 429 → NO client formula rendered',                 assertE_429_noClientFormula],
    ['F · SAFETY_QUESTION_NOT_ANSWERED → NEED_SAFETY UX + no code exposed', assertF_safetyMissing_UX],
    ['G · server 422 → no formula reveal',                          assertG_422_noFormulaReveal],
    ['H · formulaId preserved in __currentFormula',                 assertH_formulaIdPreserved],
    ['I · client cannot overwrite server formula (cache-hit)',      assertI_clientCannotOverwriteServerFormula],
    ['J · normal URL (no flag) → server-mode fork skipped',         assertJ_defaultURL_unchanged],
  ];
  let pass = 0, fail = 0;
  for (const [name, fn] of cases) {
    try {
      const r = await fn();
      if (r.pass) { pass++; console.log('  ✓ ' + name); }
      else { fail++; console.log('  ✗ ' + name); console.log('      ' + r.detail); }
    } catch (e) {
      fail++;
      console.log('  ✗ ' + name + '  THREW: ' + (e && e.message));
      if (e && e.stack) console.log('      ' + e.stack.split('\n').slice(0,3).join('\n      '));
    }
  }
  console.log('');
  console.log('passed: ' + pass);
  console.log('failed: ' + fail);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('FATAL:', e && e.stack); process.exit(2); });
