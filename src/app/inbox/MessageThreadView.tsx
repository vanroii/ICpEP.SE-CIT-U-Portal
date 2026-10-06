"use client";

import { useState } from "react";
import { sendMessageAction, deleteMessageAction } from "./actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Trash2, Send, CornerDownRight } from "lucide-react";

export function MessageThreadView({
  message,
  currentUserId,
}: {
  message: any;
  currentUserId: string;
}) {
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!message) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-center text-xs text-[#8c8785]">
        Select a conversation from the left to view the thread.
      </div>
    );
  }

  const isSender = message.sender_id === currentUserId;
  const otherParty = isSender
    ? message.recipients?.[0]
    : message.sender;

  const otherName = otherParty
    ? `${otherParty.first_name} ${otherParty.last_name}`
    : "Chapter Member";

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setLoading(true);
    setError(null);

    const recipientId = isSender ? message.recipients?.[0]?.id : message.sender_id;
    if (!recipientId) {
      setError("Cannot reply to this sender.");
      setLoading(false);
      return;
    }

    const res = await sendMessageAction(
      [recipientId],
      `Re: ${message.subject}`,
      replyBody,
      message.id
    );

    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setReplyBody("");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this message from your mailbox?")) return;
    await deleteMessageAction(message.id);
  };

  return (
    <div className="h-full flex flex-col justify-between p-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#f0eeeb] flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#1b1613] leading-snug">
            {message.subject}
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#8c8785]">
            <Avatar name={otherName} size="sm" />
            <span>
              {isSender ? "To: " : "From: "}
              <strong className="text-[#1b1613]">{otherName}</strong>
            </span>
            <span>·</span>
            <span>{new Date(message.sent_at).toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="p-1.5 text-[#8c8785] hover:text-[#bf2626] rounded-lg hover:bg-[#fae6e6]/50 transition-colors"
          title="Delete message"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Message Body Bubble */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="rounded-2xl bg-[#f8f8f7] p-5 border border-[#e0dedb] text-xs sm:text-sm text-[#45403d] leading-relaxed whitespace-pre-line">
          {message.body}
        </div>
      </div>

      {/* Reply Composer */}
      <form onSubmit={handleReply} className="pt-4 border-t border-[#f0eeeb] space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0a7db0]">
          <CornerDownRight className="w-3.5 h-3.5" />
          Reply to {otherName}
        </div>

        <textarea
          rows={3}
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder="Write your response..."
          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#e0dedb] outline-none focus:border-[#1ca7e0] bg-[#f8f8f7] text-[#1b1613]"
        />

        {error && <p className="text-xs text-[#bf2626]">{error}</p>}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={loading}
            className="font-bold"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            Send Reply
          </Button>
        </div>
      </form>
    </div>
  );
}
