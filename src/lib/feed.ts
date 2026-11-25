import { createClient } from "@/lib/supabase/server";
import type { PostData, PostComment } from "@/components/feed/PostCard";

export async function getFeedPosts(currentUserId?: string): Promise<PostData[]> {
  try {
    const supabase = await createClient();

    // 1. Fetch published posts with author info
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        slug,
        summary,
        body,
        cover_image_url,
        post_type,
        status,
        visibility,
        is_pinned,
        author_id,
        published_at,
        created_at,
        author:profiles!posts_author_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          roles(code, name)
        )
      `)
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });

    let rawPosts: any[] = postsData ?? [];

    if (postsError) {
      // Fallback query without explicit foreign key constraint name if needed
      const { data: fallbackPosts } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          slug,
          summary,
          body,
          cover_image_url,
          post_type,
          status,
          visibility,
          is_pinned,
          author_id,
          published_at,
          created_at,
          profiles:author_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });

      rawPosts = fallbackPosts ?? [];
    }

    if (rawPosts.length === 0) {
      return [];
    }

    const postIds = rawPosts.map((p) => p.id);

    // 2. Fetch likes counts and user like status safely
    let likesMap = new Map<number, number>();
    let userLikedSet = new Set<number>();

    try {
      const { data: likesData } = await supabase
        .from("post_likes")
        .select("post_id, user_id")
        .in("post_id", postIds);

      if (likesData) {
        likesData.forEach((l) => {
          likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1);
          if (currentUserId && l.user_id === currentUserId) {
            userLikedSet.add(l.post_id);
          }
        });
      }
    } catch {
      // post_likes table may be pending creation
    }

    // 3. Fetch comments safely
    let rawComments: any[] = [];

    try {
      const { data: commentsData } = await supabase
        .from("post_comments")
        .select(`
          id,
          post_id,
          author_id,
          content,
          created_at,
          author:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            roles(code, name)
          )
        `)
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      rawComments = commentsData ?? [];
    } catch {
      // post_comments table may be pending creation
    }

    // 4. Resolve any authors hidden by `profiles` RLS via `public_author_profiles` (or `user_directory` fallback)
    const missingAuthorIds = Array.from(
      new Set([
        ...rawPosts.filter((p) => !p.author && !p.profiles && p.author_id).map((p) => p.author_id),
        ...rawComments.filter((c) => !c.author && c.author_id).map((c) => c.author_id),
      ])
    );

    const dirAuthorMap = new Map<string, any>();
    if (missingAuthorIds.length > 0) {
      try {
        const { data: pubRows, error: pubErr } = await supabase
          .from("public_author_profiles")
          .select("id, first_name, last_name, avatar_url, role_code, role_name")
          .in("id", missingAuthorIds);

        if (!pubErr && pubRows) {
          for (const u of pubRows) {
            dirAuthorMap.set(u.id, {
              id: u.id,
              first_name: u.first_name,
              last_name: u.last_name,
              avatar_url: u.avatar_url,
              roles: u.role_code ? { code: u.role_code, name: u.role_name || u.role_code } : undefined,
            });
          }
        } else if (currentUserId) {
          const { data: dirRows } = await supabase
            .from("user_directory")
            .select("id, first_name, last_name, avatar_url, role_code")
            .in("id", missingAuthorIds);

          for (const u of dirRows ?? []) {
            dirAuthorMap.set(u.id, {
              id: u.id,
              first_name: u.first_name,
              last_name: u.last_name,
              avatar_url: u.avatar_url,
              roles: u.role_code ? { code: u.role_code, name: u.role_code } : undefined,
            });
          }
        }
      } catch {
        // Ignore if author lookup views are unavailable
      }
    }

    const commentsMap = new Map<number, PostComment[]>();
    rawComments.forEach((c: any) => {
      const list = commentsMap.get(c.post_id) || [];
      const resolvedAuthor =
        c.author ||
        (c.author_id ? dirAuthorMap.get(c.author_id) : null) || {
          id: c.author_id || "anon",
          first_name: "Chapter",
          last_name: "Member",
        };
      list.push({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        author: resolvedAuthor,
      });
      commentsMap.set(c.post_id, list);
    });

    return rawPosts.map((p) => {
      const postComments = commentsMap.get(p.id) || [];
      const resolvedAuthor =
        p.author || p.profiles || (p.author_id ? dirAuthorMap.get(p.author_id) : undefined);
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        body: p.body,
        cover_image_url: p.cover_image_url,
        post_type: p.post_type,
        is_pinned: p.is_pinned,
        published_at: p.published_at,
        created_at: p.created_at,
        author: resolvedAuthor,
        likes_count: likesMap.get(p.id) || 0,
        comments_count: postComments.length,
        has_liked: userLikedSet.has(p.id),
        comments: postComments,
      };
    });
  } catch (err) {
    console.error("Error fetching feed posts:", err);
    return [];
  }
}
