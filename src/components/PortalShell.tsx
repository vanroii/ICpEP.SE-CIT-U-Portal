"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LogoMark } from "./ui/Logo";
import {
  Home,
  Calendar,
  Bell,
  User,
  Mail,
  BarChart2,
  FileText,
  Settings,
  Users,
  Menu,
  X,
  LogOut,
} from "lucide-react";

export type PortalRole = "member" | "non_member" | "officer" | "faculty" | "admin";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** For admin: the ?tab= value that activates this item */
  tab?: string;
}

interface PortalShellProps {
  children: React.ReactNode;
  activeItem?: string;
  role?: PortalRole;
  userName?: string;
  userRoleLabel?: string;
}

function getNavItems(role: PortalRole): NavItem[] {
  if (role === "admin") {
    return [
      { label: "Users Directory", href: "/admin",              icon: Users,    tab: "users"    },
      { label: "Site Settings",   href: "/admin?tab=settings", icon: Settings, tab: "settings" },
      { label: "Notifications",   href: "/notifications",      icon: Bell                      },
      { label: "Profile",         href: "/profile",            icon: User                      },
    ];
  }
  if (role === "officer") {
    return [
      { label: "Home",                  href: "/officer",               icon: Home     },
      { label: "Analytics and Reports", href: "/officer?tab=analytics", icon: BarChart2},
      { label: "Events",                href: "/events",                icon: Calendar },
      { label: "Announcements",         href: "/news",                  icon: FileText },
      { label: "Inbox",                 href: "/inbox",                 icon: Mail     },
      { label: "Notifications",         href: "/notifications",         icon: Bell     },
      { label: "Profile",               href: "/profile",               icon: User     },
    ];
  }
  if (role === "faculty") {
    return [
      { label: "Home",                  href: "/faculty",               icon: Home     },
      { label: "Analytics and Reports", href: "/faculty?tab=analytics", icon: BarChart2},
      { label: "Events",                href: "/events",                icon: Calendar },
      { label: "Announcements",         href: "/news",                  icon: FileText },
      { label: "Inbox",                 href: "/inbox",                 icon: Mail     },
      { label: "Notifications",         href: "/notifications",         icon: Bell     },
      { label: "Profile",               href: "/profile",               icon: User     },
    ];
  }
  // non_member / member
  return [
    { label: "Home",          href: "/student",       icon: Home     },
    { label: "Events",        href: "/events",        icon: Calendar },
    { label: "Announcements", href: "/news",          icon: FileText },
    { label: "Profile",       href: "/profile",       icon: User     },
    { label: "Inbox",         href: "/inbox",         icon: Mail     },
    { label: "Notifications", href: "/notifications", icon: Bell     },
  ];
}

