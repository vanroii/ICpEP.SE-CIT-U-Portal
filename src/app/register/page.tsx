"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { register } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle2, AlertCircle, Shield, Award } from "lucide-react";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined);
  const [claimsMembership, setClaimsMembership] = useState(false);

  if (state?.ok) {
    return (
      <div className="mx-auto max-w-md py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#e6f7eb] text-[#218c54] flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="rounded-3xl border border-[#c4edd0] bg-white p-8 space-y-3 shadow-sm">
          <h1 className="text-2xl font-black text-[#1b1613]">Check Your E-mail</h1>
          <p className="text-xs sm:text-sm text-[#45403d] leading-relaxed">
            We have sent a verification link to your registered email address. Click the link to activate your ICpEP.SE portal account.
          </p>
          <div className="pt-4 border-t border-[#f0eeeb]">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#1ca7e0] px-4 py-2.5 text-xs font-bold text-[#1b1613] hover:bg-[#1898cc] transition-colors"
            >
              Proceed to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl w-full py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1ca7e0] text-[#1b1613] font-black text-xl shadow-sm mb-1">
          SE
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1b1613] tracking-tight">
          Create ICpEP.SE Account
        </h1>
        <p className="text-xs text-[#8c8785]">
          CIT-U Computer Engineering Student Portal (AY 2026–2027)
        </p>
      </div>

      <form
        action={action}
        className="rounded-3xl border border-[#e0dedb] bg-white p-6 sm:p-10 shadow-sm space-y-5"
      >
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" name="first_name" required placeholder="Juan" />
          <Input label="Last Name" name="last_name" required placeholder="Dela Cruz" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Middle Name (Optional)" name="middle_name" placeholder="Santos" />
          <Input label="CIT-U Student Number" name="student_number" required placeholder="e.g. 21-1234-567" />
        </div>

        {/* Academic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
              Academic Program <span className="text-[#bf2626]">*</span>
            </label>
            <select
              name="program"
              defaultValue="BS Computer Engineering"
              className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] focus:border-[#1ca7e0] focus:ring-3 focus:ring-[#1ca7e0]/20 outline-none"
            >
              <option value="BS Computer Engineering">BS Computer Engineering</option>
              <option value="BS Electronics Engineering">BS Electronics Engineering</option>
              <option value="BS Electrical Engineering">BS Electrical Engineering</option>
              <option value="BS Computer Science">BS Computer Science</option>
              <option value="BS Information Technology">BS Information Technology</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#45403d] tracking-wide">
              Year Level <span className="text-[#bf2626]">*</span>
            </label>
            <select
              name="year_level"
              defaultValue="1"
              className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] focus:border-[#1ca7e0] focus:ring-3 focus:ring-[#1ca7e0]/20 outline-none"
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>
          </div>
        </div>

        {/* Contact and Auth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Institutional / Contact E-mail"
            name="email"
            type="email"
            required
            placeholder="juan.delacruz@cit.edu"
          />
          <Input
            label="Mobile Number (Optional)"
            name="contact_number"
            type="tel"
            placeholder="0912 345 6789"
          />
        </div>

        <Input
          label="Password (Minimum 8 characters)"
          name="password"
          type="password"
          minLength={8}
          required
          placeholder="••••••••"
        />

        {/* Membership Claim Checkbox (FR-03 & BR-03) */}
        <div className="rounded-2xl border border-[#bce9f7] bg-[#e3f6fc]/50 p-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="claims_membership"
              checked={claimsMembership}
              onChange={(e) => setClaimsMembership(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#0a7db0] text-[#1ca7e0] focus:ring-[#1ca7e0]"
            />
            <div className="text-xs">
              <span className="font-bold text-[#0a7db0] flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                I am already a verified ICpEP Member for AY 2026–2027
              </span>
              <p className="text-[11px] text-[#45403d] mt-0.5">
                Checking this creates an expedited membership verification application for chapter officers to review.
              </p>
            </div>
          </label>

          {claimsMembership && (
            <div className="pt-2">
              <Input
                label="Claimed ICpEP Membership / Certificate Number"
                name="membership_no"
                placeholder="e.g. ICPEP-CITU-2026-0042"
                helperText="Provide your membership reference number or receipt code."
              />
            </div>
          )}
        </div>

        {state?.error && (
          <div className="flex items-start gap-2 rounded-xl bg-[#fae6e6] border border-[#f5c6c6] p-3 text-xs text-[#bf2626]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        <Button
          type="submit"
          isLoading={pending}
          variant="primary"
          size="md"
          className="w-full font-bold shadow-md"
        >
          Create Student Account
        </Button>

        <p className="text-center text-xs text-[#45403d]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-[#0a7db0] hover:text-[#1ca7e0] underline"
          >
            Log In here
          </Link>
        </p>
      </form>
    </div>
  );
}
