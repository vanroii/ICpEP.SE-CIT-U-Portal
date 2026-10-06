"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registerEventAction(eventId: number, slug: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be logged in to register for events." };
    }

    const { error } = await supabase.rpc("register_for_event", {
      p_event_id: eventId,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/events/${slug}`);
    revalidatePath("/events");
    revalidatePath("/student");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred during registration." };
  }
}

export async function cancelEventAction(eventId: number, slug: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be logged in to modify registration." };
    }

    const { error } = await supabase.rpc("cancel_event_registration", {
      p_event_id: eventId,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/events/${slug}`);
    revalidatePath("/events");
    revalidatePath("/student");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to cancel event registration." };
  }
}
