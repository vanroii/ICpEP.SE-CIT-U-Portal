import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { CreateEventModal } from "@/app/officer/CreateEventModal";
import { CreatePostModal } from "@/app/officer/CreatePostModal";
import {
  Info,
  Calendar,
  Activity,
} from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function FacultyPortalPage() {
  let user: any = null;
  let role: RoleCode = "faculty";
  let profile: any = null;
  let membersCount = 0;
  let eventsCount = 0;
  let pendingCount = 0;
  let participationReports: any[] = [];
  let activityLogs: any[] = [];

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
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("memberships").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("membership_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("report_event_participation").select("*").limit(10),
      supabase.from("report_activity_log").select("*").order("created_at", { ascending: false }).limit(10),
    ]);

    profile = prof;
    membersCount = mCount ?? 0;
    eventsCount = eCount ?? 0;
    pendingCount = aCount ?? 0;
    participationReports = reports ?? [];
    activityLogs = logs ?? [];
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    console.error("Faculty data fetch error:", err);
  }

  const fullName = profile
    ? `${profile.first_name}${profile.middle_name ? " " + profile.middle_name : ""} ${profile.last_name}`
    : "Faculty Adviser";
  const roleLabel = ROLE_LABELS[role] || "Faculty / Adviser";

  return (
    <PortalShell
      activeItem="Home"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-7 max-w-[1096px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Faculty &amp; Adviser Portal
            </h1>
            <p className="text-[15px] text-[#817B77]">
              Oversee chapter activities, create events, and review analytical reports.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CreateEventModal />
            <CreatePostModal />
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-[#FAF9F8] border border-[#DEDBD8] rounded-[14px] p-4 flex items-center gap-3 text-xs text-[#514B47]">
          <Info className="w-4 h-4 text-[#0087B5] shrink-0" />
          <span>
            <strong>Faculty access:</strong> You can create and manage events and posts. Membership verification is handled by Chapter Officers.
          </span>
        </div>

        {/* Core Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">ICpEP Members</span>
            <p className="text-2xl font-bold text-[#1C1713]">{membersCount}</p>
            <p className="text-[12px] text-[#817B77]">Active this term</p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">Events Held</span>
            <p className="text-2xl font-bold text-[#1C1713]">{eventsCount}</p>
            <p className="text-[12px] text-[#817B77]">Published activities</p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">Pending Applications</span>
            <p className="text-2xl font-bold text-[#1C1713]">{pendingCount}</p>
            <p className="text-[12px] text-[#817B77]">Awaiting verification</p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">Current Year</span>
            <p className="text-2xl font-bold text-[#1C1713]">2026–2027</p>
            <p className="text-[12px] text-[#817B77]">First Semester</p>
          </div>
        </div>

        {/* 2 Columns: Participation Reports & Activity Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Event Participation */}
          <div className="lg:col-span-7 bg-white border border-[#DEDBD8] rounded-[16px] p-6 space-y-4 shadow-xs">
            <h3 className="text-[16px] font-bold text-[#1C1713] flex items-center gap-2 pb-2 border-b border-[#EEECEA]">
              <Calendar className="w-4 h-4 text-[#0087B5]" />
              Event Attendance &amp; Participation Ratios
            </h3>

            {participationReports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#EEECEA] text-[#817B77]">
                      <th className="py-2.5 px-3">EVENT TITLE</th>
                      <th className="py-2.5 px-3">DATE</th>
                      <th className="py-2.5 px-3">REGISTRATIONS</th>
                      <th className="py-2.5 px-3">CAPACITY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEECEA]">
                    {participationReports.map((r) => (
                      <tr key={r.event_id} className="hover:bg-[#FAF9F8]">
                        <td className="py-2.5 px-3 font-semibold text-[#1C1713]">{r.title}</td>
                        <td className="py-2.5 px-3 text-[#817B77]">
                          {new Date(r.start_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#0087B5]">{r.registered}</td>
                        <td className="py-2.5 px-3 text-[#817B77]">{r.capacity || "Unlimited"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#817B77]">
                No participation data available.
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Activity Logs */}
          <div className="lg:col-span-5 bg-white border border-[#DEDBD8] rounded-[16px] p-6 space-y-4 shadow-xs">
            <h3 className="text-[16px] font-bold text-[#1C1713] flex items-center gap-2 pb-2 border-b border-[#EEECEA]">
              <Activity className="w-4 h-4 text-[#0087B5]" />
              Audit Trail &amp; Actions
            </h3>

            {activityLogs.length > 0 ? (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between text-[#817B77]">
                      <span className="font-semibold text-[#1C1713]">{log.actor || "User"}</span>
                      <span>
                        {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-[#514B47] font-mono text-[11px]">{log.action}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#817B77]">
                No audit logs recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
