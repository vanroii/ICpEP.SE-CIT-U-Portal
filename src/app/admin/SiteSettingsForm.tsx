"use client";

import { useState } from "react";
import { adminUpdateSettingsAction } from "./actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";

export function SiteSettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const res = await adminUpdateSettingsAction(formData);

    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#e0dedb] bg-white p-6 sm:p-8 space-y-6 max-w-2xl"
    >
      <div className="space-y-1 pb-4 border-b border-[#f0eeeb]">
        <h2 className="text-base font-bold text-[#1b1613]">Chapter Site Settings</h2>
        <p className="text-xs text-[#8c8785]">
          Configure organization brand info, public mission & vision, and contact channels.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-[#e6f7eb] border border-[#c4edd0] p-3 text-xs text-[#218c54]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Site settings successfully updated!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[#fae6e6] border border-[#f5c6c6] p-3 text-xs text-[#bf2626]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Input
        label="Organization Short Name"
        name="org_name"
        defaultValue={settings["org_name"] || "ICpEP.SE CIT-U"}
      />

      <Input
        label="Organization Full Legal Title"
        name="org_full_name"
        defaultValue={
          settings["org_full_name"] ||
          "Institute of Computer Engineers of the Philippines – Student Edition, CIT-U Chapter"
        }
      />

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#45403d]">Mission Statement</label>
        <textarea
          name="mission"
          rows={3}
          defaultValue={settings["mission"] || ""}
          className="w-full px-3 py-2 text-xs rounded-lg border border-[#e0dedb] outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#45403d]">Vision Statement</label>
        <textarea
          name="vision"
          rows={3}
          defaultValue={settings["vision"] || ""}
          className="w-full px-3 py-2 text-xs rounded-lg border border-[#e0dedb] outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Public Contact Email"
          name="contact_email"
          type="email"
          defaultValue={settings["contact_email"] || "icpep.se@cit.edu"}
        />
        <Input
          label="Official Facebook URL"
          name="facebook_url"
          defaultValue={settings["facebook_url"] || "https://www.facebook.com/ICpEP.SE.CITU"}
        />
      </div>

      <Input
        label="Campus Office Address"
        name="contact_address"
        defaultValue={settings["contact_address"] || "CIT-U CEA Building, 3rd Floor"}
      />

      <div className="pt-2">
        <Button type="submit" variant="primary" size="md" isLoading={loading} className="font-bold">
          <Save className="w-4 h-4 mr-1.5" />
          Save Site Settings
        </Button>
      </div>
    </form>
  );
}
