"use client";

import React from "react";
import { PortalShell } from "@/components/PortalShell";

export default function ProfilePage() {
  const interests = [
    "Embedded systems",
    "Web development",
    "Robotics",
    "Gaming",
    "Music",
  ];

  return (
    <PortalShell activeItem="Profile">
      <div className="space-y-7">
        {/* Page Header (1096x62, §6.5) */}
        <div className="space-y-1.5">
          <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
            Profile
          </h1>
          <p className="text-[15px] text-[#817B77]">
            Your identity in the ICpEP.SE community.
          </p>
        </div>

        {/* Community Identity Card (1096x382) */}
        <div className="bg-white border border-[#DEDBD8] rounded-[16px] overflow-hidden">
          {/* Profile Cover Banner (224px height, decorative circuits and orbits) */}
          <div className="w-full h-[224px] profile-cover-gradient relative p-8 text-white overflow-hidden select-none">
            {/* Background Orbits & Processor Motif */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 w-[360px] h-[360px] pointer-events-none opacity-60">
              <div className="absolute inset-0 rounded-full border border-[#72D2ED]/30" />
              <div className="absolute inset-10 rounded-full border border-[#72D2ED]/40" />
              <div className="absolute inset-20 rounded-full border border-[#72D2ED]/50 bg-[#19A7D5]/10" />
              <div className="absolute inset-[127px] rounded-[22px] bg-[#0A3B50] border-[1.5px] border-[#72D2ED] flex items-center justify-center">
                <span className="text-[#72D2ED] font-mono text-xs font-bold tracking-widest">
                  CPU
                </span>
              </div>
              <div className="absolute top-12 left-16 w-2.5 h-2.5 rounded-full bg-[#72D2ED]" />
              <div className="absolute bottom-16 right-12 w-2 h-2 rounded-full bg-[#72D2ED]" />
            </div>

            {/* Cover Copy */}
            <div className="relative z-10 max-w-lg space-y-2">
              <p className="text-[11px] font-semibold tracking-[2px] text-[#72D2ED] uppercase">
                LEARN. BUILD. CONNECT.
              </p>
              <h2 className="text-[34px] leading-tight font-semibold tracking-[-0.8px] text-white">
                Curiosity, connected.
              </h2>
              <p className="text-[14px] text-[#B5DAE5]">
                A little code. A lot of possibilities.
              </p>
            </div>
          </div>

          {/* Identity Information Row */}
          <div className="px-6 sm:px-8 py-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              {/* Avatar overlapping banner (136x136) */}
              <div className="sm:-mt-20 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-[136px] h-[136px] rounded-full bg-[#19A7D5] border-[7px] border-white text-[#12191C] flex items-center justify-center font-bold text-[54px] shadow-sm shrink-0 select-none">
                  M
                </div>

                <div className="text-center sm:text-left space-y-2 sm:pt-4">
                  <h2 className="text-[32px] leading-tight font-bold text-[#1C1713] tracking-[-0.8px]">
                    Student Member
                  </h2>
                  <p className="text-[15px] text-[#817B77]">@member</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-[6px] bg-[#E3F6FC] text-[#0087B5] text-[12px] font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#19A7D5]" />
                      Member
                    </span>
                    <span className="px-2.5 py-1 rounded-[6px] bg-[#F5F4F3] text-[#1C1713] text-[12px] font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#817B77]" />
                      BSCpE
                    </span>
                  </div>
                </div>
              </div>

              {/* Membership Date */}
              <div className="text-center sm:text-right space-y-1 sm:pt-4">
                <span className="text-[11px] font-semibold tracking-[1px] text-[#817B77] uppercase block">
                  MEMBER SINCE
                </span>
                <span className="text-[18px] font-semibold text-[#1C1713]">
                  2024
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details (About Me + My Chapter) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* About Me (728px = lg:col-span-8) */}
          <div className="lg:col-span-8 bg-white border border-[#DEDBD8] rounded-[16px] p-7 space-y-4">
            <h3 className="text-[18px] font-semibold text-[#1C1713]">About Me</h3>
            <p className="text-[15px] leading-[1.7] text-[#514A45]">
              Computer engineering student, curious about how things work — from a
              few lines of code to the hardware behind them. Always up for learning
              something new and building with fellow CpE students.
            </p>

            <div className="w-full h-[1px] bg-[#EEECEA] my-2" />

            <div className="space-y-3">
              <p className="text-[12px] font-semibold tracking-[0.8px] text-[#817B77] uppercase">
                INTERESTS
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="h-[34px] px-3 rounded-[8px] bg-[#F5F4F3] text-[13px] font-medium text-[#1C1713] flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#19A7D5]" />
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Chapter Membership (344px = lg:col-span-4) */}
          <div className="lg:col-span-4 bg-white border border-[#DEDBD8] rounded-[16px] p-6 space-y-4">
            <h3 className="text-[18px] font-semibold text-[#1C1713]">My chapter</h3>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[12px] bg-[#E3F6FC] text-[#0087B5] flex items-center justify-center font-bold text-[13px] shrink-0">
                CpE
              </div>
              <div className="leading-tight">
                <p className="text-[15px] font-semibold text-[#1C1713]">
                  ICpEP.SE
                </p>
                <p className="text-[13px] text-[#817B77]">CIT-U Chapter</p>
              </div>
            </div>

            <div className="w-full h-[1px] bg-[#EEECEA]" />

            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#817B77]">Year & section</span>
              <span className="font-semibold text-[#1C1713]">BSCpE</span>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-[12px] text-[#817B77]">
          Your community identity lives here. Personal information and preferences
          stay in Account Settings.
        </p>
      </div>
    </PortalShell>
  );
}