/** Inner component that reads searchParams (must be inside <Suspense>) */
function SidebarNav({
  navItems,
  activeItemOverride,
  onNavigate,
  collapsed,
}: {
  navItems: NavItem[];
  activeItemOverride?: string;
  onNavigate: () => void;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "";

  function isActive(item: NavItem): boolean {
    if (activeItemOverride) return activeItemOverride === item.label;

    if (item.tab !== undefined) {
      // admin tab-based routing
      const basePath = item.href.split("?")[0];
      if (pathname !== basePath) return false;
      if (item.tab === "users") return !currentTab;
      return currentTab === item.tab;
    }

    if (pathname === item.href) return true;
    const base = item.href.split("?")[0];
    if (base !== "/" && pathname.startsWith(base + "/")) return true;
    return false;
  }

  return (
    <nav className="space-y-0.5">
      {navItems.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.label + item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={`h-[42px] rounded-[10px] flex items-center transition-colors ${
              collapsed ? "px-[14px] gap-3 lg:justify-center lg:px-0 lg:gap-0" : "px-[14px] gap-3"
            } ${
              active
                ? "bg-[#E3F6FC] text-[#0087B5]"
                : "text-[#D1CECB] hover:bg-[#2C2622] hover:text-white"
            }`}
          >
            <Icon
              className={`w-5 h-5 shrink-0 ${active ? "text-[#0087B5]" : "text-[#D1CECB]"}`}
            />
            <span
              className={`text-[14px] truncate ${collapsed ? "lg:sr-only" : ""} ${
                active ? "font-semibold text-[#0087B5]" : "font-medium"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalShell({
  children,
  activeItem,
  role = "member",
  userName,
  userRoleLabel,
}: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const navItems = getNavItems(role);

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  const displayName =
    userName ||
    (role === "admin"
      ? "Administrator"
      : role === "faculty"
      ? "Faculty Adviser"
      : role === "officer"
      ? "Chapter Officer"
      : "Student Member");
  const initial = displayName.charAt(0).toUpperCase() || "S";
  const sub = userRoleLabel || (role === "admin" ? "Admin console" : "Account settings");

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarContent = (
    <>
      <div className={`space-y-6 ${sidebarCollapsed ? "lg:space-y-6" : ""}`}>
        <button
          type="button"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!sidebarCollapsed}
          className={`hidden lg:flex w-full items-center select-none ${
            sidebarCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <LogoMark size={40} />
          {!sidebarCollapsed && (
            <div className="flex flex-col leading-none text-left">
              <span className="text-[16px] font-bold text-white tracking-[-0.2px]">ICpEP.SE</span>
              <span className="text-[11px] font-medium text-[#AAA4A0] mt-0.5">
                {role === "admin" ? "Admin console" : "CIT-U Chapter"}
              </span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-3 lg:hidden">
          <LogoMark size={40} />
          <div className="flex flex-col leading-none">
            <span className="text-[16px] font-bold text-white tracking-[-0.2px]">ICpEP.SE</span>
            <span className="text-[11px] font-medium text-[#AAA4A0] mt-0.5">
              {role === "admin" ? "Admin console" : "CIT-U Chapter"}
            </span>
          </div>
        </div>

        {/* Nav — wrap in Suspense so useSearchParams works without blocking */}
        <Suspense
          fallback={
            <nav className="space-y-0.5">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className={`h-[42px] px-[14px] rounded-[10px] flex items-center gap-3 text-[#D1CECB] ${
                    sidebarCollapsed ? "lg:justify-center lg:px-0 lg:gap-0" : ""
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0 text-[#D1CECB]" />
                  <span className={`text-[14px] font-medium ${sidebarCollapsed ? "lg:sr-only" : ""}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </nav>
          }
        >
          <SidebarNav
            navItems={navItems}
            activeItemOverride={activeItem}
            onNavigate={closeSidebar}
            collapsed={sidebarCollapsed}
          />
        </Suspense>
      </div>

      {/* Footer */}
      <div className={`space-y-2 pt-4 border-t border-[#39322E] ${sidebarCollapsed ? "lg:space-y-3" : ""}`}>
        <Link
          href="/settings"
          onClick={closeSidebar}
          title={sidebarCollapsed ? "Account settings" : undefined}
          aria-label={sidebarCollapsed ? "Account settings" : undefined}
          className={`w-full bg-[#2C2622] hover:bg-[#342e2a] transition-colors rounded-[12px] flex items-center gap-3 ${
            sidebarCollapsed ? "p-3 lg:justify-center lg:p-2" : "p-3"
          }`}
        >
          <div className={`w-9 h-9 rounded-full bg-[#19A7D5] text-[#12191C] flex items-center justify-center font-bold text-[14px] shrink-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
            {initial}
          </div>
          <div className={`flex-1 min-w-0 leading-tight ${sidebarCollapsed ? "lg:hidden" : ""}`}>
            <p className="text-[13px] font-semibold text-white truncate">{displayName}</p>
            <p className="text-[11px] text-[#AAA4A0] truncate">{sub}</p>
          </div>
          <Settings className={`w-4 h-4 text-[#AAA4A0] shrink-0 ${sidebarCollapsed ? "lg:hidden" : ""}`} />
          {sidebarCollapsed && <Settings className="hidden lg:block w-4 h-4 text-[#AAA4A0] shrink-0" />}
        </Link>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title={sidebarCollapsed ? "Sign Out" : undefined}
            aria-label="Sign Out"
            className="w-full h-[40px] rounded-[10px] bg-[#2C2622] hover:bg-[#3A3330] text-[#D1CECB] hover:text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Sign Out</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
      <div className="min-h-screen bg-[#F8F8F7] flex">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#1C1713] border-b border-[#39322E] flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={sidebarOpen}
          aria-controls="portal-sidebar"
          className="flex items-center gap-2.5"
        >
          <LogoMark size={30} />
          <span className="text-[14px] font-bold text-white">ICpEP.SE</span>
        </button>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
          aria-controls="portal-sidebar"
          className="w-10 h-10 flex items-center justify-center text-white rounded-[8px] hover:bg-[#2C2622] transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        id="portal-sidebar"
        aria-label="Portal navigation"
        onClick={(event) => {
          if (window.innerWidth < 1024) return;
          if ((event.target as HTMLElement).closest("a, button, input, select, textarea, [role='button']")) return;
          setSidebarCollapsed((collapsed) => !collapsed);
        }}
        className={`fixed left-0 top-0 z-40 h-screen bg-[#1C1713] border-r border-[#39322E]
          flex flex-col justify-between p-5
          overflow-y-auto
          transition-[transform,width] duration-300 ease-in-out motion-reduce:transition-none
          w-[min(256px,calc(100vw-3rem))] ${sidebarCollapsed ? "lg:w-[76px] lg:px-3" : "lg:w-[256px]"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-w-0 bg-[#F8F8F7] p-5 pt-[72px] sm:p-6 sm:pt-[72px] lg:p-10 overflow-x-hidden transition-[margin] duration-300 motion-reduce:transition-none ${sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[256px]"}`}>
        {children}
      </main>
    </div>
  );
}
