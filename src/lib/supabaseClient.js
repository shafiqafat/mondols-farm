import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Loud failure on purpose — a silently-missing key means every Farm OS
  // screen fails in confusing ways instead of one clear message here.
  console.error(
    "Missing Supabase env vars. Check .env.local (dev) or your Vercel " +
      "project's Environment Variables (production): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
