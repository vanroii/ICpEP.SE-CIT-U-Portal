"use client";

import React from "react";
import { PortalShell } from "@/components/PortalShell";
import { Sparkles } from "lucide-react";

export default function StudentHomePage() {
  return (
    <PortalShell activeItem="Home" role="member">
      <div className="space-y-7">
        {/* Page Header (1096x62, §5.4, §6.1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Home
            </h1>
            <p className="text-[15px] text-[#817B77]">
              Posts from ICpEP.SE Faculty and Officers
            </p>
          </div>
        </div>

        {/* Feed Container */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[620px] space-y-6">
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E3F6FC] text-[#0087B5] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-[18px] font-bold text-[#1C1713]">No posts yet</h3>
              <p className="text-[14px] text-[#817B77] max-w-sm mx-auto">
                Official posts, announcements, and updates from ICpEP.SE faculty and student officers will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
