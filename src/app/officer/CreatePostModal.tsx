"use client";

import { useState } from "react";
import { createPostAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, X, BookOpen } from "lucide-react";

export function CreatePostModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await createPostAction(formData);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="sm"
        className="font-bold shadow-xs whitespace-nowrap"
      >
        <Plus className="w-4 h-4 mr-1" />
        New Announcement
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eeeb]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#e3f6fc] text-[#0a7db0]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#1b1613]">New Post / Circular</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8c8785] hover:text-[#1b1613] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Post Title" name="title" required placeholder="e.g. Schedule of Midterm Review Sessions" />
              <Input label="Custom Slug (Optional)" name="slug" placeholder="e.g. schedule-midterm-reviews-2026" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
                    Post Type
                  </label>
                  <select
                    name="post_type"
                    defaultValue="announcement"
                    className="w-full px-3.5 py-2 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="news">News Article</option>
                    <option value="update">Operational Update</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue="published"
                    className="w-full px-3.5 py-2 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
                  Brief Summary
                </label>
                <input
                  name="summary"
                  placeholder="Short one-line summary for preview feeds..."
                  className="w-full px-3.5 py-2 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
                  Full Content Body <span className="text-[#bf2626]">*</span>
                </label>
                <textarea
                  name="body"
                  rows={5}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
                  placeholder="Enter full announcement details, guidelines, or article text..."
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-[#45403d]">
                <input
                  type="checkbox"
                  name="is_pinned"
                  className="rounded border-[#e0dedb] text-[#1ca7e0]"
                />
                Pin this post to the top of announcements feed
              </label>

              {error && (
                <p className="text-xs text-[#bf2626] font-medium bg-[#fae6e6] p-2.5 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading} className="font-bold">
                  Publish Post
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
