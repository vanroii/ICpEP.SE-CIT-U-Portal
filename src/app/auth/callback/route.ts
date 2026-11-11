import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { DASHBOARD_BY_ROLE, type RoleCode } from "@/lib/roles";

/** E-mail verification link lands here (FR-03, SR-01). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: role } = await supabase.rpc("auth_role");
      const destination = next || (role ? DASHBOARD_BY_ROLE[role as RoleCode] : "/student");
      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const { data: role } = await supabase.rpc("auth_role");
      const destination = next || (role ? DASHBOARD_BY_ROLE[role as RoleCode] : "/student");
      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?verified=1", origin));
}
