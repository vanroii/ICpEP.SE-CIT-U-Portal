import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
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

  const defaultOfficers = [
    {
      first_name: "Jovan Roilan",
      last_name: "Pogoy",
      position_title: "Chapter President & Project Manager",
      school_year: "2026-2027",
    },
    {
      first_name: "John Norbert",
      last_name: "Tamares",
      position_title: "Vice President - Technical & DBA",
      school_year: "2026-2027",
    },
    {
      first_name: "Edrianne",
      last_name: "Babatuan",
      position_title: "Vice President - Creatives & UI/UX",
      school_year: "2026-2027",
    },
    {
      first_name: "Maria Angelica",
      last_name: "Santos",
      position_title: "Secretary-General",
      school_year: "2026-2027",
    },
    {
      first_name: "Carlos Miguel",
      last_name: "Tan",
      position_title: "Finance & Logistics Officer",
      school_year: "2026-2027",
    },
    {
      first_name: "Beatriz",
      last_name: "Fernandez",
      position_title: "Auditor & Membership Coordinator",
      school_year: "2026-2027",
    },
  ];

  const displayOfficers = officers.length > 0 ? officers : defaultOfficers;

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
    <div className="space-y-16">
      {/* Header Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#1b1613] via-[#241e1b] to-[#0a7db0] px-6 py-12 sm:px-12 sm:py-16 text-white shadow-lg space-y-4">
        <Badge tone="info" className="bg-[#1ca7e0]/20 text-[#1ca7e0] border-transparent font-bold">
          About Our Chapter
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Institute of Computer Engineers of the Philippines
        </h1>
        <p className="text-sm sm:text-base text-white/80 max-w-3xl leading-relaxed">
          Cebu Institute of Technology - University Student Edition (CIT-U Chapter)
        </p>
      </section>

      {/* Chapter Overview & Mission / Vision */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 rounded-2xl border border-[#e0dedb] bg-white p-8">
          <div className="flex items-center gap-2.5 text-[#0a7db0]">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-xl font-bold text-[#1b1613]">Organization Background</h2>
          </div>
          <p className="text-sm text-[#45403d] leading-relaxed">
            {aboutText}
          </p>
          <div className="pt-4 border-t border-[#f0eeeb] grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="block text-xl font-extrabold text-[#0a7db0]">500+</span>
              <span className="text-xs text-[#8c8785]">CpE Undergraduates</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-[#0a7db0]">100%</span>
              <span className="text-xs text-[#8c8785]">Accredited Programs</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-[#0a7db0]">15+</span>
              <span className="text-xs text-[#8c8785]">Annual Tech Events</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e0dedb] bg-white p-6 space-y-2">
            <div className="flex items-center gap-2 text-[#0a7db0]">
              <Shield className="w-4 h-4" />
              <h3 className="font-bold text-sm text-[#1b1613] uppercase tracking-wide">Our Mission</h3>
            </div>
            <p className="text-xs text-[#45403d] leading-relaxed">
              {mission}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e0dedb] bg-white p-6 space-y-2">
            <div className="flex items-center gap-2 text-[#0a7db0]">
              <Globe className="w-4 h-4" />
              <h3 className="font-bold text-sm text-[#1b1613] uppercase tracking-wide">Our Vision</h3>
            </div>
            <p className="text-xs text-[#45403d] leading-relaxed">
              {vision}
            </p>
          </div>
        </div>
      </section>

      {/* Chapter Officers Roster (FR-02) */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-[#1b1613] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0a7db0]" />
            Executive Board & Officers (AY 2026–2027)
          </h2>
          <p className="text-xs sm:text-sm text-[#8c8785]">
            Elected and appointed student leaders directing chapter programs and student representation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {displayOfficers.map((o, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 rounded-2xl border border-[#e0dedb] bg-white p-5 hover-lift"
            >
              <Avatar
                name={`${o.first_name} ${o.last_name}`}
                size="md"
                src={o.avatar_url}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-sm font-bold text-[#1b1613] truncate">
                  {o.first_name} {o.last_name}
                </h3>
                <p className="text-xs font-medium text-[#0a7db0] truncate">
                  {o.position_title}
                </p>
                <p className="text-[11px] text-[#8c8785]">
                  AY {o.school_year || "2026-2027"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Faculty Advisers & Oversight (BR-09) */}
      <section className="rounded-2xl border border-[#e0dedb] bg-white p-8 space-y-6">
        <h2 className="text-xl font-bold text-[#1b1613]">Faculty Advisers & Department Oversight</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#f8f8f7]">
            <Avatar name="Engr. Faculty Adviser" size="md" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#1b1613]">Engr. Lead Chapter Adviser</h4>
              <p className="text-xs text-[#0a7db0] font-medium">Faculty Adviser, ICpEP.SE CIT-U</p>
              <p className="text-xs text-[#8c8785]">Department of Computer Engineering, CEA</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#f8f8f7]">
            <Avatar name="Department Chair" size="md" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#1b1613]">CpE Department Chair</h4>
              <p className="text-xs text-[#0a7db0] font-medium">College of Engineering & Architecture</p>
              <p className="text-xs text-[#8c8785]">Cebu Institute of Technology - University</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Campus Info */}
      <section className="rounded-2xl border border-[#e0dedb] bg-white p-8 space-y-4">
        <h2 className="text-xl font-bold text-[#1b1613]">Chapter Headquarters & Inquiries</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e3f6fc] text-[#0a7db0] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-[#1b1613]">Campus Location</p>
              <p className="text-[#8c8785]">CIT-U CEA Building, 3rd Floor</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e3f6fc] text-[#0a7db0] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-[#1b1613]">Official Inquiries</p>
              <p className="text-[#0a7db0] font-mono">icpep.se@cit.edu</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e3f6fc] text-[#0a7db0] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-[#1b1613]">Online Community</p>
              <p className="text-[#8c8785]">facebook.com/ICpEP.SE.CITU</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
