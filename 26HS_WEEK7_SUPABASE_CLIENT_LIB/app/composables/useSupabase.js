// The only file that knows how to connect to Supabase.
// It runs in the browser, so it can only use the publishable key.
// What the browser may read and write is decided by Row Level Security (RLS) in Supabase.
// Docs: https://supabase.com/docs/reference/javascript/initializing

import { createClient } from "@supabase/supabase-js";

let supabase;

export function useSupabase() {
  // create the client only once, and reuse it after that
  if (!supabase) {
    const config = useRuntimeConfig();
    supabase = createClient(
      config.public.supabaseUrl,
      config.public.supabasePublishableKey
    );
  }

  return supabase;
}
