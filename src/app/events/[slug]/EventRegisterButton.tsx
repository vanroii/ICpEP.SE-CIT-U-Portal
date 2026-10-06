"use client";

import { useState } from "react";
import { registerEventAction, cancelEventAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Check, XCircle } from "lucide-react";

export function EventRegisterButton({
  eventId,
  slug,
  isRegistered,
  isFull,
  isDeadlinePassed,
  isMembersOnly,
  userRole,
  isLoggedIn,
}: {
  eventId: number;
  slug: string;
  isRegistered: boolean;
  isFull: boolean;
  isDeadlinePassed: boolean;
  isMembersOnly: boolean;
  userRole: string | null;
  isLoggedIn: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="space-y-2">
        <a
          href={`/login?next=/events/${slug}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-[#1ca7e0] px-5 py-2.5 text-sm font-bold text-[#1b1613] hover:bg-[#1898cc] transition-colors shadow-sm"
        >
          Log In to Register
        </a>
        <p className="text-[11px] text-center text-[#8c8785]">
          An active account is required to reserve a slot.
        </p>
      </div>
    );
  }

  if (isRegistered) {
    const handleCancel = async () => {
      if (!confirm("Are you sure you want to cancel your registration?")) return;
      setLoading(true);
      setError(null);
      const res = await cancelEventAction(eventId, slug);
      if (res.error) setError(res.error);
      setLoading(false);
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-[#e6f7eb] border border-[#c4edd0] px-4 py-3 text-sm font-semibold text-[#218c54]">
          <Check className="w-4 h-4" />
          You are Registered for this Event
        </div>
        <Button
          onClick={handleCancel}
          isLoading={loading}
          variant="secondary"
          size="sm"
          className="w-full text-[#bf2626] border-[#f5c6c6] hover:bg-[#fae6e6]"
        >
          Cancel Registration
        </Button>
        {error && <p className="text-xs text-[#bf2626] font-medium text-center">{error}</p>}
      </div>
    );
  }

  // Not registered checks
  if (isMembersOnly && userRole === "non_member") {
    return (
      <div className="space-y-2 rounded-xl bg-[#fcf0d4] border border-[#fae3ae] p-4 text-center">
        <p className="text-xs font-bold text-[#9e700a]">ICpEP Members-Only Event</p>
        <p className="text-[11px] text-[#9e700a]/90 leading-relaxed">
          This activity is reserved for verified members. Apply or verify your membership in your Student Dashboard.
        </p>
        <a
          href="/student"
          className="inline-block mt-1 text-xs font-semibold text-[#0a7db0] underline hover:text-[#1ca7e0]"
        >
          Go to Student Dashboard →
        </a>
      </div>
    );
  }

  if (isDeadlinePassed) {
    return (
      <div className="rounded-lg bg-[#fae6e6] border border-[#f5c6c6] px-4 py-3 text-xs font-semibold text-[#bf2626] text-center">
        Registration Deadline Has Passed
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="rounded-lg bg-[#fae6e6] border border-[#f5c6c6] px-4 py-3 text-xs font-semibold text-[#bf2626] text-center">
        Event is at Full Capacity
      </div>
    );
  }

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    const res = await registerEventAction(eventId, slug);
    if (res.error) setError(res.error);
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleRegister}
        isLoading={loading}
        variant="primary"
        size="md"
        className="w-full font-bold shadow-md"
      >
        Register for Event
      </Button>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-[#bf2626] font-medium justify-center pt-1">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
