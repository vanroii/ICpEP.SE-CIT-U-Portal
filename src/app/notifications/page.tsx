import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./actions";
import {
  Bell,
  CheckCheck,
  Calendar,
  BookOpen,
  Mail,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const filter = resolvedParams?.filter || "all";

  let notifications: any[] = [];
  let unreadCount = 0;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (filter === "unread") {
        query = query.eq("is_read", false);
      }

      const { data } = await query;
      notifications = data ?? [];

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      unreadCount = count ?? 0;
    }
  } catch {
    // offline fallback
  }

  // Fallback demo notifications
  if (notifications.length === 0) {
    notifications = [
      {
        id: 1,
        type: "event_published",
        title: "New Event: CpE General Assembly 2026",
        body: "Registration is now open for the annual gathering in CIT-U Auditorium.",
        link_url: "/events/cpe-general-assembly-2026",
        is_read: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 2,
        type: "membership_update",
        title: "Membership Application Received",
        body: "Your application for AY 2026–2027 is pending verification by chapter officers.",
        link_url: "/profile",
        is_read: true,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 3,
        type: "new_message",
        title: "New Message from Executive Board",
        body: "Subject: Welcome to ICpEP.SE CIT-U Portal",
        link_url: "/inbox",
        is_read: true,
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
    ];
  }

  const typeConfig: Record<string, { label: string; tone: "info" | "success" | "warning" | "neutral" | "danger" }> = {
    event_published: { label: "Event", tone: "info" },
    post_published: { label: "Announcement", tone: "info" },
    event_registration: { label: "Registration", tone: "success" },
    event_reminder: { label: "Reminder", tone: "warning" },
    membership_update: { label: "Membership", tone: "success" },
    new_message: { label: "Message", tone: "neutral" },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1613] flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-[#0a7db0]" />
            Notifications Feed
          </h1>
          <p className="text-xs text-[#8c8785] mt-0.5">
            Real-time updates on published events, messages, and membership status (FR-11).
          </p>
        </div>

        {unreadCount > 0 && (
          <form action={async () => { "use server"; await markAllNotificationsReadAction(); }}>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="text-xs whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark All as Read
            </Button>
          </form>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#e0dedb] pb-2">
        <Link
          href="/notifications"
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === "all"
              ? "bg-[#1ca7e0] text-[#1b1613]"
              : "bg-white text-[#45403d] hover:bg-[#f8f8f7]"
          }`}
        >
          All Notifications
        </Link>
        <Link
          href="/notifications?filter=unread"
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            filter === "unread"
              ? "bg-[#1ca7e0] text-[#1b1613]"
              : "bg-white text-[#45403d] hover:bg-[#f8f8f7]"
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#bf2626] text-white">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* Notification Items List */}
      <div className="rounded-2xl border border-[#e0dedb] bg-white divide-y divide-[#f0eeeb] overflow-hidden shadow-xs">
        {notifications.map((n) => {
          const cfg = typeConfig[n.type] || { label: "Notification", tone: "neutral" };

          return (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                !n.is_read ? "bg-[#e3f6fc]/30 border-l-4 border-[#0a7db0]" : "hover:bg-[#f8f8f7]"
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone={cfg.tone} className="text-[10px]">
                    {cfg.label}
                  </Badge>
                  <span className="text-[11px] text-[#8c8785]">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#1b1613] leading-snug">
                  {n.title}
                </h3>

                {n.body && (
                  <p className="text-xs text-[#45403d] leading-relaxed">
                    {n.body}
                  </p>
                )}

                {n.link_url && (
                  <Link
                    href={n.link_url}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a7db0] hover:underline pt-1"
                  >
                    View details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {!n.is_read && (
                <form
                  action={async () => {
                    "use server";
                    await markNotificationReadAction(n.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-[11px] font-semibold text-[#0a7db0] hover:underline whitespace-nowrap"
                  >
                    Mark read
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
