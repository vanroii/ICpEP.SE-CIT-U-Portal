import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Calendar, ArrowLeft, Pin, User } from "lucide-react";

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
    notFound();
  }

  const authorName = post.profiles
    ? `${post.profiles.first_name} ${post.profiles.last_name}`
    : "ICpEP.SE Secretariat";

  return (
    <div className="w-full bg-[#F8F8F7] min-h-screen flex flex-col justify-between">
      <PublicNavbar />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0087B5] hover:text-[#19A7D5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Announcements
        </Link>

        <article className="rounded-[16px] border border-[#DEDBD8] bg-white p-6 sm:p-10 space-y-6 shadow-xs">
          <div className="space-y-3 pb-6 border-b border-[#EEECEA]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="category" className="capitalize font-semibold">
                {post.post_type}
              </Badge>
              {post.is_pinned && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9A6C00] bg-[#F7EDC8] px-2.5 py-0.5 rounded-full">
                  <Pin className="w-3 h-3" />
                  Pinned
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1713] leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#817B77]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#0087B5]" />
                <span>
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#0087B5]" />
                <span>Published by {authorName}</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-[#514B47] leading-relaxed whitespace-pre-line space-y-4 font-normal">
            {post.body}
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}
