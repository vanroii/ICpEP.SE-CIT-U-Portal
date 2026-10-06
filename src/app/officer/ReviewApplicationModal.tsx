"use client";

import { useState } from "react";
import { reviewMembershipAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Award, Check, X, XCircle } from "lucide-react";

export function ReviewApplicationModal({
  application,
}: {
  application: {
    id: number;
    applicant: {
      first_name: string;
      last_name: string;
      student_number: string;
      email: string;
      program: string;
      year_level: number;
    };
    claimed_membership_no: string | null;
    submitted_at: string;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [membershipNo, setMembershipNo] = useState(
    application.claimed_membership_no || `ICPEP-2026-${String(application.id).padStart(4, "0")}`
  );
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const approve = actionType === "approve";
    const res = await reviewMembershipAction(
      application.id,
      approve,
      remarks,
      approve ? membershipNo : undefined
    );
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        size="sm"
        className="font-bold text-xs"
      >
        Verify Application
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eeeb]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#e3f6fc] text-[#0a7db0]">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#1b1613]">
                  Verify Membership Application
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8c8785] hover:text-[#1b1613] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant details */}
            <div className="rounded-xl bg-[#f8f8f7] p-4 text-xs space-y-1.5 border border-[#e0dedb]">
              <div className="flex justify-between">
                <span className="text-[#8c8785]">Applicant:</span>
                <span className="font-bold text-[#1b1613]">
                  {application.applicant.first_name} {application.applicant.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c8785]">Student No:</span>
                <span className="font-mono text-[#1b1613]">
                  {application.applicant.student_number || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c8785]">Program & Year:</span>
                <span className="text-[#1b1613]">
                  {application.applicant.program} (Yr {application.applicant.year_level})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c8785]">Claimed Membership No:</span>
                <span className="font-mono font-semibold text-[#0a7db0]">
                  {application.claimed_membership_no || "New Member (None)"}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Decision Toggle */}
              <div className="flex items-center rounded-xl bg-[#f0eeeb] p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setActionType("approve")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    actionType === "approve"
                      ? "bg-[#218c54] text-white shadow-xs"
                      : "text-[#45403d] hover:bg-white/50"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve Application
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("reject")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    actionType === "reject"
                      ? "bg-[#bf2626] text-white shadow-xs"
                      : "text-[#45403d] hover:bg-white/50"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Decline Application
                </button>
              </div>

              {actionType === "approve" ? (
                <Input
                  label="Official Chapter Membership Number"
                  value={membershipNo}
                  onChange={(e) => setMembershipNo(e.target.value)}
                  required
                  placeholder="e.g. ICPEP-CITU-2026-0042"
                  helperText="This number is assigned to the member's profile for AY 2026–2027."
                />
              ) : null}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#45403d]">
                  Review Remarks / Notes (sent to student)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Welcome to ICpEP.SE CIT-U Chapter!"
                      : "Reason for rejection (e.g. payment receipt mismatch)..."
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#e0dedb] outline-none"
                />
              </div>

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
                  variant={actionType === "approve" ? "primary" : "danger"}
                  size="sm"
                  isLoading={loading}
                  className="font-bold"
                >
                  {actionType === "approve" ? "Confirm Approval" : "Confirm Decline"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
