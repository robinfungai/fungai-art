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
        async uploadAvatar(file) {
          const user = await window.SBauth.getUser();
          if (!user) throw new Error('Must be signed in to upload avatar');
          const ext = file.name.split('.').pop().toLowerCase();
          const path = `${user.id}/avatar-${Date.now()}.${ext}`;
          const { error: upErr } = await window.SBclient.storage
            .from('avatars')
            .upload(path, file, { upsert: true });
          if (upErr) throw upErr;
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
