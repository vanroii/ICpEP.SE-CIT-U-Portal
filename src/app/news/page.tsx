import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { CreatePostModal } from "@/app/officer/CreatePostModal";
import { Pin, ArrowRight, BookOpen, Clock, User, Search } from "lucide-react";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const categoryFilter = resolvedParams?.category || "all";
  const search = (resolvedParams?.q || "").toLowerCase();

  let user: any = null;
  let role: RoleCode | null = null;
  let profile: any = null;
  let posts: any[] = [];

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (user) {
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase.rpc("auth_role"),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      role = (r as RoleCode) ?? null;
      profile = p;
    }

    const { data: postsData } = await supabase
      .from("posts")
      .select("*, profiles:author_id(first_name,last_name)")
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });

    posts = postsData ?? [];
  } catch (err) {
    console.error("News fetch error:", err);
  }

  // Fallback demo posts if unseeded
  const fallbackPosts = [
    {
      id: 1,
      post_type: "announcement",
      title: "Official Call for ICpEP.SE CIT-U Membership AY 2026–2027",
      slug: "membership-call-ay-2026-2027",
      summary: "Registration and renewal for the ICpEP.SE Student Chapter are now officially open. Learn about member benefits, exclusive seminars, and technical workshops.",
      published_at: new Date().toISOString(),
      is_pinned: true,
      profiles: { first_name: "ICpEP.SE", last_name: "Officers" },
    },
    {
      id: 2,
      post_type: "news",
      title: "CIT-U CpE Wildcats Secure Top Spots at National Robotics Challenge",
      slug: "cpe-wildcats-robotics-challenge-victory",
      summary: "Our chapter delegation emerged victorious, securing 1st and 3rd runners-up in the Autonomous Rover and Microcontroller Innovation categories.",
      published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      is_pinned: false,
      profiles: { first_name: "Research", last_name: "Committee" },
    },
    {
      id: 3,
      post_type: "update",
      title: "ICpEP.SE Student Lounge & Laboratory Access Guidelines",
      slug: "student-lounge-lab-guidelines-update",
      summary: "Updated laboratory safety protocols, tool checkout procedures, and collaborative workspace reservations for CpE students.",
      published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      is_pinned: false,
      profiles: { first_name: "Laboratory", last_name: "Management" },
    },
  ];

  const sourcePosts = posts.length > 0 ? posts : fallbackPosts;

  const filteredPosts = sourcePosts.filter((p) => {
    if (categoryFilter !== "all" && p.post_type?.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (search) {
      const matchTitle = p.title?.toLowerCase().includes(search);
      const matchSummary = p.summary?.toLowerCase().includes(search);
      if (!matchTitle && !matchSummary) return false;
    }
    return true;
  });

  const isStaff = role === "officer" || role === "faculty" || role === "admin";
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "User";
  const roleLabel = role ? ROLE_LABELS[role] : "Student";

  const content = (
    <div className="space-y-7 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[30px] leading-[38px] font-bold text-ink-900 tracking-[-0.5px]">
            Announcements & News
          </h1>
          <p className="text-[15px] text-text-500">
            Official circulars, academic notices, and chapter news.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form method="get" className="relative w-[260px]">
            <input type="hidden" name="category" value={categoryFilter} />
            <Search className="w-4 h-4 text-text-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search news..."
              className="w-full h-10.5 pl-9 pr-3 bg-white border border-border-input rounded-[10px] text-[14px] text-ink-900 placeholder-text-400 outline-none focus:border-cyan-500"
            />
          </form>

          {isStaff && <CreatePostModal />}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <Link
          href={`/news${search ? `?q=${encodeURIComponent(search)}` : ""}`}
          className={`h-8 px-3.5 rounded-full text-[13px] font-semibold transition-colors flex items-center ${
            categoryFilter === "all"
              ? "bg-cyan-500 text-on-brand"
              : "bg-white border border-border-default text-text-500 hover:text-ink-900"
          }`}
        >
          All Circulars ({sourcePosts.length})
        </Link>
        <Link
          href={`/news?category=announcement${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          className={`h-8 px-3.5 rounded-full text-[13px] font-semibold transition-colors flex items-center ${
            categoryFilter === "announcement"
              ? "bg-cyan-500 text-on-brand"
              : "bg-white border border-border-default text-text-500 hover:text-ink-900"
          }`}
        >
          Announcements
        </Link>
        <Link
          href={`/news?category=news${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          className={`h-8 px-3.5 rounded-full text-[13px] font-semibold transition-colors flex items-center ${
            categoryFilter === "news"
              ? "bg-cyan-500 text-on-brand"
              : "bg-white border border-border-default text-text-500 hover:text-ink-900"
          }`}
        >
          News & Features
        </Link>
        <Link
          href={`/news?category=update${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          className={`h-8 px-3.5 rounded-full text-[13px] font-semibold transition-colors flex items-center ${
            categoryFilter === "update"
              ? "bg-cyan-500 text-on-brand"
              : "bg-white border border-border-default text-text-500 hover:text-ink-900"
          }`}
        >
          Operational Updates
        </Link>
      </div>

      {/* Posts List */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <article
              key={post.slug || post.id}
              className="bg-white border border-border-default rounded-2xl p-6 space-y-3 shadow-xs hover:border-cyan-500 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-600">
                    {post.post_type}
                  </span>
                  {post.is_pinned && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-status-warning bg-status-post-officer-bg px-2 py-0.5 rounded-full">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-text-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recently"}
                  </span>
                </div>
              </div>

              <h2 className="text-[20px] font-bold text-ink-900 leading-snug">
                <Link href={`/news/${post.slug}`} className="hover:text-cyan-600 transition-colors">
                  {post.title}
                </Link>
              </h2>

              {post.summary && (
                <p className="text-[14px] text-text-600 leading-relaxed">
                  {post.summary}
                </p>
              )}

              <div className="pt-3 border-t border-divider flex items-center justify-between text-xs">
                <span className="text-text-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  By {post.profiles ? `${post.profiles.first_name} ${post.profiles.last_name}` : "Chapter Officers"}
                </span>

                <Link
                  href={`/news/${post.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-border-default text-xs font-semibold text-ink-900 hover:border-cyan-500 hover:bg-cyan-50/40 hover:text-cyan-600 shadow-2xs transition-all"
                >
                  Read full circular <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-border-default rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-text-500 mx-auto opacity-50" />
          <h3 className="text-[17px] font-bold text-ink-900">No posts found</h3>
          <p className="text-[14px] text-text-500 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different category.
          </p>
        </div>
      )}
    </div>
  );

  if (user) {
    return (
      <PortalShell
        activeItem="Announcements"
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
