import React from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { LogoLarge } from "@/components/ui/Logo";
import { Code, Users, Shield, ArrowRight } from "lucide-react";

export default function LandingHomePage() {
  const statCards = [
    { value: "1,248", label: "Verified members" },
    { value: "24", label: "Events this year" },
    { value: "12", label: "Active officers" },
    { value: "5", label: "Partner companies" },
  ];

  const featureCards = [
    {
      icon: Code,
      title: "Learn by building",
      desc: "Hands-on workshops, hackathons, and peer-led study sessions that go beyond the classroom.",
    },
    {
      icon: Users,
      title: "A community that supports you",
      desc: "Mentorship from upperclassmen, org-wide batch events, and an active student portal for every member.",
    },
    {
      icon: Shield,
      title: "Official and verified",
      desc: "Membership is checked against the official masterlist so every member gets the right access.",
    },
  ];

  const upcomingEvents: {
    date: string;
    title: string;
    meta: string;
    href: string;
  }[] = [];

  return (
    <div className="w-full bg-[#F8F8F7] flex flex-col">
      {/* 1. Public Navbar (1440x78) */}
      <PublicNavbar />

      <div className="w-full flex flex-col">
        {/* 2. Hero Section (1440x664, px-[120px] py-[88px]) */}
        <section className="w-full hero-gradient px-5 sm:px-12 lg:px-[120px] py-16 sm:py-[88px]">
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-[72px]">
            {/* Hero Copy (580px wide) */}
            <div className="flex-1 max-w-[580px] space-y-6">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-[14px] py-[7px] bg-[#26343B] rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#19A7D5] shrink-0" />
                <span className="text-[13px] font-medium text-[#D1CECB] leading-tight">
                  Institute of Computer Engineers of the Philippines — Student Edition
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[40px] sm:text-[54px] leading-[1.15] font-extrabold text-white tracking-[-1.2px]">
                Where CIT-U computer engineers learn, build, and belong.
              </h1>

              {/* Subheading */}
              <p className="text-[16px] sm:text-[18px] leading-[28px] text-[#D1CECB]">
                Join the official student organization for Computer Engineering at Cebu
                Institute of Technology – University. Workshops, competitions, and a
                community that has your back.
              </p>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/register"
                  className="h-[43px] px-[22px] flex items-center justify-center rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] active:bg-[#1383a8] text-[#12191C] text-[14px] font-semibold transition-colors"
                >
                  Register now
                </Link>
                <Link
                  href="/events"
                  className="h-[46px] px-[22px] flex items-center justify-center rounded-[8px] border-[1.5px] border-white text-white hover:bg-white/10 text-[14px] font-semibold transition-colors"
                >
                  Explore events
                </Link>
              </div>
            </div>

            {/* Hero image placeholder (488x420, bg #26343B bd #315261 r24) */}
            <div className="w-full max-w-[488px] h-[360px] sm:h-[420px] rounded-[24px] bg-[#26343B] border border-[#315261] flex items-center justify-center shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#19A7D5]/10 to-transparent pointer-events-none" />
              <LogoLarge size={160} />
            </div>
          </div>
        </section>

        {/* 3. Stats Section (1440x221, px-[120px] py-[56px]) */}
        <section className="w-full bg-[#F8F8F7] px-5 sm:px-12 lg:px-[120px] py-[56px]">
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-[#DEDBD8] rounded-[14px] p-[22px_24px] space-y-1.5"
              >
                <p className="text-[34px] leading-[40px] font-bold tracking-[-0.5px] text-[#0087B5]">
                  {stat.value}
                </p>
                <p className="text-[14px] font-medium text-[#817B77]">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. About / What We Do Section (1440x600, px-[120px] py-[96px], bg #FFFFFF) */}
        <section className="w-full bg-white px-5 sm:px-12 lg:px-[120px] py-16 sm:py-[96px]">
          <div className="max-w-[1200px] mx-auto space-y-12">
            <div className="max-w-[640px] space-y-3">
              <p className="text-[13px] font-bold tracking-[1.2px] text-[#0087B5] uppercase">
                WHAT WE DO
              </p>
              <h2 className="text-[32px] sm:text-[38px] leading-[46px] font-bold text-[#1C1713] tracking-[-0.6px]">
                Everything a CpE student needs, in one organization.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="bg-white border border-[#DEDBD8] rounded-[16px] p-[28px_28px_30px_28px] space-y-4"
                  >
                    <div className="w-[52px] h-[52px] rounded-[14px] bg-[#E3F6FC] flex items-center justify-center text-[#0087B5]">
                      <Icon className="w-[26px] h-[26px]" />
                    </div>
                    <h3 className="text-[20px] leading-[28px] font-semibold text-[#1C1713]">
                      {card.title}
                    </h3>
                    <p className="text-[15px] leading-[24px] text-[#817B77]">
                      {card.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Events / Upcoming (1440x601, px-[120px] py-[96px], bg #F8F8F7) */}
        <section className="w-full bg-[#F8F8F7] px-5 sm:px-12 lg:px-[120px] py-16 sm:py-[96px]">
          <div className="max-w-[1200px] mx-auto space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-3">
                <p className="text-[13px] font-bold tracking-[1.2px] text-[#0087B5] uppercase">
                  UPCOMING
                </p>
                <h2 className="text-[32px] sm:text-[38px] leading-[46px] font-bold text-[#1C1713] tracking-[-0.6px]">
                  Events you will not want to miss
                </h2>
              </div>
              <Link
                href="/events"
                className="text-[15px] font-semibold text-[#0087B5] hover:underline whitespace-nowrap"
              >
                View all events →
              </Link>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.title}
                    className="bg-white border border-[#DEDBD8] rounded-[14px] overflow-hidden flex flex-col"
                  >
                    {/* Event photo placeholder */}
                    <div className="h-[176px] w-full event-photo-gradient flex items-center justify-center">
                      <span className="text-[13px] font-medium text-[#E0F5FC]">
                        Event photo
                      </span>
                    </div>
                    {/* Body */}
                    <div className="p-[18px_20px_22px_20px] space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[12px] font-bold tracking-[0.6px] text-[#0087B5] uppercase">
                          {evt.date}
                        </p>
                        <h4 className="text-[18px] leading-[26px] font-semibold text-[#1C1713] mt-1">
                          {evt.title}
                        </h4>
                      </div>
                      <p className="text-[14px] leading-[20px] text-[#817B77] pt-1">
                        {evt.meta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#DEDBD8] rounded-[14px] p-12 text-center space-y-3">
                <p className="text-[16px] font-semibold text-[#1C1713]">
                  No upcoming events scheduled
                </p>
                <p className="text-[14px] text-[#817B77] max-w-md mx-auto">
                  Stay tuned! New chapter activities, workshops, and general assemblies will appear here once announced.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 6. CTA Section (1440x354, px-[120px] py-[88px], bg #FFFFFF) */}
        <section className="w-full bg-white px-5 sm:px-12 lg:px-[120px] py-16 sm:py-[88px]">
          <div className="max-w-[1200px] mx-auto hero-gradient rounded-[24px] p-8 sm:p-[52px_56px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-[640px]">
              <h3 className="text-[26px] sm:text-[32px] leading-[40px] font-bold text-white tracking-[-0.4px]">
                Register and join the ICpEP portal.
              </h3>
              <p className="text-[15px] sm:text-[16px] leading-[24px] text-[#D1CECB]">
                Link your student ID to unlock member privileges, announcements, and events.
              </p>
            </div>
            <Link
              href="/register"
              className="h-[43px] px-[22px] flex items-center justify-center rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] text-[14px] font-semibold transition-colors shrink-0"
            >
              Register
            </Link>
          </div>
        </section>
      </div>

      {/* 7. Footer (1440x398) */}
      <PublicFooter />
    </div>
  );
}
