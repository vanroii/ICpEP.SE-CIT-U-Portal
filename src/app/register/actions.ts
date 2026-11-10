"use server";

import { createClient } from "@/lib/supabase/server";

export async function register(
  _prev: { error?: string; ok?: boolean; autoSignedIn?: boolean } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const nameParts = fullName.includes(",")
    ? fullName.split(",").map((part) => part.trim())
    : fullName.split(/\s+/).reverse();
  const lastName = nameParts[0] || "";
  const firstName = nameParts.slice(1).reverse().join(" ");
  const middleName = String(formData.get("middle_name") || "").trim();
  const studentNumber = String(formData.get("student_number") || "").trim();
  const program = String(formData.get("program") || "BS Computer Engineering").trim();
  const yearAndSection = String(formData.get("year_and_section") || "").trim();
  const yearLevel = Number(yearAndSection.match(/-(\d+)$/)?.[1] || 0);
  const contactNumber = String(formData.get("contact_number") || "").trim();
  const claimsMembership = formData.get("claims_membership") === "on";
  const membershipNo = String(formData.get("membership_no") || "").trim();

  if (!email || !password || !firstName || !lastName || !studentNumber || !yearLevel) {
    return { error: "Please complete all required fields." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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

    if (signUpData.session) {
      return { ok: true, autoSignedIn: true };
    }

    return { ok: true, autoSignedIn: false };
  } catch (err: any) {
    return { error: err.message || "Failed to register account." };
  }
}
