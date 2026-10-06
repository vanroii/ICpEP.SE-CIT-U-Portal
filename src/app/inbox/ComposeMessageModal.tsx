"use client";

import { useState } from "react";
import { sendMessageAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, X, Mail, Send } from "lucide-react";

export function ComposeMessageModal({
  directory,
}: {
  directory: Array<{
    id: string;
    first_name: string;
    last_name: string;
    role_code: string;
  }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient) {
      setError("Please choose a recipient.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await sendMessageAction([selectedRecipient], subject, body);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
      setSubject("");
      setBody("");
      setSelectedRecipient("");
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
        Compose
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eeeb]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#e3f6fc] text-[#0a7db0]">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#1b1613]">New Message</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8c8785] hover:text-[#1b1613] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#45403d]">
                  Recipient <span className="text-[#bf2626]">*</span>
                </label>
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#e0dedb] bg-white outline-none"
                >
                  <option value="">-- Choose recipient --</option>
                  {directory.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.role_code})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="e.g. Inquiries regarding CpE General Assembly"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#45403d]">
                  Message Body <span className="text-[#bf2626]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  placeholder="Type your message here..."
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#e0dedb] outline-none"
                />
              </div>

              {error && (
                <p className="text-xs text-[#bf2626] font-medium bg-[#fae6e6] p-2.5 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={loading}
                  className="font-bold"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
