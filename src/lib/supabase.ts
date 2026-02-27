import { createClient } from '@supabase/supabase-js';

// Single shared Supabase client instance.
// Using the anon key here — RLS policies handle access control.
// See supabase/schema.sql for the full policy setup.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your project credentials.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
