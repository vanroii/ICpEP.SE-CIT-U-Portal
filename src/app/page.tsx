import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ContentCard } from "@/components/ContentCard";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Calendar, BookOpen, Users, Cpu, Award, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  let events: any[] = [];
  let posts: any[] = [];

  try {
    const supabase = await createClient();
    const [{ data: eventsData }, { data: postsData }] = await Promise.all([
      supabase
        .from("events")
        .select("title,slug,start_at,venue,visibility,participant_count,capacity")
        .eq("status", "published")
        .order("start_at", { ascending: true })
        .limit(3),
      supabase
        .from("posts")
        .select("title,slug,post_type,summary,published_at,is_pinned")
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(3),
    ]);
    events = eventsData ?? [];
    posts = postsData ?? [];
  } catch {
    // If database is not yet connected
  }

  // Fallback showcase items if database table is empty or offline
  const displayEvents = events.length > 0 ? events : [
    {
      title: "CpE General Assembly 2026: Innovate, Integrate, Inspire",
      slug: "cpe-general-assembly-2026",
      start_at: "2026-10-15T13:00:00+08:00",
      venue: "CIT-U Auditorium & Virtual Stream",
      visibility: "public",
      participant_count: 142,
      capacity: 250,
    },
    {
      title: "Embedded Systems & IoT Hands-On Workshop",
      slug: "embedded-systems-iot-workshop-2026",
      start_at: "2026-10-22T09:00:00+08:00",
      venue: "CEA Building Lab 304",
      visibility: "members_only",
      participant_count: 36,
      capacity: 40,
    },
    {
      title: "Wildcat Hackathon 2026: Solutions for Tomorrow",
      slug: "wildcat-hackathon-2026",
      start_at: "2026-11-05T08:00:00+08:00",
      venue: "CIT-U Innovation Hub",
      visibility: "public",
      participant_count: 88,
      capacity: 120,
    },
  ];

  const displayPosts = posts.length > 0 ? posts : [
    {
      title: "Official Call for ICpEP.SE CIT-U Membership AY 2026–2027",
      slug: "membership-call-ay-2026-2027",
      post_type: "announcement",
      summary: "Registration and renewal for the ICpEP.SE Student Chapter are now officially open. Learn about member benefits, exclusive seminars, and technical workshops.",
      published_at: "2026-09-20T10:00:00+08:00",
    },
    {
      title: "CIT-U CpE Wildcats Secure Top Spots at National Robotics Challenge",
      slug: "cpe-wildcats-robotics-challenge-victory",
      post_type: "news",
      summary: "Our chapter delegation emerged victorious, securing 1st and 3rd runners-up in Autonomous Rover and Micro-controller Innovation categories.",
      published_at: "2026-09-15T14:30:00+08:00",
    },
    {
      title: "ICpEP.SE Student Lounge & Laboratory Access Guidelines",
      slug: "student-lounge-lab-guidelines-update",
      post_type: "update",
      summary: "Updated laboratory safety protocols, tool checkout procedures, and collaborative workspace reservations for CpE students.",
      published_at: "2026-09-10T09:15:00+08:00",
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1613] via-[#241e1b] to-[#0a4d6f] px-6 py-16 sm:px-12 sm:py-20 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1ca7e0]/40 bg-[#1ca7e0]/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-[#1ca7e0] backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#1ca7e0] animate-pulse" />
            Cebu Institute of Technology - University · Student Edition
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Institute of Computer Engineers of the Philippines
          </h1>

          <p className="text-base sm:text-lg text-white/80 leading-relaxed font-normal">
            The official portal for CIT-U Computer Engineering students. Connect with your peers,
            register for workshops, access member-exclusive competitions, and advance your engineering journey.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link href="/register">
              <Button size="md" variant="primary" className="shadow-lg font-bold">
                Join ICpEP.SE
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/events">
              <Button size="md" variant="secondary" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
                Browse Events
              </Button>
            </Link>
            <Link href="/about">
              <Button size="md" variant="ghost" className="text-white/80 hover:text-white">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative backdrop graphics */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-[#1ca7e0]/10 blur-3xl pointer-events-none" />
        <div className="absolute right-12 top-12 hidden lg:flex flex-col items-center justify-center w-56 h-56 rounded-full border-8 border-white/5 opacity-40">
          <Cpu className="w-24 h-24 text-[#1ca7e0]/60" />
        </div>
      </section>

      {/* Chapter Highlights & Pillar Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-[#e0dedb] bg-white p-6 space-y-3 hover-lift">
          <div className="w-10 h-10 rounded-xl bg-[#e3f6fc] text-[#0a7db0] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#1b1613]">Technical Enrichment</h3>
          <p className="text-xs text-[#8c8785] leading-relaxed">
            Hands-on workshops in embedded systems, robotics, FPGA architecture, and full-stack development.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e0dedb] bg-white p-6 space-y-3 hover-lift">
          <div className="w-10 h-10 rounded-xl bg-[#e6f7eb] text-[#218c54] flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#1b1613]">Competitions & Quizzes</h3>
          <p className="text-xs text-[#8c8785] leading-relaxed">
            Represent CIT-U in national CpE Challenge bowls, programming marathons, and robotics showdowns.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e0dedb] bg-white p-6 space-y-3 hover-lift">
          <div className="w-10 h-10 rounded-xl bg-[#fcf0d4] text-[#9e700a] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#1b1613]">Verified Membership</h3>
          <p className="text-xs text-[#8c8785] leading-relaxed">
            Official recognition, member discounts on merchandise, priority event registration, and certificate tracking.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e0dedb] bg-white p-6 space-y-3 hover-lift">
          <div className="w-10 h-10 rounded-xl bg-[#e3f6fc] text-[#0a7db0] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#1b1613]">Wildcat Community</h3>
          <p className="text-xs text-[#8c8785] leading-relaxed">
            Connect with senior mentors, alumni engineers, and passionate faculty advisers guiding your career.
          </p>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#1b1613] flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#0a7db0]" />
              Upcoming Events
            </h2>
            <p className="text-xs sm:text-sm text-[#8c8785]">
              Technical seminars, general assemblies, and coding workshops.
            </p>
          </div>
          <Link
            href="/events"
            className="text-xs sm:text-sm font-semibold text-[#0a7db0] hover:underline flex items-center gap-1"
          >
            View All Events
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayEvents.map((e) => (
            <ContentCard
              key={e.slug}
              title={e.title}
              href={`/events/${e.slug}`}
              category={e.visibility === "members_only" ? "Exclusive" : "Public Event"}
              isMembersOnly={e.visibility === "members_only"}
              date={new Date(e.start_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              venue={e.venue}
              participantCount={e.participant_count}
              capacity={e.capacity}
              cta="View & Register"
            />
          ))}
        </div>
      </section>

      {/* Latest News & Announcements Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#1b1613] flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#0a7db0]" />
              Latest News & Announcements
            </h2>
            <p className="text-xs sm:text-sm text-[#8c8785]">
              Stay informed on chapter activities, academic updates, and official guidelines.
            </p>
          </div>
          <Link
            href="/news"
            className="text-xs sm:text-sm font-semibold text-[#0a7db0] hover:underline flex items-center gap-1"
          >
            All Announcements
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayPosts.map((p) => (
            <article
              key={p.slug}
              className="flex flex-col justify-between rounded-2xl border border-[#e0dedb] bg-white p-6 space-y-4 hover-lift"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0a7db0] bg-[#e3f6fc] px-2.5 py-1 rounded-full">
                    {p.post_type}
                  </span>
                  <span className="text-xs text-[#8c8785]">
                    {new Date(p.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#1b1613] line-clamp-2 leading-snug">
                  {p.title}
                </h3>
                <p className="text-xs text-[#45403d] line-clamp-3 leading-relaxed">
                  {p.summary}
                </p>
              </div>

              <Link
                href={`/news/${p.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a7db0] hover:text-[#1ca7e0] transition-colors pt-2 border-t border-[#f0eeeb]"
              >
                Read Article
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
