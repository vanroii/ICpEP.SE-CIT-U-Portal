import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ComposeMessageModal } from "./ComposeMessageModal";
import { MessageThreadView } from "./MessageThreadView";
import { markMessageReadAction } from "./actions";
import { Mail, Inbox, Send, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; tab?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const selectedId = resolvedParams?.id ? Number(resolvedParams.id) : null;
  const tab = resolvedParams?.tab || "inbox";

  let user: any = null;
  let messages: any[] = [];
  let directory: any[] = [];
  let currentMessage: any = null;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (user) {
      const [{ data: dirData }, { data: msgsData }] = await Promise.all([
        supabase.from("user_directory").select("*").neq("id", user.id).limit(50),
        supabase
          .from("messages")
          .select("*, sender:sender_id(id,first_name,last_name), recipients:message_recipients(recipient:recipient_id(id,first_name,last_name), is_read, deleted_at)")
          .order("sent_at", { ascending: false }),
      ]);

      directory = dirData ?? [];
      messages = msgsData ?? [];

      if (selectedId) {
        currentMessage = messages.find((m) => m.id === selectedId);
        // Automatically mark read if recipient
        if (currentMessage) {
          const isRecipient = currentMessage.recipients?.some(
            (r: any) => r.recipient?.id === user.id && !r.is_read
          );
          if (isRecipient) {
            await supabase.rpc("mark_message_read", { p_message_id: selectedId });
          }
        }
      } else if (messages.length > 0) {
        currentMessage = messages[0];
      }
    }
  } catch {
    // offline fallback
  }

  // Fallback demo conversations if no database messages yet
  if (messages.length === 0) {
    messages = [
      {
        id: 1,
        sender_id: "system",
        sender: { id: "system", first_name: "Executive", last_name: "Board" },
        subject: "Welcome to ICpEP.SE CIT-U Portal",
        body: "Hello Wildcat!\n\nWelcome to our official chapter messaging system. You can connect directly with officers, advisers, and peers regarding organization events and academic concerns.",
        sent_at: "2026-10-01T10:00:00+08:00",
        recipients: [{ is_read: true, recipient: { id: user?.id || "me", first_name: "Me", last_name: "" } }],
      },
      {
        id: 2,
        sender_id: "sec",
        sender: { id: "sec", first_name: "Membership", last_name: "Committee" },
        subject: "AY 2026–2027 Membership Claim Guidelines",
        body: "Hi! If you have previously registered during the on-campus general enrollment, kindly verify your claim reference in your Student Dashboard.",
        sent_at: "2026-10-03T14:30:00+08:00",
        recipients: [{ is_read: false, recipient: { id: user?.id || "me", first_name: "Me", last_name: "" } }],
      },
    ];
    if (!currentMessage) currentMessage = messages[0];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1613] flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-[#0a7db0]" />
            Messages & Mailbox
          </h1>
          <p className="text-xs text-[#8c8785] mt-0.5">
            Internal communication network for CIT-U CpE students and chapter officers (FR-10).
          </p>
        </div>

        <ComposeMessageModal directory={directory} />
      </div>

      {/* Split Layout (§13.2 Screen 6) */}
      <div className="grid grid-cols-1 md:grid-cols-12 rounded-3xl border border-[#e0dedb] bg-white overflow-hidden shadow-xs min-h-[550px]">
        {/* Left Pane (Message List - 5 cols) */}
        <div className="md:col-span-5 border-r border-[#e0dedb] flex flex-col">
          <div className="p-4 border-b border-[#f0eeeb] flex items-center justify-between">
            <span className="text-xs font-bold text-[#1b1613] uppercase tracking-wider">
              Conversations
            </span>
            <span className="text-[11px] text-[#8c8785]">
              {messages.length} thread{messages.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="divide-y divide-[#f0eeeb] overflow-y-auto flex-1">
            {messages.map((m) => {
              const isSelected = currentMessage?.id === m.id;
              const isSender = m.sender_id === user?.id;
              const otherParty = isSender
                ? m.recipients?.[0]?.recipient
                : m.sender;
              const otherName = otherParty
                ? `${otherParty.first_name} ${otherParty.last_name}`
                : "Member";

              const isUnread = !isSender && m.recipients?.some((r: any) => !r.is_read);

              return (
                <Link
                  key={m.id}
                  href={`/inbox?id=${m.id}`}
                  className={`block p-4 transition-colors ${
                    isSelected
                      ? "bg-[#e3f6fc]/70 border-l-4 border-[#0a7db0]"
                      : isUnread
                      ? "bg-[#f8f8f7] font-semibold"
                      : "hover:bg-[#f8f8f7]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#1b1613] truncate max-w-[180px]">
                      {otherName}
                    </span>
                    <span className="text-[10px] text-[#8c8785]">
                      {new Date(m.sent_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-[#1b1613] truncate">
                    {m.subject}
                  </h3>
                  <p className="text-[11px] text-[#8c8785] line-clamp-1 mt-0.5">
                    {m.body}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Pane (Message Detail - 7 cols) */}
        <div className="md:col-span-7 flex flex-col bg-white">
          <MessageThreadView
            message={currentMessage}
            currentUserId={user?.id || ""}
          />
        </div>
      </div>
    </div>
  );
}
