"use client";

import { useState } from "react";
import { adminSetRoleAction, adminSetActiveAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Shield, Power, Check, X } from "lucide-react";

export function UserRowAction({
  user,
}: {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    roles: { code: string; name: string };
  };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.roles?.code || "non_member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = async () => {
    setLoading(true);
    setError(null);
    const res = await adminSetRoleAction(user.id, selectedRole);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
    }
  };

  const handleToggleActive = async () => {
    const nextState = !user.is_active;
    const confirmMsg = nextState
      ? `Reactivate account for ${user.first_name} ${user.last_name}?`
      : `Deactivate account for ${user.first_name} ${user.last_name}? They will not be able to log in.`;
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    await adminSetActiveAction(user.id, nextState);
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="text-xs"
      >
        <Shield className="w-3.5 h-3.5 mr-1" />
        Change Role
      </Button>

      <Button
        onClick={handleToggleActive}
        variant="ghost"
        size="sm"
        isLoading={loading}
        className={`text-xs ${
          user.is_active
            ? "text-[#bf2626] hover:bg-[#fae6e6]"
            : "text-[#218c54] hover:bg-[#e6f7eb]"
        }`}
      >
        <Power className="w-3.5 h-3.5 mr-1" />
        {user.is_active ? "Deactivate" : "Activate"}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0eeeb]">
              <h3 className="font-bold text-sm text-[#1b1613]">
                Assign Role to {user.first_name}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8c8785] hover:text-[#1b1613]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#45403d]">
                Select System Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#e0dedb] bg-white text-[#1b1613] outline-none"
              >
                <option value="non_member">Non-Member Student</option>
                <option value="member">ICpEP Member</option>
                <option value="officer">ICpEP Officer</option>
                <option value="faculty">Faculty / Adviser</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            {error && <p className="text-xs text-[#bf2626]">{error}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={loading}
                onClick={handleRoleChange}
                className="font-bold"
              >
                Save Role
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
