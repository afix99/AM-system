"use client";
import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-stone-400">Username</span>
        <input
          name="username"
          autoCapitalize="off"
          autoComplete="username"
          spellCheck={false}
          required
          className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-stone-100 text-sm placeholder:text-stone-600 focus:outline-none focus:border-[#D97756]/60 focus:bg-white/[0.06] transition-colors"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-stone-400">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-stone-100 text-sm placeholder:text-stone-600 focus:outline-none focus:border-[#D97756]/60 focus:bg-white/[0.06] transition-colors"
        />
      </label>
      {state?.error && (
        <p className="text-xs text-red-400 -mt-1">{state.error}</p>
      )}
      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full mt-2">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
