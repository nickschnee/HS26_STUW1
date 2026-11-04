// The only file that knows how to connect to Supabase.
// It runs on the server, so the secret key never reaches the browser.
// Docs: https://supabase.com/docs/reference/javascript/initializing

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
