"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LogoMark } from "./ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { QuickPopoverPanel, type QuickPanelType } from "./QuickPopoverPanel";
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
  SlidersHorizontal,
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
  unreadNotifications?: number;
  unreadMessages?: number;
}

function getNavItems(role: PortalRole): NavItem[] {
  if (role === "admin") {
    return [
      { label: "Users Directory", href: "/admin",              icon: Users,    tab: "users"    },
      { label: "Site Settings",   href: "/admin?tab=settings", icon: Settings, tab: "settings" },
      { label: "Profile",         href: "/profile",            icon: User                      },
    ];
  }
  if (role === "officer") {
    return [
      { label: "Home",                  href: "/officer",                   icon: Home,              tab: "dashboard" },
      { label: "Control Panel",         href: "/officer?tab=control-panel", icon: SlidersHorizontal, tab: "control-panel" },
      { label: "Analytics and Reports", href: "/officer?tab=analytics",     icon: BarChart2,         tab: "analytics" },
      { label: "Events",                href: "/events",                    icon: Calendar },
      { label: "Announcements",         href: "/news",                      icon: FileText },
      { label: "Mail",                  href: "/mail",                      icon: Mail     },
      { label: "Profile",               href: "/profile",                   icon: User     },
    ];
  }
  if (role === "faculty") {
    return [
      { label: "Home",                  href: "/faculty",                   icon: Home,              tab: "dashboard" },
      { label: "Student Masterlist",    href: "/faculty?tab=operations",    icon: Users,             tab: "operations" },
      { label: "Analytics and Reports", href: "/faculty?tab=analytics",     icon: BarChart2,         tab: "analytics" },
      { label: "Events",                href: "/events",                    icon: Calendar },
      { label: "Announcements",         href: "/news",                      icon: FileText },
      { label: "Mail",                  href: "/mail",                      icon: Mail     },
      { label: "Profile",               href: "/profile",                   icon: User     },
    ];
  }
  // non_member / member
  return [
    { label: "Home",          href: "/student",       icon: Home     },
    { label: "Events",        href: "/events",        icon: Calendar },
    { label: "Announcements", href: "/news",          icon: FileText },
    { label: "Mail",          href: "/mail",          icon: Mail     },
    { label: "Profile",       href: "/profile",       icon: User     },
  ];
}

