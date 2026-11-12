"use server";

import { createClient } from "@/lib/supabase/server";

type RegisterResult = { error?: string; ok?: boolean; autoSignedIn?: boolean };

/** Shared core registration logic */
async function registerCore(
  formData: FormData,
  roleHint: "student" | "faculty"
): Promise<RegisterResult> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");
  const firstName = String(formData.get("first_name") || "").trim();
  const middleName = String(formData.get("middle_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const mobileNumber = String(formData.get("mobile_number") || "").trim();

  // Validate required fields
  if (!email || !password || !firstName || !lastName) {
    return { error: "Please complete all required fields." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }
  // Validate mobile number format if provided
  if (mobileNumber && !/^(\+63|0)[0-9]{9,10}$/.test(mobileNumber)) {
    return { error: "Mobile number must be a valid PH format (e.g. 09171234567 or +639171234567)." };
  }

  // Student-specific fields
  const studentNumber = String(formData.get("student_number") || "").trim();
  const yearAndSection = String(formData.get("year_and_section") || "").trim();
  const match = yearAndSection.match(/(\d+)/);
  const yearLevel = match ? Number(match[1]) : 1;
  const claimsMembership = formData.get("claims_membership") === "on";
  const membershipNo = String(formData.get("membership_no") || "").trim();

  // Faculty-specific fields
  const employeeId = String(formData.get("employee_id") || "").trim();
  const department = String(formData.get("department") || "").trim();

  if (roleHint === "student" && !studentNumber) {
    return { error: "Student ID is required." };
  }

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const metadata: Record<string, any> = {
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      mobile_number: mobileNumber || null,
      role: roleHint === "faculty" ? "faculty" : "student",
    };

    if (roleHint === "student") {
      metadata.student_number = studentNumber || null;
      metadata.program = "BS Computer Engineering";
      metadata.year_level = yearLevel;
      metadata.claims_membership = claimsMembership;
      metadata.membership_no = membershipNo || null;
    } else {
      metadata.employee_id = employeeId || null;
      metadata.department = department || null;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: metadata,
      },
    });

    if (signUpError) {
      return { error: signUpError.message };
    }

    if (signUpData.session) {
      if (roleHint === "faculty") {
        try {
          await supabase.rpc("sync_user_role");
        } catch {
          // Non-fatal if rpc not deployed yet
        }
      }
      return { ok: true, autoSignedIn: true };
    }

    return { ok: true, autoSignedIn: false };
  } catch (err: any) {
    return { error: err.message || "Failed to register account." };
  }
}

export async function registerStudent(
  _prev: RegisterResult | undefined,
  formData: FormData
): Promise<RegisterResult> {
  return registerCore(formData, "student");
}

export async function registerFaculty(
  _prev: RegisterResult | undefined,
  formData: FormData
): Promise<RegisterResult> {
  return registerCore(formData, "faculty");
}

// Backward-compat alias used by old /register page
export async function register(
  _prev: RegisterResult | undefined,
  formData: FormData
): Promise<RegisterResult> {
  return registerCore(formData, "student");
}
