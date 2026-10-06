import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "ICpEP.SE CIT-U Organization Portal",
  description:
    "Official portal for the Institute of Computer Engineers of the Philippines - CIT-U Student Chapter. Events, announcements, memberships, and community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased bg-[#f8f8f7] text-[#1b1613]">
        <NavBar />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {children}
        </main>
        
        {/* Organization Portal Footer */}
        <footer className="mt-auto border-t border-[#e0dedb] bg-[#1b1613] text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Org Details */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-[#1ca7e0] text-[#1b1613] font-bold text-xs">
                    SE
                  </div>
                  <span className="font-bold text-base tracking-tight">
                    ICpEP.SE CIT-U Chapter
                  </span>
                </div>
                <p className="text-xs text-white/70 max-w-md leading-relaxed">
                  Institute of Computer Engineers of the Philippines – Student Edition,
                  Cebu Institute of Technology - University Chapter. Molding globally competitive,
                  ethical, and innovative Computer Engineers.
                </p>
                <p className="text-xs text-white/50">
                  CPEPE361 / SD – H3 · Academic Year 2026–2027
                </p>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1ca7e0]">
                  Quick Links
                </h4>
                <ul className="space-y-1.5 text-xs text-white/75">
                  <li><Link href="/" className="hover:text-white transition-colors">Home Portal</Link></li>
                  <li><Link href="/events" className="hover:text-white transition-colors">Upcoming Events</Link></li>
                  <li><Link href="/news" className="hover:text-white transition-colors">News & Updates</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">About & Officers</Link></li>
                </ul>
              </div>

              {/* Student Chapter Info */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1ca7e0]">
                  Contact & Campus
                </h4>
                <div className="text-xs text-white/75 space-y-1">
                  <p>CEA Building, CIT-U Campus</p>
                  <p>N. Bacalso Ave, Cebu City</p>
                  <p className="text-[#1ca7e0] font-mono">icpep.se@cit.edu</p>
                  <a
                    href="https://www.facebook.com/ICpEP.SE.CITU"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-xs text-white/60 hover:text-[#1ca7e0] underline"
                  >
                    Official Facebook Page ↗
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
              <p>© 2026 ICpEP.SE CIT-U Chapter. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <span>Cebu Institute of Technology - University</span>
                <span>•</span>
                <span>Department of Computer Engineering</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
