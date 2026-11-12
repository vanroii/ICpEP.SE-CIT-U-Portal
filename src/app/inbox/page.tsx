import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { ComposeMessageModal } from "./ComposeMessageModal";
import { MessageThreadView } from "./MessageThreadView";
import { markMessageReadAction } from "./actions";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";
import { Search, Mail, Send, Inbox as InboxIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; thread?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeTab = resolvedParams?.tab || "all";
  const selectedThreadId = resolvedParams?.thread ? Number(resolvedParams.thread) : null;

  let user: any = null;
  let role: RoleCode = "non_member";
  let profile: any = null;
  let inboxList: any[] = [];
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
      supabase.from("user_directory").select("*").limit(50),
    ]);

    role = (r as RoleCode) ?? "non_member";
    profile = p;
    directory = dirData ?? [];

    if (activeTab === "sent") {
      const { data: sentMessages } = await supabase
        .from("messages")
        .select("id,subject,body,sent_at,sender_id,message_recipients(recipient:profiles(id,first_name,last_name,avatar_url))")
        .eq("sender_id", user.id)
        .is("sender_deleted_at", null)
        .order("sent_at", { ascending: false });

      inboxList = (sentMessages || []).map((m: any) => ({
        id: m.id,
        subject: m.subject,
        body: m.body,
        sent_at: m.sent_at,
        sender_id: m.sender_id,
        is_read: true,
        sender: profile,
        recipients: (m.message_recipients || []).map((mr: any) => mr.recipient),
      }));
    } else {
      const { data: received } = await supabase
        .from("message_recipients")
        .select("is_read,message_id,messages(id,subject,body,sent_at,sender_id,sender:profiles!messages_sender_id_fkey(id,first_name,last_name,avatar_url))")
        .eq("recipient_id", user.id)
        .is("deleted_at", null)
        .order("is_read", { ascending: true });

      inboxList = (received || [])
        .filter((r: any) => r.messages)
        .map((r: any) => ({
          id: r.messages.id,
          subject: r.messages.subject,
          body: r.messages.body,
          sent_at: r.messages.sent_at,
          sender_id: r.messages.sender_id,
          is_read: r.is_read,
          sender: r.messages.sender,
          recipients: [profile],
        }));

      if (activeTab === "unread") {
        inboxList = inboxList.filter((m) => !m.is_read);
      }
    }

    // Auto mark as read if thread is opened
    if (selectedThreadId && activeTab !== "sent") {
      await supabase
        .from("message_recipients")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("message_id", selectedThreadId)
        .eq("recipient_id", user.id);
    }
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    console.error("Inbox data fetch error:", err);
  }

  const selectedMessage = selectedThreadId
    ? inboxList.find((m) => m.id === selectedThreadId) || null
    : inboxList[0] || null;

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "User";
  const roleLabel = ROLE_LABELS[role] || "Student";

  return (
    <PortalShell
      activeItem="Inbox"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-6 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Internal Messaging
            </h1>
            <p className="text-[15px] text-[#817B77]">
              Communicate directly with CIT-U chapter student officers and faculty.
            </p>
          </div>

          <ComposeMessageModal directory={directory} />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/inbox"
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors flex items-center ${
              activeTab === "all"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            Inbox
          </Link>
          <Link
            href="/inbox?tab=unread"
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors flex items-center ${
              activeTab === "unread"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            Unread
          </Link>
          <Link
            href="/inbox?tab=sent"
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors flex items-center ${
              activeTab === "sent"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            Sent
          </Link>
        </div>

        {/* Messaging Layout: Threads List + Thread Detail */}
        <div className="bg-white border border-[#DEDBD8] rounded-[16px] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[550px] shadow-xs">
          {/* Threads Column (5 cols) */}
          <div className="md:col-span-5 border-r border-[#EEECEA] flex flex-col">
            <div className="p-3 border-b border-[#EEECEA] bg-[#FAF9F8]">
              <span className="text-[12px] font-bold text-[#817B77] uppercase tracking-wider">
                {activeTab === "sent" ? "Sent Messages" : "Conversations"} ({inboxList.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#EEECEA]">
              {inboxList.length > 0 ? (
                inboxList.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  const isUnread = !msg.is_read;
                  const partyName = activeTab === "sent"
                    ? msg.recipients?.[0]
                      ? `${msg.recipients[0].first_name} ${msg.recipients[0].last_name}`
                      : "Recipient"
                    : msg.sender
                    ? `${msg.sender.first_name} ${msg.sender.last_name}`
                    : "Chapter Member";

                  return (
                    <Link
                      key={msg.id}
                      href={`/inbox?tab=${activeTab}&thread=${msg.id}`}
                      className={`p-4 block transition-colors ${
                        isSelected
                          ? "bg-[#E3F6FC]/60"
                          : isUnread
                          ? "bg-[#E3F6FC]/20 hover:bg-[#E3F6FC]/40"
                          : "hover:bg-[#FAF9F8]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-bold truncate ${isUnread ? "text-[#0087B5]" : "text-[#1C1713]"}`}>
                          {partyName}
                        </span>
                        <span className="text-[11px] text-[#817B77] shrink-0">
                          {new Date(msg.sent_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <h4 className={`text-[13px] truncate ${isUnread ? "font-bold text-[#1C1713]" : "font-semibold text-[#514B47]"}`}>
                        {msg.subject}
                      </h4>
                      <p className="text-[12px] text-[#817B77] truncate mt-0.5">
                        {msg.body}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-[#817B77] space-y-2">
                  <InboxIcon className="w-6 h-6 mx-auto opacity-50" />
                  <p>No messages in this folder.</p>
                </div>
              )}
            </div>
          </div>

          {/* Thread Content Column (7 cols) */}
          <div className="md:col-span-7 flex flex-col bg-white">
            {selectedMessage ? (
              <MessageThreadView
                message={selectedMessage}
                currentUserId={user.id}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-[#817B77] space-y-2">
                <Mail className="w-8 h-8 opacity-40 text-[#0087B5]" />
                <p>Select a message to view the conversation thread.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
