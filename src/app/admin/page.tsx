import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { UserRowAction } from "./UserRowAction";
import { SiteSettingsForm } from "./SiteSettingsForm";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Shield,
  Settings,
  UserCheck,
  UserX,
  Award,
  Search,
} from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeTab = resolvedParams?.tab || "users";
  const search = (resolvedParams?.q || "").toLowerCase();

  let user: any = null;
  let role: RoleCode = "admin";
  let profile: any = null;
  let allProfiles: any[] = [];
  let settingsMap: Record<string, string> = {};

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (!user) {
      redirect("/login?next=/admin");
    }

    const { data: roleCode } = await supabase.rpc("auth_role");
    role = (roleCode as RoleCode) ?? "admin";

    if (role !== "admin") {
      redirect("/student");
    }

    const [{ data: prof }, { data: profilesData }, { data: settingsData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("profiles")
        .select("*, roles(code,name)")
        .order("created_at", { ascending: false }),
      supabase.from("site_settings").select("key,value"),
    ]);

    profile = prof;
    allProfiles = profilesData ?? [];
    if (settingsData) {
      settingsData.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
    }
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    console.error("Admin portal data fetch error:", err);
  }

  const filteredUsers = allProfiles.filter((p) => {
    if (!search) return true;
    const nameMatch = `${p.first_name} ${p.last_name}`.toLowerCase().includes(search);
    const emailMatch = p.email?.toLowerCase().includes(search);
    const studentMatch = p.student_number?.toLowerCase().includes(search);
    const employeeMatch = p.employee_id?.toLowerCase().includes(search);
    const deptMatch = p.department?.toLowerCase().includes(search);
    const roleMatch = p.roles?.name?.toLowerCase().includes(search);
    return nameMatch || emailMatch || studentMatch || employeeMatch || deptMatch || roleMatch;
  });

  const totalUsers = allProfiles.length;
  const activeUsers = allProfiles.filter((p) => p.is_active).length;
  const membersCount = allProfiles.filter((p) => p.roles?.code === "member").length;
  const officersCount = allProfiles.filter((p) => p.roles?.code === "officer" || p.roles?.code === "admin").length;

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "System Admin";
  const roleLabel = ROLE_LABELS[role] || "Administrator";

  return (
    <PortalShell
      activeItem="Dashboard"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              System Administration
            </h1>
            <p className="text-[15px] text-[#817B77]">
              Manage user accounts, assign organization roles, and configure portal settings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className={`h-[36px] px-4 rounded-[8px] font-semibold text-xs flex items-center transition-colors ${activeTab === "users"
                  ? "bg-[#19A7D5] text-[#12191C]"
                  : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
                }`}
            >
              <Users className="w-4 h-4 mr-1.5" />
              Users Directory
            </Link>
            <Link
              href="/admin?tab=settings"
              className={`h-[36px] px-4 rounded-[8px] font-semibold text-xs flex items-center transition-colors ${activeTab === "settings"
                  ? "bg-[#19A7D5] text-[#12191C]"
                  : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
                }`}
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Site Settings
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[#0087B5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">
                Total Accounts
              </span>
              <Users className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">{totalUsers}</p>
            <p className="text-[12px] text-[#817B77]">Registered in database</p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[#15803D]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">
                Active Users
              </span>
              <UserCheck className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">{activeUsers}</p>
            <p className="text-[12px] text-[#817B77]">Can authenticate</p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[#0087B5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">
                Verified Members
              </span>
              <Award className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">{membersCount}</p>
            <p className="text-[12px] text-[#817B77]">ICpEP Members</p>
          </div>

          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[#B45309]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#817B77]">
                Officers & Admins
              </span>
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1713]">{officersCount}</p>
            <p className="text-[12px] text-[#817B77]">Elevated permissions</p>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "settings" ? (
          <div className="space-y-4">
            <SiteSettingsForm settings={settingsMap} />
          </div>
        ) : (
          <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-[18px] font-bold text-[#1C1713]">
                  All Registered Users ({filteredUsers.length})
                </h2>
                <p className="text-xs text-[#817B77]">
                  Assign roles, promote student officers, or deactivate accounts.
                </p>
              </div>

              <form method="get" className="relative w-full sm:w-[260px]">
                <Search className="w-4 h-4 text-[#817B77] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  name="q"
                  defaultValue={search}
                  placeholder="Search user, ID, email..."
                  className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#C9C5C2] rounded-[10px] text-[13px] text-[#1C1713] placeholder-[#817B77] outline-none focus:border-[#19A7D5]"
                />
              </form>
            </div>

            {filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#EEECEA] text-[#817B77] bg-[#FAF9F8]">
                      <th className="py-3 px-4 font-bold">NAME & EMAIL</th>
                      <th className="py-3 px-4 font-bold">ID NUMBER</th>
                      <th className="py-3 px-4 font-bold">PROGRAM / DEPT</th>
                      <th className="py-3 px-4 font-bold">ROLE</th>
                      <th className="py-3 px-4 font-bold">STATUS</th>
                      <th className="py-3 px-4 font-bold text-right">MANAGE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEECEA]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#FAF9F8] transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#1C1713]">
                            {u.first_name} {u.last_name}
                          </p>
                          <p className="text-[11px] text-[#817B77]">{u.email}</p>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#1C1713]">
                          {u.roles?.code === "faculty"
                            ? (u.employee_id || u.department || "—")
                            : (u.student_number || "—")}
                        </td>
                        <td className="py-3 px-4 text-[#514B47]">
                          {u.roles?.code === "faculty"
                            ? (u.department ? `${u.department} · Faculty` : "Faculty")
                            : `${u.program || "BS CpE"} ${u.year_level ? `· Yr ${u.year_level}` : ""}`}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E3F6FC] text-[#0087B5]">
                            {u.roles?.name || u.roles?.code || "Non-Member"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B91C1C]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" /> Deactivated
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <UserRowAction user={u} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#817B77]">
                No users match the search query.
              </div>
            )}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
