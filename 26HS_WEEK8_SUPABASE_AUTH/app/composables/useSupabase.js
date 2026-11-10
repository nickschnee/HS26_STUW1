// The only file that knows how to connect to Supabase.
// It runs in the browser, so it can only use the publishable key.
// After the login, the client saves the session (with the access token) in localStorage
// and sends the token with every request. RLS in Supabase reads the user from that token.
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
