import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY } from "@shared/supabaseConfig";

export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
