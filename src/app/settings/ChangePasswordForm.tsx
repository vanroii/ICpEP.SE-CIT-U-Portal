"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/profile/actions";
import { CheckCircle2, AlertCircle, Lock } from "lucide-react";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.success && (
        <div className="flex items-center gap-2 rounded-xl bg-[#e6f7eb] border border-[#c4edd0] p-3 text-xs text-[#218c54]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Password updated successfully!</span>
        </div>
      )}

      {state?.error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#fae6e6] border border-[#f5c6c6] p-3 text-xs text-[#bf2626]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#3D3733]">
            New Password (Min. 8 characters)
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            className="w-full h-[42px] px-3.5 rounded-[10px] bg-white border border-[#C9C5C2] text-xs text-[#1C1713] outline-none focus:border-[#19A7D5]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#3D3733]">
            Confirm New Password
          </label>
          <input
            name="confirm_password"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            className="w-full h-[42px] px-3.5 rounded-[10px] bg-white border border-[#C9C5C2] text-xs text-[#1C1713] outline-none focus:border-[#19A7D5]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-[38px] px-5 rounded-[8px] bg-[#19A7D5] hover:bg-[#1695bf] text-[#12191C] font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>{pending ? "Updating..." : "Update Password"}</span>
      </button>
    </form>
  );
}
