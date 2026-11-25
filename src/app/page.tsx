import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { LogoLarge } from "@/components/ui/Logo";
import { Code, Users, Shield, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingHomePage() {
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

  let events: any[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("title,slug,start_at,venue,visibility,participant_count,capacity")
      .eq("status", "published")
      .order("start_at", { ascending: true })
      .limit(3);
    events = data ?? [];
  } catch {
    // offline fallback
  }

  const fallbackEvents = [
    {
      title: "CpE General Assembly 2026: Innovate, Integrate, Inspire",
      slug: "cpe-general-assembly-2026",
      start_at: "2026-11-20T13:00:00+08:00",
      venue: "CIT-U Auditorium & Virtual Stream",
      visibility: "public",
      participant_count: 142,
      capacity: 250,
    },
    {
      title: "Embedded Systems & IoT Hands-On Workshop",
      slug: "embedded-systems-iot-workshop-2026",
      start_at: "2026-11-28T09:00:00+08:00",
      venue: "CEA Building Lab 304",
      visibility: "members_only",
      participant_count: 36,
      capacity: 40,
    },
    {
      title: "Wildcat Hackathon 2026: Solutions for Tomorrow",
      slug: "wildcat-hackathon-2026",
      start_at: "2026-12-05T08:00:00+08:00",
      venue: "CIT-U Innovation Hub",
      visibility: "public",
      participant_count: 88,
      capacity: 120,
    },
  ];

  const displayEvents = events.length > 0 ? events : fallbackEvents;

  return (
    <div className="h-screen w-full overflow-y-auto bg-surface-page flex flex-col snap-y snap-mandatory scroll-smooth scroll-pt-[78px]">
      {/* 1. Public Navbar (1440x78) */}
      <PublicNavbar />

      <div className="w-full flex flex-col">
        {/* 2. Hero Section (1440x664, px-[120px] py-[88px]) */}
        <section className="relative flex w-full min-h-[calc(100vh-78px)] shrink-0 snap-start items-center overflow-hidden hero-gradient px-5 sm:px-12 lg:px-[120px] py-16 sm:py-[88px]">
          <div className="relative z-10 w-full max-w-[1200px] mx-auto">
            {/* Hero Copy (580px wide) */}
            <div className="max-w-[880px]">
              {/* Headline */}
              <h1 className="text-[40px] sm:text-[50px] leading-[1.15] font-extrabold text-white tracking-[-1.2px]">
                Institute of Computer Engineers 
                <br />
                of the Philippines
              </h1>

              {/* Subheading */}
              <p className="mt-5 max-w-[660px] text-[16px] sm:text-[18px] leading-[28px] text-text-dark">
                The official portal for CIT-U Computer Engineering students. Connect with your peers,
                register for workshops, access member-exclusive competitions, and advance your
                engineering journey.
              </p>
              {/* Actions */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/register"
                  className="h-[43px] px-[22px] flex items-center justify-center rounded-[8px] bg-cyan-500 hover:bg-[#1695bf] active:bg-[#1383a8] text-on-brand text-[14px] font-semibold transition-colors"
                >
                  Register now
                </Link>
                <Link
                  href="#events"
                  className="h-[46px] px-[22px] flex items-center justify-center rounded-[8px] border-[1.5px] border-white text-white hover:bg-white/10 text-[14px] font-semibold transition-colors"
                >
                  Explore events
                </Link>
              </div>
            </div>
          </div>

          {/* Hero emblem */}
          <div className="pointer-events-none absolute -bottom-24 -right-24 opacity-[0.55] sm:-bottom-28 sm:-right-28 lg:-bottom-32 lg:-right-32">
            <LogoLarge size={680} className="h-auto w-[380px] sm:w-[520px] lg:w-[680px]" />
          </div>
        </section>

        {/* 4. About / What We Do Section (1440x600, px-[120px] py-[96px], bg #FFFFFF) */}
        <section className="w-full min-h-[calc(100vh-78px)] shrink-0 snap-start landing-continuation-gradient px-5 sm:px-12 lg:px-[120px] py-16 sm:py-[96px]">
          <div className="max-w-[1200px] mx-auto space-y-12">
            <div className="max-w-[640px] space-y-3">
              <p className="text-[13px] font-bold tracking-[1.2px] text-cyan-600 uppercase">
                WHAT WE DO
              </p>
              <h2 className="text-[32px] sm:text-[38px] leading-[46px] font-bold text-ink-900 tracking-[-0.6px]">
                Everything a CpE student needs, in one organization.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="bg-white border border-border-default rounded-2xl p-[28px_28px_30px_28px] space-y-4"
                  >
                    <div className="w-[52px] h-[52px] rounded-[14px] bg-cyan-50 flex items-center justify-center text-cyan-600">
                      <Icon className="w-[26px] h-[26px]" />
                    </div>
                    <h3 className="text-[20px] leading-[28px] font-semibold text-ink-900">
                      {card.title}
                    </h3>
                    <p className="text-[15px] leading-[24px] text-text-500">
                      {card.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Events / Upcoming (1440x601, px-[120px] py-[96px], bg #F8F8F7) */}
        <section id="events" className="w-full min-h-[calc(100vh-78px)] shrink-0 snap-start bg-surface-page px-5 sm:px-12 lg:px-[120px] py-16 sm:py-[96px]">
          <div className="max-w-[1200px] mx-auto space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-3">
                <p className="text-[13px] font-bold tracking-[1.2px] text-cyan-600 uppercase">
                  UPCOMING
                </p>
                <h2 className="text-[32px] sm:text-[38px] leading-[46px] font-bold text-ink-900 tracking-[-0.6px]">
                  Events you will not want to miss
                </h2>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-border-default text-xs font-semibold text-ink-900 hover:border-cyan-500 hover:bg-cyan-50/40 hover:text-cyan-600 shadow-2xs transition-all whitespace-nowrap"
              >
                View all events
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {displayEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {displayEvents.map((evt) => {
                  const startDate = new Date(evt.start_at);
                  const dateStr = startDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <Link
                      key={evt.slug || evt.title}
                      href={`/events/${evt.slug}`}
                      className="bg-white border border-border-default rounded-[14px] overflow-hidden flex flex-col hover:border-cyan-500 transition-colors group"
                    >
                      {/* Event photo placeholder */}
                      <div className="h-[176px] w-full event-photo-gradient flex items-center justify-between p-4 text-white">
                        <div className="bg-white/20 backdrop-blur-xs rounded-[10px] p-2 text-center min-w-[50px]">
                          <span className="block text-[11px] font-bold uppercase tracking-wider">
                            {startDate.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="block text-[20px] font-extrabold leading-tight">
                            {startDate.getDate()}
                          </span>
                        </div>
                        {evt.visibility === "members_only" && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-status-post-officer-bg text-status-post-officer">
                            Members Only
                          </span>
                        )}
                      </div>
                      {/* Body */}
                      <div className="p-[18px_20px_22px_20px] space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-[12px] font-bold tracking-[0.6px] text-cyan-600 uppercase">
                            {dateStr} · {evt.venue || "CIT-U"}
                          </p>
                          <h4 className="text-[18px] leading-[26px] font-semibold text-ink-900 mt-1 group-hover:text-cyan-600 transition-colors">
                            {evt.title}
                          </h4>
                        </div>
                        <p className="text-[14px] leading-[20px] text-text-500 pt-1">
                          {evt.participant_count || 0} registered · {evt.capacity ? `Capacity ${evt.capacity}` : "Open admission"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-border-default rounded-[14px] p-12 text-center space-y-3">
                <p className="text-[16px] font-semibold text-ink-900">
                  No upcoming events scheduled
                </p>
                <p className="text-[14px] text-text-500 max-w-md mx-auto">
                  Stay tuned! New chapter activities, workshops, and general assemblies will appear here once announced.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 6. CTA Section (1440x354, px-[120px] py-[88px], bg #FFFFFF) */}
        <section className="w-full shrink-0 snap-start bg-white px-5 sm:px-12 lg:px-[120px] py-16 sm:py-[88px]">
          <div className="max-w-[1200px] mx-auto hero-gradient rounded-[24px] p-8 sm:p-[52px_56px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-[640px]">
              <h3 className="text-[26px] sm:text-[32px] leading-[40px] font-bold text-white tracking-[-0.4px]">
                Register and join the ICpEP portal.
              </h3>
              <p className="text-[15px] sm:text-[16px] leading-[24px] text-text-dark">
                Link your student ID to unlock member privileges, announcements, and events.
              </p>
            </div>
            <Link
              href="/register"
              className="h-[43px] px-[22px] flex items-center justify-center rounded-[8px] bg-cyan-500 hover:bg-[#1695bf] text-on-brand text-[14px] font-semibold transition-colors shrink-0"
            >
              Register
            </Link>
          </div>
        </section>
      </div>

      {/* 7. Footer (1440x398) */}
      <div className="shrink-0 snap-start">
        <PublicFooter />
      </div>
    </div>
  );
}
