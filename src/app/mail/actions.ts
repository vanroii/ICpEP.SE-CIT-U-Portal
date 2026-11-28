"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAIL_ROLES = ["officer", "member", "faculty"];
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function getAuthedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null };
  const { data: role } = await supabase.rpc("auth_role");
  return { supabase, user, role: role as string | null };
}

// ── Send a new mail (or reply/forward) ───────────────────────────────────────
export async function sendMailAction(
  recipientIds: string[],
  subject: string,
  body: string,
  parentId?: number | null,
  draftId?: number | null
) {
  try {
    const { supabase, user, role } = await getAuthedUser();
    if (!user || !role) return { error: "Authentication required." };
    if (!MAIL_ROLES.includes(role)) return { error: "Your role cannot send mail." };
    if (!recipientIds.length) return { error: "Please select at least one recipient." };
    if (!subject.trim() || !body.trim()) return { error: "Subject and body are required." };

    const { data, error } = await supabase.rpc("send_mail_message", {
      p_recipient_ids: recipientIds,
      p_subject: subject.trim(),
      p_body: body.trim(),
      p_parent_id: parentId ?? null,
    });
    if (error) return { error: error.message };

    if (draftId) {
      const { error: finalizeError } = await supabase.rpc("finalize_mail_draft_send", {
        p_draft_id: draftId,
        p_message_id: data,
      });
      if (finalizeError) return { error: `Mail sent, but its draft could not be finalized: ${finalizeError.message}` };
    }

    revalidatePath("/mail");
    return { success: true, messageId: data as number };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to send mail.") };
  }
}

// ── Save / update a draft ─────────────────────────────────────────────────────
export async function saveDraftAction(
  draftId: number | null,
  toIds: string[],
  subject: string,
  body: string,
  parentId: number | null = null,
  isForward: boolean = false
) {
  try {
    const { supabase, user, role } = await getAuthedUser();
    if (!user || !role) return { error: "Authentication required." };
    if (!MAIL_ROLES.includes(role)) return { error: "Your role cannot use mail." };

    const draftValues = {
      to_ids: toIds,
      subject,
      body,
      parent_id: parentId,
      is_forward: isForward,
      updated_at: new Date().toISOString(),
    };

    if (draftId) {
      const { data, error } = await supabase
        .from("mail_drafts")
        .update(draftValues)
        .eq("id", draftId)
        .eq("owner_id", user.id)
        .select("id")
        .maybeSingle();
      if (error) {
        if (error.code === "PGRST205" || error.code === "42P01") {
          return { error: "Mail drafts are not set up in Supabase yet. Apply supabase/migrations/0007_mail_system.sql, then retry." };
        }
        return { error: error.message };
      }
      if (data) {
        revalidatePath("/mail");
        return { success: true, draftId: Number(data.id) };
      }
    }

    const { data, error } = await supabase
      .from("mail_drafts")
      .insert({ ...draftValues, owner_id: user.id })
      .select("id")
      .single();
    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        return { error: "Mail drafts are not set up in Supabase yet. Apply supabase/migrations/0007_mail_system.sql, then retry." };
      }
      return { error: error.message };
    }

    revalidatePath("/mail");
    return { success: true, draftId: Number(data.id) };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to save draft.") };
  }
}

// ── Delete a draft ────────────────────────────────────────────────────────────
export async function deleteDraftAction(draftId: number) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) return { error: "Authentication required." };
    const { data: attachments, error: lookupError } = await supabase
      .from("mail_attachments")
      .select("object_path")
      .eq("draft_id", draftId)
      .eq("owner_id", user.id);
    if (lookupError) return { error: lookupError.message };
    if (attachments?.length) {
      const { error: storageError } = await supabase.storage
        .from("mail-attachments")
        .remove(attachments.map((attachment) => attachment.object_path));
      if (storageError) return { error: storageError.message };
    }
    const { error } = await supabase.rpc("delete_draft", { p_draft_id: draftId });
    if (error) return { error: error.message };
    revalidatePath("/mail");
    return { success: true };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to delete draft.") };
  }
}

export async function registerMailAttachmentAction(
  draftId: number,
  objectPath: string,
  fileName: string,
  contentType: string,
  sizeBytes: number,
) {
  try {
    const { supabase, user, role } = await getAuthedUser();
    if (!user || !role) return { error: "Authentication required." };
    if (!MAIL_ROLES.includes(role)) return { error: "Your role cannot use mail." };
    if (!objectPath.startsWith(`${user.id}/`) || sizeBytes < 1 || sizeBytes > MAX_ATTACHMENT_SIZE) {
      return { error: "Invalid attachment." };
    }

    const { data, error } = await supabase.from("mail_attachments").insert({
      owner_id: user.id,
      draft_id: draftId,
      object_path: objectPath,
      file_name: fileName.slice(0, 255),
      content_type: contentType.slice(0, 255) || "application/octet-stream",
      size_bytes: sizeBytes,
    }).select("id").single();
    if (error) return { error: error.message };
    revalidatePath("/mail");
    return { success: true, attachmentId: data.id as number };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to attach file.") };
  }
}

