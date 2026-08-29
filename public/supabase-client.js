/* ════════════════════════════════════════════════════════════════
   Fungai Art · Supabase client
   ════════════════════════════════════════════════════════════════
   Loads the Supabase JS SDK from CDN (no npm install needed for
   static pages), initialises a client with the public anon key,
   and exposes window.SBclient + window.SBauth helper functions.

   The anon key is public by design — security comes from Row-Level
   Security policies in the database, not from hiding the key.
   ════════════════════════════════════════════════════════════════ */
(function () {
  const SUPABASE_URL = 'https://cyhpvsyvxzfadtyvcuwp.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aHB2c3l2eHpmYWR0eXZjdXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDU5NTYsImV4cCI6MjA4NTMyMTk1Nn0.BFgP50enaZLWEzhvdfHoAYniLyJiFoo6rct7PYKx1k4';
  const CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

  // Track readiness — components can `await window.SBready` or listen for 'supabase:ready' event
  window.SBready = new Promise((resolve, reject) => {
    if (window.supabase) { initClient(resolve); return; }
    const s = document.createElement('script');
    s.src = CDN_URL;
    s.async = true;
    s.onload = () => initClient(resolve);
    s.onerror = (e) => {
      console.error('[Supabase] Failed to load SDK from CDN:', e);
      reject(e);
    };
    document.head.appendChild(s);
  });

  function initClient(resolve) {
    try {
      window.SBclient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,  // catches magic-link callback in URL
          // PKCE flow: a code_verifier is stored in localStorage when the
          // user requests the link, and required at exchange. Pre-fetchers
          // (antivirus, email scanners, browser extensions) that follow
          // the link don't have the verifier, so their click doesn't
          // consume the OTP. User must complete the flow on the same
          // device/browser that requested it.
          flowType: 'pkce',
        },
      });

      // ── Auth helpers exposed for convenience ───────────────────────
      window.SBauth = {
        // Sign in with email magic link — clean redirect URL (no fragments)
        async signIn(email) {
          const { data, error } = await window.SBclient.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: {
              // Point at the static spore file explicitly. Works in both dev
              // (Vite serves public/community/index.html directly, no SPA
              // fallback catching it) and prod (Netlify serves the same
              // static file — the /index.html in the URL is harmless).
              emailRedirectTo: window.location.origin + '/community/index.html?signedin=1',
              shouldCreateUser: true,
            },
          });
          return { data, error };
        },
        async signOut() {
          return await window.SBclient.auth.signOut();
        },
        async getUser() {
          const { data } = await window.SBclient.auth.getUser();
          return data?.user || null;
        },
        async getSession() {
          const { data } = await window.SBclient.auth.getSession();
          return data?.session || null;
        },
        onAuthChange(callback) {
          return window.SBclient.auth.onAuthStateChange((event, session) => {
            callback({ event, session, user: session?.user || null });
          });
        },
        // Called on app boot. Awaits the SDK, then makes sure we're not
        // rendering the "not signed in" screen while a PKCE ?code= from a
        // magic link is still being exchanged in the background.
        //
        // Flow:
        //   1. If a session is already persisted → return its user (fast path).
        //   2. If URL contains ?code=, wait up to 6 s for SIGNED_IN — the
        //      SDK's detectSessionInUrl handler does the exchange async;
        //      without waiting we render LoginScreen before it lands, and
        //      the user thinks the magic link didn't work and clicks it
        //      again.  As a belt+braces fallback we also fire the exchange
        //      ourselves in case the SDK's URL handler was cleared.
        //   3. Otherwise → no user.
        async ensureSession() {
          try { await window.SBready; } catch { return null; }
          if (!window.SBclient) return null;
          // Fast path: session already restored from storage (returning visitor)
          // or already exchanged (SDK finished first). Return it.
          try {
            const { data } = await window.SBclient.auth.getSession();
            if (data?.session?.user) return data.session.user;
          } catch (_) {}
          const qs = window.location.search || '';
          const hasCode = /[?&]code=/.test(qs);
          if (!hasCode) return null;
          // Fire an explicit exchange in the background — no-op if the SDK
          // already consumed the code. Some browsers / extensions clear the
          // URL before detectSessionInUrl fires; this is our safety net.
          try {
            const params = new URLSearchParams(qs);
            const code = params.get('code');
            if (code) {
              // Don't await — let onAuthChange be the source of truth.
              window.SBclient.auth.exchangeCodeForSession(code).catch(() => {});
            }
          } catch (_) {}
          // Wait for the SIGNED_IN event (or timeout after 6 s).
          return await new Promise((resolve) => {
            let done = false;
            const finish = (u) => { if (done) return; done = true; resolve(u); };
            const t = setTimeout(async () => {
              // Last-ditch: session may have landed silently — check once more.
              try {
                const { data } = await window.SBclient.auth.getSession();
                finish(data?.session?.user || null);
              } catch { finish(null); }
            }, 6000);
            const { data: sub } = window.SBclient.auth.onAuthStateChange((event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                clearTimeout(t);
                try { sub?.subscription?.unsubscribe?.(); } catch (_) {}
                finish(session.user);
              }
            });
          });
        },
      };

      // ── Profile helpers ─────────────────────────────────────────
      window.SBprofiles = {
        async fetchAll() {
          const { data, error } = await window.SBclient
            .from('profiles')
            .select('*')
            .order('founding', { ascending: false })
            .order('rep', { ascending: false });
          if (error) { console.warn('[Supabase] fetchAll error:', error.message); return []; }
          return data || [];
        },
        async fetchMine() {
          const user = await window.SBauth.getUser();
          if (!user) return null;
          const { data, error } = await window.SBclient
            .from('profiles')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          if (error) { console.warn('[Supabase] fetchMine error:', error.message); return null; }
          return data;
        },
        async upsert(profile) {
          const user = await window.SBauth.getUser();
          if (!user) throw new Error('Must be signed in to save profile');
          const payload = {
            ...profile,
            auth_user_id: user.id,
            email: profile.email || user.email,
          };
          // 1. If this user already has a profile (matched by auth_user_id), UPDATE.
          const existing = await window.SBprofiles.fetchMine();
          if (existing) {
            const { data, error } = await window.SBclient
              .from('profiles')
              .update(payload)
              .eq('id', existing.id)
              .select()
              .single();
            if (error) throw error;
            return data;
          }
          // 2. No personal profile yet. Try to CLAIM an unclaimed seed whose
          //    character_name matches (case-insensitive). This is how Robert,
          //    Luna, Leni, Remi, etc. attach to their pre-seeded thread on
          //    first sign-in instead of creating a duplicate row.
          const wanted = (profile.character_name || '').trim();
          if (wanted) {
            const { data: seed } = await window.SBclient
              .from('profiles')
              .select('id')
              .ilike('character_name', wanted)
              .is('auth_user_id', null)
              .maybeSingle();
            if (seed) {
              const { data, error } = await window.SBclient
                .from('profiles')
                .update(payload)
                .eq('id', seed.id)
                .is('auth_user_id', null) // race-safe: only claim if still unclaimed
                .select()
                .maybeSingle();
              if (error) throw error;
              if (data) return data; // successfully claimed
              // else: someone else claimed it between our SELECT and UPDATE → fall through to INSERT
            }
          }
          {
            const { data, error } = await window.SBclient
              .from('profiles')
              .insert(payload)
              .select()
              .single();
            if (error) throw error;
            return data;
          }
        },
        // Insert a profile as unclaimed (auth_user_id = null).
        // Used by admin to seed new members and by invite-code (5858) users
        // creating their own profile before signing in. Requires the RLS
        // policy "Allow anonymous insert of unclaimed profiles" to be in place
        // (see supabase-allow-unclaimed-inserts.sql).
        async createUnclaimed(profile) {
          const payload = { ...profile, auth_user_id: null };
          // Don't try to insert these — they're either auth-derived or computed elsewhere
          delete payload.email;
          delete payload.id;
          delete payload.cloudId;
          delete payload.authUserId;
          const { data, error } = await window.SBclient
            .from('profiles')
            .insert(payload)
            .select()
            .maybeSingle();
          if (error) {
            // Translate the most likely failure: RLS policy missing
            if (/row-level security|policy|new row/i.test(error.message || '')) {
              throw new Error('Database is refusing the insert — RLS policy probably missing. Run supabase-allow-unclaimed-inserts.sql in the Supabase SQL editor.');
            }
            // Unique constraint on character_name (from dedupe lockdown)
            if (/duplicate|unique/i.test(error.message || '')) {
              throw new Error('A profile with that name already exists. Pick a different name, or use the claim picker to take over the existing one.');
            }
            throw error;
          }
          if (!data) throw new Error('Insert returned no row. Reload and try again.');
          return data;
        },
        // Admin path — update ANY profile row by id (not just the caller's).
        // Requires an RLS policy on `profiles` that permits UPDATE where the
        // caller's auth.jwt() email is in the admin list (robin@fungai.art,
        // teyae@fungai.art). If the DB has no such policy the request will
        // fail with a permissions error and the caller must add one.
        async adminUpdate(profileId, fields) {
          if (!profileId) throw new Error('adminUpdate: missing profileId');
          const clean = { ...fields };
          // Never let admin overwrite these — they're auth-derived / immutable.
          delete clean.id;
          delete clean.auth_user_id;
          delete clean.created_at;
          const { data, error } = await window.SBclient
            .from('profiles')
            .update(clean)
            .eq('id', profileId)
            .select()
            .maybeSingle();
          if (error) {
            if (/policy|row-level|403|denied/i.test(error.message || '')) {
              throw new Error("Admin update blocked by RLS. Add a policy on `profiles` that allows UPDATE when auth.jwt() email is a known admin.");
            }
            throw error;
          }
          return data;
        },
        // Admin path — upload a portrait to ANOTHER user's folder in the
        // avatars bucket. Requires an RLS policy on storage.objects that
        // lets admins write outside their own uid folder (see the
        // supabase-avatars-bucket.sql notes).
        async adminUploadAvatar(profileId, fileOrDataUrl) {
          if (!profileId) throw new Error('adminUploadAvatar: missing profileId');
          if (!window.SBauth?.getUser) throw new Error('Auth not ready');
          const me = await window.SBauth.getUser();
          if (!me) throw new Error('Must be signed in');
          // Look up the target profile's auth_user_id (that's the folder key).
          const { data: row, error: qErr } = await window.SBclient
            .from('profiles')
            .select('id, auth_user_id')
            .eq('id', profileId)
            .maybeSingle();
          if (qErr) throw qErr;
          // If the target is unclaimed (no auth_user_id yet), we put the
          // file in an `unclaimed/` folder — the profile row still gets
          // the public URL, and the user's own uploads will overwrite it
          // once they claim.
          const folder = row?.auth_user_id || `unclaimed/${profileId}`;
          let blob = fileOrDataUrl;
          let ext = 'jpg';
          let mime = 'image/jpeg';
          if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
            const m = fileOrDataUrl.match(/^data:([^;]+);/);
            if (m) { mime = m[1]; ext = (mime.split('/')[1] || 'jpg').replace('jpeg','jpg'); }
            const res = await fetch(fileOrDataUrl);
            blob = await res.blob();
          } else if (fileOrDataUrl && typeof fileOrDataUrl === 'object') {
            if (fileOrDataUrl.type) mime = fileOrDataUrl.type;
            const guess = fileOrDataUrl.name?.split('.').pop();
            if (guess) ext = guess.toLowerCase().replace('jpeg','jpg');
            else if (mime.includes('/')) ext = mime.split('/')[1].replace('jpeg','jpg');
          } else {
            throw new Error('No image provided.');
          }
          const path = `${folder}/avatar-${Date.now()}.${ext}`;
          const { error: upErr } = await window.SBclient.storage
            .from('avatars')
            .upload(path, blob, { upsert: true, contentType: mime, cacheControl: '3600' });
          if (upErr) {
            if (/policy|row-level|403|denied/i.test(upErr.message || '')) {
              throw new Error("Admin storage write blocked by RLS. Add an admin INSERT/UPDATE policy on storage.objects for the avatars bucket.");
            }
            throw upErr;
          }
          const { data: { publicUrl } } = window.SBclient.storage.from('avatars').getPublicUrl(path);
          return publicUrl;
        },
        // Claim an existing seeded profile (founding members + palawan) — links it to this auth user
        async claimSeededProfile(profileId) {
          const user = await window.SBauth.getUser();
          if (!user) throw new Error('You need to be signed in first.');
          const { data, error } = await window.SBclient
            .from('profiles')
            .update({ auth_user_id: user.id, email: user.email })
            .eq('id', profileId)
            .is('auth_user_id', null)
            .select()
            .maybeSingle();
          if (error) {
            // Translate the most common PostgREST RLS error into something humans understand
            if (error.message?.includes('coerce') || error.code === 'PGRST116') {
              throw new Error('That profile is already claimed — or our database doesn\'t allow this claim yet (RLS policy missing). Robin, check Supabase policies.');
            }
            throw error;
          }
          if (!data) {
            throw new Error('That profile was already claimed by someone else (or just now). Reload the page and try a different name.');
          }
          return data;
        },
        // Profiles that haven't been claimed yet — used for the 'which member are you?' picker
        async fetchUnclaimed() {
          const { data, error } = await window.SBclient
            .from('profiles')
            .select('id, character_name, role, node, founding')
            .is('auth_user_id', null)
            .order('founding', { ascending: false })
            .order('rep', { ascending: false });
          if (error) { console.warn('[Supabase] fetchUnclaimed error:', error.message); return []; }
          return data || [];
        },
        // Upload a portrait to the `avatars` bucket. Accepts a File OR a
        // Blob OR a data-URL string — the ProfileEditor loses its File
        // reference on some browsers between the picker firing and Save
        // being clicked, so we normalise here instead of at every call site.
        // Returns the public URL, or throws with a human-readable reason.
        async uploadAvatar(fileOrDataUrl) {
          const user = await window.SBauth.getUser();
          if (!user) throw new Error('Must be signed in to upload avatar');
          let blob = fileOrDataUrl;
          let ext  = 'jpg';
          let mime = 'image/jpeg';
          if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
            const m = fileOrDataUrl.match(/^data:([^;]+);/);
            if (m) { mime = m[1]; ext = (mime.split('/')[1] || 'jpg').replace('jpeg','jpg'); }
            const res = await fetch(fileOrDataUrl);
            blob = await res.blob();
          } else if (fileOrDataUrl && typeof fileOrDataUrl === 'object') {
            if (fileOrDataUrl.type) mime = fileOrDataUrl.type;
            if (fileOrDataUrl.name) {
              const guess = fileOrDataUrl.name.split('.').pop();
              if (guess) ext = guess.toLowerCase().replace('jpeg','jpg');
            } else if (mime.includes('/')) {
              ext = mime.split('/')[1].replace('jpeg','jpg');
            }
          } else {
            throw new Error('No image provided.');
          }
          // Stable folder per user so RLS matches; timestamp so browsers
          // re-fetch after a change instead of showing a cached older photo.
          const path = `${user.id}/avatar-${Date.now()}.${ext}`;
          const { error: upErr } = await window.SBclient.storage
            .from('avatars')
            .upload(path, blob, {
              upsert: true,
              contentType: mime,
              cacheControl: '3600',
            });
          if (upErr) {
            // Rewrite the most common opaque errors so the ProfileEditor
            // toast is actually actionable.
            const raw = (upErr.message || upErr.error || '') + '';
            if (/bucket|not.?found|no.*such/i.test(raw)) {
              throw new Error("Avatars bucket missing in Supabase — run supabase-avatars-bucket.sql once.");
            }
            if (/policy|row.?level|403|denied/i.test(raw)) {
              throw new Error("Avatars bucket exists but RLS is blocking the upload — re-run supabase-avatars-bucket.sql.");
            }
            throw upErr;
          }
          const { data: { publicUrl } } = window.SBclient.storage
            .from('avatars')
            .getPublicUrl(path);
          return publicUrl;
        },
      };

      console.log('[Supabase] ready');
      window.dispatchEvent(new CustomEvent('supabase:ready'));
      resolve(window.SBclient);
    } catch (e) {
      console.error('[Supabase] init failed:', e);
    }
  }
})();
