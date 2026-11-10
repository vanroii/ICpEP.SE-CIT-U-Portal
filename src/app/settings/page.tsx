"use client";

import React, { useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { Badge } from "@/components/ui/Badge";
import { Lock, Check } from "lucide-react";

export default function AccountSettingsPage() {
  const [eventReminders, setEventReminders] = useState(true);
  const [announcements, setAnnouncements] = useState(true);
  const [inboxNotifications, setInboxNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    studentId: "",
    email: "",
    contact: "",
    yearSection: "",
    preferredName: "",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <PortalShell activeItem="">
      <div className="space-y-7">
        {/* Page Header (1096x62, §6.4) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[30px] leading-[38px] font-bold text-[#1C1713] tracking-[-0.5px]">
              Account Settings
            </h1>
            <p className="text-[15px] text-[#817B77]">
              Manage your personal information and account settings.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="h-[43px] px-[22px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] active:bg-[#1383a8] text-[#12191C] font-semibold text-[14px] flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save changes</span>
            )}
          </button>
        </div>

        {/* Content Row (1096x901 H24) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (320px = lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[28px_24px] flex flex-col items-center text-center space-y-3">
              <div className="w-[96px] h-[96px] rounded-full bg-[#19A7D5] text-[#12191C] flex items-center justify-center font-bold text-[38px] select-none">
                {form.preferredName ? form.preferredName.charAt(0).toUpperCase() : form.fullName ? form.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="space-y-1">
                <h3 className="text-[20px] font-bold text-[#1C1713]">
                  {form.fullName || "User Profile"}
                </h3>
                <p className="text-[14px] text-[#817B77]">
                  {form.studentId ? `${form.studentId} · ${form.yearSection || "CpE Student"}` : "Student Account"}
                </p>
              </div>

              <div className="pt-1">
                <Badge tone="verified">Verified</Badge>
              </div>

              <button className="h-[34px] px-[14px] rounded-[8px] border border-[#C9C5C2] text-[#0087B5] hover:bg-[#FAF9F8] text-[13px] font-semibold transition-colors mt-2">
                Change photo
              </button>
            </div>
          </div>

          {/* Right Column (752px = lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Information Card */}
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-5">
              <h3 className="text-[18px] font-semibold text-[#1C1713]">
                Personal information
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-[14px] font-semibold text-[#3D3733]">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) =>
                        setForm({ ...form, fullName: e.target.value })
                      }
                      className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] outline-none focus:border-[#19A7D5]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[14px] font-semibold text-[#3D3733]">
                      Student ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={form.studentId}
                        className="w-full h-[46px] px-4 rounded-[10px] bg-[#F2F1F0] border border-[#C9C5C2] text-[15px] text-[#817B77] outline-none cursor-not-allowed pr-10"
                      />
                      <Lock className="w-4 h-4 text-[#817B77] absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-[14px] font-semibold text-[#3D3733]">
                      School email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] outline-none focus:border-[#19A7D5]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[14px] font-semibold text-[#3D3733]">
                      Contact number
                    </label>
                    <input
                      type="text"
                      value={form.contact}
                      onChange={(e) =>
                        setForm({ ...form, contact: e.target.value })
                      }
                      className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] outline-none focus:border-[#19A7D5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-[14px] font-semibold text-[#3D3733]">
                      Year & section
                    </label>
                    <input
                      type="text"
                      value={form.yearSection}
                      onChange={(e) =>
                        setForm({ ...form, yearSection: e.target.value })
                      }
                      className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] outline-none focus:border-[#19A7D5]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[14px] font-semibold text-[#3D3733]">
                      Preferred name
                    </label>
                    <input
                      type="text"
                      value={form.preferredName}
                      onChange={(e) =>
                        setForm({ ...form, preferredName: e.target.value })
                      }
                      className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] outline-none focus:border-[#19A7D5]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
              <h3 className="text-[18px] font-semibold text-[#1C1713]">
                Change password
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-[14px] font-semibold text-[#3D3733]">
                    Current password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[14px] font-semibold text-[#3D3733]">
                    New password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[14px] font-semibold text-[#3D3733]">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full h-[46px] px-4 rounded-[10px] bg-white border border-[#C9C5C2] text-[15px] text-[#1C1713] placeholder-[#928C88] outline-none focus:border-[#19A7D5]"
                  />
                </div>
              </div>

              <div>
                <button className="h-[32px] px-[14px] rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] text-[13px] font-semibold transition-colors">
                  Update password
                </button>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white border border-[#DEDBD8] rounded-[16px] p-[22px_24px] space-y-4">
              <h3 className="text-[18px] font-semibold text-[#1C1713]">
                Notifications
              </h3>

              <div className="divide-y divide-[#EEECEA]">
                {/* Event Reminders */}
                <div className="py-3.5 first:pt-1 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#1C1713]">
                      Event reminders
                    </h4>
                    <p className="text-[13px] text-[#817B77]">
                      Get notified a day before events you RSVP to
                    </p>
                  </div>
                  <button
                    onClick={() => setEventReminders(!eventReminders)}
                    className={`w-[44px] h-[24px] rounded-full transition-colors flex items-center px-0.5 ${
                      eventReminders ? "bg-[#19A7D5] justify-end" : "bg-[#C9C5C2] justify-start"
                    }`}
                  >
                    <span className="w-[18px] h-[18px] rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Announcements */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#1C1713]">
                      Announcements
                    </h4>
                    <p className="text-[13px] text-[#817B77]">
                      New posts from the officers
                    </p>
                  </div>
                  <button
                    onClick={() => setAnnouncements(!announcements)}
                    className={`w-[44px] h-[24px] rounded-full transition-colors flex items-center px-0.5 ${
                      announcements ? "bg-[#19A7D5] justify-end" : "bg-[#C9C5C2] justify-start"
                    }`}
                  >
                    <span className="w-[18px] h-[18px] rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Direct message notifications */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#1C1713]">
                      Direct message notifications
                    </h4>
                    <p className="text-[13px] text-[#817B77]">
                      Get notified when officers or peers send you an inbox message
                    </p>
                  </div>
                  <button
                    onClick={() => setInboxNotifications(!inboxNotifications)}
                    className={`w-[44px] h-[24px] rounded-full transition-colors flex items-center px-0.5 ${
                      inboxNotifications ? "bg-[#19A7D5] justify-end" : "bg-[#C9C5C2] justify-start"
                    }`}
                  >
                    <span className="w-[18px] h-[18px] rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

