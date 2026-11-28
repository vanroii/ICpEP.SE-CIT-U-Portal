import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { CreateEventModal } from "./CreateEventModal";
import { CreatePostModal } from "./CreatePostModal";
import { ReviewApplicationModal } from "./ReviewApplicationModal";
import { RoleMasterlistManager } from "@/components/RoleMasterlistManager";
import { PostFeed } from "@/components/feed/PostFeed";
import { getFeedPosts } from "@/lib/feed";
import {
  Users,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  Shield,
  Activity,
} from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function OfficerPortalPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const currentTab = resolvedParams?.tab || "dashboard";
  const isAnalyticsTab = currentTab === "analytics";
  const isControlPanelTab = currentTab === "control-panel";
  const isFeedTab = !isAnalyticsTab && !isControlPanelTab;

  let user: any = null;
  let role: RoleCode = "officer";
  let profile: any = null;
  let membersCount = 0;
  let eventsCount = 0;
  let pendingAppsCount = 0;
  let pendingApplications: any[] = [];
  let recentEvents: any[] = [];
  let activityLogs: any[] = [];
  let participationReports: any[] = [];
  let membershipReports: any[] = [];
  let feedPosts: any[] = [];

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (!user) {
      redirect("/login?next=/officer");
    }

    const { data: roleCode } = await supabase.rpc("auth_role");
    role = (roleCode as RoleCode) ?? "officer";

    if (role !== "officer" && role !== "admin") {
      redirect("/student");
    }

    const [
      { data: prof },
      { count: mCount },
      { count: eCount },
      { count: aCount },
      { data: pendingApps },
      { data: eventsData },
      { data: logs },
      { data: reports },
      { data: memberCounts },
      posts,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("memberships").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("membership_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("membership_applications")
        .select("id,claimed_membership_no,submitted_at,status,applicant:profiles!membership_applications_applicant_id_fkey(id,first_name,last_name,student_number,email,program,year_level)")
        .eq("status", "pending")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("events")
        .select("*")
        .order("start_at", { ascending: false })
        .limit(6),
      supabase
        .from("report_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("report_event_participation")
        .select("*")
        .limit(10),
      supabase
        .from("report_membership_counts")
        .select("*"),
      getFeedPosts(user.id),
    ]);

    profile = prof;
    membersCount = mCount ?? 0;
    eventsCount = eCount ?? 0;
    pendingAppsCount = aCount ?? 0;
    pendingApplications = pendingApps ?? [];
    recentEvents = eventsData ?? [];
    activityLogs = logs ?? [];
    participationReports = reports ?? [];
    membershipReports = memberCounts ?? [];
    feedPosts = posts ?? [];
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    console.error("Officer dashboard data fetch error:", err);
  }

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "Chapter Officer";
  const roleLabel = ROLE_LABELS[role] || "Officer";

  const currentUserObj = user
    ? {
        id: user.id,
        name: fullName,
        role: role,
        avatarUrl: profile?.avatar_url || null,
      }
    : null;

  const activeNavLabel = isAnalyticsTab
    ? "Analytics and Reports"
    : isControlPanelTab
    ? "Control Panel"
    : "Home";

  return (
    <PortalShell
      activeItem={activeNavLabel}
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-ink-900 tracking-[-0.5px]">
              {isAnalyticsTab
                ? "Analytics and Reports"
                : isControlPanelTab
                ? "Officer Control Panel"
                : "Chapter Community Feed"}
            </h1>
            <p className="text-[15px] text-text-500">
              {isAnalyticsTab
                ? "Overview of chapter membership, event participation, and system activity."
                : isControlPanelTab
                ? "Manage chapter operations, assign members, verify applications, and track participation."
                : "Official announcements, updates, and notices from chapter officers and faculty."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CreateEventModal />
            <CreatePostModal />
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: HOME FEED (INSTAGRAM-STYLE)                      */}
        {/* ======================================================== */}
        {isFeedTab && (
          <PostFeed
            posts={feedPosts}
            currentUser={currentUserObj}
            canPost={true}
          />
        )}

        {/* ======================================================== */}
        {/* VIEW 2: OFFICER CONTROL PANEL                           */}
        {/* ======================================================== */}
        {isControlPanelTab && (
          <div className="space-y-8">
            <RoleMasterlistManager mode="members" />

            {/* Pending Verifications Queue */}
            <div className="bg-white border border-border-default rounded-2xl overflow-hidden shadow-xs space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-[18px] font-bold text-ink-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-status-post-officer" />
                    Membership Verification Queue ({pendingApplications.length})
                  </h2>
                  <p className="text-xs text-text-500">
                    Review student credentials, assign official membership numbers, and grant certified status.
                  </p>
                </div>
              </div>

              {pendingApplications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-divider text-text-500 bg-surface-50">
                        <th className="py-3 px-4 font-bold">APPLICANT</th>
                        <th className="py-3 px-4 font-bold">STUDENT ID</th>
                        <th className="py-3 px-4 font-bold">PROGRAM &amp; YEAR</th>
                        <th className="py-3 px-4 font-bold">CLAIMED REFERENCE</th>
                        <th className="py-3 px-4 font-bold">SUBMITTED</th>
                        <th className="py-3 px-4 font-bold text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {pendingApplications.map((app) => {
                        const applicant = app.applicant;
                        if (!applicant) return null;
                        return (
                          <tr key={app.id} className="hover:bg-surface-50 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-bold text-ink-900">
                                {applicant.first_name} {applicant.last_name}
                              </p>
                              <p className="text-[11px] text-text-500">{applicant.email}</p>
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-ink-900">
                              {applicant.student_number || "—"}
                            </td>
                            <td className="py-3 px-4 text-text-600">
                              {applicant.program} · Yr {applicant.year_level || 1}
                            </td>
                            <td className="py-3 px-4 font-mono text-cyan-600">
                              {app.claimed_membership_no || "New Member"}
                            </td>
                            <td className="py-3 px-4 text-text-500">
                              {new Date(app.submitted_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <ReviewApplicationModal application={app} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-text-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-status-success mx-auto opacity-80" />
                  <p className="font-bold text-ink-900">All caught up!</p>
                  <p>There are no pending membership applications waiting for review.</p>
                </div>
              )}
            </div>

            {/* Chapter Events Summary */}
            <div className="bg-white border border-border-default rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-divider">
                <h3 className="text-[16px] font-bold text-ink-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  Chapter Events &amp; Operations
                </h3>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-border-default text-xs font-semibold text-ink-900 hover:border-cyan-500 hover:bg-cyan-50/40 hover:text-cyan-600 shadow-2xs transition-all"
                >
                  View all →
                </Link>
              </div>

              {recentEvents.length > 0 ? (
                <div className="divide-y divide-divider">
                  {recentEvents.map((evt) => (
                    <div key={evt.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="font-bold text-[14px] text-ink-900 truncate">
                          <Link href={`/events/${evt.slug}`} className="hover:text-cyan-600">
                            {evt.title}
                          </Link>
                        </h4>
                        <p className="text-xs text-text-500">
                          {new Date(evt.start_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {evt.venue || "CIT-U"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-cyan-600">
                          {evt.participant_count || 0} registered
                        </span>
                        <p className="text-[11px] text-text-500">
                          {evt.capacity ? `Limit ${evt.capacity}` : "Unlimited"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-text-500">
                  No chapter events created yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: ANALYTICS AND REPORTS                           */}
        {/* ======================================================== */}
        {isAnalyticsTab && (
          <div className="space-y-8">
            {/* 4 Core Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-border-default rounded-2xl p-5 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-cyan-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-500">
                    Active Members
                  </span>
                  <Award className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-ink-900">{membersCount}</p>
                <p className="text-[12px] text-text-500">AY 2026–2027 Verified</p>
              </div>

              <div className="bg-white border border-border-default rounded-2xl p-5 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-status-post-officer">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-500">
                    Pending Verifications
                  </span>
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-ink-900">{pendingAppsCount}</p>
                <p className="text-[12px] text-text-500">Requires officer review</p>
              </div>

              <div className="bg-white border border-border-default rounded-2xl p-5 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-cyan-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-500">
                    Published Events
                  </span>
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-ink-900">{eventsCount}</p>
                <p className="text-[12px] text-text-500">Assemblies &amp; workshops</p>
              </div>

              <div className="bg-white border border-border-default rounded-2xl p-5 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-status-success">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-500">
                    System Status
                  </span>
                  <Shield className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-ink-900">Online</p>
                <p className="text-[12px] text-text-500">RLS Security Guarded</p>
              </div>
            </div>

            {/* 2 Columns: Event Participation & Membership Breakdown vs Activity Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Participation & Membership counts */}
              <div className="lg:col-span-7 space-y-6">
                {/* Event Attendance & Participation */}
                <div className="bg-white border border-border-default rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-divider">
                    <h3 className="text-[16px] font-bold text-ink-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-600" />
                      Event Attendance &amp; Participation Ratios
                    </h3>
                    <Link
                      href="/events"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-border-default text-xs font-semibold text-ink-900 hover:border-cyan-500 hover:bg-cyan-50/40 hover:text-cyan-600 shadow-2xs transition-all"
                    >
                      View all →
                    </Link>
                  </div>

                  {participationReports.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-divider text-text-500 bg-surface-50">
                            <th className="py-2.5 px-3 font-bold">EVENT TITLE</th>
                            <th className="py-2.5 px-3 font-bold">DATE</th>
                            <th className="py-2.5 px-3 font-bold">REGISTRATIONS</th>
                            <th className="py-2.5 px-3 font-bold">CAPACITY</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-divider">
                          {participationReports.map((r) => (
                            <tr key={r.event_id} className="hover:bg-surface-50 transition-colors">
                              <td className="py-3 px-3 font-semibold text-ink-900">{r.title}</td>
                              <td className="py-3 px-3 text-text-500">
                                {r.start_at
                                  ? new Date(r.start_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "—"}
                              </td>
                              <td className="py-3 px-3 font-bold text-cyan-600">{r.registered}</td>
                              <td className="py-3 px-3 text-text-500">
                                {r.capacity ? r.capacity : "Unlimited"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-text-500">
                      No event participation data available.
                    </div>
                  )}
                </div>

                {/* Membership Enrollment by School Year */}
                <div className="bg-white border border-border-default rounded-2xl p-6 space-y-4 shadow-xs">
                  <h3 className="text-[16px] font-bold text-ink-900 flex items-center gap-2 pb-2 border-b border-divider">
                    <Users className="w-4 h-4 text-cyan-600" />
                    Membership Enrollment by School Year
                  </h3>

                  {membershipReports.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {membershipReports.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 border-b border-divider last:border-0"
                        >
                          <span className="text-ink-900 font-medium">
                            {r.school_year} ({r.status})
                          </span>
                          <span className="font-bold text-cyan-600">{r.total} members</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-text-500">
                      <div className="flex justify-between py-2 border-b border-divider">
                        <span>AY 2026–2027 (Active)</span>
                        <span className="font-bold text-cyan-600">{membersCount} verified</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Activity Logs */}
              <div className="lg:col-span-5 bg-white border border-border-default rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-divider">
                  <h3 className="text-[16px] font-bold text-ink-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-600" />
                    Recent System Activity
                  </h3>
                </div>

                {activityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="text-xs space-y-0.5 pb-2 border-b border-divider last:border-0">
                        <div className="flex items-center justify-between text-text-500">
                          <span className="font-semibold text-ink-900">{log.actor || "Officer"}</span>
                          <span>
                            {new Date(log.created_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-text-600 font-mono text-[11px]">{log.action}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-text-500">
                    No recent activity logged.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
