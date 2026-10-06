"use server";

import { createClient } from "@/lib/supabase/server";

export async function register(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const firstName = String(formData.get("first_name") || "").trim();
  const middleName = String(formData.get("middle_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const studentNumber = String(formData.get("student_number") || "").trim();
  const program = String(formData.get("program") || "BS Computer Engineering").trim();
  const yearLevel = Number(formData.get("year_level") || 1);
  const contactNumber = String(formData.get("contact_number") || "").trim();
  const claimsMembership = formData.get("claims_membership") === "on";
  const membershipNo = String(formData.get("membership_no") || "").trim();

  if (!email || !password || !firstName || !lastName) {
    return { error: "Please complete all required fields." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        // metadata read by the handle_new_user() database trigger (BR-02, BR-03)
        data: {
          first_name: firstName,
          middle_name: middleName || null,
          last_name: lastName,
          student_number: studentNumber || null,
          program: program,
          year_level: yearLevel,
          contact_number: contactNumber || null,
          claims_membership: claimsMembership,
          membership_no: membershipNo || null,
        },
      },
    });

    if (signUpError) {
      return { error: signUpError.message };
    }

    return { ok: true };
  } catch (err: any) {
    return { error: err.message || "Failed to register account." };
  }
}
