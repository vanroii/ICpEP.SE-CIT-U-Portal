import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { CreateEventModal } from "@/app/officer/CreateEventModal";
import { Search, MapPin, Clock, Calendar, Users, ArrowRight } from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const filter = resolvedParams?.filter || "all";
  const search = (resolvedParams?.q || "").toLowerCase();

  let user: any = null;
  let role: RoleCode | null = null;
  let profile: any = null;
  let events: any[] = [];
  let registeredEventIds: Set<number> = new Set();

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (user) {
      const [{ data: r }, { data: p }, { data: regs }] = await Promise.all([
        supabase.rpc("auth_role"),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("event_registrations").select("event_id").eq("user_id", user.id).eq("status", "registered"),
      ]);
      role = (r as RoleCode) ?? null;
      profile = p;
      if (regs) {
        registeredEventIds = new Set(regs.map((r: any) => Number(r.event_id)));
      }
    }

    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .order("start_at", { ascending: true });

    events = eventsData ?? [];
  } catch (err) {
    console.error("Events fetch error:", err);
  }

  // Fallback demo events if database is unseeded
  const fallbackEvents = [
    {
      id: 1,
      title: "CpE General Assembly 2026: Innovate, Integrate, Inspire",
      slug: "cpe-general-assembly-2026",
      start_at: "2026-11-20T13:00:00+08:00",
      venue: "CIT-U Auditorium & Virtual Stream",
      visibility: "public",
      status: "published",
      participant_count: 142,
      capacity: 250,
      description: "The premier gathering of all Computer Engineering students at CIT-U. Meet your officers and learn the roadmap.",
    },
    {
      id: 2,
      title: "Embedded Systems & IoT Hands-On Workshop",
      slug: "embedded-systems-iot-workshop-2026",
      start_at: "2026-11-28T09:00:00+08:00",
      venue: "CEA Building Lab 304",
      visibility: "members_only",
      status: "published",
      participant_count: 36,
      capacity: 40,
      description: "Hands-on microcontroller programming with ESP32 and FreeRTOS. Open exclusively to verified ICpEP Members.",
    },
    {
      id: 3,
      title: "Wildcat Hackathon 2026: Solutions for Tomorrow",
      slug: "wildcat-hackathon-2026",
      start_at: "2026-12-05T08:00:00+08:00",
      venue: "CIT-U Innovation Hub",
      visibility: "public",
      status: "published",
      participant_count: 88,
      capacity: 120,
      description: "Annual 24-hour hackathon challenging CpE student teams to build hardware-software integrated prototypes.",
    },
  ];

  const sourceEvents = events.length > 0 ? events : fallbackEvents;

  const filteredEvents = sourceEvents.filter((e) => {
    if (filter === "going" && !registeredEventIds.has(e.id)) return false;
    if (filter === "members_only" && e.visibility !== "members_only") return false;
    if (filter === "public" && e.visibility !== "public") return false;

    if (search) {
      const matchTitle = e.title?.toLowerCase().includes(search);
      const matchVenue = e.venue?.toLowerCase().includes(search);
      if (!matchTitle && !matchVenue) return false;
    }
    return true;
  });

  const isStaff = role === "officer" || role === "admin";
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "User";
  const roleLabel = role ? ROLE_LABELS[role] : "Student";

  const content = (
    <div className="space-y-7 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
            Events Calendar
          </h1>
          <p className="text-[15px] text-[#817B77]">
            Browse upcoming ICpEP.SE chapter events, bootcamps, and assemblies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Form */}
          <form method="get" className="relative w-[260px]">
            <input type="hidden" name="filter" value={filter} />
            <Search className="w-4 h-4 text-[#928C88] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search events..."
              className="w-full h-[42px] pl-9 pr-3 bg-white border border-[#C9C5C2] rounded-[10px] text-[14px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5]"
            />
          </form>

          {isStaff && <CreateEventModal />}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <Link
          href={`/events${search ? `?q=${encodeURIComponent(search)}` : ""}`}
          className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors flex items-center ${
            filter === "all"
              ? "bg-[#19A7D5] text-[#12191C]"
              : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
          }`}
        >
          All Upcoming ({sourceEvents.length})
        </Link>
        {user && (
          <Link
            href={`/events?filter=going${search ? `&q=${encodeURIComponent(search)}` : ""}`}
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors flex items-center ${
              filter === "going"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            My RSVPs ({registeredEventIds.size})
          </Link>
        )}
        <Link
          href={`/events?filter=members_only${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors flex items-center ${
            filter === "members_only"
              ? "bg-[#19A7D5] text-[#12191C]"
              : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
          }`}
        >
          Members Only ★
        </Link>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const startDate = new Date(evt.start_at);
            const isGoing = registeredEventIds.has(evt.id);
            const isMembersOnly = evt.visibility === "members_only";

            return (
              <div
                key={evt.slug || evt.id}
                className="bg-white border border-[#DEDBD8] rounded-[16px] overflow-hidden flex flex-col justify-between hover:border-[#19A7D5] transition-colors shadow-xs"
              >
                <div>
                  {/* Photo / Header Placeholder */}
                  <div className="h-[140px] w-full event-photo-gradient flex items-center justify-between p-4 text-white">
                    <div className="bg-white/20 backdrop-blur-xs rounded-[10px] p-2 text-center min-w-[50px]">
                      <span className="block text-[11px] font-bold uppercase tracking-wider">
                        {startDate.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="block text-[20px] font-extrabold leading-tight">
                        {startDate.getDate()}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isGoing && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">
                          Registered ✓
                        </span>
                      )}
                      {isMembersOnly && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#B45309]">
                          Members Only
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-[17px] font-bold text-[#1C1713] leading-snug">
                      <Link href={`/events/${evt.slug}`} className="hover:text-[#0087B5]">
                        {evt.title}
                      </Link>
                    </h3>

                    {evt.description && (
                      <p className="text-[13px] text-[#514B47] line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    <div className="space-y-1.5 text-[12px] text-[#817B77] pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0087B5]" />
                        <span>
                          {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#0087B5]" />
                        <span className="truncate">{evt.venue || "CIT-U Campus"}</span>
                      </div>
                      {evt.capacity && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#0087B5]" />
                          <span>
                            {evt.participant_count || 0} / {evt.capacity} registered
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/events/${evt.slug}`}
                    className="w-full h-[38px] rounded-[8px] bg-[#E3F6FC] hover:bg-[#19A7D5] text-[#0087B5] hover:text-[#12191C] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{isGoing ? "Manage Registration" : "View & Register"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-12 text-center space-y-3">
          <Calendar className="w-8 h-8 text-[#817B77] mx-auto opacity-50" />
          <h3 className="text-[17px] font-bold text-[#1C1713]">No events found</h3>
          <p className="text-[14px] text-[#817B77] max-w-sm mx-auto">
            Try adjusting your search query or switching filters.
          </p>
        </div>
      )}
    </div>
  );

  if (user) {
    return (
      <PortalShell
        activeItem="Events"
        role={role || "member"}
        userName={fullName}
        userRoleLabel={roleLabel}
      >
        {content}
      </PortalShell>
    );
  }

  return (
    <div className="w-full bg-[#F8F8F7] min-h-screen flex flex-col justify-between">
      <PublicNavbar />
      <main className="max-w-[1440px] mx-auto px-5 sm:px-12 lg:px-[120px] py-12 w-full">
        {content}
      </main>
      <PublicFooter />
    </div>
  );
}
