import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserRowAction } from "./UserRowAction";
import { SiteSettingsForm } from "./SiteSettingsForm";
import {
  Users,
  Shield,
  Settings,
  Activity,
  Search,
  UserCheck,
  UserX,
  Award,
  Power,
  Save,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeTab = resolvedParams?.tab || "users";
  const query = (resolvedParams?.q || "").toLowerCase();

  let users: any[] = [];
  let settings: Record<string, string> = {};
  let logs: any[] = [];

  try {
    const supabase = await createClient();
    const [{ data: usersData }, { data: settingsData }, { data: logsData }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id,first_name,last_name,email,student_number,program,year_level,is_active,roles:role_id(code,name)")
          .order("created_at", { ascending: false }),
        supabase.from("site_settings").select("*"),
        supabase.from("activity_logs").select("*, actor:actor_id(first_name,last_name)").order("created_at", { ascending: false }).limit(20),
      ]);

    users = usersData ?? [];
    if (settingsData) {
      settingsData.forEach((s) => {
        settings[s.key] = s.value;
      });
    }
    logs = logsData ?? [];
  } catch {
    // offline fallback
  }

  // Fallback demo dataset if database has no rows
  if (users.length === 0) {
    users = [
      {
        id: "1",
        first_name: "Jovan Roilan",
        last_name: "Pogoy",
        email: "jovan.pogoy@cit.edu",
        student_number: "21-0001-101",
        program: "BS Computer Engineering",
        year_level: 4,
        is_active: true,
        roles: { code: "admin", name: "System Administrator" },
      },
      {
        id: "2",
        first_name: "John Norbert",
        last_name: "Tamares",
        email: "norbert.tamares@cit.edu",
        student_number: "21-0002-102",
        program: "BS Computer Engineering",
        year_level: 4,
        is_active: true,
        roles: { code: "officer", name: "ICpEP Officer" },
      },
      {
        id: "3",
        first_name: "Maria",
        last_name: "Santos",
        email: "maria.santos@cit.edu",
        student_number: "22-0045-203",
        program: "BS Computer Engineering",
        year_level: 3,
        is_active: true,
        roles: { code: "member", name: "ICpEP Member" },
      },
      {
        id: "4",
        first_name: "Carlos",
        last_name: "Dela Cruz",
        email: "carlos.delacruz@cit.edu",
        student_number: "23-0100-305",
        program: "BS Computer Engineering",
        year_level: 2,
        is_active: true,
        roles: { code: "non_member", name: "Non-Member Student" },
      },
      {
        id: "5",
        first_name: "Inactive",
        last_name: "Student",
        email: "inactive.student@cit.edu",
        student_number: "20-9999-999",
        program: "BS Computer Engineering",
        year_level: 4,
        is_active: false,
        roles: { code: "non_member", name: "Non-Member Student" },
      },
    ];
  }

  const totalUsers = users.length;
  const totalMembers = users.filter((u) => u.roles?.code === "member").length;
  const totalOfficers = users.filter((u) => u.roles?.code === "officer").length;
  const totalDeactivated = users.filter((u) => !u.is_active).length;

  const filteredUsers = users.filter((u) => {
    if (!query) return true;
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const sno = (u.student_number || "").toLowerCase();
    return name.includes(query) || email.includes(query) || sno.includes(query);
  });

  const roleBadgeTones: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
    non_member: "neutral",
    member: "success",
    officer: "info",
    faculty: "warning",
    admin: "danger",
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#1b1613] via-[#241e1b] to-[#bf2626]/80 text-white shadow-md space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="danger" className="bg-white/20 text-white border-transparent font-bold">
            System Administrator (FR-12, BR-08)
          </Badge>
          <span className="text-xs text-white/70">Master Privileges</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">
          Portal Control & Account Management
        </h1>
        <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
          Manage user accounts, enforce account activations/deactivations, assign executive roles, and configure organization settings.
        </p>
      </div>

      {/* 4 Stat Cards (§13.2 Screen 5) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-[#e0dedb] bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-[#0a7db0]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8785]">Total Accounts</span>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-[#1b1613]">{totalUsers}</p>
          <p className="text-[11px] text-[#8c8785]">Registered in database</p>
        </div>

        <div className="rounded-2xl border border-[#e0dedb] bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-[#218c54]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8785]">ICpEP Members</span>
            <Award className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-[#1b1613]">{totalMembers}</p>
          <p className="text-[11px] text-[#8c8785]">Active verified status</p>
        </div>

        <div className="rounded-2xl border border-[#e0dedb] bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-[#0a7db0]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8785]">Officers</span>
            <Shield className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-[#1b1613]">{totalOfficers}</p>
          <p className="text-[11px] text-[#8c8785]">Executive Board</p>
        </div>

        <div className="rounded-2xl border border-[#e0dedb] bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-[#bf2626]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8785]">Deactivated</span>
            <UserX className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-[#1b1613]">{totalDeactivated}</p>
          <p className="text-[11px] text-[#8c8785]">Blocked from logging in</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-[#e0dedb] pb-2">
        <Link
          href="/admin?tab=users"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "users"
              ? "bg-[#1ca7e0] text-[#1b1613] shadow-xs"
              : "bg-white text-[#45403d] border border-[#e0dedb] hover:bg-[#f8f8f7]"
          }`}
        >
          <Users className="w-4 h-4" />
          User Accounts
        </Link>
        <Link
          href="/admin?tab=settings"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "settings"
              ? "bg-[#1ca7e0] text-[#1b1613] shadow-xs"
              : "bg-white text-[#45403d] border border-[#e0dedb] hover:bg-[#f8f8f7]"
          }`}
        >
          <Settings className="w-4 h-4" />
          Site Settings
        </Link>
        <Link
          href="/admin?tab=audit"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "audit"
              ? "bg-[#1ca7e0] text-[#1b1613] shadow-xs"
              : "bg-white text-[#45403d] border border-[#e0dedb] hover:bg-[#f8f8f7]"
          }`}
        >
          <Activity className="w-4 h-4" />
          System Audit Trail
        </Link>
      </div>

      {/* Tab 1: User Directory */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#e0dedb]">
            <h2 className="text-base font-bold text-[#1b1613]">
              User Accounts Directory ({filteredUsers.length})
            </h2>

            <form method="get" className="relative min-w-[280px]">
              <input type="hidden" name="tab" value="users" />
              <Search className="w-4 h-4 text-[#8c8785] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search name, email, student #..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#e0dedb] bg-[#f8f8f7] text-[#1b1613] placeholder-[#8c8785] focus:outline-none focus:border-[#1ca7e0]"
              />
            </form>
          </div>

          <div className="rounded-2xl border border-[#e0dedb] bg-white divide-y divide-[#f0eeeb] overflow-hidden">
            {filteredUsers.map((u) => {
              const roleCode = u.roles?.code || "non_member";
              const fullName = `${u.first_name} ${u.last_name}`;

              return (
                <div
                  key={u.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8f8f7] transition-colors ${
                    !u.is_active ? "bg-[#fae6e6]/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar name={fullName} size="md" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1b1613] truncate">
                          {fullName}
                        </span>
                        {!u.is_active && (
                          <Badge tone="danger" className="text-[10px]">
                            Deactivated
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#8c8785] truncate">
                        {u.email} · {u.student_number || "No Student #"}
                      </p>
                      <p className="text-[11px] text-[#45403d]">
                        {u.program || "BS Computer Engineering"} {u.year_level ? `(Yr ${u.year_level})` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge tone={roleBadgeTones[roleCode]} className="capitalize">
                      {u.roles?.name || roleCode}
                    </Badge>
                    <UserRowAction user={u} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Site Settings */}
      {activeTab === "settings" && <SiteSettingsForm settings={settings} />}

      {/* Tab 3: System Audit Trail */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#1b1613]">
              System Activity Audit Trail (activity_logs)
            </h2>
            <p className="text-xs text-[#8c8785]">
              Immutable event log of administrative actions, user logins, role shifts, and content publishing.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e0dedb] bg-white divide-y divide-[#f0eeeb] overflow-hidden text-xs">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#f8f8f7]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1b1613]">
                        {log.actor ? `${log.actor.first_name} ${log.actor.last_name}` : "System"}
                      </span>
                      <span className="font-mono bg-[#e3f6fc] text-[#0a7db0] px-2 py-0.5 rounded-md font-semibold">
                        {log.action}
                      </span>
                      {log.entity_type && (
                        <span className="text-[#8c8785]">
                          target: {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ""}
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <pre className="text-[10px] text-[#45403d] bg-[#f8f8f7] p-1.5 rounded-md font-mono overflow-x-auto">
                        {JSON.stringify(log.details)}
                      </pre>
                    )}
                  </div>
                  <span className="text-[#8c8785] text-[11px] shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#8c8785]">No activity logged yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
