"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, ArchiveRestore } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { toggleStarAction, trashMailAction, restoreMailAction, permanentDeleteMailAction } from "./actions";
import { formatSenderName, getInitials, relativeTime } from "./utils";

export interface MailItem {
  id: number;
  subject: string;
  body: string;
  sent_at: string;
  is_read: boolean;
  is_starred: boolean;
  folder: string;
  sender: any;
  recipients: any[];
  attachments?: { id: number; file_name: string; size_bytes: number; content_type: string }[];
  _isSentByMe: boolean;
  draft?: boolean;
}

interface MailListProps {
  mails: MailItem[];
  selectedId: number | null;
  folder: string;
  onSelect: (mail: MailItem) => void;
  onComposeDraft?: (draft: any) => void;
  currentUserId: string;
}

export function MailList({ mails, selectedId, folder, onSelect, onComposeDraft, currentUserId }: MailListProps) {
  const router = useRouter();
  const [starring, setStarring] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const performAction = async (action: () => Promise<{ error?: string }>) => {
    setActionError(null);
    try {
      const result = await action();
      if (result.error) {
        setActionError(result.error);
        return false;
      }
      router.refresh();
      return true;
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "Mail action failed.");
      return false;
    }
  };

  if (mails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
        {actionError && <p role="alert" className="mb-4 text-[12px] text-red-600">{actionError}</p>}
        <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <Star className="w-7 h-7 text-text-400 opacity-50" />
        </div>
        <p className="text-[14px] font-semibold text-ink-900">No mail here</p>
        <p className="text-[13px] text-text-500 mt-1">This folder is empty.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-divider overflow-y-auto flex-1">
      {actionError && (
        <li role="alert" className="px-4 py-2 text-[12px] text-red-600 bg-red-50">{actionError}</li>
      )}
      {mails.map((mail) => {
        const isSelected = selectedId === mail.id;
        const isUnread = !mail.is_read && !mail._isSentByMe;
        const displayName = mail._isSentByMe
          ? (mail.recipients.length > 0 ? `To: ${formatSenderName(mail.recipients[0])}` : "To: (no recipient)")
          : formatSenderName(mail.sender);
        const initials = mail._isSentByMe
          ? (mail.recipients[0] ? getInitials(`${mail.recipients[0].first_name} ${mail.recipients[0].last_name}`) : "?")
          : getInitials(`${mail.sender?.first_name ?? ""} ${mail.sender?.last_name ?? ""}`);

        return (
          <li
            key={mail.id}
            className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
              isSelected ? "bg-cyan-50 border-l-2 border-l-cyan-500" : isUnread ? "bg-blue-50/40 hover:bg-blue-50/60" : "hover:bg-surface-50"
            }`}
            onClick={() => onSelect(mail)}
          >
            {/* Unread dot */}
            {isUnread && !isSelected && (
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500" />
            )}

            <Avatar
              name={`${mail.sender?.first_name ?? ""} ${mail.sender?.last_name ?? "M"}`}
              size="sm"
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className={`text-[13px] truncate ${isUnread ? "font-bold text-ink-900" : "font-semibold text-text-700"}`}>
                  {displayName}
                </span>
                <span className="text-[11px] text-text-400 shrink-0 whitespace-nowrap">
                  {relativeTime(mail.sent_at)}
                </span>
              </div>
              <p className={`text-[12.5px] truncate ${isUnread ? "font-semibold text-ink-900" : "text-text-600"}`}>
                {mail.subject}
              </p>
              <p className="text-[12px] text-text-400 truncate mt-0.5">
                {mail.body}
              </p>
            </div>

            {/* Hover actions */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white border border-border-default rounded-lg shadow-xs px-1 py-0.5">
              {!mail._isSentByMe && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setStarring(mail.id);
                    await performAction(() => toggleStarAction(mail.id));
                    setStarring(null);
                  }}
                  className={`p-1 rounded transition-colors ${mail.is_starred ? "text-yellow-500" : "text-text-400 hover:text-yellow-500"}`}
                  title={mail.is_starred ? "Unstar" : "Star"}
                  disabled={starring === mail.id}
                >
                  <Star className="w-3.5 h-3.5" fill={mail.is_starred ? "currentColor" : "none"} />
                </button>
              )}

              {folder === "trash" ? (
                <>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await performAction(() => restoreMailAction(mail.id));
                    }}
                    className="p-1 rounded text-text-400 hover:text-cyan-600 transition-colors"
                    title="Restore"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm("Permanently delete this mail?")) return;
                      setDeleting(mail.id);
                      await performAction(() => permanentDeleteMailAction(mail.id));
                      setDeleting(null);
                    }}
                    className="p-1 rounded text-text-400 hover:text-red-600 transition-colors"
                    title="Delete forever"
                    disabled={deleting === mail.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await performAction(() => trashMailAction(mail.id));
                  }}
                  className="p-1 rounded text-text-400 hover:text-red-600 transition-colors"
                  title="Move to trash"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

