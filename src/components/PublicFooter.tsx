import React from "react";
import Link from "next/link";
import { LogoMark } from "./ui/Logo";

export function PublicFooter() {
  return (
    <footer className="w-full bg-ink-900 text-text-dark">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-12 lg:px-[120px] pt-14 pb-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <LogoMark size={40} />
              <span className="text-[20px] font-bold tracking-[-0.3px] text-white">
                ICpEP.SE CIT-U Chapter
              </span>
            </div>
            <p className="max-w-[420px] text-[13px] leading-[22px] text-text-dark">
              Institute of Computer Engineers of the Philippines — Student Edition, Cebu Institute
              of Technology – University. Molding globally competitive, ethical, and innovative
              Computer Engineers.
            </p>
            <p className="text-[12px] font-medium text-text-mute">
              CPEPE361 / SD - H3 : Academic Year 2026-2027
            </p>
          </div>

          <div className="lg:col-span-3 lg:justify-self-center">
            <h4 className="text-[12px] font-bold tracking-[1px] text-white uppercase">
              Quick Links
            </h4>
            <ul className="mt-5 space-y-3 text-[13px] text-text-dark">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home Portal
                </Link>
              </li>
              <li>
                <Link href="/events" className="transition-colors hover:text-white">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link href="/news" className="transition-colors hover:text-white">
                  News &amp; Updates
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-white">
                  About &amp; Officers
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 lg:justify-self-end">
            <h4 className="text-[12px] font-bold tracking-[1px] text-white uppercase">
              Contact &amp; Campus
            </h4>
            <ul className="mt-5 space-y-3 text-[13px] text-text-dark">
              <li>CEA Building, CIT-U Campus</li>
              <li>N. Bacalso Ave, Cebu City</li>
              <li>
                <a href="mailto:icpep.se@cit.edu" className="transition-colors hover:text-white">
                  icpep.se@cit.edu
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/cituicpep"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-500 transition-colors hover:text-cyan-400"
                >
                  Official Facebook Page
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-ink-border pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[12px] text-text-mute">
          <p>© 2026 ICpEP.SE CIT-U Chapter. All rights reserved.</p>
          <p className="sm:text-right">
            Cebu Institute of Technology - University
            <span className="mx-2 text-text-mute/70">•</span>
            Department of Computer Engineering
          </p>
        </div>
      </div>
    </footer>
  );
}