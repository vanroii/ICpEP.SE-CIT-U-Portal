import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

  // Fallback demo data if offline
  if (!event) {
    if (slug === "cpe-general-assembly-2026") {
      event = {
        id: 1,
        title: "CpE General Assembly 2026: Innovate, Integrate, Inspire",
        slug: "cpe-general-assembly-2026",
        description:
          "The premier annual assembly bringing together all Computer Engineering students of Cebu Institute of Technology - University. Get informed on organizational goals, committee appointments, upcoming academic competitions, and break into specialized technical interest tracks including Embedded Systems, AI/Robotics, and Cloud Infrastructure.",
        venue: "CIT-U Auditorium & Virtual Stream",
        start_at: "2026-10-15T13:00:00+08:00",
        end_at: "2026-10-15T17:00:00+08:00",
        registration_deadline: "2026-10-14T23:59:00+08:00",
        requires_registration: true,
        capacity: 250,
        participant_count: 142,
        visibility: "public",
        status: "published",
      };
    } else if (slug === "embedded-systems-iot-workshop-2026") {
      event = {
        id: 2,
        title: "Embedded Systems & IoT Hands-On Workshop",
        slug: "embedded-systems-iot-workshop-2026",
        description:
          "An intensive hardware-software engineering workshop focused on ESP32 development, sensor interfacing, MQTT communication protocols, and real-time operating systems (FreeRTOS). Exclusive to verified ICpEP members.",
        venue: "CEA Building Lab 304",
        start_at: "2026-10-22T09:00:00+08:00",
        end_at: "2026-10-22T16:00:00+08:00",
        registration_deadline: "2026-10-20T23:59:00+08:00",
        requires_registration: true,
        capacity: 40,
        participant_count: 36,
        visibility: "members_only",
        status: "published",
      };
    } else {
      notFound();
    }
  }

  const isFull = !!event.capacity && event.participant_count >= event.capacity;
  const isDeadlinePassed =
    !!event.registration_deadline && new Date() > new Date(event.registration_deadline);
  const isMembersOnly = event.visibility === "members_only";

  const percentFull = event.capacity
    ? Math.min(100, Math.round((event.participant_count / event.capacity) * 100))
    : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a7db0] hover:text-[#1ca7e0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events Catalog
        </Link>
      </div>

      {/* Main Event Card */}
      <div className="rounded-3xl border border-[#e0dedb] bg-white overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#1ca7e0] via-[#0a7db0] to-[#1b1613] p-8 sm:p-10 text-white relative">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge tone="info" className="bg-white/20 text-white border-transparent">
              {event.visibility === "members_only" ? "Members Only" : "Public Event"}
            </Badge>
            <Badge tone="success" className="bg-[#e6f7eb]/90">
              Open Registration
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {event.title}
          </h1>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Details (Left 2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#1b1613]">Event Overview</h2>
              <p className="text-sm text-[#45403d] leading-relaxed whitespace-pre-line">
                {event.description || "No description provided for this event."}
              </p>
            </div>

            {/* Schedule & Venue Meta */}
            <div className="rounded-2xl bg-[#f8f8f7] p-5 space-y-3.5 border border-[#e0dedb]">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#0a7db0] mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#1b1613]">Date: </span>
                  <span className="text-[#45403d]">
                    {new Date(event.start_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#0a7db0] mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#1b1613]">Time: </span>
                  <span className="text-[#45403d]">
                    {new Date(event.start_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {event.end_at &&
                      ` – ${new Date(event.end_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#0a7db0] mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#1b1613]">Venue: </span>
                  <span className="text-[#45403d]">{event.venue || "To be announced"}</span>
                </div>
              </div>

              {event.registration_deadline && (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#9e700a] mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-[#1b1613]">Deadline: </span>
                    <span className="text-[#45403d]">
                      {new Date(event.registration_deadline).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Sidebar (Right 1 col) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e0dedb] p-6 space-y-5 bg-white shadow-xs">
              <h3 className="font-bold text-base text-[#1b1613] pb-3 border-b border-[#f0eeeb]">
                Registration Status
              </h3>

              {/* Capacity Progress */}
              {event.capacity ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8c8785]">Attendance Slots</span>
                    <span className="font-bold text-[#1b1613]">
                      {event.participant_count} / {event.capacity}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#f0eeeb] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentFull >= 100
                          ? "bg-[#bf2626]"
                          : percentFull >= 80
                          ? "bg-[#9e700a]"
                          : "bg-[#1ca7e0]"
                      }`}
                      style={{ width: `${percentFull}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#8c8785] text-right">
                    {event.capacity - event.participant_count > 0
                      ? `${event.capacity - event.participant_count} seats remaining`
                      : "Capacity reached"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#8c8785]">
                  <Users className="w-4 h-4 text-[#0a7db0]" />
                  <span>{event.participant_count} Registered participants</span>
                </div>
              )}

              {/* Action Button */}
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

            {/* Event Policy Reminder */}
            <div className="rounded-xl bg-[#e3f6fc]/50 p-4 border border-[#bce9f7] space-y-1.5 text-xs text-[#0a7db0]">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Attendance Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#0a7db0]/90">
                Please present your CIT-U Student ID and confirmation notification upon entrance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
