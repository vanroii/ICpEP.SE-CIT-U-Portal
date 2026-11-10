import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { Badge } from "@/components/ui/Badge";
import { ApplyMembershipModal } from "./ApplyMembershipModal";
import { cancelEventAction } from "../events/actions";
import {
  Award,
  Calendar,
  Mail,
  Bell,
  MapPin,
  ArrowRight,
  Sparkles,
  Pin,
  Clock,
} from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
  let profile: any = null;
  let role: RoleCode = "non_member";
  let activeMembership: any = null;
  let pendingApplication: any = null;
  let registeredEvents: any[] = [];
  let recentPosts: any[] = [];
  let recentNotifications: any[] = [];
  let unreadMessagesCount = 0;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user ?? null;

    if (user) {
      const [
        { data: roleData },
        { data: profileData },
        { data: memData },
        { data: appData },
        { data: regsData },
        { data: postsData },
        { data: notifsData },
        { count: msgCount },
      ] = await Promise.all([
        supabase.rpc("auth_role"),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("memberships")
          .select("*, school_years(label)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
        supabase
          .from("membership_applications")
          .select("*")
          .eq("applicant_id", user.id)
          .eq("status", "pending")
          .maybeSingle(),
        supabase
          .from("event_registrations")
          .select("*, events(*)")
          .eq("user_id", user.id)
          .eq("status", "registered")
          .order("registered_at", { ascending: false }),
        supabase
          .from("posts")
          .select("*, profiles:author_id(first_name,last_name)")
          .eq("status", "published")
          .order("is_pinned", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(5),
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("message_recipients")
          .select("message_id", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("is_read", false)
          .is("deleted_at", null),
      ]);

      role = (roleData as RoleCode) ?? "non_member";
      profile = profileData;
      activeMembership = memData;
      pendingApplication = appData;
      registeredEvents = regsData ?? [];
      recentPosts = postsData ?? [];
      recentNotifications = notifsData ?? [];
      unreadMessagesCount = msgCount ?? 0;
    }
  } catch (err) {
    console.error("Student dashboard data fetch error:", err);
  }

  const isMember = role === "member";
  const fullName = profile
    ? `${profile.first_name} ${profile.middle_name ? profile.middle_name + " " : ""}${profile.last_name}`
    : "Student";
  const roleLabel = ROLE_LABELS[role] || (isMember ? "ICpEP Member" : "Non-Member");

  return (
    <PortalShell
      activeItem="Home"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-8 max-w-[1096px]">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-[20px] hero-gradient text-white shadow-sm">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {profile?.first_name || "Wildcat"} 👋
              </h1>
              <Badge tone={isMember ? "success" : "neutral"} className="bg-white/10 text-white border-white/20">
                {isMember ? "Verified Member" : "Non-Member Student"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#D1CECB]">
              {profile?.program || "BS Computer Engineering"} {profile?.year_level ? `· Year ${profile.year_level}` : ""} · Student ID: {profile?.student_number || "—"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="h-[38px] px-4 rounded-[8px] bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center transition-colors"
            >
              View Profile
            </Link>
            <Link
              href="/events"
              className="h-[38px] px-4 rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] text-xs font-bold flex items-center transition-colors"
            >
              Browse Events
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5">
            <div className="flex items-center justify-between text-[#0087B5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">Membership</span>
              <Award className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-[#1C1713]">
              {isMember ? "Verified Active" : pendingApplication ? "Pending Review" : "Non-Member"}
            </p>
            <p className="text-[12px] text-[#817B77]">
              {isMember && activeMembership ? `ID: ${activeMembership.membership_no}` : "AY 2026–2027"}
            </p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5">
            <div className="flex items-center justify-between text-[#0087B5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">Events Registered</span>
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">{registeredEvents.length}</p>
            <p className="text-[12px] text-[#817B77]">Upcoming slots reserved</p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5">
            <div className="flex items-center justify-between text-[#0087B5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">Unread Messages</span>
              <Mail className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">{unreadMessagesCount}</p>
            <Link href="/inbox" className="text-[12px] font-semibold text-[#0087B5] hover:underline">
              Open inbox →
            </Link>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5">
            <div className="flex items-center justify-between text-[#0087B5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">Notifications</span>
              <Bell className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">{recentNotifications.length}</p>
            <Link href="/notifications" className="text-[12px] font-semibold text-[#0087B5] hover:underline">
              View feed →
            </Link>
          </div>
        </div>

        {/* Membership Banner (if non-member) */}
        {!isMember && (
          <div className="bg-[#E3F6FC] border border-[#BCE9F7] rounded-[16px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-[16px] text-[#0087B5] flex items-center gap-2">
                <Award className="w-5 h-5 shrink-0" />
                {pendingApplication
                  ? "Membership Application Under Review"
                  : "Become an Official ICpEP.SE Member for AY 2026–2027"}
              </h3>
              <p className="text-xs text-[#0087B5]/90 max-w-2xl leading-relaxed">
                {pendingApplication
                  ? "Your membership application has been submitted and is currently being verified by chapter officers."
                  : "Unlock members-only engineering bootcamps, hardware loan privileges, verified digital IDs, and national convention endorsements."}
              </p>
            </div>

            <div className="shrink-0">
              {!pendingApplication ? (
                <ApplyMembershipModal />
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
                  Status: Pending Approval
                </span>
              )}
            </div>
          </div>
        )}

        {/* Main Columns: Registered Events & Posts Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Posts & Announcements Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#1C1713] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0087B5]" />
                Official Announcements & Feed
              </h2>
              <Link href="/news" className="text-[13px] font-semibold text-[#0087B5] hover:underline">
                View all →
              </Link>
            </div>

            {recentPosts.length > 0 ? (
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-3 shadow-xs hover:border-[#19A7D5] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E3F6FC] text-[#0087B5]">
                          {post.post_type}
                        </span>
                        {post.is_pinned && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#9A6C00]">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                      </div>
                      <span className="text-[#817B77]">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                    </div>

                    <h3 className="text-[16px] font-bold text-[#1C1713] leading-snug">
                      <Link href={`/news/${post.slug}`} className="hover:text-[#0087B5] transition-colors">
                        {post.title}
                      </Link>
                    </h3>

                    {post.summary && (
                      <p className="text-[13px] text-[#514B47] leading-relaxed line-clamp-3">
                        {post.summary}
                      </p>
                    )}

                    <div className="pt-2 border-t border-[#EEECEA] flex items-center justify-between text-[12px]">
                      <span className="text-[#817B77]">
                        By {post.profiles ? `${post.profiles.first_name} ${post.profiles.last_name}` : "Chapter Officer"}
                      </span>
                      <Link
                        href={`/news/${post.slug}`}
                        className="font-semibold text-[#0087B5] hover:underline flex items-center gap-1"
                      >
                        Read more <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-10 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-[#817B77] mx-auto opacity-50" />
                <h4 className="text-[15px] font-bold text-[#1C1713]">No posts yet</h4>
                <p className="text-[13px] text-[#817B77] max-w-sm mx-auto">
                  Official announcements, guidelines, and news from ICpEP.SE will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Registered Events */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#1C1713] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0087B5]" />
                My Registered Events
              </h2>
              <Link href="/events" className="text-[13px] font-semibold text-[#0087B5] hover:underline">
                Explore →
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
                      className="bg-white border border-[#DEDBD8] rounded-[14px] p-4 space-y-2 hover:border-[#19A7D5] transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                          Registered ✓
                        </span>
                        {ev.visibility === "members_only" && (
                          <span className="text-[11px] font-semibold text-[#9A6C00]">
                            Members Only
                          </span>
                        )}
                      </div>

                      <h4 className="text-[14px] font-bold text-[#1C1713] leading-snug">
                        <Link href={`/events/${ev.slug}`} className="hover:text-[#0087B5]">
                          {ev.title}
                        </Link>
                      </h4>

                      <div className="flex flex-col gap-1 text-[12px] text-[#817B77]">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#0087B5]" />
                          {new Date(ev.start_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#0087B5]" />
                          {ev.venue || "CIT-U Campus"}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#EEECEA] flex items-center justify-between">
                        <Link
                          href={`/events/${ev.slug}`}
                          className="text-xs font-semibold text-[#0087B5] hover:underline"
                        >
                          View Details
                        </Link>
                        <form
                          action={async () => {
                            "use server";
                            await cancelEventAction(ev.id, ev.slug);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs text-[#B91C1C] hover:underline font-medium cursor-pointer"
                          >
                            Cancel RSVP
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-[#DEDBD8] rounded-[14px] p-8 text-center space-y-2">
                <Calendar className="w-6 h-6 text-[#817B77] mx-auto opacity-50" />
                <p className="text-[14px] font-bold text-[#1C1713]">No active registrations</p>
                <p className="text-[12px] text-[#817B77]">
                  You have not registered for any upcoming events yet.
                </p>
                <Link
                  href="/events"
                  className="inline-flex mt-2 h-[34px] px-3.5 rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] font-semibold text-xs items-center justify-center transition-colors"
                >
                  Browse Calendar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
