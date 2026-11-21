"use client";

import { useState, useRef } from "react";
import { createPostAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, X, BookOpen, Image as ImageIcon, Sparkles } from "lucide-react";

export function CreatePostModal({ buttonLabel = "New Announcement" }: { buttonLabel?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (imageUrl) {
      formData.set("cover_image_url", imageUrl);
    }
    const res = await createPostAction(formData);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setImageUrl("");
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="sm"
        className="font-bold shadow-xs whitespace-nowrap flex items-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        {buttonLabel}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eeeb]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#e3f6fc] text-[#0a7db0]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1b1613]">Create Official Post</h3>
                  <p className="text-[11px] text-[#817B77]">Post to the chapter feed as Officer or Faculty</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8c8785] hover:text-[#1b1613] p-1 rounded-lg hover:bg-[#FAF9F8]"
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

              {/* Photo / Image Attachment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#45403d] tracking-wide flex items-center justify-between">
                  <span>Photo / Image Attachment (Optional)</span>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-[11px] text-[#bf2626] hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </label>
                
                <input
                  type="hidden"
                  name="cover_image_url"
                  value={imageUrl}
                />

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Paste image URL (https://...)"
                    value={imageUrl.startsWith("data:") ? "" : imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-lg border border-[#e0dedb] bg-[#FAF9F8] hover:bg-[#F2EFE9] text-xs font-semibold text-[#45403d] flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#0087B5]" />
                    Upload
                  </button>
                </div>

                {imageUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-[#DEDBD8] max-h-48 bg-black/5 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Post preview"
                      className="w-full h-auto max-h-48 object-cover"
                    />
                  </div>
                )}
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
                  rows={4}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
                  placeholder="What would you like to share with the chapter?..."
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-[#45403d]">
                <input
                  type="checkbox"
                  name="is_pinned"
                  className="rounded border-[#e0dedb] text-[#1ca7e0]"
                />
                Pin this post to the top of feed
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
