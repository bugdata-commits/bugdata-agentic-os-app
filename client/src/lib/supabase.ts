import { createClient } from "@supabase/supabase-js";

const config = window.__MANUS_CONFIG__;

export const supabase = createClient(config?.supabaseUrl ?? "", config?.supabaseAnonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
