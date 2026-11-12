import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { markAllNotificationsReadAction, markNotificationReadAction } from "./actions";
import { Calendar, Mail, Bell, Award, Check, Sparkles, ArrowRight } from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";

export const dynamic = "force-dynamic";

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
    notifications = notifs ?? [];
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "User";
  const roleLabel = ROLE_LABELS[role] || "Student";

  const getIconForType = (type: string) => {
    if (type.includes("event")) return <Calendar className="w-5 h-5 text-[#0087B5]" />;
    if (type.includes("message")) return <Mail className="w-5 h-5 text-[#0087B5]" />;
    if (type.includes("membership")) return <Award className="w-5 h-5 text-[#15803D]" />;
    return <Sparkles className="w-5 h-5 text-[#B45309]" />;
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
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Notifications
            </h1>
            <p className="text-[15px] text-[#817B77]">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.` : "You are all caught up!"}
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
                className="text-[14px] font-semibold text-[#0087B5] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
            </form>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/notifications"
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors flex items-center ${
              filter === "all"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            All ({notifications.length})
          </Link>
          <Link
            href="/notifications?filter=events"
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors flex items-center ${
              filter === "events"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            Events
          </Link>
          <Link
            href="/notifications?filter=posts"
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors flex items-center ${
              filter === "posts"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            Announcements
          </Link>
          <Link
            href="/notifications?filter=membership"
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors flex items-center ${
              filter === "membership"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            Membership
          </Link>
        </div>

        {/* Notifications Feed */}
        {filteredNotifications.length > 0 ? (
          <div className="bg-white border border-[#DEDBD8] rounded-[16px] divide-y divide-[#EEECEA] overflow-hidden shadow-xs">
            {filteredNotifications.map((n) => {
              const isUnread = !n.is_read;
              return (
                <div
                  key={n.id}
                  className={`p-5 flex items-start gap-4 transition-colors ${
                    isUnread ? "bg-[#E3F6FC]/30 hover:bg-[#E3F6FC]/50" : "hover:bg-[#FAF9F8]"
                  }`}
                >
                  <div className="w-[42px] h-[42px] rounded-[12px] bg-[#E3F6FC] flex items-center justify-center shrink-0">
                    {getIconForType(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[15px] font-bold text-[#1C1713] leading-snug">
                        {n.title}
                      </h3>
                      <span className="text-[12px] text-[#817B77] shrink-0">
                        {new Date(n.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {n.body && (
                      <p className="text-[13px] text-[#514B47] leading-relaxed">
                        {n.body}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      {n.link_url ? (
                        <Link
                          href={n.link_url}
                          className="text-[12px] font-semibold text-[#0087B5] hover:underline flex items-center gap-1"
                        >
                          View details <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <div />
                      )}

                      {isUnread && (
                        <form
                          action={async () => {
                            "use server";
                            await markNotificationReadAction(n.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-[11px] font-semibold text-[#817B77] hover:text-[#1C1713] cursor-pointer"
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
          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-12 text-center space-y-3 shadow-xs">
            <Bell className="w-8 h-8 text-[#817B77] mx-auto opacity-50" />
            <h3 className="text-[17px] font-bold text-[#1C1713]">No notifications</h3>
            <p className="text-[14px] text-[#817B77] max-w-sm mx-auto">
              You are all caught up! Updates regarding events, posts, and memberships will appear here.
            </p>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
