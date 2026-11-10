"use client";

import React, { useState, Suspense } from "react";
import { PortalShell } from "@/components/PortalShell";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  ChevronDown,
  ArrowUpRight,
  TrendingUp,
  Download,
} from "lucide-react";

export default function OfficerPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center text-[#514B47] text-sm font-medium">
          Loading Officer Portal...
        </div>
      }
    >
      <OfficerContent />
    </Suspense>
  );
}

function OfficerContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "analytics";

  const statCards = [
    { value: "0", label: "ICpEP members" },
    { value: "0", label: "Events held" },
    { value: "0%", label: "Avg. participation" },
    { value: "0", label: "Pending applications" },
  ];

  const barChartData: Array<{ name: string; count: number; height: number }> = [];

  const participationRows: Array<{
    event: string;
    date: string;
    reg: string;
    att: string;
    rate: string;
  }> = [];

  const activityLogs: Array<{
    time: string;
    user: string;
    role: string;
    action: string;
  }> = [];

  return (
    <PortalShell activeItem="Analytics and Reports" role="officer">
      <div className="space-y-7">
        {/* Page Header (1096x62, §8.2) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Analytics and Reports
            </h1>
            <p className="text-[15px] text-[#817B77]">
              Overview of membership, events, and activity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Month selector */}
            <div className="h-[34px] px-3 rounded-[10px] bg-white border border-[#C9C5C2] flex items-center gap-2 text-[13px] font-medium text-[#3D3733] cursor-pointer">
              <span>October 2026</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#928C88]" />
            </div>

            {/* Export PDF Button */}
            <button
              onClick={() => alert("Report exported")}
              className="h-[43px] px-[22px] rounded-[8px] border-[1.5px] border-[#0087B5] text-[#0087B5] hover:bg-[#E3F6FC] text-[14px] font-semibold transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards Row (1096x109) */}
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

        {/* Charts Row: Bar Chart (692px) + Breakdown (380px) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Bar Chart */}
          <div className="lg:col-span-8 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#1C1713]">
                Event participation (attended)
              </h3>
              <span className="text-[14px] font-semibold text-[#0087B5]">
                Last 6 events
              </span>
            </div>

            {/* Bars */}
            <div className="h-[210px] border-b border-[#DEDBD8] flex items-end justify-between px-4 pb-2">
              {barChartData.length > 0 ? (
                barChartData.map((bar) => (
                  <div
                    key={bar.name}
                    className="flex flex-col items-center gap-2 group w-[52px]"
                  >
                    <span className="text-[12px] font-semibold text-[#817B77]">
                      {bar.count}
                    </span>
                    <div
                      style={{ height: `${bar.height}px` }}
                      className="w-[52px] bg-[#19A7D5] rounded-t-[8px] group-hover:bg-[#1695bf] transition-all"
                    />
                    <span className="text-[11px] font-medium text-[#817B77] truncate w-full text-center">
                      {bar.name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[14px] text-[#817B77]">
                  No event participation data recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Membership Breakdown */}
          <div className="lg:col-span-4 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-5">
            <h3 className="text-[18px] font-semibold text-[#1C1713]">
              Membership breakdown
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[14px]">
                  <span className="font-medium text-[#3D3733]">ICpEP members</span>
                  <span className="font-semibold text-[#1C1713]">0</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#DEDBD8] overflow-hidden">
                  <div className="h-full bg-[#19A7D5] rounded-full" style={{ width: "0%" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[14px]">
                  <span className="font-medium text-[#3D3733]">Non-members</span>
                  <span className="font-semibold text-[#1C1713]">0</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#DEDBD8] overflow-hidden">
                  <div className="h-full bg-[#19A7D5] rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
            </div>

            <p className="text-[13px] text-[#817B77] pt-2">
              0 registered CpE students in total
            </p>
          </div>
        </div>

        {/* Content Row: Participation Table (692px) + Year Level Breakdown (380px) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Table */}
          <div className="lg:col-span-8 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
            <h3 className="text-[18px] font-semibold text-[#1C1713]">
              Event participation
            </h3>

            <div className="border border-[#DEDBD8] rounded-[10px] overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-[#FAF9F8] text-[11px] font-bold text-[#817B77] tracking-[0.6px] uppercase border-b border-[#DEDBD8]">
                  <tr>
                    <th className="py-2.5 px-4">EVENT</th>
                    <th className="py-2.5 px-3">DATE</th>
                    <th className="py-2.5 px-3">REGISTERED</th>
                    <th className="py-2.5 px-3">ATTENDED</th>
                    <th className="py-2.5 px-3">RATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEECEA]">
                  {participationRows.length > 0 ? (
                    participationRows.map((r, i) => (
                      <tr key={i} className="hover:bg-[#FAF9F8]">
                        <td className="py-3 px-4 font-semibold text-[#1C1713]">
                          {r.event}
                        </td>
                        <td className="py-3 px-3 text-[#514B47]">{r.date}</td>
                        <td className="py-3 px-3 text-[#514B47]">{r.reg}</td>
                        <td className="py-3 px-3 text-[#514B47]">{r.att}</td>
                        <td className="py-3 px-3 text-[#514B47] font-medium">
                          {r.rate}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#817B77]">
                        No event participation data recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Members by Year Level */}
          <div className="lg:col-span-4 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
            <h3 className="text-[18px] font-semibold text-[#1C1713]">
              Members by year level
            </h3>

            <div className="space-y-4">
              {[
                { year: "1st year", count: "0", pct: "0%" },
                { year: "2nd year", count: "0", pct: "0%" },
                { year: "3rd year", count: "0", pct: "0%" },
                { year: "4th year", count: "0", pct: "0%" },
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

        {/* Activity Log (1096x401) */}
        <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-semibold text-[#1C1713]">
              Activity log
            </h3>
            <span className="text-[14px] font-semibold text-[#0087B5]">
              Last 7 days
            </span>
          </div>

          <div className="border border-[#DEDBD8] rounded-[10px] overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#FAF9F8] text-[11px] font-bold text-[#817B77] tracking-[0.6px] uppercase border-b border-[#DEDBD8]">
                <tr>
                  <th className="py-2.5 px-4">TIME</th>
                  <th className="py-2.5 px-4">USER</th>
                  <th className="py-2.5 px-4">ROLE</th>
                  <th className="py-2.5 px-4">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEECEA]">
                {activityLogs.length > 0 ? (
                  activityLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-[#FAF9F8]">
                      <td className="py-3.5 px-4 font-semibold text-[#1C1713] whitespace-nowrap">
                        {log.time}
                      </td>
                      <td className="py-3.5 px-4 text-[#514B47]">{log.user}</td>
                      <td className="py-3.5 px-4 text-[#514B47]">{log.role}</td>
                      <td className="py-3.5 px-4 text-[#514B47]">{log.action}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#817B77]">
                      No activity logs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
