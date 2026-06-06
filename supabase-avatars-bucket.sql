-- ════════════════════════════════════════════════════════════════
-- avatars bucket — profile photo storage
--
-- Why: SBprofiles.uploadAvatar() uploads to storage.from('avatars').
-- If the bucket doesn't exist (or its policies block writes), the
-- save() flow silently falls back to embedding a data URL on the
-- profile row. That works visually but bloats the table — every
-- avatar is ~30–80KB inline. Proper storage uploads keep the row
-- skinny and let us cache/cdn the image.
--
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query →
-- paste → Run. It's idempotent; safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- 1) Bucket creation. public = true means the URL returned by
--    getPublicUrl() actually works without a signed token.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE
   SET public = EXCLUDED.public,
       file_size_limit = EXCLUDED.file_size_limit,
       allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) RLS policies on storage.objects for this bucket.
--    Pattern: file path is "{auth.uid}/avatar-{timestamp}.{ext}" —
--    see SBprofiles.uploadAvatar in public/supabase-client.js. The
--    user can write/update/delete only files under their own uid
--    folder; everyone (anon + authenticated) can read.

-- Read: anyone, including not-signed-in visitors viewing member cards.
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Write: authenticated, only into their own uid folder.
DROP POLICY IF EXISTS "avatars_authed_insert_own" ON storage.objects;
CREATE POLICY "avatars_authed_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_authed_update_own" ON storage.objects;
CREATE POLICY "avatars_authed_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_authed_delete_own" ON storage.objects;
CREATE POLICY "avatars_authed_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) Sanity check — should return the bucket row + 4 policies.
SELECT 'bucket' AS kind, id, name, public, file_size_limit FROM storage.buckets WHERE id = 'avatars'
UNION ALL
SELECT 'policy' AS kind, policyname, tablename, NULL::boolean, NULL::int8
  FROM pg_policies
 WHERE tablename = 'objects' AND policyname LIKE 'avatars_%'
 ORDER BY kind, name;
