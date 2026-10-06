"use client";

import { useActionState } from "react";
import { updateProfileAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle2, AlertCircle, Save } from "lucide-react";

export function EditProfileForm({ profile }: { profile: any }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.success && (
        <div className="flex items-center gap-2 rounded-xl bg-[#e6f7eb] border border-[#c4edd0] p-3 text-xs text-[#218c54]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {state?.error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#fae6e6] border border-[#f5c6c6] p-3 text-xs text-[#bf2626]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="first_name"
          defaultValue={profile?.first_name || ""}
          required
        />
        <Input
          label="Last Name"
          name="last_name"
          defaultValue={profile?.last_name || ""}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Middle Name"
          name="middle_name"
          defaultValue={profile?.middle_name || ""}
        />
        <Input
          label="Contact Number"
          name="contact_number"
          defaultValue={profile?.contact_number || ""}
          placeholder="0912 345 6789"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#45403d]">Bio / Technical Interests</label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={profile?.bio || ""}
          placeholder="Share your technical interests, capstone topics, or engineering goals..."
          className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-white text-[#1b1613] border border-[#e0dedb] outline-none"
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          isLoading={pending}
          variant="primary"
          size="sm"
          className="font-bold shadow-xs"
        >
          <Save className="w-4 h-4 mr-1.5" />
          Save Profile Updates
        </Button>
      </div>
    </form>
  );
}
