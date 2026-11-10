import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { CreateEventModal } from "./CreateEventModal";
import { CreatePostModal } from "./CreatePostModal";
import { ReviewApplicationModal } from "./ReviewApplicationModal";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Shield,
  Activity,
  Plus,
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
    ]);

    profile = prof;
    membersCount = mCount ?? 0;
    eventsCount = eCount ?? 0;
    pendingAppsCount = aCount ?? 0;
    pendingApplications = pendingApps ?? [];
    recentEvents = eventsData ?? [];
    activityLogs = logs ?? [];
    participationReports = reports ?? [];
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    console.error("Officer dashboard data fetch error:", err);
  }

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "Chapter Officer";
  const roleLabel = ROLE_LABELS[role] || "Officer";

  return (
    <PortalShell
      activeItem="Home"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-8 max-w-[1096px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Officer Control Panel
            </h1>
            <p className="text-[15px] text-[#817B77]">
              Manage chapter operations, verify membership applications, and track participation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CreateEventModal />
            <CreatePostModal />
          </div>
        </div>

        {/* 4 Core Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[#0087B5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">
                Active Members
              </span>
              <Award className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">{membersCount}</p>
            <p className="text-[12px] text-[#817B77]">AY 2026–2027 Verified</p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[#B45309]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">
                Pending Verifications
              </span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">{pendingAppsCount}</p>
            <p className="text-[12px] text-[#817B77]">Requires officer review</p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[#0087B5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">
                Published Events
              </span>
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">{eventsCount}</p>
            <p className="text-[12px] text-[#817B77]">Assemblies & workshops</p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[#15803D]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">
                System Status
              </span>
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">Online</p>
            <p className="text-[12px] text-[#817B77]">RLS Security Guarded</p>
          </div>
        </div>

        {/* Pending Verifications Queue */}
        <div className="bg-white border border-[#DEDBD8] rounded-[16px] overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-[18px] font-bold text-[#1C1713] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B45309]" />
                Membership Verification Queue ({pendingApplications.length})
              </h2>
              <p className="text-xs text-[#817B77]">
                Review student credentials, assign official membership numbers, and grant certified status.
              </p>
            </div>
          </div>

          {pendingApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EEECEA] text-[#817B77] bg-[#FAF9F8]">
                    <th className="py-3 px-4 font-bold">APPLICANT</th>
                    <th className="py-3 px-4 font-bold">STUDENT ID</th>
                    <th className="py-3 px-4 font-bold">PROGRAM & YEAR</th>
                    <th className="py-3 px-4 font-bold">CLAIMED REFERENCE</th>
                    <th className="py-3 px-4 font-bold">SUBMITTED</th>
                    <th className="py-3 px-4 font-bold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEECEA]">
                  {pendingApplications.map((app) => {
                    const applicant = app.applicant;
                    if (!applicant) return null;
                    return (
                      <tr key={app.id} className="hover:bg-[#FAF9F8] transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#1C1713]">
                            {applicant.first_name} {applicant.last_name}
                          </p>
                          <p className="text-[11px] text-[#817B77]">{applicant.email}</p>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#1C1713]">
                          {applicant.student_number || "—"}
                        </td>
                        <td className="py-3 px-4 text-[#514B47]">
                          {applicant.program} · Yr {applicant.year_level || 1}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#0087B5]">
                          {app.claimed_membership_no || "New Member"}
                        </td>
                        <td className="py-3 px-4 text-[#817B77]">
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
            <div className="py-8 text-center text-xs text-[#817B77] space-y-1">
              <CheckCircle2 className="w-6 h-6 text-[#15803D] mx-auto opacity-80" />
              <p className="font-bold text-[#1C1713]">All caught up!</p>
              <p>There are no pending membership applications waiting for review.</p>
            </div>
          )}
        </div>

        {/* 2 Columns: Recent Events & Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Chapter Events Summary */}
          <div className="lg:col-span-7 bg-white border border-[#DEDBD8] rounded-[16px] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#EEECEA]">
              <h3 className="text-[16px] font-bold text-[#1C1713] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0087B5]" />
                Chapter Events & Participation
              </h3>
              <Link href="/events" className="text-xs font-semibold text-[#0087B5] hover:underline">
                View all →
              </Link>
            </div>

            {recentEvents.length > 0 ? (
              <div className="divide-y divide-[#EEECEA]">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-[14px] text-[#1C1713] truncate">
                        <Link href={`/events/${evt.slug}`} className="hover:text-[#0087B5]">
                          {evt.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-[#817B77]">
                        {new Date(evt.start_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {evt.venue || "CIT-U"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#0087B5]">
                        {evt.participant_count || 0} registered
                      </span>
                      <p className="text-[11px] text-[#817B77]">
                        {evt.capacity ? `Limit ${evt.capacity}` : "Unlimited"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#817B77]">
                No chapter events created yet.
              </div>
            )}
          </div>

          {/* Right Column: Activity Logs */}
          <div className="lg:col-span-5 bg-white border border-[#DEDBD8] rounded-[16px] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#EEECEA]">
              <h3 className="text-[16px] font-bold text-[#1C1713] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0087B5]" />
                Recent System Activity
              </h3>
            </div>

            {activityLogs.length > 0 ? (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between text-[#817B77]">
                      <span className="font-semibold text-[#1C1713]">{log.actor || "Officer"}</span>
                      <span>
                        {new Date(log.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[#514B47] font-mono text-[11px]">{log.action}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#817B77]">
                No recent activity logged.
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
