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
    { label: "Events", href: "/#events" },
    { label: "Officers", href: "/about#officers" },
  ];

  return (
    <header className="w-full bg-ink-900 border-b border-ink-border sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto h-[78px] px-5 sm:px-12 lg:px-[120px] flex items-center justify-between">
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
                    ? "font-semibold text-cyan-500"
                    : "font-medium text-white hover:text-cyan-500"
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
            className="text-[15px] font-semibold text-cyan-500 hover:underline"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="h-[43px] px-[22px] flex items-center justify-center rounded-[8px] bg-cyan-500 hover:bg-[#1695bf] active:bg-[#1383a8] text-on-brand text-[14px] font-semibold transition-colors"
          >
            Register
          </Link>
        </div>

        {/* Hamburger — mobile */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center text-white rounded-[8px] hover:bg-ink-800 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-ink-900 border-t border-ink-border px-5 pb-5 space-y-1 animate-in slide-in-from-top-2">
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
                    ? "font-semibold text-cyan-500 bg-ink-800"
                    : "font-medium text-white hover:bg-ink-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="flex items-center gap-3 pt-3 border-t border-ink-border mt-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 h-[40px] flex items-center justify-center rounded-[8px] border-[1.5px] border-cyan-500 text-cyan-500 text-[14px] font-semibold transition-colors hover:bg-cyan-500/10"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="flex-1 h-[40px] flex items-center justify-center rounded-[8px] bg-cyan-500 hover:bg-[#1695bf] text-on-brand text-[14px] font-semibold transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
