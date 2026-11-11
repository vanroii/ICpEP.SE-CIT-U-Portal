"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { registerFaculty } from "../actions";
import { LogoMark } from "@/components/ui/Logo";
import { CheckCircle2 } from "lucide-react";

export default function FacultyRegisterPage() {
  const [state, action, pending] = useActionState(registerFaculty, undefined);
  const [agreed, setAgreed] = useState(false);

  if (state?.ok) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#DEDBD8] rounded-[16px] p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-[24px] font-bold text-[#1C1713]">Faculty Account Created!</h2>
          <p className="text-[14px] leading-relaxed text-[#514B47]">
            {state.autoSignedIn
              ? "Your faculty account is ready."
              : "An activation link has been sent to your email. Please verify to complete setup."}
          </p>
          <div className="pt-2">
            <Link
              href={state.autoSignedIn ? "/faculty" : "/login"}
              className="inline-flex w-full h-[43px] items-center justify-center rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] font-semibold text-[14px]"
            >
              {state.autoSignedIn ? "Go to Faculty Portal" : "Go to Sign In"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8F8F7]">
      {/* Brand Panel */}
      <div className="hidden lg:flex w-[520px] hero-gradient p-[56px_64px] flex-col justify-between shrink-0 text-white select-none">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark size={42} />
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold text-white tracking-[-0.2px]">ICpEP.SE</span>
            <span className="text-[12px] font-medium text-[#AAA4A0] mt-1">CIT-U Chapter</span>
          </div>
        </Link>

        <div className="space-y-7 max-w-[420px]">
          <h2 className="text-[34px] leading-[42px] font-extrabold text-white tracking-[-0.8px]">
            Faculty & Adviser Portal Registration
          </h2>
          <div className="space-y-4 pt-2">
            {[
              "Read-only oversight of chapter activities",
              "Access to participation reports and analytics",
              "Review membership applications with officers",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3 text-[15px] leading-[22px] text-[#D1CECB]">
                <div className="w-[20px] h-[20px] rounded-full bg-[#19A7D5]/20 flex items-center justify-center text-[#19A7D5] shrink-0 font-bold text-xs">
                  ✓
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[13px] text-[#D1CECB]">
          CpE student?{" "}
          <Link href="/register" className="underline font-semibold text-white">
            Register as a student here.
          </Link>
        </p>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-start justify-center p-5 py-10 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-[440px] space-y-5">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 pb-2">
            <LogoMark size={36} />
            <span className="text-[17px] font-bold text-[#1C1713]">ICpEP.SE CIT-U</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[28px] leading-[36px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Faculty Registration
            </h1>
            <p className="text-[14px] leading-[22px] text-[#817B77]">
              Register as a Faculty Adviser or Instructor for read-only portal access.
            </p>
          </div>

          {/* Student link */}
          <div className="text-[13px] text-[#817B77]">
            CpE student?{" "}
            <Link href="/register" className="font-semibold text-[#0087B5] hover:underline">
              Register as a student instead
            </Link>
          </div>

          {state?.error && (
            <div className="p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] rounded-[10px] text-[13px] text-[#B91C1C]">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            {/* Name fields */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#3D3733]">First Name *</label>
              <input
                name="first_name"
                required
                placeholder="e.g. Maria"
                className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#3D3733]">
                Middle Name <span className="font-normal text-[#928C88]">(optional)</span>
              </label>
              <input
                name="middle_name"
                placeholder="e.g. Garcia"
                className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#3D3733]">Last Name *</label>
              <input
                name="last_name"
                required
                placeholder="e.g. Santos"
                className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
              />
            </div>

            {/* Faculty-specific */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#3D3733]">
                  Employee ID <span className="font-normal text-[#928C88]">(opt.)</span>
                </label>
                <input
                  name="employee_id"
                  placeholder="e.g. EMP-2026-001"
                  className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#3D3733]">
                  Department <span className="font-normal text-[#928C88]">(opt.)</span>
                </label>
                <input
                  name="department"
                  placeholder="e.g. CEA"
                  className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#3D3733]">Faculty Email *</label>
              <input
                name="email"
                type="email"
                required
                placeholder="name@cit.edu"
                className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
              />
            </div>

            {/* Mobile */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#3D3733]">
                Mobile Number <span className="font-normal text-[#928C88]">(optional)</span>
              </label>
              <input
                name="mobile_number"
                type="tel"
                placeholder="09171234567"
                className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#3D3733]">Password *</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#3D3733]">Confirm *</label>
                <input
                  name="confirm_password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
                />
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-[18px] h-[18px] rounded-[5px] border border-[#C9C5C2] text-[#19A7D5] cursor-pointer"
              />
              <span className="text-[13px] text-[#514B47] select-none">
                I agree to the Terms and Privacy Notice
              </span>
            </label>

            <button
              type="submit"
              disabled={pending || !agreed}
              className="w-full h-[44px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] active:bg-[#1383a8] text-[#12191C] text-[14px] font-semibold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {pending ? "Creating account…" : "Create faculty account"}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 pt-1 text-[14px]">
            <span className="text-[#817B77]">Already have an account?</span>
            <Link href="/login" className="font-semibold text-[#0087B5] hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
