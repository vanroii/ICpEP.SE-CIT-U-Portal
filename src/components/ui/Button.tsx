import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "on-dark" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-[8px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#19A7D5] focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

    const sizeStyles = {
      sm: "px-[14px] py-[8px] text-[13px] h-[34px]",
      md: "px-[22px] py-[13px] text-[14px] leading-tight h-[43px]",
      lg: "px-[24px] py-[14px] text-[15px] h-[48px]",
    };

    const variantStyles = {
      primary:
        "bg-[#19A7D5] text-[#12191C] hover:bg-[#1695bf] active:bg-[#1383a8] font-semibold",
      accent:
        "bg-[#19A7D5] text-[#12191C] hover:bg-[#1695bf] active:bg-[#1383a8] font-semibold",
      secondary:
        "bg-transparent border-[1.5px] border-[#0087B5] text-[#0087B5] hover:bg-[#E3F6FC] font-semibold",
      "on-dark":
        "bg-transparent border-[1.5px] border-[#FFFFFF] text-[#FFFFFF] hover:bg-white/10 font-semibold",
      outline:
        "bg-white border border-[#C9C5C2] text-[#0087B5] hover:bg-[#FAF9F8] font-semibold",
      ghost:
        "bg-transparent text-[#0087B5] hover:bg-[#E3F6FC] font-semibold",
      danger:
        "bg-transparent border border-[#FCA5A5] text-[#B91C1C] hover:bg-[#FEE2E2] font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
