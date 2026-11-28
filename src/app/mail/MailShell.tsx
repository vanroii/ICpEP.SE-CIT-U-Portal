"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MailSidebar } from "./MailSidebar";
import { MailList, type MailItem } from "./MailList";
import { MailViewer } from "./MailViewer";
import { ComposeWindow } from "./ComposeWindow";
import { markMailReadAction } from "./actions";

type ReplyConfig  = { recipientId: string; subject: string; parentId: number };
type ForwardConfig = { subject: string; body: string; parentId: number };

interface MailShellProps {
  folder: string;
  mails: MailItem[];
  drafts: any[];
  scheduled: any[];
  mailLoadError: string | null;
  directory: any[];
  counts: { inbox: number; starred: number; sent: number; drafts: number; scheduled: number; trash: number };
  currentUserId: string;
  currentUserProfile: any;
}

export function MailShell({
  folder, mails, drafts, scheduled, mailLoadError, directory, counts, currentUserId, currentUserProfile,
}: MailShellProps) {
  const router = useRouter();
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(mails[0] ?? null);
  const [composing, setComposing] = useState(false);
  const [replyConfig, setReplyConfig] = useState<ReplyConfig | null>(null);
  const [forwardConfig, setForwardConfig] = useState<ForwardConfig | null>(null);
  const [draftToResume, setDraftToResume] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [mobileViewOpen, setMobileViewOpen] = useState(false);

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`mail-realtime-${currentUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => router.refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_recipients", filter: `recipient_id=eq.${currentUserId}` }, () => router.refresh())
      .subscribe();
    const interval = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 10000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [currentUserId, router]);

  const handleSelect = useCallback(async (mail: MailItem) => {
    setSelectedMail(mail);
    setMobileViewOpen(true);
    if (!mail.is_read && !mail._isSentByMe) {
      await markMailReadAction(mail.id);
      window.dispatchEvent(new Event("icpep:counts-updated"));
    }
  }, []);

  const handleCompose = useCallback(() => {
    setReplyConfig(null); setForwardConfig(null); setDraftToResume(null);
    setComposing(true);
  }, []);

  const handleReply = useCallback((config: ReplyConfig) => {
    setReplyConfig(config); setForwardConfig(null); setDraftToResume(null);
    setComposing(true);
  }, []);

  const handleForward = useCallback((config: ForwardConfig) => {
    setForwardConfig(config); setReplyConfig(null); setDraftToResume(null);
    setComposing(true);
  }, []);

  const handleComposeDraft = useCallback((draft: any) => {
    setDraftToResume(draft); setReplyConfig(null); setForwardConfig(null);
    setComposing(true);
  }, []);

  const handleCloseCompose = useCallback(() => {
    setComposing(false); setReplyConfig(null); setForwardConfig(null); setDraftToResume(null);
    router.refresh();
  }, [router]);

  // Filter by search
  const filteredMails = search.trim()
    ? mails.filter((m) => {
        const q = search.toLowerCase();
        const senderName = `${m.sender?.first_name ?? ""} ${m.sender?.last_name ?? ""}`.toLowerCase();
        const recipName = m.recipients.map((r: any) => `${r?.first_name ?? ""} ${r?.last_name ?? ""}`).join(" ").toLowerCase();
        return (
          m.subject.toLowerCase().includes(q) ||
          senderName.includes(q) ||
          recipName.includes(q) ||
          m.body.toLowerCase().includes(q)
        );
      })
    : mails;

  const displayedMails = folder === "drafts" ? [] : filteredMails;

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      {/* Top search bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-divider bg-white shrink-0">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mail…"
            className="w-full h-9 pl-9 pr-3 bg-surface-50 border border-border-input rounded-xl text-[13px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:bg-white transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-400 hover:text-ink-900 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {mailLoadError && (
          <p role="alert" className="px-4 py-2 text-[12px] text-red-700 bg-red-50 border-b border-red-100">
            Mail could not be fully loaded: {mailLoadError}
          </p>
        )}
      </div>

      {/* Main 3-pane layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Sidebar */}
        <div className={`${mobileViewOpen ? "hidden" : "flex"} md:flex flex-col shrink-0`}>
          <MailSidebar folder={folder} counts={counts} onCompose={handleCompose} />
        </div>

        {/* Mail list */}
        <div className={`flex flex-col border-r border-divider min-h-0 ${
          mobileViewOpen ? "hidden" : "flex"
        } md:flex md:w-[300px] lg:w-[340px] shrink-0 overflow-hidden`}>
          {/* List header */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-b border-divider shrink-0">
            <span className="text-[12px] font-bold text-text-500 uppercase tracking-wider capitalize">
              {folder === "drafts" ? "Drafts" : folder}
            </span>
            <span className="text-[11px] text-text-400">
              {folder === "drafts" ? drafts.length : folder === "scheduled" ? scheduled.length : filteredMails.length} message{(folder === "drafts" ? drafts.length : folder === "scheduled" ? scheduled.length : filteredMails.length) !== 1 ? "s" : ""}
            </span>
          </div>

          {folder === "drafts" ? (
            <ul className="flex-1 overflow-y-auto divide-y divide-divider">
              {drafts.length === 0 ? (
                <li className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-[14px] font-semibold text-ink-900">No drafts</p>
                  <p className="text-[12px] text-text-500 mt-1">Your saved drafts appear here.</p>
                </li>
              ) : drafts.map((d) => (
                <li
                  key={d.id}
                  className="px-4 py-3.5 cursor-pointer hover:bg-surface-50 transition-colors"
                  onClick={() => handleComposeDraft(d)}
                >
                  <p className="text-[12px] text-text-400 mb-0.5">Draft</p>
                  <p className="text-[13px] font-semibold text-ink-900 truncate">{d.subject || "(no subject)"}</p>
                  <p className="text-[12px] text-text-500 truncate mt-0.5">{d.body || "(no body)"}</p>
                </li>
              ))}
            </ul>
          ) : folder === "scheduled" ? (
            <ul className="flex-1 overflow-y-auto divide-y divide-divider">
              {scheduled.length === 0 ? (
                <li className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-[14px] font-semibold text-ink-900">No scheduled messages</p>
                  <p className="text-[12px] text-text-500 mt-1">Messages you schedule will appear here.</p>
                </li>
              ) : scheduled.map((message) => (
                <li key={message.id} className="px-4 py-3.5">
                  <p className="text-[12px] text-text-400 mb-0.5">
                    {message.status === "failed"
                      ? "Delivery failed"
                      : `Sending ${new Date(message.send_at).toLocaleString()}`}
                  </p>
                  <p className="text-[13px] font-semibold text-ink-900 truncate">{message.subject || "(no subject)"}</p>
                  <p className="text-[12px] text-text-500 truncate mt-0.5">{message.body || "(no body)"}</p>
                  {message.failure_reason && (
                    <p className="text-[11px] text-red-600 mt-1">{message.failure_reason}</p>
                  )}
                  {message.mail_attachments?.length > 0 && (
                    <p className="text-[11px] text-text-400 mt-1">
                      {message.mail_attachments.length} attachment{message.mail_attachments.length === 1 ? "" : "s"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <MailList
              mails={displayedMails}
              selectedId={selectedMail?.id ?? null}
              folder={folder}
              onSelect={handleSelect}
              onComposeDraft={handleComposeDraft}
              currentUserId={currentUserId}
            />
          )}
        </div>

        {/* Mail viewer */}
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${mobileViewOpen ? "flex" : "hidden"} md:flex`}>
          <MailViewer
            mail={selectedMail}
            folder={folder}
            currentUserId={currentUserId}
            currentUserProfile={currentUserProfile}
            directory={directory}
            onBack={() => { setMobileViewOpen(false); setSelectedMail(null); }}
            onReply={handleReply}
            onForward={handleForward}
          />
        </div>
      </div>

      {/* Compose floating window */}
      {composing && (
        <ComposeWindow
          directory={directory}
          currentUserId={currentUserId}
          onClose={handleCloseCompose}
          replyTo={replyConfig ?? undefined}
          forwardOf={forwardConfig ?? undefined}
          draft={draftToResume ? {
            id: draftToResume.id,
            toIds: draftToResume.to_ids ?? [],
            subject: draftToResume.subject ?? "",
            body: draftToResume.body ?? "",
            attachments: draftToResume.mail_attachments ?? [],
          } : undefined}
        />
      )}
    </div>
  );
}

