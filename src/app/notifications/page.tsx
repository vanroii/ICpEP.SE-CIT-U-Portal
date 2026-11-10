"use client";

import React, { useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { Calendar, Mail, Bell, Award, Check } from "lucide-react";

export default function NotificationsPage() {
  const [filter, setFilter] = useState("All");

  const [todayNotifications, setTodayNotifications] = useState<
    Array<{
      id: number;
      type: string;
      icon: any;
      boxBg: string;
      iconColor: string;
      title: string;
      desc: string;
      time: string;
      isUnread: boolean;
    }>
  >([]);

  const [earlierNotifications, setEarlierNotifications] = useState<
    Array<{
      id: number;
      type: string;
      icon: any;
      boxBg: string;
      iconColor: string;
      title: string;
      desc: string;
      time: string;
      isUnread: boolean;
    }>
  >([]);

  const markAllRead = () => {
    setTodayNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const filterItem = (item: any) => {
    if (filter === "All") return true;
    return item.type.toLowerCase() === filter.toLowerCase();
  };

  const filteredToday = todayNotifications.filter(filterItem);
  const filteredEarlier = earlierNotifications.filter(filterItem);
  const hasNotifications = filteredToday.length > 0 || filteredEarlier.length > 0;

  return (
    <PortalShell activeItem="Notifications">
      <div className="space-y-7">
        {/* Page Header (1096x62, §6.7) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Notifications
            </h1>
            <p className="text-[15px] text-[#817B77]">
              Updates about events, announcements, messages, and membership status.
            </p>
          </div>

          <button
            onClick={markAllRead}
            className="text-[14px] font-semibold text-[#0087B5] hover:underline self-start sm:self-auto"
          >
            Mark all as read
          </button>
        </div>

        {/* Filters (496x32 H10) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {["All", "Events", "Announcements", "Messages", "Membership"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-[32px] px-[14px] rounded-full text-[13px] font-semibold transition-colors ${
                filter === f
                  ? "bg-[#19A7D5] text-[#12191C]"
                  : "bg-white border border-[#DEDBD8] text-[#817B77] hover:text-[#1C1713]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content Row (1096x530 H24) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Notifications List (752px = lg:col-span-8) */}
          <div className="lg:col-span-8 bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
            {hasNotifications ? (
              <>
                {/* TODAY Group */}
                {filteredToday.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[12px] font-bold tracking-[0.8px] text-[#928C88] uppercase">
                      TODAY
                    </p>

                    <div className="divide-y divide-[#EEECEA]">
                      {filteredToday.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.id}
                            className="py-3.5 first:pt-1 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`w-[42px] h-[42px] rounded-[12px] ${item.boxBg} flex items-center justify-center shrink-0`}
                              >
                                <Icon className={`w-5 h-5 ${item.iconColor}`} />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <h4 className="text-[15px] font-semibold text-[#1C1713] truncate">
                                  {item.title}
                                </h4>
                                <p className="text-[13px] text-[#817B77] truncate">
                                  {item.desc}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="text-[12px] text-[#928C88]">
                                {item.time}
                              </span>
                              {item.isUnread && (
                                <span className="w-2 h-2 rounded-full bg-[#19A7D5]" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* EARLIER Group */}
                {filteredEarlier.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-[12px] font-bold tracking-[0.8px] text-[#928C88] uppercase">
                      EARLIER
                    </p>

                    <div className="divide-y divide-[#EEECEA]">
                      {filteredEarlier.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.id}
                            className="py-3.5 first:pt-1 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`w-[42px] h-[42px] rounded-[12px] ${item.boxBg} flex items-center justify-center shrink-0`}
                              >
                                <Icon className={`w-5 h-5 ${item.iconColor}`} />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <h4 className="text-[15px] font-medium text-[#1C1713] truncate">
                                  {item.title}
                                </h4>
                                <p className="text-[13px] text-[#817B77] truncate">
                                  {item.desc}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 text-[12px] text-[#928C88]">
                              {item.time}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center space-y-2">
                <p className="text-[16px] font-semibold text-[#1C1713]">
                  No notifications
                </p>
                <p className="text-[14px] text-[#817B77] max-w-sm mx-auto">
                  You are all caught up! New notifications about events, announcements, and messages will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Summary Card (320px = lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
              <h3 className="text-[18px] font-semibold text-[#1C1713]">
                Summary
              </h3>

              <div className="divide-y divide-[#EEECEA]">
                <div className="py-3.5 first:pt-1 flex items-center justify-between">
                  <span className="text-[14px] text-[#3D3733]">Events</span>
                  <span className="text-[14px] font-semibold text-[#0087B5]">
                    {todayNotifications.filter((n) => n.type === "Events").length + earlierNotifications.filter((n) => n.type === "Events").length}
                  </span>
                </div>
                <div className="py-3.5 flex items-center justify-between">
                  <span className="text-[14px] text-[#3D3733]">Announcements</span>
                  <span className="text-[14px] font-semibold text-[#0087B5]">
                    {todayNotifications.filter((n) => n.type === "Announcements").length + earlierNotifications.filter((n) => n.type === "Announcements").length}
                  </span>
                </div>
                <div className="py-3.5 flex items-center justify-between">
                  <span className="text-[14px] text-[#3D3733]">Messages</span>
                  <span className="text-[14px] font-semibold text-[#0087B5]">
                    {todayNotifications.filter((n) => n.type === "Messages").length + earlierNotifications.filter((n) => n.type === "Messages").length}
                  </span>
                </div>
                <div className="py-3.5 flex items-center justify-between">
                  <span className="text-[14px] text-[#3D3733]">Membership</span>
                  <span className="text-[14px] font-semibold text-[#0087B5]">
                    {todayNotifications.filter((n) => n.type === "Membership").length + earlierNotifications.filter((n) => n.type === "Membership").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
