"use client";

import React, { useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { Pin, ArrowRight } from "lucide-react";

export default function AnnouncementsPage() {
  const [filter, setFilter] = useState("All");
  const [announcements, setAnnouncements] = useState<
    Array<{
      id: number;
      isPinned: boolean;
      category: string;
      categoryBg: string;
      categoryColor: string;
      time: string;
      title: string;
      body: string;
      authorInitial: string;
      authorRole: string;
    }>
  >([]);

  const categories = [
    { label: "All", count: announcements.length },
    { label: "Organization", count: announcements.filter((a) => a.category === "Organization").length },
    { label: "Academic", count: announcements.filter((a) => a.category === "Academic").length },
    { label: "Events", count: announcements.filter((a) => a.category === "Events").length },
    { label: "Membership", count: announcements.filter((a) => a.category === "Membership").length },
  ];

  const filtered = announcements.filter((a) => {
    if (filter === "All") return true;
    return a.category.toLowerCase() === filter.toLowerCase();
  });

  return (
    <PortalShell activeItem="Announcements">
      <div className="space-y-7">
        {/* Page Header (1096x62, §6.3) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Announcements
            </h1>
            <p className="text-[15px] text-[#817B77]">
              News and updates from the ICpEP.SE officers.
            </p>
          </div>

          <button
            onClick={() => alert("All notifications marked as read")}
            className="text-[14px] font-semibold text-[#0087B5] hover:underline"
          >
            Mark all as read
          </button>
        </div>

        {/* Filters (352x32 H10) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {["All", "Organization", "Academic", "Events", "Membership"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors ${
                filter === cat
                  ? "bg-[#19A7D5] text-[#12191C]"
                  : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Row (1096x884 H24) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Announcement List (752px = lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-4">
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <article
                  key={item.id}
                  className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.isPinned && <Pin className="w-3.5 h-3.5 text-[#9A6C00]" />}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${item.categoryBg} ${item.categoryColor}`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <span className="text-[13px] text-[#928C88]">{item.time}</span>
                  </div>

                  <h3 className="text-[20px] leading-[28px] font-semibold text-[#1C1713]">
                    {item.title}
                  </h3>

                  <p className="text-[15px] leading-[24px] text-[#817B77]">
                    {item.body}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#E3F6FC] text-[#0087B5] flex items-center justify-center font-bold text-[12px] shrink-0">
                        {item.authorInitial}
                      </div>
                      <span className="text-[13px] text-[#817B77]">
                        {item.authorRole}
                      </span>
                    </div>

                    <button className="text-[14px] font-semibold text-[#0087B5] hover:underline flex items-center gap-1">
                      <span>Read more</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-12 text-center space-y-2">
                <p className="text-[16px] font-semibold text-[#1C1713]">
                  No announcements yet
                </p>
                <p className="text-[14px] text-[#817B77] max-w-sm mx-auto">
                  News, advisories, and chapter updates will be published here once available.
                </p>
              </div>
            )}
          </div>

          {/* Side Column (320px = lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
              <h3 className="text-[18px] font-semibold text-[#1C1713]">
                Categories
              </h3>

              <div className="divide-y divide-[#EEECEA]">
                {categories.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => setFilter(c.label)}
                    className="w-full py-3.5 first:pt-1 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                  >
                    <span className="text-[14px] text-[#3D3733] font-normal">
                      {c.label}
                    </span>
                    <span className="text-[14px] font-semibold text-[#0087B5]">
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
