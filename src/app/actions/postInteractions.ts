"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleLikeAction(postId: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "You must be signed in to like a post." };
    }

    // Check if like exists
    const { data: existing, error: checkError } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      // If table doesn't exist yet in database
      console.warn("post_likes table check error:", checkError.message);
      return { error: checkError.message };
    }

    let liked = false;
    if (existing) {
      // Remove like
      const { error: deleteError } = await supabase
        .from("post_likes")
        .delete()
        .eq("id", existing.id);
      if (deleteError) return { error: deleteError.message };
      liked = false;
    } else {
      // Add like
      const { error: insertError } = await supabase
        .from("post_likes")
        .insert({
          post_id: postId,
          user_id: user.id,
        });
      if (insertError) return { error: insertError.message };
      liked = true;
    }

    // Get updated like count
    const { count } = await supabase
      .from("post_likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);

    revalidatePath("/officer");
    revalidatePath("/faculty");
    revalidatePath("/student");
    revalidatePath("/news");

    return { success: true, liked, count: count ?? 0 };
  } catch (err: any) {
    return { error: err.message || "Failed to toggle like." };
  }
}

export async function addCommentAction(postId: number, content: string) {
  try {
    const trimmed = content.trim();
    if (!trimmed) {
      return { error: "Comment cannot be empty." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "You must be signed in to comment." };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        author_id: user.id,
        content: trimmed,
      })
      .select("id, content, created_at, author:profiles!post_comments_author_id_fkey(id, first_name, last_name, avatar_url, roles(code, name))")
      .single();

    if (insertError) {
      // Fallback if foreign key naming is default
      const { data: fallbackInserted, error: fallbackError } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          author_id: user.id,
          content: trimmed,
        })
        .select("id, content, created_at, author:profiles(id, first_name, last_name, avatar_url)")
        .single();

      if (fallbackError) {
        return { error: fallbackError.message };
      }

      revalidatePath("/officer");
      revalidatePath("/faculty");
      revalidatePath("/student");
      revalidatePath("/news");
      return { success: true, comment: fallbackInserted };
    }

    revalidatePath("/officer");
    revalidatePath("/faculty");
    revalidatePath("/student");
    revalidatePath("/news");

    return { success: true, comment: inserted };
  } catch (err: any) {
    return { error: err.message || "Failed to add comment." };
  }
}

export async function deleteCommentAction(commentId: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Authentication required." };

    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);

    if (error) return { error: error.message };

    revalidatePath("/officer");
    revalidatePath("/faculty");
    revalidatePath("/student");
    revalidatePath("/news");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete comment." };
  }
}
