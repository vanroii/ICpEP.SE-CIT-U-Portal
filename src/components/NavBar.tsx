import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DASHBOARD_BY_ROLE, ROLE_LABELS, type RoleCode } from "@/lib/roles";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Bell, Mail, Shield, User, LogOut } from "lucide-react";

export default async function NavBar() {
  let user = null;
  let role: RoleCode | null = null;
  let name = "";
  let unreadNotifications = 0;
  let unreadMessages = 0;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    if (user) {
      const [{ data: r }, { data: p }, { count: notifCount }, { count: msgCount }] =
        await Promise.all([
          supabase.rpc("auth_role"),
          supabase
            .from("profiles")
            .select("first_name,last_name,avatar_url")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("is_read", false),
          supabase
            .from("message_recipients")
            .select("message_id", { count: "exact", head: true })
            .eq("is_read", false)
            .is("deleted_at", null),
        ]);

      role = (r as RoleCode | null) ?? null;
      name = p ? `${p.first_name} ${p.last_name}` : user.email?.split("@")[0] || "User";
      unreadNotifications = notifCount ?? 0;
      unreadMessages = msgCount ?? 0;
    }
  } catch {
    // Graceful fallback if database connection is pending
  }

  const roleToneMap: Record<RoleCode, "neutral" | "info" | "success" | "warning" | "danger"> = {
    non_member: "neutral",
    member: "success",
    officer: "info",
    faculty: "warning",
    admin: "danger",
  };

  const navLinkClass =
    "text-sm font-medium text-white/80 hover:text-[#1ca7e0] transition-colors py-1";

  return (
    <header className="sticky top-0 z-50 border-b border-[#1ca7e0]/30 bg-[#1b1613] text-white shadow-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Brand Logo & Wordmark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1ca7e0] text-[#1b1613] font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
            <span className="tracking-tighter font-mono">SE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-[#1ca7e0] transition-colors">
              ICpEP.SE
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-white/60">
              CIT-U Chapter
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-7">
          <Link className={navLinkClass} href="/">
            Home
          </Link>
          <Link className={navLinkClass} href="/events">
            Events
          </Link>
          <Link className={navLinkClass} href="/news">
            News & Updates
          </Link>
          <Link className={navLinkClass} href="/about">
            About
          </Link>

          {user && role && (
            <Link
              className="text-sm font-semibold text-[#1ca7e0] hover:underline transition-colors flex items-center gap-1.5"
              href={DASHBOARD_BY_ROLE[role]}
            >
              <Shield className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          )}
        </div>

        {/* Right side Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Message Quick Link */}
              <Link
                href="/inbox"
                className="relative p-2 text-white/80 hover:text-[#1ca7e0] hover:bg-white/5 rounded-full transition-colors"
                title="Inbox"
              >
                <Mail className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1ca7e0] px-1 text-[10px] font-bold text-[#1b1613]">
                    {unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notification Quick Link */}
              <Link
                href="/notifications"
                className="relative p-2 text-white/80 hover:text-[#1ca7e0] hover:bg-white/5 rounded-full transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#bf2626] px-1 text-[10px] font-bold text-white">
                    {unreadNotifications}
                  </span>
                )}
              </Link>

              {/* User Identity & Profile Link */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Avatar name={name} size="sm" />
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {name}
                    </span>
                    {role && (
                      <Badge tone={roleToneMap[role]} className="scale-80 origin-left -mt-0.5">
                        {ROLE_LABELS[role]}
                      </Badge>
                    )}
                  </div>
                </Link>

                {/* Sign out button */}
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="rounded-lg border border-white/30 bg-transparent px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[#1ca7e0] px-4 py-1.5 text-xs font-bold text-[#1b1613] hover:bg-[#1898cc] transition-colors shadow-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
