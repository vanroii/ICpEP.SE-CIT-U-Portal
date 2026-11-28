"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Send, FileText, Minimize2, Maximize2, Paperclip, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  registerMailAttachmentAction,
  removeMailAttachmentAction,
  saveDraftAction,
  scheduleMailAction,
  sendMailAction,
  deleteDraftAction,
} from "./actions";
import { formatSenderName, buildForwardSubject, buildReplySubject } from "./utils";

type Recipient = { id: string; first_name: string; last_name: string; role_code: string };
type MailAttachment = { id: number; file_name: string; size_bytes: number; object_path: string };
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

interface ComposeWindowProps {
  directory: Recipient[];
  currentUserId: string;
  onClose: () => void;
  /** Pre-fill for reply */
  replyTo?: { recipientId: string; subject: string; parentId: number };
  /** Pre-fill for forward */
  forwardOf?: { subject: string; body: string; parentId: number };
  /** Resume draft */
  draft?: { id: number; toIds: string[]; subject: string; body: string; attachments?: MailAttachment[] };
}

export function ComposeWindow({
  directory, currentUserId, onClose,
  replyTo, forwardOf, draft,
}: ComposeWindowProps) {
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    draft?.toIds ?? (replyTo ? [replyTo.recipientId] : [])
  );
  const [subject, setSubject] = useState(
    draft?.subject ??
    (replyTo ? buildReplySubject(replyTo.subject) :
     forwardOf ? buildForwardSubject(forwardOf.subject) : "")
  );
  const [body, setBody] = useState(
    draft?.body ??
    (forwardOf
      ? `\n\n---------- Forwarded message ----------\n${forwardOf.body}`
      : "")
  );
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<MailAttachment[]>(draft?.attachments ?? []);
  const [uploading, setUploading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftIdRef = useRef<number | null>(draft?.id ?? null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const persistCurrentDraft = useCallback(async () => {
    const save = async (): Promise<Awaited<ReturnType<typeof saveDraftAction>>> => {
      try {
        const result = await saveDraftAction(
          draftIdRef.current, selectedIds, subject, body,
          replyTo?.parentId ?? forwardOf?.parentId ?? null,
          !!forwardOf
        );
        if (result.success && result.draftId) {
          draftIdRef.current = result.draftId;
        }
        return result;
      } catch (saveError: unknown) {
        return { error: saveError instanceof Error ? saveError.message : "Failed to save draft." };
      }
    };
    const queuedSave = saveQueueRef.current.then(save, save);
    saveQueueRef.current = queuedSave.then(() => undefined, () => undefined);
    return queuedSave;
  }, [selectedIds, subject, body, replyTo, forwardOf]);

  // Persist changes promptly so a navigation or sign-out does not lose a draft.
  const triggerAutoSave = useCallback(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      if (!subject && !body && selectedIds.length === 0) return;
      setSaving(true);
      setError(null);
      const res = await persistCurrentDraft();
      if (res?.error) setError(`Draft not saved: ${res.error}`);
      setSaving(false);
    }, 800);
  }, [persistCurrentDraft, selectedIds.length, subject, body]);

  useEffect(() => {
    triggerAutoSave();
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [triggerAutoSave]);

  const availableRecipients = directory.filter(
    (u) => u.id !== currentUserId && !selectedIds.includes(u.id)
  ).filter((u) => {
    if (!recipientSearch) return true;
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    return name.includes(recipientSearch.toLowerCase());
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIds.length) { setError("Please add at least one recipient."); return; }
    setSending(true); setError(null);
    const res = await sendMailAction(
      selectedIds, subject, body,
      replyTo?.parentId ?? forwardOf?.parentId ?? null,
      draftIdRef.current
    );
    setSending(false);
    if (res.error) { setError(res.error); return; }
    onClose();
  };

  const ensureDraft = async () => {
    const res = await persistCurrentDraft();
    if (!res?.success || !res.draftId) {
      setError(res.error ?? "Could not save this draft.");
      return null;
    }
    return res.draftId;
  };

  const handleAttachFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    const invalidFile = files.find((file) => file.size < 1 || file.size > MAX_ATTACHMENT_SIZE);
    if (invalidFile) {
      setError(`${invalidFile.name} is empty or exceeds the 20 MB limit.`);
      return;
    }

    setUploading(true);
    setError(null);
    const savedDraftId = await ensureDraft();
    if (!savedDraftId) { setUploading(false); return; }

    const supabase = createClient();
    const newlyAdded: MailAttachment[] = [];
    try {
      for (const file of files) {
        const objectPath = `${currentUserId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("mail-attachments")
          .upload(objectPath, file, { contentType: file.type || "application/octet-stream" });
        if (uploadError) throw new Error(uploadError.message);

        const registered = await registerMailAttachmentAction(
          savedDraftId, objectPath, file.name, file.type, file.size
        );
        if (registered.error) {
          const { error: cleanupError } = await supabase.storage
            .from("mail-attachments")
            .remove([objectPath]);
          throw new Error(cleanupError
            ? `${registered.error} The uploaded file also could not be removed: ${cleanupError.message}`
            : registered.error);
        }
        if (!registered.attachmentId) throw new Error("Attachment saved without an id.");
        newlyAdded.push({
          id: registered.attachmentId,
          file_name: file.name,
          size_bytes: file.size,
          object_path: objectPath,
        });
      }
      setAttachments((current) => [...current, ...newlyAdded]);
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload attachment.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = async (attachment: MailAttachment) => {
    setError(null);
    const result = await removeMailAttachmentAction(attachment.id);
    if (result.error) { setError(result.error); return; }
    setAttachments((current) => current.filter((item) => item.id !== attachment.id));
  };

  const handleSchedule = async () => {
    if (!selectedIds.length) { setError("Please add at least one recipient."); return; }
    if (!scheduledAt) { setError("Choose when this message should be sent."); return; }
    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      setError("Choose a future send time.");
      return;
    }

    setSending(true);
    setScheduling(true);
    setError(null);
    const savedDraftId = await ensureDraft();
    if (!savedDraftId) { setSending(false); setScheduling(false); return; }
    const result = await scheduleMailAction(
      selectedIds, subject, body, scheduledDate.toISOString(), savedDraftId,
      replyTo?.parentId ?? forwardOf?.parentId ?? null
    );
    setSending(false);
    setScheduling(false);
    if (result.error) { setError(result.error); return; }
    onClose();
  };

  const handleClose = async () => {
    if (subject || body || selectedIds.length || attachments.length) {
      setSaving(true);
      const savedDraftId = await ensureDraft();
      setSaving(false);
      if (!savedDraftId) return;
    }
    onClose();
  };

  const handleDiscard = async () => {
    if (draftIdRef.current) {
      const result = await deleteDraftAction(draftIdRef.current);
      if (result.error) { setError(result.error); return; }
    }
    onClose();
  };

  const removeRecipient = (id: string) => setSelectedIds((p) => p.filter((r) => r !== id));
  const minimumScheduleTime = new Date(
    Date.now() + 60_000 - new Date().getTimezoneOffset() * 60_000
  ).toISOString().slice(0, 16);

  const windowCls = maximized
    ? "fixed left-1/2 bottom-4 z-50 w-[min(760px,calc(100vw-2rem))] h-[min(680px,calc(100vh-2rem))] -translate-x-1/2 rounded-2xl shadow-2xl flex flex-col bg-white"
    : "fixed bottom-0 right-2 sm:right-6 z-50 w-[min(520px,calc(100vw-1rem))] rounded-t-2xl shadow-2xl flex flex-col bg-white";

  return (
    <div className={windowCls} style={{ maxHeight: minimized ? "44px" : maximized ? undefined : "520px" }}>
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-ink-900 rounded-t-2xl cursor-pointer select-none"
        onClick={() => setMinimized((p) => !p)}
      >
        <span className="text-[13px] font-semibold text-white truncate">
          {subject || "New Message"}
        </span>
        <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
          {saving && <span className="text-[10px] text-text-mute mr-2">Saving…</span>}
          <button
            onClick={() => setMinimized((p) => !p)}
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title={minimized ? "Expand" : "Minimize"}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMaximized((p) => !p)}
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title={maximized ? "Restore" : "Maximize"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Save and close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <form onSubmit={handleSend} className="flex flex-col flex-1 overflow-hidden">
          {/* To field */}
          <div className="px-4 py-2.5 border-b border-divider">
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-[12px] font-semibold text-text-500 mt-1 w-6 shrink-0">To</span>
              <div className="flex-1 flex flex-wrap gap-1.5 items-center min-w-0">
                {selectedIds.map((id) => {
                  const p = directory.find((u) => u.id === id);
                  if (!p) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1 bg-cyan-50 border border-cyan-200 text-cyan-700 text-[11px] font-semibold rounded-full px-2.5 py-0.5">
                      {formatSenderName(p)}
                      <button type="button" onClick={() => removeRecipient(id)} className="hover:text-red-500 transition-colors ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                <div className="relative flex-1 min-w-[120px]">
                  <input
                    value={recipientSearch}
                    onChange={(e) => { setRecipientSearch(e.target.value); setShowRecipientDropdown(true); }}
                    onFocus={() => setShowRecipientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowRecipientDropdown(false), 150)}
                    placeholder={selectedIds.length === 0 ? "Search recipients…" : "Add more…"}
                    className="w-full text-[13px] text-ink-900 placeholder-text-400 outline-none bg-transparent py-0.5"
                  />
                  {showRecipientDropdown && availableRecipients.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-border-default rounded-xl shadow-lg w-72 max-h-48 overflow-y-auto">
                      {availableRecipients.slice(0, 8).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedIds((p) => [...p, u.id]);
                            setRecipientSearch("");
                            setShowRecipientDropdown(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-50 text-left transition-colors"
                        >
                          <Avatar name={`${u.first_name} ${u.last_name}`} size="xs" />
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-ink-900 truncate">{formatSenderName(u)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="px-4 py-2.5 border-b border-divider">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-text-500 w-14 shrink-0">Subject</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1 text-[13px] text-ink-900 placeholder-text-400 outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            className="flex-1 px-4 py-3 text-[13.5px] text-ink-900 placeholder-text-400 outline-none resize-none leading-relaxed"
          />

          {attachments.length > 0 && (
            <ul className="px-4 py-2 border-t border-divider flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {attachments.map((attachment) => (
                <li key={attachment.id} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-50 border border-divider px-2 py-1 text-[11px] text-text-600 max-w-full">
                  <Paperclip className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-48">{attachment.file_name}</span>
                  <button type="button" onClick={() => handleRemoveAttachment(attachment)} aria-label={`Remove ${attachment.file_name}`}>
                    <X className="w-3 h-3 hover:text-red-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-divider">
            <label className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-600 hover:text-cyan-700 cursor-pointer">
              <Paperclip className="w-3.5 h-3.5" />
              {uploading ? "Uploading…" : "Attach files"}
              <input
                type="file"
                multiple
                disabled={uploading || sending}
                onChange={handleAttachFiles}
                className="sr-only"
              />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={scheduledAt}
                min={minimumScheduleTime}
                onChange={(event) => setScheduledAt(event.target.value)}
                aria-label="Schedule send time"
                className="max-w-[190px] rounded-lg border border-border-input px-2 py-1 text-[11px] text-text-600 outline-none focus:border-cyan-500"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                isLoading={scheduling}
                disabled={!scheduledAt || uploading || sending}
                onClick={handleSchedule}
                className="gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                Schedule
              </Button>
            </div>
          </div>

          {/* Footer */}
          {error && (
            <p className="px-4 py-2 text-[12px] text-red-600 bg-red-50 border-t border-red-100">{error}</p>
          )}
          <div className="flex items-center justify-between px-4 py-3 border-t border-divider">
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" size="sm" isLoading={sending && !scheduling} disabled={uploading || sending} className="font-bold gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Send
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setSaving(true);
                  setError(null);
                  const res = await persistCurrentDraft();
                  if (res.error) setError(res.error);
                  setSaving(false);
                }}
                className="gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Save Draft
              </Button>
            </div>
            <button
              type="button"
              onClick={handleDiscard}
              className="text-[12px] text-text-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

