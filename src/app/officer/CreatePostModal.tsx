"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPostAction, updatePostAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, X, Image as ImageIcon, Sparkles, Crop, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageResizeCropModal, type CropPreset } from "@/components/ImageResizeCropModal";
import { parseMediaUrls, serializeMediaUrls } from "@/lib/media";

export interface EditablePostData {
  id: number;
  title: string;
  slug: string;
  post_type: string;
  status?: string;
  summary?: string | null;
  body: string;
  cover_image_url?: string | null;
  is_pinned?: boolean;
}

interface UploadedPhoto {
  id: string;
  url: string;
  rawSrc?: string;
  preset?: CropPreset;
}

interface CropQueueItem {
  id: string;
  rawSrc: string;
  targetIndex?: number;
}

const MAX_PHOTOS = 10;

interface CreatePostModalProps {
  buttonLabel?: string;
  initialPost?: EditablePostData | null;
  open?: boolean;
  onClose?: () => void;
  hideTrigger?: boolean;
}

export function CreatePostModal({
  buttonLabel = "New Announcement",
  initialPost = null,
  open,
  onClose,
  hideTrigger = false,
}: CreatePostModalProps) {
  const router = useRouter();
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? open : internalOpen;
  const isEditMode = Boolean(initialPost);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>(() =>
    initialPost
      ? parseMediaUrls(initialPost.cover_image_url).map((url, idx) => ({
          id: `init-${initialPost.id}-${idx}`,
          url,
        }))
      : []
  );
  const [urlInput, setUrlInput] = useState("");
  const [cropQueue, setCropQueue] = useState<CropQueueItem[]>([]);
  const [cropBatchTotal, setCropBatchTotal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialPost) {
      setPhotos(
        parseMediaUrls(initialPost.cover_image_url).map((url, idx) => ({
          id: `init-${initialPost.id}-${idx}`,
          url,
        }))
      );
      setError(null);
    }
  }, [isOpen, initialPost]);

  const closeModal = () => {
    if (!isControlled) setInternalOpen(false);
    onClose?.();
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") resolve(event.target.result);
        else reject(new Error("Failed to read file."));
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setError(`You can attach up to ${MAX_PHOTOS} photos per post.`);
      return;
    }

    const selected = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Only the first ${remainingSlots} photo(s) were added (max ${MAX_PHOTOS} per post).`);
    } else {
      setError(null);
    }

    const validFiles: File[] = [];
    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setError("Please select image files only.");
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError("Each image must be less than 15MB.");
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) return;

    const loaded = await Promise.all(
      validFiles.map(async (file, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        rawSrc: await readFileAsDataUrl(file),
      }))
    );

    setCropBatchTotal(loaded.length);
    setCropQueue(loaded);
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (photos.length >= MAX_PHOTOS) {
      setError(`You can attach up to ${MAX_PHOTOS} photos per post.`);
      return;
    }
    setError(null);
    setPhotos((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url: trimmed },
    ]);
    setUrlInput("");
  };

  const handleMovePhoto = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    setPhotos((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearImages = () => {
    setPhotos([]);
    setUrlInput("");
    setCropQueue([]);
    setCropBatchTotal(0);
  };

  const serializedCoverUrl = serializeMediaUrls(photos.map((p) => p.url));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (serializedCoverUrl) {
      formData.set("cover_image_url", serializedCoverUrl);
    } else {
      formData.set("cover_image_url", "");
    }
    const res = isEditMode && initialPost
      ? await updatePostAction(initialPost.id, formData)
      : await createPostAction(formData);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      if (!isEditMode) handleClearImages();
      closeModal();
      router.refresh();
    }
  };

  return (
    <>
      {!hideTrigger && (
        <Button
          onClick={() => setInternalOpen(true)}
          variant="primary"
          size="sm"
          className="font-bold shadow-xs whitespace-nowrap flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {buttonLabel}
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eeeb]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 text-[#0a7db0]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1b1613]">
                    {isEditMode ? "Edit Official Post" : "Create Official Post"}
                  </h3>
                  <p className="text-[11px] text-text-500">
                    {isEditMode
                      ? "Update post details, photos, or pin status"
                      : "Post to the chapter feed as Officer or Faculty"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-[#8c8785] hover:text-[#1b1613] p-1 rounded-lg hover:bg-surface-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Post Title"
                name="title"
                required
                defaultValue={initialPost?.title ?? ""}
                placeholder="e.g. Schedule of Midterm Review Sessions"
              />
              <Input
                label="Custom Slug (Optional)"
                name="slug"
                defaultValue={initialPost?.slug ?? ""}
                placeholder="e.g. schedule-midterm-reviews-2026"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
                    Post Type
                  </label>
                  <select
                    name="post_type"
                    defaultValue={initialPost?.post_type ?? "announcement"}
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
                    defaultValue={initialPost?.status ?? "published"}
                    className="w-full px-3.5 py-2 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Photo / Image Attachment (Single or Multi-photo Carousel) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#45403d] tracking-wide flex items-center justify-between">
                  <span>
                    Photos / Images (Optional{photos.length > 0 ? ` · ${photos.length}/${MAX_PHOTOS}` : ""})
                  </span>
                  {photos.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearImages}
                      className="text-[11px] text-[#bf2626] hover:underline cursor-pointer"
                    >
                      Remove All
                    </button>
                  )}
                </label>

                <input
                  type="hidden"
                  name="cover_image_url"
                  value={serializedCoverUrl}
                />

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Paste image URL (https://...)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddUrl();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
                  />
                  {urlInput.trim() && (
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="px-3 py-2 rounded-lg border border-[#e0dedb] bg-surface-50 hover:bg-[#F2EFE9] text-xs font-semibold text-[#45403d] shrink-0 cursor-pointer"
                    >
                      Add URL
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photos.length >= MAX_PHOTOS}
                    className="px-3 py-2 rounded-lg border border-[#e0dedb] bg-surface-50 hover:bg-[#F2EFE9] disabled:opacity-50 text-xs font-semibold text-[#45403d] flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-600" />
                    {photos.length > 0 ? "Add Photos" : "Upload"}
                  </button>
                </div>

                {photos.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="group relative rounded-xl overflow-hidden border border-border-default bg-black/5 flex flex-col"
                      >
                        <div className="relative aspect-4/5 bg-black/10 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={`Post photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/65 text-white text-[10px] font-bold">
                            {idx + 1}/{photos.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            title="Remove photo"
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/65 hover:bg-[#bf2626] text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-1.5 bg-white border-t border-divider flex items-center justify-between gap-1 text-[10px]">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(idx, -1)}
                              disabled={idx === 0}
                              title="Move left"
                              className="p-1 rounded hover:bg-surface-50 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(idx, 1)}
                              disabled={idx === photos.length - 1}
                              title="Move right"
                              className="p-1 rounded hover:bg-surface-50 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCropBatchTotal(1);
                                setCropQueue([
                                  {
                                    id: photo.id,
                                    rawSrc: photo.rawSrc || photo.url,
                                    targetIndex: idx,
                                  },
                                ]);
                              }}
                              title="Resize & Crop"
                              className="p-1 rounded hover:bg-surface-50 text-cyan-600 cursor-pointer"
                            >
                              <Crop className="w-3 h-3" />
                            </button>
                            <a
                              href={photo.url}
                              download={
                                photo.preset
                                  ? `icpep-post-${photo.preset.width}x${photo.preset.height}-${idx + 1}.jpg`
                                  : `icpep-post-image-${idx + 1}.jpg`
                              }
                              title="Download"
                              className="p-1 rounded hover:bg-surface-50 text-cyan-600"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
                  Brief Summary
                </label>
                <input
                  name="summary"
                  defaultValue={initialPost?.summary ?? ""}
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
                  defaultValue={initialPost?.body ?? ""}
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
                  placeholder="What would you like to share with the chapter?..."
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-[#45403d]">
                <input
                  type="checkbox"
                  name="is_pinned"
                  defaultChecked={Boolean(initialPost?.is_pinned)}
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
                <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading} className="font-bold">
                  {isEditMode ? "Save Changes" : "Publish Post"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {cropQueue.length > 0 && (
        <ImageResizeCropModal
          key={cropQueue[0].id}
          imageSrc={cropQueue[0].rawSrc}
          stepLabel={
            cropBatchTotal > 1
              ? `Photo ${cropBatchTotal - cropQueue.length + 1} of ${cropBatchTotal}`
              : undefined
          }
          onCancel={() => {
            setCropQueue((prev) => prev.slice(1));
          }}
          onApply={(exportedDataUrl, preset) => {
            const current = cropQueue[0];
            if (current.targetIndex !== undefined) {
              setPhotos((prev) =>
                prev.map((p, i) =>
                  i === current.targetIndex
                    ? { ...p, url: exportedDataUrl, preset }
                    : p
                )
              );
            } else {
              setPhotos((prev) => [
                ...prev.slice(0, MAX_PHOTOS - 1),
                {
                  id: current.id,
                  url: exportedDataUrl,
                  rawSrc: current.rawSrc,
                  preset,
                },
              ]);
            }
            setCropQueue((prev) => prev.slice(1));
          }}
        />
      )}
    </>
  );
}
