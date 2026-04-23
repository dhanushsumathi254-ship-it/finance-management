import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://kftezngkdhvchgohjruh.supabase.co",
  supabaseAnonKey || "sb_publishable_RR6wBo2QMScebj5BFngv-Q_qqR2UiR7",
);

console.log(supabaseUrl);
