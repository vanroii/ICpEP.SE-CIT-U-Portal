import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", size = "md", isLoading, className = "", disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const sizeStyles = {
      sm: "px-4 py-2 text-xs gap-1.5",
      md: "px-5 py-2.5 text-sm gap-2",
    };

    const variantStyles = {
      primary:
        "bg-[#1ca7e0] text-[#1b1613] hover:bg-[#1898cc] active:bg-[#1483b0] focus:ring-[#1ca7e0] shadow-sm",
      secondary:
        "bg-white border border-[#1ca7e0] text-[#0a7db0] hover:bg-[#e3f6fc] active:bg-[#d0f0fa] focus:ring-[#1ca7e0]",
      ghost:
        "bg-transparent text-[#0a7db0] hover:bg-[#e3f6fc] active:bg-[#d0f0fa] focus:ring-[#1ca7e0]",
      danger:
        "bg-[#bf2626] text-white hover:bg-[#a92121] active:bg-[#911b1b] focus:ring-[#bf2626]",
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
