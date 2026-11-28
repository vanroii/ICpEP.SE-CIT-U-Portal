"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Reply, Forward, Trash2, Star, ArchiveRestore, ArrowLeft,
  ChevronDown, ChevronUp, Paperclip, Download,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  getMailAttachmentUrlAction,
  sendMailAction,
  toggleStarAction,
  trashMailAction,
  restoreMailAction,
} from "./actions";
import { formatSenderName, formatFullDateTime, buildReplySubject, buildForwardSubject } from "./utils";
import type { MailItem } from "./MailList";

interface MailViewerProps {
  mail: MailItem | null;
  folder: string;
  currentUserId: string;
  currentUserProfile: any;
  directory: any[];
  onBack: () => void;
  onReply: (config: { recipientId: string; subject: string; parentId: number }) => void;
  onForward: (config: { subject: string; body: string; parentId: number }) => void;
}

export function MailViewer({
  mail, folder, currentUserId, currentUserProfile, directory, onBack, onReply, onForward,
}: MailViewerProps) {
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starred, setStarred] = useState(mail?.is_starred ?? false);
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  useEffect(() => {
    setStarred(mail?.is_starred ?? false);
  }, [mail?.id, mail?.is_starred]);

  if (!mail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
        <div className="w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <ArrowLeft className="w-8 h-8 text-text-400 opacity-40" />
        </div>
        <p className="text-[15px] font-semibold text-ink-900">Select a mail to read</p>
        <p className="text-[13px] text-text-500 mt-1">Choose a message from the list on the left.</p>
      </div>
    );
  }

  const senderName = formatSenderName(mail.sender);
  const senderInitials = `${mail.sender?.first_name ?? ""}${mail.sender?.last_name ?? ""}`.slice(0, 2);
  const replyRecipientId = mail._isSentByMe
    ? (mail.recipients[0]?.id ?? null)
    : mail.sender?.id ?? null;

  const handleQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyRecipientId || !replyBody.trim()) return;
    setSending(true); setError(null);
    const res = await sendMailAction(
      [replyRecipientId],
      buildReplySubject(mail.subject),
      replyBody.trim(),
      mail.id
    );
    setSending(false);
    if (res.error) { setError(res.error); return; }
    setReplyBody(""); setReplyOpen(false);
  };

  const handleStar = async () => {
    setError(null);
    const result = await toggleStarAction(mail.id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStarred(result.starred ?? false);
    router.refresh();
  };

  const handleTrash = async () => {
    setError(null);
    const result = await trashMailAction(mail.id);
    if (result.error) {
      setError(result.error);
      return;
    }
    onBack();
    router.refresh();
  };

  const handleRestore = async () => {
    setError(null);
    const result = await restoreMailAction(mail.id);
    if (result.error) {
      setError(result.error);
      return;
    }
    onBack();
    router.refresh();
  };

  const handleAttachmentDownload = async (attachmentId: number) => {
    setAttachmentError(null);
    const newTab = window.open("about:blank", "_blank");
    const result = await getMailAttachmentUrlAction(attachmentId);
    if (result.error || !result.url) {
      newTab?.close();
      setAttachmentError(result.error ?? "Could not download attachment.");
      return;
    }
    if (newTab) newTab.location.href = result.url;
    else setAttachmentError("Allow pop-ups to download this attachment.");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-divider bg-white shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-surface-50 text-text-500 hover:text-ink-900 transition-colors lg:hidden"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1 ml-auto">
          {!mail._isSentByMe && (
            <button
              onClick={handleStar}
              className={`p-1.5 rounded-lg transition-colors ${starred ? "text-yellow-500 hover:text-yellow-600" : "text-text-400 hover:text-yellow-500 hover:bg-surface-50"}`}
              title={starred ? "Unstar" : "Star"}
            >
              <Star className="w-4 h-4" fill={starred ? "currentColor" : "none"} />
            </button>
          )}
          {replyRecipientId && (
            <button
              onClick={() => onReply({ recipientId: replyRecipientId, subject: mail.subject, parentId: mail.id })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-600 hover:bg-surface-50 hover:text-ink-900 transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
          <button
            onClick={() => onForward({ subject: mail.subject, body: mail.body, parentId: mail.id })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-600 hover:bg-surface-50 hover:text-ink-900 transition-colors"
          >
            <Forward className="w-3.5 h-3.5" />
            Forward
          </button>
          {folder === "trash" ? (
            <button
              onClick={handleRestore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
              Restore
            </button>
          ) : (
            <button
              onClick={handleTrash}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Trash
            </button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="px-5 py-2 text-[12px] text-red-600 bg-red-50">{error}</p>}

      {/* Mail content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 bg-white space-y-5">
        {/* Subject */}
        <h2 className="text-[20px] font-bold text-ink-900 leading-snug">{mail.subject}</h2>

        {/* Sender header */}
        <div
          className="flex items-start gap-3 cursor-pointer select-none"
          onClick={() => setHeaderExpanded((p) => !p)}
        >
          <Avatar name={`${mail.sender?.first_name ?? ""} ${mail.sender?.last_name ?? "M"}`} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-ink-900">{senderName}</span>
              <button className="text-text-400 hover:text-ink-900 transition-colors ml-auto">
                {headerExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[12px] text-text-500">
              to {mail._isSentByMe ? (mail.recipients.map((r: any) => formatSenderName(r)).join(", ")) : formatSenderName(currentUserProfile)}
            </p>
            {!headerExpanded && (
              <p className="text-[11px] text-text-400 mt-0.5">{formatFullDateTime(mail.sent_at)}</p>
            )}
          </div>
        </div>

        {/* Expanded header details */}
        {headerExpanded && (
          <div className="bg-surface-50 rounded-xl p-4 text-[12px] text-text-600 space-y-1.5 border border-divider">
            <div className="flex gap-3"><span className="font-semibold w-16 shrink-0">From:</span><span>{senderName}</span></div>
            <div className="flex gap-3"><span className="font-semibold w-16 shrink-0">To:</span><span>{mail._isSentByMe ? mail.recipients.map((r: any) => formatSenderName(r)).join(", ") : formatSenderName(currentUserProfile)}</span></div>
            <div className="flex gap-3"><span className="font-semibold w-16 shrink-0">Date:</span><span>{formatFullDateTime(mail.sent_at)}</span></div>
            <div className="flex gap-3"><span className="font-semibold w-16 shrink-0">Subject:</span><span>{mail.subject}</span></div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-divider" />

        {/* Body */}
        <div className="text-[14px] text-ink-900 leading-relaxed whitespace-pre-line">
          {mail.body}
        </div>
        {mail.attachments && mail.attachments.length > 0 && (
          <section className="border-t border-divider pt-4">
            <h3 className="text-[12px] font-semibold text-text-600 mb-2">
              {mail.attachments.length} attachment{mail.attachments.length === 1 ? "" : "s"}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {mail.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <button
                    type="button"
                    onClick={() => handleAttachmentDownload(attachment.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-divider px-3 py-2 text-[12px] text-text-600 hover:bg-surface-50"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="max-w-48 truncate">{attachment.file_name}</span>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            {attachmentError && <p role="alert" className="mt-2 text-[12px] text-red-600">{attachmentError}</p>}
          </section>
        )}
      </div>

      {/* Quick reply bar */}
      {replyRecipientId && !mail._isSentByMe && (
        <div className="border-t border-divider bg-white shrink-0">
          {!replyOpen ? (
            <div
              className="flex items-center gap-3 px-5 py-3 cursor-text"
              onClick={() => setReplyOpen(true)}
            >
              <Avatar name={`${currentUserProfile?.first_name ?? ""} ${currentUserProfile?.last_name ?? ""}`} size="xs" />
              <div className="flex-1 bg-surface-50 border border-divider rounded-full px-4 py-2 text-[13px] text-text-400 hover:border-cyan-400 transition-colors">
                Reply to {senderName}…
              </div>
            </div>
          ) : (
            <form onSubmit={handleQuickReply} className="px-5 py-3 space-y-2">
              <div className="flex items-center gap-2 text-[12px] text-text-500">
                <Reply className="w-3.5 h-3.5" />
                Replying to <span className="font-semibold text-ink-900">{senderName}</span>
              </div>
              <div className="bg-surface-50 border border-divider rounded-xl px-4 py-3 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write your reply…"
                  rows={3}
                  autoFocus
                  className="w-full bg-transparent text-[13px] text-ink-900 placeholder-text-400 outline-none resize-none leading-relaxed"
                />
              </div>
              {error && <p className="text-[12px] text-red-600">{error}</p>}
              <div className="flex items-center gap-2">
                <Button type="submit" variant="primary" size="sm" isLoading={sending} className="font-bold gap-1.5">
                  <Reply className="w-3.5 h-3.5" />
                  Send Reply
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setReplyOpen(false); setReplyBody(""); }}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
