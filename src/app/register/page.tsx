"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { register } from "./actions";
import { LogoMark } from "@/components/ui/Logo";
import { CheckCircle2, ChevronDown } from "lucide-react";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined);
  const [agreed, setAgreed] = useState(false);

  if (state?.ok) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#DEDBD8] rounded-[16px] p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-[24px] font-bold text-[#1C1713]">Account Created!</h2>
          <p className="text-[14px] leading-relaxed text-[#514B47]">
            We have sent an activation link to your email address. Please verify to
            complete your setup.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex w-full h-[43px] items-center justify-center rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] font-semibold text-[14px]"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8F8F7]">
      {/* Brand Panel (620px, dark gradient) */}
      <div className="hidden lg:flex w-[620px] hero-gradient p-[56px_64px] flex-col justify-between shrink-0 text-white select-none">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <LogoMark size={42} />
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold text-white tracking-[-0.2px]">
              ICpEP.SE
            </span>
            <span className="text-[12px] font-medium text-[#AAA4A0] mt-1">
              CIT-U Chapter
            </span>
          </div>
        </Link>

        {/* Pitch */}
        <div className="space-y-7 max-w-[480px]">
          <h2 className="text-[40px] leading-[48px] font-extrabold text-white tracking-[-0.8px]">
            Join the ICpEP.SE CIT-U community.
          </h2>

          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-3 text-[16px] leading-[24px] text-[#D1CECB]">
              <div className="w-[22px] h-[22px] rounded-full bg-[#19A7D5]/20 flex items-center justify-center text-[#19A7D5] shrink-0 font-bold text-xs">
                ✓
              </div>
              <span>Create your account with your student ID</span>
            </div>

            <div className="flex items-center gap-3 text-[16px] leading-[24px] text-[#D1CECB]">
              <div className="w-[22px] h-[22px] rounded-full bg-[#19A7D5]/20 flex items-center justify-center text-[#19A7D5] shrink-0 font-bold text-xs">
                ✓
              </div>
              <span>We match you to the official masterlist</span>
            </div>

            <div className="flex items-center gap-3 text-[16px] leading-[24px] text-[#D1CECB]">
              <div className="w-[22px] h-[22px] rounded-full bg-[#19A7D5]/20 flex items-center justify-center text-[#19A7D5] shrink-0 font-bold text-xs">
                ✓
              </div>
              <span>Access exclusive events, news, and resources</span>
            </div>
          </div>
        </div>

        {/* Support Help */}
        <p className="text-[14px] text-[#D1CECB]">
          Need help? Contact the ICpEP.SE student officers or admin team.
        </p>
      </div>

      {/* Form Panel (820px, white/page surface) */}
      <div className="flex-1 flex items-center justify-center p-5 py-10 sm:p-12 min-h-screen lg:min-h-0">
        <div className="w-full max-w-[440px] space-y-5">
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex items-center gap-3 pb-2">
            <LogoMark size={36} />
            <span className="text-[17px] font-bold text-[#1C1713]">ICpEP.SE CIT-U</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-[32px] leading-[40px] font-bold text-[#1C1713] tracking-[-0.6px]">
              Create your account
            </h1>
            <p className="text-[15px] leading-[24px] text-[#817B77]">
              Use your details exactly as they appear in the ICpEP.SE masterlist so we can
              verify you.
            </p>
          </div>

          {state?.error && (
            <div className="p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] rounded-[10px] text-[13px] text-[#B91C1C]">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-[14px] font-semibold text-[#3D3733]">
                Full name
              </label>
              <input
                name="full_name"
                required
                placeholder="Last name, First name"
                className="w-full h-[48px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
              />
            </div>

            {/* Student ID & Year/Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#3D3733]">
                  Student ID
                </label>
                <input
                  name="student_number"
                  required
                  placeholder="23-1042-118"
                  className="w-full h-[48px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#3D3733]">
                  Year & section
                </label>
                <div className="relative">
                  <select
                    name="year_and_section"
                    defaultValue=""
                    required
                    className="w-full h-[48px] px-4 pr-10 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="BSCpE-1">BSCpE-1</option>
                    <option value="BSCpE-2">BSCpE-2</option>
                    <option value="BSCpE-3">BSCpE-3</option>
                    <option value="BSCpE-4">BSCpE-4</option>
                    <option value="BSCpE-5">BSCpE-5</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#928C88] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* School Email */}
            <div className="space-y-2">
              <label className="block text-[14px] font-semibold text-[#3D3733]">
                School email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="name@cit.edu"
                className="w-full h-[48px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
              />
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#3D3733]">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-[48px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#3D3733]">
                  Confirm password
                </label>
                <input
                  name="confirm_password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-[48px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-[18px] h-[18px] rounded-[5px] border border-[#C9C5C2] text-[#19A7D5] focus:ring-[#19A7D5] cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="text-[13px] text-[#514B47] cursor-pointer select-none"
              >
                I agree to the Terms and Privacy Notice
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full h-[43px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] active:bg-[#1383a8] text-[#12191C] text-[14px] font-semibold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 mt-2"
            >
              {pending ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Already have an account */}
          <div className="flex items-center justify-center gap-1.5 pt-2 text-[14px]">
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
