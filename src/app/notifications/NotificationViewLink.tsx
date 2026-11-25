"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { markNotificationGroupReadAction } from "./actions";

export function NotificationViewLink({
  href,
  unreadIds,
}: {
  href: string;
  unreadIds: number[];
}) {
  const handleClick = () => {
    if (unreadIds.length > 0) {
      // Fire-and-forget mark as read while navigating
      markNotificationGroupReadAction(unreadIds).then(() => {
        window.dispatchEvent(new Event("icpep:counts-updated"));
      });
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-border-default text-xs font-semibold text-ink-900 hover:border-cyan-500 hover:bg-cyan-50/40 hover:text-cyan-600 shadow-2xs transition-all"
    >
      View details <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );
}
