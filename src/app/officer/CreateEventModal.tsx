"use client";

import { useState } from "react";
import { createEventAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, X, Calendar } from "lucide-react";

export function CreateEventModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await createEventAction(formData);
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
        Create Event
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eeeb]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#e3f6fc] text-[#0a7db0]">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#1b1613]">New Chapter Event</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8c8785] hover:text-[#1b1613] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Event Title" name="title" required placeholder="e.g. CpE Tech Summit 2026" />
              <Input label="Custom Slug (Optional)" name="slug" placeholder="e.g. cpe-tech-summit-2026" />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] focus:border-[#1ca7e0] focus:ring-3 focus:ring-[#1ca7e0]/20 outline-none"
                  placeholder="Outline key topics, schedule, and prerequisites..."
                />
              </div>

              <Input label="Venue" name="venue" placeholder="e.g. CEA Lab 304 / Auditorium" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Start Date & Time" name="start_at" type="datetime-local" required />
                <Input label="End Date & Time" name="end_at" type="datetime-local" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Registration Deadline" name="registration_deadline" type="datetime-local" />
                <Input label="Capacity Limit" name="capacity" type="number" min={1} placeholder="e.g. 100" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
                    Visibility
                  </label>
                  <select
                    name="visibility"
                    defaultValue="public"
                    className="w-full px-3.5 py-2 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
                  >
                    <option value="public">Public (All students)</option>
                    <option value="members_only">Members Only ★</option>
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
                    <option value="published">Published (Visible)</option>
                    <option value="draft">Draft (Private)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-[#45403d]">
                <input
                  type="checkbox"
                  name="requires_registration"
                  defaultChecked
                  className="rounded border-[#e0dedb] text-[#1ca7e0]"
                />
                Requires Pre-Registration (tracks participant count & capacity)
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
                  Publish Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
