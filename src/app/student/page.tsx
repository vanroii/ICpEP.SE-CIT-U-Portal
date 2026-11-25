import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { Badge } from "@/components/ui/Badge";
import { ApplyMembershipModal } from "./ApplyMembershipModal";
import { cancelEventAction } from "../events/actions";
import { PostFeed } from "@/components/feed/PostFeed";
import { getFeedPosts } from "@/lib/feed";
import {
  Award,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles,
  Pin,
  Clock,
} from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
  let user: any = null;
  let profile: any = null;
  let role: RoleCode = "non_member";
  let activeMembership: any = null;
  let pendingApplication: any = null;
  let registeredEvents: any[] = [];
  let feedPosts: any[] = [];
  let recentNotifications: any[] = [];
  let unreadMessagesCount = 0;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (user) {
      const [
        { data: roleData },
        { data: profileData },
        { data: memData },
        { data: appData },
        { data: regsData },
        postsData,
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
        getFeedPosts(user.id),
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
      feedPosts = postsData ?? [];
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

  const currentUserObj = user
    ? {
        id: user.id,
        name: fullName,
        role: role,
        avatarUrl: profile?.avatar_url || null,
      }
    : null;

  return (
    <PortalShell
      activeItem="Home"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-8 w-full">
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
            <p className="text-xs sm:text-sm text-text-dark">
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
              className="h-[38px] px-4 rounded-[8px] bg-cyan-500 hover:bg-[#1695bf] text-on-brand text-xs font-bold flex items-center transition-colors"
            >
              Browse Events
            </Link>
          </div>
        </div>

        {/* Membership Banner (if non-member) */}
        {!isMember && (
          <div className="bg-cyan-50 border border-[#BCE9F7] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-[16px] text-cyan-600 flex items-center gap-2">
                <Award className="w-5 h-5 shrink-0" />
                {pendingApplication
                  ? "Membership Application Under Review"
                  : "Become an Official ICpEP.SE Member for AY 2026–2027"}
              </h3>
              <p className="text-xs text-cyan-600/90 max-w-2xl leading-relaxed">
                {pendingApplication
                  ? "Your membership application has been submitted and is currently being verified by chapter officers."
                  : "Unlock members-only engineering bootcamps, hardware loan privileges, verified digital IDs, and national convention endorsements."}
              </p>
            </div>

            <div className="shrink-0">
              {!pendingApplication ? (
                <ApplyMembershipModal />
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-status-post-officer-bg text-status-post-officer border border-[#FCD34D]">
                  Status: Pending Approval
                </span>
              )}
            </div>
          </div>
        )}

        {/* Community Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-[18px] font-bold text-ink-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              Chapter Community Feed
            </h2>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-border-default text-xs font-semibold text-ink-900 hover:border-cyan-500 hover:bg-cyan-50/40 hover:text-cyan-600 shadow-2xs transition-all whitespace-nowrap"
            >
              View all announcements
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <PostFeed
            posts={feedPosts}
            currentUser={currentUserObj}
            canPost={false}
          />
        </div>
      </div>
    </PortalShell>
  );
}
