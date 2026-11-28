import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { CreateEventModal } from "@/app/officer/CreateEventModal";
import { Search, MapPin, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";
import { EventActionsMenu } from "./EventActionsMenu";

export const dynamic = "force-dynamic";

// ── helpers ──────────────────────────────────────────────────────────────────

function categoryLabel(evt: any): string {
  if (evt.category) return evt.category;
  if (evt.visibility === "members_only") return "Workshop";
  return "Org";
}

function categoryColor(label: string): string {
  switch (label.toLowerCase()) {
    case "workshop":    return "bg-blue-100 text-blue-700";
    case "social":      return "bg-purple-100 text-purple-700";
    case "competition": return "bg-orange-100 text-orange-700";
    case "career":      return "bg-green-100 text-green-700";
    default:            return "bg-cyan-100 text-cyan-700";
  }
}

function registrationStatus(isGoing: boolean, isPending: boolean) {
  if (isGoing)   return { label: "Going",   cls: "bg-cyan-500 text-white" };
  if (isPending) return { label: "Pending", cls: "bg-white border border-border-default text-text-600" };
  return null;
}

// Build a mini-calendar for the given month/year
function buildCalendar(year: number, month: number) {
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
const DAY_LABELS  = ["S","M","T","W","T","F","S"];

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; q?: string; cm?: string; cy?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const filter = resolvedParams?.filter || "upcoming";
  const search = (resolvedParams?.q || "").toLowerCase();

  const now        = new Date();
  const calYear    = Number(resolvedParams?.cy  || now.getFullYear());
  const calMonth   = Number(resolvedParams?.cm  || now.getMonth());   // 0-indexed

  let user: any = null;
  let role: RoleCode | null = null;
  let profile: any = null;
  let events: any[] = [];
  let registeredEventIds: Set<number> = new Set();
  let pendingEventIds:    Set<number> = new Set();
  let myRegistrations:    any[]       = [];

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (user) {
      const [{ data: r }, { data: p }, { data: regs }] = await Promise.all([
        supabase.rpc("auth_role"),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("event_registrations").select("event_id, status, events(*)").eq("user_id", user.id),
      ]);
      role    = (r as RoleCode) ?? null;
      profile = p;
      if (regs) {
        regs.forEach((reg: any) => {
          if (reg.status === "registered") registeredEventIds.add(Number(reg.event_id));
          if (reg.status === "pending")    pendingEventIds.add(Number(reg.event_id));
        });
        myRegistrations = regs.filter((reg: any) =>
          reg.status === "registered" || reg.status === "pending"
        );
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

  // Fallback demo events
  const fallbackEvents = [
    {
      id: 1,
      title: "General Assembly & Orientation",
      slug: "cpe-general-assembly-2026",
      start_at: "2026-11-14T13:00:00+08:00",
      venue: "CIT-U Main Campus",
      visibility: "public",
      status: "published",
      category: "Org",
      participant_count: 142,
      capacity: 250,
      description: "The premier gathering of all Computer Engineering students at CIT-U.",
    },
    {
      id: 2,
      title: "Intro to Embedded Systems Workshop",
      slug: "embedded-systems-iot-workshop-2026",
      start_at: "2026-11-28T09:00:00+08:00",
      venue: "Engineering Lab",
      visibility: "members_only",
      status: "published",
      category: "Workshop",
      participant_count: 36,
      capacity: 40,
      description: "Hands-on microcontroller programming with ESP32 and FreeRTOS.",
    },
    {
      id: 3,
      title: "Org Night & Year-End Mixer",
      slug: "org-night-year-end-mixer-2026",
      start_at: "2026-12-05T18:00:00+08:00",
      venue: "CIT-U Main Campus",
      visibility: "public",
      status: "published",
      category: "Social",
      participant_count: 88,
      capacity: 120,
      description: "End-of-year social mixer for all ICpEP members.",
    },
    {
      id: 4,
      title: "Hackathon Kickoff",
      slug: "wildcat-hackathon-2026",
      start_at: "2026-12-12T08:00:00+08:00",
      venue: "CIT-U Main Campus",
      visibility: "public",
      status: "published",
      category: "Competition",
      participant_count: 60,
      capacity: 100,
      description: "Annual 24-hour hackathon for CpE student teams.",
    },
    {
      id: 5,
      title: "Career Talk with Industry Partners",
      slug: "career-talk-industry-2026",
      start_at: "2027-01-16T14:00:00+08:00",
      venue: "Auditorium",
      visibility: "public",
      status: "published",
      category: "Career",
      participant_count: 20,
      capacity: 80,
      description: "Connect with industry professionals and explore career opportunities.",
    },
  ];

  const sourceEvents = events.length > 0 ? events : fallbackEvents;

  // For "past events" tab use a different filter
  const isPastFilter    = filter === "past";
  const isGoingFilter   = filter === "going";
  const isUpcomingFilter = !isPastFilter && !isGoingFilter;

  const filteredEvents = sourceEvents.filter((e) => {
    const eDate = new Date(e.start_at);
    if (isPastFilter    && eDate >= now) return false;
    if (isUpcomingFilter && eDate < now)  return false;
    if (isGoingFilter   && !registeredEventIds.has(e.id) && !pendingEventIds.has(e.id)) return false;

    if (search) {
      const matchTitle = e.title?.toLowerCase().includes(search);
      const matchVenue = e.venue?.toLowerCase().includes(search);
      if (!matchTitle && !matchVenue) return false;
    }
    return true;
  });

  // Events that fall in the current calendar month (for dot markers)
  const calEventDays = new Set(
    sourceEvents
      .filter((e) => {
        const d = new Date(e.start_at);
        return d.getFullYear() === calYear && d.getMonth() === calMonth;
      })
      .map((e) => new Date(e.start_at).getDate())
  );

  // Calendar nav hrefs
  let prevMonth = calMonth - 1, prevYear = calYear;
  if (prevMonth < 0) { prevMonth = 11; prevYear--; }
  let nextMonth = calMonth + 1, nextYear = calYear;
  if (nextMonth > 11) { nextMonth = 0; nextYear++; }

  const { firstDay, daysInMonth } = buildCalendar(calYear, calMonth);

  const isStaff  = role === "officer" || role === "admin";
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "User";
  const roleLabel = role ? ROLE_LABELS[role] : "Student";

  const todayDay  = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear  = now.getFullYear();

  // "My registrations" panel events
  const myRegEvents = myRegistrations
    .slice(0, 2)
    .map((reg: any) => {
      const ev = sourceEvents.find((e: any) => e.id === Number(reg.event_id)) || reg.events;
      return { ...ev, regStatus: reg.status };
    })
    .filter(Boolean);

  const content = (
    <div className="w-full space-y-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[26px] font-bold text-ink-900 tracking-[-0.4px]">Events</h1>
          <p className="text-[14px] text-text-500 mt-0.5">
            Browse upcoming ICpEP.SE events and RSVP in one tap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <form method="get" className="relative">
            <input type="hidden" name="filter" value={filter} />
            <input type="hidden" name="cm"     value={calMonth} />
            <input type="hidden" name="cy"     value={calYear} />
            <Search className="w-4 h-4 text-text-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search events"
              className="h-9 pl-9 pr-4 w-[200px] bg-white border border-border-input rounded-[8px] text-[13px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </form>

          {isStaff && <CreateEventModal />}
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="flex gap-5 items-start">

        {/* ── LEFT: event list ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-4">
            {[
              { key: "upcoming",    label: "Upcoming" },
              { key: "going",       label: "Going" },
              { key: "past",        label: "Past events" },
            ].map(({ key, label }) => (
              <Link
                key={key}
                href={`/events?filter=${key}${search ? `&q=${encodeURIComponent(search)}` : ""}&cm=${calMonth}&cy=${calYear}`}
                className={`h-[30px] px-3.5 rounded-full text-[13px] font-medium transition-colors flex items-center ${
                  filter === key
                    ? "bg-cyan-500 text-white"
                    : "bg-white border border-border-default text-text-600 hover:text-ink-900"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Event list card */}
          <div className="bg-white border border-border-default rounded-2xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-divider">
              <h2 className="text-[15px] font-semibold text-ink-900">
                {isUpcomingFilter ? "Upcoming events" : isPastFilter ? "Past events" : "My going events"}
              </h2>
              {filteredEvents.length > 0 && (
                <span className="text-[13px] font-semibold text-cyan-600">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {filteredEvents.length > 0 ? (
              <ul className="divide-y divide-divider">
                {filteredEvents.map((evt) => {
                  const startDate  = new Date(evt.start_at);
                  const isGoing    = registeredEventIds.has(evt.id);
                  const isPending  = pendingEventIds.has(evt.id);
                  const cat        = categoryLabel(evt);
                  const catCls     = categoryColor(cat);
                  const statusBadge = registrationStatus(isGoing, isPending);

                  const monthAbbr = startDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                  const dayNum    = startDate.getDate();
                  const timeStr   = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

                  return (
                    <li key={evt.slug || evt.id} className="relative">
                      <div className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50 transition-colors group">
                        {/* Clickable area: date badge + info */}
                        <Link href={`/events/${evt.slug}`} className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Date badge */}
                          <div className="flex-shrink-0 w-[52px] text-center">
                            <div className="text-[11px] font-bold text-cyan-600 uppercase tracking-wide leading-none">
                              {monthAbbr}
                            </div>
                            <div className="text-[26px] font-extrabold text-cyan-500 leading-tight">
                              {dayNum}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[14px] font-semibold text-ink-900 truncate group-hover:text-cyan-600 transition-colors">
                                {evt.title}
                              </span>
                              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${catCls}`}>
                                {cat}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[12px] text-text-500">
                              {evt.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {evt.venue}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeStr}
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* RSVP / status badge + officer actions */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {statusBadge ? (
                            <span className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                          ) : (
                            <Link
                              href={`/events/${evt.slug}`}
                              className="px-3 py-1.5 rounded-[6px] text-[12px] font-semibold bg-white border border-cyan-500 text-cyan-600 hover:bg-cyan-500 hover:text-white transition-colors"
                            >
                              RSVP
                            </Link>
                          )}
                          {/* Officer/Admin edit+delete menu */}
                          {isStaff && <EventActionsMenu event={evt} />}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-14 text-center space-y-2">
                <Calendar className="w-8 h-8 text-text-400 mx-auto opacity-40" />
                <p className="text-[14px] font-semibold text-ink-900">No events found</p>
                <p className="text-[13px] text-text-500">
                  Try adjusting your search or switching filters.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: sidebar ───────────────────────────────────────────── */}
        <div className="w-[280px] flex-shrink-0 space-y-4">

          {/* Calendar */}
          <div className="bg-white border border-border-default rounded-2xl p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-bold text-ink-900">
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <div className="flex items-center gap-1">
                <Link
                  href={`/events?filter=${filter}&cm=${prevMonth}&cy=${prevYear}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-100 text-text-500 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <Link
                  href={`/events?filter=${filter}&cm=${nextMonth}&cy=${nextYear}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-100 text-text-500 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="text-center text-[11px] font-semibold text-text-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const isToday  = day === todayDay && calMonth === todayMonth && calYear === todayYear;
                const hasEvent = calEventDays.has(day);
                return (
                  <div key={day} className="flex flex-col items-center py-0.5">
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-[12px] font-medium transition-colors ${
                        isToday
                          ? "bg-cyan-500 text-white font-bold"
                          : "text-text-600 hover:bg-surface-100"
                      }`}
                    >
                      {day}
                    </span>
                    {hasEvent && (
                      <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-4 text-[12px] text-text-500">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              Event day
            </div>
          </div>

          {/* My Registrations */}
          {user && (
            <div className="bg-white border border-border-default rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-bold text-ink-900">My registrations</span>
                {(registeredEventIds.size + pendingEventIds.size) > 0 && (
                  <span className="text-[12px] font-semibold text-cyan-600">
                    {registeredEventIds.size + pendingEventIds.size} event{registeredEventIds.size + pendingEventIds.size !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {myRegEvents.length > 0 ? (
                <div className="space-y-3">
                  {myRegEvents.map((reg: any, i: number) => {
                    if (!reg) return null;
                    const d  = new Date(reg.start_at);
                    const dt = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
                    const isReg = reg.regStatus === "registered";
                    return (
                      <Link
                        key={i}
                        href={`/events/${reg.slug}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <div className="text-[12px] font-semibold text-ink-900 leading-snug mb-1">
                          {reg.title}
                        </div>
                        <div className="text-[11px] text-text-500 mb-1.5">{dt}</div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isReg
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {isReg ? "● Registered" : "● Pending"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[12px] text-text-500 leading-relaxed">
                  You will get a confirmation notification after you register for an event.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
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
    <div className="w-full bg-surface-page min-h-screen flex flex-col justify-between">
      <PublicNavbar />
      <main className="max-w-[1440px] mx-auto px-5 sm:px-12 lg:px-[120px] py-12 w-full">
        {content}
      </main>
      <PublicFooter />
    </div>
  );
}
