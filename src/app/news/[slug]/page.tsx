import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Calendar, ArrowLeft, Pin, User, Share2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let post: any = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select("*, profiles:author_id(first_name,last_name)")
      .eq("slug", slug)
      .maybeSingle();

    post = data;
  } catch {
    // offline fallback
  }

  if (!post) {
    if (slug === "membership-call-ay-2026-2027") {
      post = {
        title: "Official Call for ICpEP.SE CIT-U Membership AY 2026–2027",
        slug: "membership-call-ay-2026-2027",
        post_type: "announcement",
        summary:
          "Registration and renewal for the ICpEP.SE Student Chapter are now officially open. Learn about member benefits, exclusive seminars, and technical workshops.",
        body: `We are excited to invite all CIT-U Computer Engineering students to join ICpEP.SE for the Academic Year 2026–2027!

As a verified member of the Institute of Computer Engineers of the Philippines - CIT-U Student Edition, you gain exclusive access to:

1. Hands-On Technical Workshops: ESP32/IoT micro-controller bootcamps, FPGA digital logic labs, and full-stack engineering tracks.
2. Inter-School Competitions: Priority endorsement for regional and national CpE challenges, hackathons, and design contests.
3. Industry Networking: Technical talks with alumni silicon architects, software engineers, and engineering managers.
4. Membership Certification: Official national chapter ID and verified credentials.

How to Apply:
- If you have an account, visit your Student Dashboard and click "Apply for ICpEP Membership".
- If you are already a registered member from previous terms, enter your claimed membership number to expedite chapter verification.

For inquiries, contact the Membership Committee or visit the CEA 3rd Floor Student Hub.`,
        is_pinned: true,
        published_at: "2026-09-20T10:00:00+08:00",
        profiles: { first_name: "ICpEP.SE", last_name: "Executive Board" },
      };
    } else {
      notFound();
    }
  }

  const authorName = post.profiles
    ? `${post.profiles.first_name} ${post.profiles.last_name}`
    : "ICpEP.SE Secretariat";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a7db0] hover:text-[#1ca7e0] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to News & Announcements
      </Link>

      <article className="rounded-3xl border border-[#e0dedb] bg-white p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="space-y-3 pb-6 border-b border-[#f0eeeb]">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                post.post_type === "announcement"
                  ? "info"
                  : post.post_type === "news"
                  ? "success"
                  : "neutral"
              }
              className="capitalize font-semibold"
            >
              {post.post_type}
            </Badge>
            {post.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#bf2626] bg-[#fae6e6] px-2 py-0.5 rounded-full">
                <Pin className="w-3 h-3" />
                Pinned Announcement
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b1613] leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#8c8785]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#0a7db0]" />
              <span>
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#0a7db0]" />
              <span>Published by {authorName}</span>
            </div>
          </div>
        </div>

        {/* Post Body */}
        <div className="text-sm text-[#45403d] leading-relaxed whitespace-pre-line space-y-4 font-normal">
          {post.body}
        </div>
      </article>
    </div>
  );
}
