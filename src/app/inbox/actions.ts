"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessageAction(
  recipientIds: string[],
  subject: string,
  body: string,
  parentId?: number
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Authentication required" };
    if (!recipientIds.length) return { error: "Please select at least one recipient." };
    if (!subject || !body) return { error: "Subject and message body are required." };

    const { data, error } = await supabase.rpc("send_message", {
      p_recipient_ids: recipientIds,
      p_subject: subject,
      p_body: body,
      p_parent_id: parentId || null,
    });

    if (error) return { error: error.message };

    revalidatePath("/inbox");
    return { success: true, messageId: data };
  } catch (err: any) {
    return { error: err.message || "Failed to send message." };
  }
}

export async function markMessageReadAction(messageId: number) {
  try {
    const supabase = await createClient();
    await supabase.rpc("mark_message_read", { p_message_id: messageId });
    revalidatePath("/inbox");
    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteMessageAction(messageId: number) {
  try {
    const supabase = await createClient();
    await supabase.rpc("delete_message", { p_message_id: messageId });
    revalidatePath("/inbox");
    return { success: true };
  } catch {
    return { success: false };
  }
}
