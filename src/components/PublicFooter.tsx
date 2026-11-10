import React from "react";
import Link from "next/link";
import { LogoMark } from "./ui/Logo";

export function PublicFooter() {
  return (
    <footer className="w-full bg-[#1C1713] text-[#D1CECB] pt-[72px] pb-[48px]">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-12 lg:px-[120px] space-y-12">
        {/* Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16">
          {/* Brand Column */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-3">
              <LogoMark size={42} />
              <div className="flex flex-col leading-none">
                <span className="text-[17px] font-bold text-white tracking-[-0.2px]">
                  ICpEP.SE
                </span>
                <span className="text-[12px] font-medium text-[#AAA4A0] mt-1">
                  CIT-U Chapter
                </span>
              </div>
            </div>
            <p className="text-[14px] leading-[22px] text-[#D1CECB] max-w-sm">
              The official Computer Engineering student organization of Cebu
              Institute of Technology – University.
            </p>
          </div>

          {/* Organization */}
          <div className="space-y-3.5 md:col-span-4 md:justify-self-end md:-translate-x-8">
            <h4 className="text-[14px] font-semibold text-white">Organization</h4>
            <ul className="space-y-3.5 text-[14px] text-[#D1CECB]">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/about#officers" className="hover:text-white transition-colors">
                  Officers
                </Link>
              </li>
              <li>
                <Link href="/#events" className="hover:text-white transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/about#contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-[#39322E]" />

        {/* Legal Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#AAA4A0]">
          <p>© 2026 ICpEP.SE CIT-U Chapter. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

