import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import {
  markAllNotificationsReadAction,
  markNotificationGroupReadAction,
} from "./actions";
import {
  Calendar,
  Mail,
  Bell,
  Award,
  Check,
  Sparkles,
} from "lucide-react";
import { NotificationViewLink } from "./NotificationViewLink";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";

export const dynamic = "force-dynamic";

function stripRePrefix(text: string): string {
  return text.replace(/^(Re:\s*)+/i, "").trim();
}

interface NotificationGroup {
  key: string;
  latest: any;
  items: any[];
  count: number;
  unreadCount: number;
  unreadIds: number[];
  isUnread: boolean;
}

function groupNotifications(items: any[]): NotificationGroup[] {
  const map = new Map<string, any[]>();

  for (const n of items) {
    const isMsg = (n.type || "").includes("message");
    const normalizedBody = isMsg
      ? stripRePrefix(n._threadSubject ?? n.body ?? "")
      : (n.body || "").trim();
    const key = isMsg
      ? `${n.type}::${(n.title || "").trim()}::${normalizedBody}`
      : `${n.type}::${(n.title || "").trim()}::${n.link_url || ""}::${normalizedBody}`;

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }

  const groups: NotificationGroup[] = Array.from(map.entries()).map(
    ([key, groupItems]) => {
      groupItems.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const unreadIds = groupItems.filter((i) => !i.is_read).map((i) => i.id);
      return {
        key,
        latest: groupItems[0],
        items: groupItems,
        count: groupItems.length,
        unreadCount: unreadIds.length,
        unreadIds,
        isUnread: unreadIds.length > 0,
      };
    }
  );

  groups.sort(
    (a, b) =>
      new Date(b.latest.created_at).getTime() -
      new Date(a.latest.created_at).getTime()
  );

  return groups;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const filter = resolvedParams?.filter || "all";

  let user: any = null;
  let role: RoleCode = "non_member";
  let profile: any = null;
  let notifications: any[] = [];

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (!user) {
      redirect("/login?next=/notifications");
    }

    const [{ data: r }, { data: p }, { data: notifs }] = await Promise.all([
      supabase.rpc("auth_role"),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    role = (r as RoleCode) ?? "non_member";
    profile = p;
    const rawNotifs = notifs ?? [];

    // Fetch actual message bodies for message notifications so we show the
    // new message text instead of "Re: <subject>", while keeping subject for grouping.
    const messageIds = Array.from(
      new Set(
        rawNotifs
          .filter((n: any) => (n.type || "").includes("message") && n.entity_id)
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

    notifications = rawNotifs.map((n: any) => {
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
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    console.error("Notifications fetch error:", err);
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "events") return n.type.includes("event");
    if (filter === "posts") return n.type.includes("post");
    if (filter === "messages") return n.type.includes("message");
    if (filter === "membership") return n.type.includes("membership");
    return true;
  });

  const groupedNotifications = groupNotifications(filteredNotifications);
  const allGrouped = groupNotifications(notifications);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "User";
  const roleLabel = ROLE_LABELS[role] || "Student";

  const getIconForType = (type: string) => {
    if (type.includes("event"))
      return <Calendar className="w-5 h-5 text-cyan-600" />;
    if (type.includes("message"))
      return <Mail className="w-5 h-5 text-cyan-600" />;
    if (type.includes("membership"))
      return <Award className="w-5 h-5 text-status-success" />;
    return <Sparkles className="w-5 h-5 text-status-post-officer" />;
  };

  return (
    <PortalShell
      activeItem="Notifications"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-7 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-ink-900 tracking-[-0.5px]">
              Notifications
            </h1>
            <p className="text-[15px] text-text-500">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${
                    unreadCount === 1 ? "" : "s"
                  }.`
                : "You are all caught up!"}
            </p>
          </div>

          {unreadCount > 0 && (
            <form
              action={async () => {
                "use server";
                await markAllNotificationsReadAction();
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-border-default text-xs font-semibold text-ink-900 hover:border-cyan-500 hover:bg-cyan-50/40 hover:text-cyan-600 shadow-2xs transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            </form>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {[
            { key: "all", label: `All (${allGrouped.length})`, href: "/notifications" },
            { key: "messages", label: "Messages", href: "/notifications?filter=messages" },
            { key: "events", label: "Events", href: "/notifications?filter=events" },
            { key: "posts", label: "Announcements", href: "/notifications?filter=posts" },
            { key: "membership", label: "Membership", href: "/notifications?filter=membership" },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`h-8 px-3.5 rounded-full text-[13px] font-semibold transition-colors flex items-center ${
                filter === tab.key
                  ? "bg-cyan-500 text-on-brand"
                  : "bg-white border border-border-default text-text-500 hover:text-ink-900"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Stacked Notifications Feed */}
        {groupedNotifications.length > 0 ? (
          <div className="bg-white border border-border-default rounded-2xl divide-y divide-divider overflow-hidden shadow-xs">
            {groupedNotifications.map((group) => {
              const n = group.latest;
              const isUnread = group.isUnread;
              const badgeCount = group.unreadCount;

              return (
                <div
                  key={group.key}
                  className={`p-5 flex items-start gap-4 transition-colors ${
                    isUnread
                      ? "bg-cyan-50/30 hover:bg-cyan-50/50"
                      : "hover:bg-surface-50"
                  }`}
                >
                  {/* Icon with stacked count badge (only shown while unread) */}
                  <div className="relative shrink-0">
                    {isUnread && group.unreadCount > 1 && (
                      <div
                        aria-hidden="true"
                        className="absolute -bottom-1 -right-1 w-10.5 h-10.5 rounded-xl bg-[#CBEBF6] border border-[#B5E2F2]"
                      />
                    )}
                    <div className="relative w-10.5 h-10.5 rounded-xl bg-cyan-50 flex items-center justify-center border border-[#D4EEF8]">
                      {getIconForType(n.type)}
                    </div>
                    {badgeCount > 0 && (
                      <span
                        title={`${badgeCount} unread notification${badgeCount === 1 ? "" : "s"}`}
                        className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs"
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-[15px] font-bold text-ink-900 leading-snug truncate">
                          {n.title}
                        </h3>
                        {group.count > 1 && (
                          <span className="text-[11px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full shrink-0">
                            {group.count} notifications
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-text-500 shrink-0">
                        {new Date(n.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {n.body && (
                      <p className="text-[13px] text-text-600 leading-relaxed">
                        {n.body}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      {n.link_url ? (
                        <NotificationViewLink
                          href={n.link_url.replace(/^\/inbox\/(\d+)$/, "/inbox?thread=$1")}
                          unreadIds={group.unreadIds}
                        />
                      ) : (
                        <div />
                      )}

                      {isUnread && (
                        <form
                          action={async () => {
                            "use server";
                            await markNotificationGroupReadAction(group.unreadIds);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-[11px] font-semibold text-text-500 hover:text-ink-900 cursor-pointer"
                          >
                            Mark as read
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-border-default rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <Bell className="w-8 h-8 text-text-500 mx-auto opacity-50" />
            <h3 className="text-[17px] font-bold text-ink-900">
              No notifications
            </h3>
            <p className="text-[14px] text-text-500 max-w-sm mx-auto">
              You are all caught up! Updates regarding events, posts, and
              memberships will appear here.
            </p>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
