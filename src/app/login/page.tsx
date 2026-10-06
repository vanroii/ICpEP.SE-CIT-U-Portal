"use client";

import { Suspense, useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mx-auto max-w-md w-full space-y-6">
      {/* Brand Card Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1ca7e0] text-[#1b1613] font-black text-xl shadow-sm mb-2">
          SE
        </div>
        <h1 className="text-2xl font-black text-[#1b1613] tracking-tight">
          Welcome to ICpEP.SE
        </h1>
        <p className="text-xs text-[#8c8785]">
          CIT-U Organization Portal · Sign in to access your dashboard
        </p>
      </div>

      {/* Form Card */}
      <form
        action={action}
        className="rounded-3xl border border-[#e0dedb] bg-white p-8 shadow-sm space-y-4"
      >
        <input type="hidden" name="next" value={next} />

        <Input
          label="Institutional / Account E-mail"
          name="email"
          type="email"
          placeholder="e.g. juan.delacruz@cit.edu"
          required
          autoComplete="email"
        />

        <div className="space-y-1.5 relative">
          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-[#8c8785] hover:text-[#1b1613] text-xs"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {state?.error && (
          <div className="flex items-start gap-2 rounded-xl bg-[#fae6e6] border border-[#f5c6c6] p-3 text-xs text-[#bf2626]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        <Button
          type="submit"
          isLoading={pending}
          variant="primary"
          size="md"
          className="w-full font-bold shadow-md mt-2"
        >
          Sign In to Portal
        </Button>

        <div className="pt-4 border-t border-[#f0eeeb] text-center text-xs text-[#45403d] space-y-2">
          <p>
            Don't have an account yet?{" "}
            <Link
              href="/register"
              className="font-bold text-[#0a7db0] hover:text-[#1ca7e0] underline"
            >
              Register here
            </Link>
          </p>
          <p className="text-[11px] text-[#8c8785]">
            CpE Non-Members and Members sign up through the registration form.
          </p>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="py-6 flex items-center justify-center">
      <Suspense fallback={<div className="text-center text-xs text-[#8c8785]">Loading portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
