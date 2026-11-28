"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Maximize2,
  X,
  Mail,
  Bell,
  Calendar,
  Award,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";
import {
  formatFormalName,
  stripRePrefix,
} from "@/app/inbox/utils";
import {
  markAllNotificationsReadAction,
  markNotificationGroupReadAction,
} from "@/app/notifications/actions";

export type QuickPanelType = "messages" | "notifications" | null;

interface QuickPopoverPanelProps {
  openPanel: QuickPanelType;
  onClose: () => void;
}

export function QuickPopoverPanel({
  openPanel,
  onClose,
}: QuickPopoverPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [notifGroups, setNotifGroups] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!openPanel) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      if (openPanel === "messages") {
        const [{ data: dirData }, { data: received }, { data: sent }] =
          await Promise.all([
            supabase.from("user_directory").select("*").limit(500),
            supabase
              .from("message_recipients")
              .select(
                `
                is_read, message_id,
                messages(id, subject, body, sent_at, sender_id, parent_id)
              `
              )
              .eq("recipient_id", user.id)
              .is("deleted_at", null)
              .order("message_id", { ascending: false })
              .limit(40),
            supabase
              .from("messages")
              .select(
                `
                id, subject, body, sent_at, sender_id, parent_id,
                message_recipients(recipient_id)
              `
              )
              .eq("sender_id", user.id)
              .is("sender_deleted_at", null)
              .order("sent_at", { ascending: false })
              .limit(40),
          ]);

        const dirMap = new Map<string, any>();
        for (const u of dirData ?? []) {
          if (u?.id) dirMap.set(u.id, u);
        }

        const receivedMsgs = (received ?? [])
          .filter((r: any) => r.messages)
          .map((r: any) => ({
            id: r.messages.id,
            subject: r.messages.subject,
            body: r.messages.body,
            sent_at: r.messages.sent_at,
            sender_id: r.messages.sender_id,
            parent_id: r.messages.parent_id,
            is_read: r.is_read,
            sender: dirMap.get(r.messages.sender_id) ?? {
              id: r.messages.sender_id,
            },
            recipients: [dirMap.get(user.id) ?? { id: user.id }],
            _isSentByMe: false,
          }));

        const sentMsgs = (sent ?? []).map((m: any) => ({
          id: m.id,
          subject: m.subject,
          body: m.body,
          sent_at: m.sent_at,
          sender_id: m.sender_id,
          parent_id: m.parent_id,
          is_read: true,
          sender: dirMap.get(m.sender_id) ?? { id: m.sender_id },
          recipients: (m.message_recipients ?? [])
            .map((mr: any) => dirMap.get(mr.recipient_id) ?? { id: mr.recipient_id })
            .filter(Boolean),
          _isSentByMe: true,
        }));

        const msgById = new Map<number, any>();
        [...receivedMsgs, ...sentMsgs].forEach((m) => {
          if (!msgById.has(m.id)) msgById.set(m.id, m);
          else if (msgById.get(m.id)!._isSentByMe && !m._isSentByMe) {
            msgById.set(m.id, m);
          }
        });

        const allMsgs = Array.from(msgById.values());
        const msgMap = new Map<number, any>();
        allMsgs.forEach((m) => msgMap.set(m.id, m));

        const getRootId = (msg: any, visited = new Set<number>()): number => {
          if (!msg.parent_id || visited.has(msg.id)) return msg.id;
          visited.add(msg.id);
          const parent = msgMap.get(msg.parent_id);
          return parent ? getRootId(parent, visited) : msg.id;
        };

        const threadMap = new Map<number, any[]>();
        allMsgs.forEach((m) => {
          const rootId = getRootId(m);
          if (!threadMap.has(rootId)) threadMap.set(rootId, []);
          threadMap.get(rootId)!.push(m);
        });

        const receivedIds = new Set(receivedMsgs.map((m) => m.id));
        const built = Array.from(threadMap.values())
          .filter((msgs) => msgs.some((m) => receivedIds.has(m.id)))
          .map((msgs) => {
            msgs.sort(
              (a, b) =>
                new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
            );
            const latest = msgs[0];
            const root = msgs[msgs.length - 1];
            let otherParty: any = null;
            for (const m of msgs) {
              if (m.sender_id && m.sender_id !== user.id && m.sender) {
                otherParty = m.sender;
                break;
              }
              const r = (m.recipients || []).find(
                (x: any) => x?.id && x.id !== user.id
              );
              if (r) {
                otherParty = r;
                break;
              }
            }
            const hasUnread = msgs.some((m) => !m._isSentByMe && !m.is_read);
            return {
              threadId: root.id,
              subject: stripRePrefix(root.subject || ""),
              body: latest.body,
              sent_at: latest.sent_at,
              is_read: !hasUnread,
              otherPartyName: formatFormalName(otherParty),
              messageCount: msgs.length,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
          );

        setThreads(built.slice(0, 12));
      } else if (openPanel === "notifications") {
        const { data: rawNotifs } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        const list = rawNotifs ?? [];
        const messageIds = Array.from(
          new Set(
            list
              .filter(
                (n: any) => (n.type || "").includes("message") && n.entity_id
              )
              .map((n: any) => Number(n.entity_id))
              .filter((id: number) => Number.isFinite(id) && id > 0)
          )
        );

        const msgMap = new Map<number, { subject?: string; body?: string }>();
        if (messageIds.length > 0) {
          const { data: msgRows } = await supabase
            .from("messages")
            .select("id, subject, body")
            .in("id", messageIds);
          for (const m of msgRows ?? []) {
            msgMap.set(Number(m.id), m);
          }
        }

        const enriched = list.map((n: any) => {
          if ((n.type || "").includes("message") && n.entity_id) {
            const m = msgMap.get(Number(n.entity_id));
            if (m) {
              return {
                ...n,
                _threadSubject: m.subject || n.body || "",
                body: m.body || n.body,
              };
            }
          }
          return n;
        });

        const groupMap = new Map<string, any[]>();
        for (const n of enriched) {
          const isMsg = (n.type || "").includes("message");
          const norm = isMsg
            ? stripRePrefix(n._threadSubject ?? n.body ?? "")
            : (n.body || "").trim();
          const key = isMsg
            ? `${n.type}::${(n.title || "").trim()}::${norm}`
            : `${n.type}::${(n.title || "").trim()}::${n.link_url || ""}::${norm}`;
          if (!groupMap.has(key)) groupMap.set(key, []);
          groupMap.get(key)!.push(n);
        }

        const groups = Array.from(groupMap.entries())
          .map(([key, items]) => {
            items.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
            const unreadIds = items.filter((i) => !i.is_read).map((i) => i.id);
            return {
              key,
              latest: items[0],
              count: items.length,
              unreadCount: unreadIds.length,
              unreadIds,
              isUnread: unreadIds.length > 0,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.latest.created_at).getTime() -
              new Date(a.latest.created_at).getTime()
          );

        setNotifGroups(groups.slice(0, 12));
      }
    } catch (err) {
      console.error("Quick panel fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [openPanel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!openPanel) return null;

  const fullPageHref = openPanel === "messages" ? "/inbox" : "/notifications";

  const handleMaximize = () => {
    onClose();
    router.push(fullPageHref);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadAction();
    setNotifGroups((prev) =>
      prev.map((g) => ({ ...g, unreadCount: 0, unreadIds: [], isUnread: false }))
    );
    window.dispatchEvent(new Event("icpep:counts-updated"));
  };

  const handleNotifClick = async (group: any) => {
    if (group.unreadIds?.length > 0) {
      await markNotificationGroupReadAction(group.unreadIds);
      window.dispatchEvent(new Event("icpep:counts-updated"));
    }
    const rawHref = group.latest?.link_url || "/notifications";
    const href = rawHref.replace(/^\/inbox\/(\d+)$/, "/inbox?thread=$1");
    onClose();
    router.push(href);
  };

  const getIconForType = (type: string) => {
    if (type.includes("event"))
      return <Calendar className="w-4 h-4 text-cyan-600" />;
    if (type.includes("message"))
      return <Mail className="w-4 h-4 text-cyan-600" />;
    if (type.includes("membership"))
      return <Award className="w-4 h-4 text-status-success" />;
    return <Sparkles className="w-4 h-4 text-status-post-officer" />;
  };

  const totalUnreadNotifs = notifGroups.reduce(
    (sum, g) => sum + g.unreadCount,
    0
  );

  return (
    <div
      className="fixed top-14 right-3 sm:right-6 lg:right-10 z-50 w-[min(390px,calc(100vw-24px))] bg-white border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[min(540px,calc(100vh-84px))]"
      role="dialog"
      aria-label={
        openPanel === "messages" ? "Messages quick view" : "Notifications quick view"
      }
    >
      {/* Floating Header with Maximize & Close */}
      <div className="px-4 py-3 border-b border-divider bg-surface-50 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
            {openPanel === "messages" ? (
              <Mail className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </div>
          <h3 className="text-[14px] font-bold text-ink-900 truncate">
            {openPanel === "messages" ? "Messages" : "Notifications"}
          </h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {openPanel === "notifications" && totalUnreadNotifs > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="px-2 py-1 rounded-lg text-[11px] font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Read all
            </button>
          )}

          <button
            type="button"
            onClick={handleMaximize}
            title={
              openPanel === "messages"
                ? "Maximize to full Inbox"
                : "Maximize to full Notifications"
            }
            aria-label="Maximize"
            className="p-1.5 rounded-lg text-text-500 hover:text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close"
            className="p-1.5 rounded-lg text-text-500 hover:text-ink-900 hover:bg-surface-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-divider">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-text-500 gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
            Loading…
          </div>
        ) : openPanel === "messages" ? (
          threads.length > 0 ? (
            threads.map((t) => (
              <Link
                key={t.threadId}
                href={`/inbox?thread=${t.threadId}`}
                onClick={onClose}
                className={`px-4 py-3 block transition-colors ${
                  !t.is_read
                    ? "bg-cyan-50/40 hover:bg-cyan-50/70"
                    : "hover:bg-surface-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs mb-0.5">
                  <span
                    className={`font-bold truncate ${
                      !t.is_read ? "text-cyan-600" : "text-ink-900"
                    }`}
                  >
                    {t.otherPartyName}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.messageCount > 1 && (
                      <span className="text-[10px] bg-cyan-50 text-cyan-600 font-bold px-1.5 py-0.5 rounded-full">
                        {t.messageCount}
                      </span>
                    )}
                    <span className="text-[11px] text-text-500">
                      {new Date(t.sent_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-[12.5px] font-semibold text-text-600 truncate">
                  {t.subject}
                </p>
                <p className="text-[12px] text-text-500 truncate mt-0.5">
                  {t.body}
                </p>
              </Link>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-text-500 space-y-2">
              <Mail className="w-6 h-6 mx-auto opacity-40" />
              <p>No conversations yet.</p>
            </div>
          )
        ) : notifGroups.length > 0 ? (
          notifGroups.map((group) => {
            const n = group.latest;
            const badgeCount = group.unreadCount;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => handleNotifClick(group)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                  group.isUnread
                    ? "bg-cyan-50/40 hover:bg-cyan-50/70"
                    : "hover:bg-surface-50"
                }`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center border border-[#D4EEF8]">
                    {getIconForType(n.type || "")}
                  </div>
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-cyan-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-ink-900 truncate">
                      {n.title}
                    </p>
                    <span className="text-[11px] text-text-500 shrink-0">
                      {new Date(n.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {n.body && (
                    <p className="text-[12px] text-text-600 truncate mt-0.5">
                      {n.body}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-12 text-center text-xs text-text-500 space-y-2">
            <Bell className="w-6 h-6 mx-auto opacity-40" />
            <p>You are all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
