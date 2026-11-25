"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { registerStudent } from "./actions";
import { LogoMark } from "@/components/ui/Logo";
import { CheckCircle2, ChevronDown } from "lucide-react";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerStudent, undefined);
  const [agreed, setAgreed] = useState(false);
  const [claimsMembership, setClaimsMembership] = useState(false);

  if (state?.ok) {
    if (state.autoSignedIn) {
      return (
        <div className="min-h-screen bg-surface-page flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-border-default rounded-2xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-[24px] font-bold text-ink-900">Account Created!</h2>
            <p className="text-[14px] leading-relaxed text-text-600">
              Your ICpEP.SE portal account has been created and you are signed in.
            </p>
            <div className="pt-2">
              <Link
                href="/student"
                className="inline-flex w-full h-[43px] items-center justify-center rounded-[8px] bg-cyan-500 hover:bg-[#1695bf] text-on-brand font-semibold text-[14px]"
              >
                Go to Student Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-border-default rounded-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-[24px] font-bold text-ink-900">Account Created!</h2>
          <p className="text-[14px] leading-relaxed text-text-600">
            We have sent an activation link to your email. Please verify to complete your setup.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex w-full h-[43px] items-center justify-center rounded-[8px] bg-cyan-500 hover:bg-[#1695bf] text-on-brand font-semibold text-[14px]"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-surface-page">
      {/* Brand Panel */}
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen w-[560px] hero-gradient p-[56px_64px] flex-col justify-between shrink-0 text-white select-none overflow-y-auto">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark size={42} />
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold text-white tracking-[-0.2px]">ICpEP.SE</span>
            <span className="text-[12px] font-medium text-text-mute mt-1">CIT-U Chapter</span>
          </div>
        </Link>

        <div className="space-y-7 max-w-[460px]">
          <h2 className="text-[36px] leading-[44px] font-extrabold text-white tracking-[-0.8px]">
            Join the ICpEP.SE CIT-U community.
          </h2>
          <div className="space-y-5 pt-2">
            {[
              "Create your account with your student ID",
              "We match you to the official masterlist",
              "Access exclusive events, news, and resources",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3 text-[15px] leading-[22px] text-text-dark">
                <div className="w-[20px] h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0 font-bold text-xs">
                  ✓
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[13px] text-text-dark">
          Faculty adviser?{" "}
          <Link href="/register/faculty" className="underline font-semibold text-white">
            Register as faculty here.
          </Link>
        </p>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-start justify-center p-5 py-10 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-[460px] space-y-5">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 pb-2">
            <LogoMark size={36} />
            <span className="text-[17px] font-bold text-ink-900">ICpEP.SE CIT-U</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[28px] leading-9 font-bold text-ink-900 tracking-[-0.5px]">
              Student Registration
            </h1>
            <p className="text-[14px] leading-[22px] text-text-500">
              Enter your details exactly as they appear in the ICpEP.SE masterlist.
            </p>
          </div>

          {/* Faculty link */}
          <div className="text-[13px] text-text-500">
            Faculty adviser?{" "}
            <Link href="/register/faculty" className="font-semibold text-cyan-600 hover:underline">
              Register here instead
            </Link>
          </div>

          {state?.error && (
            <div className="p-3.5 bg-status-danger-bg border border-status-danger-border rounded-[10px] text-[13px] text-status-danger">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            {/* Name fields — 3 separate boxes */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-text-700">First Name *</label>
              <input
                name="first_name"
                required
                placeholder="e.g. Juan"
                className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-border-input text-[14px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-text-700">
                Middle Name <span className="font-normal text-text-400">(optional)</span>
              </label>
              <input
                name="middle_name"
                placeholder="e.g. Santos"
                className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-border-input text-[14px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-text-700">Last Name *</label>
              <input
                name="last_name"
                required
                placeholder="e.g. Dela Cruz"
                className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-border-input text-[14px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* Student ID & Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-text-700">Student ID *</label>
                <input
                  name="student_number"
                  required
                  placeholder="23-1042-118"
                  className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-border-input text-[14px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-text-700">Course & Year *</label>
                <div className="relative">
                  <select
                    name="year_and_section"
                    defaultValue=""
                    required
                    className="w-full h-[46px] px-4 pr-9 rounded-[10px] bg-white border border-border-input text-[14px] text-ink-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select</option>
                    <option value="BSCpE-1">BSCpE-1</option>
                    <option value="BSCpE-2">BSCpE-2</option>
                    <option value="BSCpE-3">BSCpE-3</option>
                    <option value="BSCpE-4">BSCpE-4</option>
                    <option value="BSCpE-5">BSCpE-5</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-text-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* School Email */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-text-700">School Email *</label>
              <input
                name="email"
                type="email"
                required
                placeholder="name@cit.edu"
                className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-border-input text-[14px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-text-700">
                Mobile Number <span className="font-normal text-text-400">(optional)</span>
              </label>
              <input
                name="mobile_number"
                type="tel"
                placeholder="09171234567"
                className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-border-input text-[14px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-text-700">Password *</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-border-input text-[14px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-text-700">Confirm *</label>
                <input
                  name="confirm_password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-border-input text-[14px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            {/* Existing member claim */}
            <div className="space-y-3 p-3.5 bg-surface-100 rounded-[10px]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="claims_membership"
                  checked={claimsMembership}
                  onChange={(e) => setClaimsMembership(e.target.checked)}
                  className="w-[18px] h-[18px] rounded-[5px] border border-border-input text-cyan-500 cursor-pointer"
                />
                <span className="text-[13px] text-text-600 select-none">
                  I am already a verified ICpEP member (requires officer review)
                </span>
              </label>
              {claimsMembership && (
                <input
                  name="membership_no"
                  placeholder="ICpEP membership number (if known)"
                  className="w-full h-[40px] px-3.5 rounded-[8px] bg-white border border-border-input text-[13px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500"
                />
              )}
            </div>

            {/* Terms */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-[18px] h-[18px] rounded-[5px] border border-border-input text-cyan-500 cursor-pointer"
              />
              <span className="text-[13px] text-text-600 select-none">
                I agree to the Terms and Privacy Notice
              </span>
            </label>

            <button
              type="submit"
              disabled={pending || !agreed}
              className="w-full h-[44px] rounded-[8px] bg-cyan-500 hover:bg-[#1695bf] active:bg-[#1383a8] text-on-brand text-[14px] font-semibold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {pending ? "Creating account…" : "Create student account"}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 pt-1 text-[14px]">
            <span className="text-text-500">Already have an account?</span>
            <Link href="/login" className="font-semibold text-cyan-600 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