export async function removeMailAttachmentAction(attachmentId: number) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) return { error: "Authentication required." };
    const { data: attachment, error: lookupError } = await supabase
      .from("mail_attachments")
      .select("id, object_path")
      .eq("id", attachmentId)
      .eq("owner_id", user.id)
      .not("draft_id", "is", null)
      .maybeSingle();
    if (lookupError) return { error: lookupError.message };
    if (!attachment) return { error: "Attachment not found." };

    const { error: storageError } = await supabase.storage
      .from("mail-attachments")
      .remove([attachment.object_path]);
    if (storageError) return { error: storageError.message };
    const { error } = await supabase.from("mail_attachments").delete().eq("id", attachment.id);
    if (error) return { error: error.message };
    revalidatePath("/mail");
    return { success: true };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to remove attachment.") };
  }
}

export async function getMailAttachmentUrlAction(attachmentId: number) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) return { error: "Authentication required." };
    const { data: attachment, error: lookupError } = await supabase
      .from("mail_attachments")
      .select("object_path")
      .eq("id", attachmentId)
      .maybeSingle();
    if (lookupError) return { error: lookupError.message };
    if (!attachment) return { error: "Attachment not found." };

    const { data, error } = await supabase.storage
      .from("mail-attachments")
      .createSignedUrl(attachment.object_path, 60);
    if (error) return { error: error.message };
    return { url: data.signedUrl };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to download attachment.") };
  }
}

export async function scheduleMailAction(
  recipientIds: string[],
  subject: string,
  body: string,
  sendAt: string,
  draftId: number | null,
  parentId: number | null = null,
) {
  try {
    const { supabase, user, role } = await getAuthedUser();
    if (!user || !role) return { error: "Authentication required." };
    if (!MAIL_ROLES.includes(role)) return { error: "Your role cannot schedule mail." };
    if (!recipientIds.length) return { error: "Please select at least one recipient." };

    const { data, error } = await supabase.rpc("schedule_mail", {
      p_recipient_ids: recipientIds,
      p_subject: subject.trim(),
      p_body: body.trim(),
      p_send_at: sendAt,
      p_draft_id: draftId,
      p_parent_id: parentId,
    });
    if (error) return { error: error.message };
    revalidatePath("/mail");
    return { success: true, scheduledId: data as number };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to schedule mail.") };
  }
}

// ── Toggle star on received mail ──────────────────────────────────────────────
export async function toggleStarAction(messageId: number) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) return { error: "Authentication required." };
    const { data, error } = await supabase.rpc("toggle_mail_star", { p_message_id: messageId });
    if (error) return { error: error.message };
    revalidatePath("/mail");
    return { success: true, starred: data as boolean };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to toggle star.") };
  }
}

// ── Move message to trash (soft delete) ───────────────────────────────────────
export async function trashMailAction(messageId: number) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) return { error: "Authentication required." };
    const { error } = await supabase.rpc("set_mail_folder", { p_message_id: messageId, p_folder: "trash" });
    if (error) return { error: error.message };
    revalidatePath("/mail");
    return { success: true };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to trash mail.") };
  }
}

// ── Restore from trash ────────────────────────────────────────────────────────
export async function restoreMailAction(messageId: number) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) return { error: "Authentication required." };
    const { error } = await supabase.rpc("set_mail_folder", { p_message_id: messageId, p_folder: "inbox" });
    if (error) return { error: error.message };
    revalidatePath("/mail");
    return { success: true };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to restore mail.") };
  }
}

// ── Permanently delete from trash ─────────────────────────────────────────────
export async function permanentDeleteMailAction(messageId: number) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) return { error: "Authentication required." };
    const { error } = await supabase.rpc("permanent_delete_mail", { p_message_id: messageId });
    if (error) return { error: error.message };
    revalidatePath("/mail");
    return { success: true };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Failed to permanently delete mail.") };
  }
}

// ── Mark message as read ──────────────────────────────────────────────────────
export async function markMailReadAction(messageId: number) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) return { success: false };
    await supabase.rpc("mark_message_read", { p_message_id: messageId });
    revalidatePath("/mail");
    return { success: true };
  } catch {
    return { success: false };
  }
}

