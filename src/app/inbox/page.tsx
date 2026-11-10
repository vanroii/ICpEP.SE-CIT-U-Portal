"use client";

import React, { useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { Search, Send, Plus } from "lucide-react";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "sent">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showCompose, setShowCompose] = useState(false);

  const [threads, setThreads] = useState<
    Array<{
      id: number;
      sender: string;
      avatarLetter: string;
      time: string;
      subject: string;
      snippet: string;
      isUnread: boolean;
      messages: string[];
    }>
  >([]);

  const filteredThreads = threads.filter((t) => {
    if (activeTab === "unread") return t.isUnread;
    return true;
  });

  const activeThread = threads.find((t) => t.id === selectedId) || null;

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedId) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === selectedId
          ? { ...t, messages: [...t.messages, `You: ${replyText}`] }
          : t
      )
    );
    setReplyText("");
  };

  const toggleUnread = () => {
    if (!selectedId) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === selectedId ? { ...t, isUnread: !t.isUnread } : t
      )
    );
  };

  const deleteCurrent = () => {
    if (!selectedId) return;
    setThreads((prev) => prev.filter((t) => t.id !== selectedId));
    setSelectedId(null);
  };

  return (
    <PortalShell activeItem="Inbox">
      <div className="space-y-7">
        {/* Page Header (1096x62, §6.6) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Inbox
            </h1>
            <p className="text-[15px] text-[#817B77]">
              Direct messages from officers, faculty, and admins.
            </p>
          </div>

          <button
            onClick={() => setShowCompose(true)}
            className="h-[43px] px-[22px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] active:bg-[#1383a8] text-[#12191C] font-semibold text-[14px] flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Compose message</span>
          </button>
        </div>

        {/* Content Row: 2-Pane Inbox (400px list + 672px thread) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Messages List (400px = lg:col-span-5) */}
          <div className="lg:col-span-5 bg-white border border-[#DEDBD8] rounded-[16px] overflow-hidden">
            {/* Search & Filter Header */}
            <div className="p-5 pb-3.5 space-y-3">
              <div className="h-[40px] px-3 bg-[#F8F8F7] border border-[#DEDBD8] rounded-[10px] flex items-center gap-2">
                <Search className="w-4 h-4 text-[#928C88] shrink-0" />
                <input
                  type="text"
                  placeholder="Search messages"
                  className="w-full text-[13px] text-[#1C1713] placeholder-[#928C88] bg-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`h-[30px] px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
                    activeTab === "all"
                      ? "bg-[#19A7D5] text-[#12191C]"
                      : "bg-white border border-[#DEDBD8] text-[#817B77]"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab("unread")}
                  className={`h-[30px] px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
                    activeTab === "unread"
                      ? "bg-[#19A7D5] text-[#12191C]"
                      : "bg-white border border-[#DEDBD8] text-[#817B77]"
                  }`}
                >
                  Unread ({threads.filter((t) => t.isUnread).length})
                </button>
                <button
                  onClick={() => setActiveTab("sent")}
                  className={`h-[30px] px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
                    activeTab === "sent"
                      ? "bg-[#19A7D5] text-[#12191C]"
                      : "bg-white border border-[#DEDBD8] text-[#817B77]"
                  }`}
                >
                  Sent
                </button>
              </div>
            </div>

            {/* Thread items */}
            {filteredThreads.length > 0 ? (
              <div className="divide-y divide-[#EEECEA]">
                {filteredThreads.map((t) => {
                  const isSelected = t.id === selectedId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full p-4 px-5 flex items-start gap-3 text-left transition-colors ${
                        isSelected ? "bg-[#E8F7FC]" : "hover:bg-[#FAF9F8]"
                      }`}
                    >
                      <div className="w-[38px] h-[38px] rounded-full bg-[#E3F6FC] text-[#0087B5] flex items-center justify-center font-bold text-[14px] shrink-0 mt-0.5">
                        {t.avatarLetter}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-bold text-[#1C1713] truncate">
                            {t.sender}
                          </span>
                          <span className="text-[12px] text-[#928C88] whitespace-nowrap ml-2">
                            {t.time}
                          </span>
                        </div>
                        <p className="text-[13px] font-semibold text-[#1C1713] truncate">
                          {t.subject}
                        </p>
                        <p className="text-[12px] text-[#928C88] truncate">
                          {t.snippet}
                        </p>
                      </div>

                      {t.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#19A7D5] shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center space-y-1">
                <p className="text-[14px] font-semibold text-[#1C1713]">
                  No messages
                </p>
                <p className="text-[12px] text-[#817B77]">
                  Your inbox is currently empty.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Active Thread (672px = lg:col-span-7) */}
          <div className="lg:col-span-7 bg-white border border-[#DEDBD8] rounded-[16px] p-6 sm:p-7 space-y-5">
            {activeThread ? (
              <>
                {/* Thread Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="text-[22px] leading-[30px] font-bold text-[#1C1713] tracking-[-0.3px]">
                      {activeThread.subject}
                    </h2>
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-full bg-[#E3F6FC] text-[#0087B5] flex items-center justify-center font-bold text-[13px] shrink-0">
                        {activeThread.avatarLetter}
                      </div>
                      <div className="leading-tight">
                        <p className="text-[14px] font-semibold text-[#1C1713]">
                          {activeThread.sender}
                        </p>
                        <p className="text-[12px] text-[#817B77]">
                          {activeThread.time}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleUnread}
                      className="h-[34px] px-3.5 rounded-[8px] border border-[#C3E8F5] text-[#0087B5] hover:bg-[#E3F6FC] text-[13px] font-semibold transition-colors"
                    >
                      Mark unread
                    </button>
                    <button
                      onClick={deleteCurrent}
                      className="h-[34px] px-3.5 rounded-[8px] border border-[#FCA5A5] text-[#B91C1C] hover:bg-[#FEE2E2] text-[13px] font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-[#EEECEA]" />

                {/* Message Body */}
                <div className="space-y-3.5 text-[15px] leading-[25px] text-[#3D3733] py-2">
                  {activeThread.messages.map((m, idx) => (
                    <p key={idx}>{m}</p>
                  ))}
                </div>

                {/* Reply Box */}
                <div className="space-y-3 pt-3">
                  <div className="rounded-[12px] bg-[#F8F8F7] border border-[#C9C5C2] p-3.5">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply…"
                      className="w-full bg-transparent text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none resize-none"
                    />
                  </div>
                  <div>
                    <button
                      onClick={handleSendReply}
                      className="h-[32px] px-3.5 rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] active:bg-[#1383a8] text-[#12191C] text-[13px] font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send reply</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-24 text-center space-y-2">
                <p className="text-[16px] font-semibold text-[#1C1713]">
                  No message selected
                </p>
                <p className="text-[14px] text-[#817B77] max-w-sm mx-auto">
                  Select a message from the left or compose a new message to an officer or administrator.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Message Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DEDBD8] rounded-[16px] max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[20px] font-bold text-[#1C1713]">
              Compose message
            </h3>
            <div className="space-y-3">
              <input
                placeholder="To: (Officer or Faculty name)"
                className="w-full h-11 px-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none focus:border-[#19A7D5]"
              />
              <input
                placeholder="Subject"
                className="w-full h-11 px-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none focus:border-[#19A7D5]"
              />
              <textarea
                rows={4}
                placeholder="Type your message here..."
                className="w-full p-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none focus:border-[#19A7D5]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 text-sm text-[#817B77] hover:text-[#1C1713]"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 bg-[#19A7D5] text-[#12191C] rounded-[8px] text-sm font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
