"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function adminSetRoleAction(userId: string, roleCode: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_set_role", {
      p_user_id: userId,
      p_role_code: roleCode,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update role." };
  }
}

export async function adminSetActiveAction(userId: string, active: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_set_active", {
      p_user_id: userId,
      p_active: active,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to toggle account activation." };
  }
}

export async function adminUpdateSettingsAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const entries = Array.from(formData.entries());

    for (const [key, value] of entries) {
      if (typeof value === "string") {
        await supabase
          .from("site_settings")
          .upsert({ key, value, updated_at: new Date().toISOString() });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/about");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update site settings." };
  }
}
