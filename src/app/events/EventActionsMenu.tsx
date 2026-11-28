"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2, X, Calendar } from "lucide-react";
import { updateEventAction, deleteEventAction } from "@/app/officer/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface EventActionsMenuProps {
  event: {
    id: number;
    slug: string;
    title: string;
    description?: string;
    venue?: string;
    start_at: string;
    end_at?: string;
    registration_deadline?: string;
    capacity?: number;
    requires_registration?: boolean;
    visibility?: string;
    status?: string;
  };
}

export function EventActionsMenu({ event }: EventActionsMenuProps) {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [editOpen, setEditOpen]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const menuRef                   = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Format datetime-local value from ISO string
  function toDatetimeLocal(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await updateEventAction(event.id, formData);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setEditOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${event.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await deleteEventAction(event.id, event.slug);
    setDeleting(false);
    if (res.error) alert(res.error);
    // Page revalidates automatically on success
  };

  return (
    <>
      {/* Three-dot trigger */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((p) => !p); }}
          className="w-7 h-7 flex items-center justify-center rounded-full text-text-500 hover:bg-surface-100 hover:text-ink-900 transition-colors"
          aria-label="Event options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-9 z-30 w-36 bg-white border border-border-default rounded-xl shadow-lg py-1 overflow-hidden">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); setEditOpen(true); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-ink-900 hover:bg-surface-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-cyan-600" />
              Edit event
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); handleDelete(); }}
              disabled={deleting}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Deleting…" : "Delete event"}
            </button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eeeb]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-ink-900">Edit Event</h3>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="text-text-400 hover:text-ink-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <Input label="Event Title" name="title" required defaultValue={event.title} />
              <Input label="Custom Slug" name="slug" defaultValue={event.slug} />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={event.description ?? ""}
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-white text-ink-900 border border-[#e0dedb] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <Input label="Venue" name="venue" defaultValue={event.venue ?? ""} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Start Date & Time" name="start_at" type="datetime-local" required defaultValue={toDatetimeLocal(event.start_at)} />
                <Input label="End Date & Time"   name="end_at"   type="datetime-local" defaultValue={toDatetimeLocal(event.end_at)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Registration Deadline" name="registration_deadline" type="datetime-local" defaultValue={toDatetimeLocal(event.registration_deadline)} />
                <Input label="Capacity Limit" name="capacity" type="number" min={1} defaultValue={event.capacity ?? ""} placeholder="e.g. 100" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#45403d] tracking-wide">Visibility</label>
                  <select name="visibility" defaultValue={event.visibility ?? "public"} className="w-full px-3.5 py-2 rounded-lg text-xs bg-white text-ink-900 border border-[#e0dedb] outline-none">
                    <option value="public">Public (All students)</option>
                    <option value="members_only">Members Only ★</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#45403d] tracking-wide">Status</label>
                  <select name="status" defaultValue={event.status ?? "published"} className="w-full px-3.5 py-2 rounded-lg text-xs bg-white text-ink-900 border border-[#e0dedb] outline-none">
                    <option value="published">Published (Visible)</option>
                    <option value="draft">Draft (Private)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-[#45403d]">
                <input
                  type="checkbox"
                  name="requires_registration"
                  defaultChecked={event.requires_registration ?? true}
                  className="rounded border-[#e0dedb] text-cyan-500"
                />
                Requires Pre-Registration
              </label>

              {error && (
                <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg">{error}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading} className="font-bold">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

