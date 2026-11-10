"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Authentication required" };

    const firstName = String(formData.get("first_name") || "").trim();
    const middleName = String(formData.get("middle_name") || "").trim();
    const lastName = String(formData.get("last_name") || "").trim();
    const contactNumber = String(formData.get("contact_number") || "").trim();
    const bio = String(formData.get("bio") || "").trim();

    if (!firstName || !lastName) {
      return { error: "First name and last name are required." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        contact_number: contactNumber || null,
        bio: bio || null,
      })
      .eq("id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/profile");
    revalidatePath("/student");
    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update profile." };
  }
}

export async function changePasswordAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm_password") || "");

    if (password.length < 8) {
      return { error: "New password must be at least 8 characters long." };
    }
    if (password !== confirm) {
      return { error: "Passwords do not match." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update password." };
  }
}
