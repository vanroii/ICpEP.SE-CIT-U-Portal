import { createBrowserClient } from "@supabase/ssr";

/** Browser client — Client Components only. Uses the anon key; RLS protects the data. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  return createBrowserClient(url, anonKey);
}
