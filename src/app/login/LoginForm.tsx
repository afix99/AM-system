"use client";
import { useActionState } from "react";
import { User, Lock, AlertCircle } from "lucide-react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="group flex flex-col gap-2">
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-stone-500 group-focus-within:text-[#D97756] transition-colors">
          Username
        </span>
        <div className="relative">
          <User
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-[#D97756] transition-colors pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            name="username"
            autoCapitalize="off"
            autoComplete="username"
            spellCheck={false}
            required
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-stone-100 text-sm placeholder:text-stone-700 focus:outline-none focus:border-[#D97756]/60 focus:bg-black/40 focus:shadow-[0_0_0_3px_rgba(217,119,86,0.12)] transition-all"
          />
        </div>
      </label>

      <label className="group flex flex-col gap-2">
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-stone-500 group-focus-within:text-[#D97756] transition-colors">
          Password
        </span>
        <div className="relative">
          <Lock
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-[#D97756] transition-colors pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-stone-100 text-sm placeholder:text-stone-700 focus:outline-none focus:border-[#D97756]/60 focus:bg-black/40 focus:shadow-[0_0_0_3px_rgba(217,119,86,0.12)] transition-all"
          />
        </div>
      </label>

      {state?.error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-red-500/30 bg-red-500/[0.08] anim-fade-in">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" strokeWidth={2.4} />
          <p className="text-xs text-red-300 font-medium">{state.error}</p>
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full mt-3">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
