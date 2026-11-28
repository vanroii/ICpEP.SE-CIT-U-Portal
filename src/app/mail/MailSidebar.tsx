"use client";

import Link from "next/link";
import {
  Inbox, Star, Send, FileText, Trash2, PenSquare, Clock,
} from "lucide-react";

const FOLDERS = [
  { key: "inbox",   label: "Inbox",  icon: Inbox    },
  { key: "starred", label: "Starred",icon: Star     },
  { key: "sent",    label: "Sent",   icon: Send     },
  { key: "drafts",  label: "Drafts", icon: FileText },
  { key: "scheduled", label: "Scheduled", icon: Clock },
  { key: "trash",   label: "Trash",  icon: Trash2   },
];

interface MailSidebarProps {
  folder: string;
  counts: { inbox: number; starred: number; sent: number; drafts: number; scheduled: number; trash: number };
  onCompose: () => void;
}

export function MailSidebar({ folder, counts, onCompose }: MailSidebarProps) {
  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col h-full border-r border-divider bg-white">
      {/* Compose Button */}
      <div className="p-4">
        <button
          onClick={onCompose}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-[#1695bf] active:bg-[#1383a8] text-white font-semibold text-[13px] shadow-sm transition-colors"
        >
          <PenSquare className="w-4 h-4 shrink-0" />
          Compose
        </button>
      </div>

      {/* Folder list */}
      <nav className="flex-1 px-2 space-y-0.5">
        {FOLDERS.map(({ key, label, icon: Icon }) => {
          const isActive = folder === key;
          const count = counts[key as keyof typeof counts];
          return (
            <Link
              key={key}
              href={`/mail?folder=${key}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-cyan-50 text-cyan-700 font-semibold"
                  : "text-text-600 hover:bg-surface-50 hover:text-ink-900"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-600" : "text-text-400"}`} />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  isActive ? "bg-cyan-100 text-cyan-700" : "bg-surface-100 text-text-500"
                }`}>
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}

