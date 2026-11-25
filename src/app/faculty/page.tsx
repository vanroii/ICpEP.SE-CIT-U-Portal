import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { CreateEventModal } from "@/app/officer/CreateEventModal";
import { CreatePostModal } from "@/app/officer/CreatePostModal";
import { RoleMasterlistManager } from "@/components/RoleMasterlistManager";
import { PostFeed } from "@/components/feed/PostFeed";
import { getFeedPosts } from "@/lib/feed";
import {
  Info,
  Calendar,
  Activity,
  Award,
  Clock,
  Shield,
  BarChart2,
  SlidersHorizontal,
  Users,
  Sparkles,
} from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function FacultyPortalPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const currentTab = resolvedParams?.tab || "dashboard";
  const isAnalyticsTab = currentTab === "analytics";
  const isOperationsTab = currentTab === "operations";
  const isFeedTab = !isAnalyticsTab && !isOperationsTab;

  let user: any = null;
  let role: RoleCode = "faculty";
  let profile: any = null;
  let membersCount = 0;
  let eventsCount = 0;
  let pendingCount = 0;
  let participationReports: any[] = [];
  let activityLogs: any[] = [];
  let membershipReports: any[] = [];
  let feedPosts: any[] = [];

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (!user) {
      redirect("/login?next=/faculty");
    }

    const { data: roleCode } = await supabase.rpc("auth_role");
    role = (roleCode as RoleCode) ?? "faculty";

    if (role !== "faculty" && role !== "admin") {
      redirect("/student");
    }

    const [
      { data: prof },
      { count: mCount },
      { count: eCount },
      { count: aCount },
      { data: reports },
      { data: logs },
      { data: memberCounts },
      posts,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("memberships").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("membership_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("report_event_participation").select("*").limit(10),
      supabase.from("report_activity_log").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("report_membership_counts").select("*"),
      getFeedPosts(user.id),
    ]);

    profile = prof;
    membersCount = mCount ?? 0;
    eventsCount = eCount ?? 0;
    pendingCount = aCount ?? 0;
    participationReports = reports ?? [];
    activityLogs = logs ?? [];
    membershipReports = memberCounts ?? [];
    feedPosts = posts ?? [];
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    console.error("Faculty data fetch error:", err);
  }

  const fullName = profile
    ? `${profile.first_name}${profile.middle_name ? " " + profile.middle_name : ""} ${profile.last_name}`
    : "Faculty Adviser";
  const roleLabel = ROLE_LABELS[role] || "Faculty / Adviser";

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
    : isOperationsTab
    ? "Student Masterlist"
    : "Home";

  return (
    <PortalShell
      activeItem={activeNavLabel}
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-7 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-ink-900 tracking-[-0.5px]">
              {isAnalyticsTab
                ? "Analytics and Reports"
                : isOperationsTab
                ? "Student Masterlist & Roles"
                : "Chapter Community Feed"}
            </h1>
            <p className="text-[15px] text-text-500">
              {isAnalyticsTab
                ? "Overview of chapter enrollment, event attendance, and audit activity."
                : isOperationsTab
                ? "Oversee chapter activities, manage the student roster, and assign student officers."
                : "Official notices, academic guidance, and updates for chapter students."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tab switchers */}
            <div className="flex items-center gap-1.5 bg-surface-50 border border-border-default p-1 rounded-[10px]">
              <Link
                href="/faculty"
                className={`h-8 px-3 rounded-[7px] font-semibold text-xs flex items-center gap-1.5 transition-colors ${
                  isFeedTab
                    ? "bg-cyan-500 text-on-brand shadow-xs"
                    : "text-text-500 hover:text-ink-900 hover:bg-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Home Feed
              </Link>
              <Link
                href="/faculty?tab=operations"
                className={`h-8 px-3 rounded-[7px] font-semibold text-xs flex items-center gap-1.5 transition-colors ${
                  isOperationsTab
                    ? "bg-cyan-500 text-on-brand shadow-xs"
                    : "text-text-500 hover:text-ink-900 hover:bg-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Student Masterlist
              </Link>
              <Link
                href="/faculty?tab=analytics"
                className={`h-8 px-3 rounded-[7px] font-semibold text-xs flex items-center gap-1.5 transition-colors ${
                  isAnalyticsTab
                    ? "bg-cyan-500 text-on-brand shadow-xs"
                    : "text-text-500 hover:text-ink-900 hover:bg-white"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Analytics &amp; Reports
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <CreateEventModal />
              <CreatePostModal />
            </div>
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
        {/* VIEW 2: FACULTY OPERATIONS (MASTERLIST & ROLES)          */}
        {/* ======================================================== */}
        {isOperationsTab && (
          <div className="space-y-7">
            {/* Info Banner */}
            <div className="bg-surface-50 border border-border-default rounded-[14px] p-4 flex items-center gap-3 text-xs text-text-600">
              <Info className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>
                <strong>Faculty access:</strong> You can manage the student masterlist and assign student accounts as officers. Membership verification is handled by Chapter Officers.
              </span>
            </div>

            <RoleMasterlistManager mode="students" />

            {/* Quick summary card */}
            <div className="bg-white border border-border-default rounded-2xl p-6 space-y-3 shadow-xs">
              <h3 className="text-[16px] font-bold text-ink-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" />
                Chapter Overview
              </h3>
              <p className="text-xs text-text-500">
                Currently {membersCount} active student members enrolled and {eventsCount} published events.
                Visit the{" "}
                <Link href="/faculty?tab=analytics" className="text-cyan-600 font-semibold hover:underline">
                  Analytics &amp; Reports tab →
                </Link>{" "}
                for full enrollment statistics, attendance ratios, and audit logs.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: ANALYTICS AND REPORTS                           */}
        {/* ======================================================== */}
        {isAnalyticsTab && (
          <div className="space-y-8">
            {/* Core Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-border-default rounded-2xl p-5 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-cyan-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-500">ICpEP Members</span>
                  <Award className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-ink-900">{membersCount}</p>
                <p className="text-[12px] text-text-500">Active this term</p>
              </div>

              <div className="bg-white border border-border-default rounded-2xl p-5 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-cyan-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-500">Events Held</span>
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-ink-900">{eventsCount}</p>
                <p className="text-[12px] text-text-500">Published activities</p>
              </div>

              <div className="bg-white border border-border-default rounded-2xl p-5 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-status-post-officer">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-500">Pending Applications</span>
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-ink-900">{pendingCount}</p>
                <p className="text-[12px] text-text-500">Awaiting verification</p>
              </div>

              <div className="bg-white border border-border-default rounded-2xl p-5 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-status-success">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-500">Current Year</span>
                  <Shield className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-ink-900">2026–2027</p>
                <p className="text-[12px] text-text-500">First Semester</p>
              </div>
            </div>

            {/* 2 Columns: Participation Reports & Activity Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 cols): Event Participation & Membership Enrollment */}
              <div className="lg:col-span-7 space-y-6">
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
                              <td className="py-3 px-3 text-text-500">{r.capacity || "Unlimited"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-text-500">
                      No participation data available.
                    </div>
                  )}
                </div>

                {/* Membership Enrollment Breakdown */}
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

              {/* Right Column (5 cols): Activity Logs */}
              <div className="lg:col-span-5 bg-white border border-border-default rounded-2xl p-6 space-y-4 shadow-xs">
                <h3 className="text-[16px] font-bold text-ink-900 flex items-center gap-2 pb-2 border-b border-divider">
                  <Activity className="w-4 h-4 text-cyan-600" />
                  Audit Trail &amp; Actions
                </h3>

                {activityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="text-xs space-y-0.5 pb-2 border-b border-divider last:border-0">
                        <div className="flex items-center justify-between text-text-500">
                          <span className="font-semibold text-ink-900">{log.actor || "User"}</span>
                          <span>
                            {new Date(log.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-text-600 font-mono text-[11px]">{log.action}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-text-500">
                    No audit logs recorded yet.
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
