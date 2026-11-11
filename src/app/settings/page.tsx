import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { EditProfileForm } from "@/app/profile/EditProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";
import { Lock, User, KeyRound, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  let user: any = null;
  let profile: any = null;
  let role: RoleCode = "non_member";

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (!user) {
      redirect("/login?next=/settings");
    }

    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.rpc("auth_role"),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);

    role = (r as RoleCode) ?? "non_member";
    profile = p;
  } catch (err: any) {
    if (err?.message === "NEXT_REDIRECT") throw err;
    console.error("Settings fetch error:", err);
  }

  const isMember = role === "member";
  const fullName = profile
    ? `${profile.first_name} ${profile.middle_name ? profile.middle_name + " " : ""}${profile.last_name}`
    : "User";
  const roleLabel = ROLE_LABELS[role] || "Student";
  const avatarLetter = (profile?.first_name || "U").charAt(0).toUpperCase();

  return (
    <PortalShell
      activeItem="Settings"
      role={role}
      userName={fullName}
      userRoleLabel={roleLabel}
    >
      <div className="space-y-7 max-w-[1096px]">
        {/* Header */}
        <div className="space-y-1.5">
          <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
            Account Settings
          </h1>
          <p className="text-[15px] text-[#817B77]">
            Manage your personal profile information, security credentials, and preferences.
          </p>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Identity Snapshot */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-6 flex flex-col items-center text-center space-y-3 shadow-xs">
              <div className="w-[84px] h-[84px] rounded-full bg-[#19A7D5] text-[#12191C] flex items-center justify-center font-bold text-[36px] select-none">
                {avatarLetter}
              </div>

              <div className="space-y-1">
                <h3 className="text-[18px] font-bold text-[#1C1713]">
                  {fullName}
                </h3>
                <p className="text-xs text-[#817B77]">
                  {profile?.student_number || "Student Account"} · {profile?.program || "BS CpE"}
                </p>
              </div>

              <div className="pt-1">
                <Badge tone={isMember ? "verified" : "neutral"}>
                  {roleLabel}
                </Badge>
              </div>

              {/* Locked credentials summary */}
              <div className="w-full pt-4 border-t border-[#EEECEA] text-left text-xs space-y-2 text-[#514B47]">
                <div>
                  <span className="text-[#817B77] block text-[10px] uppercase font-bold">Institutional Email</span>
                  <span className="font-medium text-[#1C1713] truncate block">{profile?.email}</span>
                </div>
                <div>
                  <span className="text-[#817B77] block text-[10px] uppercase font-bold">CIT-U Student Number</span>
                  <span className="font-mono font-medium text-[#1C1713]">{profile?.student_number || "—"}</span>
                </div>
                <div>
                  <span className="text-[#817B77] block text-[10px] uppercase font-bold">Academic Program</span>
                  <span className="font-medium text-[#1C1713]">{profile?.program || "BS Computer Engineering"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Profile & Password Form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Information Form */}
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#EEECEA]">
                <User className="w-4 h-4 text-[#0087B5]" />
                <h3 className="text-[16px] font-bold text-[#1C1713]">Personal Information</h3>
              </div>
              <EditProfileForm profile={profile} />
            </div>

            {/* Change Password Form */}
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#EEECEA]">
                <KeyRound className="w-4 h-4 text-[#0087B5]" />
                <h3 className="text-[16px] font-bold text-[#1C1713]">Security & Password</h3>
              </div>
              <p className="text-xs text-[#817B77]">
                Update your account password. Make sure it is at least 8 characters long.
              </p>
              <ChangePasswordForm />
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
