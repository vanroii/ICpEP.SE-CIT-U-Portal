import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";
import { MailShell } from "./MailShell";
import type { MailItem } from "./MailList";

export const dynamic = "force-dynamic";

const MAIL_ROLES = ["officer", "member", "faculty"];

export default async function MailPage({
  searchParams,
}: {
  searchParams?: Promise<{ folder?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const folder = ["inbox", "starred", "sent", "drafts", "scheduled", "trash"].includes(resolvedParams?.folder ?? "")
    ? (resolvedParams?.folder as string)
    : "inbox";

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (!user) redirect("/login?next=/mail");

  const [{ data: roleData }, { data: profile }, { data: dirData }] = await Promise.all([
    supabase.rpc("auth_role"),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_directory").select("*").limit(500),
  ]);

  const role = (roleData as RoleCode) ?? "non_member";

  // Guard: only allowed roles
  if (!MAIL_ROLES.includes(role)) {
    redirect("/student");
  }

  const directory = (dirData ?? []).filter((u: any) =>
    u.id !== user.id && MAIL_ROLES.includes(u.role_code)
  );

  // ── Fetch received messages ──────────────────────────────────────────────────
  let inboxQuery = supabase
    .from("message_recipients")
    .select(`
      is_read, is_starred, folder,
      message_id,
      messages!inner(
        id, subject, body, sent_at, sender_id, parent_id, message_type,
        mail_attachments(id,file_name,size_bytes,content_type),
        sender:profiles!messages_sender_id_fkey(id,first_name,last_name,avatar_url,role_id)
      )
    `)
    .eq("recipient_id", user.id);
  inboxQuery = inboxQuery.eq("messages.message_type", "mail");

  // Apply folder filter
  if (folder === "trash") {
    inboxQuery = inboxQuery.eq("folder", "trash");
  } else {
    inboxQuery = inboxQuery.is("deleted_at", null).eq("folder", "inbox");
  }

  const [
    { data: received, error: receivedError },
    { data: sent, error: sentError },
    { data: sentTrash, error: sentTrashError },
    { data: draftsData, error: draftsError },
    { data: scheduledData, error: scheduledError },
  ] = await Promise.all([
    inboxQuery,
    supabase
      .from("messages")
      .select(`
        id, subject, body, sent_at, sender_id, parent_id, message_type,
        mail_attachments(id,file_name,size_bytes,content_type),
        message_recipients(recipient_id, is_read, recipient:profiles(id,first_name,last_name,avatar_url,role_id))
      `)
      .eq("sender_id", user.id)
      .eq("message_type", "mail")
      .is("sender_deleted_at", null),
    supabase
      .from("messages")
      .select(`
        id, subject, body, sent_at, sender_id, parent_id, message_type,
        mail_attachments(id,file_name,size_bytes,content_type),
        message_recipients(recipient_id, is_read, recipient:profiles(id,first_name,last_name,avatar_url,role_id))
      `)
      .eq("sender_id", user.id)
      .eq("message_type", "mail")
      .not("sender_deleted_at", "is", null)
      .eq("sender_permanently_deleted", false),
    supabase
      .from("mail_drafts")
      .select("*, mail_attachments(id,file_name,size_bytes,object_path)")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("mail_scheduled")
      .select("*, mail_attachments(id,file_name,size_bytes,content_type)")
      .eq("owner_id", user.id)
      .neq("status", "sent")
      .order("send_at", { ascending: true }),
  ]);
  const mailLoadError = [receivedError, sentError, sentTrashError, draftsError, scheduledError]
    .find((error) => error)?.message ?? null;

  // ── Build profile → role_code map ────────────────────────────────────────────
  const dirMap = new Map<string, any>();
  for (const u of (dirData ?? [])) { if (u?.id) dirMap.set(u.id, u); }
  if (profile?.id && !dirMap.has(profile.id)) dirMap.set(profile.id, { ...profile, role_code: role });

  function resolvePerson(id?: string | null, joined?: any) {
    if (id && dirMap.has(id)) return dirMap.get(id);
    if (joined?.id) return joined;
    return id ? { id } : null;
  }

  // ── Map received ─────────────────────────────────────────────────────────────
  const receivedMails: MailItem[] = (received ?? [])
    .filter((r: any) => r.messages)
    .map((r: any) => ({
      id: r.messages.id,
      subject: r.messages.subject ?? "",
      body: r.messages.body ?? "",
      sent_at: r.messages.sent_at,
      is_read: r.is_read,
      is_starred: r.is_starred ?? false,
      folder: r.folder ?? "inbox",
      sender: resolvePerson(r.messages.sender_id, r.messages.sender),
      recipients: [resolvePerson(user.id, profile)].filter(Boolean),
      _isSentByMe: false,
      attachments: r.messages.mail_attachments ?? [],
    }));

  // ── Map sent ──────────────────────────────────────────────────────────────────
  const sentMails: MailItem[] = (sent ?? []).map((m: any) => ({
    id: m.id,
    subject: m.subject ?? "",
    body: m.body ?? "",
    sent_at: m.sent_at,
    is_read: true,
    is_starred: false,
    folder: "sent",
    sender: resolvePerson(m.sender_id, profile),
    recipients: (m.message_recipients ?? [])
      .map((mr: any) => resolvePerson(mr.recipient_id, mr.recipient))
      .filter(Boolean),
    _isSentByMe: true,
    attachments: m.mail_attachments ?? [],
  }));
  const sentTrashMails: MailItem[] = (sentTrash ?? []).map((m: any) => ({
    id: m.id,
    subject: m.subject ?? "",
    body: m.body ?? "",
    sent_at: m.sent_at,
    is_read: true,
    is_starred: false,
    folder: "trash",
    sender: resolvePerson(m.sender_id, profile),
    recipients: (m.message_recipients ?? [])
      .map((mr: any) => resolvePerson(mr.recipient_id, mr.recipient))
      .filter(Boolean),
    _isSentByMe: true,
    attachments: m.mail_attachments ?? [],
  }));

  // ── Filter by folder ──────────────────────────────────────────────────────────
  let mails: MailItem[] = [];
  if (folder === "inbox")   mails = receivedMails.filter((m) => m.folder !== "trash");
  if (folder === "starred") mails = receivedMails.filter((m) => m.is_starred && m.folder !== "trash");
  if (folder === "sent")    mails = sentMails;
  if (folder === "trash")   mails = [
    ...receivedMails.filter((m) => m.folder === "trash"),
    ...sentTrashMails,
  ];
  if (folder === "drafts")  mails = [];

  // Sort newest first
  mails.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

  // ── Counts for sidebar badges ─────────────────────────────────────────────────
  const inboxUnread    = receivedMails.filter((m) => !m.is_read && m.folder !== "trash").length;
  const starredCount   = receivedMails.filter((m) => m.is_starred && m.folder !== "trash").length;
  const sentCount      = sentMails.length;
  const draftsCount    = (draftsData ?? []).length;
  const scheduledCount = (scheduledData ?? []).filter((mail: any) => mail.status === "queued").length;
  const trashCount     = receivedMails.filter((m) => m.folder === "trash").length + sentTrashMails.length;

  const counts = { inbox: inboxUnread, starred: starredCount, sent: sentCount, drafts: draftsCount, scheduled: scheduledCount, trash: trashCount };

  const fullName  = profile ? `${profile.first_name} ${profile.last_name}` : "User";
  const roleLabel = ROLE_LABELS[role] ?? "Member";

  return (
    <PortalShell
      activeItem="Mail"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
      unreadMessages={inboxUnread}
    >
      {/* Full-height mail layout — override default page padding */}
      <div
        className="rounded-2xl border border-border-default bg-white shadow-xs overflow-hidden flex flex-col"
        style={{ height: "calc(100vh - 100px)", minHeight: "520px" }}
      >
        <MailShell
          folder={folder}
          mails={mails}
          drafts={draftsData ?? []}
          scheduled={scheduledData ?? []}
          mailLoadError={mailLoadError}
          directory={directory}
          counts={counts}
          currentUserId={user.id}
          currentUserProfile={{ ...profile, role_code: role }}
        />
      </div>
    </PortalShell>
  );
}

