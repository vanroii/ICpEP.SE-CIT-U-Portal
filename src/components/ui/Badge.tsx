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
      bg: "bg-status-success-bg",
      text: "text-status-success",
      dot: "#15803D",
    },
    success: {
      bg: "bg-status-success-bg",
      text: "text-status-success",
      dot: "#15803D",
    },
    exact: {
      bg: "bg-status-success-bg",
      text: "text-status-success",
      dot: "#15803D",
    },
    pending: {
      bg: "bg-status-warning-bg",
      text: "text-status-warning",
      dot: "#9A6C00",
    },
    warning: {
      bg: "bg-status-warning-bg",
      text: "text-status-warning",
      dot: "#9A6C00",
    },
    possible: {
      bg: "bg-status-warning-bg",
      text: "text-status-warning",
      dot: "#9A6C00",
    },
    danger: {
      bg: "bg-status-danger-bg",
      text: "text-status-danger",
      dot: "#B91C1C",
    },
    draft: {
      bg: "bg-surface-disabled",
      text: "text-text-600",
      dot: "#514B47",
    },
    past: {
      bg: "bg-border-default",
      text: "text-text-600",
      dot: "#514B47",
    },
    category: {
      bg: "bg-cyan-50",
      text: "text-cyan-600",
    },
    info: {
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      dot: "#0087B5",
    },
    faculty: {
      bg: "bg-cyan-50",
      text: "text-cyan-600",
    },
    officer: {
      bg: "bg-status-post-officer-bg",
      text: "text-status-post-officer",
    },
    neutral: {
      bg: "bg-surface-100",
      text: "text-text-600",
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
