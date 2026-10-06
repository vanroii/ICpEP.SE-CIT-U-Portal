import React from "react";
import { Avatar } from "../ui/Avatar";
import { Badge, type BadgeTone } from "../ui/Badge";

export interface TableRowProps {
  name: string;
  email?: string;
  subtitle?: string;
  roleBadge?: {
    label: string;
    tone: BadgeTone;
  };
  statusBadge?: {
    label: string;
    tone: BadgeTone;
  };
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({
  name,
  email,
  subtitle,
  roleBadge,
  statusBadge,
  actions,
  onClick,
  className = "",
}: TableRowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between gap-4 border-b border-[#e0dedb] bg-white px-5 py-3.5 transition-colors hover:bg-[#f8f8f7] ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* Left side: Avatar and text details */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <Avatar name={name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#1b1613]">{name}</p>
          {(email || subtitle) && (
            <p className="truncate text-xs text-[#8c8785]">{email || subtitle}</p>
          )}
        </div>
      </div>

      {/* Middle: Badges */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {roleBadge && <Badge tone={roleBadge.tone}>{roleBadge.label}</Badge>}
        {statusBadge && <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>}
      </div>

      {/* Right side: Actions */}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