/** Inner component that reads searchParams (must be inside <Suspense>) */
function SidebarNav({
  navItems,
  activeItemOverride,
  onNavigate,
  collapsed,
  hovered,
}: {
  navItems: NavItem[];
  activeItemOverride?: string;
  onNavigate: () => void;
  collapsed: boolean;
  hovered?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "";
  // On desktop, treat the sidebar as expanded when hovered (even if collapsed)
  const effectiveCollapsed = collapsed && !hovered;

  function isActive(item: NavItem): boolean {
    if (activeItemOverride) return activeItemOverride === item.label;

    if (item.tab !== undefined) {
      // tab-based routing
      const basePath = item.href.split("?")[0];
      if (pathname !== basePath) return false;
      if (item.tab === "users" || item.tab === "dashboard") return !currentTab || currentTab === item.tab;
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
            className={`h-10.5 rounded-[10px] flex items-center transition-colors ${
              effectiveCollapsed ? "px-3.5 gap-3 lg:justify-center lg:px-0 lg:gap-0" : "px-3.5 gap-3"
            } ${
              active
                ? "bg-cyan-50 text-cyan-600"
                : "text-text-dark hover:bg-ink-800 hover:text-white"
            }`}
          >
            <Icon
              className={`w-5 h-5 shrink-0 ${active ? "text-cyan-600" : "text-text-dark"}`}
            />
            <span
              className={`text-[14px] truncate ${effectiveCollapsed ? "lg:sr-only" : ""} ${
                active ? "font-semibold text-cyan-600" : "font-medium"
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
  unreadNotifications: initialUnreadNotifications,
  unreadMessages: initialUnreadMessages,
}: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(initialUnreadNotifications ?? 0);
  const [unreadMessages, setUnreadMessages] = useState(initialUnreadMessages ?? 0);
  const [openPanel, setOpenPanel] = useState<QuickPanelType>(null);
  const quickPanelContainerRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const navItems = getNavItems(role);

  useEffect(() => {
    if (initialUnreadNotifications !== undefined) {
      setUnreadNotifications(initialUnreadNotifications);
    }
  }, [initialUnreadNotifications]);

  useEffect(() => {
    if (initialUnreadMessages !== undefined) {
      setUnreadMessages(initialUnreadMessages);
    }
  }, [initialUnreadMessages]);

  useEffect(() => {
    let active = true;
    const fetchCounts = async () => {
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user || !active) return;

        const [{ count: notifCount }, { count: msgCount }] = await Promise.all([
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false),
          supabase
            .from("message_recipients")
            .select("message_id, messages!inner(message_type)", { count: "exact", head: true })
            .eq("recipient_id", user.id)
            .eq("is_read", false)
            .eq("messages.message_type", "internal")
            .is("deleted_at", null),
        ]);

        if (active) {
          if (notifCount !== null && notifCount !== undefined) {
            setUnreadNotifications(notifCount);
          }
          if (msgCount !== null && msgCount !== undefined) {
            setUnreadMessages(msgCount);
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchCounts();
    const handleCountsUpdated = () => {
      fetchCounts();
    };
    window.addEventListener("icpep:counts-updated", handleCountsUpdated);
    return () => {
      active = false;
      window.removeEventListener("icpep:counts-updated", handleCountsUpdated);
    };
  }, [pathname]);

  const isInboxActive =
    activeItem === "Inbox" || pathname === "/inbox" || pathname.startsWith("/inbox/");
  const isNotifsActive =
    activeItem === "Notifications" ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/");

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

  // Close floating quick panel on outside click, Escape, or route change
  useEffect(() => {
    setOpenPanel(null);
  }, [pathname]);

  useEffect(() => {
    if (!openPanel) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-quick-panel-toggle='true']")) return;
      if (
        quickPanelContainerRef.current &&
        !quickPanelContainerRef.current.contains(e.target as Node)
      ) {
        setOpenPanel(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPanel(null);
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [openPanel]);

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

  // On desktop, the sidebar visually expands when hovered even if pinned collapsed
  const effectiveCollapsed = sidebarCollapsed && !sidebarHovered;

  const sidebarContent = (
    <>
      <div className={`space-y-6 ${effectiveCollapsed ? "lg:space-y-6" : ""}`}>
        <button
          type="button"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!sidebarCollapsed}
          className={`hidden lg:flex w-full items-center select-none ${
            effectiveCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <LogoMark size={40} />
          {!effectiveCollapsed && (
            <div className="flex flex-col leading-none text-left">
              <span className="text-[16px] font-bold text-white tracking-[-0.2px]">ICpEP.SE</span>
              <span className="text-[11px] font-medium text-text-mute mt-0.5">
                {role === "admin" ? "Admin console" : "CIT-U Chapter"}
              </span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-3 lg:hidden">
          <LogoMark size={40} />
          <div className="flex flex-col leading-none">
            <span className="text-[16px] font-bold text-white tracking-[-0.2px]">ICpEP.SE</span>
            <span className="text-[11px] font-medium text-text-mute mt-0.5">
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
                  className={`h-10.5 px-3.5 rounded-[10px] flex items-center gap-3 text-text-dark ${
                    effectiveCollapsed ? "lg:justify-center lg:px-0 lg:gap-0" : ""
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0 text-text-dark" />
                  <span className={`text-[14px] font-medium ${effectiveCollapsed ? "lg:sr-only" : ""}`}>
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
            hovered={sidebarHovered}
          />
        </Suspense>
      </div>

      {/* Footer */}
      <div className={`space-y-2 pt-4 border-t border-ink-border ${effectiveCollapsed ? "lg:space-y-3" : ""}`}>
        <Link
          href="/settings"
          onClick={closeSidebar}
          title={effectiveCollapsed ? "Account settings" : undefined}
          aria-label={effectiveCollapsed ? "Account settings" : undefined}
          className={`w-full bg-ink-800 hover:bg-[#342e2a] transition-colors rounded-xl flex items-center gap-3 ${
            effectiveCollapsed ? "p-3 lg:justify-center lg:p-2" : "p-3"
          }`}
        >
          <div className={`w-9 h-9 rounded-full bg-cyan-500 text-on-brand flex items-center justify-center font-bold text-[14px] shrink-0 ${effectiveCollapsed ? "lg:hidden" : ""}`}>
            {initial}
          </div>
          <div className={`flex-1 min-w-0 leading-tight ${effectiveCollapsed ? "lg:hidden" : ""}`}>
            <p className="text-[13px] font-semibold text-white truncate">{displayName}</p>
            <p className="text-[11px] text-text-mute truncate">{sub}</p>
          </div>
          <Settings className={`w-4 h-4 text-text-mute shrink-0 ${effectiveCollapsed ? "lg:hidden" : ""}`} />
          {effectiveCollapsed && <Settings className="hidden lg:block w-4 h-4 text-text-mute shrink-0" />}
        </Link>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title={effectiveCollapsed ? "Sign Out" : undefined}
            aria-label="Sign Out"
            className="w-full h-[40px] rounded-[10px] bg-ink-800 hover:bg-ink-700 text-text-dark hover:text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={effectiveCollapsed ? "lg:hidden" : ""}>Sign Out</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-page flex">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-ink-900 border-b border-ink-border flex items-center justify-between px-4">
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

        {/* Mobile Top-Right Actions: Inbox & Notifications + Menu */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            data-quick-panel-toggle="true"
            onClick={() =>
              setOpenPanel((p) => (p === "messages" ? null : "messages"))
            }
            title="Messages"
            aria-label="Messages"
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              openPanel === "messages" || isInboxActive
                ? "text-cyan-500 bg-white/10"
                : "text-text-dark hover:text-white hover:bg-ink-800"
            }`}
          >
            <Mail className="w-5 h-5" />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-ink-900">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </button>

          <button
            type="button"
            data-quick-panel-toggle="true"
            onClick={() =>
              setOpenPanel((p) =>
                p === "notifications" ? null : "notifications"
              )
            }
            title="Notifications"
            aria-label="Notifications"
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              openPanel === "notifications" || isNotifsActive
                ? "text-cyan-500 bg-white/10"
                : "text-text-dark hover:text-white hover:bg-ink-800"
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#bf2626] px-1 text-[10px] font-bold text-white">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="portal-sidebar"
            className="w-10 h-10 flex items-center justify-center text-white rounded-[8px] hover:bg-ink-800 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
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
        onMouseEnter={() => { if (window.innerWidth >= 1024) setSidebarHovered(true); }}
        onMouseLeave={() => setSidebarHovered(false)}
        onClick={(event) => {
          if (window.innerWidth < 1024) return;
          if ((event.target as HTMLElement).closest("a, button, input, select, textarea, [role='button']")) return;
          setSidebarCollapsed((collapsed) => !collapsed);
        }}
        className={`fixed left-0 top-0 z-40 h-screen bg-ink-900 border-r border-ink-border
          flex flex-col justify-between p-5
          overflow-y-auto
          transition-[transform,width] duration-300 ease-in-out motion-reduce:transition-none
          w-[min(256px,calc(100vw-3rem))] ${effectiveCollapsed ? "lg:w-[76px] lg:px-3" : "lg:w-[256px]"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main content area with dedicated top bar */}
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out motion-reduce:transition-none ${
          effectiveCollapsed ? "lg:ml-[76px]" : "lg:ml-[256px]"
        }`}
      >
        {/* Desktop Sticky Top Bar: Compact quick-actions header with tight, natural spacing */}
        <header className="hidden lg:flex sticky top-0 z-30 h-12 items-center justify-end px-5 sm:px-6 lg:px-10 bg-surface-page/90 backdrop-blur-md">
          <aside
            aria-label="Quick actions"
            className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-full border border-border-default shadow-xs hover:shadow-sm transition-shadow"
          >
            <button
              type="button"
              data-quick-panel-toggle="true"
              onClick={() =>
                setOpenPanel((p) => (p === "messages" ? null : "messages"))
              }
              title="Messages"
              aria-label="Messages"
              className={`relative p-1.5 rounded-full transition-colors cursor-pointer ${
                openPanel === "messages" || isInboxActive
                  ? "bg-cyan-50 text-cyan-600"
                  : "text-[#544E49] hover:text-cyan-600 hover:bg-[#F2EFE9]"
              }`}
            >
              <Mail className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-ink-900 ring-2 ring-white">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
            </button>

            <div className="w-[1px] h-4 bg-[#E5E0DC]" />

            <button
              type="button"
              data-quick-panel-toggle="true"
              onClick={() =>
                setOpenPanel((p) =>
                  p === "notifications" ? null : "notifications"
                )
              }
              title="Notifications"
              aria-label="Notifications"
              className={`relative p-1.5 rounded-full transition-colors cursor-pointer ${
                openPanel === "notifications" || isNotifsActive
                  ? "bg-cyan-50 text-cyan-600"
                  : "text-[#544E49] hover:text-cyan-600 hover:bg-[#F2EFE9]"
              }`}
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#bf2626] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </button>
          </aside>
        </header>

        {/* Floating Quick Popover Tab (Messages / Notifications) */}
        <div ref={quickPanelContainerRef}>
          <QuickPopoverPanel
            openPanel={openPanel}
            onClose={() => setOpenPanel(null)}
          />
        </div>

        {/* Main page content */}
        <main className="flex-1 min-w-0 bg-surface-page p-5 pt-[72px] sm:p-6 sm:pt-[72px] lg:p-10 lg:pt-3 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
