import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Farm OS cannot start because VITE_SUPABASE_URL and " +
      "VITE_SUPABASE_ANON_KEY are missing. Check .env.local in development " +
      "or your Vercel Environment Variables in production.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
