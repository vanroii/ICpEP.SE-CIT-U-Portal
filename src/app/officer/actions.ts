"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createEventAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Authentication required" };

    const title = String(formData.get("title") || "").trim();
    const slug =
      String(formData.get("slug") || "").trim() ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const description = String(formData.get("description") || "").trim();
    const venue = String(formData.get("venue") || "").trim();
    const startAt = String(formData.get("start_at") || "");
    const endAt = String(formData.get("end_at") || "").trim() || null;
    const regDeadline = String(formData.get("registration_deadline") || "").trim() || null;
    const capacity = Number(formData.get("capacity")) || null;
    const requiresReg = formData.get("requires_registration") === "on";
    const visibility = String(formData.get("visibility") || "public");
    const status = String(formData.get("status") || "published");

    if (!title || !startAt) {
      return { error: "Event title and start date/time are required." };
    }

    const { error } = await supabase.from("events").insert({
      title,
      slug,
      description,
      venue,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      registration_deadline: regDeadline ? new Date(regDeadline).toISOString() : null,
      capacity,
      requires_registration: requiresReg,
      visibility,
      status,
      created_by: user.id,
    });

    if (error) return { error: error.message };

    revalidatePath("/events");
    revalidatePath("/officer");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create event." };
  }
}

export async function updateEventStatusAction(eventId: number, status: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("events")
      .update({ status })
      .eq("id", eventId);

    if (error) return { error: error.message };

    revalidatePath("/events");
    revalidatePath("/officer");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update event status." };
  }
}

export async function createPostAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Authentication required" };

    const title = String(formData.get("title") || "").trim();
    const slug =
      String(formData.get("slug") || "").trim() ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const postType = String(formData.get("post_type") || "news");
    const summary = String(formData.get("summary") || "").trim();
    const body = String(formData.get("body") || "").trim();
    const visibility = String(formData.get("visibility") || "public");
    const status = String(formData.get("status") || "published");
    const isPinned = formData.get("is_pinned") === "on";

    if (!title || !body) {
      return { error: "Title and content body are required." };
    }

    const { error } = await supabase.from("posts").insert({
      title,
      slug,
      post_type: postType,
      summary,
      body,
      visibility,
      status,
      is_pinned: isPinned,
      author_id: user.id,
    });

    if (error) return { error: error.message };

    revalidatePath("/news");
    revalidatePath("/officer");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create post." };
  }
}

export async function reviewMembershipAction(
  applicationId: number,
  approve: boolean,
  remarks: string,
  membershipNo?: string
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("review_membership_application", {
      p_application_id: applicationId,
      p_approve: approve,
      p_remarks: remarks || null,
      p_membership_no: membershipNo || null,
    });

    if (error) return { error: error.message };

    revalidatePath("/officer");
    revalidatePath("/student");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to review membership application." };
  }
}
