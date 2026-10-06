import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server client — Server Components, Server Actions, Route Handlers. Acts as the signed-in user. */
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(list: Array<{ name: string; value: string; options?: any }>) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* called from a Server Component; the proxy refreshes the session instead */
        }
      },
    },
  });
}
