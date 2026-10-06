import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, Search, Pin, Calendar, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const category = resolvedSearchParams?.category || "all";
  const query = (resolvedSearchParams?.q || "").toLowerCase();

  let posts: any[] = [];

  try {
    const supabase = await createClient();
    let queryBuilder = supabase
      .from("posts")
      .select("id,title,slug,post_type,summary,body,is_pinned,published_at")
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });

    if (category !== "all") {
      queryBuilder = queryBuilder.eq("post_type", category);
    }

    const { data } = await queryBuilder;
    posts = data ?? [];
  } catch {
    // offline fallback
  }

  const fallbackPosts = [
    {
      id: 1,
      title: "Official Call for ICpEP.SE CIT-U Membership AY 2026–2027",
      slug: "membership-call-ay-2026-2027",
      post_type: "announcement",
      summary:
        "Registration and renewal for the ICpEP.SE Student Chapter are now officially open. Learn about member benefits, exclusive seminars, and technical workshops.",
      is_pinned: true,
      published_at: "2026-09-20T10:00:00+08:00",
    },
    {
      id: 2,
      title: "CIT-U CpE Wildcats Secure Top Spots at National Robotics Challenge",
      slug: "cpe-wildcats-robotics-challenge-victory",
      post_type: "news",
      summary:
        "Our chapter delegation emerged victorious, securing 1st and 3rd runners-up in Autonomous Rover and Micro-controller Innovation categories.",
      is_pinned: false,
      published_at: "2026-09-15T14:30:00+08:00",
    },
    {
      id: 3,
      title: "ICpEP.SE Student Lounge & Laboratory Access Guidelines",
      slug: "student-lounge-lab-guidelines-update",
      post_type: "update",
      summary:
        "Updated laboratory safety protocols, tool checkout procedures, and collaborative workspace reservations for CpE students.",
      is_pinned: false,
      published_at: "2026-09-10T09:15:00+08:00",
    },
    {
      id: 4,
      title: "CpE Peer Mentorship Program: Tutor Application Open",
      slug: "cpe-peer-mentorship-application-2026",
      post_type: "announcement",
      summary:
        "Upperclassmen students proficient in Logic Circuits, Data Structures, and Microprocessor Systems are invited to apply as student peer tutors.",
      is_pinned: false,
      published_at: "2026-09-05T11:00:00+08:00",
    },
  ];

  const sourcePosts = posts.length > 0 ? posts : fallbackPosts;

  const filteredPosts = sourcePosts.filter((p) => {
    const matchesCategory = category === "all" || p.post_type === category;
    const matchesQuery =
      !query ||
      p.title.toLowerCase().includes(query) ||
      (p.summary && p.summary.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1b1613] flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-[#0a7db0]" />
          News & Announcements
        </h1>
        <p className="text-sm text-[#8c8785] mt-1">
          Stay informed on official chapter circulars, competition victories, and academic advisories.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#e0dedb]">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "announcement", "news", "update"].map((c) => (
            <a
              key={c}
              href={c === "all" ? "/news" : `/news?category=${c}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                category === c
                  ? "bg-[#1ca7e0] text-[#1b1613]"
                  : "bg-[#f8f8f7] text-[#45403d] hover:bg-[#e0dedb]"
              }`}
            >
              {c === "all" ? "All Posts" : c}
            </a>
          ))}
        </div>

        <form method="get" className="relative min-w-[240px]">
          <input type="hidden" name="category" value={category} />
          <Search className="w-4 h-4 text-[#8c8785] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search news..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-[#e0dedb] bg-[#f8f8f7] text-[#1b1613] placeholder-[#8c8785] focus:outline-none focus:border-[#1ca7e0]"
          />
        </form>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((p) => (
          <article
            key={p.slug}
            className="rounded-2xl border border-[#e0dedb] bg-white p-6 transition-all hover:border-[#1ca7e0]/60 hover:shadow-xs space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    p.post_type === "announcement"
                      ? "info"
                      : p.post_type === "news"
                      ? "success"
                      : "neutral"
                  }
                  className="capitalize font-semibold"
                >
                  {p.post_type}
                </Badge>
                {p.is_pinned && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#bf2626] bg-[#fae6e6] px-2 py-0.5 rounded-full">
                    <Pin className="w-3 h-3" />
                    Pinned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-[#8c8785]">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(p.published_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <h2 className="text-lg font-bold text-[#1b1613] hover:text-[#0a7db0] transition-colors">
              <Link href={`/news/${p.slug}`}>{p.title}</Link>
            </h2>

            <p className="text-xs sm:text-sm text-[#45403d] leading-relaxed">
              {p.summary}
            </p>

            <div className="pt-2">
              <Link
                href={`/news/${p.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a7db0] hover:text-[#1ca7e0] transition-colors"
              >
                Read full announcement
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
