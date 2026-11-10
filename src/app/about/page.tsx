import React from "react";
import { createClient } from "@/lib/supabase/server";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Mail, MapPin, Globe, Users, Shield, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  let officers: any[] = [];
  let settings: Record<string, string> = {};

  try {
    const supabase = await createClient();
    const [{ data: officersData }, { data: settingsData }] = await Promise.all([
      supabase.from("public_officers").select("*").order("display_order", { ascending: true }),
      supabase.from("site_settings").select("key,value"),
    ]);
    officers = officersData ?? [];
    if (settingsData) {
      settingsData.forEach((s) => {
        settings[s.key] = s.value;
      });
    }
  } catch {
    // Graceful offline fallback
  }

  const displayOfficers = officers;

  const mission =
    settings["mission"] ||
    "To foster professional growth, technical innovation, and collaborative engagement among Computer Engineering students in Cebu Institute of Technology - University through high-impact workshops, hackathons, and industry mentorship.";

  const vision =
    settings["vision"] ||
    "A premier student engineering organization molding globally competitive, ethical, and innovative Computer Engineers equipped to lead and shape the emerging technological landscape.";

  const aboutText =
    settings["about_text"] ||
    "The Institute of Computer Engineers of the Philippines – Student Edition (ICpEP.SE) CIT-U Chapter serves as the recognized academic, professional, and social body representing all BS Computer Engineering students at Cebu Institute of Technology - University. Established to advance technical excellence, our chapter organizes flagship activities including the CpE General Assembly, Technical Bootcamps, Wildcat Hackathons, and inter-collegiate technical challenges.";

  return (
    <div className="w-full bg-[#F8F8F7] min-h-screen flex flex-col justify-between">
      <PublicNavbar />

      <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-[120px] py-12 space-y-16">
        {/* Header Banner */}
        <section className="rounded-[24px] hero-gradient px-6 py-12 sm:px-12 sm:py-16 text-white space-y-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#26343B] text-[#19A7D5] text-xs font-semibold">
            About Our Chapter
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Institute of Computer Engineers of the Philippines
          </h1>
          <p className="text-sm sm:text-base text-[#D1CECB] max-w-3xl leading-relaxed">
            Cebu Institute of Technology - University Student Edition (CIT-U Chapter)
          </p>
        </section>

        {/* Chapter Overview & Mission / Vision */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 rounded-[16px] border border-[#DEDBD8] bg-white p-8">
            <div className="flex items-center gap-2.5 text-[#0087B5]">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-xl font-bold text-[#1C1713]">
                Organization Background
              </h2>
            </div>
            <p className="text-sm text-[#514B47] leading-relaxed">{aboutText}</p>
            <div className="pt-4 border-t border-[#EEECEA] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="block text-2xl font-extrabold text-[#0087B5]">
                  500+
                </span>
                <span className="text-xs text-[#817B77]">CpE Undergraduates</span>
              </div>
              <div>
                <span className="block text-2xl font-extrabold text-[#0087B5]">
                  100%
                </span>
                <span className="text-xs text-[#817B77]">Accredited Programs</span>
              </div>
              <div>
                <span className="block text-2xl font-extrabold text-[#0087B5]">
                  15+
                </span>
                <span className="text-xs text-[#817B77]">Annual Tech Events</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[16px] border border-[#DEDBD8] bg-white p-6 space-y-2">
              <div className="flex items-center gap-2 text-[#0087B5]">
                <Shield className="w-4 h-4" />
                <h3 className="font-bold text-sm text-[#1C1713] uppercase tracking-wide">
                  Our Mission
                </h3>
              </div>
              <p className="text-xs text-[#514B47] leading-relaxed">{mission}</p>
            </div>

            <div className="rounded-[16px] border border-[#DEDBD8] bg-white p-6 space-y-2">
              <div className="flex items-center gap-2 text-[#0087B5]">
                <Globe className="w-4 h-4" />
                <h3 className="font-bold text-sm text-[#1C1713] uppercase tracking-wide">
                  Our Vision
                </h3>
              </div>
              <p className="text-xs text-[#514B47] leading-relaxed">{vision}</p>
            </div>
          </div>
        </section>

        {/* Chapter Officers Roster */}
        <section id="officers" className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#1C1713] flex items-center gap-2">
              <Users className="w-6 h-6 text-[#0087B5]" />
              Executive Board & Officers (AY 2026–2027)
            </h2>
            <p className="text-xs text-[#817B77]">
              Student leaders dedicated to serving the CIT-U Computer Engineering body.
            </p>
          </div>

          {displayOfficers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayOfficers.map((officer, index) => (
                <div
                  key={index}
                  className="rounded-[16px] border border-[#DEDBD8] bg-white p-5 flex items-center gap-4 hover:border-[#19A7D5] transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#19A7D5] text-[#12191C] flex items-center justify-center font-bold text-base shrink-0">
                    {officer.first_name?.[0] || "O"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#1C1713] truncate">
                      {officer.first_name} {officer.last_name}
                    </h4>
                    <p className="text-xs text-[#0087B5] font-medium truncate">
                      {officer.position_title}
                    </p>
                    <p className="text-[11px] text-[#817B77] mt-0.5">
                      AY {officer.school_year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#DEDBD8] bg-white p-12 text-center text-[#817B77] text-sm">
              Officer directory will be updated soon.
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
