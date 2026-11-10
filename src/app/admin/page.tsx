"use client";

import React, { useState, Suspense } from "react";
import { PortalShell } from "@/components/PortalShell";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  Upload,
  Users,
  Shield,
  FileText,
  Calendar,
  Plus,
  Bell,
  ChevronRight,
  ChevronDown,
  Download,
  AlertCircle,
  Check,
} from "lucide-react";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center text-[#514B47] text-sm font-medium">
          Loading Admin Portal...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "dashboard";

  // Verifications selection state
  const [selectedVerification, setSelectedVerification] = useState(3); // Go, Miguel R.
  const [verificationFilter, setVerificationFilter] = useState("pending");

  // Masterlist filter state
  const [masterlistFilter, setMasterlistFilter] = useState("All");
  const [masterlistSearch, setMasterlistSearch] = useState("");

  // Members filter state
  const [memberSearch, setMemberSearch] = useState("");

  const setTab = (newTab: string) => {
    if (newTab === "dashboard") router.push("/admin");
    else router.push(`/admin?tab=${newTab}`);
  };

  return (
    <PortalShell activeItem={getTabTitle(tab)} role="admin">
      {tab === "dashboard" && <AdminDashboardView onNavigateTab={setTab} />}
      {tab === "masterlist" && <AdminMasterlistView />}
      {tab === "verifications" && (
        <AdminVerificationsView
          selectedId={selectedVerification}
          onSelect={setSelectedVerification}
        />
      )}
      {tab === "events" && <AdminEventsView />}
      {tab === "members" && <AdminMembersView />}
    </PortalShell>
  );
}

function getTabTitle(tab: string) {
  switch (tab) {
    case "masterlist":
      return "Masterlist";
    case "verifications":
      return "Verifications";
    case "events":
      return "Events";
    case "members":
      return "Members";
    default:
      return "Dashboard";
  }
}

/* =========================================================================
   1. Admin Dashboard View (§10.1)
   ========================================================================= */
