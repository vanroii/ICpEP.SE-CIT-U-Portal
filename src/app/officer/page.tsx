import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CreateEventModal } from "./CreateEventModal";
import { CreatePostModal } from "./CreatePostModal";
import { ReviewApplicationModal } from "./ReviewApplicationModal";
import { updateEventStatusAction } from "./actions";
import {
  Calendar,
  BookOpen,
  Award,
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  Pin,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OfficerDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeTab = resolvedParams?.tab || "events";

  let events: any[] = [];
  let posts: any[] = [];
  let applications: any[] = [];
  let membershipReports: any[] = [];
  let eventReports: any[] = [];

  try {
    const supabase = await createClient();
    const [
      { data: eventsData },
      { data: postsData },
      { data: appsData },
      { data: memReports },
      { data: evReports },
    ] = await Promise.all([
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("posts").select("*").order("created_at", { ascending: false }),
      supabase
        .from("membership_applications")
        .select("*, applicant:applicant_id(first_name,last_name,student_number,email,program,year_level)")
        .eq("status", "pending")
        .order("submitted_at", { ascending: true }),
      supabase.from("report_membership_counts").select("*"),
      supabase.from("report_event_participation").select("*"),
    ]);

    events = eventsData ?? [];
    posts = postsData ?? [];
    applications = appsData ?? [];
    membershipReports = memReports ?? [];
    eventReports = evReports ?? [];
  } catch {
    // offline fallback
  }

  // Fallback demo items if database has not yet been seeded
  if (events.length === 0) {
    events = [
      {
        id: 1,
        title: "CpE General Assembly 2026: Innovate, Integrate, Inspire",
        slug: "cpe-general-assembly-2026",
        visibility: "public",
        status: "published",
        participant_count: 142,
        capacity: 250,
      },
      {
        id: 2,
        title: "Embedded Systems & IoT Hands-On Workshop",
        slug: "embedded-systems-iot-workshop-2026",
        visibility: "members_only",
        status: "published",
        participant_count: 36,
        capacity: 40,
      },
      {
        id: 3,
        title: "Wildcat Hackathon 2026: Solutions for Tomorrow",
        slug: "wildcat-hackathon-2026",
        visibility: "public",
        status: "draft",
        participant_count: 0,
        capacity: 120,
      },
    ];
  }

  if (posts.length === 0) {
    posts = [
      {
        id: 1,
        title: "Official Call for ICpEP.SE CIT-U Membership AY 2026–2027",
        slug: "membership-call-ay-2026-2027",
        post_type: "announcement",
        status: "published",
        is_pinned: true,
      },
      {
        id: 2,
        title: "CIT-U CpE Wildcats Secure Top Spots at National Robotics Challenge",
        slug: "cpe-wildcats-robotics-challenge-victory",
        post_type: "news",
        status: "published",
        is_pinned: false,
      },
    ];
  }

  const tabs = [
    { id: "events", label: "Manage Events", count: events.length, icon: Calendar },
    { id: "posts", label: "News & Posts", count: posts.length, icon: BookOpen },
    { id: "membership", label: "Membership Verification", count: applications.length, icon: Award },
    { id: "reports", label: "Chapter Reports", count: null, icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Officer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#1b1613] via-[#1d2633] to-[#0a7db0] text-white shadow-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black">Officer Control Center</span>
            <Badge tone="info" className="bg-[#1ca7e0]/20 text-[#1ca7e0] border-transparent font-bold">
              ICpEP Executive Board
            </Badge>
          </div>
          <p className="text-xs text-white/70">
            Publish chapter circulars, manage event logistics, verify membership submissions, and review real-time analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <CreateEventModal />
          <CreatePostModal />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-[#e0dedb] pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/officer?tab=${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? "bg-[#1ca7e0] text-[#1b1613] shadow-xs"
                  : "bg-white text-[#45403d] border border-[#e0dedb] hover:bg-[#f8f8f7]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? "bg-white/30 text-[#1b1613]" : "bg-[#f0eeeb] text-[#8c8785]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Tab 1: Manage Events */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1b1613]">Chapter Events Roster</h2>
            <CreateEventModal />
          </div>

          <div className="rounded-2xl border border-[#e0dedb] bg-white divide-y divide-[#f0eeeb] overflow-hidden">
            {events.map((e) => (
              <div key={e.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8f8f7] transition-colors">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge tone={e.status === "published" ? "success" : "neutral"} className="capitalize">
                      {e.status}
                    </Badge>
                    <Badge tone={e.visibility === "members_only" ? "warning" : "info"}>
                      {e.visibility === "members_only" ? "Members Only" : "Public"}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1b1613] truncate">{e.title}</h3>
                  <p className="text-xs text-[#8c8785]">
                    Attendance: <span className="font-semibold text-[#1b1613]">{e.participant_count}</span>
                    {e.capacity ? ` / ${e.capacity} max slots` : " (Unlimited)"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/events/${e.slug}`} className="text-xs text-[#0a7db0] font-semibold hover:underline flex items-center gap-1">
                    Public View <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>

                  {e.status === "draft" && (
                    <form action={async () => { "use server"; await updateEventStatusAction(e.id, "published"); }}>
                      <Button size="sm" variant="primary" type="submit">Publish</Button>
                    </form>
                  )}
                  {e.status === "published" && (
                    <form action={async () => { "use server"; await updateEventStatusAction(e.id, "archived"); }}>
                      <Button size="sm" variant="ghost" type="submit">Archive</Button>
                    </form>
                  )}
                  {e.status === "archived" && (
                    <form action={async () => { "use server"; await updateEventStatusAction(e.id, "published"); }}>
                      <Button size="sm" variant="secondary" type="submit">Re-publish</Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: News & Posts */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1b1613]">News & Circulars</h2>
            <CreatePostModal />
          </div>

          <div className="rounded-2xl border border-[#e0dedb] bg-white divide-y divide-[#f0eeeb] overflow-hidden">
            {posts.map((p) => (
              <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8f8f7] transition-colors">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge tone="info" className="capitalize">{p.post_type}</Badge>
                    <Badge tone={p.status === "published" ? "success" : "neutral"} className="capitalize">
                      {p.status}
                    </Badge>
                    {p.is_pinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#bf2626] bg-[#fae6e6] px-2 py-0.5 rounded-full">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1b1613] truncate">{p.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/news/${p.slug}`} className="text-xs text-[#0a7db0] font-semibold hover:underline flex items-center gap-1">
                    Read Post <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Membership Verification */}
      {activeTab === "membership" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1b1613]">Pending Membership Applications</h2>
              <p className="text-xs text-[#8c8785]">
                Review student verification requests for AY 2026–2027 (FR-07).
              </p>
            </div>
          </div>

          {applications.length > 0 ? (
            <div className="rounded-2xl border border-[#e0dedb] bg-white divide-y divide-[#f0eeeb] overflow-hidden">
              {applications.map((app) => (
                <div key={app.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8f8f7] transition-colors">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1b1613]">
                        {app.applicant?.first_name} {app.applicant?.last_name}
                      </span>
                      <Badge tone="warning">Pending Approval</Badge>
                    </div>
                    <p className="text-xs text-[#8c8785]">
                      Student No: <span className="font-mono text-[#1b1613]">{app.applicant?.student_number || "—"}</span> · Email: {app.applicant?.email}
                    </p>
                    <p className="text-xs text-[#0a7db0] font-semibold">
                      Claimed ID: {app.claimed_membership_no || "New Member (No reference)"}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <ReviewApplicationModal application={app} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#e0dedb] bg-white p-12 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-[#218c54] mx-auto opacity-70" />
              <h3 className="font-bold text-base text-[#1b1613]">All Applications Cleared</h3>
              <p className="text-xs text-[#8c8785]">
                There are currently no pending membership applications awaiting review.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Chapter Reports (SR-07) */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#1b1613]">Chapter Analytics & Oversight Reports</h2>
            <p className="text-xs text-[#8c8785]">
              Real-time rollups from database views `report_membership_counts` and `report_event_participation`.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Membership Counts View */}
            <div className="rounded-2xl border border-[#e0dedb] bg-white p-6 space-y-4">
              <h3 className="font-bold text-base text-[#1b1613] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0a7db0]" />
                Membership Enrollment by School Year
              </h3>
              <div className="space-y-2 text-xs">
                {membershipReports.length > 0 ? (
                  membershipReports.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#f0eeeb]">
                      <span>{r.school_year} ({r.status})</span>
                      <span className="font-bold text-[#0a7db0]">{r.total} members</span>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2 text-xs text-[#8c8785]">
                    <div className="flex justify-between py-2 border-b border-[#f0eeeb]">
                      <span>AY 2026–2027 (Active)</span>
                      <span className="font-bold text-[#0a7db0]">342 verified</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#f0eeeb]">
                      <span>AY 2025–2026 (Expired)</span>
                      <span className="font-bold text-[#8c8785]">289 members</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Participation View */}
            <div className="rounded-2xl border border-[#e0dedb] bg-white p-6 space-y-4">
              <h3 className="font-bold text-base text-[#1b1613] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0a7db0]" />
                Event Attendance & Capacity Ratios
              </h3>
              <div className="space-y-2 text-xs">
                {eventReports.length > 0 ? (
                  eventReports.map((r, i) => (
                    <div key={i} className="py-2 border-b border-[#f0eeeb] space-y-1">
                      <div className="flex justify-between font-bold text-[#1b1613]">
                        <span className="truncate">{r.title}</span>
                        <span>{r.registered} reg</span>
                      </div>
                      <div className="flex justify-between text-[#8c8785] text-[11px]">
                        <span>Capacity: {r.capacity || "Unlimited"}</span>
                        <span>Cancelled: {r.cancelled || 0}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2 text-xs text-[#8c8785]">
                    <div className="py-2 border-b border-[#f0eeeb] space-y-1">
                      <div className="flex justify-between font-bold text-[#1b1613]">
                        <span>CpE General Assembly 2026</span>
                        <span>142 reg</span>
                      </div>
                      <div className="flex justify-between text-[#8c8785] text-[11px]">
                        <span>Capacity: 250</span>
                        <span>Cancelled: 4</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
