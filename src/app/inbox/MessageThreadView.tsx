"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction, deleteMessageAction } from "./actions";
import { Avatar } from "@/components/ui/Avatar";
import { Trash2, Send } from "lucide-react";
import {
  buildReplySubject,
  formatFormalName,
  formatPlainName,
} from "./utils";

export function MessageThreadView({
  thread,
  currentUserId,
  currentUserProfile,
}: {
  thread: any;
  currentUserId: string;
  currentUserProfile: any;
}) {
  const router = useRouter();
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<any[]>(
    thread?.allMessages || []
  );
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync localMessages when server thread data updates, and notify topbar badges
  useEffect(() => {
    setLocalMessages(thread?.allMessages || []);
    window.dispatchEvent(new Event("icpep:counts-updated"));
  }, [thread?.threadId, thread?.allMessages]);

  // Auto-scroll to newest message at the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages.length, thread?.threadId]);

  // Real-time subscription + visibility-aware fallback polling
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`inbox-realtime-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_recipients",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [currentUserId, router]);

  // Determine the other participant robustly across all messages in the thread
  const otherParty = useMemo(() => {
    if (thread?.otherParty?.id && thread.otherParty.id !== currentUserId) {
      return thread.otherParty;
    }
    for (const m of localMessages) {
      if (m.sender_id && m.sender_id !== currentUserId) {
        return m.sender ?? { id: m.sender_id };
      }
      const recip = (m.recipients || []).find(
        (r: any) => r?.id && r.id !== currentUserId
      );
      if (recip) return recip;
    }
    return null;
  }, [thread?.otherParty, localMessages, currentUserId]);

  if (!thread) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-center text-xs text-[#8c8785]">
        Select a conversation from the left to view the thread.
      </div>
    );
  }

  const latestMessage = localMessages[0] ?? thread;
  const replyToId: string | null = otherParty?.id ?? null;
  const otherFormalName = formatFormalName(otherParty);
  const otherPlainName = formatPlainName(otherParty);
  const myFormalName = formatFormalName(currentUserProfile, "You");
  const myPlainName = formatPlainName(currentUserProfile, "You");

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = replyBody.trim();
    if (!trimmed || sending) return;

    if (!replyToId) {
      setError("Cannot determine reply recipient.");
      return;
    }

    setError(null);
    setSending(true);

    const tempId = -Date.now();
    const optimisticMsg = {
      id: tempId,
      subject: buildReplySubject(thread.subject),
      body: trimmed,
      sent_at: new Date().toISOString(),
      sender_id: currentUserId,
      sender: currentUserProfile,
      recipients: [otherParty].filter(Boolean),
      _isSentByMe: true,
      _optimistic: true,
    };

    setLocalMessages((prev) => [optimisticMsg, ...prev]);
    setReplyBody("");

    const res = await sendMessageAction(
      [replyToId],
      buildReplySubject(thread.subject),
      trimmed,
      latestMessage?.id > 0 ? latestMessage.id : thread.threadId
    );

    setSending(false);

    if (res.error) {
      setError(res.error);
      setLocalMessages((prev) => prev.filter((m) => m.id !== tempId));
      setReplyBody(trimmed);
    } else {
      router.refresh();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (msgId: number) => {
    if (msgId < 0) return;
    if (!confirm("Remove this message from your mailbox?")) return;
    setLocalMessages((prev) => prev.filter((m) => m.id !== msgId));
    await deleteMessageAction(msgId);
    router.refresh();
  };

  // Chronological order (oldest top -> newest bottom)
  const chronologicalMessages = [...localMessages].reverse();

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-divider bg-surface-50 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={otherPlainName} size="sm" />
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-ink-900 truncate">
              {otherFormalName}
            </h2>
            <p className="text-[12px] text-text-500 truncate">
              Subject: <span className="font-medium text-text-600">{thread.subject}</span>
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full shrink-0">
          {localMessages.length}{" "}
          {localMessages.length === 1 ? "message" : "messages"}
        </span>
      </div>

      {/* Message Bubbles */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#FCFBF9]">
        {chronologicalMessages.map((msg: any) => {
          const isMe = msg.sender_id === currentUserId;
          const senderFormal = isMe
            ? myFormalName
            : formatFormalName(msg.sender);
          const senderPlain = isMe
            ? myPlainName
            : formatPlainName(msg.sender);

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${
                isMe ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div className="shrink-0 mb-1">
                <Avatar name={senderPlain} size="sm" />
              </div>

              <div
                className={`max-w-[75%] space-y-1 flex flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex items-center gap-2 text-[11px] text-text-500 px-1 ${
                    isMe ? "flex-row-reverse" : ""
                  }`}
                >
                  <span className="font-semibold text-text-600">
                    {senderFormal}
                  </span>
                  <span>
                    {new Date(msg.sent_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="group flex items-center gap-1.5">
                  {isMe && !msg._optimistic && (
                    <button
                      type="button"
                      onClick={() => handleDelete(msg.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-400 hover:text-status-danger transition-opacity p-1"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-line shadow-2xs ${
                      isMe
                        ? "bg-cyan-500 text-on-brand rounded-br-sm"
                        : "bg-white text-ink-900 border border-[#E8E5E2] rounded-bl-sm"
                    } ${msg._optimistic ? "opacity-75" : ""}`}
                  >
                    {msg.body}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Messaging-app Bottom Input Bar */}
      <form
        onSubmit={handleSend}
        className="px-4 py-3 border-t border-divider bg-white shrink-0"
      >
        {error && (
          <p className="text-xs text-status-danger mb-2 px-2">{error}</p>
        )}

        <div className="flex items-end gap-2 bg-surface-100 border border-border-default rounded-2xl px-3.5 py-2 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
          <textarea
            rows={1}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherFormalName}…`}
            className="flex-1 bg-transparent text-[13.5px] text-ink-900 placeholder:text-text-400 outline-none resize-none max-h-28 py-1 leading-snug"
          />
          <button
            type="submit"
            disabled={!replyBody.trim() || sending}
            title="Send message"
            className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-[#1493BD] disabled:opacity-40 disabled:hover:bg-cyan-500 text-on-brand flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
