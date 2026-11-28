import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { ComposeMessageModal } from "./ComposeMessageModal";
import { MessageThreadView } from "./MessageThreadView";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";
import { Mail, Inbox as InboxIcon } from "lucide-react";
import Link from "next/link";
import { stripRePrefix, formatFormalName } from "./utils";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; thread?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeTab = resolvedParams?.tab === "unread" ? "unread" : "all";
  const selectedThreadId = resolvedParams?.thread
    ? Number(resolvedParams.thread)
    : null;

  let user: any = null;
  let role: RoleCode = "non_member";
  let profile: any = null;
  let threads: any[] = [];
  let directory: any[] = [];

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (!user) {
      redirect("/login?next=/inbox");
    }

    const [{ data: r }, { data: p }, { data: dirData }] = await Promise.all([
      supabase.rpc("auth_role"),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_directory").select("*").limit(500),
    ]);

    role = (r as RoleCode) ?? "non_member";
    profile = p;
    directory = dirData ?? [];

    // Build lookup map from user_directory so students can resolve officer/faculty/other profiles
    // even when `profiles` table RLS restricts direct joins.
    const dirMap = new Map<string, any>();
    for (const u of directory) {
      if (u?.id) dirMap.set(u.id, u);
    }
    if (profile?.id && !dirMap.has(profile.id)) {
      dirMap.set(profile.id, { ...profile, role_code: role });
    }

    const resolvePerson = (id?: string | null, joined?: any) => {
      if (id && dirMap.has(id)) return dirMap.get(id);
      if (joined?.id) return { ...joined, role_code: joined.role_code ?? null };
      if (id) return { id, first_name: "", last_name: "", role_code: null };
      return null;
    };

    // ── INBOX / UNREAD TAB ────────────────────────────────────
    const [{ data: received }, { data: sent }] = await Promise.all([
      supabase
        .from("message_recipients")
        .select(`
          is_read, message_id,
          messages(
            id, subject, body, sent_at, sender_id, parent_id,
            sender:profiles!messages_sender_id_fkey(id,first_name,last_name,avatar_url)
          )
        `)
        .eq("recipient_id", user.id)
        .is("deleted_at", null)
        .order("is_read", { ascending: true }),
      supabase
        .from("messages")
        .select(`
          id, subject, body, sent_at, sender_id, parent_id,
          message_recipients(recipient_id, recipient:profiles(id,first_name,last_name,avatar_url))
        `)
        .eq("sender_id", user.id)
        .is("sender_deleted_at", null),
    ]);

    const receivedMsgs = (received || [])
      .filter((r: any) => r.messages)
      .map((r: any) => ({
        id: r.messages.id,
        subject: r.messages.subject,
        body: r.messages.body,
        sent_at: r.messages.sent_at,
        sender_id: r.messages.sender_id,
        parent_id: r.messages.parent_id,
        is_read: r.is_read,
        sender: resolvePerson(r.messages.sender_id, r.messages.sender),
        recipients: [resolvePerson(user.id, profile)].filter(Boolean),
        _isSentByMe: false,
      }));

    const sentMsgs = (sent || []).map((m: any) => ({
      id: m.id,
      subject: m.subject,
      body: m.body,
      sent_at: m.sent_at,
      sender_id: m.sender_id,
      parent_id: m.parent_id,
      is_read: true,
      sender: resolvePerson(m.sender_id, profile),
      recipients: (m.message_recipients || [])
        .map((mr: any) => resolvePerson(mr.recipient_id, mr.recipient))
        .filter(Boolean),
      _isSentByMe: true,
    }));

    // Merge and deduplicate by id
    const msgById = new Map<number, any>();
    [...receivedMsgs, ...sentMsgs].forEach((m) => {
      if (!msgById.has(m.id)) {
        msgById.set(m.id, m);
      } else {
        const existing = msgById.get(m.id)!;
        if (existing._isSentByMe && !m._isSentByMe) {
          msgById.set(m.id, m);
        }
      }
    });

    const allMsgs = Array.from(msgById.values());
    let allThreads = buildThreads(allMsgs, user.id);

    if (activeTab === "unread") {
      allThreads = allThreads.filter((t) => !t.is_read);
    }

    threads = allThreads;

    // Auto mark the currently viewed thread as read via security-definer RPC
    // (direct UPDATE on message_recipients is blocked by RLS).
    if (threads.length > 0) {
      const activeT = selectedThreadId
        ? threads.find(
            (t) =>
              t.threadId === selectedThreadId ||
              t.latestId === selectedThreadId ||
              t.allMessages.some((m: any) => m.id === selectedThreadId)
          ) || threads[0]
        : threads[0];

      if (activeT) {
        const unreadIds: number[] = activeT.allMessages
          .filter((m: any) => !m._isSentByMe && !m.is_read)
          .map((m: any) => m.id);

        if (unreadIds.length > 0) {
          await Promise.all(
            unreadIds.map((id) =>
              supabase.rpc("mark_message_read", { p_message_id: id })
            )
          );
          activeT.is_read = true;
          for (const m of activeT.allMessages) {
            if (!m._isSentByMe) m.is_read = true;
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    console.error("Inbox data fetch error:", err);
  }

  // Find selected thread (match by root threadId, latestId, or any message id inside the thread)
  const selectedThread = selectedThreadId
    ? threads.find(
        (t) =>
          t.threadId === selectedThreadId ||
          t.latestId === selectedThreadId ||
          t.allMessages.some((m: any) => m.id === selectedThreadId)
      ) ||
      threads[0] ||
      null
    : threads[0] || null;

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "User";
  const roleLabel = ROLE_LABELS[role] || "Student";

  return (
    <PortalShell
      activeItem="Inbox"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-5 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-[28px] leading-9 font-bold text-ink-900 tracking-[-0.5px]">
              Internal Messaging
            </h1>
            <p className="text-[14px] text-text-500">
              Communicate directly with CIT-U chapter student officers and faculty.
            </p>
          </div>
          <ComposeMessageModal directory={directory} />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2.5">
          {[
            { label: "Inbox", tab: "all", href: "/inbox" },
            { label: "Unread", tab: "unread", href: "/inbox?tab=unread" },
          ].map(({ label, tab, href }) => (
            <Link
              key={tab}
              href={href}
              className={`h-8 px-3.5 rounded-full text-[13px] font-semibold transition-colors flex items-center ${
                activeTab === tab
                  ? "bg-cyan-500 text-on-brand"
                  : "bg-white border border-border-default text-text-500 hover:text-ink-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Messaging Layout: fixed viewport height so list + chat scroll independently */}
        <div className="bg-white border border-border-default rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-230px)] min-h-135 max-h-190 shadow-xs">
          {/* Thread List (4/5 cols) */}
          <div className="md:col-span-4 lg:col-span-4 border-r border-divider flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-divider bg-surface-50 shrink-0">
              <span className="text-[11px] font-bold text-text-500 uppercase tracking-wider">
                Conversations ({threads.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-divider">
              {threads.length > 0 ? (
                threads.map((thread) => {
                  const isSelected =
                    selectedThread?.threadId === thread.threadId;
                  const isUnread = !thread.is_read;

                  const partyName = thread.otherPartyName || "Chapter Member";

                  return (
                    <Link
                      key={thread.threadId}
                      href={`/inbox?tab=${activeTab}&thread=${thread.threadId}`}
                      className={`p-4 block transition-colors ${
                        isSelected
                          ? "bg-cyan-50/65 border-l-2 border-l-cyan-500"
                          : isUnread
                          ? "bg-cyan-50/20 hover:bg-cyan-50/40"
                          : "hover:bg-surface-50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1 gap-2">
                        <span
                          className={`font-bold truncate ${
                            isUnread ? "text-cyan-600" : "text-ink-900"
                          }`}
                        >
                          {partyName}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {thread.messageCount > 1 && (
                            <span className="text-[10px] bg-cyan-50 text-cyan-600 font-bold px-1.5 py-0.5 rounded-full">
                              {thread.messageCount}
                            </span>
                          )}
                          <span className="text-[11px] text-text-500">
                            {new Date(thread.sent_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        </div>
                      </div>
                      <h4
                        className={`text-[13px] truncate ${
                          isUnread
                            ? "font-bold text-ink-900"
                            : "font-semibold text-text-600"
                        }`}
                      >
                        {thread.subject}
                      </h4>
                      <p className="text-[12px] text-text-500 truncate mt-0.5">
                        {thread.body}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-text-500 space-y-2">
                  <InboxIcon className="w-6 h-6 mx-auto opacity-50" />
                  <p>No messages in this folder.</p>
                </div>
              )}
            </div>
          </div>

          {/* Thread Detail (8 cols) */}
          <div className="md:col-span-8 lg:col-span-8 flex flex-col bg-white min-h-0">
            {selectedThread ? (
              <MessageThreadView
                thread={selectedThread}
                currentUserId={user.id}
                currentUserProfile={{ ...profile, role_code: role }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-text-500 space-y-2">
                <Mail className="w-8 h-8 opacity-40 text-cyan-600" />
                <p>Select a message to view the conversation thread.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

// ── Helper: group flat message list into conversation threads ──────────────
function buildThreads(messages: any[], currentUserId: string) {
  if (!messages.length) return [];

  const msgMap = new Map<number, any>();
  messages.forEach((m) => msgMap.set(m.id, m));

  function getRootId(msg: any, visited = new Set<number>()): number {
    if (!msg.parent_id) return msg.id;
    if (visited.has(msg.id)) return msg.id;
    visited.add(msg.id);
    const parent = msgMap.get(msg.parent_id);
    if (!parent) return msg.id;
    return getRootId(parent, visited);
  }

  const threadMap = new Map<number, any[]>();
  messages.forEach((m) => {
    const rootId = getRootId(m);
    if (!threadMap.has(rootId)) threadMap.set(rootId, []);
    threadMap.get(rootId)!.push(m);
  });

  const result = Array.from(threadMap.values()).map((msgs) => {
    msgs.sort(
      (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
    );
    const latest = msgs[0];
    const root = msgs[msgs.length - 1];

    // Scan messages in thread to reliably identify the other participant
    let otherPartyProfile: any = null;
    for (const m of msgs) {
      if (m.sender_id && m.sender_id !== currentUserId && m.sender) {
        otherPartyProfile = m.sender;
        break;
      }
      const otherRecip = (m.recipients || []).find(
        (r: any) => r?.id && r.id !== currentUserId
      );
      if (otherRecip) {
        otherPartyProfile = otherRecip;
        break;
      }
    }

    const otherPartyName = formatFormalName(otherPartyProfile);
    const hasUnread = msgs.some((m) => !m._isSentByMe && !m.is_read);

    return {
      threadId: root.id,
      latestId: latest.id,
      subject: stripRePrefix(root.subject),
      body: latest.body,
      sent_at: latest.sent_at,
      sender_id: latest.sender_id,
      is_read: !hasUnread,
      sender: latest.sender,
      recipients: latest.recipients,
      otherParty: otherPartyProfile,
      otherPartyName,
      messageCount: msgs.length,
      allMessages: msgs,
    };
  });

  result.sort(
    (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  );

  return result;
}
