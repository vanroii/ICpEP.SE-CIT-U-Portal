import React from "react";
import Link from "next/link";

interface LogoProps {
  variant?: "dark" | "light";
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

export function LogoMark({ size = 42, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Outer gear circle / teeth base */}
      <circle cx="21" cy="21" r="20" fill="#231F20" />
      {/* Gear teeth hints */}
      <path
        d="M21 1V5M21 37V41M1 21H5M37 21H41M6.86 6.86L9.69 9.69M32.31 32.31L35.14 35.14M6.86 35.14L9.69 32.31M32.31 9.69L35.14 6.86"
        stroke="#19A7D5"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Outer Cyan Ring */}
      <circle cx="21" cy="21" r="16" fill="#19A7D5" />
      {/* White Ring */}
      <circle cx="21" cy="21" r="13.5" fill="#FFFFFF" />
      {/* Cyan Inner Ring */}
      <circle cx="21" cy="21" r="12" fill="#19A7D5" />
      {/* Core Dark Center */}
      <circle cx="21" cy="21" r="9" fill="#1B1B1D" />
      {/* Microchip / Core processor accent */}
      <rect
        x="16"
        y="16"
        width="10"
        height="10"
        rx="2"
        fill="#1B1B1D"
        stroke="#72D2ED"
        strokeWidth="1.2"
      />
      <circle cx="21" cy="21" r="2" fill="#72D2ED" />
    </svg>
  );
}

export function LogoLarge({ size = 160, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Outer base */}
      <circle cx="80" cy="80" r="76" fill="#231F20" />
      {/* Outer Gear Teeth */}
      <path
        d="M80 4V16M80 144V156M4 80H16M144 80H156M26.27 26.27L34.76 34.76M125.24 125.24L133.73 133.73M26.27 133.73L34.76 125.24M125.24 34.76L133.73 26.27"
        stroke="#19A7D5"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Cyan Ring */}
      <circle cx="80" cy="80" r="61" fill="#19A7D5" />
      {/* White Ring */}
      <circle cx="80" cy="80" r="51.5" fill="#FFFFFF" />
      {/* Cyan Inner Ring */}
      <circle cx="80" cy="80" r="46.5" fill="#19A7D5" />
      {/* Core Dark Center */}
      <circle cx="80" cy="80" r="36" fill="#1B1B1D" />
      {/* Processor boundary */}
      <rect
        x="61"
        y="61"
        width="38"
        height="38"
        rx="6"
        fill="#1B1B1D"
        stroke="#72D2ED"
        strokeWidth="2"
      />
      {/* Text in Large Logo */}
      <text
        x="80"
        y="77"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="17"
        fontWeight="800"
        fontFamily="Inter, sans-serif"
        letterSpacing="-0.5"
      >
        ICpEP
      </text>
      <text
        x="80"
        y="92"
        textAnchor="middle"
        fill="#72D2ED"
        fontSize="12"
        fontWeight="800"
        fontFamily="Inter, sans-serif"
        letterSpacing="0.5"
      >
        SE
      </text>
    </svg>
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
            isDark ? "text-white" : "text-[#1C1713]"
          }`}
        >
          ICpEP.SE
        </span>
        <span
          className={`text-[12px] font-medium ${
            isDark ? "text-[#AAA4A0]" : "text-[#817B77]"
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

