import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#45403d] tracking-wide">
            {label}
            {props.required && <span className="text-[#bf2626] ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2.5 rounded-lg text-sm bg-white text-[#1b1613] placeholder-[#8c8785] border transition-all outline-none ${
            error
              ? "border-[#bf2626] focus:border-[#bf2626] focus:ring-2 focus:ring-[#bf2626]/20"
              : "border-[#e0dedb] focus:border-[#1ca7e0] focus:ring-3 focus:ring-[#1ca7e0]/20"
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#bf2626] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#8c8785]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
