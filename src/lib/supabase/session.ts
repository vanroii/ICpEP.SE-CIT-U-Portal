import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { RoleCode } from "@/lib/roles";

/** Refreshes the auth cookie and returns the user + role for the proxy to gate routes. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes("your-project-ref") || url.includes("placeholder")) {
    return { response, user: null, role: null };
  }

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list: Array<{ name: string; value: string; options?: any }>) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    let role: RoleCode | null = null;

    if (user) {
      // auth_role() returns NULL for deactivated accounts (BR-08)
      const { data } = await supabase.rpc("auth_role");
      role = (data as RoleCode | null) ?? null;
    }
    return { response, user, role };
  } catch (error) {
    console.error("Session update error:", error);
    return { response, user: null, role: null };
  }
}
