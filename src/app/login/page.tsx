"use client";

import React, { Suspense, useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";
import { LogoMark } from "@/components/ui/Logo";

function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-[420px] space-y-5">
      {/* Mobile Header Logo */}
      <div className="lg:hidden flex items-center gap-3 pb-2">
        <LogoMark size={36} />
        <span className="text-[17px] font-bold text-ink-900">ICpEP.SE CIT-U</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-[32px] leading-[40px] font-bold text-ink-900 tracking-[-0.6px]">
          Log in
        </h1>
        <p className="text-[15px] leading-[24px] text-text-500">
          Enter your email or student number and password.
        </p>
      </div>

      {state?.error && (
        <div className="p-3.5 bg-status-danger-bg border border-status-danger-border rounded-[10px] text-[13px] text-status-danger">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        {/* Email or Student number */}
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-text-700">
            Email or student number
          </label>
          <input
            name="email"
            type="text"
            required
            placeholder="name@cit.edu or 23-1042-118"
            className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-border-input text-[15px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-text-700">
            Password
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full h-[46px] px-4 pr-12 rounded-[10px] bg-white border border-border-input text-[15px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-text-500 transition-colors hover:text-ink-900"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="keepSignedIn"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              className="w-[18px] h-[18px] rounded-[5px] border border-border-input text-cyan-500 focus:ring-cyan-500 cursor-pointer"
            />
            <label
              htmlFor="keepSignedIn"
              className="text-[13px] text-text-600 cursor-pointer select-none"
            >
              Keep me signed in
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-[13px] font-semibold text-cyan-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        {/* Primary Log in Button */}
        <button
          type="submit"
          disabled={pending}
          className="w-full h-[43px] rounded-[8px] bg-cyan-500 hover:bg-[#1695bf] active:bg-[#1383a8] text-on-brand text-[14px] font-semibold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 mt-2"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>

      {/* Or divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-[1px] bg-border-default" />
        <span className="text-[13px] text-text-400">or</span>
        <div className="flex-1 h-[1px] bg-border-default" />
      </div>

      {/* Continue as visitor */}
      <Link
        href="/"
        className="w-full h-[46px] rounded-[8px] border-[1.5px] border-cyan-600 text-cyan-600 hover:bg-cyan-50 text-[14px] font-semibold transition-colors flex items-center justify-center"
      >
        Continue as visitor
      </Link>

      {/* New here */}
      <div className="flex items-center justify-center gap-1.5 pt-2 text-[14px]">
        <span className="text-text-500">New here?</span>
        <Link
          href="/register"
          className="font-semibold text-cyan-600 hover:underline"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-surface-page">
      {/* Brand Panel (560px, dark gradient, §4.3) */}
      <div className="hidden lg:flex w-[560px] hero-gradient p-[56px_64px] flex-col shrink-0 text-white select-none">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <LogoMark size={42} />
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold text-white tracking-[-0.2px]">
              ICpEP.SE
            </span>
            <span className="text-[12px] font-medium text-text-mute mt-1">
              CIT-U Chapter
            </span>
          </div>
        </Link>

        <div className="flex flex-1 items-center justify-center pt-12">
          {/* Brand Pitch */}
          <div className="max-w-[480px] space-y-6">
          <h2 className="text-[40px] leading-[48px] font-extrabold text-white tracking-[-0.8px]">
            Welcome back to ICpEP.SE CIT-U.
          </h2>

          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-3 text-[16px] leading-[24px] text-text-dark">
              <div className="w-[22px] h-[22px] rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0 font-bold text-xs">
                ✓
              </div>
              <span>Events, news, and announcements in one place</span>
            </div>

            <div className="flex items-center gap-3 text-[16px] leading-[24px] text-text-dark">
              <div className="w-[22px] h-[22px] rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0 font-bold text-xs">
                ✓
              </div>
              <span>A dashboard made for your role</span>
            </div>

            <div className="flex items-center gap-3 text-[16px] leading-[24px] text-text-dark">
              <div className="w-[22px] h-[22px] rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0 font-bold text-xs">
                ✓
              </div>
              <span>Messages and notifications, always up to date</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Form Panel (820px) */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-12 min-h-screen lg:min-h-0">
        <Suspense fallback={<div className="text-sm text-text-500">Loading login form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
