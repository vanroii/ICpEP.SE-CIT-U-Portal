"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { Search, MapPin, Clock, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function EventsPortalPage() {
  const [filter, setFilter] = useState<"upcoming" | "going" | "past">("upcoming");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [eventsList, setEventsList] = useState<
    Array<{
      id: number;
      month: string;
      day: string;
      title: string;
      category: string;
      venue: string;
      time: string;
      status: "going" | "pending" | "rsvp";
    }>
  >([]);

  const toggleRsvp = (id: number) => {
    setEventsList((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          if (e.status === "going") return { ...e, status: "rsvp" };
          if (e.status === "pending") return { ...e, status: "going" };
          return { ...e, status: "pending" };
        }
        return e;
      })
    );
  };

  const filteredEvents = eventsList.filter((e) => {
    if (filter === "going" && e.status !== "going") return false;
    if (filter === "past") return false; // none in past for current demo
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PortalShell activeItem="Events">
      <div className="space-y-7">
        {/* Page Header (1096x62, §6.2) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Events
            </h1>
            <p className="text-[15px] text-[#817B77]">
              Browse upcoming ICpEP.SE events and RSVP in one tap.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input (260x42) */}
            <div className="w-[260px] h-[42px] px-3 bg-white border border-[#C9C5C2] rounded-[10px] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#928C88] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events"
                className="w-full text-[14px] text-[#1C1713] placeholder-[#928C88] bg-transparent outline-none"
              />
            </div>

            {/* Create event button (for Officers / Faculty, §8) */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-[43px] px-[18px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] font-semibold text-[14px] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create event</span>
            </button>
          </div>
        </div>

        {/* Filters (285x32 H10, §6.2) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setFilter("upcoming")}
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors ${
              filter === "upcoming"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("going")}
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors ${
              filter === "going"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            Going
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors ${
              filter === "past"
                ? "bg-[#19A7D5] text-[#12191C]"
                : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
            }`}
          >
            Past events
          </button>
        </div>

        {/* Content Row (1096x731 H24) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Card: Upcoming events (732px wide = lg:col-span-8) */}
          <div className="lg:col-span-8 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-[18px] font-semibold text-[#1C1713]">
                Upcoming events
              </h3>
              <span className="text-[14px] font-semibold text-[#0087B5]">
                {filteredEvents.length} events
              </span>
            </div>

            {filteredEvents.length > 0 ? (
              <div className="divide-y divide-[#EEECEA]">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="py-4 first:pt-2 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Date Box 60x60 */}
                      <div className="w-[60px] h-[60px] rounded-[12px] bg-[#E3F6FC] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold tracking-[0.5px] text-[#0087B5] leading-none">
                          {evt.month}
                        </span>
                        <span className="text-[22px] font-bold text-[#0087B5] leading-tight">
                          {evt.day}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-[16px] font-semibold text-[#1C1713] truncate">
                            {evt.title}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#E3F6FC] text-[#0087B5] text-[12px] font-semibold">
                            {evt.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[13px] text-[#817B77]">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{evt.venue}</span>
                          <span>·</span>
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{evt.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* RSVP button */}
                    <div>
                      {evt.status === "going" && (
                        <button
                          onClick={() => toggleRsvp(evt.id)}
                          className="h-[32px] px-3.5 rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] text-[13px] font-semibold shrink-0"
                        >
                          Going
                        </button>
                      )}
                      {evt.status === "pending" && (
                        <button
                          onClick={() => toggleRsvp(evt.id)}
                          className="h-[34px] px-3.5 rounded-[8px] border border-[#C9C5C2] text-[#0087B5] hover:bg-[#FAF9F8] text-[13px] font-semibold shrink-0"
                        >
                          Pending
                        </button>
                      )}
                      {evt.status === "rsvp" && (
                        <button
                          onClick={() => toggleRsvp(evt.id)}
                          className="h-[34px] px-3.5 rounded-[8px] border border-[#C9C5C2] text-[#0087B5] hover:bg-[#FAF9F8] text-[13px] font-semibold shrink-0"
                        >
                          RSVP
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <p className="text-[16px] font-semibold text-[#1C1713]">
                  No events found
                </p>
                <p className="text-[14px] text-[#817B77] max-w-sm mx-auto">
                  There are currently no events matching this filter. New activities will be posted here once announced.
                </p>
              </div>
            )}
          </div>

          {/* Right Rail (340px wide = lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Calendar Card */}
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-semibold text-[#1C1713]">
                  Calendar
                </h3>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center text-[12px] font-bold text-[#928C88] py-1">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              {/* Calendar Grid: 1..30 */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-[13px] font-medium text-[#3D3733]">
                {[...Array(30)].map((_, i) => {
                  const day = i + 1;
                  return (
                    <div key={day} className="h-8 flex items-center justify-center">
                      <span className="w-[34px] h-[34px] rounded-full flex items-center justify-center hover:bg-[#FAF9F8]">
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Registrations Card */}
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-semibold text-[#1C1713]">
                  My registrations
                </h3>
                <span className="text-[14px] font-semibold text-[#0087B5]">
                  0 events
                </span>
              </div>

              <div className="py-6 text-center space-y-1.5">
                <p className="text-[14px] font-medium text-[#514B47]">
                  No active registrations
                </p>
                <p className="text-[12px] text-[#817B77]">
                  Events you RSVP to will be listed here.
                </p>
              </div>

              <p className="text-[13px] leading-[20px] text-[#817B77]">
                You will get a confirmation notification after you register for an event.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal (§8.1) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DEDBD8] rounded-[16px] max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-[24px] font-bold text-[#1C1713]">Create event</h2>
              <p className="text-[14px] text-[#817B77]">
                Fill in the details below to publish a new event for ICpEP.SE members.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#1C1713] mb-1.5">
                  Event title
                </label>
                <input
                  placeholder="Enter event title"
                  className="w-full h-12 px-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none focus:border-[#19A7D5]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1C1713] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a short description, agenda, and any important details members should know before attending."
                  className="w-full p-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none focus:border-[#19A7D5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1C1713] mb-1.5">
                    Category
                  </label>
                  <select className="w-full h-12 px-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none">
                    <option>Workshop</option>
                    <option>General Assembly</option>
                    <option>Social</option>
                    <option>Competition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1C1713] mb-1.5">
                    Audience
                  </label>
                  <select className="w-full h-12 px-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none">
                    <option>Open to all CpE students</option>
                    <option>Verified members only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1C1713] mb-1.5">
                    Start date & time
                  </label>
                  <input
                    placeholder="MM/DD/YYYY · HH:MM AM/PM"
                    className="w-full h-12 px-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1C1713] mb-1.5">
                    Venue or online link
                  </label>
                  <input
                    placeholder="Enter venue or online meeting link"
                    className="w-full h-12 px-4 rounded-[10px] border border-[#C9C5C2] text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#EEECEA]">
              <p className="text-xs text-[#817B77] max-w-xs">
                Drafts are saved automatically. Publishing makes the event visible to the community.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#C9C5C2] text-[#0087B5] rounded-[8px] text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] rounded-[8px] text-sm font-semibold"
                >
                  Publish event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
