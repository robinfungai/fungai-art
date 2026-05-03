import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL  ?? '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Null when credentials aren't configured — callers must guard with `if (supabase)`
export const supabase = url && key && !url.includes('YOUR_')
  ? createClient(url, key)
  : null;
