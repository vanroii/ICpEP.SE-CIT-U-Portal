import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApplyMembershipModal } from "./ApplyMembershipModal";
import { cancelEventAction } from "../events/actions";
import {
  Award,
  Calendar,
  Mail,
  Bell,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  let profile: any = null;
  let role: string | null = "non_member";
  let activeMembership: any = null;
  let pendingApplication: any = null;
  let registeredEvents: any[] = [];
  let recentNotifications: any[] = [];
  let unreadMessagesCount = 0;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [
        { data: roleData },
        { data: profileData },
        { data: memData },
        { data: appData },
        { data: regsData },
        { data: notifsData },
        { count: msgCount },
      ] = await Promise.all([
        supabase.rpc("auth_role"),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("memberships").select("*, school_years(label)").eq("user_id", user.id).eq("status", "active").maybeSingle(),
        supabase.from("membership_applications").select("*").eq("applicant_id", user.id).eq("status", "pending").maybeSingle(),
        supabase.from("event_registrations").select("*, events(*)").eq("user_id", user.id).eq("status", "registered").order("registered_at", { ascending: false }),
        supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("message_recipients").select("message_id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("is_read", false).is("deleted_at", null),
      ]);

      role = (roleData as string | null) ?? "non_member";
      profile = profileData;
      activeMembership = memData;
      pendingApplication = appData;
      registeredEvents = regsData ?? [];
      recentNotifications = notifsData ?? [];
      unreadMessagesCount = msgCount ?? 0;
    }
  } catch {
    // offline fallback
  }

  const studentName = profile ? `${profile.first_name} ${profile.last_name}` : "Juan Dela Cruz";
  const isMember = role === "member";

  return (
    <div className="space-y-8">
      {/* Welcome Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#1b1613] via-[#2a2420] to-[#0a4d6f] text-white shadow-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black">
              Welcome back, {profile?.first_name || "Wildcat"} 👋
            </span>
            <Badge tone={isMember ? "success" : "neutral"} className="bg-white/10 text-white border-white/20">
              {isMember ? "ICpEP Member" : "Non-Member Student"}
            </Badge>
          </div>
          <p className="text-xs text-white/70">
            {profile?.program || "BS Computer Engineering"} {profile?.year_level ? `· Year ${profile.year_level}` : ""} · Student No: {profile?.student_number || "—"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/profile">
            <Button size="sm" variant="secondary" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
              View Profile
            </Button>
          </Link>
          <Link href="/events">
            <Button size="sm" variant="primary" className="font-bold">
              Browse Events
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards (§13.2 Screen 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-[#e0dedb] bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-[#0a7db0]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8785]">Membership</span>
            <Award className="w-5 h-5" />
          </div>
          <p className="text-lg font-black text-[#1b1613]">
            {isMember ? "Verified Active" : pendingApplication ? "Pending Review" : "Non-Member"}
          </p>
          <p className="text-[11px] text-[#8c8785]">
            {isMember && activeMembership ? `No. ${activeMembership.membership_no}` : "AY 2026–2027"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e0dedb] bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-[#0a7db0]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8785]">Events Registered</span>
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-[#1b1613]">{registeredEvents.length}</p>
          <p className="text-[11px] text-[#8c8785]">Upcoming slots reserved</p>
        </div>

        <div className="rounded-2xl border border-[#e0dedb] bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-[#0a7db0]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8785]">Unread Messages</span>
            <Mail className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-[#1b1613]">{unreadMessagesCount}</p>
          <Link href="/inbox" className="text-[11px] text-[#0a7db0] hover:underline">
            Open inbox →
          </Link>
        </div>

        <div className="rounded-2xl border border-[#e0dedb] bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-[#0a7db0]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8785]">Notifications</span>
            <Bell className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-[#1b1613]">{recentNotifications.length}</p>
          <Link href="/notifications" className="text-[11px] text-[#0a7db0] hover:underline">
            View notification feed →
          </Link>
        </div>
      </div>

      {/* Membership CTA Banner */}
      {!isMember && (
        <div className="rounded-2xl border border-[#bce9f7] bg-[#e3f6fc] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#0a7db0] flex items-center gap-2">
              <Award className="w-5 h-5" />
              {pendingApplication
                ? "Membership Application Under Review"
                : "Become an Official ICpEP.SE Member for AY 2026–2027"}
            </h3>
            <p className="text-xs text-[#0a7db0]/90 max-w-2xl leading-relaxed">
              {pendingApplication
                ? "Your membership application has been submitted and is currently waiting for verification by chapter officers."
                : "Unlock members-only engineering bootcamps, hardware loan privileges, certified member IDs, and national convention endorsements."}
            </p>
          </div>

          <div>
            {!pendingApplication && <ApplyMembershipModal />}
            {pendingApplication && (
              <Badge tone="warning" className="font-bold py-1 px-3">
                Status: Pending Approval
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Main Two Columns: Registered Events & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): My Registered Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1b1613] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0a7db0]" />
              My Upcoming Registered Events
            </h2>
            <Link href="/events" className="text-xs font-semibold text-[#0a7db0] hover:underline">
              Browse More Events
            </Link>
          </div>

          {registeredEvents.length > 0 ? (
            <div className="space-y-3">
              {registeredEvents.map((reg) => {
                const ev = reg.events;
                if (!ev) return null;
                return (
                  <div
                    key={reg.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#e0dedb] bg-white p-5 hover:border-[#1ca7e0] transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone="success" className="font-semibold text-[11px]">
                          Registered ✓
                        </Badge>
                        {ev.visibility === "members_only" && (
                          <Badge tone="warning" className="text-[11px]">
                            Members Only
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-[#1b1613] truncate">
                        {ev.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8c8785]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#0a7db0]" />
                          {new Date(ev.start_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#0a7db0]" />
                          {ev.venue || "TBA"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/events/${ev.slug}`}>
                        <Button size="sm" variant="secondary">
                          View Event
                        </Button>
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await cancelEventAction(ev.id, ev.slug);
                        }}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          type="submit"
                          className="text-[#bf2626] hover:bg-[#fae6e6]"
                        >
                          Cancel
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#e0dedb] bg-white p-8 text-center space-y-3">
              <Calendar className="w-8 h-8 text-[#8c8785] mx-auto opacity-50" />
              <h4 className="font-bold text-sm text-[#1b1613]">No active registrations</h4>
              <p className="text-xs text-[#8c8785] max-w-sm mx-auto">
                You have not registered for any upcoming activities yet. Explore our calendar and reserve your seat.
              </p>
              <Link href="/events" className="inline-block pt-1">
                <Button size="sm" variant="primary" className="font-bold">
                  Explore Upcoming Events
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Recent Notifications Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1b1613] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#0a7db0]" />
              Notifications
            </h2>
            <Link
              href="/notifications"
              className="text-xs font-semibold text-[#0a7db0] hover:underline"
            >
              See All
            </Link>
          </div>

          <div className="rounded-2xl border border-[#e0dedb] bg-white divide-y divide-[#f0eeeb] overflow-hidden">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((n) => (
                <div key={n.id} className="p-4 space-y-1 hover:bg-[#f8f8f7] transition-colors">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#0a7db0] truncate capitalize">
                      {n.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[#8c8785] shrink-0">
                      {new Date(n.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1b1613] leading-snug">{n.title}</h4>
                  {n.body && (
                    <p className="text-xs text-[#45403d] line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                  )}
                  {n.link_url && (
                    <Link
                      href={n.link_url}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0a7db0] hover:underline pt-1"
                    >
                      View details <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#8c8785]">
                No recent notifications
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
