"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitMembershipApplication(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be logged in to apply for membership." };
    }

    const claimedNo = String(formData.get("claimed_membership_no") || "").trim() || null;

    // Get current school year
    const { data: sy } = await supabase
      .from("school_years")
      .select("id")
      .eq("is_current", true)
      .maybeSingle();

    if (!sy) {
      return { error: "No active school year found for membership application." };
    }

    const { error } = await supabase.from("membership_applications").insert({
      applicant_id: user.id,
      school_year_id: sy.id,
      claimed_membership_no: claimedNo,
      status: "pending",
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/student");
    revalidatePath("/profile");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to submit membership application." };
  }
}
