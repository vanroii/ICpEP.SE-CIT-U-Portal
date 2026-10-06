import React from "react";

export interface AvatarProps {
  name?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  src?: string | null;
  className?: string;
}

export function Avatar({ name = "Juan Dela Cruz", initials, size = "md", src, className = "" }: AvatarProps) {
  const getInitials = (n: string) => {
    if (initials) return initials.toUpperCase().slice(0, 2);
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-10 h-10 text-[13px]",
    lg: "w-14 h-14 text-lg",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover border border-[#e0dedb] ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[#e0dedb] text-[#736e6b] font-semibold flex items-center justify-center select-none border border-[#d5d2ce] shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