function AdminDashboardView({ onNavigateTab }: { onNavigateTab: (tab: string) => void }) {
  const statCards = [
    { value: "1,248", label: "Verified members" },
    { value: "37", label: "New registrations this week" },
    { value: "172", label: "Pending verifications" },
    { value: "3", label: "Upcoming events" },
  ];

  const monthBars = [
    { name: "Nov", val: 25 },
    { name: "Dec", val: 36 },
    { name: "Jan", val: 31 },
    { name: "Feb", val: 48 },
    { name: "Mar", val: 56 },
    { name: "Apr", val: 53 },
    { name: "May", val: 73 },
    { name: "Jun", val: 67 },
    { name: "Jul", val: 134 },
    { name: "Aug", val: 168 },
    { name: "Sep", val: 123 },
    { name: "Oct", val: 90 },
  ];

  return (
    <div className="space-y-7">
      {/* Page Header (1096x62, §10.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
            Dashboard
          </h1>
          <p className="text-[15px] text-[#817B77]">
            Overview of membership, registrations, and activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-[32px] px-3.5 bg-white border border-[#DEDBD8] rounded-full text-[13px] font-semibold text-[#817B77] flex items-center">
            Last 12 months
          </div>
          <button
            onClick={() => alert("Report exported")}
            className="h-[43px] px-[22px] rounded-[8px] border-[1.5px] border-[#0087B5] text-[#0087B5] hover:bg-[#E3F6FC] text-[14px] font-semibold transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export report</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#DEDBD8] rounded-[14px] p-[22px_24px] space-y-1.5"
          >
            <p className="text-[34px] leading-[40px] font-bold tracking-[-0.5px] text-[#0087B5]">
              {stat.value}
            </p>
            <p className="text-[14px] font-medium text-[#817B77]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row: Registrations Bar Chart (692px) + Members by Year (380px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Registrations Bar Chart */}
        <div className="lg:col-span-8 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-semibold text-[#1C1713]">
              Registrations per month
            </h3>
            <span className="text-[14px] font-semibold text-[#0087B5]">
              2025–2026
            </span>
          </div>

          <div className="h-[220px] border-b border-[#DEDBD8] flex items-end justify-between px-2 pb-2">
            {monthBars.map((b) => (
              <div key={b.name} className="flex flex-col items-center gap-2 group w-[30px]">
                <div
                  style={{ height: `${b.val}px` }}
                  className="w-[30px] bg-[#19A7D5] rounded-t-[6px] group-hover:bg-[#1695bf] transition-all"
                />
                <span className="text-[11px] font-medium text-[#817B77]">
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Members by Year Level */}
        <div className="lg:col-span-4 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
          <h3 className="text-[18px] font-semibold text-[#1C1713]">
            Members by year level
          </h3>

          <div className="space-y-4">
            {[
              { year: "1st year", count: "214", pct: "54%" },
              { year: "2nd year", count: "342", pct: "86%" },
              { year: "3rd year", count: "396", pct: "100%" },
              { year: "4th year", count: "296", pct: "75%" },
            ].map((y) => (
              <div key={y.year} className="space-y-2">
                <div className="flex justify-between text-[14px]">
                  <span className="font-medium text-[#3D3733]">{y.year}</span>
                  <span className="font-semibold text-[#1C1713]">{y.count}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#DEDBD8] overflow-hidden">
                  <div
                    className="h-full bg-[#19A7D5] rounded-full"
                    style={{ width: y.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Row: Recent Activity (692px) + Quick Actions (380px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Activity */}
        <div className="lg:col-span-8 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-semibold text-[#1C1713]">
              Recent activity
            </h3>
            <button className="text-[14px] font-semibold text-[#0087B5] hover:underline">
              View all
            </button>
          </div>

          <div className="py-8 text-center space-y-1">
            <p className="text-[14px] font-medium text-[#1C1713]">
              No recent activity
            </p>
            <p className="text-[12px] text-[#817B77]">
              New registrations and administrative actions will appear here.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-3">
          <h3 className="text-[18px] font-semibold text-[#1C1713]">
            Quick actions
          </h3>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab("masterlist")}
              className="w-full h-[42px] px-3 rounded-[12px] bg-[#F8F8F7] hover:bg-[#F2F1F0] flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Upload className="w-[18px] h-[18px] text-[#1C1713]" />
                <span className="text-[14px] font-semibold text-[#1C1713]">
                  Import masterlist
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#817B77]" />
            </button>

            <button
              onClick={() => onNavigateTab("verifications")}
              className="w-full h-[42px] px-3 rounded-[12px] bg-[#F8F8F7] hover:bg-[#F2F1F0] flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-[18px] h-[18px] text-[#1C1713]" />
                <span className="text-[14px] font-semibold text-[#1C1713]">
                  Review verifications
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#817B77]" />
            </button>

            <button
              onClick={() => onNavigateTab("events")}
              className="w-full h-[42px] px-3 rounded-[12px] bg-[#F8F8F7] hover:bg-[#F2F1F0] flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-[18px] h-[18px] text-[#1C1713]" />
                <span className="text-[14px] font-semibold text-[#1C1713]">
                  Create event
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#817B77]" />
            </button>

            <button
              onClick={() => alert("Post announcement modal")}
              className="w-full h-[42px] px-3 rounded-[12px] bg-[#F8F8F7] hover:bg-[#F2F1F0] flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-[18px] h-[18px] text-[#1C1713]" />
                <span className="text-[14px] font-semibold text-[#1C1713]">
                  Post announcement
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#817B77]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. Admin Masterlist View (§10.2)
   ========================================================================= */
function AdminMasterlistView() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const statCards = [
    { value: "0", label: "In masterlist" },
    { value: "0", label: "Verified" },
    { value: "0", label: "Pending" },
    { value: "0", label: "Unmatched accounts" },
  ];

  const students: Array<{
    id: string;
    name: string;
    section: string;
    username: string;
    status: "verified" | "pending";
    verifiedOn: string;
  }> = [];

  const filtered = students.filter((s) => {
    if (filter === "Verified" && s.status !== "verified") return false;
    if (filter === "Pending" && s.status !== "pending") return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.id.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-7">
      {/* Header (1096x62, §10.2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
            Masterlist & verification
          </h1>
          <p className="text-[15px] text-[#817B77]">
            Import the official student list and track student account verifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("CSV exported")}
            className="h-[43px] px-[22px] rounded-[8px] border-[1.5px] border-[#0087B5] text-[#0087B5] hover:bg-[#E3F6FC] text-[14px] font-semibold transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => alert("Upload dialog opened")}
            className="h-[43px] px-[22px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] text-[14px] font-semibold transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import masterlist</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#DEDBD8] rounded-[14px] p-[22px_24px] space-y-1.5"
          >
            <p className="text-[34px] leading-[40px] font-bold tracking-[-0.5px] text-[#0087B5]">
              {stat.value}
            </p>
            <p className="text-[14px] font-medium text-[#817B77]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress Row: Progress (672px) + Dropzone (400px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Verification Progress */}
        <div className="lg:col-span-7 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
          <h3 className="text-[18px] font-semibold text-[#1C1713]">
            Verification progress
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-[40px] font-bold text-[#0087B5] leading-none tracking-[-1px]">
              88%
            </span>
            <span className="text-[14px] text-[#817B77]">
              of the masterlist is verified
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#DEDBD8] overflow-hidden">
            <div className="h-full bg-[#19A7D5] rounded-full" style={{ width: "88%" }} />
          </div>

          <div className="flex items-center gap-6 pt-1 text-[13px] font-medium text-[#514B47]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#19A7D5]" />
              <span>Verified 1,248</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#19A7D5]" />
              <span>Pending 172</span>
            </div>
          </div>
        </div>

        {/* Dropzone Card */}
        <div className="lg:col-span-5 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-3">
          <h3 className="text-[18px] font-semibold text-[#1C1713]">
            Import masterlist
          </h3>

          <div className="w-full py-6 px-4 rounded-[12px] bg-[#FAF9F8] border-[1.5px] border-dashed border-[#C9C5C2] flex flex-col items-center justify-center text-center space-y-2 cursor-pointer hover:border-[#19A7D5] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#E3F6FC] text-[#0087B5] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-[14px] font-semibold text-[#1C1713]">
              Drop a CSV file here
            </p>
            <p className="text-[12px] text-[#817B77]">
              or browse files · .csv up to 5 MB
            </p>
          </div>

          <p className="text-[12px] text-[#817B77]">
            Existing verification links are kept when you re-import.
          </p>
        </div>
      </div>

      {/* Masterlist Students Card */}
      <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
        {/* Table controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-[18px] font-semibold text-[#1C1713]">Students</h3>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {["All", "Verified", "Pending"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`h-[30px] px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
                    filter === f
                      ? "bg-[#E3F6FC] text-[#0087B5]"
                      : "border border-[#DEDBD8] text-[#817B77]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="w-[260px] h-[38px] px-3 bg-white border border-[#C9C5C2] rounded-[10px] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#928C88] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or student ID"
                className="w-full text-[13px] text-[#1C1713] placeholder-[#928C88] bg-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#DEDBD8] rounded-[10px] overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#FAF9F8] text-[11px] font-bold text-[#817B77] tracking-[0.6px] uppercase border-b border-[#DEDBD8]">
              <tr>
                <th className="py-2.5 px-4">STUDENT ID</th>
                <th className="py-2.5 px-4">NAME</th>
                <th className="py-2.5 px-4">SECTION</th>
                <th className="py-2.5 px-4">USERNAME</th>
                <th className="py-2.5 px-4">STATUS</th>
                <th className="py-2.5 px-4">VERIFIED ON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEECEA]">
              {filtered.length > 0 ? (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF9F8]">
                    <td className="py-3.5 px-4 font-medium text-[#1C1713]">{s.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#1C1713]">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#514B47]">{s.section}</td>
                    <td className="py-3.5 px-4 text-[#514B47]">{s.username}</td>
                    <td className="py-3.5 px-4">
                      {s.status === "verified" ? (
                        <Badge tone="verified">Verified</Badge>
                      ) : (
                        <Badge tone="pending">Pending</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#514B47]">{s.verifiedOn}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#817B77]">
                    No student records found. Upload a masterlist CSV to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[13px] text-[#817B77]">
            Showing {filtered.length} students
          </span>
          <div className="flex items-center gap-2">
            <button className="h-[34px] px-3.5 rounded-[8px] border border-[#C9C5C2] text-[#0087B5] text-[13px] font-semibold">
              Previous
            </button>
            <button className="h-[32px] px-3.5 rounded-[8px] bg-[#19A7D5] text-[#12191C] text-[13px] font-semibold">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. Admin Verifications View (§10.3)
   ========================================================================= */
function AdminVerificationsView({
  selectedId,
  onSelect,
}: {
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  const [filter, setFilter] = useState("pending");

  const queue: Array<{
    id: number;
    name: string;
    studentId: string;
    username: string;
    match: "exact" | "possible" | "danger";
    time: string;
    submittedSection: string;
    masterlistSection: string;
    masterlistName: string;
  }> = [];

  const current = queue.find((q) => q.id === selectedId) || null;

  return (
    <div className="space-y-7">
      {/* Page Header (1096x62, §10.3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
            Verifications
          </h1>
          <p className="text-[15px] text-[#817B77]">
            Review registrations and match them against the masterlist.
          </p>
        </div>

        <button
          onClick={() => alert("Exact matches approved")}
          className="h-[43px] px-[22px] rounded-[8px] border-[1.5px] border-[#0087B5] text-[#0087B5] hover:bg-[#E3F6FC] text-[14px] font-semibold transition-colors flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Approve exact matches</span>
        </button>
      </div>

      {/* Filters (303x32) */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setFilter("pending")}
          className={`h-[30px] px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
            filter === "pending"
              ? "bg-[#19A7D5] text-[#12191C]"
              : "bg-white border border-[#DEDBD8] text-[#817B77]"
          }`}
        >
          Pending 172
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`h-[30px] px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
            filter === "approved"
              ? "bg-[#19A7D5] text-[#12191C]"
              : "bg-white border border-[#DEDBD8] text-[#817B77]"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`h-[30px] px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
            filter === "rejected"
              ? "bg-[#19A7D5] text-[#12191C]"
              : "bg-white border border-[#DEDBD8] text-[#817B77]"
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Content Row: Queue Table (712px) + Request Details (360px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Verification Queue */}
        <div className="lg:col-span-8 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
          <h3 className="text-[18px] font-semibold text-[#1C1713]">
            Verification queue
          </h3>

          <div className="border border-[#DEDBD8] rounded-[10px] overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#FAF9F8] text-[11px] font-bold text-[#817B77] tracking-[0.6px] uppercase border-b border-[#DEDBD8]">
                <tr>
                  <th className="py-2.5 px-4">NAME</th>
                  <th className="py-2.5 px-4">STUDENT ID</th>
                  <th className="py-2.5 px-4">USERNAME</th>
                  <th className="py-2.5 px-4">MATCH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEECEA]">
                {queue.length > 0 ? (
                  queue.map((q) => {
                    const isSelected = q.id === selectedId;
                    return (
                      <tr
                        key={q.id}
                        onClick={() => onSelect(q.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-[#E8F7FC]" : "hover:bg-[#FAF9F8]"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-semibold text-[#1C1713]">
                          {q.name}
                        </td>
                        <td className="py-3.5 px-4 text-[#514B47]">{q.studentId}</td>
                        <td className="py-3.5 px-4 text-[#514B47]">{q.username}</td>
                        <td className="py-3.5 px-4">
                          {q.match === "exact" && (
                            <Badge tone="exact">Exact match</Badge>
                          )}
                          {q.match === "possible" && (
                            <Badge tone="possible">Possible match</Badge>
                          )}
                          {q.match === "danger" && (
                            <Badge tone="danger">No match</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#817B77]">
                      No pending verification requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-[13px] text-[#817B77]">
            Showing {queue.length} pending requests
          </p>
        </div>

        {/* Request Details Comparison Card (360px, §10.3) */}
        <div className="lg:col-span-4 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
          <h3 className="text-[18px] font-semibold text-[#1C1713]">
            Request details
          </h3>

          {current ? (
            <>
              <div>
                <h4 className="text-[17px] font-bold text-[#1C1713]">
                  {current.name}
                </h4>
                <p className="text-[13px] text-[#817B77]">
                  Submitted {current.time} · Username: {current.username}
                </p>
              </div>

              <div>
                {current.match === "exact" && <Badge tone="exact">Exact match</Badge>}
                {current.match === "possible" && (
                  <Badge tone="possible">Possible match</Badge>
                )}
                {current.match === "danger" && <Badge tone="danger">No match</Badge>}
              </div>

              {/* Comparison Boxes: SUBMITTED vs MASTERLIST */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Submitted Box */}
                <div className="bg-[#FAF9F8] rounded-[12px] p-3.5 space-y-2 text-[13px]">
                  <p className="text-[11px] font-bold tracking-[0.6px] text-[#817B77] uppercase">
                    SUBMITTED
                  </p>
                  <div>
                    <span className="text-[11px] text-[#928C88] block">Name</span>
                    <span className="font-semibold text-[#9A6C00]">
                      {current.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#928C88] block">Student ID</span>
                    <span className="font-semibold text-[#1C1713]">
                      {current.studentId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#928C88] block">Section</span>
                    <span className="font-semibold text-[#9A6C00]">
                      {current.submittedSection}
                    </span>
                  </div>
                </div>

                {/* Masterlist Box */}
                <div className="bg-[#FAF9F8] rounded-[12px] p-3.5 space-y-2 text-[13px]">
                  <p className="text-[11px] font-bold tracking-[0.6px] text-[#817B77] uppercase">
                    MASTERLIST
                  </p>
                  <div>
                    <span className="text-[11px] text-[#928C88] block">Name</span>
                    <span className="font-semibold text-[#9A6C00]">
                      {current.masterlistName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#928C88] block">Student ID</span>
                    <span className="font-semibold text-[#1C1713]">
                      {current.studentId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#928C88] block">Section</span>
                    <span className="font-semibold text-[#9A6C00]">
                      {current.masterlistSection}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => alert(`Approved ${current.name}`)}
                  className="h-[32px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] text-[13px] font-semibold transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => alert(`Rejected ${current.name}`)}
                  className="h-[34px] rounded-[8px] border border-[#FCA5A5] text-[#B91C1C] hover:bg-[#FEE2E2] text-[13px] font-semibold transition-colors"
                >
                  Reject
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-[#817B77] text-sm">
              No verification request selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. Admin Events View (§10.4)
   ========================================================================= */
function AdminEventsView() {
  const [filter, setFilter] = useState("All");

  const events: Array<{
    title: string;
    date: string;
    rsvps: string;
    status: "published" | "draft" | "past";
  }> = [];

  return (
    <div className="space-y-7">
      {/* Header (1096x62, §10.4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
            Events
          </h1>
          <p className="text-[15px] text-[#817B77]">
            Create and manage ICpEP.SE events.
          </p>
        </div>

        <button
          onClick={() => alert("Create event modal")}
          className="h-[43px] px-[22px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] text-[14px] font-semibold transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create event</span>
        </button>
      </div>

      {/* Filters (295x32) */}
      <div className="flex items-center gap-2.5">
        {["All", "Published", "Drafts", "Past"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-[30px] px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
              filter === f
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content Row: Table (692px) + Create Event Card (380px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table */}
        <div className="lg:col-span-8 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
          <h3 className="text-[18px] font-semibold text-[#1C1713]">
            All events
          </h3>

          <div className="border border-[#DEDBD8] rounded-[10px] overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#FAF9F8] text-[11px] font-bold text-[#817B77] tracking-[0.6px] uppercase border-b border-[#DEDBD8]">
                <tr>
                  <th className="py-2.5 px-4">EVENT</th>
                  <th className="py-2.5 px-4">DATE</th>
                  <th className="py-2.5 px-4">RSVPS</th>
                  <th className="py-2.5 px-4">STATUS</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEECEA]">
                {events.length > 0 ? (
                  events.map((e, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF9F8]">
                      <td className="py-3.5 px-4 font-semibold text-[#1C1713]">
                        {e.title}
                      </td>
                      <td className="py-3.5 px-4 text-[#514B47]">{e.date}</td>
                      <td className="py-3.5 px-4 text-[#514B47]">{e.rsvps}</td>
                      <td className="py-3.5 px-4">
                        {e.status === "published" && (
                          <Badge tone="verified">Published</Badge>
                        )}
                        {e.status === "draft" && <Badge tone="draft">Draft</Badge>}
                        {e.status === "past" && <Badge tone="past">Past</Badge>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="text-[14px] font-semibold text-[#0087B5] hover:underline">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#817B77]">
                      No events created yet. Use the form on the right to publish your first event.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-[13px] text-[#817B77]">
            Showing {events.length} events
          </p>
        </div>

        {/* Card: Create Event (§10.4) */}
        <div className="lg:col-span-4 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
          <h3 className="text-[18px] font-semibold text-[#1C1713]">
            Create event
          </h3>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-[14px] font-semibold text-[#3D3733]">
                Event title
              </label>
              <input
                placeholder="e.g. Intro to Embedded Systems"
                className="w-full h-11 px-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none focus:border-[#19A7D5]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[14px] font-semibold text-[#3D3733]">
                  Date
                </label>
                <input
                  placeholder="Nov 28, 2026"
                  className="w-full h-11 px-3 rounded-[10px] border border-[#C9C5C2] text-sm outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[14px] font-semibold text-[#3D3733]">
                  Time
                </label>
                <input
                  placeholder="9:00 AM"
                  className="w-full h-11 px-3 rounded-[10px] border border-[#C9C5C2] text-sm outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[14px] font-semibold text-[#3D3733]">
                Venue
              </label>
              <input
                placeholder="Engineering Lab or Virtual link"
                className="w-full h-11 px-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[14px] font-semibold text-[#3D3733]">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="What members should expect…"
                className="w-full p-3 rounded-[10px] border border-[#C9C5C2] text-sm outline-none"
              />
            </div>

            {/* Cover upload */}
            <div className="py-4 rounded-[12px] bg-[#FAF9F8] border-[1.5px] border-dashed border-[#C9C5C2] flex flex-col items-center justify-center text-center space-y-1 cursor-pointer">
              <Upload className="w-5 h-5 text-[#817B77]" />
              <span className="text-[13px] font-semibold text-[#3D3733]">
                Upload cover image
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[14px] font-medium text-[#3D3733]">
                Publish immediately
              </span>
              <div className="w-11 h-6 rounded-full bg-[#C9C5C2] flex items-center px-0.5 cursor-pointer">
                <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button className="h-[34px] rounded-[8px] border border-[#C9C5C2] text-[#0087B5] text-[13px] font-semibold">
                Save draft
              </button>
              <button className="h-[32px] rounded-[8px] bg-[#19A7D5] text-[#12191C] text-[13px] font-semibold">
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   5. Admin Members View (§10.5)
   ========================================================================= */
function AdminMembersView() {
  const [search, setSearch] = useState("");

  const members: Array<{
    name: string;
    studentId: string;
    section: string;
    role: string;
    joined: string;
    status: "verified" | "pending" | "suspended";
  }> = [];

  const filtered = members.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.studentId.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-7">
      {/* Page Header (1096x62, §10.5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
            Members
          </h1>
          <p className="text-[15px] text-[#817B77]">
            Manage member roles and account status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("CSV exported")}
            className="h-[43px] px-[22px] rounded-[8px] border-[1.5px] border-[#0087B5] text-[#0087B5] hover:bg-[#E3F6FC] text-[14px] font-semibold transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => alert("Add member modal")}
            className="h-[43px] px-[22px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] text-[14px] font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add member</span>
          </button>
        </div>
      </div>

      {/* 3 Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#DEDBD8] rounded-[14px] p-[22px_24px] space-y-1.5">
          <p className="text-[34px] leading-[40px] font-bold tracking-[-0.5px] text-[#0087B5]">
            0
          </p>
          <p className="text-[14px] font-medium text-[#817B77]">Total members</p>
        </div>
        <div className="bg-white border border-[#DEDBD8] rounded-[14px] p-[22px_24px] space-y-1.5">
          <p className="text-[34px] leading-[40px] font-bold tracking-[-0.5px] text-[#0087B5]">
            0
          </p>
          <p className="text-[14px] font-medium text-[#817B77]">Officers</p>
        </div>
        <div className="bg-white border border-[#DEDBD8] rounded-[14px] p-[22px_24px] space-y-1.5">
          <p className="text-[34px] leading-[40px] font-bold tracking-[-0.5px] text-[#0087B5]">
            1
          </p>
          <p className="text-[14px] font-medium text-[#817B77]">Admins</p>
        </div>
      </div>

      {/* Members Card Table */}
      <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-[18px] font-semibold text-[#1C1713]">
            All members
          </h3>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-[240px] h-[38px] px-3 bg-white border border-[#C9C5C2] rounded-[10px] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#928C88] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members"
                className="w-full text-[13px] text-[#1C1713] placeholder-[#928C88] bg-transparent outline-none"
              />
            </div>

            <div className="h-[34px] px-3 rounded-[10px] bg-white border border-[#C9C5C2] flex items-center gap-2 text-[13px] font-medium text-[#3D3733]">
              <span>All years</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#928C88]" />
            </div>

            <div className="h-[34px] px-3 rounded-[10px] bg-white border border-[#C9C5C2] flex items-center gap-2 text-[13px] font-medium text-[#3D3733]">
              <span>All roles</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#928C88]" />
            </div>

            <div className="h-[34px] px-3 rounded-[10px] bg-white border border-[#C9C5C2] flex items-center gap-2 text-[13px] font-medium text-[#3D3733]">
              <span>All status</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#928C88]" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#DEDBD8] rounded-[10px] overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#FAF9F8] text-[11px] font-bold text-[#817B77] tracking-[0.6px] uppercase border-b border-[#DEDBD8]">
              <tr>
                <th className="py-2.5 px-4">MEMBER</th>
                <th className="py-2.5 px-4">STUDENT ID</th>
                <th className="py-2.5 px-4">SECTION</th>
                <th className="py-2.5 px-4">ROLE</th>
                <th className="py-2.5 px-4">JOINED</th>
                <th className="py-2.5 px-4">STATUS</th>
                <th className="py-2.5 px-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEECEA]">
              {filtered.length > 0 ? (
                filtered.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9F8]">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#E3F6FC] text-[#0087B5] flex items-center justify-center font-bold text-[13px] shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-[#1C1713]">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#514B47]">{m.studentId}</td>
                    <td className="py-3.5 px-4 text-[#514B47]">{m.section}</td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 h-[34px] px-2.5 bg-white border border-[#C9C5C2] rounded-[10px] text-[13px] font-medium text-[#3D3733]">
                        <span>{m.role}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#928C88]" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#514B47]">{m.joined}</td>
                    <td className="py-3.5 px-4">
                      {m.status === "verified" && (
                        <Badge tone="verified">Verified</Badge>
                      )}
                      {m.status === "pending" && (
                        <Badge tone="pending">Pending</Badge>
                      )}
                      {m.status === "suspended" && (
                        <Badge tone="danger">Suspended</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 text-[14px] font-semibold">
                        <button className="text-[#0087B5] hover:underline">
                          Edit
                        </button>
                        <button className="text-[#B91C1C] hover:underline">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#817B77]">
                    No members registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[13px] text-[#817B77]">
            Showing {filtered.length} members
          </span>
          <div className="flex items-center gap-2">
            <button className="h-[34px] px-3.5 rounded-[8px] border border-[#C9C5C2] text-[#0087B5] text-[13px] font-semibold">
              Previous
            </button>
            <button className="h-[32px] px-3.5 rounded-[8px] bg-[#19A7D5] text-[#12191C] text-[13px] font-semibold">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
