"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./ui/Logo";
import { Menu, X } from "lucide-react";

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Events", href: "/events" },
    { label: "Officers", href: "/about#officers" },
    { label: "Resources", href: "/about#resources" },
  ];

  return (
    <header className="w-full bg-[#1C1713] border-b border-[#39322E] sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto h-[78px] px-5 sm:px-12 lg:px-[120px] flex items-center justify-between">
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

        {/* Center Nav Links — desktop */}
        <nav className="hidden md:flex items-center gap-9">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-[15px] transition-colors ${
                  isActive
                    ? "font-semibold text-[#19A7D5]"
                    : "font-medium text-white hover:text-[#19A7D5]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions — desktop */}
        <div className="hidden sm:flex items-center gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-[15px] font-semibold text-[#19A7D5] hover:underline"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="h-[43px] px-[22px] flex items-center justify-center rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] active:bg-[#1383a8] text-[#12191C] text-[14px] font-semibold transition-colors"
          >
            Register
          </Link>
        </div>

        {/* Hamburger — mobile */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center text-white rounded-[8px] hover:bg-[#2C2622] transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-[#1C1713] border-t border-[#39322E] px-5 pb-5 space-y-1 animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-2.5 px-3 rounded-[8px] text-[15px] transition-colors ${
                  isActive
                    ? "font-semibold text-[#19A7D5] bg-[#2C2622]"
                    : "font-medium text-white hover:bg-[#2C2622]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="flex items-center gap-3 pt-3 border-t border-[#39322E] mt-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 h-[40px] flex items-center justify-center rounded-[8px] border-[1.5px] border-[#19A7D5] text-[#19A7D5] text-[14px] font-semibold transition-colors hover:bg-[#19A7D5]/10"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="flex-1 h-[40px] flex items-center justify-center rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] text-[14px] font-semibold transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
