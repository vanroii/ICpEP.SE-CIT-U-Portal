"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./ui/Logo";
import { Avatar } from "./ui/Avatar";
import {
  Home,
  Calendar,
  Bell,
  User,
  Mail,
  BarChart2,
  FileText,
  Shield,
  Users,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

export type PortalRole = "member" | "non_member" | "officer" | "faculty" | "admin";

interface PortalShellProps {
  children: React.ReactNode;
  activeItem?: string;
  role?: PortalRole;
  userName?: string;
  userRoleLabel?: string;
}

export function PortalShell({
  children,
  activeItem,
  role = "member",
  userName,
  userRoleLabel,
}: PortalShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Derived user details based on role
  const getUserInfo = () => {
    const displayName = userName || (role === "admin" ? "Administrator" : role === "faculty" ? "Faculty Adviser" : role === "officer" ? "Chapter Officer" : "Student Member");
    const initial = displayName.charAt(0).toUpperCase() || "S";
    switch (role) {
      case "faculty":
        return {
          name: displayName,
          sub: "Account settings",
          avatarLetter: initial,
          avatarBg: "#19A7D5",
          avatarColor: "#12191C",
          roleBadge: userRoleLabel || "Faculty",
        };
      case "admin":
        return {
          name: displayName,
          sub: "ICpEP.SE admin",
          avatarLetter: initial,
          avatarBg: "#19A7D5",
          avatarColor: "#12191C",
          roleBadge: userRoleLabel || "Admin console",
        };
      case "officer":
        return {
          name: displayName,
          sub: "Account settings",
          avatarLetter: initial,
          avatarBg: "#19A7D5",
          avatarColor: "#12191C",
          roleBadge: userRoleLabel || "Officer",
        };
      case "non_member":
        return {
          name: displayName,
          sub: "Account settings",
          avatarLetter: initial,
          avatarBg: "#19A7D5",
          avatarColor: "#12191C",
          roleBadge: userRoleLabel || "Non-Member",
        };
      case "member":
      default:
        return {
          name: displayName,
          sub: "Account settings",
          avatarLetter: initial,
          avatarBg: "#19A7D5",
          avatarColor: "#12191C",
          roleBadge: userRoleLabel || "CIT-U Chapter",
        };
    }
  };

  const user = getUserInfo();

  // Navigation Items per Role according to §5, §6, §7, §8, §9, §10
  const getNavItems = () => {
    if (role === "admin") {
      return [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Masterlist", href: "/admin?tab=masterlist", icon: FileText },
        { label: "Verifications", href: "/admin?tab=verifications", icon: Shield },
        { label: "Events", href: "/admin?tab=events", icon: Calendar },
        { label: "Members", href: "/admin?tab=members", icon: Users },
      ];
    }

    if (role === "officer") {
      return [
        { label: "Home", href: "/officer", icon: Home },
        { label: "Analytics and Reports", href: "/officer?tab=analytics", icon: BarChart2 },
        { label: "Events", href: "/events", icon: Calendar },
        { label: "Announcements", href: "/news", icon: Bell },
        { label: "Profile", href: "/profile", icon: User },
        { label: "Inbox", href: "/inbox", icon: Mail },
        { label: "Notifications", href: "/notifications", icon: Bell },
      ];
    }

    if (role === "faculty") {
      return [
        { label: "Home", href: "/faculty", icon: Home },
        { label: "Analytics and Reports", href: "/faculty?tab=analytics", icon: BarChart2 },
        { label: "Events", href: "/events", icon: Calendar },
        { label: "Announcements", href: "/news", icon: Bell },
        { label: "Profile", href: "/profile", icon: User },
        { label: "Inbox", href: "/inbox", icon: Mail },
        { label: "Notifications", href: "/notifications", icon: Bell },
      ];
    }

    // Default Member & Non-Member
    return [
      { label: "Home", href: "/student", icon: Home },
      { label: "Events", href: "/events", icon: Calendar },
      { label: "Announcements", href: "/news", icon: Bell },
      { label: "Profile", href: "/profile", icon: User },
      { label: "Inbox", href: "/inbox", icon: Mail },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ];
  };

  const navItems = getNavItems();

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="space-y-7">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <LogoMark size={42} />
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold text-white tracking-[-0.2px]">
              ICpEP.SE
            </span>
            <span className="text-[12px] font-medium text-[#AAA4A0] mt-1">
              {role === "admin" ? "Admin console" : "CIT-U Chapter"}
            </span>
          </div>
        </div>

        {/* Navigation Group */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeItem === item.label ||
              (activeItem === undefined &&
                (pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href))));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleNavClick}
                className={`h-[42px] px-[14px] py-[11px] rounded-[10px] flex items-center gap-3 transition-colors ${
                  isActive
                    ? "bg-[#E3F6FC] text-[#0087B5]"
                    : "text-white hover:bg-[#2C2622]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-[#0087B5]" : "text-white"
                  }`}
                />
                <span
                  className={`text-[15px] truncate ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Card linking to Account settings (§5.1) */}
      <Link
        href="/settings"
        onClick={handleNavClick}
        className="w-full bg-[#2C2622] hover:bg-[#342e2a] transition-colors rounded-[12px] p-3 flex items-center gap-3 mt-4"
      >
        <div
          style={{ backgroundColor: user.avatarBg, color: user.avatarColor }}
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[15px] shrink-0"
        >
          {user.avatarLetter}
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-[14px] font-semibold text-white truncate">
            {user.name}
          </p>
          <p className="text-[12px] text-[#AAA4A0] truncate">{user.sub}</p>
        </div>
        <div className="w-[30px] h-[30px] rounded-[6px] bg-[#3A3330] flex items-center justify-center text-white shrink-0">
          <Settings className="w-4 h-4" />
        </div>
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8F8F7] flex">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-[56px] bg-[#1C1713] border-b border-[#39322E] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <LogoMark size={32} />
          <span className="text-[15px] font-bold text-white">ICpEP.SE</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 flex items-center justify-center text-white rounded-[8px] hover:bg-[#2C2622] transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: static; mobile: slide-over */}
      <aside
        className={`
          fixed lg:sticky top-0 z-40 h-screen
          w-[264px] shrink-0 bg-[#1C1713] border-r border-[#39322E]
          flex flex-col justify-between p-[28px_20px_24px_20px] select-none
          overflow-y-auto
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main Content Area — fills remaining width */}
      <main className="flex-1 min-w-0 bg-[#F8F8F7] p-5 pt-[72px] sm:p-6 sm:pt-[72px] lg:p-[40px_40px_48px_40px] overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
