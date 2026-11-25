"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  Pin,
  Clock,
  Send,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react";
import { toggleLikeAction, addCommentAction, deleteCommentAction } from "@/app/actions/postInteractions";

export interface PostComment {
  id: number;
  content: string;
  created_at: string;
  author: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
    roles?: { code: string; name: string } | null;
  };
}

export interface PostData {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  body: string;
  cover_image_url?: string | null;
  post_type: string;
  is_pinned?: boolean;
  published_at?: string | null;
  created_at?: string;
  author?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
    roles?: { code: string; name: string } | null;
  } | null;
  profiles?: {
    first_name?: string;
    last_name?: string;
  } | null;
  likes_count?: number;
  comments_count?: number;
  has_liked?: boolean;
  comments?: PostComment[];
}

interface PostCardProps {
  post: PostData;
  currentUser: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
}

export function PostCard({ post, currentUser }: PostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
  const [isLiked, setIsLiked] = useState(post.has_liked ?? false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);

  const [comments, setComments] = useState<PostComment[]>(post.comments ?? []);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedBody, setExpandedBody] = useState(false);

  const authorName = post.author
    ? `${post.author.first_name || ""} ${post.author.last_name || ""}`.trim()
    : post.profiles
    ? `${post.profiles.first_name || ""} ${post.profiles.last_name || ""}`.trim()
    : "ICpEP.SE Official";

  const authorRoleCode = post.author?.roles?.code || "officer";
  const authorRoleLabel =
    authorRoleCode === "faculty"
      ? "Faculty Adviser"
      : authorRoleCode === "admin"
      ? "Administrator"
      : "Chapter Officer";

  const authorInitial = (post.author?.first_name || authorName || "I").charAt(0).toUpperCase();

  const handleLike = async () => {
    if (!currentUser) {
      alert("Please sign in to like posts.");
      return;
    }
    // Optimistic update
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);

    const res = await toggleLikeAction(post.id);
    if (res.error) {
      // Revert if error
      setIsLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    } else if (res.count !== undefined) {
      setLikesCount(res.count);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    }
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 800);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please sign in to comment.");
      return;
    }
    if (!commentText.trim()) return;

    setCommenting(true);
    const text = commentText.trim();
    setCommentText("");

    // Optimistic comment
    const tempId = Date.now();
    const optimisticComment: PostComment = {
      id: tempId,
      content: text,
      created_at: new Date().toISOString(),
      author: {
        id: currentUser.id,
        first_name: currentUser.name.split(" ")[0] || "User",
        last_name: currentUser.name.split(" ").slice(1).join(" ") || "",
        avatar_url: currentUser.avatarUrl,
        roles: { code: currentUser.role, name: currentUser.role },
      },
    };

    setComments((prev) => [...prev, optimisticComment]);

    const res = await addCommentAction(post.id, text);
    setCommenting(false);

    if (res.error) {
      // Remove optimistic comment
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      alert(res.error);
    } else if (res.comment) {
      // Replace with real comment
      const raw = res.comment as any;
      const normalized: PostComment = {
        ...raw,
        author: Array.isArray(raw.author) ? raw.author[0] : raw.author,
      };
      setComments((prev) => prev.map((c) => (c.id === tempId ? normalized : c)));
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await deleteCommentAction(commentId);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/news/${post.slug}` : "";
    if (navigator.clipboard && url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = post.published_at || post.created_at
    ? new Date(post.published_at || post.created_at!).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Recently";

  const isLongBody = post.body && post.body.length > 220;

  return (
    <article className="bg-white border border-border-default rounded-[20px] overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-[#F0EEEB]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm ring-2 ring-cyan-50 shrink-0">
              {authorInitial}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                authorRoleCode === "faculty" ? "bg-status-post-officer" : "bg-cyan-600"
              }`}
              title={authorRoleLabel}
            />
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[14px] text-ink-900 truncate hover:text-cyan-600 transition-colors">
                {authorName}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  authorRoleCode === "faculty"
                    ? "bg-status-post-officer-bg text-[#92400E]"
                    : "bg-cyan-50 text-cyan-600"
                }`}
              >
                {authorRoleLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-500 mt-0.5">
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="capitalize">{post.post_type}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {post.is_pinned && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full">
              <Pin className="w-3 h-3 fill-current" />
              Pinned
            </span>
          )}
        </div>
      </div>

      {/* Post Photo / Cover Media (Instagram Style) */}
      {post.cover_image_url && (
        <div
          onDoubleClick={handleDoubleTap}
          className="relative w-full aspect-16/10 sm:aspect-16/9 bg-ink-900/5 overflow-hidden select-none cursor-pointer group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />

          {/* Double tap heart animation */}
          {showHeartOverlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 animate-ping duration-300 pointer-events-none">
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-lg" />
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Title */}
        <h3 className="text-[17px] font-bold text-ink-900 leading-snug">
          <Link href={`/news/${post.slug}`} className="hover:text-cyan-600 transition-colors">
            {post.title}
          </Link>
        </h3>

        {/* Caption / Content body */}
        <div className="text-[14px] text-[#423C38] leading-relaxed whitespace-pre-line">
          {isLongBody && !expandedBody ? (
            <>
              {post.body.slice(0, 220)}...
              <button
                type="button"
                onClick={() => setExpandedBody(true)}
                className="text-cyan-600 font-semibold text-xs ml-1 hover:underline inline-block"
              >
                more
              </button>
            </>
          ) : (
            <>
              {post.body}
              {isLongBody && (
                <button
                  type="button"
                  onClick={() => setExpandedBody(false)}
                  className="text-text-500 font-semibold text-xs ml-1 hover:underline inline-block"
                >
                  less
                </button>
              )}
            </>
          )}
        </div>

        {/* Instagram Engagement Action Row */}
        <div className="pt-2 border-t border-[#F0EEEB] flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-transform active:scale-90 ${
                isLiked ? "text-[#E11D48]" : "text-text-600 hover:text-[#E11D48]"
              }`}
              title={isLiked ? "Unlike" : "Like"}
            >
              <Heart
                className={`w-6 h-6 transition-all ${
                  isLiked ? "fill-[#E11D48] text-[#E11D48]" : ""
                } ${likeAnimating ? "scale-125" : "scale-100"}`}
              />
              <span className="text-xs font-bold text-ink-900">
                {likesCount} {likesCount === 1 ? "like" : "likes"}
              </span>
            </button>

            {/* Comment Button */}
            <button
              type="button"
              onClick={() => setShowAllComments((prev) => !prev)}
              className="flex items-center gap-1.5 text-text-600 hover:text-cyan-600 transition-colors"
              title="Comment"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-bold text-ink-900">
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </span>
            </button>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1 text-xs font-semibold text-text-500 hover:text-cyan-600 transition-colors p-1 rounded-lg"
            title="Share post"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-status-success" />
                <span className="text-status-success text-[11px] font-bold">Link copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="text-[11px]">Share</span>
              </>
            )}
          </button>
        </div>

        {/* Comments Section */}
        <div className="pt-2 space-y-2.5">
          {comments.length > 2 && !showAllComments && (
            <button
              type="button"
              onClick={() => setShowAllComments(true)}
              className="text-xs font-medium text-text-500 hover:text-ink-900 transition-colors"
            >
              View all {comments.length} comments
            </button>
          )}

          {/* Comments list */}
          <div className="space-y-2">
            {(showAllComments ? comments : comments.slice(-2)).map((c) => {
              const cName = c.author
                ? `${c.author.first_name || ""} ${c.author.last_name || ""}`.trim()
                : "Member";
              const isOwner = currentUser?.id === c.author?.id;
              const isStaff = currentUser?.role === "officer" || currentUser?.role === "faculty";

              return (
                <div key={c.id} className="flex items-start justify-between gap-2 text-xs group">
                  <div className="flex-1 leading-snug">
                    <span className="font-bold text-ink-900 mr-1.5">{cName}</span>
                    <span className="text-[#423C38]">{c.content}</span>
                  </div>
                  {(isOwner || isStaff) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-text-mute hover:text-[#bf2626] opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="pt-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#E5E0DC] text-ink-900 flex items-center justify-center font-bold text-[11px] shrink-0">
              {currentUser?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                placeholder={currentUser ? "Add a comment..." : "Sign in to comment..."}
                disabled={!currentUser || commenting}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full h-8 pl-3 pr-10 text-xs bg-surface-50 border border-border-default rounded-full focus:bg-white focus:border-cyan-600 outline-none transition-colors"
              />
              {commentText.trim() && (
                <button
                  type="submit"
                  disabled={commenting}
                  className="absolute right-2 text-xs font-bold text-cyan-600 hover:text-[#006f94] transition-colors"
                >
                  Post
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </article>
  );
}
