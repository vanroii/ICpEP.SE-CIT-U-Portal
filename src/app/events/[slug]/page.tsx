import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/PortalShell";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { EventRegisterButton } from "./EventRegisterButton";
import { ROLE_LABELS, type RoleCode } from "@/lib/roles";
import { Calendar, Clock, MapPin, ArrowLeft, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let event: any = null;
  let user: any = null;
  let role: RoleCode | null = null;
  let profile: any = null;
  let isRegistered = false;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (user) {
      const [{ data: roleData }, { data: p }] = await Promise.all([
        supabase.rpc("auth_role"),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      role = (roleData as RoleCode | null) ?? null;
      profile = p;
    }

    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    event = eventData;

    if (user && event) {
      const { data: regData } = await supabase
        .from("event_registrations")
        .select("status")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .eq("status", "registered")
        .maybeSingle();

      isRegistered = !!regData;
    }
  } catch {
    // offline fallback
  }

  if (!event) {
    notFound();
  }

  const isFull = event.capacity
    ? event.participant_count >= event.capacity
    : false;
  const isDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline) < new Date()
    : false;
  const isMembersOnly = event.visibility === "members_only";

  const content = (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-border-default text-xs font-semibold text-ink-900 hover:border-cyan-500 hover:bg-cyan-50/40 hover:text-cyan-600 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Events
        </Link>
      </div>

      <div className="rounded-2xl border border-border-default bg-white overflow-hidden shadow-xs">
        <div className="hero-gradient p-8 sm:p-10 text-white relative">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge
              tone="category"
              className="bg-white/20 text-white border-transparent"
            >
              {event.visibility === "members_only"
                ? "Members Only"
                : "Public Event"}
            </Badge>
            <Badge tone="verified">Open Registration</Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            {event.title}
          </h1>
        </div>

        <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-ink-900">
                Event Overview
              </h2>
              <p className="text-sm text-text-600 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-divider">
              <h3 className="text-sm font-bold text-ink-900">
                Schedule & Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-text-600">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-cyan-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-ink-900">Date</p>
                    <p>{new Date(event.start_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-cyan-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-ink-900">Time</p>
                    <p>
                      {new Date(event.start_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-cyan-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-ink-900">Venue</p>
                    <p>{event.venue}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border-default bg-surface-50 p-5 space-y-4">
              <h3 className="font-bold text-sm text-ink-900">Registration</h3>
              <EventRegisterButton
                eventId={event.id}
                slug={event.slug}
                isRegistered={isRegistered}
                isFull={isFull}
                isDeadlinePassed={isDeadlinePassed}
                isMembersOnly={isMembersOnly}
                userRole={role}
                isLoggedIn={!!user}
              />
            </div>

            <div className="rounded-xl bg-cyan-50 p-4 text-xs text-cyan-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Attendance Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Please present your CIT-U Student ID upon entrance.
              </p>
            </div>
          </div>
        </div>
      </div>
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
        activeItem="Events"
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
