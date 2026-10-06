import { createClient } from "@/lib/supabase/server";
import { ContentCard } from "@/components/ContentCard";
import { Calendar, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; q?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filter = resolvedSearchParams?.filter || "all";
  const query = (resolvedSearchParams?.q || "").toLowerCase();

  let events: any[] = [];

  try {
    const supabase = await createClient();
    let queryBuilder = supabase
      .from("events")
      .select("id,title,slug,start_at,venue,visibility,status,capacity,participant_count")
      .order("start_at", { ascending: true });

    if (filter === "public") {
      queryBuilder = queryBuilder.eq("visibility", "public");
    } else if (filter === "members_only") {
      queryBuilder = queryBuilder.eq("visibility", "members_only");
    }

    const { data } = await queryBuilder;
    events = data ?? [];
  } catch {
    // offline fallback
  }

  // Fallback demo dataset if database has no rows
  const fallbackEvents = [
    {
      id: 1,
      title: "CpE General Assembly 2026: Innovate, Integrate, Inspire",
      slug: "cpe-general-assembly-2026",
      start_at: "2026-10-15T13:00:00+08:00",
      venue: "CIT-U Auditorium & Virtual Stream",
      visibility: "public",
      status: "published",
      participant_count: 142,
      capacity: 250,
    },
    {
      id: 2,
      title: "Embedded Systems & IoT Hands-On Workshop",
      slug: "embedded-systems-iot-workshop-2026",
      start_at: "2026-10-22T09:00:00+08:00",
      venue: "CEA Building Lab 304",
      visibility: "members_only",
      status: "published",
      participant_count: 36,
      capacity: 40,
    },
    {
      id: 3,
      title: "Wildcat Hackathon 2026: Solutions for Tomorrow",
      slug: "wildcat-hackathon-2026",
      start_at: "2026-11-05T08:00:00+08:00",
      venue: "CIT-U Innovation Hub",
      visibility: "public",
      status: "published",
      participant_count: 88,
      capacity: 120,
    },
    {
      id: 4,
      title: "Industry Tech Talk: FPGA Acceleration & AI at the Edge",
      slug: "fpga-acceleration-ai-edge-tech-talk",
      start_at: "2026-11-18T14:00:00+08:00",
      venue: "CIT-U Multimedia Hall",
      visibility: "public",
      status: "published",
      participant_count: 45,
      capacity: 150,
    },
  ];

  const sourceEvents = events.length > 0 ? events : fallbackEvents;

  const filteredEvents = sourceEvents.filter((e) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "public" && e.visibility === "public") ||
      (filter === "members_only" && e.visibility === "members_only");

    const matchesQuery =
      !query ||
      e.title.toLowerCase().includes(query) ||
      (e.venue && e.venue.toLowerCase().includes(query));

    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1b1613] flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[#0a7db0]" />
            Chapter Events
          </h1>
          <p className="text-sm text-[#8c8785] mt-1">
            Discover upcoming assemblies, technical seminars, hackathons, and certifications.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#e0dedb]">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/events"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "all"
                ? "bg-[#1ca7e0] text-[#1b1613]"
                : "bg-[#f8f8f7] text-[#45403d] hover:bg-[#e0dedb]"
            }`}
          >
            All Events
          </a>
          <a
            href="/events?filter=public"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "public"
                ? "bg-[#1ca7e0] text-[#1b1613]"
                : "bg-[#f8f8f7] text-[#45403d] hover:bg-[#e0dedb]"
            }`}
          >
            Public Events
          </a>
          <a
            href="/events?filter=members_only"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "members_only"
                ? "bg-[#1ca7e0] text-[#1b1613]"
                : "bg-[#f8f8f7] text-[#45403d] hover:bg-[#e0dedb]"
            }`}
          >
            Members Only ★
          </a>
        </div>

        {/* Search input form */}
        <form method="get" className="relative min-w-[240px]">
          <input type="hidden" name="filter" value={filter} />
          <Search className="w-4 h-4 text-[#8c8785] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search events..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#e0dedb] bg-[#f8f8f7] text-[#1b1613] placeholder-[#8c8785] focus:outline-none focus:border-[#1ca7e0]"
          />
        </form>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((e) => (
            <ContentCard
              key={e.slug}
              title={e.title}
              href={`/events/${e.slug}`}
              category={e.visibility === "members_only" ? "Members Only" : "Public Event"}
              isMembersOnly={e.visibility === "members_only"}
              date={new Date(e.start_at).toLocaleDateString("en-US", {
                weekday: "short",
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
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#e0dedb] space-y-3">
          <Calendar className="w-10 h-10 text-[#8c8785] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[#1b1613]">No events found</h3>
          <p className="text-xs text-[#8c8785]">
            Try adjusting your search query or filter selection.
          </p>
        </div>
      )}
    </div>
  );
}
