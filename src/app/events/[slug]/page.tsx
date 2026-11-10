import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { EventRegisterButton } from "./EventRegisterButton";
import { Calendar, Clock, MapPin, Users, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let event: any = null;
  let user: any = null;
  let role: string | null = null;
  let isRegistered = false;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (user) {
      const { data: roleData } = await supabase.rpc("auth_role");
      role = (roleData as string | null) ?? null;
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

  const isFull = event.capacity ? event.participant_count >= event.capacity : false;
  const isDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline) < new Date()
    : false;
  const isMembersOnly = event.visibility === "members_only";

  return (
    <div className="w-full bg-[#F8F8F7] min-h-screen flex flex-col justify-between">
      <PublicNavbar />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0087B5] hover:text-[#19A7D5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>

        <div className="rounded-[16px] border border-[#DEDBD8] bg-white overflow-hidden shadow-xs">
          <div className="hero-gradient p-8 sm:p-10 text-white relative">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge tone="category" className="bg-white/20 text-white border-transparent">
                {event.visibility === "members_only" ? "Members Only" : "Public Event"}
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
                <h2 className="text-lg font-bold text-[#1C1713]">Event Overview</h2>
                <p className="text-sm text-[#514B47] leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#EEECEA]">
                <h3 className="text-sm font-bold text-[#1C1713]">Schedule & Location</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#514B47]">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-[#0087B5] mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1C1713]">Date</p>
                      <p>{new Date(event.start_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#0087B5] mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1C1713]">Time</p>
                      <p>{new Date(event.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-[#0087B5] mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1C1713]">Venue</p>
                      <p>{event.venue}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[12px] border border-[#DEDBD8] bg-[#FAF9F8] p-5 space-y-4">
                <h3 className="font-bold text-sm text-[#1C1713]">Registration</h3>
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

              <div className="rounded-[12px] bg-[#E3F6FC] p-4 text-xs text-[#0087B5] space-y-1">
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
      </main>

      <PublicFooter />
    </div>
  );
}
