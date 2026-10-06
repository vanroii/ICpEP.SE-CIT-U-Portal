import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EditProfileForm } from "./EditProfileForm";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";
import {
  User,
  Award,
  Mail,
  GraduationCap,
  Calendar,
  ShieldCheck,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let profile: any = null;
  let role: RoleCode = "non_member";
  let membership: any = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [{ data: r }, { data: p }, { data: m }] = await Promise.all([
        supabase.rpc("auth_role"),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("memberships").select("*, school_years(label)").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      ]);

      role = (r as RoleCode) ?? "non_member";
      profile = p;
      membership = m;
    }
  } catch {
    // offline fallback
  }

  // Fallback demo dataset
  if (!profile) {
    profile = {
      first_name: "Juan",
      middle_name: "Santos",
      last_name: "Dela Cruz",
      email: "juan.delacruz@cit.edu",
      student_number: "22-1234-567",
      program: "BS Computer Engineering",
      year_level: 3,
      contact_number: "0917 123 4567",
      bio: "Aspiring embedded systems engineer. Passionate about robotics and edge computing.",
      is_active: true,
    };
  }

  const roleTones: Record<RoleCode, "neutral" | "info" | "success" | "warning" | "danger"> = {
    non_member: "neutral",
    member: "success",
    officer: "info",
    faculty: "warning",
    admin: "danger",
  };

  const fullName = `${profile.first_name} ${profile.middle_name ? profile.middle_name + " " : ""}${profile.last_name}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Profile Identity Card */}
      <div className="rounded-3xl border border-[#e0dedb] bg-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-5">
          <Avatar name={fullName} size="lg" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#1b1613]">
                {fullName}
              </h1>
              <Badge tone={roleTones[role]}>
                {ROLE_LABELS[role] || "Student"}
              </Badge>
              {profile.is_active && (
                <Badge tone="success" className="text-[10px]">
                  Active Account
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#8c8785] font-mono">
              CIT-U Student No: {profile.student_number || "Not assigned"}
            </p>
            <p className="text-xs text-[#45403d]">
              {profile.email}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Academic & Membership Status (Guarded fields) */}
        <div className="space-y-6">
          {/* Active Membership Card (if member) */}
          {role === "member" && membership && (
            <div className="rounded-2xl border border-[#bce9f7] bg-[#e3f6fc] p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#0a7db0]">
                <Award className="w-5 h-5" />
                <h3 className="font-bold text-sm">Verified ICpEP Member</h3>
              </div>
              <div className="text-xs space-y-1 text-[#0a7db0]/90">
                <p>
                  <strong>Membership ID:</strong> {membership.membership_no}
                </p>
                <p>
                  <strong>School Year:</strong> {membership.school_years?.label || "2026-2027"}
                </p>
                {membership.valid_until && (
                  <p>
                    <strong>Valid Until:</strong> {new Date(membership.valid_until).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Academic Profile (BR-07 Guarded Notice) */}
          <div className="rounded-2xl border border-[#e0dedb] bg-white p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#1b1613] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#0a7db0]" />
              Academic Credentials
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[#8c8785] block text-[11px]">Academic Program</span>
                <span className="font-bold text-[#1b1613]">{profile.program}</span>
              </div>
              <div>
                <span className="text-[#8c8785] block text-[11px]">Year Level</span>
                <span className="font-bold text-[#1b1613]">Year {profile.year_level || 1}</span>
              </div>
              <div>
                <span className="text-[#8c8785] block text-[11px]">Institution</span>
                <span className="text-[#1b1613]">Cebu Institute of Technology - University</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#f0eeeb] flex items-start gap-2 text-[11px] text-[#8c8785]">
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#9e700a]" />
              <span>
                Student number, program, and institutional email are locked to prevent tampering. Contact an administrator to update these credentials (BR-07).
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Details */}
        <div className="lg:col-span-2 rounded-2xl border border-[#e0dedb] bg-white p-6 sm:p-8 space-y-6">
          <div className="space-y-1 pb-4 border-b border-[#f0eeeb]">
            <h2 className="text-base font-bold text-[#1b1613] flex items-center gap-2">
              <User className="w-4 h-4 text-[#0a7db0]" />
              Personal & Contact Information
            </h2>
            <p className="text-xs text-[#8c8785]">
              Update your public display name, mobile contact, and technical bio.
            </p>
          </div>

          <EditProfileForm profile={profile} />
        </div>
      </div>
    </div>
  );
}
