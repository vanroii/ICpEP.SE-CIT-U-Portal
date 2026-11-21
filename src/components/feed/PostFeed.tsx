"use client";

import React, { useState } from "react";
import { PostCard, type PostData } from "./PostCard";
import { CreatePostModal } from "@/app/officer/CreatePostModal";
import {
  Sparkles,
  BookOpen,
  Pin,
  Bell,
  SlidersHorizontal,
  Flame,
} from "lucide-react";

interface PostFeedProps {
  posts: PostData[];
  currentUser: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  canPost: boolean;
}

export function PostFeed({ posts, currentUser, canPost }: PostFeedProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredPosts = posts.filter((post) => {
    if (filter === "all") return true;
    if (filter === "pinned") return post.is_pinned;
    return post.post_type?.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="w-full max-w-[680px] mx-auto space-y-6">
      {/* Top Creation Bar (Officer & Faculty Only) */}
      {canPost ? (
        <div className="bg-white border border-[#DEDBD8] rounded-[20px] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#19A7D5] text-[#12191C] flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser?.name?.charAt(0).toUpperCase() || "O"}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-[#1C1713]">
                Post as {currentUser?.role === "faculty" ? "Faculty Adviser" : "Chapter Officer"}
              </p>
              <p className="text-[11px] text-[#817B77]">
                Share announcements, photos, or operational news with chapter students
              </p>
            </div>
            <CreatePostModal buttonLabel="Create Post" />
          </div>
        </div>
      ) : (
        <div className="bg-[#E3F6FC]/60 border border-[#BDE8F7] rounded-[16px] p-4 flex items-center gap-3 text-xs text-[#0087B5]">
          <Sparkles className="w-5 h-5 shrink-0 text-[#0087B5]" />
          <div>
            <span className="font-bold">Official Chapter Feed:</span> Verified news, announcements, and notices directly published by ICpEP.SE Chapter Officers and Faculty Advisers.
          </div>
        </div>
      )}

      {/* Feed Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: "All Posts" },
          { id: "announcement", label: "Announcements" },
          { id: "news", label: "News" },
          { id: "update", label: "Updates" },
          { id: "pinned", label: "Pinned" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === tab.id
                ? "bg-[#1C1713] text-white"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713] hover:bg-[#FAF9F8]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts Stream */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#DEDBD8] rounded-[20px] p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-[#817B77] mx-auto opacity-40" />
          <h4 className="text-base font-bold text-[#1C1713]">No posts to display</h4>
          <p className="text-xs text-[#817B77] max-w-sm mx-auto">
            {canPost
              ? "Start by publishing the first official announcement or news update for your chapter students."
              : "Check back soon! Chapter officers and faculty advisers will post updates here."}
          </p>
          {canPost && (
            <div className="pt-2">
              <CreatePostModal buttonLabel="Publish First Post" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
