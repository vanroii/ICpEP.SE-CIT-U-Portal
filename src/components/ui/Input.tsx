import React from "react";
import { Lock } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isLocked?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, isLocked, className = "", id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[14px] font-semibold text-[#3D3733] leading-none"
          >
            {label}
            {props.required && <span className="text-[#B91C1C] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            disabled={disabled || isLocked}
            className={`w-full h-[46px] sm:h-[48px] px-4 rounded-[10px] text-[15px] transition-all outline-none border ${
              disabled || isLocked
                ? "bg-[#F2F1F0] border-[#C9C5C2] text-[#817B77] cursor-not-allowed pr-10"
                : error
                ? "bg-white border-[#B91C1C] text-[#1C1713] placeholder-[#928C88] focus:ring-2 focus:ring-[#B91C1C]/20"
                : "bg-white border-[#C9C5C2] text-[#1C1713] placeholder-[#928C88] focus:border-[#19A7D5] focus:ring-2 focus:ring-[#19A7D5]/20"
            } ${className}`}
            {...props}
          />
          {isLocked && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#817B77] pointer-events-none">
              <Lock className="w-4 h-4" />
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[12px] text-[#B91C1C] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[12px] text-[#817B77]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
