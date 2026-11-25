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
            className="block text-[14px] font-semibold text-text-700 leading-none"
          >
            {label}
            {props.required && <span className="text-status-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            disabled={disabled || isLocked}
            className={`w-full h-[46px] sm:h-[48px] px-4 rounded-[10px] text-[15px] transition-all outline-none border ${
              disabled || isLocked
                ? "bg-surface-disabled border-border-input text-text-500 cursor-not-allowed pr-10"
                : error
                ? "bg-white border-status-danger text-ink-900 placeholder-text-400 focus:ring-2 focus:ring-status-danger/20"
                : "bg-white border-border-input text-ink-900 placeholder-text-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            } ${className}`}
            {...props}
          />
          {isLocked && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-500 pointer-events-none">
              <Lock className="w-4 h-4" />
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[12px] text-status-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[12px] text-text-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
