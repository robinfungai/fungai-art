-- ════════════════════════════════════════════════════════════════
-- Academy documents — whole PDFs in the lab notebook, and MYCO learns
-- from them (Robin, 2026-09-27)
--
--   storage bucket  academy-docs         the PDF files — PRIVATE
--   academy_docs                          one row per PDF: title, chapter
--   academy_doc_chunks                    the PDF's text, in ~1,400-char
--                                         pieces, page-numbered
--
-- WHO SEES WHAT
--   · keepers (fa_is_admin) upload, rename and delete;
--   · every signed-in member reads the PDFs and their text;
--   · the anon key reads NOTHING — not the file, not the text. A
--     visitor who is not signed in cannot fetch a PDF even with its
--     exact path.
--   · MYCO reads the text with the asking member's own sign-in
--     (netlify/functions/myco-agent.mjs → src/server/myco/academy-docs.cjs),
--     so a signed-in member's MYCO knows the PDFs and an anonymous
--     visitor's MYCO does not. The monthly digest reads them with the
--     service role key, server-side only.
--
-- The text is extracted in the keeper's browser at upload (pdf.js), so
-- nothing server-side has to parse PDFs. A scanned PDF with no text
-- layer uploads fine but teaches MYCO nothing — the Academy says so.
--
-- Needs public.fa_is_admin(). Run once in Supabase → SQL Editor.
-- Idempotent.
-- ════════════════════════════════════════════════════════════════

-- ── 1 · The bucket ──────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('academy-docs', 'academy-docs', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 52428800,
      allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "academy_docs_files_read"   ON storage.objects;
DROP POLICY IF EXISTS "academy_docs_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "academy_docs_files_update" ON storage.objects;
DROP POLICY IF EXISTS "academy_docs_files_delete" ON storage.objects;

CREATE POLICY "academy_docs_files_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'academy-docs');
CREATE POLICY "academy_docs_files_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'academy-docs' AND public.fa_is_admin());
CREATE POLICY "academy_docs_files_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'academy-docs' AND public.fa_is_admin())
  WITH CHECK (bucket_id = 'academy-docs' AND public.fa_is_admin());
CREATE POLICY "academy_docs_files_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'academy-docs' AND public.fa_is_admin());

-- ── 2 · The documents ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_docs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id    text        NOT NULL CHECK (char_length(chapter_id) BETWEEN 1 AND 100),
  title         text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  storage_path  text        NOT NULL UNIQUE CHECK (char_length(storage_path) <= 300),
  bytes         integer     CHECK (bytes >= 0),
  pages         integer     CHECK (pages >= 0),
  text_chars    integer     NOT NULL DEFAULT 0,
  uploaded_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS academy_docs_by_chapter ON public.academy_docs (chapter_id, created_at DESC);

ALTER TABLE public.academy_docs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academy_docs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_docs TO authenticated;

DROP POLICY IF EXISTS "academy_docs_read"  ON public.academy_docs;
DROP POLICY IF EXISTS "academy_docs_write" ON public.academy_docs;
CREATE POLICY "academy_docs_read"
  ON public.academy_docs FOR SELECT TO authenticated USING (true);
CREATE POLICY "academy_docs_write"
  ON public.academy_docs FOR ALL TO authenticated
  USING (public.fa_is_admin()) WITH CHECK (public.fa_is_admin());

-- ── 3 · Their text, for MYCO ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_doc_chunks (
  id         bigserial PRIMARY KEY,
  doc_id     uuid      NOT NULL REFERENCES public.academy_docs(id) ON DELETE CASCADE,
  chunk_no   integer   NOT NULL,
  page_from  integer,
  page_to    integer,
  text       text      NOT NULL CHECK (char_length(text) BETWEEN 1 AND 4000),
  UNIQUE (doc_id, chunk_no)
);

ALTER TABLE public.academy_doc_chunks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academy_doc_chunks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_doc_chunks TO authenticated;
GRANT USAGE ON SEQUENCE public.academy_doc_chunks_id_seq TO authenticated;

DROP POLICY IF EXISTS "academy_doc_chunks_read"  ON public.academy_doc_chunks;
DROP POLICY IF EXISTS "academy_doc_chunks_write" ON public.academy_doc_chunks;
CREATE POLICY "academy_doc_chunks_read"
  ON public.academy_doc_chunks FOR SELECT TO authenticated USING (true);
CREATE POLICY "academy_doc_chunks_write"
  ON public.academy_doc_chunks FOR ALL TO authenticated
  USING (public.fa_is_admin()) WITH CHECK (public.fa_is_admin());

-- ── Verify ──────────────────────────────────────────────────────
-- SELECT d.title, d.pages, count(c.*) AS chunks, d.text_chars
--   FROM public.academy_docs d LEFT JOIN public.academy_doc_chunks c ON c.doc_id = d.id
--  GROUP BY d.id ORDER BY d.created_at DESC;
