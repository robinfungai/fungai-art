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
        },
      });

      // ── Auth helpers exposed for convenience ───────────────────────
      window.SBauth = {
        // Sign in with email magic link — clean redirect URL (no fragments)
        async signIn(email) {
          const { data, error } = await window.SBclient.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: {
              emailRedirectTo: window.location.origin + '/community/?signedin=1',
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
          // Try update first; if no row exists for this user, insert
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
          } else {
            const { data, error } = await window.SBclient
              .from('profiles')
              .insert(payload)
              .select()
              .single();
            if (error) throw error;
            return data;
          }
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
