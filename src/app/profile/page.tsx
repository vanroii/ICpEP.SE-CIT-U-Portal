import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { Badge } from "@/components/ui/Badge";
import { EditProfileForm } from "./EditProfileForm";
import { ApplyMembershipModal } from "@/app/student/ApplyMembershipModal";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";
import {
  Award,
  GraduationCap,
  Mail,
  Phone,
  Lock,
  User,
  ShieldCheck,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let user: any = null;
  let profile: any = null;
  let role: RoleCode = "non_member";
  let membership: any = null;
  let pendingApp: any = null;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (!user) {
      redirect("/login?next=/profile");
    }

    const [{ data: r }, { data: p }, { data: m }, { data: a }] = await Promise.all([
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
    ]);

    role = (r as RoleCode) ?? "non_member";
    profile = p;
    membership = m;
    pendingApp = a;
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    console.error("Profile fetch error:", err);
  }

  // Fallback demo profile if unseeded
  if (!profile && user) {
    profile = {
      first_name: "Student",
      last_name: "Member",
      email: user.email || "student@cit.edu",
      student_number: "23-0000-000",
      program: "BS Computer Engineering",
      year_level: 1,
      is_active: true,
    };
  }

  const isFaculty = role === "faculty";
  const isAdmin = role === "admin";
  const isOfficer = role === "officer";
  const isMember = role === "member";
  const fullName = profile
    ? `${profile.first_name} ${profile.middle_name ? profile.middle_name + " " : ""}${profile.last_name}`
    : isFaculty
    ? "Faculty Adviser"
    : "Student";
  const roleLabel = ROLE_LABELS[role] || (isFaculty ? "Faculty / Adviser" : isMember ? "ICpEP Member" : "Non-Member");
  const avatarLetter = (profile?.first_name || (isFaculty ? "F" : "S")).charAt(0).toUpperCase();

  return (
    <PortalShell
      activeItem="Profile"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-7 w-full">
        {/* Page Header */}
        <div className="space-y-1.5">
          <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
            Profile
          </h1>
          <p className="text-[15px] text-[#817B77]">
            {isFaculty ? "Your faculty oversight identity in the ICpEP.SE portal." : "Your academic identity in the ICpEP.SE community."}
          </p>
        </div>

        {/* Identity Cover Banner */}
        <div className="bg-white border border-[#DEDBD8] rounded-[16px] overflow-hidden">
          <div className="w-full h-[200px] sm:h-[224px] profile-cover-gradient relative p-6 sm:p-8 text-white overflow-hidden select-none">
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none opacity-50">
              <div className="absolute inset-0 rounded-full border border-[#72D2ED]/30" />
              <div className="absolute inset-10 rounded-full border border-[#72D2ED]/40" />
              <div className="absolute inset-20 rounded-full border border-[#72D2ED]/50 bg-[#19A7D5]/10" />
              <div className="absolute inset-[110px] rounded-[18px] bg-[#0A3B50] border-[1.5px] border-[#72D2ED] flex items-center justify-center">
                <span className="text-[#72D2ED] font-mono text-xs font-bold tracking-widest">
                  CPU
                </span>
              </div>
            </div>

            <div className="relative z-10 max-w-lg space-y-2">
              <p className="text-[11px] font-semibold tracking-[2px] text-[#72D2ED] uppercase">
                LEARN. BUILD. CONNECT.
              </p>
              <h2 className="text-[28px] sm:text-[34px] leading-tight font-semibold tracking-[-0.8px] text-white">
                {fullName}
              </h2>
              <p className="text-[14px] text-[#B5DAE5]">
                {isFaculty
                  ? `${profile?.department || "CEA"} · Faculty Adviser`
                  : `${profile?.program || "BS Computer Engineering"} · Year ${profile?.year_level || 1}`}
              </p>
            </div>
          </div>

          {/* Profile Identity Bar */}
          <div className="px-6 sm:px-8 py-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="sm:-mt-16 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full bg-[#19A7D5] border-[5px] border-white text-[#12191C] flex items-center justify-center font-bold text-[42px] sm:text-[50px] shadow-sm shrink-0 select-none">
                  {avatarLetter}
                </div>

                <div className="text-center sm:text-left space-y-1 sm:pt-4">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-[24px] sm:text-[28px] font-bold text-[#1C1713] tracking-[-0.6px]">
                      {fullName}
                    </h2>
                    <Badge tone={isFaculty ? "neutral" : isMember ? "verified" : "neutral"}>
                      {roleLabel}
                    </Badge>
                  </div>
                  <p className="text-[14px] text-[#817B77]">
                    {isFaculty
                      ? `Employee ID: ${profile?.employee_id || "Not assigned"}`
                      : `Student ID: ${profile?.student_number || "Not assigned"}`}
                  </p>
                  <p className="text-[13px] text-[#514B47] flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                    <Mail className="w-3.5 h-3.5 text-[#0087B5]" />
                    {profile?.email}
                  </p>
                </div>
              </div>

              {!isFaculty && !isAdmin && !isOfficer && (
                <div className="flex justify-center sm:justify-end">
                  {!isMember && !pendingApp && <ApplyMembershipModal />}
                  {!isMember && pendingApp && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
                      Membership Pending Review
                    </span>
                  )}
                  {isMember && membership && (
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D]">
                        ID: {membership.membership_no}
                      </span>
                      <p className="text-[11px] text-[#817B77] mt-1">
                        Valid: {membership.school_years?.label || "AY 2026–2027"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2 Columns: Credentials & Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Credentials (Locked) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-6 space-y-4 shadow-xs">
              <h3 className="text-[16px] font-bold text-[#1C1713] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#0087B5]" />
                {isFaculty ? "Faculty Credentials" : "Academic Credentials"}
              </h3>

              {isFaculty ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#817B77] block text-[11px] font-semibold uppercase">Department</span>
                    <span className="font-bold text-[#1C1713] text-sm">{profile?.department || "CEA"}</span>
                  </div>

                  <div>
                    <span className="text-[#817B77] block text-[11px] font-semibold uppercase">Designation</span>
                    <span className="font-bold text-[#1C1713] text-sm">Faculty Adviser / Instructor</span>
                  </div>

                  <div>
                    <span className="text-[#817B77] block text-[11px] font-semibold uppercase">Employee ID</span>
                    <span className="font-bold text-[#1C1713] text-sm font-mono">{profile?.employee_id || "—"}</span>
                  </div>

                  <div>
                    <span className="text-[#817B77] block text-[11px] font-semibold uppercase">Institution</span>
                    <span className="font-bold text-[#1C1713] text-sm">Cebu Institute of Technology - University</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#817B77] block text-[11px] font-semibold uppercase">Academic Program</span>
                    <span className="font-bold text-[#1C1713] text-sm">{profile?.program || "BS Computer Engineering"}</span>
                  </div>

                  <div>
                    <span className="text-[#817B77] block text-[11px] font-semibold uppercase">Year Level</span>
                    <span className="font-bold text-[#1C1713] text-sm">Year {profile?.year_level || 1}</span>
                  </div>

                  <div>
                    <span className="text-[#817B77] block text-[11px] font-semibold uppercase">CIT-U Student Number</span>
                    <span className="font-bold text-[#1C1713] text-sm font-mono">{profile?.student_number || "—"}</span>
                  </div>

                  <div>
                    <span className="text-[#817B77] block text-[11px] font-semibold uppercase">Institution</span>
                    <span className="font-bold text-[#1C1713] text-sm">Cebu Institute of Technology - University</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#EEECEA] flex items-start gap-2 text-[11px] text-[#817B77] leading-relaxed">
                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#9A6C00]" />
                <span>
                  {isFaculty
                    ? "Employee ID, department, and institutional email are locked to prevent tampering. Contact an administrator to update these credentials."
                    : "Student number, program, and institutional email are locked to prevent tampering. Contact chapter officers or an administrator to update these credentials."}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Editable Profile Details */}
          <div className="lg:col-span-7 bg-white border border-[#DEDBD8] rounded-[16px] p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="space-y-1 pb-3 border-b border-[#EEECEA]">
              <h3 className="text-[16px] font-bold text-[#1C1713] flex items-center gap-2">
                <User className="w-4 h-4 text-[#0087B5]" />
                Personal Information
              </h3>
              <p className="text-xs text-[#817B77]">
                Update your display name, contact phone, and technical bio.
              </p>
            </div>

            <EditProfileForm profile={profile} />
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
