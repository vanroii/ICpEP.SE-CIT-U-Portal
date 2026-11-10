import React from "react";

export type BadgeTone =
  | "verified"
  | "pending"
  | "exact"
  | "possible"
  | "danger"
  | "draft"
  | "past"
  | "category"
  | "faculty"
  | "officer"
  | "neutral"
  | "info"
  | "success"
  | "warning";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  hasDot?: boolean;
  children: React.ReactNode;
}

export function Badge({
  tone = "verified",
  hasDot,
  children,
  className = "",
  ...props
}: BadgeProps) {
  // Styles based on Figma tokens
  const config: Record<BadgeTone, { bg: string; text: string; dot?: string }> = {
    verified: {
      bg: "bg-[#DCFCE7]",
      text: "text-[#15803D]",
      dot: "#15803D",
    },
    success: {
      bg: "bg-[#DCFCE7]",
      text: "text-[#15803D]",
      dot: "#15803D",
    },
    exact: {
      bg: "bg-[#DCFCE7]",
      text: "text-[#15803D]",
      dot: "#15803D",
    },
    pending: {
      bg: "bg-[#F7EDC8]",
      text: "text-[#9A6C00]",
      dot: "#9A6C00",
    },
    warning: {
      bg: "bg-[#F7EDC8]",
      text: "text-[#9A6C00]",
      dot: "#9A6C00",
    },
    possible: {
      bg: "bg-[#F7EDC8]",
      text: "text-[#9A6C00]",
      dot: "#9A6C00",
    },
    danger: {
      bg: "bg-[#FEE2E2]",
      text: "text-[#B91C1C]",
      dot: "#B91C1C",
    },
    draft: {
      bg: "bg-[#F2F1F0]",
      text: "text-[#514B47]",
      dot: "#514B47",
    },
    past: {
      bg: "bg-[#DEDBD8]",
      text: "text-[#514B47]",
      dot: "#514B47",
    },
    category: {
      bg: "bg-[#E3F6FC]",
      text: "text-[#0087B5]",
    },
    info: {
      bg: "bg-[#E3F6FC]",
      text: "text-[#0087B5]",
      dot: "#0087B5",
    },
    faculty: {
      bg: "bg-[#E3F6FC]",
      text: "text-[#0087B5]",
    },
    officer: {
      bg: "bg-[#FEF3C7]",
      text: "text-[#B45309]",
    },
    neutral: {
      bg: "bg-[#F5F4F3]",
      text: "text-[#514B47]",
      dot: "#817B77",
    },
  };

  const current = config[tone] || config.neutral;
  const showDot = hasDot !== undefined ? hasDot : Boolean(current.dot);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-[10px] py-[3px] rounded-full text-[12px] font-semibold leading-tight shrink-0 select-none ${current.bg} ${current.text} ${className}`}
      {...props}
    >
      {showDot && current.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: current.dot }}
        />
      )}
      {children}
    </span>
  );
}
