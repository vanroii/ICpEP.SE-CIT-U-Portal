import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  variant?: "dark" | "light";
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

export function LogoMark({ size = 42, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="ICpEP.SE CIT-U Logo"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      priority
    />
  );
}

export function LogoLarge({ size = 160, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="ICpEP.SE CIT-U Logo"
      width={size}
      height={size}
      className={`shrink-0 object-contain drop-shadow-md ${className}`}
      priority
    />
  );
}

export function Logo({
  variant = "dark",
  subtitle = "CIT-U Chapter",
  size = "md",
  href = "/",
  className = "",
}: LogoProps) {
  const isDark = variant === "dark";

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size === "sm" ? 36 : 42} />
      <div className="flex flex-col leading-tight">
        <span
          className={`text-[17px] font-bold tracking-[-0.2px] ${
            isDark ? "text-white" : "text-ink-900"
          }`}
        >
          ICpEP.SE
        </span>
        <span
          className={`text-[12px] font-medium ${
            isDark ? "text-text-mute" : "text-text-500"
          }`}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
