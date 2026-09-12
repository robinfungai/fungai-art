// src/server/formula-engine/myco.js
//
// Server-side MYCO caller. Given the deterministic candidate set +
// the quiz profile, asks Claude Opus 5 to pick 5-7 herbs and assign
// percentages. Returns { picks, overall } or null on any failure.
//
// The prompt mirrors the one myco-agent.js already uses for its
// client-driven compose mode — kept in sync intentionally so herb
// selection behaviour matches between the two paths during migration.
//
// CRITICAL: caller MUST run this response through myco-validator.js
// before using ANY of it. MYCO is untrusted creative input per audit
// constraint #11. This module NEVER writes to the herb pool or takes
// any authoritative action — it just returns a proposal.
//
// SERVER-ONLY. Never imported by any client code.

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';

// 25s hard timeout on the Anthropic call. Live diagnosis (Step 5.5c):
// Opus 5 with adaptive thinking + effort:medium regularly runs 10-15s
// under real load (12878ms observed → aborted right at old 12s ceiling
// → MYCO_UNAVAILABLE fallback). 25s covers p99 without letting a
// genuinely stuck request block the reveal forever.
const MYCO_TIMEOUT_MS = 25000;

// Compose the shortlist Anthropic sees. Uses the same shape myco-agent
// used — id + name + botanical + category + pre-score + trace flag +
// short functions blurb — so the model's prompting is consistent.
function _buildShortlistText(candidates) {
  return candidates.slice(0, 20).map((h, i) => (
    (i + 1) + '. id=' + (h.id || '') + ' · ' + (h.name || '') +
    ' (' + (h.botanical || '') + ')' +
    ' · category:' + (h._cat || 'other') +
    ' · pre-score:' + (h._score || 0) +
    (h._isTrace ? ' · TRACE' : '') +
    '\n     ' + (((h.primary_functions || [])[0]) || '').slice(0, 220)
  )).join('\n');
}

function _buildComposeUser(quiz, shortlistText) {
  const q = quiz || {};
  return (
    'Quiz answers:\n' +
    '- Intention: ' + (q.intention || '—') + '\n' +
    (Array.isArray(q.intentions) && q.intentions.length > 1
      ? '- Full ranking (primary → tertiary): ' + q.intentions.slice(0, 3).join(' → ') +
        '  (weight the pick to primary first, secondary secondary, tertiary lightly)\n'
      : '') +
    '- Body: ' + (q.pattern || '—') + (q.patternSub ? ' / ' + q.patternSub : '') + '\n' +
    '- Rhythm: ' + (q.time || '—') + ' hardest\n' +
    '- Meets stress by: ' + (q.stress || '—') + '\n' +
    '- Duration: ' + (q.duration || '—') + '\n' +
    '- Age: ' + (q.age || '—') + '\n' +
    '- Sleep: ' + (q.sleep || '—') + '\n' +
    '- Safety filters: ' + (Array.isArray(q.avoid) ? q.avoid.join(', ') : (q.avoid || 'none')) + '\n' +
    '- Priority + prior herb experience: "' + String(q.notes || '').slice(0, 500) + '"\n\n' +
    'Shortlist (ranked by the deterministic scorer):\n' + shortlistText + '\n\n' +
    'Return the JSON now.'
  );
}

const COMPOSE_SYS =
  'You are MYCO — a plant-medicine formula composer. You will pick 5 to 7 herbs from a shortlist for one specific person, and explain WHY in one paragraph.\n\n' +
  'HARD RULES:\n' +
  '- Pick ONLY from the shortlist ids provided. Never invent a herb.\n' +
  '- Pick between 5 and 7 herbs. Prefer 5 unless the case genuinely calls for more (multi-axis complexity, chronic + acute together, layered request).\n' +
  '- Percentages must sum to 100 (integers). Any TRACE-marked herb ≤ 5%.\n' +
  '- Balance categories — no more than 2 herbs of the same category. Mix adaptogens, nervines, tonics, movers, mushrooms.\n' +
  '- Do NOT diagnose. Do NOT prescribe. This is traditional herbal support, not medical treatment.\n' +
  '- Reference the free-text explicitly if it names a priority, prior herb experience, or contraindication history.\n\n' +
  'OUTPUT FORMAT — return ONLY valid JSON, no preamble, no code fences, matching:\n' +
  '{\n' +
  '  "picked": [ { "id": "...", "pct": 22, "reason": "one short sentence" }, ... ],\n' +
  '  "overall": "2-3 sentences of reasoning tying the pick to their answers"\n' +
  '}';

/**
 * Ask MYCO to compose a formula from the deterministic candidate set.
 *
 * @param {Array} candidates — top ~20 scored herbs from the picker.
 *   Each herb should carry _score + _cat + _isTrace on it (the
 *   orchestrator tags these before calling).
 * @param {Object} quiz — the user's normalised profile.
 * @param {Object} opts — { apiKey, workspaceId?, fetchImpl? }.
 *   fetchImpl is dependency-injected so tests can mock Anthropic.
 * @returns {Promise<{picks:Array<{id,pct,reason}>, overall:string} | null>}
 *   null on ANY failure: no api key, network error, non-200, malformed
 *   JSON, empty picks. Callers fall back to deterministic on null.
 */
async function askMyco(candidates, quiz, opts = {}) {
  const apiKey       = opts.apiKey       || process.env.ANTHROPIC_API_KEY;
  const workspaceId  = opts.workspaceId  || process.env.ANTHROPIC_WORKSPACE_ID;
  const fetchImpl    = opts.fetchImpl    || fetch;

  if (!apiKey) return null;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const headers = {
    'x-api-key':         apiKey,
    'anthropic-version': '2023-06-01',
    'Content-Type':      'application/json',
  };
  if (workspaceId) headers['anthropic-workspace-id'] = workspaceId;

  const shortlistText = _buildShortlistText(candidates);
  const composeUser   = _buildComposeUser(quiz, shortlistText);

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => { try { controller.abort(); } catch (_) {} }, MYCO_TIMEOUT_MS);

  let res, data;
  try {
    res = await fetchImpl(ANTHROPIC_ENDPOINT, {
      method:  'POST',
      headers,
      body:    JSON.stringify({
        model:      'claude-opus-5',
        max_tokens: 4000,
        thinking:   { type: 'adaptive' },
        output_config: { effort: 'medium' },
        system: [
          { type: 'text', text: COMPOSE_SYS, cache_control: { type: 'ephemeral' } },
        ],
        messages: [{ role: 'user', content: composeUser }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    data = await res.json();
  } catch (_) {
    clearTimeout(timeoutId);
    return null;
  }

  // Opus 5 returns thinking blocks first (content[0] can be
  // { type: 'thinking', thinking: '...' }); the actual response is in
  // the first block with type:'text'. Iterate defensively.
  let raw = '';
  for (const block of (data.content || [])) {
    if (block && block.type === 'text' && block.text) { raw = block.text; break; }
  }
  if (!raw) return null;

  // Extract JSON — model is instructed to return only JSON but may
  // wrap in ```json``` fences.
  let parsed = null;
  try {
    const cleaned = raw.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (_) {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
  }
  if (!parsed || !Array.isArray(parsed.picked) || parsed.picked.length === 0) return null;

  return { picks: parsed.picked, overall: String(parsed.overall || '') };
}

module.exports = { askMyco, MYCO_TIMEOUT_MS, _buildShortlistText, _buildComposeUser };
