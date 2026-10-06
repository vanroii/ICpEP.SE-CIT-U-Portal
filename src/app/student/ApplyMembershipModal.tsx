"use client";

import { useState } from "react";
import { submitMembershipApplication } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Award, X } from "lucide-react";

export function ApplyMembershipModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await submitMembershipApplication(formData);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1500);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="sm"
        className="font-bold shadow-xs whitespace-nowrap"
      >
        <Award className="w-4 h-4 mr-1" />
        Apply for ICpEP Membership
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eeeb]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#e3f6fc] text-[#0a7db0]">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#1b1613]">
                  Apply for Membership
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8c8785] hover:text-[#1b1613] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="p-4 rounded-xl bg-[#e6f7eb] border border-[#c4edd0] text-center space-y-1">
                <p className="font-bold text-sm text-[#218c54]">Application Submitted!</p>
                <p className="text-xs text-[#218c54]/90">
                  Chapter officers will review your application shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-[#45403d] leading-relaxed">
                  Join the Institute of Computer Engineers of the Philippines - CIT-U Student Edition for AY 2026–2027. If you have an existing membership reference or receipt number, enter it below.
                </p>

                <Input
                  label="Claimed Membership / Reference Number (Optional)"
                  name="claimed_membership_no"
                  placeholder="e.g. ICPEP-2026-XXXX or Receipt No."
                  helperText="Leave empty if this is a new membership registration."
                />

                {error && (
                  <p className="text-xs text-[#bf2626] font-medium bg-[#fae6e6] p-2.5 rounded-lg">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={loading}
                    className="font-bold"
                  >
                    Submit Application
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
