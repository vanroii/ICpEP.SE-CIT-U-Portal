"use client";

import React, { Suspense, useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";
import { LogoMark, LogoLarge } from "@/components/ui/Logo";

function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  return (
    <div className="w-full max-w-[420px] space-y-5">
      {/* Mobile Header Logo */}
      <div className="lg:hidden flex items-center gap-3 pb-2">
        <LogoMark size={36} />
        <span className="text-[17px] font-bold text-[#1C1713]">ICpEP.SE CIT-U</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-[32px] leading-[40px] font-bold text-[#1C1713] tracking-[-0.6px]">
          Log in
        </h1>
        <p className="text-[15px] leading-[24px] text-[#817B77]">
          Enter your email or student number and password.
        </p>
      </div>

      {state?.error && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] rounded-[10px] text-[13px] text-[#B91C1C]">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        {/* Email or Student number */}
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-[#3D3733]">
            Email or student number
          </label>
          <input
            name="email"
            type="text"
            required
            placeholder="name@cit.edu or 23-1042-118"
            className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[14px] font-semibold text-[#3D3733]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[13px] font-semibold text-[#0087B5] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
          />
        </div>

        {/* Keep me signed in */}
        <div className="flex items-center gap-2.5 pt-0.5">
          <input
            type="checkbox"
            id="keepSignedIn"
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
            className="w-[18px] h-[18px] rounded-[5px] border border-[#C9C5C2] text-[#19A7D5] focus:ring-[#19A7D5] cursor-pointer"
          />
          <label
            htmlFor="keepSignedIn"
            className="text-[13px] text-[#514B47] cursor-pointer select-none"
          >
            Keep me signed in
          </label>
        </div>

        {/* Primary Log in Button */}
        <button
          type="submit"
          disabled={pending}
          className="w-full h-[43px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] active:bg-[#1383a8] text-[#12191C] text-[14px] font-semibold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 mt-2"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>

      {/* Or divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-[1px] bg-[#DEDBD8]" />
        <span className="text-[13px] text-[#928C88]">or</span>
        <div className="flex-1 h-[1px] bg-[#DEDBD8]" />
      </div>

      {/* Continue as visitor */}
      <Link
        href="/"
        className="w-full h-[46px] rounded-[8px] border-[1.5px] border-[#0087B5] text-[#0087B5] hover:bg-[#E3F6FC] text-[14px] font-semibold transition-colors flex items-center justify-center"
      >
        Continue as visitor
      </Link>

      {/* New here */}
      <div className="flex items-center justify-center gap-1.5 pt-2 text-[14px]">
        <span className="text-[#817B77]">New here?</span>
        <Link
          href="/register"
          className="font-semibold text-[#0087B5] hover:underline"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8F8F7]">
      {/* Brand Panel (620px, dark gradient, §4.3) */}
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

        {/* Brand Pitch with Logo/Large */}
        <div className="space-y-6 max-w-[480px]">
          <LogoLarge size={140} />

          <h2 className="text-[40px] leading-[48px] font-extrabold text-white tracking-[-0.8px]">
            Welcome back to ICpEP.SE CIT-U.
          </h2>

          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-3 text-[16px] leading-[24px] text-[#D1CECB]">
              <div className="w-[22px] h-[22px] rounded-full bg-[#19A7D5]/20 flex items-center justify-center text-[#19A7D5] shrink-0 font-bold text-xs">
                ✓
              </div>
              <span>Events, news, and announcements in one place</span>
            </div>

            <div className="flex items-center gap-3 text-[16px] leading-[24px] text-[#D1CECB]">
              <div className="w-[22px] h-[22px] rounded-full bg-[#19A7D5]/20 flex items-center justify-center text-[#19A7D5] shrink-0 font-bold text-xs">
                ✓
              </div>
              <span>A dashboard made for your role</span>
            </div>

            <div className="flex items-center gap-3 text-[16px] leading-[24px] text-[#D1CECB]">
              <div className="w-[22px] h-[22px] rounded-full bg-[#19A7D5]/20 flex items-center justify-center text-[#19A7D5] shrink-0 font-bold text-xs">
                ✓
              </div>
              <span>Messages and notifications, always up to date</span>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-[14px] text-[#D1CECB]">
          Visitors can browse public events and news without logging in.
        </p>
      </div>

      {/* Form Panel (820px) */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-12 min-h-screen lg:min-h-0">
        <Suspense fallback={<div className="text-sm text-[#817B77]">Loading login form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
