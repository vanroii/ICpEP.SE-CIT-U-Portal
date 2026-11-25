import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";
import { Calendar, ArrowLeft, Pin, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let post: any = null;
  let user: any = null;
  let role: RoleCode | null = null;
  let profile: any = null;

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

  const content = (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/news"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-border-default text-xs font-semibold text-ink-900 hover:border-cyan-500 hover:bg-cyan-50/40 hover:text-cyan-600 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Announcements
        </Link>
      </div>

      <article className="rounded-2xl border border-border-default bg-white p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="space-y-3 pb-6 border-b border-divider">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="category" className="capitalize font-semibold">
              {post.post_type}
            </Badge>
            {post.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-status-warning bg-status-warning-bg px-2.5 py-0.5 rounded-full">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-text-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-600" />
              <span>
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-cyan-600" />
              <span>Published by {authorName}</span>
            </div>
          </div>
        </div>

        {post.cover_image_url && (
          <div className="rounded-xl overflow-hidden border border-border-default max-h-96 bg-surface-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover max-h-96"
            />
          </div>
        )}

        <div className="text-sm text-text-600 leading-relaxed whitespace-pre-line space-y-4 font-normal">
          {post.body}
        </div>
      </article>
    </div>
  );

  if (user) {
    const effectiveRole: RoleCode = role ?? "non_member";
    const fullName = profile
      ? `${profile.first_name} ${profile.last_name}`
      : "User";
    const roleLabel = ROLE_LABELS[effectiveRole] || "Student";

    return (
      <PortalShell
        activeItem="Announcements"
        role={effectiveRole}
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
      <main className="w-full px-4 sm:px-6 py-8">{content}</main>
      <PublicFooter />
    </div>
  );
}
