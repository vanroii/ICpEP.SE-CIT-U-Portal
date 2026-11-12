"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DASHBOARD_BY_ROLE, type RoleCode } from "@/lib/roles";

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const identifier = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!identifier || !password) {
    return { error: "Please enter both your e-mail or student number and password." };
  }

  try {
    const supabase = await createClient();

    // Resolve student number to email if not containing '@'
    let email = identifier;
    if (!identifier.includes("@")) {
      try {
        const { data: resolvedEmail } = await supabase.rpc("get_email_for_identifier", {
          p_identifier: identifier,
        });
        if (resolvedEmail) {
          email = resolvedEmail;
        }
      } catch {
        // Fallback to identifier if RPC not yet created
      }
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return {
        error: "Invalid e-mail, student number or password, or the account e-mail has not yet been verified.",
      };
    }

    // Auto-heal faculty role if user signed up with role 'faculty'
    if (signInData?.user?.user_metadata?.role === "faculty") {
      try {
        await supabase.rpc("sync_user_role");
      } catch {
        // Non-fatal if rpc not deployed
      }
    }

    // Check account status and role
    const { data: role } = await supabase.rpc("auth_role");

    if (!role) {
      await supabase.auth.signOut();
      return { error: "This account has been deactivated. Please contact an administrator." }; // BR-08
    }

    // Audit login activity
    try {
      await supabase.rpc("log_activity", { p_action: "user.login" });
    } catch {
      // Non-fatal if audit trigger already logged
    }

    const targetUrl = next.startsWith("/") ? next : DASHBOARD_BY_ROLE[role as RoleCode] || "/student";
    redirect(targetUrl);
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    return { error: err?.message || "An unexpected error occurred during login." };
  }
}
