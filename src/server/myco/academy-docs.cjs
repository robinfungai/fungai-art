// src/server/myco/academy-docs.cjs
//
// MYCO's MEMBERS-ONLY knowledge layer — whole PDFs in the Academy.
//
// Keepers attach PDFs to lab-notebook chapters (community/academy);
// their text is extracted at upload and stored in
// public.academy_doc_chunks (supabase-academy-docs.sql). This module
// reads those chunks at request time, like lab-notes.cjs reads the
// notebook — posting a PDF IS teaching MYCO, no build, no deploy.
//
// ── WHO GETS IT ──────────────────────────────────────────────────
// The PDFs are for signed-in members. The chunks table refuses the
// anon key, so this module reads it WITH THE ASKING MEMBER'S OWN
// ACCESS TOKEN: no token, or a token Supabase does not accept, and
// the answer is simply built without the PDFs. MYCO stays open to the
// world (Robin, 2026-09-25); what an anonymous visitor's MYCO does not
// get is members' material.
//
// The one exception is the monthly digest, which runs with no member
// at all: it reads with the service role key, server-side only
// (loadDocsSince below).
//
// ── PROMPT INJECTION ─────────────────────────────────────────────
// A PDF is data, not instructions — same rule, same wrapper, as the
// lab notes (see lab-notes.cjs and grounding.cjs).

const { scoreLabNotes } = require('./lab-notes.cjs');

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://cyhpvsyvxzfadtyvcuwp.supabase.co'
).replace(/\/+$/, '');
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aHB2c3l2eHpmYWR0eXZjdXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDU5NTYsImV4cCI6MjA4NTMyMTk1Nn0.BFgP50enaZLWEzhvdfHoAYniLyJiFoo6rct7PYKx1k4';

const MEMBER_TIER   = 2;          // lab-notes.cjs: 1 = public
const MAX_CHUNKS    = 6000;
const CACHE_TTL_MS  = 120_000;    // same as the notebook
const TOKEN_TTL_MS  = 300_000;    // a verified token is trusted for 5 min

let cache = { at: 0, chunks: null, error: null };
const tokenOk = new Map();        // token → expiry ms (bounded below)

function bearer(headers) {
  const h = headers || {};
  const raw = h.authorization || h.Authorization || '';
  const m = /^Bearer\s+([A-Za-z0-9._-]{20,4096})$/.exec(String(raw).trim());
  return m ? m[1] : null;
}

// Supabase answers /auth/v1/user only for a live, genuine session.
async function isMember(token) {
  if (!token) return false;
  const now = Date.now();
  const hit = tokenOk.get(token);
  if (hit && hit > now) return true;
  try {
    const res = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + token },
    });
    if (!res.ok) return false;
    const u = await res.json().catch(() => null);
    if (!u || !u.id) return false;
    if (tokenOk.size > 500) tokenOk.clear();
    tokenOk.set(token, now + TOKEN_TTL_MS);
    return true;
  } catch (_) {
    return false;
  }
}

function toChunk(r) {
  const d = r.academy_docs || {};
  const pages = r.page_from
    ? (r.page_to && r.page_to !== r.page_from ? 'pp. ' + r.page_from + '–' + r.page_to : 'p. ' + r.page_from)
    : '';
  return {
    id:     'doc_' + r.doc_id + '_' + r.chunk_no,
    type:   'document',
    title:  'Academy document · ' + (d.title || 'untitled') + (pages ? ' · ' + pages : ''),
    source: 'Academy PDF — "' + (d.title || 'untitled') + '"' + (pages ? ', ' + pages : '') +
            ', chapter ' + (d.chapter_id || 'general') + ', ' + String(d.created_at || '').slice(0, 10),
    herb:   null,
    text:   String(r.text || ''),
    accessTier: MEMBER_TIER,
  };
}

async function fetchChunks(key, token) {
  const url = SUPABASE_URL + '/rest/v1/academy_doc_chunks' +
    '?select=doc_id,chunk_no,page_from,page_to,text,academy_docs(title,chapter_id,created_at)' +
    '&order=doc_id,chunk_no&limit=' + MAX_CHUNKS;
  const res = await fetch(url, { headers: { apikey: key, Authorization: 'Bearer ' + token } });
  if (!res.ok) throw new Error('academy_doc_chunks HTTP ' + res.status);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).filter(r => String(r.text || '').trim().length >= 40).map(toChunk);
}

// Every verified member sees the same chunks, so one cache serves them
// all — but it is only ever returned to a caller who just passed
// isMember(). An unverified caller never reaches the cache.
async function loadDocChunks(token) {
  const now = Date.now();
  if (cache.chunks && now - cache.at < CACHE_TTL_MS) return cache.chunks;
  try {
    const chunks = await fetchChunks(SUPABASE_ANON, token);
    cache = { at: now, chunks, error: null };
    return chunks;
  } catch (e) {
    cache = { at: now, chunks: cache.chunks || [], error: e && e.message };
    return cache.chunks;
  }
}

/**
 * PDF extracts for a question — [] unless the caller is a signed-in member.
 * @param {object} headers the request headers (Authorization: Bearer <supabase access token>)
 */
async function retrieveDocChunks(question, k = 3, interpretation = null, headers = null) {
  try {
    const token = bearer(headers);
    if (!(await isMember(token))) return [];
    const chunks = await loadDocChunks(token);
    return scoreLabNotes(question, chunks || [], k, interpretation);
  } catch (_) {
    return [];
  }
}

/**
 * Whole documents uploaded since `since`, with their text in order — for
 * the monthly digest. Needs the service role key; returns [] without it.
 */
async function loadDocsSince(since, serviceKey) {
  if (!serviceKey) return [];
  const iso = new Date(since).toISOString();
  const headers = { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey };
  const dRes = await fetch(SUPABASE_URL + '/rest/v1/academy_docs?select=id,title,chapter_id,pages,created_at' +
    '&created_at=gte.' + encodeURIComponent(iso) + '&order=created_at.asc', { headers });
  if (!dRes.ok) return [];
  const docs = await dRes.json();
  const out = [];
  for (const d of Array.isArray(docs) ? docs : []) {
    const cRes = await fetch(SUPABASE_URL + '/rest/v1/academy_doc_chunks?select=chunk_no,page_from,text' +
      '&doc_id=eq.' + d.id + '&order=chunk_no.asc&limit=2000', { headers });
    const rows = cRes.ok ? await cRes.json() : [];
    out.push({ ...d, text: (Array.isArray(rows) ? rows : []).map(r => r.text).join('\n') });
  }
  return out;
}

function docsStatus() {
  return { cached: (cache.chunks || []).length, at: cache.at, error: cache.error };
}

module.exports = { retrieveDocChunks, loadDocChunks, loadDocsSince, isMember, bearer, docsStatus, MEMBER_TIER };
