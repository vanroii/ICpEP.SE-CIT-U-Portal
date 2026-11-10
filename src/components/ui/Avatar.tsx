import React from "react";

export interface AvatarProps {
  name?: string;
  initials?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  bg?: string;
  textColor?: string;
  src?: string | null;
  className?: string;
}

export function Avatar({
  name = "User",
  initials,
  size = "md",
  bg = "#19A7D5",
  textColor = "#12191C",
  src,
  className = "",
}: AvatarProps) {
  const getInitials = (n: string) => {
    if (initials) return initials.toUpperCase().slice(0, 2);
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.slice(0, 1).toUpperCase();
  };

  const sizeClasses = {
    xs: "w-[28px] h-[28px] text-[11px] font-bold",
    sm: "w-[32px] h-[32px] text-[12px] font-bold",
    md: "w-[38px] h-[38px] text-[15px] font-bold",
    lg: "w-[44px] h-[44px] text-[16px] font-bold",
    xl: "w-[136px] h-[136px] text-[54px] font-bold",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover shrink-0 ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      style={{ backgroundColor: bg, color: textColor }}
      className={`rounded-full flex items-center justify-center select-none shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
