import React from "react";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: React.ReactNode;
}

export function Badge({ tone = "neutral", children, className = "", ...props }: BadgeProps) {
  const toneStyles: Record<BadgeTone, string> = {
    neutral: "bg-[#e0dedb] text-[#45403d]",
    info: "bg-[#e3f6fc] text-[#0a7db0] border border-[#bce9f7]",
    success: "bg-[#e6f7eb] text-[#218c54] border border-[#c4edd0]",
    warning: "bg-[#fcf0d4] text-[#9e700a] border border-[#fae3ae]",
    danger: "bg-[#fae6e6] text-[#bf2626] border border-[#f5c6c6]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${toneStyles[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
